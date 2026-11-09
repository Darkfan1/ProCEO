import { FrameworkCode } from '../data/ceoMindsetData';

export type CeoTabId =
  | 'dashboard'
  | 'swot-tows'
  | 'okr'
  | 'smart'
  | 'tasks'
  | 'pdca'
  | 'meetings'
  | 'prep'
  | 'people'
  | 'copilot'
  | 'settings'
  | 'cockpit'
  | 'execution'
  | 'erp-bridge'
  | 'mindset-hub';

export type OperatingMode = 'PERSONAL' | 'ORGANIZATION';

export type StageThemeId = 'bento-glass' | 'aubergine-studio' | 'rose-stage' | 'grayscale-stage';

// ─── TẦNG 1: MISSION / NHIỆM VỤ CHIẾN LƯỢC CỦA CEO ────────────────────────
export interface CeoMission {
  id: string;
  title: string; // Vấn đề/Mục tiêu chiến lược, VD: "Cải thiện hiệu suất & chất lượng tổ in trong 30 ngày"
  timeframe: string; // "30 ngày", "Q4/2026", v.v.
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  driName: string; // Single DRI chịu trách nhiệm cao nhất
  status: 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED';
  progress: number; // 0 - 100
  prep: {
    point: string; // Point: Điểm cốt lõi ("Giảm 30% thời gian setup trong 30 ngày")
    reason: string; // Reason: Vì sao quan trọng ("Setup chậm làm giảm năng suất...")
    evidence: string; // Evidence: Dẫn chứng/Số liệu ("4 tuần gần nhất setup TB 60 phút...")
    action: string; // Action: Hành động & phân công ("Sản xuất là DRI; QA & Kỹ thuật phối hợp...")
    budgetOrAuthority?: string; // Ngân sách hoặc quyền hạn
    mainRisk?: string; // Rủi ro chính
  };
  linkedOkrIds?: string[];
  linkedInitiativeIds?: string[];
  createdAt: string;
}

// ─── TẦNG 2: OKR (MỤC TIÊU & KẾT QUẢ THEN CHỐT CÓ BASELINE/TARGET) ────────
export interface OkrKeyResult {
  id: string;
  title: string;
  startValue: number; // Baseline (Hiện trạng)
  baselineValue?: number; // Alias tiện dùng
  targetValue: number; // Target (Mục tiêu mong muốn)
  currentValue: number; // Tiến độ thực tế hiện tại
  unit: string; // Đơn vị: Phút, %, số lỗi, tỷ lệ OTD, chi phí, số lô
  driName?: string; // Single DRI phụ trách KR này
  linkedErpMetric?: 'ON_TIME_LSX_RATE' | 'COMPLETED_LSX_COUNT' | 'TODAY_OUTPUT' | 'MANUAL';
  linkedInitiativeIds?: string[];
  lastCheckedAt?: string;
}

export interface OkrObjective {
  id: string;
  missionId?: string; // Liên kết tới Mission tầng 1
  quarter: string; // VD: "Q4/2026"
  title: string; // Hướng muốn đạt, VD: "Cải thiện hiệu suất vận hành dây chuyền"
  department: string;
  ownerName: string; // DRI chịu trách nhiệm Objective
  priority: 'P0' | 'P1' | 'P2';
  keyResults: OkrKeyResult[];
  createdAt: string;
}

// ─── TẦNG 3: INITIATIVE / DỰ ÁN LỚN (GẮN CHU TRÌNH PDCA) ──────────────────
export type InitiativePdcaPhase = 'PLAN' | 'DO' | 'CHECK' | 'ACT' | 'STANDARDIZED';
export type InitiativeStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'CHECKING'
  | 'ACTION_REQUIRED'
  | 'STANDARDIZED'
  | 'CLOSED';

