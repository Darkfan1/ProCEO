import React, { useState, useEffect } from 'react';
import {
  Compass,
  Target,
  TrendingUp,
  HeartHandshake,
  MessageSquareQuote,
  Bell,
  BellRing,
  LogOut,
  Cloud,
  Database,
  Volume2,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AxisTabId, ErpUser } from '../types/axisTypes';
import { AxisLogo } from './common/AxisLogo';
import { theoryService } from '../services/theoryService';
import { dialogService } from './common/CustomDialog';

interface AxisLayoutProps {
  activeTab: AxisTabId;
  setActiveTab: (tab: AxisTabId) => void;
  currentUser: ErpUser;
  onLogout: () => void;
  cloudSynced: boolean;
  erpConnected: boolean;
  notifPermission: NotificationPermission;
  onRequestNotif: () => void;
  onTestChime: () => void;
  badges: {
    todayCount: number;
    executionCount: number;
    meetingsCount?: number;
  };
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: AxisTabId;
  label: string;
  shortLabel: string;
  sub: string;
  icon: React.FC<{ size?: number; className?: string }>;
}> = [
  {
    id: 'today',
    label: 'Hôm Nay',
    shortLabel: 'Hôm nay',
    sub: 'Bàn điều hành & Việc cần duyệt',
    icon: Compass,
  },
  {
    id: 'execution',
    label: 'Giao Việc & Cải Tiến',
    shortLabel: 'Giao việc',
    sub: 'Theo dõi đầu việc • Xử lý sự cố',
    icon: Target,
  },
  {
    id: 'meetings',
    label: 'Họp & Chỉ Đạo',
    shortLabel: 'Họp & Chỉ đạo',
    sub: 'Điều phối họp • Thông báo nội bộ',
    icon: MessageSquareQuote,
  },
  {
    id: 'strategy',
    label: 'Mục Tiêu & Chiến Lược',
    shortLabel: 'Mục tiêu',
    sub: 'OKR trọng tâm • Vị thế SWOT',
    icon: TrendingUp,
  },
  {
    id: 'people',
    label: 'Đội Ngũ & Nhân Sự',
    shortLabel: 'Nhân sự',
    sub: 'Động lực 1-1 • Khen thưởng • Đào tạo',
    icon: HeartHandshake,
  },
  {
    id: 'theory',
    label: 'Thư Viện Phương Pháp',
    shortLabel: 'Phương pháp',
    sub: 'Cẩm nang 8 nguyên tắc CEO',
    icon: BookOpen,
  },
];

