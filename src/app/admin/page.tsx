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
import { Input, TextArea, Select } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { getStatusColor, getHealthScoreColor } from '@/lib/healthScore';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  healthScore: number;
  startDate: string;
  endDate: string;
  client: any;
  employees: any[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Helper function to get user initials for avatar
const getUserInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to get avatar color based on name
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Helper function to get project icon color
const getProjectIconColor = (name: string) => {
  const colors = [
    { bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-600 dark:text-indigo-300' },
    { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-600 dark:text-pink-300' },
    { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-300' },
    { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-300' },
    { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-300' },
    { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-300' },
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    employeeIds: [] as string[],
    startDate: '',
    endDate: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      } else {
        fetchProjects();
        fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        clientId: '',
        employeeIds: [],
        startDate: '',
        endDate: '',
      });
      setShowCreateModal(false);
      
      // Refresh projects list
      await fetchProjects();
    } catch (error: any) {
      setFormError(error.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeSelection = (employeeId: string) => {
    setFormData(prev => {
      const isSelected = prev.employeeIds.includes(employeeId);
      return {
        ...prev,
        employeeIds: isSelected
          ? prev.employeeIds.filter(id => id !== employeeId)
          : [...prev.employeeIds, employeeId],
      };
    });
  };

  if (authLoading || isLoading) {
    return <LoadingPage />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const onTrackProjects = projects.filter(p => p.status === 'On Track');
  const atRiskProjects = projects.filter(p => p.status === 'At Risk');
  const criticalProjects = projects.filter(p => p.status === 'Critical');

  const clients = users.filter(u => u.role === 'client');
  const employees = users.filter(u => u.role === 'employee');

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h2>
            <p className="text-gray-600 mt-1">Monitor all projects and team performance at a glance.</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Projects Card */}
          <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 truncate">Total Projects</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-2 border-t border-gray-100">
              <div className="text-xs text-gray-600">
                <span className="text-blue-600 font-medium">All active</span> projects listed
              </div>
            </div>
          </div>

          {/* On Track Card */}
          <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 truncate">On Track</p>
                  <p className="mt-1 text-3xl font-bold text-green-600">{onTrackProjects.length}</p>
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-2 border-t border-gray-100">
              <div className="text-xs text-gray-600">
                <span className="text-green-600 font-medium">{projects.length ? Math.round((onTrackProjects.length / projects.length) * 100) : 0}%</span> of total projects
              </div>
            </div>
          </div>

          {/* At Risk Card */}
          <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 truncate">At Risk</p>
                  <p className="mt-1 text-3xl font-bold text-yellow-600">{atRiskProjects.length}</p>
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-2 border-t border-gray-100">
              <div className="text-xs text-gray-600">
                Requires <span className="text-yellow-600 font-medium">attention</span>
              </div>
            </div>
          </div>

          {/* Critical Card */}
          <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 truncate">Critical</p>
                  <p className="mt-1 text-3xl font-bold text-red-600">{criticalProjects.length}</p>
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-2 border-t border-gray-100">
              <div className="text-xs text-gray-600">
                <span className="text-red-600 font-medium">Immediate</span> action needed
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">All Projects</h3>
            <div className="relative">
              <input
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-64"
                placeholder="Search projects..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={searchTerm ? "No projects found" : "No projects yet"}
                description={searchTerm ? "Try adjusting your search terms" : "Create your first project to get started"}
                icon={
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Health Score
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((project) => {
                    const iconColor = getProjectIconColor(project.name);
                    return (
                      <tr key={project._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${iconColor.bg} flex items-center justify-center ${iconColor.text}`}>
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{project.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">{project.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{project.client?.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.status === 'On Track' ? 'bg-green-100 text-green-800' :
                            project.status === 'At Risk' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-900 mr-1">{project.healthScore}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 max-w-[6rem] mx-auto">
                            <div 
                              className={`h-1.5 rounded-full ${
                                project.healthScore >= 80 ? 'bg-green-500' :
                                project.healthScore >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${project.healthScore}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex -space-x-2 justify-center overflow-hidden">
                            {project.employees?.slice(0, 3).map((employee, idx) => (
                              <div
                                key={idx}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white ${getAvatarColor(employee.name)} text-white text-xs font-medium`}
                                title={employee.name}
                              >
                                {getUserInitials(employee.name)}
                              </div>
                            ))}
                            {project.employees && project.employees.length > 3 && (
                              <span className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 text-xs text-gray-500 font-medium">
                                {project.employees.length - 3}+
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/admin/projects/${project._id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormError('');
          setFormData({
            name: '',
            description: '',
            clientId: '',
            employeeIds: [],
            startDate: '',
            endDate: '',
          });
        }}
        title="Create New Project"
        size="lg"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {formError && <Alert type="error" message={formError} />}
          
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter project name"
            required
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter project description"
            required
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              required
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Employees *
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
              {employees.length === 0 ? (
                <p className="text-sm text-gray-500">No employees available</p>
              ) : (
                employees.map((employee) => (
                  <label key={employee._id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.employeeIds.includes(employee._id)}
                      onChange={() => handleEmployeeSelection(employee._id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{employee.name} ({employee.email})</span>
                  </label>
                ))
              )}
            </div>
            {formData.employeeIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {formData.employeeIds.length} employee(s) selected
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || formData.employeeIds.length === 0}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
