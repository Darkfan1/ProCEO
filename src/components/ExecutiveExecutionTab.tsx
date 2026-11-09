import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Target,
  RefreshCw,
  Users,
  FileCheck,
  Plus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Search,
  Filter,
  Printer,
  Trash2,
  Edit3,
  Check,
  X,
  BookOpen,
  Send,
  Sliders,
  ChevronDown,
  Layers,
  MapPin,
  ListOrdered,
  Award,
} from 'lucide-react';
import {
  SmartTask,
  SmartCriteria,
  SmartDomain,
  PdcaCycle,
  PdcaPhase,
  Meeting369,
  MeetingActionItem,
  NavigationContextIntent,
  CeoTabId,
} from '../types/ceoTypes';
import { ErpStaffMember, ErpLsxOrder, ErpUser } from '../types/erpTypes';
import { FrameworkCode } from '../data/ceoMindsetData';
import { computeSmartScore } from '../services/ceoStorageService';
import { ceoAiService } from '../services/ceoAiService';
import { getLocalTodayYmd, formatRelativeDueBadge } from '../utils/dateUtils';
import { triggerPrint } from '../utils/printUtils';
import { dialogService } from './common/CustomDialog';

export const SMART_DOMAINS: Array<{
  id: SmartDomain;
  label: string;
  shortLabel: string;
  icon: string;
  badgeBg: string;
  defaultDept: string;
  placeholder: string;
}> = [
  {
    id: 'PRODUCTION',
    label: 'Sản xuất & Vận hành',
    shortLabel: 'Sản xuất',
    icon: '⚙️',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultDept: 'Sản xuất',
    placeholder: 'VD: Hoàn thành đúng tiến độ đơn hàng Flexo trọng điểm, giảm tỷ lệ phế phẩm xưởng in xuống dưới 1.8%...',
  },
  {
    id: 'SALES',
    label: 'Kinh doanh & Bán hàng',
    shortLabel: 'Kinh doanh',
    icon: '📈',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultDept: 'Kinh doanh',
    placeholder: 'VD: Đạt 1.2 tỷ doanh số ngành hàng tem nhãn điện tử tháng 11, chốt 3 khách hàng FDI trọng điểm...',
  },
  {
    id: 'FINANCE',
    label: 'Tài chính & Kế toán',
    shortLabel: 'Tài chính',
    icon: '💰',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    defaultDept: 'Kế toán',
    placeholder: 'VD: Thu hồi 95% công nợ khách hàng quá hạn >30 ngày, tối ưu hóa định mức chi phí nguyên vật liệu tháng...',
  },
  {
    id: 'QUALITY',
    label: 'Chất lượng & Kỹ thuật',
    shortLabel: 'Chất lượng',
    icon: '🔍',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    defaultDept: 'Kỹ thuật',
    placeholder: 'VD: Kiểm soát tỷ lệ lỗi sai màu/lệch bế dưới 0.2%, xử lý dứt điểm khiếu nại khách hàng trong 24h...',
  },
  {
    id: 'HR',
    label: 'Nhân sự & Đào tạo',
    shortLabel: 'Nhân sự',
    icon: '👥',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    defaultDept: 'Hành chính Nhân sự',
    placeholder: 'VD: Hoàn thành khóa đào tạo vận hành máy bế cho 100% thợ phụ mới, tỷ lệ chuyên cần xưởng đạt 98%...',
  },
  {
    id: 'SUPPLY_CHAIN',
    label: 'Kho vận & Mua hàng',
    shortLabel: 'Kho vận',
    icon: '📦',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    defaultDept: 'Kho & Mua hàng',
    placeholder: 'VD: Giảm 20% lượng tồn kho giấy decal và mực in, đàm phán giảm 3% giá phôi nhập khẩu, giao hàng đúng hẹn 99%...',
  },
  {
    id: 'MANAGEMENT',
    label: 'Chiến lược & Quản trị',
    shortLabel: 'Chiến lược',
    icon: '🏛️',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    defaultDept: 'Ban Giám Đốc',
    placeholder: 'VD: Chuẩn hóa quy trình giao ban 3-6-9, đồng bộ 100% dữ liệu CEO với hệ thống ERP, tối ưu vận hành Q4...',
  },
];

export const COLLECTIVE_PRESETS = [
  'Tập thể Toàn công ty',
  'Tập thể Xưởng In Flexo',
  'Tập thể BP. Bế & Hoàn thiện',
  'Tập thể BP. Thiết kế & Kỹ thuật',
  'Tập thể BP. Kinh doanh',
  'Tập thể BP. Kế toán & Tài chính',
  'Tập thể BP. Kho & Mua hàng',
  'Ban Giám Đốc',
];

interface AutoExpandTextareaProps {
  value: string;
  onChangeValue: (val: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
}

const AutoExpandTextarea: React.FC<AutoExpandTextareaProps> = ({
  value,
  onChangeValue,
  placeholder,
  className = '',
  minRows = 2,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, minRows * 22)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value, placeholder]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChangeValue(e.target.value);
        adjustHeight();
      }}
      placeholder={placeholder}
      rows={minRows}
      className={`resize-none overflow-hidden transition-all duration-150 ${className}`}
    />
  );
};

export type ExecutionStage = 'SMART' | 'PDCA' | 'MEETINGS' | 'SOP';

interface ExecutiveExecutionTabProps {
  smartTasks: SmartTask[];
  onSaveSmartTask: (task: SmartTask) => Promise<void> | void;
  onDeleteSmartTask: (id: string) => Promise<void> | void;
  onFollowUpSmartTask: (task: SmartTask) => Promise<void> | void;
  onUpdateSmartTaskStatus: (task: SmartTask, nextStatus: SmartTask['status']) => void;

  pdcaCycles: PdcaCycle[];
  onSavePdcaCycle: (cycle: PdcaCycle) => Promise<void> | void;
  onDeletePdcaCycle: (id: string) => Promise<void> | void;

  meetings: Meeting369[];
  onSaveMeeting: (m: Meeting369) => Promise<void> | void;
  onDeleteMeeting: (id: string) => Promise<void> | void;
  onSendMeetingSummon?: (m: Meeting369) => Promise<void> | void;
  onPublishMeetingMinutes?: (m: Meeting369) => Promise<void> | void;
  onSuperviseActionItem?: (meeting: Meeting369, item: MeetingActionItem) => Promise<void> | void;

  staffDirectory?: ErpStaffMember[];
  lsxOrders?: ErpLsxOrder[];
  navIntent: NavigationContextIntent | null;
  onClearIntent: () => void;
  onOpenTheoryDrawer: (code: FrameworkCode) => void;
  onNavigateTab: (tab: CeoTabId, subView?: string, prefill?: any) => void;
  activeUser?: ErpUser | null;
  initialStage?: ExecutionStage;
  viewScope?: 'PDCA_SOP' | 'MEETINGS' | 'ALL';
}

