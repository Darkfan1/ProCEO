import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileCheck2,
  Users,
  Compass,
  Edit3,
  Trash2,
  Check,
  X,
  ArrowUpRight,
  Sparkles,
  CalendarClock,
  BookOpen,
  Video,
  Target,
  MessageSquareQuote,
  Award,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  PauseCircle,
} from 'lucide-react';
import {
  AxisScheduleItem,
  AxisSmartTask,
  AxisPdcaCycle,
  AxisMeeting,
  AxisMaslowSession,
  AxisTrainingSession,
  AxisNavigationIntent,
  AxisTabId,
  ErpUser,
  ErpProposal,
  ScheduleRecurrence,
} from '../../types/axisTypes';
import { isScheduleActiveOnDate } from '../../hooks/useReminderEngine';
import { axisDbService } from '../../services/axisDbService';
import { dialogService } from '../common/CustomDialog';
import { theoryService } from '../../services/theoryService';
import { FrameworkCode } from '../../data/managementFrameworksTheory';
import { getMilestoneLabel, getMilestoneQuestion } from './ExecutionTab';
import {
  formatRelativeDueBadge,
  getLocalTodayYmd,
  MASLOW_TIER_LABELS,
  MEETING_TYPE_LABELS,
  parseLocalYmd,
  PDCA_PHASE_LABELS,
} from '../../utils/dateUtils';

interface TodayCockpitTabProps {
  currentUser: ErpUser;
  schedules: AxisScheduleItem[];
  smartTasks: AxisSmartTask[];
  pdcaCycles: AxisPdcaCycle[];
  meetings: AxisMeeting[];
  maslowSessions: AxisMaslowSession[];
  trainings: AxisTrainingSession[];
  radarMetrics: {
    activeLsxCount: number;
    inProgressLsxCount: number;
    completedLsxCount: number;
    overdueOrDueTodayLsx: any[];
    onTimeLsxRate: number;
    pendingProposals: ErpProposal[];
    todayReportsCount: number;
    todayPauses: any[];
    todayLeaves: any[];
  };
  onNavigate: (tab: AxisTabId, intent?: Omit<AxisNavigationIntent, 'tab' | 'ts'>) => void;
}

interface DailyMindsetQuote {
  code: FrameworkCode;
  tag: string;
  principle: string;
}

const DAILY_MINDSET_QUOTES: DailyMindsetQuote[] = [
  {
    code: 'SMART',
    tag: 'Giao Việc SMART',
    principle:
      'Nếu việc giao ra mà cấp dưới làm sai, 80% do lúc giao việc người nhận chưa nhìn thấy cùng một bức tranh đầu ra với CEO.',
  },
  {
    code: '3-6-9',
    tag: 'Kỷ Luật Họp 3-6-9',
    principle:
      'Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Công việc được thực thi đúng kế hoạch.',
  },
  {
    code: 'PDCA',
    tag: 'Chu trình PDCA',
    principle:
      'Mọi sự cố lặp lại lần thứ 2 tại xưởng không phải lỗi con người, mà là lỗ hổng quy trình chưa được chuẩn hóa (Act).',
  },
  {
    code: 'OKR',
    tag: 'Quản trị OKR',
    principle:
      'Nếu tất cả mọi thứ đều là ưu tiên số một, thì thực chất công ty chẳng có ưu tiên nào cả.',
  },
  {
    code: 'PREP',
    tag: 'Diễn đạt PREP',
    principle:
      'Sự rõ ràng của người đứng đầu quyết định tốc độ thực thi: Kết luận trước → Lý do → Dẫn chứng → Chốt hành động.',
  },
  {
    code: 'MASLOW',
    tag: 'Tháp Maslow',
    principle:
      'Khi nhân sự giảm nhiệt huyết, trách phạt không giải quyết được tầng nhu cầu đang đứt gãy bên trong họ.',
  },
  {
    code: 'FFC',
    tag: 'Ghi nhận FFC',
    principle:
      'Một lời khen đúng lúc kèm hành vi/con số thật (Feeling • Fact • Compare) tạo năng lượng gấp 10 lần khen xã giao.',
  },
  {
    code: 'SWOT',
    tag: 'Chiến lược SWOT → TOWS',
    principle:
      'Sức mạnh của SWOT không nằm ở liệt kê, mà ở việc ghép cặp thành mũi nhọn hành động cụ thể.',
  },
];

const RECURRENCE_LABELS: Record<ScheduleRecurrence, string> = {
  ONCE: 'Một lần',
  DAILY: 'Mỗi ngày',
  WEEKDAYS: 'Thứ 2 – Thứ 7',
  WEEKLY: 'Hàng tuần',
};

const CATEGORY_BADGES: Record<AxisScheduleItem['category'], { label: string; cls: string }> = {
  ROUTINE: { label: 'Nghi thức CEO', cls: 'bg-[#0C1B2E]/8 text-[#0C1B2E]' },
  REMINDER: { label: 'Nhắc việc', cls: 'bg-amber-50 text-amber-800 border border-amber-200/70' },
  MEETING: { label: 'Lịch họp', cls: 'bg-sky-50 text-sky-800 border border-sky-200/70' },
  DEEP_WORK: {
    label: 'Tập trung sâu',
    cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
  },
};

