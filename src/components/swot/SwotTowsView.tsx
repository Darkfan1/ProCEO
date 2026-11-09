import React, { useState, useMemo } from 'react';
import {
  Compass,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  CheckCircle2,
  ArrowRight,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Zap,
  Target,
  Layers,
  ArrowUpRight,
  CheckSquare,
} from 'lucide-react';
import { SwotBoard, SwotEntry, TowsStrategicAction, CeoTabId } from '../../types/ceoTypes';
import { dialogService } from '../common/CustomDialog';
import { triggerPrint } from '../../utils/printUtils';
import { getLocalTodayYmd } from '../../utils/dateUtils';
import { ceoAiService } from '../../services/ceoAiService';

interface SwotTowsViewProps {
  swotBoards: SwotBoard[];
  onSaveSwotBoard: (board: SwotBoard) => Promise<void> | void;
  onNavigateTab: (tab: CeoTabId, subView?: string, prefill?: any) => void;
  activeUserName?: string;
}

export const SwotTowsView: React.FC<SwotTowsViewProps> = ({
  swotBoards,
  onSaveSwotBoard,
  onNavigateTab,
  activeUserName = 'CEO',
}) => {
  const currentBoard = useMemo(() => {
    return (
      swotBoards[0] || {
        id: `swot-${Date.now()}`,
        title: 'Bản Đồ Chiến Lược Công Ty TNHH In Ấn & Bao Bì MVĐN',
        period: 'Năm 2026 - Tầm nhìn 2027',
        focusDomain: 'Toàn Doanh Nghiệp',
        entries: [],
        towsActions: [],
        updatedAt: new Date().toISOString(),
      }
    );
  }, [swotBoards]);

  // Modal thêm/sửa entry SWOT
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntryType, setEditingEntryType] = useState<'S' | 'W' | 'O' | 'T'>('S');
  const [entryContent, setEntryContent] = useState('');
  const [entryImpact, setEntryImpact] = useState<'HIGH' | 'MEDIUM'>('HIGH');

  // Modal thêm chiến lược TOWS
  const [towsModalOpen, setTowsModalOpen] = useState(false);
  const [towsType, setTowsType] = useState<'SO' | 'WO' | 'ST' | 'WT'>('SO');
  const [towsTitle, setTowsTitle] = useState('');
  const [towsOwner, setTowsOwner] = useState(activeUserName);
  const [towsDueDate, setTowsDueDate] = useState(getLocalTodayYmd());

  // AI Generation State
  const [aiGenerating, setAiGenerating] = useState(false);

  // Phân loại SWOT entries
  const strengths = useMemo(() => (currentBoard.entries || []).filter((e) => e.type === 'S'), [currentBoard]);
  const weaknesses = useMemo(() => (currentBoard.entries || []).filter((e) => e.type === 'W'), [currentBoard]);
  const opportunities = useMemo(() => (currentBoard.entries || []).filter((e) => e.type === 'O'), [currentBoard]);
  const threats = useMemo(() => (currentBoard.entries || []).filter((e) => e.type === 'T'), [currentBoard]);

  const handleOpenAddEntry = (type: 'S' | 'W' | 'O' | 'T') => {
    setEditingEntryType(type);
    setEntryContent('');
    setEntryImpact('HIGH');
    setEntryModalOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryContent.trim()) {
      dialogService.toast('Vui lòng nhập nội dung yếu tố SWOT.', 'warning');
      return;
    }

    const newEntry: SwotEntry = {
      id: `entry-${Date.now()}`,
      type: editingEntryType,
      content: entryContent.trim(),
      impact: entryImpact,
    };

    const updated: SwotBoard = {
      ...currentBoard,
      entries: [...(currentBoard.entries || []), newEntry],
      updatedAt: new Date().toISOString(),
    };

    await onSaveSwotBoard(updated);
    setEntryModalOpen(false);
    dialogService.toast('Đã thêm yếu tố SWOT mới!', 'success');
  };

  const handleDeleteEntry = async (entryId: string) => {
    const updated: SwotBoard = {
      ...currentBoard,
      entries: (currentBoard.entries || []).filter((e) => e.id !== entryId),
      updatedAt: new Date().toISOString(),
    };
    await onSaveSwotBoard(updated);
    dialogService.toast('Đã xóa yếu tố SWOT!', 'info');
  };

  const handleOpenAddTows = (type: 'SO' | 'WO' | 'ST' | 'WT') => {
    setTowsType(type);
    setTowsTitle('');
    setTowsOwner(activeUserName);
    setTowsDueDate(getLocalTodayYmd());
    setTowsModalOpen(true);
  };

  const handleSaveTowsAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!towsTitle.trim()) {
      dialogService.toast('Vui lòng nhập tiêu đề chiến lược hành động.', 'warning');
      return;
    }

    const newAction: TowsStrategicAction = {
      id: `tows-${Date.now()}`,
      strategyType: towsType,
      actionTitle: towsTitle.trim(),
      ownerName: towsOwner.trim() || activeUserName,
      dueDate: towsDueDate,
      status: 'PLANNED',
    };

    const updated: SwotBoard = {
      ...currentBoard,
      towsActions: [...(currentBoard.towsActions || []), newAction],
      updatedAt: new Date().toISOString(),
    };

    await onSaveSwotBoard(updated);
    setTowsModalOpen(false);
    dialogService.toast(`Đã thêm chiến lược hành động ${towsType}!`, 'success');
  };

  const handleToggleTowsStatus = async (action: TowsStrategicAction) => {
    const nextStatus = action.status === 'DONE' ? 'EXECUTING' : action.status === 'EXECUTING' ? 'DONE' : 'EXECUTING';
    const updatedActions = (currentBoard.towsActions || []).map((a) =>
      a.id === action.id ? { ...a, status: nextStatus as any } : a
    );
    await onSaveSwotBoard({ ...currentBoard, towsActions: updatedActions });
  };

  const handleDeleteTowsAction = async (actionId: string) => {
    const updated: SwotBoard = {
      ...currentBoard,
      towsActions: (currentBoard.towsActions || []).filter((a) => a.id !== actionId),
      updatedAt: new Date().toISOString(),
    };
    await onSaveSwotBoard(updated);
    dialogService.toast('Đã xóa chiến lược TOWS!', 'info');
  };

  // AI C-Level Suggests TOWS Actions from SWOT
  const handleAiSuggestTows = async () => {
    if ((currentBoard.entries || []).length < 2) {
      dialogService.toast('Cần ít nhất 2 yếu tố SWOT để AI có thể phân tích ma trận TOWS.', 'warning');
      return;
    }

    setAiGenerating(true);
    try {
      const sText = strengths.map((s) => s.content).join('; ');
      const wText = weaknesses.map((w) => w.content).join('; ');
      const oText = opportunities.map((o) => o.content).join('; ');
      const tText = threats.map((t) => t.content).join('; ');

      const prompt = `Bạn là Trưởng ban Chiến lược Doanh nghiệp (C-Level Advisor). Dưới đây là phân tích SWOT hiện tại của công ty:
- Điểm mạnh (S): ${sText || 'Chưa cập nhật'}
- Điểm yếu (W): ${wText || 'Chưa cập nhật'}
- Cơ hội (O): ${oText || 'Chưa cập nhật'}
- Thách thức (T): ${tText || 'Chưa cập nhật'}

Hãy phân tích mối tương quan và đề xuất 4 chiến lược hành động TOWS cụ thể:
1. Chiến lược SO (Dùng Điểm mạnh chớp Cơ hội)
2. Chiến lược WO (Khắc phục Điểm yếu nhờ Cơ hội)
3. Chiến lược ST (Dùng Điểm mạnh hóa giải Thách thức)
4. Chiến lược WT (Phòng thủ, hạn chế rủi ro rò rỉ và cạnh tranh)

Mỗi chiến lược nêu rõ: Tiêu đề hành động, Bộ phận phụ trách đề xuất, và Chỉ số kết quả then chốt (KR).`;

      const aiResponse = await ceoAiService.chatWithExecutiveAdvisor({
        userMessage: prompt,
        systemContext: 'C-Level Strategic TOWS Formulator',
      });

      dialogService.alert(aiResponse, 'Đề Xuất Chiến Lược TOWS Từ AI Gemini');
    } catch {
      dialogService.toast('Không thể tải gợi ý AI, vui lòng thử lại sau.', 'warning');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div id="swot-tows-print" className="space-y-4">
      {/* THANH ĐIỀU HÀNH TINH GỌN (Không lặp lại tiêu đề từ Header bar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
            Ma Trận Phân Tích SWOT
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-bold">
            {strengths.length + weaknesses.length + opportunities.length + threats.length} Yếu Tố
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAiSuggestTows}
            disabled={aiGenerating}
            className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 text-white cursor-pointer shadow-xs disabled:opacity-50 bg-slate-900 hover:bg-slate-800 transition-transform active:scale-95"
          >
            <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${aiGenerating ? 'animate-spin' : ''}`} />
            <span>{aiGenerating ? 'Đang phân tích...' : 'AI Gợi Ý TOWS'}</span>
          </button>
          <button
            onClick={() => triggerPrint('swot-tows-print', 'ProCEO_SWOT_TOWS_Report')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* MA TRẬN 4 Ô SWOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ô 1: S - STRENGTHS */}
        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="font-extrabold text-sm text-emerald-950">
                S – Điểm Mạnh (Strengths)
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                {strengths.length}
              </span>
            </div>
            <button
              onClick={() => handleOpenAddEntry('S')}
              className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm S</span>
            </button>
          </div>

          <div className="space-y-2">
            {strengths.length === 0 ? (
              <p className="text-xs text-emerald-700/70 italic p-3 text-center">Chưa nhập điểm mạnh nào.</p>
            ) : (
              strengths.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-white border border-emerald-200/70 flex items-start justify-between gap-2 shadow-2xs group"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block leading-snug">{item.content}</span>
                    <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                      Ảnh hưởng: {item.impact}
                    </span>
                  </div>
                  {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() =>
                        onNavigateTab('tasks', undefined, {
                          title: `Phát huy: ${item.content}`,
                          assignee: 'Quản Đốc Sản Xuất',
                          description: `Hành động phát huy điểm mạnh SWOT: ${item.content}`,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                      title="Giao Tác Vụ DRI để phát huy thế mạnh này"
                    >
                      <CheckSquare className="w-2.5 h-2.5" />
                      <span>Giao DRI</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(item.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ô 2: W - WEAKNESSES */}
        <div className="bg-rose-50/50 rounded-2xl border border-rose-200/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              <h3 className="font-extrabold text-sm text-rose-950">
                W – Điểm Yếu (Weaknesses)
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[10px]">
                {weaknesses.length}
              </span>
            </div>
            <button
              onClick={() => handleOpenAddEntry('W')}
              className="text-[11px] font-bold text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm W</span>
            </button>
          </div>

          <div className="space-y-2">
            {weaknesses.length === 0 ? (
              <p className="text-xs text-rose-700/70 italic p-3 text-center">Chưa nhập điểm yếu nào.</p>
            ) : (
              weaknesses.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-white border border-rose-200/70 flex items-start justify-between gap-2 shadow-2xs group"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block leading-snug">{item.content}</span>
                    <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 rounded bg-rose-50 text-rose-700">
                      Ảnh hưởng: {item.impact}
                    </span>
                  </div>
                  {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() =>
                        onNavigateTab('tasks', undefined, {
                          title: `Khắc phục: ${item.content}`,
                          assignee: 'Quản Đốc Sản Xuất',
                          description: `Hành động khắc phục điểm yếu SWOT: ${item.content} (Ảnh hưởng: ${item.impact})`,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                      title="Giao Tác Vụ DRI để khắc phục điểm yếu này"
                    >
                      <CheckSquare className="w-2.5 h-2.5" />
                      <span>Giao DRI</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(item.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ô 3: O - OPPORTUNITIES */}
        <div className="bg-sky-50/50 rounded-2xl border border-sky-200/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-sky-700" />
              <h3 className="font-extrabold text-sm text-sky-950">
                O – Cơ Hội (Opportunities)
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-mono font-bold text-[10px]">
                {opportunities.length}
              </span>
            </div>
            <button
              onClick={() => handleOpenAddEntry('O')}
              className="text-[11px] font-bold text-sky-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm O</span>
            </button>
          </div>

          <div className="space-y-2">
            {opportunities.length === 0 ? (
              <p className="text-xs text-sky-700/70 italic p-3 text-center">Chưa nhập cơ hội nào.</p>
            ) : (
              opportunities.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-white border border-sky-200/70 flex items-start justify-between gap-2 shadow-2xs group"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block leading-snug">{item.content}</span>
                    <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 rounded bg-sky-50 text-sky-700">
                      Ảnh hưởng: {item.impact}
                    </span>
                  </div>
                  {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() =>
                        onNavigateTab('tasks', undefined, {
                          title: `Khai thác: ${item.content}`,
                          assignee: 'Kinh Doanh & Điều Phối',
                          description: `Hành động nắm bắt cơ hội SWOT: ${item.content}`,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                      title="Giao Tác Vụ DRI để nắm bắt cơ hội này"
                    >
                      <CheckSquare className="w-2.5 h-2.5" />
                      <span>Giao DRI</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(item.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ô 4: T - THREATS */}
        <div className="bg-amber-50/50 rounded-2xl border border-amber-200/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-700" />
              <h3 className="font-extrabold text-sm text-amber-950">
                T – Thách Thức (Threats)
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[10px]">
                {threats.length}
              </span>
            </div>
            <button
              onClick={() => handleOpenAddEntry('T')}
              className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm T</span>
            </button>
          </div>

          <div className="space-y-2">
            {threats.length === 0 ? (
              <p className="text-xs text-amber-700/70 italic p-3 text-center">Chưa nhập thách thức nào.</p>
            ) : (
              threats.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-white border border-amber-200/70 flex items-start justify-between gap-2 shadow-2xs group"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block leading-snug">{item.content}</span>
                    <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-700">
                      Ảnh hưởng: {item.impact}
                    </span>
                  </div>
                  {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() =>
                        onNavigateTab('tasks', undefined, {
                          title: `Phòng ngừa rủi ro: ${item.content}`,
                          assignee: 'Quản Đốc Sản Xuất',
                          description: `Hành động ứng phó thách thức SWOT: ${item.content} (Ảnh hưởng: ${item.impact})`,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                      title="Giao Tác Vụ DRI để ứng phó nguy cơ này"
                    >
                      <CheckSquare className="w-2.5 h-2.5" />
                      <span>Giao DRI</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(item.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MA TRẬN CHIẾN LƯỢC HÀNH ĐỘNG TOWS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-black text-sm text-[#14283F] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#C6A66B]" />
              <span>TOWS Action Strategies (Chiến Lược Chuyển Hóa Hành Động)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              4 nhóm chiến lược chuyển hóa từ ma trận SWOT để giao việc có DRI và liên kết sang SMART/OKR.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => handleOpenAddTows('SO')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hover:bg-emerald-100 cursor-pointer"
            >
              + Chiến lược SO
            </button>
            <button
              onClick={() => handleOpenAddTows('WO')}
              className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold hover:bg-sky-100 cursor-pointer"
            >
              + Chiến lược WO
            </button>
            <button
              onClick={() => handleOpenAddTows('ST')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold hover:bg-amber-100 cursor-pointer"
            >
              + Chiến lược ST
            </button>
            <button
              onClick={() => handleOpenAddTows('WT')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold hover:bg-rose-100 cursor-pointer"
            >
              + Chiến lược WT
            </button>
          </div>
        </div>

        {/* Danh sách chiến lược TOWS dưới dạng bảng Clean Table UI */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Nhóm</th>
                <th className="py-2.5 px-3">Chiến lược hành động</th>
                <th className="py-2.5 px-3">DRI (Phụ trách)</th>
                <th className="py-2.5 px-3">Thời hạn</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(currentBoard.towsActions || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    Chưa có chiến lược TOWS nào. Nhấp vào các nút trên hoặc dùng AI Gợi Ý để khởi tạo.
                  </td>
                </tr>
              ) : (
                currentBoard.towsActions?.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          act.strategyType === 'SO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : act.strategyType === 'WO'
                            ? 'bg-sky-100 text-sky-800'
                            : act.strategyType === 'ST'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {act.strategyType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div>{act.actionTitle}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {act.ownerName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-500">
                      {act.dueDate}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleTowsStatus(act)}
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] cursor-pointer ${
                          act.status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : act.status === 'EXECUTING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {act.status}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                        <button
                          onClick={() =>
                            onNavigateTab('okr', undefined, {
                              title: act.actionTitle,
                              assignee: act.ownerName,
                              description: `Chuyển hóa từ Chiến lược TOWS (${act.strategyType})`,
                            })
                          }
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-[10px] font-bold cursor-pointer transition-colors"
                          title="Đưa chiến lược này thành Mục tiêu quý OKR"
                        >
                          + Tạo OKR
                        </button>
                        <button
                          onClick={() =>
                            onNavigateTab('smart', undefined, {
                              title: `[TOWS ${act.strategyType}] ${act.actionTitle}`,
                              assignee: act.ownerName,
                              description: `Triển khai chiến lược TOWS (${act.strategyType})`,
                            })
                          }
                          className="px-2 py-1 rounded bg-[#14283F] text-white hover:bg-[#1E3A5F] text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                          title="Chuyển sang Mục tiêu định lượng SMART"
                        >
                          Giao SMART
                        </button>
                        <button
                          onClick={() => handleDeleteTowsAction(act.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                          title="Xóa chiến lược"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM SWOT ENTRY */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-black text-sm text-[#14283F]">
                Thêm Yếu Tố SWOT ({editingEntryType})
              </h4>
              <button
                onClick={() => setEntryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mô tả yếu tố ({editingEntryType === 'S' ? 'Điểm mạnh' : editingEntryType === 'W' ? 'Điểm yếu' : editingEntryType === 'O' ? 'Cơ hội' : 'Thách thức'}) *
                </label>
                <textarea
                  value={entryContent}
                  onChange={(e) => setEntryContent(e.target.value)}
                  rows={3}
                  placeholder="Nhập mô tả cụ thể..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mức độ ảnh hưởng</label>
                <select
                  value={entryImpact}
                  onChange={(e) => setEntryImpact(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="HIGH">HIGH – Tác động lớn / Quyết định</option>
                  <option value="MEDIUM">MEDIUM – Tác động vừa phải</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#14283F] text-white font-bold cursor-pointer shadow-xs"
                >
                  Lưu Yếu Tố
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM TOWS STRATEGY */}
      {towsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-black text-sm text-[#14283F]">
                Khởi Tạo Chiến Lược Hành Động ({towsType})
              </h4>
              <button
                onClick={() => setTowsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTowsAction} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tiêu đề chiến lược hành động *
                </label>
                <input
                  type="text"
                  value={towsTitle}
                  onChange={(e) => setTowsTitle(e.target.value)}
                  placeholder="VD: Triển khai chiến dịch đẩy mạnh đơn hàng FDI..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Người chịu trách nhiệm (DRI)</label>
                  <input
                    type="text"
                    value={towsOwner}
                    onChange={(e) => setTowsOwner(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thời hạn thực hiện</label>
                  <input
                    type="date"
                    value={towsDueDate}
                    onChange={(e) => setTowsDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setTowsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#14283F] text-white font-bold cursor-pointer shadow-xs"
                >
                  Lưu Chiến Lược
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
