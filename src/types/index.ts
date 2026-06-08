export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'manager' | 'analyst';
  department: string;
}

export interface Department {
  id: string;
  name: string;
  parentId?: string;
  order: number;
}

export interface Metric {
  id: string;
  name: string;
  code: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  changeRate: number;
  changeType: 'mom' | 'yoy';
  departmentId: string;
  departmentName: string;
  owner: User;
  updatedAt: string;
  description: string;
  isFavorite: boolean;
  miniChart: number[];
  categories: string[];
}

export interface TrendPoint {
  date: string;
  value: number;
  compareValue?: number;
}

export interface DrillDownItem {
  dimension: string;
  name: string;
  value: number;
  percentage: number;
  changeRate: number;
}

export interface RevisionRecord {
  id: string;
  version: string;
  changeType: 'create' | 'update' | 'deprecate';
  changeContent: string;
  operator: User;
  approvedBy?: User;
  operatedAt: string;
}

export interface MetricCatalog {
  id: string;
  metricId: string;
  metricName: string;
  version: string;
  status: 'draft' | 'published' | 'deprecated';
  definition: string;
  formula: string;
  dataSource: string;
  updateFrequency: string;
  dimensions: string[];
  owner: User;
  reviewers: User[];
  history: RevisionRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogQuestion {
  id: string;
  catalogId: string;
  question: string;
  screenshots: string[];
  asker: User;
  answer?: string;
  answerer?: User;
  status: 'pending' | 'answered' | 'closed';
  createdAt: string;
}

export interface ApprovalNode {
  id: string;
  order: number;
  approver: User;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  opinion?: string;
  operatedAt?: string;
}

export interface RevisionRequest {
  id: string;
  catalogId: string;
  type: 'create' | 'update' | 'deprecate';
  reason: string;
  suggestedContent: string;
  applicant: User;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  approvals: ApprovalNode[];
  createdAt: string;
}

export interface TicketTimeline {
  action: string;
  operator: User;
  remark?: string;
  timestamp: string;
}

export interface AnomalyTicket {
  id: string;
  title: string;
  metricId: string;
  metricName: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  snapshotValue: number;
  expectedValue: number;
  deviation: number;
  departmentId: string;
  assignee?: User;
  handler?: User;
  status: 'pending' | 'processing' | 'completed';
  rootCause?: string;
  resolution?: string;
  evidences: string[];
  timestamps: TicketTimeline[];
  createdAt: string;
  detectedAt: string;
  slaDeadline: string;
  urgedCount: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: User;
  content: string;
  mentions: string[];
  attachments: string[];
  createdAt: string;
}

export interface ApprovalComment {
  id: string;
  requestId: string;
  author: User;
  content: string;
  mentions: string[];
  attachments: string[];
  createdAt: string;
}

export interface Threshold {
  type: 'above' | 'below' | 'change_rate';
  value: number;
  level: 'warning' | 'critical';
}

export interface Subscription {
  id: string;
  metricId: string;
  metricName: string;
  thresholds: Threshold[];
  notifyChannels: ('app' | 'email' | 'sms' | 'wechat')[];
  enabled: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'anomaly' | 'threshold' | 'approval' | 'revision';
  title: string;
  content: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface FavoriteCategory {
  id: string;
  name: string;
  color: string;
  metricIds: string[];
  order: number;
}

export interface OperationLog {
  id: string;
  type: string;
  module: string;
  targetName: string;
  detail: string;
  operator: User;
  createdAt: string;
}

export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
}

export interface ModalState {
  visible: boolean;
  type: string;
  data?: unknown;
}

export type BottomNavKey = 'dashboard' | 'catalog' | 'tickets' | 'approval' | 'favorites';
