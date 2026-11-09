import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Camera,
  X,
  Upload,
  Clock,
  User,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCheck2,
} from 'lucide-react';
import {
  AndonIssue,
  AndonCategory,
  AndonSeverity,
  SmartTask,
  CeoDecisionItem,
} from '../../types/ceoTypes';
import { dialogService } from './CustomDialog';

interface AndonQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    issue: AndonIssue;
    correctiveTask: SmartTask;
    decisionItem?: CeoDecisionItem;
  }) => Promise<void> | void;
  staffDirectory?: Array<{ name: string; role: string; department: string }>;
  defaultLineOrMachine?: string;
}

const CATEGORY_OPTIONS: Array<{ value: AndonCategory; label: string; icon: string }> = [
  { value: 'MACHINE_STOP', label: 'Máy dừng / Hỏng hóc cơ khí', icon: '🛑' },
  { value: 'QUALITY_DEFECT', label: 'Lỗi chất lượng / Lệch màu', icon: '⚠️' },
  { value: 'SETUP_DELAY', label: 'Setup chậm vượt chuẩn', icon: '⏱️' },
  { value: 'MISSING_MATERIAL', label: 'Thiếu màng decal / Mực in / Dao', icon: '📦' },
  { value: 'SAFETY', label: 'An toàn lao động / Rủi ro PCCC', icon: '🦺' },
  { value: 'OTHER', label: 'Sự cố vận hành khác', icon: '🔧' },
];

const MACHINE_OPTIONS = [
  'Dây chuyền máy in Flexo 01 (6 màu)',
  'Dây chuyền máy in Flexo 02 (4 màu)',
  'Máy bế tem decal tự động 01',
  'Máy bế tem decal tự động 02',
  'Máy chia cuộn decal cao tốc',
  'Bàn kiểm tra chất lượng KCS',
  'Khu vực pha chế mực & dung môi',
];

