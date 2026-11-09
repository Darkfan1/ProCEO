import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Plus,
  Sparkles,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ChevronDown,
  ChevronRight,
  Sliders,
  Filter,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  OkrObjective,
  OkrKeyResult,
  CeoTabId,
  SmartTask,
  NavigationContextIntent,
  isDriActionTask,
} from '../../types/ceoTypes';
import { ErpRadarMetrics } from '../../types/erpTypes';
import { dialogService } from '../common/CustomDialog';
import { triggerPrint } from '../../utils/printUtils';
import { getLocalTodayYmd } from '../../utils/dateUtils';
import { ceoAiService } from '../../services/ceoAiService';

interface OkrManagementViewProps {
  okrs: OkrObjective[];
  smartTasks?: SmartTask[];
  onSaveOkr: (okr: OkrObjective) => Promise<void> | void;
  onDeleteOkr: (id: string) => Promise<void> | void;
  navIntent?: NavigationContextIntent | null;
  onClearIntent?: () => void;
  onNavigateTab: (tab: CeoTabId, subView?: string, prefill?: any) => void;
  activeUserName?: string;
  radarMetrics?: ErpRadarMetrics;
}

export const OkrManagementView: React.FC<OkrManagementViewProps> = ({
  okrs,
  smartTasks = [],
  onSaveOkr,
  onDeleteOkr,
  navIntent,
  onClearIntent,
  onNavigateTab,
  activeUserName = 'CEO',
  radarMetrics,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [expandedOkrId, setExpandedOkrId] = useState<string | null>(okrs[0]?.id || null);

  // Modal Create/Edit Objective
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOkr, setEditingOkr] = useState<OkrObjective | null>(null);

  // Modal Check-in KR
  const [checkInModal, setCheckInModal] = useState<{
    okr: OkrObjective;
    kr: OkrKeyResult;
    newValue: number;
    note: string;
  } | null>(null);

  // Form State
  const [formQuarter, setFormQuarter] = useState('Q4/2026');
  const [formTitle, setFormTitle] = useState('');
  const [formDept, setFormDept] = useState('Ban Giám Đốc');
  const [formOwner, setFormOwner] = useState(activeUserName);
  const [formPriority, setFormPriority] = useState<'P0' | 'P1' | 'P2'>('P0');
  const [formKeyResults, setFormKeyResults] = useState<OkrKeyResult[]>([
    {
      id: `kr-${Date.now()}-1`,
      title: '',
      startValue: 0,
      targetValue: 100,
      currentValue: 0,
      unit: '%',
    },
  ]);

  // AI Diagnostic State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Nhận dữ liệu chuyển tiếp 1-Click từ Chiến lược SWOT & TOWS
  useEffect(() => {
    if (!navIntent || navIntent.tab !== 'okr') return;
    setEditingOkr(null);
    setFormQuarter('Q4/2026');
    setFormTitle(navIntent.prefillTitle || '');
    setFormDept('Ban Giám Đốc');
    setFormOwner(navIntent.prefillAssignee || activeUserName);
    setFormPriority('P0');
    setFormKeyResults([
      {
        id: `kr-${Date.now()}-1`,
        title: navIntent.prefillTitle
          ? `Chỉ số kết quả then chốt cho: ${navIntent.prefillTitle}`
          : '',
        startValue: 0,
        targetValue: 100,
        currentValue: 0,
        unit: '%',
      },
    ]);
    setModalOpen(true);
    onClearIntent?.();
  }, [navIntent, onClearIntent, activeUserName]);

  // Filtered OKRs
  const filteredOkrs = useMemo(() => {
    return okrs.filter((o) => {
      const matchQ = selectedQuarter === 'ALL' || o.quarter === selectedQuarter;
      const matchP = selectedPriority === 'ALL' || o.priority === selectedPriority;
      return matchQ && matchP;
    });
  }, [okrs, selectedQuarter, selectedPriority]);

  // Quarters available
  const availableQuarters = useMemo(() => {
    const set = new Set(okrs.map((o) => o.quarter || 'Q4/2026'));
    return Array.from(set);
  }, [okrs]);

  const openCreateModal = () => {
    setEditingOkr(null);
    setFormQuarter('Q4/2026');
    setFormTitle('');
    setFormDept('Ban Giám Đốc');
    setFormOwner(activeUserName);
    setFormPriority('P0');
    setFormKeyResults([
      {
        id: `kr-${Date.now()}-1`,
        title: 'Đạt doanh số quý 15 tỷ VNĐ',
        startValue: 0,
        targetValue: 15,
        currentValue: 3.5,
        unit: 'Tỷ VNĐ',
      },
      {
        id: `kr-${Date.now()}-2`,
        title: 'Giảm tỷ lệ phế phẩm xưởng in xuống dưới 1.5%',
        startValue: 2.8,
        targetValue: 1.5,
        currentValue: 2.1,
        unit: '%',
      },
    ]);
    setModalOpen(true);
  };

  const openEditModal = (okr: OkrObjective) => {
    setEditingOkr(okr);
    setFormQuarter(okr.quarter);
    setFormTitle(okr.title);
    setFormDept(okr.department);
    setFormOwner(okr.ownerName);
    setFormPriority(okr.priority);
    setFormKeyResults(
      okr.keyResults && okr.keyResults.length > 0
        ? [...okr.keyResults]
        : [
            {
              id: `kr-${Date.now()}`,
              title: '',
              startValue: 0,
              targetValue: 100,
              currentValue: 0,
              unit: '%',
            },
          ]
    );
    setModalOpen(true);
  };

  const handleAddKrField = () => {
    setFormKeyResults((prev) => [
      ...prev,
      {
        id: `kr-${Date.now()}-${prev.length + 1}`,
        title: '',
        startValue: 0,
        targetValue: 100,
        currentValue: 0,
        unit: '%',
      },
    ]);
  };

  const handleRemoveKrField = (id: string) => {
    if (formKeyResults.length <= 1) {
      dialogService.toast('Mỗi Objective phải có tối thiểu 1 Key Result đo lường.', 'warning');
      return;
    }
    setFormKeyResults((prev) => prev.filter((k) => k.id !== id));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      dialogService.toast('Vui lòng nhập tiêu đề Mục tiêu Chiến lược (Objective).', 'warning');
      return;
    }

    const cleanedKrs = formKeyResults.filter((k) => k.title.trim() !== '');
    if (cleanedKrs.length === 0) {
      dialogService.toast('Cần ít nhất một Key Result có tiêu đề rõ ràng.', 'warning');
      return;
    }

    const payload: OkrObjective = {
      id: editingOkr ? editingOkr.id : `okr-${Date.now()}`,
      quarter: formQuarter,
      title: formTitle.trim(),
      department: formDept.trim() || 'Ban Giám Đốc',
      ownerName: formOwner.trim() || activeUserName,
      priority: formPriority,
      keyResults: cleanedKrs,
      createdAt: editingOkr?.createdAt || new Date().toISOString(),
    };

    await onSaveOkr(payload);
    setModalOpen(false);
    dialogService.toast(editingOkr ? 'Đã cập nhật OKR!' : 'Đã khởi tạo OKR chiến lược mới!', 'success');
  };

  const handleApplyCheckIn = async () => {
    if (!checkInModal) return;
    const { okr, kr, newValue } = checkInModal;
    const updatedKrs = okr.keyResults.map((k) => (k.id === kr.id ? { ...k, currentValue: newValue } : k));
    await onSaveOkr({ ...okr, keyResults: updatedKrs });
    setCheckInModal(null);
    dialogService.toast(`Đã cập nhật chỉ số KR: ${newValue} ${kr.unit}`, 'success');
  };

  const handleDelete = async (okr: OkrObjective) => {
    const ok = await dialogService.confirm(
      `Bạn có chắc chắn muốn xóa mục tiêu "${okr.title}" cùng toàn bộ Key Results liên quan?`,
      'Xóa Objective Chiến Lược'
    );
    if (ok) {
      await onDeleteOkr(okr.id);
      dialogService.toast('Đã xóa OKR!', 'info');
    }
  };

  const calculateOkrProgress = (okr: OkrObjective): number => {
    const krs = okr.keyResults || [];
    if (krs.length === 0) return 0;
    const total = krs.reduce((acc, kr) => {
      const span = kr.targetValue - kr.startValue || 1;
      const progress = Math.max(0, Math.min(100, ((kr.currentValue - kr.startValue) / span) * 100));
      return acc + progress;
    }, 0);
    return Math.round(total / krs.length);
  };

  const getStatusBadge = (progress: number) => {
    if (progress === 100)
      return {
        label: 'Hoàn thành',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: CheckCircle2,
      };
    if (progress >= 70)
      return {
        label: 'Đúng tiến độ',
        bg: 'bg-teal-100 text-teal-800 border-teal-200',
        icon: TrendingUp,
      };
    if (progress >= 40)
      return {
        label: 'Nguy cơ trễ',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: AlertTriangle,
      };
    return {
      label: 'Chậm tiến độ',
      bg: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: Clock,
    };
  };

  const handleAiDiagnoseOkr = async (okr: OkrObjective) => {
    setAiAnalyzing(true);
    try {
      const krsText = okr.keyResults
        .map((k) => `• ${k.title}: ${k.currentValue}/${k.targetValue} ${k.unit}`)
        .join('\n');
      const progress = calculateOkrProgress(okr);

      const prompt = `Bạn là Trợ lý Chiến lược C-Level cho CEO. Hãy phân tích Objective sau:
Mục tiêu: "${okr.title}" (Quý: ${okr.quarter}, Ưu tiên: ${okr.priority}, Tiến độ tổng thể: ${progress}%).
Danh sách Key Results hiện tại:
${krsText}

Yêu cầu đầu ra:
1. Đánh giá tính khả thi và rủi ro chính.
2. Phát hiện Key Result nào đang nghẽn.
3. Đề xuất 2-3 hành động điều hành cụ thể (liên kết sang SMART hoặc PDCA).`;

      const analysis = await ceoAiService.chatWithExecutiveAdvisor({
        userMessage: prompt,
        systemContext: 'C-Level Strategic OKR Evaluator',
      });

      dialogService.alert(analysis, 'Phân Tích Chiến Lược OKR (AI C-Level Advisor)');
    } catch {
      dialogService.toast('Không thể kết nối AI, vui lòng thử lại sau.', 'warning');
    } finally {
      setAiAnalyzing(false);
    }
  };

  return (
    <div id="okr-print-section" className="space-y-4">
      {/* THANH BỘ LỌC & THAO TÁC OKR (Không lặp lại tiêu đề từ Header bar) */}
      <div className="glass-liquid flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Bộ lọc:</span>
          </div>

          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 text-xs focus:outline-none"
          >
            <option value="ALL">Tất cả Quý ({okrs.length})</option>
            {availableQuarters.map((q) => (
              <option key={q} value={q}>
                Quý {q}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 text-xs focus:outline-none"
          >
            <option value="ALL">Mọi ưu tiên</option>
            <option value="P0">P0 – Sống còn</option>
            <option value="P1">P1 – Quan trọng</option>
            <option value="P2">P2 – Tiêu chuẩn</option>
          </select>

          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            ({filteredOkrs.length} mục tiêu)
          </span>
        </div>

        <div className="flex items-center gap-2 no-print shrink-0">
          <button
            onClick={() => triggerPrint('okr-print-section', 'ProCEO_OKR_Report')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In OKR</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 text-white cursor-pointer bg-slate-900 hover:bg-slate-800 shadow-xs transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Thêm Mục Tiêu OKR</span>
          </button>
        </div>
      </div>

      {/* OKR LIST */}
      <div className="space-y-3">
        {filteredOkrs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-liquid border border-dashed border-slate-300 space-y-2">
            <Target className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700">Chưa có Objective nào</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Thiết lập mục tiêu định hướng chiến lược theo quý để dẫn dắt các mục tiêu SMART và dự án thực thi.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-900 text-white inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tạo Objective Đầu Tiên</span>
            </button>
          </div>
        ) : (
          filteredOkrs.map((okr) => {
            const progress = calculateOkrProgress(okr);
            const status = getStatusBadge(progress);
            const isExpanded = expandedOkrId === okr.id;

            return (
              <div
                key={okr.id}
                className="glass-liquid overflow-hidden group transition-all"
              >
                {/* OKR HEADER ROW */}
                <div
                  onClick={() => setExpandedOkrId(isExpanded ? null : okr.id)}
                  className="p-3.5 sm:p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 shrink-0 mt-0.5"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#14283F]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${status.bg}`}
                        >
                          {status.label}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                          {okr.quarter}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-black ${
                            okr.priority === 'P0'
                              ? 'bg-rose-100 text-rose-800'
                              : okr.priority === 'P1'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {okr.priority}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {okr.department} • Phụ trách: <strong className="text-slate-800">{okr.ownerName}</strong>
                        </span>
                        {(() => {
                          const linkedGoals = smartTasks.filter(
                            (t) => !isDriActionTask(t) && t.linkedOkrId === okr.id
                          );
                          if (linkedGoals.length === 0) return null;
                          const doneGoals = linkedGoals.filter((t) => t.status === 'DONE').length;
                          return (
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                              🎯 {doneGoals}/{linkedGoals.length} SMART hoàn thành
                            </span>
                          );
                        })()}
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#14283F] transition-colors">
                        {okr.title}
                      </h3>
                    </div>
                  </div>

                  {/* PROGRESS & ACTIONS */}
                  <div className="flex items-center gap-4 sm:shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1.5 justify-end">
                        <span className="font-black text-sm text-[#14283F]">{progress}%</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({okr.keyResults?.length || 0} KRs)
                        </span>
                      </div>
                      <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress === 100
                              ? 'bg-emerald-600'
                              : progress >= 70
                              ? 'bg-teal-600'
                              : progress >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleAiDiagnoseOkr(okr)}
                        disabled={aiAnalyzing}
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer transition-colors"
                        title="AI Chẩn đoán rủi ro OKR"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C6A66B]" />
                      </button>
                      <button
                        onClick={() => openEditModal(okr)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                        title="Sửa Objective"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(okr)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors"
                        title="Xóa Objective"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* KEY RESULTS EXPANDED TABLE */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[#14283F]" />
                        Danh sách Key Results ({okr.keyResults?.length || 0})
                      </span>
                      <button
                        onClick={() =>
                          onNavigateTab('smart', undefined, {
                            title: `Hành động cho OKR: ${okr.title}`,
                            assignee: okr.ownerName,
                            okrId: okr.id,
                            description: `Đóng góp trực tiếp cho OKR ${okr.quarter}: ${okr.title}`,
                          })
                        }
                        className="text-[11px] font-bold text-[#14283F] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Chuyển hóa thành Mục tiêu SMART</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#C6A66B]" />
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Key Result (Chỉ số đo lường then chốt)</th>
                            <th className="py-2.5 px-3 text-center">Bắt đầu</th>
                            <th className="py-2.5 px-3 text-center">Hiện tại</th>
                            <th className="py-2.5 px-3 text-center">Mục tiêu</th>
                            <th className="py-2.5 px-3 w-32">Tiến độ</th>
                            <th className="py-2.5 px-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {okr.keyResults?.map((kr) => {
                            const span = kr.targetValue - kr.startValue || 1;
                            const krProg = Math.max(
                              0,
                              Math.min(100, Math.round(((kr.currentValue - kr.startValue) / span) * 100))
                            );

                            return (
                              <tr key={kr.id} className="hover:bg-slate-50/80 transition-colors group/row">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {kr.title}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                                  {kr.startValue} {kr.unit}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-[#14283F]">
                                  {kr.currentValue} {kr.unit}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                                  {kr.targetValue} {kr.unit}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-[10.5px] text-slate-700 w-8">
                                      {krProg}%
                                    </span>
                                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#14283F] rounded-full"
                                        style={{ width: `${krProg}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                                  <div className="opacity-0 group-hover/row:opacity-100 transition-opacity inline-flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        onNavigateTab('smart', undefined, {
                                          title: kr.title,
                                          assignee: okr.ownerName,
                                          okrId: okr.id,
                                          description: `Thực thi KR (${kr.targetValue} ${kr.unit}) thuộc OKR ${okr.quarter}: ${okr.title}`,
                                        })
                                      }
                                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold cursor-pointer transition-colors"
                                      title="Bẻ nhỏ Key Result này thành Mục tiêu định lượng SMART"
                                    >
                                      + Giao SMART
                                    </button>
                                    <button
                                      onClick={() =>
                                        setCheckInModal({
                                          okr,
                                          kr,
                                          newValue: kr.currentValue,
                                          note: '',
                                        })
                                      }
                                      className="px-2 py-1 rounded bg-[#14283F] text-white hover:bg-[#1E3A5F] text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                                    >
                                      Check-in
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
              </div>
            );
          })
        )}
      </div>

      {/* MODAL CREATE / EDIT OBJECTIVE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-[#14283F]">
                {editingOkr ? 'Chỉnh Sửa Objective' : 'Thêm Objective Mới (Mục Tiêu Chiến Lược)'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quý áp dụng</label>
                  <input
                    type="text"
                    value={formQuarter}
                    onChange={(e) => setFormQuarter(e.target.value)}
                    placeholder="VD: Q4/2026"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mức độ ưu tiên</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="P0">P0 – Sống còn (Must-win)</option>
                    <option value="P1">P1 – Trọng tâm</option>
                    <option value="P2">P2 – Tiêu chuẩn</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phòng ban</label>
                  <input
                    type="text"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="Ban Giám Đốc"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tiêu đề Objective (Mục tiêu định hướng truyền cảm hứng) *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Thống lĩnh thị phần bao bì tem nhãn khu vực miền Trung và tối ưu hiệu suất xưởng in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#14283F]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Người chịu trách nhiệm chính (DRI)</label>
                <input
                  type="text"
                  value={formOwner}
                  onChange={(e) => setFormOwner(e.target.value)}
                  placeholder="CEO / Giám Đốc Điều Hành"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              {/* DYNAMIC KEY RESULTS */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 uppercase text-[11px]">
                    Key Results Đo Lường Định Lượng ({formKeyResults.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddKrField}
                    className="text-[11px] font-bold text-[#14283F] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C6A66B]" />
                    <span>+ Thêm KR</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formKeyResults.map((kr, idx) => (
                    <div
                      key={kr.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-600 text-[10px]">KR #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKrField(kr.id)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                        >
                          Xóa KR
                        </button>
                      </div>

                      <input
                        type="text"
                        value={kr.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormKeyResults((prev) =>
                            prev.map((k) => (k.id === kr.id ? { ...k, title: val } : k))
                          );
                        }}
                        placeholder="VD: Đạt 15 tỷ doanh số ngành hàng Flexo..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                        required
                      />

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Bắt đầu</label>
                          <input
                            type="number"
                            value={kr.startValue}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setFormKeyResults((prev) =>
                                prev.map((k) => (k.id === kr.id ? { ...k, startValue: v } : k))
                              );
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Hiện tại</label>
                          <input
                            type="number"
                            value={kr.currentValue}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setFormKeyResults((prev) =>
                                prev.map((k) => (k.id === kr.id ? { ...k, currentValue: v } : k))
                              );
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-mono font-bold text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Mục tiêu</label>
                          <input
                            type="number"
                            value={kr.targetValue}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setFormKeyResults((prev) =>
                                prev.map((k) => (k.id === kr.id ? { ...k, targetValue: v } : k))
                              );
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-mono font-bold text-center text-emerald-700"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Đơn vị</label>
                          <input
                            type="text"
                            value={kr.unit}
                            onChange={(e) => {
                              const v = e.target.value;
                              setFormKeyResults((prev) =>
                                prev.map((k) => (k.id === kr.id ? { ...k, unit: v } : k))
                              );
                            }}
                            placeholder="%, Tỷ, Đơn"
                            className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#14283F] text-white font-bold cursor-pointer hover:bg-[#1E3A5F] shadow-xs"
                >
                  {editingOkr ? 'Lưu Thay Đổi' : 'Khởi Tạo Objective'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHECK-IN KR */}
      {checkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-black text-sm text-[#14283F]">Check-in Tiến Độ KR</h4>
              <button
                onClick={() => setCheckInModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Key Result</span>
                <p className="font-bold text-slate-900 text-sm">{checkInModal.kr.title}</p>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Mục tiêu đạt: {checkInModal.kr.targetValue} {checkInModal.kr.unit}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Giá trị thực tế mới ({checkInModal.kr.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={checkInModal.newValue}
                  onChange={(e) =>
                    setCheckInModal({ ...checkInModal, newValue: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-lg text-[#14283F] text-center"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú check-in</label>
                <input
                  type="text"
                  value={checkInModal.note}
                  onChange={(e) =>
                    setCheckInModal({ ...checkInModal, note: e.target.value })
                  }
                  placeholder="VD: Sản lượng tuần 44 tăng trưởng mạnh..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setCheckInModal(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleApplyCheckIn}
                className="px-4 py-1.5 rounded-xl bg-[#14283F] text-white font-bold cursor-pointer shadow-xs"
              >
                Lưu Check-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
