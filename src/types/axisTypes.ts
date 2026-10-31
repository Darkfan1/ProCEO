export type AxisTabId = 'today' | 'execution' | 'strategy' | 'people' | 'meetings' | 'theory';

// ─── SHARED PROTRACK ERP ENTITIES (READ / BRIDGE) ──────────────────────────
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

// ─── AXIS CEO EXECUTIVE ENTITIES ───────────────────────────────────────────

export type ScheduleRecurrence = 'ONCE' | 'DAILY' | 'WEEKDAYS' | 'WEEKLY';

export interface AxisScheduleItem {
  id: string;
  title: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD (cho ONCE hoặc ngày bắt đầu)
  recurrence: ScheduleRecurrence;
  weekday?: number; // 0-6 cho WEEKLY
  category: 'REMINDER' | 'ROUTINE' | 'MEETING' | 'DEEP_WORK';
  priority: 'HIGH' | 'NORMAL';
  note?: string;
  completedDates: string[]; // Danh sách YYYY-MM-DD đã hoàn thành
  notifiedKeys?: string[]; // Tránh bắn chuông trùng lặp trong cùng ngày
  createdAt: string;
}

export interface CheckinMilestone369 {
  stage: '1' | '2' | '3' | '6' | '9' | string;
  label: string;
  percent: number; // 30 | 60 | 90
  dueDate: string; // YYYY-MM-DD
  guidingQuestion: string;
  completed: boolean;
  note?: string;
  checkedAt?: string;
}

export interface AxisSmartTask {
  id: string;
  title: string;
  assigneeName: string;
  assigneeId?: string;
  department?: string;
  linkedLsxCode?: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: 'IN_PROGRESS' | 'COMPLETED' | 'AT_RISK';
  // 5 trụ cột SMART
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  // Lịch họp / check-in 3-6-9 tự động
  checkins: CheckinMilestone369[];
  sentToErp?: boolean;
  createdAt: string;
}

export interface AxisPdcaCycle {
  id: string;
  title: string;
  department: string;
  linkedLsxCode?: string;
  currentPhase: 'PLAN' | 'DO' | 'CHECK' | 'ACT' | 'STANDARDIZED';
  planRootCause: string;
  planSolution: string;
  doActions: string;
  doOwner: string;
  checkDate: string; // YYYY-MM-DD — Ngày nhắc CEO kiểm tra lại hiệu quả
  checkResult: string;
  actStandard: string;
  pushedToTraining?: boolean;
  createdAt: string;
}

export type ErpAutoMetricKey =
  | 'NONE'
  | 'ON_TIME_LSX_RATE'
  | 'COMPLETED_LSX_COUNT'
  | 'PROPOSAL_RESOLVED_RATE'
  | 'TRAINING_ACTIVE_COUNT';

export interface AxisKeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  autoMetric: ErpAutoMetricKey;
}

export interface AxisOkrObjective {
  id: string;
  period: string; // VD: "Q4/2026" hoặc "Tháng 11/2026"
  title: string;
  whyItMatters: string;
  status: 'ON_TRACK' | 'NEEDS_ATTENTION' | 'ACHIEVED';
  keyResults: AxisKeyResult[];
  createdAt: string;
}

export interface AxisSwotBoard {
  id: string;
  title: string;
  period: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  towsStrategies: {
    so: string; // Tận dụng S + O
    wo: string; // Khắc phục W để đón O
    st: string; // Dùng S đối phó T
    wt: string; // Phòng thủ W + T
  };
  updatedAtStr: string;
}

export type MaslowTierKey =
  | 'PHYSIOLOGICAL'
  | 'SAFETY'
  | 'BELONGING'
  | 'ESTEEM'
  | 'SELF_ACTUALIZATION';

export interface AxisMaslowSession {
  id: string;
  employeeName: string;
  employeeId?: string;
  department?: string;
  observedSymptoms: string;
  tierScores: Record<MaslowTierKey, number>; // 1 (Thiếu hụt nghiêm trọng) -> 5 (Đang đáp ứng tốt)
  bottleneckTier: MaslowTierKey;
  aiActionPlan: string;
  privateCeoNote: string;
  followUpDate?: string;
  createdAt: string;
}

export interface AxisFfcPraise {
  id: string;
  employeeName: string;
  employeeId?: string;
  feeling: string; // F - Cảm xúc chân thành của CEO
  fact: string;    // F - Sự thật / Hành vi / Con số cụ thể
  compare: string; // C - Sự tiến bộ hoặc tác động tích cực
  finalMessage: string;
  rewardAmount?: number;
  sentToErpAnnouncement?: boolean;
  sentToErpReward?: boolean;
  createdAt: string;
}

export interface AxisMeetingActionItem {
  id: string;
  taskTitle: string;
  assigneeName: string;
  dueDate: string;
  convertedToSmart?: boolean;
}

export interface AxisMeeting {
  id: string;
  title: string;
  meetingType: 'MEETING_369' | 'DAILY_BRIEF' | 'STRATEGY' | 'TRAINING' | 'ONE_ON_ONE';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  participants: string[];
  agenda: string;
  notes: string;
  actionItems: AxisMeetingActionItem[];
  status: 'UPCOMING' | 'COMPLETED';
  notifiedErp?: boolean;
  createdAt: string;
}

export interface AxisPrepDoc {
  id: string;
  title: string;
  contextType: 'DIRECTIVE' | 'SPEECH' | 'FEEDBACK' | 'PROPOSAL_REPLY';
  pointStart: string; // P - Kết luận / Thông điệp cốt lõi
  reason: string;     // R - Lý do / Căn cứ
  example: string;    // E - Dẫn chứng / Số liệu thực tế
  pointEnd: string;   // P - Khẳng định lại & Kêu gọi hành động
  polishedText: string;
  publishedToErp?: boolean;
  createdAt: string;
}

export interface AxisTrainingSession {
  id: string;
  topic: string;
  frameworkTag: 'SMART' | 'PDCA' | '3-6-9' | 'OKR' | 'PREP' | 'MASLOW' | 'FFC' | 'SWOT' | 'SKILL';
  targetAudience: string;
  scheduledDate: string;
  keyTakeaways: string[];
  practicalScenario: string;
  status: 'PLANNED' | 'COMPLETED';
  syncedToErpDocs?: boolean;
  createdAt: string;
}

