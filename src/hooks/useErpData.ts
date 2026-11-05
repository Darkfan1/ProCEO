import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import {
  ErpUser,
  ErpPersonnel,
  ErpLsxOrder,
  ErpOrderIntake,
  ErpMachine,
  ErpStageReport,
  ErpProposal,
  ErpLeaveRequest,
  ErpOvertimeSchedule,
  ErpRewardRecord,
  ErpDisciplineRecord,
  ErpTrainingPlan,
  ErpStaffMember,
} from '../types/erpTypes';
import { getLocalTodayYmd } from '../utils/dateUtils';
import {
  sortByIdTimestamp,
  deduplicateReports,
  isLsxOverdue,
  isLsxNearingDeadline,
  getDeptName,
  getPositionPriority,
} from '../utils/erpDataUtils';

export interface ErpRadarMetrics {
  totalLsxCount: number;
  inProgressLsxCount: number;
  completedLsxCount: number;
  overdueLsx: ErpLsxOrder[];
  nearingDeadlineLsx: ErpLsxOrder[];
  pendingIntakesCount: number;
  pendingIntakes: ErpOrderIntake[];
  todayNewIntakesCount: number;
  todayNewIntakesQuantity: number;
  todayNewIntakes: ErpOrderIntake[];
  pendingProposals: ErpProposal[];
  todayReportsCount: number;
  todayFinishedQuantity: number;
  todayDefectiveQuantity: number;
  activeWorkersToday: number;
  totalPersonnelCount: number;
  onTimeLsxRate: number;
  idleMachinesCount: number;
}

