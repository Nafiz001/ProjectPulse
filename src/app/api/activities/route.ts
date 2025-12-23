import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import { ActivityLog } from '@/types';
import { ObjectId } from 'mongodb';

// GET /api/activities - Get activity logs (with projectId filter)
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

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const activities = await db.collection<ActivityLog>('activityLogs')
      .find({ projectId: new ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Populate user data
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await db.collection('users').findOne(
          { _id: activity.userId },
          { projection: { password: 0 } }
        );

        return {
          ...activity,
          _id: activity._id!.toString(),
          projectId: activity.projectId.toString(),
          userId: activity.userId.toString(),
          user,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: activitiesWithUsers,
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
