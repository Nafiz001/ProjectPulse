import { ObjectId } from 'mongodb';

// User Types
export type UserRole = 'admin' | 'employee' | 'client';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Project Types
export type ProjectStatus = 'On Track' | 'At Risk' | 'Critical' | 'Completed';

export interface Project {
  _id?: ObjectId;
  name: string;
  description: string;
  clientId: ObjectId;
  employeeIds: ObjectId[];
  startDate: Date;
  endDate: Date;
  status: ProjectStatus;
  healthScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// Check-In Types
export interface CheckIn {
  _id?: ObjectId;
  projectId: ObjectId;
  employeeId: ObjectId;
  weekStartDate: Date;
  progressSummary: string;
  blockers: string;
  confidenceLevel: number; // 1-5
  completionPercentage: number; // 0-100
  createdAt: Date;
}

// Feedback Types
export interface Feedback {
  _id?: ObjectId;
  projectId: ObjectId;
  clientId: ObjectId;
  weekStartDate: Date;
  satisfactionRating: number; // 1-5
  communicationRating: number; // 1-5
  comments?: string;
  issueFlagged: boolean;
  createdAt: Date;
}

// Risk Types
export type RiskSeverity = 'Low' | 'Medium' | 'High';
export type RiskStatus = 'Open' | 'Resolved';

export interface Risk {
  _id?: ObjectId;
  projectId: ObjectId;
  employeeId: ObjectId;
  title: string;
  severity: RiskSeverity;
  mitigationPlan: string;
  status: RiskStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Activity Log Types
export type ActivityType = 'checkin' | 'feedback' | 'risk_created' | 'risk_updated' | 'status_change';

export interface ActivityLog {
  _id?: ObjectId;
  projectId: ObjectId;
  userId: ObjectId;
  type: ActivityType;
  description: string;
  metadata?: any;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
