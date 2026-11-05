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
  status?: string;
  phone?: string;
  avatarUrl?: string;
  joinDate?: string;
  startDate?: string;
  skills?: string[];
  idNumber?: string;
  personality?: string;
  strengths?: string;
  weaknesses?: string;
  active?: boolean;
}

export interface ErpStaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status?: string;
  phone?: string;
  avatarUrl?: string;
  skills?: string[];
}

export interface ErpLsxItem {
  name: string;
  quantity: number;
  unit?: string;
  material?: string;
  coating?: string;
  finishedForm?: string;
  deliveryDate?: string;
  size?: string;
  itemsPerPrintSheet?: number;
  itemsPerDieCutSheet?: number;
  note?: string;
}

export interface ErpLsxOrder {
  id: string;
  originalId?: string;
  lsxCode?: string;
  orderCode?: string;
  customer?: string;
  issueDate?: string;
  deliveryDate?: string;
  productCode?: string;
  productType?: string;
  size?: string;
  items?: ErpLsxItem[];
  materialCode?: string;
  paperWidth?: string;
  neededMeters?: number;
  coating?: string;
  finishedForm?: string;
  materialStatus?: string;
  progress?: string; // 'Chưa xử lý' | 'Đã in' | 'Đã bế' | 'Đã kiểm tem' | 'Đã xẻ cuộn' | 'Đã đóng gói'
  isMoved?: boolean;
  deliveryStatus?: 'NOT_DELIVERED' | 'PARTIALLY_DELIVERED' | 'FULLY_DELIVERED';
  isCancelled?: boolean;
  isDeleted?: boolean;
  designerName?: string;
  operatorIn?: string;
  operatorBe?: string;
  operatorXe?: string;
  operatorPack?: string;
  notes?: string;
  orderNotes?: string;
  intakeId?: string;
  // Legacy / shortcut fields
  itemName?: string;
  quantity?: number;
  unit?: string;
  status?: string;
  updatedAt?: any;
  createdAt?: string;
  timestamp?: string;
}

export interface ErpOrderIntake {
  id: string;
  orderCode?: string;
  orderDate?: string;
  customer?: string;
  deliveryDate?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit?: string;
    size?: string;
    material?: string;
  }>;
  status?: string; // 'Chờ xử lý' (PENDING) | 'Đã ra LSX' (READY_FOR_LSX)
  notes?: string;
  createdBy?: string;
  orderType?: string;
  isDeleted?: boolean;
  createdAt?: string;
  timestamp?: string;
}

export interface ErpMachine {
  id: string;
  name: string;
  type: 'IN' | 'BE' | 'XE' | 'PACK';
  subType?: 'XE' | 'KIEM';
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  operatorName?: string;
  assistantName?: string;
  runningLsxId?: string;
  runningLsxCode?: string;
  runningStage?: string;
  runningStartedAt?: string;
  runningOperatorName?: string;
}

export interface ErpStageReport {
  id: string;
  lsxId?: string;
  lsxCode?: string;
  customer?: string;
  productName?: string;
  stage?: string;
  workerName?: string;
  operatorName?: string;
  assistantName?: string;
  machineId?: string;
  finishedQty?: number;
  finishedNhip?: number;
  finishedCuon?: number;
  defectQty?: number;
  qtyHao?: number;
  defectMeters?: number;
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