function summarizeProposalDetail(p: ErpProposal): string {
  const fd = p.formData || {};
  const parts: string[] = [];
  const amountVal =
    fd.totalAmount ?? fd.amount ?? fd.estimatedCost ?? fd.cost ?? fd.price ?? fd.budget;
  if (amountVal !== undefined && amountVal !== null && String(amountVal).trim() !== '') {
    const num = Number(amountVal);
    parts.push(
      `Chi phí: ${!Number.isNaN(num) && num > 0 ? num.toLocaleString('vi-VN') + 'đ' : String(amountVal)}`
    );
  }
  const desc =
    fd.reason || fd.description || fd.content || fd.note || fd.purpose || fd.itemsSummary;
  if (desc && typeof desc === 'string') {
    parts.push(desc.trim());
  }
  return parts.join(' • ');
}

export const TodayCockpitTab: React.FC<TodayCockpitTabProps> = ({
  currentUser,
  schedules,
  smartTasks,
  pdcaCycles,
  meetings,
  maslowSessions,
  trainings,
  radarMetrics,
  onNavigate,
}) => {
  const todayObj = new Date();
  const todayStr = getLocalTodayYmd(todayObj);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingItem, setEditingItem] = useState<AxisScheduleItem | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:30');
  const [date, setDate] = useState(todayStr);
  const [recurrence, setRecurrence] = useState<ScheduleRecurrence>('WEEKDAYS');
  const [category, setCategory] = useState<AxisScheduleItem['category']>('REMINDER');
  const [priority, setPriority] = useState<'HIGH' | 'NORMAL'>('NORMAL');
  const [note, setNote] = useState('');

  const [proposalDrawerManual, setProposalDrawerManual] = useState<boolean | null>(null);
  const showProposalDrawer =
    proposalDrawerManual !== null
      ? proposalDrawerManual
      : radarMetrics.pendingProposals.length > 0;

  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);
  const [proposalCommentMap, setProposalCommentMap] = useState<Record<string, string>>({});
  const [processingProposalId, setProcessingProposalId] = useState<string | null>(null);

  const [checkinNoteMap, setCheckinNoteMap] = useState<Record<string, string>>({});
  const [showAllCheckins, setShowAllCheckins] = useState(false);
  const [showAllLsx, setShowAllLsx] = useState(false);

  const dailyQuote = useMemo(() => {
    const dayIndex = todayObj.getDate() % DAILY_MINDSET_QUOTES.length;
    return DAILY_MINDSET_QUOTES[dayIndex];
  }, [todayStr]);

  // 1. Lịch nhắc của ngày hôm nay
  const todaySchedules = useMemo(() => {
    return schedules
      .filter((s) => isScheduleActiveOnDate(s, todayObj))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [schedules, todayStr]);

  // 2. Cuộc họp diễn ra hôm nay (từ phân hệ Họp)
  const todayMeetings = useMemo(() => {
    return meetings
      .filter((m) => m.date === todayStr)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [meetings, todayStr]);

  // 3. Các mốc giám sát tiến độ đến hạn hoặc quá hạn
  const dueCheckins = useMemo(() => {
    const list: Array<{
      task: AxisSmartTask;
      checkinIndex: number;
      stage: string;
      label: string;
      dueDate: string;
      guidingQuestion: string;
    }> = [];

    smartTasks
      .filter((t) => t.status !== 'COMPLETED')
      .forEach((task) => {
        (task.checkins || []).forEach((c, idx) => {
          if (!c.completed && c.dueDate <= todayStr) {
            list.push({
              task,
              checkinIndex: idx,
              stage: c.stage,
              label: getMilestoneLabel(c, idx),
              dueDate: c.dueDate,
              guidingQuestion: getMilestoneQuestion(c, idx),
            });
          }
        });
      });

    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [smartTasks, todayStr]);

  // 4. Các đầu việc đã quá hạn hoàn thành (kể cả khi đã tick hết 3 mốc nhưng chưa nghiệm thu xong)
  const overdueTasksToClose = useMemo(() => {
    const taskIdsInCheckins = new Set(dueCheckins.map((c) => c.task.id));
    return smartTasks.filter(
      (t) =>
        t.status !== 'COMPLETED' &&
        t.dueDate < todayStr &&
        !taskIdsInCheckins.has(t.id)
    );
  }, [smartTasks, dueCheckins, todayStr]);

  // 5. Chu trình PDCA đến ngày kiểm tra hiệu quả
  const duePdcaChecks = useMemo(() => {
    return pdcaCycles.filter(
      (p) => p.currentPhase !== 'STANDARDIZED' && p.checkDate && p.checkDate <= todayStr
    );
  }, [pdcaCycles, todayStr]);

  // 6. Lịch hẹn theo dõi lại nhân sự 1-1 & Đào tạo hôm nay
  const dueMaslowFollowUps = useMemo(() => {
    return maslowSessions.filter((m) => m.followUpDate && m.followUpDate <= todayStr);
  }, [maslowSessions, todayStr]);

  const todayTrainings = useMemo(() => {
    return trainings.filter((t) => t.status !== 'COMPLETED' && t.scheduledDate === todayStr);
  }, [trainings, todayStr]);

  const openCreateForm = () => {
    setEditingItem(null);
    setTitle('');
    setTime('09:00');
    setDate(todayStr);
    setRecurrence('ONCE');
    setCategory('REMINDER');
    setPriority('NORMAL');
    setNote('');
    setShowScheduleForm(true);
  };

  const openEditForm = (item: AxisScheduleItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setTime(item.time);
    setDate(item.date);
    setRecurrence(item.recurrence);
    setCategory(item.category);
    setPriority(item.priority);
    setNote(item.note || '');
    setShowScheduleForm(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const item: AxisScheduleItem = {
      id: editingItem ? editingItem.id : `sch-${Date.now()}`,
      title: title.trim(),
      time,
      date,
      recurrence,
      weekday: parseLocalYmd(date).getDay(),
      category,
      priority,
      note: note.trim(),
      completedDates: editingItem ? editingItem.completedDates || [] : [],
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    };

    await axisDbService.saveAxisItem('axis_schedules', item);
    dialogService.toast(editingItem ? 'Đã cập nhật lịch nhắc.' : 'Đã thêm vào trục lịch trình.');
    setShowScheduleForm(false);
  };

  const toggleScheduleDoneToday = async (item: AxisScheduleItem) => {
    const doneList = item.completedDates || [];
    const isDone = doneList.includes(todayStr);
    const nextDone = isDone ? doneList.filter((d) => d !== todayStr) : [...doneList, todayStr];
    await axisDbService.saveAxisItem('axis_schedules', {
      ...item,
      completedDates: nextDone,
    });
  };

  const handleDeleteSchedule = async (item: AxisScheduleItem) => {
    const ok = await dialogService.confirm(
      `Xóa mục lịch nhắc "${item.title}"?`,
      'Xóa lịch nhắc',
      { confirmText: 'Xóa', danger: true }
    );
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_schedules', item.id);
    dialogService.toast('Đã xóa lịch nhắc.', 'info');
  };

  const handleCompleteCheckinQuick = async (
    task: AxisSmartTask,
    checkinIndex: number,
    key: string
  ) => {
    const noteVal = (checkinNoteMap[key] || '').trim();
    const updatedCheckins = task.checkins.map((c, idx) =>
      idx === checkinIndex
        ? {
            ...c,
            completed: true,
            note: noteVal || c.note,
            checkedAt: new Date().toISOString(),
          }
        : c
    );
    const allDone = updatedCheckins.every((c) => c.completed);
    let nextStatus = task.status;
    if (allDone && task.status !== 'COMPLETED') {
      const closeNow = await dialogService.confirm(
        `Cả 3 mốc tiến độ của "${task.title}" đã hoàn tất. Bạn có muốn nghiệm thu đóng đầu việc này luôn không?`,
        'Hoàn tất cả 3 mốc giám sát',
        { confirmText: 'Nghiệm thu hoàn thành', cancelText: 'Giữ đang thực hiện' }
      );
      if (closeNow) nextStatus = 'COMPLETED';
    }

    await axisDbService.saveAxisItem('axis_tasks', {
      ...task,
      status: nextStatus,
      checkins: updatedCheckins,
    });
    dialogService.toast(
      nextStatus === 'COMPLETED'
        ? `Đã nghiệm thu hoàn thành công việc của ${task.assigneeName}!`
        : `Đã xác nhận đôn đốc mốc ${checkinIndex + 1} cho ${task.assigneeName}.`
    );
  };

  const handleCompleteTaskQuick = async (task: AxisSmartTask) => {
    await axisDbService.saveAxisItem('axis_tasks', {
      ...task,
      status: 'COMPLETED',
    });
    dialogService.toast(`Đã nghiệm thu hoàn thành "${task.title}"!`);
  };

  const handleQuickProposalDecision = async (
    proposal: ErpProposal,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const comment = (proposalCommentMap[proposal.id] || '').trim();
    const ok = await dialogService.confirm(
      `Xác nhận ${decision === 'APPROVED' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} đề xuất "${proposal.title}" của ${proposal.requestedBy} trực tiếp lên ProTrack ERP?`,
      decision === 'APPROVED' ? 'Phê duyệt đề xuất ERP' : 'Từ chối đề xuất ERP',
      { danger: decision === 'REJECTED' }
    );
    if (!ok) return;

    setProcessingProposalId(proposal.id);
    try {
      await axisDbService.decideErpProposal(proposal.id, decision, currentUser, comment || undefined);
      dialogService.toast(
        decision === 'APPROVED'
          ? 'Đã phê duyệt đề xuất trên ProTrack ERP!'
          : 'Đã từ chối đề xuất trên ProTrack ERP.',
        decision === 'APPROVED' ? 'success' : 'info'
      );
    } catch (err: any) {
      dialogService.toast('Lỗi cập nhật đề xuất: ' + (err?.message || ''), 'error');
    } finally {
      setProcessingProposalId(null);
    }
  };

  const greetingText = () => {
    const h = todayObj.getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const formattedVietnameseDate = todayObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const completedTodayCount = todaySchedules.filter((s) =>
    (s.completedDates || []).includes(todayStr)
  ).length;

  const totalActionNeeded =
    dueCheckins.length +
    overdueTasksToClose.length +
    duePdcaChecks.length +
    dueMaslowFollowUps.length;

  const upcomingTodayMeetingsCount = todayMeetings.filter((m) => m.status !== 'COMPLETED').length;

  const visibleCheckins = showAllCheckins ? dueCheckins : dueCheckins.slice(0, 4);
  const visibleLsx = showAllLsx
    ? radarMetrics.overdueOrDueTodayLsx
    : radarMetrics.overdueOrDueTodayLsx.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Top Executive Header + Quick CEO Actions */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#9D772B]">
            <Compass size={14} />
            <span>{formattedVietnameseDate}</span>
          </div>
          <h1 className="text-[23px] sm:text-[27px] font-extrabold text-[#0C1B2E] tracking-tight mt-0.5">
            {greetingText()}, {currentUser.name || 'CEO'}
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Cần xử lý hôm nay:{' '}
            <strong className="text-slate-700">
              {radarMetrics.pendingProposals.length} đề xuất chờ duyệt
            </strong>{' '}
            •{' '}
            <strong className="text-slate-700">
              {upcomingTodayMeetingsCount} cuộc họp
            </strong>{' '}
            •{' '}
            <strong className="text-slate-700">
              {totalActionNeeded} hạng mục cần đôn đốc/kiểm tra
            </strong>
            .
          </p>
        </div>

        {/* CEO 1-Click Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('execution', { subTab: 'SMART', action: 'NEW_TASK' })}
            className="px-3.5 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Target size={14} className="text-[#E5C472]" />
            <span>+ Giao việc</span>
          </button>
          <button
            onClick={() => onNavigate('meetings', { subTab: 'MEETINGS', action: 'NEW_MEETING' })}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-[#0C1B2E] text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Video size={14} className="text-[#C69C47]" />
            <span>+ Lên lịch họp</span>
          </button>
          <button
            onClick={() => onNavigate('meetings', { subTab: 'PREP' })}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-[#0C1B2E] text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <MessageSquareQuote size={14} className="text-[#C69C47]" />
            <span>+ Phát chỉ đạo</span>
          </button>
          <button
            onClick={() => onNavigate('people', { subTab: 'FFC' })}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-[#0C1B2E] text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Award size={14} className="text-[#C69C47]" />
            <span>+ Khen thưởng</span>
          </button>
          <button
            onClick={openCreateForm}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus size={14} className="text-slate-500" />
            <span>+ Nhắc lịch</span>
          </button>
        </div>
      </div>

      {/* Compact 1-Row Daily Mindset Strip */}
      <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#0C1B2E] via-[#132742] to-[#0E2036] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4AE5C]/20 border border-[#D4AE5C]/35 text-[#F3DA99] text-[10.5px] font-bold uppercase tracking-wider">
            <Sparkles size={11} />
            <span>{dailyQuote.tag}</span>
          </span>
          <p className="text-[13px] font-medium text-slate-100 leading-snug line-clamp-2">
            “{dailyQuote.principle}”
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => theoryService.open(dailyQuote.code)}
            className="px-2.5 py-1 rounded-lg bg-[#E5C472] hover:bg-[#d8b560] text-[#0C1B2E] text-[11.5px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <BookOpen size={12} />
            <span>Xem nhanh</span>
          </button>
          <button
            onClick={() => onNavigate('theory')}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11.5px] font-semibold text-[#F3DA99] cursor-pointer"
          >
            8 Phương pháp →
          </button>
        </div>
      </div>

      {/* 4 Live Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Pending Proposals on ProTrack */}
        <div
          onClick={() => setProposalDrawerManual(!showProposalDrawer)}
          className={`axis-card p-4.5 flex flex-col justify-between cursor-pointer transition-all hover:border-[#C69C47]/60 ${
            radarMetrics.pendingProposals.length > 0 ? 'ring-1 ring-[#C69C47]/40' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Đề Xuất Chờ Duyệt (ERP)
            </span>
            <FileCheck2 size={16} className="text-[#C69C47]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-[#0C1B2E] tabular-nums">
              {radarMetrics.pendingProposals.length}
            </span>
            <span className="text-[12.5px] text-slate-500">phiếu chờ CEO quyết định</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="font-semibold text-[#0C1B2E] inline-flex items-center gap-1">
              <span>{showProposalDrawer ? 'Đang mở bảng duyệt bên dưới' : 'Bấm để mở bảng duyệt'}</span>
              {showProposalDrawer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </div>
        </div>

        {/* Card 2: Execution Follow-up & PDCA */}
        <div className="axis-card p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Đầu Việc & Cải Tiến Đến Hạn
            </span>
            <CalendarClock size={16} className="text-[#0C1B2E]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-[#0C1B2E] tabular-nums">
              {dueCheckins.length + overdueTasksToClose.length + duePdcaChecks.length}
            </span>
            <span className="text-[12.5px] text-slate-500">mục cần đôn đốc / kiểm tra</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[12px] gap-2">
            <button
              onClick={() => onNavigate('execution', { subTab: 'SMART' })}
              className="text-slate-600 hover:text-[#0C1B2E] font-medium cursor-pointer"
            >
              {dueCheckins.length + overdueTasksToClose.length} việc giao
            </button>
            <button
              onClick={() => onNavigate('execution', { subTab: 'PDCA' })}
              className="font-semibold text-[#9D772B] hover:underline cursor-pointer"
            >
              {duePdcaChecks.length} lịch Check PDCA →
            </button>
          </div>
        </div>

        {/* Card 3: Production LSX */}
        <div className="axis-card p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Sản Xuất & Tiến Độ LSX
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 tabular-nums">
              {radarMetrics.onTimeLsxRate}% đúng hạn
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-[#0C1B2E] tabular-nums">
              {radarMetrics.inProgressLsxCount}
            </span>
            <span className="text-[12.5px] text-slate-500">lệnh đang chạy trên xưởng</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span
              className={
                radarMetrics.overdueOrDueTodayLsx.length > 0
                  ? 'text-rose-700 font-semibold'
                  : 'text-slate-500'
              }
            >
              {radarMetrics.overdueOrDueTodayLsx.length} lệnh sát/quá hạn
            </span>
            <span
              className={
                radarMetrics.todayPauses.length > 0
                  ? 'text-amber-700 font-semibold tabular-nums'
                  : 'text-slate-400 tabular-nums'
              }
            >
              {radarMetrics.todayPauses.length} dừng máy hôm nay
            </span>
          </div>
        </div>

        {/* Card 4: Meetings & People Pulse */}
        <div className="axis-card p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Họp & Nhịp Độ Đội Ngũ
            </span>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-[#0C1B2E] tabular-nums">
              {todayMeetings.length}
            </span>
            <span className="text-[12.5px] text-slate-500">
              cuộc họp • {radarMetrics.todayReportsCount} báo cáo SL
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="text-slate-500">
              {radarMetrics.todayLeaves.length} người nghỉ phép hôm nay
            </span>
            <button
              onClick={() => onNavigate('people', { subTab: 'FFC' })}
              className="font-semibold text-[#9D772B] hover:underline cursor-pointer"
            >
              Khen FFC →
            </button>
          </div>
        </div>
      </div>

      {/* Expandable ERP Pending Proposals Approval Panel */}
      {showProposalDrawer && (
        <div className="axis-card p-5 border-[#C69C47]/45">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#0C1B2E] flex items-center gap-2">
                <FileCheck2 size={17} className="text-[#C69C47]" />
                <span>
                  Phê duyệt Đề xuất từ ProTrack ERP ({radarMetrics.pendingProposals.length})
                </span>
              </h3>
              <p className="text-[12px] text-slate-500">
                Bấm vào từng đề xuất để xem chi tiết nội dung/chi phí và ghi ý kiến chỉ đạo trước khi duyệt.
              </p>
            </div>
            <button
              onClick={() => setProposalDrawerManual(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              title="Thu gọn"
            >
              <X size={16} />
            </button>
          </div>

          {radarMetrics.pendingProposals.length === 0 ? (
            <div className="py-5 text-center text-[13px] text-slate-400">
              Không có đề xuất nào đang chờ duyệt trên ProTrack ERP.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {radarMetrics.pendingProposals.map((p) => {
                const isExpanded = expandedProposalId === p.id;
                const summary = summarizeProposalDetail(p);
                const formEntries = Object.entries(p.formData || {}).filter(
                  ([k, v]) =>
                    v !== undefined &&
                    v !== null &&
                    String(v).trim() !== '' &&
                    typeof v !== 'object' &&
                    !['id', 'uid', 'createdAt', 'updatedAt'].includes(k)
                );

                return (
                  <div key={p.id} className="py-3 space-y-2.5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div
                        onClick={() => setExpandedProposalId(isExpanded ? null : p.id)}
                        className="min-w-0 flex-1 cursor-pointer group"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {p.documentNo && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10.5px] font-bold">
                              {p.documentNo}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10.5px] font-semibold">
                            {p.category || 'Đề xuất'}
                          </span>
                          <span className="text-[13.5px] font-bold text-[#0C1B2E] group-hover:text-[#9D772B] transition-colors">
                            {p.title}
                          </span>
                        </div>
                        <div className="text-[12px] text-slate-500 mt-0.5">
                          Người trình: <strong className="text-slate-700">{p.requestedBy}</strong> •
                          Ngày: <span className="tabular-nums">{(p.date || '').slice(0, 10)}</span>
                          {summary && <span className="text-slate-700"> • {summary}</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedProposalId(isExpanded ? null : p.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11.5px] font-semibold text-slate-600 cursor-pointer"
                        >
                          {isExpanded ? 'Ẩn chi tiết' : 'Chi tiết / Ghi chú'}
                        </button>
                        <button
                          disabled={processingProposalId === p.id}
                          onClick={() => handleQuickProposalDecision(p, 'APPROVED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={12} />
                          <span>Duyệt</span>
                        </button>
                        <button
                          disabled={processingProposalId === p.id}
                          onClick={() => handleQuickProposalDecision(p, 'REJECTED')}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11.5px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <X size={12} />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                        {formEntries.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[12px]">
                            {formEntries.map(([k, v]) => (
                              <div
                                key={k}
                                className="p-2 rounded-lg bg-white border border-slate-200/60"
                              >
                                <span className="text-[10.5px] font-semibold uppercase text-slate-400 block">
                                  {k}
                                </span>
                                <span className="text-slate-800 font-medium break-words">
                                  {String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[12px] text-slate-500">
                            Đề xuất không đính kèm trường dữ liệu phụ.
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={proposalCommentMap[p.id] || ''}
                            onChange={(e) =>
                              setProposalCommentMap((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            placeholder="Nhập ý kiến chỉ đạo khi duyệt hoặc lý do từ chối..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12.5px] focus:border-[#0C1B2E] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate('execution', {
                                subTab: 'SMART',
                                action: 'NEW_TASK',
                                staffName: p.requestedBy,
                                prefillTitle: `Triển khai đề xuất: ${p.title}`,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[12px] font-semibold text-[#0C1B2E] cursor-pointer shrink-0"
                          >
                            → Giao thành đầu việc
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Today's Meetings + Daily Schedule */}
        <div className="lg:col-span-7 space-y-5">
          {/* Today's Meetings Block (Integrated directly into Today!) */}
          <div className="axis-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[15.5px] font-bold text-[#0C1B2E] flex items-center gap-2">
                  <Video size={17} className="text-[#C69C47]" />
                  <span>Lịch Họp Điều Hành Hôm Nay ({todayMeetings.length})</span>
                </h2>
              </div>
              <button
                onClick={() => onNavigate('meetings', { subTab: 'MEETINGS' })}
                className="text-[12px] font-semibold text-[#9D772B] hover:underline cursor-pointer"
              >
                Quản lý phòng họp →
              </button>
            </div>

            {todayMeetings.length === 0 ? (
              <div className="py-3.5 px-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between gap-3">
                <span className="text-[12.5px] text-slate-500">
                  Hôm nay chưa có cuộc họp nào được lên lịch.
                </span>
                <button
                  onClick={() =>
                    onNavigate('meetings', { subTab: 'MEETINGS', action: 'NEW_MEETING' })
                  }
                  className="text-[12px] font-bold text-[#0C1B2E] hover:text-[#9D772B] cursor-pointer shrink-0"
                >
                  + Lên lịch họp
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayMeetings.map((m) => {
                  const isCompleted = m.status === 'COMPLETED';
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-slate-50/70 border-slate-200/70'
                          : 'bg-sky-50/40 border-sky-200/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#0C1B2E] text-[#F3DA99] text-[11px] font-bold tabular-nums">
                            {m.time} ({m.durationMinutes}p)
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {MEETING_TYPE_LABELS[m.meetingType] || 'Cuộc họp'}
                          </span>
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10.5px] font-bold">
                              Đã họp xong
                            </span>
                          )}
                        </div>
                        <div className="text-[14px] font-bold text-[#0C1B2E] mt-1">{m.title}</div>
                        {m.participants.length > 0 && (
                          <div className="text-[12px] text-slate-500 truncate mt-0.5">
                            Tham dự: {m.participants.join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          onNavigate('meetings', {
                            subTab: 'MEETINGS',
                            action: 'OPEN_MEETING',
                            meetingId: m.id,
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center"
                      >
                        <span>{isCompleted ? 'Xem biên bản' : 'Vào phòng họp'}</span>
                        <ArrowUpRight size={13} className="text-[#E5C472]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily Schedule & Recurring Habits */}
          <div className="axis-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15.5px] font-bold text-[#0C1B2E] flex items-center gap-2">
                  <Clock size={17} className="text-[#C69C47]" />
                  <span>Trục Lịch Trình & Nhắc Việc Cá Nhân CEO</span>
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Đã hoàn tất {completedTodayCount}/{todaySchedules.length} đầu việc định kỳ hôm nay
                </p>
              </div>
              <button
                onClick={openCreateForm}
                className="text-[12.5px] font-semibold text-[#0C1B2E] hover:text-[#9D772B] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus size={15} />
                <span>Thêm nhắc lịch</span>
              </button>
            </div>

            {todaySchedules.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-[13.5px] text-slate-500 font-medium">
                  Hôm nay chưa có lịch nhắc nào.
                </p>
                <button
                  onClick={openCreateForm}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[12.5px] font-semibold text-[#0C1B2E] cursor-pointer"
                >
                  + Thiết lập lịch nhắc đầu tiên
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 w-10"></th>
                      <th className="py-2.5 w-20">Giờ</th>
                      <th className="py-2.5">Nội dung lịch & việc cần làm</th>
                      <th className="py-2.5 w-28 hidden sm:table-cell">Tần suất</th>
                      <th className="py-2.5 w-20 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todaySchedules.map((item) => {
                      const isDone = (item.completedDates || []).includes(todayStr);
                      const badge = CATEGORY_BADGES[item.category];
                      return (
                        <tr
                          key={item.id}
                          className="group hover:bg-slate-50/90 transition-colors"
                        >
                          <td className="py-3.5 pr-2 align-top">
                            <button
                              onClick={() => toggleScheduleDoneToday(item)}
                              className="mt-0.5 text-slate-400 hover:text-[#0C1B2E] transition-colors cursor-pointer"
                            >
                              {isDone ? (
                                <CheckCircle2 size={19} className="text-emerald-600" />
                              ) : (
                                <Circle size={19} />
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 pr-3 align-top">
                            <span
                              className={`text-[13px] font-bold tabular-nums ${
                                isDone ? 'text-slate-400 line-through' : 'text-[#0C1B2E]'
                              }`}
                            >
                              {item.time}
                            </span>
                          </td>
                          <td className="py-3.5 pr-3 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[13.5px] font-semibold ${
                                  isDone ? 'text-slate-400 line-through' : 'text-slate-800'
                                }`}
                              >
                                {item.title}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${badge.cls}`}
                              >
                                {badge.label}
                              </span>
                              {item.priority === 'HIGH' && !isDone && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                                  Quan trọng
                                </span>
                              )}
                            </div>
                            {item.note && (
                              <p className="text-[12px] text-slate-500 mt-1">{item.note}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-2 align-top hidden sm:table-cell">
                            <span className="text-[11.5px] text-slate-400 font-medium">
                              {RECURRENCE_LABELS[item.recurrence]}
                            </span>
                          </td>
                          <td className="py-3.5 pl-2 align-top text-right">
                            {/* Clean Table Rule: Ẩn mặc định opacity-0, chỉ hiện khi rê chuột vào hàng */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditForm(item)}
                                title="Chỉnh sửa"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C1B2E] hover:bg-slate-100 cursor-pointer"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(item)}
                                title="Xóa"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 cols: Unified Follow-ups (Tasks, PDCA, 1-1, Trainings) + Urgent ERP Alerts */}
        <div className="lg:col-span-5 space-y-5">
          {/* Unified Follow-up Inbox */}
          <div className="axis-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#0C1B2E] flex items-center gap-2">
                <CalendarClock size={16} className="text-[#C69C47]" />
                <span>Hạng Mục Cần Đôn Đốc & Kiểm Tra ({totalActionNeeded})</span>
              </h3>
              <button
                onClick={() => onNavigate('execution', { subTab: 'SMART' })}
                className="text-[12px] font-semibold text-[#9D772B] hover:underline cursor-pointer"
              >
                Tất cả việc →
              </button>
            </div>

            {totalActionNeeded === 0 && todayTrainings.length === 0 ? (
              <p className="text-[12.5px] text-slate-500 py-3">
                Mọi đầu việc ủy quyền, vòng lặp PDCA và lịch hẹn nhân sự đều đang đúng tiến độ.
              </p>
            ) : (
              <div className="space-y-3">
                {/* 1. Due SMART Checkpoints */}
                {visibleCheckins.map((item) => {
                  const key = `${item.task.id}-${item.checkinIndex}`;
                  const dueInfo = formatRelativeDueBadge(item.dueDate, todayStr);
                  return (
                    <div
                      key={key}
                      className="p-3.5 rounded-xl bg-amber-50/55 border border-amber-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#0C1B2E] text-[#F3DA99] text-[10.5px] font-bold">
                          {item.label}
                        </span>
                        <span
                          className={`text-[11px] font-bold tabular-nums ${
                            dueInfo.tone === 'overdue' ? 'text-rose-700' : 'text-amber-800'
                          }`}
                        >
                          {dueInfo.text}
                        </span>
                      </div>
                      <div className="text-[13.5px] font-bold text-[#0C1B2E]">
                        {item.task.title}
                      </div>
                      <div className="text-[12px] text-slate-600">
                        Phụ trách: <span className="font-semibold">{item.task.assigneeName}</span>
                        {item.task.linkedLsxCode && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-white text-slate-700 text-[10.5px] font-bold">
                            LSX: {item.task.linkedLsxCode}
                          </span>
                        )}
                      </div>
                      <div className="text-[11.5px] italic text-slate-600 bg-white/85 p-2 rounded-lg border border-amber-100">
                        💡 Hỏi nhanh: “{item.guidingQuestion}”
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <input
                          type="text"
                          value={checkinNoteMap[key] || ''}
                          onChange={(e) =>
                            setCheckinNoteMap((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder="Ghi chú tiến độ (tùy chọn)..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-200/90 bg-white text-[12px] focus:border-[#0C1B2E] focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            handleCompleteCheckinQuick(item.task, item.checkinIndex, key)
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[11.5px] font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Check size={13} className="text-[#E5C472]" />
                          <span>Đã đôn đốc</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {dueCheckins.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCheckins(!showAllCheckins)}
                    className="w-full py-1.5 text-center text-[12px] font-semibold text-[#9D772B] hover:underline cursor-pointer"
                  >
                    {showAllCheckins
                      ? 'Thu gọn danh sách mốc tiến độ'
                      : `Xem thêm ${dueCheckins.length - 4} mốc tiến độ đến hạn khác`}
                  </button>
                )}

                {/* 2. Overdue Tasks Past Final DueDate */}
                {overdueTasksToClose.map((task) => {
                  const dueInfo = formatRelativeDueBadge(task.dueDate, todayStr);
                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10.5px] font-bold">
                          Quá hạn bàn giao
                        </span>
                        <span className="text-[11px] font-bold text-rose-700">{dueInfo.text}</span>
                      </div>
                      <div className="text-[13.5px] font-bold text-[#0C1B2E]">{task.title}</div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[12px] text-slate-600">
                          Phụ trách: <strong>{task.assigneeName}</strong>
                        </span>
                        <button
                          onClick={() => handleCompleteTaskQuick(task)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-semibold cursor-pointer"
                        >
                          ✓ Nghiệm thu xong
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 3. Due PDCA Checks */}
                {duePdcaChecks.map((cycle) => {
                  const dueInfo = formatRelativeDueBadge(cycle.checkDate, todayStr);
                  return (
                    <div
                      key={cycle.id}
                      className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-teal-800 text-white text-[10.5px] font-bold inline-flex items-center gap-1">
                          <RefreshCw size={10} />
                          <span>Kiểm tra hiệu quả PDCA</span>
                        </span>
                        <span className="text-[11px] font-bold text-teal-800">{dueInfo.text}</span>
                      </div>
                      <div className="text-[13.5px] font-bold text-[#0C1B2E]">{cycle.title}</div>
                      <div className="flex items-center justify-between gap-2 text-[12px] text-slate-600">
                        <span>
                          {cycle.department} • {PDCA_PHASE_LABELS[cycle.currentPhase]}
                        </span>
                        <button
                          onClick={() =>
                            onNavigate('execution', {
                              subTab: 'PDCA',
                              action: 'EDIT_PDCA',
                              pdcaId: cycle.id,
                            })
                          }
                          className="font-bold text-teal-800 hover:underline cursor-pointer shrink-0"
                        >
                          Đánh giá & Chuẩn hóa →
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 4. Due Maslow 1-1 Follow-ups */}
                {dueMaslowFollowUps.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[10.5px] font-bold uppercase text-indigo-700">
                        Lịch hẹn theo dõi nhân sự 1-1 ({m.followUpDate})
                      </span>
                      <div className="text-[13px] font-bold text-[#0C1B2E] truncate">
                        {m.employeeName} • {MASLOW_TIER_LABELS[m.bottleneckTier]}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onNavigate('people', {
                          subTab: 'MASLOW',
                          action: 'OPEN_MASLOW',
                          staffName: m.employeeName,
                        })
                      }
                      className="text-[11.5px] font-bold text-indigo-800 hover:underline cursor-pointer shrink-0"
                    >
                      Mở hồ sơ →
                    </button>
                  </div>
                ))}

                {/* 5. Today's Trainings */}
                {todayTrainings.map((tr) => (
                  <div
                    key={tr.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[10.5px] font-bold uppercase text-[#9D772B]">
                        Lịch đào tạo nội bộ hôm nay
                      </span>
                      <div className="text-[13px] font-bold text-[#0C1B2E] truncate">
                        {tr.topic} ({tr.targetAudience})
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('people', { subTab: 'TRAINING' })}
                      className="text-[11.5px] font-bold text-[#0C1B2E] hover:underline cursor-pointer shrink-0"
                    >
                      Chi tiết →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Urgent / Overdue LSX & Machine Pauses from ProTrack ERP — With Direct 1-Click Actions! */}
          <div className="axis-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#0C1B2E] flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>Cảnh Báo Xưởng Từ ERP (LSX Trễ & Dừng Máy)</span>
              </h3>
              <span className="text-[11.5px] font-bold text-slate-400 tabular-nums">
                {radarMetrics.overdueOrDueTodayLsx.length} lệnh
              </span>
            </div>

            {/* Paused machines today */}
            {radarMetrics.todayPauses.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-amber-900 flex items-center gap-1.5">
                  <PauseCircle size={13} />
                  <span>Báo cáo tạm dừng máy hôm nay ({radarMetrics.todayPauses.length}):</span>
                </div>
                {radarMetrics.todayPauses.slice(0, 3).map((p: any) => (
                  <div
                    key={p.id}
                    className="text-[12px] text-slate-700 flex items-center justify-between gap-2"
                  >
                    <span className="truncate">
                      <strong>{p.lsxCode || p.machineId || 'Công đoạn'}</strong> ({p.stage || 'SX'}):{' '}
                      {p.note || 'Tạm dừng'} — <em>{p.workerName}</em>
                    </span>
                    <button
                      onClick={() =>
                        onNavigate('execution', {
                          subTab: 'PDCA',
                          action: 'NEW_PDCA',
                          lsxCode: p.lsxCode || '',
                          prefillTitle: `Khắc phục sự cố dừng máy ${p.stage || ''}: ${p.note || ''}`.trim(),
                        })
                      }
                      className="text-[11px] font-bold text-amber-900 hover:underline shrink-0 cursor-pointer"
                    >
                      + Mở PDCA
                    </button>
                  </div>
                ))}
              </div>
            )}

            {radarMetrics.overdueOrDueTodayLsx.length === 0 ? (
              <p className="text-[12.5px] text-slate-500 py-2">
                Không có lệnh sản xuất nào bị trễ hạn giao hàng hôm nay.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {visibleLsx.map((lsx) => {
                  const code = lsx.lsxCode || lsx.orderCode || lsx.id;
                  return (
                    <div key={lsx.id} className="group py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-slate-800 truncate">
                            {code}{' '}
                            <span className="font-normal text-slate-500">• {lsx.customer}</span>
                          </div>
                          <div className="text-[11.5px] text-slate-500 truncate">
                            {lsx.itemName || 'Sản phẩm in'} — Tiến độ:{' '}
                            <strong className="text-slate-700">
                              {lsx.progress || 'Đang xử lý'}
                            </strong>
                          </div>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-semibold tabular-nums">
                          {String(lsx.deliveryDate || '').slice(0, 10)}
                        </span>
                      </div>

                      {/* 1-Click Direct Action from Overdue LSX */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          onClick={() =>
                            onNavigate('execution', {
                              subTab: 'SMART',
                              action: 'NEW_TASK',
                              lsxCode: code,
                              prefillTitle: `Đẩy nhanh tiến độ & chốt giao đơn ${code} (${lsx.customer || ''})`,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0C1B2E] hover:text-white text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                        >
                          ⚡ Giao việc đôn đốc
                        </button>
                        <button
                          onClick={() =>
                            onNavigate('execution', {
                              subTab: 'PDCA',
                              action: 'NEW_PDCA',
                              lsxCode: code,
                              prefillTitle: `Phân tích nguyên nhân trễ tiến độ đơn ${code}`,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-700 hover:text-white text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                        >
                          🔧 Mở PDCA trị gốc
                        </button>
                      </div>
                    </div>
                  );
                })}

                {radarMetrics.overdueOrDueTodayLsx.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllLsx(!showAllLsx)}
                    className="w-full pt-2.5 text-center text-[12px] font-semibold text-[#9D772B] hover:underline cursor-pointer"
                  >
                    {showAllLsx
                      ? 'Thu gọn danh sách LSX'
                      : `Xem tất cả ${radarMetrics.overdueOrDueTodayLsx.length} lệnh sát/quá hạn`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Thêm / Sửa Lịch Nhắc */}
      {showScheduleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px]">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#0C1B2E]">
                {editingItem ? 'Chỉnh sửa lịch nhắc' : 'Thêm lịch nhắc / Nghi thức điều hành'}
              </h3>
              <button
                onClick={() => setShowScheduleForm(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Nội dung nhắc việc *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Họp ngắn 15p với Quản lý sản xuất..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] focus:border-[#0C1B2E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Giờ báo chuông
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px] focus:border-[#0C1B2E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Ngày bắt đầu / Ngày hẹn
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px] focus:border-[#0C1B2E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Lặp lại
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as ScheduleRecurrence)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:border-[#0C1B2E] focus:outline-none"
                  >
                    <option value="ONCE">Một lần</option>
                    <option value="DAILY">Mỗi ngày</option>
                    <option value="WEEKDAYS">Thứ 2 – Thứ 7</option>
                    <option value="WEEKLY">Hàng tuần</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Phân loại
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AxisScheduleItem['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:border-[#0C1B2E] focus:outline-none"
                  >
                    <option value="REMINDER">Nhắc việc</option>
                    <option value="ROUTINE">Nghi thức CEO</option>
                    <option value="MEETING">Lịch họp</option>
                    <option value="DEEP_WORK">Tập trung sâu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Độ ưu tiên
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'HIGH' | 'NORMAL')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:border-[#0C1B2E] focus:outline-none"
                  >
                    <option value="NORMAL">Bình thường</option>
                    <option value="HIGH">Quan trọng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Ghi chú thêm (tùy chọn)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Lưu ý ngắn..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] focus:border-[#0C1B2E] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Lưu lịch nhắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
