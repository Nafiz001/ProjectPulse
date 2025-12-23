import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { authenticateRequest, authorizeRole } from '@/lib/auth';
import { User } from '@/types';

// GET /api/users - Get all users (admin only, or filtered for project assignment)
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
    const role = searchParams.get('role');

    const db = await getDatabase();
    let query: any = {};

    if (role) {
      query.role = role;
    }

    // Only admin can list all users
    if (!authorizeRole(jwtPayload, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const users = await db.collection<User>('users')
      .find(query, { projection: { password: 0 } })
      .toArray();

    const usersFormatted = users.map(user => ({
      ...user,
      _id: user._id!.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: usersFormatted,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
