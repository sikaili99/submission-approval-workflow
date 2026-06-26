export type Status = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type Category = 'GRANT' | 'EXPENSE' | 'EQUIPMENT' | 'TRAVEL' | 'OTHER';
export type Action = 'submit' | 'start_review' | 'approve' | 'reject' | 'return_for_changes';
export type Role = 'APPLICANT' | 'REVIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ApplicationSummary {
  id: string;
  title: string;
  category: Category;
  description: string;
  amount: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  status: Status;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  fromStatus: Status;
  toStatus: Status;
  comment: string | null;
  createdAt: string;
  actor: { id: string; name: string; role: Role };
}

export interface ApplicationDetail extends ApplicationSummary {
  availableTransitions: Action[];
  canEdit: boolean;
  auditTrail: AuditEntry[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}
