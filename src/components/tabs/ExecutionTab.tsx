import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AxisSmartTask,
  AxisPdcaCycle,
  AxisOkrObjective,
  AxisNavigationIntent,
  ErpUser,
  ErpLsxOrder,
} from '../../types/axisTypes';
import { buildCheckin369 } from '../../services/seedData';
import { axisDbService } from '../../services/axisDbService';
import { axisAiService } from '../../services/axisAiService';
import { dialogService } from '../common/CustomDialog';
import { theoryService } from '../../services/theoryService';
import {
  addLocalDaysYmd,
  formatRelativeDueBadge,
  getLocalTodayYmd,
  PDCA_NEXT_PHASE,
  PDCA_PHASE_LABELS,
} from '../../utils/dateUtils';

export const getMilestoneLabel = (c: { stage?: string; label?: string }, index?: number) => {
  if (
    c.stage === '1' ||
    c.label?.includes('Mốc 1') ||
    (c.stage === '3' && index === 0) ||
    c.label?.includes('Mốc 3 (30%)') ||
    c.label?.includes('30%') ||
    index === 0
  ) {
    return 'Mốc 1 (30%): Khởi động & Thống nhất hướng đi';
  }
  if (
    c.stage === '2' ||
    c.label?.includes('Mốc 2') ||
    c.stage === '6' ||
    c.label?.includes('Mốc 6') ||
    c.label?.includes('60%') ||
    index === 1
  ) {
    return 'Mốc 2 (60%): Giám sát giữa kỳ & Gỡ nghẽn';
  }
  if (
    (c.stage === '3' && index === 2) ||
    c.label?.includes('Mốc 3: Tiền') ||
    c.stage === '9' ||
    c.label?.includes('Mốc 9') ||
    c.label?.includes('90%') ||
    index === 2
  ) {
    return 'Mốc 3 (90%): Tiền nghiệm thu & Chuẩn bị bàn giao';
  }
  return c.label || `Mốc ${index !== undefined ? index + 1 : ''}: Giám sát tiến độ`;
};

export const getMilestoneQuestion = (
  c: { stage?: string; guidingQuestion?: string },
  index?: number
) => {
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
  okrs: AxisOkrObjective[];
  staffDirectory: Array<{ id: string; name: string; role: string; department: string }>;
  lsxOrders: ErpLsxOrder[];
  navIntent?: AxisNavigationIntent | null;
  onConsumeIntent?: () => void;
}

