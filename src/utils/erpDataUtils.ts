import {
  ErpLsxOrder,
  ErpOrderIntake,
  ErpStageReport,
} from '../types/erpTypes';

/**
 * Sắp xếp danh sách theo thời gian hoặc ID giảm dần (mới nhất lên đầu)
 * Đồng bộ chuẩn thuật toán của ProTrack ERP (useAppData.ts)
 */
export const sortByIdTimestamp = <
  T extends {
    id: string;
    timestamp?: string;
    createdAt?: string;
    updatedAt?: string;
    endTime?: string;
    startTime?: string;
    orderDate?: string;
    issueDate?: string;
  }
>(
  list: T[]
): T[] => {
  return [...list].sort((a, b) => {
    const timeAStr =
      a.timestamp ||
      a.createdAt ||
      a.issueDate ||
      a.orderDate ||
      a.endTime ||
      a.startTime ||
      a.updatedAt;
    const timeBStr =
      b.timestamp ||
      b.createdAt ||
      b.issueDate ||
      b.orderDate ||
      b.endTime ||
      b.startTime ||
      b.updatedAt;

    if (timeAStr && timeBStr) {
      const dateA = new Date(timeAStr).getTime();
      const dateB = new Date(timeBStr).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateB - dateA;
      }
    }

    const getTimestampFromId = (idStr: string) => {
      const longNum = idStr?.match(/\d{8,}/);
      if (longNum) return parseInt(longNum[0], 10);
      const match = idStr?.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const idTimeA = getTimestampFromId(a.id);
    const idTimeB = getTimestampFromId(b.id);
    if (idTimeA !== idTimeB) {
      return idTimeB - idTimeA;
    }

    return (b.id || '').localeCompare(a.id || '');
  });
};

/**
 * Lấy tên sản phẩm / danh sách mặt hàng của LSX
 */
export const getLsxItemName = (l: ErpLsxOrder): string => {
  if (l.items && l.items.length > 0) {
    const names = l.items.map((it) => it.name).filter(Boolean);
    if (names.length > 0) return names.join(', ');
  }
  return l.itemName || l.productCode || l.customer || '—';
};

/**
 * Lấy tổng số lượng sản phẩm của LSX
 */
export const getLsxTotalQuantity = (l: ErpLsxOrder): number => {
  if (l.items && l.items.length > 0) {
    return l.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }
  return Number(l.quantity) || 0;
};

/**
 * Lấy đơn vị tính của LSX
 */
export const getLsxUnit = (l: ErpLsxOrder): string => {
  if (l.items && l.items.length > 0 && l.items[0]?.unit) {
    return l.items[0].unit;
  }
  return l.unit || 'con/nhãn';
};

/**
 * Kiểm tra xem LSX có đang trong quá trình sản xuất thực tế không
 * Chuẩn ProTrack ERP: Chưa hủy, Chưa xóa, Chưa giao hết và Chưa đóng gói hoàn tất
 */
export const isLsxInProduction = (l: ErpLsxOrder): boolean => {
  if (l.isCancelled || l.isDeleted) return false;
  const isDelivered = l.deliveryStatus === 'FULLY_DELIVERED';
  const isPackaged = l.progress === 'Đã đóng gói';
  return !isDelivered && !isPackaged;
};

/**
 * Kiểm tra xem LSX đã hoàn thành sản xuất hoặc đã giao xong chưa
 */
export const isLsxCompleted = (l: ErpLsxOrder): boolean => {
  if (l.isCancelled || l.isDeleted) return false;
  return l.deliveryStatus === 'FULLY_DELIVERED' || l.progress === 'Đã đóng gói';
};

/**
 * Kiểm tra đơn có bị quá hạn giao hàng không (so với ngày hôm nay)
 */
export const isLsxOverdue = (dateStr?: string): boolean => {
  if (!dateStr || dateStr === '---' || dateStr === 'N/A') return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
};

/**
 * Kiểm tra đơn có sắp đến hạn giao hàng (trong vòng 0 đến 2 ngày tới) không
 */
export const isLsxNearingDeadline = (dateStr?: string): boolean => {
  if (!dateStr || dateStr === '---' || dateStr === 'N/A') return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 2;
};

/**
 * Tính số ngày còn lại đến hạn giao (số âm nghĩa là đã trễ X ngày)
 */
