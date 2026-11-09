import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Target,
  CheckSquare,
  RefreshCw,
  Users,
  FileText,
  HeartHandshake,
  Sparkles,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Award,
  TrendingUp,
  Database,
} from 'lucide-react';
import { CeoTabId, OperatingMode } from '../../types/ceoTypes';

export interface NavGroup {
  groupTitle: string;
  items: Array<{
    id: CeoTabId;
    label: string;
    sublabel?: string;
    icon: React.FC<{ className?: string }>;
    badgeCount?: number;
    badgeTone?: 'gold' | 'rose' | 'slate' | 'white';
  }>;
}

interface ExecutiveSidebarProps {
  activeTab: CeoTabId;
  onSelectTab: (tab: CeoTabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  operatingMode: OperatingMode;
  onToggleMode?: () => void;
  activeSmartCount: number;
  activeDriCount?: number;
  activePdcaCount: number;
  activeMeetingsCount: number;
  atRiskOkrCount: number;
  inProgressLsxCount?: number;
  pendingProposalsCount?: number;
  overdueLsxCount?: number;
}

export const ExecutiveSidebar: React.FC<ExecutiveSidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  operatingMode,
  onToggleMode,
  activeSmartCount,
  activeDriCount = 0,
  activePdcaCount,
  activeMeetingsCount,
  atRiskOkrCount,
  inProgressLsxCount = 0,
  pendingProposalsCount = 0,
  overdueLsxCount = 0,
}) => {
  const NAV_GROUPS: NavGroup[] = [
    {
      groupTitle: 'ĐIỀU HÀNH & TỔNG QUAN',
      items: [
        {
          id: 'dashboard',
          label: 'Bảng Điều Hành',
          icon: LayoutDashboard,
          badgeCount: overdueLsxCount > 0 ? overdueLsxCount : undefined,
          badgeTone: 'rose',
        },
        {
          id: 'copilot',
          label: 'Trợ Lý',
          sublabel: 'Cố vấn điều hành AI',
          icon: Sparkles,
          badgeCount: atRiskOkrCount > 0 ? atRiskOkrCount : undefined,
          badgeTone: 'slate',
        },
      ],
    },
    {
      groupTitle: 'CHIẾN LƯỢC & MỤC TIÊU',
      items: [
        {
          id: 'swot-tows',
          label: 'Chiến Lược',
          sublabel: 'Công cụ SWOT & TOWS',
          icon: Compass,
        },
        {
          id: 'okr',
          label: 'Mục Tiêu Chiến Lược',
          sublabel: 'Phương pháp OKR',
          icon: TrendingUp,
          badgeCount: atRiskOkrCount > 0 ? atRiskOkrCount : undefined,
          badgeTone: 'rose',
        },
        {
          id: 'smart',
          label: 'Mục Tiêu Định Lượng',
          sublabel: 'Tiêu chuẩn SMART',
          icon: Target,
          badgeCount: activeSmartCount > 0 ? activeSmartCount : undefined,
          badgeTone: 'slate',
        },
      ],
    },
    {
      groupTitle: 'THỰC THI & CẢI TIẾN',
      items: [
        {
          id: 'tasks',
          label: 'Lịch Trình & Tác Vụ',
          sublabel: 'Nguyên tắc DRI',
          icon: CheckSquare,
          badgeCount: activeDriCount > 0 ? activeDriCount : undefined,
          badgeTone: 'slate',
        },
        {
          id: 'pdca',
          label: 'Cải Tiến & Chuẩn Hóa',
          sublabel: 'Chu trình PDCA & SOP',
          icon: RefreshCw,
          badgeCount: activePdcaCount > 0 ? activePdcaCount : undefined,
          badgeTone: 'slate',
        },
        {
          id: 'meetings',
          label: 'Họp Giao Ban',
          sublabel: 'Nguyên tắc 3-6-9',
          icon: Users,
          badgeCount: activeMeetingsCount > 0 ? activeMeetingsCount : undefined,
          badgeTone: 'slate',
        },
        {
          id: 'prep',
          label: 'Truyền Thông Điều Hành',
          sublabel: 'Cấu trúc PREP',
          icon: FileText,
        },
      ],
    },
    {
      groupTitle: 'CON NGƯỜI & VĂN HÓA',
      items: [
        {
          id: 'people',
          label: 'Nhân Sự & Động Lực',
          sublabel: 'Mô hình Maslow & FFC',
          icon: HeartHandshake,
        },
      ],
    },
    {
      groupTitle: 'HỆ THỐNG NGOẠI VI ERP',
      items: [
        {
          id: 'erp-bridge',
          label: 'Vận Hành Sản Xuất',
          sublabel: 'Dữ liệu ERP MVĐN',
          icon: Database,
          badgeCount: inProgressLsxCount > 0 ? inProgressLsxCount : undefined,
          badgeTone: 'slate',
        },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 select-none transition-all duration-200 z-30 ${
        collapsed ? 'w-[72px]' : 'w-[268px]'
      }`}
      style={{
        background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '4px 0 28px -4px rgba(15, 23, 42, 0.45), inset -1px 0 0 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* 1. BRAND HEADER */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-white/10 border border-white/15 text-white">
              <Shield className="w-4 h-4 font-black text-slate-100" />
            </div>
            <div className="leading-tight truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-sans">
                  ProCEO
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  2.0
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Hệ Thống Điều Hành C-Level
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-white/10 border border-white/15 text-white">
              <Shield className="w-4 h-4 text-slate-100" />
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. MODE BADGE (Chế độ Cá nhân vs Doanh nghiệp) */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div
            onClick={onToggleMode}
            className="p-2 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-white">
                {operatingMode === 'PERSONAL' ? 'Chế độ Cá nhân' : 'Chế độ Doanh nghiệp'}
              </span>
            </div>
            <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
              Cấp CEO
            </span>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION ITEMS GROUPED */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 text-xs scrollbar-thin scrollbar-thumb-white/10">
        {NAV_GROUPS.map((group, gIdx) => (
          <div
            key={gIdx}
            className={`space-y-1 ${
              gIdx === NAV_GROUPS.length - 1 ? 'pt-2.5 border-t border-white/10' : ''
            }`}
          >
            {!collapsed && (
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {group.groupTitle}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'dashboard' && activeTab === 'cockpit') ||
                  (item.id === 'smart' && activeTab === 'execution');

                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                      isActive
                        ? 'text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/8 font-medium'
                    }`}
                    style={
                      isActive
                        ? {
                            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 100%)',
                            borderLeft: '3px solid #38BDF8',
                          }
                        : undefined
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                          isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!collapsed && (
                        <div className="truncate">
                          <span className="block truncate text-xs text-white">{item.label}</span>
                          {item.sublabel && (
                            <span className="block text-[9.5px] text-slate-400 font-normal truncate">
                              {item.sublabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shrink-0 ${
                          item.badgeTone === 'rose'
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/15 text-slate-200 border border-white/15'
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 4. FOOTER UTILITIES (Sổ tay tri thức & Cài đặt hệ thống) */}
      <div className="p-2.5 border-t border-white/10 shrink-0">
        <div className={`grid ${collapsed ? 'grid-cols-1 gap-1.5' : 'grid-cols-2 gap-1.5'}`}>
          <button
            type="button"
            onClick={() => onSelectTab('mindset-hub')}
            title="Sổ Tay Tri Thức Quản Trị"
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              activeTab === 'mindset-hub'
                ? 'bg-white/15 text-white border-sky-400/50 shadow-xs'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen
              className={`w-3.5 h-3.5 shrink-0 ${
                activeTab === 'mindset-hub' ? 'text-amber-300' : 'text-slate-400'
              }`}
            />
            {!collapsed && <span className="truncate">Sổ Tay</span>}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            title="Cài Đặt Hệ Thống"
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
              activeTab === 'settings'
                ? 'bg-white/15 text-white border-sky-400/50 shadow-xs'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings
              className={`w-3.5 h-3.5 shrink-0 ${
                activeTab === 'settings' ? 'text-emerald-400' : 'text-slate-400'
              }`}
            />
            {!collapsed && <span className="truncate">Cài Đặt</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
