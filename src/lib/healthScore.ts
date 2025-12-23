import { Project, CheckIn, Feedback, Risk } from '@/types';

/**
 * Calculate Project Health Score (0-100)
 * 
 * Algorithm Breakdown:
 * 1. Client Satisfaction (30%): Average of recent client satisfaction ratings
 * 2. Employee Confidence (25%): Average of recent employee confidence levels
 * 3. Timeline Progress (25%): Progress vs expected progress based on timeline
 * 4. Risk Factor (20%): Penalty based on number and severity of open risks
 * 
 * Health Score Interpretation:
 * - 80-100: On Track (Green)
 * - 60-79: At Risk (Yellow)
 * - 0-59: Critical (Red)
 */

interface HealthScoreInputs {
  project: Project;
  recentCheckIns: CheckIn[];
  recentFeedback: Feedback[];
  openRisks: Risk[];
}

export function calculateHealthScore(inputs: HealthScoreInputs): number {
  const { project, recentCheckIns, recentFeedback, openRisks } = inputs;

  let score = 0;

  // 1. Client Satisfaction Score (30 points max)
  const clientSatisfactionScore = calculateClientSatisfaction(recentFeedback);
  score += clientSatisfactionScore * 30;

  // 2. Employee Confidence Score (25 points max)
  const employeeConfidenceScore = calculateEmployeeConfidence(recentCheckIns);
  score += employeeConfidenceScore * 25;

  // 3. Timeline Progress Score (25 points max)
  const timelineScore = calculateTimelineProgress(project, recentCheckIns);
  score += timelineScore * 25;

  // 4. Risk Factor Score (20 points max)
  const riskScore = calculateRiskScore(openRisks);
  score += riskScore * 20;

  // Round to whole number and ensure 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate client satisfaction score (0-1)
 * Based on average satisfaction and communication ratings from recent feedback
 */
function calculateClientSatisfaction(recentFeedback: Feedback[]): number {
  if (recentFeedback.length === 0) {
    return 0.7; // Neutral score if no feedback yet
  }

  const avgSatisfaction = recentFeedback.reduce(
    (sum, f) => sum + f.satisfactionRating, 0
  ) / recentFeedback.length;

  const avgCommunication = recentFeedback.reduce(
    (sum, f) => sum + f.communicationRating, 0
  ) / recentFeedback.length;

  // Average both ratings and normalize to 0-1
  const combinedAverage = (avgSatisfaction + avgCommunication) / 2;
  const normalizedScore = (combinedAverage - 1) / 4; // Convert 1-5 to 0-1

  // Penalty for flagged issues
  const flaggedIssues = recentFeedback.filter(f => f.issueFlagged).length;
  const issuePenalty = Math.min(0.3, flaggedIssues * 0.1);

  return Math.max(0, normalizedScore - issuePenalty);
}

/**
 * Calculate employee confidence score (0-1)
 * Based on average confidence levels from recent check-ins
 */
function calculateEmployeeConfidence(recentCheckIns: CheckIn[]): number {
  if (recentCheckIns.length === 0) {
    return 0.7; // Neutral score if no check-ins yet
  }

  const avgConfidence = recentCheckIns.reduce(
    (sum, c) => sum + c.confidenceLevel, 0
  ) / recentCheckIns.length;

  // Normalize from 1-5 to 0-1
  const normalizedScore = (avgConfidence - 1) / 4;

  // Check for declining confidence trend
  if (recentCheckIns.length >= 2) {
    const lastTwoConfidence = recentCheckIns.slice(-2).map(c => c.confidenceLevel);
    if (lastTwoConfidence[1] < lastTwoConfidence[0] - 1) {
      // Significant drop in confidence
      return Math.max(0, normalizedScore - 0.15);
    }
  }

  return normalizedScore;
}

/**
 * Calculate timeline progress score (0-1)
 * Compares actual progress with expected progress based on timeline
 */
function calculateTimelineProgress(project: Project, recentCheckIns: CheckIn[]): number {
  const now = new Date();
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);

  // Calculate expected progress based on timeline
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

  // Get most recent actual progress
  let actualProgress = 0;
  if (recentCheckIns.length > 0) {
    actualProgress = recentCheckIns[recentCheckIns.length - 1].completionPercentage;
  }

  // Calculate progress ratio
  if (expectedProgress === 0) {
    return 1; // Project just started
  }

  const progressRatio = actualProgress / expectedProgress;

  // Convert to 0-1 score
  if (progressRatio >= 0.95) {
    return 1; // On track or ahead
  } else if (progressRatio >= 0.8) {
    return 0.8; // Slightly behind
  } else if (progressRatio >= 0.6) {
    return 0.6; // Behind schedule
  } else {
    return 0.4; // Significantly behind
  }
}

/**
 * Calculate risk score (0-1)
 * Penalty based on number and severity of open risks
 */
function calculateRiskScore(openRisks: Risk[]): number {
  if (openRisks.length === 0) {
    return 1; // Perfect score if no risks
  }

  let riskPenalty = 0;

  for (const risk of openRisks) {
    switch (risk.severity) {
      case 'High':
        riskPenalty += 0.25;
        break;
      case 'Medium':
        riskPenalty += 0.15;
        break;
      case 'Low':
        riskPenalty += 0.05;
        break;
    }
  }

  // Cap maximum penalty at 0.8 (leaving minimum 0.2 score)
  riskPenalty = Math.min(0.8, riskPenalty);

  return Math.max(0.2, 1 - riskPenalty);
}

/**
 * Determine project status based on health score
 */
export function getProjectStatus(healthScore: number): 'On Track' | 'At Risk' | 'Critical' {
  if (healthScore >= 80) {
    return 'On Track';
  } else if (healthScore >= 60) {
    return 'At Risk';
  } else {
    return 'Critical';
  }
}

/**
 * Get color class for health score display
 */
export function getHealthScoreColor(healthScore: number): string {
  if (healthScore >= 80) {
    return 'text-green-600 bg-green-50';
  } else if (healthScore >= 60) {
    return 'text-yellow-600 bg-yellow-50';
  } else {
    return 'text-red-600 bg-red-50';
  }
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'On Track':
      return 'bg-green-100 text-green-800';
    case 'At Risk':
      return 'bg-yellow-100 text-yellow-800';
    case 'Critical':
      return 'bg-red-100 text-red-800';
    case 'Completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
