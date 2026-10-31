import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Edit3,
  ArrowRightCircle,
  Bell,
  CheckCircle2,
  Circle,
  Zap,
  FileText,
  RefreshCw,
} from 'lucide-react';
import {
  AxisMeeting,
  AxisMeetingActionItem,
  AxisNavigationIntent,
  AxisPrepDoc,
  AxisSmartTask,
  AxisTabId,
  ErpLsxOrder,
  ErpUser,
} from '../../types/axisTypes';
import { buildCheckin369 } from '../../services/seedData';
import { axisDbService } from '../../services/axisDbService';
import { axisAiService } from '../../services/axisAiService';
import { dialogService } from '../common/CustomDialog';
import { theoryService } from '../../services/theoryService';
import {
  addLocalDaysYmd,
  getLocalTodayYmd,
  MEETING_TYPE_LABELS,
} from '../../utils/dateUtils';

interface MeetingsPlaybookTabProps {
  currentUser: ErpUser;
  meetings: AxisMeeting[];
  prepDocs: AxisPrepDoc[];
  smartTasks: AxisSmartTask[];
  overdueLsx: ErpLsxOrder[];
  staffDirectory: Array<{ id: string; name: string; role: string; department: string }>;
  navIntent?: AxisNavigationIntent | null;
  onConsumeIntent?: () => void;
  onNavigate: (tab: AxisTabId, intent?: Omit<AxisNavigationIntent, 'tab' | 'ts'>) => void;
}

const PREP_CONTEXT_LABELS: Record<AxisPrepDoc['contextType'], string> = {
  DIRECTIVE: 'Chỉ đạo điều hành',
  SPEECH: 'Phát biểu đầu buổi họp',
  FEEDBACK: 'Góp ý & Huấn luyện nhân sự',
  PROPOSAL_REPLY: 'Phản hồi đề xuất / Tờ trình',
};

