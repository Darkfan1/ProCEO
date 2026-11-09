import React from 'react';
import {
  Menu,
  Calendar,
} from 'lucide-react';
import { CeoTabId, OperatingMode } from '../../types/ceoTypes';
import { getLocalTodayYmd } from '../../utils/dateUtils';

interface ExecutiveTopbarProps {
  activeTab: CeoTabId;
  onOpenMobileMenu: () => void;
  operatingMode: OperatingMode;
  userName?: string;
}

const TAB_TITLES: Record<CeoTabId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Bảng Điều Hành CEO',
    subtitle: 'Trung tâm Quyết Định • Dải Mục Tiêu Chiến Lược • Cảnh Báo Quy Tắc',
  },
  cockpit: {
    title: 'Bảng Điều Hành CEO',
    subtitle: 'Trung tâm Quyết Định • Dải Mục Tiêu Chiến Lược • Cảnh Báo Quy Tắc',
  },
  prep: {
    title: 'Tầng 1: Nhiệm Vụ & PREP',
    subtitle: 'Chỉ thị CEO cấu trúc PREP • Single DRI tối cao • Phân rã 4 tầng',
  },
  okr: {
    title: 'Tầng 2: Mục Tiêu Chiến Lược OKR',
    subtitle: 'Mục tiêu định tính & Key Results đo được (Baseline ➔ Target)',
  },
  pdca: {
    title: 'Tầng 3: Sáng Kiến Cải Tiến PDCA',
    subtitle: 'Chu trình Plan ➔ Do ➔ Check ➔ Act ➔ Chuẩn hóa SOP',
  },
  tasks: {
    title: 'Tầng 4: Tác Vụ Thực Thi DRI & RACI',
    subtitle: '1 Single DRI bắt buộc • Cam kết SLA 24h • Báo điểm nghẽn Blocker',
  },
  andon: {
    title: 'Sự Cố Andon Số & 5 Whys',
    subtitle: 'Báo sự cố khẩn cấp • Dán ảnh clipboard • Phân tích nguyên nhân 5 Whys',
  },
  'swot-tows': {
    title: 'Chiến Lược SWOT & TOWS',
    subtitle: 'Phân tích ma trận cạnh tranh • Chuyển hóa điểm yếu thành hành động',
  },
  smart: {
    title: 'Mục Tiêu Định Lượng SMART',
    subtitle: 'Tiêu chuẩn SMART 5 chiều • Đo lường tiến độ định kỳ',
  },
  execution: {
    title: 'Hệ Thống Thực Thi',
    subtitle: 'Chu trình khép kín: SMART ➔ PDCA ➔ Họp 3-6-9',
  },
  meetings: {
    title: 'Họp Giao Ban Điều Hành 3-6-9',
    subtitle: '30 phút trọng tâm • Ban hành nghị quyết & giao việc ngay cho DRI',
  },
  people: {
    title: 'Nhân Sự & Động Lực',
    subtitle: 'Mô hình Maslow 5 tầng nhu cầu & Khen ngợi FFC kịp thời',
  },
  copilot: {
    title: 'Trợ Lý Điều Hành C-Level (AI Copilot)',
    subtitle: 'Cố vấn chiến lược & phân tích đa chiều realtime',
  },
  settings: {
    title: 'Cài Đặt Hệ Thống',
    subtitle: 'Sao lưu dữ liệu, phân quyền & tùy chỉnh giao diện',
  },
  'erp-bridge': {
    title: 'Vận Hành Sản Xuất ERP',
    subtitle: 'Dữ liệu realtime 123 lệnh sản xuất & tiến độ nhà máy MVĐN',
  },
  'mindset-hub': {
    title: 'Sổ Tay Tri Thức Quản Trị C-Level',
    subtitle: '8 Phương pháp luận quản trị doanh nghiệp & vận hành tinh gọn',
  },
};

export const ExecutiveTopbar: React.FC<ExecutiveTopbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  operatingMode,
  userName = 'Tôn Đông Vũ • CEO',
}) => {
  const todayYmd = getLocalTodayYmd();
  const currentTabInfo = TAB_TITLES[activeTab] || {
    title: 'ProCEO',
    subtitle: 'Personal Executive Management System',
  };

  return (
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shrink-0 z-20 shadow-[0_1px_3px_0_rgba(15,23,42,0.02)]">
      {/* CỘT TRÁI: MOBILE TOGGLE & TIÊU ĐỀ PHÂN HỆ */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight truncate">
              {currentTabInfo.title}
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 border border-slate-200/80 text-slate-700">
              {operatingMode === 'PERSONAL' ? 'Cá nhân' : 'Doanh nghiệp'}
            </span>
          </div>
          {currentTabInfo.subtitle ? (
            <p className="hidden md:block text-xs text-slate-500 truncate max-w-xl font-normal">
              {currentTabInfo.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {/* CỘT PHẢI: NGÀY & HỒ SƠ LÃNH ĐẠO */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-600 font-semibold shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{todayYmd}</span>
        </div>

        {/* Avatar Profile CEO */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white border border-white/20 shadow-xs"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            }}
          >
            V
          </div>
          <span className="hidden xl:inline text-xs font-semibold text-slate-800">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
};
