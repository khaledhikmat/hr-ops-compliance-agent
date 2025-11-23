import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { Upload, FileText, Clock, CheckCircle2, XCircle, Loader } from 'lucide-react';

interface Document {
  id: number;
  title: string;
  file_name: string;
  status: string;
  uploaded_at: string;
  analyzed_at?: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    loadDocuments();
    const interval = setInterval(loadDocuments, 5000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentAPI.getAll();
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setUploadError('Please provide both title and file');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      await documentAPI.upload(formData);
      setShowUploadModal(false);
      setTitle('');
      setFile(null);
      loadDocuments();
    } catch (error: any) {
      setUploadError(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'analyzing':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">Upload and manage your HR policy documents</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          <Upload className="w-5 h-5 mr-2" />
          Upload Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-6">
            Upload your first HR policy document to begin compliance analysis
          </p>
          <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
            <Upload className="w-5 h-5 mr-2" />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{doc.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{doc.file_name}</p>
                </div>
                {getStatusIcon(doc.status)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
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

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Uploaded</span>
                  <span className="text-gray-900">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Document</h2>

            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="e.g., Employee Handbook 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PDF, Word, Text (Max 10MB)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setTitle('');
                    setFile(null);
                    setUploadError('');
                  }}
                  className="btn btn-secondary flex-1"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
