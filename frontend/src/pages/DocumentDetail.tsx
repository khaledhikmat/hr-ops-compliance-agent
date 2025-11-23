import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentAPI, taskAPI, authAPI } from '../services/api';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Calendar,
} from 'lucide-react';

interface Issue {
  id: number;
  severity: string;
  category: string;
  title: string;
  description: string;
  location?: string;
  recommendation: string;
  jurisdiction?: string;
}

interface Document {
  id: number;
  title: string;
  file_name: string;
  status: string;
  uploaded_at: string;
  issues: Issue[];
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
  });

  useEffect(() => {
    loadDocument();
    loadUsers();
  }, [id]);

  const loadDocument = async () => {
    try {
      const response = await documentAPI.getById(id!);
      setDocument(response.data);
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentAPI.delete(id!);
      navigate('/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    try {
      await taskAPI.create({
        issue_id: selectedIssue.id,
        title: taskForm.title,
        description: taskForm.description || undefined,
        assigned_to: taskForm.assigned_to ? parseInt(taskForm.assigned_to) : undefined,
        due_date: taskForm.due_date || undefined,
      });

      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assigned_to: '', due_date: '' });
      alert('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const openTaskModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setTaskForm({
      title: `Resolve: ${issue.title}`,
      description: issue.recommendation,
      assigned_to: '',
      due_date: '',
    });
    setShowTaskModal(true);
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[severity] || colors.info;
  };

  const groupIssuesBySeverity = () => {
    if (!document?.issues) return {};

    const groups: Record<string, Issue[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: [],
    };

    document.issues.forEach((issue) => {
      if (groups[issue.severity]) {
        groups[issue.severity].push(issue);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading document...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Document not found</p>
        <Link to="/documents" className="mt-4 inline-block btn btn-primary">
          Back to Documents
        </Link>
      </div>
    );
  }

  const issueGroups = groupIssuesBySeverity();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/documents')} className="btn btn-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
            <p className="mt-1 text-gray-600">{document.file_name}</p>
          </div>
        </div>
        <button onClick={handleDelete} className="btn btn-danger">
          <Trash2 className="w-5 h-5 mr-2" />
          Delete
        </button>
      </div>

      {/* Document Info */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                {document.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Issues</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{document.issues.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Uploaded</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {new Date(document.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {document.status === 'analyzing' && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Analysis in Progress</p>
              <p className="text-sm text-blue-700">
                AI is analyzing this document for compliance issues. This may take a few minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {document.status === 'completed' && document.issues.length === 0 && (
        <div className="card bg-green-50 border-green-200 text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900">No Issues Found</h3>
          <p className="text-green-700 mt-1">
            This document appears to be compliant with standard HR regulations.
          </p>
        </div>
      )}

      {/* Issues by Severity */}
      {document.status === 'completed' && document.issues.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Compliance Issues</h2>

          {Object.entries(issueGroups).map(
            ([severity, issues]) =>
              issues.length > 0 && (
                <div key={severity} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize flex items-center gap-2">
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        severity === 'critical'
                          ? 'text-red-600'
                          : severity === 'high'
                          ? 'text-orange-600'
                          : severity === 'medium'
                          ? 'text-yellow-600'
                          : severity === 'low'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }`}
                    />
                    {severity} ({issues.length})
                  </h3>

                  {issues.map((issue) => (
                    <div key={issue.id} className={`card border-2 ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`badge ${getSeverityColor(issue.severity)}`}>
                              {issue.severity.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600">{issue.category}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">{issue.title}</h4>
                        </div>
                        <button
                          onClick={() => openTaskModal(issue)}
                          className="btn btn-primary btn-sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Create Task
                        </button>
                      </div>

                      <p className="text-gray-700 mb-3">{issue.description}</p>

                      {issue.location && (
                        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium text-gray-700">Location: </span>
                          <span className="text-gray-600">{issue.location}</span>
                        </div>
                      )}

                      <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          💡 Recommendation
                        </p>
                        <p className="text-sm text-blue-800">{issue.recommendation}</p>
                      </div>

                      {issue.jurisdiction && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Jurisdiction: </span>
                          {issue.jurisdiction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
          )}
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Task</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Issue</p>
              <p className="text-sm text-gray-900">{selectedIssue.title}</p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="input"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  className="input"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