export const getLsxDaysRemaining = (dateStr?: string): number => {
  if (!dateStr || dateStr === '---' || dateStr === 'N/A') return 999;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Tên và thông tin chi tiết các mặt hàng trong Đơn tiếp nhận (Intake)
 */
export const getIntakeItemName = (i: ErpOrderIntake): string => {
  if (i.items && i.items.length > 0) {
    const names = i.items.map((it) => it.name).filter(Boolean);
    if (names.length > 0) return names.join(', ');
  }
  return i.customer || '—';
};

export const getIntakeTotalQuantity = (i: ErpOrderIntake): number => {
  if (i.items && i.items.length > 0) {
    return i.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  }
  return 0;
};

/**
 * Khử trùng lặp báo cáo công đoạn (tương thích ProTrack useAppData.ts)
 */
export const deduplicateReports = (rawReports: ErpStageReport[]): ErpStageReport[] => {
  const uniqueReports: ErpStageReport[] = [];

  for (const r of rawReports) {
    if (!r || r.isDeleted) continue;

    const existingIndex = uniqueReports.findIndex((u) => {
      if (u.id === r.id) return true;
      const sameLsx =
        (u.lsxId && r.lsxId && String(u.lsxId) === String(r.lsxId)) ||
        (u.lsxCode && r.lsxCode && u.lsxCode === r.lsxCode);
      if (!sameLsx) return false;
      if (u.stage !== r.stage) return false;
      if (Boolean(u.isPause) !== Boolean(r.isPause)) return false;

      const sameMachine = (u.machineId || '') === (r.machineId || '');
      const sameWorker =
        (u.workerName || '').trim().toLowerCase() === (r.workerName || '').trim().toLowerCase();

      const timeU = new Date(u.timestamp || 0).getTime();
      const timeR = new Date(r.timestamp || 0).getTime();
      const isCloseTimestamp =
        !isNaN(timeU) && !isNaN(timeR) && Math.abs(timeU - timeR) <= 60000;

      if (sameMachine && sameWorker && isCloseTimestamp) {
        return (u.finishedQty || 0) === (r.finishedQty || 0);
      }
      return false;
    });

    if (existingIndex === -1) {
      uniqueReports.push(r);
    }
  }

  return uniqueReports;
};

/**
 * Tên phòng ban chuẩn tiếng Việt theo Tab Nhân Sự ProTrack ERP
 */
export const getDeptName = (dept?: string): string => {
  if (!dept) return 'Nội bộ';
  switch (dept) {
    case 'BAN_GIAM_DOC':
      return 'Ban Giám Đốc';
    case 'QUAN_LY_SAN_XUAT':
      return 'Quản Lý Sản Xuất';
    case 'KE_TOAN':
      return 'Kế Toán';
    case 'VAN_PHONG':
      return 'Kinh Doanh';
    case 'THIET_KE_KY_THUAT':
      return 'Thiết kế & Kỹ thuật';
    case 'BP_KHO':
      return 'Kho & Mua Hàng';
    case 'BP_IN':
      return 'Bộ Phận In';
    case 'BP_BE':
      return 'Bộ Phận Bế';
    case 'BP_KIEM_TEM_XE_CUON':
      return 'Kiểm Tem & Xẻ Cuộn';
    case 'BP_DONG_GOI':
      return 'Bộ Phận Đóng Gói';
    case 'BP_HAU_CAN':
      return 'Bộ Phận Hậu Cần';
    case 'DIEU_PHOI_GIAO_HANG':
      return 'Điều Phối Giao Hàng';
    case 'BP_GIAO_NHAN':
      return 'Bộ Phận Giao Nhận';
    case 'OTHER':
      return 'Bộ Phận Khác';
    default:
      return dept;
  }
};

/**
 * Tên trạng thái công tác theo Tab Nhân Sự ProTrack ERP
 */
export const getStatusName = (status?: string): string => {
  if (!status) return 'Chính Thức';
  switch (status) {
    case 'Trainee':
      return 'Thử Việc';
    case 'Official':
      return 'Chính Thức';
    case 'Suspended':
      return 'Đình Chỉ';
    case 'Resigned':
      return 'Đã Nghỉ';
    default:
      return status;
  }
};

/**
 * Thứ tự ưu tiên chức danh hiển thị trong sơ đồ tổ chức & danh bạ
 * Chuẩn thuật toán từ Tab Nhân Sự ProTrack (PersonnelTab.tsx)
 */
export const getPositionPriority = (role?: string): number => {
  if (!role) return 99;
  const r = role.trim().toLowerCase();

  // 1. Ban Giám đốc
  if ((r === 'giám đốc' || r.includes('giám đốc')) && !r.includes('phó') && !r.includes('ceo')) return 1;
  if (r.includes('ceo') || r.includes('chủ tịch')) return 2;
  if (r.includes('phó giám đốc') || r.includes('phó gd')) return 3;

  // 2. Quản lý sản xuất / Trưởng phòng
  if ((r.includes('quản lý sản xuất') || r === 'qlsx' || r.includes('prod_manager')) && !r.includes('phó')) return 10;
  if (r.includes('phó quản lý sản xuất') || r.includes('phó qlsx') || r.includes('phó quản lý')) return 11;
  if (r.includes('trưởng phòng') || r.includes('trưởng bộ phận')) return 15;
  if (r.includes('phó phòng') || r.includes('phó bộ phận')) return 16;
  if (r.includes('điều phối') || r.includes('giám sát')) return 18;

  // 3. Kế toán
  if (r.includes('kế toán trưởng') || r.includes('trưởng phòng kế toán')) return 20;
  if (r.includes('kế toán')) return 21;

  // 4. Tổ trưởng / Trưởng ca
  if (r.includes('tổ trưởng')) return 30;
  if (r.includes('tổ phó')) return 31;
  if (r.includes('trưởng ca')) return 32;

  // 5. Chuyên môn / Kỹ thuật / Sales
  if (r.includes('thiết kế') || r.includes('designer') || r.includes('kỹ thuật')) return 40;
  if (r.includes('sales admin')) return 44;
  if (r.includes('sales') || r.includes('kinh doanh')) return 45;

  // 6. Thợ chính / Vận hành máy
  if (r.includes('thợ in chính') || r.includes('vận hành máy') || r.includes('thợ bế chính') || r.includes('quản lý kho')) return 50;
  if (r.includes('thợ in') || r.includes('thợ bế') || r.includes('thợ xẻ') || r.includes('qc') || r.includes('kiểm tem')) return 55;

  // 7. Nhân viên / Thợ phụ
  if (r.includes('nhân viên')) return 60;
  if (r.includes('thợ phụ')) return 65;

  return 80;
};

