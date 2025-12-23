import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { authenticateRequest, authorizeRole } from '@/lib/auth';
import { Feedback } from '@/types';
import { ObjectId } from 'mongodb';

// GET /api/feedback - Get feedback (with optional projectId filter)
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
    if (jwtPayload.role === 'client') {
      query.clientId = new ObjectId(jwtPayload.userId);
    }

    const feedbackList = await db.collection<Feedback>('feedback')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Populate client data
    const feedbackWithUsers = await Promise.all(
      feedbackList.map(async (feedback) => {
        const client = await db.collection('users').findOne(
          { _id: feedback.clientId },
          { projection: { password: 0 } }
        );

        return {
          ...feedback,
          _id: feedback._id!.toString(),
          projectId: feedback.projectId.toString(),
          clientId: feedback.clientId.toString(),
          client,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: feedbackWithUsers,
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/feedback - Create feedback (client only)
export async function POST(request: NextRequest) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload || !authorizeRole(jwtPayload, ['client'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      projectId,
      satisfactionRating,
      communicationRating,
      comments,
      issueFlagged,
      weekStartDate,
    } = body;

    // Validate input
    if (!projectId || satisfactionRating === undefined || communicationRating === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate ranges
    if (satisfactionRating < 1 || satisfactionRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Satisfaction rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (communicationRating < 1 || communicationRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Communication rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify client is assigned to project
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      clientId: new ObjectId(jwtPayload.userId),
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to this project' },
        { status: 403 }
      );
    }

    // Check if feedback already exists for this week
    const startOfWeek = weekStartDate ? new Date(weekStartDate) : getStartOfWeek(new Date());
    const existingFeedback = await db.collection<Feedback>('feedback').findOne({
      projectId: new ObjectId(projectId),
      clientId: new ObjectId(jwtPayload.userId),
      weekStartDate: startOfWeek,
    });

    if (existingFeedback) {
      return NextResponse.json(
        { success: false, error: 'Feedback already submitted for this week' },
        { status: 400 }
      );
    }

    // Create feedback
    const feedback: Feedback = {
      projectId: new ObjectId(projectId),
      clientId: new ObjectId(jwtPayload.userId),
      weekStartDate: startOfWeek,
      satisfactionRating,
      communicationRating,
      comments: comments || '',
      issueFlagged: issueFlagged || false,
      createdAt: new Date(),
    };

    const result = await db.collection<Feedback>('feedback').insertOne(feedback);

    // Log activity
    await db.collection('activityLogs').insertOne({
      projectId: new ObjectId(projectId),
      userId: new ObjectId(jwtPayload.userId),
      type: 'feedback',
      description: 'Client submitted feedback',
      metadata: { satisfactionRating, communicationRating, issueFlagged },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { ...feedback, _id: result.insertedId.toString() },
      message: 'Feedback submitted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create feedback error:', error);
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