export interface CeoInitiative {
  id: string;
  missionId?: string; // Thuộc Mission nào
  linkedOkrId?: string; // Thuộc Objective nào
  linkedKrId?: string; // Đóng góp trực tiếp cho KR nào
  title: string; // Tên dự án lớn, VD: "Triển khai SMED cho 3 dòng in Flexo"
  hypothesis?: string; // Giả thuyết giải pháp
  driName: string; // 1 DRI duy nhất chịu trách nhiệm dự án
  targetDate: string; // YYYY-MM-DD
  status: InitiativeStatus;
  pdcaPhase: InitiativePdcaPhase;
  planContent?: string;
  doContent?: string;
  checkContent?: string;
  actContent?: string;
  taskIds?: string[];
  createdAt: string;
}

// ─── TẦNG 4: TASK / HÀNH ĐỘNG CỤ THỂ (1 DRI DUY NHẤT + RACI + BLOCKER) ────
export type SmartDomain =
  | 'PRODUCTION'
  | 'SALES'
  | 'FINANCE'
  | 'QUALITY'
  | 'HR'
  | 'SUPPLY_CHAIN'
  | 'MANAGEMENT';

export interface SmartCriteria {
  specific: string; // S - Cụ thể, rõ ràng
  measurable: string; // M - Đo lường được bằng con số
  achievable: string; // A - Khả thi, nguồn lực thực hiện
  relevant: string; // R - Liên quan mục tiêu chung / OKR
  timeBound: string; // T - Thời hạn hoàn thành rõ ràng
}

export interface TaskEvidence {
  id: string;
  type: 'IMAGE' | 'DATA' | 'FILE' | 'NOTE';
  title: string;
  content?: string;
  url?: string;
  submittedBy: string;
  createdAt: string;
}

export interface SmartTask {
  id: string;
  missionId?: string; // Liên kết tầng 1: Mission
  initiativeId?: string; // Liên kết tầng 3: Initiative
  linkedOkrId?: string; // Liên kết tầng 2: OKR
  linkedKrId?: string; // Liên kết KR cụ thể
  taskType?: 'SMART_GOAL' | 'DRI_ACTION';
  title: string;
  department: string;
  domain?: SmartDomain;
  // SINGLE DRI: Người chịu trách nhiệm kết quả cuối cùng (Bắt buộc duy nhất 1 người)
  assigneeName: string;
  assigneeRole?: string;
  // RACI MATRIX
  approverName?: string; // A - Người phê duyệt / nghiệm thu đầu ra
  supporters?: string[]; // S/R - Người phối hợp thực hiện / cung cấp đầu vào
  consulted?: string[]; // C - Người cần hỏi ý kiến tham vấn
  informed?: string[]; // I - Người cần nhận thông tin tiến độ
  // XÁC NHẬN NHẬN VIỆC TRONG 24H
  driConfirmed?: boolean;
  driConfirmedAt?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
  progress: number; // 0 - 100
  smart: SmartCriteria;
  smartScore: number; // 0 - 100
  // CƠ CHẾ ĐIỂM NGHẼN & ESCALATE TO CEO
  blockerReason?: string; // Đang chặn ở đâu
  blockerDecisionNeeded?: string; // Ai cần quyết định gì
  escalatedToCeo?: boolean; // Đã leo thang lên CEO
  escalatedAt?: string;
  // BẰNG CHỨNG ĐẦU RA (EVIDENCE)
  evidences?: TaskEvidence[];
  linkedLsxCode?: string;
  followUpCount: number; // Số lần CEO đã đôn đốc
  lastFollowUpAt?: string;
  isPushedToErp?: boolean;
  pushedToErpAt?: string;
  createdAt: string;
}

export function isDriActionTask(task: SmartTask): boolean {
  if (task.taskType === 'DRI_ACTION') return true;
  if (task.taskType === 'SMART_GOAL') return false;
  return (
    task.id.startsWith('task-') ||
    task.id.startsWith('dri-') ||
    task.id.startsWith('sample-dri-')
  );
}

// ─── 5. ANDON SỐ & XỬ LÝ SỰ CỐ NHÀ MÁY (ISSUE & ACTION BOARD) ─────────────
export type AndonCategory =
  | 'SETUP_DELAY' // Setup chậm
  | 'QUALITY_DEFECT' // Lỗi chất lượng
  | 'MISSING_MATERIAL' // Thiếu vật tư / màng / dao
  | 'MACHINE_STOP' // Máy dừng / sự cố cơ khí
  | 'SAFETY' // An toàn lao động
  | 'OTHER';

