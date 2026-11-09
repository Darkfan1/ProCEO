import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  RefreshCw,
  Users,
  CheckSquare,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  HeartHandshake,
  CheckCircle2,
  FileText,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  Printer,
  Compass,
  Database,
  Boxes,
  Check,
  X,
  FileCheck,
  AlertCircle,
  Factory,
  PackageCheck,
} from 'lucide-react';
import {
  ScheduleItem,
  SmartTask,
  PdcaCycle,
  Meeting369,
  OkrObjective,
  SwotBoard,
  MaslowEmployeePlan,
  FfcPraiseRecord,
  PrepMessage,
  CeoTabId,
  isDriActionTask,
} from '../../types/ceoTypes';
import {
  ErpRadarMetrics,
  ErpLsxOrder,
  ErpOrderIntake,
  ErpProposal,
  ErpStageReport,
  ErpMachine,
  ErpStaffMember,
} from '../../types/erpTypes';
import { getLocalTodayYmd, formatRelativeDueBadge } from '../../utils/dateUtils';
import { isScheduleActiveOnDate } from '../../hooks/useDailyReminderEngine';
import { triggerPrint } from '../../utils/printUtils';
import { dialogService } from '../common/CustomDialog';

interface ExecutiveDashboardProps {
  schedules: ScheduleItem[];
  smartTasks: SmartTask[];
  pdcaCycles: PdcaCycle[];
  meetings: Meeting369[];
  okrs: OkrObjective[];
  swotBoards: SwotBoard[];
  maslowPlans: MaslowEmployeePlan[];
  ffcPraises: FfcPraiseRecord[];
  prepMessages: PrepMessage[];
  onNavigateTab: (tab: CeoTabId, subView?: string, prefill?: any) => void;
  onToggleScheduleDone: (item: ScheduleItem) => Promise<void> | void;
  aiBriefing: { analysis: string; topThreeActions: string[] } | null;
  onRunAiBriefing: () => void;
  loadingAi: boolean;

