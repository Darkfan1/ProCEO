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
  AlertOctagon,
  Flame,
  Wrench,
  ShieldAlert,
  CheckCheck,
  Lightbulb,
  PlayCircle,
  Eye,
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
  CeoMission,
  CeoInitiative,
  AndonIssue,
  CeoDecisionItem,
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
  missions?: CeoMission[];
  initiatives?: CeoInitiative[];
  andonIssues?: AndonIssue[];
  decisions?: CeoDecisionItem[];
  onOpenPrepModal?: () => void;
  onOpenAndonModal?: () => void;
  onResolveDecision?: (decisionId: string, decision: 'APPROVED' | 'REJECTED', note?: string) => Promise<void> | void;
  onUpdateTask?: (task: SmartTask) => Promise<void> | void;
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
  missions = [],
  initiatives = [],
  andonIssues = [],
  decisions = [],
  onOpenPrepModal,
  onOpenAndonModal,
  onResolveDecision,
  onUpdateTask,
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

  // 7. Quyết định chờ CEO (Decision Box)
  const pendingDecisions = useMemo(() => {
    return decisions.filter((d) => d.status === 'PENDING');
  }, [decisions]);

  // 8. Tác vụ bị Blocked
  const blockedTasks = useMemo(() => {
    return smartTasks.filter((t) => t.status === 'BLOCKED');
  }, [smartTasks]);

  // 9. Cảnh báo quy tắc tự động (Rule-based Alerts)
  const ruleBasedAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      type: 'DRI_UNCONFIRMED' | 'TASK_BLOCKED' | 'ANDON_STOP' | 'TASK_OVERDUE';
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      title: string;
      description: string;
      owner: string;
      actionLabel: string;
      onAction?: () => void;
    }> = [];

    // Rule 1: Dừng dòng Andon
    andonIssues.forEach((issue) => {
      if (issue.severity === 'LINE_STOP' && issue.status !== 'CLOSED_STANDARDIZED') {
        alerts.push({
          id: `alert-andon-${issue.id}`,
          type: 'ANDON_STOP',
          severity: 'CRITICAL',
          title: `Dừng dây chuyền: ${issue.lineOrMachine}`,
          description: issue.description,
          owner: issue.driName,
          actionLabel: 'Xử lý Andon',
          onAction: () => onNavigateTab('erp-bridge'),
        });
      }
    });

    // Rule 2: Tác vụ bị Blocked
    blockedTasks.forEach((t) => {
      alerts.push({
        id: `alert-blocked-${t.id}`,
        type: 'TASK_BLOCKED',
        severity: 'CRITICAL',
        title: `Task bị chặn: ${t.title}`,
        description: t.blockerDecisionNeeded || t.blockerReason || 'Cần quyết định tháo gỡ điểm nghẽn.',
        owner: t.assigneeName,
        actionLabel: 'Gỡ nghẽn',
        onAction: () => onNavigateTab('tasks'),
      });
    });

    // Rule 3: Single DRI chưa nhận việc > 24h
    smartTasks.forEach((t) => {
      if (t.status !== 'DONE' && t.driConfirmed === false) {
        alerts.push({
          id: `alert-dri-${t.id}`,
          type: 'DRI_UNCONFIRMED',
          severity: 'WARNING',
          title: `Chưa nhận việc: ${t.title}`,
          description: `Giao cho ${t.assigneeName} nhưng chưa xác nhận cam kết (SLA 24h).`,
          owner: t.assigneeName,
          actionLabel: 'Đôn đốc DRI',
          onAction: () => onNavigateTab('tasks'),
        });
      }
    });

    // Rule 4: Tác vụ quá hạn
    smartTasks.forEach((t) => {
      if (t.status !== 'DONE' && t.dueDate < todayYmd) {
        alerts.push({
          id: `alert-overdue-${t.id}`,
          type: 'TASK_OVERDUE',
          severity: 'WARNING',
          title: `Quá hạn: ${t.title}`,
          description: `Hạn chót ngày ${t.dueDate}. Tiến độ ${t.progress || 0}%.`,
          owner: t.assigneeName,
          actionLabel: 'Đôn đốc',
          onAction: () => onNavigateTab('tasks'),
        });
      }
    });

    return alerts;
  }, [andonIssues, blockedTasks, smartTasks, todayYmd, onNavigateTab]);

  return (
    <div id="executive-dashboard-print" className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 0. THANH HÀNH ĐỘNG C-LEVEL CỐT LÕI (PREP DIRECTIVE & ANDON SỐ)     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-tighter shadow-xs">
            CEO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                Trung Tâm Điều Hành C-Level
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700">
                Chu trình 4 Tầng Khép Kín
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Chỉ thị PREP ➔ Mục tiêu OKR ➔ Dự án PDCA ➔ Tác vụ Single DRI & Andon Số
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenPrepModal && (
            <button
              type="button"
              onClick={onOpenPrepModal}
              className="px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Ban Hành Chỉ Thị (PREP)</span>
            </button>
          )}

          {onOpenAndonModal && (
            <button
              type="button"
              onClick={onOpenAndonModal}
              className="px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>🚨 Báo Sự Cố Andon</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HỘP QUYẾT ĐỊNH CẦN CEO HÔM NAY (DECISION BOX - ĐƯA VIỆC CẦN QUYẾT LÊN ĐẦU) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500 text-white font-bold">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Hộp Quyết Định Cần CEO Hôm Nay
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                  pendingDecisions.length > 0
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {pendingDecisions.length} việc cần quyết
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Nguyên tắc: CEO không lục tìm task lẻ — Hệ thống đưa trực tiếp các điểm nghẽn, đề xuất ngân sách và sự cố cần quyết lên đầu.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
            1-Click Phê Duyệt / Giải Tỏa
          </span>
        </div>

        {pendingDecisions.length === 0 ? (
          <div className="p-3.5 rounded-xl bg-white/80 border border-dashed border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Toàn bộ các luồng công việc đang thông suốt. Không có quyết định hoặc điểm nghẽn nào bị ứ đọng chờ CEO.</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              100% On-Track
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingDecisions.map((dec) => (
              <div
                key={dec.id}
                className="p-3.5 rounded-xl bg-white border border-amber-200/90 shadow-2xs hover:border-amber-400 transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      dec.type === 'BLOCKED_TASK'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : dec.type === 'ANDON_ESCALATION'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {dec.type === 'BLOCKED_TASK'
                        ? '🚫 Task Bị Blocked'
                        : dec.type === 'ANDON_ESCALATION'
                        ? '🚨 Sự Cố Dừng Dòng'
                        : '📋 Đề Xuất Phê Duyệt'}
                    </span>

                    <span className="text-[10.5px] text-slate-400 font-mono">
                      {dec.requestedAt}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 leading-snug">
                    {dec.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <strong className="text-slate-800">Lý do nghẽn:</strong> {dec.reason}
                  </p>

                  <p className="text-[11px] text-indigo-900 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                    <strong className="text-indigo-800">Cần CEO quyết:</strong> {dec.decisionNeeded}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 truncate">
                    👤 Yêu cầu: {dec.requestedBy}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        if (onResolveDecision) {
                          await onResolveDecision(dec.id, 'APPROVED', 'CEO đã phê duyệt thông qua.');
                        } else {
                          dec.status = 'APPROVED';
                          dialogService.toast('Đã phê duyệt quyết định!', 'success');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Phê Duyệt</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (onResolveDecision) {
                          await onResolveDecision(dec.id, 'REJECTED', 'CEO yêu cầu điều chỉnh lại phương án.');
                        } else {
                          dec.status = 'REJECTED';
                          dialogService.toast('Đã từ chối và yêu cầu điều chỉnh.', 'info');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer transition-colors"
                    >
                      <span>Từ Chối</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3–5 NHIỆM VỤ CHIẾN LƯỢC CẤP CEO ĐANG THEO DÕI (TIER 1 - MISSIONS)   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {missions.length > 0 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white font-bold">
                <Target className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Mục Tiêu Chiến Lược Đang Theo Dõi (Missions)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {missions.length} mục tiêu
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Gắn trực tiếp với cấu trúc PREP, kết quả đo lường KR và Single DRI chịu trách nhiệm cao nhất.
                </p>
              </div>
            </div>

            {onOpenPrepModal && (
              <button
                type="button"
                onClick={onOpenPrepModal}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                + Ban hành chỉ thị mới →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {missions.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all space-y-2.5 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                      {m.timeframe}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === 'ON_TRACK'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {m.status === 'ON_TRACK' ? 'Đúng hạn' : 'Cần chú ý'}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                    {m.title}
                  </h4>

                  {m.prep?.point && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-white p-2 rounded-lg border border-slate-100">
                      &quot;{m.prep.point}&quot;
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Tiến độ tổng thể</span>
                    <span className="font-mono font-bold text-slate-900">{m.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-slate-600 font-semibold truncate pt-0.5">
                    <span className="truncate">👤 DRI: {m.driName}</span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('okr')}
                      className="text-indigo-600 hover:underline shrink-0"
                    >
                      Xem OKR →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HỆ THỐNG CẢNH BÁO QUY TẮC TỰ ĐỘNG (RULE-BASED ALERTS WIDGET)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {ruleBasedAlerts.length > 0 && (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="font-extrabold text-xs text-rose-950 uppercase tracking-wide">
                Cảnh Báo Vận Hành Tự Động Theo Quy Tắc ({ruleBasedAlerts.length})
              </h4>
            </div>
            <span className="text-[10.5px] text-rose-700 font-medium">
              Tự động cảnh báo: DRI chưa nhận việc &gt; 24h • Nhiệm vụ bị Blocked • Sự cố dừng dòng
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ruleBasedAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="p-2.5 rounded-xl bg-white border border-rose-100 shadow-2xs space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {alert.title}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.severity === 'CRITICAL' ? 'Khẩn cấp' : 'Nhắc nhở'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                    {alert.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10.5px]">
                  <span className="text-slate-500 truncate">👤 {alert.owner}</span>
                  {alert.onAction && (
                    <button
                      type="button"
                      onClick={alert.onAction}
                      className="font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                    >
                      {alert.actionLabel} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. BẢNG SỰ CỐ VÀ KHẮC PHỤC ANDON SỐ (ISSUE & ACTION KANBAN BOARD)     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-600 text-white font-bold">
              <AlertOctagon className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Bảng Điều Phối Sự Cố & Hành Động Khắc Phục (Andon Board)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                  {andonIssues.length} sự cố
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Luồng khép kín: Báo sự cố ➔ Giao Single DRI ➔ Phân tích 5 Whys ➔ Hành động khắc phục ➔ Chuẩn hóa SOP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAndonModal && (
              <button
                type="button"
                onClick={onOpenAndonModal}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>+ Báo Sự Cố Mới</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('erp-bridge')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
            >
              Xem xưởng in Flexo →
            </button>
          </div>
        </div>

        {/* 3 Cột Kanban: Mới báo -> Đang khắc phục & 5 Whys -> Kiểm chứng & Chuẩn hóa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* CỘT 1: MỚI BÁO CÁO / PHÂN LOẠI */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>1. Mới Báo / Phân Loại</span>
              </span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-mono">
                {andonIssues.filter((i) => i.status === 'REPORTED' || i.status === 'TRIAGING').length}
              </span>
            </div>

            <div className="space-y-2">
              {andonIssues.filter((i) => i.status === 'REPORTED' || i.status === 'TRIAGING').length === 0 ? (
                <div className="p-3 text-center text-[11px] text-slate-400 italic">
                  Không có sự cố mới chờ phân loại.
                </div>
              ) : (
                andonIssues
                  .filter((i) => i.status === 'REPORTED' || i.status === 'TRIAGING')
                  .map((issue) => (
                    <div
                      key={issue.id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1.5 text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[10.5px] text-slate-800">
                          {issue.issueCode}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                          issue.severity === 'LINE_STOP'
                            ? 'bg-rose-100 text-rose-800'
                            : issue.severity === 'CRITICAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.severity === 'LINE_STOP' ? 'Dừng dòng' : issue.severity === 'CRITICAL' ? 'Nghiêm trọng' : 'Nhẹ'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 leading-snug line-clamp-2">
                        {issue.lineOrMachine}: {issue.description}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>👤 {issue.driName}</span>
                        <span>{issue.detectedAt.slice(11, 16)}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* CỘT 2: ĐANG KHẮC PHỤC & 5 WHYS */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>2. Đang Xử Lý & 5 Whys</span>
              </span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-mono">
                {andonIssues.filter((i) => i.status === 'ACTION_IN_PROGRESS' || i.status === 'RCA').length}
              </span>
            </div>

            <div className="space-y-2">
              {andonIssues.filter((i) => i.status === 'ACTION_IN_PROGRESS' || i.status === 'RCA').length === 0 ? (
                <div className="p-3 text-center text-[11px] text-slate-400 italic">
                  Không có sự cố đang xử lý.
                </div>
              ) : (
                andonIssues
                  .filter((i) => i.status === 'ACTION_IN_PROGRESS' || i.status === 'RCA')
                  .map((issue) => (
                    <div
                      key={issue.id}
                      className="p-2.5 rounded-lg bg-white border border-blue-200/80 shadow-2xs space-y-1.5 text-xs hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[10.5px] text-blue-900">
                          {issue.issueCode}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Đang khắc phục
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 leading-snug line-clamp-2">
                        {issue.lineOrMachine}
                      </div>
                      {issue.correctiveActionTitle && (
                        <div className="text-[11px] text-indigo-700 bg-indigo-50/60 p-1.5 rounded border border-indigo-100 font-medium">
                          🛠️ {issue.correctiveActionTitle}
                        </div>
                      )}
                      {issue.fiveWhys && issue.fiveWhys.length > 0 && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                          <span>🔍 Đã có {issue.fiveWhys.length} bước 5 Whys</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>DRI: {issue.driName}</span>
                        <span className="text-indigo-600 font-bold">Hạn: {issue.correctiveActionDueDate || 'Hôm nay'}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* CỘT 3: KIỂM CHỨNG & CHUẨN HÓA SOP */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>3. Kiểm Chứng & SOP</span>
              </span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-mono">
                {andonIssues.filter((i) => i.status === 'VERIFICATION' || i.status === 'CLOSED_STANDARDIZED').length}
              </span>
            </div>

            <div className="space-y-2">
              {andonIssues.filter((i) => i.status === 'VERIFICATION' || i.status === 'CLOSED_STANDARDIZED').length === 0 ? (
                <div className="p-3 text-center text-[11px] text-slate-400 italic">
                  Chưa có sự cố nào đóng gói vào SOP.
                </div>
              ) : (
                andonIssues
                  .filter((i) => i.status === 'VERIFICATION' || i.status === 'CLOSED_STANDARDIZED')
                  .map((issue) => (
                    <div
                      key={issue.id}
                      className="p-2.5 rounded-lg bg-white border border-emerald-200/80 shadow-2xs space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[10.5px] text-emerald-900">
                          {issue.issueCode}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800">
                          {issue.status === 'CLOSED_STANDARDIZED' ? 'Đã đóng SOP' : 'Đang kiểm chứng'}
                        </span>
                      </div>
                      <div className="font-medium text-slate-800 line-clamp-1">
                        {issue.lineOrMachine}
                      </div>
                      {issue.preventiveAction && (
                        <div className="text-[10.5px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-100 italic">
                          🛡️ {issue.preventiveAction}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        DRI: {issue.driName}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

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
