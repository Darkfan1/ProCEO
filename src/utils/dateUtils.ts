/**
 * Lấy chuỗi YYYY-MM-DD theo đúng múi giờ địa phương (tránh lỗi lệch ngày trước 07:00 sáng giờ VN khi dùng toISOString)
 */
export function getLocalTodayYmd(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Cộng/trừ số ngày theo múi giờ địa phương và trả về YYYY-MM-DD
 */
export function addLocalDaysYmd(days: number, baseYmd?: string): string {
  const d = baseYmd ? parseLocalYmd(baseYmd) : new Date();
  d.setDate(d.getDate() + days);
  return getLocalTodayYmd(d);
}

/**
 * Parse chuỗi YYYY-MM-DD thành Date ở múi giờ địa phương (00:00:00)
 */
export function parseLocalYmd(ymd: string): Date {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}/.test(ymd)) return new Date();
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Số ngày chênh lệch từ hôm nay tới targetYmd (< 0: đã quá hạn, 0: hôm nay, > 0: còn X ngày)
 */
export function daysDiffFromToday(targetYmd: string, todayYmd = getLocalTodayYmd()): number {
  if (!targetYmd) return 0;
  const target = parseLocalYmd(targetYmd);
  const today = parseLocalYmd(todayYmd);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Định dạng nhãn hạn chót tương đối
 */
export function formatRelativeDueBadge(targetYmd: string, todayYmd = getLocalTodayYmd()): {
  text: string;
  tone: 'overdue' | 'today' | 'soon' | 'normal';
} {
  const diff = daysDiffFromToday(targetYmd, todayYmd);
  if (diff < 0) {
    return { text: `Quá hạn ${Math.abs(diff)} ngày`, tone: 'overdue' };
  }
  if (diff === 0) {
    return { text: 'Đến hạn hôm nay', tone: 'today' };
  }
  if (diff <= 2) {
    return { text: `Còn ${diff} ngày`, tone: 'soon' };
  }
  return { text: targetYmd, tone: 'normal' };
}

/**
 * Định dạng số thành chuỗi phân cách hàng nghìn kiểu Việt Nam
 */
export function formatNumberVi(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return '0';
  return new Intl.NumberFormat('vi-VN').format(n);
}
