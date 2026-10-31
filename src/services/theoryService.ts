import { FrameworkCode } from '../data/managementFrameworksTheory';
import { AxisTabId } from '../types/axisTypes';

export const FRAMEWORK_TOOL_TARGET: Record<
  FrameworkCode,
  { tab: AxisTabId; subTab: string; label: string }
> = {
  SMART: { tab: 'execution', subTab: 'SMART', label: 'Giao Việc & Cải Tiến › Giao việc SMART' },
  PDCA: { tab: 'execution', subTab: 'PDCA', label: 'Giao Việc & Cải Tiến › Xử lý sự cố PDCA' },
  '3-6-9': { tab: 'meetings', subTab: 'MEETINGS', label: 'Họp & Chỉ Đạo › Điều phối Họp 3-6-9' },
  PREP: { tab: 'meetings', subTab: 'PREP', label: 'Họp & Chỉ Đạo › Soạn chỉ đạo PREP' },
  OKR: { tab: 'strategy', subTab: 'OKR', label: 'Mục Tiêu & Chiến Lược › Quản trị OKR' },
  SWOT: { tab: 'strategy', subTab: 'SWOT', label: 'Mục Tiêu & Chiến Lược › Phân tích SWOT' },
  MASLOW: { tab: 'people', subTab: 'MASLOW', label: 'Đội Ngũ & Nhân Sự › Động lực Maslow 1-1' },
  FFC: { tab: 'people', subTab: 'FFC', label: 'Đội Ngũ & Nhân Sự › Khen ngợi FFC' },
};

type TheoryEventListener = (code: FrameworkCode, mode: 'DRAWER' | 'FULL_TAB') => void;

const listeners = new Set<TheoryEventListener>();
let currentFrameworkCode: FrameworkCode = 'SMART';

export const theoryService = {
  /**
   * Mở ngăn kéo tra cứu nhanh ngay bên cạnh màn hình/modal đang làm việc (không làm mất dữ liệu đang nhập)
   */
  open: (code: FrameworkCode = 'SMART') => {
    currentFrameworkCode = code;
    listeners.forEach((fn) => fn(code, 'DRAWER'));
  },
  /**
   * Chuyển hẳn sang Tab Thư Viện Phương Pháp toàn màn hình
   */
  openFullTab: (code: FrameworkCode = 'SMART') => {
    currentFrameworkCode = code;
    listeners.forEach((fn) => fn(code, 'FULL_TAB'));
  },
  getCurrentCode: () => currentFrameworkCode,
  setCurrentCode: (code: FrameworkCode) => {
    currentFrameworkCode = code;
  },
  subscribe: (listener: TheoryEventListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
