import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Flame,
  Wrench,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Eye,
  Camera,
  FileCheck2,
  Layers,
  Sparkles,
  BookOpen,
  Check,
  X,
  Printer,
  Trash2,
} from 'lucide-react';
import {
  AndonIssue,
  AndonStatus,
  AndonSeverity,
  AndonCategory,
  CeoTabId,
} from '../../types/ceoTypes';
import { ErpStaffMember } from '../../types/erpTypes';
import { dialogService } from '../common/CustomDialog';
import { triggerPrint } from '../../utils/printUtils';
import { getLocalTodayYmd } from '../../utils/dateUtils';

interface AndonBoardViewProps {
  andonIssues: AndonIssue[];
  onSaveIssue: (issue: AndonIssue) => Promise<void> | void;
  onDeleteIssue?: (id: string) => Promise<void> | void;
  onOpenAndonModal: () => void;
  onNavigateTab: (tab: CeoTabId, subView?: string, prefill?: any) => void;
  staffDirectory?: ErpStaffMember[];
}

const KANBAN_STAGES: Array<{
  status: AndonStatus;
  title: string;
  badge: string;
  bg: string;
  border: string;
  description: string;
}> = [
  {
    status: 'REPORTED',
    title: '1. Vừa Báo Cáo',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    bg: 'bg-rose-50/40',
    border: 'border-rose-200',
    description: 'Chờ tiếp nhận & phân loại',
  },
  {
    status: 'TRIAGING',
    title: '2. Đang Phân Loại',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    bg: 'bg-amber-50/40',
    border: 'border-amber-200',
    description: 'Xác định mức độ & gán Single DRI',
  },
  {
    status: 'RCA',
    title: '3. Phân Tích 5 Whys',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    bg: 'bg-purple-50/40',
    border: 'border-purple-200',
    description: 'Tìm nguyên nhân gốc rễ & Fishbone',
  },
  {
    status: 'ACTION_IN_PROGRESS',
    title: '4. Đang Khắc Phục',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    bg: 'bg-blue-50/40',
    border: 'border-blue-200',
    description: 'DRI thực hiện hành động sửa chữa',
  },
  {
    status: 'VERIFICATION',
    title: '5. Kiểm Chứng',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    bg: 'bg-teal-50/40',
    border: 'border-teal-200',
    description: 'Theo dõi 1-2 tuần, chống tái phát',
  },
  {
    status: 'CLOSED_STANDARDIZED',
    title: '6. Chuẩn Hóa SOP',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bg: 'bg-emerald-50/40',
    border: 'border-emerald-200',
    description: 'Đóng gói vào quy trình chuẩn',
  },
];

