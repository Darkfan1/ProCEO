import React from 'react';
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
} from 'lucide-react';
import { AxisTabId, ErpUser } from '../types/axisTypes';
import { AxisLogo } from './common/AxisLogo';
import { theoryService } from '../services/theoryService';

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
    sub: 'Lịch nhắc & Radar ERP',
    icon: Compass,
  },
  {
    id: 'execution',
    label: 'Điều Hành',
    shortLabel: 'Điều hành',
    sub: 'SMART • Cải tiến PDCA',
    icon: Target,
  },
  {
    id: 'strategy',
    label: 'Chiến Lược',
    shortLabel: 'Chiến lược',
    sub: 'OKR • Phân tích SWOT',
    icon: TrendingUp,
  },
  {
    id: 'people',
    label: 'Nhân Tâm',
    shortLabel: 'Nhân tâm',
    sub: 'Maslow • FFC • Đào tạo',
    icon: HeartHandshake,
  },
  {
    id: 'meetings',
    label: 'Họp & PREP',
    shortLabel: 'Họp & PREP',
    sub: 'Họp 3-6-9 • Diễn đạt PREP',
    icon: MessageSquareQuote,
  },
  {
    id: 'theory',
    label: 'Thư Viện Lý Thuyết',
    shortLabel: 'Lý thuyết',
    sub: '8 Phương pháp chuẩn CEO',
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
  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] text-[#0F1E32] flex flex-col md:flex-row">
      {/* Desktop Left Navigation Rail */}
      <aside className="hidden md:flex md:w-[252px] shrink-0 bg-white border-r border-slate-200/85 flex-col justify-between sticky top-0 h-screen z-30">
        <div>
          <div className="px-6 pt-6 pb-5 border-b border-slate-100">
            <AxisLogo size={40} showWordmark subtitle="TRỤC ĐIỀU PHỐI CEO" />
          </div>

          <nav className="px-3.5 py-5 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badgeVal =
                item.id === 'today'
                  ? badges.todayCount
                  : item.id === 'execution'
                  ? badges.executionCount
                  : 0;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0C1B2E] text-white shadow-[0_4px_14px_rgba(12,27,46,0.16)]'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-[#0C1B2E]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      size={18}
                      className={isActive ? 'text-[#E5C472] shrink-0' : 'text-slate-400 shrink-0'}
                    />
                    <div className="truncate">
                      <div className="text-[13.5px] font-semibold leading-tight">{item.label}</div>
                      <div
                        className={`text-[10.5px] mt-0.5 truncate ${
                          isActive ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  {badgeVal > 0 && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-[10.5px] font-bold rounded-full tabular-nums ${
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

        {/* Status & CEO Profile Footer */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Connection & Reminder Bell Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Database size={12} className="text-emerald-600" />
                ProTrack ERP
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {erpConnected ? 'Realtime' : 'Đang nối...'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Cloud size={12} className={cloudSynced ? 'text-sky-600' : 'text-amber-600'} />
                Dữ liệu AXIS
              </span>
              <span
                className={`font-semibold ${
                  cloudSynced ? 'text-sky-700' : 'text-amber-700'
                }`}
                title={
                  cloudSynced
                    ? 'Đã đồng bộ Cloud Firestore'
                    : 'Đang lưu an toàn trên máy (cần deploy firestore.rules để đồng bộ đa thiết bị)'
                }
              >
                {cloudSynced ? 'Cloud Sync' : 'Local Safe'}
              </span>
            </div>

            <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between gap-1.5">
              {notifPermission === 'granted' ? (
                <button
                  onClick={onTestChime}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  title="Nghe thử âm báo nhắc lịch"
                >
                  <Volume2 size={12} className="text-[#C69C47]" />
                  <span>Chuông nhắc: Bật</span>
                </button>
              ) : (
                <button
                  onClick={onRequestNotif}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0C1B2E] text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#162B47]"
                >
                  <BellRing size={12} className="text-[#E5C472]" />
                  <span>Bật chuông nhắc việc</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-1.5">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[#0C1B2E] truncate">
                {currentUser.name || 'CEO'}
              </div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#9D772B]">
                {currentUser.role === 'ADMIN' ? 'CEO / Ban Giám Đốc' : currentUser.role}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

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

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 pb-24 md:pb-10">
        <div className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-9 pt-6 md:pt-8">{children}</div>
      </main>

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

