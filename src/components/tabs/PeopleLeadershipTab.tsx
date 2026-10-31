import React, { useState, useMemo } from 'react';
import {
  Layers,
  Award,
  GraduationCap,
  Sparkles,
  Send,
  Trophy,
  Trash2,
  BookOpenCheck,
  BookOpen,
  Copy,
  Plus,
} from 'lucide-react';
import {
  AxisMaslowSession,
  AxisFfcPraise,
  AxisTrainingSession,
  ErpUser,
  MaslowTierKey,
} from '../../types/axisTypes';
import { axisDbService } from '../../services/axisDbService';
import { axisAiService } from '../../services/axisAiService';
import { dialogService } from '../common/CustomDialog';
import { theoryService } from '../../services/theoryService';

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
  maslowSessions: AxisMaslowSession[];
  ffcPraises: AxisFfcPraise[];
  trainings: AxisTrainingSession[];
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
    title: 'Tầng 5: Tự Thể Hiện & Phát Triển',
    desc: 'Trao quyền tự chủ, thử thách mới, dẫn dắt kèm cặp đàn em',
    widthCls: 'w-full sm:w-[62%]',
  },
  {
    key: 'ESTEEM',
    level: 4,
    title: 'Tầng 4: Tôn Trọng & Ghi Nhận',
    desc: 'Được khen ngợi đúng lúc (FFC), có tiếng nói và vị thế chuyên môn',
    widthCls: 'w-full sm:w-[72%]',
  },
  {
    key: 'BELONGING',
    level: 3,
    title: 'Tầng 3: Gắn Kết & Thuộc Về',
    desc: 'Hòa thuận với tổ trưởng/đồng nghiệp, không bị cô lập trong ca',
    widthCls: 'w-full sm:w-[82%]',
  },
  {
    key: 'SAFETY',
    level: 2,
    title: 'Tầng 2: An Toàn & Ổn Định',
    desc: 'Quy trình rõ ràng, máy móc an toàn, không hoang mang về công việc',
    widthCls: 'w-full sm:w-[91%]',
  },
  {
    key: 'PHYSIOLOGICAL',
    level: 1,
    title: 'Tầng 1: Sinh Lý, Sức Khỏe & Thu Nhập',
    desc: 'Đảm bảo thu nhập cơ bản, không kiệt sức vì tăng ca kéo dài',
    widthCls: 'w-full',
  },
];

