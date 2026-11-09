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
  AlertOctagon,
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
  pendingDecisionsCount?: number;
  activeMissionsCount?: number;
  lineStopAndonCount?: number;
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
  pendingDecisionsCount = 0,
  activeMissionsCount = 0,
  lineStopAndonCount = 0,
}) => {
  const NAV_GROUPS: NavGroup[] = [
    {
      groupTitle: 'TRUNG TÂM ĐIỀU HÀNH CEO',
      items: [
        {
          id: 'dashboard',
          label: 'Bảng Điều Hành CEO',
          sublabel: 'Quyết định • Mục tiêu • Cảnh báo',
          icon: LayoutDashboard,
          badgeCount: pendingDecisionsCount > 0 ? pendingDecisionsCount : overdueLsxCount > 0 ? overdueLsxCount : undefined,
          badgeTone: 'rose',
        },
        {
          id: 'copilot',
          label: 'Trợ Lý C-Level Copilot',
          sublabel: 'Cố vấn chiến lược AI',
          icon: Sparkles,
          badgeCount: atRiskOkrCount > 0 ? atRiskOkrCount : undefined,
          badgeTone: 'slate',
        },
      ],
    },
    {
      groupTitle: 'HỆ THỐNG 4 TẦNG THỰC THI',
      items: [
        {
          id: 'prep',
          label: 'Tầng 1: Nhiệm Vụ & PREP',
          sublabel: 'Chỉ thị CEO & Single DRI',
          icon: FileText,
          badgeCount: activeMissionsCount > 0 ? activeMissionsCount : undefined,
          badgeTone: 'gold',
        },
        {
          id: 'okr',
          label: 'Tầng 2: Mục Tiêu OKR',
          sublabel: 'Baseline ➔ Target & DRI',
          icon: TrendingUp,
          badgeCount: atRiskOkrCount > 0 ? atRiskOkrCount : undefined,
          badgeTone: 'rose',
        },
        {
          id: 'pdca',
          label: 'Tầng 3: Sáng Kiến PDCA',
          sublabel: 'Chu kỳ cải tiến & SOP',
          icon: RefreshCw,
          badgeCount: activePdcaCount > 0 ? activePdcaCount : undefined,
          badgeTone: 'slate',
        },
        {
          id: 'tasks',
          label: 'Tầng 4: Tác Vụ DRI & RACI',
          sublabel: 'Cam kết SLA 24h & Blocker',
          icon: CheckSquare,
          badgeCount: activeDriCount > 0 ? activeDriCount : undefined,
          badgeTone: 'slate',
        },
      ],
    },
    {
      groupTitle: 'KIỂM SOÁT HIỆN TRƯỜNG & SỰ CỐ',
      items: [
        {
          id: 'andon',
          label: 'Sự Cố Andon & 5 Whys',
          sublabel: 'Báo sự cố & Dừng dòng',
          icon: AlertOctagon,
          badgeCount: lineStopAndonCount > 0 ? lineStopAndonCount : undefined,
          badgeTone: 'rose',
        },
        {
          id: 'swot-tows',
          label: 'Chiến Lược SWOT & TOWS',
          sublabel: 'Biến điểm yếu thành việc',
          icon: Compass,
        },
        {
          id: 'meetings',
          label: 'Họp Giao Ban 3-6-9',
          sublabel: '30 phút trọng tâm & giao việc',
          icon: Users,
          badgeCount: activeMeetingsCount > 0 ? activeMeetingsCount : undefined,
          badgeTone: 'slate',
        },
        {
          id: 'erp-bridge',
          label: 'Vận Hành Sản Xuất ERP',
          sublabel: '123 LSX nhà máy MVĐN',
          icon: Database,
          badgeCount: inProgressLsxCount > 0 ? inProgressLsxCount : undefined,
          badgeTone: 'slate',
        },
      ],
    },
    {
      groupTitle: 'VĂN HÓA & CON NGƯỜI',
      items: [
        {
          id: 'people',
          label: 'Nhân Sự & Động Lực',
          sublabel: 'Mô hình Maslow & FFC',
          icon: HeartHandshake,
        },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 select-none transition-all duration-200 z-30 ${
        collapsed ? 'w-[72px]' : 'w-[264px]'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0b1120 0%, #080c16 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '4px 0 24px -4px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* 1. BRAND HEADER */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.08] shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-sky-500/15 border border-sky-400/25 text-white">
              <Shield className="w-4 h-4 text-sky-300 font-bold" />
            </div>
            <div className="leading-tight truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] tracking-tight text-white">
                  ProCEO
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  2.0
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">
                Hệ Thống Điều Hành C-Level
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs bg-sky-500/15 border border-sky-400/25 text-white">
              <Shield className="w-4 h-4 text-sky-300" />
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
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
            className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-between cursor-pointer hover:bg-white/[0.07] transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-200">
                {operatingMode === 'PERSONAL' ? 'Chế độ Cá nhân' : 'Chế độ Doanh nghiệp'}
              </span>
            </div>
            <span className="text-[9.5px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 font-mono">
              Cấp CEO
            </span>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION ITEMS GROUPED */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3.5 text-xs scrollbar-thin scrollbar-thumb-white/10">
        {NAV_GROUPS.map((group, gIdx) => (
          <div
            key={gIdx}
            className={`space-y-1 ${
              gIdx === NAV_GROUPS.length - 1 ? 'pt-2.5 border-t border-white/[0.08]' : ''
            }`}
          >
            {!collapsed && (
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                        ? 'text-white font-semibold bg-sky-500/10 border-l-2 border-sky-400 shadow-xs'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] font-medium'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                          isActive ? 'text-sky-300' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!collapsed && (
                        <div className="truncate">
                          <span className={`block truncate text-xs ${isActive ? 'text-white font-semibold' : 'text-slate-300'}`}>
                            {item.label}
                          </span>
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
                            : 'bg-white/10 text-slate-300 border border-white/10'
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
      <div className="p-2.5 border-t border-white/[0.08] shrink-0">
        <div className={`grid ${collapsed ? 'grid-cols-1 gap-1.5' : 'grid-cols-2 gap-1.5'}`}>
          <button
            type="button"
            onClick={() => onSelectTab('mindset-hub')}
            title="Sổ Tay Tri Thức Quản Trị"
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
              activeTab === 'mindset-hub'
                ? 'bg-white/10 text-white border-sky-400/40 shadow-xs'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.07] hover:text-white'
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
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
              activeTab === 'settings'
                ? 'bg-white/10 text-white border-sky-400/40 shadow-xs'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.07] hover:text-white'
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
