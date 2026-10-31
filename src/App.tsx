import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import {
  AxisTabId,
  AxisNavigationIntent,
  ErpUser,
  AxisScheduleItem,
  AxisSmartTask,
  AxisPdcaCycle,
  AxisOkrObjective,
  AxisSwotBoard,
  AxisMaslowSession,
  AxisFfcPraise,
  AxisMeeting,
  AxisPrepDoc,
  AxisTrainingSession,
} from './types/axisTypes';
import { axisDbService, onCloudSyncStatus } from './services/axisDbService';
import {
  SEED_SCHEDULES,
  SEED_SMART_TASKS,
  SEED_PDCA,
  SEED_OKRS,
  SEED_SWOT,
  SEED_MEETINGS,
} from './services/seedData';
import { useErpRadar } from './hooks/useErpRadar';
import { useReminderEngine, isScheduleActiveOnDate } from './hooks/useReminderEngine';
import { CustomDialogHost, dialogService } from './components/common/CustomDialog';
import { QuickTheoryDrawer } from './components/common/QuickTheoryDrawer';
import { AxisLogo } from './components/common/AxisLogo';
import { LoginScreen } from './components/LoginScreen';
import { AxisLayout } from './components/AxisLayout';
import { TodayCockpitTab } from './components/tabs/TodayCockpitTab';
import { ExecutionTab } from './components/tabs/ExecutionTab';
import { StrategyTab } from './components/tabs/StrategyTab';
import { PeopleLeadershipTab } from './components/tabs/PeopleLeadershipTab';
import { MeetingsPlaybookTab } from './components/tabs/MeetingsPlaybookTab';
import { TheoryHandbookTab } from './components/tabs/TheoryHandbookTab';
import { theoryService } from './services/theoryService';
import { FrameworkCode } from './data/managementFrameworksTheory';
import { getLocalTodayYmd } from './utils/dateUtils';

