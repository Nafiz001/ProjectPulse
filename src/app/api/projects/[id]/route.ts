import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { authenticateRequest, authorizeRole } from '@/lib/auth';
import { Project, CheckIn, Feedback, Risk } from '@/types';
import { ObjectId } from 'mongodb';
import { calculateHealthScore, getProjectStatus } from '@/lib/healthScore';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/projects/[id] - Get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = await getDatabase();

    const project = await db.collection<Project>('projects')
      .findOne({ _id: new ObjectId(id) });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = 
      jwtPayload.role === 'admin' ||
      (jwtPayload.role === 'employee' && project.employeeIds.some(eid => eid.toString() === jwtPayload.userId)) ||
      (jwtPayload.role === 'client' && project.clientId.toString() === jwtPayload.userId);

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Populate with user data
    const client = await db.collection('users').findOne(
      { _id: project.clientId },
      { projection: { password: 0 } }
    );

    const employees = await db.collection('users')
      .find(
        { _id: { $in: project.employeeIds } },
        { projection: { password: 0 } }
      )
      .toArray();

    // Get recent check-ins and feedback for health score calculation
    const recentCheckIns = await db.collection<CheckIn>('checkIns')
      .find({ projectId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();

    const recentFeedback = await db.collection<Feedback>('feedback')
      .find({ projectId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();

    const openRisks = await db.collection<Risk>('risks')
      .find({ projectId: new ObjectId(id), status: 'Open' })
      .toArray();

    // Calculate health score
    const healthScore = calculateHealthScore({
      project,
      recentCheckIns,
      recentFeedback,
      openRisks,
    });

    // Update project if score changed significantly
    if (Math.abs(healthScore - project.healthScore) > 5) {
      const newStatus = getProjectStatus(healthScore);
      await db.collection<Project>('projects').updateOne(
        { _id: new ObjectId(id) },
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
      data: {
        ...project,
        _id: project._id!.toString(),
        clientId: project.clientId.toString(),
        employeeIds: project.employeeIds.map(id => id.toString()),
        healthScore,
        client,
        employees,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload || !authorizeRole(jwtPayload, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, clientId, employeeIds, startDate, endDate, status } = body;

    const db = await getDatabase();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (clientId) updateData.clientId = new ObjectId(clientId);
    if (employeeIds) updateData.employeeIds = employeeIds.map((id: string) => new ObjectId(id));
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (status) updateData.status = status;

    const result = await db.collection<Project>('projects').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Log activity
    if (status) {
      await db.collection('activityLogs').insertOne({
        projectId: new ObjectId(id),
        userId: new ObjectId(jwtPayload.userId),
        type: 'status_change',
        description: `Project status changed to ${status}`,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload || !authorizeRole(jwtPayload, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const db = await getDatabase();

    const result = await db.collection<Project>('projects').deleteOne(
      { _id: new ObjectId(id) }
    );

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Clean up related data
    await db.collection('checkIns').deleteMany({ projectId: new ObjectId(id) });
    await db.collection('feedback').deleteMany({ projectId: new ObjectId(id) });
    await db.collection('risks').deleteMany({ projectId: new ObjectId(id) });
    await db.collection('activityLogs').deleteMany({ projectId: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
