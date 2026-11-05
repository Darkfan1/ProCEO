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
} from './types/ceoTypes';
import { ErpUser } from './types/erpTypes';
import { FrameworkCode } from './data/ceoMindsetData';
import { getLocalTodayYmd } from './utils/dateUtils';
import { useDailyReminderEngine, isScheduleActiveOnDate } from './hooks/useDailyReminderEngine';
import { CustomDialogHost, dialogService } from './components/common/CustomDialog';
import { CockpitOverview } from './components/CockpitOverview';
import { ExecutiveExecutionTab } from './components/ExecutiveExecutionTab';
import { ErpCommandBridgeTab } from './components/ErpCommandBridgeTab';
import { MindsetHandbookTab, QuickMindsetDrawer } from './components/MindsetHandbookView';
import { ErpAdminLoginGate } from './components/ErpAdminLoginGate';

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
      if (saved && NAV_ITEMS.some((n) => n.id === saved)) return saved;
    } catch {}
    return 'cockpit';
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

  // ─── STATE DỮ LIỆU QUẢN TRỊ CEO (ĐỒNG BỘ FIRESTORE `axis_*` + LOCAL) ──────
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [smartTasks, setSmartTasks] = useState<SmartTask[]>(INITIAL_SMART_TASKS);
  const [pdcaCycles, setPdcaCycles] = useState<PdcaCycle[]>(INITIAL_PDCA_CYCLES);
  const [meetings, setMeetings] = useState<Meeting369[]>(INITIAL_MEETINGS_369);
  const [okrs, setOkrs] = useState<OkrObjective[]>(INITIAL_OKRS);
  const [swotBoards, setSwotBoards] = useState<SwotBoard[]>(INITIAL_SWOT_BOARDS);
  const [maslowPlans, setMaslowPlans] = useState<MaslowEmployeePlan[]>(INITIAL_MASLOW_PLANS);
  const [ffcPraises, setFfcPraises] = useState<FfcPraiseRecord[]>(INITIAL_FFC_PRAISES);
  const [prepMessages, setPrepMessages] = useState<PrepMessage[]>(INITIAL_PREP_MESSAGES);

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

  // Engine nhắc lịch & nhắc việc chạy nền (chỉ kích hoạt khi đã đăng nhập Admin)
  const reminderEngine = useDailyReminderEngine(schedules, smartTasks, Boolean(adminUser));

  const handleNavigateTab = useCallback(
    (
      tab: CeoTabId,
      subView?: string,
      prefill?: { title?: string; assignee?: string; lsxCode?: string }
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
        <ErpAdminLoginGate onLogin={loginWithErp} error={authError} />
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

      {/* SIDEBAR ĐIỀU HƯỚNG CHUẨN EXECUTIVE (HỖ TRỢ THU GỌN TRÊN DESKTOP) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-56'
        } w-60 ceo-sidebar flex flex-col justify-between transition-all duration-200 lg:static lg:translate-x-0 shrink-0 no-print ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`${sidebarCollapsed ? 'p-2.5' : 'p-4'} space-y-4 overflow-y-auto`}>
          {/* Logo & Tên Hệ Thống */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'gap-2.5'}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 text-slate-900 border border-white/60 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-[inset_0_1px_0_#fff,0_2px_6px_rgba(0,0,0,0.4)]">
                P
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-extrabold text-sm tracking-tight text-white">ProCEO</h1>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-slate-200">
                      MVĐN
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Điều Hành Quản Trị</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg bg-white/10 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Trạng thái kết nối ERP ProTrack */}
          {!sidebarCollapsed ? (
            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">ERP Cloud</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {erpLoaded ? 'Online' : 'Sync'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                <span>{radarMetrics.inProgressLsxCount} LSX chạy</span>
                <span>{radarMetrics.pendingIntakesCount} Đơn chờ</span>
              </div>
            </div>
          ) : (
            <div
              className="flex justify-center py-1"
              title={`ERP Cloud: ${radarMetrics.inProgressLsxCount} LSX đang chạy • ${radarMetrics.pendingIntakesCount} đơn chờ`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
          )}

          {/* Danh mục điều hướng chính */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isErpBridge = item.id === 'erp-bridge';
              return (
                <React.Fragment key={item.id}>
                  {isErpBridge && (
                    <div className="my-1.5 border-t border-white/10" />
                  )}
                  <button
                    onClick={() => handleNavigateTab(item.id)}
                    title={item.label}
                    className={`w-full ${
                      sidebarCollapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2 justify-between'
                    } rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-b from-white via-slate-100 to-slate-200 text-slate-900 border border-white/90 shadow-[inset_0_1px_0_#ffffff,0_3px_8px_rgba(0,0,0,0.35)] font-bold'
                        : 'text-slate-300 hover:bg-white/[0.08] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      />
                      {!sidebarCollapsed && (
                        <span className="text-xs font-bold truncate">{item.label}</span>
                      )}
                    </div>
                    {!sidebarCollapsed && item.id === 'execution' && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold tabular-nums ${
                          isActive ? 'bg-slate-800 text-white' : 'bg-white/10 text-slate-200'
                        }`}
                      >
                        {openTasksCount}
                      </span>
                    )}
                    {!sidebarCollapsed &&
                      item.id === 'erp-bridge' &&
                      radarMetrics.pendingProposals.length > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold tabular-nums ${
                            isActive ? 'bg-slate-800 text-white' : 'bg-white/15 text-white'
                          }`}
                        >
                          {radarMetrics.pendingProposals.length}
                        </span>
                      )}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Bộ đổi Stage Theme & Chuông Nhắc Lịch */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-3.5'} border-t border-white/10 space-y-2 bg-black/20`}>
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between gap-1.5 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1 shrink-0">
                <Palette className="w-3.5 h-3.5" /> Tone:
              </span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as StageThemeId)}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg outline-none cursor-pointer min-w-0 flex-1"
              >
                <option value="bento-glass" className="text-slate-900 bg-white">
                  Titanium Silver
                </option>
                <option value="aubergine-studio" className="text-slate-900 bg-white">
                  Obsidian Graphite
                </option>
                <option value="rose-stage" className="text-slate-900 bg-white">
                  Platinum Mist
                </option>
                <option value="grayscale-stage" className="text-slate-900 bg-white">
                  Pure Monochrome
                </option>
              </select>
            </div>
          )}

          <div className={`flex items-center ${sidebarCollapsed ? 'flex-col' : ''} gap-1.5`}>
            <button
              onClick={reminderEngine.requestNotificationPermission}
              title={
                reminderEngine.notifPermission === 'granted' ? 'Chuông nhắc: Bật' : 'Bật thông báo'
              }
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/12 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              {!sidebarCollapsed &&
                (reminderEngine.notifPermission === 'granted' ? 'Chuông: Bật' : 'Bật chuông')}
            </button>
            <button
              onClick={reminderEngine.triggerTestChime}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/12 text-slate-200 cursor-pointer"
              title="Thử âm chuông nhắc lịch"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH FULL-WIDTH DESKTOP */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* TOPBAR */}
        <header className="shrink-0 z-30 vista-topbar px-3.5 sm:px-5 py-2 no-print">
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 rounded-xl btn-25d-secondary"
              >
                <Menu className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="hidden lg:flex p-1.5 rounded-lg btn-25d-secondary text-slate-700 cursor-pointer"
                title={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
              <h2 className="font-extrabold text-slate-800 text-sm sm:text-base tracking-tight">
                {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
              </h2>
            </div>

            {reminderEngine.upcomingAlert && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 text-slate-100 border border-slate-600 text-xs font-semibold shadow-xs">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                <span>
                  {reminderEngine.upcomingAlert.time} — {reminderEngine.upcomingAlert.title}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1 btn-25d-secondary rounded-xl text-xs"
                title={`Tài khoản ERP MVĐN: ${activeUser?.email || activeUser?.username || ''} • Bộ phận: ${activeUser?.department || 'Ban Giám Đốc'}`}
              >
                <Shield className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span className="font-bold text-slate-800 max-w-[160px] truncate">
                  {activeUser?.name || activeUser?.email || 'Ban Giám Đốc'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-wider">
                  {activeUser?.role || 'ADMIN'}
                </span>
              </div>
              <button
                onClick={async () => {
                  const ok = await dialogService.confirm(
                    'Bạn có muốn đăng xuất khỏi phiên Quản trị viên ProCEO?',
                    'Đăng xuất hệ thống'
                  );
                  if (ok) {
                    await logoutErp();
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl btn-25d-secondary text-xs font-bold text-slate-700 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
                title="Đăng xuất tài khoản Admin ERP MVĐN"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA (FLUID FULL-WIDTH TRÊN DESKTOP) */}
        <main className="flex-1 overflow-y-auto w-full px-3.5 sm:px-5 py-3.5">
          {activeTab === 'cockpit' && (
            <CockpitOverview
              activeUser={activeUser}
              erpLoaded={erpLoaded}
              radarMetrics={radarMetrics}
              schedules={schedules}
              smartTasks={smartTasks}
              pdcaCycles={pdcaCycles}
              meetings={meetings}
              okrs={okrs}
              onToggleScheduleDone={handleToggleScheduleDone}
              onDeleteSchedule={(id) =>
                ceoStorageService.removeItem('axis_ceo_schedules', id, schedules, setSchedules)
              }
              onQuickAddSchedule={handleQuickAddSchedule}
              onQuickAddSmartTask={handleQuickAddSmartTask}
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
              onFollowUpSmartTask={handleFollowUpSmartTask}
              onSaveSmartTask={handleSaveSmartTask}
              onSaveSchedule={(item) =>
                ceoStorageService.upsertItem('axis_ceo_schedules', item, schedules, setSchedules)
              }
              onConvertSmartToPdca={(task) => {
                setActiveTab('execution');
                setNavIntent({
                  tab: 'execution',
                  subView: 'PDCA',
                  prefillSmartTask: task,
                  timestamp: Date.now(),
                });
              }}
              onConvertPdcaToMeeting={(cycle) => {
                setActiveTab('execution');
                setNavIntent({
                  tab: 'execution',
                  subView: 'MEETINGS',
                  prefillPdcaCycle: cycle,
                  timestamp: Date.now(),
                });
              }}
              onConvertSmartToMeeting={(task) => {
                setActiveTab('execution');
                setNavIntent({
                  tab: 'execution',
                  subView: 'MEETINGS',
                  prefillSmartTask: task,
                  timestamp: Date.now(),
                });
              }}
              onDeleteSmartTask={(id) =>
                ceoStorageService.removeItem('axis_ceo_tasks', id, smartTasks, setSmartTasks)
              }
              onNavigateTab={handleNavigateTab}
              onOpenTheoryDrawer={handleOpenTheoryDrawer}
            />
          )}

          {activeTab === 'execution' && (
            <ExecutiveExecutionTab
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
              onSaveMeeting={(m) =>
                ceoStorageService.upsertItem('axis_ceo_meetings', m, meetings, setMeetings)
              }
              onDeleteMeeting={(id) =>
                ceoStorageService.removeItem('axis_ceo_meetings', id, meetings, setMeetings)
              }
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