export const AxisLayout: React.FC<AxisLayoutProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  cloudSynced,
  erpConnected,
  notifPermission,
  onRequestNotif,
  onTestChime,
  badges,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('axis_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isWideLayout, setIsWideLayout] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('axis_wide_layout');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('axis_sidebar_collapsed', String(isSidebarCollapsed));
    } catch {
      // ignore
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem('axis_wide_layout', String(isWideLayout));
    } catch {
      // ignore
    }
  }, [isWideLayout]);

  // Phím tắt toàn cục Ctrl + B / Cmd + B để gập/mở sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeNav = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];
  const ActiveNavIcon = activeNav.icon;

  return (
    <div className="min-h-screen w-full bg-[#F5F6F9] text-[#0F1E32] flex flex-col md:flex-row antialiased selection:bg-[#C69C47]/20 selection:text-[#0C1B2E]">
      {/* Desktop Left Navigation Rail (macOS Translucent Sidebar) */}
      <aside
        className={`hidden md:flex shrink-0 macos-sidebar flex-col justify-between sticky top-0 h-screen z-30 transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'w-[74px]' : 'w-[258px]'
        }`}
      >
        <div>
          {/* macOS Titlebar & Traffic Lights */}
          <div
            className={`pt-4 pb-3.5 border-b border-black/[0.06] flex items-center transition-all ${
              isSidebarCollapsed ? 'px-3 flex-col gap-3 justify-center' : 'px-4 justify-between'
            }`}
          >
            {/* macOS 26 Window Traffic Lights */}
            <div className="flex items-center gap-2 group/traffic py-1">
              <button
                onClick={() => dialogService.toast('AXIS CEO Operating System • macOS 26 Edition', 'info')}
                title="Hệ điều hành CEO AXIS"
                className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
              >
                <span className="opacity-0 group-hover/traffic:opacity-100 text-[8px] font-bold text-[#4D0000] leading-none select-none">
                  ×
                </span>
              </button>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? 'Mở rộng thanh bên (Ctrl+B)' : 'Thu gọn thanh bên (Ctrl+B)'}
                className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
              >
                <span className="opacity-0 group-hover/traffic:opacity-100 text-[8px] font-bold text-[#5F3B00] leading-none select-none">
                  −
                </span>
              </button>
              <button
                onClick={() => setIsWideLayout(!isWideLayout)}
                title={isWideLayout ? 'Thu hẹp không gian viền' : 'Mở rộng tối đa không gian'}
                className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
              >
                <span className="opacity-0 group-hover/traffic:opacity-100 text-[7px] font-bold text-[#0D4B12] leading-none select-none">
                  +
                </span>
              </button>
            </div>

            {/* Sidebar Collapse Button */}
            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                title="Thu gọn thanh điều hướng (Ctrl+B)"
                className="p-1 rounded-lg text-slate-400 hover:text-[#0C1B2E] hover:bg-black/[0.05] transition-colors cursor-pointer"
              >
                <PanelLeftClose size={15} />
              </button>
            )}
          </div>

          {/* Logo & App Brand Header */}
          <div
            className={`py-3.5 border-b border-black/[0.05] transition-all ${
              isSidebarCollapsed ? 'px-2 flex justify-center' : 'px-4 flex items-center justify-between'
            }`}
          >
            <div className="flex items-center min-w-0 overflow-hidden">
              <AxisLogo
                size={isSidebarCollapsed ? 32 : 36}
                showWordmark={!isSidebarCollapsed}
                subtitle="TRỤC ĐIỀU PHỐI CEO"
              />
            </div>
          </div>

          {/* Nav Items */}
          <div className="pt-3 pb-2">
            {!isSidebarCollapsed && (
              <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 select-none">
                Luồng Công Việc Điều Hành
              </div>
            )}
            <nav className={`space-y-1 transition-all ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badgeVal =
                  item.id === 'today'
                    ? badges.todayCount
                    : item.id === 'execution'
                    ? badges.executionCount
                    : item.id === 'meetings'
                    ? badges.meetingsCount || 0
                    : 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={isSidebarCollapsed ? `${item.label} — ${item.sub}` : undefined}
                    className={`w-full flex items-center rounded-xl text-left transition-all cursor-pointer relative group ${
                      isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-[#0C1B2E] text-white shadow-[0_2px_8px_rgba(12,27,46,0.18)] font-semibold'
                        : 'text-slate-600 hover:bg-black/[0.045] hover:text-[#0C1B2E]'
                    }`}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                      <Icon
                        size={17}
                        className={isActive ? 'text-[#E5C472] shrink-0' : 'text-slate-400 shrink-0 group-hover:text-[#0C1B2E]'}
                      />
                      {!isSidebarCollapsed && (
                        <div className="truncate">
                          <div className="text-[13px] font-semibold leading-tight">{item.label}</div>
                          <div
                            className={`text-[10px] mt-0.5 truncate ${
                              isActive ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {item.sub}
                          </div>
                        </div>
                      )}
                    </div>
                    {badgeVal > 0 && (
                      <span
                        className={`${
                          isSidebarCollapsed
                            ? 'absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 text-[9px] flex items-center justify-center'
                            : 'ml-2 px-1.5 py-0.5 text-[10px]'
                        } font-extrabold rounded-full tabular-nums ${
                          isActive
                            ? 'bg-[#C69C47] text-[#0C1B2E]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {badgeVal}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* macOS Status & CEO Profile Footer */}
        <div className={`border-t border-black/[0.06] transition-all ${isSidebarCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-2.5'}`}>
          {isSidebarCollapsed ? (
            /* Collapsed Footer: Compact macOS Icon Buttons */
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl bg-white/80 border border-black/[0.07] flex items-center justify-center cursor-help shadow-2xs"
                title={`ERP: ${erpConnected ? 'Realtime Kết nối' : 'Đang nối...'} | AXIS: ${cloudSynced ? 'Cloud Synced' : 'Local Safe'}`}
              >
                <span className={`w-2 h-2 rounded-full ${erpConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              </div>

              <button
                onClick={notifPermission === 'granted' ? onTestChime : onRequestNotif}
                title={notifPermission === 'granted' ? 'Chuông nhắc việc: BẬT (Click để thử chuông)' : 'Bật chuông nhắc việc'}
                className="w-8 h-8 rounded-xl bg-white/80 border border-black/[0.07] hover:bg-white flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              >
                <Volume2 size={14} className={notifPermission === 'granted' ? 'text-[#C69C47]' : 'text-slate-400'} />
              </button>

              <button
                onClick={onLogout}
                title="Đăng xuất khỏi hệ thống"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            /* Expanded Footer: Frosted Glass Panel */
            <>
              {/* Connection & Reminder Bell Box */}
              <div className="p-2.5 rounded-xl bg-white/80 border border-black/[0.06] space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Database size={11} className="text-emerald-600" />
                    ProTrack ERP
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      erpConnected ? 'text-emerald-700' : 'text-amber-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        erpConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    {erpConnected ? 'Realtime' : 'Đang nối...'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Cloud size={11} className={cloudSynced ? 'text-sky-600' : 'text-amber-600'} />
                    Dữ liệu AXIS
                  </span>
                  <span
                    className={`font-semibold ${
                      cloudSynced ? 'text-sky-700' : 'text-amber-700'
                    }`}
                  >
                    {cloudSynced ? 'Cloud Sync' : 'Local Safe'}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-black/[0.05] flex items-center justify-between gap-1.5">
                  {notifPermission === 'granted' ? (
                    <button
                      onClick={onTestChime}
                      className="flex-1 py-1 px-2 rounded-lg bg-white border border-black/[0.07] hover:border-black/[0.12] text-[10.5px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs active:scale-[0.98]"
                      title="Nghe thử âm báo nhắc lịch"
                    >
                      <Volume2 size={11} className="text-[#C69C47]" />
                      <span>Chuông: Bật</span>
                    </button>
                  ) : (
                    <button
                      onClick={onRequestNotif}
                      className="flex-1 py-1 px-2 rounded-lg bg-[#0C1B2E] text-white text-[10.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#162B47] active:scale-[0.98] shadow-2xs"
                    >
                      <BellRing size={11} className="text-[#E5C472]" />
                      <span>Bật chuông</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-[9px] bg-[#0C1B2E] text-[#E5C472] font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                    {(currentUser.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-bold text-[#0C1B2E] truncate">
                      {currentUser.name || 'CEO'}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9D772B]">
                      {currentUser.role === 'ADMIN' ? 'CEO / Ban Giám Đốc' : currentUser.role}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop Workspace Top Toolbar (macOS Frosted Topbar) */}
        <header className="hidden md:flex sticky top-0 z-20 macos-topbar px-6 py-2.5 items-center justify-between">
          {/* Left: Quick toggle & macOS Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                title="Mở rộng thanh điều hướng (Ctrl+B)"
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#0C1B2E] hover:bg-black/[0.05] transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftOpen size={17} />
              </button>
            )}
            <div className="flex items-center gap-2 text-[13px] truncate">
              <span className="font-extrabold text-slate-400 tracking-wider uppercase text-[10.5px] shrink-0">
                AXIS CEO
              </span>
              <span className="text-slate-300 font-bold shrink-0">›</span>
              <span className="font-bold text-[#0C1B2E] flex items-center gap-1.5 truncate">
                <ActiveNavIcon size={15} className="text-[#C69C47] shrink-0" />
                <span className="truncate">{activeNav.label}</span>
              </span>
              <span className="text-[11.5px] font-medium text-slate-400 hidden xl:inline truncate">
                • {activeNav.sub}
              </span>
            </div>
          </div>

          {/* Right: macOS Capsule Pills & Utility Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* ERP Realtime Status Capsule */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-black/[0.06] text-[11px] text-slate-600 shadow-2xs backdrop-blur-md"
              title={erpConnected ? 'Kết nối dữ liệu ProTrack ERP thời gian thực' : 'Đang kết nối ProTrack ERP...'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  erpConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="font-semibold text-slate-700">ERP:</span>
              <span className={erpConnected ? 'text-emerald-700 font-semibold' : 'text-amber-600 font-semibold'}>
                {erpConnected ? 'Realtime' : 'Đang nối'}
              </span>
            </div>

            {/* Cloud Sync Status Capsule */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-black/[0.06] text-[11px] text-slate-600 shadow-2xs backdrop-blur-md"
              title={cloudSynced ? 'Đã đồng bộ Cloud Firestore' : 'Đang lưu an toàn trên máy (Local Safe)'}
            >
              <Cloud size={12} className={cloudSynced ? 'text-sky-600' : 'text-amber-600'} />
              <span className={cloudSynced ? 'text-sky-700 font-semibold' : 'text-amber-700 font-semibold'}>
                {cloudSynced ? 'Cloud' : 'Local'}
              </span>
            </div>

            {/* Audio Chime Button */}
            <button
              onClick={notifPermission === 'granted' ? onTestChime : onRequestNotif}
              className="p-1 px-2.5 rounded-xl border border-black/[0.06] bg-white/90 hover:bg-white text-slate-700 text-[11.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs backdrop-blur-md transition-all active:scale-[0.98]"
              title={notifPermission === 'granted' ? 'Chuông nhắc việc đã bật (Click để thử âm thanh)' : 'Bật chuông nhắc việc'}
            >
              <Volume2 size={13} className={notifPermission === 'granted' ? 'text-[#C69C47]' : 'text-slate-400'} />
              <span className="hidden xl:inline">{notifPermission === 'granted' ? 'Chuông: Bật' : 'Bật chuông'}</span>
            </button>

            {/* Full-Width / Standard Workspace Toggle */}
            <button
              onClick={() => setIsWideLayout(!isWideLayout)}
              className={`p-1 px-2.5 rounded-xl border text-[11.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs backdrop-blur-md transition-all active:scale-[0.98] ${
                isWideLayout
                  ? 'bg-amber-50/80 border-amber-200/90 text-[#9D772B] hover:bg-amber-100'
                  : 'bg-white/90 border-black/[0.06] text-slate-700 hover:bg-white'
              }`}
              title={isWideLayout ? 'Đang ở chế độ Không Gian Rộng (Bấm để thu gọn viền tiêu chuẩn)' : 'Đang ở chế độ Tiêu Chuẩn (Bấm để mở rộng tối đa màn hình)'}
            >
              {isWideLayout ? (
                <>
                  <Minimize2 size={13} className="text-[#9D772B]" />
                  <span className="hidden lg:inline">Không gian: Rộng</span>
                </>
              ) : (
                <>
                  <Maximize2 size={13} className="text-slate-500" />
                  <span className="hidden lg:inline">Không gian: Vừa</span>
                </>
              )}
            </button>

            {/* CEO Profile Quick Badge */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-black/[0.08]">
              <div
                className="w-7 h-7 rounded-[9px] bg-[#0C1B2E] text-[#E5C472] font-extrabold text-[11.5px] flex items-center justify-center shrink-0 shadow-2xs"
                title={`${currentUser.name || 'CEO'} (${currentUser.role})`}
              >
                {(currentUser.name || 'C').charAt(0).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
          <AxisLogo size={32} showWordmark subtitle="CEO OS" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('theory')}
              className={`p-2 rounded-xl border transition-colors ${
                activeTab === 'theory'
                  ? 'bg-[#0C1B2E] text-[#E5C472] border-[#0C1B2E]'
                  : 'bg-amber-50 text-[#9D772B] border-amber-200/80'
              }`}
              title="Thư viện lý thuyết"
            >
              <BookOpen size={16} />
            </button>
            <button
              onClick={notifPermission === 'granted' ? onTestChime : onRequestNotif}
              className="p-2 rounded-xl bg-slate-100 text-[#0C1B2E]"
              title="Chuông nhắc việc"
            >
              <Bell size={16} className={notifPermission === 'granted' ? 'text-[#C69C47]' : 'text-slate-500'} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-100 text-slate-500"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Main Content Workspace - Dynamic Fluid / Wide Container */}
        <main className="flex-1 min-w-0 pb-24 md:pb-12">
          <div
            className={`mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6 transition-all duration-200 ${
              isWideLayout ? 'w-full max-w-[1720px]' : 'w-full max-w-[1280px]'
            }`}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom 6-Tab Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1 flex items-center justify-around overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl min-w-[50px] shrink-0 transition-colors ${
                isActive ? 'text-[#0C1B2E] font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl ${
                  isActive ? 'bg-[#0C1B2E] text-[#E5C472]' : ''
                }`}
              >
                <Icon size={16} />
              </div>
              <span className="text-[9.5px] mt-0.5 whitespace-nowrap">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