export type AndonSeverity = 'MINOR' | 'CRITICAL' | 'LINE_STOP'; // Nhẹ | Nghiêm trọng | Dừng dây chuyền

export type AndonStatus =
  | 'REPORTED' // Vừa báo cáo, chờ phân loại
  | 'TRIAGING' // Đang xác định mức độ & DRI
  | 'RCA' // Đang phân tích 5 Whys / Fishbone
  | 'ACTION_IN_PROGRESS' // Đang xử lý hành động khắc phục
  | 'VERIFICATION' // Đang kiểm chứng hiệu quả sau 1-2 tuần
  | 'CLOSED_STANDARDIZED'; // Đã xử lý & đóng gói vào SOP

export interface AndonIssue {
  id: string;
  issueCode: string; // VD: ANDON-20261109-01
  category: AndonCategory;
  severity: AndonSeverity;
  lineOrMachine: string; // Dây chuyền / máy (Flexo 01, Máy bế 02, v.v.)
  productOrLsxCode?: string; // LSX liên quan
  shift?: string; // Ca 1, Ca 2
  stage?: string; // Công đoạn (In, Bế, Chia cuộn, KCS)
  imageUrl?: string;
  videoUrl?: string;
  description: string;
  reportedBy: string;
  detectedAt: string; // Thời điểm phát hiện
  driName: string; // Single DRI chịu trách nhiệm xử lý
  status: AndonStatus;
  correctiveActionTaskId?: string; // Task hành động khắc phục sinh ra
  correctiveActionTitle?: string;
  correctiveActionDueDate?: string;
  fiveWhys?: string[]; // 5 câu hỏi Tại sao
  preventiveAction?: string; // Hành động ngăn ngừa tái diễn
  verifiedAt?: string;
  sopUpdatedCode?: string; // Mã SOP đã cập nhật
  createdAt: string;
}

// ─── 6. HỘP QUYẾT ĐỊNH CẦN CEO HÔM NAY (DECISION BOX) ──────────────────────
export interface CeoDecisionItem {
  id: string;
  type: 'BLOCKED_TASK' | 'ERP_PROPOSAL' | 'ANDON_ESCALATION' | 'RESOURCE_REQUEST';
  title: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  decisionNeeded: string; // Quyết định mong muốn
  urgency: 'URGENT' | 'HIGH' | 'NORMAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DIRECTED';
  linkedEntityId?: string;
  resolutionNote?: string;
  resolvedAt?: string;
}

// ─── 7. LỊCH TRÌNH & ĐIỀU HÀNH HÀNG NGÀY ────────────────────────────────────
export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  date: string; // YYYY-MM-DD
  repeat: 'ONCE' | 'DAILY' | 'WEEKDAYS' | 'WEEKLY';
  category: 'MEETING_369' | 'ERP_REVIEW' | 'STRATEGY_OKR' | 'COACHING_MASLOW' | 'DEEP_WORK' | 'PERSONAL';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  remindMinutesBefore: number;
  linkedPerson?: string;
  linkedLsxCode?: string;
  notes?: string;
  completedDates: string[]; // Danh sách YYYY-MM-DD đã hoàn thành
  createdAt: string;
}

// ─── 8. CHU TRÌNH PDCA CẢI TIẾN LIÊN TỤC ──────────────────────────────────
export type PdcaPhase = 'PLAN' | 'DO' | 'CHECK' | 'ACT' | 'STANDARDIZED';

export interface PdcaCycle {
  id: string;
  missionId?: string;
  initiativeId?: string;
  title: string;
  area: 'PRODUCTION' | 'QUALITY' | 'DELIVERY' | 'HR_CULTURE' | 'COST_CONTROL' | 'MANAGEMENT';
  ownerName: string;
  phase: PdcaPhase;
  planProblem: string;
  doExperiment: string;
  checkEvaluation: string;
  actStandardize: string;
  metricBaseline: string;
  metricTarget: string;
  metricActual: string;
  dueDate: string;
  linkedSmartTaskId?: string;
  linkedLsxCode?: string;
  iteration: number;
  sopStandardizedTitle?: string;
  sopStandardizedCode?: string;
  evaluationSummary?: string;
  evaluationStatus?: 'PENDING' | 'ACHIEVED' | 'ADJUST_NEXT_ITERATION';
  evaluatedAt?: string;
  createdAt: string;
}

