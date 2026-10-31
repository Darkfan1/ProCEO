import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import {
  ErpUser,
  ErpPersonnel,
  ErpLsxOrder,
  ErpStageReport,
  ErpProposal,
  ErpLeaveRequest,
  ErpOvertimeSchedule,
  ErpRewardRecord,
  ErpDisciplineRecord,
  ErpTrainingPlan,
} from '../types/axisTypes';
import { addLocalDaysYmd, getLocalTodayYmd } from '../utils/dateUtils';

export function useErpRadar(enabled: boolean) {
  const [erpUsers, setErpUsers] = useState<ErpUser[]>([]);
  const [personnel, setPersonnel] = useState<ErpPersonnel[]>([]);
  const [lsxOrders, setLsxOrders] = useState<ErpLsxOrder[]>([]);
  const [recentReports, setRecentReports] = useState<ErpStageReport[]>([]);
  const [proposals, setProposals] = useState<ErpProposal[]>([]);
  const [pendingProposalsDirect, setPendingProposalsDirect] = useState<ErpProposal[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<ErpLeaveRequest[]>([]);
  const [overtimeSchedules, setOvertimeSchedules] = useState<ErpOvertimeSchedule[]>([]);
  const [rewards, setRewards] = useState<ErpRewardRecord[]>([]);
  const [disciplines, setDisciplines] = useState<ErpDisciplineRecord[]>([]);
  const [trainingPlans, setTrainingPlans] = useState<ErpTrainingPlan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Deferred background sync ref theo chuẩn enterprise-app-blueprint
  const pendingUpdatesRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && pendingUpdatesRef.current.length > 0) {
        const queue = [...pendingUpdatesRef.current];
        pendingUpdatesRef.current = [];
        React.startTransition(() => {
          queue.forEach((fn) => fn());
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const applyVisibilitySafe = (fn: () => void) => {
    if (typeof document !== 'undefined' && document.hidden) {
      pendingUpdatesRef.current.push(fn);
    } else {
      React.startTransition(fn);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const thirtyDaysIso = addLocalDaysYmd(-30);

    const unsubs: Array<() => void> = [];

    const safeSub = <T,>(q: any, setter: React.Dispatch<React.SetStateAction<T[]>>, markLoaded = false) => {
      try {
        const u = onSnapshot(
          q,
          (snap: any) => {
            const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as T[];
            applyVisibilitySafe(() => {
              setter(items);
              if (markLoaded) setIsLoaded(true);
            });
          },
          () => {
            if (markLoaded) setIsLoaded(true);
          }
        );
        unsubs.push(u);
      } catch {
        if (markLoaded) setIsLoaded(true);
      }
    };

    // Giai đoạn 1: Dữ liệu điều hành trọng yếu
    safeSub<ErpUser>(query(collection(db, 'users'), limit(150)), setErpUsers, true);
    safeSub<ErpLsxOrder>(query(collection(db, 'lsx'), limit(250)), setLsxOrders);
    safeSub<ErpProposal>(query(collection(db, 'proposals'), limit(100)), setProposals);
    safeSub<ErpProposal>(
      query(collection(db, 'proposals'), where('finalStatus', '==', 'PENDING'), limit(100)),
      setPendingProposalsDirect
    );
    safeSub<ErpStageReport>(
      query(collection(db, 'reports'), where('timestamp', '>=', thirtyDaysIso), limit(300)),
      setRecentReports
    );

    // Giai đoạn 2: Dữ liệu Nhân tâm & Đào tạo (trì hoãn 500ms để UI lên tức thì)
    const timer = setTimeout(() => {
      safeSub<ErpPersonnel>(query(collection(db, 'hr_personnel'), limit(150)), setPersonnel);
      safeSub<ErpLeaveRequest>(query(collection(db, 'hr_leave_requests'), limit(100)), setLeaveRequests);
      safeSub<ErpOvertimeSchedule>(query(collection(db, 'hr_overtime'), limit(80)), setOvertimeSchedules);
      safeSub<ErpRewardRecord>(query(collection(db, 'hr_rewards'), limit(80)), setRewards);
      safeSub<ErpDisciplineRecord>(query(collection(db, 'hr_disciplines'), limit(80)), setDisciplines);
      safeSub<ErpTrainingPlan>(query(collection(db, 'training_plans'), limit(80)), setTrainingPlans);
    }, 500);

    return () => {
      clearTimeout(timer);
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
    };
  }, [enabled]);

  // Danh sách nhân sự gộp thông minh giữa `users` và `hr_personnel`
  const staffDirectory = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string; department: string }>();
    erpUsers.forEach((u) => {
      if (u.name) {
        map.set(u.name.trim().toLowerCase(), {
          id: u.id,
          name: u.name.trim(),
          role: u.role || 'STAFF',
          department: u.department || u.role || 'Nội bộ',
        });
      }
    });
    personnel.forEach((p) => {
      const fullName = (p.fullName || p.name || '').trim();
      if (fullName && !map.has(fullName.toLowerCase())) {
        map.set(fullName.toLowerCase(), {
          id: p.id,
          name: fullName,
          role: p.position || p.role || 'STAFF',
          department: p.department || 'Sản xuất',
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [erpUsers, personnel]);

  // Tổng hợp các chỉ số Radar trực tiếp cho CEO
  const radarMetrics = useMemo(() => {
    const todayStr = getLocalTodayYmd();
    const activeLsx = lsxOrders.filter((l) => !l.isDeleted && l.status !== 'CANCELLED');
    const completedLsx = activeLsx.filter(
      (l) => l.status === 'COMPLETED' || l.progress === 'Đã đóng gói'
    );
    const inProgressLsx = activeLsx.filter(
      (l) => l.status !== 'COMPLETED' && l.progress !== 'Đã đóng gói'
    );

    const overdueOrDueTodayLsx = inProgressLsx.filter((l) => {
      if (!l.deliveryDate) return false;
      const d = String(l.deliveryDate).slice(0, 10);
      return d <= todayStr;
    });

    const onTimeLsxRate =
      inProgressLsx.length > 0
        ? Math.round(
            ((inProgressLsx.length - overdueOrDueTodayLsx.length) / inProgressLsx.length) * 100
          )
        : 100;

    // Gộp proposals chờ duyệt trực tiếp + sample để không bỏ sót bất kỳ đề xuất PENDING nào
    const mergedMap = new Map<string, ErpProposal>();
    proposals.forEach((p) => mergedMap.set(p.id, p));
    pendingProposalsDirect.forEach((p) => mergedMap.set(p.id, p));
    const allKnownProposals = Array.from(mergedMap.values());

    const pendingProposals = allKnownProposals
      .filter((p) => p.finalStatus === 'PENDING')
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const proposalResolvedRate =
      allKnownProposals.length > 0
        ? Math.round(
            ((allKnownProposals.length - pendingProposals.length) / allKnownProposals.length) * 100
          )
        : 100;

    const todayReports = recentReports.filter(
      (r) => !r.isDeleted && (r.timestamp || '').slice(0, 10) === todayStr
    );
    const todayPauses = todayReports.filter((r) => Boolean(r.isPause));

    const todayLeaves = leaveRequests.filter(
      (lr) =>
        lr.status !== 'REJECTED' &&
        (lr.startDate || '').slice(0, 10) <= todayStr &&
        (lr.endDate || lr.startDate || '').slice(0, 10) >= todayStr
    );

    // Top nhân sự đóng góp sản lượng nổi bật trong 14 ngày gần nhất (phục vụ gợi ý khen FFC)
    const workerCountMap = new Map<string, { name: string; reportCount: number; totalQty: number; pauseCount: number }>();
    recentReports.forEach((r) => {
      if (r.isDeleted || !r.workerName) return;
      const key = r.workerName.trim();
      const cur = workerCountMap.get(key) || { name: key, reportCount: 0, totalQty: 0, pauseCount: 0 };
      if (r.isPause) {
        cur.pauseCount += 1;
      } else {
        cur.reportCount += 1;
        cur.totalQty += Number(r.finishedQty || 0);
      }
      workerCountMap.set(key, cur);
    });
    const topPerformers = Array.from(workerCountMap.values())
      .filter((w) => w.reportCount > 0)
      .sort((a, b) => b.reportCount - a.reportCount)
      .slice(0, 6);

    const activeTrainingCount = trainingPlans.filter(
      (t) => t.status === 'IN_PROGRESS' || t.status === 'COMPLETED'
    ).length;

    return {
      activeLsxCount: activeLsx.length,
      inProgressLsxCount: inProgressLsx.length,
      completedLsxCount: completedLsx.length,
      overdueOrDueTodayLsx,
      onTimeLsxRate,
      pendingProposals,
      proposalResolvedRate,
      todayReportsCount: todayReports.length,
      todayPauses,
      todayLeaves,
      topPerformers,
      activeTrainingCount,
    };
  }, [lsxOrders, proposals, pendingProposalsDirect, recentReports, leaveRequests, trainingPlans]);

  // Hàm trích xuất Hồ sơ 360° của 1 nhân sự bất kỳ cho Tháp Maslow
  const getStaff360Profile = (staffName: string) => {
    const clean = staffName.trim().toLowerCase();
    const staffReports = recentReports.filter(
      (r) => !r.isDeleted && (r.workerName || '').trim().toLowerCase() === clean
    );
    const prodSessions = staffReports.filter((r) => !r.isPause).length;
    const pauseSessions = staffReports.filter((r) => Boolean(r.isPause)).length;

    const staffLeaves = leaveRequests.filter(
      (l) => (l.employeeName || '').trim().toLowerCase() === clean
    );
    const staffRewards = rewards.filter(
      (r) => (r.targetName || '').trim().toLowerCase() === clean
    );
    const staffDisciplines = disciplines.filter(
      (d) => (d.targetName || '').trim().toLowerCase() === clean
    );

    let otSessions = 0;
    overtimeSchedules.forEach((ot) => {
      if (
        Array.isArray(ot.workerDetails) &&
        ot.workerDetails.some((w) => (w.name || '').trim().toLowerCase() === clean)
      ) {
        otSessions += 1;
      }
    });

    const staffTrainings = trainingPlans.filter(
      (t) => (t.traineeName || '').trim().toLowerCase() === clean
    );

    return {
      prodSessions,
      pauseSessions,
      leaveCount: staffLeaves.length,
      rewardCount: staffRewards.length,
      disciplineCount: staffDisciplines.length,
      otSessions,
      trainingCount: staffTrainings.length,
      summaryText: `${prodSessions} ca báo cáo sản lượng (30 ngày), ${otSessions} lịch tăng ca, ${staffLeaves.length} đơn nghỉ phép, ${staffRewards.length} lần khen thưởng, ${staffDisciplines.length} nhắc nhở/kỷ luật, ${staffTrainings.length} lộ trình đào tạo.`,
    };
  };

  return {
    isLoaded,
    staffDirectory,
    lsxOrders,
    proposals,
    radarMetrics,
    getStaff360Profile,
  };
}