export const AndonBoardView: React.FC<AndonBoardViewProps> = ({
  andonIssues,
  onSaveIssue,
  onDeleteIssue,
  onOpenAndonModal,
  onNavigateTab,
  staffDirectory = [],
}) => {
  const todayYmd = getLocalTodayYmd();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Detail / 5 Whys Modal State
  const [selectedIssue, setSelectedIssue] = useState<AndonIssue | null>(null);
  const [editWhy1, setEditWhy1] = useState('');
  const [editWhy2, setEditWhy2] = useState('');
  const [editWhy3, setEditWhy3] = useState('');
  const [editWhy4, setEditWhy4] = useState('');
  const [editWhy5, setEditWhy5] = useState('');
  const [editPreventive, setEditPreventive] = useState('');
  const [editSopCode, setEditSopCode] = useState('');

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = andonIssues.length;
    const lineStop = andonIssues.filter((i) => i.severity === 'LINE_STOP' && i.status !== 'CLOSED_STANDARDIZED').length;
    const critical = andonIssues.filter((i) => i.severity === 'CRITICAL' && i.status !== 'CLOSED_STANDARDIZED').length;
    const inProgress = andonIssues.filter((i) => i.status === 'ACTION_IN_PROGRESS' || i.status === 'RCA').length;
    const standardized = andonIssues.filter((i) => i.status === 'CLOSED_STANDARDIZED').length;
    return { total, lineStop, critical, inProgress, standardized };
  }, [andonIssues]);

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    return andonIssues.filter((issue) => {
      if (filterSeverity !== 'ALL' && issue.severity !== filterSeverity) return false;
      if (filterCategory !== 'ALL' && issue.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = issue.issueCode.toLowerCase().includes(q);
        const matchLine = issue.lineOrMachine.toLowerCase().includes(q);
        const matchDesc = issue.description.toLowerCase().includes(q);
        const matchLsx = (issue.productOrLsxCode || '').toLowerCase().includes(q);
        const matchDri = issue.driName.toLowerCase().includes(q);
        if (!matchCode && !matchLine && !matchDesc && !matchLsx && !matchDri) return false;
      }
      return true;
    });
  }, [andonIssues, filterSeverity, filterCategory, searchQuery]);

  const handleOpenDetail = (issue: AndonIssue) => {
    setSelectedIssue(issue);
    const whys = issue.fiveWhys || [];
    setEditWhy1(whys[0] || '');
    setEditWhy2(whys[1] || '');
    setEditWhy3(whys[2] || '');
    setEditWhy4(whys[3] || '');
    setEditWhy5(whys[4] || '');
    setEditPreventive(issue.preventiveAction || '');
    setEditSopCode(issue.sopUpdatedCode || `SOP-MVDN-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleSaveRca = async () => {
    if (!selectedIssue) return;
    const whysList = [editWhy1, editWhy2, editWhy3, editWhy4, editWhy5].filter((w) => w.trim() !== '');
    const updated: AndonIssue = {
      ...selectedIssue,
      fiveWhys: whysList.length > 0 ? whysList : undefined,
      preventiveAction: editPreventive.trim() || undefined,
      sopUpdatedCode: editSopCode.trim() || undefined,
    };
    await onSaveIssue(updated);
    setSelectedIssue(null);
    dialogService.toast('Đã lưu phân tích nguyên nhân gốc rễ 5 Whys & hành động phòng ngừa!', 'success');
  };

  const handleAdvanceStatus = async (issue: AndonIssue, nextStatus: AndonStatus) => {
    const updated: AndonIssue = {
      ...issue,
      status: nextStatus,
      verifiedAt: nextStatus === 'VERIFICATION' || nextStatus === 'CLOSED_STANDARDIZED' ? todayYmd : issue.verifiedAt,
    };
    await onSaveIssue(updated);
    dialogService.toast(`Đã chuyển sự cố ${issue.issueCode} sang trạng thái mới!`, 'success');
  };

  const getSeverityBadge = (sev: AndonSeverity) => {
    switch (sev) {
      case 'LINE_STOP':
        return {
          label: 'DỪNG DÂY CHUYỀN',
          bg: 'bg-rose-100 text-rose-900 border-rose-300 font-black animate-pulse',
          icon: Flame,
        };
      case 'CRITICAL':
        return {
          label: 'NGHIÊM TRỌNG',
          bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          icon: AlertTriangle,
        };
      default:
        return {
          label: 'NHẸ / CẢNH BÁO',
          bg: 'bg-blue-100 text-blue-900 border-blue-200 font-semibold',
          icon: Wrench,
        };
    }
  };

  const getCategoryLabel = (cat: AndonCategory) => {
    switch (cat) {
      case 'MACHINE_STOP':
        return '🛑 Hỏng máy / Cơ khí';
      case 'QUALITY_DEFECT':
        return '⚠️ Lỗi in / Lệch màu';
      case 'SETUP_DELAY':
        return '⏱️ Setup chậm';
      case 'MISSING_MATERIAL':
        return '📦 Thiếu vật tư / Màng';
      case 'SAFETY':
        return '🦺 An toàn / PCCC';
      default:
        return '🔧 Sự cố khác';
    }
  };

  return (
    <div id="andon-board-print" className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP STATS CARDS & CONTROLS                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Tổng Sự Cố</span>
            <AlertOctagon className="w-4 h-4 text-slate-700" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-500 ml-1">vụ ghi nhận</span>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
            Đang xử lý: <strong className="text-slate-800">{stats.inProgress}</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800 uppercase">
            <span>Dừng Dây Chuyền</span>
            <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-700">{stats.lineStop}</span>
            <span className="text-[11px] text-rose-600 ml-1">Line Stop mở</span>
          </div>
          <div className="text-[11px] text-rose-700 border-t border-rose-200/60 pt-1.5 font-bold">
            {stats.lineStop > 0 ? '⚠️ Cần CEO & DRI can thiệp gấp' : '✓ Dây chuyền thông suốt'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase">
            <span>Lỗi Nghiêm Trọng</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">{stats.critical}</span>
            <span className="text-[11px] text-amber-600 ml-1">vụ cần kiểm soát</span>
          </div>
          <div className="text-[11px] text-amber-700 border-t border-amber-200/60 pt-1.5">
            Nguy cơ trễ đơn hàng VIP
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase">
            <span>Chuẩn Hóa Vào SOP</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.standardized}</span>
            <span className="text-[11px] text-emerald-600 ml-1">quy trình đã đóng</span>
          </div>
          <div className="text-[11px] text-emerald-700 border-t border-emerald-200/60 pt-1.5 font-semibold">
            Đóng gói tri thức ngăn tái phát
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. HEADER ACTIONS & FILTER BAR                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã sự cố, máy in, LSX, DRI..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-slate-800 transition-all"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
          >
            <option value="ALL">Mọi mức độ</option>
            <option value="LINE_STOP">Dừng dây chuyền</option>
            <option value="CRITICAL">Nghiêm trọng</option>
            <option value="MINOR">Nhẹ / Cảnh báo</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold outline-none focus:border-slate-800"
          >
            <option value="ALL">Mọi loại sự cố</option>
            <option value="MACHINE_STOP">Máy dừng / Cơ khí</option>
            <option value="QUALITY_DEFECT">Lỗi chất lượng</option>
            <option value="SETUP_DELAY">Setup chậm</option>
            <option value="MISSING_MATERIAL">Thiếu vật tư</option>
            <option value="SAFETY">An toàn</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAndonModal}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>🚨 Báo Sự Cố Andon</span>
          </button>

          <button
            type="button"
            onClick={() => triggerPrint('andon-board-print', `ProCEO_Andon_Board_${todayYmd}`)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            title="In bảng Andon"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. KANBAN BOARD 6 CỘT KHÉP KÍN (REPORTED -> STANDARDIZED SOP)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 min-w-[1200px]">
          {KANBAN_STAGES.map((col) => {
            const columnIssues = filteredIssues.filter((i) => i.status === col.status);

            return (
              <div
                key={col.status}
                className={`p-3 rounded-2xl border ${col.border} ${col.bg} flex flex-col justify-between min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="space-y-1 pb-2 border-b border-slate-200/80 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 tracking-tight">
                      {col.title}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border ${col.badge}`}>
                      {columnIssues.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    {col.description}
                  </p>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {columnIssues.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-400 italic">
                      Trống
                    </div>
                  ) : (
                    columnIssues.map((issue) => {
                      const sevBadge = getSeverityBadge(issue.severity);
                      const SevIcon = sevBadge.icon;

                      return (
                        <div
                          key={issue.id}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all space-y-2 group"
                        >
                          {/* Card Header: Code + Severity */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-bold text-[10.5px] text-slate-800">
                              {issue.issueCode}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${sevBadge.bg}`}>
                              <SevIcon className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{sevBadge.label}</span>
                            </span>
                          </div>

                          {/* Machine & Category */}
                          <div className="space-y-0.5">
                            <div className="text-[10px] text-slate-500 font-semibold truncate">
                              {getCategoryLabel(issue.category)}
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                              {issue.lineOrMachine}
                            </h4>
                          </div>

                          {/* Description */}
                          <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            {issue.description}
                          </p>

                          {/* Image preview thumbnail if present */}
                          {issue.imageUrl && (
                            <div
                              onClick={() => setPreviewImage(issue.imageUrl || null)}
                              className="relative rounded-lg overflow-hidden border border-slate-200 h-16 bg-slate-100 cursor-pointer group/img"
                            >
                              <img src={issue.imageUrl} alt="Ảnh hiện trường" className="object-cover w-full h-full" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <Eye className="w-3.5 h-3.5" /> Xem ảnh
                              </div>
                            </div>
                          )}

                          {/* Corrective Action Task */}
                          {issue.correctiveActionTitle && (
                            <div className="text-[10.5px] text-indigo-700 bg-indigo-50/70 p-1.5 rounded border border-indigo-100 font-medium space-y-0.5">
                              <div className="font-bold flex items-center gap-1">
                                <FileCheck2 className="w-3 h-3 text-indigo-600" />
                                <span className="truncate">Hành động khắc phục:</span>
                              </div>
                              <div className="line-clamp-1">{issue.correctiveActionTitle}</div>
                              <div className="text-[9.5px] text-slate-500">Hạn: {issue.correctiveActionDueDate || todayYmd}</div>
                            </div>
                          )}

                          {/* 5 Whys Status Badge */}
                          {issue.fiveWhys && issue.fiveWhys.length > 0 && (
                            <div className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                              <span>🔍 Đã phân tích {issue.fiveWhys.length} bước 5 Whys</span>
                            </div>
                          )}

                          {/* DRI & Detected At */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                            <span className="truncate font-semibold text-slate-700">👤 {issue.driName}</span>
                            <span className="font-mono text-slate-400">{issue.detectedAt.slice(11, 16)}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-1 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(issue)}
                              className="px-2 py-0.8 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                            >
                              5 Whys & RCA
                            </button>

                            {/* Advance stage button */}
                            {col.status === 'REPORTED' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceStatus(issue, 'TRIAGING')}
                                className="px-2 py-0.8 rounded text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors flex items-center gap-0.5"
                              >
                                <span>Phân loại</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {col.status === 'TRIAGING' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceStatus(issue, 'RCA')}
                                className="px-2 py-0.8 rounded text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition-colors flex items-center gap-0.5"
                              >
                                <span>Làm RCA</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {col.status === 'RCA' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceStatus(issue, 'ACTION_IN_PROGRESS')}
                                className="px-2 py-0.8 rounded text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors flex items-center gap-0.5"
                              >
                                <span>Xử lý</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {col.status === 'ACTION_IN_PROGRESS' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceStatus(issue, 'VERIFICATION')}
                                className="px-2 py-0.8 rounded text-[10px] font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer transition-colors flex items-center gap-0.5"
                              >
                                <span>Kiểm chứng</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {col.status === 'VERIFICATION' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceStatus(issue, 'CLOSED_STANDARDIZED')}
                                className="px-2 py-0.8 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors flex items-center gap-0.5"
                              >
                                <span>Đóng SOP</span>
                                <Check className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL CHI TIẾT 5 WHYS & PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (RCA)           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-white/10 text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Phân Tích Nguyên Nhân Gốc Rễ (5 Whys / Fishbone)
                  </h3>
                  <p className="text-xs text-purple-200">
                    Sự cố {selectedIssue.issueCode}: {selectedIssue.lineOrMachine}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">Hiện tượng sự cố:</span>
                <p className="text-slate-700">{selectedIssue.description}</p>
                <span className="text-[10.5px] text-slate-500 block">Single DRI phụ trách: {selectedIssue.driName}</span>
              </div>

              {/* 5 Whys Chain */}
              <div className="space-y-2.5 rounded-xl border border-purple-100 bg-purple-50/30 p-3.5">
                <span className="font-bold text-purple-950 block">
                  Chuỗi 5 Câu Hỏi &quot;Tại Sao?&quot; (5 Whys Chain):
                </span>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Tại sao 1 (Hiện tượng bề mặt):</label>
                  <input
                    type="text"
                    value={editWhy1}
                    onChange={(e) => setEditWhy1(e.target.value)}
                    placeholder="VD: Màng decal bị quấn vào trục in số 3"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Tại sao 2:</label>
                  <input
                    type="text"
                    value={editWhy2}
                    onChange={(e) => setEditWhy2(e.target.value)}
                    placeholder="VD: Vì lực căng màng bị chùng đột ngột"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Tại sao 3:</label>
                  <input
                    type="text"
                    value={editWhy3}
                    onChange={(e) => setEditWhy3(e.target.value)}
                    placeholder="VD: Vì cảm biến lực căng bị bám bụi mực dẫn đến tín hiệu sai"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Tại sao 4:</label>
                  <input
                    type="text"
                    value={editWhy4}
                    onChange={(e) => setEditWhy4(e.target.value)}
                    placeholder="VD: Vì nắp chắn bảo vệ cảm biến bị gãy chưa được thay thế"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Tại sao 5 (Nguyên nhân gốc rễ hệ thống):</label>
                  <input
                    type="text"
                    value={editWhy5}
                    onChange={(e) => setEditWhy5(e.target.value)}
                    placeholder="VD: Vì thiếu hạng mục kiểm tra nắp chắn cảm biến trong checklist bảo dưỡng tuần"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-purple-900 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Hành Động Phòng Ngừa & SOP */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Hành động ngăn ngừa tái diễn (Preventive Action) (*)
                  </label>
                  <textarea
                    rows={2}
                    value={editPreventive}
                    onChange={(e) => setEditPreventive(e.target.value)}
                    placeholder="VD: Lắp đặt nắp che bụi mực bằng mica trong suốt và bổ sung vào bảng kiểm tra bảo dưỡng máy in..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 outline-none focus:border-purple-600 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Mã chuẩn hóa quy trình SOP (Để lưu vào kho tri thức nhà máy)
                  </label>
                  <input
                    type="text"
                    value={editSopCode}
                    onChange={(e) => setEditSopCode(e.target.value)}
                    placeholder="VD: SOP-FLEXO-MAINT-04"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-indigo-900 outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleSaveRca}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Phân Tích & Chuẩn Hóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM ẢNH FULLSCREEN */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={previewImage} alt="Ảnh sự cố" className="object-contain max-h-[85vh] rounded-xl shadow-2xl" />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
