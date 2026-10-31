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
} from 'lucide-react';
import {
  AxisScheduleItem,
  AxisSmartTask,
  AxisPdcaCycle,
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

interface TodayCockpitTabProps {
  currentUser: ErpUser;
  schedules: AxisScheduleItem[];
  smartTasks: AxisSmartTask[];
  pdcaCycles: AxisPdcaCycle[];
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
  onNavigate: (tab: AxisTabId) => void;
}

interface DailyMindsetQuote {
  code: FrameworkCode;
  tag: string;
  principle: string;
  tip: string;
}

const DAILY_MINDSET_QUOTES: DailyMindsetQuote[] = [
  {
    code: 'SMART',
    tag: 'Giao Việc SMART',
    principle: 'Nếu việc giao ra mà cấp dưới làm sai, 80% do lúc giao việc người nhận chưa nhìn thấy cùng một bức tranh với CEO.',
    tip: 'Đầu ra đo được bằng số (M) + Thời hạn dứt khoát (T) + Gắn 3 mốc giám sát tiến độ rành mạch.',
  },
  {
    code: '3-6-9',
    tag: 'Kỷ Luật Họp 3-6-9',
    principle: 'Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Công việc được thực thi đúng kế hoạch.',
    tip: 'Họp mà không thực hiện thì không hiệu quả; Phân công nhưng không giám sát thì cũng bằng thừa (3 Công thức • 6 Bước • 9 Nguyên tắc).',
  },
  {
    code: 'PDCA',
    tag: 'Chu trình PDCA',
    principle: 'Mọi sự cố lặp lại lần thứ 2 tại xưởng không phải lỗi con người, mà là lỗ hổng quy trình.',
    tip: 'Sau bước Check (Kiểm tra), bắt buộc phải có bước Act (Chuẩn hóa thành SOP/OJT).',
  },
  {
    code: 'OKR',
    tag: 'Quản trị OKR',
    principle: 'Nếu tất cả mọi thứ đều là ưu tiên số một, thì thực chất công ty chẳng có ưu tiên nào cả.',
    tip: 'Tối đa 3 Objectives cho một Quý, đo bằng kết quả đầu ra (Outcome) thay vì đếm đầu việc.',
  },
  {
    code: 'PREP',
    tag: 'Diễn đạt PREP',
    principle: 'Sự rõ ràng của người đứng đầu quyết định tốc độ thực thi của cả bộ máy.',
    tip: 'Luôn nói Kết luận trước (Point) → Lý do (Reason) → Ví dụ thực tế (Example) → Chốt hành động (Point).',
  },
  {
    code: 'MASLOW',
    tag: 'Tháp Maslow',
    principle: 'Khi nhân sự thiếu động lực, trách phạt không giải quyết được tầng nhu cầu đang đứt gãy.',
    tip: 'Quan sát xem họ đang mệt mỏi vì quá tải (Sinh lý), bất an (An toàn) hay thiếu sự ghi nhận (Tôn trọng).',
  },
  {
    code: 'FFC',
    tag: 'Nguyên tắc FFC',
    principle: 'Một lời khen đúng lúc, có dữ kiện cụ thể tạo ra năng lượng gấp 10 lần lời khen xã giao.',
    tip: 'Feeling (Cảm xúc của bạn) + Fact (Hành vi/con số thật) + Compare (Sự tiến bộ so với trước).',
  },
  {
    code: 'SWOT',
    tag: 'Phân tích SWOT',
    principle: 'Một bảng SWOT chỉ để ngắm là vô dụng; sức mạnh của CEO nằm ở việc ghép cặp chúng lại thành Ma Trận Hành Động TOWS.',
    tip: 'Tấn công bứt phá (SO) • Khắc phục để đón sóng (WO) • Hóa giải nguy cơ (ST) • Phòng thủ sinh tồn (WT).',
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
  DEEP_WORK: { label: 'Tập trung sâu', cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70' },
};

export const TodayCockpitTab: React.FC<TodayCockpitTabProps> = ({
  currentUser,
  schedules,
  smartTasks,
  pdcaCycles,
  radarMetrics,
  onNavigate,
}) => {
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().slice(0, 10);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingItem, setEditingItem] = useState<AxisScheduleItem | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:30');
  const [date, setDate] = useState(todayStr);
  const [recurrence, setRecurrence] = useState<ScheduleRecurrence>('WEEKDAYS');
  const [category, setCategory] = useState<AxisScheduleItem['category']>('REMINDER');
  const [priority, setPriority] = useState<'HIGH' | 'NORMAL'>('NORMAL');
  const [note, setNote] = useState('');

  const [showProposalDrawer, setShowProposalDrawer] = useState(false);
  const [processingProposalId, setProcessingProposalId] = useState<string | null>(null);

  const dailyQuote = useMemo(() => {
    const dayIndex = todayObj.getDate() % DAILY_MINDSET_QUOTES.length;
    return DAILY_MINDSET_QUOTES[dayIndex];
  }, [todayStr]);

  // Lọc lịch trình của ngày hôm nay & sắp theo giờ
  const todaySchedules = useMemo(() => {
    return schedules
      .filter((s) => isScheduleActiveOnDate(s, todayObj))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [schedules, todayStr]);

  // Các mốc giám sát tiến độ đã đến hạn hoặc quá hạn
  const dueCheckins = useMemo(() => {
    const list: Array<{
      task: AxisSmartTask;
      stage: string;
      label: string;
      dueDate: string;
      guidingQuestion: string;
    }> = [];

    smartTasks
      .filter((t) => t.status !== 'COMPLETED')
      .forEach((task) => {
        task.checkins.forEach((c, idx) => {
          if (!c.completed && c.dueDate <= todayStr) {
            list.push({
              task,
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

  const duePdcaChecks = useMemo(() => {
    return pdcaCycles.filter(
      (p) => p.currentPhase !== 'STANDARDIZED' && p.checkDate && p.checkDate <= todayStr
    );
  }, [pdcaCycles, todayStr]);

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
      weekday: new Date(date).getDay(),
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

  const handleCompleteCheckinQuick = async (task: AxisSmartTask, stage: '3' | '6' | '9') => {
    const updatedCheckins = task.checkins.map((c) =>
      c.stage === stage
        ? { ...c, completed: true, checkedAt: new Date().toISOString() }
        : c
    );
    await axisDbService.saveAxisItem('axis_tasks', {
      ...task,
      checkins: updatedCheckins,
    });
    dialogService.toast(`Đã hoàn thành Check-in Mốc ${stage} cho "${task.assigneeName}".`);
  };

  const handleQuickProposalDecision = async (
    proposal: ErpProposal,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const ok = await dialogService.confirm(
      `Xác nhận ${decision === 'APPROVED' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} đề xuất "${proposal.title}" của ${proposal.requestedBy} trực tiếp lên ProTrack ERP?`,
      decision === 'APPROVED' ? 'Phê duyệt đề xuất ERP' : 'Từ chối đề xuất ERP',
      { danger: decision === 'REJECTED' }
    );
    if (!ok) return;

    setProcessingProposalId(proposal.id);
    try {
      await axisDbService.decideErpProposal(proposal.id, decision, currentUser);
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

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#9D772B]">
            <Compass size={14} />
            <span>{formattedVietnameseDate}</span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0C1B2E] tracking-tight mt-1">
            {greetingText()}, {currentUser.name || 'CEO'}
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5">
            Tâm điểm điều phối hôm nay: {todaySchedules.length - completedTodayCount} lịch nhắc chưa hoàn tất •{' '}
            {dueCheckins.length} mốc Check-in 3-6-9 cần rà soát.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateForm}
            className="px-4 py-2.5 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} className="text-[#E5C472]" />
            <span>Thêm nhắc lịch / Nghi thức ngày</span>
          </button>
        </div>
      </div>

      {/* Daily Management Mindset Banner */}
      <div className="axis-card p-5 bg-gradient-to-r from-[#0C1B2E] via-[#122640] to-[#0E2036] text-white border-none relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 w-44 h-44 rounded-full border border-[#D4AE5C]/20" />
        <div className="pointer-events-none absolute -right-2 -top-2 w-28 h-28 rounded-full border border-[#D4AE5C]/15" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AE5C]/20 border border-[#D4AE5C]/35 text-[#F3DA99] text-[10.5px] font-bold uppercase tracking-wider">
              <Sparkles size={11} />
              <span>Hệ Quy Chiếu Hôm Nay • {dailyQuote.tag}</span>
            </div>
            <p className="text-[15px] sm:text-[16px] font-semibold text-white leading-snug">
              “{dailyQuote.principle}”
            </p>
            <p className="text-[12.5px] text-slate-300 leading-relaxed">{dailyQuote.tip}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={() => theoryService.open(dailyQuote.code)}
              className="px-3.5 py-2 rounded-xl bg-[#E5C472] hover:bg-[#d8b560] text-[#0C1B2E] text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title={`Xem tài liệu lý thuyết chi tiết về ${dailyQuote.tag}`}
            >
              <BookOpen size={14} />
              <span>Đọc lý thuyết {dailyQuote.tag}</span>
            </button>
            <button
              onClick={() => onNavigate('meetings')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[12px] font-semibold text-[#F3DA99] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Xem cả 8 Nguyên tắc</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Live ERP Radar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Production LSX */}
        <div className="axis-card p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Sản Xuất & Tiến Độ LSX
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 tabular-nums">
              {radarMetrics.onTimeLsxRate}% đúng hạn
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-[#0C1B2E] tabular-nums">
              {radarMetrics.inProgressLsxCount}
            </span>
            <span className="text-[12.5px] text-slate-500">lệnh đang chạy trên xưởng</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span
              className={
                radarMetrics.overdueOrDueTodayLsx.length > 0
                  ? 'text-amber-700 font-semibold'
                  : 'text-slate-500'
              }
            >
              {radarMetrics.overdueOrDueTodayLsx.length} lệnh sát/quá hạn giao
            </span>
            <span className="text-slate-400 tabular-nums">
              {radarMetrics.todayPauses.length} dừng máy hôm nay
            </span>
          </div>
        </div>

        {/* Card 2: Pending Proposals on ProTrack */}
        <div className="axis-card p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Đề Xuất Chờ Duyệt (ERP)
            </span>
            <FileCheck2 size={16} className="text-[#C69C47]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-[#0C1B2E] tabular-nums">
              {radarMetrics.pendingProposals.length}
            </span>
            <span className="text-[12.5px] text-slate-500">đề xuất đang chờ quyết định</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <button
              onClick={() => setShowProposalDrawer(!showProposalDrawer)}
              className="font-semibold text-[#0C1B2E] hover:text-[#9D772B] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{showProposalDrawer ? 'Thu gọn danh sách' : 'Duyệt nhanh ngay tại đây'}</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Card 3: Milestones & PDCA Check-ins Due */}
        <div className="axis-card p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Nhịp Giám Sát Tiến Độ & PDCA
            </span>
            <CalendarClock size={16} className="text-[#0C1B2E]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-[#0C1B2E] tabular-nums">
              {dueCheckins.length + duePdcaChecks.length}
            </span>
            <span className="text-[12.5px] text-slate-500">mốc cần CEO đôn đốc / kiểm tra</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="text-slate-500">
              {dueCheckins.length} mốc tiến độ • {duePdcaChecks.length} lịch Check PDCA
            </span>
            <button
              onClick={() => onNavigate('execution')}
              className="font-semibold text-[#9D772B] hover:underline cursor-pointer"
            >
              Chi tiết
            </button>
          </div>
        </div>

        {/* Card 4: People Pulse */}
        <div className="axis-card p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Nhịp Độ Nhân Sự Hôm Nay
            </span>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-[#0C1B2E] tabular-nums">
              {radarMetrics.todayReportsCount}
            </span>
            <span className="text-[12.5px] text-slate-500">lượt báo cáo sản lượng mới</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="text-slate-500">
              {radarMetrics.todayLeaves.length} nhân sự nghỉ phép hôm nay
            </span>
            <button
              onClick={() => onNavigate('people')}
              className="font-semibold text-[#9D772B] hover:underline cursor-pointer"
            >
              Khen FFC
            </button>
          </div>
        </div>
      </div>

      {/* Expandable ERP Pending Proposals Quick-Approval Panel */}
      {showProposalDrawer && (
        <div className="axis-card p-5 border-[#C69C47]/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[14.5px] font-bold text-[#0C1B2E]">
                Đề xuất đang chờ phê duyệt từ ProTrack ERP ({radarMetrics.pendingProposals.length})
              </h3>
              <p className="text-[12px] text-slate-500">
                Thao tác tại đây sẽ cập nhật trực tiếp trạng thái lên hệ thống ProTrack.
              </p>
            </div>
            <button
              onClick={() => setShowProposalDrawer(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {radarMetrics.pendingProposals.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-slate-400">
              Tuyệt vời! Không có đề xuất nào đang tồn đọng trên ERP.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 pr-3">Tiêu đề đề xuất</th>
                    <th className="py-2.5 px-3">Danh mục</th>
                    <th className="py-2.5 px-3">Người trình</th>
                    <th className="py-2.5 px-3">Ngày gửi</th>
                    <th className="py-2.5 pl-3 text-right">Quyết định</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {radarMetrics.pendingProposals.slice(0, 8).map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pr-3 font-semibold text-slate-800">{p.title}</td>
                      <td className="py-3 px-3 text-slate-500 text-[12px]">{p.category}</td>
                      <td className="py-3 px-3 text-slate-700">{p.requestedBy}</td>
                      <td className="py-3 px-3 text-slate-400 text-[12px] tabular-nums">
                        {(p.date || '').slice(0, 10)}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            disabled={processingProposalId === p.id}
                            onClick={() => handleQuickProposalDecision(p, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={12} />
                            <span>Duyệt</span>
                          </button>
                          <button
                            disabled={processingProposalId === p.id}
                            onClick={() => handleQuickProposalDecision(p, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11.5px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X size={12} />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Cockpit: Left = Daily Timeline & Reminders | Right = 3-6-9 & Urgent LSX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Daily Schedule & Recurring Habits */}
        <div className="lg:col-span-7 axis-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-bold text-[#0C1B2E] flex items-center gap-2">
                <Clock size={17} className="text-[#C69C47]" />
                <span>Trục Lịch Trình & Nhắc Việc Hôm Nay</span>
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Đã hoàn tất {completedTodayCount}/{todaySchedules.length} đầu việc trong ngày
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="text-[12.5px] font-semibold text-[#0C1B2E] hover:text-[#9D772B] inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={15} />
              <span>Thêm nhanh</span>
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

        {/* Right 5 cols: Due Milestones Check-ins & Production Bottlenecks */}
        <div className="lg:col-span-5 space-y-5">
          {/* Milestone Check-in Radar Box */}
          <div className="axis-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-[#0C1B2E]">
                  Đôn Đốc Tiến Độ Việc SMART Đến Hạn
                </h3>
                <button
                  type="button"
                  onClick={() => theoryService.open('SMART')}
                  className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  title="Xem lý thuyết phương pháp SMART"
                >
                  <BookOpen size={12} className="text-[#9D772B]" />
                  <span>Lý thuyết SMART</span>
                </button>
              </div>
              <button
                onClick={() => onNavigate('execution')}
                className="text-[12px] font-semibold text-[#9D772B] hover:underline cursor-pointer"
              >
                Quản lý SMART →
              </button>
            </div>

            {dueCheckins.length === 0 ? (
              <p className="text-[12.5px] text-slate-500 py-4">
                Chưa có mốc tiến độ nào đến hạn hôm nay. Mọi đầu việc ủy quyền đang trong nhịp kiểm soát.
              </p>
            ) : (
              <div className="space-y-3">
                {dueCheckins.slice(0, 4).map((item) => (
                  <div
                    key={`${item.task.id}-${item.stage}`}
                    className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#0C1B2E] text-[#F3DA99] text-[10.5px] font-bold">
                        {item.label}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-800 tabular-nums">
                        Hạn rà soát: {item.dueDate}
                      </span>
                    </div>
                    <div className="text-[13.5px] font-bold text-[#0C1B2E]">
                      {item.task.title}
                    </div>
                    <div className="text-[12px] text-slate-600">
                      Phụ trách: <span className="font-semibold">{item.task.assigneeName}</span>
                    </div>
                    <div className="text-[12px] italic text-slate-600 bg-white/80 p-2 rounded-lg border border-amber-100">
                      💡 Câu hỏi gợi ý CEO: “{item.guidingQuestion}”
                    </div>
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleCompleteCheckinQuick(item.task, item.stage as any)}
                        className="px-3 py-1.5 rounded-lg bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[11.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={13} className="text-[#E5C472]" />
                        <span>Đã đôn đốc & Xác nhận</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Urgent / Overdue LSX Alert from ProTrack */}
          <div className="axis-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-[#0C1B2E] flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>LSX Sát / Quá Hạn Giao (Từ ERP)</span>
              </h3>
              <span className="text-[11.5px] font-bold text-slate-400 tabular-nums">
                {radarMetrics.overdueOrDueTodayLsx.length} lệnh
              </span>
            </div>

            {radarMetrics.overdueOrDueTodayLsx.length === 0 ? (
              <p className="text-[12.5px] text-slate-500 py-3">
                Không có lệnh sản xuất nào bị trễ hạn giao hàng hôm nay.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {radarMetrics.overdueOrDueTodayLsx.slice(0, 5).map((lsx) => (
                  <div key={lsx.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-slate-800 truncate">
                        {lsx.lsxCode || lsx.orderCode || lsx.id}{' '}
                        <span className="font-normal text-slate-500">• {lsx.customer}</span>
                      </div>
                      <div className="text-[11.5px] text-slate-500 truncate">
                        {lsx.itemName || 'Sản phẩm in'} — Tiến độ: {lsx.progress || 'Đang xử lý'}
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-semibold tabular-nums">
                      {String(lsx.deliveryDate || '').slice(0, 10)}
                    </span>
                  </div>
                ))}
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