export const ExecutiveExecutionTab: React.FC<ExecutiveExecutionTabProps> = ({
  smartTasks,
  onSaveSmartTask,
  onDeleteSmartTask,
  onFollowUpSmartTask,
  onUpdateSmartTaskStatus,

  pdcaCycles,
  onSavePdcaCycle,
  onDeletePdcaCycle,

  meetings,
  onSaveMeeting,
  onDeleteMeeting,
  onSendMeetingSummon,
  onPublishMeetingMinutes,
  onSuperviseActionItem,

  staffDirectory = [],
  lsxOrders = [],
  navIntent,
  onClearIntent,
  onOpenTheoryDrawer,
  onNavigateTab,
  activeUser,
  initialStage,
  viewScope = 'ALL',
}) => {
  const todayYmd = getLocalTodayYmd();

  // ─── 1. BƯỚC THỰC THI HIỆN TẠI TRONG LUỒNG KHÉP KÍN ───────────────────────
  const [activeStage, setActiveStage] = useState<ExecutionStage>(() => {
    if (viewScope === 'MEETINGS') return 'MEETINGS';
    if (viewScope === 'PDCA_SOP') return navIntent?.subView === 'SOP' ? 'SOP' : 'PDCA';
    if (initialStage) return initialStage;
    if (navIntent?.subView === 'PDCA') return 'PDCA';
    if (navIntent?.subView === 'MEETINGS') return 'MEETINGS';
    if (navIntent?.subView === 'SOP') return 'SOP';
    return 'SMART';
  });

  useEffect(() => {
    if (viewScope === 'MEETINGS') {
      setActiveStage('MEETINGS');
      return;
    }
    if (viewScope === 'PDCA_SOP') {
      setActiveStage((prev) => (prev === 'SOP' ? 'SOP' : 'PDCA'));
      return;
    }
    if (initialStage) {
      setActiveStage(initialStage);
    }
  }, [initialStage, viewScope]);

  // Đồng bộ khi có navIntent từ bên ngoài (Cockpit, Mindset, etc.)
  useEffect(() => {
    if (!navIntent) return;
    if (navIntent.subView === 'PDCA') setActiveStage('PDCA');
    else if (navIntent.subView === 'MEETINGS') setActiveStage('MEETINGS');
    else if (navIntent.subView === 'SOP') setActiveStage('SOP');
    else if (navIntent.subView === 'SMART') setActiveStage('SMART');
  }, [navIntent]);

  // ─── THỐNG KÊ REALTIME CHO 4 BƯỚC ──────────────────────────────────────────
  const activeSmartCount = useMemo(
    () => smartTasks.filter((t) => t.status !== 'DONE').length,
    [smartTasks]
  );
  const activePdcaCount = useMemo(
    () => pdcaCycles.filter((p) => p.phase !== 'STANDARDIZED').length,
    [pdcaCycles]
  );
  const activeMeetingsCount = useMemo(
    () => meetings.filter((m) => m.status !== 'CLOSED').length,
    [meetings]
  );
  const standardizedSopCount = useMemo(
    () =>
      pdcaCycles.filter(
        (p) => p.phase === 'STANDARDIZED' || Boolean(p.sopStandardizedTitle)
      ).length,
    [pdcaCycles]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // STAGE 1: SMART TASK STATE & HANDLERS
  // ───────────────────────────────────────────────────────────────────────────
  const [smartSearch, setSmartSearch] = useState('');
  const [smartFilter, setSmartFilter] = useState<'ACTIVE' | 'OVERDUE' | 'DONE' | 'ALL'>('ACTIVE');
  const [selectedDomain, setSelectedDomain] = useState<SmartDomain>('PRODUCTION');
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [editingSmartTask, setEditingSmartTask] = useState<SmartTask | null>(null);

  // Form SMART fields
  const [taskTitle, setTaskTitle] = useState('');
  const [department, setDepartment] = useState('Sản xuất');
  const [assigneeName, setAssigneeName] = useState('');
  const [dueDate, setDueDate] = useState(todayYmd);
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<SmartTask['priority']>('HIGH');
  const [linkedLsxCode, setLinkedLsxCode] = useState('');
  const [smartCriteria, setSmartCriteria] = useState<SmartCriteria>({
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
  });
  const [loadingAiSmart, setLoadingAiSmart] = useState(false);

  // Reset SMART form
  const resetSmartForm = () => {
    setEditingSmartTask(null);
    setTaskTitle('');
    setDepartment('Sản xuất');
    setAssigneeName('');
    setDueDate(todayYmd);
    setDueTime('17:00');
    setPriority('HIGH');
    setLinkedLsxCode('');
    setSmartCriteria({
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      timeBound: '',
    });
  };

  // Prefill từ navIntent nếu có
  useEffect(() => {
    if (navIntent && navIntent.tab === 'execution' && navIntent.subView === 'SMART') {
      if (navIntent.prefillTitle || navIntent.prefillAssignee || navIntent.prefillLsxCode) {
        setTaskTitle(navIntent.prefillTitle || '');
        setAssigneeName(navIntent.prefillAssignee || '');
        setLinkedLsxCode(navIntent.prefillLsxCode || '');
        setIsSmartModalOpen(true);
      }
    }
  }, [navIntent]);

  const handleOpenEditSmartModal = (task: SmartTask) => {
    setEditingSmartTask(task);
    setTaskTitle(task.title);
    setDepartment(task.department);
    setAssigneeName(task.assigneeName);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || '17:00');
    setPriority(task.priority);
    setLinkedLsxCode(task.linkedLsxCode || '');
    setSelectedDomain(task.domain || 'PRODUCTION');
    setSmartCriteria(
      task.smart || {
        specific: '',
        measurable: '',
        achievable: '',
        relevant: '',
        timeBound: '',
      }
    );
    setIsSmartModalOpen(true);
  };

  const handleAiGenerateSmart = async () => {
    if (!taskTitle.trim()) {
      dialogService.toast('Vui lòng nhập tên mục tiêu trước khi nhờ AI gợi ý.', 'warning');
      return;
    }
    setLoadingAiSmart(true);
    try {
      const generated = await ceoAiService.generateSmartCriteria(
        taskTitle,
        department,
        assigneeName || 'Nhân sự phụ trách',
        dueDate,
        linkedLsxCode,
        selectedDomain
      );
      setSmartCriteria(generated);
      dialogService.toast('AI Gemini đã chuẩn hóa 5 tiêu chí SMART sắc bén!', 'success');
    } catch {
      dialogService.toast('Không thể kết nối AI, vui lòng thử lại.', 'warning');
    } finally {
      setLoadingAiSmart(false);
    }
  };

  const handleSaveSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !assigneeName.trim()) {
      dialogService.toast('Vui lòng điền đủ Tên mục tiêu và Người phụ trách.', 'warning');
      return;
    }
    const score = computeSmartScore(smartCriteria);
    const newTask: SmartTask = {
      id: editingSmartTask?.id || `smart-${Date.now()}`,
      title: taskTitle.trim(),
      department: department.trim(),
      domain: selectedDomain,
      assigneeName: assigneeName.trim(),
      dueDate,
      dueTime,
      priority,
      status: editingSmartTask?.status || 'IN_PROGRESS',
      progress: editingSmartTask?.progress || 0,
      smart: smartCriteria,
      smartScore: score,
      linkedLsxCode: linkedLsxCode.trim() || undefined,
      followUpCount: editingSmartTask?.followUpCount || 0,
      createdAt: editingSmartTask?.createdAt || new Date().toISOString(),
    };

    await onSaveSmartTask(newTask);
    dialogService.toast(
      editingSmartTask ? 'Đã cập nhật mục tiêu SMART!' : 'Đã giao mục tiêu SMART mới thành công!',
      'success'
    );
    setIsSmartModalOpen(false);
    resetSmartForm();
  };

  // Lọc danh sách SMART Tasks
  const filteredSmartTasks = useMemo(() => {
    return smartTasks.filter((task) => {
      if (smartFilter === 'ACTIVE' && task.status === 'DONE') return false;
      if (smartFilter === 'DONE' && task.status !== 'DONE') return false;
      if (smartFilter === 'OVERDUE') {
        if (task.status === 'DONE') return false;
        if (task.dueDate >= todayYmd) return false;
      }
      if (smartSearch.trim()) {
        const query = smartSearch.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchAssignee = task.assigneeName.toLowerCase().includes(query);
        const matchLsx = (task.linkedLsxCode || '').toLowerCase().includes(query);
        if (!matchTitle && !matchAssignee && !matchLsx) return false;
      }
      return true;
    });
  }, [smartTasks, smartFilter, smartSearch, todayYmd]);

  // 1-Click: Chuyển Mục tiêu SMART sang Chu trình PDCA
  const handleInitiatePdcaFromSmart = async (task: SmartTask) => {
    // Tự động chuyển tab và chuẩn bị form PDCA
    setActiveStage('PDCA');
    setIsPdcaModalOpen(true);
    setEditingPdcaCycle(null);
    setPdcaTitle(`Cải tiến thực thi: ${task.title}`);
    setPdcaOwner(task.assigneeName);
    setPdcaDueDate(task.dueDate);
    setPdcaLinkedSmartId(task.id);
    setPdcaLinkedLsxCode(task.linkedLsxCode || '');
    setPdcaMetricTarget(task.smart?.measurable || 'Đạt 100% mục tiêu');
    setPdcaMetricBaseline(`Hiện trạng (${task.progress}%)`);
    setPdcaMetricActual('Đang triển khai thử nghiệm');
    setPdcaProblem(`Vấn đề: ${task.smart?.specific || task.title}`);
    setPdcaExperiment(`Giải pháp: Cải tiến dựa trên nguồn lực ${task.smart?.achievable || 'sẵn có'}`);
    setPdcaCheck(`Kiểm tra: Đối chiếu qua họp 3-6-9 với mốc ${task.smart?.measurable || 'tiêu chuẩn'}`);
    setPdcaAct('Chuẩn hóa: Đóng gói thành SOP khi kết quả đạt cam kết.');

    // Gọi AI gợi ý nâng cao
    try {
      const aiPlan = await ceoAiService.generatePdcaPlanFromSmart(task);
      setPdcaTitle(aiPlan.title);
      setPdcaProblem(aiPlan.planProblem);
      setPdcaExperiment(aiPlan.doExperiment);
      setPdcaCheck(aiPlan.checkEvaluation);
      setPdcaAct(aiPlan.actStandardize);
      setPdcaMetricBaseline(aiPlan.metricBaseline);
      setPdcaMetricTarget(aiPlan.metricTarget);
      dialogService.toast('AI đã lập kế hoạch thực thi PDCA chi tiết từ Mục tiêu SMART!', 'success');
    } catch {
      // Dùng dữ liệu cơ bản
    }
  };

  // 1-Click: Triệu tập Họp 3-6-9 từ Mục tiêu SMART
  const handleInitiateMeetingFromSmart = (task: SmartTask) => {
    setActiveStage('MEETINGS');
    setIsMeetingModalOpen(true);
    setEditingMeeting(null);
    setMeetingTitle(`Họp Đôn Đốc Mục Tiêu: ${task.title}`);
    setMeetingTopic(`Kiểm tra tiến độ & tháo gỡ điểm nghẽn mục tiêu "${task.title}"`);
    setMeetingObjective(`Cam kết hoàn thành chỉ số ${task.smart?.measurable || 'mục tiêu'} trước ngày ${task.dueDate}`);
    setMeetingParticipants(['Ban Giám Đốc (Chủ tọa)', task.assigneeName, 'Quản đốc Sản xuất']);
    setMeetingLinkedSmartId(task.id);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // STAGE 2: PDCA STATE & HANDLERS
  // ───────────────────────────────────────────────────────────────────────────
  const [pdcaFilterPhase, setPdcaFilterPhase] = useState<'ALL' | PdcaPhase>('ALL');
  const [isPdcaModalOpen, setIsPdcaModalOpen] = useState(false);
  const [editingPdcaCycle, setEditingPdcaCycle] = useState<PdcaCycle | null>(null);

  // Form PDCA fields
  const [pdcaTitle, setPdcaTitle] = useState('');
  const [pdcaArea, setPdcaArea] = useState<PdcaCycle['area']>('PRODUCTION');
  const [pdcaOwner, setPdcaOwner] = useState('');
  const [pdcaDueDate, setPdcaDueDate] = useState(todayYmd);
  const [pdcaProblem, setPdcaProblem] = useState('');
  const [pdcaExperiment, setPdcaExperiment] = useState('');
  const [pdcaCheck, setPdcaCheck] = useState('');
  const [pdcaAct, setPdcaAct] = useState('');
  const [pdcaMetricBaseline, setPdcaMetricBaseline] = useState('');
  const [pdcaMetricTarget, setPdcaMetricTarget] = useState('');
  const [pdcaMetricActual, setPdcaMetricActual] = useState('');
  const [pdcaLinkedSmartId, setPdcaLinkedSmartId] = useState<string | undefined>();
  const [pdcaLinkedLsxCode, setPdcaLinkedLsxCode] = useState<string | undefined>();

  const resetPdcaForm = () => {
    setEditingPdcaCycle(null);
    setPdcaTitle('');
    setPdcaArea('PRODUCTION');
    setPdcaOwner('');
    setPdcaDueDate(todayYmd);
    setPdcaProblem('');
    setPdcaExperiment('');
    setPdcaCheck('');
    setPdcaAct('');
    setPdcaMetricBaseline('');
    setPdcaMetricTarget('');
    setPdcaMetricActual('');
    setPdcaLinkedSmartId(undefined);
    setPdcaLinkedLsxCode(undefined);
  };

  const handleOpenEditPdcaModal = (cycle: PdcaCycle) => {
    setEditingPdcaCycle(cycle);
    setPdcaTitle(cycle.title);
    setPdcaArea(cycle.area);
    setPdcaOwner(cycle.ownerName);
    setPdcaDueDate(cycle.dueDate);
    setPdcaProblem(cycle.planProblem);
    setPdcaExperiment(cycle.doExperiment);
    setPdcaCheck(cycle.checkEvaluation);
    setPdcaAct(cycle.actStandardize);
    setPdcaMetricBaseline(cycle.metricBaseline);
    setPdcaMetricTarget(cycle.metricTarget);
    setPdcaMetricActual(cycle.metricActual);
    setPdcaLinkedSmartId(cycle.linkedSmartTaskId);
    setPdcaLinkedLsxCode(cycle.linkedLsxCode);
    setIsPdcaModalOpen(true);
  };

  const handleSavePdcaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdcaTitle.trim() || !pdcaOwner.trim()) {
      dialogService.toast('Vui lòng điền đủ Tiêu đề và Người phụ trách chu trình.', 'warning');
      return;
    }
    const newCycle: PdcaCycle = {
      id: editingPdcaCycle?.id || `pdca-${Date.now()}`,
      title: pdcaTitle.trim(),
      area: pdcaArea,
      ownerName: pdcaOwner.trim(),
      phase: editingPdcaCycle?.phase || 'PLAN',
      planProblem: pdcaProblem.trim(),
      doExperiment: pdcaExperiment.trim(),
      checkEvaluation: pdcaCheck.trim(),
      actStandardize: pdcaAct.trim(),
      metricBaseline: pdcaMetricBaseline.trim(),
      metricTarget: pdcaMetricTarget.trim(),
      metricActual: pdcaMetricActual.trim() || 'Đang theo dõi',
      dueDate: pdcaDueDate,
      linkedSmartTaskId: pdcaLinkedSmartId,
      linkedLsxCode: pdcaLinkedLsxCode,
      iteration: editingPdcaCycle?.iteration || 1,
      sopStandardizedTitle: editingPdcaCycle?.sopStandardizedTitle,
      sopStandardizedCode: editingPdcaCycle?.sopStandardizedCode,
      evaluationSummary: editingPdcaCycle?.evaluationSummary,
      evaluationStatus: editingPdcaCycle?.evaluationStatus,
      evaluatedAt: editingPdcaCycle?.evaluatedAt,
      createdAt: editingPdcaCycle?.createdAt || new Date().toISOString(),
    };

    await onSavePdcaCycle(newCycle);
    dialogService.toast(
      editingPdcaCycle ? 'Đã cập nhật chu trình PDCA!' : 'Đã khởi tạo chu trình PDCA mới!',
      'success'
    );
    setIsPdcaModalOpen(false);
    resetPdcaForm();
  };

  // Advance Phase: P -> D -> C -> A
  const handleAdvancePdcaPhase = async (cycle: PdcaCycle) => {
    const nextMap: Record<PdcaPhase, PdcaPhase> = {
      PLAN: 'DO',
      DO: 'CHECK',
      CHECK: 'ACT',
      ACT: 'STANDARDIZED',
      STANDARDIZED: 'STANDARDIZED',
    };
    const nextPhase = nextMap[cycle.phase];
    if (nextPhase === 'STANDARDIZED' || cycle.phase === 'ACT') {
      // Mở modal nghiệm thu SOP
      handleOpenSopEvaluationModal(cycle);
      return;
    }
    const updated: PdcaCycle = {
      ...cycle,
      phase: nextPhase,
    };
    await onSavePdcaCycle(updated);
    dialogService.toast(`Chu trình "${cycle.title}" đã chuyển sang pha ${nextPhase}!`, 'success');
  };

  // 1-Click: Đưa chu trình PDCA vào Họp 3-6-9
  const handleInitiateMeetingFromPdca = (cycle: PdcaCycle) => {
    if (viewScope === 'PDCA_SOP') {
      onNavigateTab('meetings', 'MEETINGS', {
        title: `Họp Kiểm Tra Pha Check: ${cycle.title}`,
        assignee: cycle.ownerName,
        pdcaCycle: cycle,
      });
      return;
    }
    setActiveStage('MEETINGS');
    setIsMeetingModalOpen(true);
    setEditingMeeting(null);
    setMeetingTitle(`Họp Kiểm Tra Pha Check: ${cycle.title}`);
    setMeetingTopic(`Đo lường kết quả thực tế ("${cycle.metricActual}") so với mục tiêu ("${cycle.metricTarget}")`);
    setMeetingObjective(`Chốt giải pháp dứt điểm tháo gỡ điểm nghẽn chu trình PDCA "${cycle.title}"`);
    setMeetingParticipants(['Ban Giám Đốc (Chủ tọa)', cycle.ownerName, 'Bộ phận QC / Kỹ thuật', 'Bộ phận Kế hoạch']);
    setMeetingLinkedPdcaId(cycle.id);
  };

  // Lọc chu trình PDCA
  const filteredPdcaCycles = useMemo(() => {
    return pdcaCycles.filter((c) => {
      if (pdcaFilterPhase === 'ALL') return true;
      return c.phase === pdcaFilterPhase;
    });
  }, [pdcaCycles, pdcaFilterPhase]);

  // ───────────────────────────────────────────────────────────────────────────
  // STAGE 3: MEETINGS 3-6-9 STATE & HANDLERS
  // ───────────────────────────────────────────────────────────────────────────
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting369 | null>(null);
  const [activeMeetingDetail, setActiveMeetingDetail] = useState<Meeting369 | null>(null);

  // Form Meeting fields
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingObjective, setMeetingObjective] = useState('');
  const [meetingDate, setMeetingDate] = useState(todayYmd);
  const [meetingStartTime, setMeetingStartTime] = useState('08:30');
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [meetingLocation, setMeetingLocation] = useState('Phòng họp Ban Giám Đốc');
  const [meetingChairperson, setMeetingChairperson] = useState(activeUser?.name || 'Ban Giám Đốc');
  const [meetingParticipants, setMeetingParticipants] = useState<string[]>([
    'Ban Giám Đốc',
    'Quản đốc Sản xuất',
  ]);
  const [meetingPreRead, setMeetingPreRead] = useState('');
  const [meetingRules, setMeetingRules] = useState(
    '1. Đúng giờ (trễ 1 phút nộp phạt 50k).\n2. Tập trung giải pháp, không đổ lỗi.\n3. Nói có sách, mách có số liệu ERP.'
  );
  const [meetingAgendaFlow, setMeetingAgendaFlow] = useState<string[]>([
    '5 phút: Rà soát tài liệu & chỉ số ERP hiện tại.',
    '15 phút: Mổ xẻ điểm nghẽn & thống nhất giải pháp dứt điểm.',
    '10 phút: Chốt nghị quyết & phân công DRI + deadline.',
  ]);
  const [meetingDecisions, setMeetingDecisions] = useState('');
  const [meetingLinkedSmartId, setMeetingLinkedSmartId] = useState<string | undefined>();
  const [meetingLinkedPdcaId, setMeetingLinkedPdcaId] = useState<string | undefined>();
  const [newParticipantInput, setNewParticipantInput] = useState('');

  // AI Copilot for meetings
  const [aiCopilotPrompt, setAiCopilotPrompt] = useState('');
  const [loadingAiMeeting, setLoadingAiMeeting] = useState(false);

  const resetMeetingForm = () => {
    setEditingMeeting(null);
    setMeetingTitle('');
    setMeetingTopic('');
    setMeetingObjective('');
    setMeetingDate(todayYmd);
    setMeetingStartTime('08:30');
    setMeetingDuration(30);
    setMeetingLocation('Phòng họp Ban Giám Đốc');
    setMeetingChairperson(activeUser?.name || 'Ban Giám Đốc');
    setMeetingParticipants(['Ban Giám Đốc', 'Quản đốc Sản xuất']);
    setMeetingPreRead('');
    setMeetingDecisions('');
    setMeetingLinkedSmartId(undefined);
    setMeetingLinkedPdcaId(undefined);
  };

  const handleOpenEditMeetingModal = (m: Meeting369) => {
    setEditingMeeting(m);
    setMeetingTitle(m.title);
    setMeetingTopic(m.topic);
    setMeetingObjective(m.objective);
    setMeetingDate(m.date);
    setMeetingStartTime(m.startTime);
    setMeetingDuration(m.durationMinutes);
    setMeetingLocation(m.location || 'Phòng họp Ban Giám Đốc');
    setMeetingChairperson(m.chairperson);
    setMeetingParticipants(m.participants || []);
    setMeetingPreRead(m.preReadDocs || '');
    setMeetingRules(m.meetingRules || '');
    setMeetingAgendaFlow(m.agendaFlow || []);
    setMeetingDecisions(m.decisionsSummary || '');
    setMeetingLinkedSmartId(m.linkedSmartTaskId);
    setMeetingLinkedPdcaId(m.linkedPdcaId);
    setIsMeetingModalOpen(true);
  };

  const handleSaveMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingTopic.trim()) {
      dialogService.toast('Vui lòng điền đủ Tên cuộc họp và Chủ đề.', 'warning');
      return;
    }
    const newMeeting: Meeting369 = {
      id: editingMeeting?.id || `meeting-${Date.now()}`,
      title: meetingTitle.trim(),
      topic: meetingTopic.trim(),
      objective: meetingObjective.trim(),
      date: meetingDate,
      startTime: meetingStartTime,
      durationMinutes: meetingDuration,
      location: meetingLocation,
      chairperson: meetingChairperson,
      participants: meetingParticipants,
      preReadDocs: meetingPreRead,
      meetingRules: meetingRules,
      agendaFlow: meetingAgendaFlow,
      decisionsSummary: meetingDecisions,
      sixStepsCompleted: editingMeeting?.sixStepsCompleted || [true, true, true, false, false, false],
      ninePrinciplesChecked: editingMeeting?.ninePrinciplesChecked || new Array(9).fill(false),
      actionItems: editingMeeting?.actionItems || [],
      linkedSmartTaskId: meetingLinkedSmartId,
      linkedPdcaId: meetingLinkedPdcaId,
      status: editingMeeting?.status || 'SCHEDULED',
      createdAt: editingMeeting?.createdAt || new Date().toISOString(),
    };

    await onSaveMeeting(newMeeting);
    dialogService.toast(
      editingMeeting ? 'Đã cập nhật cuộc họp 3-6-9!' : 'Đã thiết lập cuộc họp 3-6-9 mới!',
      'success'
    );
    setIsMeetingModalOpen(false);
    resetMeetingForm();
  };

  // AI Lên Kịch bản Họp 3-6-9
  const handleAiGenerateMeetingPlan = async () => {
    if (!meetingTopic.trim()) {
      dialogService.toast('Vui lòng nhập chủ đề cuộc họp trước.', 'warning');
      return;
    }
    setLoadingAiMeeting(true);
    try {
      const generated = await ceoAiService.generateMeetingPlanFromInputs({
        title: meetingTitle || `Họp Giao Ban: ${meetingTopic}`,
        topic: meetingTopic,
        objective: meetingObjective || 'Chốt giải pháp thực thi',
        durationMinutes: meetingDuration,
        participants: meetingParticipants,
        location: meetingLocation,
        meetingDate,
      });
      setMeetingObjective(generated.objective || meetingObjective);
      setMeetingPreRead(generated.preReadDocs || meetingPreRead);
      setMeetingAgendaFlow(generated.agendaFlow || meetingAgendaFlow);
      dialogService.toast('AI đã gợi ý kịch bản điều hành cuộc họp tinh gọn!', 'success');
    } catch {
      dialogService.toast('Không thể tải kịch bản AI, vui lòng thử lại.', 'warning');
    } finally {
      setLoadingAiMeeting(false);
    }
  };

  // Thêm Action Item cho cuộc họp
  const handleAddActionItemToMeeting = async (
    meeting: Meeting369,
    taskTitle: string,
    assigneeName: string,
    dueDate: string
  ) => {
    if (!taskTitle.trim() || !assigneeName.trim()) return;
    const newItem: MeetingActionItem = {
      id: `act-${Date.now()}`,
      taskTitle: taskTitle.trim(),
      assigneeName: assigneeName.trim(),
      dueDate,
      status: 'PENDING',
      supervisedCount: 0,
    };
    const updated: Meeting369 = {
      ...meeting,
      actionItems: [...(meeting.actionItems || []), newItem],
    };
    await onSaveMeeting(updated);
    if (activeMeetingDetail?.id === meeting.id) {
      setActiveMeetingDetail(updated);
    }
    dialogService.toast(`Đã giao việc "${taskTitle}" cho ${assigneeName}!`, 'success');
  };

  // Nhận dữ liệu chuyển tiếp 1-Click cho PDCA và Họp 3-6-9
  useEffect(() => {
    if (!navIntent) return;

    if (navIntent.tab === 'pdca') {
      if (navIntent.subView === 'SOP') {
        setActiveStage('SOP');
        onClearIntent();
        return;
      }
      setActiveStage('PDCA');
      if (navIntent.prefillSmartTask) {
        void handleInitiatePdcaFromSmart(navIntent.prefillSmartTask);
        onClearIntent();
      } else if (
        navIntent.prefillTitle ||
        navIntent.prefillAssignee ||
        navIntent.prefillLsxCode
      ) {
        setEditingPdcaCycle(null);
        setPdcaTitle(navIntent.prefillTitle || '');
        setPdcaOwner(navIntent.prefillAssignee || '');
        setPdcaDueDate(todayYmd);
        setPdcaLinkedLsxCode(navIntent.prefillLsxCode);
        setPdcaProblem(navIntent.prefillDescription || '');
        setPdcaExperiment('');
        setPdcaCheck('');
        setPdcaAct('');
        setPdcaMetricBaseline('');
        setPdcaMetricTarget('');
        setPdcaMetricActual('Đang theo dõi');
        setIsPdcaModalOpen(true);
        onClearIntent();
      }
      return;
    }

    if (navIntent.tab === 'meetings') {
      setActiveStage('MEETINGS');
      if (navIntent.prefillSmartTask) {
        handleInitiateMeetingFromSmart(navIntent.prefillSmartTask);
        onClearIntent();
      } else if (navIntent.prefillPdcaCycle) {
        const cycle = navIntent.prefillPdcaCycle;
        setEditingMeeting(null);
        setMeetingTitle(`Họp Kiểm Tra Pha Check: ${cycle.title}`);
        setMeetingTopic(
          `Đo lường kết quả thực tế ("${cycle.metricActual}") so với mục tiêu ("${cycle.metricTarget}")`
        );
        setMeetingObjective(
          `Chốt giải pháp dứt điểm tháo gỡ điểm nghẽn chu trình PDCA "${cycle.title}"`
        );
        setMeetingParticipants([
          'Ban Giám Đốc (Chủ tọa)',
          cycle.ownerName,
          'Bộ phận QC / Kỹ thuật',
        ]);
        setMeetingLinkedPdcaId(cycle.id);
        setIsMeetingModalOpen(true);
        onClearIntent();
      } else if (navIntent.prefillTitle || navIntent.prefillAssignee) {
        resetMeetingForm();
        setMeetingTitle(navIntent.prefillTitle || '');
        setMeetingTopic(navIntent.prefillDescription || navIntent.prefillTitle || '');
        setMeetingObjective('Thống nhất giải pháp, phân quyền và chốt thời hạn cam kết');
        setMeetingParticipants(
          navIntent.prefillAssignee
            ? ['Ban Giám Đốc (Chủ tọa)', navIntent.prefillAssignee]
            : ['Ban Giám Đốc', 'Quản đốc Sản xuất']
        );
        setIsMeetingModalOpen(true);
        onClearIntent();
      }
    }
  }, [navIntent]);

  // ───────────────────────────────────────────────────────────────────────────
  // STAGE 4: CHUẨN HÓA SOP STATE & HANDLERS
  // ───────────────────────────────────────────────────────────────────────────
  const [sopSearch, setSopSearch] = useState('');
  const [sopFilterArea, setSopFilterArea] = useState<string>('ALL');
  const [isSopEvalModalOpen, setIsSopEvalModalOpen] = useState(false);
  const [sopTargetPdca, setSopTargetPdca] = useState<PdcaCycle | null>(null);
  const [sopEvalMetricActual, setSopEvalMetricActual] = useState('');
  const [sopEvalSummary, setSopEvalSummary] = useState('');
  const [sopEvalTitle, setSopEvalTitle] = useState('');
  const [sopEvalDecision, setSopEvalDecision] = useState<'STANDARDIZE' | 'NEXT_ITERATION'>('STANDARDIZE');

  // Mở modal nghiệm thu SOP
  const handleOpenSopEvaluationModal = (cycle: PdcaCycle) => {
    setSopTargetPdca(cycle);
    setSopEvalMetricActual(cycle.metricActual || cycle.metricTarget);
    setSopEvalSummary(
      `Nghiệm thu vòng lặp #${cycle.iteration}: Chỉ số ban đầu "${cycle.metricBaseline}" cải tiến lên kết quả thực tế "${cycle.metricActual || cycle.metricTarget}".`
    );
    setSopEvalTitle(cycle.sopStandardizedTitle || `SOP Vận Hành Chuẩn: ${cycle.title}`);
    setSopEvalDecision('STANDARDIZE');
    setIsSopEvalModalOpen(true);
  };

  const handleSaveSopEvaluation = async () => {
    if (!sopTargetPdca) return;
    if (sopEvalDecision === 'STANDARDIZE') {
      const generatedCode =
        sopTargetPdca.sopStandardizedCode || `SOP-MVDN-${Math.floor(100 + Math.random() * 900)}`;
      const updatedCycle: PdcaCycle = {
        ...sopTargetPdca,
        phase: 'STANDARDIZED',
        metricActual: sopEvalMetricActual,
        evaluationSummary: sopEvalSummary,
        evaluationStatus: 'ACHIEVED',
        evaluatedAt: new Date().toISOString(),
        sopStandardizedTitle: sopEvalTitle.trim(),
        sopStandardizedCode: generatedCode,
      };
      await onSavePdcaCycle(updatedCycle);

      // Tự động đóng hoàn thành 100% mục tiêu SMART gốc (nếu có)
      if (sopTargetPdca.linkedSmartTaskId) {
        const linkedSmart = smartTasks.find((t) => t.id === sopTargetPdca.linkedSmartTaskId);
        if (linkedSmart) {
          await onSaveSmartTask({
            ...linkedSmart,
            status: 'DONE',
            progress: 100,
          });
        }
      }

      dialogService.toast(
        `Chúc mừng! Đã chuẩn hóa thành công ${generatedCode} và đóng gói vào Kho SOP toàn xưởng!`,
        'success'
      );
    } else {
      // Chưa đạt -> Tăng iteration + 1 và quay về pha Plan
      const updatedCycle: PdcaCycle = {
        ...sopTargetPdca,
        phase: 'PLAN',
        iteration: sopTargetPdca.iteration + 1,
        metricActual: sopEvalMetricActual,
        evaluationSummary: `Vòng lặp #${sopTargetPdca.iteration} chưa đạt mục tiêu. Điều chỉnh kế hoạch cho vòng lặp #${sopTargetPdca.iteration + 1}.`,
        evaluationStatus: 'ADJUST_NEXT_ITERATION',
        evaluatedAt: new Date().toISOString(),
      };
      await onSavePdcaCycle(updatedCycle);
      dialogService.toast(
        `Đã kích hoạt vòng lặp cải tiến #${sopTargetPdca.iteration + 1} cho chu trình "${sopTargetPdca.title}"!`,
        'info'
      );
    }
    setIsSopEvalModalOpen(false);
    setSopTargetPdca(null);
  };

  // Danh sách SOPs đã được chuẩn hóa
  const standardizedSopList = useMemo(() => {
    return pdcaCycles
      .filter((p) => p.phase === 'STANDARDIZED' || Boolean(p.sopStandardizedTitle))
      .filter((p) => {
        if (sopFilterArea !== 'ALL' && p.area !== sopFilterArea) return false;
        if (sopSearch.trim()) {
          const q = sopSearch.toLowerCase();
          const matchTitle = (p.sopStandardizedTitle || p.title).toLowerCase().includes(q);
          const matchCode = (p.sopStandardizedCode || '').toLowerCase().includes(q);
          const matchOwner = p.ownerName.toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchOwner) return false;
        }
        return true;
      });
  }, [pdcaCycles, sopFilterArea, sopSearch]);

  return (
    <div className="space-y-4">
      {/* ─── THANH ĐIỀU HƯỚNG TỐI GIẢN THEO PHẠM VI TAB ─── */}
      {viewScope === 'PDCA_SOP' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 no-print">
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/70 border border-slate-300/60 w-fit">
            <button
              type="button"
              onClick={() => setActiveStage('PDCA')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeStage !== 'SOP'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chu Trình Cải Tiến PDCA ({activePdcaCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStage('SOP')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeStage === 'SOP'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quy Trình Chuẩn Hóa SOP ({standardizedSopCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenTheoryDrawer('PDCA')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Sổ tay PDCA & SOP</span>
            </button>
          </div>
        </div>
      )}

      {viewScope === 'ALL' && (
      <div className="vista-hero p-3 sm:p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-white">
            <span className="p-1 rounded-lg bg-white/10 border border-white/15">
              <Target className="w-4 h-4 text-emerald-400" />
            </span>
            <span className="text-xs font-bold tracking-tight text-slate-200 uppercase">
              Chu Trình Thực Thi Khép Kín 4 Giai Đoạn
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (activeStage === 'SMART') onOpenTheoryDrawer('SMART');
                else if (activeStage === 'PDCA') onOpenTheoryDrawer('PDCA');
                else if (activeStage === 'MEETINGS') onOpenTheoryDrawer('MEETING_369');
                else onOpenTheoryDrawer('PDCA');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Sổ tay lý thuyết</span>
            </button>
          </div>
        </div>

        {/* Bốn thẻ Stepper liên hoàn */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          {/* Bước 1: SMART */}
          <button
            onClick={() => setActiveStage('SMART')}
            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
              activeStage === 'SMART'
                ? 'bg-white text-slate-900 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase opacity-80">
              <span>1. Xác định mục tiêu</span>
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1 font-extrabold text-sm sm:text-base flex items-baseline gap-1.5">
              <span>SMART</span>
              <span className="text-xs font-semibold opacity-75">({activeSmartCount} việc mở)</span>
            </div>
          </button>

          {/* Bước 2: PDCA */}
          <button
            onClick={() => setActiveStage('PDCA')}
            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
              activeStage === 'PDCA'
                ? 'bg-white text-slate-900 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase opacity-80">
              <span>2. Tổ chức thực hiện</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1 font-extrabold text-sm sm:text-base flex items-baseline gap-1.5">
              <span>PDCA</span>
              <span className="text-xs font-semibold opacity-75">({activePdcaCount} chu trình)</span>
            </div>
          </button>

          {/* Bước 3: Họp 3-6-9 */}
          <button
            onClick={() => setActiveStage('MEETINGS')}
            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
              activeStage === 'MEETINGS'
                ? 'bg-white text-slate-900 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase opacity-80">
              <span>3. Giám sát & Cam kết</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1 font-extrabold text-sm sm:text-base flex items-baseline gap-1.5">
              <span>Họp 3-6-9</span>
              <span className="text-xs font-semibold opacity-75">({activeMeetingsCount} cuộc họp)</span>
            </div>
          </button>

          {/* Bước 4: SOP */}
          <button
            onClick={() => setActiveStage('SOP')}
            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
              activeStage === 'SOP'
                ? 'bg-white text-slate-900 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase opacity-80">
              <span>4. Đóng gói thành quả</span>
              <FileCheck className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1 font-extrabold text-sm sm:text-base flex items-baseline gap-1.5">
              <span>Chuẩn Hóa SOP</span>
              <span className="text-xs font-semibold opacity-75">({standardizedSopCount} quy trình)</span>
            </div>
          </button>
        </div>
      </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* GIAI ĐOẠN 1: MỤC TIÊU TRỌNG TÂM (SMART)                                */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeStage === 'SMART' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header Action Bar */}
          <div className="ceo-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Quản Lý Mục Tiêu Trọng Tâm (SMART)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mọi mục tiêu được định lượng cụ thể (M), gắn mốc hạn (T) và có phương án thực thi khả thi (A).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetSmartForm();
                    setIsSmartModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl btn-25d-primary font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Giao Mục Tiêu Mới</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <button
                  onClick={() => setSmartFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    smartFilter === 'ACTIVE'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Đang làm ({smartTasks.filter((t) => t.status !== 'DONE').length})
                </button>
                <button
                  onClick={() => setSmartFilter('OVERDUE')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    smartFilter === 'OVERDUE'
                      ? 'bg-rose-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Quá hạn
                </button>
                <button
                  onClick={() => setSmartFilter('DONE')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    smartFilter === 'DONE'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Đã hoàn thành ({smartTasks.filter((t) => t.status === 'DONE').length})
                </button>
                <button
                  onClick={() => setSmartFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    smartFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({smartTasks.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={smartSearch}
                  onChange={(e) => setSmartSearch(e.target.value)}
                  placeholder="Tìm mục tiêu, người phụ trách, LSX..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Bảng dữ liệu SMART Clean Table UI */}
          <div className="ceo-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200/90 text-slate-600 uppercase font-extrabold text-[10.5px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Mục tiêu & Đo lường (SMART)</th>
                    <th className="py-2.5 px-3">Phụ trách</th>
                    <th className="py-2.5 px-3">Hạn chót</th>
                    <th className="py-2.5 px-3 w-32">Tiến độ</th>
                    <th className="py-2.5 px-3">Vận hành PDCA</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {filteredSmartTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        Không tìm thấy mục tiêu nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredSmartTasks.map((task) => {
                      const linkedPdca = pdcaCycles.find((p) => p.linkedSmartTaskId === task.id);
                      const badge = formatRelativeDueBadge(task.dueDate);

                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Cột 1: Tên mục tiêu & SMART criteria */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`font-extrabold text-sm ${
                                    task.status === 'DONE'
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {task.linkedLsxCode && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[9.5px] font-bold">
                                    LSX: {task.linkedLsxCode}
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                    task.smartScore >= 80
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : task.smartScore >= 50
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  SMART {task.smartScore}%
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                <span className="font-bold text-slate-700">Đo lường (M):</span>{' '}
                                {task.smart?.measurable || 'Chưa định lượng con số'}
                              </div>
                            </div>
                          </td>

                          {/* Cột 2: Phụ trách */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <span>👤</span>
                              <span>{task.assigneeName}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">{task.department}</div>
                          </td>

                          {/* Cột 3: Hạn chót */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10.5px] ${
                                task.status === 'DONE'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : badge.tone === 'overdue'
                                  ? 'bg-rose-50 text-rose-700'
                                  : badge.tone === 'today'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {task.status === 'DONE' ? 'Hoàn tất' : badge.text}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{task.dueDate}</div>
                          </td>

                          {/* Cột 4: Tiến độ */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span>{task.progress}%</span>
                              </div>
                              <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    task.progress >= 100
                                      ? 'bg-emerald-500'
                                      : task.progress >= 50
                                      ? 'bg-indigo-500'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, task.progress)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Cột 5: Liên kết PDCA */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {linkedPdca ? (
                              <button
                                type="button"
                                onClick={() => setActiveStage('PDCA')}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-extrabold hover:bg-cyan-100 cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3 text-cyan-600" />
                                <span>
                                  {linkedPdca.phase === 'PLAN' && 'P - Kế hoạch'}
                                  {linkedPdca.phase === 'DO' && 'D - Thực thi'}
                                  {linkedPdca.phase === 'CHECK' && 'C - Kiểm tra'}
                                  {linkedPdca.phase === 'ACT' && 'A - Đánh giá'}
                                  {linkedPdca.phase === 'STANDARDIZED' && '✓ Đã chuẩn SOP'}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleInitiatePdcaFromSmart(task)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 text-[10.5px] font-bold cursor-pointer transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Tạo PDCA</span>
                              </button>
                            )}
                          </td>

                          {/* Cột 6: Thao tác (ẩn mặc định, chỉ hiện khi hover theo Rule 2) */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-end gap-1">
                              {/* 1-Click: Tạo PDCA */}
                              <button
                                type="button"
                                onClick={() => handleInitiatePdcaFromSmart(task)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 cursor-pointer"
                                title="Tổ chức chu trình PDCA thực thi mục tiêu này"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              {/* 1-Click: Triệu tập Họp 3-6-9 */}
                              <button
                                type="button"
                                onClick={() => handleInitiateMeetingFromSmart(task)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer"
                                title="Triệu tập cuộc họp 3-6-9 để giám sát/đôn đốc"
                              >
                                <Users className="w-3.5 h-3.5" />
                              </button>

                              {/* Đôn đốc */}
                              <button
                                type="button"
                                onClick={() => onFollowUpSmartTask(task)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
                                title={`Đôn đốc trực tiếp (Đã nhắc ${task.followUpCount} lần)`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>

                              {/* Sửa */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditSmartModal(task)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                                title="Chỉnh sửa mục tiêu"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Hoàn thành / Mở lại */}
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateSmartTaskStatus(
                                    task,
                                    task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE'
                                  )
                                }
                                className={`p-1.5 rounded-lg border cursor-pointer ${
                                  task.status === 'DONE'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                    : 'bg-white text-slate-400 border-slate-200 hover:text-emerald-600'
                                }`}
                                title={task.status === 'DONE' ? 'Mở lại mục tiêu' : 'Đánh dấu hoàn thành'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Xóa */}
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await dialogService.confirm(
                                    `Xác nhận xóa mục tiêu "${task.title}"?`,
                                    'Xóa mục tiêu SMART'
                                  );
                                  if (ok) onDeleteSmartTask(task.id);
                                }}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 cursor-pointer"
                                title="Xóa mục tiêu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* GIAI ĐOẠN 2: VẬN HÀNH THỰC THI (PDCA)                                  */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeStage === 'PDCA' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header Action Bar */}
          <div className="ceo-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Chu Trình Vận Hành & Cải Tiến Thực Thi (PDCA)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Plan (Kế hoạch) ➔ Do (Thử nghiệm) ➔ Check (Đo lường & Họp 3-6-9) ➔ Act (Đánh giá & Chuẩn hóa SOP).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetPdcaForm();
                    setIsPdcaModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl btn-25d-primary font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Khởi Tạo Chu Trình PDCA</span>
                </button>
              </div>
            </div>

            {/* Filter Phase Bar */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setPdcaFilterPhase('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  pdcaFilterPhase === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({pdcaCycles.length})
              </button>
              <button
                onClick={() => setPdcaFilterPhase('PLAN')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  pdcaFilterPhase === 'PLAN'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                P - Kế hoạch ({pdcaCycles.filter((p) => p.phase === 'PLAN').length})
              </button>
              <button
                onClick={() => setPdcaFilterPhase('DO')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  pdcaFilterPhase === 'DO'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                D - Thực thi ({pdcaCycles.filter((p) => p.phase === 'DO').length})
              </button>
              <button
                onClick={() => setPdcaFilterPhase('CHECK')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  pdcaFilterPhase === 'CHECK'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                C - Kiểm tra / Họp ({pdcaCycles.filter((p) => p.phase === 'CHECK').length})
              </button>
              <button
                onClick={() => setPdcaFilterPhase('ACT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  pdcaFilterPhase === 'ACT'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                A - Đánh giá & Chuẩn hóa ({pdcaCycles.filter((p) => p.phase === 'ACT').length})
              </button>
            </div>
          </div>

          {/* Danh sách các chu trình PDCA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredPdcaCycles.length === 0 ? (
              <div className="col-span-full ceo-card p-8 text-center text-slate-500 text-xs">
                Chưa có chu trình PDCA nào ở giai đoạn này.
              </div>
            ) : (
              filteredPdcaCycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="ceo-card p-4 space-y-3 group hover:border-slate-300 transition-all shadow-xs relative"
                >
                  {/* Top: Header chu trình + Action Buttons on Hover */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white font-mono text-[9.5px] font-extrabold uppercase">
                          {cycle.phase}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono text-[9.5px] font-bold">
                          Vòng lặp #{cycle.iteration}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          {cycle.area}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{cycle.title}</h4>
                    </div>

                    {/* Action buttons (Clean Table UI rule: opacity-0 group-hover:opacity-100) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 no-print">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPdcaModal(cycle)}
                        className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                        title="Chỉnh sửa chu trình"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await dialogService.confirm(
                            `Xác nhận xóa chu trình PDCA "${cycle.title}"?`,
                            'Xóa chu trình PDCA'
                          );
                          if (ok) onDeletePdcaCycle(cycle.id);
                        }}
                        className="p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-rose-600"
                        title="Xóa chu trình"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Stepper 4 pha trực quan */}
                  <div className="grid grid-cols-4 gap-1 py-1">
                    {(['PLAN', 'DO', 'CHECK', 'ACT'] as PdcaPhase[]).map((ph, idx) => {
                      const isCurrent = cycle.phase === ph;
                      const isPassed =
                        ph === 'PLAN' ||
                        (ph === 'DO' && cycle.phase !== 'PLAN') ||
                        (ph === 'CHECK' && (cycle.phase === 'CHECK' || cycle.phase === 'ACT' || cycle.phase === 'STANDARDIZED')) ||
                        (ph === 'ACT' && (cycle.phase === 'ACT' || cycle.phase === 'STANDARDIZED'));

                      return (
                        <div
                          key={ph}
                          className={`p-1.5 rounded-lg text-center text-[10px] font-extrabold border transition-all ${
                            isCurrent
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : isPassed
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          {idx + 1}. {ph}
                        </div>
                      );
                    })}
                  </div>

                  {/* So sánh Chỉ số: Baseline -> Target -> Actual */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        Ban đầu (Baseline)
                      </span>
                      <span className="font-extrabold text-slate-800">
                        {cycle.metricBaseline || 'Chưa đo'}
                      </span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-[10px] text-indigo-600 font-bold block uppercase">
                        Mục tiêu (Target)
                      </span>
                      <span className="font-extrabold text-indigo-700">
                        {cycle.metricTarget || 'Chưa đặt'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 font-bold block uppercase">
                        Thực tế (Actual)
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        {cycle.metricActual || 'Đang theo dõi'}
                      </span>
                    </div>
                  </div>

                  {/* Tóm tắt chi tiết 4 pha */}
                  <div className="space-y-1 text-xs text-slate-600 border-t border-slate-200/80 pt-2">
                    <p className="line-clamp-2">
                      <span className="font-bold text-slate-900">P - Vấn đề:</span> {cycle.planProblem}
                    </p>
                    <p className="line-clamp-2">
                      <span className="font-bold text-slate-900">D - Giải pháp:</span> {cycle.doExperiment}
                    </p>
                  </div>

                  {/* Bottom Action Bar: Chuyển Pha & Đưa vào Họp / Nghiệm thu SOP */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                    <div className="text-[11px] text-slate-500">
                      <span>Phụ trách: </span>
                      <span className="font-bold text-slate-800">{cycle.ownerName}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Đưa vào Họp 3-6-9 */}
                      <button
                        type="button"
                        onClick={() => handleInitiateMeetingFromPdca(cycle)}
                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Đưa vào kịch bản họp 3-6-9 để giám sát và chốt cam kết"
                      >
                        <Users className="w-3 h-3" />
                        <span>Họp 3-6-9</span>
                      </button>

                      {/* Đánh giá & Chuẩn hóa SOP (Pha Act) */}
                      <button
                        type="button"
                        onClick={() => handleOpenSopEvaluationModal(cycle)}
                        className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Nghiệm thu kết quả và chuẩn hóa thành SOP toàn xưởng"
                      >
                        <FileCheck className="w-3 h-3" />
                        <span>Nghiệm thu SOP</span>
                      </button>

                      {/* Chuyển sang Pha kế tiếp */}
                      {cycle.phase !== 'STANDARDIZED' && (
                        <button
                          type="button"
                          onClick={() => handleAdvancePdcaPhase(cycle)}
                          className="px-2 py-1 rounded-lg btn-25d-primary font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <span>Pha tiếp →</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* GIAI ĐOẠN 3: PHÒNG HỌP TRỰC TIẾP (HỌP 3-6-9)                          */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeStage === 'MEETINGS' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header Action Bar */}
          <div className="ceo-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Phòng Họp Trực Tiếp Theo Nguyên Tắc 3-6-9
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kịch bản 30 phút: 5p Rà soát chuẩn bị ➔ 15p Mổ xẻ giải pháp ➔ 10p Chốt nghị quyết & Ban hành ERP.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {viewScope === 'MEETINGS' && (
                  <button
                    type="button"
                    onClick={() => onOpenTheoryDrawer('MEETING_369')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sổ tay 3-6-9</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetMeetingForm();
                    setIsMeetingModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl btn-25d-primary font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thiết Lập Cuộc Họp Mới</span>
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách các cuộc họp 3-6-9 */}
          <div className="space-y-3">
            {meetings.length === 0 ? (
              <div className="ceo-card p-8 text-center text-slate-500 text-xs">
                Chưa có cuộc họp nào được lên lịch. Bấm &quot;Thiết Lập Cuộc Họp Mới&quot; để tạo cuộc họp 3-6-9.
              </div>
            ) : (
              meetings.map((m) => {
                const isSelected = activeMeetingDetail?.id === m.id;

                return (
                  <div
                    key={m.id}
                    className={`ceo-card p-4 space-y-3 transition-all ${
                      isSelected ? 'ring-2 ring-indigo-500' : 'hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10.5px]">
                            {m.date === todayYmd ? 'Hôm nay' : m.date} • {m.startTime} ({m.durationMinutes}p)
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{m.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600">
                          <span className="font-bold text-slate-800">Chủ đề:</span> {m.topic}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 no-print">
                        <button
                          type="button"
                          onClick={() => setActiveMeetingDetail(isSelected ? null : m)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                        >
                          {isSelected ? 'Thu gọn' : 'Xem chi tiết & Kịch bản'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditMeetingModal(m)}
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                          title="Sửa cuộc họp"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerPrint(`meeting-print-${m.id}`, `Bien_Ban_Hop_${m.date}`)}
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                          title="In A4 biên bản"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await dialogService.confirm(
                              `Xác nhận xóa cuộc họp "${m.title}"?`,
                              'Xóa cuộc họp 3-6-9'
                            );
                            if (ok) onDeleteMeeting(m.id);
                          }}
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Xóa cuộc họp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Khung chi tiết khi mở kịch bản */}
                    {isSelected && (
                      <div id={`meeting-print-${m.id}`} className="space-y-3.5 pt-3 border-t border-slate-200">
                        {/* Kịch bản 3 bước thời gian */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <span className="text-[11px] font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            Kịch bản điều hành cuộc họp (Agenda)
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs">
                            {(m.agendaFlow || []).map((step, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700"
                              >
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Items (Đầu việc phân công có DRI) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-800 uppercase">
                              Nghị Quyết & Phân Công Đầu Việc (Action Items)
                            </span>
                          </div>

                          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden bg-white text-xs">
                            {(m.actionItems || []).length === 0 ? (
                              <div className="p-3 text-center text-slate-400">
                                Chưa có đầu việc nào được phân công trong cuộc họp này.
                              </div>
                            ) : (
                              (m.actionItems || []).map((act) => (
                                <div
                                  key={act.id}
                                  className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50"
                                >
                                  <div>
                                    <div className="font-bold text-slate-900">{act.taskTitle}</div>
                                    <div className="text-[10.5px] text-slate-500">
                                      Phụ trách: {act.assigneeName} • Hạn chót: {act.dueDate}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 no-print">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onSuperviseActionItem) {
                                          onSuperviseActionItem(m, act);
                                        } else {
                                          dialogService.toast(`Đã gửi nhắc nhở đôn đốc cho ${act.assigneeName}!`, 'info');
                                        }
                                      }}
                                      className="px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] cursor-pointer"
                                    >
                                      Đôn đốc ({act.supervisedCount})
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* GIAI ĐOẠN 4: CHUẨN HÓA SOP (ĐÓNG GÓI THÀNH QUẢ)                       */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeStage === 'SOP' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header Action Bar */}
          <div className="ceo-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Kho Quy Trình Thao Tác Chuẩn Toàn Xưởng (SOP Library)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đóng gói thành quả từ các chu trình PDCA đạt chuẩn thành văn bản SOP ban hành dán tại hiện trường.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-extrabold">
                  {standardizedSopList.length} SOP ĐÃ BAN HÀNH
                </span>
              </div>
            </div>

            {/* Search & Area Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {['ALL', 'PRODUCTION', 'QUALITY', 'DELIVERY', 'HR_CULTURE', 'COST_CONTROL', 'MANAGEMENT'].map(
                  (area) => (
                    <button
                      key={area}
                      onClick={() => setSopFilterArea(area)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        sopFilterArea === area
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {area === 'ALL' ? 'Tất cả' : area}
                    </button>
                  )
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sopSearch}
                  onChange={(e) => setSopSearch(e.target.value)}
                  placeholder="Tìm mã SOP, tên quy trình..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* Danh sách SOPs đã chuẩn hóa Clean Table UI */}
          <div className="ceo-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200/90 text-slate-600 uppercase font-extrabold text-[10.5px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Mã SOP & Tên quy trình</th>
                    <th className="py-2.5 px-3">Phân xưởng / Lĩnh vực</th>
                    <th className="py-2.5 px-3">Người ban hành</th>
                    <th className="py-2.5 px-3">Hiệu quả cải tiến (Baseline ➔ Actual)</th>
                    <th className="py-2.5 px-3 text-right">In ấn & Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {standardizedSopList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        Chưa có quy trình SOP nào được đóng gói hoặc chưa khớp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    standardizedSopList.map((p) => {
                      const printId = `sop-print-${p.id}`;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Mã & Tên */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[10.5px] font-black">
                                  {p.sopStandardizedCode || 'SOP-MVDN-01'}
                                </span>
                                <h4 className="font-extrabold text-slate-900 text-sm">
                                  {p.sopStandardizedTitle || p.title}
                                </h4>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {p.actStandardize || p.planProblem}
                              </p>
                            </div>
                          </td>

                          {/* Phân xưởng */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10.5px]">
                              {p.area}
                            </span>
                          </td>

                          {/* Người ban hành */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-800">{p.ownerName}</div>
                            <div className="text-[10px] text-slate-400">
                              Nghiệm thu: {p.evaluatedAt ? p.evaluatedAt.slice(0, 10) : p.dueDate}
                            </div>
                          </td>

                          {/* Hiệu quả */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="text-slate-500">{p.metricBaseline}</span>
                              <ArrowRight className="w-3 h-3 text-emerald-600" />
                              <span className="font-extrabold text-emerald-700">{p.metricActual}</span>
                            </div>
                          </td>

                           {/* Thao tác (ẩn mặc định, chỉ hiện khi hover) */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigateTab('prep', undefined, {
                                    title: `Ban hành & Áp dụng quy trình chuẩn ${p.sopStandardizedCode || 'SOP'}: ${p.sopStandardizedTitle || p.title}`,
                                    audience: `Toàn xưởng & Bộ phận ${p.area}`,
                                    description: `Kết quả cải tiến từ ${p.metricBaseline} ➔ ${p.metricActual}. Nội dung chuẩn hóa bắt buộc áp dụng: ${p.actStandardize || p.doExperiment}`,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Soạn chỉ đạo PREP ban hành quy trình chuẩn này xuống hệ thống ERP MVĐN"
                              >
                                <Send className="w-3 h-3 text-emerald-400" />
                                <span>Chỉ đạo PREP</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerPrint(printId, `SOP_${p.sopStandardizedCode || p.id}`)}
                                className="px-2.5 py-1 rounded-lg btn-25d-secondary text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>In Phiếu A4</span>
                              </button>
                            </div>

                            {/* Hidden printable A4 sheet for this SOP */}
                            <div id={printId} className="hidden">
                              <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                                <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
                                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0' }}>
                                    CÔNG TY TNHH MÃ VẠCH ĐỒNG NAI (MVĐN)
                                  </h2>
                                  <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#047857', marginTop: '6px' }}>
                                    QUY TRÌNH THAO TÁC CHUẨN (SOP): {p.sopStandardizedCode}
                                  </h1>
                                  <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{p.sopStandardizedTitle || p.title}</p>
                                </div>
                                <div style={{ marginBottom: '15px', fontSize: '12px', lineHeight: '1.6' }}>
                                  <p><strong>Lĩnh vực / Phân xưởng:</strong> {p.area}</p>
                                  <p><strong>Chịu trách nhiệm ban hành:</strong> {p.ownerName}</p>
                                  <p><strong>Mục tiêu cải tiến đã đạt:</strong> Từ {p.metricBaseline} ➔ Đạt {p.metricActual}</p>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>NỘI DUNG THAO TÁC CHUẨN (STANDARD WORK):</h3>
                                  <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{p.actStandardize || p.doExperiment}</p>
                                </div>
                                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '13px' }}>
                                  <div>
                                    <p><strong>NGƯỜI LẬP SOP</strong></p>
                                    <br /><br />
                                    <p>{p.ownerName}</p>
                                  </div>
                                  <div>
                                    <p><strong>BAN GIÁM ĐỐC PHÊ DUYỆT</strong></p>
                                    <br /><br />
                                    <p>Đã Ký & Ban Hành</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* MODAL: THIẾT LẬP / CHỈNH SỬA MỤC TIÊU SMART                            */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {isSmartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {editingSmartTask ? 'Chỉnh Sửa Mục Tiêu SMART' : 'Giao Mục Tiêu Mới (Chuẩn SMART)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSmartModalOpen(false);
                  resetSmartForm();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSmartSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Chọn lĩnh vực Domain */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                  Lĩnh Vực Quản Trị
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SMART_DOMAINS.map((dom) => (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => {
                        setSelectedDomain(dom.id);
                        setDepartment(dom.defaultDept);
                      }}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                        selectedDomain === dom.id
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="mr-1">{dom.icon}</span>
                      <span>{dom.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tên mục tiêu */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                  Tên Mục Tiêu Cụ Thể <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="VD: Giảm tỷ lệ phế phẩm xưởng Flexo xuống dưới 1.8%..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Người phụ trách & Phòng ban */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                    Người / Bộ Phận Phụ Trách <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A (Quản đốc)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                    Hạn Chót Hoàn Thành
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 5 Tiêu chí SMART + AI Helper */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-950 uppercase text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    5 Tiêu Chí Chuẩn Hóa SMART
                  </span>
                  <button
                    type="button"
                    onClick={handleAiGenerateSmart}
                    disabled={loadingAiSmart}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50 hover:bg-indigo-700"
                  >
                    <Sparkles className={`w-3 h-3 ${loadingAiSmart ? 'animate-spin' : ''}`} />
                    {loadingAiSmart ? 'Đang chuẩn hóa...' : 'AI Điền Sắc Bén'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-0.5">
                      S - Specific (Cụ thể, rõ ràng)
                    </label>
                    <input
                      type="text"
                      value={smartCriteria.specific}
                      onChange={(e) =>
                        setSmartCriteria({ ...smartCriteria, specific: e.target.value })
                      }
                      placeholder="Mục tiêu là gì, tại khâu nào..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-0.5">
                      M - Measurable (Đo lường được bằng con số cụ thể)
                    </label>
                    <input
                      type="text"
                      value={smartCriteria.measurable}
                      onChange={(e) =>
                        setSmartCriteria({ ...smartCriteria, measurable: e.target.value })
                      }
                      placeholder="VD: Dưới 1.8%, hoàn thành 100% LSX..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none text-xs font-bold text-indigo-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-0.5">
                      A - Achievable (Tính khả thi & nguồn lực)
                    </label>
                    <input
                      type="text"
                      value={smartCriteria.achievable}
                      onChange={(e) =>
                        setSmartCriteria({ ...smartCriteria, achievable: e.target.value })
                      }
                      placeholder="Nguồn lực máy móc, nhân công hiện có..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSmartModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl btn-25d-primary font-bold text-xs cursor-pointer shadow-xs"
                >
                  {editingSmartTask ? 'Lưu Thay Đổi' : 'Giao Mục Tiêu SMART'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* MODAL: KHỞI TẠO / CHỈNH SỬA CHU TRÌNH PDCA                             */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {isPdcaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-cyan-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {editingPdcaCycle ? 'Chỉnh Sửa Chu Trình PDCA' : 'Khởi Tạo Chu Trình PDCA'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPdcaModalOpen(false);
                  resetPdcaForm();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePdcaSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                  Tiêu Đề Chu Trình Cải Tiến <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={pdcaTitle}
                  onChange={(e) => setPdcaTitle(e.target.value)}
                  placeholder="VD: Cải tiến thời gian chuẩn bị bản in máy Flexo..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                    Người Phụ Trách <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pdcaOwner}
                    onChange={(e) => setPdcaOwner(e.target.value)}
                    placeholder="VD: Trưởng ca In / Quản đốc"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                    Lĩnh Vực
                  </label>
                  <select
                    value={pdcaArea}
                    onChange={(e) => setPdcaArea(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium"
                  >
                    <option value="PRODUCTION">Sản xuất (PRODUCTION)</option>
                    <option value="QUALITY">Chất lượng (QUALITY)</option>
                    <option value="DELIVERY">Tiến độ giao hàng (DELIVERY)</option>
                    <option value="COST_CONTROL">Kiểm soát chi phí (COST_CONTROL)</option>
                    <option value="HR_CULTURE">Nhân sự & Văn hóa (HR_CULTURE)</option>
                    <option value="MANAGEMENT">Quản trị chung (MANAGEMENT)</option>
                  </select>
                </div>
              </div>

              {/* 3 Mốc Chỉ số */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-800 uppercase text-[10.5px] block">
                  Đo Lường Chỉ Số 3 Mốc
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                      Baseline (Trước cải tiến)
                    </label>
                    <input
                      type="text"
                      value={pdcaMetricBaseline}
                      onChange={(e) => setPdcaMetricBaseline(e.target.value)}
                      placeholder="VD: 45 phút/lần"
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-indigo-600 font-bold block mb-0.5">
                      Target (Mục tiêu)
                    </label>
                    <input
                      type="text"
                      value={pdcaMetricTarget}
                      onChange={(e) => setPdcaMetricTarget(e.target.value)}
                      placeholder="VD: 20 phút/lần"
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 outline-none text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-600 font-bold block mb-0.5">
                      Actual (Thực tế ghi nhận)
                    </label>
                    <input
                      type="text"
                      value={pdcaMetricActual}
                      onChange={(e) => setPdcaMetricActual(e.target.value)}
                      placeholder="VD: 22 phút/lần"
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 outline-none text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Kế hoạch chi tiết 4 pha */}
              <div className="space-y-2">
                <div>
                  <label className="font-extrabold text-slate-700 block uppercase text-[10px]">
                    P - Plan (Vấn đề & Nguyên nhân gốc rễ)
                  </label>
                  <textarea
                    rows={2}
                    value={pdcaProblem}
                    onChange={(e) => setPdcaProblem(e.target.value)}
                    placeholder="Mô tả vấn đề hiện tại và nguyên nhân 5-Why..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700 block uppercase text-[10px]">
                    D - Do (Giải pháp thực thi thử nghiệm)
                  </label>
                  <textarea
                    rows={2}
                    value={pdcaExperiment}
                    onChange={(e) => setPdcaExperiment(e.target.value)}
                    placeholder="Các bước thử nghiệm giải pháp tại xưởng..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPdcaModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl btn-25d-primary font-bold text-xs cursor-pointer shadow-xs"
                >
                  {editingPdcaCycle ? 'Cập Nhật PDCA' : 'Khởi Tạo Chu Trình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* MODAL: THIẾT LẬP / CHỈNH SỬA CUỘC HỌP 3-6-9                           */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {editingMeeting ? 'Chỉnh Sửa Cuộc Họp 3-6-9' : 'Thiết Lập Cuộc Họp 3-6-9 Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMeetingModalOpen(false);
                  resetMeetingForm();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMeetingSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                  Tên Cuộc Họp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="VD: Họp Giao Ban Đôn Đốc Sản Xuất Tuần 45..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                  Chủ Đề Trọng Tâm Cần Tháo Gỡ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={meetingTopic}
                  onChange={(e) => setMeetingTopic(e.target.value)}
                  placeholder="VD: Xử lý dứt điểm điểm nghẽn giao hàng đơn Flexo tem nhãn..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-extrabold text-slate-700 block uppercase text-[10px]">
                    Ngày Họp
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700 block uppercase text-[10px]">
                    Giờ Bắt Đầu
                  </label>
                  <input
                    type="time"
                    value={meetingStartTime}
                    onChange={(e) => setMeetingStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700 block uppercase text-[10px]">
                    Thời Lượng (Phút)
                  </label>
                  <input
                    type="number"
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none"
                  />
                </div>
              </div>

              {/* Kịch bản 3 bước thời gian */}
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-950 uppercase text-[10.5px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Kịch Bản Họp 3 Bước Tinh Gọn (5p - 15p - 10p)
                  </span>
                  <button
                    type="button"
                    onClick={handleAiGenerateMeetingPlan}
                    disabled={loadingAiMeeting}
                    className="text-[10.5px] font-bold text-indigo-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className={`w-3 h-3 ${loadingAiMeeting ? 'animate-spin' : ''}`} />
                    AI Lập Kịch Bản
                  </button>
                </div>
                <div className="space-y-1.5">
                  {meetingAgendaFlow.map((step, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const next = [...meetingAgendaFlow];
                        next[idx] = e.target.value;
                        setMeetingAgendaFlow(next);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none text-xs"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl btn-25d-primary font-bold text-xs cursor-pointer shadow-xs"
                >
                  {editingMeeting ? 'Lưu Thay Đổi' : 'Thiết Lập Cuộc Họp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* MODAL: NGHIỆM THU PHA ACT & CHUẨN HÓA SOP                              */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {isSopEvalModalOpen && sopTargetPdca && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Nghiệm Thu Pha Act & Chuẩn Hóa SOP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSopEvalModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Chu trình nghiệm thu</div>
                <div className="font-extrabold text-slate-900 text-sm">{sopTargetPdca.title}</div>
                <div className="text-slate-600">
                  Phụ trách: <strong>{sopTargetPdca.ownerName}</strong> • Vòng lặp: #{sopTargetPdca.iteration}
                </div>
              </div>

              {/* Chỉ số so sánh */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    Mục tiêu (Target)
                  </span>
                  <span className="font-extrabold text-indigo-700">{sopTargetPdca.metricTarget}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">
                    Kết quả thực tế ghi nhận
                  </span>
                  <input
                    type="text"
                    value={sopEvalMetricActual}
                    onChange={(e) => setSopEvalMetricActual(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 rounded bg-white border border-emerald-300 font-bold text-emerald-900 outline-none"
                  />
                </div>
              </div>

              {/* Quyết định của CEO */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 block uppercase text-[10.5px]">
                  Quyết Định Đánh Giá Của CEO
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSopEvalDecision('STANDARDIZE')}
                    className={`p-3 rounded-xl text-left border cursor-pointer transition-all ${
                      sopEvalDecision === 'STANDARDIZE'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-extrabold text-xs">✓ Đạt chuẩn ➔ Ban hành SOP</div>
                    <div className="text-[10.5px] opacity-80 mt-0.5">
                      Đóng gói vào kho SOP toàn xưởng và hoàn thành SMART 100%.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSopEvalDecision('NEXT_ITERATION')}
                    className={`p-3 rounded-xl text-left border cursor-pointer transition-all ${
                      sopEvalDecision === 'NEXT_ITERATION'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-extrabold text-xs">↻ Chưa đạt ➔ Vòng lặp mới</div>
                    <div className="text-[10.5px] opacity-80 mt-0.5">
                      Kích hoạt vòng lặp #{sopTargetPdca.iteration + 1} để điều chỉnh giải pháp.
                    </div>
                  </button>
                </div>
              </div>

              {sopEvalDecision === 'STANDARDIZE' && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="font-extrabold text-slate-700 block uppercase text-[10px]">
                    Tên Quy Trình Chuẩn (SOP)
                  </label>
                  <input
                    type="text"
                    value={sopEvalTitle}
                    onChange={(e) => setSopEvalTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block uppercase text-[10px]">
                  Báo Cáo Tóm Tắt & Kết Luận Của CEO
                </label>
                <textarea
                  rows={3}
                  value={sopEvalSummary}
                  onChange={(e) => setSopEvalSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSopEvalModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveSopEvaluation}
                  className="px-4 py-2 rounded-xl btn-25d-primary font-bold text-xs cursor-pointer shadow-xs"
                >
                  Xác Nhận Nghiệm Thu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
