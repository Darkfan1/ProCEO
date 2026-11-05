import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { removeUndefinedDeep } from './erpService';
import { addLocalDaysYmd, getLocalTodayYmd } from '../utils/dateUtils';
import {
  ScheduleItem,
  SmartTask,
  SmartCriteria,
  PdcaCycle,
  Meeting369,
  OkrObjective,
  PrepMessage,
  MaslowEmployeePlan,
  MaslowLevelNumber,
  FfcPraiseRecord,
  SwotBoard,
  SwotEntry,
  TowsStrategicAction,
} from '../types/ceoTypes';

export function computeSmartScore(smart?: Partial<SmartCriteria> | null): number {
  if (!smart) return 0;
  let score = 0;
  if (smart.specific && smart.specific.trim().length >= 8) score += 20;
  if (smart.measurable && (/\d/.test(smart.measurable) || smart.measurable.trim().length >= 6)) score += 20;
  if (smart.achievable && smart.achievable.trim().length >= 6) score += 20;
  if (smart.relevant && smart.relevant.trim().length >= 6) score += 20;
  if (smart.timeBound && smart.timeBound.trim().length >= 4) score += 20;
  return score;
}

const today = getLocalTodayYmd();

// ─── DANH SÁCH ID MẪU CẦN XÓA BỎ VĨNH VIỄN KHỎI HỆ THỐNG ──────────────────────
export const DEMO_IDS = new Set<string>([
  'sched-1',
  'sched-2',
  'sched-3',
  'sched-4',
  'sched-5',
  'smart-1',
  'smart-2',
  'smart-3',
  'pdca-1',
  'pdca-2',
  'meet-1',
  'okr-1',
  'okr-2',
  'swot-1',
  'prep-1',
  'maslow-1',
  'maslow-2',
  'ffc-1',
]);

// ─── KHÔNG SỬ DỤNG DỮ LIỆU VÍ DỤ ẢO: DỮ LIỆU ĐƯỢC KẾT NỐI VÀ NHẬP THẬT TỪ ERP ──
export const INITIAL_SCHEDULES: ScheduleItem[] = [];
export const INITIAL_SMART_TASKS: SmartTask[] = [];
export const INITIAL_PDCA_CYCLES: PdcaCycle[] = [];
export const INITIAL_MEETINGS_369: Meeting369[] = [];
export const INITIAL_OKRS: OkrObjective[] = [];
export const INITIAL_SWOT_BOARDS: SwotBoard[] = [];
export const INITIAL_MASLOW_PLANS: MaslowEmployeePlan[] = [];
export const INITIAL_FFC_PRAISES: FfcPraiseRecord[] = [];
export const INITIAL_PREP_MESSAGES: PrepMessage[] = [];

