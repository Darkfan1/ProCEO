import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import {
  CeoMission,
  OkrObjective,
  OkrKeyResult,
  CeoInitiative,
  SmartTask,
} from '../../types/ceoTypes';
import { ceoAiService } from '../../services/ceoAiService';
import { dialogService } from './CustomDialog';

interface PrepDirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    mission: CeoMission;
    okr: OkrObjective;
    initiatives: CeoInitiative[];
    tasks: SmartTask[];
  }) => Promise<void> | void;
  staffDirectory?: Array<{ name: string; role: string; department: string }>;
}

const PRESET_DIRECTIVES = [
  {
    label: '⚡ Giảm 30% thời gian setup máy in trong 30 ngày',
    point: 'Giảm 30% thời gian setup máy in Flexo và bế decal trong 30 ngày tới.',
    reason: 'Setup chậm làm giảm năng suất toàn xưởng, tạo nút thắt cổ chai và đe dọa cam kết giao hàng OTD cho các khách hàng VIP.',
    evidence: 'Dữ liệu ERP 4 tuần gần nhất cho thấy setup trung bình 60 phút/lượt; hao hụt màng decal khi lên bài in chiếm 3.8% tổng sản lượng.',
    action: 'Sản xuất là Single DRI chịu trách nhiệm kết quả; QA và Kỹ thuật là Supporter phối hợp; check-in số liệu hằng tuần.',
    timeframe: '30 ngày (Tháng 11/2026)',
    driName: 'Nguyễn Tuấn Khanh (Quản Lý Sản Xuất)',
    budgetOrAuthority: 'Duyệt quyền điều chỉnh ca kíp và mua đồ gá kẹp nhanh SMED dưới 25 triệu VNĐ.',
    mainRisk: 'Thợ máy quen nếp thao tác cũ, không chịu tuân thủ checklist; cần đào tạo và giám sát chéo.',
  },
  {
    label: '🛡️ Kéo giảm tỷ lệ phế phẩm & lỗi lệch màu dưới 1.2%',
    point: 'Kiểm soát chất lượng in ấn, kéo giảm tỷ lệ phế phẩm tem decal từ 3.5% xuống dưới 1.2% trong 45 ngày.',
    reason: 'Tem lỗi lệch màu và bế lệch mép gây phát sinh chi phí tái chế cao và nguy cơ bị khách hàng phạt đơn hàng.',
    evidence: 'Báo cáo KCS tháng vừa qua ghi nhận 14 lô hàng phải in bù, chi phí hao hụt nguyên vật liệu ước tính 48 triệu VNĐ.',
    action: 'QA/QC là Single DRI; Thiết kế và In ấn phối hợp; bắt buộc 100% lệnh sản xuất có First-Piece Approval trước khi chạy hàng loạt.',
    timeframe: '45 ngày tới',
    driName: 'Nguyễn Thị Lan (Trưởng BP QA/QC)',
    budgetOrAuthority: 'Được quyền dừng dây chuyền (Andon) ngay khi phát hiện lỗi lệch màu mà thợ không xử lý được.',
    mainRisk: 'Áp lực tiến độ đơn hàng gấp khiến thợ máy bỏ qua bước ký duyệt bài in đầu tiên (First-Piece).',
  },
  {
    label: '📦 Chuẩn bị vật tư & màng decal đúng giờ OTD 99%',
    point: 'Đảm bảo 100% vật tư, cuộn decal và khuôn bế sẵn sàng trước 1 giờ trước khi máy hoàn tất lệnh in cũ.',
    reason: 'Máy in chờ vật tư chiếm đến 22% tổng thời gian dừng lãng phí tại xưởng.',
    evidence: 'Biên bản ghi nhận 8 lượt máy in phải dừng chờ chia cuộn hoặc chờ lấy bản in từ kho trong tuần qua.',
    action: 'Kho & Mua hàng là Single DRI; Kế hoạch sản xuất phối hợp cung cấp lịch chạy máy trước 24 giờ.',
    timeframe: '3 tuần tới',
    driName: 'Phạm Văn Hoàng Huy (Kinh Doanh & Điều Phối)',
    budgetOrAuthority: 'Ưu tiên duyệt xuất kho vật tư theo tiến độ đơn hàng gấp.',
    mainRisk: 'Nhà cung cấp decal giao hàng trễ; cần thiết lập mức tồn kho an toàn tối thiểu 3 ngày.',
  },
];

