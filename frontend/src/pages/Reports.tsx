import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportAPI, documentAPI } from '../services/api';
import { FileBarChart, Plus, Calendar, FileText } from 'lucide-react';

interface Report {
  id: number;
  title: string;
  generated_at: string;
  document_ids: string;
}

interface Document {
  id: number;
  title: string;
  status: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    document_ids: [] as number[],
  });

  useEffect(() => {
    loadReports();
    loadDocuments();
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportAPI.getAll();
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await documentAPI.getAll();
      const completed = response.data.filter((d: Document) => d.status === 'completed');
      setDocuments(completed);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.document_ids.length === 0) {
      alert('Please select at least one document');
      return;
    }

    setGenerating(true);

    try {
      await reportAPI.generate({
        title: createForm.title,
        document_ids: createForm.document_ids,
      });

      setShowCreateModal(false);
      setCreateForm({ title: '', document_ids: [] });
      loadReports();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const toggleDocument = (docId: number) => {
    setCreateForm((prev) => ({
      ...prev,
      document_ids: prev.document_ids.includes(docId)
        ? prev.document_ids.filter((id) => id !== docId)
        : [...prev.document_ids, docId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
          <p className="mt-2 text-gray-600">
            Generate formal compliance audit reports for your documents
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          disabled={documents.length === 0}
        >
          <Plus className="w-5 h-5 mr-2" />
          Generate Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center py-12">
          <FileBarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
          <p className="text-gray-500 mb-6">
            Generate your first compliance report from analyzed documents
          </p>
          {documents.length > 0 ? (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus className="w-5 h-5 mr-2" />
              Generate Report
            </button>
          ) : (
            <p className="text-gray-500">Upload and analyze documents first</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link
              key={report.id}
              to={`/reports/${report.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{report.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(report.generated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileBarChart className="w-6 h-6 text-primary-600" />
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{JSON.parse(report.document_ids).length} document(s)</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Compliance Report</h2>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Q1 2025 Compliance Audit"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Documents * ({createForm.document_ids.length} selected)
                </label>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {documents.length === 0 ? (
                    <p className="p-4 text-center text-gray-500">
                      No completed documents available
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={createForm.document_ids.includes(doc.id)}
                            onChange={() => toggleDocument(doc.id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-3 text-sm text-gray-900">{doc.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ title: '', document_ids: [] });
                  }}
                  className="btn btn-secondary flex-1"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
