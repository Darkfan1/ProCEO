import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Award,
  GraduationCap,
  Sparkles,
  Send,
  Trophy,
  Trash2,
  Edit3,
  BookOpenCheck,
  BookOpen,
  Copy,
  Plus,
  Target,
  CheckCircle2,
  Circle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import {
  AxisMaslowSession,
  AxisFfcPraise,
  AxisTrainingSession,
  AxisSmartTask,
  AxisPdcaCycle,
  AxisNavigationIntent,
  AxisTabId,
  ErpUser,
  MaslowTierKey,
} from '../../types/axisTypes';
import { axisDbService } from '../../services/axisDbService';
import { axisAiService } from '../../services/axisAiService';
import { dialogService } from '../common/CustomDialog';
import { theoryService } from '../../services/theoryService';
import {
  addLocalDaysYmd,
  getLocalTodayYmd,
  MASLOW_TIER_LABELS,
  TRAINING_TAG_LABELS,
} from '../../utils/dateUtils';

interface PeopleLeadershipTabProps {
  currentUser: ErpUser;
  staffDirectory: Array<{ id: string; name: string; role: string; department: string }>;
  topPerformers: Array<{ name: string; reportCount: number; totalQty: number; pauseCount: number }>;
  getStaff360Profile: (name: string) => {
    prodSessions: number;
    pauseSessions: number;
    leaveCount: number;
    rewardCount: number;
    disciplineCount: number;
    otSessions: number;
    trainingCount: number;
    summaryText: string;
  };
  smartTasks: AxisSmartTask[];
  pdcaCycles: AxisPdcaCycle[];
  maslowSessions: AxisMaslowSession[];
  ffcPraises: AxisFfcPraise[];
  trainings: AxisTrainingSession[];
  navIntent?: AxisNavigationIntent | null;
  onConsumeIntent?: () => void;
  onNavigate: (tab: AxisTabId, intent?: Omit<AxisNavigationIntent, 'tab' | 'ts'>) => void;
}

const MASLOW_TIERS: Array<{
  key: MaslowTierKey;
  level: number;
  title: string;
  desc: string;
  widthCls: string;
}> = [
  {
    key: 'SELF_ACTUALIZATION',
    level: 5,
    title: 'Tầng 5: Tự Chủ & Phát Triển Bản Thân',
    desc: 'Trao quyền tự chủ, bài toán thử thách mới, dẫn dắt kèm cặp đàn em',
    widthCls: 'w-full sm:w-[64%]',
  },
  {
    key: 'ESTEEM',
    level: 4,
    title: 'Tầng 4: Tôn Trọng & Ghi Nhận',
    desc: 'Được khen ngợi đúng lúc (FFC), lắng nghe ý kiến và trân trọng tay nghề',
    widthCls: 'w-full sm:w-[73%]',
  },
  {
    key: 'BELONGING',
    level: 3,
    title: 'Tầng 3: Gắn Kết Tập Thể',
    desc: 'Hòa thuận với tổ trưởng/đồng nghiệp, không bị cô lập trong ca sản xuất',
    widthCls: 'w-full sm:w-[82%]',
  },
  {
    key: 'SAFETY',
    level: 2,
    title: 'Tầng 2: An Toàn & Ổn Định',
    desc: 'Quy trình rõ ràng, máy móc an toàn, yên tâm gắn bó lâu dài',
    widthCls: 'w-full sm:w-[91%]',
  },
  {
    key: 'PHYSIOLOGICAL',
    level: 1,
    title: 'Tầng 1: Thu Nhập Cơ Bản & Sức Khỏe',
    desc: 'Đảm bảo thu nhập trang trải cuộc sống, không kiệt sức vì tăng ca kéo dài',
    widthCls: 'w-full',
  },
];

