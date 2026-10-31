import React, { useState } from 'react';
import {
  Target,
  RefreshCw,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  Send,
  Copy,
  Edit3,
  Trash2,
  BookOpenCheck,
  BookOpen,
  X,
} from 'lucide-react';
import {
  AxisSmartTask,
  AxisPdcaCycle,
  ErpUser,
  ErpLsxOrder,
} from '../../types/axisTypes';
import { buildCheckin369 } from '../../services/seedData';
import { axisDbService } from '../../services/axisDbService';
import { axisAiService } from '../../services/axisAiService';
import { dialogService } from '../common/CustomDialog';
import { theoryService } from '../../services/theoryService';

export const getMilestoneLabel = (c: { stage?: string; label?: string }, index?: number) => {
  if (
    c.stage === '1' ||
    c.label?.includes('Mốc 1') ||
    (c.stage === '3' && index === 0) ||
    c.label?.includes('Mốc 3 (30%)') ||
    c.label?.includes('30%') ||
    index === 0
  ) {
    return 'Mốc 1: Khởi động & Thống nhất hướng đi';
  }
  if (
    c.stage === '2' ||
    c.label?.includes('Mốc 2') ||
    c.stage === '6' ||
    c.label?.includes('Mốc 6') ||
    c.label?.includes('60%') ||
    index === 1
  ) {
    return 'Mốc 2: Giám sát giữa kỳ & Tháo gỡ khó khăn';
  }
  if (
    (c.stage === '3' && index === 2) ||
    c.label?.includes('Mốc 3: Tiền') ||
    c.stage === '9' ||
    c.label?.includes('Mốc 9') ||
    c.label?.includes('90%') ||
    index === 2
  ) {
    return 'Mốc 3: Tiền nghiệm thu & Chuẩn bị bàn giao';
  }
  return c.label || `Mốc ${index !== undefined ? index + 1 : ''}: Giám sát tiến độ`;
};

export const getMilestoneQuestion = (c: { stage?: string; guidingQuestion?: string }, index?: number) => {
  if (
    c.stage === '1' ||
    (c.stage === '3' && index === 0) ||
    c.guidingQuestion?.includes('mục tiêu đầu ra') ||
    index === 0
  ) {
    return 'Nhân sự đã hiểu đúng 100% mục tiêu đầu ra và phương pháp thực hiện chưa?';
  }
  if (
    c.stage === '2' ||
    c.stage === '6' ||
    c.guidingQuestion?.includes('60%') ||
    index === 1
  ) {
    return 'Tiến độ thực tế có đang đúng kế hoạch không? Có điểm nghẽn nào cần CEO tháo gỡ ngay?';
  }
  if (
    (c.stage === '3' && index === 2) ||
    c.stage === '9' ||
    c.guidingQuestion?.includes('nháp') ||
    index === 2
  ) {
    return 'Chất lượng kết quả đầu ra đã đạt chuẩn chưa, có rủi ro nào cần xử lý trước giờ chốt?';
  }
  return c.guidingQuestion || 'Tiến độ thực tế có đang đúng kế hoạch không?';
};

interface ExecutionTabProps {
  currentUser: ErpUser;
  smartTasks: AxisSmartTask[];
  pdcaCycles: AxisPdcaCycle[];
  staffDirectory: Array<{ id: string; name: string; role: string; department: string }>;
  lsxOrders: ErpLsxOrder[];
}