export const PeopleLeadershipTab: React.FC<PeopleLeadershipTabProps> = ({
  currentUser,
  staffDirectory,
  topPerformers,
  getStaff360Profile,
  maslowSessions,
  ffcPraises,
  trainings,
}) => {
  const [subTab, setSubTab] = useState<'MASLOW' | 'FFC' | 'TRAINING'>('MASLOW');

  // 1. MASLOW STATE
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
  const [analyzingMaslow, setAnalyzingMaslow] = useState(false);

  const staff360 = useMemo(
    () => (selectedStaff ? getStaff360Profile(selectedStaff) : null),
    [selectedStaff, getStaff360Profile]
  );

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

  const handleAnalyzeMaslow = async () => {
    if (!selectedStaff.trim()) {
      dialogService.toast('Vui lòng chọn hoặc nhập tên nhân sự cần chẩn đoán.', 'warning');
      return;
    }
    setAnalyzingMaslow(true);
    try {
      const plan = await axisAiService.diagnoseMaslowMotivation({
        employeeName: selectedStaff,
        symptoms: symptoms || 'Giảm nhiệt huyết, thụ động hơn thường ngày',
        bottleneckTier,
        erpSummary: staff360?.summaryText || 'Chưa có nhiều bản ghi trên ERP',
      });
      setAiCoachingPlan(plan);
      dialogService.toast('Đã phân tích điểm nghẽn động lực Maslow!');
    } finally {
      setAnalyzingMaslow(false);
    }
  };

  const handleSaveMaslowLog = async () => {
    if (!selectedStaff.trim()) return;
    const item: AxisMaslowSession = {
      id: `maslow-${Date.now()}`,
      employeeName: selectedStaff.trim(),
      observedSymptoms: symptoms.trim(),
      tierScores,
      bottleneckTier,
      aiActionPlan: aiCoachingPlan,
      privateCeoNote: privateNote.trim(),
      createdAt: new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_coaching', item);
    dialogService.toast('Đã lưu hồ sơ tâm lý 1-on-1 vào sổ bảo mật CEO.');
    setSymptoms('');
    setPrivateNote('');
  };

  // 2. FFC PRAISE STATE
  const [ffcName, setFfcName] = useState('');
  const [rawAchievement, setRawAchievement] = useState('');
  const [feeling, setFeeling] = useState('');
  const [fact, setFact] = useState('');
  const [compare, setCompare] = useState('');
  const [rewardAmount, setRewardAmount] = useState<number>(200000);
  const [composingFfc, setComposingFfc] = useState(false);

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

    const record: AxisFfcPraise = {
      id: `ffc-${Date.now()}`,
      employeeName: ffcName.trim(),
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
        ? 'Đã lưu vào nhật ký khen ngợi FFC.'
        : `Đã gửi vinh danh FFC cho ${ffcName} sang ProTrack ERP!`
    );
  };

  // 3. TRAINING STATE
  const todayStr = new Date().toISOString().slice(0, 10);
  const [trainTopic, setTrainTopic] = useState('');
  const [trainFramework, setTrainFramework] = useState<AxisTrainingSession['frameworkTag']>('3-6-9');
  const [trainAudience, setTrainAudience] = useState('Cấp Tổ trưởng & Quản lý');
  const [trainDate, setTrainDate] = useState(todayStr);
  const [trainTakeaways, setTrainTakeaways] = useState<string[]>([]);
  const [trainScenario, setTrainScenario] = useState('');
  const [generatingTraining, setGeneratingTraining] = useState(false);

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

    const session: AxisTrainingSession = {
      id: `trn-${Date.now()}`,
      topic: trainTopic.trim(),
      frameworkTag: trainFramework,
      targetAudience: trainAudience,
      scheduledDate: trainDate,
      keyTakeaways: trainTakeaways,
      practicalScenario: trainScenario,
      status: 'PLANNED',
      syncedToErpDocs: syncToErp,
      createdAt: new Date().toISOString(),
    };

    await axisDbService.saveAxisItem('axis_trainings', session);
    dialogService.toast(
      syncToErp
        ? 'Đã lưu lịch đào tạo & đồng bộ giáo án sang Kho Tài Liệu ProTrack!'
        : 'Đã lưu kế hoạch đào tạo.'
    );
    setTrainTopic('');
    setTrainTakeaways([]);
    setTrainScenario('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[25px] font-extrabold text-[#0C1B2E] tracking-tight">
            Nhân Tâm, Tạo Động Lực & Đào Tạo Đội Ngũ
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Thấu hiểu nhân sự qua <span className="font-semibold text-slate-700">Tháp Maslow</span>, khen ngợi tinh tế bằng{' '}
            <span className="font-semibold text-slate-700">FFC</span> và tổ chức <span className="font-semibold text-slate-700">Đào tạo</span>.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 self-start flex-wrap">
          <button
            onClick={() => setSubTab('MASLOW')}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${
              subTab === 'MASLOW' ? 'bg-white text-[#0C1B2E] shadow-sm' : 'text-slate-600'
            }`}
          >
            <Layers size={14} className="text-[#C69C47]" />
            <span>Tháp Maslow 1-1</span>
          </button>
          <button
            onClick={() => setSubTab('FFC')}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${
              subTab === 'FFC' ? 'bg-white text-[#0C1B2E] shadow-sm' : 'text-slate-600'
            }`}
          >
            <Award size={14} className="text-[#C69C47]" />
            <span>Khen ngợi FFC</span>
          </button>
          <button
            onClick={() => setSubTab('TRAINING')}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${
              subTab === 'TRAINING' ? 'bg-white text-[#0C1B2E] shadow-sm' : 'text-slate-600'
            }`}
          >
            <GraduationCap size={14} className="text-[#C69C47]" />
            <span>Tổ chức Đào tạo</span>
          </button>
        </div>
      </div>

      {/* 1. MASLOW DIAGNOSIS */}
      {subTab === 'MASLOW' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <div className="text-[14px] font-bold text-[#0C1B2E]">
                Bắt Mạch Động Lực Nhân Viên Theo Tháp Maslow 5 Tầng
              </div>
              <div className="text-[12px] text-slate-500">
                Tìm chính xác tầng nhu cầu đang tắc nghẽn để kê đơn giải pháp trúng đích, thay vì tăng lương theo cảm tính.
              </div>
            </div>
            <button
              onClick={() => theoryService.open('MASLOW')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              title="Xem cẩm nang lý thuyết Tháp Maslow trị liệu động lực"
            >
              <BookOpen size={15} className="text-[#C69C47]" />
              <span>Lý thuyết Tháp Maslow</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 axis-card p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-bold uppercase text-slate-500 mb-1">
                  Chọn nhân sự đang giảm động lực (Từ ERP)
                </label>
                <input
                  list="maslow-staff"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  placeholder="Chọn hoặc gõ tên nhân viên..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
                />
                <datalist id="maslow-staff">
                  {staffDirectory.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.department}
                    </option>
                  ))}
                </datalist>
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

            {/* Live ERP 360° Snapshot */}
            {staff360 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9D772B] mb-2">
                  Dữ liệu 360° thực tế từ ProTrack ERP của {selectedStaff || 'nhân sự'}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  {[
                    { label: 'Báo cáo SL', val: staff360.prodSessions },
                    { label: 'Ca Tăng ca', val: staff360.otSessions },
                    { label: 'Nghỉ phép', val: staff360.leaveCount },
                    { label: 'Khen thưởng', val: staff360.rewardCount },
                    { label: 'Kỷ luật', val: staff360.disciplineCount },
                    { label: 'Khóa OJT', val: staff360.trainingCount },
                  ].map((m) => (
                    <div key={m.label} className="bg-white p-2 rounded-lg border border-slate-200/70">
                      <div className="text-[15px] font-extrabold text-[#0C1B2E] tabular-nums">
                        {m.val}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive 5-Tier Pyramid */}
            <div className="space-y-2.5">
              <div className="text-[12px] font-bold text-[#0C1B2E]">
                Chấm điểm mức độ đáp ứng hiện tại ở 5 tầng nhu cầu (1 = Đang thiếu hụt → 5 = Rất tốt):
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
                          <div className="text-[12.5px] font-bold text-[#0C1B2E] flex items-center gap-2">
                            <span>{tier.title}</span>
                            {isBottleneck && (
                              <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold">
                                Điểm nghẽn chính
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
                    : 'AI Gợi ý Kịch bản Trò chuyện 1-on-1'}
                </span>
              </button>
            </div>
          </div>

          {/* Right 5 cols: Coaching Plan & Private CEO Vault */}
          <div className="lg:col-span-5 space-y-5">
            <div className="axis-card p-5 space-y-3">
              <h3 className="text-[15px] font-bold text-[#0C1B2E]">
                Phác Đồ Gỡ Rối Động Lực & Ghi Chú Bảo Mật CEO
              </h3>
              <textarea
                rows={6}
                value={aiCoachingPlan}
                onChange={(e) => setAiCoachingPlan(e.target.value)}
                placeholder="Bấm nút 'AI Gợi ý Kịch bản Trò chuyện 1-on-1' bên trái hoặc tự ghi phác đồ tiếp cận nhân sự..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-[12.5px] text-slate-700 leading-relaxed"
              />
              <textarea
                rows={2}
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                placeholder="Ghi chú riêng tư của CEO sau buổi nói chuyện (Chỉ CEO xem được)..."
                className="w-full p-3 rounded-xl border border-slate-200 text-[12.5px]"
              />
              <button
                type="button"
                onClick={handleSaveMaslowLog}
                className="w-full py-2.5 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold cursor-pointer"
              >
                Lưu vào Nhật ký Nhân tâm CEO
              </button>
            </div>

            {maslowSessions.length > 0 && (
              <div className="axis-card p-5 space-y-3">
                <h4 className="text-[13.5px] font-bold text-[#0C1B2E]">
                  Lịch sử Coaching 1-on-1 ({maslowSessions.length})
                </h4>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {maslowSessions.map((m) => (
                    <div key={m.id} className="group py-2.5 flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[13px] font-bold text-slate-800">
                          {m.employeeName}{' '}
                          <span className="text-[11px] font-normal text-amber-700">
                            • Nghẽn: {m.bottleneckTier}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-500 line-clamp-2 mt-0.5">
                          {m.privateCeoNote || m.aiActionPlan}
                        </p>
                      </div>
                      <button
                        onClick={() => axisDbService.deleteAxisItem('axis_coaching', m.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
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

      {/* 2. FFC PRAISE STUDIO */}
      {subTab === 'FFC' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <div className="text-[14px] font-bold text-[#0C1B2E]">
                Nghệ Thuật Khen Ngợi & Ghi Nhận FFC (Feeling • Fact • Compare)
              </div>
              <div className="text-[12px] text-slate-500">
                Khen trúng huyệt tâm lý với cảm xúc chân thành, dẫn chứng cụ thể và làm nổi bật sự tiến bộ vượt bậc.
              </div>
            </div>
            <button
              onClick={() => theoryService.open('FFC')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              title="Xem cẩm nang lý thuyết nguyên tắc khen ngợi FFC"
            >
              <BookOpen size={15} className="text-[#C69C47]" />
              <span>Lý thuyết Nguyên tắc FFC</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 axis-card p-5 sm:p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#0C1B2E]">
              Soạn Lời Khen Tinh Tế Chuẩn FFC (Feeling • Fact • Compare)
            </h3>

            {/* Gợi ý nhanh từ báo cáo sản lượng ERP */}
            {topPerformers.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
                <div className="text-[11px] font-bold uppercase text-amber-900 mb-2">
                  🌟 Gợi ý nhân sự nộp báo cáo sản lượng tích cực gần đây (Từ ERP):
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
                      className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 hover:border-[#0C1B2E] text-[12px] font-semibold text-slate-800 cursor-pointer"
                    >
                      {w.name} ({w.reportCount} ca)
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Nhân sự được khen ngợi *
                </label>
                <input
                  list="maslow-staff"
                  value={ffcName}
                  onChange={(e) => setFfcName(e.target.value)}
                  placeholder="Tên nhân sự..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Ghi nhận nhanh hành vi tốt
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rawAchievement}
                    onChange={(e) => setRawAchievement(e.target.value)}
                    placeholder="VD: Phát hiện sớm lỗi film trước khi in..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                  />
                  <button
                    type="button"
                    disabled={composingFfc}
                    onClick={handleAiComposeFfc}
                    className="px-3 py-2 rounded-xl bg-[#0C1B2E] text-[#F3DA99] text-[12px] font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>AI FFC</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-bold text-[#0C1B2E] mb-1">
                  1. [F] Feeling — Cảm xúc chân thành của CEO (Tránh khen xã giao)
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
                  3. [C] Compare — So sánh sự tiến bộ hoặc tác động tích cực tạo ra
                </label>
                <input
                  type="text"
                  value={compare}
                  onChange={(e) => setCompare(e.target.value)}
                  placeholder="VD: So với tháng trước, độ tỉ mỉ của em tăng vượt bậc, cứu cho xưởng cả trăm mét giấy..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-500">Thưởng nóng (nếu có):</span>
                <input
                  type="number"
                  step={50000}
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(Number(e.target.value))}
                  className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12.5px] font-bold tabular-nums"
                />
                <span className="text-[12px] text-slate-500">VNĐ</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
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
                  onClick={() => handleSaveAndSendFfc('ERP_PRAISE')}
                  className="px-3.5 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} className="text-[#E5C472]" />
                  <span>Gửi lời khen sang ERP</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAndSendFfc('ERP_REWARD')}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C69C47] to-[#A67C2E] text-white text-[12px] font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Trophy size={13} />
                  <span>Thưởng & Nổ pháo hoa ERP</span>
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
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {ffcPraises.map((p) => (
                  <div key={p.id} className="group py-3 flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-bold text-[#0C1B2E]">
                          {p.employeeName}
                        </span>
                        {p.sentToErpReward && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Thưởng ERP
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-slate-600 leading-relaxed">
                        {p.finalMessage}
                      </p>
                    </div>
                    <button
                      onClick={() => axisDbService.deleteAxisItem('axis_praises', p.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
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

      {/* 3. TRAINING ORGANIZER */}
      {subTab === 'TRAINING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 axis-card p-5 sm:p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#0C1B2E]">
              Thiết Kế Chương Trình Đào Tạo Nội Bộ (CEO Coach)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Hệ quy chiếu huấn luyện
                </label>
                <select
                  value={trainFramework}
                  onChange={(e) =>
                    setTrainFramework(e.target.value as AxisTrainingSession['frameworkTag'])
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] bg-white"
                >
                  <option value="3-6-9">Báo cáo & Họp tiến độ 3-6-9</option>
                  <option value="PREP">Diễn đạt gãy gọn PREP</option>
                  <option value="SMART">Thiết lập mục tiêu SMART</option>
                  <option value="PDCA">Tư duy cải tiến PDCA</option>
                  <option value="FFC">Văn hóa ghi nhận FFC</option>
                  <option value="OKR">Tư duy mục tiêu OKR</option>
                  <option value="MASLOW">Thấu hiểu nhân sự Maslow</option>
                  <option value="SWOT">Phân tích SWOT</option>
                  <option value="SKILL">Kỹ năng chuyên môn nhà máy</option>
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
                  placeholder="VD: Cách báo cáo sự cố trong 60 giây bằng PREP..."
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
                  4 Điểm cốt lõi học viên cần nhớ:
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
                Bài tập tình huống thực chiến tại buổi học
              </label>
              <textarea
                rows={3}
                value={trainScenario}
                onChange={(e) => setTrainScenario(e.target.value)}
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
                Lưu kế hoạch
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
              <div className="divide-y divide-slate-100">
                {trainings.map((tr) => (
                  <div key={tr.id} className="group py-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#0C1B2E] text-[#F3DA99] text-[10.5px] font-bold">
                          {tr.frameworkTag}
                        </span>
                        <span className="text-[12px] font-semibold text-slate-500 tabular-nums">
                          Ngày: {tr.scheduledDate}
                        </span>
                        {tr.syncedToErpDocs && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold">
                            Đã đồng bộ ERP
                          </span>
                        )}
                      </div>
                      <h4 className="text-[14px] font-bold text-[#0C1B2E]">{tr.topic}</h4>
                      <p className="text-[12px] text-slate-500">Học viên: {tr.targetAudience}</p>
                      {tr.practicalScenario && (
                        <p className="text-[12px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-1">
                          {tr.practicalScenario}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => axisDbService.deleteAxisItem('axis_trainings', tr.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

