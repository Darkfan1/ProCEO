import React, { useState, useMemo, useEffect } from 'react';
import {
  Target,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Edit3,
  Trash2,
  TrendingUp,
  Layers,
  Award,
  BookOpen,
  Calendar,
  Send,
  HelpCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  SmartTask,
  SmartCriteria,
  SmartDomain,
  OkrObjective,
  CeoTabId,
  NavigationContextIntent,
  isDriActionTask,
} from '../../types/ceoTypes';
import { ErpStaffMember, ErpLsxOrder } from '../../types/erpTypes';
import { FrameworkCode } from '../../data/ceoMindsetData';
import { computeSmartScore } from '../../services/ceoStorageService';
import { ceoAiService } from '../../services/ceoAiService';
import { getLocalTodayYmd, formatRelativeDueBadge } from '../../utils/dateUtils';
import { dialogService } from '../common/CustomDialog';
import { SMART_DOMAINS } from '../ExecutiveExecutionTab';

export interface SmartGoalsViewProps {
  smartTasks: SmartTask[];
  onSaveSmartTask: (task: SmartTask) => Promise<void> | void;
  onDeleteSmartTask: (id: string) => Promise<void> | void;
  onFollowUpSmartTask?: (task: SmartTask) => Promise<void> | void;
  onUpdateSmartTaskStatus?: (task: SmartTask, nextStatus: SmartTask['status']) => void;

  okrs?: OkrObjective[];
  staffDirectory?: ErpStaffMember[];
  lsxOrders?: ErpLsxOrder[];
  navIntent?: NavigationContextIntent | null;
  onClearIntent?: () => void;
  onOpenTheoryDrawer: (code: FrameworkCode) => void;
  onNavigateTab: (tab: CeoTabId, subView?: string, prefill?: any) => void;
  activeUserName?: string;
}

