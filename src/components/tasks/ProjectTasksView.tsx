import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Send,
  Users,
  Briefcase,
  Flame,
  Kanban,
  List,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  SmartTask,
  ScheduleItem,
  Meeting369,
  MeetingActionItem,
  CeoTabId,
  NavigationContextIntent,
  isDriActionTask,
} from '../../types/ceoTypes';
import { ErpStaffMember, ErpLsxOrder } from '../../types/erpTypes';
import { getLocalTodayYmd, formatRelativeDueBadge } from '../../utils/dateUtils';
import { isScheduleActiveOnDate } from '../../hooks/useDailyReminderEngine';
import { dialogService } from '../common/CustomDialog';

export interface ProjectTasksViewProps {
  tasks: SmartTask[];
  onSaveTask: (task: SmartTask) => Promise<void> | void;
  onDeleteTask: (id: string) => Promise<void> | void;
  onFollowUpTask: (task: SmartTask) => Promise<void> | void;
  onUpdateTaskStatus: (task: SmartTask, nextStatus: SmartTask['status']) => void;

  schedules: ScheduleItem[];
  onSaveSchedule: (item: ScheduleItem) => Promise<void> | void;
  onDeleteSchedule: (id: string) => Promise<void> | void;
  onToggleScheduleDone: (item: ScheduleItem) => Promise<void> | void;

  staffDirectory?: ErpStaffMember[];
  lsxOrders?: ErpLsxOrder[];
  meetings?: Meeting369[];
  navIntent?: NavigationContextIntent | null;
  onClearIntent?: () => void;
  onNavigateTab: (tab: CeoTabId, subView?: string, prefill?: any) => void;
  activeUserName?: string;
}

const CATEGORY_META: Record<
  ScheduleItem['category'],
  { label: string; bg: string; text: string; border: string }
