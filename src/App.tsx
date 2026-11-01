import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Layers,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useErpData } from './hooks/useErpData';
import { formatNumberVi } from './utils/dateUtils';
import { CustomDialogHost, dialogService } from './components/common/CustomDialog';
import { ErpUser } from './types/erpTypes';

export default function App() {
  const {
    isLoaded,
    error,
    users,
    lsxOrders,
    proposals,
    recentReports,
    radarMetrics,
    staffDirectory,
  } = useErpData(true);

  // Chọn tài khoản CEO / Lãnh đạo điều hành từ ERP users
  const executiveUsers = users.filter((u) =>
    ['ADMIN', 'DIRECTOR', 'CEO', 'MANAGER', 'PROD_MANAGER'].includes((u.role || '').toUpperCase())
  );
  const [selectedUser, setSelectedUser] = useState<ErpUser | null>(null);

  // Tự động gán user đầu tiên nếu chưa chọn
  const activeUser = selectedUser || executiveUsers[0] || users[0] || null;

  const [activeQuickView, setActiveQuickView] = useState<'NONE' | 'LSX' | 'PROPOSALS' | 'REPORTS' | 'USERS'>('NONE');

  return (
    <div className="min-h-screen bg-[#F5F6F9] text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <CustomDialogHost />

      {/* TOPBAR / HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Connection Tag */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm tracking-tight">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">ProCEO</h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Clean Slate
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLoaded ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isLoaded ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <span>
                  {isLoaded ? 'Kết nối ERP ProTrack (mvdn-59215)' : 'Đang kết nối Firestore...'}
                </span>
              </div>
            </div>
          </div>

          {/* User & ERP Status */}
          <div className="flex items-center gap-3">
            {/* Account Switcher from ERP */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200/80 text-xs">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Tài khoản:</span>
              <select
                value={activeUser?.id || ''}
                onChange={(e) => {
                  const u = users.find((item) => item.id === e.target.value) || null;
                  setSelectedUser(u);
                  if (u) {
                    dialogService.toast(`Đã chuyển sang tài khoản ${u.name} (${u.role})`, 'info');
                  }
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer pr-1"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} ({u.role || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                dialogService.toast('Dữ liệu ERP ProTrack đang được đồng bộ realtime tự động.', 'success');
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Trạng thái Realtime"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* HERO ANNOUNCEMENT BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-8 sm:p-10 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã xóa sạch ứng dụng AXIS cũ • Sẵn sàng tái thiết lập
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Sẵn sàng xây dựng App CEO thế hệ mới từ đầu
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Toàn bộ các tab, giao diện và dữ liệu mẫu cũ của ứng dụng AXIS đã được loại bỏ.
              Cổng kết nối dữ liệu hai chiều thời gian thực với{' '}
              <strong className="text-white font-semibold">ERP MVĐN (ProTrack Cloud)</strong> vẫn
              được bảo toàn trọn vẹn và hoạt động thông suốt.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  dialogService.alert(
                    'Bạn có thể yêu cầu tạo các màn hình, chức năng điều hành, báo cáo tự động, hay dashboard theo đúng quy trình và phong cách bạn mong muốn!',
                    'Hướng dẫn kế tiếp'
                  );
                }}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 shadow-sm transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Bắt đầu lên ý tưởng mới
              </button>
              <button
                onClick={() => setActiveQuickView(activeQuickView === 'NONE' ? 'LSX' : 'NONE')}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 transition-all flex items-center gap-2"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                {activeQuickView === 'NONE' ? 'Xem dữ liệu ProTrack ERP' : 'Đóng xem nhanh'}
              </button>
            </div>
          </div>
        </div>

        {/* REALTIME ERP RADAR METRICS OVERVIEW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Chỉ số thời gian thực từ ERP ProTrack (MVĐN)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Cập nhật tức thì qua Firestore Snapshot
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Lệnh sản xuất đang chạy */}
            <div
              onClick={() => setActiveQuickView('LSX')}
              className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>LỆNH SẢN XUẤT ĐANG CHẠY</span>
                <Layers className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isLoaded ? formatNumberVi(radarMetrics.inProgressLsxCount) : '...'}
              </div>
              <div className="mt-2 text-xs flex items-center justify-between text-slate-500">
                <span>Tổng cộng: {formatNumberVi(radarMetrics.totalLsxCount)} LSX</span>
                <span className={radarMetrics.overdueLsx.length > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600'}>
                  {radarMetrics.overdueLsx.length} sát/quá hạn
                </span>
              </div>
            </div>

            {/* Đề xuất chờ duyệt */}
            <div
              onClick={() => setActiveQuickView('PROPOSALS')}
              className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>ĐỀ XUẤT CHỜ DUYỆT</span>
                <FileText className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isLoaded ? formatNumberVi(radarMetrics.pendingProposals.length) : '...'}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Chờ CEO / Giám đốc duyệt</span>
                <span className="text-indigo-600 font-semibold group-hover:underline">Chi tiết →</span>
              </div>
            </div>

            {/* Báo cáo sản lượng hôm nay */}
            <div
              onClick={() => setActiveQuickView('REPORTS')}
              className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>SẢN LƯỢNG HÔM NAY</span>
                <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isLoaded ? formatNumberVi(radarMetrics.todayFinishedQuantity) : '...'}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>{radarMetrics.todayReportsCount} lượt báo cáo</span>
                <span>{radarMetrics.activeWorkersToday} công nhân đang làm</span>
              </div>
            </div>

            {/* Tổng nhân sự */}
            <div
              onClick={() => setActiveQuickView('USERS')}
              className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                <span>NHÂN SỰ TOÀN HỆ THỐNG</span>
                <Users className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isLoaded ? formatNumberVi(radarMetrics.totalPersonnelCount) : '...'}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>{users.length} tài khoản ERP</span>
                <span className="text-emerald-600 font-semibold">{radarMetrics.onTimeLsxRate}% đúng hạn</span>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK DATA INSPECTOR PANEL (VERIFY REALTIME DATA) */}
        {activeQuickView !== 'NONE' && (
          <div className="bg-white rounded-2xl border border-black/[0.08] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeQuickView === 'LSX' && 'Dữ liệu Lệnh Sản Xuất (lsx)'}
                  {activeQuickView === 'PROPOSALS' && 'Dữ liệu Đề Xuất (proposals)'}
                  {activeQuickView === 'REPORTS' && 'Dữ liệu Báo Cáo Công Đoạn (reports)'}
                  {activeQuickView === 'USERS' && 'Dữ liệu Tài Khoản / Nhân Sự (users)'}
                </h4>
              </div>
              <button
                onClick={() => setActiveQuickView('NONE')}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1 rounded-lg bg-slate-100"
              >
                Đóng
              </button>
            </div>

            <div className="overflow-x-auto">
              {activeQuickView === 'LSX' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">Mã LSX</th>
                      <th className="py-2.5 px-3">Khách hàng</th>
                      <th className="py-2.5 px-3">Sản phẩm</th>
                      <th className="py-2.5 px-3 text-right">Số lượng</th>
                      <th className="py-2.5 px-3">Tiến độ</th>
                      <th className="py-2.5 px-3">Hạn giao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {lsxOrders.slice(0, 8).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{l.lsxCode || l.orderCode || l.id}</td>
                        <td className="py-2.5 px-3">{l.customer || '—'}</td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate">{l.itemName || '—'}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{formatNumberVi(l.quantity)}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {l.progress || l.status || 'Chờ sản xuất'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{l.deliveryDate?.slice(0, 10) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeQuickView === 'PROPOSALS' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">Tiêu đề đề xuất</th>
                      <th className="py-2.5 px-3">Người gửi</th>
                      <th className="py-2.5 px-3">Danh mục</th>
                      <th className="py-2.5 px-3">Ngày gửi</th>
                      <th className="py-2.5 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {proposals.slice(0, 8).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{p.title}</td>
                        <td className="py-2.5 px-3">{p.requestedBy}</td>
                        <td className="py-2.5 px-3">{p.category}</td>
                        <td className="py-2.5 px-3 font-mono">{p.date?.slice(0, 10)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                              p.finalStatus === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : p.finalStatus === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {p.finalStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeQuickView === 'REPORTS' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Mã LSX</th>
                      <th className="py-2.5 px-3">Công đoạn</th>
                      <th className="py-2.5 px-3">Công nhân</th>
                      <th className="py-2.5 px-3 text-right">SL Đạt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentReports.slice(0, 8).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono">{r.timestamp?.slice(11, 16) || '—'}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{r.lsxCode || r.lsxId || '—'}</td>
                        <td className="py-2.5 px-3">{r.stage || '—'}</td>
                        <td className="py-2.5 px-3">{r.workerName || '—'}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                          {formatNumberVi(r.finishedQty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeQuickView === 'USERS' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Vai trò</th>
                      <th className="py-2.5 px-3">Bộ phận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {users.slice(0, 8).map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{u.name || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{u.email || '—'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {u.role || 'STAFF'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{u.department || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* READY FOR YOUR DESIGN INSTRUCTIONS */}
        <div className="border border-dashed border-slate-300 rounded-3xl p-8 sm:p-12 text-center bg-white/50 backdrop-blur-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-900">
              Bạn muốn xây dựng ứng dụng ProCEO theo phong cách và tính năng nào?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn có thể mô tả cụ thể giao diện, các luồng công việc điều hành, các bảng biểu,
              dashboard KPI hay các tính năng CEO mong muốn. Tôi sẽ lập tức xây dựng chính xác
              theo yêu cầu của bạn dựa trên dữ liệu thật từ ERP ProTrack!
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-black/[0.06] bg-white px-6 py-4 text-center text-xs text-slate-400">
        ProCEO • Kết nối trực tiếp ProTrack ERP Cloud • Sẵn sàng phát triển
      </footer>
    </div>
  );
}
