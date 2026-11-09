import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Filter,
  Layers,
  Package,
  Search,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  ErpLsxOrder,
  ErpOrderIntake,
  ErpProposal,
  ErpStageReport,
  ErpLeaveRequest,
  ErpOvertimeSchedule,
  ErpUser,
  ErpMachine,
  ErpStaffMember,
} from '../types/erpTypes';
import { ErpRadarMetrics } from '../hooks/useErpData';
import { CeoTabId, NavigationContextIntent } from '../types/ceoTypes';
import { erpService } from '../services/erpService';
import { formatNumberVi } from '../utils/dateUtils';
import {
  getLsxItemName,
  getLsxTotalQuantity,
  getLsxUnit,
  isLsxInProduction,
  isLsxCompleted,
  isLsxOverdue,
  isLsxNearingDeadline,
  getLsxDaysRemaining,
  getIntakeItemName,
  getIntakeTotalQuantity,
  getStatusName,
} from '../utils/erpDataUtils';
import { dialogService } from './common/CustomDialog';

interface ErpCommandBridgeTabProps {
  activeUser: ErpUser | null;
  isLoaded: boolean;
  lsxOrders: ErpLsxOrder[];
  intakes?: ErpOrderIntake[];
  machines?: ErpMachine[];
  proposals: ErpProposal[];
  recentReports: ErpStageReport[];
  leaveRequests: ErpLeaveRequest[];
  overtimeSchedules: ErpOvertimeSchedule[];
  staffDirectory: ErpStaffMember[];
  radarMetrics: ErpRadarMetrics;
  globalMonthFilter?: 'CURRENT_MONTH' | 'ALL';
  onToggleMonthFilter?: (mode: 'CURRENT_MONTH' | 'ALL') => void;
  navIntent: NavigationContextIntent | null;
  onClearIntent: () => void;
  onNavigateTab: (
    tab: CeoTabId,
    subView?: string,
    prefill?: { title?: string; assignee?: string; lsxCode?: string }
  ) => void;
}