  // Dữ liệu thực tế ERP MVĐN
  radarMetrics?: ErpRadarMetrics;
  lsxOrders?: ErpLsxOrder[];
  intakes?: ErpOrderIntake[];
  proposals?: ErpProposal[];
  recentReports?: ErpStageReport[];
  machines?: ErpMachine[];
  staffDirectory?: ErpStaffMember[];
  erpLoaded?: boolean;
  onDecideProposal?: (proposalId: string, decision: 'APPROVED' | 'REJECTED', comment?: string) => Promise<void> | void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  schedules,
  smartTasks,
  pdcaCycles,
  meetings,
  okrs,
  swotBoards,
  maslowPlans,
  ffcPraises,
  prepMessages,
  onNavigateTab,
  onToggleScheduleDone,
  aiBriefing,
  onRunAiBriefing,
  loadingAi,
  radarMetrics,
  lsxOrders = [],
  intakes = [],
  proposals = [],
  recentReports = [],
  machines = [],
  staffDirectory = [],
  erpLoaded = true,
  onDecideProposal,
}) => {
  const todayYmd = getLocalTodayYmd();

  // Tab con trong Cột 1: Điều Hành Hôm Nay (Today Focus)
  const [todayFocusTab, setTodayFocusTab] = useState<'SCHEDULES' | 'PROPOSALS'>('SCHEDULES');

  // Tab con trong Cột 2: Trọng Tâm Thực Thi (Execution Control)
  const [execTab, setExecTab] = useState<'SMART' | 'OVERDUE_LSX'>('SMART');

  // ─── THỐNG KÊ REALTIME CHO CÁC KHU VỰC ─────────────────────────────────────
  // 1. Vận hành sản xuất ERP
  const inProgressLsxCount = radarMetrics?.inProgressLsxCount ?? lsxOrders.filter((o) => o.progress !== 'Đã đóng gói').length;
  const totalLsxCount = radarMetrics?.totalLsxCount ?? lsxOrders.length;
  const overdueLsx = useMemo(() => {
    if (radarMetrics?.overdueLsx) return radarMetrics.overdueLsx;
    return lsxOrders.filter((o) => o.deliveryDate && o.deliveryDate < todayYmd && o.progress !== 'Đã đóng gói');
  }, [radarMetrics, lsxOrders, todayYmd]);

  const onTimeLsxRate = radarMetrics?.onTimeLsxRate ?? (totalLsxCount > 0 ? Math.round(((totalLsxCount - overdueLsx.length) / totalLsxCount) * 100) : 100);

  // 2. Tiếp nhận đơn hàng ERP
  const todayNewIntakes = useMemo(() => {
    if (radarMetrics?.todayNewIntakes) return radarMetrics.todayNewIntakes;
    return intakes.filter((i) => (i.orderDate || i.createdAt || '').slice(0, 10) === todayYmd);
  }, [radarMetrics, intakes, todayYmd]);

  const pendingIntakes = useMemo(() => {
    if (radarMetrics?.pendingIntakes) return radarMetrics.pendingIntakes;
    return intakes.filter((i) => i.status === 'Chờ xử lý' || (i.status as any) === 'PENDING' || !i.status);
  }, [radarMetrics, intakes]);

  const pendingProposals = useMemo(() => {
    if (radarMetrics?.pendingProposals) return radarMetrics.pendingProposals;
    return proposals.filter((p) => p.finalStatus === 'PENDING');
  }, [radarMetrics, proposals]);

  // 3. Quản trị mục tiêu SMART (chỉ đếm Mục tiêu định lượng SMART, tách riêng Tác vụ DRI)
  const smartGoalsOnly = useMemo(
    () => smartTasks.filter((t) => !isDriActionTask(t)),
    [smartTasks]
  );
  const activeSmartCount = useMemo(
    () => smartGoalsOnly.filter((t) => t.status !== 'DONE').length,
    [smartGoalsOnly]
  );
  const overdueSmartCount = useMemo(
    () => smartGoalsOnly.filter((t) => t.status !== 'DONE' && t.dueDate < todayYmd).length,
    [smartGoalsOnly, todayYmd]
  );

  // 4. Chiến lược OKR
  const okrsAtRisk = useMemo(() => {
    return okrs.filter((o) => {
      return (o.keyResults || []).some((kr) => {
        const span = kr.targetValue - kr.startValue || 1;
        const current = kr.currentValue - kr.startValue;
        return current / span < 0.4;
      });
    });
  }, [okrs]);

  // 5. Lịch trình & Cuộc họp CEO hôm nay (tránh lặp nếu cuộc họp đã đồng bộ vào Lịch trình)
  const todaySchedules = useMemo(
    () => schedules.filter((s) => s.date === todayYmd || isScheduleActiveOnDate(s, todayYmd)),
    [schedules, todayYmd]
  );
  const todayMeetings = useMemo(
    () =>
      meetings.filter(
        (m) =>
          m.date === todayYmd &&
          m.status !== 'CLOSED' &&
          !todaySchedules.some((s) => s.id === `sched-mtg-${m.id}`)
      ),
    [meetings, todayYmd, todaySchedules]
  );

  // Action items cần đôn đốc sau họp
  const pendingMeetingActions = useMemo(() => {
    const list: Array<{ meetingTitle: string; taskTitle: string; assigneeName: string; dueDate: string }> = [];
    meetings.forEach((m) => {
      (m.actionItems || []).forEach((act) => {
        if (act.status !== 'COMPLETED') {
          list.push({
            meetingTitle: m.title,
            taskTitle: act.taskTitle,
            assigneeName: act.assigneeName,
            dueDate: act.dueDate,
          });
        }
      });
    });
    return list;
  }, [meetings]);

  // 6. Nhân sự & Động lực
  const activeWorkersToday = radarMetrics?.activeWorkersToday ?? (staffDirectory.length > 0 ? Math.round(staffDirectory.length * 0.7) : 0);

  return (
    <div id="executive-dashboard-print" className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. AI EXECUTIVE BRIEFING (FROSTED SMOKED TITANIUM GLASS)            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="glass-liquid-dark p-4 sm:p-5 text-white shadow-lg relative overflow-hidden transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-slate-200 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Bản Tin Điều Hành AI
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-mono font-bold text-emerald-300">
                  Realtime ERP MVĐN
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Tổng hợp từ {inProgressLsxCount} LSX đang chạy, {todayNewIntakes.length} đơn mới và {pendingProposals.length} đề xuất chờ duyệt.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print shrink-0">
            <button
              onClick={onRunAiBriefing}
              disabled={loadingAi}
              className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer bg-white/15 hover:bg-white/20 text-white border border-white/20 shadow-xs transition-transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${loadingAi ? 'animate-spin' : ''}`} />
              <span>{loadingAi ? 'Đang phân tích...' : 'Làm mới bản tin'}</span>
            </button>
            <button
              onClick={() => triggerPrint('executive-dashboard-print', `ProCEO_Executive_Dashboard_${todayYmd}`)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="In bản tổng quan điều hành A4"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Nội dung AI Briefing */}
        <div className="pt-3 space-y-3">
          {aiBriefing ? (
            <>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                {aiBriefing.analysis}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                {aiBriefing.topThreeActions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug text-slate-200">{act}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-300">
                <span className="font-bold text-white">Chưa tạo bản tin hôm nay:</span> Hệ thống đang giám sát {inProgressLsxCount} lệnh sản xuất, {overdueLsx.length} lệnh trễ hạn, {todayNewIntakes.length} đơn hàng mới và {pendingProposals.length} đề xuất chờ duyệt.
              </div>
              <button
                onClick={onRunAiBriefing}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer shrink-0"
              >
                Yêu cầu AI phân tích ngay →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. 4 THẺ CHỈ SỐ KPI ĐIỀU HÀNH (KHÔNG TRÙNG LẶP - GLASS LIQUID)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: VẬN HÀNH SẢN XUẤT */}
        <div
          onClick={() => onNavigateTab('erp-bridge')}
          className="glass-liquid p-4 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            <span>Vận Hành Sản Xuất</span>
            <Factory className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{inProgressLsxCount}</span>
            <span className="text-xs text-slate-500 font-semibold">/ {totalLsxCount} LSX</span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className={overdueLsx.length > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
              {overdueLsx.length > 0 ? `⚠️ ${overdueLsx.length} trễ hạn` : `Đúng hẹn: ${onTimeLsxRate}%`}
            </span>
            <span className="font-bold text-slate-700 group-hover:underline">Chi tiết →</span>
          </div>
        </div>

        {/* Card 2: TIẾP NHẬN & ĐƠN HÀNG */}
        <div
          onClick={() => onNavigateTab('erp-bridge')}
          className="glass-liquid p-4 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            <span>Tiếp Nhận & Đơn Hàng</span>
            <Boxes className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{todayNewIntakes.length}</span>
            <span className="text-xs text-slate-500 font-semibold">đơn mới hôm nay</span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">
              Chờ lên lệnh: <strong className="text-slate-900">{pendingIntakes.length}</strong>
            </span>
            <span className="font-bold text-slate-700 group-hover:underline">Xem ĐH →</span>
          </div>
        </div>

        {/* Card 3: MỤC TIÊU SMART */}
        <div
          onClick={() => onNavigateTab('smart')}
          className="glass-liquid p-4 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            <span>Mục Tiêu SMART</span>
            <Target className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{activeSmartCount}</span>
            <span className="text-xs text-slate-500 font-semibold">/ {smartGoalsOnly.length} mục tiêu</span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className={overdueSmartCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-500 font-medium'}>
              {overdueSmartCount > 0 ? `${overdueSmartCount} quá hạn` : 'Tiến độ đảm bảo'}
            </span>
            <span className="font-bold text-slate-700 group-hover:underline">Quản lý →</span>
          </div>
        </div>

        {/* Card 4: CHIẾN LƯỢC OKR */}
        <div
          onClick={() => onNavigateTab('okr')}
          className="glass-liquid p-4 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            <span>Chiến Lược OKR</span>
            <TrendingUp className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{okrs.length}</span>
            <span className="text-xs text-slate-500 font-semibold">Mục tiêu quý</span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
            <span className={okrsAtRisk.length > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-medium'}>
              {okrsAtRisk.length > 0 ? `${okrsAtRisk.length} KR cần cứu` : 'Đúng tiến độ 100%'}
            </span>
            <span className="font-bold text-slate-700 group-hover:underline">Xem KR →</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. 2 CỘT CÂN XỨNG: ĐIỀU HÀNH HÔM NAY (6/12) + TRỌNG TÂM THỰC THI (6/12) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CỘT 1 (6/12): ĐIỀU HÀNH HÔM NAY (LỊCH TRÌNH & DUYỆT ĐỀ XUẤT) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="glass-liquid p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-800" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Điều Hành Hôm Nay
                </h4>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setTodayFocusTab('SCHEDULES')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    todayFocusTab === 'SCHEDULES'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Lịch Trình ({todaySchedules.length + todayMeetings.length})
                </button>
                <button
                  onClick={() => setTodayFocusTab('PROPOSALS')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${
                    todayFocusTab === 'PROPOSALS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Duyệt Đề Xuất</span>
                  {pendingProposals.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                      {pendingProposals.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* TAB CON 1: LỊCH TRÌNH & HỌP */}
            {todayFocusTab === 'SCHEDULES' && (
              <div className="space-y-2">
                {todaySchedules.length === 0 && todayMeetings.length === 0 ? (
                  <div className="p-5 text-center rounded-xl bg-white/40 border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                    <p>Chưa có lịch trình nào được đặt cho ngày hôm nay.</p>
                    <button
                      onClick={() => onNavigateTab('tasks')}
                      className="text-slate-800 font-bold underline cursor-pointer"
                    >
                      + Thêm lịch trình / cuộc hẹn mới →
                    </button>
                  </div>
                ) : (
                  <>
                    {todaySchedules.map((item) => {
                      const isDone = item.completedDates?.includes(todayYmd);

                      return (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            isDone ? 'bg-slate-50/50 border-slate-200/50 opacity-60' : 'bg-white/70 border-slate-200/80 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleScheduleDone(item)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center border cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 hover:border-slate-500 bg-white'
                              }`}
                            >
                              {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                            <div className="min-w-0">
                              <span className={`block text-xs font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {item.title}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ⏰ {item.startTime} - {item.endTime}
                              </span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded text-[9.5px] font-bold shrink-0 uppercase bg-slate-100 text-slate-700 border border-slate-200/60">
                            {item.category}
                          </span>
                        </div>
                      );
                    })}

                    {/* Cuộc họp hôm nay */}
                    {todayMeetings.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => onNavigateTab('meetings')}
                        className="p-2.5 rounded-xl bg-slate-100/70 hover:bg-slate-100 border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{m.title}</div>
                          <div className="text-[10.5px] text-slate-600">
                            ⏰ {m.startTime} ({m.durationMinutes} phút) • Chủ tọa: {m.chairperson}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 shrink-0 flex items-center gap-1">
                          Vào họp <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* TAB CON 2: DUYỆT ĐỀ XUẤT PHÒNG BAN (REAL ERP - DUY NHẤT TẠI ĐÂY) */}
            {todayFocusTab === 'PROPOSALS' && (
              <div className="space-y-2">
                {pendingProposals.length === 0 ? (
                  <div className="p-5 text-center rounded-xl bg-white/40 border border-dashed border-slate-200 text-xs text-slate-500">
                    Hiện tại không có đề xuất nào đang chờ phê duyệt.
                  </div>
                ) : (
                  pendingProposals.map((prop) => (
                    <div
                      key={prop.id}
                      className="p-3 rounded-xl bg-white/80 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-extrabold text-slate-900 block">{prop.title}</span>
                          <span className="text-[10.5px] text-slate-500">
                            Người đề xuất: <strong>{prop.requestedBy}</strong> • {prop.date}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[9.5px] bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          {prop.category}
                        </span>
                      </div>

                      {/* NÚT DUYỆT TRỰC TIẾP */}
                      {onDecideProposal && (
                        <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                          <button
                            onClick={() => onDecideProposal(prop.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-[10.5px] hover:bg-slate-50 cursor-pointer"
                          >
                            Từ chối
                          </button>
                          <button
                            onClick={() => onDecideProposal(prop.id, 'APPROVED')}
                            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10.5px] cursor-pointer shadow-2xs"
                          >
                            Phê duyệt ngay
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* CỘT 2 (6/12): TRỌNG TÂM THỰC THI (SMART TASKS & CẢNH BÁO LSX) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="glass-liquid p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-slate-800" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Trọng Tâm Thực Thi & Cảnh Báo
                </h4>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setExecTab('SMART')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    execTab === 'SMART'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Mục tiêu SMART ({activeSmartCount})
                </button>
                <button
                  onClick={() => setExecTab('OVERDUE_LSX')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${
                    execTab === 'OVERDUE_LSX'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Cảnh Báo LSX</span>
                  {overdueLsx.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                      {overdueLsx.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* SUB-VIEW 1: MỤC TIÊU SMART TRỌNG TÂM */}
            {execTab === 'SMART' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-2.5">Mục tiêu & Đo lường</th>
                      <th className="py-2 px-2.5">Phụ trách</th>
                      <th className="py-2 px-2.5">Hạn chót</th>
                      <th className="py-2 px-2.5 w-24">Tiến độ</th>
                      <th className="py-2 px-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {smartGoalsOnly.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                          <p>Chưa có mục tiêu SMART nào đang mở.</p>
                          <button
                            onClick={() => onNavigateTab('smart')}
                            className="text-slate-800 font-bold underline mt-1 inline-block cursor-pointer"
                          >
                            + Giao mục tiêu SMART mới →
                          </button>
                        </td>
                      </tr>
                    ) : (
                      smartGoalsOnly.slice(0, 4).map((task) => {
                        const badge = formatRelativeDueBadge(task.dueDate);

                        return (
                          <tr key={task.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-2 px-2.5">
                              <div className="font-bold text-slate-900 truncate max-w-[180px]" title={task.title}>
                                {task.title}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                                {task.smart?.measurable || 'Chưa định lượng'}
                              </div>
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap text-slate-700 font-medium">
                              {task.assigneeName}
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <span
                                className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                  badge.tone === 'overdue'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {badge.text}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[10.5px] text-slate-700">{task.progress}%</span>
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-slate-800 rounded-full"
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-2.5 text-right whitespace-nowrap">
                              {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                                <button
                                  onClick={() => onNavigateTab('smart')}
                                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                                >
                                  Mở
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

            {/* SUB-VIEW 2: CẢNH BÁO LỆNH SẢN XUẤT TRỄ HẠN (REAL ERP) */}
            {execTab === 'OVERDUE_LSX' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50/50 border-b border-rose-200 text-rose-900 font-extrabold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-2.5">Mã LSX & Khách</th>
                      <th className="py-2 px-2.5">Sản phẩm</th>
                      <th className="py-2 px-2.5">Hạn giao</th>
                      <th className="py-2 px-2.5 text-right">Chỉ đạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueLsx.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-emerald-700 font-bold">
                          🎉 Không có Lệnh sản xuất nào bị trễ hạn.
                        </td>
                      </tr>
                    ) : (
                      overdueLsx.slice(0, 4).map((order) => (
                        <tr key={order.id} className="hover:bg-rose-50/30 transition-colors group">
                          <td className="py-2 px-2.5">
                            <div className="font-mono font-bold text-rose-950 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{order.lsxCode || order.orderCode || order.id}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {order.customer || 'Khách hàng'}
                            </div>
                          </td>
                          <td className="py-2 px-2.5">
                            <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                              {order.itemName || order.productCode || (order.items && order.items[0]?.name) || 'Tem nhãn'}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500">
                              {(order.quantity || 0).toLocaleString()} {order.unit || 'con'}
                            </div>
                          </td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-100 text-rose-800">
                              ⏰ {order.deliveryDate || 'Quá hạn'}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right whitespace-nowrap">
                            {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                              <button
                                onClick={() =>
                                  onNavigateTab('smart', undefined, {
                                    title: `Thúc đẩy tiến độ giao hàng LSX ${order.lsxCode || order.id}`,
                                    assignee: order.operatorIn || 'Quản lý xưởng in',
                                    lsxCode: order.lsxCode || order.id,
                                  })
                                }
                                className="px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-bold cursor-pointer hover:bg-slate-800"
                              >
                                + Giao SMART
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Items sau họp chờ xử lý */}
            {pendingMeetingActions.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                  Nhiệm Vụ Sau Họp Cần Đôn Đốc ({pendingMeetingActions.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {pendingMeetingActions.slice(0, 2).map((act, i) => (
                    <div
                      key={i}
                      onClick={() => onNavigateTab('meetings')}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 truncate">{act.taskTitle}</div>
                        <div className="text-[10px] text-slate-500">
                          {act.assigneeName} • Hạn: {act.dueDate}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 shrink-0">Đôn đốc →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. 2 CỘT DƯỚI: TIẾN ĐỘ OKR QUÝ (6/12) + CON NGƯỜI & ĐỘNG LỰC (6/12) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CỘT TRÁI (6/12): TIẾN ĐỘ OKR QUÝ */}
        <div className="lg:col-span-6 space-y-3">
          <div className="glass-liquid p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-800" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Tiến Độ Mục Tiêu OKR Quý
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('okr')}
                className="text-[11px] font-bold text-slate-700 hover:underline cursor-pointer"
              >
                Quản lý OKR →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {okrs.length === 0 ? (
                <div className="col-span-full p-5 text-center rounded-xl bg-white/40 border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                  <p>Chưa thiết lập Mục tiêu OKR quý này.</p>
                  <button
                    onClick={() => onNavigateTab('okr')}
                    className="text-slate-800 font-bold underline cursor-pointer"
                  >
                    + Thiết lập Mục tiêu OKR mới →
                  </button>
                </div>
              ) : (
                okrs.slice(0, 4).map((okr) => {
                  const krs = okr.keyResults || [];
                  const avgProgress =
                    krs.length === 0
                      ? 0
                      : Math.round(
                          krs.reduce((acc, kr) => {
                            const span = kr.targetValue - kr.startValue || 1;
                            const current = Math.max(0, Math.min(span, kr.currentValue - kr.startValue));
                            return acc + (current / span) * 100;
                          }, 0) / krs.length
                        );

                  return (
                    <div
                      key={okr.id}
                      onClick={() => onNavigateTab('okr')}
                      className="p-3 rounded-xl bg-white/70 hover:bg-white border border-slate-200/80 space-y-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[9.5px] font-bold">
                          {okr.quarter || 'Q4/2026'} • {okr.priority}
                        </span>
                        <span className="text-xs font-black text-slate-900">{avgProgress}%</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{okr.title}</h5>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-800 rounded-full"
                          style={{ width: `${avgProgress}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Phụ trách: {okr.ownerName} ({krs.length} KR)
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (6/12): CON NGƯỜI & ĐỘNG LỰC (MASLOW & FFC) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="glass-liquid p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-slate-800" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Con Người & Động Lực (Maslow & FFC)
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('people')}
                className="text-[11px] font-bold text-slate-700 hover:underline cursor-pointer"
              >
                Mở Maslow & FFC →
              </button>
            </div>

            {/* THỐNG KÊ NHÂN SỰ ĐI LÀM */}
            <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">
                  {staffDirectory.length || radarMetrics?.totalPersonnelCount || 0} Nhân sự công ty
                </span>
                <span className="text-[10.5px] text-slate-500 block">
                  Đang làm việc: <strong className="text-emerald-700">{activeWorkersToday} người</strong> hôm nay
                </span>
              </div>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                Đi làm: {staffDirectory.length > 0 ? Math.round((activeWorkersToday / staffDirectory.length) * 100) : 100}%
              </span>
            </div>

            {/* Ghi nhận khen ngợi FFC mới nhất */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Khen Ngợi FFC Gần Nhất
              </span>
              {ffcPraises.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-white/40 border border-dashed border-slate-200 text-slate-500">
                  Chưa có lượt ghi nhận FFC nào.
                </div>
              ) : (
                ffcPraises.slice(0, 1).map((praise) => (
                  <div
                    key={praise.id}
                    onClick={() => onNavigateTab('people')}
                    className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 space-y-1 cursor-pointer hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {praise.recipientName} ({praise.department})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {praise.createdAt?.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic line-clamp-1">
                      &quot;{praise.feeling} {praise.fact}&quot;
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Nhu cầu Maslow */}
            <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Động Lực Maslow ({maslowPlans.length} nhân sự)
              </span>
              {maslowPlans.length === 0 ? (
                <div className="p-2.5 text-center rounded-xl bg-white/40 border border-dashed border-slate-200 text-xs text-slate-500">
                  Chưa có hồ sơ động lực Maslow nào.
                </div>
              ) : (
                maslowPlans.slice(0, 1).map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => onNavigateTab('people')}
                    className="p-2 rounded-xl bg-white/70 border border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-white"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{plan.employeeName}</span>
                      <span className="text-[10px] text-slate-500 block">
                        Tầng nhu cầu nổi bật: Cấp {plan.dominantNeedLevel}/5
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
