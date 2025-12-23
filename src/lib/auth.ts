import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { JWTPayload, UserRole } from '@/types';

export function getTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const token = request.cookies.get('token')?.value;
  if (token) {
    return token;
  }

  return null;
}

export function authenticateRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function authorizeRole(user: JWTPayload | null, allowedRoles: UserRole[]): boolean {
  if (!user) {
    return false;
  }

  return allowedRoles.includes(user.role);
}

export function createUnauthorizedResponse(message: string = 'Unauthorized') {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function createForbiddenResponse(message: string = 'Forbidden') {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
