import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const response = NextResponse.json({
    success: true,
    message: 'Logout successful',
  });

  // Clear the token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
