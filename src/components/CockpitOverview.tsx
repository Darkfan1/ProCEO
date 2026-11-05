import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Flame,
  Layers,
  ListFilter,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  CeoTabId,
  ScheduleItem,
  SmartTask,
  PdcaCycle,
  Meeting369,
  OkrObjective,
} from '../types/ceoTypes';
import { ErpRadarMetrics } from '../hooks/useErpData';
import { ErpProposal, ErpUser } from '../types/erpTypes';
import {
  formatNumberVi,
  formatRelativeDueBadge,
  getLocalTodayYmd,
} from '../utils/dateUtils';
import { isScheduleActiveOnDate } from '../hooks/useDailyReminderEngine';
import { FrameworkCode } from '../data/ceoMindsetData';
import { ceoAiService } from '../services/ceoAiService';
import { erpService } from '../services/erpService';
import { dialogService } from './common/CustomDialog';
import { triggerPrint } from '../utils/printUtils';
import { getLsxItemName } from '../utils/erpDataUtils';

interface ProgressInputCellProps {
  task: SmartTask;
  onSaveProgress: (task: SmartTask, nextVal: number) => Promise<void> | void;
}

const ProgressInputCell: React.FC<ProgressInputCellProps> = ({ task, onSaveProgress }) => {
  const [localVal, setLocalVal] = useState(String(task.progress ?? 0));

  useEffect(() => {
    setLocalVal(String(task.progress ?? 0));
  }, [task.progress]);

  const numVal = Number(localVal);
  const isValidNum = !isNaN(numVal) && numVal >= 0 && numVal <= 100;
  const isDirty = isValidNum && numVal !== (task.progress ?? 0);

  const handleCommit = () => {
    if (!isValidNum) {
      setLocalVal(String(task.progress ?? 0));
      return;
    }
    const clamped = Math.min(100, Math.max(0, numVal));
    setLocalVal(String(clamped));
    if (clamped !== (task.progress ?? 0)) {
      onSaveProgress(task, clamped);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative inline-flex items-center">
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCommit();
            }
          }}
          onBlur={handleCommit}
          className={`w-14 px-2 py-0.5 rounded-lg border text-center font-mono font-bold text-xs outline-none transition-all ${
            isDirty
              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-400/30'
              : 'border-slate-200 bg-white text-slate-800'
          }`}
        />
        <span className="text-[10px] font-bold text-slate-500 ml-0.5">%</span>
      </div>

      {isDirty && (
        <button
          type="button"
          onClick={handleCommit}
          className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all active:scale-95"
          title="Lưu tiến độ (hoặc nhấn Enter)"
        >
          <Check className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

interface CockpitOverviewProps {
  activeUser: ErpUser | null;
  erpLoaded: boolean;
  radarMetrics: ErpRadarMetrics;
  schedules: ScheduleItem[];
  smartTasks: SmartTask[];
  pdcaCycles: PdcaCycle[];
  meetings: Meeting369[];
  okrs: OkrObjective[];
  onToggleScheduleDone: (item: ScheduleItem) => void;
  onDeleteSchedule: (id: string) => void;
  onQuickAddSchedule: (title: string, startTime: string) => void;
  onQuickAddSmartTask: (title: string, assignee: string) => void;
  onUpdateSmartTaskStatus: (task: SmartTask, nextStatus: SmartTask['status']) => void;
  onFollowUpSmartTask: (task: SmartTask) => void;
  onSaveSmartTask?: (task: SmartTask, pushToErp?: boolean) => Promise<void> | void;
  onSaveSchedule?: (item: ScheduleItem) => Promise<void> | void;
  onConvertSmartToMeeting?: (task: SmartTask) => void;
  onConvertSmartToPdca?: (task: SmartTask) => void;
  onConvertPdcaToMeeting?: (cycle: PdcaCycle) => void;
  onDeleteSmartTask: (id: string) => void;
  onNavigateTab: (
    tab: CeoTabId,
    subView?: string,
    prefill?: { title?: string; assignee?: string; lsxCode?: string }
  ) => void;
  onOpenTheoryDrawer: (code: FrameworkCode) => void;
}

export const CockpitOverview: React.FC<CockpitOverviewProps> = ({
  activeUser,
  erpLoaded,
  radarMetrics,
  schedules,
  smartTasks,
  pdcaCycles,
  meetings,
  okrs,
  onToggleScheduleDone,
  onDeleteSchedule,
  onQuickAddSchedule,
  onQuickAddSmartTask,
  onUpdateSmartTaskStatus,
  onFollowUpSmartTask,
  onSaveSmartTask,
  onSaveSchedule,
  onConvertSmartToMeeting,
  onConvertSmartToPdca,
  onConvertPdcaToMeeting,
  onDeleteSmartTask,
  onNavigateTab,
}) => {
  const todayYmd = getLocalTodayYmd();

  // Bộ lọc lịch trình hôm nay: Tất cả / Định kỳ / Phát sinh
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'DAILY' | 'ADHOC'>('ALL');

  // Form mở thêm nhanh lịch việc phát sinh ngay trong khối Lịch trình
  const [showAddAdHocForm, setShowAddAdHocForm] = useState(false);
  const [adHocTitle, setAdHocTitle] = useState('');
  const [adHocStart, setAdHocStart] = useState('14:00');
  const [adHocEnd, setAdHocEnd] = useState('15:00');
  const [adHocRepeat, setAdHocRepeat] = useState<'ONCE' | 'DAILY'>('ONCE');
  const [adHocNotes, setAdHocNotes] = useState('');

  // Form mở thêm nhanh mục tiêu SMART ngay tại bảng SMART
  const [showAddSmartForm, setShowAddSmartForm] = useState(false);
  const [newSmartTitle, setNewSmartTitle] = useState('');
  const [newSmartAssignee, setNewSmartAssignee] = useState('Quản đốc Sản xuất');
  const [newSmartDueDate, setNewSmartDueDate] = useState(todayYmd);

  // Bộ lọc bảng mục tiêu nhỏ SMART
  const [smartFilter, setSmartFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'DONE'>('ACTIVE');

  // Tab chuyển đổi ở khối công việc khác: Họp 3-6-9 / PDCA / Đề xuất & LSX
  const [otherTasksTab, setOtherTasksTab] = useState<'MEETINGS' | 'PDCA' | 'PROPOSALS_LSX'>('MEETINGS');

  // AI Executive Briefing
  const [aiBriefing, setAiBriefing] = useState<{
    analysis: string;
    topThreeActions: string[];
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Danh sách lịch hôm nay (lọc theo ngày và sắp xếp theo giờ)
  const todaySchedules = useMemo(() => {
    return schedules
      .filter((s) => isScheduleActiveOnDate(s, todayYmd))
      .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
  }, [schedules, todayYmd]);

  // Phân loại lịch: Việc định kỳ hàng ngày vs Lịch phát sinh hôm nay
  const dailySchedules = useMemo(() => {
    return todaySchedules.filter((s) => s.repeat === 'DAILY' || s.repeat === 'WEEKDAYS');
  }, [todaySchedules]);

  const adHocSchedules = useMemo(() => {
    return todaySchedules.filter((s) => s.repeat === 'ONCE' || !s.repeat);
  }, [todaySchedules]);

  const filteredSchedules = useMemo(() => {
    if (scheduleFilter === 'DAILY') return dailySchedules;
    if (scheduleFilter === 'ADHOC') return adHocSchedules;
    return todaySchedules;
  }, [scheduleFilter, dailySchedules, adHocSchedules, todaySchedules]);

  const completedTodayCount = todaySchedules.filter((s) =>
    s.completedDates?.includes(todayYmd)
  ).length;

  // Lọc danh sách mục tiêu SMART
  const filteredSmartTasks = useMemo(() => {
    return smartTasks
      .filter((t) => {
        if (smartFilter === 'DONE') return t.status === 'DONE';
        if (smartFilter === 'ACTIVE') return t.status !== 'DONE';
        if (smartFilter === 'OVERDUE') {
          return t.status !== 'DONE' && t.dueDate && t.dueDate < todayYmd;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        return String(a.dueDate || '').localeCompare(String(b.dueDate || ''));
      });
  }, [smartTasks, smartFilter, todayYmd]);

  const activeSmartTasksCount = smartTasks.filter((t) => t.status !== 'DONE').length;

  // Cuộc họp 3-6-9 gần nhất / hôm nay
  const upcomingMeeting = useMemo(() => {
    if (meetings.length === 0) return null;
    const sorted = [...meetings].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    return sorted.find((m) => m.date === todayYmd) || sorted[0];
  }, [meetings, todayYmd]);

  // Chu trình PDCA đang thực hiện
  const activePdcaList = useMemo(() => {
    return pdcaCycles.filter((p) => p.phase !== 'STANDARDIZED').slice(0, 3);
  }, [pdcaCycles]);

  const handleCreateSmartTaskFromCockpit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSmartTitle.trim()) {
      dialogService.toast('Vui lòng nhập tên mục tiêu SMART!', 'warning');
      return;
    }
    onQuickAddSmartTask(newSmartTitle.trim(), newSmartAssignee.trim() || 'Quản đốc Sản xuất');
    setNewSmartTitle('');
    setShowAddSmartForm(false);
  };

  const handleCreateAdHocSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adHocTitle.trim()) {
      dialogService.toast('Vui lòng nhập nội dung công việc!', 'warning');
      return;
    }
    const newItem: ScheduleItem = {
      id: `sched-${Date.now()}`,
      title: adHocTitle.trim(),
      startTime: adHocStart,
      endTime: adHocEnd,
      date: todayYmd,
      repeat: adHocRepeat,
      category: 'DEEP_WORK',
      priority: 'HIGH',
      remindMinutesBefore: 10,
      notes: adHocNotes.trim(),
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    if (onSaveSchedule) {
      await onSaveSchedule(newItem);
    } else {
      onQuickAddSchedule(adHocTitle.trim(), adHocStart);
    }
    setAdHocTitle('');
    setAdHocNotes('');
    setShowAddAdHocForm(false);
    dialogService.toast(
      adHocRepeat === 'DAILY'
        ? `Đã lưu việc định kỳ hàng ngày: "${newItem.title}"!`
        : `Đã thêm lịch việc phát sinh hôm nay: "${newItem.title}"!`,
      'success'
    );
  };

  const handleRunAiBriefing = async () => {
    setLoadingAi(true);
    try {
      const res = await ceoAiService.generateExecutiveBriefing({
        inProgressLsx: radarMetrics.inProgressLsxCount,
        overdueLsx: radarMetrics.overdueLsx.length,
        pendingProposals: radarMetrics.pendingProposals.length,
        todayOutput: radarMetrics.todayFinishedQuantity,
        openSmartTasks: activeSmartTasksCount,
        activePdca: pdcaCycles.filter((p) => p.phase !== 'STANDARDIZED').length,
      });
      setAiBriefing(res);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleQuickDecideProposal = async (
    proposal: ErpProposal,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const label = decision === 'APPROVED' ? 'PHÊ DUYỆT' : 'TỪ CHỐI';
    const ok = await dialogService.confirm(
      `Xác nhận ${label} đề xuất "${proposal.title}" của ${proposal.requestedBy}?`,
      `${label} đề xuất ERP`
    );
    if (!ok) return;

    try {
      await erpService.decideProposal(
        proposal.id,
        decision,
        {
          id: activeUser?.id || 'ceo-admin',
          name: activeUser?.name || 'Ban Giám Đốc',
        },
        decision === 'APPROVED'
          ? 'Phê duyệt từ Bàn điều hành ProCEO'
          : 'Yêu cầu bổ sung thông tin (ProCEO)'
      );
      dialogService.toast(`Đã ${label.toLowerCase()} đề xuất "${proposal.title}"!`, 'success');
    } catch {
      dialogService.toast('Không thể cập nhật đề xuất (kiểm tra quyền đăng nhập ERP).', 'warning');
    }
  };

  return (
    <div id="cockpit-printable-area" className="space-y-4">
      {/* 1. THANH ĐIỀU HÀNH TRUNG TÂM VISTA 2.5D (TINH GỌN 1 HÀNG) */}
      <div className="vista-hero px-4 py-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-slate-200 font-mono text-xs font-bold shadow-xs">
              {todayYmd}
            </span>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Điều Hành • {activeUser?.name || 'Ban Giám Đốc'}</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print shrink-0">
            <button
              onClick={handleRunAiBriefing}
              disabled={loadingAi}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-slate-100 to-slate-300 text-slate-900 border border-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-all hover:brightness-105 active:scale-95"
            >
              <Sparkles className={`w-3.5 h-3.5 text-slate-700 ${loadingAi ? 'animate-spin' : ''}`} />
              {loadingAi ? 'Đang phân tích...' : 'AI Tổng hợp nhanh'}
            </button>
            <button
              onClick={() => triggerPrint('cockpit-printable-area', `ProCEO_Briefing_${todayYmd}`)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-white/15 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              In A4
            </button>
          </div>
        </div>

        {/* AI Briefing khi được mở */}
        {aiBriefing && (
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/15 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Báo cáo tổng hợp điều hành AI (Gemini)
              </span>
              <button
                onClick={() => setAiBriefing(null)}
                className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
            <p className="text-xs text-slate-100 leading-relaxed">{aiBriefing.analysis}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              {aiBriefing.topThreeActions.map((act, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-white/[0.08] border border-white/12 text-xs text-slate-200 flex items-start gap-2"
                >
                  <span className="w-4 h-4 rounded bg-slate-200 text-slate-900 font-extrabold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{act}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. KHỐI CHIẾN LƯỢC & MỤC TIÊU LỚN TRỌNG TÂM (OKR) — NHẮC ĐỘNG LỰC */}
      <div className="ceo-card p-4 sm:p-5 space-y-3.5 border-l-4 border-l-amber-500 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                <Compass className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                Chiến Lược Trọng Tâm (OKR)
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-extrabold border border-amber-300">
                TẦM NHÌN DẪN ĐƯỜNG
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium italic pt-0.5">
              &quot;Kỷ luật trong sản xuất • Tốc độ trong giao hàng • Chuẩn hóa để giải phóng người lãnh đạo.&quot;
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('execution', 'SMART')}
            className="px-3 py-1.5 rounded-xl btn-25d-secondary text-slate-800 hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0 no-print"
          >
            <span>Quản lý Chiến lược & SMART</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
          </button>
        </div>

        {/* Danh sách các Mục tiêu lớn (Objectives) & Key Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {okrs.length === 0 ? (
            <div className="col-span-full p-4 rounded-xl bg-amber-50/70 border border-dashed border-amber-300 text-center text-xs space-y-1">
              <p className="font-bold text-slate-800">Chưa thiết lập Mục tiêu lớn (OKR) cho quý này</p>
              <button
                onClick={() => onNavigateTab('execution', 'SMART')}
                className="text-amber-800 hover:text-amber-950 font-extrabold underline cursor-pointer"
              >
                + Bấm vào đây để thiết lập Mục tiêu lớn truyền động lực →
              </button>
            </div>
          ) : (
            okrs.slice(0, 3).map((okr) => {
              const totalKrs = okr.keyResults.length || 1;
              const avgProgress = Math.round(
                okr.keyResults.reduce((acc, kr) => {
                  const span = kr.targetValue - kr.startValue || 1;
                  const current = Math.max(0, Math.min(span, kr.currentValue - kr.startValue));
                  return acc + (current / span) * 100;
                }, 0) / totalKrs
              );

              return (
                <div
                  key={okr.id}
                  onClick={() => onNavigateTab('execution', 'SMART')}
                  className="p-3.5 rounded-xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 space-y-2.5 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-200 text-slate-800">
                      {okr.quarter || 'Q4/2026'} • {okr.priority}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-amber-700">
                      {avgProgress}% đạt
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors">
                    {okr.title}
                  </h4>

                  {/* Thanh tiến độ tổng quan của Mục tiêu lớn */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(5, avgProgress))}%` }}
                      />
                    </div>
                  </div>

                  {/* Hiển thị 2 Kết quả then chốt (Key Results) tiêu biểu */}
                  <div className="space-y-1 pt-1 border-t border-slate-200 text-[11px] text-slate-700">
                    {okr.keyResults.slice(0, 2).map((kr) => (
                      <div key={kr.id} className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">• {kr.title}</span>
                        <span className="font-mono text-slate-500 shrink-0 font-bold">
                          {kr.currentValue}/{kr.targetValue} {kr.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. 5 THẺ CHỈ SỐ 2.5D XÁM TỐI GIẢN TỪ ERP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => onNavigateTab('erp-bridge', 'LSX')}
          className="ceo-card p-3.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>Lệnh SX Đang Chạy</span>
            <Layers className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {erpLoaded ? formatNumberVi(radarMetrics.inProgressLsxCount) : '...'}
            </span>
            <span className="text-xs text-slate-500">
              / {formatNumberVi(radarMetrics.totalLsxCount)}
            </span>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
            <span
              className={
                radarMetrics.overdueLsx.length > 0
                  ? 'text-rose-700 font-bold flex items-center gap-1'
                  : radarMetrics.nearingDeadlineLsx.length > 0
                  ? 'text-amber-700 font-bold flex items-center gap-1'
                  : 'text-slate-600 font-medium'
              }
            >
              {radarMetrics.overdueLsx.length > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
              {radarMetrics.overdueLsx.length > 0
                ? `${radarMetrics.overdueLsx.length} trễ hạn`
                : radarMetrics.nearingDeadlineLsx.length > 0
                ? `${radarMetrics.nearingDeadlineLsx.length} sắp hạn`
                : 'Tiến độ bình thường'}
            </span>
            <span className="text-slate-700 font-bold group-hover:underline">Chi tiết →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('erp-bridge', 'INTAKES')}
          className="ceo-card p-3.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>Chờ Lên Lệnh & Đề Xuất</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {erpLoaded ? formatNumberVi(radarMetrics.pendingIntakesCount) : '...'}
            </span>
            <span className="text-xs text-slate-500">đơn chờ lên lệnh</span>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              +{radarMetrics.pendingProposals.length} đề xuất duyệt
            </span>
            <span className="text-slate-700 font-bold group-hover:underline">Xử lý →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('erp-bridge', 'INTAKES')}
          className="ceo-card p-3.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>ĐH Mới Trong Ngày</span>
            <ShoppingCart className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {erpLoaded ? formatNumberVi(radarMetrics.todayNewIntakesCount) : '...'}
            </span>
            <span className="text-xs text-slate-500">đơn tiếp nhận</span>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium truncate">
              {radarMetrics.todayNewIntakesCount > 0
                ? `${formatNumberVi(radarMetrics.todayNewIntakesQuantity)} tem/SP đặt mới`
                : 'Chưa có đơn mới hôm nay'}
            </span>
            <span className="text-slate-700 font-bold group-hover:underline shrink-0">Xem đơn →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('execution', 'PDCA')}
          className="ceo-card p-3.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>Tiến Độ Thực Thi (PDCA)</span>
            <RefreshCw className="w-4 h-4 text-slate-600 group-hover:rotate-180 transition-transform duration-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {pdcaCycles.filter((p) => p.phase !== 'STANDARDIZED').length}
            </span>
            <span className="text-xs text-slate-500">chu trình đang chạy</span>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium truncate">
              {pdcaCycles.length === 0
                ? 'Chưa khởi tạo PDCA'
                : `P: ${pdcaCycles.filter((p) => p.phase === 'PLAN').length} • D: ${pdcaCycles.filter((p) => p.phase === 'DO').length} • C: ${pdcaCycles.filter((p) => p.phase === 'CHECK').length} • A: ${pdcaCycles.filter((p) => p.phase === 'ACT').length}`}
            </span>
            <span className="text-slate-700 font-bold group-hover:underline shrink-0">Xử lý PDCA →</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('execution', 'SMART')}
          className="ceo-card p-3.5 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
            <span>Tiến Độ Trong Ngày</span>
            <Target className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {completedTodayCount}/{todaySchedules.length}
            </span>
            <span className="text-xs text-slate-500">lịch hoàn tất</span>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {activeSmartTasksCount} việc SMART mở
            </span>
            <span className="text-slate-700 font-bold group-hover:underline">Mở bảng →</span>
          </div>
        </div>
      </div>

      {/* 4. HAI CỘT TRỌNG TÂM: LỊCH TRÌNH (ĐỊNH KỲ & PHÁT SINH) & QUẢN LÝ SMART + CÁC VIỆC KHÁC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* CỘT TRÁI (5/12): LỊCH TRÌNH HÔM NAY (ĐỊNH KỲ & PHÁT SINH) */}
        <div className="lg:col-span-5 ceo-card p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-800" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Lịch Trình Hôm Nay ({completedTodayCount}/{todaySchedules.length})
              </h3>
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={() => setShowAddAdHocForm(!showAddAdHocForm)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Lịch phát sinh</span>
              </button>
              <button
                onClick={() => onNavigateTab('execution', 'SMART')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Tất cả →
              </button>
            </div>
          </div>

          {/* Form thêm nhanh Lịch việc phát sinh / Định kỳ */}
          {showAddAdHocForm && (
            <form
              onSubmit={handleCreateAdHocSchedule}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 no-print text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] uppercase">
                  Thêm Lịch Trình Mới
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddAdHocForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={adHocTitle}
                  onChange={(e) => setAdHocTitle(e.target.value)}
                  placeholder="Nội dung lịch việc (VD: Tiếp đối tác decal Avery / Họp đột xuất)..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Bắt đầu</label>
                  <input
                    type="time"
                    value={adHocStart}
                    onChange={(e) => setAdHocStart(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Kết thúc</label>
                  <input
                    type="time"
                    value={adHocEnd}
                    onChange={(e) => setAdHocEnd(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Loại việc</label>
                  <select
                    value={adHocRepeat}
                    onChange={(e) => setAdHocRepeat(e.target.value as any)}
                    className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 outline-none text-xs font-bold"
                  >
                    <option value="ONCE">Phát sinh hôm nay</option>
                    <option value="DAILY">Định kỳ hàng ngày</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddAdHocForm(false)}
                  className="px-2.5 py-1 text-slate-500 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg btn-25d-primary font-bold cursor-pointer"
                >
                  Lưu Lịch
                </button>
              </div>
            </form>
          )}

          {/* Bộ lọc 3 tab: Tất cả / Định kỳ / Phát sinh */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs no-print">
            <button
              type="button"
              onClick={() => setScheduleFilter('ALL')}
              className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                scheduleFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({todaySchedules.length})
            </button>
            <button
              type="button"
              onClick={() => setScheduleFilter('DAILY')}
              className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                scheduleFilter === 'DAILY'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Các việc mặc định hàng ngày"
            >
              <span>🔄 Định kỳ ({dailySchedules.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setScheduleFilter('ADHOC')}
              className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                scheduleFilter === 'ADHOC'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Lịch việc đột xuất phát sinh hôm nay"
            >
              <span>⚡ Phát sinh ({adHocSchedules.length})</span>
            </button>
          </div>

          {/* Danh sách các công việc trong ngày */}
          <div className="space-y-2">
            {filteredSchedules.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">
                  {scheduleFilter === 'DAILY'
                    ? 'Không có việc định kỳ nào'
                    : scheduleFilter === 'ADHOC'
                    ? 'Chưa có lịch phát sinh nào hôm nay'
                    : 'Chưa có lịch trình nào hôm nay'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Bấm &quot;+ Lịch phát sinh&quot; ở trên để thêm nhanh lịch hẹn hoặc công việc đột xuất.
                </p>
              </div>
            ) : (
              filteredSchedules.map((sched) => {
                const isDone = sched.completedDates?.includes(todayYmd);
                const isDaily = sched.repeat === 'DAILY' || sched.repeat === 'WEEKDAYS';

                return (
                  <div
                    key={sched.id}
                    className={`group p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isDone
                        ? 'bg-slate-100/70 border-slate-200/60 opacity-60'
                        : 'bg-white/90 border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => onToggleScheduleDone(sched)}
                        className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isDone
                            ? 'bg-slate-800 border-slate-800 text-white'
                            : 'border-slate-400 bg-white hover:border-slate-700'
                        }`}
                        title="Đánh dấu hoàn thành"
                      >
                        {isDone && <CheckCircle2 className="w-3 h-3" />}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-800">
                            {sched.startTime} - {sched.endTime}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                              isDaily
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isDaily ? 'Định kỳ' : 'Phát sinh'}
                          </span>
                        </div>

                        <div
                          className={`text-xs sm:text-sm font-bold pt-0.5 ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {sched.title}
                        </div>

                        {sched.notes && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {sched.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 no-print">
                      <button
                        onClick={() => onDeleteSchedule(sched.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Xóa lịch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CỘT PHẢI (7/12): QUẢN LÝ MỤC TIÊU NHỎ (SMART) & CÁC CÔNG VIỆC KHÁC */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. BẢNG QUẢN LÝ MỤC TIÊU NHỎ (SMART) */}
          <div className="ceo-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-800" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Quản Lý Mục Tiêu (SMART)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {activeSmartTasksCount} việc đang mở
                </span>
              </div>

              {/* Bộ lọc nhanh: Tất cả / Đang làm / Quá hạn & Nút Giao Mục Tiêu Mới */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold no-print">
                <button
                  type="button"
                  onClick={() => setShowAddSmartForm(!showAddSmartForm)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors mr-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Giao Mục Tiêu Mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSmartFilter('ACTIVE')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    smartFilter === 'ACTIVE'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Đang làm
                </button>
                <button
                  type="button"
                  onClick={() => setSmartFilter('OVERDUE')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    smartFilter === 'OVERDUE'
                      ? 'bg-rose-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Quá hạn
                </button>
                <button
                  type="button"
                  onClick={() => setSmartFilter('ALL')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    smartFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ({smartTasks.length})
                </button>
                <button
                  onClick={() => onNavigateTab('execution', 'SMART')}
                  className="text-slate-800 hover:underline ml-1 font-bold"
                >
                  Bảng lớn →
                </button>
              </div>
            </div>

            {/* Form thêm nhanh Mục tiêu SMART ngay tại bảng */}
            {showAddSmartForm && (
              <form
                onSubmit={handleCreateSmartTaskFromCockpit}
                className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2.5 no-print text-xs animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-950 text-[11px] uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Giao Mục Tiêu SMART Mới</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSmartForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={newSmartTitle}
                    onChange={(e) => setNewSmartTitle(e.target.value)}
                    placeholder="Tên mục tiêu SMART cần giao (VD: Hoàn thành 100% LSX Flexo đúng định mức)..."
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-indigo-200 font-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                      Người / Bộ phận phụ trách
                    </label>
                    <input
                      type="text"
                      value={newSmartAssignee}
                      onChange={(e) => setNewSmartAssignee(e.target.value)}
                      placeholder="VD: Quản đốc Sản xuất / Hoàng Văn Việt"
                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-indigo-200 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                      Hạn hoàn thành (T)
                    </label>
                    <input
                      type="date"
                      value={newSmartDueDate}
                      onChange={(e) => setNewSmartDueDate(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-indigo-200 outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddSmartForm(false)}
                    className="px-2.5 py-1 text-slate-500 font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 rounded-lg btn-25d-primary font-bold cursor-pointer"
                  >
                    Giao Việc
                  </button>
                </div>
              </form>
            )}

            {/* Bảng công việc SMART (Tuân thủ Clean Table UI Rule 2) */}
            <div
              className="table-scroll-region"
              tabIndex={0}
              role="region"
              aria-label="Bảng công việc SMART"
            >
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-white">
                    <th className="py-2 px-2.5">Mục tiêu SMART</th>
                    <th className="py-2 px-2.5">Phụ trách</th>
                    <th className="py-2 px-2.5">Hạn</th>
                    <th className="py-2 px-2.5">Tiến độ (%)</th>
                    <th className="py-2 px-2.5 text-right no-print">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSmartTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        Không có mục tiêu SMART nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredSmartTasks.slice(0, 6).map((task) => {
                      const badge = formatRelativeDueBadge(task.dueDate, todayYmd);
                      const isCollective =
                        task.assigneeName.startsWith('Tập thể') ||
                        task.assigneeName.startsWith('Ban') ||
                        task.assigneeName.startsWith('Bộ phận');
                      const linkedPdca = pdcaCycles.find((p) => p.linkedSmartTaskId === task.id);

                      return (
                        <tr
                          key={task.id}
                          className="group hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-2.5 px-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`font-bold ${
                                  task.status === 'DONE'
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </span>
                              {linkedPdca && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateTab('execution', 'PDCA');
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[9.5px] font-extrabold hover:bg-cyan-100 cursor-pointer"
                                  title={`Chu trình PDCA: ${linkedPdca.title} (Vòng lặp #${linkedPdca.iteration}). Bấm để xem.`}
                                >
                                  <RefreshCw className="w-2.5 h-2.5 text-cyan-600" />
                                  <span>
                                    {linkedPdca.phase === 'PLAN' && 'P - Kế hoạch'}
                                    {linkedPdca.phase === 'DO' && 'D - Thực thi'}
                                    {linkedPdca.phase === 'CHECK' && 'C - Họp/Kiểm tra'}
                                    {linkedPdca.phase === 'ACT' && 'A - Đánh giá/SOP'}
                                    {linkedPdca.phase === 'STANDARDIZED' && '✓ Đã chuẩn SOP'}
                                  </span>
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              {task.smart?.measurable}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <span>{isCollective ? '👥' : '👤'}</span>
                              <span className="truncate max-w-[120px]">{task.assigneeName}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">{task.department}</div>
                          </td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
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
                              {task.status === 'DONE' ? 'Hoàn thành' : badge.text}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 whitespace-nowrap">
                            <ProgressInputCell
                              task={task}
                              onSaveProgress={(t, nextVal) => {
                                if (onSaveSmartTask) {
                                  onSaveSmartTask({
                                    ...t,
                                    progress: nextVal,
                                    status: nextVal >= 100 ? 'DONE' : 'IN_PROGRESS',
                                  });
                                } else {
                                  onUpdateSmartTaskStatus(
                                    { ...t, progress: nextVal },
                                    nextVal >= 100 ? 'DONE' : 'IN_PROGRESS'
                                  );
                                }
                                dialogService.toast(
                                  `Đã cập nhật tiến độ ${nextVal}% cho mục tiêu "${t.title}"!`,
                                  'success'
                                );
                              }}
                            />
                          </td>
                          <td className="py-2.5 px-2.5 text-right no-print whitespace-nowrap">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-end gap-1">
                              {/* Nút Hoàn thành */}
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateSmartTaskStatus(
                                    task,
                                    task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE'
                                  )
                                }
                                className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                                  task.status === 'DONE'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                    : 'bg-white text-slate-400 border-slate-200 hover:text-emerald-600 hover:border-emerald-300'
                                }`}
                                title={
                                  task.status === 'DONE'
                                    ? 'Mở lại mục tiêu'
                                    : 'Đánh dấu hoàn thành 100%'
                                }
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Nút Tạo/Mở Chu trình PDCA */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onConvertSmartToPdca) {
                                    onConvertSmartToPdca(task);
                                  } else {
                                    onNavigateTab('execution', 'PDCA', {
                                      title: task.title,
                                      assignee: task.assigneeName,
                                    });
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 cursor-pointer"
                                title="Tổ chức chu trình PDCA thực thi mục tiêu này (AI tự động thiết lập kế hoạch)"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              {/* Nút Đôn đốc qua ERP */}
                              <button
                                type="button"
                                onClick={() => onFollowUpSmartTask(task)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
                                title="Đôn đốc tiến độ qua ERP"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>

                              {/* Nút Đưa vào Họp 3-6-9 */}
                              {onConvertSmartToMeeting && (
                                <button
                                  type="button"
                                  onClick={() => onConvertSmartToMeeting(task)}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer"
                                  title="Đưa vào Phòng Họp 3-6-9 để tháo gỡ điểm nghẽn"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Nút Xóa */}
                              <button
                                type="button"
                                onClick={() => onDeleteSmartTask(task.id)}
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

          {/* 2. CÁC CÔNG VIỆC KHÁC (HỌP 3-6-9 / PDCA / ĐỀ XUẤT & LSX SÁT HẠN) */}
          <div className="ceo-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs no-print">
                <button
                  type="button"
                  onClick={() => setOtherTasksTab('MEETINGS')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    otherTasksTab === 'MEETINGS'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  👥 Phòng Họp 3-6-9 ({meetings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOtherTasksTab('PDCA')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    otherTasksTab === 'PDCA'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔄 Cải Tiến PDCA ({activePdcaList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOtherTasksTab('PROPOSALS_LSX')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    otherTasksTab === 'PROPOSALS_LSX'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚡ Đề Xuất ({radarMetrics.pendingProposals.length}) & LSX ({radarMetrics.overdueLsx.length})
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-medium">
                Vận hành liên phòng ban ProCEO
              </span>
            </div>

            {/* Tab 1: Cuộc họp trực tiếp 3-6-9 gần nhất */}
            {otherTasksTab === 'MEETINGS' && (
              <div>
                {!upcomingMeeting ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">Chưa có cuộc họp nào được lập</p>
                    <button
                      onClick={() => onNavigateTab('execution', 'MEETINGS')}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      + Lập Đề Cương & Kịch Bản Họp Mới →
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                          {upcomingMeeting.date === todayYmd ? 'Họp Hôm Nay' : `Ngày: ${upcomingMeeting.date}`}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {upcomingMeeting.title}
                        </h4>
                      </div>
                      <p className="text-[11.5px] text-slate-600 line-clamp-1">
                        <span className="font-semibold text-slate-800">Chủ đề:</span> {upcomingMeeting.topic}
                      </p>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                        <span>⏰ {upcomingMeeting.startTime} ({upcomingMeeting.durationMinutes} phút)</span>
                        <span>📍 {upcomingMeeting.location || 'Phòng họp BGĐ'}</span>
                        <span>👥 {(upcomingMeeting.participants || []).length} thành phần</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 no-print">
                      <button
                        onClick={() => onNavigateTab('execution', 'MEETINGS')}
                        className="px-3 py-1.5 rounded-xl btn-25d-primary font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Mở Phòng Họp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Chu trình PDCA cải tiến liên tục */}
            {otherTasksTab === 'PDCA' && (
              <div className="space-y-2">
                {activePdcaList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">100% quy trình đã chuẩn hóa SOP</p>
                    <button
                      onClick={() => onNavigateTab('execution', 'PDCA')}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      + Khởi động Vòng cải tiến PDCA mới →
                    </button>
                  </div>
                ) : (
                  activePdcaList.map((cycle) => (
                    <div
                      key={cycle.id}
                      onClick={() => onNavigateTab('execution', 'PDCA')}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-white font-mono text-[10px] font-extrabold uppercase">
                            Pha: {cycle.phase}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {cycle.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          Chủ trì: {cycle.ownerName} • Mục tiêu: {cycle.metricTarget} (Hiện tại: {cycle.metricActual || cycle.metricBaseline})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onConvertPdcaToMeeting && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onConvertPdcaToMeeting(cycle);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Mở phòng họp 3-6-9 để giám sát chu trình PDCA này"
                          >
                            <Users className="w-3 h-3 text-amber-700" />
                            <span>Họp 3-6-9</span>
                          </button>
                        )}
                        <span className="text-xs font-bold text-slate-700">
                          Chi tiết →
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Đề xuất duyệt & Lệnh sản xuất sát hạn */}
            {otherTasksTab === 'PROPOSALS_LSX' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Đề xuất chờ duyệt */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-slate-800 uppercase flex items-center justify-between">
                    <span>Đề xuất chờ duyệt ({radarMetrics.pendingProposals.length})</span>
                    <button
                      onClick={() => onNavigateTab('erp-bridge', 'PROPOSALS')}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900"
                    >
                      Tất cả →
                    </button>
                  </div>
                  {radarMetrics.pendingProposals.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                      Không có đề xuất tồn đọng.
                    </div>
                  ) : (
                    radarMetrics.pendingProposals.slice(0, 2).map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{p.title}</div>
                          <div className="text-[10px] text-slate-500">
                            {p.requestedBy} • {p.category}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 no-print">
                          <button
                            onClick={() => handleQuickDecideProposal(p, 'APPROVED')}
                            className="px-2 py-1 rounded-md btn-25d-primary font-bold text-[11px] cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleQuickDecideProposal(p, 'REJECTED')}
                            className="px-2 py-1 rounded-md btn-25d-secondary font-bold text-[11px] cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* LSX sát/quá hạn */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-slate-800 uppercase flex items-center justify-between">
                    <span>LSX sát/quá hạn ({radarMetrics.overdueLsx.length})</span>
                    <button
                      onClick={() => onNavigateTab('erp-bridge', 'LSX')}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900"
                    >
                      Bảng LSX →
                    </button>
                  </div>
                  {radarMetrics.overdueLsx.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                      100% LSX đúng tiến độ.
                    </div>
                  ) : (
                    radarMetrics.overdueLsx.slice(0, 2).map((l) => (
                      <div
                        key={l.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div
                            className="text-xs font-bold text-slate-900 truncate"
                            title={getLsxItemName(l)}
                          >
                            {l.lsxCode || l.orderCode} • {l.customer || ''}
                          </div>
                          <div className="text-[10.5px] text-rose-700 font-semibold">
                            Hạn: {l.deliveryDate?.slice(0, 10)}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            onNavigateTab('execution', 'SMART', {
                              title: `Đẩy nhanh hoàn tất đơn ${l.lsxCode || l.orderCode} (${l.customer || ''})`,
                              assignee: 'Quản đốc Sản xuất',
                              lsxCode: l.lsxCode || l.orderCode,
                            })
                          }
                          className="px-2 py-1 rounded-md btn-25d-primary font-bold text-[11px] shrink-0 cursor-pointer no-print"
                        >
                          Giao SMART
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