const ALLOWED_CEO_ROLES = ['ADMIN', 'DIRECTOR'];

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<ErpUser | null>(() => {
    try {
      const cached = localStorage.getItem('axis_current_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cloudSynced, setCloudSynced] = useState(true);

  const [activeTab, setActiveTab] = useState<AxisTabId>(() => {
    return (localStorage.getItem('axis_active_tab') as AxisTabId) || 'today';
  });
  const [navIntent, setNavIntent] = useState<AxisNavigationIntent | null>(null);

  // AXIS CEO Data State
  const [schedules, setSchedules] = useState<AxisScheduleItem[]>([]);
  const [smartTasks, setSmartTasks] = useState<AxisSmartTask[]>([]);
  const [pdcaCycles, setPdcaCycles] = useState<AxisPdcaCycle[]>([]);
  const [okrs, setOkrs] = useState<AxisOkrObjective[]>([]);
  const [swotBoards, setSwotBoards] = useState<AxisSwotBoard[]>([]);
  const [maslowSessions, setMaslowSessions] = useState<AxisMaslowSession[]>([]);
  const [ffcPraises, setFfcPraises] = useState<AxisFfcPraise[]>([]);
  const [meetings, setMeetings] = useState<AxisMeeting[]>([]);
  const [prepDocs, setPrepDocs] = useState<AxisPrepDoc[]>([]);
  const [trainings, setTrainings] = useState<AxisTrainingSession[]>([]);

  // Non-destructive Quick Theory Drawer + Full Theory Tab state
  const [selectedTheoryCode, setSelectedTheoryCode] = useState<FrameworkCode>('SMART');
  const [theoryDrawerOpen, setTheoryDrawerOpen] = useState(false);

  useEffect(() => {
    return theoryService.subscribe((code, mode) => {
      setSelectedTheoryCode(code);
      if (mode === 'FULL_TAB') {
        setTheoryDrawerOpen(false);
        setActiveTab('theory');
      } else {
        setTheoryDrawerOpen(true);
      }
    });
  }, []);

  const handleNavigate = useCallback(
    (tab: AxisTabId, intentPartial?: Omit<AxisNavigationIntent, 'tab' | 'ts'>) => {
      setActiveTab(tab);
      if (intentPartial) {
        setNavIntent({
          ...intentPartial,
          tab,
          ts: Date.now(),
        });
      } else {
        setNavIntent(null);
      }
    },
    []
  );

  const clearNavIntent = useCallback(() => {
    setNavIntent(null);
  }, []);

  useEffect(() => {
    const origAlert = window.alert;
    window.alert = (msg: any) => {
      dialogService.alert(String(msg));
    };
    return () => {
      window.alert = origAlert;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('axis_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    return onCloudSyncStatus(setCloudSynced);
  }, []);

  // Auth listener connected to shared ProTrack Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setCurrentUser(null);
        localStorage.removeItem('axis_current_user');
        setAuthReady(true);
        return;
      }

      try {
        const erpUser = await axisDbService.getUserByUid(fbUser.uid);
        const resolvedUser: ErpUser | null = erpUser
          ? { ...erpUser, email: fbUser.email || erpUser.email }
          : fbUser.email === 'furywing2608@gmail.com'
            ? {
              id: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || 'CEO',
              role: 'ADMIN',
            }
            : null;

        if (!resolvedUser) {
          setAuthError('Tài khoản này chưa được đăng ký trong hệ thống ProTrack.');
          await signOut(auth);
          setCurrentUser(null);
          localStorage.removeItem('axis_current_user');
        } else if (
          !ALLOWED_CEO_ROLES.includes(resolvedUser.role) &&
          resolvedUser.email !== 'furywing2608@gmail.com'
        ) {
          setAuthError(
            `Xin lỗi ${resolvedUser.name}, hệ thống AXIS hiện tại chỉ cấp quyền truy cập cho CEO / Ban Giám Đốc.`
          );
          await signOut(auth);
          setCurrentUser(null);
          localStorage.removeItem('axis_current_user');
        } else {
          setCurrentUser(resolvedUser);
          localStorage.setItem('axis_current_user', JSON.stringify(resolvedUser));
          setAuthError(null);
        }
      } catch (e) {
        console.warn('[AXIS Auth] Verification note:', e);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  // Subscribe AXIS Collections when CEO is logged in
  useEffect(() => {
    if (!currentUser) return;
    const unsubs = [
      axisDbService.subscribeAxisCollection('axis_schedules', setSchedules, SEED_SCHEDULES),
      axisDbService.subscribeAxisCollection('axis_tasks', setSmartTasks, SEED_SMART_TASKS),
      axisDbService.subscribeAxisCollection('axis_pdca', setPdcaCycles, SEED_PDCA),
      axisDbService.subscribeAxisCollection('axis_okrs', setOkrs, SEED_OKRS),
      axisDbService.subscribeAxisCollection('axis_swot', setSwotBoards, [SEED_SWOT]),
      axisDbService.subscribeAxisCollection('axis_coaching', setMaslowSessions),
      axisDbService.subscribeAxisCollection('axis_praises', setFfcPraises),
      axisDbService.subscribeAxisCollection('axis_meetings', setMeetings, SEED_MEETINGS),
      axisDbService.subscribeAxisCollection('axis_prep_docs', setPrepDocs),
      axisDbService.subscribeAxisCollection('axis_trainings', setTrainings),
    ];
    return () => unsubs.forEach((u) => u());
  }, [currentUser]);

  const erpRadar = useErpRadar(Boolean(currentUser));
  const reminderEngine = useReminderEngine(schedules, smartTasks, pdcaCycles, meetings);

  const badges = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalTodayYmd(now);

    const pendingTodaySchedules = schedules.filter(
      (s) => isScheduleActiveOnDate(s, now) && !(s.completedDates || []).includes(todayStr)
    ).length;

    const upcomingTodayMeetings = meetings.filter(
      (m) => m.status === 'UPCOMING' && m.date === todayStr
    ).length;

    const activeTasks = smartTasks.filter((t) => t.status !== 'COMPLETED');
    const due369 = activeTasks.reduce(
      (acc, t) => acc + t.checkins.filter((c) => !c.completed && c.dueDate <= todayStr).length,
      0
    );
    const overdueTasks = activeTasks.filter((t) => t.dueDate < todayStr).length;
    const duePdca = pdcaCycles.filter(
      (p) => p.currentPhase !== 'STANDARDIZED' && p.checkDate && p.checkDate <= todayStr
    ).length;

    return {
      todayCount:
        pendingTodaySchedules +
        erpRadar.radarMetrics.pendingProposals.length +
        upcomingTodayMeetings,
      executionCount: due369 + overdueTasks + duePdca,
      meetingsCount: upcomingTodayMeetings,
    };
  }, [
    schedules,
    meetings,
    smartTasks,
    pdcaCycles,
    erpRadar.radarMetrics.pendingProposals.length,
  ]);

  const handleLogout = async () => {
    const ok = await dialogService.confirm(
      'Bạn muốn đăng xuất khỏi bàn điều hành AXIS?',
      'Đăng xuất'
    );
    if (!ok) return;
    await signOut(auth);
    setCurrentUser(null);
    localStorage.removeItem('axis_current_user');
  };

  if (!authReady && !currentUser) {
    return (
      <div className="min-h-screen w-full bg-[#F8F9FB] flex flex-col items-center justify-center gap-4">
        <AxisLogo size={56} />
        <div className="text-[12px] font-bold uppercase tracking-[0.25em] text-slate-400 animate-pulse">
          Khởi tạo trục điều phối AXIS...
        </div>
      </div>
    );
  }

  return (
    <>
      <CustomDialogHost />
      <QuickTheoryDrawer
        isOpen={theoryDrawerOpen}
        code={selectedTheoryCode}
        onSelectCode={setSelectedTheoryCode}
        onClose={() => setTheoryDrawerOpen(false)}
        onOpenFullTab={(code) => {
          setSelectedTheoryCode(code);
          setTheoryDrawerOpen(false);
          setActiveTab('theory');
        }}
      />
      {!currentUser ? (
        <LoginScreen authError={authError} setAuthError={setAuthError} />
      ) : (
        <AxisLayout
          activeTab={activeTab}
          setActiveTab={(tab) => handleNavigate(tab)}
          currentUser={currentUser}
          onLogout={handleLogout}
          cloudSynced={cloudSynced}
          erpConnected={erpRadar.isLoaded}
          notifPermission={reminderEngine.notifPermission}
          onRequestNotif={reminderEngine.requestNotificationPermission}
          onTestChime={reminderEngine.testChime}
          badges={badges}
        >
          {activeTab === 'today' && (
            <TodayCockpitTab
              currentUser={currentUser}
              schedules={schedules}
              smartTasks={smartTasks}
              pdcaCycles={pdcaCycles}
              meetings={meetings}
              maslowSessions={maslowSessions}
              trainings={trainings}
              radarMetrics={erpRadar.radarMetrics}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'execution' && (
            <ExecutionTab
              currentUser={currentUser}
              smartTasks={smartTasks}
              pdcaCycles={pdcaCycles}
              okrs={okrs}
              staffDirectory={erpRadar.staffDirectory}
              lsxOrders={erpRadar.lsxOrders}
              navIntent={navIntent}
              onConsumeIntent={clearNavIntent}
            />
          )}

          {activeTab === 'strategy' && (
            <StrategyTab
              okrs={okrs}
              swotBoards={swotBoards}
              smartTasks={smartTasks}
              liveErpMetrics={{
                onTimeLsxRate: erpRadar.radarMetrics.onTimeLsxRate,
                completedLsxCount: erpRadar.radarMetrics.completedLsxCount,
                proposalResolvedRate: erpRadar.radarMetrics.proposalResolvedRate,
                activeTrainingCount: erpRadar.radarMetrics.activeTrainingCount,
              }}
              navIntent={navIntent}
              onConsumeIntent={clearNavIntent}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'people' && (
            <PeopleLeadershipTab
              currentUser={currentUser}
              staffDirectory={erpRadar.staffDirectory}
              topPerformers={erpRadar.radarMetrics.topPerformers}
              getStaff360Profile={erpRadar.getStaff360Profile}
              smartTasks={smartTasks}
              pdcaCycles={pdcaCycles}
              maslowSessions={maslowSessions}
              ffcPraises={ffcPraises}
              trainings={trainings}
              navIntent={navIntent}
              onConsumeIntent={clearNavIntent}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'meetings' && (
            <MeetingsPlaybookTab
              currentUser={currentUser}
              meetings={meetings}
              prepDocs={prepDocs}
              smartTasks={smartTasks}
              overdueLsx={erpRadar.radarMetrics.overdueOrDueTodayLsx}
              staffDirectory={erpRadar.staffDirectory}
              navIntent={navIntent}
              onConsumeIntent={clearNavIntent}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'theory' && (
            <TheoryHandbookTab
              activeFramework={selectedTheoryCode}
              onSelectFramework={setSelectedTheoryCode}
              onNavigate={handleNavigate}
            />
          )}
        </AxisLayout>
      )}
    </>
  );
};

export default App;
