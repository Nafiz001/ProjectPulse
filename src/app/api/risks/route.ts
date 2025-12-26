import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { authenticateRequest, authorizeRole } from '@/lib/auth';
import { Risk, RiskStatus, Project, CheckIn, Feedback } from '@/types';
import { ObjectId } from 'mongodb';

// GET /api/risks - Get risks (with optional projectId filter)
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
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    const db = await getDatabase();
    const query: { projectId?: ObjectId; employeeId?: ObjectId; status?: RiskStatus } = {};

    if (projectId) {
      query.projectId = new ObjectId(projectId);
    }

    if (employeeId) {
      query.employeeId = new ObjectId(employeeId);
    }

    if (status) {
      query.status = status as RiskStatus;
    }

    // Filter based on role
    if (jwtPayload.role === 'employee') {
      query.employeeId = new ObjectId(jwtPayload.userId);
    }

    const risks = await db.collection<Risk>('risks')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Populate employee data
    const risksWithUsers = await Promise.all(
      risks.map(async (risk) => {
        const employee = await db.collection('users').findOne(
          { _id: risk.employeeId },
          { projection: { password: 0 } }
        );

        return {
          ...risk,
          _id: risk._id!.toString(),
          projectId: risk.projectId.toString(),
          employeeId: risk.employeeId.toString(),
          employee,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: risksWithUsers,
    });
  } catch (error) {
    console.error('Get risks error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/risks - Create risk (employee only)
export async function POST(request: NextRequest) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload || !authorizeRole(jwtPayload, ['employee', 'admin'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { projectId, title, severity, mitigationPlan } = body;

    // Validate input
    if (!projectId || !title || !severity || !mitigationPlan) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate severity
    if (!['Low', 'Medium', 'High'].includes(severity)) {
      return NextResponse.json(
        { success: false, error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify employee is assigned to project (if not admin)
    if (jwtPayload.role === 'employee') {
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
    }

    // Create risk
    const risk: Risk = {
      projectId: new ObjectId(projectId),
      employeeId: new ObjectId(jwtPayload.userId),
      title,
      severity,
      mitigationPlan,
      status: 'Open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Risk>('risks').insertOne(risk);

    // Log activity
    await db.collection('activityLogs').insertOne({
      projectId: new ObjectId(projectId),
      userId: new ObjectId(jwtPayload.userId),
      type: 'risk_created',
      description: `Risk created: ${title} (${severity})`,
      metadata: { riskId: result.insertedId, severity },
      createdAt: new Date(),
    });

    // Recalculate project health score after new risk
    const { calculateHealthScore, getProjectStatus } = await import('@/lib/healthScore');
    const project = await db.collection<Project>('projects').findOne({ _id: new ObjectId(projectId) });
    
    if (project) {
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
    }

    return NextResponse.json({
      success: true,
      data: { ...risk, _id: result.insertedId.toString() },
      message: 'Risk created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create risk error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
