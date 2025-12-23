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
import { Input, TextArea } from '@/components/ui/Input';
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
    name: string;
    email: string;
  };
}

interface CheckIn {
  _id: string;
  projectId: {
    _id: string;
    name: string;
  };
  progressSummary: string;
  blockers: string;
  confidenceLevel: number;
  completionPercentage: number;
  createdAt: string;
}

interface Risk {
  _id: string;
  projectId: {
    _id: string;
    name: string;
  };
  title: string;
  severity: string;
  mitigationPlan: string;
  status: string;
  createdAt: string;
}

export default function EmployeeDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Form states
  const [checkInForm, setCheckInForm] = useState({
    progressSummary: '',
    blockers: '',
    confidenceLevel: 3,
    completionPercentage: 0,
  });
  
  const [riskForm, setRiskForm] = useState({
    title: '',
    severity: 'Medium',
    mitigationPlan: '',
  });
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'employee') {
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

      // Fetch check-ins
      const checkInsResponse = await fetch('/api/checkins', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (checkInsResponse.ok) {
        const checkInsData = await checkInsResponse.json();
        setCheckIns(checkInsData.data || []);
      }

      // Fetch risks
      const risksResponse = await fetch('/api/risks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (risksResponse.ok) {
        const risksData = await risksResponse.json();
        setRisks(risksData.data || []);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          projectId: selectedProjectId,
          ...checkInForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit check-in');
      }

      setFormSuccess('Check-in submitted successfully!');
      setCheckInForm({
        progressSummary: '',
        blockers: '',
        confidenceLevel: 3,
        completionPercentage: 0,
      });
      
      setTimeout(() => {
        setShowCheckInModal(false);
        setFormSuccess('');
        fetchData();
      }, 1500);

    } catch (error: any) {
      setFormError(error.message || 'Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/risks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          projectId: selectedProjectId,
          ...riskForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to report risk');
      }

      setFormSuccess('Risk reported successfully!');
      setRiskForm({
        title: '',
        severity: 'Medium',
        mitigationPlan: '',
      });
      
      setTimeout(() => {
        setShowRiskModal(false);
        setFormSuccess('');
        fetchData();
      }, 1500);

    } catch (error: any) {
      setFormError(error.message || 'Failed to report risk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCheckInModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowCheckInModal(true);
    setFormError('');
    setFormSuccess('');
  };

  const openRiskModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowRiskModal(true);
    setFormError('');
    setFormSuccess('');
  };

  if (authLoading || isLoading) {
    return <LoadingPage />;
  }

  if (!user || user.role !== 'employee') {
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

  const openRisks = risks.filter(r => r.status === 'Open');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage your assigned projects and submit updates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned Projects</p>
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
                  <p className="text-sm font-medium text-gray-600">Check-ins Submitted</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{checkIns.length}</p>
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
                  <p className="text-sm font-medium text-gray-600">Open Risks</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{openRisks.length}</p>
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

        {/* Assigned Projects */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">My Assigned Projects</h3>
          </CardHeader>
          <CardBody>
            {projects.length === 0 ? (
              <EmptyState
                title="No projects assigned"
                description="You haven't been assigned to any projects yet"
                icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {projects.map((project) => (
                  <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-gray-900">{project.name}</h4>
                          {getStatusBadge(project.status)}
                          <div className={`text-lg font-bold ${getHealthColor(project.healthScore)}`}>
                            {project.healthScore}/100
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                        <div className="mt-3 flex items-center gap-6 text-sm text-gray-500">
                          <span>Client: {project.client.name}</span>
                          <span>Timeline: {formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => openCheckInModal(project._id)}
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Submit Check-in
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => openRiskModal(project._id)}
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Report Risk
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">My Recent Check-ins</h3>
          </CardHeader>
          <CardBody>
            {checkIns.length === 0 ? (
              <EmptyState
                title="No check-ins yet"
                description="Submit your first weekly check-in above"
              />
            ) : (
              <div className="space-y-4">
                {checkIns.slice(0, 5).map((checkIn) => (
                  <div key={checkIn._id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{checkIn.projectId.name}</div>
                        <div className="text-xs text-gray-500">{formatDate(checkIn.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">Confidence: {checkIn.confidenceLevel}/5</span>
                        <span className="text-gray-600">Progress: {checkIn.completionPercentage}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{checkIn.progressSummary}</p>
                    {checkIn.blockers && (
                      <p className="text-sm text-red-600 mt-1">Blockers: {checkIn.blockers}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Open Risks */}
        {openRisks.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">My Open Risks</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {openRisks.map((risk) => (
                  <div key={risk._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">{risk.title}</span>
                          {getSeverityBadge(risk.severity)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{risk.projectId.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatDate(risk.createdAt)}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-3">{risk.mitigationPlan}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Submit Check-in Modal */}
      <Modal
        isOpen={showCheckInModal}
        onClose={() => {
          setShowCheckInModal(false);
          setFormError('');
          setFormSuccess('');
        }}
        title="Submit Weekly Check-in"
        size="lg"
      >
        <form onSubmit={handleSubmitCheckIn} className="space-y-4">
          {formError && <Alert type="error" message={formError} />}
          {formSuccess && <Alert type="success" message={formSuccess} />}
          
          <TextArea
            label="Progress Summary"
            value={checkInForm.progressSummary}
            onChange={(e) => setCheckInForm({ ...checkInForm, progressSummary: e.target.value })}
            placeholder="Describe what you've accomplished this week..."
            required
            rows={4}
          />

          <TextArea
            label="Blockers or Challenges"
            value={checkInForm.blockers}
            onChange={(e) => setCheckInForm({ ...checkInForm, blockers: e.target.value })}
            placeholder="Any issues preventing progress? (Optional)"
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidence Level (1-5) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setCheckInForm({ ...checkInForm, confidenceLevel: level })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    checkInForm.confidenceLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">1 = Very Low, 5 = Very High</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Completion Percentage <span className="text-red-500">*</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={checkInForm.completionPercentage}
              onChange={(e) => setCheckInForm({ ...checkInForm, completionPercentage: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>0%</span>
              <span className="font-semibold text-blue-600">{checkInForm.completionPercentage}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCheckInModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Check-in'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Report Risk Modal */}
      <Modal
        isOpen={showRiskModal}
        onClose={() => {
          setShowRiskModal(false);
          setFormError('');
          setFormSuccess('');
        }}
        title="Report Project Risk"
        size="lg"
      >
        <form onSubmit={handleSubmitRisk} className="space-y-4">
          {formError && <Alert type="error" message={formError} />}
          {formSuccess && <Alert type="success" message={formSuccess} />}
          
          <Input
            label="Risk Title"
            value={riskForm.title}
            onChange={(e) => setRiskForm({ ...riskForm, title: e.target.value })}
            placeholder="Brief description of the risk..."
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {['Low', 'Medium', 'High'].map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setRiskForm({ ...riskForm, severity })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    riskForm.severity === severity
                      ? severity === 'High' 
                        ? 'bg-red-600 text-white'
                        : severity === 'Medium'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          <TextArea
            label="Mitigation Plan"
            value={riskForm.mitigationPlan}
            onChange={(e) => setRiskForm({ ...riskForm, mitigationPlan: e.target.value })}
            placeholder="How do you plan to address this risk?..."
            required
            rows={4}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowRiskModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={isSubmitting}>
              {isSubmitting ? 'Reporting...' : 'Report Risk'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
