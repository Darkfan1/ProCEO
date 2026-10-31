import { AxisMeeting, AxisPdcaCycle, AxisTrainingSession, MaslowTierKey } from '../types/axisTypes';

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

export const PDCA_PHASE_LABELS: Record<AxisPdcaCycle['currentPhase'], string> = {
  PLAN: '1. Lập kế hoạch (Plan)',
  DO: '2. Làm thử nghiệm (Do)',
  CHECK: '3. Kiểm tra hiệu quả (Check)',
  ACT: '4. Chuẩn hóa quy trình (Act)',
  STANDARDIZED: 'Đã chuẩn hóa vào Đào tạo ERP',
};

export const PDCA_NEXT_PHASE: Partial<
  Record<AxisPdcaCycle['currentPhase'], AxisPdcaCycle['currentPhase']>
> = {
  PLAN: 'DO',
  DO: 'CHECK',
  CHECK: 'ACT',
};

export const MASLOW_TIER_LABELS: Record<MaslowTierKey, string> = {
  PHYSIOLOGICAL: 'Tầng 1: Thu nhập & Sức khỏe',
  SAFETY: 'Tầng 2: An toàn & Ổn định',
  BELONGING: 'Tầng 3: Gắn kết tập thể',
  ESTEEM: 'Tầng 4: Tôn trọng & Ghi nhận',
  SELF_ACTUALIZATION: 'Tầng 5: Tự chủ & Phát triển',
};

export const MEETING_TYPE_LABELS: Record<AxisMeeting['meetingType'], string> = {
  MEETING_369: 'Họp điều hành 3-6-9',
  DAILY_BRIEF: 'Giao ban nhanh đầu ngày',
  STRATEGY: 'Họp Chiến lược & OKR',
  ONE_ON_ONE: 'Trao đổi 1-1 nhân sự',
  TRAINING: 'Đào tạo & Chia sẻ nội bộ',
};

export const TRAINING_TAG_LABELS: Record<AxisTrainingSession['frameworkTag'], string> = {
  '3-6-9': 'Kỷ luật Họp & Giám sát 3-6-9',
  PREP: 'Báo cáo gãy gọn PREP',
  SMART: 'Giao & Nhận việc SMART',
  PDCA: 'Cải tiến quy trình PDCA',
  FFC: 'Văn hóa ghi nhận FFC',
  OKR: 'Tư duy mục tiêu OKR',
  MASLOW: 'Thấu hiểu động lực Maslow',
  SWOT: 'Phân tích chiến lược SWOT',
  SKILL: 'Kỹ năng chuyên môn nhà máy',
};