export const ErpCommandBridgeTab: React.FC<ErpCommandBridgeTabProps> = ({
  activeUser,
  isLoaded,
  lsxOrders,
  intakes = [],
  machines = [],
  proposals,
  recentReports,
  leaveRequests,
  overtimeSchedules,
  staffDirectory,
  radarMetrics,
  globalMonthFilter = 'CURRENT_MONTH',
  onToggleMonthFilter,
  navIntent,
  onClearIntent,
  onNavigateTab,
}) => {
  const [activeSection, setActiveSection] = useState<'LSX' | 'INTAKES' | 'PROPOSALS' | 'REPORTS' | 'HR'>('LSX');
  const [searchQuery, setSearchQuery] = useState('');
  const [lsxStatusFilter, setLsxStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'OVERDUE' | 'NEARING' | 'COMPLETED'>('ALL');
  const [hrDeptFilter, setHrDeptFilter] = useState<string>('ALL');

  // Danh mục phòng ban từ Tab Nhân Sự ERP
  const availableDepts = useMemo(() => {
    const set = new Set<string>();
    staffDirectory.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [staffDirectory]);

  // Bộ lọc danh bạ nhân sự chuẩn Tab Nhân Sự ERP
  const filteredStaff = useMemo(() => {
    let list = staffDirectory;
    if (hrDeptFilter !== 'ALL') {
      list = list.filter((s) => s.department === hrDeptFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        ((s as any).phone || '').includes(q)
    );
  }, [staffDirectory, hrDeptFilter, searchQuery]);

  useEffect(() => {
    if (!navIntent) return;
    if (
      navIntent.subView === 'LSX' ||
      navIntent.subView === 'INTAKES' ||
      navIntent.subView === 'PROPOSALS' ||
      navIntent.subView === 'REPORTS' ||
      navIntent.subView === 'HR'
    ) {
      setActiveSection(navIntent.subView as any);
    }
    onClearIntent();
  }, [navIntent, onClearIntent]);

  // Bộ lọc danh sách LSX
  const filteredLsx = useMemo(() => {
    let base = lsxOrders.filter((l) => !l.isDeleted);

    if (lsxStatusFilter === 'IN_PROGRESS') {
      base = base.filter((l) => isLsxInProduction(l));
    } else if (lsxStatusFilter === 'OVERDUE') {
      base = base.filter((l) => isLsxInProduction(l) && isLsxOverdue(l.deliveryDate));
    } else if (lsxStatusFilter === 'NEARING') {
      base = base.filter((l) => isLsxInProduction(l) && isLsxNearingDeadline(l.deliveryDate));
    } else if (lsxStatusFilter === 'COMPLETED') {
      base = base.filter((l) => isLsxCompleted(l));
    }

    if (!searchQuery.trim()) return base.slice(0, 80);
    const q = searchQuery.toLowerCase();
    return base
      .filter((l) => {
        const code = (l.lsxCode || l.orderCode || l.id || '').toLowerCase();
        const customer = (l.customer || '').toLowerCase();
        const itemName = getLsxItemName(l).toLowerCase();
        return code.includes(q) || customer.includes(q) || itemName.includes(q);
      })
      .slice(0, 80);
  }, [lsxOrders, lsxStatusFilter, searchQuery]);

  // Bộ lọc danh sách Đơn tiếp nhận
  const filteredIntakes = useMemo(() => {
    let base = intakes.filter((i) => !i.isDeleted);
    if (!searchQuery.trim()) return base.slice(0, 50);
    const q = searchQuery.toLowerCase();
    return base
      .filter((i) => {
        const code = (i.orderCode || i.id || '').toLowerCase();
        const customer = (i.customer || '').toLowerCase();
        const itemName = getIntakeItemName(i).toLowerCase();
        return code.includes(q) || customer.includes(q) || itemName.includes(q);
      })
      .slice(0, 50);
  }, [intakes, searchQuery]);

  const handleDecideProposal = async (
    p: ErpProposal,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const actionLabel = decision === 'APPROVED' ? 'PHÊ DUYỆT' : 'TỪ CHỐI';
    const ok = await dialogService.confirm(
      `Xác nhận ${actionLabel} đề xuất "${p.title}" của ${p.requestedBy}?`,
      `${actionLabel} Đề xuất ERP`
    );
    if (!ok) return;

    try {
      await erpService.decideProposal(
        p.id,
        decision,
        {
          id: activeUser?.id || 'ceo-admin',
          name: activeUser?.name || 'Ban Giám Đốc',
        },
        decision === 'APPROVED' ? 'Đã phê duyệt qua ProCEO' : 'Từ chối qua ProCEO'
      );
      dialogService.toast(`Đã ${actionLabel.toLowerCase()} đề xuất thành công!`, 'success');
    } catch {
      dialogService.toast('Không thể ghi trực tiếp lên bảng proposals (kiểm tra quyền Auth).', 'warning');
    }
  };

  const handleUrgeLsxOnErp = async (lsx: ErpLsxOrder) => {
    const code = lsx.lsxCode || lsx.orderCode || lsx.id;
    const itemName = getLsxItemName(lsx);
    try {
      await erpService.pushNotification({
        title: `⚡ Đôn đốc tiến độ LSX ${code}`,
        content: `CEO yêu cầu bộ phận Sản xuất ưu tiên hoàn tất & cập nhật tiến độ đơn ${code} (${lsx.customer || ''} - ${itemName}).`,
        senderName: activeUser?.name || 'Ban Giám Đốc',
        actionType: 'CEO_URGENT_LSX',
      });
      dialogService.toast(`Đã phát lệnh đôn đốc LSX ${code} sang hệ thống ERP MVĐN!`, 'success');
    } catch {
      dialogService.toast(`Đã ghi nhận lệnh đôn đốc LSX ${code}!`, 'info');
    }
  };

  const now = new Date();
  const currentMonthDisplay = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

  return (
    <div className="space-y-5">
      {/* ── THANH TRẠNG THÁI KẾT NỐI ERP & BỘ LỌC (Không lặp lại tiêu đề Header bar) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 no-print">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px] flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isLoaded ? 'KẾT NỐI REALTIME ERP MVĐN' : 'ĐANG KẾT NỐI ERP...'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            (mvdn-59215)
          </span>
        </div>

        {/* Chuyển đổi Tháng này / Toàn bộ dữ liệu */}
        {onToggleMonthFilter && (
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 text-xs">
            <button
              onClick={() => onToggleMonthFilter('CURRENT_MONTH')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                globalMonthFilter === 'CURRENT_MONTH'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 {currentMonthDisplay}
            </button>
            <button
              onClick={() => onToggleMonthFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                globalMonthFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toàn Bộ Lịch Sử
            </button>
          </div>
        )}
      </div>

      {/* ── 5 TAB DANH MỤC DỮ LIỆU ERP ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveSection('LSX')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'LSX' ? 'btn-25d-primary' : 'btn-25d-secondary'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Lệnh SX ({radarMetrics.totalLsxCount})
        </button>
        <button
          onClick={() => setActiveSection('INTAKES')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'INTAKES' ? 'btn-25d-primary' : 'btn-25d-secondary'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Đơn Tiếp Nhận ({radarMetrics.pendingIntakesCount} chờ)
        </button>
        <button
          onClick={() => setActiveSection('PROPOSALS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'PROPOSALS' ? 'btn-25d-primary' : 'btn-25d-secondary'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Đề Xuất ({radarMetrics.pendingProposals.length} chờ)
        </button>
        <button
          onClick={() => setActiveSection('REPORTS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'REPORTS' ? 'btn-25d-primary' : 'btn-25d-secondary'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Sản Lượng Hôm Nay ({formatNumberVi(radarMetrics.todayFinishedQuantity)})
        </button>
        <button
          onClick={() => setActiveSection('HR')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'HR' ? 'btn-25d-primary' : 'btn-25d-secondary'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Nhân Sự ({staffDirectory.length}) & Máy Móc ({radarMetrics.idleMachinesCount} sẵn sàng)
        </button>
      </div>

      {/* ── 1. BẢNG LỆNH SẢN XUẤT (LSX) ── */}
      {activeSection === 'LSX' && (
        <div className="ceo-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Thanh tìm kiếm */}
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã LSX, đơn hàng, khách hàng, tên tem nhãn SKU..."
                className="w-full text-xs outline-none bg-transparent"
              />
            </div>

            {/* Các nút lọc trạng thái chuẩn ERP */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                onClick={() => setLsxStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  lsxStatusFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({lsxOrders.length})
              </button>
              <button
                onClick={() => setLsxStatusFilter('IN_PROGRESS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  lsxStatusFilter === 'IN_PROGRESS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Đang chạy ({radarMetrics.inProgressLsxCount})
              </button>
              <button
                onClick={() => setLsxStatusFilter('OVERDUE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  lsxStatusFilter === 'OVERDUE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Đã trễ hạn ({radarMetrics.overdueLsx.length})
              </button>
              <button
                onClick={() => setLsxStatusFilter('NEARING')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  lsxStatusFilter === 'NEARING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Sắp trễ hạn ({radarMetrics.nearingDeadlineLsx.length})
              </button>
              <button
                onClick={() => setLsxStatusFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  lsxStatusFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Hoàn thành ({radarMetrics.completedLsxCount})
              </button>
            </div>
          </div>

          <div className="table-scroll-region" tabIndex={0} role="region" aria-label="Bảng Lệnh sản xuất ERP">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-white">
                  <th className="py-2.5 px-3">Mã LSX / Đơn</th>
                  <th className="py-2.5 px-3">Khách hàng</th>
                  <th className="py-2.5 px-3">Sản phẩm / Tem nhãn SKU</th>
                  <th className="py-2.5 px-3 text-right">Số lượng</th>
                  <th className="py-2.5 px-3">Tiến độ xưởng</th>
                  <th className="py-2.5 px-3">Giao hàng</th>
                  <th className="py-2.5 px-3">Hạn giao</th>
                  <th className="py-2.5 px-3 text-right">Điều hành CEO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLsx.map((l) => {
                  const code = l.lsxCode || l.orderCode || l.id;
                  const itemName = getLsxItemName(l);
                  const totalQty = getLsxTotalQuantity(l);
                  const unit = getLsxUnit(l);
                  const daysLeft = getLsxDaysRemaining(l.deliveryDate);
                  const isOver = isLsxOverdue(l.deliveryDate) && isLsxInProduction(l);
                  const isNear = isLsxNearingDeadline(l.deliveryDate) && isLsxInProduction(l);

                  return (
                    <tr key={l.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-extrabold text-slate-900 whitespace-nowrap">
                        {code}
                        {l.orderCode && l.orderCode !== code && (
                          <span className="block text-[10px] font-normal text-slate-400 font-sans">
                            {l.orderCode}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {l.customer || '—'}
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-700" title={itemName}>
                        {itemName}
                        {l.size && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Khổ: {l.size}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold tabular-nums whitespace-nowrap text-slate-900">
                        {formatNumberVi(totalQty)} <span className="text-[10px] font-normal text-slate-500">{unit}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            l.progress === 'Đã đóng gói'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.progress === 'Đã in' || l.progress === 'Đã bế'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {l.progress || 'Chưa xử lý'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            l.deliveryStatus === 'FULLY_DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : l.deliveryStatus === 'PARTIALLY_DELIVERED'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          {l.deliveryStatus === 'FULLY_DELIVERED'
                            ? 'Đã giao hết'
                            : l.deliveryStatus === 'PARTIALLY_DELIVERED'
                            ? 'Giao 1 phần'
                            : 'Chưa giao'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isOver
                              ? 'text-rose-600'
                              : isNear
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {isOver && <AlertCircle className="w-3 h-3 text-rose-500" />}
                          {isNear && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          {l.deliveryDate?.slice(0, 10) || '—'}
                        </span>
                        {isLsxInProduction(l) && l.deliveryDate && (
                          <span className="block text-[10px] text-slate-400 font-sans">
                            {daysLeft < 0
                              ? `Trễ ${Math.abs(daysLeft)} ngày`
                              : daysLeft === 0
                              ? 'Hôm nay'
                              : `Còn ${daysLeft} ngày`}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {/* Quy chuẩn Rule 2: Ẩn mặc định (opacity-0), hiện khi hover hàng */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleUrgeLsxOnErp(l)}
                            className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            Đôn đốc
                          </button>
                          <button
                            onClick={() =>
                              onNavigateTab('execution', 'SMART', {
                                title: `Đôn đốc hoàn thành đúng hạn đơn ${code} (${l.customer || ''})`,
                                assignee: 'Quản đốc Sản xuất',
                                lsxCode: code,
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] cursor-pointer"
                          >
                            + Việc SMART
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 2. BẢNG TIẾP NHẬN ĐƠN HÀNG (INTAKES) ── */}
      {activeSection === 'INTAKES' && (
        <div className="ceo-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-700" />
              Tiếp Nhận Đơn Hàng Từ Khách ({intakes.length} đơn • {radarMetrics.pendingIntakesCount} chờ lên lệnh)
            </h3>
            <div className="flex items-center gap-2 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn, khách hàng..."
                className="w-full text-xs outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="table-scroll-region" tabIndex={0} role="region" aria-label="Bảng Đơn tiếp nhận ERP">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-white">
                  <th className="py-2.5 px-3">Mã đơn tiếp nhận</th>
                  <th className="py-2.5 px-3">Khách hàng</th>
                  <th className="py-2.5 px-3">Sản phẩm yêu cầu</th>
                  <th className="py-2.5 px-3 text-right">Tổng số lượng</th>
                  <th className="py-2.5 px-3">Ngày nhận đơn</th>
                  <th className="py-2.5 px-3">Hạn giao yêu cầu</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIntakes.map((i) => {
                  const isPending = i.status === 'Chờ xử lý' || (i.status as any) === 'PENDING' || !i.status;
                  return (
                    <tr key={i.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {i.orderCode || i.id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {i.customer || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {getIntakeItemName(i)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold tabular-nums">
                        {formatNumberVi(getIntakeTotalQuantity(i))}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {i.orderDate?.slice(0, 10) || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {i.deliveryDate?.slice(0, 10) || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {i.status || 'Chờ xử lý'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              onNavigateTab('execution', 'SMART', {
                                title: `Lên kế hoạch sản xuất đơn ${i.orderCode || i.id} (${i.customer || ''})`,
                                assignee: 'Trưởng bộ phận Kỹ thuật / Thiết kế',
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] cursor-pointer"
                          >
                            + Lên việc SMART
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. BẢNG ĐỀ XUẤT PHÊ DUYỆT (PROPOSALS) ── */}
      {activeSection === 'PROPOSALS' && (
        <div className="ceo-card p-5 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Danh Sách Đề Xuất Bộ Phận ({proposals.length} đề xuất)</span>
            <span className="text-xs font-bold text-amber-700">
              {radarMetrics.pendingProposals.length} đang chờ CEO phê duyệt
            </span>
          </h3>
          <div className="table-scroll-region" tabIndex={0} role="region" aria-label="Bảng Đề xuất ERP">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-white">
                  <th className="py-2.5 px-3">Tiêu đề đề xuất</th>
                  <th className="py-2.5 px-3">Người gửi</th>
                  <th className="py-2.5 px-3">Danh mục</th>
                  <th className="py-2.5 px-3">Ngày gửi</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Quyết định CEO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{p.title}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{p.requestedBy}</td>
                    <td className="py-3 px-3 text-slate-600">{p.category}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{p.date?.slice(0, 10)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          p.finalStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.finalStatus === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {p.finalStatus === 'PENDING' ? 'Chờ duyệt' : p.finalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDecideProposal(p, 'APPROVED')}
                          className="btn-25d-primary px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleDecideProposal(p, 'REJECTED')}
                          className="btn-25d-secondary px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. BẢNG BÁO CÁO SẢN LƯỢNG CÔNG ĐOẠN (REPORTS) ── */}
      {activeSection === 'REPORTS' && (
        <div className="ceo-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Báo Cáo Sản Lượng Công Đoạn ({recentReports.length} lượt ghi nhận)
              </h3>
              <p className="text-[11px] text-slate-500">
                Hôm nay: {formatNumberVi(radarMetrics.todayFinishedQuantity)} sản phẩm hoàn thành • {radarMetrics.activeWorkersToday} nhân sự vận hành
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Đạt: {formatNumberVi(radarMetrics.todayFinishedQuantity)}
              </span>
              <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                Hao/Lỗi: {formatNumberVi(radarMetrics.todayDefectiveQuantity)}
              </span>
            </div>
          </div>

          <div className="table-scroll-region" tabIndex={0} role="region" aria-label="Bảng Báo cáo sản lượng ERP">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-white">
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Mã LSX</th>
                  <th className="py-2.5 px-3">Công đoạn</th>
                  <th className="py-2.5 px-3">Thợ máy / Vận hành</th>
                  <th className="py-2.5 px-3 text-right">Sản lượng đạt</th>
                  <th className="py-2.5 px-3 text-right">Lỗi / Hao</th>
                  <th className="py-2.5 px-3 text-right">Động viên FFC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReports.slice(0, 45).map((r) => {
                  const worker = r.workerName || r.operatorName || r.assistantName || '—';
                  const finished = Number(r.finishedQty) || Number(r.finishedNhip) || 0;
                  const defect = Number(r.defectQty) || Number(r.qtyHao) || 0;

                  return (
                    <tr key={r.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {r.timestamp?.slice(0, 16).replace('T', ' ') || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {r.lsxCode || r.lsxId || '—'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                          {r.stage || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{worker}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                        {formatNumberVi(finished)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-500">
                        {defect > 0 ? (
                          <span className="text-rose-600 font-bold">{formatNumberVi(defect)}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              onNavigateTab('cockpit')
                            }
                            className="btn-25d-secondary px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer"
                          >
                            Khen FFC
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. DANH BẠ NHÂN SỰ, NGHỈ PHÉP & MÁY MÓC ── */}
      {activeSection === 'HR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 ceo-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Danh Bạ Nhân Sự Tab Nhân Sự ERP ({staffDirectory.length} người)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Dữ liệu gốc từ module Quản trị Nhân sự (hr_personnel) trên ProTrack ERP
                </p>
              </div>

              {/* Bộ lọc phòng ban */}
              <div className="flex items-center gap-2">
                <select
                  value={hrDeptFilter}
                  onChange={(e) => setHrDeptFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none"
                >
                  <option value="ALL">Tất cả phòng ban ({staffDirectory.length})</option>
                  {availableDepts.map((d) => (
                    <option key={d} value={d}>
                      {d} ({staffDirectory.filter((s) => s.department === d).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-scroll-region" tabIndex={0} role="region" aria-label="Danh bạ nhân sự ERP">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-white">
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3">Bộ phận</th>
                    <th className="py-2.5 px-3">Chức danh / Vai trò</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right">Thao tác CEO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((s) => {
                    const statusName = getStatusName(s.status);
                    const isOfficial = s.status === 'Official';
                    const isTrainee = s.status === 'Trainee';
                    const isResigned = s.status === 'Resigned';

                    return (
                      <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{s.name}</div>
                          {s.phone && (
                            <div className="text-[10px] text-slate-400 font-mono">{s.phone}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{s.department}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{s.role}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              isOfficial
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isTrainee
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : isResigned
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {statusName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                onNavigateTab('execution', 'SMART', {
                                  title: `Giao mục tiêu công việc cho ${s.name}`,
                                  assignee: s.name,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] cursor-pointer"
                            >
                              Giao SMART
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            {/* Máy móc sẵn sàng */}
            <div className="ceo-card p-5 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                <span>Thiết Bị & Máy Móc Xưởng ({machines.length} máy)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                  {radarMetrics.idleMachinesCount} máy sẵn sàng
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {machines.slice(0, 10).map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                  >
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>{m.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {m.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {m.operatorName ? `Thợ: ${m.operatorName}` : 'Chưa phân công'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Đơn xin nghỉ phép */}
            <div className="ceo-card p-5 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm">
                Đơn Xin Nghỉ Phép Gần Đây ({leaveRequests.length})
              </h4>
              <div className="space-y-2 text-xs">
                {leaveRequests.slice(0, 4).map((lr) => (
                  <div
                    key={lr.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{lr.employeeName}</div>
                      <div className="text-[11px] text-slate-500">
                        {lr.startDate} → {lr.endDate} ({lr.reason || 'Nghỉ phép'})
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                      {lr.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lịch tăng ca */}
            <div className="ceo-card p-5 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm">
                Lịch Tăng Ca Sản Xuất ({overtimeSchedules.length})
              </h4>
              <div className="space-y-2 text-xs">
                {overtimeSchedules.slice(0, 4).map((ot) => (
                  <div
                    key={ot.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                  >
                    <div className="font-bold text-slate-900">
                      Ngày {ot.date} • {ot.lsxCode || 'Tăng ca xưởng'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {ot.taskDescription || `${ot.workerDetails?.length || 0} nhân sự tham gia`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