export function useErpData(enabled = true) {
  const [globalMonthFilter, setGlobalMonthFilter] = useState<'CURRENT_MONTH' | 'ALL'>('CURRENT_MONTH');

  const [users, setUsers] = useState<ErpUser[]>([]);
  const [rawPersonnel, setRawPersonnel] = useState<ErpPersonnel[]>([]);
  const [rawHrPersonnel, setRawHrPersonnel] = useState<ErpPersonnel[]>([]);
  const [machines, setMachines] = useState<ErpMachine[]>([]);
  const [intakes, setIntakes] = useState<ErpOrderIntake[]>([]);
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

    const unsubs: Array<() => void> = [];

    const safeSub = <T,>(
      targetRef: any,
      setter: (items: T[]) => void,
      markLoaded = false
    ) => {
      try {
        const u = onSnapshot(
          targetRef,
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

    // ── GIAI ĐOẠN 1: DỮ LIỆU VẬN HÀNH CHÍNH (NẠP NGAY) ────────────────────────
    // 1. Users hệ thống
    safeSub<ErpUser>(collection(db, 'users'), setUsers, true);

    // 2. Tiếp nhận đơn hàng (Intakes) - Đồng bộ chuẩn ProTrack ERP
    safeSub<ErpOrderIntake>(collection(db, 'intakes'), (data) => {
      setIntakes(sortByIdTimestamp(data));
    });

    // 3. Lệnh sản xuất (LSX) - Không cắt xén limit(250), nạp toàn bộ và sắp xếp mới nhất
    safeSub<ErpLsxOrder>(collection(db, 'lsx'), (data) => {
      setLsxOrders(sortByIdTimestamp(data));
    });

    // 4. Báo cáo công đoạn (Reports) - Nạp từ đầu tháng hiện tại hoặc 35 ngày gần nhất
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    safeSub<ErpStageReport>(
      query(collection(db, 'reports'), where('timestamp', '>=', currentMonthStr)),
      (data) => {
        const cleaned = deduplicateReports(data);
        setRecentReports(sortByIdTimestamp(cleaned));
      }
    );

    // 5. Đề xuất nội bộ (Proposals)
    safeSub<ErpProposal>(collection(db, 'proposals'), (data) => {
      setProposals(sortByIdTimestamp(data));
    });

    // ── GIAI ĐOẠN 2: DỮ LIỆU NHÂN SỰ & MÁY MÓC (TRÌ HOÃN 250MS ĐỂ MƯỢT UI) ────
    const timer = setTimeout(() => {
      // Máy móc xưởng
      safeSub<ErpMachine>(collection(db, 'machines'), setMachines);

      // Cả 2 collection nhân sự của ProTrack (personnel xưởng & hr_personnel khối văn phòng)
      safeSub<ErpPersonnel>(collection(db, 'personnel'), setRawPersonnel);
      safeSub<ErpPersonnel>(collection(db, 'hr_personnel'), setRawHrPersonnel);

      // Hành chính nhân sự
      safeSub<ErpLeaveRequest>(collection(db, 'hr_leave_requests'), setLeaveRequests);
      safeSub<ErpOvertimeSchedule>(collection(db, 'hr_overtime'), setOvertimeSchedules);
      safeSub<ErpRewardRecord>(collection(db, 'hr_rewards'), setRewards);
      safeSub<ErpDisciplineRecord>(collection(db, 'hr_disciplines'), setDisciplines);
      safeSub<ErpTrainingPlan>(collection(db, 'training_plans'), setTrainingPlans);
    }, 250);

    return () => {
      clearTimeout(timer);
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
    };
  }, [enabled]);

  // Dữ liệu Nhân sự lấy trực tiếp chuẩn từ Tab Nhân Sự bên ERP (collection 'hr_personnel')
  const personnel = useMemo((): ErpPersonnel[] => {
    // 1. Nguồn chính thức: Hồ sơ Tab Nhân Sự bên ERP (hr_personnel)
    const list: ErpPersonnel[] = rawHrPersonnel.map((p) => ({
      ...p,
      fullName: (p.fullName || p.name || '').trim(),
      role: p.role || p.position || 'Nhân sự',
      department: p.department || 'OTHER',
      status: p.status || 'Official',
      phone: p.phone || '',
      avatarUrl: p.avatarUrl || '',
      skills: p.skills || [],
    }));

    // 2. Dự phòng: Nếu có nhân sự kỹ thuật trong collection 'personnel' mà chưa có trong 'hr_personnel'
    const existingNames = new Set(list.map((p) => (p.fullName || '').toLowerCase()));
    rawPersonnel.forEach((p) => {
      const pName = (p.fullName || p.name || '').trim();
      if (pName && !existingNames.has(pName.toLowerCase())) {
        existingNames.add(pName.toLowerCase());
        list.push({
          ...p,
          fullName: pName,
          department: p.department || 'BP_IN',
          role: p.position || p.role || 'Thợ máy',
          status: 'Official',
          phone: p.phone || '',
        });
      }
    });

    // Sắp xếp chuẩn Tab Nhân Sự ERP: Cấp bậc ưu tiên > Tên tiếng Việt
    return list.sort((a, b) => {
      const prioA = getPositionPriority(a.role);
      const prioB = getPositionPriority(b.role);
      if (prioA !== prioB) return prioA - prioB;
      return (a.fullName || '').localeCompare(b.fullName || '', 'vi');
    });
  }, [rawHrPersonnel, rawPersonnel]);

  // Bộ lọc tháng theo chuẩn ProTrack ERP (globalMonthFilter)
  const filteredLsxList = useMemo(() => {
    if (globalMonthFilter === 'ALL') return lsxOrders;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return lsxOrders.filter((l) =>
      (l.issueDate || '').startsWith(currentMonthStr) ||
      l.deliveryStatus !== 'FULLY_DELIVERED'
    );
  }, [lsxOrders, globalMonthFilter]);

  const filteredIntakes = useMemo(() => {
    if (globalMonthFilter === 'ALL') return intakes;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return intakes.filter((i) =>
      (i.orderDate || '').startsWith(currentMonthStr) ||
      (i.status !== 'Đã ra LSX' && (i.status as any) !== 'READY_FOR_LSX')
    );
  }, [intakes, globalMonthFilter]);

  // Danh bạ nhân sự chuẩn hóa lấy theo Tab Nhân Sự bên ERP
  const staffDirectory = useMemo((): ErpStaffMember[] => {
    return personnel.map((p) => ({
      id: p.id,
      name: p.fullName || p.name || 'Nhân sự',
      role: p.role || 'Nhân sự',
      department: getDeptName(p.department),
      status: p.status || 'Official',
      phone: p.phone || '',
      avatarUrl: p.avatarUrl || '',
      skills: p.skills || [],
    }));
  }, [personnel]);

  // Các chỉ số vận hành Radar từ ERP (Khớp 100% công thức Dashboard của ProTrack ERP)
  const radarMetrics = useMemo((): ErpRadarMetrics => {
    const todayStr = getLocalTodayYmd();

    // 1. Phân loại LSX theo chuẩn ProTrack (Dashboard.tsx dòng 88-101)
    const activeLsx = filteredLsxList.filter((o) => !o.isCancelled && !o.isDeleted);

    // LSX đang chạy: Đã chuyển sản xuất (hoặc có hiệu lực), chưa hủy, chưa giao xong, chưa đóng gói
    const inProgress = activeLsx.filter(
      (o) => o.deliveryStatus !== 'FULLY_DELIVERED' && o.progress !== 'Đã đóng gói'
    );

    // LSX đã hoàn thành: Đã đóng gói xong hoặc đã giao hàng hoàn tất
    const completed = activeLsx.filter(
      (o) => o.progress === 'Đã đóng gói' || o.deliveryStatus === 'FULLY_DELIVERED'
    );

    // Lệnh sản xuất quá hạn & sắp đến hạn
    const overdueLsx = inProgress.filter((o) => isLsxOverdue(o.deliveryDate));
    const nearingDeadlineLsx = inProgress.filter((o) => isLsxNearingDeadline(o.deliveryDate));

    // 2. Tiếp nhận đơn hàng chờ lên lệnh (Intakes Chờ xử lý)
    const pendingIntakes = filteredIntakes.filter(
      (i) => !i.isDeleted && (i.status === 'Chờ xử lý' || (i.status as any) === 'PENDING' || !i.status)
    );

    // Đơn hàng mới tiếp nhận trong ngày hôm nay (từ toàn bộ intakes)
    const todayNewIntakes = intakes.filter((i) => {
      if (i.isDeleted) return false;
      const d = (i.orderDate || i.createdAt || i.timestamp || '').slice(0, 10);
      return d === todayStr;
    });

    const todayNewIntakesQuantity = todayNewIntakes.reduce((sum, i) => {
      const itemsQty = (i.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
      return sum + itemsQty;
    }, 0);

    // 3. Đề xuất nội bộ đang chờ phê duyệt
    const pendingProposals = proposals.filter((p) => p.finalStatus === 'PENDING');

    // 4. Báo cáo công đoạn hôm nay
    const todayReports = recentReports.filter(
      (r) => !r.isDeleted && !r.isPause && r.timestamp && r.timestamp.slice(0, 10) === todayStr
    );
    const todayFinishedQty = todayReports.reduce(
      (sum, r) => sum + (Number(r.finishedQty) || Number(r.finishedNhip) || 0),
      0
    );
    const todayDefectiveQty = todayReports.reduce(
      (sum, r) => sum + (Number(r.defectQty) || Number(r.qtyHao) || 0),
      0
    );

    const workerNames = new Set<string>();
    todayReports.forEach((r) => {
      if (r.workerName) workerNames.add(r.workerName.trim());
      if (r.operatorName) workerNames.add(r.operatorName.trim());
      if (r.assistantName) workerNames.add(r.assistantName.trim());
    });

    // 5. Tính toán máy nghỉ (sẵn sàng)
    const idleMachines = machines.filter((m) => {
      if (m.status !== 'ACTIVE' || m.type === 'PACK') return false;
      const isBusy = inProgress.some((o) => {
        if (o.progress !== 'Đã đóng gói' && (o as any).startedStages) {
          return Object.entries((o as any).startedStages).some(
            ([stageKey, info]: any) => info?.machineId === m.id && !(o as any).completedStages?.[stageKey]
          );
        }
        return false;
      });
      return !isBusy;
    });

    // Tỉ lệ hoàn thành đúng hạn
    const onTimeLsxRate =
      activeLsx.length > 0
        ? Math.round(((activeLsx.length - overdueLsx.length) / activeLsx.length) * 100)
        : 100;

    return {
      totalLsxCount: activeLsx.length,
      inProgressLsxCount: inProgress.length,
      completedLsxCount: completed.length,
      overdueLsx,
      nearingDeadlineLsx,
      pendingIntakesCount: pendingIntakes.length,
      pendingIntakes,
      todayNewIntakesCount: todayNewIntakes.length,
      todayNewIntakesQuantity,
      todayNewIntakes,
      pendingProposals,
      todayReportsCount: todayReports.length,
      todayFinishedQuantity: todayFinishedQty,
      todayDefectiveQuantity: todayDefectiveQty,
      activeWorkersToday: workerNames.size,
      totalPersonnelCount: staffDirectory.length,
      onTimeLsxRate,
      idleMachinesCount: idleMachines.length,
    };
  }, [filteredLsxList, filteredIntakes, intakes, proposals, recentReports, machines, staffDirectory.length]);

  return {
    isLoaded,
    error,
    users,
    personnel,
    machines,
    intakes,
    filteredIntakes,
    lsxOrders,
    filteredLsxList,
    recentReports,
    proposals,
    leaveRequests,
    overtimeSchedules,
    rewards,
    disciplines,
    trainingPlans,
    staffDirectory,
    radarMetrics,
    globalMonthFilter,
    setGlobalMonthFilter,
  };
}