// ─── BỘ CHUẨN HÓA DỮ LIỆU TƯƠNG THÍCH NGƯỢC VỚI BẢN GHI FIRESTORE CŨ (`axis_*`) ─
function normalizeDocument(collectionName: string, raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;

  if (collectionName.includes('schedules')) {
    const startTime = String(raw.startTime || raw.time || '08:30');
    return {
      ...raw,
      id: String(raw.id || `sched-${Date.now()}`),
      title: String(raw.title || 'Lịch trình điều hành'),
      startTime,
      endTime: String(raw.endTime || '09:00'),
      date: String(raw.date || today),
      repeat: raw.repeat || raw.recurrence || 'DAILY',
      category: raw.category || 'MEETING_369',
      priority: raw.priority || 'HIGH',
      remindMinutesBefore: Number(raw.remindMinutesBefore ?? 10),
      notes: String(raw.notes || raw.note || ''),
      completedDates: Array.isArray(raw.completedDates) ? raw.completedDates : [],
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies ScheduleItem;
  }

  if (collectionName.includes('tasks')) {
    const smart: SmartCriteria = {
      specific: String(raw.smart?.specific || raw.specific || raw.title || 'Thực hiện nhiệm vụ cụ thể'),
      measurable: String(
        raw.smart?.measurable || raw.measurable || 'Hoàn thành 100% khối lượng đạt chuẩn chất lượng'
      ),
      achievable: String(raw.smart?.achievable || raw.achievable || 'Nguồn lực nội bộ MVĐN'),
      relevant: String(raw.smart?.relevant || raw.relevant || 'Đảm bảo mục tiêu tiến độ & chất lượng'),
      timeBound: String(raw.smart?.timeBound || raw.timeBound || raw.dueDate || today),
    };
    const isCompleted = raw.status === 'DONE' || raw.status === 'COMPLETED';
    return {
      ...raw,
      id: String(raw.id || `smart-${Date.now()}`),
      title: String(raw.title || 'Nhiệm vụ SMART'),
      department: String(raw.department || 'Sản xuất'),
      assigneeName: String(raw.assigneeName || 'Quản đốc Sản xuất'),
      dueDate: String(raw.dueDate || today),
      priority: raw.priority || 'HIGH',
      status: isCompleted ? 'DONE' : 'IN_PROGRESS',
      progress: typeof raw.progress === 'number' ? raw.progress : isCompleted ? 100 : 50,
      smart,
      smartScore: typeof raw.smartScore === 'number' ? raw.smartScore : computeSmartScore(smart),
      followUpCount: Number(raw.followUpCount || 0),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies SmartTask;
  }

  if (collectionName.includes('pdca')) {
    return {
      ...raw,
      id: String(raw.id || `pdca-${Date.now()}`),
      title: String(raw.title || 'Chu trình cải tiến PDCA'),
      area: raw.area || 'PRODUCTION',
      ownerName: String(raw.ownerName || raw.doOwner || 'Quản đốc Sản xuất'),
      phase: raw.phase || raw.currentPhase || 'PLAN',
      planProblem: String(raw.planProblem || raw.planRootCause || 'Xác định nguyên nhân gốc rễ'),
      doExperiment: String(raw.doExperiment || raw.doActions || raw.planSolution || 'Thử nghiệm giải pháp'),
      checkEvaluation: String(raw.checkEvaluation || raw.checkResult || 'Đo lường kết quả thực tế'),
      actStandardize: String(raw.actStandardize || raw.actStandard || 'Chuẩn hóa quy trình SOP'),
      metricBaseline: String(raw.metricBaseline || 'Trước cải tiến'),
      metricTarget: String(raw.metricTarget || 'Mục tiêu'),
      metricActual: String(raw.metricActual || 'Đang đo lường'),
      dueDate: String(raw.dueDate || raw.checkDate || today),
      iteration: Number(raw.iteration || 1),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies PdcaCycle;
  }

  if (collectionName.includes('meetings')) {
    const rawActions = Array.isArray(raw.actionItems) ? raw.actionItems : [];
    return {
      ...raw,
      id: String(raw.id || `meet-${Date.now()}`),
      title: String(raw.title || 'Cuộc họp điều hành 3-6-9'),
      topic: String(raw.topic || raw.agenda || raw.title || ''),
      objective: String(raw.objective || 'Ra quyết định & thống nhất hành động ngay trong cuộc họp'),
      date: String(raw.date || today),
      startTime: String(raw.startTime || raw.time || '08:30'),
      durationMinutes: Number(raw.durationMinutes || 30),
      chairperson: String(raw.chairperson || 'CEO / Giám Đốc Điều Hành'),
      participants: Array.isArray(raw.participants) ? raw.participants : ['Ban Giám Đốc'],
      preReadDocs: String(raw.preReadDocs || 'Dữ liệu ERP ProTrack'),
      meetingRules: String(raw.meetingRules || 'Đúng giờ • Trọng tâm • Quyết định rõ ràng'),
      agendaFlow: Array.isArray(raw.agendaFlow) ? raw.agendaFlow : [],
      decisionsSummary: String(raw.decisionsSummary || raw.notes || ''),
      sixStepsCompleted:
        Array.isArray(raw.sixStepsCompleted) && raw.sixStepsCompleted.length === 6
          ? raw.sixStepsCompleted
          : [true, true, true, true, false, false],
      ninePrinciplesChecked:
        Array.isArray(raw.ninePrinciplesChecked) && raw.ninePrinciplesChecked.length === 9
          ? raw.ninePrinciplesChecked
          : [true, true, true, true, true, true, false, false, false],
      actionItems: rawActions.map((a: any, idx: number) => ({
        id: String(a?.id || `act-${idx}`),
        taskTitle: String(a?.taskTitle || 'Nhiệm vụ sau họp'),
        assigneeName: String(a?.assigneeName || 'Quản đốc Sản xuất'),
        dueDate: String(a?.dueDate || today),
        status: a?.status || (a?.completed ? 'COMPLETED' : 'PENDING'),
        supervisedCount: Number(a?.supervisedCount || 0),
      })),
      status: raw.status || 'FOLLOW_UP',
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies Meeting369;
  }

  if (collectionName.includes('okrs')) {
    const rawKrs = Array.isArray(raw.keyResults) ? raw.keyResults : [];
    return {
      ...raw,
      id: String(raw.id || `okr-${Date.now()}`),
      quarter: String(raw.quarter || raw.period || 'Q4/2026'),
      title: String(raw.title || 'Mục tiêu OKR'),
      department: String(raw.department || 'Toàn Công Ty MVĐN'),
      ownerName: String(raw.ownerName || 'Ban Giám Đốc'),
      priority: raw.priority || 'P0',
      keyResults: rawKrs.map((kr: any, idx: number) => ({
        id: String(kr?.id || `kr-${idx}`),
        title: String(kr?.title || 'Kết quả then chốt'),
        startValue: Number(kr?.startValue ?? 0),
        targetValue: Number(kr?.targetValue ?? 100),
        currentValue: Number(kr?.currentValue ?? 0),
        unit: String(kr?.unit || '%'),
        linkedErpMetric:
          kr?.linkedErpMetric ||
          (kr?.autoMetric === 'ON_TIME_LSX_RATE' ? 'ON_TIME_LSX_RATE' : 'MANUAL'),
      })),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies OkrObjective;
  }

  if (collectionName.includes('swot')) {
    let entries: SwotEntry[] = Array.isArray(raw.entries) ? raw.entries : [];
    if (entries.length === 0) {
      const sList = Array.isArray(raw.strengths) ? raw.strengths : [];
      const wList = Array.isArray(raw.weaknesses) ? raw.weaknesses : [];
      const oList = Array.isArray(raw.opportunities) ? raw.opportunities : [];
      const tList = Array.isArray(raw.threats) ? raw.threats : [];
      entries = [
        ...sList.map((c: string, i: number) => ({ id: `s-${i}`, type: 'S' as const, content: String(c), impact: 'HIGH' as const })),
        ...wList.map((c: string, i: number) => ({ id: `w-${i}`, type: 'W' as const, content: String(c), impact: 'HIGH' as const })),
        ...oList.map((c: string, i: number) => ({ id: `o-${i}`, type: 'O' as const, content: String(c), impact: 'HIGH' as const })),
        ...tList.map((c: string, i: number) => ({ id: `t-${i}`, type: 'T' as const, content: String(c), impact: 'HIGH' as const })),
      ];
    }

    let towsActions: TowsStrategicAction[] = Array.isArray(raw.towsActions) ? raw.towsActions : [];
    if (towsActions.length === 0 && raw.towsStrategies) {
      const ts = raw.towsStrategies;
      if (ts.so) towsActions.push({ id: 'tows-so', strategyType: 'SO', actionTitle: String(ts.so), ownerName: 'Ban Giám Đốc', dueDate: today, status: 'EXECUTING' });
      if (ts.wo) towsActions.push({ id: 'tows-wo', strategyType: 'WO', actionTitle: String(ts.wo), ownerName: 'Quản đốc Sản xuất', dueDate: today, status: 'EXECUTING' });
      if (ts.st) towsActions.push({ id: 'tows-st', strategyType: 'ST', actionTitle: String(ts.st), ownerName: 'Ban Giám Đốc', dueDate: today, status: 'PLANNED' });
      if (ts.wt) towsActions.push({ id: 'tows-wt', strategyType: 'WT', actionTitle: String(ts.wt), ownerName: 'Mua hàng & Kho', dueDate: today, status: 'PLANNED' });
    }

    return {
      ...raw,
      id: String(raw.id || `swot-${Date.now()}`),
      title: String(raw.title || 'Phân tích Chiến lược Cạnh tranh SWOT'),
      period: String(raw.period || `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`),
      focusDomain: String(raw.focusDomain || 'Sản xuất & Kinh doanh MVĐN'),
      entries: Array.isArray(entries) ? entries : [],
      towsActions: Array.isArray(towsActions) ? towsActions : [],
      updatedAt: String(raw.updatedAt || raw.updatedAtStr || new Date().toISOString()),
    } satisfies SwotBoard;
  }

  if (collectionName.includes('coaching')) {
    const tierMap: Record<string, MaslowLevelNumber> = {
      PHYSIOLOGICAL: 1,
      SAFETY: 2,
      BELONGING: 3,
      ESTEEM: 4,
      SELF_ACTUALIZATION: 5,
    };
    const level: MaslowLevelNumber =
      (raw.dominantNeedLevel as MaslowLevelNumber) ||
      tierMap[raw.bottleneckTier] ||
      4;

    return {
      ...raw,
      id: String(raw.id || `maslow-${Date.now()}`),
      employeeName: String(raw.employeeName || 'Nhân sự MVĐN'),
      department: String(raw.department || 'Sản xuất'),
      role: String(raw.role || 'Nhân viên'),
      dominantNeedLevel: level,
      satisfactionScores: raw.satisfactionScores || {
        level1Physiological: 8,
        level2Safety: 8,
        level3Belonging: 8,
        level4Esteem: 7,
        level5SelfActualization: 7,
      },
      currentObservation: String(raw.currentObservation || raw.observedSymptoms || 'Đang theo dõi tạo động lực'),
      motivationAction: String(raw.motivationAction || raw.aiActionPlan || 'Ghi nhận & trao quyền phát triển'),
      nextCheckInDate: String(raw.nextCheckInDate || raw.followUpDate || today),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies MaslowEmployeePlan;
  }

  if (collectionName.includes('praises')) {
    return {
      ...raw,
      id: String(raw.id || `ffc-${Date.now()}`),
      recipientName: String(raw.recipientName || raw.employeeName || 'Nhân sự xuất sắc'),
      department: String(raw.department || 'Sản xuất'),
      feeling: String(raw.feeling || 'Ban Giám Đốc rất vui mừng và tự hào.'),
      fact: String(raw.fact || raw.finalMessage || 'Đã hoàn thành xuất sắc công việc được giao.'),
      compare: String(raw.compare || 'Vượt định mức kỳ vọng và lan tỏa tinh thần tích cực.'),
      sentToErp: Boolean(raw.sentToErp ?? raw.sentToErpAnnouncement ?? true),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies FfcPraiseRecord;
  }

  if (collectionName.includes('prep')) {
    return {
      ...raw,
      id: String(raw.id || `prep-${Date.now()}`),
      title: String(raw.title || 'Thông điệp điều hành PREP'),
      audience: String(raw.audience || 'Toàn bộ nhân sự MVĐN'),
      category: raw.category || 'DIRECTIVE',
      pointOpening: String(raw.pointOpening || raw.pointStart || ''),
      reasonWhy: String(raw.reasonWhy || raw.reason || ''),
      exampleEvidence: String(raw.exampleEvidence || raw.example || ''),
      pointClosing: String(raw.pointClosing || raw.pointEnd || ''),
      publishedToErp: Boolean(raw.publishedToErp ?? true),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies PrepMessage;
  }

  return raw;
}

// ─── HỆ THỐNG LƯU TRỮ DUAL-SYNC (LOCAL MIRROR + FIRESTORE `axis_*`) ─────────
const STORAGE_PREFIX = 'proceo_v2_';

function loadLocal<T extends { id?: string }>(key: string, _fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object' && !DEMO_IDS.has(item.id))
      .map((item) => normalizeDocument(key, item)) as T[];
  } catch {
    return [];
  }
}

function saveLocal<T>(key: string, items: T[]): void {
  try {
    const cleanItems = Array.isArray(items)
      ? items.filter((item: any) => !DEMO_IDS.has(item?.id))
      : [];
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(cleanItems));
  } catch (err) {
    console.warn('[ceoStorageService] LocalStorage save error:', err);
  }
}

export const ceoStorageService = {
  subscribeCollection<T extends { id: string }>(
    collectionName: string,
    defaultSeed: T[],
    onData: (items: T[]) => void
  ): () => void {
    // 1. Nạp ngay từ LocalStorage sạch (đã lọc demo IDs)
    const initial = loadLocal<T>(collectionName, defaultSeed);
    onData(initial);

    // 2. Lắng nghe realtime từ Firestore (loại bỏ và xóa vĩnh viễn các bản ghi mẫu demo)
    let unsubFirestore: (() => void) | null = null;
    try {
      unsubFirestore = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          // Xóa ngay các document demo nếu còn tồn tại trên Firestore
          snapshot.docs.forEach((d) => {
            if (DEMO_IDS.has(d.id)) {
              deleteDoc(d.ref).catch(() => {});
            }
          });

          const remoteItems = snapshot.docs
            .filter((d) => !DEMO_IDS.has(d.id))
            .map((d) =>
              normalizeDocument(collectionName, {
                id: d.id,
                ...(d.data() as any),
              })
            ) as T[];

          saveLocal(collectionName, remoteItems);
          onData(remoteItems);
        },
        () => {
          // Khi offline hoặc chưa có quyền, dùng local mirror
        }
      );
    } catch {
      // Fallback LocalStorage
    }

    return () => {
      if (unsubFirestore) {
        try {
          unsubFirestore();
        } catch {}
      }
    };
  },

  async upsertItem<T extends { id: string }>(
    collectionName: string,
    item: T,
    currentList: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>
  ): Promise<void> {
    const cleaned = normalizeDocument(collectionName, removeUndefinedDeep(item)) as T;
    const exists = currentList.some((x) => x.id === cleaned.id);
    const nextList = exists
      ? currentList.map((x) => (x.id === cleaned.id ? cleaned : x))
      : [cleaned, ...currentList];

    setList(nextList);
    saveLocal(collectionName, nextList);

    try {
      await setDoc(doc(db, collectionName, cleaned.id), removeUndefinedDeep(cleaned), {
        merge: true,
      });
    } catch {
      // Đã lưu an toàn vào Local Mirror
    }
  },

  async removeItem<T extends { id: string }>(
    collectionName: string,
    id: string,
    currentList: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>
  ): Promise<void> {
    const nextList = currentList.filter((x) => x.id !== id);
    setList(nextList);
    saveLocal(collectionName, nextList);

    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch {
      // Đã xóa trong Local Mirror
    }
  },
};
