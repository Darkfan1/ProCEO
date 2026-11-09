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
    title: 'Bảng Điều Hành',
    subtitle: '',
  },
  cockpit: {
    title: 'Bảng Điều Hành',
    subtitle: '',
  },
  'swot-tows': {
    title: 'Chiến Lược',
    subtitle: 'Công cụ SWOT & TOWS',
  },
  okr: {
    title: 'Mục Tiêu Chiến Lược',
    subtitle: 'Phương pháp OKR',
  },
  smart: {
    title: 'Mục Tiêu Định Lượng',
    subtitle: 'Tiêu chuẩn SMART',
  },
  tasks: {
    title: 'Lịch Trình & Tác Vụ',
    subtitle: 'Nguyên tắc DRI',
  },
  execution: {
    title: 'Hệ Thống Thực Thi',
    subtitle: 'Chu trình khép kín: SMART ➔ PDCA ➔ Họp 3-6-9',
  },
  pdca: {
    title: 'Cải Tiến & Chuẩn Hóa',
    subtitle: 'Chu trình PDCA & SOP',
  },
  meetings: {
    title: 'Họp Giao Ban',
    subtitle: 'Nguyên tắc 3-6-9',
  },
  prep: {
    title: 'Truyền Thông Điều Hành',
    subtitle: 'Cấu trúc PREP',
  },
  people: {
    title: 'Nhân Sự & Động Lực',
    subtitle: 'Mô hình Maslow & FFC',
  },
  copilot: {
    title: 'Trợ Lý',
    subtitle: 'Cố vấn điều hành AI',
  },
  settings: {
    title: 'Cài Đặt Hệ Thống',
    subtitle: 'Sao lưu & Phân quyền',
  },
  'erp-bridge': {
    title: 'Vận Hành Sản Xuất',
    subtitle: 'Dữ liệu ERP MVĐN',
  },
  'mindset-hub': {
    title: 'Sổ Tay Tri Thức Quản Trị',
    subtitle: 'Phương pháp luận điều hành C-Level',
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
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shrink-0 z-20 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
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
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight truncate">
              {currentTabInfo.title}
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700">
              {operatingMode === 'PERSONAL' ? 'Cá nhân' : 'Doanh nghiệp'}
            </span>
          </div>
          {currentTabInfo.subtitle ? (
            <p className="hidden md:block text-[11px] text-slate-500 truncate max-w-xl">
              {currentTabInfo.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {/* CỘT PHẢI: NGÀY & HỒ SƠ LÃNH ĐẠO */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 border border-slate-200/80 text-[11px] font-mono text-slate-600 font-semibold">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{todayYmd}</span>
        </div>

        {/* Avatar Profile CEO */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white border border-white/20 shadow-xs"
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            }}
          >
            V
          </div>
          <span className="hidden xl:inline text-xs font-bold text-slate-800">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
};
