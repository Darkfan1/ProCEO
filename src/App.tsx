import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Calendar,
  Clock,
  Compass,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { useErpData } from './hooks/useErpData';
import { useErpAdminAuth } from './hooks/useErpAdminAuth';
import { erpService } from './services/erpService';
import {
  ceoStorageService,
  computeSmartScore,
  buildRealErpSeeds,
  mergeWithSampleSeeds,
  INITIAL_SCHEDULES,
  INITIAL_SMART_TASKS,
  INITIAL_PDCA_CYCLES,
  INITIAL_MEETINGS_369,
  INITIAL_OKRS,
  INITIAL_SWOT_BOARDS,
  INITIAL_MASLOW_PLANS,
  INITIAL_FFC_PRAISES,
  INITIAL_PREP_MESSAGES,
} from './services/ceoStorageService';
import { ceoAiService } from './services/ceoAiService';
import {
  CeoTabId,
  StageThemeId,
  ScheduleItem,
  SmartTask,
  PdcaCycle,
  Meeting369,
  MeetingActionItem,
  OkrObjective,
  SwotBoard,
  MaslowEmployeePlan,
  FfcPraiseRecord,
  PrepMessage,
  NavigationContextIntent,
  OperatingMode,
  isDriActionTask,
} from './types/ceoTypes';
import { ErpUser } from './types/erpTypes';
import { FrameworkCode } from './data/ceoMindsetData';
import { getLocalTodayYmd } from './utils/dateUtils';
import { useDailyReminderEngine, isScheduleActiveOnDate } from './hooks/useDailyReminderEngine';
import { CustomDialogHost, dialogService } from './components/common/CustomDialog';
import { ExecutiveExecutionTab } from './components/ExecutiveExecutionTab';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { ExecutiveSidebar } from './components/layout/ExecutiveSidebar';
import { ExecutiveTopbar } from './components/layout/ExecutiveTopbar';
import { ExecutiveSettingsView } from './components/settings/ExecutiveSettingsView';
import { ErpCommandBridgeTab } from './components/ErpCommandBridgeTab';
import { MindsetHandbookTab, QuickMindsetDrawer } from './components/MindsetHandbookView';
import { ErpAdminLoginGate } from './components/ErpAdminLoginGate';
import { OkrManagementView } from './components/okr/OkrManagementView';
import { SwotTowsView } from './components/swot/SwotTowsView';
import { PrepReportsView } from './components/prep/PrepReportsView';
import { PeopleManagementView } from './components/people/PeopleManagementView';
import { AiCopilotView } from './components/copilot/AiCopilotView';
import { SmartGoalsView } from './components/smart/SmartGoalsView';
import { ProjectTasksView } from './components/tasks/ProjectTasksView';

const NAV_ITEMS: Array<{
  id: CeoTabId;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 'cockpit',
    label: 'Điều Hành',
    icon: LayoutDashboard,
  },
  {
    id: 'execution',
    label: 'Thực Thi',
    icon: Target,
  },
  {
    id: 'erp-bridge',
    label: 'Dữ Liệu ERP',
    icon: Database,
  },
  {
    id: 'mindset-hub',
    label: 'Thư Viện',
    icon: BookOpen,
  },
];

