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
} from '../types/erpTypes';
import { addLocalDaysYmd, getLocalTodayYmd } from '../utils/dateUtils';

export interface ErpRadarMetrics {
  totalLsxCount: number;
  inProgressLsxCount: number;
  completedLsxCount: number;
  overdueLsx: ErpLsxOrder[];
  pendingProposals: ErpProposal[];
  todayReportsCount: number;
  todayFinishedQuantity: number;
  todayDefectiveQuantity: number;
  activeWorkersToday: number;
  totalPersonnelCount: number;
  onTimeLsxRate: number;
}

export function useErpData(enabled = true) {
  const [users, setUsers] = useState<ErpUser[]>([]);
  const [personnel, setPersonnel] = useState<ErpPersonnel[]>([]);
  const [lsxOrders, setLsxOrders] = useState<ErpLsxOrder[]>([]);
  const [recentReports, setRecentReports] = useState<ErpStageReport[]>([]);
  const [proposals, setProposals] = useState<ErpProposal[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<ErpLeaveRequest[]>([]);
  const [overtimeSchedules, setOvertimeSchedules] = useState<ErpOvertimeSchedule[]>([]);
  const [rewards, setRewards] = useState<ErpRewardRecord[]>([]);
  const [disciplines, setDisciplines] = useState<ErpDisciplineRecord[]>([]);
  const [trainingPlans, setTrainingPlans] = useState<ErpTrainingPlan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Áp dụng Deferred Background Sync (chuẩn enterprise-app-blueprint)
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

    const safeSub = <T,>(
      q: any,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      markLoaded = false
    ) => {
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
          (err: any) => {
            console.warn('Erp subscription notice:', err);
            setError(err?.message || 'Lỗi kết nối Firestore');
            if (markLoaded) setIsLoaded(true);
          }
        );
        unsubs.push(u);
      } catch (err: any) {
        console.warn('Erp subscription catch:', err);
        if (markLoaded) setIsLoaded(true);
      }
    };

    // Giai đoạn 1: Dữ liệu vận hành chính (Ưu tiên nạp ngay)
    safeSub<ErpUser>(query(collection(db, 'users'), limit(150)), setUsers, true);
    safeSub<ErpLsxOrder>(query(collection(db, 'lsx'), limit(250)), setLsxOrders);
    safeSub<ErpProposal>(query(collection(db, 'proposals'), limit(100)), setProposals);
    safeSub<ErpStageReport>(
      query(collection(db, 'reports'), where('timestamp', '>=', thirtyDaysIso), limit(300)),
      setRecentReports
    );

    // Giai đoạn 2: Dữ liệu nhân sự & hành chính (trì hoãn 300ms để tăng tốc độ phản hồi UI)
    const timer = setTimeout(() => {
      safeSub<ErpPersonnel>(query(collection(db, 'hr_personnel'), limit(150)), setPersonnel);
      safeSub<ErpLeaveRequest>(query(collection(db, 'hr_leave_requests'), limit(100)), setLeaveRequests);
      safeSub<ErpOvertimeSchedule>(query(collection(db, 'hr_overtime'), limit(80)), setOvertimeSchedules);
      safeSub<ErpRewardRecord>(query(collection(db, 'hr_rewards'), limit(80)), setRewards);
      safeSub<ErpDisciplineRecord>(query(collection(db, 'hr_disciplines'), limit(80)), setDisciplines);
      safeSub<ErpTrainingPlan>(query(collection(db, 'training_plans'), limit(80)), setTrainingPlans);
    }, 300);

    return () => {
      clearTimeout(timer);
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
    };
  }, [enabled]);

  // Tổng hợp danh bạ nhân sự chuẩn hóa
  const staffDirectory = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string; department: string }>();
    users.forEach((u) => {
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
  }, [users, personnel]);

  // Các chỉ số vận hành Radar từ ERP
  const radarMetrics = useMemo((): ErpRadarMetrics => {
    const todayStr = getLocalTodayYmd();
    const activeLsx = lsxOrders.filter((l) => !l.isDeleted && l.status !== 'CANCELLED');
    const inProgress = activeLsx.filter(
      (l) => l.status !== 'COMPLETED' && l.progress !== 'Đã đóng gói'
    );
    const completed = activeLsx.filter(
      (l) => l.status === 'COMPLETED' || l.progress === 'Đã đóng gói'
    );

    // Lệnh sản xuất sát hạn / quá hạn
    const overdueLsx = inProgress.filter((l) => {
      if (!l.deliveryDate) return false;
      const d = l.deliveryDate.slice(0, 10);
      return d <= todayStr;
    });

    // Đề xuất đang chờ duyệt
    const pendingProposals = proposals.filter((p) => p.finalStatus === 'PENDING');

    // Báo cáo công đoạn hôm nay
    const todayReports = recentReports.filter(
      (r) => !r.isDeleted && r.timestamp && r.timestamp.slice(0, 10) === todayStr
    );
    const todayFinishedQty = todayReports.reduce((sum, r) => sum + (Number(r.finishedQty) || 0), 0);
    const todayDefectiveQty = todayReports.reduce((sum, r) => sum + (Number((r as any).defectiveQty) || 0), 0);
    const workerNames = new Set(todayReports.map((r) => r.workerName).filter(Boolean));

    const onTimeLsxRate =
      activeLsx.length > 0
        ? Math.round(((activeLsx.length - overdueLsx.length) / activeLsx.length) * 100)
        : 100;

    return {
      totalLsxCount: activeLsx.length,
      inProgressLsxCount: inProgress.length,
      completedLsxCount: completed.length,
      overdueLsx,
      pendingProposals,
      todayReportsCount: todayReports.length,
      todayFinishedQuantity: todayFinishedQty,
      todayDefectiveQuantity: todayDefectiveQty,
      activeWorkersToday: workerNames.size,
      totalPersonnelCount: staffDirectory.length,
      onTimeLsxRate,
    };
  }, [lsxOrders, proposals, recentReports, staffDirectory.length]);

  return {
    isLoaded,
    error,
    users,
    personnel,
    lsxOrders,
    recentReports,
    proposals,
    leaveRequests,
    overtimeSchedules,
    rewards,
    disciplines,
    trainingPlans,
    staffDirectory,
    radarMetrics,
  };
}
