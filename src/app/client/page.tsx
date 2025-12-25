'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  healthScore: number;
  startDate: string;
  endDate: string;
  employees: Array<{
    name: string;
  }>;
}

interface Feedback {
  _id: string;
  projectId: {
    _id: string;
    name: string;
  };
  satisfactionRating: number;
  communicationRating: number;
  comments: string;
  issueFlagged: boolean;
  createdAt: string;
}

export default function ClientDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Form state
  const [feedbackForm, setFeedbackForm] = useState({
    satisfactionRating: 5,
    communicationRating: 5,
    comments: '',
    issueFlagged: false,
  });
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'client') {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch projects
      const projectsResponse = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data || []);
      }

      // Fetch feedback
      const feedbackResponse = await fetch('/api/feedback', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData.data || []);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          projectId: selectedProjectId,
          ...feedbackForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setFormSuccess('Feedback submitted successfully!');
      setFeedbackForm({
        satisfactionRating: 5,
        communicationRating: 5,
        comments: '',
        issueFlagged: false,
      });
      
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFormSuccess('');
        fetchData();
      }, 1500);

    } catch (error: any) {
      setFormError(error.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFeedbackModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowFeedbackModal(true);
    setFormError('');
    setFormSuccess('');
  };

  if (authLoading || isLoading) {
    return <LoadingPage />;
  }

  if (!user || user.role !== 'client') {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'On Track': return <Badge variant="success">On Track</Badge>;
      case 'At Risk': return <Badge variant="warning">At Risk</Badge>;
      case 'Critical': return <Badge variant="danger">Critical</Badge>;
      case 'Completed': return <Badge variant="info">Completed</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const renderStars = (rating: number, setRating?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating && setRating(star)}
            className={`${setRating ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <svg
              className={`h-6 w-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const onTrackProjects = projects.filter(p => p.status === 'On Track');
  const atRiskProjects = projects.filter(p => p.status === 'At Risk' || p.status === 'Critical');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor your projects and provide feedback</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Projects</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{projects.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Track</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{onTrackProjects.length}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Need Attention</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{atRiskProjects.length}</p>
                </div>
                <div className="bg-red-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">My Projects</h3>
          </CardHeader>
          <CardBody>
            {projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="You haven't been assigned to any projects yet"
                icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <div key={project._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{project.description}</p>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(project.status)}
                        <div className={`px-3 py-1 rounded-full font-bold text-lg ${getHealthColor(project.healthScore)}`}>
                          {project.healthScore}/100
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{project.employees.length} team members</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => openFeedbackModal(project._id)}
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Submit Feedback
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">My Recent Feedback</h3>
          </CardHeader>
          <CardBody>
            {feedback.length === 0 ? (
              <EmptyState
                title="No feedback submitted yet"
                description="Submit your first project feedback above"
              />
            ) : (
              <div className="space-y-4">
                {feedback.slice(0, 5).map((fb) => (
                  <div key={fb._id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{fb.projectId.name}</div>
                        <div className="text-xs text-gray-500">{formatDate(fb.createdAt)}</div>
                      </div>
                      {fb.issueFlagged && (
                        <Badge variant="danger">Issue Flagged</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Satisfaction</div>
                        {renderStars(fb.satisfactionRating)}
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Communication</div>
                        {renderStars(fb.communicationRating)}
                      </div>
                    </div>
                    {fb.comments && (
                      <p className="text-sm text-gray-700 mt-2 italic">"{fb.comments}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Submit Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setFormError('');
          setFormSuccess('');
        }}
        title="Submit Project Feedback"
        size="lg"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-6">
          {formError && <Alert type="error" message={formError} />}
          {formSuccess && <Alert type="success" message={formSuccess} />}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Satisfaction Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              {renderStars(feedbackForm.satisfactionRating, (rating) => 
                setFeedbackForm({ ...feedbackForm, satisfactionRating: rating })
              )}
              <span className="text-sm text-gray-600 ml-2">({feedbackForm.satisfactionRating}/5)</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">How satisfied are you with the project progress?</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              {renderStars(feedbackForm.communicationRating, (rating) => 
                setFeedbackForm({ ...feedbackForm, communicationRating: rating })
              )}
              <span className="text-sm text-gray-600 ml-2">({feedbackForm.communicationRating}/5)</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">How would you rate the team's communication?</p>
          </div>

          <TextArea
            label="Comments"
            value={feedbackForm.comments}
            onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
            placeholder="Share your thoughts about the project... (Optional)"
            rows={4}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="issueFlagged"
              checked={feedbackForm.issueFlagged}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, issueFlagged: e.target.checked })}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="issueFlagged" className="ml-2 block text-sm text-gray-900">
              Flag an issue that needs immediate attention
            </label>
          </div>

          {feedbackForm.issueFlagged && (
            <Alert type="warning" message="Flagging this issue will notify the admin team immediately." />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowFeedbackModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
