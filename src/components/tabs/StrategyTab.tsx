import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Grid2x2,
  Plus,
  Sparkles,
  Edit3,
  Trash2,
  Database,
  ArrowRightCircle,
  BookOpen,
  X,
  Target,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  AxisOkrObjective,
  AxisKeyResult,
  AxisSwotBoard,
  AxisSmartTask,
  AxisNavigationIntent,
  AxisTabId,
  ErpAutoMetricKey,
} from '../../types/axisTypes';
import { axisDbService } from '../../services/axisDbService';
import { axisAiService } from '../../services/axisAiService';
import { SEED_SWOT } from '../../services/seedData';
import { dialogService } from '../common/CustomDialog';
import { theoryService } from '../../services/theoryService';

interface StrategyTabProps {
  okrs: AxisOkrObjective[];
  swotBoards: AxisSwotBoard[];
  smartTasks: AxisSmartTask[];
  liveErpMetrics: {
    onTimeLsxRate: number;
    completedLsxCount: number;
    proposalResolvedRate: number;
    activeTrainingCount: number;
  };
  navIntent?: AxisNavigationIntent | null;
  onConsumeIntent?: () => void;
  onNavigate: (tab: AxisTabId, intent?: Omit<AxisNavigationIntent, 'tab' | 'ts'>) => void;
}

const AUTO_METRIC_LABELS: Record<ErpAutoMetricKey, string> = {
  NONE: 'Thủ công (CEO tự cập nhật)',
  ON_TIME_LSX_RATE: 'Tự động từ ERP: % LSX đúng hạn giao',
  COMPLETED_LSX_COUNT: 'Tự động từ ERP: Số LSX đã hoàn thành',
  PROPOSAL_RESOLVED_RATE: 'Tự động từ ERP: % Đề xuất đã xử lý',
  TRAINING_ACTIVE_COUNT: 'Tự động từ ERP: Số kế hoạch đào tạo OJT',
};

const OKR_STATUS_META: Record<
  AxisOkrObjective['status'],
  { label: string; cls: string }