> = {
  MEETING_369: {
    label: 'Họp 3-6-9',
    bg: 'bg-blue-500/10',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  ERP_REVIEW: {
    label: 'Thị sát Gemba',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  STRATEGY_OKR: {
    label: 'Chiến lược OKR',
    bg: 'bg-purple-500/10',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  COACHING_MASLOW: {
    label: 'Huấn luyện Maslow',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  DEEP_WORK: {
    label: 'Tập trung chuyên sâu',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  PERSONAL: {
    label: 'Lịch cá nhân',
    bg: 'bg-slate-500/10',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};

const PRIORITY_META: Record<
  SmartTask['priority'],
  { label: string; badge: string; border: string; dot: string }
> = {
  URGENT: {
    label: 'Khẩn cấp',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-rose-400',
    dot: 'bg-rose-500',
  },
  HIGH: {
    label: 'Ưu tiên cao',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-amber-400',
    dot: 'bg-amber-500',
  },
  MEDIUM: {
    label: 'Trung bình',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
  },
  LOW: {
    label: 'Thấp',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
};

export const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({
  tasks,
  onSaveTask,
  onDeleteTask,
  onFollowUpTask,
  onUpdateTaskStatus,

  schedules,
  onSaveSchedule,
  onDeleteSchedule,
  onToggleScheduleDone,

  staffDirectory = [],
  lsxOrders = [],
  meetings = [],
  navIntent,
  onClearIntent,
  onNavigateTab,
  activeUserName = 'CEO',
}) => {
  const todayYmd = getLocalTodayYmd();

  // Chế độ xem: Bảng Kanban hoặc Bảng danh sách Clean Table
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  // Mặc định chỉ hiển thị Tác vụ vận hành DRI (không lặp danh sách với Mục tiêu SMART)
  const [includeSmartGoals, setIncludeSmartGoals] = useState(false);

  // Thu gọn / Mở rộng Lịch trình điều hành ngày
  const [schedulesCollapsed, setSchedulesCollapsed] = useState(false);

  // Bộ lọc Tác vụ
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'DONE'>('ACTIVE');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SmartTask | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  // Form Task fields
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormDept, setTaskFormDept] = useState('Xưởng In Flexo');
  const [taskFormAssignee, setTaskFormAssignee] = useState('');
  const [taskFormRole, setTaskFormRole] = useState('');
  const [taskFormDueDate, setTaskFormDueDate] = useState(todayYmd);
  const [taskFormDueTime, setTaskFormDueTime] = useState('17:00');
  const [taskFormPriority, setTaskFormPriority] = useState<SmartTask['priority']>('HIGH');
  const [taskFormStatus, setTaskFormStatus] = useState<SmartTask['status']>('IN_PROGRESS');
  const [taskFormProgress, setTaskFormProgress] = useState(0);
  const [taskFormLsx, setTaskFormLsx] = useState('');
  const [taskFormMeasurable, setTaskFormMeasurable] = useState('');

  // Form Schedule fields
  const [schedFormTitle, setSchedFormTitle] = useState('');
  const [schedFormStartTime, setSchedFormStartTime] = useState('09:00');
  const [schedFormEndTime, setSchedFormEndTime] = useState('09:45');
  const [schedFormDate, setSchedFormDate] = useState(todayYmd);
  const [schedFormRepeat, setSchedFormRepeat] = useState<ScheduleItem['repeat']>('DAILY');
  const [schedFormCategory, setSchedFormCategory] = useState<ScheduleItem['category']>('MEETING_369');
  const [schedFormPriority, setSchedFormPriority] = useState<ScheduleItem['priority']>('HIGH');
  const [schedFormLinkedPerson, setSchedFormLinkedPerson] = useState('');
  const [schedFormLinkedLsx, setSchedFormLinkedLsx] = useState('');
  const [schedFormNotes, setSchedFormNotes] = useState('');

  // ─── THỐNG KÊ LỊCH TRÌNH HÔM NAY ──────────────────────────────────────────
  const todaySchedules = useMemo(
    () => schedules.filter((s) => s.date === todayYmd || isScheduleActiveOnDate(s, todayYmd)),
    [schedules, todayYmd]
  );
  const todayDoneSchedulesCount = useMemo(
    () => todaySchedules.filter((s) => s.completedDates?.includes(todayYmd)).length,
    [todaySchedules, todayYmd]
  );

  // Nhận prefill 1-Click từ các phân hệ khác để mở ngay hộp thoại Giao Việc Nhanh DRI
  useEffect(() => {
    if (!navIntent || navIntent.tab !== 'tasks') return;
    setEditingTask(null);
    setTaskFormTitle(navIntent.prefillTitle || '');
    const matchedStaff = navIntent.prefillAssignee
      ? staffDirectory.find(
          (s) =>
            s.name === navIntent.prefillAssignee ||
            navIntent.prefillAssignee?.includes(s.name)
        )
      : undefined;
    setTaskFormDept(matchedStaff?.department || staffDirectory[0]?.department || 'Xưởng In Flexo');
    setTaskFormAssignee(navIntent.prefillAssignee || staffDirectory[0]?.name || '');
    setTaskFormRole(matchedStaff?.role || staffDirectory[0]?.role || '');
    setTaskFormDueDate(todayYmd);
    setTaskFormDueTime('17:00');
    setTaskFormPriority('HIGH');
    setTaskFormStatus('IN_PROGRESS');
    setTaskFormProgress(0);
    setTaskFormLsx(navIntent.prefillLsxCode || '');
    setTaskFormMeasurable(navIntent.prefillDescription || '');
    setIsTaskModalOpen(true);
    onClearIntent?.();
  }, [navIntent, onClearIntent, staffDirectory, todayYmd]);

  // Danh sách tác vụ theo phạm vi (Mặc định chỉ Tác vụ DRI để tránh trùng lặp với Mục tiêu SMART)
  const scopedTasks = useMemo(
    () => (includeSmartGoals ? tasks : tasks.filter((t) => isDriActionTask(t))),
    [tasks, includeSmartGoals]
  );

  // ─── THỐNG KÊ TÁC VỤ DRI ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = scopedTasks.length;
    const active = scopedTasks.filter((t) => t.status !== 'DONE').length;
    const done = scopedTasks.filter((t) => t.status === 'DONE').length;
    const overdue = scopedTasks.filter((t) => {
      if (t.status === 'DONE') return false;
      return t.dueDate < todayYmd;
    }).length;
    const totalFollowUps = scopedTasks.reduce((acc, t) => acc + (t.followUpCount || 0), 0);

    return { total, active, done, overdue, totalFollowUps };
  }, [scopedTasks, todayYmd]);

  // ─── DANH SÁCH TÁC VỤ SAU LỌC ──────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return scopedTasks.filter((task) => {
      if (statusFilter === 'ACTIVE' && task.status === 'DONE') return false;
      if (statusFilter === 'DONE' && task.status !== 'DONE') return false;
      if (statusFilter === 'OVERDUE') {
        if (task.status === 'DONE' || task.dueDate >= todayYmd) return false;
      }

      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
      if (departmentFilter !== 'ALL' && task.department !== departmentFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchAssignee = task.assigneeName.toLowerCase().includes(q);
        const matchDept = task.department.toLowerCase().includes(q);
        const matchLsx = (task.linkedLsxCode || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAssignee && !matchDept && !matchLsx) return false;
      }

      return true;
    });
  }, [scopedTasks, statusFilter, priorityFilter, departmentFilter, searchQuery, todayYmd]);

  // Chia theo 4 cột Kanban
  const kanbanColumns = useMemo(() => {
    return {
      TODO: filteredTasks.filter((t) => t.status === 'TODO'),
      IN_PROGRESS: filteredTasks.filter((t) => t.status === 'IN_PROGRESS'),
      REVIEW: filteredTasks.filter((t) => t.status === 'REVIEW'),
      DONE: filteredTasks.filter((t) => t.status === 'DONE'),
    };
  }, [filteredTasks]);

  // Danh sách phòng ban duy nhất để lọc
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    scopedTasks.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [scopedTasks]);

  // ─── ACTION ITEMS TỒN ĐỌNG TỪ HỌP 3-6-9 ─────────────────────────────────────
  const pendingMeetingActions = useMemo(() => {
    const list: Array<{
      meetingId: string;
      meetingTitle: string;
      actionItem: MeetingActionItem;
    }> = [];
    meetings.forEach((m) => {
      (m.actionItems || []).forEach((act) => {
        if (act.status !== 'COMPLETED') {
          list.push({
            meetingId: m.id,
            meetingTitle: m.title,
            actionItem: act,
          });
        }
      });
    });
    return list;
  }, [meetings]);

  // ─── HANDLERS MODAL TÁC VỤ ────────────────────────────────────────────────
  const handleOpenNewTaskModal = () => {
    setEditingTask(null);
    setTaskFormTitle('');
    setTaskFormDept(staffDirectory[0]?.department || 'Xưởng In Flexo');
    setTaskFormAssignee(staffDirectory[0]?.name || '');
    setTaskFormRole(staffDirectory[0]?.role || '');
    setTaskFormDueDate(todayYmd);
    setTaskFormDueTime('17:00');
    setTaskFormPriority('HIGH');
    setTaskFormStatus('IN_PROGRESS');
    setTaskFormProgress(0);
    setTaskFormLsx(lsxOrders[0]?.lsxCode || '');
    setTaskFormMeasurable('');
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: SmartTask) => {
    setEditingTask(task);
    setTaskFormTitle(task.title);
    setTaskFormDept(task.department);
    setTaskFormAssignee(task.assigneeName);
    setTaskFormRole(task.assigneeRole || '');
    setTaskFormDueDate(task.dueDate);
    setTaskFormDueTime(task.dueTime || '17:00');
    setTaskFormPriority(task.priority);
    setTaskFormStatus(task.status);
    setTaskFormProgress(task.progress);
    setTaskFormLsx(task.linkedLsxCode || '');
    setTaskFormMeasurable(task.smart?.measurable || '');
    setIsTaskModalOpen(true);
  };

  const handleSaveTaskForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormTitle.trim()) {
      dialogService.toast('Vui lòng nhập tên công việc / tác vụ!', 'error');
      return;
    }

    const taskToSave: SmartTask = {
      id: editingTask?.id || `dri-${Date.now()}`,
      taskType: editingTask?.taskType || 'DRI_ACTION',
      title: taskFormTitle.trim(),
      department: taskFormDept,
      assigneeName: taskFormAssignee || 'Chưa phân công',
      assigneeRole: taskFormRole || undefined,
      dueDate: taskFormDueDate,
      dueTime: taskFormDueTime,
      priority: taskFormPriority,
      status: taskFormStatus,
      progress: taskFormStatus === 'DONE' ? 100 : Number(taskFormProgress),
      linkedLsxCode: taskFormLsx || undefined,
      smart: {
        specific: editingTask?.smart?.specific || taskFormTitle.trim(),
        measurable: taskFormMeasurable || editingTask?.smart?.measurable || 'Hoàn thành 100% mục tiêu',
        achievable: editingTask?.smart?.achievable || 'Nguồn lực nội bộ MVĐN',
        relevant: editingTask?.smart?.relevant || 'Đồng bộ tiến độ điều hành sản xuất',
        timeBound: editingTask?.smart?.timeBound || `Trước ${taskFormDueDate}`,
      },
      smartScore: editingTask?.smartScore || 90,
      followUpCount: editingTask?.followUpCount || 0,
      lastFollowUpAt: editingTask?.lastFollowUpAt,
      isPushedToErp: editingTask?.isPushedToErp || false,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
    };

    await onSaveTask(taskToSave);
    setIsTaskModalOpen(false);
    dialogService.toast(
      editingTask ? 'Đã cập nhật tác vụ thành công!' : 'Đã phân công tác vụ mới thành công!',
      'success'
    );
  };

  // ─── HANDLERS MODAL LỊCH TRÌNH ─────────────────────────────────────────────
  const handleOpenNewScheduleModal = () => {
    setEditingSchedule(null);
    setSchedFormTitle('');
    setSchedFormStartTime('09:00');
    setSchedFormEndTime('09:45');
    setSchedFormDate(todayYmd);
    setSchedFormRepeat('DAILY');
    setSchedFormCategory('MEETING_369');
    setSchedFormPriority('HIGH');
    setSchedFormLinkedPerson('');
    setSchedFormLinkedLsx(lsxOrders[0]?.lsxCode || '');
    setSchedFormNotes('');
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditScheduleModal = (sched: ScheduleItem) => {
    setEditingSchedule(sched);
    setSchedFormTitle(sched.title);
    setSchedFormStartTime(sched.startTime);
    setSchedFormEndTime(sched.endTime);
    setSchedFormDate(sched.date);
    setSchedFormRepeat(sched.repeat);
    setSchedFormCategory(sched.category);
    setSchedFormPriority(sched.priority);
    setSchedFormLinkedPerson(sched.linkedPerson || '');
    setSchedFormLinkedLsx(sched.linkedLsxCode || '');
    setSchedFormNotes(sched.notes || '');
    setIsScheduleModalOpen(true);
  };

  const handleSaveScheduleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedFormTitle.trim()) {
      dialogService.toast('Vui lòng nhập tiêu đề lịch trình!', 'error');
      return;
    }

    const schedToSave: ScheduleItem = {
      id: editingSchedule?.id || `sched-${Date.now()}`,
      title: schedFormTitle.trim(),
      startTime: schedFormStartTime,
      endTime: schedFormEndTime,
      date: schedFormDate,
      repeat: schedFormRepeat,
      category: schedFormCategory,
      priority: schedFormPriority,
      remindMinutesBefore: editingSchedule?.remindMinutesBefore ?? 10,
      linkedPerson: schedFormLinkedPerson || undefined,
      linkedLsxCode: schedFormLinkedLsx || undefined,
      notes: schedFormNotes || undefined,
      completedDates: editingSchedule?.completedDates || [],
      createdAt: editingSchedule?.createdAt || new Date().toISOString(),
    };

    await onSaveSchedule(schedToSave);
    setIsScheduleModalOpen(false);
    dialogService.toast(
      editingSchedule ? 'Đã cập nhật lịch trình thành công!' : 'Đã thêm lịch trình mới!',
      'success'
    );
  };

  // Chuyển nhanh trạng thái Kanban
  const handleMoveKanban = (task: SmartTask, direction: 'NEXT' | 'PREV') => {
    const flow: SmartTask['status'][] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const idx = flow.indexOf(task.status);
    if (idx === -1) return;

    const nextIdx = direction === 'NEXT' ? Math.min(flow.length - 1, idx + 1) : Math.max(0, idx - 1);
    const nextStatus = flow[nextIdx];
    if (nextStatus !== task.status) {
      onUpdateTaskStatus(task, nextStatus);
      dialogService.toast(`Đã chuyển trạng thái sang "${nextStatus}"`, 'info');
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── 1. THẺ CHỈ SỐ KPI THỰC THI (LUXURY EXECUTIVE LIGHT STAGE) ──── */}
      <div className="ceo-card p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <CheckSquare className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Tổng Quan Tiến Độ Thực Thi
              </h2>
              <p className="text-[11px] text-slate-500 font-normal">
                Theo dõi nhịp độ điều hành & tiến độ công việc C-Level real-time
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Toggle: Kanban vs Table */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('KANBAN')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'KANBAN'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Bảng Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Danh Sách</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenNewScheduleModal}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>+ Lịch Điều Hành</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTaskModal}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao Việc Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI Thực Thi Realtime */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-0.5">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <span>Lịch trình hôm nay</span>
              <div className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 font-bold text-base sm:text-lg flex items-baseline gap-2">
              <span className="font-mono text-slate-900 tracking-tight">
                {todayDoneSchedulesCount} <span className="text-slate-400 font-normal text-xs">/ {todaySchedules.length}</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500">mục đã xong</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <span>Tác vụ đang chạy</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 font-bold text-base sm:text-lg flex items-baseline gap-2">
              <span className="font-mono text-slate-900 tracking-tight">{stats.active}</span>
              <span className="text-[11px] font-medium text-slate-500">việc mở</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <span>Tác vụ quá hạn</span>
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${stats.overdue > 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 font-bold text-base sm:text-lg flex items-baseline gap-2">
              <span className={`font-mono tracking-tight ${stats.overdue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {stats.overdue}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {stats.overdue > 0 ? 'cần xử lý ngay' : 'đúng hạn'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              <span>Đôn đốc kỷ luật</span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5 font-bold text-base sm:text-lg flex items-baseline gap-2">
              <span className="font-mono text-slate-900 tracking-tight">{stats.totalFollowUps}</span>
              <span className="text-[11px] font-medium text-slate-500">lượt CEO nhắc</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. KHỐI LỊCH TRÌNH ĐIỀU HÀNH HÔM NAY (CEO DAILY AGENDA) ─────────── */}
      <div className="ceo-card p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                Lịch Trình & Cuộc Hẹn Điều Hành Hôm Nay
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono font-semibold border border-slate-200/80">
                {todayYmd}
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-sky-50 text-sky-700 text-[10px] font-semibold border border-sky-200/70">
                {todaySchedules.length} lịch
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewScheduleModal}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm lịch</span>
            </button>
            <button
              type="button"
              onClick={() => setSchedulesCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              title={schedulesCollapsed ? 'Mở rộng' : 'Thu gọn'}
            >
              {schedulesCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {!schedulesCollapsed && (
          <div>
            {todaySchedules.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-xs text-slate-500 space-y-1.5">
                <p>Chưa có lịch trình nào được đặt cho ngày hôm nay.</p>
                <button
                  type="button"
                  onClick={handleOpenNewScheduleModal}
                  className="text-sky-600 font-semibold hover:underline cursor-pointer"
                >
                  + Thêm lịch trình / cuộc hẹn mới →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todaySchedules.map((item) => {
                  const isDone = item.completedDates?.includes(todayYmd);
                  const cat = CATEGORY_META[item.category] || CATEGORY_META.MEETING_369;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all group flex items-start justify-between gap-3 ${
                        isDone
                          ? 'bg-slate-50/50 border-slate-200/60 opacity-60'
                          : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleScheduleDone(item)}
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border cursor-pointer shrink-0 transition-colors ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-slate-500 bg-white'
                          }`}
                          title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded font-mono text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                              {item.startTime} - {item.endTime}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}
                            >
                              {cat.label}
                            </span>
                            {item.linkedLsxCode && (
                              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                LSX: {item.linkedLsxCode}
                              </span>
                            )}
                          </div>

                          <div
                            className={`font-semibold text-xs sm:text-[13px] leading-snug ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {item.title}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                            {item.linkedPerson && (
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">👤</span>
                                <span>{item.linkedPerson}</span>
                              </div>
                            )}
                            {item.notes && (
                              <div className="italic text-slate-400 line-clamp-1 max-w-sm">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nút Sửa / Xóa lịch trình (Rule 2: ẩn mặc định, hover hiện) */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEditScheduleModal(item)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                          title="Sửa lịch trình"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await dialogService.confirm(
                              `Bạn có chắc chắn muốn xóa lịch trình "${item.title}"?`,
                              'Xóa lịch trình'
                            );
                            if (ok) onDeleteSchedule(item.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Xóa lịch trình"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 3. BẢNG ĐIỀU PHỐI TÁC VỤ THỰC THI DRI ───────────────────────────── */}
      <div className="ceo-card p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Thanh công cụ lọc & tìm kiếm */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <Briefcase className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
                Danh Sách Tác Vụ Thực Thi Theo DRI
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Mỗi công việc gán một DRI duy nhất chịu trách nhiệm kết quả cuối cùng.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc Trạng thái */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đang làm ({stats.active})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('OVERDUE')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'OVERDUE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Quá hạn ({stats.overdue})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DONE')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'DONE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đã xong ({stats.done})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setIncludeSmartGoals((prev) => !prev)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer border ${
                  includeSmartGoals
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Bật để xem gộp cả các Mục tiêu định lượng SMART trên cùng bảng Kanban"
              >
                {includeSmartGoals ? '✓ Kèm Mục tiêu SMART' : '+ Kèm Mục tiêu SMART'}
              </button>
            </div>

            {/* Lọc Phòng ban */}
            {uniqueDepartments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="ALL">Mọi phòng ban</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}

            {/* Tìm kiếm */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tác vụ, DRI, LSX..."
                className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-medium outline-none focus:border-slate-400 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* ─── CHẾ ĐỘ 1: KANBAN BOARD (4 CỘT) ───────────────────────────────── */}
        {viewMode === 'KANBAN' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
            {/* Cột 1: CẦN THỰC HIỆN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-700">
                <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Cần thực hiện</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-white text-slate-700 text-[10.5px] font-bold border border-slate-200">
                  {kanbanColumns.TODO.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[160px]">
                {kanbanColumns.TODO.map((task) => renderKanbanCard(task))}
                {kanbanColumns.TODO.length === 0 && (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400">
                    Không có việc chờ thực hiện
                  </div>
                )}
              </div>
            </div>

            {/* Cột 2: ĐANG TRIỂN KHAI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-900">
                <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Đang triển khai</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-white text-indigo-800 text-[10.5px] font-bold border border-indigo-200">
                  {kanbanColumns.IN_PROGRESS.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[160px]">
                {kanbanColumns.IN_PROGRESS.map((task) => renderKanbanCard(task))}
                {kanbanColumns.IN_PROGRESS.length === 0 && (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400">
                    Không có việc đang chạy
                  </div>
                )}
              </div>
            </div>

            {/* Cột 3: CHỜ NGHIỆM THU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900">
                <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Chờ nghiệm thu</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-800 text-[10.5px] font-bold border border-amber-200">
                  {kanbanColumns.REVIEW.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[160px]">
                {kanbanColumns.REVIEW.map((task) => renderKanbanCard(task))}
                {kanbanColumns.REVIEW.length === 0 && (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400">
                    Không có việc chờ nghiệm thu
                  </div>
                )}
              </div>
            </div>

            {/* Cột 4: ĐÃ HOÀN TẤT */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900">
                <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Đã hoàn tất</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-800 text-[10.5px] font-bold border border-emerald-200">
                  {kanbanColumns.DONE.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[160px]">
                {kanbanColumns.DONE.map((task) => renderKanbanCard(task))}
                {kanbanColumns.DONE.length === 0 && (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400">
                    Chưa có việc hoàn tất
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── CHẾ ĐỘ 2: BẢNG DANH SÁCH (CLEAN TABLE UI) ────────────────────── */}
        {viewMode === 'TABLE' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 min-w-[280px]">Tác vụ & Lệnh sản xuất</th>
                  <th className="py-3 px-3 w-40 whitespace-nowrap">DRI Phụ trách</th>
                  <th className="py-3 px-3 w-28 whitespace-nowrap">Ưu tiên</th>
                  <th className="py-3 px-3 w-32 whitespace-nowrap">Hạn chót</th>
                  <th className="py-3 px-3 w-28 whitespace-nowrap">Tiến độ</th>
                  <th className="py-3 px-3 w-28 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-3 w-28 whitespace-nowrap">Đôn đốc CEO</th>
                  <th className="py-3 px-3 w-36 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500 text-xs">
                      Không tìm thấy tác vụ nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const dueBadge = formatRelativeDueBadge(task.dueDate);
                    const prio = PRIORITY_META[task.priority];

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Cột 1: Tên tác vụ & LSX */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-1 pr-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`font-semibold text-xs sm:text-[13px] leading-snug ${
                                  task.status === 'DONE'
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </span>
                              {task.linkedLsxCode && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono text-[10px] font-bold shrink-0">
                                  LSX: {task.linkedLsxCode}
                                </span>
                              )}
                            </div>
                            {task.smart?.measurable && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                                <span className="font-semibold text-slate-600">Mục tiêu:</span>{' '}
                                <span className="truncate">{task.smart.measurable}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Cột 2: DRI Phụ trách */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10.5px] font-bold text-slate-700 shrink-0">
                              {task.assigneeName ? task.assigneeName.charAt(0) : 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 text-xs truncate">
                                {task.assigneeName}
                              </div>
                              <div className="text-[10.5px] text-slate-400 truncate">
                                {task.department}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cột 3: Ưu tiên */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${prio.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                            <span>{prio.label}</span>
                          </span>
                        </td>

                        {/* Cột 4: Hạn chót */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md font-semibold text-[10.5px] ${
                              task.status === 'DONE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                : dueBadge.tone === 'overdue'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                                : dueBadge.tone === 'today'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                                : 'bg-slate-100 text-slate-700 border border-slate-200/70'
                            }`}
                          >
                            {task.status === 'DONE' ? 'Hoàn tất' : dueBadge.text}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {task.dueDate}
                          </div>
                        </td>

                        {/* Cột 5: Tiến độ */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-700">
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  task.progress >= 100
                                    ? 'bg-emerald-500'
                                    : task.progress >= 50
                                    ? 'bg-sky-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, task.progress)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Cột 6: Trạng thái */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              onUpdateTaskStatus(task, e.target.value as SmartTask['status'])
                            }
                            className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-800 cursor-pointer outline-none focus:border-slate-400"
                          >
                            <option value="TODO">Cần làm</option>
                            <option value="IN_PROGRESS">Đang làm</option>
                            <option value="REVIEW">Chờ duyệt</option>
                            <option value="DONE">Hoàn tất</option>
                          </select>
                        </td>

                        {/* Cột 7: Đôn đốc CEO */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={async () => {
                              await onFollowUpTask(task);
                              dialogService.toast(
                                `Đã gửi chỉ đạo đôn đốc tới ${task.assigneeName}!`,
                                'success'
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50/80 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-[11px] font-semibold cursor-pointer shadow-2xs transition-colors"
                          >
                            <Flame className="w-3 h-3 text-amber-600" />
                            <span>Đôn đốc ({task.followUpCount || 0})</span>
                          </button>
                        </td>

                        {/* Cột 8: Thao tác (Quy chuẩn User Rule 2: ẩn mặc định, hover hiện) */}
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
                              className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10.5px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Chuyển hóa sự cố/tác vụ này thành Chu trình Cải tiến PDCA"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>PDCA</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onNavigateTab('meetings', 'MEETINGS', {
                                  title: `Họp xử lý: ${task.title}`,
                                  assignee: task.assigneeName,
                                  smartTask: task,
                                })
                              }
                              className="px-2 py-0.5 rounded-md bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-[10.5px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Đưa tác vụ/sự cố này vào Họp Giao Ban 3-6-9"
                            >
                              <Users className="w-3 h-3" />
                              <span>Họp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditTaskModal(task)}
                              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                              title="Chỉnh sửa tác vụ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await dialogService.confirm(
                                  `Bạn có chắc chắn muốn xóa tác vụ "${task.title}"?`,
                                  'Xóa tác vụ'
                                );
                                if (ok) onDeleteTask(task.id);
                              }}
                              className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                              title="Xóa tác vụ"
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
        )}
      </div>

      {/* ─── 4. KHỐI ACTION ITEMS SAU HỌP 3-6-9 CẦN ĐÔN ĐỐC ────────────────── */}
      {pendingMeetingActions.length > 0 && (
        <div className="ceo-card p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
                  Nghị Quyết & Hành Động Cần Đôn Đốc Sau Họp 3-6-9
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10.5px] font-semibold border border-indigo-200/80">
                  {pendingMeetingActions.length} việc
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('meetings')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Xem cuộc họp</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingMeetingActions.slice(0, 4).map(({ meetingId, meetingTitle, actionItem }) => (
              <div
                key={actionItem.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-white/80 hover:border-slate-300 hover:shadow-2xs transition-all flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold truncate">
                    Nghị quyết: {meetingTitle}
                  </div>
                  <div className="font-semibold text-xs text-slate-800 truncate">
                    {actionItem.taskTitle}
                  </div>
                  <div className="text-[10.5px] text-slate-500 flex items-center gap-2 font-medium">
                    <span>👤 {actionItem.assigneeName}</span>
                    <span>• Hạn: {actionItem.dueDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!tasks.some((t) => t.title === actionItem.taskTitle) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const newDri: SmartTask = {
                          id: `dri-mtg-${actionItem.id}`,
                          taskType: 'DRI_ACTION',
                          title: actionItem.taskTitle,
                          department: 'Điều hành Họp 3-6-9',
                          assigneeName: actionItem.assigneeName,
                          dueDate: actionItem.dueDate || todayYmd,
                          dueTime: '17:00',
                          priority: 'HIGH',
                          status: 'IN_PROGRESS',
                          progress: 0,
                          smart: {
                            specific: actionItem.taskTitle,
                            measurable: 'Hoàn thành 100% nghị quyết giao ban 3-6-9',
                            achievable: 'Nguồn lực bộ phận phụ trách',
                            relevant: `Nghị quyết cuộc họp: ${meetingTitle}`,
                            timeBound: `Trước ${actionItem.dueDate || todayYmd}`,
                          },
                          smartScore: 85,
                          followUpCount: actionItem.supervisedCount || 0,
                          createdAt: new Date().toISOString(),
                        };
                        await onSaveTask(newDri);
                        dialogService.toast(
                          `Đã đưa "${actionItem.taskTitle}" vào bảng tác vụ DRI!`,
                          'success'
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer shadow-xs transition-colors"
                    >
                      + Vào Bảng DRI
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigateTab('meetings')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    Mở Họp →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: THÊM / SỬA TÁC VỤ DRI ─────────────────────────────────── */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-slate-800" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {editingTask ? 'Chỉnh Sửa Tác Vụ Thực Thi' : 'Phân Công Tác Vụ Mới Cho DRI'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTaskForm} className="p-4 space-y-3.5 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tên công việc / Tác vụ *</label>
                <input
                  type="text"
                  required
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  placeholder="VD: Kiểm tra dao bế và điều phối tăng ca LSX Flexo..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Người phụ trách (DRI) *</label>
                  <select
                    value={taskFormAssignee}
                    onChange={(e) => {
                      const name = e.target.value;
                      setTaskFormAssignee(name);
                      const found = staffDirectory.find((s) => s.name === name);
                      if (found) {
                        setTaskFormDept(found.department);
                        setTaskFormRole(found.role);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  >
                    {staffDirectory.map((staff) => (
                      <option key={staff.id} value={staff.name}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                    {!staffDirectory.some((s) => s.name === taskFormAssignee) && (
                      <option value={taskFormAssignee}>{taskFormAssignee}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phòng ban</label>
                  <input
                    type="text"
                    value={taskFormDept}
                    onChange={(e) => setTaskFormDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mức độ ưu tiên</label>
                  <select
                    value={taskFormPriority}
                    onChange={(e) => setTaskFormPriority(e.target.value as SmartTask['priority'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="URGENT">Khẩn cấp</option>
                    <option value="HIGH">Ưu tiên cao</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="LOW">Thấp</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Trạng thái</label>
                  <select
                    value={taskFormStatus}
                    onChange={(e) => {
                      const st = e.target.value as SmartTask['status'];
                      setTaskFormStatus(st);
                      if (st === 'DONE') setTaskFormProgress(100);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="TODO">Cần thực hiện</option>
                    <option value="IN_PROGRESS">Đang triển khai</option>
                    <option value="REVIEW">Chờ nghiệm thu</option>
                    <option value="DONE">Đã hoàn thành</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tiến độ (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={taskFormProgress}
                      onChange={(e) => setTaskFormProgress(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold w-9 text-right">
                      {taskFormProgress}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Hạn hoàn thành</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={taskFormDueDate}
                      onChange={(e) => setTaskFormDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                    />
                    <input
                      type="time"
                      value={taskFormDueTime}
                      onChange={(e) => setTaskFormDueTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Lệnh SX liên kết</label>
                  <select
                    value={taskFormLsx}
                    onChange={(e) => setTaskFormLsx(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="">Không liên kết</option>
                    {lsxOrders.map((lsx) => (
                      <option key={lsx.id} value={lsx.lsxCode || lsx.id}>
                        {lsx.lsxCode || lsx.id} ({lsx.customer})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Thước đo định lượng / Tiêu chí hoàn thành (M)
                </label>
                <textarea
                  rows={2}
                  value={taskFormMeasurable}
                  onChange={(e) => setTaskFormMeasurable(e.target.value)}
                  placeholder="VD: Đạt 100% sản lượng 50,000 tem, phế phẩm cuộn dưới 1.5%..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-slate-800 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl btn-25d-primary text-xs font-bold cursor-pointer shadow-xs"
                >
                  {editingTask ? 'Lưu Thay Đổi' : 'Giao Việc Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: THÊM / SỬA LỊCH TRÌNH ĐIỀU HÀNH ───────────────────────── */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-800" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {editingSchedule ? 'Chỉnh Sửa Lịch Trình Điều Hành' : 'Đặt Lịch Trình / Cuộc Hẹn Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScheduleForm} className="p-4 space-y-3.5 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tiêu đề lịch trình / cuộc hẹn *</label>
                <input
                  type="text"
                  required
                  value={schedFormTitle}
                  onChange={(e) => setSchedFormTitle(e.target.value)}
                  placeholder="VD: Giao ban 3-6-9 rà soát tiến độ xưởng in Flexo..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ngày diễn ra</label>
                  <input
                    type="date"
                    value={schedFormDate}
                    onChange={(e) => setSchedFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Bắt đầu</label>
                  <input
                    type="time"
                    value={schedFormStartTime}
                    onChange={(e) => setSchedFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kết thúc</label>
                  <input
                    type="time"
                    value={schedFormEndTime}
                    onChange={(e) => setSchedFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Danh mục lịch trình</label>
                  <select
                    value={schedFormCategory}
                    onChange={(e) =>
                      setSchedFormCategory(e.target.value as ScheduleItem['category'])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="MEETING_369">Họp giao ban 3-6-9</option>
                    <option value="ERP_REVIEW">Thị sát Gemba & ERP xưởng</option>
                    <option value="STRATEGY_OKR">Rà soát Chiến lược OKR</option>
                    <option value="COACHING_MASLOW">Huấn luyện nhân sự Maslow</option>
                    <option value="DEEP_WORK">Giờ tập trung chuyên sâu</option>
                    <option value="PERSONAL">Lịch trình cá nhân</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Độ lặp lại</label>
                  <select
                    value={schedFormRepeat}
                    onChange={(e) => setSchedFormRepeat(e.target.value as ScheduleItem['repeat'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="DAILY">Hàng ngày</option>
                    <option value="WEEKDAYS">Thứ 2 đến Thứ 6</option>
                    <option value="WEEKLY">Hàng tuần</option>
                    <option value="ONCE">Chỉ một lần</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Người / Đơn vị liên kết</label>
                  <input
                    type="text"
                    value={schedFormLinkedPerson}
                    onChange={(e) => setSchedFormLinkedPerson(e.target.value)}
                    placeholder="VD: Ban Giám Đốc, Quản đốc xưởng..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Lệnh SX liên kết</label>
                  <select
                    value={schedFormLinkedLsx}
                    onChange={(e) => setSchedFormLinkedLsx(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="">Không liên kết</option>
                    {lsxOrders.map((lsx) => (
                      <option key={lsx.id} value={lsx.lsxCode || lsx.id}>
                        {lsx.lsxCode || lsx.id} ({lsx.customer})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ghi chú điều hành</label>
                <textarea
                  rows={2}
                  value={schedFormNotes}
                  onChange={(e) => setSchedFormNotes(e.target.value)}
                  placeholder="Ghi chú nội dung trọng tâm cuộc họp hoặc thị sát..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-slate-800 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl btn-25d-primary text-xs font-bold cursor-pointer shadow-xs"
                >
                  {editingSchedule ? 'Lưu Lịch Trình' : 'Đặt Lịch Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ─── HELPER RENDER THẺ KANBAN CARD ─────────────────────────────────────────
  function renderKanbanCard(task: SmartTask) {
    const dueBadge = formatRelativeDueBadge(task.dueDate);
    const prio = PRIORITY_META[task.priority];

    return (
      <div
        key={task.id}
        className="p-3 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-all space-y-2 group"
      >
        {/* Header: Dept + Priority + LSX */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-bold truncate max-w-[120px]">
            {task.department}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {task.linkedLsxCode && (
              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {task.linkedLsxCode}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold border ${prio.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
              <span>{prio.label}</span>
            </span>
          </div>
        </div>

        {/* Tiêu đề tác vụ */}
        <div
          className={`font-bold text-xs leading-snug ${
            task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-900'
          }`}
        >
          {task.title}
        </div>

        {/* Measurable Target snippet */}
        {task.smart?.measurable && (
          <div className="text-[10.5px] text-slate-500 line-clamp-2 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100">
            <span className="font-semibold text-slate-700">Mục tiêu:</span> {task.smart.measurable}
          </div>
        )}

        {/* DRI & Hạn chót */}
        <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-100">
          <div className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[130px]">
            <span>👤</span>
            <span className="truncate">{task.assigneeName}</span>
          </div>

          <span
            className={`font-bold px-1.5 py-0.2 rounded-full text-[9.5px] ${
              task.status === 'DONE'
                ? 'bg-emerald-50 text-emerald-700'
                : dueBadge.tone === 'overdue'
                ? 'bg-rose-50 text-rose-700'
                : dueBadge.tone === 'today'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {task.status === 'DONE' ? 'Xong' : dueBadge.text}
          </span>
        </div>

        {/* Thanh tiến độ */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span>Tiến độ</span>
            <span>{task.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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

        {/* Footer Actions: Đôn đốc, Đưa vào PDCA & Chuyển trạng thái */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[10.5px]">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={async () => {
                await onFollowUpTask(task);
                dialogService.toast(
                  `Đã gửi chỉ đạo đôn đốc tới ${task.assigneeName}!`,
                  'success'
                );
              }}
              className="inline-flex items-center gap-1 px-2 py-0.8 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-extrabold cursor-pointer transition-colors shadow-2xs"
              title="Đôn đốc tiến độ DRI"
            >
              <Flame className="w-3 h-3 text-amber-600" />
              <span>Đôn đốc ({task.followUpCount || 0})</span>
            </button>

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
              className="inline-flex items-center gap-1 px-2 py-0.8 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold cursor-pointer transition-colors shadow-2xs"
              title="Chuyển hóa sự cố/tác vụ này sang Chu trình Cải tiến gốc rễ PDCA & Chuẩn hóa SOP"
            >
              <RefreshCw className="w-3 h-3 text-emerald-600" />
              <span>Đưa vào PDCA</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {task.status !== 'TODO' && (
              <button
                type="button"
                onClick={() => handleMoveKanban(task, 'PREV')}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                title="Lùi một bước"
              >
                ←
              </button>
            )}
            {task.status !== 'DONE' && (
              <button
                type="button"
                onClick={() => handleMoveKanban(task, 'NEXT')}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold cursor-pointer"
                title="Chuyển bước kế tiếp"
              >
                →
              </button>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              <button
                type="button"
                onClick={() =>
                  onNavigateTab('meetings', 'MEETINGS', {
                    title: `Họp xử lý: ${task.title}`,
                    assignee: task.assigneeName,
                    smartTask: task,
                  })
                }
                className="p-1 rounded text-slate-400 hover:text-violet-700 hover:bg-violet-50 cursor-pointer"
                title="Đưa vào Họp Giao Ban 3-6-9"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenEditTaskModal(task)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Sửa tác vụ"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await dialogService.confirm(
                    `Bạn có chắc chắn muốn xóa tác vụ "${task.title}"?`,
                    'Xóa tác vụ'
                  );
                  if (ok) onDeleteTask(task.id);
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                title="Xóa tác vụ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
