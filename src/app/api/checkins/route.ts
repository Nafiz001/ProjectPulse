import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { authenticateRequest, authorizeRole } from '@/lib/auth';
import { CheckIn, Project, Feedback, Risk } from '@/types';
import { ObjectId } from 'mongodb';

// GET /api/checkins - Get check-ins (with optional projectId filter)
export async function GET(request: NextRequest) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const db = await getDatabase();
    let query: any = {};

    if (projectId) {
      query.projectId = new ObjectId(projectId);
    }

    // Filter based on role
    if (jwtPayload.role === 'employee') {
      query.employeeId = new ObjectId(jwtPayload.userId);
    }

    const checkIns = await db.collection<CheckIn>('checkIns')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Populate employee data
    const checkInsWithUsers = await Promise.all(
      checkIns.map(async (checkIn) => {
        const employee = await db.collection('users').findOne(
          { _id: checkIn.employeeId },
          { projection: { password: 0 } }
        );

        return {
          ...checkIn,
          _id: checkIn._id!.toString(),
          projectId: checkIn.projectId.toString(),
          employeeId: checkIn.employeeId.toString(),
          employee,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: checkInsWithUsers,
    });
  } catch (error) {
    console.error('Get check-ins error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/checkins - Create check-in (employee only)
export async function POST(request: NextRequest) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload || !authorizeRole(jwtPayload, ['employee'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      projectId,
      progressSummary,
      blockers,
      confidenceLevel,
      completionPercentage,
      weekStartDate,
    } = body;

    // Validate input
    if (!projectId || !progressSummary || confidenceLevel === undefined || completionPercentage === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate ranges
    if (confidenceLevel < 1 || confidenceLevel > 5) {
      return NextResponse.json(
        { success: false, error: 'Confidence level must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (completionPercentage < 0 || completionPercentage > 100) {
      return NextResponse.json(
        { success: false, error: 'Completion percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify employee is assigned to project
    const project = await db.collection<Project>('projects').findOne({
      _id: new ObjectId(projectId),
      employeeIds: new ObjectId(jwtPayload.userId),
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to this project' },
        { status: 403 }
      );
    }

    // Check if check-in already exists for this week
    const startOfWeek = weekStartDate ? new Date(weekStartDate) : getStartOfWeek(new Date());
    const existingCheckIn = await db.collection<CheckIn>('checkIns').findOne({
      projectId: new ObjectId(projectId),
      employeeId: new ObjectId(jwtPayload.userId),
      weekStartDate: startOfWeek,
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { success: false, error: 'Check-in already submitted for this week' },
        { status: 400 }
      );
    }

    // Create check-in
    const checkIn: CheckIn = {
      projectId: new ObjectId(projectId),
      employeeId: new ObjectId(jwtPayload.userId),
      weekStartDate: startOfWeek,
      progressSummary,
      blockers: blockers || '',
      confidenceLevel,
      completionPercentage,
      createdAt: new Date(),
    };

    const result = await db.collection<CheckIn>('checkIns').insertOne(checkIn);

    // Log activity
    await db.collection('activityLogs').insertOne({
      projectId: new ObjectId(projectId),
      userId: new ObjectId(jwtPayload.userId),
      type: 'checkin',
      description: 'Employee submitted weekly check-in',
      metadata: { confidenceLevel, completionPercentage },
      createdAt: new Date(),
    });

    // Recalculate project health score after new check-in
    const { calculateHealthScore, getProjectStatus } = await import('@/lib/healthScore');
    const recentCheckIns = await db.collection<CheckIn>('checkIns')
      .find({ projectId: new ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();
    const recentFeedback = await db.collection<Feedback>('feedback')
      .find({ projectId: new ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();
    const openRisks = await db.collection<Risk>('risks')
      .find({ projectId: new ObjectId(projectId), status: 'Open' })
      .toArray();
    
    const healthScore = calculateHealthScore({
      project,
      recentCheckIns,
      recentFeedback,
      openRisks,
    });
    const newStatus = getProjectStatus(healthScore);
    
    await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          healthScore,
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: { ...checkIn, _id: result.insertedId.toString() },
      message: 'Check-in submitted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}