> = {
  ON_TRACK: {
    label: 'Đúng tiến độ',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  NEEDS_ATTENTION: {
    label: 'Cần lưu ý / Thúc đẩy',
    cls: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  ACHIEVED: {
    label: 'Đã đạt mục tiêu',
    cls: 'bg-sky-50 text-sky-700 border-sky-200',
  },
};

export const StrategyTab: React.FC<StrategyTabProps> = ({
  okrs,
  swotBoards,
  smartTasks,
  liveErpMetrics,
  navIntent,
  onConsumeIntent,
  onNavigate,
}) => {
  const [subTab, setSubTab] = useState<'OKR' | 'SWOT'>('OKR');

  // OKR Modal state
  const [showOkrModal, setShowOkrModal] = useState(false);
  const [editingOkr, setEditingOkr] = useState<AxisOkrObjective | null>(null);
  const [period, setPeriod] = useState(
    `Q${Math.floor(new Date().getMonth() / 3) + 1}/${new Date().getFullYear()}`
  );
  const [objTitle, setObjTitle] = useState('');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [okrStatus, setOkrStatus] = useState<AxisOkrObjective['status']>('ON_TRACK');
  const [krs, setKrs] = useState<AxisKeyResult[]>([]);

  // Local draft map for manual KR progress inputs (saves onBlur / Enter instead of every keystroke)
  const [krDrafts, setKrDrafts] = useState<Record<string, string>>({});

  // SWOT State
  const currentSwot: AxisSwotBoard = swotBoards[0] || SEED_SWOT;
  const [swotInput, setSwotInput] = useState<{
    s: string;
    w: string;
    o: string;
    t: string;
  }>({ s: '', w: '', o: '', t: '' });
  const [towsDrafts, setTowsDrafts] = useState<AxisSwotBoard['towsStrategies']>(
    currentSwot.towsStrategies
  );
  const [generatingTows, setGeneratingTows] = useState(false);

  // Sync TOWS drafts when Firestore swotBoards updates
  useEffect(() => {
    setTowsDrafts(currentSwot.towsStrategies);
  }, [
    currentSwot.id,
    currentSwot.towsStrategies.so,
    currentSwot.towsStrategies.wo,
    currentSwot.towsStrategies.st,
    currentSwot.towsStrategies.wt,
  ]);

  // Consume deep-link navigation intent
  useEffect(() => {
    if (!navIntent || navIntent.tab !== 'strategy') return;
    if (navIntent.subTab === 'SWOT') {
      setSubTab('SWOT');
    } else if (navIntent.subTab === 'OKR') {
      setSubTab('OKR');
    }
    onConsumeIntent?.();
  }, [navIntent, onConsumeIntent]);

  const resolveKrCurrentValue = (kr: AxisKeyResult): number => {
    if (kr.autoMetric === 'ON_TIME_LSX_RATE') return liveErpMetrics.onTimeLsxRate;
    if (kr.autoMetric === 'COMPLETED_LSX_COUNT') return liveErpMetrics.completedLsxCount;
    if (kr.autoMetric === 'PROPOSAL_RESOLVED_RATE') return liveErpMetrics.proposalResolvedRate;
    if (kr.autoMetric === 'TRAINING_ACTIVE_COUNT') return liveErpMetrics.activeTrainingCount;
    return kr.currentValue;
  };

  const openNewOkr = (prefillTitle = '') => {
    setEditingOkr(null);
    setObjTitle(prefillTitle);
    setWhyItMatters('');
    setOkrStatus('ON_TRACK');
    setKrs([
      {
        id: `kr-${Date.now()}-1`,
        title: '',
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        autoMetric: 'NONE',
      },
    ]);
    setShowOkrModal(true);
    setSubTab('OKR');
  };

  const openEditOkr = (okr: AxisOkrObjective) => {
    setEditingOkr(okr);
    setPeriod(okr.period);
    setObjTitle(okr.title);
    setWhyItMatters(okr.whyItMatters);
    setOkrStatus(okr.status || 'ON_TRACK');
    setKrs(okr.keyResults);
    setShowOkrModal(true);
  };

  const handleSaveOkr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objTitle.trim()) return;
    const validKrs = krs.filter((k) => k.title.trim().length > 0);
    const obj: AxisOkrObjective = {
      id: editingOkr ? editingOkr.id : `okr-${Date.now()}`,
      period,
      title: objTitle.trim(),
      whyItMatters: whyItMatters.trim(),
      status: okrStatus,
      keyResults: validKrs,
      createdAt: editingOkr ? editingOkr.createdAt : new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_okrs', obj);
    dialogService.toast('Đã lưu Mục tiêu OKR chiến lược.');
    setShowOkrModal(false);
  };

  const handleChangeOkrStatus = async (
    okr: AxisOkrObjective,
    nextStatus: AxisOkrObjective['status']
  ) => {
    if (okr.status === nextStatus) return;
    await axisDbService.saveAxisItem('axis_okrs', { ...okr, status: nextStatus });
    dialogService.toast(`Đã chuyển trạng thái OKR sang "${OKR_STATUS_META[nextStatus].label}"`);
  };

  const commitManualKrProgress = async (okr: AxisOkrObjective, kr: AxisKeyResult) => {
    const draftStr = krDrafts[kr.id];
    if (draftStr === undefined) return;
    const parsed = Number(draftStr);
    const nextVal = Number.isFinite(parsed) ? parsed : kr.currentValue;
    setKrDrafts((prev) => {
      const copy = { ...prev };
      delete copy[kr.id];
      return copy;
    });
    if (nextVal === kr.currentValue) return;
    const nextKrs = okr.keyResults.map((k) =>
      k.id === kr.id ? { ...k, currentValue: nextVal } : k
    );
    await axisDbService.saveAxisItem('axis_okrs', { ...okr, keyResults: nextKrs });
  };

  const deleteOkr = async (okr: AxisOkrObjective) => {
    const ok = await dialogService.confirm(`Xóa mục tiêu OKR "${okr.title}"?`, 'Xóa OKR', {
      danger: true,
    });
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_okrs', okr.id);
    dialogService.toast('Đã xóa OKR.', 'info');
  };

  // SWOT & TOWS Handlers
  const addSwotBullet = async (
    quadrant: 'strengths' | 'weaknesses' | 'opportunities' | 'threats',
    key: 's' | 'w' | 'o' | 't'
  ) => {
    const text = swotInput[key].trim();
    if (!text) return;
    const updated: AxisSwotBoard = {
      ...currentSwot,
      [quadrant]: [...currentSwot[quadrant], text],
      updatedAtStr: new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_swot', updated);
    setSwotInput((prev) => ({ ...prev, [key]: '' }));
  };

  const removeSwotBullet = async (
    quadrant: 'strengths' | 'weaknesses' | 'opportunities' | 'threats',
    idx: number
  ) => {
    const updated: AxisSwotBoard = {
      ...currentSwot,
      [quadrant]: currentSwot[quadrant].filter((_, i) => i !== idx),
      updatedAtStr: new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_swot', updated);
  };

  const saveTowsQuadrant = async (key: keyof AxisSwotBoard['towsStrategies']) => {
    const nextVal = (towsDrafts[key] || '').trim();
    if (nextVal === (currentSwot.towsStrategies[key] || '').trim()) return;
    await axisDbService.saveAxisItem('axis_swot', {
      ...currentSwot,
      towsStrategies: {
        ...currentSwot.towsStrategies,
        [key]: nextVal,
      },
      updatedAtStr: new Date().toISOString(),
    });
    dialogService.toast('Đã lưu cập nhật chiến lược TOWS.');
  };

  const handleAiGenerateTows = async () => {
    const hasExisting =
      currentSwot.towsStrategies.so ||
      currentSwot.towsStrategies.wo ||
      currentSwot.towsStrategies.st ||
      currentSwot.towsStrategies.wt;

    if (hasExisting) {
      const ok = await dialogService.confirm(
        'AI sẽ phân tích lại 4 góc SWOT hiện tại và ghi đè nội dung 4 ô chiến lược TOWS bên dưới. Bạn muốn tiếp tục?',
        'Tạo lại Chiến lược TOWS bằng AI'
      );
      if (!ok) return;
    }

    setGeneratingTows(true);
    try {
      const tows = await axisAiService.generateTowsFromSwot({
        strengths: currentSwot.strengths,
        weaknesses: currentSwot.weaknesses,
        opportunities: currentSwot.opportunities,
        threats: currentSwot.threats,
      });
      setTowsDrafts(tows);
      await axisDbService.saveAxisItem('axis_swot', {
        ...currentSwot,
        towsStrategies: tows,
        updatedAtStr: new Date().toISOString(),
      });
      dialogService.toast('Đã tổng hợp 4 mũi nhọn hành động TOWS từ SWOT!');
    } finally {
      setGeneratingTows(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[25px] font-extrabold text-[#0C1B2E] tracking-tight">
            Mục Tiêu Trọng Tâm (OKR) & Vị Thế Chiến Lược (SWOT)
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Chuyển hóa phân tích <span className="font-semibold text-slate-700">SWOT → TOWS</span> thành{' '}
            <span className="font-semibold text-slate-700">Mục tiêu OKR</span> gắn dữ liệu ERP và triển khai xuống đầu việc hàng ngày.
          </p>
        </div>

        <div className="macos-segmented self-start">
          <button
            onClick={() => setSubTab('OKR')}
            className={`px-4 py-1.5 rounded-[10px] text-[12.5px] font-bold flex items-center gap-2 cursor-pointer transition-all ${
              subTab === 'OKR'
                ? 'bg-white text-[#0C1B2E] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <TrendingUp size={15} className="text-[#C69C47]" />
            <span>Mục tiêu OKR ({okrs.length})</span>
          </button>
          <button
            onClick={() => setSubTab('SWOT')}
            className={`px-4 py-1.5 rounded-[10px] text-[12.5px] font-bold flex items-center gap-2 cursor-pointer transition-all ${
              subTab === 'SWOT'
                ? 'bg-white text-[#0C1B2E] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <Grid2x2 size={15} className="text-[#C69C47]" />
            <span>Phân tích SWOT → TOWS</span>
          </button>
        </div>
      </div>

      {/* ─── SUB-TAB OKR ─────────────────────────────────────────────────────── */}
      {subTab === 'OKR' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-slate-500">
              Đang theo dõi {okrs.length} Mục tiêu trọng tâm (Objective)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => theoryService.open('OKR')}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <BookOpen size={15} className="text-[#C69C47]" />
                <span>Tra cứu OKR</span>
              </button>
              <button
                type="button"
                onClick={() => openNewOkr()}
                className="px-4 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={16} className="text-[#E5C472]" />
                <span>Thiết lập Objective (OKR)</span>
              </button>
            </div>
          </div>

          {okrs.length === 0 ? (
            <div className="axis-card p-10 text-center space-y-3">
              <div className="text-[14.5px] font-bold text-[#0C1B2E]">
                Chưa có Mục tiêu OKR nào cho chu kỳ này
              </div>
              <p className="text-[12.5px] text-slate-500 max-w-md mx-auto">
                Hãy tập trung toàn lực công ty vào tối đa 3 Mục tiêu (Objectives) quan trọng nhất trong Quý/Tháng.
              </p>
              <button
                type="button"
                onClick={() => openNewOkr()}
                className="px-4 py-2 rounded-xl bg-[#0C1B2E] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} className="text-[#E5C472]" />
                <span>Tạo Mục tiêu OKR đầu tiên</span>
              </button>
            </div>
          ) : (
            okrs.map((okr) => {
              const avgProgress =
                okr.keyResults.length > 0
                  ? Math.round(
                      okr.keyResults.reduce((acc, kr) => {
                        const cur = resolveKrCurrentValue(kr);
                        const pct =
                          kr.targetValue > 0 ? Math.min(100, (cur / kr.targetValue) * 100) : 0;
                        return acc + pct;
                      }, 0) / okr.keyResults.length
                    )
                  : 0;

              const linkedTasks = smartTasks.filter((t) => t.linkedOkrId === okr.id);
              const completedLinkedCount = linkedTasks.filter(
                (t) => t.status === 'COMPLETED'
              ).length;
              const statusMeta = OKR_STATUS_META[okr.status || 'ON_TRACK'];

              return (
                <div key={okr.id} className="group axis-card p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#0C1B2E] text-[#F3DA99] text-[11px] font-bold">
                          {okr.period}
                        </span>
                        <select
                          value={okr.status || 'ON_TRACK'}
                          onChange={(e) =>
                            handleChangeOkrStatus(
                              okr,
                              e.target.value as AxisOkrObjective['status']
                            )
                          }
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-bold cursor-pointer ${statusMeta.cls}`}
                        >
                          {Object.entries(OKR_STATUS_META).map(([k, meta]) => (
                            <option key={k} value={k}>
                              {meta.label}
                            </option>
                          ))}
                        </select>
                        <span className="text-[12px] font-bold text-emerald-700 tabular-nums">
                          Tiến độ đạt: {avgProgress}%
                        </span>
                      </div>
                      <h3 className="text-[16.5px] font-extrabold text-[#0C1B2E]">{okr.title}</h3>
                      {okr.whyItMatters && (
                        <p className="text-[12.5px] text-slate-500">
                          Ý nghĩa chiến lược: {okr.whyItMatters}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('execution', {
                            subTab: 'SMART',
                            action: 'NEW_TASK',
                            okrId: okr.id,
                            okrTitle: okr.title,
                            prefillTitle: `Thực thi OKR: ${okr.title}`,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0C1B2E] hover:text-white text-[11.5px] font-bold text-[#0C1B2E] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Giao đầu việc thực thi gắn với Mục tiêu OKR này"
                      >
                        <Target size={13} />
                        <span>+ Giao việc</span>
                      </button>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditOkr(okr)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C1B2E] hover:bg-slate-100 cursor-pointer"
                          title="Chỉnh sửa OKR"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOkr(okr)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Xóa OKR"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${avgProgress}%` }}
                      className="h-full bg-gradient-to-r from-[#0C1B2E] to-[#C69C47] transition-all duration-500"
                    />
                  </div>

                  {/* Key Results Table */}
                  <div className="divide-y divide-slate-100 pt-1">
                    {okr.keyResults.map((kr, idx) => {
                      const currentVal = resolveKrCurrentValue(kr);
                      const pct =
                        kr.targetValue > 0
                          ? Math.min(100, Math.round((currentVal / kr.targetValue) * 100))
                          : 0;
                      const isAuto = kr.autoMetric !== 'NONE';
                      const inputDisplay =
                        krDrafts[kr.id] !== undefined ? krDrafts[kr.id] : String(currentVal);

                      return (
                        <div
                          key={kr.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11.5px] font-bold text-[#9D772B]">
                                KR{idx + 1}
                              </span>
                              <span className="text-[13.5px] font-semibold text-slate-800">
                                {kr.title}
                              </span>
                              {isAuto && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10.5px] font-semibold">
                                  <Database size={10} />
                                  <span>Live ERP</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {!isAuto ? (
                              <div className="flex items-center gap-1.5 text-[12.5px]">
                                <input
                                  type="number"
                                  value={inputDisplay}
                                  onChange={(e) =>
                                    setKrDrafts((prev) => ({
                                      ...prev,
                                      [kr.id]: e.target.value,
                                    }))
                                  }
                                  onBlur={() => commitManualKrProgress(okr, kr)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-right font-bold text-[#0C1B2E] tabular-nums"
                                  title="Nhập tiến độ hiện tại (Enter hoặc click ra ngoài để lưu)"
                                />
                                <span className="text-slate-500 tabular-nums">
                                  / {kr.targetValue} {kr.unit}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[13px] font-bold text-[#0C1B2E] tabular-nums">
                                {currentVal} / {kr.targetValue} {kr.unit}
                              </span>
                            )}
                            <span className="w-11 text-right text-[12px] font-extrabold text-emerald-700 tabular-nums">
                              {pct}%
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onNavigate('execution', {
                                  subTab: 'SMART',
                                  action: 'NEW_TASK',
                                  okrId: okr.id,
                                  okrTitle: okr.title,
                                  krTitle: kr.title,
                                  prefillTitle: kr.title,
                                })
                              }
                              className="px-2 py-1 rounded-lg border border-slate-200 hover:border-[#0C1B2E] text-[11px] font-semibold text-slate-600 hover:text-[#0C1B2E] cursor-pointer"
                              title="Triển khai KR này thành đầu việc giao cho nhân sự"
                            >
                              Giao việc →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Linked SMART Tasks Execution Summary */}
                  {linkedTasks.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="font-bold text-slate-600">
                          🎯 Đầu việc thực thi đang phục vụ OKR này ({completedLinkedCount}/{linkedTasks.length} hoàn thành)
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate('execution', { subTab: 'SMART' })}
                          className="font-bold text-[#9D772B] hover:underline cursor-pointer"
                        >
                          Mở bảng Giao việc →
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedTasks.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => onNavigate('execution', { subTab: 'SMART' })}
                            className={`px-2.5 py-1 rounded-lg border text-[11.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                              t.status === 'COMPLETED'
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                                : t.status === 'AT_RISK'
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {t.status === 'COMPLETED' ? (
                              <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                            ) : (
                              <Circle size={12} className="text-slate-400 shrink-0" />
                            )}
                            <span className="truncate max-w-[220px]">{t.title}</span>
                            <span className="text-[10.5px] opacity-75">({t.assigneeName})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── SUB-TAB SWOT ────────────────────────────────────────────────────── */}
      {subTab === 'SWOT' && (
        <div className="space-y-6">
          {/* SWOT Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <div className="text-[14px] font-bold text-[#0C1B2E]">
                Bản Đồ Vị Thế Chiến Lược SWOT & Chuyển Hóa Hành Động TOWS
              </div>
              <div className="text-[12px] text-slate-500">
                Ghi nhận trung thực nội lực & thị trường, sau đó chuyển thẳng từng mũi nhọn chiến lược thành OKR hoặc Đầu việc thực thi.
              </div>
            </div>
            <button
              type="button"
              onClick={() => theoryService.open('SWOT')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <BookOpen size={15} className="text-[#C69C47]" />
              <span>Tra cứu SWOT & TOWS</span>
            </button>
          </div>

          {/* 4 SWOT Quadrants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: 's' as const,
                field: 'strengths' as const,
                badge: 'S — ĐIỂM MẠNH (STRENGTHS)',
                title: 'Lợi thế nội tại cần phát huy',
                accent: 'border-t-4 border-t-emerald-600',
              },
              {
                key: 'w' as const,
                field: 'weaknesses' as const,
                badge: 'W — ĐIỂM YẾU (WEAKNESSES)',
                title: 'Nút thắt nội bộ cần khắc phục',
                accent: 'border-t-4 border-t-amber-500',
              },
              {
                key: 'o' as const,
                field: 'opportunities' as const,
                badge: 'O — CƠ HỘI (OPPORTUNITIES)',
                title: 'Cơ hội thị trường & công nghệ',
                accent: 'border-t-4 border-t-sky-600',
              },
              {
                key: 't' as const,
                field: 'threats' as const,
                badge: 'T — THÁCH THỨC (THREATS)',
                title: 'Rủi ro & Áp lực cạnh tranh bên ngoài',
                accent: 'border-t-4 border-t-rose-500',
              },
            ].map((q) => (
              <div key={q.key} className={`axis-card p-5 ${q.accent} flex flex-col justify-between`}>
                <div>
                  <div className="text-[10.5px] font-extrabold tracking-wider text-slate-400 uppercase">
                    {q.badge}
                  </div>
                  <h3 className="text-[15px] font-bold text-[#0C1B2E] mb-3">{q.title}</h3>

                  <ul className="space-y-2 mb-4">
                    {currentSwot[q.field].map((item, idx) => (
                      <li
                        key={idx}
                        className="group flex items-start justify-between gap-2 text-[13px] text-slate-700 bg-slate-50/80 px-3 py-2 rounded-xl"
                      >
                        <span>• {item}</span>
                        <button
                          type="button"
                          onClick={() => removeSwotBullet(q.field, idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-600 shrink-0 cursor-pointer"
                          title="Xóa ý này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={swotInput[q.key]}
                    onChange={(e) =>
                      setSwotInput((prev) => ({ ...prev, [q.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSwotBullet(q.field, q.key);
                      }
                    }}
                    placeholder={`Thêm ${q.title.toLowerCase()}...`}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] focus:border-[#0C1B2E] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addSwotBullet(q.field, q.key)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[12px] font-bold text-[#0C1B2E] cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* TOWS Action Matrix (Editable + Direct Execution Links) */}
          <div className="axis-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#0C1B2E]">
                  Ma Trận Hành Động Chiến Lược TOWS (Chỉnh sửa trực tiếp & Chuyển hóa 1 chạm)
                </h3>
                <p className="text-[12.5px] text-slate-500">
                  CEO có thể tự biên tập trực tiếp từng ô chiến lược bên dưới hoặc nhờ AI gợi ý từ 4 góc SWOT.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAiGenerateTows}
                disabled={generatingTows}
                className="px-4 py-2 rounded-xl bg-[#0C1B2E] text-[#F3DA99] text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start shrink-0"
              >
                <Sparkles size={14} />
                <span>{generatingTows ? 'Đang tổng hợp...' : 'AI Gợi ý 4 Chiến lược TOWS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(
                [
                  {
                    key: 'so',
                    label: 'Chiến lược S-O (Tấn công: Dùng Điểm mạnh đón Cơ hội)',
                  },
                  {
                    key: 'wo',
                    label: 'Chiến lược W-O (Nâng cấp: Khắc phục Điểm yếu để nắm Cơ hội)',
                  },
                  {
                    key: 'st',
                    label: 'Chiến lược S-T (Khác biệt: Dùng Điểm mạnh hóa giải Thách thức)',
                  },
                  {
                    key: 'wt',
                    label: 'Chiến lược W-T (Phòng thủ: Kiểm soát rủi ro nội tại)',
                  },
                ] as const
              ).map((st) => {
                const val = towsDrafts[st.key] || '';
                return (
                  <div
                    key={st.key}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="text-[11.5px] font-bold text-[#9D772B] uppercase">
                        {st.label}
                      </div>
                      <textarea
                        rows={3}
                        value={val}
                        onChange={(e) =>
                          setTowsDrafts((prev) => ({ ...prev, [st.key]: e.target.value }))
                        }
                        onBlur={() => saveTowsQuadrant(st.key)}
                        placeholder="Nhập định hướng hành động cụ thể cho mũi nhọn này..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => openNewOkr(val)}
                        disabled={!val.trim()}
                        className="text-[12px] font-bold text-[#0C1B2E] hover:text-[#9D772B] disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowRightCircle size={13} />
                        <span>Lập Mục tiêu OKR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('execution', {
                            subTab: 'SMART',
                            action: 'NEW_TASK',
                            prefillTitle: val,
                          })
                        }
                        disabled={!val.trim()}
                        className="text-[12px] font-bold text-slate-600 hover:text-[#0C1B2E] disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Target size={13} />
                        <span>Giao việc thực thi ngay</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL TẠO / SỬA OKR ─────────────────────────────────────────────── */}
      {showOkrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[16.5px] font-bold text-[#0C1B2E]">
                  {editingOkr ? 'Cập nhật Mục tiêu OKR' : 'Thiết lập Mục tiêu OKR mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => theoryService.open('OKR')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 text-[11px] font-bold text-indigo-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <BookOpen size={13} />
                  <span>Tra cứu OKR</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowOkrModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOkr} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Chu kỳ
                  </label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
                <div className="sm:col-span-5">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={okrStatus}
                    onChange={(e) =>
                      setOkrStatus(e.target.value as AxisOkrObjective['status'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold"
                  >
                    {Object.entries(OKR_STATUS_META).map(([k, meta]) => (
                      <option key={k} value={k}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-12">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Objective (Đích đến truyền cảm hứng) *
                  </label>
                  <input
                    type="text"
                    required
                    value={objTitle}
                    onChange={(e) => setObjTitle(e.target.value)}
                    placeholder="VD: Đưa nhà máy đạt chuẩn giao hàng đúng hẹn & triệt tiêu lỗi lặp lại"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Tại sao mục tiêu này sống còn ngay lúc này?
                </label>
                <input
                  type="text"
                  value={whyItMatters}
                  onChange={(e) => setWhyItMatters(e.target.value)}
                  placeholder="Giải thích ngắn gọn để đội ngũ thấu hiểu ý nghĩa..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-[#0C1B2E] uppercase">
                    Các Kết quả then chốt (Key Results — Đo được bằng con số)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setKrs((prev) => [
                        ...prev,
                        {
                          id: `kr-${Date.now()}-${prev.length + 1}`,
                          title: '',
                          targetValue: 100,
                          currentValue: 0,
                          unit: '%',
                          autoMetric: 'NONE',
                        },
                      ])
                    }
                    className="text-[12px] font-bold text-[#9D772B] hover:underline cursor-pointer"
                  >
                    + Thêm KR
                  </button>
                </div>

                {krs.map((kr, idx) => (
                  <div
                    key={kr.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={kr.title}
                        onChange={(e) =>
                          setKrs((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, title: e.target.value } : item
                            )
                          )
                        }
                        placeholder={`Kết quả then chốt #${idx + 1}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px]"
                      />
                      {krs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setKrs((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={kr.autoMetric}
                        onChange={(e) =>
                          setKrs((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, autoMetric: e.target.value as ErpAutoMetricKey }
                                : item
                            )
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px]"
                      >
                        {Object.entries(AUTO_METRIC_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        value={kr.targetValue}
                        onChange={(e) =>
                          setKrs((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, targetValue: Number(e.target.value) } : item
                            )
                          )
                        }
                        placeholder="Đích cần đạt"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[12.5px]"
                      />

                      <input
                        type="text"
                        value={kr.unit}
                        onChange={(e) =>
                          setKrs((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, unit: e.target.value } : item
                            )
                          )
                        }
                        placeholder="Đơn vị (%, đơn, quy trình...)"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[12.5px]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOkrModal(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Lưu Mục tiêu OKR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
