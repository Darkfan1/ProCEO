import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquareQuote,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Sparkles,
  Send,
  Copy,
  Trash2,
  ArrowRightCircle,
  Bell,
} from 'lucide-react';
import {
  AxisMeeting,
  AxisPrepDoc,
  AxisSmartTask,
  AxisTabId,
  ErpUser,
} from '../../types/axisTypes';
import { buildCheckin369 } from '../../services/seedData';
import { axisDbService } from '../../services/axisDbService';
import { axisAiService } from '../../services/axisAiService';
import { dialogService } from '../common/CustomDialog';
import { theoryService } from '../../services/theoryService';
import { FrameworkCode } from '../../data/managementFrameworksTheory';

interface MeetingsPlaybookTabProps {
  currentUser: ErpUser;
  meetings: AxisMeeting[];
  prepDocs: AxisPrepDoc[];
  staffDirectory: Array<{ id: string; name: string; role: string; department: string }>;
  onNavigate: (tab: AxisTabId) => void;
}

const EIGHT_FRAMEWORKS_PLAYBOOK = [
  {
    code: 'SMART',
    name: 'Mục tiêu & Giao việc SMART',
    essence: 'Specific (Cụ thể) • Measurable (Đo được) • Achievable (Khả thi) • Relevant (Liên quan) • Time-bound (Thời hạn).',
    whenToUse: 'Mỗi khi CEO giao việc mới hoặc chốt mục tiêu dự án cho cấp dưới.',
    goldenQuestions: [
      'Con số nào chứng minh việc này đã hoàn thành tốt?',
      'Người nhận việc có đủ thẩm quyền và nguồn lực để làm không?',
      'Hạn chót chính xác là ngày giờ nào?',
    ],
    targetTab: 'execution' as AxisTabId,
  },
  {
    code: '3-6-9',
    name: 'Kỷ Luật Họp 3-6-9',
    essence: '3 Công thức (Họp phải làm • Giao phải giám sát • Theo sát + Đôn đốc = Đúng hạn) • 6 Bước tổ chức • 9 Nguyên tắc bắt buộc.',
    whenToUse: 'Áp dụng cho mọi cuộc họp điều hành, giao ban sản xuất và theo dõi thực thi sau họp.',
    goldenQuestions: [
      'Cuộc họp này nếu không tổ chức thì công ty có chịu thiệt hại gì không?',
      'Mọi người đã nghiên cứu tài liệu trước khi bước vào phòng họp chưa?',
      'Ai là người chịu trách nhiệm chính và lịch kiểm tra giám sát là ngày nào?',
    ],
    targetTab: 'meetings' as AxisTabId,
  },
  {
    code: 'PDCA',
    name: 'Chu trình Cải tiến PDCA',
    essence: 'Plan (Tìm nguyên nhân gốc & Lập kế hoạch) → Do (Làm thử phạm vi nhỏ) → Check (Đo lại kết quả) → Act (Chuẩn hóa thành SOP/OJT).',
    whenToUse: 'Khi xảy ra lỗi sản xuất lặp lại, khách hàng khiếu nại hoặc một chỉ số KPI tụt giảm.',
    goldenQuestions: [
      'Tại sao lỗi này xảy ra (Hỏi 5 lần Tại sao để tìm lỗi quy trình chứ không đổ lỗi cá nhân)?',
      'Ngày nào chúng ta đo lại xem giải pháp mới có thực sự hiệu quả?',
      'Đã viết thành quy định ngắn đưa vào Kho Đào Tạo để người sau không vấp lại chưa?',
    ],
    targetTab: 'execution' as AxisTabId,
  },
  {
    code: 'OKR',
    name: 'Quản trị Mục tiêu OKR',
    essence: 'Objective (Đích đến truyền cảm hứng: Ta muốn đi đâu?) + 3–4 Key Results (Cột mốc số liệu: Làm sao biết ta đã tới nơi?).',
    whenToUse: 'Đầu mỗi Quý / Tháng để hội tụ toàn bộ năng lượng công ty vào 3 ưu tiên quan trọng nhất.',
    goldenQuestions: [
      'Nếu Quý này chỉ được hoàn thành xuất sắc 1 điều duy nhất, đó là điều gì?',
      'Các KR đã phải là Kết quả đầu ra (Outcome) chưa hay mới chỉ là Đầu việc (Task)?',
    ],
    targetTab: 'strategy' as AxisTabId,
  },
  {
    code: 'SWOT',
    name: 'Phân tích Vị thế SWOT → TOWS',
    essence: 'Strengths (Mạnh) • Weaknesses (Yếu) • Opportunities (Cơ hội) • Threats (Thách thức) → Ghép cặp thành hành động.',
    whenToUse: 'Khi hoạch định chiến lược năm/quý, ra mắt mảng sản phẩm mới hoặc đầu tư máy móc lớn.',
    goldenQuestions: [
      'Lợi thế nào của ta mà đối thủ khó sao chép nhất trong 12 tháng tới?',
      'Điểm yếu nội bộ nào nếu không sửa ngay sẽ làm ta lỡ mất cơ hội thị trường?',
    ],
    targetTab: 'strategy' as AxisTabId,
  },
  {
    code: 'PREP',
    name: 'Tư duy Diễn đạt PREP',
    essence: 'Point (Nêu ngay kết luận) → Reason (Lý do cốt lõi) → Example (Ví dụ/Số liệu chứng minh) → Point (Chốt lại thông điệp).',
    whenToUse: 'Khi CEO phát biểu chỉ đạo, ra thông báo toàn công ty, và yêu cầu nhân sự áp dụng khi báo cáo trong cuộc họp.',
    goldenQuestions: [
      'Câu đầu tiên đã đi thẳng vào kết luận/đề xuất chưa hay còn vòng vo trình bày hoàn cảnh?',
      'Có con số hay ví dụ thực tế nào từ xưởng để minh họa không?',
    ],
    targetTab: 'meetings' as AxisTabId,
  },
  {
    code: 'MASLOW',
    name: 'Tháp Nhu cầu Maslow',
    essence: '5 tầng động lực: Sinh lý/Thu nhập → An toàn → Gắn kết → Được tôn trọng → Tự thể hiện & Phát triển.',
    whenToUse: 'Khi nhân sự giỏi bỗng dưng trầm lắng, giảm hiệu suất, hoặc muốn giữ chân nhân sự chủ chốt.',
    goldenQuestions: [
      'Họ đang kiệt sức/lo cơm áo (Tầng 1-2) hay đang cảm thấy làm nhiều mà không ai ghi nhận (Tầng 4)?',
      'Với nhân sự kỳ cựu, mình đã trao cho họ bài toán mới để phát triển bản thân (Tầng 5) chưa?',
    ],
    targetTab: 'people' as AxisTabId,
  },
  {
    code: 'FFC',
    name: 'Nghệ thuật Khen ngợi FFC',
    essence: 'Feeling (Cảm xúc thật của CEO) + Fact (Hành vi/số liệu cụ thể vừa làm tốt) + Compare (Sự tiến bộ hoặc giá trị lan tỏa).',
    whenToUse: 'Ngay trong ngày/tuần khi phát hiện một hành vi đẹp, tinh thần trách nhiệm hoặc sáng kiến nhỏ.',
    goldenQuestions: [
      'Lời khen đã chỉ đích danh hành động cụ thể chưa hay chỉ nói "Làm tốt lắm" chung chung?',
      'Mình đã khen kịp thời ngay khi sự việc còn nóng hổi chưa?',
    ],
    targetTab: 'people' as AxisTabId,
  },
];