export const PrepDirectiveModal: React.FC<PrepDirectiveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  staffDirectory = [],
}) => {
  const todayYmd = new Date().toISOString().slice(0, 10);

  // PREP Form State
  const [point, setPoint] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [action, setAction] = useState('');
  const [timeframe, setTimeframe] = useState('30 ngày tới');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [driName, setDriName] = useState(staffDirectory[0]?.name || 'Nguyễn Tuấn Khanh (Quản Lý Sản Xuất)');
  const [budgetOrAuthority, setBudgetOrAuthority] = useState('');
  const [mainRisk, setMainRisk] = useState('');

  // 4-Tier Plan Preview State
  const [step, setStep] = useState<'INPUT' | 'PREVIEW'>('INPUT');
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Generated Tier 1: Mission
  const [missionTitle, setMissionTitle] = useState('');

  // Generated Tier 2: OKR
  const [objectiveTitle, setObjectiveTitle] = useState('');
  const [keyResults, setKeyResults] = useState<
    Array<{
      id: string;
      title: string;
      baselineValue: number;
      targetValue: number;
      currentValue: number;
      unit: string;
      driName: string;
    }>
  >([]);

  // Generated Tier 3: Initiatives
  const [initiatives, setInitiatives] = useState<
    Array<{
      id: string;
      title: string;
      hypothesis: string;
      driName: string;
      targetDate: string;
    }>
  >([]);

  // Generated Tier 4: Tasks
  const [tasks, setTasks] = useState<
    Array<{
      id: string;
      title: string;
      driName: string;
      approverName: string;
      supporters: string[];
      priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
      dueDate: string;
      specific: string;
      measurable: string;
    }>
  >([]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_DIRECTIVES[0]) => {
    setPoint(preset.point);
    setReason(preset.reason);
    setEvidence(preset.evidence);
    setAction(preset.action);
    setTimeframe(preset.timeframe);
    setDriName(preset.driName);
    setBudgetOrAuthority(preset.budgetOrAuthority);
    setMainRisk(preset.mainRisk);
  };

  const handleGenerateFourTierPlan = async () => {
    if (!point.trim()) {
      dialogService.toast('Vui lòng nhập Vấn đề / Mục tiêu cốt lõi (Point) của Chỉ thị.', 'warning');
      return;
    }
    if (!driName.trim()) {
      dialogService.toast('Vui lòng chọn hoặc điền Single DRI chịu trách nhiệm cao nhất.', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const plan = await ceoAiService.parsePrepToFourTierPlan({
        point,
        reason,
        evidence,
        action,
        driName,
        timeframe,
        targetDate,
        budgetOrAuthority,
        mainRisk,
      });

      setMissionTitle(plan.missionTitle);
      setObjectiveTitle(plan.objectiveTitle);
      setKeyResults(
        plan.keyResults.map((kr, idx) => ({
          id: `kr-gen-${Date.now()}-${idx}`,
          title: kr.title,
          baselineValue: kr.baselineValue,
          targetValue: kr.targetValue,
          currentValue: kr.baselineValue,
          unit: kr.unit,
          driName: kr.driName || driName,
        }))
      );
      setInitiatives(
        plan.initiatives.map((init, idx) => ({
          id: `init-gen-${Date.now()}-${idx}`,
          title: init.title,
          hypothesis: init.hypothesis,
          driName: init.driName || driName,
          targetDate: init.targetDate || targetDate,
        }))
      );
      setTasks(
        plan.tasks.map((t, idx) => ({
          id: `task-gen-${Date.now()}-${idx}`,
          title: t.title,
          driName: t.driName || driName,
          approverName: t.approverName || 'CEO Tôn Đăng Vũ',
          supporters: t.supporters || [],
          priority: (t.priority === 'NORMAL' ? 'MEDIUM' : t.priority) as SmartTask['priority'],
          dueDate: t.dueDate || targetDate,
          specific: t.specific || t.title,
          measurable: t.measurable || 'Hoàn thành đúng tiến độ & nghiệm thu',
        }))
      );

      setStep('PREVIEW');
      setValidationErrors([]);
      dialogService.toast('Đã thiết lập kế hoạch 4 tầng theo chuẩn SMART & OKR!', 'success');
    } catch (err: any) {
      dialogService.toast(`Lỗi khi tạo kế hoạch: ${err.message || String(err)}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Validate SMART & OKR Core Fields before saving
  const validateBeforeSave = (): boolean => {
    const errors: string[] = [];
    if (!missionTitle.trim()) errors.push('Thiếu Khẩu hiệu / Tên Nhiệm vụ Chiến lược (Tầng 1).');
    if (!objectiveTitle.trim()) errors.push('Thiếu Mục tiêu OKR (Tầng 2).');

    if (keyResults.length === 0) {
      errors.push('Tầng 2 phải có ít nhất 01 Kết quả then chốt (Key Result).');
    } else {
      keyResults.forEach((kr, i) => {
        if (!kr.title.trim()) errors.push(`KR #${i + 1} chưa có tiêu đề kết quả.`);
        if (kr.targetValue === undefined || isNaN(kr.targetValue))
          errors.push(`KR #${i + 1} ("${kr.title || 'KR'}") thiếu Target (Mục tiêu đo được).`);
        if (!kr.unit.trim()) errors.push(`KR #${i + 1} thiếu Đơn vị đo lường (Unit).`);
        if (!kr.driName.trim()) errors.push(`KR #${i + 1} thiếu Single DRI phụ trách.`);
      });
    }

    if (initiatives.length === 0) {
      errors.push('Tầng 3 phải có ít nhất 01 Dự án cải tiến PDCA (Initiative).');
    } else {
      initiatives.forEach((init, i) => {
        if (!init.title.trim()) errors.push(`Dự án #${i + 1} chưa có tên dự án.`);
        if (!init.driName.trim()) errors.push(`Dự án #${i + 1} thiếu Single DRI.`);
      });
    }

    if (tasks.length === 0) {
      errors.push('Tầng 4 phải có ít nhất 01 Hành động cụ thể (Task).');
    } else {
      tasks.forEach((t, i) => {
        if (!t.title.trim()) errors.push(`Tác vụ #${i + 1} chưa có tiêu đề hành động.`);
        if (!t.driName.trim()) errors.push(`Tác vụ #${i + 1} ("${t.title || 'Task'}") thiếu Single DRI.`);
        if (!t.dueDate.trim()) errors.push(`Tác vụ #${i + 1} thiếu Hạn chót (Deadline).`);
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFinalSave = async () => {
    if (!validateBeforeSave()) {
      dialogService.toast('Chưa đạt chuẩn SMART/OKR. Vui lòng bổ sung các trường còn thiếu!', 'warning');
      return;
    }

    const missionId = `mission-${Date.now()}`;
    const okrId = `okr-${Date.now()}`;
    const newInitiativeIds = initiatives.map((_, idx) => `init-${Date.now()}-${idx}`);

    // Build Mission
    const finalMission: CeoMission = {
      id: missionId,
      title: missionTitle,
      timeframe,
      startDate: todayYmd,
      targetDate,
      driName,
      status: 'ON_TRACK',
      progress: 0,
      prep: {
        point,
        reason,
        evidence,
        action,
        budgetOrAuthority: budgetOrAuthority.trim() || undefined,
        mainRisk: mainRisk.trim() || undefined,
      },
      linkedOkrIds: [okrId],
      linkedInitiativeIds: newInitiativeIds,
      createdAt: new Date().toISOString(),
    };

    // Build OKR
    const finalKeyResults: OkrKeyResult[] = keyResults.map((kr, idx) => ({
      id: `kr-${Date.now()}-${idx}`,
      title: kr.title,
      startValue: Number(kr.baselineValue || 0),
      baselineValue: Number(kr.baselineValue || 0),
      targetValue: Number(kr.targetValue || 100),
      currentValue: Number(kr.currentValue || kr.baselineValue || 0),
      unit: kr.unit,
      driName: kr.driName,
      linkedInitiativeIds: newInitiativeIds,
    }));

    const finalOkr: OkrObjective = {
      id: okrId,
      missionId,
      title: objectiveTitle,
      ownerName: driName,
      department: 'Sản xuất & Kỹ thuật MVĐN',
      quarter: `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      priority: 'P0',
      keyResults: finalKeyResults,
      createdAt: new Date().toISOString(),
    };

    // Build Initiatives
    const finalInitiatives: CeoInitiative[] = initiatives.map((init, idx) => ({
      id: newInitiativeIds[idx],
      missionId,
      linkedOkrId: okrId,
      linkedKrId: finalKeyResults[0]?.id,
      title: init.title,
      hypothesis: init.hypothesis,
      driName: init.driName,
      targetDate: init.targetDate || targetDate,
      status: 'IN_PROGRESS',
      pdcaPhase: 'PLAN',
      createdAt: new Date().toISOString(),
    }));

    // Build Tasks
    const finalTasks: SmartTask[] = tasks.map((t, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      missionId,
      initiativeId: newInitiativeIds[0],
      linkedOkrId: okrId,
      taskType: 'DRI_ACTION',
      title: t.title,
      department: 'Sản xuất & Vận hành',
      assigneeName: t.driName,
      assigneeRole: 'Single DRI',
      approverName: t.approverName,
      supporters: t.supporters,
      driConfirmed: false, // DRI will confirm receipt
      dueDate: t.dueDate,
      priority: t.priority,
      status: 'IN_PROGRESS',
      progress: 0,
      smart: {
        specific: t.specific || t.title,
        measurable: t.measurable || 'Hoàn thành đúng hạn',
        achievable: 'Nguồn lực đã được CEO phê duyệt trong chỉ thị',
        relevant: missionTitle,
        timeBound: `Hạn chót: ${t.dueDate}`,
      },
      smartScore: 95,
      followUpCount: 0,
      createdAt: new Date().toISOString(),
    }));

    await onSave({
      mission: finalMission,
      okr: finalOkr,
      initiatives: finalInitiatives,
      tasks: finalTasks,
    });

    dialogService.toast('Đã ban hành Chỉ thị và kích hoạt Kế hoạch 4 tầng thành công!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Ban Hành Chỉ Thị Cấp CEO</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                  Cấu trúc PREP ➔ Chuẩn SMART/OKR
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Chuyển hóa ý chí điều hành của CEO thành hệ thống thực thi 4 tầng khép kín có số liệu và 1 Single DRI.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep('INPUT')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                step === 'INPUT'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>1. Soạn Chỉ Thị PREP</span>
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() => {
                if (step === 'INPUT' && !missionTitle) {
                  handleGenerateFourTierPlan();
                } else {
                  setStep('PREVIEW');
                }
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                step === 'PREVIEW'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>2. Kế Hoạch 4 Tầng & RACI</span>
              {missionTitle && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              )}
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Nguyên tắc: Mỗi chỉ thị chỉ có 1 Single DRI duy nhất chịu trách nhiệm cuối cùng.
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === 'INPUT' ? (
            <div className="space-y-5">
              {/* Preset Templates */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Gợi ý chỉ thị mẫu theo tình huống nhà máy (Click điền nhanh):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_DIRECTIVES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="p-2.5 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 text-left text-xs font-medium text-slate-700 transition-all cursor-pointer shadow-2xs group"
                    >
                      <span className="group-hover:text-indigo-700 font-semibold">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PREP 4 Core Fields */}
              <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/20 p-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        P
                      </span>
                      <span>Point — Vấn đề / Mục tiêu cốt lõi cần giải quyết (*)</span>
                    </label>
                    <span className="text-[11px] text-indigo-600 font-medium">
                      CEO muốn đạt điều gì?
                    </span>
                  </div>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => setPoint(e.target.value)}
                    placeholder="VD: Giảm 30% thời gian setup máy in Flexo trong 30 ngày tới."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        R
                      </span>
                      <span>Reason — Vì sao việc này sống còn và quan trọng?</span>
                    </label>
                    <span className="text-[11px] text-indigo-600 font-medium">
                      Tác động tới OTD, năng suất, chi phí
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="VD: Setup chậm làm giảm năng suất toàn xưởng, tạo nút thắt cổ chai và đe dọa kế hoạch giao hàng OTD..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        E
                      </span>
                      <span>Evidence / Example — Bằng chứng & Số liệu thực tế</span>
                    </label>
                    <span className="text-[11px] text-indigo-600 font-medium">
                      Hiện trạng đo lường được
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="VD: Dữ liệu ERP 4 tuần gần nhất cho thấy setup trung bình 60 phút/lượt; hao hụt tem chiếm 3.8%..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        P
                      </span>
                      <span>Point / Action — Chỉ đạo hành động & Phối hợp ban đầu</span>
                    </label>
                    <span className="text-[11px] text-indigo-600 font-medium">
                      Phân vai & Nguyên tắc làm việc
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    placeholder="VD: Sản xuất là Single DRI chịu trách nhiệm; QA và Kỹ thuật phối hợp; check-in số liệu hằng tuần..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Assignment & Governance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Single DRI (Chịu trách nhiệm cuối cùng) (*)</span>
                  </label>
                  <select
                    value={driName}
                    onChange={(e) => setDriName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Khung thời gian (Timeframe)</span>
                  </label>
                  <input
                    type="text"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="VD: 30 ngày (Tháng 11/2026)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hạn chót hoàn thành</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Authority & Risks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ngân sách hoặc Thẩm quyền giao cho DRI</span>
                  </label>
                  <input
                    type="text"
                    value={budgetOrAuthority}
                    onChange={(e) => setBudgetOrAuthority(e.target.value)}
                    placeholder="VD: Hạn mức chi dưới 25 triệu VNĐ; quyền điều phối ca kíp..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Rủi ro chính cần giám sát</span>
                  </label>
                  <input
                    type="text"
                    value={mainRisk}
                    onChange={(e) => setMainRisk(e.target.value)}
                    placeholder="VD: Thợ máy cũ kháng cự thói quen mới; thiếu vật tư thay thế..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: 4-TIER PLAN PREVIEW & EDIT */
            <div className="space-y-6">
              {/* Validation Warning Box */}
              {validationErrors.length > 0 && (
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Chỉ thị chưa đủ điều kiện để Lưu & Kích hoạt:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11.5px]">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* TẦNG 1: MISSION */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold">
                      TẦNG 1
                    </span>
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                      Nhiệm Vụ Chiến Lược Cấp CEO (Mission)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    DRI Tối Cao: {driName}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Khẩu hiệu hành động</label>
                  <input
                    type="text"
                    value={missionTitle}
                    onChange={(e) => setMissionTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* TẦNG 2: OBJECTIVE & KEY RESULTS (SMART / OKR) */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                      TẦNG 2
                    </span>
                    <h3 className="font-bold text-xs text-indigo-950 uppercase tracking-wide">
                      Mục Tiêu (Objective) & Kết Quả Then Chốt (Key Results)
                    </h3>
                  </div>
                  <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100/80 px-2 py-0.5 rounded-full">
                    Bắt buộc có Baseline ➔ Target & Đơn vị đo
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Mục tiêu chung (Objective Title)</label>
                  <input
                    type="text"
                    value={objectiveTitle}
                    onChange={(e) => setObjectiveTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-200 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">Các Kết Quả Then Chốt (Key Results):</label>
                    <button
                      type="button"
                      onClick={() =>
                        setKeyResults([
                          ...keyResults,
                          {
                            id: `kr-${Date.now()}`,
                            title: 'Kết quả định lượng bổ sung',
                            baselineValue: 0,
                            targetValue: 100,
                            currentValue: 0,
                            unit: '%',
                            driName,
                          },
                        ])
                      }
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Thêm KR
                    </button>
                  </div>

                  {keyResults.map((kr, idx) => (
                    <div
                      key={kr.id}
                      className="p-3 rounded-lg bg-white border border-indigo-100/90 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700 w-5">KR{idx + 1}</span>
                        <input
                          type="text"
                          value={kr.title}
                          onChange={(e) => {
                            const next = [...keyResults];
                            next[idx].title = e.target.value;
                            setKeyResults(next);
                          }}
                          placeholder="Tên kết quả đo lường được..."
                          className="flex-1 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600"
                        />
                        {keyResults.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setKeyResults(keyResults.filter((_, i) => i !== idx))}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">Hiện trạng (Baseline)</span>
                          <input
                            type="number"
                            value={kr.baselineValue}
                            onChange={(e) => {
                              const next = [...keyResults];
                              next[idx].baselineValue = Number(e.target.value);
                              setKeyResults(next);
                            }}
                            className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] text-indigo-600 font-bold">Mục tiêu (Target) (*)</span>
                          <input
                            type="number"
                            value={kr.targetValue}
                            onChange={(e) => {
                              const next = [...keyResults];
                              next[idx].targetValue = Number(e.target.value);
                              setKeyResults(next);
                            }}
                            className="w-full px-2 py-1 rounded bg-indigo-50 border border-indigo-300 font-mono font-bold text-indigo-900"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">Đơn vị đo (*)</span>
                          <input
                            type="text"
                            value={kr.unit}
                            onChange={(e) => {
                              const next = [...keyResults];
                              next[idx].unit = e.target.value;
                              setKeyResults(next);
                            }}
                            placeholder="phút, %, lỗi..."
                            className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-medium text-slate-800"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">Single DRI KR (*)</span>
                          <input
                            type="text"
                            value={kr.driName}
                            onChange={(e) => {
                              const next = [...keyResults];
                              next[idx].driName = e.target.value;
                              setKeyResults(next);
                            }}
                            className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-medium text-slate-800 truncate"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TẦNG 3: INITIATIVES (PDCA) */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                      TẦNG 3
                    </span>
                    <h3 className="font-bold text-xs text-emerald-950 uppercase tracking-wide">
                      Dự Án Cải Tiến (Initiatives / PDCA)
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Khởi tạo ở pha PLAN với giả thuyết rõ ràng
                  </span>
                </div>

                <div className="space-y-2">
                  {initiatives.map((init, idx) => (
                    <div
                      key={init.id}
                      className="p-3 rounded-lg bg-white border border-emerald-100 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700">Dự án #{idx + 1}</span>
                        <input
                          type="text"
                          value={init.title}
                          onChange={(e) => {
                            const next = [...initiatives];
                            next[idx].title = e.target.value;
                            setInitiatives(next);
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-medium">
                          Giả thuyết giải pháp:
                        </span>
                        <input
                          type="text"
                          value={init.hypothesis}
                          onChange={(e) => {
                            const next = [...initiatives];
                            next[idx].hypothesis = e.target.value;
                            setInitiatives(next);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TẦNG 4: RACI ACTION TASKS */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                      TẦNG 4
                    </span>
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                      Hành Động Cụ Thể (Action Tasks & RACI)
                    </h3>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                    Strict Single DRI • Cảnh báo trễ SLA 24h
                  </span>
                </div>

                <div className="space-y-2">
                  {tasks.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-600 w-12">Task #{idx + 1}</span>
                        <input
                          type="text"
                          value={t.title}
                          onChange={(e) => {
                            const next = [...tasks];
                            next[idx].title = e.target.value;
                            setTasks(next);
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                        />
                        <input
                          type="date"
                          value={t.dueDate}
                          onChange={(e) => {
                            const next = [...tasks];
                            next[idx].dueDate = e.target.value;
                            setTasks(next);
                          }}
                          className="w-32 px-2 py-1 rounded bg-slate-50 border border-slate-200 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-indigo-700">Single DRI (R) (*)</span>
                          <input
                            type="text"
                            value={t.driName}
                            onChange={(e) => {
                              const next = [...tasks];
                              next[idx].driName = e.target.value;
                              setTasks(next);
                            }}
                            className="w-full px-2 py-1 rounded bg-indigo-50/50 border border-indigo-200 font-semibold text-slate-800 truncate"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-600">Người phê duyệt / Nghiệm thu (A)</span>
                          <input
                            type="text"
                            value={t.approverName}
                            onChange={(e) => {
                              const next = [...tasks];
                              next[idx].approverName = e.target.value;
                              setTasks(next);
                            }}
                            className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-medium text-slate-800 truncate"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-600">Người phối hợp (S)</span>
                          <input
                            type="text"
                            value={t.supporters.join(', ')}
                            onChange={(e) => {
                              const next = [...tasks];
                              next[idx].supporters = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                              setTasks(next);
                            }}
                            placeholder="Ngăn cách bằng dấu phẩy"
                            className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-medium text-slate-800 truncate"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          {step === 'INPUT' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleGenerateFourTierPlan}
                disabled={isGenerating || !point.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI Đang Thiết Lập 4 Tầng...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ Chuyển Thành Kế Hoạch 4 Tầng (SMART / OKR)</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ← Quay lại sửa PREP
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateFourTierPlan}
                  disabled={isGenerating}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Tạo lại</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSave}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black shadow-md shadow-slate-900/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Lưu & Kích Hoạt Chỉ Thị Cấp CEO</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
