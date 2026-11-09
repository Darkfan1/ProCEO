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

// ─── 1. NHẮC LỊCH HÀNG NGÀY (DAILY SCHEDULE & REMINDER) ─────────────────────
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

// ─── 2. NGUYÊN TẮC SMART (QUẢN LÝ THIẾT LẬP MỤC TIÊU & NHẮC VIỆC) ───────────
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

export interface SmartTask {
  id: string;
  taskType?: 'SMART_GOAL' | 'DRI_ACTION'; // Phân tách Mục tiêu định lượng SMART vs Tác vụ vận hành DRI
  title: string;
  department: string;
  domain?: SmartDomain;
  assigneeName: string;
  assigneeRole?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  progress: number; // 0 - 100
  smart: SmartCriteria;
  smartScore: number; // 0 - 100 (tính từ 5 tiêu chí SMART)
  linkedLsxCode?: string;
  linkedOkrId?: string;
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

// ─── 3. CHU TRÌNH PDCA (NÂNG CAO NĂNG LỰC QUẢN TRỊ LIÊN TỤC) ────────────────
export type PdcaPhase = 'PLAN' | 'DO' | 'CHECK' | 'ACT' | 'STANDARDIZED';

export interface PdcaCycle {
  id: string;
  title: string;
  area: 'PRODUCTION' | 'QUALITY' | 'DELIVERY' | 'HR_CULTURE' | 'COST_CONTROL' | 'MANAGEMENT';
  ownerName: string;
  phase: PdcaPhase;
  planProblem: string; // P: Vấn đề & Nguyên nhân gốc rễ + Mục tiêu cải tiến
  doExperiment: string; // D: Giải pháp thực thi thử nghiệm
  checkEvaluation: string; // C: Kiểm tra, đo lường kết quả thực tế so với kế hoạch (gắn với Họp 3-6-9)
  actStandardize: string; // A: Chuẩn hóa quy trình (SOP) hoặc điều chỉnh vòng mới
  metricBaseline: string; // Chỉ số trước cải tiến
  metricTarget: string; // Chỉ số mục tiêu
  metricActual: string; // Chỉ số đạt được thực tế
  dueDate: string; // YYYY-MM-DD
  linkedSmartTaskId?: string; // Liên kết Mục tiêu SMART gốc (SMART -> PDCA)
  linkedLsxCode?: string;
  iteration: number; // Vòng lặp thứ mấy
  sopStandardizedTitle?: string; // Tên chuẩn hóa SOP (khi kết thúc ở Pha Act/Standardized)
  sopStandardizedCode?: string; // Mã SOP
  evaluationSummary?: string; // Báo cáo & Đánh giá hiệu quả kết thúc vòng lặp
  evaluationStatus?: 'PENDING' | 'ACHIEVED' | 'ADJUST_NEXT_ITERATION';
  evaluatedAt?: string;
  createdAt: string;
}

// ─── 4. HỌP THEO NGUYÊN TẮC 3-6-9 ──────────────────────────────────────────
export interface MeetingActionItem {
  id: string;
  taskTitle: string;
  assigneeName: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  supervisedCount: number; // Số lần giám sát/đôn đốc (Công thức 2 & 3)
  lastSupervisedAt?: string;
  convertedToSmartTaskId?: string;
}

export interface Meeting369 {
  id: string;
  title: string;
  topic: string; // Bước 2: Chủ đề cuộc họp rõ ràng
  objective: string; // Nguyên tắc 1: Mục tiêu cuộc họp
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  location?: string; // Địa điểm họp trực tiếp (VD: Phòng họp BGĐ, Văn phòng Xưởng In)
  chairperson: string;
  participants: string[]; // Nguyên tắc 2: Chọn đúng người tham dự
  preReadDocs: string; // Bước 1 & Nguyên tắc 3: Chuẩn bị tài liệu trước
  meetingRules: string; // Bước 3: Thiết lập quy tắc họp
  agendaFlow: string[]; // Bước 4: Sắp xếp quy trình cuộc họp
  decisionsSummary: string; // Nguyên tắc 6 & 7: Quyết định & Biên bản tổng kết rõ ràng
  sixStepsCompleted: boolean[]; // 6 bước tổ chức cuộc họp (mảng 6 phần tử)
  ninePrinciplesChecked: boolean[]; // 9 nguyên tắc bắt buộc (mảng 9 phần tử)
  actionItems: MeetingActionItem[]; // Bước 5 & 6: Theo dõi kết quả & Kiểm tra tiến độ
  improvementNote?: string; // Nguyên tắc 9: Đánh giá và cải tiến quy trình họp
  linkedPdcaId?: string; // Liên kết với Chu trình PDCA (Họp 3-6-9 phục vụ giám sát/đôn đốc pha Check của PDCA)
  linkedSmartTaskId?: string; // Liên kết với Mục tiêu SMART gốc
  aiAdvisorNote?: string; // Ghi chú cố vấn điều hành từ AI cho Chủ tọa (CEO)
  summonSentAt?: string; // Thời điểm đã gửi Lệnh triệu tập & Yêu cầu chuẩn bị qua ERP
  minutesPublishedAt?: string; // Thời điểm đã ban hành Biên bản & Nghị quyết cuộc họp qua ERP
  status: 'SCHEDULED' | 'IN_SESSION' | 'FOLLOW_UP' | 'CLOSED';
  createdAt: string;
}

// ─── 5. CÔNG CỤ OKR (TẬP TRUNG MỤC TIÊU, THÚC ĐẨY HÀNH ĐỘNG) ──────────────
export interface OkrKeyResult {
  id: string;
  title: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  linkedErpMetric?: 'ON_TIME_LSX_RATE' | 'COMPLETED_LSX_COUNT' | 'TODAY_OUTPUT' | 'MANUAL';
}

export interface OkrObjective {
  id: string;
  quarter: string; // VD: "Q4/2026"
  title: string;
  department: string;
  ownerName: string;
  priority: 'P0' | 'P1' | 'P2';
  keyResults: OkrKeyResult[];
  createdAt: string;
}

// ─── 6. TRUYỀN THÔNG - DIỄN ĐẠT PREP (POINT - REASON - EXAMPLE - POINT) ────
export interface PrepMessage {
  id: string;
  title: string;
  audience: string; // Toàn công ty / Xưởng sản xuất / Khối văn phòng / Cá nhân
  category: 'DIRECTIVE' | 'ALIGNMENT' | 'POLICY' | 'MOTIVATION';
  pointOpening: string; // P1: Kết luận / Thông điệp cốt lõi mở đầu
  reasonWhy: string; // R: Lý do / Căn cứ tại sao cần thực hiện
  exampleEvidence: string; // E: Ví dụ cụ thể / Số liệu dẫn chứng thực tế
  pointClosing: string; // P2: Khẳng định lại thông điệp & Hành động tiếp theo
  publishedToErp: boolean;
  createdAt: string;
}

// ─── 7. THÁP MASLOW (TẠO ĐỘNG LỰC CHO NHÂN VIÊN) ───────────────────────────
export type MaslowLevelNumber = 1 | 2 | 3 | 4 | 5;

export interface MaslowEmployeePlan {
  id: string;
  employeeName: string;
  department: string;
  role: string;
  dominantNeedLevel: MaslowLevelNumber; // 1: Sinh lý, 2: An toàn, 3: Xã hội, 4: Tôn trọng, 5: Tự thể hiện
  satisfactionScores: {
    level1Physiological: number; // 1-10
    level2Safety: number; // 1-10
    level3Belonging: number; // 1-10
    level4Esteem: number; // 1-10
    level5SelfActualization: number; // 1-10
  };
  currentObservation: string; // Biểu hiện / Tâm tư hiện tại của nhân viên
  motivationAction: string; // Hành động tạo động lực cụ thể của CEO
  nextCheckInDate: string; // YYYY-MM-DD
  createdAt: string;
}

// ─── 8. NGUYÊN TẮC KHEN NGỢI FFC (FEELING - FACT - COMPARE) ────────────────
export interface FfcPraiseRecord {
  id: string;
  recipientName: string;
  department: string;
  feeling: string; // F1: Cảm xúc chân thành của người lãnh đạo
  fact: string; // F2: Sự thật / Hành vi / Con số cụ thể nhân viên đã đạt được
  compare: string; // C: So sánh với trước đây / với mục tiêu hoặc giá trị lan tỏa
  linkedLsxCode?: string;
  sentToErp: boolean;
  createdAt: string;
}

// ─── 9. PHÂN TÍCH SWOT (QUẢN TRỊ CHIẾN LƯỢC CẠNH TRANH) ────────────────────
export interface SwotEntry {
  id: string;
  type: 'S' | 'W' | 'O' | 'T';
  content: string;
  impact: 'HIGH' | 'MEDIUM';
}

export interface TowsStrategicAction {
  id: string;
  strategyType: 'SO' | 'WO' | 'ST' | 'WT'; // SO: Phát huy S chớp O, WO: Khắc phục W bằng O, ST: Dùng S vượt T, WT: Phòng thủ giảm W tránh T
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