export const MeetingsPlaybookTab: React.FC<MeetingsPlaybookTabProps> = ({
  currentUser,
  meetings,
  prepDocs,
  staffDirectory,
  onNavigate,
}) => {
  const [subTab, setSubTab] = useState<'MEETINGS' | 'PREP' | 'PLAYBOOK'>('MEETINGS');

  // 1. LIVE MEETING & ORGANIZER STATE
  const todayStr = new Date().toISOString().slice(0, 10);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetType, setMeetType] = useState<AxisMeeting['meetingType']>('MEETING_369');
  const [meetDate, setMeetDate] = useState(todayStr);
  const [meetTime, setMeetTime] = useState('08:30');
  const [meetDuration, setMeetDuration] = useState(30);
  const [meetParticipants, setMeetParticipants] = useState('');
  const [meetAgenda, setMeetAgenda] = useState('');

  // Active meeting timer & action items
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [timerRunning, setTimerRunning] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('');
  const [newActionDue, setNewActionDue] = useState(todayStr);

  useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;
    const parts = meetParticipants
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    const m: AxisMeeting = {
      id: `meet-${Date.now()}`,
      title: meetTitle.trim(),
      meetingType: meetType,
      date: meetDate,
      time: meetTime,
      durationMinutes: meetDuration,
      participants: parts,
      agenda:
        meetAgenda.trim() ||
        '1. Báo cáo kết quả ngắn gọn theo khung PREP\n2. Tháo gỡ điểm nghẽn trọng tâm\n3. Chốt đầu việc SMART & người chịu trách nhiệm',
      notes: '',
      actionItems: [],
      status: 'UPCOMING',
      createdAt: new Date().toISOString(),
    };

    await axisDbService.saveAxisItem('axis_meetings', m);
    dialogService.toast('Đã lên lịch cuộc họp điều hành!');
    setMeetTitle('');
    setMeetParticipants('');
    setMeetAgenda('');
  };

  const notifyMeetingToErp = async (m: AxisMeeting) => {
    const ok = await dialogService.confirm(
      `Gửi thông báo triệu tập cuộc họp "${m.title}" (${m.time} ngày ${m.date}) sang hệ thống ProTrack ERP?`,
      'Triệu tập họp sang ERP'
    );
    if (!ok) return;
    await axisDbService.publishAnnouncementToErp({
      title: `📅 Lịch họp điều hành: ${m.title}`,
      content: `Thời gian: ${m.time} ngày ${m.date} (${m.durationMinutes} phút)\nThành phần: ${
        m.participants.join(', ') || 'Các bộ phận liên quan'
      }\n\nNội dung chuẩn bị (Đề nghị chuẩn bị ý kiến theo cấu trúc PREP):\n${m.agenda}`,
      category: 'ANNOUNCEMENT',
      targetType: 'ALL',
      targetValue: 'Toàn công ty',
      requireAck: true,
      ceoUser: currentUser,
    });
    await axisDbService.saveAxisItem('axis_meetings', { ...m, notifiedErp: true });
    dialogService.toast('Đã phát thông báo triệu tập họp sang ProTrack ERP!');
  };

  const addActionItemToMeeting = async (m: AxisMeeting) => {
    if (!newActionTitle.trim()) return;
    const item = {
      id: `act-${Date.now()}`,
      taskTitle: newActionTitle.trim(),
      assigneeName: newActionOwner.trim() || 'Phụ trách bộ phận',
      dueDate: newActionDue,
      convertedToSmart: false,
    };
    await axisDbService.saveAxisItem('axis_meetings', {
      ...m,
      actionItems: [...m.actionItems, item],
    });
    setNewActionTitle('');
  };

  const convertMeetingActionToSmart = async (m: AxisMeeting, actionId: string) => {
    const act = m.actionItems.find((a) => a.id === actionId);
    if (!act) return;
    const smart: AxisSmartTask = {
      id: `smart-from-meet-${Date.now()}`,
      title: act.taskTitle,
      assigneeName: act.assigneeName,
      startDate: todayStr,
      dueDate: act.dueDate,
      status: 'IN_PROGRESS',
      specific: `[Kết luận từ cuộc họp ${m.title}] ${act.taskTitle}`,
      measurable: 'Hoàn thành đúng kết luận biên bản họp và báo cáo nghiệm thu.',
      achievable: 'Đã thống nhất trực tiếp tại cuộc họp điều hành.',
      relevant: 'Thực thi quyết định cuộc họp đúng tiến độ.',
      timeBound: `Hoàn tất trước ${act.dueDate} qua 3 mốc giám sát tiến độ.`,
      checkins: buildCheckin369(todayStr, act.dueDate),
      createdAt: new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_tasks', smart);
    await axisDbService.saveAxisItem('axis_meetings', {
      ...m,
      actionItems: m.actionItems.map((a) =>
        a.id === actionId ? { ...a, convertedToSmart: true } : a
      ),
    });
    dialogService.toast('Đã chuyển Kết luận họp thành Việc SMART + Lịch giám sát tiến độ!');
  };

  // 2. PREP STUDIO STATE
  const [rawPrepNotes, setRawPrepNotes] = useState('');
  const [prepContext, setPrepContext] = useState<AxisPrepDoc['contextType']>('DIRECTIVE');
  const [prepTitle, setPrepTitle] = useState('');
  const [pointStart, setPointStart] = useState('');
  const [reason, setReason] = useState('');
  const [example, setExample] = useState('');
  const [pointEnd, setPointEnd] = useState('');
  const [targetType, setTargetType] = useState<'ALL' | 'DEPARTMENTS' | 'INDIVIDUAL'>('ALL');
  const [targetValue, setTargetValue] = useState('Toàn công ty');
  const [requireAck, setRequireAck] = useState(true);
  const [composingPrep, setComposingPrep] = useState(false);

  const handleAiPolishPrep = async () => {
    if (!rawPrepNotes.trim()) {
      dialogService.toast('Hãy gõ vài ý nháp rời rạc để AI cấu trúc thành PREP.', 'warning');
      return;
    }
    setComposingPrep(true);
    try {
      const res = await axisAiService.composePrepMessage(rawPrepNotes, prepContext);
      setPrepTitle(res.title || '');
      setPointStart(res.pointStart || '');
      setReason(res.reason || '');
      setExample(res.example || '');
      setPointEnd(res.pointEnd || '');
      dialogService.toast('Đã biên tập sắc gọn theo 4 bước P-R-E-P!');
    } finally {
      setComposingPrep(false);
    }
  };

  const fullPrepText = [pointStart, reason, example, pointEnd].filter(Boolean).join('\n\n');

  const handleSavePrep = async (publishErp: boolean) => {
    if (!fullPrepText.trim()) {
      dialogService.toast('Nội dung PREP đang trống.', 'warning');
      return;
    }

    if (publishErp) {
      const ok = await dialogService.confirm(
        `Phát hành thông điệp chỉ đạo "${prepTitle || 'Thông điệp từ CEO'}" trực tiếp sang Bảng tin Thông báo của ProTrack ERP?`,
        'Phát hành Chỉ đạo PREP sang ERP'
      );
      if (!ok) return;

      await axisDbService.publishAnnouncementToErp({
        title: prepTitle.trim() || 'Chỉ đạo điều hành từ Ban Giám Đốc',
        content: fullPrepText,
        category: prepContext === 'DIRECTIVE' ? 'DIRECTIVE' : 'ANNOUNCEMENT',
        targetType,
        targetValue: targetType === 'ALL' ? 'Toàn công ty' : targetValue,
        requireAck,
        ceoUser: currentUser,
      });
    }

    const docItem: AxisPrepDoc = {
      id: `prep-${Date.now()}`,
      title: prepTitle.trim() || 'Thông điệp điều hành PREP',
      contextType: prepContext,
      pointStart,
      reason,
      example,
      pointEnd,
      polishedText: fullPrepText,
      publishedToErp: publishErp,
      createdAt: new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_prep_docs', docItem);
    dialogService.toast(
      publishErp
        ? 'Đã phát hành thông điệp PREP sang ProTrack ERP!'
        : 'Đã lưu vào kho bản thảo PREP.'
    );
  };

  const activeMeeting = meetings.find((m) => m.id === activeMeetingId) || meetings[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[25px] font-extrabold text-[#0C1B2E] tracking-tight">
            Tổ Chức Họp, Diễn Đạt PREP & 8 Hệ Quy Chiếu
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Họp đúng giờ có đầu việc đầu ra, truyền đạt sắc bén bằng{' '}
            <span className="font-semibold text-slate-700">PREP</span> và tra cứu nhanh 8 nguyên tắc lãnh đạo.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 self-start flex-wrap">
          <button
            onClick={() => setSubTab('MEETINGS')}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${
              subTab === 'MEETINGS' ? 'bg-white text-[#0C1B2E] shadow-sm' : 'text-slate-600'
            }`}
          >
            <Users size={14} className="text-[#C69C47]" />
            <span>Điều phối Họp</span>
          </button>
          <button
            onClick={() => setSubTab('PREP')}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${
              subTab === 'PREP' ? 'bg-white text-[#0C1B2E] shadow-sm' : 'text-slate-600'
            }`}
          >
            <MessageSquareQuote size={14} className="text-[#C69C47]" />
            <span>Diễn đạt PREP</span>
          </button>
          <button
            onClick={() => setSubTab('PLAYBOOK')}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${
              subTab === 'PLAYBOOK' ? 'bg-white text-[#0C1B2E] shadow-sm' : 'text-slate-600'
            }`}
          >
            <BookOpen size={14} className="text-[#C69C47]" />
            <span>Sổ tay 8 Nguyên tắc</span>
          </button>
        </div>
      </div>

      {/* 1. MEETINGS ORGANIZER & LIVE TIMER */}
      {subTab === 'MEETINGS' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[14.5px] font-bold text-[#0C1B2E]">
                  Điều Phối Cuộc Họp Theo Kỷ Luật 3-6-9
                </div>
                <div className="text-[12px] text-slate-500">
                  Chuẩn hóa toàn diện: 3 Công thức cốt lõi • 6 Bước tổ chức • 9 Nguyên tắc bắt buộc.
                </div>
              </div>
              <button
                onClick={() => theoryService.open('3-6-9')}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                title="Xem cẩm nang lý thuyết kỷ luật họp 3-6-9"
              >
                <BookOpen size={15} className="text-[#C69C47]" />
                <span>Xem Lý thuyết Họp 3-6-9</span>
              </button>
            </div>

            {/* 3 Core Formulas Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11.5px] text-slate-700">
                <span className="font-bold text-[#0C1B2E]">⚡ Công thức 1:</span> Họp mà không thực hiện thì không đạt hiệu quả.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11.5px] text-slate-700">
                <span className="font-bold text-[#0C1B2E]">⚡ Công thức 2:</span> Phân công nhưng không giám sát thì cũng không đạt hiệu quả.
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11.5px] text-amber-900 font-medium">
                <span className="font-bold text-[#9D772B]">🎯 Công thức 3:</span> Theo sát tiến độ + Đôn đốc trách nhiệm = Đúng kế hoạch.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 axis-card p-5 space-y-4">
            <h3 className="text-[15.5px] font-bold text-[#0C1B2E]">
              Lên Lịch Cuộc Họp Tinh Gọn
            </h3>
            <form onSubmit={handleCreateMeeting} className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Chủ đề cuộc họp *
                </label>
                <input
                  type="text"
                  required
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                  placeholder="VD: Họp rà soát tiến độ 3-6-9 các đơn gấp..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                    Ngày họp
                  </label>
                  <input
                    type="date"
                    value={meetDate}
                    onChange={(e) => setMeetDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={meetTime}
                    onChange={(e) => setMeetTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    value={meetDuration}
                    onChange={(e) => setMeetDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Thành phần tham dự (cách nhau dấu phẩy)
                </label>
                <input
                  type="text"
                  value={meetParticipants}
                  onChange={(e) => setMeetParticipants(e.target.value)}
                  placeholder="VD: Quản lý sản xuất, Tổ trưởng In, Kho NVL..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                  Khung chương trình họp (Agenda chống lan man)
                </label>
                <textarea
                  rows={3}
                  value={meetAgenda}
                  onChange={(e) => setMeetAgenda(e.target.value)}
                  placeholder="Mặc định yêu cầu thành viên báo cáo ngắn theo chuẩn PREP..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-[12.5px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} className="text-[#E5C472]" />
                <span>Tạo lịch họp mới</span>
              </button>
            </form>

            {/* Meeting List */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11.5px] font-bold uppercase text-slate-400">
                Danh sách cuộc họp ({meetings.length})
              </div>
              {meetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setActiveMeetingId(m.id);
                    setSecondsLeft((m.durationMinutes || 30) * 60);
                    setTimerRunning(false);
                  }}
                  className={`group p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    activeMeeting?.id === m.id
                      ? 'bg-[#0C1B2E]/5 border-[#0C1B2E]'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0C1B2E] truncate">{m.title}</div>
                    <div className="text-[11.5px] text-slate-500 tabular-nums">
                      {m.time} • {m.date} ({m.durationMinutes}p)
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      axisDbService.deleteAxisItem('axis_meetings', m.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right 7 cols: Active Meeting Command Room */}
          <div className="lg:col-span-7 axis-card p-5 sm:p-6 space-y-5">
            {activeMeeting ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9D772B]">
                      Bàn Điều Hành Phòng Họp • {activeMeeting.date} lúc {activeMeeting.time}
                    </span>
                    <h3 className="text-[18px] font-extrabold text-[#0C1B2E] mt-0.5">
                      {activeMeeting.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => notifyMeetingToErp(activeMeeting)}
                    className="px-3.5 py-2 rounded-xl bg-[#0C1B2E] text-[#F3DA99] text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start"
                  >
                    <Bell size={13} />
                    <span>
                      {activeMeeting.notifiedErp
                        ? 'Gửi nhắc lại sang ERP'
                        : 'Triệu tập họp sang ProTrack'}
                    </span>
                  </button>
                </div>

                {/* Timekeeper Countdown */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase text-slate-400">
                      Đồng hồ kỷ luật phòng họp ({activeMeeting.durationMinutes} phút)
                    </div>
                    <div
                      className={`text-[28px] font-extrabold tabular-nums ${
                        secondsLeft < 180 ? 'text-rose-600' : 'text-[#0C1B2E]'
                      }`}
                    >
                      {formatTimer(secondsLeft)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="px-4 py-2 rounded-xl bg-[#0C1B2E] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                      <span>{timerRunning ? 'Tạm dừng' : 'Bắt đầu bấm giờ'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setTimerRunning(false);
                        setSecondsLeft((activeMeeting.durationMinutes || 30) * 60);
                      }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-white cursor-pointer"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/60 text-[12.5px] text-slate-700 whitespace-pre-line">
                  <strong className="text-[#0C1B2E]">Chương trình họp (Agenda):</strong>
                  {'\n'}
                  {activeMeeting.agenda}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#0C1B2E] mb-1">
                    Biên bản ghi nhanh của CEO
                  </label>
                  <textarea
                    rows={3}
                    value={activeMeeting.notes}
                    onChange={(e) =>
                      axisDbService.saveAxisItem('axis_meetings', {
                        ...activeMeeting,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Ghi nhanh các quyết định quan trọng trong lúc họp..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>

                {/* Action Items -> Convert to SMART */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="text-[12.5px] font-bold text-[#0C1B2E]">
                    Chốt Đầu Việc Sau Họp (Chuyển 1 chạm thành Giao việc chuẩn SMART)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={newActionTitle}
                      onChange={(e) => setNewActionTitle(e.target.value)}
                      placeholder="Đầu việc kết luận..."
                      className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                    />
                    <input
                      list="meet-staff"
                      value={newActionOwner}
                      onChange={(e) => setNewActionOwner(e.target.value)}
                      placeholder="Người làm..."
                      className="sm:col-span-3 px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                    />
                    <datalist id="meet-staff">
                      {staffDirectory.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>
                    <input
                      type="date"
                      value={newActionDue}
                      onChange={(e) => setNewActionDue(e.target.value)}
                      className="sm:col-span-2 px-2 py-2 rounded-xl border border-slate-200 text-[12px]"
                    />
                    <button
                      type="button"
                      onClick={() => addActionItemToMeeting(activeMeeting)}
                      className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-semibold cursor-pointer"
                    >
                      + Chốt việc
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {activeMeeting.actionItems.map((act) => (
                      <div
                        key={act.id}
                        className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px]"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{act.taskTitle}</span>{' '}
                          <span className="text-slate-500 text-[12px]">
                            • {act.assigneeName} (Hạn: {act.dueDate})
                          </span>
                        </div>
                        {act.convertedToSmart ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                            Đã đưa vào Trục SMART
                          </span>
                        ) : (
                          <button
                            onClick={() => convertMeetingActionToSmart(activeMeeting, act.id)}
                            className="text-[12px] font-bold text-[#9D772B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowRightCircle size={13} />
                            <span>Đẩy sang Việc SMART</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 text-[13.5px]">
                Hãy tạo hoặc chọn một cuộc họp ở cột bên trái để bắt đầu điều phối.
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* 2. PREP COMMUNICATION STUDIO */}
      {subTab === 'PREP' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <div className="text-[14px] font-bold text-[#0C1B2E]">
                Nghệ Thuật Diễn Đạt Quyền Lực & Sắc Bén PREP (Point • Reason • Example • Point)
              </div>
              <div className="text-[12px] text-slate-500">
                Truyền đạt thẳng vào trọng tâm, thuyết phục bằng số liệu thực tế và dứt điểm bằng lệnh hành động cụ thể.
              </div>
            </div>
            <button
              onClick={() => theoryService.open('PREP')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              title="Xem cẩm nang lý thuyết mô hình diễn đạt PREP"
            >
              <BookOpen size={15} className="text-[#C69C47]" />
              <span>Lý thuyết Diễn đạt PREP</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 axis-card p-5 sm:p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#0C1B2E]">
              Studio Diễn Đạt PREP (Point • Reason • Example • Point)
            </h3>

            <div className="p-3.5 rounded-xl bg-[#0C1B2E]/4 border border-[#0C1B2E]/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11.5px] font-bold text-[#0C1B2E] uppercase">
                  ✨ Gõ nhanh ý thô của CEO → AI biên tập mạch lạc chuẩn PREP
                </label>
                <select
                  value={prepContext}
                  onChange={(e) => setPrepContext(e.target.value as AxisPrepDoc['contextType'])}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11.5px] font-semibold"
                >
                  <option value="DIRECTIVE">Chỉ đạo điều hành</option>
                  <option value="SPEECH">Phát biểu đầu buổi họp</option>
                  <option value="FEEDBACK">Góp ý nhân sự</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={rawPrepNotes}
                onChange={(e) => setRawPrepNotes(e.target.value)}
                placeholder="VD: Nhắc anh em xưởng và sales trước khi chốt đơn gấp phải kiểm tra tồn giấy thật trên kho, tuần rồi có đơn nhận xong thiếu giấy làm trễ khách..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-[13px]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={composingPrep}
                  onClick={handleAiPolishPrep}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0C1B2E] text-[#F3DA99] text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>{composingPrep ? 'Đang biên tập...' : 'AI Chuẩn hóa PREP'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                Tiêu đề thông điệp / chỉ đạo
              </label>
              <input
                type="text"
                value={prepTitle}
                onChange={(e) => setPrepTitle(e.target.value)}
                placeholder="Tiêu đề ngắn gọn..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[13.5px] font-semibold"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-bold text-[#0C1B2E] mb-1">
                  1. [P] Point — Đi thẳng vào Kết luận / Quyết định chính ngay câu đầu
                </label>
                <textarea
                  rows={2}
                  value={pointStart}
                  onChange={(e) => setPointStart(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-bold text-[#0C1B2E] mb-1">
                  2. [R] Reason — Lý do cốt lõi vì sao phải làm điều này
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-bold text-[#0C1B2E] mb-1">
                  3. [E] Example — Dẫn chứng / Số liệu / Ví dụ thực tế minh họa
                </label>
                <textarea
                  rows={2}
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-bold text-[#0C1B2E] mb-1">
                  4. [P] Point — Khẳng định lại kết luận & Hành động cần thực thi ngay
                </label>
                <textarea
                  rows={2}
                  value={pointEnd}
                  onChange={(e) => setPointEnd(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px]"
                />
              </div>
            </div>

            {/* Publish Target to ProTrack */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                >
                  <option value="ALL">Gửi: Toàn công ty</option>
                  <option value="DEPARTMENTS">Gửi: Theo bộ phận</option>
                  <option value="INDIVIDUAL">Gửi: Cá nhân</option>
                </select>
                {targetType !== 'ALL' && (
                  <input
                    type="text"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder={targetType === 'DEPARTMENTS' ? 'VD: Xưởng In' : 'Tên nhân viên...'}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 w-36"
                  />
                )}
                <label className="inline-flex items-center gap-1.5 text-slate-600 cursor-pointer ml-1">
                  <input
                    type="checkbox"
                    checked={requireAck}
                    onChange={(e) => setRequireAck(e.target.checked)}
                  />
                  <span>Yêu cầu bấm xác nhận đã đọc</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(fullPrepText);
                    dialogService.toast('Đã copy bài diễn đạt PREP!');
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePrep(true)}
                  className="px-4 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} className="text-[#E5C472]" />
                  <span>Phát Chỉ Đạo sang ProTrack ERP</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 axis-card p-5 space-y-3">
            <h3 className="text-[15px] font-bold text-[#0C1B2E]">
              Lưu Trữ Thông Điệp PREP Của CEO ({prepDocs.length})
            </h3>
            {prepDocs.length === 0 ? (
              <p className="text-[12.5px] text-slate-400 py-8 text-center">
                Các bài phát biểu & thông điệp chuẩn PREP của bạn sẽ lưu tại đây.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                {prepDocs.map((d) => (
                  <div key={d.id} className="group py-3 flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-[13.5px] font-bold text-[#0C1B2E]">{d.title}</div>
                      <p className="text-[12px] text-slate-600 whitespace-pre-line line-clamp-4">
                        {d.polishedText}
                      </p>
                    </div>
                    <button
                      onClick={() => axisDbService.deleteAxisItem('axis_prep_docs', d.id)}
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

      {/* 3. THE 8 MANAGEMENT FRAMEWORKS PLAYBOOK */}
      {subTab === 'PLAYBOOK' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <div className="text-[14px] font-bold text-[#0C1B2E]">
                Cẩm Nang 8 Hệ Quy Chiếu Lãnh Đạo & Điều Hành Doanh Nghiệp
              </div>
              <div className="text-[12px] text-slate-500">
                Kho tài liệu lý thuyết, quy trình 4 bước, ví dụ thực tế và bộ câu hỏi chất vấn chuẩn CEO.
              </div>
            </div>
            <button
              onClick={() => theoryService.open('SMART')}
              className="px-4 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12.5px] font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all shrink-0"
              title="Mở toàn bộ thư viện lý thuyết 8 phương pháp"
            >
              <BookOpen size={15} className="text-[#E5C472]" />
              <span>Mở Thư Viện Lý Thuyết</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EIGHT_FRAMEWORKS_PLAYBOOK.map((fw) => (
              <div key={fw.code} className="axis-card p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-[#0C1B2E] text-[#F3DA99] text-[11px] font-extrabold tracking-wider">
                      {fw.code}
                    </span>
                    <button
                      onClick={() => theoryService.open(fw.code as FrameworkCode)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-[11.5px] font-bold text-[#9D772B] inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Xem tài liệu lý thuyết chi tiết về ${fw.code}`}
                    >
                      <BookOpen size={13} />
                      <span>Xem lý thuyết</span>
                    </button>
                  </div>
                  <h3 className="text-[16px] font-extrabold text-[#0C1B2E]">{fw.name}</h3>
                  <p className="text-[12.5px] text-slate-700 font-medium leading-relaxed">
                    {fw.essence}
                  </p>
                  <div className="text-[12px] text-slate-500">
                    <strong className="text-slate-700">Khi nào áp dụng:</strong> {fw.whenToUse}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="text-[10.5px] font-bold uppercase text-[#9D772B]">
                      Câu hỏi phản biện vàng cho CEO:
                    </div>
                    {fw.goldenQuestions.map((q, idx) => (
                      <div key={idx} className="text-[12px] text-slate-700">
                        • {q}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => theoryService.open(fw.code as FrameworkCode)}
                    className="text-[12px] font-bold text-slate-700 hover:text-[#0C1B2E] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen size={13} className="text-[#C69C47]" />
                    <span>Đọc tài liệu lý thuyết chi tiết</span>
                  </button>
                  <button
                    onClick={() => onNavigate(fw.targetTab)}
                    className="text-[12px] font-bold text-[#9D772B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Mở công cụ thực thi</span>
                    <ArrowRightCircle size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

