// ─── PROTRACK ERP (MVĐN) ENTITY TYPES ───────────────────────────────────────
// Kết nối trực tiếp cơ sở dữ liệu Firebase Cloud của ProTrack ERP (mvdn-59215)

export interface ErpUser {
  id: string;
  uid?: string;
  username?: string;
  email: string;
  name: string;
  role: string;
  department?: string;
}

export interface ErpPersonnel {
  id: string;
  fullName?: string;
  name?: string;
  department?: string;
  position?: string;
  role?: string;
  phone?: string;
  startDate?: string;
}

export interface ErpLsxOrder {
  id: string;
  lsxCode?: string;
  orderCode?: string;
  customer?: string;
  itemName?: string;
  quantity?: number;
  unit?: string;
  deliveryDate?: string;
  status?: string;
  progress?: string;
  productType?: string;
  isDeleted?: boolean;
  updatedAt?: any;
}

export interface ErpStageReport {
  id: string;
  lsxId?: string;
  lsxCode?: string;
  stage?: string;
  workerName?: string;
  machineId?: string;
  finishedQty?: number;
  isPause?: boolean;
  note?: string;
  timestamp?: string;
  startTime?: string;
  endTime?: string;
  isDeleted?: boolean;
}

export interface ErpProposal {
  id: string;
  title: string;
  category: string;
  requestedBy: string;
  requestedById?: string;
  date: string;
  formData?: Record<string, any>;
  finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEED_INFO';
  documentNo?: string;
  approvalComment?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedById?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface ErpLeaveRequest {
  id: string;
  employeeId?: string;
  employeeName: string;
  leaveType?: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason?: string;
  status: string;
}

export interface ErpOvertimeSchedule {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  taskDescription?: string;
  lsxCode?: string;
  workerDetails?: Array<{
    id?: string;
    name: string;
    hours?: number;
    actualHours?: number;
  }>;
}

export interface ErpRewardRecord {
  id: string;
  targetName: string;
  targetId?: string;
  reason?: string;
  description?: string;
  amount?: number;
  status: string;
  date: string;
}

export interface ErpDisciplineRecord {
  id: string;
  targetName: string;
  targetId?: string;
  description?: string;
  severity?: string;
  status: string;
  date: string;
}

export interface ErpTrainingPlan {
  id: string;
  skillName: string;
  traineeName?: string;
  mentorName?: string;
  department?: string;
  status: string;
  createdAt?: string;
}

export interface ErpNotification {
  id: string;
  title: string;
  content: string;
  type?: string;
  targetRoles?: string[];
  targetUser?: string;
  readBy?: string[];
  createdAt: string;
  createdBy: string;
  actionType?: string;
  tag?: string;
}

export interface ErpAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'DIRECTIVE' | 'REMINDER' | 'PRAISE' | 'ANNOUNCEMENT';
  targetType: 'ALL' | 'DEPARTMENTS' | 'INDIVIDUAL';
  targetValue: string;
  requireAck?: boolean;
  publishedBy: string;
  publishedAt: string;
  docType: 'ANNOUNCEMENT';
}