export default function App() {
  const {
    adminUser,
    isAuthReady,
    authError,
    loginWithErp,
    quickDevLogin,
    logoutErp,
  } = useErpAdminAuth();

  const {
    isLoaded: erpLoaded,
    lsxOrders,
    intakes,
    machines,
    proposals,
    recentReports,
    leaveRequests,
    overtimeSchedules,
    staffDirectory,
    radarMetrics,
    globalMonthFilter,
    setGlobalMonthFilter,
  } = useErpData(Boolean(adminUser));

  // Tương thích chuẩn enterprise-app-blueprint: bọc window.alert bằng CustomDialog
  useEffect(() => {
    const origAlert = window.alert;
    window.alert = (msg: any) => {
      dialogService.alert(String(msg));
    };
    return () => {
      window.alert = origAlert;
    };
  }, []);

  // Hệ thống Stage Theme (mặc định Vista Aero Gray 2.5D)
  const [theme, setTheme] = useState<StageThemeId>(() => {
    try {
      const saved = localStorage.getItem('proceo_stage_theme') as StageThemeId;
      return saved || 'grayscale-stage';
    } catch {
      return 'grayscale-stage';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('proceo_stage_theme', theme);
    } catch {}
    const sidebarBg = getComputedStyle(document.documentElement)
      .getPropertyValue('--sidebar-bg')
      .trim();
    if (sidebarBg) {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', sidebarBg);
    }
  }, [theme]);

  // Tài khoản điều hành hiện tại bắt buộc là tài khoản Admin đã xác thực từ ERP MVĐN
  const activeUser: ErpUser | null = adminUser;

  // Điều hướng Tab & Drawer Lý thuyết
  const [activeTab, setActiveTab] = useState<CeoTabId>(() => {
    try {
      const saved = localStorage.getItem('proceo_active_tab') as CeoTabId;
      if (saved) return saved;
    } catch {}
    return 'dashboard';
  });
  const [navIntent, setNavIntent] = useState<NavigationContextIntent | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('proceo_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  const [operatingMode, setOperatingMode] = useState<OperatingMode>(() =>
    ceoStorageService.getOperatingMode()
  );
  const [aiBriefing, setAiBriefing] = useState<{ analysis: string; topThreeActions: string[] } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const [selectedTheoryCode, setSelectedTheoryCode] = useState<FrameworkCode>('SMART');
  const [theoryDrawerOpen, setTheoryDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('proceo_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('proceo_sidebar_collapsed', sidebarCollapsed ? '1' : '0');
    } catch {}
  }, [sidebarCollapsed]);

  // ─── STATE DỮ LIỆU QUẢN TRỊ CEO (ĐỒNG BỘ FIRESTORE `axis_*` + LOCAL + MẪU CHUẨN) ──
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() =>
    ceoStorageService.getLocalMerged('axis_ceo_schedules', INITIAL_SCHEDULES)
  );
  const [smartTasks, setSmartTasks] = useState<SmartTask[]>(() =>
    ceoStorageService.getLocalMerged('axis_ceo_tasks', INITIAL_SMART_TASKS)
  );
  const [pdcaCycles, setPdcaCycles] = useState<PdcaCycle[]>(() =>
    ceoStorageService.getLocalMerged('axis_ceo_pdca', INITIAL_PDCA_CYCLES)
  );
  const [meetings, setMeetings] = useState<Meeting369[]>(() =>
    ceoStorageService.getLocalMerged('axis_ceo_meetings', INITIAL_MEETINGS_369)
  );
  const [okrs, setOkrs] = useState<OkrObjective[]>(() =>
    ceoStorageService.getLocalMerged('axis_ceo_okrs', INITIAL_OKRS)
  );
  const [swotBoards, setSwotBoards] = useState<SwotBoard[]>(() =>
    ceoStorageService.getLocalMerged('axis_ceo_swot', INITIAL_SWOT_BOARDS)
  );
  const [maslowPlans, setMaslowPlans] = useState<MaslowEmployeePlan[]>(() =>
    ceoStorageService.getLocalMerged('axis_ceo_coaching', INITIAL_MASLOW_PLANS)
  );
  const [ffcPraises, setFfcPraises] = useState<FfcPraiseRecord[]>(() =>
    ceoStorageService.getLocalMerged('axis_ceo_praises', INITIAL_FFC_PRAISES)
  );
  const [prepMessages, setPrepMessages] = useState<PrepMessage[]>(() =>
    ceoStorageService.getLocalMerged('axis_ceo_prep_docs', INITIAL_PREP_MESSAGES)
  );

  useEffect(() => {
    if (!adminUser) return;
    const unsubs = [
      ceoStorageService.subscribeCollection('axis_ceo_schedules', INITIAL_SCHEDULES, setSchedules),
      ceoStorageService.subscribeCollection('axis_ceo_tasks', INITIAL_SMART_TASKS, setSmartTasks),
      ceoStorageService.subscribeCollection('axis_ceo_pdca', INITIAL_PDCA_CYCLES, setPdcaCycles),
      ceoStorageService.subscribeCollection('axis_ceo_meetings', INITIAL_MEETINGS_369, setMeetings),
      ceoStorageService.subscribeCollection('axis_ceo_okrs', INITIAL_OKRS, setOkrs),
      ceoStorageService.subscribeCollection('axis_ceo_swot', INITIAL_SWOT_BOARDS, setSwotBoards),
      ceoStorageService.subscribeCollection('axis_ceo_coaching', INITIAL_MASLOW_PLANS, setMaslowPlans),
      ceoStorageService.subscribeCollection('axis_ceo_praises', INITIAL_FFC_PRAISES, setFfcPraises),
      ceoStorageService.subscribeCollection('axis_ceo_prep_docs', INITIAL_PREP_MESSAGES, setPrepMessages),
    ];
    return () => unsubs.forEach((u) => u());
  }, [adminUser]);

  // ─── TỰ ĐỘNG LÀM GIÀU DỮ LIỆU MẪU THEO DỮ LIỆU THỰC TẾ ERP MVĐN ───────────
  useEffect(() => {
    if (!erpLoaded || lsxOrders.length === 0) return;
    const realSeeds = buildRealErpSeeds({
      lsxOrders,
      staffDirectory,
      machines,
      intakes,
      radarMetrics,
    });

    ceoStorageService.updateDynamicSeeds(realSeeds);

    setSchedules((prev) => mergeWithSampleSeeds('axis_ceo_schedules', prev, realSeeds.schedules));
    setSmartTasks((prev) => mergeWithSampleSeeds('axis_ceo_tasks', prev, realSeeds.smartTasks));
    setPdcaCycles((prev) => mergeWithSampleSeeds('axis_ceo_pdca', prev, realSeeds.pdcaCycles));
    setMeetings((prev) => mergeWithSampleSeeds('axis_ceo_meetings', prev, realSeeds.meetings));
    setOkrs((prev) => mergeWithSampleSeeds('axis_ceo_okrs', prev, realSeeds.okrs));
    setSwotBoards((prev) => mergeWithSampleSeeds('axis_ceo_swot', prev, realSeeds.swotBoards));
    setMaslowPlans((prev) => mergeWithSampleSeeds('axis_ceo_coaching', prev, realSeeds.maslowPlans));
    setFfcPraises((prev) => mergeWithSampleSeeds('axis_ceo_praises', prev, realSeeds.ffcPraises));
    setPrepMessages((prev) => mergeWithSampleSeeds('axis_ceo_prep_docs', prev, realSeeds.prepMessages));
  }, [erpLoaded, lsxOrders, staffDirectory, machines, intakes, radarMetrics]);

  // Engine nhắc lịch & nhắc việc chạy nền (chỉ kích hoạt khi đã đăng nhập Admin)
  const reminderEngine = useDailyReminderEngine(schedules, smartTasks, Boolean(adminUser));

  const handleNavigateTab = useCallback(
    (
      tab: CeoTabId,
      subView?: string,
      prefill?: {
        title?: string;
        assignee?: string;
        lsxCode?: string;
        description?: string;
        okrId?: string;
        audience?: string;
        smartTask?: SmartTask;
        pdcaCycle?: PdcaCycle;
      }
    ) => {
      setActiveTab(tab);
      setMobileMenuOpen(false);
      if (subView || prefill) {
        setNavIntent({
          tab,
          subView,
          prefillTitle: prefill?.title,
          prefillAssignee: prefill?.assignee,
          prefillLsxCode: prefill?.lsxCode,
          prefillDescription: prefill?.description,
          prefillOkrId: prefill?.okrId,
          prefillAudience: prefill?.audience,
          prefillSmartTask: prefill?.smartTask,
          prefillPdcaCycle: prefill?.pdcaCycle,
          timestamp: Date.now(),
        });
      }
    },
    []
  );

  const handleOpenTheoryDrawer = useCallback((code: FrameworkCode) => {
    setSelectedTheoryCode(code);
    setTheoryDrawerOpen(true);
  }, []);

  const handleRunAiBriefing = async () => {
    setLoadingAi(true);
    try {
      const todayYmd = getLocalTodayYmd();
      const overdue = smartTasks.filter((t) => t.status !== 'DONE' && t.dueDate < todayYmd).length;
      const activeTasks = smartTasks.filter((t) => t.status !== 'DONE').length;
      const activePdca = pdcaCycles.filter((p) => p.phase !== 'STANDARDIZED').length;
      const upcoming = meetings.find((m) => m.date >= todayYmd && m.status !== 'CLOSED');

      const briefing = await ceoAiService.generateExecutiveBriefing({
        inProgressLsx: radarMetrics.inProgressLsxCount,
        overdueLsx: radarMetrics.overdueLsx.length,
        pendingProposals: radarMetrics.pendingProposals.length,
        todayOutput: radarMetrics.todayNewIntakesCount,
        openSmartTasks: activeTasks,
        activePdca: activePdca,
      });
      setAiBriefing(briefing);
      dialogService.toast('AI Gemini đã phân tích và cập nhật bản tin điều hành!', 'success');
    } catch {
      dialogService.toast('Không thể tải AI Briefing, vui lòng kiểm tra kết nối mạng.', 'warning');
    } finally {
      setLoadingAi(false);
    }
  };

  // ─── CÁC HÀM THAO TÁC DỮ LIỆU LỊCH & CÔNG VIỆC ─────────────────────────────
  const handleToggleScheduleDone = async (item: ScheduleItem) => {
    const todayYmd = getLocalTodayYmd();
    const exists = item.completedDates?.includes(todayYmd);
    const nextDates = exists
      ? (item.completedDates || []).filter((d) => d !== todayYmd)
      : [...(item.completedDates || []), todayYmd];

    await ceoStorageService.upsertItem(
      'axis_ceo_schedules',
      { ...item, completedDates: nextDates },
      schedules,
      setSchedules
    );
  };

  const handleQuickAddSchedule = async (title: string, startTime: string) => {
    const todayYmd = getLocalTodayYmd();
    const [h, m] = startTime.split(':').map(Number);
    const endH = String(Math.min(23, (h || 8) + 1)).padStart(2, '0');
    const endTime = `${endH}:${String(m || 0).padStart(2, '0')}`;
    const newItem: ScheduleItem = {
      id: `sched-${Date.now()}`,
      title,
      startTime,
      endTime,
      date: todayYmd,
      repeat: 'DAILY',
      category: 'DEEP_WORK',
      priority: 'HIGH',
      remindMinutesBefore: 10,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    await ceoStorageService.upsertItem('axis_ceo_schedules', newItem, schedules, setSchedules);
    dialogService.toast(`Đã thêm lịch nhắc "${title}" lúc ${startTime}!`, 'success');
  };

  const handleQuickAddSmartTask = async (title: string, assignee: string) => {
    const todayYmd = getLocalTodayYmd();
    const smart = {
      specific: `${assignee} chịu trách nhiệm thực hiện: ${title}`,
      measurable: 'Hoàn thành 100% khối lượng đúng tiêu chuẩn chất lượng',
      achievable: 'Nguồn lực bộ phận chuyên môn tại MVĐN',
      relevant: 'Đảm bảo tiến độ điều hành & giao hàng đúng hẹn',
      timeBound: `Hoàn tất trước 17:00 ngày ${todayYmd}`,
    };
    const task: SmartTask = {
      id: `smart-${Date.now()}`,
      title,
      department: 'Sản xuất',
      assigneeName: assignee,
      dueDate: todayYmd,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 0,
      smart,
      smartScore: computeSmartScore(smart),
      followUpCount: 0,
      createdAt: new Date().toISOString(),
    };
    await ceoStorageService.upsertItem('axis_ceo_tasks', task, smartTasks, setSmartTasks);
    dialogService.toast(`Đã giao việc SMART cho ${assignee}!`, 'success');
  };

  const handleSaveSmartTask = async (task: SmartTask, pushToErp = false) => {
    await ceoStorageService.upsertItem('axis_ceo_tasks', task, smartTasks, setSmartTasks);
    if (pushToErp) {
      try {
        await erpService.pushNotification({
          title: `🎯 Nhiệm vụ SMART: ${task.title}`,
          content: `Người phụ trách: ${task.assigneeName} (${task.department}) • Chỉ số đạt (M): ${task.smart.measurable} • Hạn: ${task.dueDate}`,
          senderName: activeUser?.name || 'Ban Giám Đốc',
          actionType: 'CEO_SMART_TASK',
        });
        await erpService.publishAnnouncement({
          title: `⚡ [CHỈ ĐẠO CEO] Mục tiêu SMART: ${task.title}`,
          content: `Ban Giám Đốc ban hành mục tiêu SMART giao cho ${task.assigneeName} (${task.department}):\n• Cụ thể (S): ${task.smart.specific}\n• Đo lường (M): ${task.smart.measurable}\n• Khả thi (A): ${task.smart.achievable}\n• Liên quan (R): ${task.smart.relevant}\n• Thời hạn (T): ${task.smart.timeBound}\nTiến độ hiện tại: ${task.progress}%`,
          category: 'DIRECTIVE',
          targetType: 'ALL',
          targetValue: 'ALL',
          requireAck: true,
          publisherName: activeUser?.name || 'Ban Giám Đốc',
        });
      } catch (err) {
        console.warn('Push to ERP warning:', err);
      }
    }
    dialogService.toast(
      pushToErp ? `Đã chuyển mục tiêu "${task.title}" sang ERP MVĐN!` : 'Đã lưu mục tiêu & công việc SMART!',
      'success'
    );
  };

  const handleFollowUpSmartTask = async (task: SmartTask) => {
    const updated: SmartTask = {
      ...task,
      followUpCount: (task.followUpCount || 0) + 1,
      lastFollowUpAt: new Date().toISOString(),
    };
    await ceoStorageService.upsertItem('axis_ceo_tasks', updated, smartTasks, setSmartTasks);
    try {
      await erpService.pushNotification({
        title: `⏰ Đôn đốc nhiệm vụ SMART (Lần ${updated.followUpCount}): ${task.title}`,
        content: `CEO nhắc tiến độ tới ${task.assigneeName}: "${task.smart.measurable}" (Hạn hoàn thành: ${task.dueDate}).`,
        senderName: activeUser?.name || 'Ban Giám Đốc',
        actionType: 'CEO_FOLLOW_UP',
      });
    } catch {}
    dialogService.toast(
      `Đã gửi thông báo đôn đốc lần ${updated.followUpCount} tới ${task.assigneeName}!`,
      'info'
    );
  };

  const handleSuperviseMeetingAction = async (
    meeting: Meeting369,
    item: MeetingActionItem
  ) => {
    const nextCount = (item.supervisedCount || 0) + 1;
    const nextActions = meeting.actionItems.map((a) =>
      a.id === item.id
        ? { ...a, supervisedCount: nextCount, lastSupervisedAt: new Date().toISOString() }
        : a
    );
    await ceoStorageService.upsertItem(
      'axis_ceo_meetings',
      { ...meeting, actionItems: nextActions },
      meetings,
      setMeetings
    );
    try {
      await erpService.pushNotification({
        title: `📋 Đôn đốc sau Họp 3-6-9: ${item.taskTitle}`,
        content: `Theo sát tiến độ + Đôn đốc người chịu trách nhiệm (${item.assigneeName}) • Hạn: ${item.dueDate}.`,
        senderName: activeUser?.name || 'Ban Giám Đốc',
        actionType: 'CEO_MEETING_369_FOLLOWUP',
      });
    } catch {}
    dialogService.toast(
      `Đã đôn đốc "${item.assigneeName}" thực hiện nhiệm vụ cuộc họp (Lần ${nextCount})!`,
      'success'
    );
  };

  const handleSendMeetingSummon = async (meeting: Meeting369) => {
    const nowIso = new Date().toISOString();
    const updated: Meeting369 = {
      ...meeting,
      summonSentAt: nowIso,
    };
    await ceoStorageService.upsertItem('axis_ceo_meetings', updated, meetings, setMeetings);
    const participantsStr = (meeting.participants || []).join(', ') || 'Các bộ phận liên quan';
    const locationStr = meeting.location || 'Phòng họp Công ty MVĐN';
    try {
      await erpService.pushNotification({
        title: `📢 Triệu tập họp: ${meeting.title} (${meeting.startTime} ngày ${meeting.date})`,
        content: `Địa điểm: ${locationStr} • Thành phần: ${participantsStr} • Yêu cầu chuẩn bị trước: ${meeting.preReadDocs}`,
        senderName: activeUser?.name || 'Ban Giám Đốc',
        actionType: 'CEO_MEETING_SUMMON',
      });
      await erpService.publishAnnouncement({
        title: `📢 [LỆNH TRIỆU TẬP HỌP] ${meeting.title} (${meeting.startTime} ngày ${meeting.date})`,
        content: `Ban Giám Đốc triệu tập cuộc họp trực tiếp:\n• Thời gian: ${meeting.startTime} ngày ${meeting.date} (${meeting.durationMinutes} phút)\n• Địa điểm: ${locationStr}\n• Thành phần bắt buộc: ${participantsStr}\n• Chủ đề: ${meeting.topic}\n• Mục tiêu cần chốt: ${meeting.objective}\n• YÊU CẦU CHUẨN BỊ TÀI LIỆU / SỐ LIỆU TRƯỚC GIỜ HỌP:\n${meeting.preReadDocs}`,
        category: 'DIRECTIVE',
        targetType: 'ALL',
        targetValue: 'ALL',
        requireAck: true,
        publisherName: activeUser?.name || 'Ban Giám Đốc',
      });
    } catch (err) {
      console.warn('Send meeting summon warning:', err);
    }
    dialogService.toast(
      `Đã gửi Lệnh triệu tập họp & Yêu cầu chuẩn bị tài liệu sang Tab Thông báo ERP!`,
      'success'
    );
  };

  const handlePublishMeetingMinutes = async (meeting: Meeting369) => {
    const nowIso = new Date().toISOString();
    const updated: Meeting369 = {
      ...meeting,
      minutesPublishedAt: nowIso,
      status: 'FOLLOW_UP',
    };
    await ceoStorageService.upsertItem('axis_ceo_meetings', updated, meetings, setMeetings);

    // Đồng bộ kết luận cuộc họp về chu trình PDCA liên kết
    if (meeting.linkedPdcaId) {
      const matchedPdca = pdcaCycles.find((p) => p.id === meeting.linkedPdcaId);
      if (matchedPdca) {
        const nextPhase = matchedPdca.phase === 'PLAN' ? 'DO' : matchedPdca.phase === 'DO' ? 'CHECK' : matchedPdca.phase;
        const updatedPdca: PdcaCycle = {
          ...matchedPdca,
          phase: nextPhase,
          checkEvaluation: matchedPdca.checkEvaluation
            ? `${matchedPdca.checkEvaluation}\n[Họp 3-6-9 ${meeting.date}]: ${meeting.decisionsSummary || 'Đã giám sát, tháo gỡ điểm nghẽn & chốt hành động.'}`
            : `[Họp 3-6-9 ${meeting.date}]: ${meeting.decisionsSummary || 'Đã giám sát, tháo gỡ điểm nghẽn & chốt hành động.'}`,
        };
        await ceoStorageService.upsertItem('axis_ceo_pdca', updatedPdca, pdcaCycles, setPdcaCycles);
      }
    }

    const actionsSummary =
      (meeting.actionItems || []).length > 0
        ? meeting.actionItems
            .map(
              (a, i) =>
                `${i + 1}. ${a.taskTitle} — Phụ trách: ${a.assigneeName} (Hạn: ${a.dueDate}) [${
                  a.status === 'COMPLETED' ? 'Đã xong' : 'Đang thực hiện'
                }]`
            )
            .join('\n')
        : 'Chưa có đầu việc phân công.';
    try {
      await erpService.pushNotification({
        title: `📋 Biên bản & Giao việc sau họp: ${meeting.title}`,
        content: `Kết luận: ${meeting.decisionsSummary || meeting.objective} • Số đầu việc phân công: ${(meeting.actionItems || []).length} việc.`,
        senderName: activeUser?.name || 'Ban Giám Đốc',
        actionType: 'CEO_MEETING_MINUTES',
      });
      await erpService.publishAnnouncement({
        title: `📋 [BIÊN BẢN & NGHỊ QUYẾT HỌP] ${meeting.title} (${meeting.date})`,
        content: `Ban Giám Đốc ban hành Biên bản kết luận cuộc họp trực tiếp ngày ${meeting.date}:\n\n1. QUYẾT ĐỊNH CHỐT TẠI CUỘC HỌP:\n${
          meeting.decisionsSummary || meeting.objective
        }\n\n2. BẢNG PHÂN CÔNG NHIỆM VỤ & HẠN HOÀN THÀNH:\n${actionsSummary}`,
        category: 'DIRECTIVE',
        targetType: 'ALL',
        targetValue: 'ALL',
        requireAck: true,
        publisherName: activeUser?.name || 'Ban Giám Đốc',
      });
    } catch (err) {
      console.warn('Publish meeting minutes warning:', err);
    }
    dialogService.toast(
      `Đã ban hành Biên bản kết luận & Phân công sau họp sang Tab Thông báo ERP!`,
      'success'
    );
  };

  const handleDecideProposal = async (
    proposalId: string,
    decision: 'APPROVED' | 'REJECTED',
    comment?: string
  ) => {
    if (!activeUser) return;
    try {
      await erpService.decideProposal(
        proposalId,
        decision,
        { id: activeUser.id, name: activeUser.name },
        comment
      );
      dialogService.toast(
        decision === 'APPROVED' ? 'Đã phê duyệt đề xuất trên hệ thống ERP!' : 'Đã từ chối đề xuất.',
        'success'
      );
    } catch {
      dialogService.toast('Lỗi cập nhật đề xuất, vui lòng kiểm tra kết nối mạng.', 'warning');
    }
  };

  // Đồng bộ tự động Họp 3-6-9 và Huấn luyện Maslow lên Lịch trình điều hành của CEO
  const handleSaveMeetingWithScheduleSync = async (m: Meeting369) => {
    await ceoStorageService.upsertItem('axis_ceo_meetings', m, meetings, setMeetings);
    const schedId = `sched-mtg-${m.id}`;
    const existingSched = schedules.find((s) => s.id === schedId);
    const [rawH, rawM] = (m.startTime || '08:30').split(':').map(Number);
    const totalMinutes = (rawH || 8) * 60 + (rawM || 30) + (m.durationMinutes || 30);
    const endH = String(Math.min(23, Math.floor(totalMinutes / 60))).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');

    const syncedSchedule: ScheduleItem = {
      id: schedId,
      title: m.title,
      startTime: m.startTime || '08:30',
      endTime: `${endH}:${endM}`,
      date: m.date,
      repeat: 'ONCE',
      category: 'MEETING_369',
      priority: 'HIGH',
      remindMinutesBefore: 10,
      linkedPerson: (m.participants || []).slice(0, 2).join(', ') || m.chairperson,
      notes: m.objective || m.topic,
      completedDates:
        m.status === 'CLOSED'
          ? Array.from(new Set([...(existingSched?.completedDates || []), m.date]))
          : existingSched?.completedDates || [],
      createdAt: existingSched?.createdAt || new Date().toISOString(),
    };
    await ceoStorageService.upsertItem(
      'axis_ceo_schedules',
      syncedSchedule,
      schedules,
      setSchedules
    );
  };

  const handleDeleteMeetingWithScheduleSync = async (id: string) => {
    await ceoStorageService.removeItem('axis_ceo_meetings', id, meetings, setMeetings);
    const schedId = `sched-mtg-${id}`;
    if (schedules.some((s) => s.id === schedId)) {
      await ceoStorageService.removeItem('axis_ceo_schedules', schedId, schedules, setSchedules);
    }
  };

  const handleSaveMaslowWithScheduleSync = async (plan: MaslowEmployeePlan) => {
    await ceoStorageService.upsertItem('axis_ceo_coaching', plan, maslowPlans, setMaslowPlans);
    if (plan.nextCheckInDate) {
      const schedId = `sched-maslow-${plan.id}`;
      const existingSched = schedules.find((s) => s.id === schedId);
      const syncedSchedule: ScheduleItem = {
        id: schedId,
        title: `Gặp 1-1 & Tạo động lực Maslow: ${plan.employeeName}`,
        startTime: existingSched?.startTime || '15:00',
        endTime: existingSched?.endTime || '15:30',
        date: plan.nextCheckInDate,
        repeat: 'ONCE',
        category: 'COACHING_MASLOW',
        priority: 'MEDIUM',
        remindMinutesBefore: 15,
        linkedPerson: `${plan.employeeName} (${plan.role})`,
        notes: plan.motivationAction?.slice(0, 180) || plan.currentObservation?.slice(0, 180),
        completedDates: existingSched?.completedDates || [],
        createdAt: existingSched?.createdAt || new Date().toISOString(),
      };
      await ceoStorageService.upsertItem(
        'axis_ceo_schedules',
        syncedSchedule,
        schedules,
        setSchedules
      );
    }
  };

  const handleDeleteMaslowWithScheduleSync = async (id: string) => {
    await ceoStorageService.removeItem('axis_ceo_coaching', id, maslowPlans, setMaslowPlans);
    const schedId = `sched-maslow-${id}`;
    if (schedules.some((s) => s.id === schedId)) {
      await ceoStorageService.removeItem('axis_ceo_schedules', schedId, schedules, setSchedules);
    }
  };

  // Số hiệu badge trên menu
  const todayYmd = getLocalTodayYmd();
  const pendingTodaySchedules = schedules.filter(
    (s) => isScheduleActiveOnDate(s, todayYmd) && !s.completedDates?.includes(todayYmd)
  ).length;
  const openTasksCount = smartTasks.filter((t) => t.status !== 'DONE').length;

  // Màn hình chờ kiểm tra phiên đăng nhập Admin ERP MVĐN
  if (!isAuthReady && !adminUser) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--stage-bg)] text-slate-800 font-sans">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Đang xác thực quyền Quản trị viên ERP MVĐN...
        </p>
      </div>
    );
  }

  // Bắt buộc đăng nhập bằng tài khoản ERP MVĐN có quyền ADMIN
  if (!adminUser) {
    return (
      <>
        <CustomDialogHost />
        <ErpAdminLoginGate
          onLogin={loginWithErp}
          onQuickDevLogin={quickDevLogin}
          error={authError}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-[var(--stage-bg)] text-slate-900 font-sans">
      <CustomDialogHost />

      {/* Ngăn trượt tra cứu nhanh 8 Tư duy Quản trị */}
      <QuickMindsetDrawer
        isOpen={theoryDrawerOpen}
        code={selectedTheoryCode}
        onSelectCode={setSelectedTheoryCode}
        onClose={() => setTheoryDrawerOpen(false)}
        onOpenFullHandbook={(code) => {
          setSelectedTheoryCode(code);
          setTheoryDrawerOpen(false);
          setActiveTab('mindset-hub');
        }}
      />

      {/* 1. SIDEBAR EXECUTIVE MINIMALISM */}
      <div className="hidden lg:flex shrink-0">
        <ExecutiveSidebar
          activeTab={activeTab}
          onSelectTab={handleNavigateTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          operatingMode={operatingMode}
          onToggleMode={() => {
            const next = operatingMode === 'PERSONAL' ? 'ORGANIZATION' : 'PERSONAL';
            setOperatingMode(next);
            ceoStorageService.setOperatingMode(next);
            dialogService.toast(
              `Đã chuyển sang ${next === 'PERSONAL' ? 'Chế độ Cá nhân' : 'Chế độ Doanh nghiệp'}!`,
              'info'
            );
          }}
          activeSmartCount={smartTasks.filter((t) => !isDriActionTask(t) && t.status !== 'DONE').length}
          activeDriCount={smartTasks.filter((t) => isDriActionTask(t) && t.status !== 'DONE').length}
          activePdcaCount={pdcaCycles.filter((p) => p.phase !== 'STANDARDIZED').length}
          activeMeetingsCount={
            meetings.filter((m) => m.date === getLocalTodayYmd() && m.status !== 'CLOSED').length
          }
          atRiskOkrCount={
            okrs.filter((o) =>
              (o.keyResults || []).some(
                (kr) =>
                  (kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue || 1) < 0.4
              )
            ).length
          }
          inProgressLsxCount={radarMetrics.inProgressLsxCount}
          pendingProposalsCount={radarMetrics.pendingProposals.length}
          overdueLsxCount={radarMetrics.overdueLsx.length}
        />
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-[272px] h-full shadow-2xl">
            <ExecutiveSidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                handleNavigateTab(tab);
                setMobileMenuOpen(false);
              }}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              operatingMode={operatingMode}
              activeSmartCount={smartTasks.filter((t) => !isDriActionTask(t) && t.status !== 'DONE').length}
              activeDriCount={smartTasks.filter((t) => isDriActionTask(t) && t.status !== 'DONE').length}
              activePdcaCount={pdcaCycles.filter((p) => p.phase !== 'STANDARDIZED').length}
              activeMeetingsCount={
                meetings.filter((m) => m.date === getLocalTodayYmd() && m.status !== 'CLOSED').length
              }
              atRiskOkrCount={
                okrs.filter((o) =>
                  (o.keyResults || []).some(
                    (kr) =>
                      (kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue || 1) < 0.4
                  )
                ).length
              }
              inProgressLsxCount={radarMetrics.inProgressLsxCount}
              pendingProposalsCount={radarMetrics.pendingProposals.length}
              overdueLsxCount={radarMetrics.overdueLsx.length}
            />
          </div>
        </div>
      )}

      {/* KHU VỰC NỘI DUNG CHÍNH EXECUTIVE (LUXURY GRAY-WHITE LIQUID CANVAS) */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden bg-gradient-to-br from-slate-100/90 via-slate-50 to-slate-100/80">
        {/* TOPBAR */}
        <ExecutiveTopbar
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          operatingMode={operatingMode}
          userName={activeUser?.name || 'Tôn Đông Vũ • CEO'}
        />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto w-full px-3.5 sm:px-6 py-4">
          {(activeTab === 'dashboard' || activeTab === 'cockpit') && (
            <ExecutiveDashboard
              schedules={schedules}
              smartTasks={smartTasks}
              pdcaCycles={pdcaCycles}
              meetings={meetings}
              okrs={okrs}
              swotBoards={swotBoards}
              maslowPlans={maslowPlans}
              ffcPraises={ffcPraises}
              prepMessages={prepMessages}
              onNavigateTab={handleNavigateTab}
              onToggleScheduleDone={handleToggleScheduleDone}
              aiBriefing={aiBriefing}
              onRunAiBriefing={handleRunAiBriefing}
              loadingAi={loadingAi}
              radarMetrics={radarMetrics}
              lsxOrders={lsxOrders}
              intakes={intakes}
              proposals={proposals}
              recentReports={recentReports}
              machines={machines}
              staffDirectory={staffDirectory}
              erpLoaded={erpLoaded}
              onDecideProposal={handleDecideProposal}
            />
          )}

          {activeTab === 'smart' && (
            <SmartGoalsView
              smartTasks={smartTasks}
              onSaveSmartTask={handleSaveSmartTask}
              onDeleteSmartTask={(id) =>
                ceoStorageService.removeItem('axis_ceo_tasks', id, smartTasks, setSmartTasks)
              }
              onFollowUpSmartTask={handleFollowUpSmartTask}
              onUpdateSmartTaskStatus={(task, nextStatus) =>
                ceoStorageService.upsertItem(
                  'axis_ceo_tasks',
                  {
                    ...task,
                    status: nextStatus,
                    progress: nextStatus === 'DONE' ? 100 : task.progress,
                  },
                  smartTasks,
                  setSmartTasks
                )
              }
              okrs={okrs}
              staffDirectory={staffDirectory}
              lsxOrders={lsxOrders}
              navIntent={navIntent}
              onClearIntent={() => setNavIntent(null)}
              onOpenTheoryDrawer={handleOpenTheoryDrawer}
              onNavigateTab={handleNavigateTab}
              activeUserName={activeUser?.name}
            />
          )}

          {(activeTab === 'pdca' || activeTab === 'execution') && (
            <ExecutiveExecutionTab
              initialStage={activeTab === 'pdca' ? 'PDCA' : undefined}
              viewScope={activeTab === 'pdca' ? 'PDCA_SOP' : 'ALL'}
              smartTasks={smartTasks}
              onSaveSmartTask={handleSaveSmartTask}
              onDeleteSmartTask={(id) =>
                ceoStorageService.removeItem('axis_ceo_tasks', id, smartTasks, setSmartTasks)
              }
              onFollowUpSmartTask={handleFollowUpSmartTask}
              onUpdateSmartTaskStatus={(task, nextStatus) =>
                ceoStorageService.upsertItem(
                  'axis_ceo_tasks',
                  {
                    ...task,
                    status: nextStatus,
                    progress: nextStatus === 'DONE' ? 100 : task.progress,
                  },
                  smartTasks,
                  setSmartTasks
                )
              }
              pdcaCycles={pdcaCycles}
              onSavePdcaCycle={(cycle) =>
                ceoStorageService.upsertItem('axis_ceo_pdca', cycle, pdcaCycles, setPdcaCycles)
              }
              onDeletePdcaCycle={(id) =>
                ceoStorageService.removeItem('axis_ceo_pdca', id, pdcaCycles, setPdcaCycles)
              }
              meetings={meetings}
              onSaveMeeting={handleSaveMeetingWithScheduleSync}
              onDeleteMeeting={handleDeleteMeetingWithScheduleSync}
              onSendMeetingSummon={handleSendMeetingSummon}
              onPublishMeetingMinutes={handlePublishMeetingMinutes}
              onSuperviseActionItem={handleSuperviseMeetingAction}
              staffDirectory={staffDirectory}
              lsxOrders={lsxOrders}
              navIntent={navIntent}
              onClearIntent={() => setNavIntent(null)}
              onOpenTheoryDrawer={handleOpenTheoryDrawer}
              onNavigateTab={handleNavigateTab}
              activeUser={activeUser}
            />
          )}

          {activeTab === 'meetings' && (
            <ExecutiveExecutionTab
              initialStage="MEETINGS"
              viewScope="MEETINGS"
              smartTasks={smartTasks}
              onSaveSmartTask={handleSaveSmartTask}
              onDeleteSmartTask={(id) =>
                ceoStorageService.removeItem('axis_ceo_tasks', id, smartTasks, setSmartTasks)
              }
              onFollowUpSmartTask={handleFollowUpSmartTask}
              onUpdateSmartTaskStatus={(task, nextStatus) =>
                ceoStorageService.upsertItem(
                  'axis_ceo_tasks',
                  {
                    ...task,
                    status: nextStatus,
                    progress: nextStatus === 'DONE' ? 100 : task.progress,
                  },
                  smartTasks,
                  setSmartTasks
                )
              }
              pdcaCycles={pdcaCycles}
              onSavePdcaCycle={(cycle) =>
                ceoStorageService.upsertItem('axis_ceo_pdca', cycle, pdcaCycles, setPdcaCycles)
              }
              onDeletePdcaCycle={(id) =>
                ceoStorageService.removeItem('axis_ceo_pdca', id, pdcaCycles, setPdcaCycles)
              }
              meetings={meetings}
              onSaveMeeting={handleSaveMeetingWithScheduleSync}
              onDeleteMeeting={handleDeleteMeetingWithScheduleSync}
              onSendMeetingSummon={handleSendMeetingSummon}
              onPublishMeetingMinutes={handlePublishMeetingMinutes}
              onSuperviseActionItem={handleSuperviseMeetingAction}
              staffDirectory={staffDirectory}
              lsxOrders={lsxOrders}
              navIntent={navIntent}
              onClearIntent={() => setNavIntent(null)}
              onOpenTheoryDrawer={handleOpenTheoryDrawer}
              onNavigateTab={handleNavigateTab}
              activeUser={activeUser}
            />
          )}

          {activeTab === 'tasks' && (
            <ProjectTasksView
              tasks={smartTasks}
              onSaveTask={handleSaveSmartTask}
              onDeleteTask={(id) =>
                ceoStorageService.removeItem('axis_ceo_tasks', id, smartTasks, setSmartTasks)
              }
              onFollowUpTask={handleFollowUpSmartTask}
              onUpdateTaskStatus={(task, nextStatus) =>
                ceoStorageService.upsertItem(
                  'axis_ceo_tasks',
                  {
                    ...task,
                    status: nextStatus,
                    progress: nextStatus === 'DONE' ? 100 : task.progress,
                  },
                  smartTasks,
                  setSmartTasks
                )
              }
              schedules={schedules}
              onSaveSchedule={async (item) => {
                await ceoStorageService.upsertItem(
                  'axis_ceo_schedules',
                  item,
                  schedules,
                  setSchedules
                );
              }}
              onDeleteSchedule={async (id) => {
                await ceoStorageService.removeItem(
                  'axis_ceo_schedules',
                  id,
                  schedules,
                  setSchedules
                );
              }}
              onToggleScheduleDone={handleToggleScheduleDone}
              staffDirectory={staffDirectory}
              lsxOrders={lsxOrders}
              meetings={meetings}
              navIntent={navIntent}
              onClearIntent={() => setNavIntent(null)}
              onNavigateTab={handleNavigateTab}
              activeUserName={activeUser?.name}
            />
          )}

          {activeTab === 'settings' && (
            <ExecutiveSettingsView
              operatingMode={operatingMode}
              onToggleMode={(mode) => {
                setOperatingMode(mode);
                ceoStorageService.setOperatingMode(mode);
                dialogService.toast(
                  `Đã chuyển sang ${mode === 'PERSONAL' ? 'Chế độ Cá nhân' : 'Chế độ Doanh nghiệp'}!`,
                  'info'
                );
              }}
              schedules={schedules}
              smartTasks={smartTasks}
              pdcaCycles={pdcaCycles}
              meetings={meetings}
              okrs={okrs}
              swotBoards={swotBoards}
              maslowPlans={maslowPlans}
              ffcPraises={ffcPraises}
              prepMessages={prepMessages}
              setSchedules={setSchedules}
              setSmartTasks={setSmartTasks}
              setPdcaCycles={setPdcaCycles}
              setMeetings={setMeetings}
              setOkrs={setOkrs}
              setSwotBoards={setSwotBoards}
              setMaslowPlans={setMaslowPlans}
              setFfcPraises={setFfcPraises}
              setPrepMessages={setPrepMessages}
            />
          )}

          {activeTab === 'okr' && (
            <OkrManagementView
              okrs={okrs}
              smartTasks={smartTasks}
              onSaveOkr={(o) =>
                ceoStorageService.upsertItem('axis_ceo_okrs', o, okrs, setOkrs)
              }
              onDeleteOkr={(id) =>
                ceoStorageService.removeItem('axis_ceo_okrs', id, okrs, setOkrs)
              }
              navIntent={navIntent}
              onClearIntent={() => setNavIntent(null)}
              onNavigateTab={handleNavigateTab}
              activeUserName={activeUser?.name}
              radarMetrics={radarMetrics}
            />
          )}

          {activeTab === 'swot-tows' && (
            <SwotTowsView
              swotBoards={swotBoards}
              onSaveSwotBoard={(b) =>
                ceoStorageService.upsertItem('axis_ceo_swot', b, swotBoards, setSwotBoards)
              }
              onNavigateTab={handleNavigateTab}
              activeUserName={activeUser?.name}
            />
          )}

          {activeTab === 'prep' && (
            <PrepReportsView
              prepMessages={prepMessages}
              onSavePrep={(p) =>
                ceoStorageService.upsertItem('axis_ceo_prep_docs', p, prepMessages, setPrepMessages)
              }
              onDeletePrep={(id) =>
                ceoStorageService.removeItem('axis_ceo_prep_docs', id, prepMessages, setPrepMessages)
              }
              navIntent={navIntent}
              onClearIntent={() => setNavIntent(null)}
              onNavigateTab={handleNavigateTab}
              activeUserName={activeUser?.name}
            />
          )}

          {activeTab === 'people' && (
            <PeopleManagementView
              maslowPlans={maslowPlans}
              ffcPraises={ffcPraises}
              onSaveMaslowPlan={handleSaveMaslowWithScheduleSync}
              onDeleteMaslowPlan={handleDeleteMaslowWithScheduleSync}
              onSaveFfcPraise={(p) =>
                ceoStorageService.upsertItem('axis_ceo_praises', p, ffcPraises, setFfcPraises)
              }
              onDeleteFfcPraise={(id) =>
                ceoStorageService.removeItem('axis_ceo_praises', id, ffcPraises, setFfcPraises)
              }
              onNavigateTab={handleNavigateTab}
              activeUserName={activeUser?.name}
              staffDirectory={staffDirectory}
              recentReports={recentReports}
              lsxOrders={lsxOrders}
            />
          )}

          {activeTab === 'copilot' && (
            <AiCopilotView
              smartTasks={smartTasks}
              pdcaCycles={pdcaCycles}
              meetings={meetings}
              okrs={okrs}
              activeUserName={activeUser?.name}
            />
          )}

          {activeTab === 'mindset-hub' && (
            <MindsetHandbookTab
              selectedCode={selectedTheoryCode}
              onSelectCode={setSelectedTheoryCode}
              onApplyFramework={(tab, subView) => handleNavigateTab(tab, subView)}
            />
          )}

          {activeTab === 'erp-bridge' && (
            <ErpCommandBridgeTab
              activeUser={activeUser}
              isLoaded={erpLoaded}
              lsxOrders={lsxOrders}
              intakes={intakes}
              machines={machines}
              proposals={proposals}
              recentReports={recentReports}
              leaveRequests={leaveRequests}
              overtimeSchedules={overtimeSchedules}
              staffDirectory={staffDirectory}
              radarMetrics={radarMetrics}
              globalMonthFilter={globalMonthFilter}
              onToggleMonthFilter={setGlobalMonthFilter}
              navIntent={navIntent}
              onClearIntent={() => setNavIntent(null)}
              onNavigateTab={handleNavigateTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
