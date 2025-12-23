'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  healthScore: number;
  startDate: string;
  endDate: string;
  client: {
    _id: string;
    name: string;
    email: string;
  };
  employees: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

interface CheckIn {
  _id: string;
  employeeId: {
    name: string;
    email: string;
  };
  progressSummary: string;
  blockers: string;
  confidenceLevel: number;
  completionPercentage: number;
  createdAt: string;
}

interface Feedback {
  _id: string;
  clientId: {
    name: string;
    email: string;
  };
  satisfactionRating: number;
  communicationRating: number;
  comments: string;
  issueFlagged: boolean;
  createdAt: string;
}

interface Risk {
  _id: string;
  employeeId: {
    name: string;
    email: string;
  };
  title: string;
  severity: string;
  mitigationPlan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  type: string;
  description: string;
  createdAt: string;
}

export default function ProjectDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'checkins' | 'feedback' | 'risks' | 'activity'>('overview');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      } else {
        fetchProjectData();
      }
    }
  }, [user, authLoading, router, projectId]);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project');
      }

      const projectData = await projectResponse.json();
      setProject(projectData.data);

      // Fetch check-ins
      const checkInsResponse = await fetch(`/api/checkins?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (checkInsResponse.ok) {
        const checkInsData = await checkInsResponse.json();
        setCheckIns(checkInsData.data || []);
      }

      // Fetch feedback
      const feedbackResponse = await fetch(`/api/feedback?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData.data || []);
      }

      // Fetch risks
      const risksResponse = await fetch(`/api/risks?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (risksResponse.ok) {
        const risksData = await risksResponse.json();
        setRisks(risksData.data || []);
      }

      // Fetch activities
      const activitiesResponse = await fetch(`/api/activities?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.data || []);
      }

    } catch (error: any) {
      setError(error.message || 'Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert type="error" message={error} />
        <Button onClick={() => router.push('/admin')} className="mt-4">
          Back to Dashboard
        </Button>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Project not found"
          description="The project you're looking for doesn't exist."
          icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>}
          action={<Button onClick={() => router.push('/admin')}>Back to Dashboard</Button>}
        />
      </DashboardLayout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return <Badge variant="danger">High</Badge>;
      case 'medium': return <Badge variant="warning">Medium</Badge>;
      case 'low': return <Badge variant="info">Low</Badge>;
      default: return <Badge variant="default">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'On Track': return <Badge variant="success">On Track</Badge>;
      case 'At Risk': return <Badge variant="warning">At Risk</Badge>;
      case 'Critical': return <Badge variant="danger">Critical</Badge>;
      case 'Completed': return <Badge variant="info">Completed</Badge>;
      case 'Open': return <Badge variant="warning">Open</Badge>;
      case 'Resolved': return <Badge variant="success">Resolved</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-5 w-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin')}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              <p className="text-gray-600 mt-1">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(project.status)}
            <div className={`text-3xl font-bold ${getHealthColor(project.healthScore)}`}>
              {project.healthScore}/100
            </div>
          </div>
        </div>

        {/* Project Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <div className="text-sm font-medium text-gray-600 mb-2">Timeline</div>
              <div className="text-sm text-gray-900">
                {formatDate(project.startDate)} - {formatDate(project.endDate)}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-sm font-medium text-gray-600 mb-2">Client</div>
              <div className="text-sm font-medium text-gray-900">{project.client.name}</div>
              <div className="text-xs text-gray-500">{project.client.email}</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-sm font-medium text-gray-600 mb-2">Team ({project.employees.length})</div>
              <div className="space-y-1">
                {project.employees.slice(0, 2).map((emp) => (
                  <div key={emp._id} className="text-sm text-gray-900">{emp.name}</div>
                ))}
                {project.employees.length > 2 && (
                  <div className="text-xs text-gray-500">+{project.employees.length - 2} more</div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'checkins', label: `Check-ins (${checkIns.length})` },
              { id: 'feedback', label: `Feedback (${feedback.length})` },
              { id: 'risks', label: `Risks (${risks.length})` },
              { id: 'activity', label: `Activity (${activities.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Recent Check-ins</h3>
                </CardHeader>
                <CardBody>
                  {checkIns.length === 0 ? (
                    <EmptyState
                      title="No check-ins yet"
                      description="Employee check-ins will appear here"
                    />
                  ) : (
                    <div className="space-y-4">
                      {checkIns.slice(0, 3).map((checkIn) => (
                        <div key={checkIn._id} className="border-l-4 border-blue-500 pl-4">
                          <div className="text-sm font-medium text-gray-900">{checkIn.employeeId.name}</div>
                          <div className="text-xs text-gray-500">{formatDate(checkIn.createdAt)}</div>
                          <div className="text-sm text-gray-700 mt-2 line-clamp-2">{checkIn.progressSummary}</div>
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <span className="text-gray-600">Confidence: {checkIn.confidenceLevel}/5</span>
                            <span className="text-gray-600">Progress: {checkIn.completionPercentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Open Risks</h3>
                </CardHeader>
                <CardBody>
                  {risks.filter(r => r.status === 'Open').length === 0 ? (
                    <EmptyState
                      title="No open risks"
                      description="All risks are resolved or none reported"
                    />
                  ) : (
                    <div className="space-y-4">
                      {risks.filter(r => r.status === 'Open').slice(0, 3).map((risk) => (
                        <div key={risk._id} className="border-l-4 border-red-500 pl-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                            {getSeverityBadge(risk.severity)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{risk.employeeId.name}</div>
                          <div className="text-sm text-gray-700 mt-2 line-clamp-2">{risk.mitigationPlan}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === 'checkins' && (
            <Card>
              <CardBody>
                {checkIns.length === 0 ? (
                  <EmptyState
                    title="No check-ins yet"
                    description="Employee weekly check-ins will appear here"
                    icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>}
                  />
                ) : (
                  <div className="space-y-6">
                    {checkIns.map((checkIn) => (
                      <div key={checkIn._id} className="border-b border-gray-200 pb-6 last:border-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{checkIn.employeeId.name}</div>
                            <div className="text-xs text-gray-500">{formatDate(checkIn.createdAt)}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xs text-gray-600">Confidence</div>
                              <div className="text-lg font-semibold text-blue-600">{checkIn.confidenceLevel}/5</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">Progress</div>
                              <div className="text-lg font-semibold text-green-600">{checkIn.completionPercentage}%</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm font-medium text-gray-700">Progress Summary</div>
                          <p className="text-sm text-gray-600 mt-1">{checkIn.progressSummary}</p>
                        </div>
                        {checkIn.blockers && (
                          <div className="mt-3">
                            <div className="text-sm font-medium text-gray-700">Blockers</div>
                            <p className="text-sm text-gray-600 mt-1">{checkIn.blockers}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'feedback' && (
            <Card>
              <CardBody>
                {feedback.length === 0 ? (
                  <EmptyState
                    title="No feedback yet"
                    description="Client feedback will appear here"
                    icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>}
                  />
                ) : (
                  <div className="space-y-6">
                    {feedback.map((fb) => (
                      <div key={fb._id} className="border-b border-gray-200 pb-6 last:border-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{fb.clientId.name}</div>
                            <div className="text-xs text-gray-500">{formatDate(fb.createdAt)}</div>
                          </div>
                          {fb.issueFlagged && (
                            <Badge variant="danger">Issue Flagged</Badge>
                          )}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Satisfaction Rating</div>
                            {renderStars(fb.satisfactionRating)}
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Communication Rating</div>
                            {renderStars(fb.communicationRating)}
                          </div>
                        </div>
                        {fb.comments && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-gray-700">Comments</div>
                            <p className="text-sm text-gray-600 mt-1">{fb.comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'risks' && (
            <Card>
              <CardBody>
                {risks.length === 0 ? (
                  <EmptyState
                    title="No risks reported"
                    description="Project risks will appear here"
                    icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>}
                  />
                ) : (
                  <div className="space-y-6">
                    {risks.map((risk) => (
                      <div key={risk._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-base font-semibold text-gray-900">{risk.title}</div>
                            <div className="text-sm text-gray-600 mt-1">Reported by {risk.employeeId.name}</div>
                            <div className="text-xs text-gray-500">{formatDate(risk.createdAt)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(risk.severity)}
                            {getStatusBadge(risk.status)}
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm font-medium text-gray-700">Mitigation Plan</div>
                          <p className="text-sm text-gray-600 mt-1">{risk.mitigationPlan}</p>
                        </div>
                        {risk.status === 'Resolved' && (
                          <div className="mt-3 text-xs text-gray-500">
                            Resolved on {formatDate(risk.updatedAt)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Activity Timeline</h3>
              </CardHeader>
              <CardBody>
                {activities.length === 0 ? (
                  <EmptyState
                    title="No activity yet"
                    description="Project activities will appear here"
                    icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>}
                  />
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {activities.map((activity, idx) => (
                        <li key={activity._id}>
                          <div className="relative pb-8">
                            {idx !== activities.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-900">{activity.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">{activity.userId?.name || 'System'}</p>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                  {formatDate(activity.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