export const AndonQuickModal: React.FC<AndonQuickModalProps> = ({
  isOpen,
  onClose,
  onSave,
  staffDirectory = [],
  defaultLineOrMachine,
}) => {
  const todayYmd = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [category, setCategory] = useState<AndonCategory>('MACHINE_STOP');
  const [severity, setSeverity] = useState<AndonSeverity>('LINE_STOP');
  const [lineOrMachine, setLineOrMachine] = useState(defaultLineOrMachine || MACHINE_OPTIONS[0]);
  const [productOrLsxCode, setProductOrLsxCode] = useState('');
  const [shift, setShift] = useState('Ca 1 (06:00 - 14:00)');
  const [stage, setStage] = useState('Công đoạn In Flexo');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('Thợ máy phụ trách');
  const [detectedAt, setDetectedAt] = useState(`${todayYmd} ${nowTime}`);
  const [driName, setDriName] = useState(
    staffDirectory[0]?.name
      ? `${staffDirectory[0].name} (${staffDirectory[0].role})`
      : 'Trần Đình Trọng (Trưởng BP Kỹ Thuật)'
  );
  const [imageUrl, setImageUrl] = useState<string>('');
  const [correctiveActionTitle, setCorrectiveActionTitle] = useState('');
  const [correctiveActionDueDate, setCorrectiveActionDueDate] = useState(todayYmd);

  // 5 Whys quick draft
  const [showFiveWhys, setShowFiveWhys] = useState(false);
  const [why1, setWhy1] = useState('');
  const [why2, setWhy2] = useState('');
  const [why3, setWhy3] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');

  // Handle Ctrl+V paste image from clipboard
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              setImageUrl(base64);
              dialogService.toast('Đã dán ảnh hiện trường từ Clipboard thành công!', 'success');
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImageUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      dialogService.toast('Vui lòng mô tả hiện tượng sự cố.', 'warning');
      return;
    }
    if (!driName.trim()) {
      dialogService.toast('Vui lòng chọn Single DRI chịu trách nhiệm xử lý sự cố.', 'warning');
      return;
    }

    const issueId = `andon-${Date.now()}`;
    const issueCode = `ANDON-${todayYmd.replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;
    const actionTaskId = `task-andon-${Date.now()}`;

    const actionTitle =
      correctiveActionTitle.trim() ||
      `Xử lý sự cố ${category === 'MACHINE_STOP' ? 'dừng máy' : 'chất lượng'}: ${lineOrMachine} (${productOrLsxCode || 'Khẩn cấp'})`;

    const fiveWhysList: string[] = [];
    if (why1.trim()) fiveWhysList.push(`Tại sao 1: ${why1.trim()}`);
    if (why2.trim()) fiveWhysList.push(`Tại sao 2: ${why2.trim()}`);
    if (why3.trim()) fiveWhysList.push(`Tại sao 3: ${why3.trim()}`);

    const issue: AndonIssue = {
      id: issueId,
      issueCode,
      category,
      severity,
      lineOrMachine,
      productOrLsxCode: productOrLsxCode.trim() || undefined,
      shift,
      stage,
      imageUrl: imageUrl || undefined,
      description: description.trim(),
      reportedBy: reportedBy.trim(),
      detectedAt,
      driName,
      status: severity === 'LINE_STOP' ? 'TRIAGING' : 'ACTION_IN_PROGRESS',
      correctiveActionTaskId: actionTaskId,
      correctiveActionTitle: actionTitle,
      correctiveActionDueDate,
      fiveWhys: fiveWhysList.length > 0 ? fiveWhysList : undefined,
      preventiveAction: preventiveAction.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Auto generate urgent Corrective Action Task
    const correctiveTask: SmartTask = {
      id: actionTaskId,
      taskType: 'DRI_ACTION',
      title: actionTitle,
      department: 'Bảo Trì & Vận Hành Sản Xuất',
      assigneeName: driName,
      assigneeRole: 'Single DRI Xử Lý Sự Cố',
      approverName: 'Tôn Đăng Vũ (CEO)',
      supporters: ['Tổ Trưởng Ca', 'Kỹ Thuật Máy'],
      driConfirmed: true,
      driConfirmedAt: todayYmd,
      dueDate: correctiveActionDueDate,
      dueTime: '17:00',
      priority: severity === 'LINE_STOP' ? 'URGENT' : 'HIGH',
      status: 'IN_PROGRESS',
      progress: 10,
      smart: {
        specific: `Khắc phục ngay hiện tượng: ${description.slice(0, 100)}`,
        measurable: 'Máy vận hành trở lại ổn định, nghiệm thu mẫu in đạt tiêu chuẩn',
        achievable: 'Ưu tiên thợ kỹ thuật bậc cao xử lý trực tiếp tại xưởng',
        relevant: `Giải tỏa dừng dòng sự cố ${issueCode}`,
        timeBound: `Hoàn tất trước ${correctiveActionDueDate}`,
      },
      smartScore: 92,
      followUpCount: 0,
      createdAt: new Date().toISOString(),
    };

    // If Line Stop or Critical, escalate immediately to CEO Decision Box!
    let decisionItem: CeoDecisionItem | undefined;
    if (severity === 'LINE_STOP' || severity === 'CRITICAL') {
      decisionItem = {
        id: `dec-andon-${Date.now()}`,
        type: 'ANDON_ESCALATION',
        title: `[SỰ CỐ ANDON ${severity === 'LINE_STOP' ? 'DỪNG DÂY CHUYỀN' : 'NGHIÊM TRỌNG'}] ${lineOrMachine}: ${actionTitle}`,
        requestedBy: `${reportedBy} (DRI: ${driName})`,
        requestedAt: `${todayYmd} ${nowTime}`,
        reason: description,
        decisionNeeded:
          severity === 'LINE_STOP'
            ? 'CEO chỉ đạo điều động kỹ thuật khẩn cấp, phương án đổi bài in hoặc duyệt chi linh kiện thay thế.'
            : 'CEO duyệt phương án chạy bù sản lượng hoặc đổi lịch giao hàng cho khách.',
        urgency: 'URGENT',
        status: 'PENDING',
        linkedEntityId: issueId,
      };
    }

    await onSave({ issue, correctiveTask, decisionItem });
    dialogService.toast(`Đã phát tín hiệu Andon số ${issueCode} và giao việc cho DRI!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-rose-200/80 my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Red Alert Tone */}
        <div className="px-6 py-4 border-b border-rose-700 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center text-white shadow-inner animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Báo Cáo Sự Cố Andon Số</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-400/30 text-rose-200 text-[10px] font-bold border border-rose-400/40 uppercase">
                  Andon Trực Tuyến
                </span>
              </div>
              <p className="text-xs text-rose-200">
                Tự động sinh mã sự cố, định tuyến Single DRI và tạo ngay hành động khắc phục.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-rose-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Mức độ nghiêm trọng (Severity Buttons) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">
              1. Mức độ nghiêm trọng (Tự động leo thang lên CEO nếu Dừng dòng) (*)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('LINE_STOP')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  severity === 'LINE_STOP'
                    ? 'bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-400/30 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                  <Flame className="w-4 h-4 animate-bounce" />
                  <span>DỪNG DÂY CHUYỀN</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Máy dừng hoàn toàn
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('CRITICAL')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  severity === 'CRITICAL'
                    ? 'bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-400/30 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>NGHIÊM TRỌNG</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Lỗi hàng loạt / Nguy cơ trễ
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('MINOR')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  severity === 'MINOR'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-400/30 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                  <Wrench className="w-4 h-4" />
                  <span>NHẸ / CẢNH BÁO</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Vẫn chạy nhưng có sai lệch
                </span>
              </button>
            </div>
          </div>

          {/* Phân loại sự cố (Category) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">2. Phân loại sự cố (*)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-2 ${
                    category === cat.value
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Thiết bị & Lệnh sản xuất */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Dây chuyền / Thiết bị (*)</label>
              <select
                value={lineOrMachine}
                onChange={(e) => setLineOrMachine(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold outline-none focus:border-slate-800"
              >
                {MACHINE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Lệnh sản xuất / Sản phẩm (Nếu có)</label>
              <input
                type="text"
                value={productOrLsxCode}
                onChange={(e) => setProductOrLsxCode(e.target.value)}
                placeholder="VD: LSX-GC-2710 (Tem Dược Phẩm)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Ca & Công đoạn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Ca sản xuất</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:border-slate-800"
              >
                <option value="Ca 1 (06:00 - 14:00)">Ca 1 (06:00 - 14:00)</option>
                <option value="Ca 2 (14:00 - 22:00)">Ca 2 (14:00 - 22:00)</option>
                <option value="Ca 3 (22:00 - 06:00)">Ca 3 (22:00 - 06:00)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Công đoạn phát hiện</label>
              <input
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                placeholder="VD: In Flexo / Bế / Chia cuộn / KCS"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Mô tả hiện tượng sự cố */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Mô tả chi tiết hiện tượng sự cố (*)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Máy Flexo 01 bị kẹt màng decal quấn vào trục in số 3; nhiệt độ lô sấy tăng bất thường; đã dừng máy khẩn cấp..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
            />
          </div>

          {/* Dán ảnh / Tải ảnh hiện trường */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ảnh hiện trường (Hỗ trợ bấm Ctrl + V dán ảnh trực tiếp)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-rose-600 hover:underline font-semibold"
                >
                  Xóa ảnh
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-48 flex items-center justify-center">
                <img src={imageUrl} alt="Ảnh sự cố" className="object-contain max-h-48 w-full" />
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-all">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="font-semibold text-slate-700">Tải ảnh lên hoặc bấm Ctrl + V để dán ảnh chụp</span>
                <span className="text-[10px] text-slate-400">Định dạng JPG, PNG</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Phân công Single DRI & Hành động khắc phục ngay */}
          <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>Hành Động Khắc Phục Sinh Tự Động (Corrective Action)</span>
              </span>
              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-full">
                Giao ngay cho Single DRI
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Single DRI chịu trách nhiệm xử lý (*)</label>
              <select
                value={driName}
                onChange={(e) => setDriName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 font-bold text-slate-800 outline-none focus:border-indigo-600"
              >
                {staffDirectory.map((s) => (
                  <option key={s.name} value={`${s.name} (${s.role})`}>
                    {s.name} ({s.role})
                  </option>
                ))}
                {!staffDirectory.some((s) => s.name === driName) && (
                  <option value={driName}>{driName}</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700 block">Hành động xử lý cụ thể</label>
                <input
                  type="text"
                  value={correctiveActionTitle}
                  onChange={(e) => setCorrectiveActionTitle(e.target.value)}
                  placeholder="VD: Căn chỉnh lại lực căng và thay dao bế..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 font-medium outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Hạn hoàn tất</label>
                <input
                  type="date"
                  value={correctiveActionDueDate}
                  onChange={(e) => setCorrectiveActionDueDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-indigo-200 font-medium outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Toggle 5 Whys */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFiveWhys(!showFiveWhys)}
                className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showFiveWhys ? '− Thu gọn phân tích 5 Whys' : '+ Điền nhanh phân tích nguyên nhân 5 Whys'}</span>
              </button>

              {showFiveWhys && (
                <div className="mt-2 space-y-2 pt-2 border-t border-indigo-100">
                  <input
                    type="text"
                    value={why1}
                    onChange={(e) => setWhy1(e.target.value)}
                    placeholder="Tại sao 1: Vì sao sự cố xảy ra? (VD: Màng bị chùng)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-700"
                  />
                  <input
                    type="text"
                    value={why2}
                    onChange={(e) => setWhy2(e.target.value)}
                    placeholder="Tại sao 2: Vì sao màng bị chùng? (VD: Cảm biến lực căng báo sai)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-700"
                  />
                  <input
                    type="text"
                    value={why3}
                    onChange={(e) => setWhy3(e.target.value)}
                    placeholder="Tại sao 3: Vì sao cảm biến báo sai? (VD: Bị bám bụi mực do vỡ nắp chắn)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-700"
                  />
                  <input
                    type="text"
                    value={preventiveAction}
                    onChange={(e) => setPreventiveAction(e.target.value)}
                    placeholder="Hành động phòng ngừa tái diễn (VD: Cập nhật checklist bảo trì tuần)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-indigo-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Phát Tín Hiệu Andon & Giao DRI</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