// ─── 9. HỌP THEO NGUYÊN TẮC 3-6-9 ──────────────────────────────────────────
export interface MeetingActionItem {
  id: string;
  taskTitle: string;
  assigneeName: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  supervisedCount: number;
  lastSupervisedAt?: string;
  convertedToSmartTaskId?: string;
}

export interface Meeting369 {
  id: string;
  title: string;
  topic: string;
  objective: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  location?: string;
  chairperson: string;
  participants: string[];
  preReadDocs: string;
  meetingRules: string;
  agendaFlow: string[];
  decisionsSummary: string;
  sixStepsCompleted: boolean[];
  ninePrinciplesChecked: boolean[];
  actionItems: MeetingActionItem[];
  improvementNote?: string;
  linkedPdcaId?: string;
  linkedSmartTaskId?: string;
  aiAdvisorNote?: string;
  summonSentAt?: string;
  minutesPublishedAt?: string;
  status: 'SCHEDULED' | 'IN_SESSION' | 'FOLLOW_UP' | 'CLOSED';
  createdAt: string;
}

// ─── 10. TRUYỀN THÔNG PREP (POINT - REASON - EVIDENCE - POINT) ─────────────
export interface PrepMessage {
  id: string;
  title: string;
  audience: string;
  category: 'DIRECTIVE' | 'ALIGNMENT' | 'POLICY' | 'MOTIVATION';
  pointOpening: string;
  reasonWhy: string;
  exampleEvidence: string;
  pointClosing: string;
  publishedToErp: boolean;
  createdAt: string;
}

// ─── 11. THÁP MASLOW & FFC ────────────────────────────────────────────────
export type MaslowLevelNumber = 1 | 2 | 3 | 4 | 5;

export interface MaslowEmployeePlan {
  id: string;
  employeeName: string;
  department: string;
  role: string;
  dominantNeedLevel: MaslowLevelNumber;
  satisfactionScores: {
    level1Physiological: number;
    level2Safety: number;
    level3Belonging: number;
    level4Esteem: number;
    level5SelfActualization: number;
  };
  currentObservation: string;
  motivationAction: string;
  nextCheckInDate: string;
  createdAt: string;
}

export interface FfcPraiseRecord {
  id: string;
  recipientName: string;
  department: string;
  feeling: string;
  fact: string;
  compare: string;
  linkedLsxCode?: string;
  sentToErp: boolean;
  createdAt: string;
}

// ─── 12. PHÂN TÍCH SWOT & TOWS ────────────────────────────────────────────
export interface SwotEntry {
  id: string;
  type: 'S' | 'W' | 'O' | 'T';
  content: string;
  impact: 'HIGH' | 'MEDIUM';
}

export interface TowsStrategicAction {
  id: string;
  strategyType: 'SO' | 'WO' | 'ST' | 'WT';
  actionTitle: string;
  ownerName: string;
  dueDate: string;
  status: 'PLANNED' | 'EXECUTING' | 'DONE';
}

export interface SwotBoard {
  id: string;
  title: string;
  period: string;
  focusDomain: string;
  entries: SwotEntry[];
  towsActions: TowsStrategicAction[];
  updatedAt: string;
}

// ─── 13. INTENT ĐIỀU HƯỚNG LIÊN PHÂN HỆ ────────────────────────────────────
export interface NavigationContextIntent {
  tab: CeoTabId;
  subView?: string;
  prefillTitle?: string;
  prefillAssignee?: string;
  prefillLsxCode?: string;
  prefillDescription?: string;
  prefillOkrId?: string;
  prefillAudience?: string;
  prefillSmartTask?: SmartTask;
  prefillPdcaCycle?: PdcaCycle;
  frameworkCode?: FrameworkCode;
  timestamp: number;
}
