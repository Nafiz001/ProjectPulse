'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  healthScore: number;
}

export default function EmployeeDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'employee') {
        router.push('/');
      } else {
        fetchProjects();
      }
    }
  }, [user, authLoading, router]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <LoadingPage />;
  }

  if (!user || user.role !== 'employee') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
          <p className="text-gray-600 mt-1">Track your assigned projects and submit weekly check-ins</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <p className="text-sm font-medium text-gray-600">Assigned Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{projects.length}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-sm font-medium text-gray-600">Pending Check-ins</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-sm font-medium text-gray-600">Open Risks</p>
              <p className="text-3xl font-bold text-red-600 mt-2">0</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Your Projects</h3>
          </CardHeader>
          <CardBody>
            {projects.length === 0 ? (
              <EmptyState
                title="No projects assigned"
                description="You haven't been assigned to any projects yet"
              />
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      </div>
                      <Badge variant={
                        project.status === 'On Track' ? 'success' : 
                        project.status === 'At Risk' ? 'warning' : 'danger'
                      }>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          Health Score: <span className="font-semibold">{project.healthScore}/100</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
