import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import {
  FileText,
  AlertTriangle,
  CheckSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface DashboardStats {
  documents: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  issues: {
    total: number;
    bySeverity: Array<{ severity: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
  };
  tasks: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  recentDocuments: Array<{
    id: number;
    title: string;
    status: string;
    uploaded_at: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const getSeverityCount = (severity: string) => {
    return stats?.issues.bySeverity.find((s) => s.severity === severity)?.count || 0;
  };

  const getTaskStatusCount = (status: string) => {
    return stats?.tasks.byStatus.find((s) => s.status === status)?.count || 0;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor your HR compliance status and track document reviews
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.documents.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.issues.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.tasks.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {getTaskStatusCount('completed')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Issues by Severity */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Issues by Severity</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { severity: 'critical', label: 'Critical', color: 'red' },
            { severity: 'high', label: 'High', color: 'orange' },
            { severity: 'medium', label: 'Medium', color: 'yellow' },
            { severity: 'low', label: 'Low', color: 'green' },
            { severity: 'info', label: 'Info', color: 'blue' },
          ].map(({ severity, label, color }) => (
            <div key={severity} className={`p-4 bg-${color}-50 rounded-lg border border-${color}-200`}>
              <p className={`text-sm font-medium text-${color}-700`}>{label}</p>
              <p className={`mt-1 text-2xl font-bold text-${color}-900`}>
                {getSeverityCount(severity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Category */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Issue Categories</h2>
          {stats?.issues.byCategory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No issues yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.issues.byCategory.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{category.category}</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-900">
                    {category.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Documents</h2>
          {stats?.recentDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <Link to="/documents" className="mt-4 inline-block btn btn-primary">
                Upload Document
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : doc.status === 'analyzing'
                          ? 'bg-blue-100 text-blue-800'
                          : doc.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
