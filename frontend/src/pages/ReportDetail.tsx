import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportAPI } from '../services/api';
import {
  ArrowLeft,
  FileBarChart,
  Download,
  Trash2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface ReportDetail {
  id: number;
  title: string;
  summary: string;
  generated_at: string;
  documents: Array<{
    id: number;
    title: string;
    file_name: string;
  }>;
  issues: Array<{
    severity: string;
    category: string;
    title: string;
    description: string;
  }>;
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  categoryGroups: Record<string, any[]>;
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const response = await reportAPI.getById(id!);
      setReport(response.data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await reportAPI.delete(id!);
      navigate('/reports');
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleDownload = () => {
    if (!report) return;

    const content = report.summary;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Report not found</p>
        <Link to="/reports" className="mt-4 inline-block btn btn-primary">
          Back to Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/reports')} className="btn btn-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{report.title}</h1>
            <p className="mt-1 text-gray-600">
              Generated on {new Date(report.generated_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownload} className="btn btn-secondary">
            <Download className="w-5 h-5 mr-2" />
            Download
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            <Trash2 className="w-5 h-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documents</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{report.documents.length}</p>
            </div>
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        {[
          { severity: 'critical', label: 'Critical', color: 'red' },
          { severity: 'high', label: 'High', color: 'orange' },
          { severity: 'medium', label: 'Medium', color: 'yellow' },
          { severity: 'low', label: 'Low', color: 'green' },
        ].map(({ severity, label, color }) => (
          <div key={severity} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium text-${color}-700`}>{label}</p>
                <p className={`mt-2 text-2xl font-bold text-${color}-900`}>
                  {report.severityCounts[severity as keyof typeof report.severityCounts]}
                </p>
              </div>
              <AlertTriangle className={`w-8 h-8 text-${color}-600`} />
            </div>
          </div>
        ))}
      </div>

      {/* Documents Included */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Documents Included</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {report.documents.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-sm text-gray-500 truncate">{doc.file_name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Report Summary */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <FileBarChart className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Report Summary</h2>
        </div>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
            {report.summary}
          </pre>
        </div>
      </div>

      {/* Issues by Category */}
      {Object.keys(report.categoryGroups).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Issues by Category</h2>
          <div className="space-y-4">
            {Object.entries(report.categoryGroups)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([category, issues]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-900">
                      {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {issues.slice(0, 5).map((issue: any, idx: number) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded ${
                          issue.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : issue.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : issue.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : issue.severity === 'low'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