export const PeopleLeadershipTab: React.FC<PeopleLeadershipTabProps> = ({
  currentUser,
  staffDirectory,
  topPerformers,
  getStaff360Profile,
  smartTasks,
  pdcaCycles,
  maslowSessions,
  ffcPraises,
  trainings,
  navIntent,
  onConsumeIntent,
  onNavigate,
}) => {
  const [subTab, setSubTab] = useState<'MASLOW' | 'FFC' | 'TRAINING'>('MASLOW');
  const todayStr = getLocalTodayYmd();

  // ─── 1. MASLOW STATE ───────────────────────────────────────────────────────
  const [editingMaslowId, setEditingMaslowId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState(staffDirectory[0]?.name || '');
  const [symptoms, setSymptoms] = useState('');
  const [tierScores, setTierScores] = useState<Record<MaslowTierKey, number>>({
    PHYSIOLOGICAL: 4,
    SAFETY: 4,
    BELONGING: 4,
    ESTEEM: 2,
    SELF_ACTUALIZATION: 3,
  });
  const [aiCoachingPlan, setAiCoachingPlan] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState(() => addLocalDaysYmd(7, todayStr));
  const [analyzingMaslow, setAnalyzingMaslow] = useState(false);

  // ─── 2. FFC PRAISE STATE ───────────────────────────────────────────────────
  const [ffcName, setFfcName] = useState('');
  const [rawAchievement, setRawAchievement] = useState('');
  const [feeling, setFeeling] = useState('');
  const [fact, setFact] = useState('');
  const [compare, setCompare] = useState('');
  const [rewardAmount, setRewardAmount] = useState<number>(200000);
  const [composingFfc, setComposingFfc] = useState(false);

  // ─── 3. TRAINING STATE ─────────────────────────────────────────────────────
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [trainTopic, setTrainTopic] = useState('');
  const [trainFramework, setTrainFramework] = useState<AxisTrainingSession['frameworkTag']>('3-6-9');
  const [trainAudience, setTrainAudience] = useState('Cấp Tổ trưởng & Quản lý');
  const [trainDate, setTrainDate] = useState(todayStr);
  const [trainTakeaways, setTrainTakeaways] = useState<string[]>([]);
  const [trainScenario, setTrainScenario] = useState('');
  const [generatingTraining, setGeneratingTraining] = useState(false);

  // Set initial selectedStaff once staffDirectory loads if empty
  useEffect(() => {
    if (!selectedStaff && staffDirectory.length > 0) {
      setSelectedStaff(staffDirectory[0].name);
    }
  }, [staffDirectory, selectedStaff]);

  // Consume deep-link navigation intent
  useEffect(() => {
    if (!navIntent || navIntent.tab !== 'people') return;

    if (navIntent.subTab === 'FFC' || navIntent.action === 'NEW_FFC') {
      setSubTab('FFC');
      if (navIntent.staffName) setFfcName(navIntent.staffName);
      if (navIntent.prefillNote) setRawAchievement(navIntent.prefillNote);
    } else if (navIntent.subTab === 'TRAINING') {
      setSubTab('TRAINING');
      if (navIntent.prefillTitle) setTrainTopic(navIntent.prefillTitle);
    } else {
      setSubTab('MASLOW');
      if (navIntent.staffName) setSelectedStaff(navIntent.staffName);
      if (navIntent.prefillNote) setSymptoms(navIntent.prefillNote);
    }

    onConsumeIntent?.();
  }, [navIntent, onConsumeIntent]);

  // Staff 360 + CEO Tasks context for Maslow selectedStaff
  const staff360 = useMemo(
    () => (selectedStaff.trim() ? getStaff360Profile(selectedStaff.trim()) : null),
    [selectedStaff, getStaff360Profile]
  );

  const staffAssignedTasks = useMemo(() => {
    const target = selectedStaff.trim().toLowerCase();
    if (!target) return [];
    return smartTasks.filter((t) => t.assigneeName.trim().toLowerCase() === target);
  }, [selectedStaff, smartTasks]);

  const staffPastPraisesCount = useMemo(() => {
    const target = selectedStaff.trim().toLowerCase();
    if (!target) return 0;
    return ffcPraises.filter((p) => p.employeeName.trim().toLowerCase() === target).length;
  }, [selectedStaff, ffcPraises]);

  // Recently completed SMART tasks for quick FFC praise suggestions
  const completedTaskAchievers = useMemo(() => {
    return smartTasks
      .filter((t) => t.status === 'COMPLETED' && t.assigneeName.trim())
      .slice(0, 5);
  }, [smartTasks]);

  const bottleneckTier = useMemo<MaslowTierKey>(() => {
    const order: MaslowTierKey[] = [
      'PHYSIOLOGICAL',
      'SAFETY',
      'BELONGING',
      'ESTEEM',
      'SELF_ACTUALIZATION',
    ];
    let lowest = order[0];
    order.forEach((k) => {
      if (tierScores[k] < tierScores[lowest]) lowest = k;
    });
    return lowest;
  }, [tierScores]);

  // ─── MASLOW HANDLERS ───────────────────────────────────────────────────────
  const resetMaslowForm = () => {
    setEditingMaslowId(null);
    setSymptoms('');
    setAiCoachingPlan('');
    setPrivateNote('');
    setFollowUpDate(addLocalDaysYmd(7, todayStr));
    setTierScores({
      PHYSIOLOGICAL: 4,
      SAFETY: 4,
      BELONGING: 4,
      ESTEEM: 2,
      SELF_ACTUALIZATION: 3,
    });
  };

  const loadMaslowSession = (m: AxisMaslowSession) => {
    setEditingMaslowId(m.id);
    setSelectedStaff(m.employeeName);
    setSymptoms(m.observedSymptoms || '');
    setTierScores(m.tierScores);
    setAiCoachingPlan(m.aiActionPlan || '');
    setPrivateNote(m.privateCeoNote || '');
    setFollowUpDate(m.followUpDate || '');
  };

  const handleAnalyzeMaslow = async () => {
    if (!selectedStaff.trim()) {
      dialogService.toast('Vui lòng chọn hoặc nhập tên nhân sự cần chẩn đoán.', 'warning');
      return;
    }
    setAnalyzingMaslow(true);
    try {
      const activeTaskNote =
        staffAssignedTasks.length > 0
          ? `; Đang nhận ${staffAssignedTasks.filter((t) => t.status !== 'COMPLETED').length} đầu việc trực tiếp từ CEO`
          : '';
      const plan = await axisAiService.diagnoseMaslowMotivation({
        employeeName: selectedStaff,
        symptoms: symptoms || 'Giảm nhiệt huyết, thụ động hơn thường ngày',
        bottleneckTier,
        erpSummary: (staff360?.summaryText || 'Chưa có nhiều bản ghi trên ERP') + activeTaskNote,
      });
      setAiCoachingPlan(plan);
      dialogService.toast('Đã phân tích điểm nghẽn động lực Maslow!');
    } finally {
      setAnalyzingMaslow(false);
    }
  };

  const handleSaveMaslowLog = async () => {
    if (!selectedStaff.trim()) {
      dialogService.toast('Vui lòng chọn tên nhân sự.', 'warning');
      return;
    }
    const matchedStaff = staffDirectory.find(
      (s) => s.name.toLowerCase() === selectedStaff.trim().toLowerCase()
    );
    const existing = editingMaslowId
      ? maslowSessions.find((x) => x.id === editingMaslowId)
      : null;

    const item: AxisMaslowSession = {
      id: existing ? existing.id : `maslow-${Date.now()}`,
      employeeName: selectedStaff.trim(),
      employeeId: matchedStaff?.id,
      department: matchedStaff?.department,
      observedSymptoms: symptoms.trim(),
      tierScores,
      bottleneckTier,
      aiActionPlan: aiCoachingPlan,
      privateCeoNote: privateNote.trim(),
      followUpDate: followUpDate || undefined,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_coaching', item);
    dialogService.toast(
      existing
        ? 'Đã cập nhật hồ sơ Coaching 1-1.'
        : 'Đã lưu hồ sơ 1-1 vào sổ bảo mật CEO (sẽ nhắc theo dõi đúng hạn).'
    );
    resetMaslowForm();
  };

  const handleDeleteMaslow = async (m: AxisMaslowSession) => {
    const ok = await dialogService.confirm(
      `Xóa hồ sơ Coaching 1-1 của "${m.employeeName}" khỏi sổ bảo mật CEO?`,
      'Xóa hồ sơ 1-1',
      { danger: true }
    );
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_coaching', m.id);
    if (editingMaslowId === m.id) resetMaslowForm();
    dialogService.toast('Đã xóa hồ sơ Coaching.', 'info');
  };

  // ─── FFC PRAISE HANDLERS ───────────────────────────────────────────────────
  const resetFfcForm = () => {
    setFfcName('');
    setRawAchievement('');
    setFeeling('');
    setFact('');
    setCompare('');
  };

  const handleAiComposeFfc = async () => {
    if (!ffcName.trim()) {
      dialogService.toast('Hãy chọn tên nhân sự cần khen ngợi trước.', 'warning');
      return;
    }
    setComposingFfc(true);
    try {
      const res = await axisAiService.composeFfcPraise(ffcName, rawAchievement);
      setFeeling(res.feeling || '');
      setFact(res.fact || '');
      setCompare(res.compare || '');
      dialogService.toast('Đã soạn lời khen ấm áp theo đúng cấu trúc FFC!');
    } finally {
      setComposingFfc(false);
    }
  };

  const fullFfcText = [feeling, fact, compare].filter(Boolean).join(' ');

  const handleSaveAndSendFfc = async (mode: 'SAVE_ONLY' | 'ERP_PRAISE' | 'ERP_REWARD') => {
    if (!ffcName.trim() || !fullFfcText.trim()) {
      dialogService.toast('Vui lòng điền tên nhân viên và nội dung khen FFC.', 'warning');
      return;
    }

    if (mode === 'ERP_REWARD') {
      const ok = await dialogService.confirm(
        `Ban hành Quyết định Khen thưởng chính thức (${rewardAmount.toLocaleString('vi-VN')}đ) cho "${ffcName}" lên hệ thống ProTrack ERP (kèm hiệu ứng vinh danh)?`,
        'Ban hành Khen thưởng FFC sang ERP'
      );
      if (!ok) return;
      await axisDbService.publishOfficialRewardToErp({
        employeeName: ffcName.trim(),
        description: fullFfcText,
        amount: rewardAmount,
        ceoUser: currentUser,
      });
    } else if (mode === 'ERP_PRAISE') {
      const ok = await dialogService.confirm(
        `Gửi lời khen ngợi FFC trực tiếp tới thông báo cá nhân của "${ffcName}" trên ProTrack ERP?`,
        'Gửi lời khen FFC sang ERP'
      );
      if (!ok) return;
      await axisDbService.publishAnnouncementToErp({
        title: `🏆 Ghi nhận & Khen ngợi từ CEO dành cho ${ffcName.trim()}`,
        content: fullFfcText,
        category: 'PRAISE',
        targetType: 'INDIVIDUAL',
        targetValue: ffcName.trim(),
        requireAck: false,
        ceoUser: currentUser,
      });
    }

    const matchedStaff = staffDirectory.find(
      (s) => s.name.toLowerCase() === ffcName.trim().toLowerCase()
    );

    const record: AxisFfcPraise = {
      id: `ffc-${Date.now()}`,
      employeeName: ffcName.trim(),
      employeeId: matchedStaff?.id,
      feeling,
      fact,
      compare,
      finalMessage: fullFfcText,
      rewardAmount: mode === 'ERP_REWARD' ? rewardAmount : undefined,
      sentToErpAnnouncement: mode === 'ERP_PRAISE',
      sentToErpReward: mode === 'ERP_REWARD',
      createdAt: new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_praises', record);
    dialogService.toast(
      mode === 'SAVE_ONLY'
        ? `Đã lưu nhật ký khen ngợi FFC cho ${ffcName}.`
        : `Đã gửi vinh danh FFC cho ${ffcName} sang ProTrack ERP!`
    );
    resetFfcForm();
  };

  const handleDeleteFfc = async (p: AxisFfcPraise) => {
    const ok = await dialogService.confirm(
      `Xóa nhật ký khen ngợi FFC của "${p.employeeName}"?`,
      'Xóa nhật ký FFC',
      { danger: true }
    );
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_praises', p.id);
    dialogService.toast('Đã xóa bản ghi FFC.', 'info');
  };

  // ─── TRAINING HANDLERS ─────────────────────────────────────────────────────
  const resetTrainingForm = () => {
    setEditingTrainingId(null);
    setTrainTopic('');
    setTrainFramework('3-6-9');
    setTrainAudience('Cấp Tổ trưởng & Quản lý');
    setTrainDate(todayStr);
    setTrainTakeaways([]);
    setTrainScenario('');
  };

  const loadTrainingToEdit = (tr: AxisTrainingSession) => {
    setEditingTrainingId(tr.id);
    setTrainTopic(tr.topic);
    setTrainFramework(tr.frameworkTag);
    setTrainAudience(tr.targetAudience);
    setTrainDate(tr.scheduledDate);
    setTrainTakeaways(tr.keyTakeaways || []);
    setTrainScenario(tr.practicalScenario || '');
  };

  const handleLoadFromPdca = (pdca: AxisPdcaCycle) => {
    setTrainFramework('PDCA');
    setTrainTopic(`Chuẩn hóa chống tái diễn: ${pdca.title}`);
    setTrainAudience(pdca.department ? `Bộ phận ${pdca.department}` : 'Tổ trưởng & Công nhân đứng máy');
    const takeaways = [
      pdca.planRootCause ? `Nguyên nhân gốc rễ: ${pdca.planRootCause}` : '',
      pdca.planSolution ? `Giải pháp khắc phục: ${pdca.planSolution}` : '',
      pdca.actStandard ? `Tiêu chuẩn SOP bắt buộc: ${pdca.actStandard}` : '',
    ].filter(Boolean);
    setTrainTakeaways(takeaways);
    setTrainScenario(
      pdca.doActions ||
        `Thực hành kiểm tra chéo ngay tại chuyền (${pdca.department}) theo tiêu chuẩn mới.`
    );
    dialogService.toast('Đã nạp nội dung bài học thực tế từ vòng lặp PDCA!');
  };

  const handleAiBuildTraining = async () => {
    const seed = trainTopic.trim() || `Ứng dụng ${trainFramework} trong phối hợp sản xuất`;
    setGeneratingTraining(true);
    try {
      const res = await axisAiService.generateTrainingOutline(seed, trainFramework, trainAudience);
      if (!trainTopic.trim()) setTrainTopic(seed);
      setTrainTakeaways(res.keyTakeaways || []);
      setTrainScenario(res.practicalScenario || '');
      dialogService.toast('Đã thiết kế xong khung bài giảng & tình huống thực hành!');
    } finally {
      setGeneratingTraining(false);
    }
  };

  const handleSaveTraining = async (syncToErp: boolean) => {
    if (!trainTopic.trim()) {
      dialogService.toast('Vui lòng nhập chủ đề buổi đào tạo.', 'warning');
      return;
    }

    if (syncToErp) {
      await axisDbService.publishTrainingDocToErp({
        title: `[Đào tạo CEO - ${trainFramework}] ${trainTopic.trim()}`,
        category: `Tư duy & Quản trị (${trainAudience})`,
        description: trainScenario || `Chương trình đào tạo nội bộ ngày ${trainDate}`,
        keyTakeaways:
          trainTakeaways.length > 0
            ? trainTakeaways
            : [`Áp dụng thực tế nguyên tắc ${trainFramework} vào công việc hàng ngày.`],
        ceoUser: currentUser,
      });
    }

    const existing = editingTrainingId
      ? trainings.find((t) => t.id === editingTrainingId)
      : null;

    const session: AxisTrainingSession = {
      id: existing ? existing.id : `trn-${Date.now()}`,
      topic: trainTopic.trim(),
      frameworkTag: trainFramework,
      targetAudience: trainAudience,
      scheduledDate: trainDate,
      keyTakeaways: trainTakeaways,
      practicalScenario: trainScenario,
      status: existing ? existing.status : 'PLANNED',
      syncedToErpDocs: syncToErp || existing?.syncedToErpDocs,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    await axisDbService.saveAxisItem('axis_trainings', session);
    dialogService.toast(
      syncToErp
        ? 'Đã lưu lịch đào tạo & đồng bộ giáo án sang Kho Tài Liệu ProTrack!'
        : existing
        ? 'Đã cập nhật chuyên đề đào tạo.'
        : 'Đã lưu kế hoạch đào tạo.'
    );
    resetTrainingForm();
  };

  const toggleTrainingCompleted = async (tr: AxisTrainingSession) => {
    const nextStatus: AxisTrainingSession['status'] =
      tr.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
    await axisDbService.saveAxisItem('axis_trainings', {
      ...tr,
      status: nextStatus,
    });
    dialogService.toast(
      nextStatus === 'COMPLETED'
        ? `Đã đánh dấu hoàn thành buổi đào tạo "${tr.topic}"!`
        : 'Đã chuyển lại về trạng thái Dự kiến.'
    );
  };

  const handleDeleteTraining = async (tr: AxisTrainingSession) => {
    const ok = await dialogService.confirm(
      `Xóa chuyên đề đào tạo "${tr.topic}"?`,
      'Xóa lịch đào tạo',
      { danger: true }
    );
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_trainings', tr.id);
    if (editingTrainingId === tr.id) resetTrainingForm();
    dialogService.toast('Đã xóa buổi đào tạo.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[25px] font-extrabold text-[#0C1B2E] tracking-tight">
            Đội Ngũ, Tạo Động Lực & Đào Tạo Nội Bộ
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Bắt đúng mạch tâm lý nhân sự bằng <span className="font-semibold text-slate-700">Maslow 1-1</span>, ghi nhận kịp thời chuẩn{' '}
            <span className="font-semibold text-slate-700">FFC</span> và nâng tầm đội ngũ qua <span className="font-semibold text-slate-700">Đào tạo</span>.
          </p>
        </div>

        <div className="macos-segmented self-start flex-wrap">
          <button
            onClick={() => setSubTab('MASLOW')}
            className={`px-3.5 py-1.5 rounded-[10px] text-[12px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'MASLOW'
                ? 'bg-white text-[#0C1B2E] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <Layers size={14} className="text-[#C69C47]" />
            <span>Động lực Maslow 1-1 ({maslowSessions.length})</span>
          </button>
          <button
            onClick={() => setSubTab('FFC')}
            className={`px-3.5 py-1.5 rounded-[10px] text-[12px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'FFC'
                ? 'bg-white text-[#0C1B2E] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <Award size={14} className="text-[#C69C47]" />
            <span>Khen ngợi FFC ({ffcPraises.length})</span>
          </button>
          <button
            onClick={() => setSubTab('TRAINING')}
            className={`px-3.5 py-1.5 rounded-[10px] text-[12px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'TRAINING'
                ? 'bg-white text-[#0C1B2E] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <GraduationCap size={14} className="text-[#C69C47]" />
            <span>Đào tạo Nội bộ ({trainings.length})</span>
          </button>
        </div>
      </div>

      {/* Shared Staff Datalist */}
      <datalist id="axis-people-staff">
        {staffDirectory.map((s) => (
          <option key={s.id} value={s.name}>
            {s.department} {s.role ? `• ${s.role}` : ''}
          </option>
        ))}
      </datalist>

      {/* ─── 1. MASLOW DIAGNOSIS & 1-ON-1 COACHING ───────────────────────────── */}
      {subTab === 'MASLOW' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <div className="text-[14px] font-bold text-[#0C1B2E]">
                Chẩn Đoán Động Lực & Đối Thoại 1-1 Theo Tháp Maslow 5 Tầng
              </div>
              <div className="text-[12px] text-slate-500">
                Kết hợp hồ sơ 360° trên ProTrack ERP và các đầu việc đang giao để tháo gỡ đúng tầng nhu cầu đang tắc nghẽn.
              </div>
            </div>
            <button
              type="button"
              onClick={() => theoryService.open('MASLOW')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <BookOpen size={15} className="text-[#C69C47]" />
              <span>Tra cứu Tháp Maslow</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 axis-card p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold uppercase text-slate-500 mb-1">
                    Nhân sự cần trao đổi / bắt mạch (Từ ERP)
                  </label>
                  <input
                    list="axis-people-staff"
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    placeholder="Chọn hoặc gõ tên nhân viên..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold uppercase text-slate-500 mb-1">
                    Biểu hiện quan sát thấy
                  </label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="VD: Trầm lắng, hay xin nghỉ, năng suất giảm..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
              </div>

              {/* Unified Live ERP 360° + CEO Work Context */}
              {selectedStaff.trim() && staff360 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#9D772B]">
                      Hồ sơ thực tế 360° (ERP + AXIS) của {selectedStaff}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFfcName(selectedStaff.trim());
                          setSubTab('FFC');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Award size={12} />
                        <span>Khen ngợi FFC</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('execution', {
                            subTab: 'SMART',
                            action: 'NEW_TASK',
                            staffName: selectedStaff.trim(),
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-[#0C1B2E] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Target size={12} />
                        <span>Giao việc / Thử thách mới</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    {[
                      { label: 'Báo cáo SL', val: staff360.prodSessions },
                      { label: 'Ca Tăng ca', val: staff360.otSessions },
                      { label: 'Nghỉ phép', val: staff360.leaveCount },
                      { label: 'Khen ERP/FFC', val: staff360.rewardCount + staffPastPraisesCount },
                      { label: 'Kỷ luật', val: staff360.disciplineCount },
                      { label: 'Việc CEO giao', val: staffAssignedTasks.length },
                    ].map((m) => (
                      <div key={m.label} className="bg-white p-2 rounded-lg border border-slate-200/70">
                        <div className="text-[15px] font-extrabold text-[#0C1B2E] tabular-nums">
                          {m.val}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {staffAssignedTasks.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                      <span className="font-semibold text-slate-500">Đầu việc CEO giao:</span>
                      {staffAssignedTasks.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className={`px-2 py-0.5 rounded-md border ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          {t.status === 'COMPLETED' ? '✓ ' : '• '}
                          {t.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Interactive 5-Tier Pyramid */}
              <div className="space-y-2.5">
                <div className="text-[12px] font-bold text-[#0C1B2E]">
                  Chấm điểm mức độ đáp ứng hiện tại ở 5 tầng nhu cầu (1 = Đang thiếu hụt → 5 = Đang rất tốt):
                </div>
                <div className="flex flex-col items-center space-y-2 pt-1">
                  {MASLOW_TIERS.map((tier) => {
                    const score = tierScores[tier.key];
                    const isBottleneck = bottleneckTier === tier.key;
                    return (
                      <div
                        key={tier.key}
                        className={`${tier.widthCls} p-3 rounded-xl border transition-all ${
                          isBottleneck
                            ? 'bg-amber-50/90 border-amber-400 shadow-sm'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-[12.5px] font-bold text-[#0C1B2E] flex flex-wrap items-center gap-2">
                              <span>{tier.title}</span>
                              {isBottleneck && (
                                <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold">
                                  Điểm nghẽn cần gỡ
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{tier.desc}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() =>
                                  setTierScores((prev) => ({ ...prev, [tier.key]: n }))
                                }
                                className={`w-7 h-7 rounded-lg text-[11.5px] font-bold cursor-pointer transition-colors ${
                                  score === n
                                    ? 'bg-[#0C1B2E] text-[#F3DA99]'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={analyzingMaslow}
                  onClick={handleAnalyzeMaslow}
                  className="px-4 py-2.5 rounded-xl bg-[#0C1B2E] text-[#F3DA99] text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>
                    {analyzingMaslow
                      ? 'Đang phân tích tâm lý...'
                      : 'AI Gợi ý Kịch bản Trò chuyện 1-1'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right 5 cols: Coaching Plan, Follow-up Date & Private CEO Vault */}
            <div className="lg:col-span-5 space-y-5">
              <div className="axis-card p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[#0C1B2E]">
                    {editingMaslowId ? 'Cập Nhật Hồ Sơ 1-1' : 'Phác Đồ Gỡ Nghẽn & Sổ Bảo Mật CEO'}
                  </h3>
                  {editingMaslowId && (
                    <button
                      type="button"
                      onClick={resetMaslowForm}
                      className="text-[11.5px] font-semibold text-slate-500 hover:text-[#0C1B2E] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={11} />
                      <span>Tạo mới</span>
                    </button>
                  )}
                </div>

                <textarea
                  rows={5}
                  value={aiCoachingPlan}
                  onChange={(e) => setAiCoachingPlan(e.target.value)}
                  placeholder="Bấm nút 'AI Gợi ý Kịch bản Trò chuyện 1-1' bên trái hoặc tự ghi phác đồ tiếp cận nhân sự..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-[12.5px] text-slate-700 leading-relaxed"
                />

                <textarea
                  rows={2}
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  placeholder="Ghi chú riêng tư của CEO sau buổi nói chuyện 1-1 (Cam kết, tâm tư nhân sự)..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-[12.5px]"
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="text-[12px] font-semibold text-slate-600">
                    Ngày hẹn hỏi thăm lại (Nhắc trên Hôm Nay):
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-[12.5px] font-semibold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveMaslowLog}
                  className="w-full py-2.5 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold cursor-pointer"
                >
                  {editingMaslowId ? 'Lưu cập nhật hồ sơ 1-1' : 'Lưu vào Nhật ký Nhân sự CEO'}
                </button>
              </div>

              {maslowSessions.length > 0 && (
                <div className="axis-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13.5px] font-bold text-[#0C1B2E]">
                      Lịch sử Trao đổi 1-1 ({maslowSessions.length})
                    </h4>
                    <span className="text-[11px] text-slate-400">Bấm để xem lại</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {maslowSessions.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => loadMaslowSession(m)}
                        className={`group py-2.5 px-2 rounded-xl cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                          editingMaslowId === m.id ? 'bg-[#0C1B2E]/5' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                            <span>{m.employeeName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10.5px] font-semibold">
                              Nghẽn: {MASLOW_TIER_LABELS[m.bottleneckTier] || m.bottleneckTier}
                            </span>
                          </div>
                          {m.followUpDate && (
                            <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                              Hẹn hỏi thăm lại: {m.followUpDate}
                            </div>
                          )}
                          <p className="text-[12px] text-slate-600 line-clamp-2 mt-0.5">
                            {m.privateCeoNote || m.aiActionPlan || m.observedSymptoms}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMaslow(m);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                          title="Xóa hồ sơ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. FFC PRAISE STUDIO ────────────────────────────────────────────── */}
      {subTab === 'FFC' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <div className="text-[14px] font-bold text-[#0C1B2E]">
                Nghệ Thuật Khen Ngợi & Ghi Nhận Đúng Lúc FFC (Feeling • Fact • Compare)
              </div>
              <div className="text-[12px] text-slate-500">
                Khen cụ thể vào hành vi & con số vừa làm tốt, lan tỏa năng lượng tích cực sang bảng tin hoặc khen thưởng ProTrack ERP.
              </div>
            </div>
            <button
              type="button"
              onClick={() => theoryService.open('FFC')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <BookOpen size={15} className="text-[#C69C47]" />
              <span>Tra cứu khung FFC</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 axis-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-bold text-[#0C1B2E]">
                  Soạn Lời Khen Tinh Tế Chuẩn FFC
                </h3>
                {(ffcName || fullFfcText || rawAchievement) && (
                  <button
                    type="button"
                    onClick={resetFfcForm}
                    className="text-[12px] font-semibold text-slate-500 hover:text-[#0C1B2E] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Làm mới</span>
                  </button>
                )}
              </div>

              {/* Suggestions from ERP Top Performers + Completed CEO SMART Tasks */}
              {(topPerformers.length > 0 || completedTaskAchievers.length > 0) && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2">
                  {completedTaskAchievers.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase text-emerald-900 mb-1.5">
                        ✅ Nhân sự vừa hoàn thành đầu việc CEO giao:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {completedTaskAchievers.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setFfcName(t.assigneeName);
                              setRawAchievement(`Hoàn thành tốt đầu việc "${t.title}" đúng tiến độ`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 hover:border-[#0C1B2E] text-[11.5px] font-semibold text-slate-800 cursor-pointer"
                          >
                            {t.assigneeName} • {t.title.slice(0, 28)}
                            {t.title.length > 28 ? '...' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {topPerformers.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase text-amber-900 mb-1.5">
                        🌟 Nhân sự nộp báo cáo sản lượng tích cực trên ProTrack ERP:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {topPerformers.map((w) => (
                          <button
                            key={w.name}
                            type="button"
                            onClick={() => {
                              setFfcName(w.name);
                              setRawAchievement(
                                `Hoàn thành ${w.reportCount} phiên báo cáo sản lượng đều đặn, giữ nhịp sản xuất rất tốt`
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 hover:border-[#0C1B2E] text-[11.5px] font-semibold text-slate-800 cursor-pointer"
                          >
                            {w.name} ({w.reportCount} ca)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Nhân sự được khen ngợi *
                  </label>
                  <input
                    list="axis-people-staff"
                    value={ffcName}
                    onChange={(e) => setFfcName(e.target.value)}
                    placeholder="Chọn hoặc gõ tên nhân sự..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                    Ghi nhận nhanh hành vi tốt (để AI triển khai FFC)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={rawAchievement}
                      onChange={(e) => setRawAchievement(e.target.value)}
                      placeholder="VD: Phát hiện sớm lỗi film trước khi lên máy in..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                    />
                    <button
                      type="button"
                      disabled={composingFfc}
                      onClick={handleAiComposeFfc}
                      className="px-3 py-2 rounded-xl bg-[#0C1B2E] text-[#F3DA99] text-[12px] font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>{composingFfc ? 'Đang soạn...' : 'AI FFC'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0C1B2E] mb-1">
                    1. [F] Feeling — Cảm xúc chân thành của CEO (Tránh khen xã giao chung chung)
                  </label>
                  <input
                    type="text"
                    value={feeling}
                    onChange={(e) => setFeeling(e.target.value)}
                    placeholder="VD: Anh thực sự rất ấn tượng và yên tâm khi thấy..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0C1B2E] mb-1">
                    2. [F] Fact — Sự thật / Hành vi / Con số cụ thể vừa diễn ra
                  </label>
                  <input
                    type="text"
                    value={fact}
                    onChange={(e) => setFact(e.target.value)}
                    placeholder="VD: Em đã chủ động kiểm tra kỹ cuộn decal và báo dừng kịp thời lệnh..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0C1B2E] mb-1">
                    3. [C] Compare — So sánh sự tiến bộ hoặc giá trị tích cực mang lại
                  </label>
                  <input
                    type="text"
                    value={compare}
                    onChange={(e) => setCompare(e.target.value)}
                    placeholder="VD: So với tháng trước, độ tỉ mỉ của em tăng rõ rệt, giúp xưởng tránh lãng phí hàng trăm mét giấy..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-slate-500">
                    Mức thưởng nóng (khi ban hành Quyết định thưởng ERP):
                  </span>
                  <input
                    type="number"
                    step={50000}
                    min={0}
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(Number(e.target.value))}
                    className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12.5px] font-bold tabular-nums"
                  />
                  <span className="text-[12px] text-slate-500">VNĐ</span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!fullFfcText.trim()) return;
                      navigator.clipboard.writeText(fullFfcText);
                      dialogService.toast('Đã copy lời khen FFC!');
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAndSendFfc('SAVE_ONLY')}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>Chỉ lưu nhật ký</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAndSendFfc('ERP_PRAISE')}
                    className="px-3.5 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={13} className="text-[#E5C472]" />
                    <span>Gửi lời khen ERP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAndSendFfc('ERP_REWARD')}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C69C47] to-[#A67C2E] text-white text-[12px] font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Trophy size={13} />
                    <span>Thưởng & Vinh danh ERP</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 axis-card p-5 space-y-3">
              <h3 className="text-[15px] font-bold text-[#0C1B2E]">
                Nhật Ký Ghi Nhận & Khen Ngợi FFC ({ffcPraises.length})
              </h3>
              {ffcPraises.length === 0 ? (
                <p className="text-[12.5px] text-slate-400 py-8 text-center">
                  Chưa có bản ghi khen ngợi FFC nào. Hãy lan tỏa sự ghi nhận đầu tiên hôm nay!
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                  {ffcPraises.map((p) => (
                    <div key={p.id} className="group py-3 flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] font-bold text-[#0C1B2E]">
                            {p.employeeName}
                          </span>
                          {p.sentToErpReward ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold tabular-nums">
                              Thưởng ERP {p.rewardAmount ? `${p.rewardAmount.toLocaleString('vi-VN')}đ` : ''}
                            </span>
                          ) : p.sentToErpAnnouncement ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              Đã gửi thông báo ERP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              Lưu nội bộ
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-slate-600 leading-relaxed">
                          {p.finalMessage}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFfc(p)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                        title="Xóa bản ghi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. INTERNAL TRAINING ORGANIZER ──────────────────────────────────── */}
      {subTab === 'TRAINING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 axis-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[16px] font-bold text-[#0C1B2E]">
                {editingTrainingId
                  ? 'Cập Nhật Chuyên Đề Đào Tạo'
                  : 'Thiết Kế Buổi Đào Tạo Nội Bộ (CEO Coach)'}
              </h3>
              {editingTrainingId && (
                <button
                  type="button"
                  onClick={resetTrainingForm}
                  className="text-[12px] font-semibold text-slate-500 hover:text-[#0C1B2E] inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Tạo mới</span>
                </button>
              )}
            </div>

            {/* Bridge: Pull Training Topic directly from PDCA Improvement Cycles */}
            {pdcaCycles.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-slate-500">
                  🔄 Nạp nhanh chủ đề từ bài học xử lý sự cố PDCA:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pdcaCycles.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleLoadFromPdca(p)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#0C1B2E] text-[11.5px] font-semibold text-slate-700 cursor-pointer truncate max-w-[260px]"
                      title={`Nạp bài học từ PDCA: ${p.title}`}
                    >
                      + {p.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Phương pháp / Kỹ năng huấn luyện
                </label>
                <select
                  value={trainFramework}
                  onChange={(e) =>
                    setTrainFramework(e.target.value as AxisTrainingSession['frameworkTag'])
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] bg-white font-semibold"
                >
                  {Object.entries(TRAINING_TAG_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Ngày dự kiến tổ chức
                </label>
                <input
                  type="date"
                  value={trainDate}
                  onChange={(e) => setTrainDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Chủ đề buổi đào tạo *
                </label>
                <input
                  type="text"
                  value={trainTopic}
                  onChange={(e) => setTrainTopic(e.target.value)}
                  placeholder="VD: Báo cáo sự cố gãy gọn trong 60 giây bằng PREP..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Đối tượng học
                </label>
                <input
                  type="text"
                  value={trainAudience}
                  onChange={(e) => setTrainAudience(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={generatingTraining}
              onClick={handleAiBuildTraining}
              className="px-3.5 py-2 rounded-xl bg-[#0C1B2E]/8 hover:bg-[#0C1B2E] hover:text-white text-[12.5px] font-semibold text-[#0C1B2E] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles size={14} className="text-[#C69C47]" />
              <span>
                {generatingTraining
                  ? 'Đang soạn sườn bài giảng...'
                  : 'AI Soạn 4 Điểm Cốt Lõi & Tình Huống Thực Hành'}
              </span>
            </button>

            {trainTakeaways.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-slate-500">
                  Các điểm cốt lõi học viên cần nắm vững:
                </div>
                {trainTakeaways.map((t, idx) => (
                  <div key={idx} className="text-[12.5px] text-slate-700">
                    {idx + 1}. {t}
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                Bài tập tình huống thực hành ngay tại buổi học
              </label>
              <textarea
                rows={3}
                value={trainScenario}
                onChange={(e) => setTrainScenario(e.target.value)}
                placeholder="Mô tả tình huống thực tế tại nhà máy để học viên đóng vai xử lý..."
                className="w-full p-3 rounded-xl border border-slate-200 text-[12.5px]"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleSaveTraining(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Plus size={14} className="inline mr-1" />
                {editingTrainingId ? 'Lưu cập nhật' : 'Lưu kế hoạch'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveTraining(true)}
                className="px-4 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpenCheck size={14} className="text-[#E5C472]" />
                <span>Lưu & Đẩy vào Kho Đào Tạo ERP</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 axis-card p-5 sm:p-6 space-y-3">
            <h3 className="text-[15.5px] font-bold text-[#0C1B2E]">
              Lịch Trình & Chuyên Đề Đào Tạo Của CEO ({trainings.length})
            </h3>
            {trainings.length === 0 ? (
              <p className="text-[12.5px] text-slate-400 py-10 text-center">
                Chưa có buổi đào tạo nào được lên lịch.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
                {trainings.map((tr) => {
                  const isCompleted = tr.status === 'COMPLETED';
                  return (
                    <div
                      key={tr.id}
                      className="group py-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleTrainingCompleted(tr)}
                          className="mt-1 text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
                          title={
                            isCompleted
                              ? 'Đã tổ chức xong (bấm để chuyển lại Dự kiến)'
                              : 'Đánh dấu đã tổ chức đào tạo xong'
                          }
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={17} className="text-emerald-600" />
                          ) : (
                            <Circle size={17} />
                          )}
                        </button>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#0C1B2E] text-[#F3DA99] text-[10.5px] font-bold">
                              {TRAINING_TAG_LABELS[tr.frameworkTag] || tr.frameworkTag}
                            </span>
                            <span className="text-[12px] font-semibold text-slate-500 tabular-nums">
                              Ngày: {tr.scheduledDate}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {isCompleted ? 'Đã tổ chức' : 'Dự kiến'}
                            </span>
                            {tr.syncedToErpDocs && (
                              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[10.5px] font-semibold">
                                Đã đồng bộ ERP
                              </span>
                            )}
                          </div>
                          <h4
                            className={`text-[14px] font-bold ${
                              isCompleted ? 'line-through text-slate-400' : 'text-[#0C1B2E]'
                            }`}
                          >
                            {tr.topic}
                          </h4>
                          <p className="text-[12px] text-slate-500">
                            Đối tượng: {tr.targetAudience}
                          </p>
                          {tr.practicalScenario && (
                            <p className="text-[12px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-1">
                              {tr.practicalScenario}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => loadTrainingToEdit(tr)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C1B2E] hover:bg-slate-100 cursor-pointer"
                          title="Chỉnh sửa chuyên đề"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTraining(tr)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Xóa buổi đào tạo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
