import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { authenticateRequest, authorizeRole } from '@/lib/auth';
import { Risk } from '@/types';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PUT /api/risks/[id] - Update risk
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload || !authorizeRole(jwtPayload, ['employee', 'admin'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, severity, mitigationPlan, status } = body;

    const db = await getDatabase();

    // Find existing risk
    const existingRisk = await db.collection<Risk>('risks').findOne({
      _id: new ObjectId(id),
    });

    if (!existingRisk) {
      return NextResponse.json(
        { success: false, error: 'Risk not found' },
        { status: 404 }
      );
    }

    // Check if user can update (must be creator or admin)
    if (jwtPayload.role !== 'admin' && existingRisk.employeeId.toString() !== jwtPayload.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only update your own risks' },
        { status: 403 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (severity) updateData.severity = severity;
    if (mitigationPlan) updateData.mitigationPlan = mitigationPlan;
    if (status) updateData.status = status;

    await db.collection<Risk>('risks').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Log activity if status changed
    if (status) {
      await db.collection('activityLogs').insertOne({
        projectId: existingRisk.projectId,
        userId: new ObjectId(jwtPayload.userId),
        type: 'risk_updated',
        description: `Risk status changed to ${status}: ${existingRisk.title}`,
        metadata: { riskId: new ObjectId(id), status },
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Risk updated successfully',
    });
  } catch (error) {
    console.error('Update risk error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