export const MeetingsPlaybookTab: React.FC<MeetingsPlaybookTabProps> = ({
  currentUser,
  meetings,
  prepDocs,
  smartTasks,
  overdueLsx,
  staffDirectory,
  navIntent,
  onConsumeIntent,
  onNavigate,
}) => {
  const [subTab, setSubTab] = useState<'MEETINGS' | 'PREP'>('MEETINGS');
  const todayStr = getLocalTodayYmd();

  // ─── 1. LIVE MEETING & ORGANIZER STATE ─────────────────────────────────────
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetType, setMeetType] = useState<AxisMeeting['meetingType']>('MEETING_369');
  const [meetDate, setMeetDate] = useState(todayStr);
  const [meetTime, setMeetTime] = useState('08:30');
  const [meetDuration, setMeetDuration] = useState(30);
  const [meetParticipants, setMeetParticipants] = useState('');
  const [meetAgenda, setMeetAgenda] = useState('');
  const meetTitleInputRef = useRef<HTMLInputElement | null>(null);

  // Active meeting room state
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [timerRunning, setTimerRunning] = useState(false);

  // Debounced meeting notes
  const [localNotes, setLocalNotes] = useState('');
  const [notesSavingState, setNotesSavingState] = useState<'IDLE' | 'TYPING' | 'SAVED'>('IDLE');
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNotesMeetingRef = useRef<{ meeting: AxisMeeting | null; notes: string; dirty: boolean }>({
    meeting: null,
    notes: '',
    dirty: false,
  });

  // Action items form
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('');
  const [newActionDue, setNewActionDue] = useState(() => addLocalDaysYmd(3, todayStr));
  const [autoCreateSmartTask, setAutoCreateSmartTask] = useState(true);

  // ─── 2. PREP STUDIO STATE ──────────────────────────────────────────────────
  const [editingPrepId, setEditingPrepId] = useState<string | null>(null);
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

  // Unique departments from staffDirectory for quick chips & PREP target
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    staffDirectory.forEach((s) => {
      if (s.department && s.department.trim()) set.add(s.department.trim());
    });
    return Array.from(set);
  }, [staffDirectory]);

  // Sorted meetings: UPCOMING first (chronological), then COMPLETED (reverse chronological)
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'UPCOMING' ? -1 : 1;
      const keyA = `${a.date}T${a.time || '00:00'}`;
      const keyB = `${b.date}T${b.time || '00:00'}`;
      return a.status === 'UPCOMING' ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
    });
  }, [meetings]);

  const activeMeeting = useMemo(() => {
    if (activeMeetingId) {
      const found = meetings.find((m) => m.id === activeMeetingId);
      if (found) return found;
    }
    return sortedMeetings[0] || null;
  }, [activeMeetingId, meetings, sortedMeetings]);

  // Unfinished action items from OTHER previous meetings (enforce Formula 1 & 2)
  const previousOpenActions = useMemo(() => {
    const list: Array<{ meeting: AxisMeeting; action: AxisMeetingActionItem }> = [];
    meetings.forEach((m) => {
      if (activeMeeting && m.id === activeMeeting.id) return;
      (m.actionItems || []).forEach((act) => {
        if (!act.completed) {
          list.push({ meeting: m, action: act });
        }
      });
    });
    return list.slice(0, 6);
  }, [meetings, activeMeeting]);

  // Flush pending debounced notes helper
  const flushPendingNotes = async () => {
    if (notesTimerRef.current) {
      clearTimeout(notesTimerRef.current);
      notesTimerRef.current = null;
    }
    const { meeting, notes, dirty } = latestNotesMeetingRef.current;
    if (dirty && meeting) {
      latestNotesMeetingRef.current.dirty = false;
      await axisDbService.saveAxisItem('axis_meetings', {
        ...meeting,
        notes,
      });
      setNotesSavingState('SAVED');
    }
  };

  // Sync localNotes when switching active meeting
  useEffect(() => {
    if (!activeMeeting) {
      setLocalNotes('');
      return;
    }
    // Only reset localNotes when activeMeeting.id changes or when not currently typing
    if (latestNotesMeetingRef.current.meeting?.id !== activeMeeting.id) {
      flushPendingNotes();
      setLocalNotes(activeMeeting.notes || '');
      setSecondsLeft((activeMeeting.durationMinutes || 30) * 60);
      setTimerRunning(false);
      setNotesSavingState('IDLE');
      latestNotesMeetingRef.current = {
        meeting: activeMeeting,
        notes: activeMeeting.notes || '',
        dirty: false,
      };
    } else if (!latestNotesMeetingRef.current.dirty && activeMeeting.notes !== localNotes) {
      setLocalNotes(activeMeeting.notes || '');
      latestNotesMeetingRef.current.meeting = activeMeeting;
    } else {
      latestNotesMeetingRef.current.meeting = activeMeeting;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMeeting?.id, activeMeeting?.notes]);

  useEffect(() => {
    return () => {
      flushPendingNotes();
    };
  }, []);

  // Consume deep-link navigation intent
  useEffect(() => {
    if (!navIntent || navIntent.tab !== 'meetings') return;

    if (navIntent.subTab === 'PREP' || navIntent.action === 'NEW_PREP') {
      setSubTab('PREP');
      if (navIntent.action === 'NEW_PREP') {
        resetPrepForm();
        if (navIntent.prefillTitle) setPrepTitle(navIntent.prefillTitle);
        if (navIntent.prefillNote) setRawPrepNotes(navIntent.prefillNote);
      }
    } else {
      setSubTab('MEETINGS');
      if (navIntent.action === 'OPEN_MEETING' && navIntent.meetingId) {
        setActiveMeetingId(navIntent.meetingId);
      } else if (navIntent.action === 'NEW_MEETING') {
        resetMeetingForm();
        if (navIntent.prefillTitle) setMeetTitle(navIntent.prefillTitle);
        if (navIntent.prefillNote) setMeetAgenda(navIntent.prefillNote);
        setTimeout(() => meetTitleInputRef.current?.focus(), 60);
      }
    }

    onConsumeIntent?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navIntent]);

  // Countdown timer
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

  // ─── MEETING HANDLERS ──────────────────────────────────────────────────────
  const resetMeetingForm = () => {
    setEditingMeetingId(null);
    setMeetTitle('');
    setMeetType('MEETING_369');
    setMeetDate(todayStr);
    setMeetTime('08:30');
    setMeetDuration(30);
    setMeetParticipants('');
    setMeetAgenda('');
  };

  const handleLoadMeetingToEdit = (m: AxisMeeting) => {
    setEditingMeetingId(m.id);
    setMeetTitle(m.title);
    setMeetType(m.meetingType || 'MEETING_369');
    setMeetDate(m.date);
    setMeetTime(m.time);
    setMeetDuration(m.durationMinutes || 30);
    setMeetParticipants((m.participants || []).join(', '));
    setMeetAgenda(m.agenda || '');
    meetTitleInputRef.current?.focus();
  };

  const toggleParticipantToken = (token: string) => {
    const current = meetParticipants
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (current.includes(token)) {
      setMeetParticipants(current.filter((x) => x !== token).join(', '));
    } else {
      setMeetParticipants([...current, token].join(', '));
    }
  };

  const handleAutoBuildAgendaFromWork = () => {
    const overdueTasks = smartTasks.filter(
      (t) => t.status !== 'COMPLETED' && (t.dueDate < todayStr || t.status === 'AT_RISK')
    );
    const dueMilestoneTasks = smartTasks.filter(
      (t) =>
        t.status !== 'COMPLETED' &&
        t.dueDate >= todayStr &&
        t.checkins.some((c) => !c.completed && c.dueDate <= todayStr)
    );

    const lines: string[] = [];
    lines.push('1. Báo cáo nhanh kết quả theo khung PREP (tối đa 2 phút/người, đi thẳng vào số liệu)');

    if (overdueLsx.length > 0) {
      const sampleLsx = overdueLsx
        .slice(0, 4)
        .map((o) => `${o.lsxCode || o.orderCode || o.id} (${o.customer || o.itemName || 'Đơn gấp'})`)
        .join('; ');
      lines.push(
        `2. Xử lý khẩn ${overdueLsx.length} Lệnh sản xuất trễ/sát hạn trên ERP: ${sampleLsx}`
      );
    }

    if (overdueTasks.length > 0 || dueMilestoneTasks.length > 0) {
      const taskSummary = [...overdueTasks, ...dueMilestoneTasks]
        .slice(0, 4)
        .map((t) => `${t.title} [${t.assigneeName}]`)
        .join('; ');
      lines.push(
        `${lines.length + 1}. Đôn đốc đầu việc quá hạn & mốc kiểm tra 3-6-9 đến hạn: ${taskSummary}`
      );
    }

    lines.push(
      `${lines.length + 1}. Thống nhất quyết định tại chỗ & chốt Đầu việc SMART (rõ người làm - rõ hạn chót)`
    );

    setMeetAgenda(lines.join('\n'));
    if (!meetTitle.trim()) {
      setMeetTitle(
        overdueLsx.length > 0 || overdueTasks.length > 0
          ? `Họp điều hành gỡ nghẽn tiến độ (${todayStr})`
          : `Giao ban điều hành 3-6-9 (${todayStr})`
      );
    }
    dialogService.toast('Đã nạp Agenda thực chiến từ dữ liệu việc đang chạy & LSX ERP!');
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;
    const parts = meetParticipants
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    const existing = editingMeetingId
      ? meetings.find((item) => item.id === editingMeetingId)
      : null;

    const m: AxisMeeting = {
      id: existing ? existing.id : `meet-${Date.now()}`,
      title: meetTitle.trim(),
      meetingType: meetType,
      date: meetDate,
      time: meetTime,
      durationMinutes: meetDuration || 30,
      participants: parts,
      agenda:
        meetAgenda.trim() ||
        '1. Báo cáo kết quả ngắn gọn theo khung PREP\n2. Tháo gỡ điểm nghẽn trọng tâm\n3. Chốt đầu việc SMART & người chịu trách nhiệm',
      notes: existing ? existing.notes : '',
      actionItems: existing ? existing.actionItems : [],
      status: existing ? existing.status : 'UPCOMING',
      notifiedErp: existing?.notifiedErp,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    await axisDbService.saveAxisItem('axis_meetings', m);
    setActiveMeetingId(m.id);
    dialogService.toast(
      existing ? 'Đã cập nhật thông tin cuộc họp!' : 'Đã tạo lịch cuộc họp điều hành!'
    );
    resetMeetingForm();
  };

  const handleDeleteMeeting = async (m: AxisMeeting) => {
    const ok = await dialogService.confirm(
      `Xóa cuộc họp "${m.title}" (${m.date} lúc ${m.time})? Biên bản ghi chú trong cuộc họp này sẽ bị xóa.`,
      'Xóa lịch họp',
      { danger: true }
    );
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_meetings', m.id);
    if (activeMeetingId === m.id) setActiveMeetingId(null);
    if (editingMeetingId === m.id) resetMeetingForm();
    dialogService.toast('Đã xóa cuộc họp.', 'info');
  };

  const handleNotesChange = (val: string) => {
    if (!activeMeeting) return;
    setLocalNotes(val);
    setNotesSavingState('TYPING');
    latestNotesMeetingRef.current = {
      meeting: activeMeeting,
      notes: val,
      dirty: true,
    };
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      flushPendingNotes();
    }, 450);
  };

  const toggleMeetingStatus = async (m: AxisMeeting) => {
    await flushPendingNotes();
    const nextStatus: AxisMeeting['status'] = m.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED';
    await axisDbService.saveAxisItem('axis_meetings', {
      ...m,
      notes: m.id === activeMeeting?.id ? localNotes : m.notes,
      status: nextStatus,
    });
    if (nextStatus === 'COMPLETED') {
      setTimerRunning(false);
      dialogService.toast('Đã chốt biên bản & hoàn tất cuộc họp!');
    } else {
      dialogService.toast('Đã mở lại phòng họp.', 'info');
    }
  };

  const copyMeetingMinutes = (m: AxisMeeting) => {
    const notesText = m.id === activeMeeting?.id ? localNotes : m.notes;
    const actionsText =
      m.actionItems.length > 0
        ? m.actionItems
            .map(
              (a, i) =>
                `  ${i + 1}. [${a.completed ? 'Đã xong' : 'Đang thực hiện'}] ${a.taskTitle} — Phụ trách: ${a.assigneeName} (Hạn: ${a.dueDate})`
            )
            .join('\n')
        : '  (Chưa có đầu việc chốt sau họp)';

    const summary =
      `📋 BIÊN BẢN HỌP ĐIỀU HÀNH: ${m.title.toUpperCase()}\n` +
      `• Loại cuộc họp: ${MEETING_TYPE_LABELS[m.meetingType] || 'Họp điều hành'}\n` +
      `• Thời gian: ${m.time} ngày ${m.date} (${m.durationMinutes} phút)\n` +
      `• Thành phần: ${m.participants.join(', ') || 'Các bộ phận liên quan'}\n\n` +
      `🎯 CHƯƠNG TRÌNH HỌP:\n${m.agenda}\n\n` +
      `📝 GHI CHÚ & QUYẾT ĐỊNH CỦA CEO:\n${notesText || '(Trống)'}\n\n` +
      `⚡ ĐẦU VIỆC THỰC THI SAU HỌP:\n${actionsText}`;

    navigator.clipboard.writeText(summary);
    dialogService.toast('Đã sao chép toàn bộ Biên bản họp vào Clipboard!');
  };

  const notifyMeetingToErp = async (m: AxisMeeting) => {
    const ok = await dialogService.confirm(
      `Gửi thông báo triệu tập cuộc họp "${m.title}" (${m.time} ngày ${m.date}) sang hệ thống ProTrack ERP?`,
      'Triệu tập họp sang ERP'
    );
    if (!ok) return;
    await axisDbService.publishAnnouncementToErp({
      title: `📅 Triệu tập ${MEETING_TYPE_LABELS[m.meetingType] || 'họp điều hành'}: ${m.title}`,
      content: `Thời gian: ${m.time} ngày ${m.date} (Thời lượng kỷ luật: ${m.durationMinutes} phút)\nThành phần tham dự: ${
        m.participants.join(', ') || 'Các bộ phận liên quan'
      }\n\nNội dung chuẩn bị trước giờ họp (Báo cáo ngắn gọn theo chuẩn PREP):\n${m.agenda}`,
      category: 'ANNOUNCEMENT',
      targetType: 'ALL',
      targetValue: 'Toàn công ty',
      requireAck: true,
      ceoUser: currentUser,
    });
    await axisDbService.saveAxisItem('axis_meetings', {
      ...m,
      notes: m.id === activeMeeting?.id ? localNotes : m.notes,
      notifiedErp: true,
    });
    dialogService.toast('Đã phát lệnh triệu tập họp sang ProTrack ERP!');
  };

  const createLinkedSmartTaskFromAction = async (
    m: AxisMeeting,
    act: AxisMeetingActionItem
  ): Promise<string> => {
    const matchedStaff = staffDirectory.find(
      (s) => s.name.toLowerCase() === act.assigneeName.trim().toLowerCase()
    );
    const smartId = `smart-from-meet-${Date.now()}`;
    const due = act.dueDate >= todayStr ? act.dueDate : todayStr;
    const smart: AxisSmartTask = {
      id: smartId,
      title: act.taskTitle,
      assigneeName: act.assigneeName,
      assigneeId: matchedStaff?.id,
      department: matchedStaff?.department,
      sourceMeetingId: m.id,
      sourceMeetingTitle: m.title,
      startDate: todayStr,
      dueDate: due,
      status: 'IN_PROGRESS',
      specific: `[Kết luận cuộc họp "${m.title}" ngày ${m.date}] ${act.taskTitle}`,
      measurable: 'Hoàn thành đúng kết luận biên bản họp và báo cáo kết quả nghiệm thu.',
      achievable: 'Đã thống nhất trực tiếp phương án & nguồn lực tại phòng họp điều hành.',
      relevant: 'Thực thi quyết định cuộc họp đúng hạn (Công thức 1 & 3 của Kỷ luật 3-6-9).',
      timeBound: `Hoàn tất trước ${due} kèm 3 mốc kiểm tra tiến độ 30% - 60% - 90%.`,
      checkins: buildCheckin369(todayStr, due),
      createdAt: new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_tasks', smart);
    return smartId;
  };

  const addActionItemToMeeting = async (m: AxisMeeting) => {
    if (!newActionTitle.trim()) {
      dialogService.toast('Vui lòng nhập nội dung đầu việc kết luận.', 'warning');
      return;
    }
    await flushPendingNotes();

    const baseItem: AxisMeetingActionItem = {
      id: `act-${Date.now()}`,
      taskTitle: newActionTitle.trim(),
      assigneeName: newActionOwner.trim() || 'Phụ trách bộ phận',
      dueDate: newActionDue || todayStr,
      completed: false,
      convertedToSmart: false,
    };

    if (autoCreateSmartTask) {
      const smartId = await createLinkedSmartTaskFromAction(m, baseItem);
      baseItem.convertedToSmart = true;
      baseItem.linkedTaskId = smartId;
    }

    await axisDbService.saveAxisItem('axis_meetings', {
      ...m,
      notes: m.id === activeMeeting?.id ? localNotes : m.notes,
      actionItems: [...(m.actionItems || []), baseItem],
    });

    setNewActionTitle('');
    dialogService.toast(
      autoCreateSmartTask
        ? 'Đã chốt kết luận họp & tự động tạo Việc Giao SMART kèm 3 mốc đôn đốc!'
        : 'Đã thêm đầu việc vào biên bản họp.'
    );
  };

  const convertMeetingActionToSmart = async (m: AxisMeeting, actionId: string) => {
    const act = m.actionItems.find((a) => a.id === actionId);
    if (!act) return;
    await flushPendingNotes();
    const smartId = await createLinkedSmartTaskFromAction(m, act);
    await axisDbService.saveAxisItem('axis_meetings', {
      ...m,
      notes: m.id === activeMeeting?.id ? localNotes : m.notes,
      actionItems: m.actionItems.map((a) =>
        a.id === actionId ? { ...a, convertedToSmart: true, linkedTaskId: smartId } : a
      ),
    });
    dialogService.toast('Đã chuyển Kết luận họp thành Việc Giao SMART!');
  };

  const toggleMeetingActionCompleted = async (m: AxisMeeting, actionId: string) => {
    const target = m.actionItems.find((a) => a.id === actionId);
    if (!target) return;
    const nextCompleted = !target.completed;
    await axisDbService.saveAxisItem('axis_meetings', {
      ...m,
      notes: m.id === activeMeeting?.id ? localNotes : m.notes,
      actionItems: m.actionItems.map((a) =>
        a.id === actionId ? { ...a, completed: nextCompleted } : a
      ),
    });
    // Sync linked SMART task status if linked
    if (target.linkedTaskId) {
      const linked = smartTasks.find((t) => t.id === target.linkedTaskId);
      if (linked) {
        await axisDbService.saveAxisItem('axis_tasks', {
          ...linked,
          status: nextCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        });
      }
    }
  };

  const deleteMeetingAction = async (m: AxisMeeting, actionId: string) => {
    const ok = await dialogService.confirm('Xóa đầu việc này khỏi biên bản cuộc họp?', 'Xóa đầu việc', {
      danger: true,
    });
    if (!ok) return;
    await axisDbService.saveAxisItem('axis_meetings', {
      ...m,
      notes: m.id === activeMeeting?.id ? localNotes : m.notes,
      actionItems: m.actionItems.filter((a) => a.id !== actionId),
    });
  };

  // ─── PREP HANDLERS ─────────────────────────────────────────────────────────
  const resetPrepForm = () => {
    setEditingPrepId(null);
    setRawPrepNotes('');
    setPrepContext('DIRECTIVE');
    setPrepTitle('');
    setPointStart('');
    setReason('');
    setExample('');
    setPointEnd('');
    setTargetType('ALL');
    setTargetValue('Toàn công ty');
    setRequireAck(true);
  };

  const loadPrepDocToEditor = (doc: AxisPrepDoc) => {
    setEditingPrepId(doc.id);
    setPrepTitle(doc.title);
    setPrepContext(doc.contextType || 'DIRECTIVE');
    setPointStart(doc.pointStart || '');
    setReason(doc.reason || '');
    setExample(doc.example || '');
    setPointEnd(doc.pointEnd || '');
  };

  const handleAiPolishPrep = async () => {
    if (!rawPrepNotes.trim()) {
      dialogService.toast('Hãy gõ vài ý nháp rời rạc để AI cấu trúc thành 4 bước PREP.', 'warning');
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
      dialogService.toast('Nội dung thông điệp PREP đang trống.', 'warning');
      return;
    }

    if (publishErp) {
      const targetDesc =
        targetType === 'ALL'
          ? 'Toàn công ty'
          : `${targetType === 'DEPARTMENTS' ? 'Bộ phận' : 'Nhân sự'}: ${targetValue || 'Chưa chọn'}`;
      const ok = await dialogService.confirm(
        `Phát hành thông điệp "${prepTitle || 'Chỉ đạo từ CEO'}" tới [${targetDesc}] trên Bảng tin Thông báo ProTrack ERP?`,
        'Phát hành Chỉ đạo PREP sang ERP'
      );
      if (!ok) return;

      await axisDbService.publishAnnouncementToErp({
        title: prepTitle.trim() || 'Chỉ đạo điều hành từ Ban Giám Đốc',
        content: fullPrepText,
        category: prepContext === 'DIRECTIVE' ? 'DIRECTIVE' : 'ANNOUNCEMENT',
        targetType,
        targetValue: targetType === 'ALL' ? 'Toàn công ty' : targetValue.trim() || 'Toàn công ty',
        requireAck,
        ceoUser: currentUser,
      });
    }

    const existing = editingPrepId ? prepDocs.find((d) => d.id === editingPrepId) : null;
    const docItem: AxisPrepDoc = {
      id: existing ? existing.id : `prep-${Date.now()}`,
      title: prepTitle.trim() || 'Thông điệp điều hành PREP',
      contextType: prepContext,
      pointStart,
      reason,
      example,
      pointEnd,
      polishedText: fullPrepText,
      publishedToErp: publishErp || existing?.publishedToErp,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };
    await axisDbService.saveAxisItem('axis_prep_docs', docItem);
    dialogService.toast(
      publishErp
        ? 'Đã phát hành thông điệp PREP sang ProTrack ERP!'
        : 'Đã lưu bản nháp thông điệp PREP.'
    );
    if (publishErp) {
      resetPrepForm();
    } else {
      setEditingPrepId(docItem.id);
    }
  };

  const handleDeletePrepDoc = async (doc: AxisPrepDoc) => {
    const ok = await dialogService.confirm(
      `Xóa thông điệp PREP "${doc.title}" khỏi kho lưu trữ?`,
      'Xóa bản thảo PREP',
      { danger: true }
    );
    if (!ok) return;
    await axisDbService.deleteAxisItem('axis_prep_docs', doc.id);
    if (editingPrepId === doc.id) resetPrepForm();
    dialogService.toast('Đã xóa thông điệp PREP.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[25px] font-extrabold text-[#0C1B2E] tracking-tight">
            Họp Điều Hành & Phát Chỉ Đạo (PREP)
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Họp đúng trọng tâm theo kỷ luật <span className="font-semibold text-slate-700">3-6-9</span>, chốt việc thẳng sang trục giám sát và truyền đạt chỉ đạo sắc gọn bằng{' '}
            <span className="font-semibold text-slate-700">PREP</span>.
          </p>
        </div>

        <div className="macos-segmented self-start flex-wrap">
          <button
            onClick={() => setSubTab('MEETINGS')}
            className={`px-4 py-1.5 rounded-[10px] text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'MEETINGS'
                ? 'bg-white text-[#0C1B2E] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <Users size={14} className="text-[#C69C47]" />
            <span>Phòng Họp 3-6-9 ({meetings.filter((m) => m.status === 'UPCOMING').length})</span>
          </button>
          <button
            onClick={() => setSubTab('PREP')}
            className={`px-4 py-1.5 rounded-[10px] text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'PREP'
                ? 'bg-white text-[#0C1B2E] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-slate-600 hover:text-[#0C1B2E]'
            }`}
          >
            <MessageSquareQuote size={14} className="text-[#C69C47]" />
            <span>Soạn Chỉ Đạo PREP ({prepDocs.length})</span>
          </button>
        </div>
      </div>

      {/* ─── 1. MEETINGS ORGANIZER & LIVE COMMAND ROOM ───────────────────────── */}
      {subTab === 'MEETINGS' && (
        <div className="space-y-4">
          {/* Compact 3-6-9 Discipline Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[14px] font-bold text-[#0C1B2E]">
                  Kỷ Luật Họp Điều Hành 3-6-9: Họp Ngắn — Quyết Ngay — Theo Sát Tới Cùng
                </div>
                <div className="text-[12px] text-slate-500">
                  Mọi kết luận trong phòng họp đều phải gán đích danh người chịu trách nhiệm và hạn hoàn thành.
                </div>
              </div>
              <button
                type="button"
                onClick={() => theoryService.open('3-6-9')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <BookOpen size={14} className="text-[#C69C47]" />
                <span>Tra cứu 3 Công thức • 6 Bước • 9 Nguyên tắc</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[11.5px] text-slate-700">
                <span className="font-bold text-[#0C1B2E]">1.</span> Họp mà không thực hiện thì không đạt hiệu quả.
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[11.5px] text-slate-700">
                <span className="font-bold text-[#0C1B2E]">2.</span> Phân công nhưng không giám sát thì cũng không đạt hiệu quả.
              </div>
              <div className="px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11.5px] text-amber-950 font-medium">
                <span className="font-bold text-[#9D772B]">3.</span> Theo sát tiến độ + Đôn đốc người nhận = Đúng kế hoạch.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 cols: Create / Edit Meeting & Meeting List */}
            <div className="lg:col-span-5 axis-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[15.5px] font-bold text-[#0C1B2E]">
                  {editingMeetingId ? 'Cập Nhật Cuộc Họp' : 'Lên Lịch Cuộc Họp Mới'}
                </h3>
                {editingMeetingId && (
                  <button
                    type="button"
                    onClick={resetMeetingForm}
                    className="text-[11.5px] font-semibold text-slate-500 hover:text-[#0C1B2E] cursor-pointer"
                  >
                    + Tạo mới
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveMeeting} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-7">
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      Chủ đề cuộc họp *
                    </label>
                    <input
                      ref={meetTitleInputRef}
                      type="text"
                      required
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      placeholder="VD: Rà soát tiến độ đơn gấp & gỡ nghẽn..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px]"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                      Loại cuộc họp
                    </label>
                    <select
                      value={meetType}
                      onChange={(e) => setMeetType(e.target.value as AxisMeeting['meetingType'])}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-[12.5px] font-semibold text-[#0C1B2E]"
                    >
                      {Object.entries(MEETING_TYPE_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                      min={5}
                      max={240}
                      value={meetDuration}
                      onChange={(e) => setMeetDuration(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
                    Thành phần tham dự (chọn nhanh hoặc gõ cách nhau dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={meetParticipants}
                    onChange={(e) => setMeetParticipants(e.target.value)}
                    placeholder="VD: Quản lý sản xuất, Tổ trưởng In, Kho NVL..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                  {uniqueDepartments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {uniqueDepartments.slice(0, 6).map((dept) => {
                        const selected = meetParticipants
                          .split(',')
                          .map((x) => x.trim())
                          .includes(dept);
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => toggleParticipantToken(dept)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                              selected
                                ? 'bg-[#0C1B2E] text-[#F3DA99] border-[#0C1B2E]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '}
                            {dept}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <label className="text-[11.5px] font-semibold text-slate-600">
                      Chương trình họp (Agenda)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoBuildAgendaFromWork}
                      className="text-[11px] font-bold text-[#9D772B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title="Tự động quét các việc quá hạn, mốc 3-6-9 đến hạn và LSX trễ để dựng Agenda"
                    >
                      <Zap size={12} />
                      <span>Tự nạp từ việc quá hạn & LSX trễ</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={meetAgenda}
                    onChange={(e) => setMeetAgenda(e.target.value)}
                    placeholder="Bấm 'Tự nạp từ việc quá hạn & LSX trễ' hoặc nhập nội dung cần thảo luận..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-[12.5px]"
                  />
                </div>

                <div className="flex gap-2">
                  {editingMeetingId && (
                    <button
                      type="button"
                      onClick={resetMeetingForm}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[12.5px] font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Hủy sửa
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={15} className="text-[#E5C472]" />
                    <span>{editingMeetingId ? 'Lưu cập nhật cuộc họp' : 'Tạo lịch họp mới'}</span>
                  </button>
                </div>
              </form>

              {/* Meeting List */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[11.5px] font-bold uppercase text-slate-400">
                  Danh sách cuộc họp ({sortedMeetings.length})
                </div>
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                  {sortedMeetings.map((m) => {
                    const isSelected = activeMeeting?.id === m.id;
                    const isDone = m.status === 'COMPLETED';
                    const isToday = m.date === todayStr;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setActiveMeetingId(m.id)}
                        className={`group p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#0C1B2E]/5 border-[#0C1B2E]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isDone
                                  ? 'bg-slate-100 text-slate-500'
                                  : isToday
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {isDone ? 'Đã kết thúc' : isToday ? 'Hôm nay' : 'Sắp tới'}
                            </span>
                            <span className="text-[10.5px] font-semibold text-slate-500">
                              {MEETING_TYPE_LABELS[m.meetingType] || 'Họp điều hành'}
                            </span>
                          </div>
                          <div
                            className={`text-[13px] font-bold truncate ${
                              isDone ? 'text-slate-500' : 'text-[#0C1B2E]'
                            }`}
                          >
                            {m.title}
                          </div>
                          <div className="text-[11.5px] text-slate-500 tabular-nums">
                            {m.time} • {m.date} ({m.durationMinutes}p) • {m.actionItems.length} đầu việc
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadMeetingToEdit(m);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0C1B2E] hover:bg-slate-100 cursor-pointer"
                            title="Sửa thông tin cuộc họp"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeeting(m);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Xóa cuộc họp"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 7 cols: Active Meeting Command Room */}
            <div className="lg:col-span-7 axis-card p-5 sm:p-6 space-y-5">
              {activeMeeting ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#0C1B2E] text-[#F3DA99] text-[10.5px] font-bold">
                          {MEETING_TYPE_LABELS[activeMeeting.meetingType] || 'Họp điều hành 3-6-9'}
                        </span>
                        <span className="text-[11.5px] font-bold text-[#9D772B] tabular-nums">
                          {activeMeeting.date} lúc {activeMeeting.time} ({activeMeeting.durationMinutes} phút)
                        </span>
                        {activeMeeting.status === 'COMPLETED' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-bold">
                            ✓ Đã hoàn tất
                          </span>
                        )}
                      </div>
                      <h3 className="text-[18px] font-extrabold text-[#0C1B2E]">
                        {activeMeeting.title}
                      </h3>
                      {activeMeeting.participants.length > 0 && (
                        <div className="text-[12px] text-slate-500">
                          Thành phần: <span className="font-semibold text-slate-700">{activeMeeting.participants.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyMeetingMinutes(activeMeeting)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                        title="Sao chép biên bản họp để gửi nhóm chat hoặc lưu trữ"
                      >
                        <Copy size={13} />
                        <span>Copy Biên bản</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => notifyMeetingToErp(activeMeeting)}
                        className="px-3 py-1.5 rounded-xl bg-[#0C1B2E] text-[#F3DA99] text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bell size={13} />
                        <span>
                          {activeMeeting.notifiedErp ? 'Nhắc lại ERP' : 'Triệu tập ERP'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMeetingStatus(activeMeeting)}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer border ${
                          activeMeeting.status === 'COMPLETED'
                            ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>
                          {activeMeeting.status === 'COMPLETED' ? 'Mở lại họp' : 'Kết thúc họp'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Timekeeper Countdown */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400">
                        Đồng hồ kỷ luật phòng họp ({activeMeeting.durationMinutes} phút — Không họp quá giờ)
                      </div>
                      <div
                        className={`text-[26px] font-extrabold tabular-nums ${
                          secondsLeft < 180 ? 'text-rose-600' : 'text-[#0C1B2E]'
                        }`}
                      >
                        {formatTimer(secondsLeft)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTimerRunning(!timerRunning)}
                        className="px-4 py-2 rounded-xl bg-[#0C1B2E] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                        <span>{timerRunning ? 'Tạm dừng' : 'Bắt đầu bấm giờ'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTimerRunning(false);
                          setSecondsLeft((activeMeeting.durationMinutes || 30) * 60);
                        }}
                        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-white cursor-pointer"
                        title="Đặt lại đồng hồ"
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Follow-up Open Actions from Previous Meetings */}
                  {previousOpenActions.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/70 space-y-2">
                      <div className="text-[11.5px] font-bold text-rose-900 flex items-center justify-between">
                        <span>
                          🔍 Rà soát đầu việc chưa xong từ các kỳ họp trước ({previousOpenActions.length})
                        </span>
                        <span className="text-[10.5px] font-normal text-rose-700">
                          Tick hoàn thành ngay tại buổi họp nếu đã nghiệm thu
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {previousOpenActions.map(({ meeting: prevM, action }) => (
                          <div
                            key={action.id}
                            className="flex items-center justify-between gap-2 text-[12px] bg-white/90 px-2.5 py-1.5 rounded-lg border border-rose-100"
                          >
                            <button
                              type="button"
                              onClick={() => toggleMeetingActionCompleted(prevM, action.id)}
                              className="flex items-center gap-2 text-left min-w-0 cursor-pointer hover:text-emerald-700"
                            >
                              <Circle size={14} className="text-rose-400 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">
                                {action.taskTitle}
                              </span>
                            </button>
                            <span className="text-[11px] text-slate-500 shrink-0 tabular-nums">
                              {action.assigneeName} • Hạn {action.dueDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Agenda */}
                  <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/60 text-[12.5px] text-slate-700 whitespace-pre-line">
                    <strong className="text-[#0C1B2E]">Chương trình họp (Agenda):</strong>
                    {'\n'}
                    {activeMeeting.agenda}
                  </div>

                  {/* Debounced CEO Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[12px] font-bold text-[#0C1B2E]">
                        Biên bản & Quyết định ghi nhanh của CEO
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {notesSavingState === 'TYPING'
                          ? 'Đang lưu...'
                          : notesSavingState === 'SAVED'
                          ? '✓ Đã lưu tự động'
                          : 'Tự động lưu'}
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={localNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      onBlur={() => flushPendingNotes()}
                      placeholder="Ghi nhanh các quyết định, số liệu chốt và cam kết tại phòng họp..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-[13px]"
                    />
                  </div>

                  {/* Action Items -> Auto-create SMART Task */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[12.5px] font-bold text-[#0C1B2E]">
                        Chốt Đầu Việc Sau Họp ({activeMeeting.actionItems.length})
                      </div>
                      <label className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoCreateSmartTask}
                          onChange={(e) => setAutoCreateSmartTask(e.target.checked)}
                        />
                        <span>Tự tạo luôn Việc Giao SMART (kèm 3 mốc đôn đốc)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={newActionTitle}
                        onChange={(e) => setNewActionTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addActionItemToMeeting(activeMeeting);
                          }
                        }}
                        placeholder="Đầu việc thống nhất tại cuộc họp..."
                        className="sm:col-span-5 px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                      />
                      <input
                        list="meet-staff"
                        value={newActionOwner}
                        onChange={(e) => setNewActionOwner(e.target.value)}
                        placeholder="Người chịu trách nhiệm..."
                        className="sm:col-span-3 px-3 py-2 rounded-xl border border-slate-200 text-[12.5px]"
                      />
                      <datalist id="meet-staff">
                        {staffDirectory.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.department}
                          </option>
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
                        className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12px] font-semibold cursor-pointer"
                      >
                        + Chốt việc
                      </button>
                    </div>

                    {activeMeeting.actionItems.length === 0 ? (
                      <div className="text-[12px] text-slate-400 py-3 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                        Chưa có đầu việc nào được chốt. Đừng kết thúc cuộc họp nếu chưa có hành động cụ thể!
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {activeMeeting.actionItems.map((act) => (
                          <div
                            key={act.id}
                            className="group py-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px]"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleMeetingActionCompleted(activeMeeting, act.id)}
                                className="mt-0.5 text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
                                title="Đánh dấu hoàn thành đầu việc này"
                              >
                                {act.completed ? (
                                  <CheckCircle2 size={16} className="text-emerald-600" />
                                ) : (
                                  <Circle size={16} />
                                )}
                              </button>
                              <div className="min-w-0">
                                <span
                                  className={`font-semibold ${
                                    act.completed ? 'line-through text-slate-400' : 'text-slate-800'
                                  }`}
                                >
                                  {act.taskTitle}
                                </span>{' '}
                                <span className="text-slate-500 text-[12px] tabular-nums">
                                  • {act.assigneeName} (Hạn: {act.dueDate})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {act.convertedToSmart ? (
                                <button
                                  type="button"
                                  onClick={() => onNavigate('execution', { subTab: 'SMART' })}
                                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold cursor-pointer"
                                  title="Mở màn hình Giao Việc & Cải Tiến để theo dõi 3 mốc tiến độ"
                                >
                                  Đã vào Giao việc →
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => convertMeetingActionToSmart(activeMeeting, act.id)}
                                  className="text-[12px] font-bold text-[#9D772B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <ArrowRightCircle size={13} />
                                  <span>Tạo Việc SMART</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => deleteMeetingAction(activeMeeting, act.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Xóa đầu việc"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-slate-400 text-[13.5px]">
                  Hãy tạo cuộc họp đầu tiên ở cột bên trái để bắt đầu điều phối.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. PREP COMMUNICATION & DIRECTIVE STUDIO ────────────────────────── */}
      {subTab === 'PREP' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <div className="text-[14px] font-bold text-[#0C1B2E]">
                Soạn Chỉ Đạo & Thông Báo Nội Bộ Sắc Gọn Chuẩn PREP (Point • Reason • Example • Point)
              </div>
              <div className="text-[12px] text-slate-500">
                Nêu thẳng quyết định ngay câu đầu, giải thích rõ lý do, minh chứng bằng thực tế nhà máy và chốt lệnh hành động.
              </div>
            </div>
            <button
              type="button"
              onClick={() => theoryService.open('PREP')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <BookOpen size={15} className="text-[#C69C47]" />
              <span>Tra cứu khung PREP</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 axis-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-bold text-[#0C1B2E]">
                  {editingPrepId ? 'Biên Tập Bản Thảo PREP' : 'Soạn Thông Điệp Chỉ Đạo Mới'}
                </h3>
                {(editingPrepId || fullPrepText || rawPrepNotes) && (
                  <button
                    type="button"
                    onClick={resetPrepForm}
                    className="text-[12px] font-semibold text-slate-500 hover:text-[#0C1B2E] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Làm mới form</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#0C1B2E]/4 border border-[#0C1B2E]/10 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11.5px] font-bold text-[#0C1B2E] uppercase">
                    ✨ Gõ nhanh ý thô của CEO → AI biên tập mạch lạc chuẩn 4 bước PREP
                  </label>
                  <select
                    value={prepContext}
                    onChange={(e) => setPrepContext(e.target.value as AxisPrepDoc['contextType'])}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11.5px] font-semibold"
                  >
                    {Object.entries(PREP_CONTEXT_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
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
                  placeholder="VD: Quy định kiểm tra tồn kho NVL trước khi xác nhận đơn hàng gấp..."
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
                    placeholder="Kể từ hôm nay, bắt buộc..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0C1B2E] mb-1">
                    2. [R] Reason — Lý do cốt lõi vì sao phải thực hiện điều này
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Bởi vì điều này giúp bảo vệ uy tín giao hàng và tránh dừng máy chờ vật tư..."
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
                    placeholder="Thực tế tuần qua đã phát sinh..."
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
                    placeholder="Vì vậy, đề nghị các trưởng bộ phận triển khai ngay từ ca sáng mai..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px]"
                  />
                </div>
              </div>

              {/* Publish Target to ProTrack */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  <select
                    value={targetType}
                    onChange={(e) => {
                      const next = e.target.value as 'ALL' | 'DEPARTMENTS' | 'INDIVIDUAL';
                      setTargetType(next);
                      setTargetValue(next === 'ALL' ? 'Toàn công ty' : '');
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    <option value="ALL">Phạm vi nhận: Toàn công ty</option>
                    <option value="DEPARTMENTS">Phạm vi nhận: Theo bộ phận</option>
                    <option value="INDIVIDUAL">Phạm vi nhận: Cá nhân</option>
                  </select>
                  {targetType !== 'ALL' && (
                    <>
                      <input
                        list={targetType === 'DEPARTMENTS' ? 'prep-depts' : 'meet-staff'}
                        type="text"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        placeholder={
                          targetType === 'DEPARTMENTS' ? 'Chọn/gõ bộ phận...' : 'Chọn/gõ tên nhân sự...'
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 w-44"
                      />
                      <datalist id="prep-depts">
                        {uniqueDepartments.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </>
                  )}
                  <label className="inline-flex items-center gap-1.5 text-slate-600 cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={requireAck}
                      onChange={(e) => setRequireAck(e.target.checked)}
                    />
                    <span>Yêu cầu bấm xác nhận đã đọc trên ERP</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!fullPrepText.trim()) return;
                      navigator.clipboard.writeText(fullPrepText);
                      dialogService.toast('Đã copy thông điệp PREP!');
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePrep(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>Lưu bản nháp</span>
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
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-[#0C1B2E]">
                  Kho Chỉ Đạo & Bản Thảo PREP ({prepDocs.length})
                </h3>
                <span className="text-[11px] text-slate-400">Bấm vào thẻ để nạp lại</span>
              </div>
              {prepDocs.length === 0 ? (
                <p className="text-[12.5px] text-slate-400 py-8 text-center">
                  Các bản nháp và chỉ đạo chuẩn PREP của CEO sẽ lưu trữ tại đây để tái sử dụng nhanh.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                  {prepDocs.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => loadPrepDocToEditor(d)}
                      className={`group py-3 px-2 rounded-xl cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                        editingPrepId === d.id ? 'bg-[#0C1B2E]/5' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              d.publishedToErp
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {d.publishedToErp ? 'Đã phát ERP' : 'Bản nháp'}
                          </span>
                          <span className="text-[10.5px] text-slate-400">
                            {PREP_CONTEXT_LABELS[d.contextType] || 'Chỉ đạo'}
                          </span>
                        </div>
                        <div className="text-[13.5px] font-bold text-[#0C1B2E] truncate">
                          {d.title}
                        </div>
                        <p className="text-[12px] text-slate-600 whitespace-pre-line line-clamp-3">
                          {d.polishedText}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrepDoc(d);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                        title="Xóa thông điệp này"
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
    </div>
  );
};
