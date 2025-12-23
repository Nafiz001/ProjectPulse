import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { authenticateRequest, authorizeRole } from '@/lib/auth';
import { Project, CheckIn, Feedback, Risk } from '@/types';
import { ObjectId } from 'mongodb';
import { calculateHealthScore, getProjectStatus } from '@/lib/healthScore';

// GET /api/projects - Get all projects (filtered by role)
export async function GET(request: NextRequest) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    let projects;

    if (jwtPayload.role === 'admin') {
      // Admin sees all projects
      projects = await db.collection<Project>('projects').find({}).toArray();
    } else if (jwtPayload.role === 'employee') {
      // Employee sees assigned projects
      projects = await db.collection<Project>('projects')
        .find({ employeeIds: new ObjectId(jwtPayload.userId) })
        .toArray();
    } else if (jwtPayload.role === 'client') {
      // Client sees their projects
      projects = await db.collection<Project>('projects')
        .find({ clientId: new ObjectId(jwtPayload.userId) })
        .toArray();
    }

    // Populate with user data
    const projectsWithUsers = await Promise.all(
      projects!.map(async (project) => {
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

        return {
          ...project,
          _id: project._id!.toString(),
          clientId: project.clientId.toString(),
          employeeIds: project.employeeIds.map(id => id.toString()),
          client,
          employees,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: projectsWithUsers,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project (admin only)
export async function POST(request: NextRequest) {
  try {
    const jwtPayload = authenticateRequest(request);

    if (!jwtPayload || !authorizeRole(jwtPayload, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, clientId, employeeIds, startDate, endDate } = body;

    // Validate input
    if (!name || !description || !clientId || !employeeIds || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Create project
    const project: Project = {
      name,
      description,
      clientId: new ObjectId(clientId),
      employeeIds: employeeIds.map((id: string) => new ObjectId(id)),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'On Track',
      healthScore: 70, // Initial score
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Project>('projects').insertOne(project);

    // Log activity
    await db.collection('activityLogs').insertOne({
      projectId: result.insertedId,
      userId: new ObjectId(jwtPayload.userId),
      type: 'status_change',
      description: 'Project created',
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { ...project, _id: result.insertedId.toString() },
      message: 'Project created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