export const ExecutionTab: React.FC<ExecutionTabProps> = ({
  currentUser,
  smartTasks,
  pdcaCycles,
  okrs,
  staffDirectory,
  lsxOrders,
  navIntent,
  onConsumeIntent,
}) => {
  const [subTab, setSubTab] = useState<'SMART' | 'PDCA'>('SMART');

  const todayStr = getLocalTodayYmd();
  const defaultDue = addLocalDaysYmd(9, todayStr);

  // Task filter & display controls
  const [taskFilter, setTaskFilter] = useState<'ACTIVE' | 'ATTENTION' | 'COMPLETED' | 'ALL'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [compactSmartView, setCompactSmartView] = useState(false);

  // SMART Form State
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [editingSmart, setEditingSmart] = useState<AxisSmartTask | null>(null);
  const [aiRefining, setAiRefining] = useState(false);
  const [showSmartPillarsInForm, setShowSmartPillarsInForm] = useState(true);
  const [autoSendErp, setAutoSendErp] = useState(false);

  const [title, setTitle] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [linkedLsxCode, setLinkedLsxCode] = useState('');
  const [linkedOkrId, setLinkedOkrId] = useState('');
  const [sourcePdcaId, setSourcePdcaId] = useState<string | undefined>(undefined);
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

  const activeLsxChoices = useMemo(() => {
    return lsxOrders
      .filter((l) => !l.isDeleted && l.status !== 'CANCELLED' && l.status !== 'COMPLETED')
      .slice(0, 80);
  }, [lsxOrders]);

  const openNewSmart = (prefill?: {
    title?: string;
    assignee?: string;
    lsxCode?: string;
    okrId?: string;
    relevantText?: string;
    pdcaId?: string;
  }) => {
    setEditingSmart(null);
    setTitle(prefill?.title || '');
    setAssigneeName(prefill?.assignee || staffDirectory[0]?.name || '');
    setLinkedLsxCode(prefill?.lsxCode || '');
    setLinkedOkrId(prefill?.okrId || '');
    setSourcePdcaId(prefill?.pdcaId);
    setStartDate(todayStr);
    setDueDate(defaultDue);
    setSpecific('');
    setMeasurable('');
    setAchievable('');
    setRelevant(prefill?.relevantText || '');
    setTimeBound('');
    setAutoSendErp(false);
    setShowSmartModal(true);
  };

  const openEditSmart = (task: AxisSmartTask) => {
    setEditingSmart(task);
    setTitle(task.title);
    setAssigneeName(task.assigneeName);
    setLinkedLsxCode(task.linkedLsxCode || '');
    setLinkedOkrId(task.linkedOkrId || '');
    setSourcePdcaId(task.sourcePdcaId);
    setStartDate(task.startDate);
    setDueDate(task.dueDate);
    setSpecific(task.specific);
    setMeasurable(task.measurable);
    setAchievable(task.achievable);
    setRelevant(task.relevant);
    setTimeBound(task.timeBound);
    setAutoSendErp(false);
    setShowSmartPillarsInForm(true);
    setShowSmartModal(true);
  };

  const openNewPdca = (prefill?: { title?: string; lsxCode?: string }) => {
    setEditingPdca(null);
    setPdcaTitle(prefill?.title || '');
    setPdcaDept('Xưởng In');
    setPdcaLsx(prefill?.lsxCode || '');
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

  // Consume incoming navigation intent from Today / Strategy / People / Theory
  useEffect(() => {
    if (!navIntent || navIntent.tab !== 'execution') return;
    if (navIntent.subTab === 'PDCA') {
      setSubTab('PDCA');
    } else if (navIntent.subTab === 'SMART') {
      setSubTab('SMART');
    }

    if (navIntent.action === 'NEW_TASK') {
      setSubTab('SMART');
      const matchedOkr = navIntent.okrId ? okrs.find((o) => o.id === navIntent.okrId) : undefined;
      const rel = navIntent.krTitle
        ? `Phục vụ KR: ${navIntent.krTitle} (${matchedOkr?.title || navIntent.okrTitle || ''})`
        : matchedOkr
        ? `Phục vụ OKR: ${matchedOkr.title}`
        : '';
      openNewSmart({
        title: navIntent.prefillTitle || '',
        assignee: navIntent.staffName || '',
        lsxCode: navIntent.lsxCode || '',
        okrId: navIntent.okrId || '',
        relevantText: rel,
      });
    } else if (navIntent.action === 'NEW_PDCA') {
      setSubTab('PDCA');
      openNewPdca({
        title: navIntent.prefillTitle || '',
        lsxCode: navIntent.lsxCode || '',
      });
    } else if (navIntent.action === 'EDIT_PDCA' && navIntent.pdcaId) {
      setSubTab('PDCA');
      const found = pdcaCycles.find((p) => p.id === navIntent.pdcaId);
      if (found) openEditPdca(found);
    }

    onConsumeIntent?.();
  }, [navIntent]);

  const handleAiRefineSmart = async () => {
    const seed = title.trim();
    if (!seed) {
      dialogService.toast('Hãy nhập tên công việc hoặc ý tưởng giao việc trước khi chuẩn hóa.', 'warning');
      return;
    }
    setAiRefining(true);
    setShowSmartPillarsInForm(true);
    try {
      const res = await axisAiService.refineSmartTask(seed, assigneeName, dueDate);
      setTitle(res.title || seed);
      setSpecific(res.specific || '');
      setMeasurable(res.measurable || '');
      setAchievable(res.achievable || '');
      if (!relevant.trim()) {
        setRelevant(res.relevant || '');
      }
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

    const selectedOkr = linkedOkrId ? okrs.find((o) => o.id === linkedOkrId) : undefined;
    const matchedStaff = staffDirectory.find(
      (s) => s.name.toLowerCase() === assigneeName.trim().toLowerCase()
    );

    const task: AxisSmartTask = {
      id: editingSmart ? editingSmart.id : `smart-${Date.now()}`,
      title: title.trim(),
      assigneeName: assigneeName.trim() || 'Chưa gán',
      assigneeId: matchedStaff?.id,
      department: matchedStaff?.department,
      linkedLsxCode: linkedLsxCode.trim() || undefined,
      linkedOkrId: selectedOkr?.id,
      linkedOkrTitle: selectedOkr?.title,
      sourceMeetingId: editingSmart?.sourceMeetingId,
      sourceMeetingTitle: editingSmart?.sourceMeetingTitle,
      sourcePdcaId,
      startDate,
      dueDate,
      status: editingSmart ? editingSmart.status : 'IN_PROGRESS',
      specific: specific.trim() || title.trim(),
      measurable: measurable.trim() || 'Hoàn thành đúng kết quả nghiệm thu thực tế & đúng hạn.',
      achievable: achievable.trim() || 'Phối hợp nguồn lực bộ phận và dữ liệu trên ProTrack ERP.',
      relevant:
        relevant.trim() ||
        (selectedOkr ? `Đóng góp trực tiếp cho OKR: ${selectedOkr.title}` : 'Mục tiêu vận hành trọng tâm.'),
      timeBound: timeBound.trim() || `Hoàn thành trước ${dueDate} qua 3 mốc giám sát tiến độ.`,
      checkins,
      sentToErp: editingSmart?.sentToErp || autoSendErp,
      createdAt: editingSmart ? editingSmart.createdAt : new Date().toISOString(),
    };

    await axisDbService.saveAxisItem('axis_tasks', task);

    if (autoSendErp && task.assigneeName && task.assigneeName !== 'Chưa gán') {
      try {
        const milestoneDates = (task.checkins || [])
          .map((c, idx) => `Mốc ${idx + 1}: ${c.dueDate}`)
          .join(', ');
        await axisDbService.pushNotificationToErpStaff({
          title: `🎯 Giao việc từ CEO: ${task.title}`,
          content: `Đầu ra cần đạt: ${task.measurable} | Hạn chót: ${task.dueDate} (${milestoneDates})`,
          targetUser: task.assigneeName,
          ceoName: currentUser.name || 'CEO',
          actionType: 'CEO_SMART_TASK',
        });
      } catch (err) {
        console.warn('[ExecutionTab] Auto push ERP note:', err);
      }
    }

    dialogService.toast(
      autoSendErp
        ? `Đã tạo việc & bắn thông báo tới ${task.assigneeName} trên ProTrack!`
        : editingSmart
        ? 'Đã cập nhật đầu việc.'
        : 'Đã tạo việc & sinh 3 mốc giám sát tiến độ!'
    );
    setShowSmartModal(false);
  };

  const toggleCheckinStage = async (task: AxisSmartTask, index: number) => {
    const target = task.checkins[index];
    const nextCompleted = !target.completed;
    const nextCheckins = task.checkins.map((c, idx) =>
      idx === index
        ? { ...c, completed: nextCompleted, checkedAt: new Date().toISOString() }
        : c
    );

    let nextStatus = task.status;
    if (nextCompleted && nextCheckins.every((c) => c.completed) && task.status !== 'COMPLETED') {
      const finishAll = await dialogService.confirm(
        `Đã kiểm tra xong cả 3 mốc tiến độ của "${task.title}". Bạn muốn nghiệm thu hoàn thành công việc này luôn không?`,
        'Hoàn tất cả 3 mốc tiến độ',
        { confirmText: 'Nghiệm thu hoàn thành', cancelText: 'Chỉ lưu mốc 3' }
      );
      if (finishAll) nextStatus = 'COMPLETED';
    }

    await axisDbService.saveAxisItem('axis_tasks', {
      ...task,
      status: nextStatus,
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

  const toggleTaskAtRisk = async (task: AxisSmartTask) => {
    if (task.status === 'COMPLETED') return;
    const nextStatus = task.status === 'AT_RISK' ? 'IN_PROGRESS' : 'AT_RISK';
    await axisDbService.saveAxisItem('axis_tasks', {
      ...task,
      status: nextStatus,
    });
    dialogService.toast(
      nextStatus === 'AT_RISK'
        ? 'Đã gắn cờ Cảnh báo rủi ro trễ tiến độ.'
        : 'Đã gỡ cờ cảnh báo rủi ro.'
    );
  };

  const copySmartBrief = (task: AxisSmartTask) => {
    const milestoneSummary = (task.checkins || [])
      .map((c, idx) => `Mốc ${idx + 1} (${c.dueDate})`)
      .join(' | ');
    const text = `📌 GIAO VIỆC TỪ CEO\n• Hạng mục: ${task.title}\n• Phụ trách: ${task.assigneeName}${
      task.linkedLsxCode ? `\n• Mã LSX: ${task.linkedLsxCode}` : ''
    }\n• [S] Cụ thể: ${task.specific}\n• [M] Kết quả cần đạt: ${task.measurable}\n• [A] Phối hợp: ${task.achievable}\n• [R] Mục tiêu: ${task.relevant}\n• [T] Hạn hoàn thành: ${task.dueDate}\n• Lịch rà soát tiến độ: ${milestoneSummary}`;
    navigator.clipboard.writeText(text);
    dialogService.toast('Đã sao chép bản giao việc vào Clipboard!');
  };

  const sendSmartToProTrack = async (task: AxisSmartTask) => {
    const ok = await dialogService.confirm(
      `Bắn thông báo giao việc "${task.title}" trực tiếp tới "${task.assigneeName}" trên hệ thống ProTrack ERP?`,
      'Gửi thông báo sang ProTrack'
    );
    if (!ok) return;
    try {
      const milestoneDates = (task.checkins || [])
        .map((c, idx) => `Mốc ${idx + 1}: ${c.dueDate}`)
        .join(', ');
      await axisDbService.pushNotificationToErpStaff({
        title: `🎯 Giao việc từ CEO: ${task.title}`,
        content: `Mục tiêu: ${task.measurable} | Hạn hoàn thành: ${task.dueDate} (Lịch rà soát: ${milestoneDates})`,
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
    const ok = await dialogService.confirm(`Xóa đầu việc "${task.title}"?`, 'Xóa đầu việc', {
      danger: true,
    });
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_tasks', task.id);
    dialogService.toast('Đã xóa đầu việc.', 'info');
  };

  // PDCA Handlers
  const handleSavePdca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdcaTitle.trim()) return;
    const cycle: AxisPdcaCycle = {
      id: editingPdca ? editingPdca.id : `pdca-${Date.now()}`,
      title: pdcaTitle.trim(),
      department: pdcaDept.trim() || 'Sản xuất',
      linkedLsxCode: pdcaLsx.trim() || undefined,
      currentPhase: pdcaPhase,
      planRootCause: planRootCause.trim(),
      planSolution: planSolution.trim(),
      doActions: doActions.trim(),
      doOwner: doOwner.trim() || 'Phụ trách bộ phận',
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

  const advancePdcaPhase = async (cycle: AxisPdcaCycle) => {
    const next = PDCA_NEXT_PHASE[cycle.currentPhase];
    if (!next) return;
    await axisDbService.saveAxisItem('axis_pdca', {
      ...cycle,
      currentPhase: next,
    });
    dialogService.toast(`Đã chuyển sang bước: ${PDCA_PHASE_LABELS[next]}`);
  };

  const spawnTaskFromPdca = (cycle: AxisPdcaCycle) => {
    setSubTab('SMART');
    openNewSmart({
      title: `[Thực thi PDCA] ${cycle.doActions || cycle.planSolution || cycle.title}`,
      assignee: cycle.doOwner || '',
      lsxCode: cycle.linkedLsxCode || '',
      relevantText: `Khắc phục tận gốc sự cố PDCA: ${cycle.title} (${cycle.department})`,
      pdcaId: cycle.id,
    });
  };

  const pushPdcaToErpTraining = async (cycle: AxisPdcaCycle) => {
    const standardText = cycle.actStandard || cycle.planSolution;
    if (!standardText) {
      dialogService.toast(
        'Vui lòng mở Sửa và ghi nội dung Quy tắc chuẩn hóa (Bước 4 - Act) trước khi ban hành.',
        'warning'
      );
      openEditPdca(cycle);
      return;
    }
    const ok = await dialogService.confirm(
      cycle.pushedToTraining
        ? `Quy chuẩn "${cycle.title}" đã từng được đẩy lên ERP. Bạn có muốn cập nhật bản mới vào Kho Tài Liệu Đào Tạo không?`
        : `Ban hành bài học cải tiến "${cycle.title}" thẳng vào Kho Tài Liệu Đào Tạo của ProTrack ERP?`,
      'Chuẩn hóa Act → Kho Đào Tạo ERP'
    );
    if (!ok) return;

    try {
      await axisDbService.publishTrainingDocToErp({
        title: `[Quy chuẩn cải tiến PDCA] ${cycle.title}`,
        category: cycle.department || 'Quy trình cải tiến',
        description: `Nguyên nhân gốc: ${cycle.planRootCause}\nGiải pháp chuẩn hóa: ${standardText}`,
        keyTakeaways: [
          `Vấn đề khắc phục: ${cycle.planRootCause || cycle.title}`,
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

  // Filtered SMART tasks
  const taskCounts = useMemo(() => {
    let active = 0;
    let attention = 0;
    let completed = 0;
    smartTasks.forEach((t) => {
      if (t.status === 'COMPLETED') {
        completed += 1;
      } else {
        active += 1;
        const hasDueCheckin = (t.checkins || []).some((c) => !c.completed && c.dueDate <= todayStr);
        if (t.status === 'AT_RISK' || t.dueDate <= todayStr || hasDueCheckin) {
          attention += 1;
        }
      }
    });
    return { active, attention, completed, all: smartTasks.length };
  }, [smartTasks, todayStr]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return smartTasks.filter((t) => {
      if (taskFilter === 'ACTIVE' && t.status === 'COMPLETED') return false;
      if (taskFilter === 'COMPLETED' && t.status !== 'COMPLETED') return false;
      if (taskFilter === 'ATTENTION') {
        if (t.status === 'COMPLETED') return false;
        const hasDueCheckin = (t.checkins || []).some((c) => !c.completed && c.dueDate <= todayStr);
        if (t.status !== 'AT_RISK' && t.dueDate > todayStr && !hasDueCheckin) return false;
      }
      if (q) {
        const hay = `${t.title} ${t.assigneeName} ${t.linkedLsxCode || ''} ${t.linkedOkrTitle || ''} ${t.specific}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [smartTasks, taskFilter, searchQuery, todayStr]);

  return (
    <div className="space-y-5">
      {/* Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[25px] font-extrabold text-[#0C1B2E] tracking-tight">
            Giao Việc Cấp Dưới & Xử Lý Sự Cố Quy Trình
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Ủy quyền rõ kết quả đầu ra qua <strong className="text-slate-700">3 mốc giám sát</strong> và
            trị tận gốc lỗi lặp lại bằng <strong className="text-slate-700">chu trình PDCA</strong>.
          </p>
        </div>

        <div className="macos-segmented self-start">
          <button
            onClick={() => setSubTab('SMART')}
            className={`px-4 py-1.5 rounded-[10px] text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'SMART'
                ? 'bg-white text-[#0C1B2E] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <Target size={15} className="text-[#C69C47]" />
            <span>Việc giao cấp dưới ({taskCounts.active})</span>
          </button>
          <button
            onClick={() => setSubTab('PDCA')}
            className={`px-4 py-1.5 rounded-[10px] text-[12.5px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'PDCA'
                ? 'bg-white text-[#0C1B2E] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <RefreshCw size={15} className="text-[#C69C47]" />
            <span>Xử lý sự cố PDCA ({pdcaCycles.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SMART TASKS */}
      {subTab === 'SMART' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ACTIVE' as const, label: `Đang chạy (${taskCounts.active})` },
                {
                  id: 'ATTENTION' as const,
                  label: `Cần đôn đốc / Quá hạn (${taskCounts.attention})`,
                },
                { id: 'COMPLETED' as const, label: `Đã xong (${taskCounts.completed})` },
                { id: 'ALL' as const, label: `Tất cả (${taskCounts.all})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTaskFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer transition-colors ${
                    taskFilter === f.id
                      ? 'bg-[#0C1B2E] text-white'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial sm:w-56">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo việc, người làm, LSX..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-[12.5px] focus:border-[#0C1B2E] focus:outline-none"
                />
              </div>

              <button
                onClick={() => setCompactSmartView(!compactSmartView)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-semibold text-slate-600 cursor-pointer"
                title="Chuyển chế độ hiển thị gọn hoặc đầy đủ 5 cột SMART"
              >
                {compactSmartView ? 'Chế độ: Gọn' : 'Chế độ: Đầy đủ SMART'}
              </button>

              <button
                onClick={() => theoryService.open('SMART')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen size={13} className="text-[#C69C47]" />
                <span>Cẩm nang SMART</span>
              </button>

              <button
                onClick={() => openNewSmart()}
                className="px-3.5 py-1.5 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={15} className="text-[#E5C472]" />
                <span>Giao việc mới</span>
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="axis-card p-10 text-center space-y-2">
              <p className="text-[13.5px] text-slate-500 font-medium">
                Không có đầu việc nào khớp với bộ lọc hiện tại.
              </p>
              <button
                onClick={() => openNewSmart()}
                className="px-4 py-2 rounded-xl bg-[#0C1B2E] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                + Giao đầu việc mới
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const isDone = task.status === 'COMPLETED';
                const isAtRisk = task.status === 'AT_RISK';
                const dueBadge = formatRelativeDueBadge(task.dueDate, todayStr);

                return (
                  <div
                    key={task.id}
                    className={`group axis-card p-5 space-y-3.5 ${
                      isAtRisk && !isDone ? 'border-rose-300 ring-1 ring-rose-200/60' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleSmartCompleted(task)}
                          className="mt-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                          title={isDone ? 'Mở lại công việc' : 'Nghiệm thu hoàn thành'}
                        >
                          {isDone ? (
                            <CheckCircle2 size={21} className="text-emerald-600" />
                          ) : (
                            <Circle size={21} />
                          )}
                        </button>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-[15.5px] font-bold ${
                                isDone ? 'line-through text-slate-400' : 'text-[#0C1B2E]'
                              }`}
                            >
                              {task.title}
                            </h3>
                            {!isDone && dueBadge.tone === 'overdue' && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10.5px] font-bold">
                                {dueBadge.text}
                              </span>
                            )}
                            {!isDone && isAtRisk && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10.5px] font-bold">
                                ⚠ Rủi ro trễ
                              </span>
                            )}
                            {task.linkedLsxCode && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                                LSX: {task.linkedLsxCode}
                              </span>
                            )}
                            {task.linkedOkrTitle && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[10.5px] font-semibold max-w-[260px] truncate">
                                🎯 OKR: {task.linkedOkrTitle}
                              </span>
                            )}
                            {task.sourceMeetingTitle && (
                              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 text-[10.5px] font-semibold max-w-[240px] truncate">
                                📅 Từ họp: {task.sourceMeetingTitle}
                              </span>
                            )}
                            {task.sentToErp && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold">
                                Đã báo ERP
                              </span>
                            )}
                          </div>
                          <div className="text-[12.5px] text-slate-500">
                            Phụ trách:{' '}
                            <span className="font-semibold text-slate-800">
                              {task.assigneeName}
                            </span>{' '}
                            • Khung thời gian: <span className="tabular-nums">{task.startDate}</span>{' '}
                            →{' '}
                            <span className="font-semibold text-[#9D772B] tabular-nums">
                              {task.dueDate}
                            </span>
                          </div>
                          {compactSmartView && (
                            <div className="text-[12px] text-slate-600 pt-0.5">
                              <strong className="text-[#0C1B2E]">Đầu ra cần đạt [M]:</strong>{' '}
                              {task.measurable}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clean Action Bar: Edit/Delete fade in on hover */}
                      <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-start shrink-0">
                        {!isDone && (
                          <button
                            onClick={() => toggleTaskAtRisk(task)}
                            className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                              isAtRisk
                                ? 'border-rose-300 bg-rose-50 text-rose-700'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                            }`}
                            title="Đánh dấu đầu việc đang có nguy cơ trễ để theo dõi sát"
                          >
                            <AlertTriangle size={12} />
                            <span>{isAtRisk ? 'Bỏ cờ rủi ro' : 'Gắn rủi ro'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => copySmartBrief(task)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11.5px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                          title="Copy nội dung gửi Zalo"
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
                          <span>{task.sentToErp ? 'Nhắc lại ERP' : 'Báo ERP'}</span>
                        </button>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 ml-1">
                          <button
                            onClick={() => openEditSmart(task)}
                            title="Chỉnh sửa"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C1B2E] hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteSmartTask(task)}
                            title="Xóa"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 5 SMART Pillars Grid (shown when not in compact mode) */}
                    {!compactSmartView && (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-0.5">
                        {[
                          { k: 'S', name: 'Cụ thể', val: task.specific },
                          { k: 'M', name: 'Đo lường', val: task.measurable },
                          { k: 'A', name: 'Khả thi', val: task.achievable },
                          { k: 'R', name: 'Mục đích', val: task.relevant },
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
                    )}

                    {/* 3 Milestones Bar */}
                    <div className="pt-2.5 border-t border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {(task.checkins || []).map((c, idx) => {
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
                                  ? 'bg-amber-50/75 border-amber-300'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
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
                                Hạn rà soát: {c.dueDate}
                              </div>
                              {c.note ? (
                                <p className="text-[11.5px] text-emerald-800 font-medium mt-1 bg-white/80 px-2 py-1 rounded">
                                  Ghi chú: {c.note}
                                </p>
                              ) : (
                                <p className="text-[11.5px] text-slate-600 mt-1 leading-snug">
                                  {question}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: PDCA CYCLES */}
      {subTab === 'PDCA' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-slate-500">
              {pdcaCycles.length} hồ sơ giải quyết sự cố & chuẩn hóa quy trình (Plan → Do → Check → Act)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => theoryService.open('PDCA')}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <BookOpen size={14} className="text-[#C69C47]" />
                <span>Cẩm nang PDCA</span>
              </button>
              <button
                onClick={() => openNewPdca()}
                className="px-4 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={16} className="text-[#E5C472]" />
                <span>Mở hồ sơ sự cố PDCA</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {pdcaCycles.map((cycle) => {
              const nextPhase = PDCA_NEXT_PHASE[cycle.currentPhase];
              const isCheckDue =
                cycle.currentPhase !== 'STANDARDIZED' &&
                cycle.checkDate &&
                cycle.checkDate <= todayStr;

              return (
                <div key={cycle.id} className="group axis-card p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            cycle.currentPhase === 'STANDARDIZED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-[#0C1B2E] text-[#F3DA99]'
                          }`}
                        >
                          {PDCA_PHASE_LABELS[cycle.currentPhase]}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {cycle.department}
                        </span>
                        {cycle.linkedLsxCode && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold">
                            LSX: {cycle.linkedLsxCode}
                          </span>
                        )}
                        {isCheckDue && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold">
                            Đến ngày kiểm tra hiệu quả ({cycle.checkDate})
                          </span>
                        )}
                      </div>
                      <h3 className="text-[16px] font-bold text-[#0C1B2E] mt-1.5">{cycle.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {nextPhase && (
                        <button
                          onClick={() => advancePdcaPhase(cycle)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-semibold text-[#0C1B2E] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Chuyển bước tiếp</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => spawnTaskFromPdca(cycle)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                        title="Tạo đầu việc giao cụ thể cho nhân sự từ đối sách PDCA này"
                      >
                        <Target size={13} className="text-[#C69C47]" />
                        <span>+ Giao việc thực thi</span>
                      </button>
                      <button
                        onClick={() => pushPdcaToErpTraining(cycle)}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                          cycle.pushedToTraining
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <BookOpenCheck size={14} />
                        <span>
                          {cycle.pushedToTraining
                            ? 'Đã ban hành Kho Đào Tạo ERP'
                            : 'Ban hành Quy chuẩn → ERP'}
                        </span>
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditPdca(cycle)}
                          title="Chỉnh sửa"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C1B2E] hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deletePdca(cycle)}
                          title="Xóa"
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
                        1. Kế hoạch & Nguyên nhân gốc
                      </div>
                      <p className="text-[12px] text-slate-600">
                        <strong className="text-slate-700">Gốc rễ:</strong>{' '}
                        {cycle.planRootCause || '—'}
                      </p>
                      <p className="text-[12px] text-slate-600 mt-1">
                        <strong className="text-slate-700">Đối sách:</strong>{' '}
                        {cycle.planSolution || '—'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <div className="text-[11px] font-extrabold text-[#0C1B2E] uppercase mb-1">
                        2. Triển khai thử nghiệm
                      </div>
                      <p className="text-[12px] text-slate-600">{cycle.doActions || '—'}</p>
                      <p className="text-[11.5px] text-slate-500 mt-1.5">
                        Người phụ trách: <strong>{cycle.doOwner || '—'}</strong>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
                      <div className="text-[11px] font-extrabold text-amber-900 uppercase mb-1">
                        3. Kiểm tra hiệu quả ({cycle.checkDate})
                      </div>
                      <p className="text-[12px] text-slate-700">
                        {cycle.checkResult || 'Chờ đến ngày hẹn đo lường kết quả thực tế...'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/70">
                      <div className="text-[11px] font-extrabold text-emerald-900 uppercase mb-1">
                        4. Quy tắc chuẩn hóa lâu dài
                      </div>
                      <p className="text-[12px] text-slate-700">
                        {cycle.actStandard ||
                          'Khi thử nghiệm hiệu quả, ghi quy tắc chuẩn tại đây để đưa vào Kho Đào Tạo ERP.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  {editingSmart ? 'Cập nhật đầu việc ủy quyền' : 'Giao việc mới cho cấp dưới'}
                </h3>
                <button
                  type="button"
                  onClick={() => theoryService.open('SMART')}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-[11px] font-bold text-[#9D772B] inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Mở ngăn kéo tra cứu nhanh SMART mà không mất nội dung đang nhập"
                >
                  <BookOpen size={13} />
                  <span>Xem nhanh SMART</span>
                </button>
              </div>
              <button
                onClick={() => setShowSmartModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSmartTask} className="space-y-3.5">
              {/* Primary Task Name + 1-Click AI SMART Breakdown */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Tên công việc / Ý tưởng cần giao *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Chuẩn hóa kệ khuôn bế để giảm thời gian tìm khuôn xuống dưới 2 phút..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px] focus:border-[#0C1B2E] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={aiRefining}
                    onClick={handleAiRefineSmart}
                    className="px-3.5 py-2 rounded-xl bg-[#0C1B2E] text-[#F3DA99] text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer hover:bg-[#162B47]"
                    title="Tự động điền chi tiết 5 tiêu chí S-M-A-R-T từ câu mô tả trên"
                  >
                    <Sparkles size={14} />
                    <span>{aiRefining ? 'Đang phân rã...' : 'AI Điền chuẩn SMART'}</span>
                  </button>
                </div>
              </div>

              {/* Assignee + Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Người nhận việc (Từ danh bạ ERP) *
                  </label>
                  <input
                    list="erp-staff-list"
                    required
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    placeholder="Chọn hoặc gõ tên nhân sự..."
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
                    Ngày bắt đầu
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

              {/* Cross-Links: OKR & LSX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Gắn với Mục tiêu OKR chiến lược (tùy chọn)
                  </label>
                  <select
                    value={linkedOkrId}
                    onChange={(e) => setLinkedOkrId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px] bg-white"
                  >
                    <option value="">-- Không gắn / Việc vận hành chung --</option>
                    {okrs.map((o) => (
                      <option key={o.id} value={o.id}>
                        [{o.period}] {o.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Mã Lệnh Sản Xuất (LSX) liên quan (tùy chọn)
                  </label>
                  <input
                    list="erp-lsx-codes"
                    value={linkedLsxCode}
                    onChange={(e) => setLinkedLsxCode(e.target.value)}
                    placeholder="VD: LSX-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                  <datalist id="erp-lsx-codes">
                    {activeLsxChoices.map((l) => (
                      <option key={l.id} value={l.lsxCode || l.orderCode || l.id}>
                        {l.customer} — {l.itemName}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Collapsible 5 SMART Pillars */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowSmartPillarsInForm(!showSmartPillarsInForm)}
                  className="text-[12px] font-bold text-[#9D772B] inline-flex items-center gap-1 cursor-pointer"
                >
                  {showSmartPillarsInForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>
                    {showSmartPillarsInForm
                      ? 'Chi tiết 5 tiêu chí SMART (Có thể bỏ trống nếu giao việc nhanh)'
                      : 'Mở chi tiết 5 tiêu chí S-M-A-R-T'}
                  </span>
                </button>

                {showSmartPillarsInForm && (
                  <div className="mt-2.5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                          [S] Cụ thể — Cần làm chính xác việc gì?
                        </label>
                        <textarea
                          rows={2}
                          value={specific}
                          onChange={(e) => setSpecific(e.target.value)}
                          placeholder="Mặc định lấy theo tên công việc nếu để trống..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                          [M] Đo lường — Con số / Bằng chứng nghiệm thu?
                        </label>
                        <textarea
                          rows={2}
                          value={measurable}
                          onChange={(e) => setMeasurable(e.target.value)}
                          placeholder="VD: Giảm thời gian chờ xuống < 5 phút, báo cáo có ảnh..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                          [A] Khả thi — Nguồn lực / Ai phối hợp?
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
                          [R] Mục đích — Phục vụ mục tiêu nào?
                        </label>
                        <input
                          type="text"
                          value={relevant}
                          onChange={(e) => setRelevant(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-600 mb-1">
                        [T] Cam kết thời hạn & nhịp rà soát
                      </label>
                      <input
                        type="text"
                        value={timeBound}
                        onChange={(e) => setTimeBound(e.target.value)}
                        placeholder="Hệ thống tự động chia 3 mốc kiểm tra tiến độ (30% - 60% - 90%)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-[12.5px] font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSendErp}
                    onChange={(e) => setAutoSendErp(e.target.checked)}
                    className="rounded"
                  />
                  <span>Gửi luôn thông báo giao việc sang ProTrack ERP</span>
                </label>

                <div className="flex justify-end gap-2.5">
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
                    Lưu & Sinh 3 mốc giám sát
                  </button>
                </div>
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
                  {editingPdca ? 'Cập nhật hồ sơ cải tiến PDCA' : 'Mở hồ sơ xử lý sự cố PDCA'}
                </h3>
                <button
                  type="button"
                  onClick={() => theoryService.open('PDCA')}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100/80 text-[11px] font-bold text-teal-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <BookOpen size={13} />
                  <span>Xem nhanh PDCA</span>
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
                  Tên sự cố / Mục tiêu cải tiến *
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
                    Bộ phận liên quan
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
                    Người phụ trách chính (ERP)
                  </label>
                  <input
                    list="erp-staff-list-pdca"
                    value={doOwner}
                    onChange={(e) => setDoOwner(e.target.value)}
                    placeholder="Chọn người phụ trách..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                  <datalist id="erp-staff-list-pdca">
                    {staffDirectory.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.department}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Mã LSX phát sinh lỗi (nếu có)
                  </label>
                  <input
                    list="erp-lsx-codes-pdca"
                    value={pdcaLsx}
                    onChange={(e) => setPdcaLsx(e.target.value)}
                    placeholder="VD: LSX-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                  <datalist id="erp-lsx-codes-pdca">
                    {activeLsxChoices.map((l) => (
                      <option key={l.id} value={l.lsxCode || l.orderCode || l.id}>
                        {l.customer}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Bước hiện tại
                  </label>
                  <select
                    value={pdcaPhase}
                    onChange={(e) => setPdcaPhase(e.target.value as AxisPdcaCycle['currentPhase'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] bg-white"
                  >
                    <option value="PLAN">1. Lập kế hoạch & Tìm gốc rễ (Plan)</option>
                    <option value="DO">2. Đang làm thử nghiệm (Do)</option>
                    <option value="CHECK">3. Đo lường & Kiểm chứng hiệu quả (Check)</option>
                    <option value="ACT">4. Chuẩn hóa quy trình (Act)</option>
                    <option value="STANDARDIZED">Đã ban hành vào Đào tạo ERP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Ngày hẹn CEO kiểm tra kết quả (Check)
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
                    [1. Plan] Nguyên nhân gốc rễ (Hỏi 5 lần Tại sao)
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
                    [1. Plan] Đối sách / Giải pháp khắc phục
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
                    [2. Do] Phạm vi áp dụng thử nghiệm thực tế
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
                    [3. Check] Số liệu / Kết quả sau thử nghiệm
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
                  [4. Act] Quy tắc chuẩn hóa lâu dài (Sẵn sàng đẩy sang Kho Đào Tạo ERP)
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
                  Lưu hồ sơ PDCA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