export const SmartGoalsView: React.FC<SmartGoalsViewProps> = ({
  smartTasks,
  onSaveSmartTask,
  onDeleteSmartTask,
  onFollowUpSmartTask,
  onUpdateSmartTaskStatus,

  okrs = [],
  staffDirectory = [],
  lsxOrders = [],
  navIntent,
  onClearIntent,
  onOpenTheoryDrawer,
  onNavigateTab,
  activeUserName = 'CEO',
}) => {
  const todayYmd = getLocalTodayYmd();

  // ─── BỘ LỌC MIỀN CHIẾN LƯỢC & TÌM KIẾM ─────────────────────────────────────
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [scoreFilter, setScoreFilter] = useState<'ALL' | 'COMPLIANT' | 'NEEDS_AUDIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── MODAL TẠO / SỬA MỤC TIÊU SMART ────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SmartTask | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDomain, setFormDomain] = useState<SmartDomain>('PRODUCTION');
  const [formDept, setFormDept] = useState('Sản xuất');
  const [formAssignee, setFormAssignee] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDueDate, setFormDueDate] = useState(todayYmd);
  const [formDueTime, setFormDueTime] = useState('17:00');
  const [formPriority, setFormPriority] = useState<SmartTask['priority']>('HIGH');
  const [formLinkedLsx, setFormLinkedLsx] = useState('');
  const [formLinkedOkr, setFormLinkedOkr] = useState('');

  const [formCriteria, setFormCriteria] = useState<SmartCriteria>({
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
  });

  // Điểm SMART Score tính real-time của Form
  const liveSmartScore = useMemo(() => computeSmartScore(formCriteria), [formCriteria]);

  // Chỉ lấy nhóm Mục tiêu định lượng SMART (tách biệt hoàn toàn với Tác vụ vận hành DRI)
  const goalTasks = useMemo(
    () => smartTasks.filter((t) => !isDriActionTask(t)),
    [smartTasks]
  );

  // Nhận dữ liệu chuyển tiếp 1-Click từ Chiến lược TOWS, OKR, Nhân sự Maslow, hoặc ERP
  useEffect(() => {
    if (!navIntent || navIntent.tab !== 'smart') return;
    setEditingTask(null);
    setFormTitle(navIntent.prefillTitle || '');
    const matchedStaff = navIntent.prefillAssignee
      ? staffDirectory.find(
          (s) =>
            s.name === navIntent.prefillAssignee ||
            navIntent.prefillAssignee?.includes(s.name)
        )
      : undefined;
    setFormDomain('PRODUCTION');
    setFormDept(matchedStaff?.department || staffDirectory[0]?.department || 'Sản xuất');
    setFormAssignee(navIntent.prefillAssignee || staffDirectory[0]?.name || '');
    setFormRole(matchedStaff?.role || staffDirectory[0]?.role || '');
    setFormDueDate(todayYmd);
    setFormDueTime('17:00');
    setFormPriority('HIGH');
    setFormLinkedLsx(navIntent.prefillLsxCode || '');
    setFormLinkedOkr(navIntent.prefillOkrId || okrs[0]?.id || '');
    setFormCriteria({
      specific: navIntent.prefillTitle
        ? `Triển khai mục tiêu: ${navIntent.prefillTitle}`
        : '',
      measurable: '',
      achievable: '',
      relevant:
        navIntent.prefillDescription ||
        'Đóng góp trực tiếp vào mục tiêu chiến lược OKR quý',
      timeBound: `Hoàn tất trước 17:00 ngày ${todayYmd}`,
    });
    setIsModalOpen(true);
    onClearIntent?.();
  }, [navIntent, onClearIntent, staffDirectory, okrs, todayYmd]);

  // ─── THỐNG KÊ CHIẾN LƯỢC TOÀN BỘ MỤC TIÊU ─────────────────────────────────
  const stats = useMemo(() => {
    const total = goalTasks.length;
    const compliant = goalTasks.filter((t) => (t.smartScore ?? computeSmartScore(t.smart)) >= 80).length;
    const measurable = goalTasks.filter((t) => t.smart?.measurable && /\d/.test(t.smart.measurable)).length;
    const linkedOkr = goalTasks.filter((t) => Boolean(t.linkedOkrId)).length;
    const avgScore =
      total > 0
        ? Math.round(
            goalTasks.reduce((acc, t) => acc + (t.smartScore ?? computeSmartScore(t.smart)), 0) /
              total
          )
        : 0;

    return { total, compliant, measurable, linkedOkr, avgScore };
  }, [goalTasks]);

  // ─── LỌC DANH SÁCH MỤC TIÊU ────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return goalTasks.filter((task) => {
      if (selectedDomain !== 'ALL') {
        const domain = task.domain || 'PRODUCTION';
        if (domain !== selectedDomain) return false;
      }

      const score = task.smartScore ?? computeSmartScore(task.smart);
      if (scoreFilter === 'COMPLIANT' && score < 80) return false;
      if (scoreFilter === 'NEEDS_AUDIT' && score >= 80) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchAssignee = task.assigneeName.toLowerCase().includes(q);
        const matchDept = task.department.toLowerCase().includes(q);
        const matchLsx = (task.linkedLsxCode || '').toLowerCase().includes(q);
        const matchM = (task.smart?.measurable || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAssignee && !matchDept && !matchLsx && !matchM) return false;
      }

      return true;
    });
  }, [goalTasks, selectedDomain, scoreFilter, searchQuery]);

  // ─── HANDLERS MODAL ────────────────────────────────────────────────────────
  const handleOpenNewModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDomain('PRODUCTION');
    setFormDept(staffDirectory[0]?.department || 'Xưởng In Flexo');
    setFormAssignee(staffDirectory[0]?.name || '');
    setFormRole(staffDirectory[0]?.role || '');
    setFormDueDate(todayYmd);
    setFormDueTime('17:00');
    setFormPriority('HIGH');
    setFormLinkedLsx(lsxOrders[0]?.lsxCode || '');
    setFormLinkedOkr(okrs[0]?.id || '');
    setFormCriteria({
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      timeBound: `Hoàn tất trước 17:00 ngày ${todayYmd}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: SmartTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDomain(task.domain || 'PRODUCTION');
    setFormDept(task.department);
    setFormAssignee(task.assigneeName);
    setFormRole(task.assigneeRole || '');
    setFormDueDate(task.dueDate);
    setFormDueTime(task.dueTime || '17:00');
    setFormPriority(task.priority);
    setFormLinkedLsx(task.linkedLsxCode || '');
    setFormLinkedOkr(task.linkedOkrId || '');
    setFormCriteria({
      specific: task.smart?.specific || '',
      measurable: task.smart?.measurable || '',
      achievable: task.smart?.achievable || '',
      relevant: task.smart?.relevant || '',
      timeBound: task.smart?.timeBound || `Trước ${task.dueDate}`,
    });
    setIsModalOpen(true);
  };

  // ─── GỌI AI THẨM ĐỊNH & VIẾT LẠI 5 TIÊU CHUẨN SMART ────────────────────────
  const handleAiGenerateSmart = async () => {
    if (!formTitle.trim()) {
      dialogService.toast('Vui lòng nhập tên mục tiêu trước khi nhờ AI chuẩn hóa!', 'error');
      return;
    }

    try {
      setIsAiGenerating(true);
      const refined = await ceoAiService.generateSmartCriteria(
        formTitle,
        formDept,
        formDueDate,
        `Miền chiến lược: ${formDomain}. Phụ trách: ${formAssignee}. LSX: ${formLinkedLsx}.`
      );

      setFormCriteria(refined);
      dialogService.toast('AI đã chuẩn hóa thành công 5 tiêu chuẩn SMART!', 'success');
    } catch (err: any) {
      console.error(err);
      dialogService.toast('Không thể kích hoạt trợ lý AI: ' + (err.message || ''), 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // ─── LƯU FORM MỤC TIÊU ─────────────────────────────────────────────────────
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      dialogService.toast('Vui lòng nhập tên mục tiêu!', 'error');
      return;
    }

    const taskToSave: SmartTask = {
      id: editingTask?.id || `smart-${Date.now()}`,
      taskType: 'SMART_GOAL',
      title: formTitle.trim(),
      department: formDept,
      domain: formDomain,
      assigneeName: formAssignee || 'Chưa phân công',
      assigneeRole: formRole || undefined,
      dueDate: formDueDate,
      dueTime: formDueTime,
      priority: formPriority,
      status: editingTask?.status || 'IN_PROGRESS',
      progress: editingTask?.progress || 0,
      smart: formCriteria,
      smartScore: liveSmartScore,
      linkedLsxCode: formLinkedLsx || undefined,
      linkedOkrId: formLinkedOkr || undefined,
      followUpCount: editingTask?.followUpCount || 0,
      lastFollowUpAt: editingTask?.lastFollowUpAt,
      isPushedToErp: editingTask?.isPushedToErp || false,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
    };

    await onSaveSmartTask(taskToSave);
    setIsModalOpen(false);
    dialogService.toast(
      editingTask
        ? 'Đã cập nhật mục tiêu SMART thành công!'
        : 'Đã xác lập mục tiêu SMART chiến lược mới!',
      'success'
    );
  };

  return (
    <div className="space-y-4">
      {/* ─── 1. THẺ CHỈ SỐ KPI ĐẠT CHUẨN SMART (LUXURY EXECUTIVE LIGHT STAGE) ─── */}
      <div className="ceo-card p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Chỉ Số Thẩm Định Mục Tiêu
              </h2>
              <p className="text-[11px] text-slate-500 font-normal">
                Đo lường độ sắc bén và tính khả thi của mục tiêu theo chuẩn SMART
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenTheoryDrawer('SMART')}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Sổ tay SMART</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewModal}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thiết Lập Mục Tiêu Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI Chiến Lược */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-0.5">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <span>Tổng mục tiêu SMART</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Target className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 font-bold text-base sm:text-lg flex items-baseline gap-2">
              <span className="font-mono text-slate-900 tracking-tight">{stats.total}</span>
              <span className="text-[11px] font-medium text-slate-500">mục tiêu</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <span>Đạt chuẩn SMART (≥80)</span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 font-bold text-base sm:text-lg flex items-baseline gap-2">
              <span className="font-mono text-slate-900 tracking-tight">{stats.compliant}</span>
              <span className="text-[11px] font-medium text-slate-500">
                ({stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <span>Định lượng con số (M)</span>
              <div className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 font-bold text-base sm:text-lg flex items-baseline gap-2">
              <span className="font-mono text-slate-900 tracking-tight">{stats.measurable}</span>
              <span className="text-[11px] font-medium text-slate-500">
                ({stats.total > 0 ? Math.round((stats.measurable / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <span>Điểm chuẩn bình quân</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 font-bold text-base sm:text-lg flex items-baseline gap-2">
              <span className="font-mono text-slate-900 tracking-tight">{stats.avgScore}</span>
              <span className="text-[11px] font-medium text-slate-500">/ 100 điểm</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. KHỐI 5 TIÊU CHUẨN S-M-A-R-T (CRITERIA AUDIT CARDS) ───────────── */}
      <div className="ceo-card p-3 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
              Tiêu Chuẩn Thẩm Định Mục Tiêu Chiến Lược (5 Tiêu Chí S-M-A-R-T)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Thang điểm 100 • 20 điểm/tiêu chí
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-0.5">
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                S
              </span>
              <span className="text-[10px] font-bold text-slate-400">Cụ thể</span>
            </div>
            <div className="font-extrabold text-xs text-slate-800">Cụ Thể & Rõ Ràng</div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Định danh công việc, phạm vi, địa điểm và đối tượng cụ thể. Không mơ hồ.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                M
              </span>
              <span className="text-[10px] font-bold text-slate-400">Đo lường</span>
            </div>
            <div className="font-extrabold text-xs text-slate-800">Đo Lường Bằng Số</div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Bắt buộc có con số KPI: sản lượng, doanh số, tỷ lệ lỗi, tiến độ hoàn thành %.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">
                A
              </span>
              <span className="text-[10px] font-bold text-slate-400">Khả thi</span>
            </div>
            <div className="font-extrabold text-xs text-slate-800">Khả Thi Thực Tế</div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Có phương án nguồn lực rõ ràng (máy móc, vật tư, nhân lực, công nghệ đáp ứng).
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center">
                R
              </span>
              <span className="text-[10px] font-bold text-slate-400">Thích hợp</span>
            </div>
            <div className="font-extrabold text-xs text-slate-800">Đồng Bộ OKR</div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Mục tiêu trực tiếp đóng góp vào OKR quý của công ty hoặc tháo gỡ điểm nghẽn lớn.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">
                T
              </span>
              <span className="text-[10px] font-bold text-slate-400">Thời hạn</span>
            </div>
            <div className="font-extrabold text-xs text-slate-800">Thời Hạn Cam Kết</div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Mốc ngày & giờ hoàn tất cụ thể, tạo áp lực thời gian để đo lường kỷ luật.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 3. BẢNG MA TRẬN MỤC TIÊU SMART CHIẾN LƯỢC ──────────────────────── */}
      <div className="ceo-card p-4 space-y-3">
        {/* Bộ lọc 7 Miền Chiến Lược */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 pb-3">
          <button
            type="button"
            onClick={() => setSelectedDomain('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDomain === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả miền ({goalTasks.length})
          </button>

          {SMART_DOMAINS.map((dom) => {
            const count = goalTasks.filter((t) => (t.domain || 'PRODUCTION') === dom.id).length;
            const isSelected = selectedDomain === dom.id;

            return (
              <button
                key={dom.id}
                type="button"
                onClick={() => setSelectedDomain(dom.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{dom.icon}</span>
                <span>{dom.shortLabel}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Thanh công cụ tìm kiếm & lọc điểm chuẩn */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setScoreFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                scoreFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả điểm ({goalTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setScoreFilter('COMPLIANT')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                scoreFilter === 'COMPLIANT'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Đạt chuẩn ≥80 ({stats.compliant})
            </button>
            <button
              type="button"
              onClick={() => setScoreFilter('NEEDS_AUDIT')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                scoreFilter === 'NEEDS_AUDIT'
                  ? 'bg-amber-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cần chuẩn hóa &lt;80 ({stats.total - stats.compliant})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mục tiêu, thước đo, phụ trách..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Bảng dữ liệu SMART Clean Table UI */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-600 uppercase font-extrabold text-[10.5px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Mục tiêu & Miền chiến lược</th>
                <th className="py-2.5 px-3">Thước đo định lượng (M)</th>
                <th className="py-2.5 px-3">Khả thi & Nguồn lực (A)</th>
                <th className="py-2.5 px-3">Hạn chót (T)</th>
                <th className="py-2.5 px-3">Điểm chuẩn</th>
                <th className="py-2.5 px-3">Người phụ trách</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-white">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    Không tìm thấy mục tiêu SMART nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const score = task.smartScore ?? computeSmartScore(task.smart);
                  const domainInfo =
                    SMART_DOMAINS.find((d) => d.id === task.domain) || SMART_DOMAINS[0];
                  const dueBadge = formatRelativeDueBadge(task.dueDate);

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Cột 1: Tên mục tiêu & Miền */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${domainInfo.badgeBg}`}
                            >
                              {domainInfo.icon} {domainInfo.shortLabel}
                            </span>
                            {task.linkedLsxCode && (
                              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                LSX: {task.linkedLsxCode}
                              </span>
                            )}
                            {task.linkedOkrId && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                🔗 Gắn OKR
                              </span>
                            )}
                          </div>
                          <div className="font-extrabold text-sm text-slate-900 leading-snug">
                            {task.title}
                          </div>
                          {task.smart?.specific && (
                            <div className="text-[10.5px] text-slate-500 line-clamp-1">
                              <span className="font-semibold text-slate-700">Cụ thể (S):</span>{' '}
                              {task.smart.specific}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 2: Thước đo định lượng (M) */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="text-[11px] text-slate-800 font-medium leading-relaxed">
                          {task.smart?.measurable ? (
                            <span className="bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200/80 font-semibold">
                              {task.smart.measurable}
                            </span>
                          ) : (
                            <span className="text-rose-500 italic">Chưa có số liệu đo lường</span>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Khả thi (A) */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="text-[11px] text-slate-600 line-clamp-2">
                          {task.smart?.achievable || 'Chưa ghi chú nguồn lực thực thi'}
                        </div>
                      </td>

                      {/* Cột 4: Hạn chót (T) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            task.status === 'DONE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : dueBadge.tone === 'overdue'
                              ? 'bg-rose-50 text-rose-700'
                              : dueBadge.tone === 'today'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {dueBadge.text}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{task.dueDate}</div>
                      </td>

                      {/* Cột 5: Điểm chuẩn SMART */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.8 rounded-lg text-xs font-black border ${
                              score >= 80
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : score >= 50
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            {score} / 100
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {score >= 80 ? 'Chuẩn' : score >= 50 ? 'Khá' : 'Yếu'}
                          </span>
                        </div>
                      </td>

                      {/* Cột 6: Phụ trách */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span>👤</span>
                          <span>{task.assigneeName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{task.department}</div>
                      </td>

                      {/* Cột 7: Thao tác (Quy chuẩn User Rule 2: ẩn mặc định, hover hiện) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateTab('pdca', 'PDCA', {
                                title: task.title,
                                assignee: task.assigneeName,
                                lsxCode: task.linkedLsxCode,
                                smartTask: task,
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title="Mổ xẻ điểm nghẽn bằng chu trình cải tiến PDCA"
                          >
                            <RefreshCw className="w-3 h-3 text-indigo-600" />
                            <span>PDCA</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateTab('meetings', 'MEETINGS', {
                                title: `Họp đôn đốc mục tiêu: ${task.title}`,
                                assignee: task.assigneeName,
                                smartTask: task,
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title="Triệu tập Họp 3-6-9 giám sát mục tiêu này"
                          >
                            <Users className="w-3 h-3 text-amber-700" />
                            <span>Họp 3-6-9</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                            title="Chỉnh sửa mục tiêu"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await dialogService.confirm(
                                `Bạn có chắc chắn muốn xóa mục tiêu "${task.title}"?`,
                                'Xóa mục tiêu SMART'
                              );
                              if (ok) onDeleteSmartTask(task.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
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

      {/* ─── MODAL: THIẾT LẬP & THẨM ĐỊNH MỤC TIÊU SMART ────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {editingTask ? 'Hiệu Chỉnh Mục Tiêu SMART' : 'Thiết Lập Mục Tiêu SMART Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Đảm bảo đủ 5 tiêu chuẩn S-M-A-R-T để tối ưu hóa hiệu quả thực thi.
                  </p>
                </div>
              </div>

              {/* Live Score Badge */}
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-xl font-black text-xs border flex items-center gap-1.5 ${
                    liveSmartScore >= 80
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : liveSmartScore >= 50
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <span>Điểm SMART:</span>
                  <span className="text-sm">{liveSmartScore}</span>
                  <span>/ 100</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveForm} className="p-4 space-y-4 overflow-y-auto">
              {/* Tên mục tiêu & Nút AI */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Tên Mục Tiêu Chiến Lược *</label>
                  <button
                    type="button"
                    onClick={handleAiGenerateSmart}
                    disabled={isAiGenerating}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAiGenerating ? 'AI đang thẩm định...' : 'Trợ lý AI viết lại SMART'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Nâng cao năng lực xưởng Flexo, giảm phế phẩm đơn hàng decal xuống dưới 1.5%..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                />
              </div>

              {/* Miền chiến lược (7 Domains) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Miền Chiến Lược</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SMART_DOMAINS.map((dom) => (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => {
                        setFormDomain(dom.id);
                        if (!editingTask) setFormDept(dom.defaultDept);
                      }}
                      className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        formDomain === dom.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{dom.icon}</span>
                      <span className="truncate">{dom.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DRI, Phòng ban, Hạn chót */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Người phụ trách (DRI) *</label>
                  <select
                    value={formAssignee}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormAssignee(name);
                      const found = staffDirectory.find((s) => s.name === name);
                      if (found) {
                        setFormDept(found.department);
                        setFormRole(found.role);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  >
                    {staffDirectory.map((staff) => (
                      <option key={staff.id} value={staff.name}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                    {!staffDirectory.some((s) => s.name === formAssignee) && (
                      <option value={formAssignee}>{formAssignee}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phòng ban</label>
                  <input
                    type="text"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Hạn hoàn thành (T)</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => {
                      setFormDueDate(e.target.value);
                      setFormCriteria((prev) => ({
                        ...prev,
                        timeBound: `Hoàn tất trước 17:00 ngày ${e.target.value}`,
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* 5 TIÊU CHÍ CHI TIẾT S - M - A - R - T */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Chi Tiết 5 Tiêu Chuẩn S-M-A-R-T</span>
                  <span className="text-[10.5px] text-slate-500 font-semibold normal-case">
                    Nhập chi tiết từng mục để đạt điểm tối đa (100)
                  </span>
                </div>

                {/* S - Cụ thể */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>S - Cụ Thể (Specific): Làm gì, ở đâu, phạm vi nào?</span>
                    <span className="text-[10px] text-blue-700 font-bold">+20 điểm</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formCriteria.specific}
                    onChange={(e) =>
                      setFormCriteria((prev) => ({ ...prev, specific: e.target.value }))
                    }
                    placeholder="VD: Tập trung in ấn và kiểm soát chất lượng tem nhãn decal cuộn cho các đơn hàng xuất khẩu..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:border-slate-800 resize-none"
                  />
                </div>

                {/* M - Đo lường */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>M - Đo Lường (Measurable): Đo bằng con số / tỷ lệ cụ thể nào?</span>
                    <span className="text-[10px] text-emerald-700 font-bold">+20 điểm (cần con số)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formCriteria.measurable}
                    onChange={(e) =>
                      setFormCriteria((prev) => ({ ...prev, measurable: e.target.value }))
                    }
                    placeholder="VD: Đạt 100% sản lượng 50,000 tem, phế phẩm cuộn dưới 1.5%, lỗi Barcode AQL 1.0..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:border-slate-800 resize-none"
                  />
                </div>

                {/* A - Khả thi */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>A - Khả Thi (Achievable): Nguồn lực máy móc, vật tư, nhân lực nào?</span>
                    <span className="text-[10px] text-amber-700 font-bold">+20 điểm</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formCriteria.achievable}
                    onChange={(e) =>
                      setFormCriteria((prev) => ({ ...prev, achievable: e.target.value }))
                    }
                    placeholder="VD: Ưu tiên trạm in Flexo máy số 1, bố trí 2 thợ chính tăng ca 2 giờ..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:border-slate-800 resize-none"
                  />
                </div>

                {/* R - Thích hợp / OKR */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>R - Thích Hợp (Relevant): Đóng góp gì cho chiến lược & OKR?</span>
                    <span className="text-[10px] text-purple-700 font-bold">+20 điểm</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formCriteria.relevant}
                    onChange={(e) =>
                      setFormCriteria((prev) => ({ ...prev, relevant: e.target.value }))
                    }
                    placeholder="VD: Giữ vững uy tín giao hàng đúng hẹn cho khách hàng FDI, hỗ trợ mục tiêu doanh số quý..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:border-slate-800 resize-none"
                  />
                </div>

                {/* T - Thời hạn */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>T - Thời Hạn (Time-bound): Mốc hoàn thành cam kết</span>
                    <span className="text-[10px] text-rose-700 font-bold">+20 điểm</span>
                  </label>
                  <input
                    type="text"
                    value={formCriteria.timeBound}
                    onChange={(e) =>
                      setFormCriteria((prev) => ({ ...prev, timeBound: e.target.value }))
                    }
                    placeholder={`VD: Bàn giao sang tổ đóng gói trước 17:00 ngày ${formDueDate}`}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Liên kết OKR & Lệnh SX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Liên kết OKR Quý</label>
                  <select
                    value={formLinkedOkr}
                    onChange={(e) => setFormLinkedOkr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="">Không liên kết OKR</option>
                    {okrs.map((okr) => (
                      <option key={okr.id} value={okr.id}>
                        {okr.quarter}: {okr.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Lệnh SX liên kết (nếu có)</label>
                  <select
                    value={formLinkedLsx}
                    onChange={(e) => setFormLinkedLsx(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="">Không liên kết LSX</option>
                    {lsxOrders.map((lsx) => (
                      <option key={lsx.id} value={lsx.lsxCode || lsx.id}>
                        {lsx.lsxCode || lsx.id} ({lsx.customer})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl btn-25d-primary text-xs font-bold cursor-pointer shadow-xs"
                >
                  {editingTask ? 'Lưu Mục Tiêu' : 'Xác Lập Mục Tiêu SMART'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
