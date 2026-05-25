export type ItemStatus = 'pending' | 'in_review' | 'approved';
export type UserRole   = 'admin' | 'client';

export interface PortalProject {
  id:          string;
  slug:        string;
  name:        string;
  client_name: string;
  description: string | null;
  logo_url:    string | null;
  created_at:  string;
}

export interface PortalBlock {
  id:          string;
  project_id:  string;
  slug:        string;
  title:       string;
  description: string | null;
  icon:        string;
  week_start:  number | null;
  week_end:    number | null;
  order_index: number;
  created_at:  string;
}

export interface PortalItem {
  id:             string;
  block_id:       string;
  slug:           string;
  title:          string;
  description:    string | null;
  status:         ItemStatus;
  comments:       string | null;
  admin_feedback: string | null;
  is_blocker:     boolean;
  order_index:    number;
  created_at:     string;
  updated_at:     string;
}

export interface PortalFile {
  id:           string;
  item_id:      string;
  uploaded_by:  string | null;
  filename:     string;
  storage_path: string;
  content_type: string | null;
  size_bytes:   number | null;
  created_at:   string;
  signed_url?:  string;
}

export interface BlockProgress {
  block_id:    string;
  total:       number;
  approved:    number;
  in_review:   number;
  pending:     number;
  percentage:  number;
}

export interface PortalProgress {
  total_items:         number;
  approved_items:      number;
  in_review_items:     number;
  pending_items:       number;
  overall_percentage:  number;
  by_block:            BlockProgress[];
}

export interface PortalItemWithFiles extends PortalItem {
  files: PortalFile[];
}

export interface PortalBlockWithItems extends PortalBlock {
  items:    PortalItemWithFiles[];
  progress: BlockProgress;
}

export interface PortalDashboardData {
  project:   PortalProject;
  blocks:    PortalBlockWithItems[];
  progress:  PortalProgress;
  user_role: UserRole;
}

export interface UpdateItemPayload {
  status?:         ItemStatus;
  comments?:       string;
  admin_feedback?: string;
}