export const ExecutionTab: React.FC<ExecutionTabProps> = ({
  currentUser,
  smartTasks,
  pdcaCycles,
  staffDirectory,
  lsxOrders,
}) => {
  const [subTab, setSubTab] = useState<'SMART' | 'PDCA'>('SMART');

  // SMART Form State
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultDue = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return d.toISOString().slice(0, 10);
  })();

  const [showSmartModal, setShowSmartModal] = useState(false);
  const [editingSmart, setEditingSmart] = useState<AxisSmartTask | null>(null);
  const [rawSmartPrompt, setRawSmartPrompt] = useState('');
  const [aiRefining, setAiRefining] = useState(false);

  const [title, setTitle] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [linkedLsxCode, setLinkedLsxCode] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(defaultDue);
  const [specific, setSpecific] = useState('');
  const [measurable, setMeasurable] = useState('');
  const [achievable, setAchievable] = useState('');
  const [relevant, setRelevant] = useState('');
  const [timeBound, setTimeBound] = useState('');

  // PDCA Form State
  const [showPdcaModal, setShowPdcaModal] = useState(false);
  const [editingPdca, setEditingPdca] = useState<AxisPdcaCycle | null>(null);
  const [pdcaTitle, setPdcaTitle] = useState('');
  const [pdcaDept, setPdcaDept] = useState('Xưởng In');
  const [pdcaLsx, setPdcaLsx] = useState('');
  const [pdcaPhase, setPdcaPhase] = useState<AxisPdcaCycle['currentPhase']>('PLAN');
  const [planRootCause, setPlanRootCause] = useState('');
  const [planSolution, setPlanSolution] = useState('');
  const [doActions, setDoActions] = useState('');
  const [doOwner, setDoOwner] = useState('');
  const [checkDate, setCheckDate] = useState(defaultDue);
  const [checkResult, setCheckResult] = useState('');
  const [actStandard, setActStandard] = useState('');

  const openNewSmart = () => {
    setEditingSmart(null);
    setRawSmartPrompt('');
    setTitle('');
    setAssigneeName(staffDirectory[0]?.name || '');
    setLinkedLsxCode('');
    setStartDate(todayStr);
    setDueDate(defaultDue);
    setSpecific('');
    setMeasurable('');
    setAchievable('');
    setRelevant('');
    setTimeBound('');
    setShowSmartModal(true);
  };

  const openEditSmart = (task: AxisSmartTask) => {
    setEditingSmart(task);
    setRawSmartPrompt(task.title);
    setTitle(task.title);
    setAssigneeName(task.assigneeName);
    setLinkedLsxCode(task.linkedLsxCode || '');
    setStartDate(task.startDate);
    setDueDate(task.dueDate);
    setSpecific(task.specific);
    setMeasurable(task.measurable);
    setAchievable(task.achievable);
    setRelevant(task.relevant);
    setTimeBound(task.timeBound);
    setShowSmartModal(true);
  };

  const handleAiRefineSmart = async () => {
    const seed = rawSmartPrompt.trim() || title.trim();
    if (!seed) {
      dialogService.toast('Hãy nhập 1 câu ý tưởng công việc cần giao trước khi chuẩn hóa.', 'warning');
      return;
    }
    setAiRefining(true);
    try {
      const res = await axisAiService.refineSmartTask(seed, assigneeName, dueDate);
      setTitle(res.title || seed);
      setSpecific(res.specific || '');
      setMeasurable(res.measurable || '');
      setAchievable(res.achievable || '');
      setRelevant(res.relevant || '');
      setTimeBound(res.timeBound || '');
      dialogService.toast('Đã chuẩn hóa 5 tiêu chí SMART & khung thời gian!');
    } finally {
      setAiRefining(false);
    }
  };

  const handleSaveSmartTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const checkins =
      editingSmart &&
      editingSmart.startDate === startDate &&
      editingSmart.dueDate === dueDate
        ? editingSmart.checkins
        : buildCheckin369(startDate, dueDate);

    const task: AxisSmartTask = {
      id: editingSmart ? editingSmart.id : `smart-${Date.now()}`,
      title: title.trim(),
      assigneeName: assigneeName.trim() || 'Chưa gán',
      linkedLsxCode: linkedLsxCode.trim() || undefined,
      startDate,
      dueDate,
      status: editingSmart ? editingSmart.status : 'IN_PROGRESS',
      specific: specific.trim() || title.trim(),
      measurable: measurable.trim() || 'Đạt kết quả nghiệm thu thực tế đúng hạn.',
      achievable: achievable.trim() || 'Phối hợp nguồn lực nội bộ và dữ liệu ERP.',
      relevant: relevant.trim() || 'Phục vụ mục tiêu vận hành trọng tâm.',
      timeBound: timeBound.trim() || `Hoàn thành trước ${dueDate} qua 3 mốc giám sát tiến độ.`,
      checkins,
      sentToErp: editingSmart?.sentToErp,
      createdAt: editingSmart ? editingSmart.createdAt : new Date().toISOString(),
    };

    await axisDbService.saveAxisItem('axis_tasks', task);
    dialogService.toast(
      editingSmart ? 'Đã cập nhật đầu việc SMART.' : 'Đã tạo việc SMART & sinh lịch giám sát tiến độ!'
    );
    setShowSmartModal(false);
  };

  const toggleCheckinStage = async (task: AxisSmartTask, index: number) => {
    const nextCheckins = task.checkins.map((c, idx) =>
      idx === index
        ? { ...c, completed: !c.completed, checkedAt: new Date().toISOString() }
        : c
    );
    await axisDbService.saveAxisItem('axis_tasks', {
      ...task,
      checkins: nextCheckins,
    });
  };

  const toggleSmartCompleted = async (task: AxisSmartTask) => {
    const nextStatus = task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    await axisDbService.saveAxisItem('axis_tasks', {
      ...task,
      status: nextStatus,
    });
    dialogService.toast(
      nextStatus === 'COMPLETED' ? 'Đã nghiệm thu hoàn thành đầu việc!' : 'Đã mở lại đầu việc.'
    );
  };

  const copySmartBrief = (task: AxisSmartTask) => {
    const milestoneSummary = (task.checkins || [])
      .map((c, idx) => `Mốc ${idx + 1} (${c.dueDate})`)
      .join(' | ');
    const text = `📌 GIAO VIỆC CHUẨN SMART (Từ CEO)\n• Hạng mục: ${task.title}\n• Phụ trách: ${task.assigneeName}\n• [S] Cụ thể: ${task.specific}\n• [M] Đo lường: ${task.measurable}\n• [A] Khả thi: ${task.achievable}\n• [R] Mục đích: ${task.relevant}\n• [T] Thời hạn: ${task.dueDate}\n• Lịch giám sát tiến độ: ${milestoneSummary}`;
    navigator.clipboard.writeText(text);
    dialogService.toast('Đã copy bản giao việc chuẩn SMART + lịch giám sát vào Clipboard!');
  };

  const sendSmartToProTrack = async (task: AxisSmartTask) => {
    const ok = await dialogService.confirm(
      `Bắn thông báo giao việc "${task.title}" trực tiếp tới tài khoản "${task.assigneeName}" trên hệ thống ProTrack ERP?`,
      'Gửi thông báo sang ProTrack'
    );
    if (!ok) return;
    try {
      const milestoneDates = (task.checkins || [])
        .map((c, idx) => `Mốc ${idx + 1}: ${c.dueDate}`)
        .join(', ');
      await axisDbService.pushNotificationToErpStaff({
        title: `🎯 Giao việc từ CEO: ${task.title}`,
        content: `Mục tiêu: ${task.measurable} | Hạn hoàn thành: ${task.dueDate} (Lịch giám sát tiến độ: ${milestoneDates})`,
        targetUser: task.assigneeName,
        ceoName: currentUser.name || 'CEO',
        actionType: 'CEO_SMART_TASK',
      });
      await axisDbService.saveAxisItem('axis_tasks', { ...task, sentToErp: true });
      dialogService.toast(`Đã bắn thông báo giao việc tới ${task.assigneeName} trên ProTrack!`);
    } catch (e: any) {
      dialogService.toast('Lỗi gửi thông báo: ' + (e?.message || ''), 'error');
    }
  };

  const deleteSmartTask = async (task: AxisSmartTask) => {
    const ok = await dialogService.confirm(`Xóa đầu việc "${task.title}"?`, 'Xóa việc SMART', {
      danger: true,
    });
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_tasks', task.id);
    dialogService.toast('Đã xóa đầu việc.', 'info');
  };

  // PDCA Handlers
  const openNewPdca = () => {
    setEditingPdca(null);
    setPdcaTitle('');
    setPdcaDept('Xưởng In');
    setPdcaLsx('');
    setPdcaPhase('PLAN');
    setPlanRootCause('');
    setPlanSolution('');
    setDoActions('');
    setDoOwner(staffDirectory[0]?.name || '');
    setCheckDate(defaultDue);
    setCheckResult('');
    setActStandard('');
    setShowPdcaModal(true);
  };

  const openEditPdca = (item: AxisPdcaCycle) => {
    setEditingPdca(item);
    setPdcaTitle(item.title);
    setPdcaDept(item.department);
    setPdcaLsx(item.linkedLsxCode || '');
    setPdcaPhase(item.currentPhase);
    setPlanRootCause(item.planRootCause);
    setPlanSolution(item.planSolution);
    setDoActions(item.doActions);
    setDoOwner(item.doOwner);
    setCheckDate(item.checkDate);
    setCheckResult(item.checkResult);
    setActStandard(item.actStandard);
    setShowPdcaModal(true);
  };

  const handleSavePdca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdcaTitle.trim()) return;
    const cycle: AxisPdcaCycle = {
      id: editingPdca ? editingPdca.id : `pdca-${Date.now()}`,
      title: pdcaTitle.trim(),
      department: pdcaDept,
      linkedLsxCode: pdcaLsx.trim() || undefined,
      currentPhase: pdcaPhase,
      planRootCause: planRootCause.trim(),
      planSolution: planSolution.trim(),
      doActions: doActions.trim(),
      doOwner: doOwner.trim(),
      checkDate,
      checkResult: checkResult.trim(),
      actStandard: actStandard.trim(),
      pushedToTraining: editingPdca?.pushedToTraining,
      createdAt: editingPdca ? editingPdca.createdAt : new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_pdca', cycle);
    dialogService.toast('Đã lưu chu trình cải tiến PDCA.');
    setShowPdcaModal(false);
  };

  const pushPdcaToErpTraining = async (cycle: AxisPdcaCycle) => {
    const standardText = cycle.actStandard || cycle.planSolution;
    if (!standardText) {
      dialogService.toast('Vui lòng ghi nội dung chuẩn hóa (Act) trước khi ban hành.', 'warning');
      return;
    }
    const ok = await dialogService.confirm(
      `Ban hành bài học cải tiến "${cycle.title}" thẳng vào Kho Tài Liệu Đào Tạo của ProTrack ERP?`,
      'Chuẩn hóa Act → Kho Đào Tạo ERP'
    );
    if (!ok) return;

    try {
      await axisDbService.publishTrainingDocToErp({
        title: `[Chuẩn hóa PDCA] ${cycle.title}`,
        category: cycle.department || 'Quy trình cải tiến',
        description: `Nguyên nhân gốc: ${cycle.planRootCause}\nGiải pháp chuẩn hóa: ${standardText}`,
        keyTakeaways: [
          `Vấn đề khắc phục: ${cycle.planRootCause}`,
          `Hành động thực thi: ${cycle.doActions || cycle.planSolution}`,
          `Kết quả kiểm chứng: ${cycle.checkResult || 'Đã nghiệm thu đạt hiệu quả'}`,
          `Tiêu chuẩn áp dụng lâu dài: ${standardText}`,
        ],
        ceoUser: currentUser,
      });
      await axisDbService.saveAxisItem('axis_pdca', {
        ...cycle,
        currentPhase: 'STANDARDIZED',
        pushedToTraining: true,
      });
      dialogService.toast('Đã đẩy quy chuẩn cải tiến vào Kho Tài Liệu Đào Tạo trên ProTrack!');
    } catch (e: any) {
      dialogService.toast('Lỗi đồng bộ ERP: ' + (e?.message || ''), 'error');
    }
  };

  const deletePdca = async (cycle: AxisPdcaCycle) => {
    const ok = await dialogService.confirm(`Xóa chu trình PDCA "${cycle.title}"?`, 'Xóa PDCA', {
      danger: true,
    });
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_pdca', cycle.id);
    dialogService.toast('Đã xóa chu trình PDCA.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[25px] font-extrabold text-[#0C1B2E] tracking-tight">
            Trục Thực Thi & Cải Tiến Liên Tục
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Giao việc chuẩn <span className="font-semibold text-slate-700">SMART</span> và xử lý dứt điểm sự cố bằng{' '}
            <span className="font-semibold text-slate-700">chu trình PDCA</span>.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 self-start">
          <button
            onClick={() => setSubTab('SMART')}
            className={`px-4 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'SMART'
                ? 'bg-white text-[#0C1B2E] shadow-sm'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <Target size={15} className="text-[#C69C47]" />
            <span>Giao việc chuẩn SMART</span>
          </button>
          <button
            onClick={() => setSubTab('PDCA')}
            className={`px-4 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'PDCA'
                ? 'bg-white text-[#0C1B2E] shadow-sm'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <RefreshCw size={15} className="text-[#C69C47]" />
            <span>Vòng lặp Cải tiến PDCA</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SMART */}
      {subTab === 'SMART' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-slate-500">
              Đang theo dõi {smartTasks.length} hạng mục ủy quyền
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => theoryService.open('SMART')}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Xem tài liệu lý thuyết & cẩm nang giao việc chuẩn SMART"
              >
                <BookOpen size={15} className="text-[#C69C47]" />
                <span>Lý thuyết SMART</span>
              </button>
              <button
                onClick={openNewSmart}
                className="px-4 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={16} className="text-[#E5C472]" />
                <span>Giao việc SMART mới</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {smartTasks.map((task) => {
              const isDone = task.status === 'COMPLETED';
              return (
                <div key={task.id} className="group axis-card p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleSmartCompleted(task)}
                        className="mt-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                        title="Đánh dấu hoàn thành"
                      >
                        {isDone ? (
                          <CheckCircle2 size={21} className="text-emerald-600" />
                        ) : (
                          <Circle size={21} />
                        )}
                      </button>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-[15.5px] font-bold ${
                              isDone ? 'line-through text-slate-400' : 'text-[#0C1B2E]'
                            }`}
                          >
                            {task.title}
                          </h3>
                          {task.linkedLsxCode && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                              LSX: {task.linkedLsxCode}
                            </span>
                          )}
                          {task.sentToErp && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold">
                              Đã báo sang ProTrack
                            </span>
                          )}
                        </div>
                        <div className="text-[12.5px] text-slate-500 mt-1">
                          Người nhận việc:{' '}
                          <span className="font-semibold text-slate-800">{task.assigneeName}</span>{' '}
                          • Thời gian: <span className="tabular-nums">{task.startDate}</span> →{' '}
                          <span className="font-semibold text-[#9D772B] tabular-nums">
                            {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clean Action Bar: Edit/Delete fade in on hover */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start">
                      <button
                        onClick={() => copySmartBrief(task)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11.5px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                        title="Copy nội dung SMART gửi Zalo"
                      >
                        <Copy size={13} />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => sendSmartToProTrack(task)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0C1B2E]/6 hover:bg-[#0C1B2E] hover:text-white text-[11.5px] font-semibold text-[#0C1B2E] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Bắn thông báo sang ProTrack cho nhân sự này"
                      >
                        <Send size={12} />
                        <span>Báo ERP</span>
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 ml-1">
                        <button
                          onClick={() => openEditSmart(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C1B2E] hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteSmartTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 5 SMART Pillars Compact Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-1">
                    {[
                      { k: 'S', name: 'Cụ thể', val: task.specific },
                      { k: 'M', name: 'Đo lường', val: task.measurable },
                      { k: 'A', name: 'Khả thi', val: task.achievable },
                      { k: 'R', name: 'Liên quan', val: task.relevant },
                      { k: 'T', name: 'Thời hạn', val: task.timeBound },
                    ].map((s) => (
                      <div
                        key={s.k}
                        className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/60"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-5 h-5 rounded-md bg-[#0C1B2E] text-[#F3DA99] text-[10.5px] font-extrabold inline-flex items-center justify-center">
                            {s.k}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 uppercase">
                            {s.name}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-700 leading-relaxed">{s.val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Milestones Bar */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#9D772B]">
                        Kế hoạch theo sát tiến độ & Đôn đốc thực thi
                      </div>
                      <button
                        type="button"
                        onClick={() => theoryService.open('SMART')}
                        className="text-[11px] font-semibold text-slate-500 hover:text-[#0C1B2E] inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Xem tài liệu lý thuyết phương pháp SMART"
                      >
                        <BookOpen size={12} className="text-[#C69C47]" />
                        <span>Lý thuyết SMART</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {task.checkins.map((c, idx) => {
                        const isOverdue = !c.completed && c.dueDate <= todayStr && !isDone;
                        const label = getMilestoneLabel(c, idx);
                        const question = getMilestoneQuestion(c, idx);
                        return (
                          <div
                            key={c.stage || idx}
                            onClick={() => toggleCheckinStage(task, idx)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              c.completed
                                ? 'bg-emerald-50/50 border-emerald-200/80'
                                : isOverdue
                                ? 'bg-amber-50/70 border-amber-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] font-bold text-[#0C1B2E]">
                                {label}
                              </span>
                              {c.completed ? (
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                              ) : (
                                <Circle size={16} className="text-slate-300 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 mt-1 tabular-nums">
                              Ngày check-in: {c.dueDate}
                            </div>
                            <p className="text-[11.5px] text-slate-600 mt-1.5 leading-snug">
                              {question}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PDCA CYCLES */}
      {subTab === 'PDCA' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-slate-500">
              {pdcaCycles.length} vòng lặp cải tiến quy trình (Plan → Do → Check → Act)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => theoryService.open('PDCA')}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Xem tài liệu lý thuyết & quy trình cải tiến PDCA (Deming)"
              >
                <BookOpen size={15} className="text-[#C69C47]" />
                <span>Lý thuyết PDCA</span>
              </button>
              <button
                onClick={openNewPdca}
                className="px-4 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={16} className="text-[#E5C472]" />
                <span>Mở vòng lặp PDCA mới</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {pdcaCycles.map((cycle) => (
              <div key={cycle.id} className="group axis-card p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0C1B2E] text-[#F3DA99] text-[10.5px] font-bold uppercase tracking-wider">
                        Bước hiện tại: {cycle.currentPhase}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {cycle.department}
                      </span>
                      {cycle.linkedLsxCode && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold">
                          LSX: {cycle.linkedLsxCode}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[16px] font-bold text-[#0C1B2E] mt-2">{cycle.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => pushPdcaToErpTraining(cycle)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpenCheck size={14} />
                      <span>
                        {cycle.pushedToTraining
                          ? 'Đã lưu Kho Đào Tạo ERP'
                          : 'Chuẩn hóa Act → Đào tạo ERP'}
                      </span>
                    </button>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                      <button
                        onClick={() => openEditPdca(cycle)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C1B2E] hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => deletePdca(cycle)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[11px] font-extrabold text-[#0C1B2E] uppercase mb-1">
                      1. PLAN — Nguyên nhân & Kế hoạch
                    </div>
                    <p className="text-[12px] text-slate-600">
                      <strong className="text-slate-700">Gốc rễ:</strong> {cycle.planRootCause || '—'}
                    </p>
                    <p className="text-[12px] text-slate-600 mt-1">
                      <strong className="text-slate-700">Đối sách:</strong> {cycle.planSolution || '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[11px] font-extrabold text-[#0C1B2E] uppercase mb-1">
                      2. DO — Triển khai Thử nghiệm
                    </div>
                    <p className="text-[12px] text-slate-600">{cycle.doActions || '—'}</p>
                    <p className="text-[11.5px] text-slate-500 mt-1.5">
                      Phụ trách: <strong>{cycle.doOwner || '—'}</strong>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
                    <div className="text-[11px] font-extrabold text-amber-900 uppercase mb-1">
                      3. CHECK — Hẹn ngày đo lường ({cycle.checkDate})
                    </div>
                    <p className="text-[12px] text-slate-700">
                      {cycle.checkResult || 'Chờ đến ngày hẹn kiểm chứng số liệu...'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/70">
                    <div className="text-[11px] font-extrabold text-emerald-900 uppercase mb-1">
                      4. ACT — Chuẩn hóa Quy trình
                    </div>
                    <p className="text-[12px] text-slate-700">
                      {cycle.actStandard || 'Nếu bước Check đạt hiệu quả, ghi quy tắc chuẩn tại đây để đưa vào OJT.'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL GIAO VIỆC SMART */}
      {showSmartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[16.5px] font-bold text-[#0C1B2E]">
                  {editingSmart ? 'Cập nhật Giao việc SMART & Lịch giám sát' : 'Thiết lập Giao việc chuẩn SMART & Lịch giám sát'}
                </h3>
                <button
                  type="button"
                  onClick={() => theoryService.open('SMART')}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-[11px] font-bold text-[#9D772B] inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Tra cứu lý thuyết SMART"
                >
                  <BookOpen size={13} />
                  <span>Lý thuyết SMART</span>
                </button>
              </div>
              <button
                onClick={() => setShowSmartModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* AI Quick Prompt Bar */}
            <div className="p-3.5 rounded-xl bg-[#0C1B2E]/4 border border-[#0C1B2E]/10 mb-4 space-y-2">
              <label className="block text-[11.5px] font-bold text-[#0C1B2E] uppercase tracking-wider">
                ✨ Nhập nhanh 1 câu ý tưởng → AI tự phân rã đủ 5 chuẩn S-M-A-R-T
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={rawSmartPrompt}
                  onChange={(e) => setRawSmartPrompt(e.target.value)}
                  placeholder="VD: Giao Tổ trưởng Bế sắp xếp lại kệ khuôn từ để tìm khuôn dưới 2 phút..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[13px] focus:border-[#0C1B2E] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={aiRefining}
                  onClick={handleAiRefineSmart}
                  className="px-3.5 py-2 rounded-xl bg-[#0C1B2E] text-[#F3DA99] text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer hover:bg-[#162B47]"
                >
                  <Sparkles size={14} />
                  <span>{aiRefining ? 'Đang chuẩn hóa...' : 'AI Chuẩn hóa SMART'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSmartTask} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Tên hạng mục công việc *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px] focus:border-[#0C1B2E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Nhân sự nhận việc (Từ ERP)
                  </label>
                  <input
                    list="erp-staff-list"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    placeholder="Chọn hoặc gõ tên..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] focus:border-[#0C1B2E] focus:outline-none"
                  />
                  <datalist id="erp-staff-list">
                    {staffDirectory.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.department}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Ngày giao
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Hạn hoàn thành
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    [S] Specific — Cụ thể cần làm gì?
                  </label>
                  <textarea
                    rows={2}
                    value={specific}
                    onChange={(e) => setSpecific(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    [M] Measurable — Số đo nghiệm thu thành công?
                  </label>
                  <textarea
                    rows={2}
                    value={measurable}
                    onChange={(e) => setMeasurable(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    [A] Achievable — Nguồn lực / Phối hợp khả thi?
                  </label>
                  <input
                    type="text"
                    value={achievable}
                    onChange={(e) => setAchievable(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    [R] Relevant — Đóng góp vào mục tiêu chung nào?
                  </label>
                  <input
                    type="text"
                    value={relevant}
                    onChange={(e) => setRelevant(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    [T] Time-bound — Cam kết mốc thời gian
                  </label>
                  <input
                    type="text"
                    value={timeBound}
                    onChange={(e) => setTimeBound(e.target.value)}
                    placeholder="Tự động tính 3 mốc giám sát tiến độ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    Mã LSX liên quan (tùy chọn)
                  </label>
                  <input
                    list="erp-lsx-codes"
                    value={linkedLsxCode}
                    onChange={(e) => setLinkedLsxCode(e.target.value)}
                    placeholder="VD: LSX-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                  <datalist id="erp-lsx-codes">
                    {lsxOrders.slice(0, 40).map((l) => (
                      <option key={l.id} value={l.lsxCode || l.orderCode || l.id}>
                        {l.customer}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSmartModal(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Lưu & Tạo lịch giám sát tiến độ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PDCA */}
      {showPdcaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[16.5px] font-bold text-[#0C1B2E]">
                  Chu trình Cải tiến & Giải quyết Sự cố PDCA
                </h3>
                <button
                  type="button"
                  onClick={() => theoryService.open('PDCA')}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100/80 text-[11px] font-bold text-teal-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Tra cứu lý thuyết PDCA"
                >
                  <BookOpen size={13} />
                  <span>Lý thuyết PDCA</span>
                </button>
              </div>
              <button
                onClick={() => setShowPdcaModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePdca} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Tên vấn đề / Mục tiêu cải tiến *
                </label>
                <input
                  type="text"
                  required
                  value={pdcaTitle}
                  onChange={(e) => setPdcaTitle(e.target.value)}
                  placeholder="VD: Khắc phục lỗi lệch bế trên tem nhãn cuộn..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Bộ phận
                  </label>
                  <input
                    type="text"
                    value={pdcaDept}
                    onChange={(e) => setPdcaDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Giai đoạn hiện tại
                  </label>
                  <select
                    value={pdcaPhase}
                    onChange={(e) => setPdcaPhase(e.target.value as AxisPdcaCycle['currentPhase'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] bg-white"
                  >
                    <option value="PLAN">1. PLAN (Lập kế hoạch)</option>
                    <option value="DO">2. DO (Đang thử nghiệm)</option>
                    <option value="CHECK">3. CHECK (Đo lường hiệu quả)</option>
                    <option value="ACT">4. ACT (Chuẩn hóa)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Ngày nhắc Check kết quả
                  </label>
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    [P] Nguyên nhân gốc rễ (5 Whys)
                  </label>
                  <textarea
                    rows={2}
                    value={planRootCause}
                    onChange={(e) => setPlanRootCause(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    [P] Giải pháp / Kế hoạch cải tiến
                  </label>
                  <textarea
                    rows={2}
                    value={planSolution}
                    onChange={(e) => setPlanSolution(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    [D] Hành động thử nghiệm & Người phụ trách
                  </label>
                  <textarea
                    rows={2}
                    value={doActions}
                    onChange={(e) => setDoActions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                    [C] Kết quả kiểm chứng sau thử nghiệm
                  </label>
                  <textarea
                    rows={2}
                    value={checkResult}
                    onChange={(e) => setCheckResult(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-emerald-800 mb-1">
                  [A] Quy tắc chuẩn hóa lâu dài (sẵn sàng đẩy sang Kho Đào Tạo ERP)
                </label>
                <textarea
                  rows={2}
                  value={actStandard}
                  onChange={(e) => setActStandard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/30 text-[12.5px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPdcaModal(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Lưu chu trình PDCA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

