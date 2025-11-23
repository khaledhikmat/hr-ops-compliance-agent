export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: string;
}

export interface Document {
  id: number;
  user_id: number;
  title: string;
  file_name: string;
  file_type: string;
  file_path?: string;
  content: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  uploaded_at: string;
  analyzed_at?: string;
}

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Issue {
  id: number;
  document_id: number;
  severity: IssueSeverity;
  category: string;
  title: string;
  description: string;
  location?: string;
  recommendation: string;
  jurisdiction?: string;
  created_at: string;
}

export interface Task {
  id: number;
  issue_id: number;
  assigned_to?: number;
  assigned_by: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

export interface Report {
  id: number;
  user_id: number;
  title: string;
  document_ids: string;
  summary: string;
  generated_at: string;
}

export interface ComplianceAnalysis {
  issues: Array<{
    severity: IssueSeverity;
    category: string;
    title: string;
    description: string;
    location?: string;
    recommendation: string;
    jurisdiction?: string;
  }>;
  summary: string;
}
