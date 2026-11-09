import React, { useState, useMemo } from 'react';
import {
  HeartHandshake,
  Award,
  Layers,
  Plus,
  Sparkles,
  Printer,
  Trash2,
  Edit3,
  Send,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Database,
  ArrowRight,
  Lightbulb,
  Check,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  MaslowEmployeePlan,
  FfcPraiseRecord,
  MaslowLevelNumber,
  CeoTabId,
} from '../../types/ceoTypes';
import { ErpStaffMember, ErpStageReport, ErpLsxOrder } from '../../types/erpTypes';
import { dialogService } from '../common/CustomDialog';
import { triggerPrint } from '../../utils/printUtils';
import { getLocalTodayYmd } from '../../utils/dateUtils';
import { erpService } from '../../services/erpService';
import {
  ceoAiService,
  AiMaslowConsultingResult,
  detectStaffRoleTier,
  StaffRoleTier,
} from '../../services/ceoAiService';

interface PeopleManagementViewProps {
  maslowPlans: MaslowEmployeePlan[];
  ffcPraises: FfcPraiseRecord[];
  onSaveMaslowPlan: (plan: MaslowEmployeePlan) => Promise<void> | void;
  onDeleteMaslowPlan: (id: string) => Promise<void> | void;
  onSaveFfcPraise: (praise: FfcPraiseRecord) => Promise<void> | void;
  onDeleteFfcPraise: (id: string) => Promise<void> | void;
  onNavigateTab: (tab: CeoTabId, subView?: string, prefill?: any) => void;
  activeUserName?: string;
  staffDirectory?: ErpStaffMember[];
  recentReports?: ErpStageReport[];
  lsxOrders?: ErpLsxOrder[];
}

export const PeopleManagementView: React.FC<PeopleManagementViewProps> = ({
  maslowPlans,
  ffcPraises,
  onSaveMaslowPlan,
  onDeleteMaslowPlan,
  onSaveFfcPraise,
  onDeleteFfcPraise,
  onNavigateTab,
  activeUserName = 'CEO',
  staffDirectory = [],
  recentReports = [],
  lsxOrders = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'MASLOW' | 'FFC'>('MASLOW');

  // Modal Maslow Plan
  const [maslowModalOpen, setMaslowModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MaslowEmployeePlan | null>(null);
  const [mName, setMName] = useState('');
  const [mDept, setMDept] = useState('Xưởng Sản Xuất');
  const [mRole, setMRole] = useState('Trưởng Ca / Thợ In');
  const [mDominant, setMDominant] = useState<MaslowLevelNumber>(3);
  const [mObservation, setMObservation] = useState('');
  const [mMotivation, setMMotivation] = useState('');
  const [mScores, setMScores] = useState({
    level1Physiological: 7,
    level2Safety: 7,
    level3Belonging: 6,
    level4Esteem: 5,
    level5SelfActualization: 4,
  });

  // Modal FFC Praise
  const [ffcModalOpen, setFfcModalOpen] = useState(false);
  const [pRecipient, setPRecipient] = useState('');
  const [pDept, setPDept] = useState('Sản xuất');
  const [pFeeling, setPFeeling] = useState('Tôi rất tự hào và an tâm');
  const [pFact, setPFact] = useState('');
  const [pCompare, setPCompare] = useState('');

  // ─── STATE AI CHẨN ĐOÁN MASLOW & TƯ VẤN HÀNH ĐỘNG CHO CEO ─────────────────
  const [selectedStaffName, setSelectedStaffName] = useState<string>('');
  const [staffObservationInput, setStaffObservationInput] = useState<string>('');
  const [analyzingAi, setAnalyzingAi] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AiMaslowConsultingResult | null>(null);
  const [modalAiLoading, setModalAiLoading] = useState<boolean>(false);

  // Danh sách nhân sự (ưu tiên từ staffDirectory ERP MVĐN)
  const availableStaffList = useMemo(() => {
    if (staffDirectory.length > 0) return staffDirectory;
    return [
      { id: 'st-01', name: 'Phạm Văn Hoàng Huy', department: 'Thiết kế & Kỹ thuật', role: 'Kỹ sư Thiết kế Khuôn & Chế bản' },
      { id: 'st-02', name: 'Nguyễn Thành Đạt', department: 'Xưởng Sản Xuất', role: 'Quản Lý Sản Xuất & Điều Phối Flexo' },
      { id: 'st-03', name: 'Trần Đình Trọng', department: 'Phòng Kỹ Thuật', role: 'Trưởng Bộ Phận Kỹ Thuật & Bảo Trì' },
      { id: 'st-04', name: 'Nguyễn Thị Lan', department: 'Phòng QA/QC', role: 'Trưởng Bộ Phận Quản Lý Chất Lượng' },
      { id: 'st-05', name: 'Lê Hải Đăng', department: 'Xưởng In Flexo', role: 'Kỹ thuật viên Trưởng máy Flexo 01' },
      { id: 'st-06', name: 'Lê Thị Mai', department: 'Phòng Kế Toán', role: 'Kế Toán Trưởng' },
    ];
  }, [staffDirectory]);

  // Thông tin tổng hợp ERP MVĐN về nhân sự đang được chọn
  const selectedStaffInfo = useMemo(() => {
    if (!selectedStaffName) return null;
    const staff = availableStaffList.find(
      (s) => s.name.toLowerCase() === selectedStaffName.toLowerCase()
    );
    const reports = recentReports.filter(
      (r) =>
        r.workerName?.toLowerCase() === selectedStaffName.toLowerCase() ||
        r.operatorName?.toLowerCase() === selectedStaffName.toLowerCase() ||
        r.assistantName?.toLowerCase() === selectedStaffName.toLowerCase()
    );
    const stages = Array.from(new Set(reports.map((r) => r.stage).filter(Boolean)));
    const lsxCodes = Array.from(new Set(reports.map((r) => r.lsxCode).filter(Boolean)));
    const totalFinished = reports.reduce(
      (acc, r) => acc + (Number(r.finishedQty) || Number(r.finishedNhip) || 0),
      0
    );
    const totalDefects = reports.reduce(
      (acc, r) => acc + (Number(r.defectQty) || Number(r.qtyHao) || 0),
      0
    );

    const role = staff?.role || 'Kỹ thuật viên / Thợ vận hành';
    const department = staff?.department || (stages.length > 0 ? 'Xưởng In & Bế Tem' : 'Khối Sản Xuất');
    const roleTier = detectStaffRoleTier(role, department);

    return {
      staff,
      name: staff?.name || selectedStaffName,
      department,
      role,
      roleTier,
      status: staff?.status || 'Official',
      reportsCount: reports.length,
      stages: stages.slice(0, 4),
      lsxCodes: lsxCodes.slice(0, 4),
      totalFinished,
      totalDefects,
      defectRate: totalFinished > 0 ? ((totalDefects / totalFinished) * 100).toFixed(1) : '0',
    };
  }, [selectedStaffName, availableStaffList, recentReports]);

  // Gợi ý quan sát theo từng cấp bậc (Quản lý vs Kỹ sư vs Thợ vận hành)
  const dynamicObservationSamples = useMemo(() => {
    const tier = selectedStaffInfo?.roleTier || 'OPERATOR';
    if (tier === 'MANAGEMENT') {
      return [
        {
          label: 'Thưởng khoán KPI xưởng (Tầng 1)',
          text: 'Mong muốn cơ chế thưởng khoán KPI xưởng và phụ cấp trách nhiệm điều hành minh bạch theo hiệu quả OEE.',
        },
        {
          label: 'Tự chủ quyền hạn & tránh vi mô (Tầng 2)',
          text: 'Cần ranh giới ủy quyền rõ ràng từ CEO, tránh can thiệp vi mô vượt cấp xuống thợ để bảo toàn uy tín điều hành xưởng.',
        },
        {
          label: 'Tin cậy & phối hợp liên phòng (Tầng 3)',
          text: 'Mong muốn sự tin cậy từ Ban Giám Đốc và sự phối hợp đồng bộ giữa khối Sản Xuất với Kế Toán, Thu Mua và Kế Hoạch.',
        },
        {
          label: 'Vị thế lãnh đạo & tiếng nói C-Level (Tầng 4)',
          text: 'Khao khát được CEO và Ban Giám Đốc ghi nhận vị thế người đứng đầu phân xưởng, lắng nghe tiếng nói chuyên môn trong các cuộc họp điều hành 3-6-9.',
        },
        {
          label: 'Kiến tạo SOP & công nghệ RFID (Tầng 5)',
          text: 'Chủ động đề xuất chuẩn hóa toàn bộ SOP quy trình xưởng in Flexo, khát khao làm chủ công nghệ tem RFID và bồi dưỡng đội ngũ thợ kế cận.',
        },
      ];
    }
    if (tier === 'SPECIALIST') {
      return [
        {
          label: 'Thu nhập & công cụ chuẩn (Tầng 1)',
          text: 'Quan tâm đến thu nhập chuyên môn và cần trang bị đầy đủ công cụ phần mềm thiết kế, máy đo màu chuẩn.',
        },
        {
          label: 'Chuẩn hóa quy trình kỹ thuật (Tầng 2)',
          text: 'Lo ngại rủi ro kỹ thuật chế bản bị lỗi khi chạy máy in, mong muốn có quy trình kiểm tra chéo và hợp đồng bảo đảm.',
        },
        {
          label: 'Hợp tác kỹ thuật & xưởng (Tầng 3)',
          text: 'Mong muốn sự thấu hiểu và phối hợp nhịp nhàng giữa phòng kỹ thuật, QA/QC và các tổ trưởng vận hành máy.',
        },
        {
          label: 'Tôn trọng giải pháp chuyên môn (Tầng 4)',
          text: 'Mong muốn năng lực chuyên môn và giải pháp kỹ thuật của mình được Ban Giám Đốc tôn trọng và đánh giá cao.',
        },
        {
          label: 'Nghiên cứu công nghệ vật liệu mới (Tầng 5)',
          text: 'Đam mê nghiên cứu các dòng tem nhãn phức tạp (RFID, tem bảo mật 7 màu), chủ động cải tiến thông số kỹ thuật.',
        },
      ];
    }
    return [
      {
        label: 'Lo lương & phụ cấp ca (Tầng 1)',
        text: 'Nhân sự hay hỏi về phụ cấp ca đêm, lo lắng chi tiêu gia đình và muốn có ca làm việc ổn định để đảm bảo thu nhập.',
      },
      {
        label: 'An toàn máy & sợ bị phạt (Tầng 2)',
        text: 'Nhân sự ngại nhận máy mới vì sợ hỏng decal bị phạt tiền, mong muốn được bảo hộ lao động và hợp đồng ổn định.',
      },
      {
        label: 'Gắn kết đồng đội trong ca (Tầng 3)',
        text: 'Nhân sự ít nói, cảm thấy chưa hòa nhập với thợ cũ trong ca, cần được lắng nghe và có người kèm cặp hỗ trợ tay nghề.',
      },
      {
        label: 'Khen ngợi tay nghề FFC (Tầng 4)',
        text: 'Tay nghề thợ in/bế rất vững, giải quyết được nhiều ca máy khó, mong muốn được Quản đốc và CEO ghi nhận công khai theo FFC.',
      },
      {
        label: 'Sáng kiến thao tác giảm phế phẩm (Tầng 5)',
        text: 'Chủ động đề xuất cách căn chỉnh dao bế và lắp cuộn decal để giảm hao hụt nguyên liệu, tích cực học hỏi kỹ năng mới.',
      },
    ];
  }, [selectedStaffInfo?.roleTier]);

  const observationPlaceholder = useMemo(() => {
    const tier = selectedStaffInfo?.roleTier;
    if (tier === 'MANAGEMENT') {
      return 'Nhập ghi nhận về cấp quản lý: Ví dụ: Cần sự ủy quyền rõ ràng, tránh can thiệp vi mô; mong muốn cơ chế thưởng khoán theo OEE toàn xưởng; chủ động đề xuất chuẩn hóa SOP quy trình...';
    }
    if (tier === 'SPECIALIST') {
      return 'Nhập ghi nhận về kỹ sư / chuyên viên: Ví dụ: Cần công cụ đo kiểm chuẩn, mong muốn được tôn trọng giải pháp kỹ thuật, phối hợp liên phòng ban nhịp nhàng...';
    }
    return 'Nhập ghi nhận thực tế của CEO/Quản lý: Ví dụ: Hay than thở chuyện lương thưởng, nợ nần; hoặc: Có tay nghề in rất cao, muốn tự chủ thông số máy và được khen ngợi; hoặc: Đang bất an về máy mới...';
  }, [selectedStaffInfo?.roleTier]);

  // ─── THỰC HIỆN CHẨN ĐOÁN MASLOW VỚI AI GEMINI ──────────────────────────────
  const handleRunAiMaslowDiagnosis = async () => {
    if (!selectedStaffName) {
      dialogService.toast('Vui lòng chọn nhân sự cần chẩn đoán tâm lý & động lực.', 'warning');
      return;
    }
    if (!staffObservationInput.trim()) {
      dialogService.toast('Vui lòng nhập các biểu hiện quan sát, lời nói hoặc tâm tư ghi nhận được.', 'warning');
      return;
    }

    setAnalyzingAi(true);
    try {
      const res = await ceoAiService.analyzeEmployeeMaslowNeeds({
        employeeName: selectedStaffName,
        department: selectedStaffInfo?.department || 'Xưởng Sản Xuất',
        role: selectedStaffInfo?.role || 'Nhân sự',
        roleTier: selectedStaffInfo?.roleTier,
        observations: staffObservationInput,
        erpContext:
          selectedStaffInfo?.roleTier === 'OPERATOR' && (selectedStaffInfo?.reportsCount || 0) > 0
            ? {
                status: selectedStaffInfo?.status,
                totalReports: selectedStaffInfo?.reportsCount,
                recentStages: selectedStaffInfo?.stages as string[],
                recentLsxCodes: selectedStaffInfo?.lsxCodes as string[],
                outputSummary: selectedStaffInfo?.totalFinished
                  ? `Tổng sản lượng đạt: ${selectedStaffInfo.totalFinished.toLocaleString()} tem.`
                  : '',
                defectSummary: selectedStaffInfo?.defectRate
                  ? `Tỷ lệ hao hụt: ${selectedStaffInfo.defectRate}%.`
                  : '',
              }
            : undefined,
      });

      setAiResult(res);
      dialogService.toast(`AI đã hoàn thành phân tích: Tầng ${res.dominantNeedLevel} - ${res.levelName}!`, 'success');
    } catch {
      dialogService.toast('Không thể hoàn tất phân tích AI, vui lòng thử lại.', 'warning');
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Lưu kết quả AI vào Hồ sơ Động lực Maslow
  const handleSaveAiResultToMaslowPlan = async () => {
    if (!aiResult || !selectedStaffName) return;

    const existingIndex = maslowPlans.findIndex(
      (p) => p.employeeName.toLowerCase() === selectedStaffName.toLowerCase()
    );

    const payload: MaslowEmployeePlan = {
      id: existingIndex >= 0 ? maslowPlans[existingIndex].id : `maslow-${Date.now()}`,
      employeeName: selectedStaffName,
      department: selectedStaffInfo?.department || 'Xưởng Sản Xuất',
      role: selectedStaffInfo?.role || 'Nhân sự',
      dominantNeedLevel: aiResult.dominantNeedLevel,
      satisfactionScores: aiResult.satisfactionScores,
      currentObservation: staffObservationInput.trim(),
      motivationAction: aiResult.ceoActionPlan.trim(),
      nextCheckInDate: getLocalTodayYmd(),
      createdAt: existingIndex >= 0 ? maslowPlans[existingIndex].createdAt : new Date().toISOString(),
    };

    await onSaveMaslowPlan(payload);
    dialogService.toast(`Đã lưu hồ sơ động lực Maslow cho ${selectedStaffName} thành công!`, 'success');
  };

  // Chuyển sang khen ngợi FFC nhanh từ gợi ý của AI
  const handleQuickFfcFromAi = () => {
    if (!aiResult || !selectedStaffName) return;
    setPRecipient(selectedStaffName);
    setPDept(selectedStaffInfo?.department || 'Sản xuất');
    setPFeeling('Tôi rất trân trọng và tự hào về tinh thần trách nhiệm của');
    setPFact(aiResult.suggestedPraiseHint || `đã chủ động xử lý tốt công việc trong các ca máy ERP gần đây`);
    setPCompare('tạo động lực tích cực và lan tỏa tinh thần làm việc chất lượng cao cho toàn ca.');
    setActiveSubTab('FFC');
    setFfcModalOpen(true);
  };

  // Trợ lý AI tự động điền trong Modal
  const handleAiAutoFillModal = async () => {
    if (!mName.trim()) {
      dialogService.toast('Vui lòng nhập tên nhân sự trước.', 'warning');
      return;
    }
    if (!mObservation.trim()) {
      dialogService.toast('Vui lòng nhập một số biểu hiện quan sát được vào ô tâm tư.', 'warning');
      return;
    }

    setModalAiLoading(true);
    try {
      const roleTier = detectStaffRoleTier(mRole, mDept);
      const res = await ceoAiService.analyzeEmployeeMaslowNeeds({
        employeeName: mName,
        department: mDept,
        role: mRole,
        roleTier,
        observations: mObservation,
      });

      setMDominant(res.dominantNeedLevel);
      setMMotivation(res.ceoActionPlan);
      setMScores(res.satisfactionScores);
      dialogService.toast(`AI đã chẩn đoán Tầng ${res.dominantNeedLevel} và đề xuất hành động!`, 'success');
    } catch {
      dialogService.toast('Không thể phân tích, vui lòng thử lại.', 'warning');
    } finally {
      setModalAiLoading(false);
    }
  };

  const openCreateMaslow = () => {
    setEditingPlan(null);
    setMName('');
    setMDept('Xưởng Sản Xuất');
    setMRole('Kỹ thuật viên / Thợ in');
    setMDominant(3);
    setMObservation('');
    setMMotivation('');
    setMScores({
      level1Physiological: 7,
      level2Safety: 7,
      level3Belonging: 6,
      level4Esteem: 5,
      level5SelfActualization: 4,
    });
    setMaslowModalOpen(true);
  };

  const openEditMaslow = (plan: MaslowEmployeePlan) => {
    setEditingPlan(plan);
    setMName(plan.employeeName);
    setMDept(plan.department);
    setMRole(plan.role);
    setMDominant(plan.dominantNeedLevel);
    setMObservation(plan.currentObservation || '');
    setMMotivation(plan.motivationAction || '');
    setMScores(
      plan.satisfactionScores || {
        level1Physiological: 7,
        level2Safety: 7,
        level3Belonging: 6,
        level4Esteem: 5,
        level5SelfActualization: 4,
      }
    );
    setMaslowModalOpen(true);
  };

  const handleQuickFfcForStaff = (staffName: string, role?: string) => {
    setPRecipient(staffName);
    setPDept(role || 'Nhân sự');
    setPFeeling('Tôi rất trân trọng và tự hào về tinh thần trách nhiệm của');
    setPFact('đã luôn chủ động và nỗ lực hoàn thành xuất sắc nhiệm vụ được giao');
    setPCompare('tạo động lực tích cực và lan tỏa tinh thần làm việc chất lượng cao cho toàn thể bộ phận.');
    setActiveSubTab('FFC');
    setFfcModalOpen(true);
  };

  const handleSchedule1on1Meeting = (plan: MaslowEmployeePlan) => {
    onNavigateTab('meetings', undefined, {
      title: `Gặp 1-1 Tạo Động Lực: ${plan.employeeName} (${plan.role})`,
      assignee: plan.employeeName,
    });
    dialogService.toast(`Đã chuyển sang phòng Họp 3-6-9 để chuẩn bị kịch bản gặp 1-1 với ${plan.employeeName}!`, 'info');
  };

  const handleCreateSmartTask = (plan: MaslowEmployeePlan) => {
    onNavigateTab('smart', undefined, {
      title: `Mục tiêu tạo động lực & trao quyền: ${plan.employeeName}`,
      assignee: plan.employeeName,
    });
    dialogService.toast(`Đã chuyển sang Mục Tiêu SMART để giao việc cho ${plan.employeeName}!`, 'info');
  };

  const openCreateFfc = () => {
    setPRecipient('');
    setPDept('Sản xuất');
    setPFeeling('Tôi rất tự hào và an tâm khi thấy sự chủ động của');
    setPFact('đã xử lý sự cố máy in Flexo đúng hạn giao hàng cho khách hàng FDI');
    setPCompare('nhanh hơn 2 giờ so với quy trình trước đây, tạo động lực rất lớn cho toàn ca.');
    setFfcModalOpen(true);
  };

  const handleSaveMaslow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) {
      dialogService.toast('Vui lòng nhập tên nhân sự cần huấn luyện/định hướng.', 'warning');
      return;
    }

    const payload: MaslowEmployeePlan = {
      id: editingPlan ? editingPlan.id : `maslow-${Date.now()}`,
      employeeName: mName.trim(),
      department: mDept.trim(),
      role: mRole.trim(),
      dominantNeedLevel: mDominant,
      satisfactionScores: mScores,
      currentObservation: mObservation.trim(),
      motivationAction: mMotivation.trim(),
      nextCheckInDate: getLocalTodayYmd(),
      createdAt: editingPlan?.createdAt || new Date().toISOString(),
    };

    await onSaveMaslowPlan(payload);
    setMaslowModalOpen(false);
    dialogService.toast(editingPlan ? 'Đã cập nhật kế hoạch Maslow!' : 'Đã lưu hồ sơ động lực Maslow!', 'success');
  };

  const handleSaveFfc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pRecipient.trim() || !pFact.trim()) {
      dialogService.toast('Vui lòng nhập tên người được khen và sự thật cụ thể (Fact).', 'warning');
      return;
    }

    const payload: FfcPraiseRecord = {
      id: `ffc-${Date.now()}`,
      recipientName: pRecipient.trim(),
      department: pDept.trim(),
      feeling: pFeeling.trim(),
      fact: pFact.trim(),
      compare: pCompare.trim(),
      sentToErp: false,
      createdAt: new Date().toISOString(),
    };

    await onSaveFfcPraise(payload);
    setFfcModalOpen(false);
    dialogService.toast(`Đã ghi nhận lời khen FFC cho ${pRecipient}!`, 'success');
  };

  const handlePublishFfcToErp = async (praise: FfcPraiseRecord) => {
    try {
      await erpService.publishAnnouncement({
        title: `🏆 [KHEN NGỢI TỪ CEO] Tuyên dương ${praise.recipientName} (${praise.department})`,
        content: `Ban Giám Đốc ghi nhận và biểu dương thành tích xuất sắc của ${praise.recipientName}:\n\n❤️ CẢM XÚC LÃNH ĐẠO (Feeling): "${praise.feeling}"\n\n📌 SỰ THẬT & HÀNH VI (Fact): ${praise.fact}\n\n🌟 SO SÁNH & LAN TỎA (Compare): ${praise.compare}`,
        category: 'PRAISE',
        targetType: 'ALL',
        targetValue: 'ALL',
        requireAck: false,
        publisherName: activeUserName,
      });

      await onSaveFfcPraise({ ...praise, sentToErp: true });
      dialogService.toast(`Đã đăng vinh danh "${praise.recipientName}" lên bảng tin ERP MVĐN!`, 'success');
    } catch {
      dialogService.toast('Không thể gửi khen ngợi lên ERP, vui lòng kiểm tra kết nối mạng.', 'warning');
    }
  };

  const maslowLevelLabels = [
    { level: 5, name: 'Cấp 5: Tự Khẳng Định & Cống Hiến (Self-Actualization)', desc: 'Phát huy tiềm năng tối đa, sáng tạo, dẫn dắt đổi mới' },
    { level: 4, name: 'Cấp 4: Tôn Trọng & Ghi Nhận (Esteem)', desc: 'Được ghi nhận năng lực, tự chủ, tôn trọng vị thế' },
    { level: 3, name: 'Cấp 3: Gắn Kết & Hòa Nhập (Belonging)', desc: 'Được hòa đồng vào tập thể, làm việc nhóm, chia sẻ' },
    { level: 2, name: 'Cấp 2: An Toàn & Ổn Định (Safety)', desc: 'Ổn định công việc, thu nhập đảm bảo, an toàn lao động' },
    { level: 1, name: 'Cấp 1: Nhu Cầu Thiết Yếu (Physiological)', desc: 'Lương đủ sống, nghỉ ngơi hợp lý, điều kiện làm việc' },
  ];

  return (
    <div id="people-print-section" className="space-y-4">
      {/* SUB-TABS SWITCHER & THANH THAO TÁC (Không lặp lại tiêu đề từ Header bar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('MASLOW')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
              activeSubTab === 'MASLOW'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tháp Động Lực Maslow ({maslowPlans.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('FFC')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
              activeSubTab === 'FFC'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Văn Hóa Khen Ngợi FFC ({ffcPraises.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 no-print shrink-0">
          <button
            onClick={() => triggerPrint('people-print-section', 'ProCEO_People_Report')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In Báo Cáo</span>
          </button>
          {activeSubTab === 'MASLOW' ? (
            <button
              onClick={openCreateMaslow}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 text-white cursor-pointer shadow-xs transition-transform active:scale-95 bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Hồ Sơ Maslow</span>
            </button>
          ) : (
            <button
              onClick={openCreateFfc}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 text-white cursor-pointer shadow-xs transition-transform active:scale-95 bg-slate-900 hover:bg-slate-800"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>+ Khen Ngợi FFC</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: MASLOW PYRAMID & PLANS */}
      {activeSubTab === 'MASLOW' && (
        <div className="space-y-4">
          {/* THÁP MASLOW TRỰC QUAN 5 TẦNG */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-sm text-[#14283F] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C6A66B]" />
              <span>Mô Hình 5 Tầng Nhu Cầu Maslow Ứng Dụng Trong Quản Trị</span>
            </h3>

            <div className="space-y-1.5 max-w-2xl mx-auto py-2">
              {maslowLevelLabels.map((lvl) => {
                const countAtThisLevel = maslowPlans.filter((p) => p.dominantNeedLevel === lvl.level).length;
                const widthPercent = 60 + (5 - lvl.level) * 10;

                return (
                  <div
                    key={lvl.level}
                    className="mx-auto rounded-xl p-2.5 text-center text-xs transition-transform hover:scale-[1.01] shadow-2xs border"
                    style={{
                      width: `${widthPercent}%`,
                      background:
                        lvl.level === 5
                          ? '#14283F'
                          : lvl.level === 4
                          ? '#1E3A5F'
                          : lvl.level === 3
                          ? '#2C4F7C'
                          : lvl.level === 2
                          ? '#3B6498'
                          : '#537FB5',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <div className="font-bold flex items-center justify-between px-2">
                      <span className="truncate">{lvl.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/20 font-bold shrink-0">
                        {countAtThisLevel} nhân sự
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-200 truncate mt-0.5">{lvl.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* 2. KHỐI AI CHẨN ĐOÁN MASLOW & TƯ VẤN HÀNH ĐỘNG CHO CEO (ERP MVĐN)   */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <div className="glass-liquid p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                      AI Chẩn Đoán Nhu Cầu Maslow & Tư Vấn Hành Động Cho CEO
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ERP MVĐN Realtime
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Chọn nhân sự và nhập biểu hiện quan sát. Trợ lý AI sẽ đối chiếu dữ liệu ca kíp ERP để chẩn đoán tầng tâm lý và tư vấn cách điều hành cho CEO.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* CỘT TRÁI (6/12): INPUT CHỌN NHÂN SỰ & BIỂU HIỆN QUAN SÁT */}
              <div className="lg:col-span-6 space-y-3">
                {/* 1. Chọn Nhân Sự */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>1. Chọn nhân sự từ danh bạ ERP MVĐN:</span>
                    <span className="text-[10.5px] font-normal text-slate-500">
                      ({availableStaffList.length} nhân sự)
                    </span>
                  </label>
                  <select
                    value={selectedStaffName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setSelectedStaffName(name);
                      setAiResult(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Bấm chọn nhân sự cần phân tích tâm lý --</option>
                    {availableStaffList.map((s) => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name} — {s.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ERP Live Context Pill */}
                {selectedStaffInfo && (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-slate-600" />
                        {selectedStaffInfo.name} — {selectedStaffInfo.role}
                      </span>
                      {selectedStaffInfo.roleTier === 'MANAGEMENT' && (
                        <span className="px-2 py-0.5 rounded font-bold text-[9.5px] bg-indigo-100 text-indigo-800 border border-indigo-200">
                          🎖️ Cấp Quản Lý Điều Hành
                        </span>
                      )}
                      {selectedStaffInfo.roleTier === 'SPECIALIST' && (
                        <span className="px-2 py-0.5 rounded font-bold text-[9.5px] bg-cyan-100 text-cyan-800 border border-cyan-200">
                          🔬 Cấp Kỹ Sư & Chuyên Môn
                        </span>
                      )}
                      {selectedStaffInfo.roleTier === 'OPERATOR' && (
                        <span className="px-2 py-0.5 rounded font-bold text-[9.5px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ⚙️ Cấp Thợ Máy / Vận Hành
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Nhập Biểu Hiện Quan Sát Được */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    2. Biểu hiện quan sát, lời nói & tâm tư ghi nhận được:
                  </label>
                  <textarea
                    value={staffObservationInput}
                    onChange={(e) => setStaffObservationInput(e.target.value)}
                    rows={3}
                    placeholder={observationPlaceholder}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 leading-relaxed bg-white"
                  />
                </div>

                {/* Gợi Ý Nhanh 5 Nhóm Biểu Hiện Điển Hình Theo Chức Vụ */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block">
                      Mẫu biểu hiện thường gặp (bấm để thêm nhanh):
                    </span>
                    {selectedStaffInfo && (
                      <span className="text-[9.5px] font-bold text-slate-500">
                        Phù hợp: {selectedStaffInfo.roleTier === 'MANAGEMENT' ? '🎖️ Cấp Quản Lý' : selectedStaffInfo.roleTier === 'SPECIALIST' ? '🔬 Kỹ Sư / Chuyên Viên' : '⚙️ Thợ Vận Hành'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dynamicObservationSamples.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setStaffObservationInput((prev) =>
                            prev ? `${prev}. ${sample.text}` : sample.text
                          );
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        + {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nút Kích Hoạt Phân Tích AI */}
                <button
                  type="button"
                  onClick={handleRunAiMaslowDiagnosis}
                  disabled={analyzingAi || !selectedStaffName}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                  }}
                >
                  <Sparkles className={`w-4 h-4 text-emerald-400 ${analyzingAi ? 'animate-spin' : ''}`} />
                  <span>
                    {analyzingAi
                      ? 'AI đang tổng hợp dữ liệu ERP & chẩn đoán...'
                      : 'AI Chẩn Đoán Maslow & Tư Vấn Hành Động CEO'}
                  </span>
                </button>
              </div>

              {/* CỘT PHẢI (6/12): KẾT QUẢ PHÂN TÍCH & TƯ VẤN HÀNH ĐỘNG CHO CEO */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                {aiResult ? (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 animate-fadeIn">
                    {/* Header kết quả: Tầng Maslow */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Tầng Nhu Cầu Nổi Trội Hiện Tại
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white font-mono font-black text-xs">
                            CẤP {aiResult.dominantNeedLevel} / 5
                          </span>
                          <span className="font-extrabold text-sm text-slate-900">
                            {aiResult.levelName}
                          </span>
                          {aiResult.roleTierDetected === 'MANAGEMENT' && (
                            <span className="px-2 py-0.5 rounded font-bold text-[9.5px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              🎖️ Vị Thế Quản Lý
                            </span>
                          )}
                          {aiResult.roleTierDetected === 'SPECIALIST' && (
                            <span className="px-2 py-0.5 rounded font-bold text-[9.5px] bg-cyan-50 text-cyan-700 border border-cyan-200">
                              🔬 Vị Thế Kỹ Sư / Chuyên Môn
                            </span>
                          )}
                          {aiResult.roleTierDetected === 'OPERATOR' && (
                            <span className="px-2 py-0.5 rounded font-bold text-[9.5px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ⚙️ Thợ Vận Hành Trực Tiếp
                            </span>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    </div>

                    {/* Thanh Trực Quan 5 Tầng */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-5 gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-2 rounded-full transition-all ${
                              lvl === aiResult.dominantNeedLevel
                                ? 'bg-emerald-500 shadow-xs ring-2 ring-emerald-300'
                                : lvl < aiResult.dominantNeedLevel
                                ? 'bg-slate-300'
                                : 'bg-slate-100'
                            }`}
                            title={`Tầng ${lvl}`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
                        <span>1. Thiết yếu</span>
                        <span>2. An toàn</span>
                        <span>3. Gắn kết</span>
                        <span>4. Tôn trọng</span>
                        <span>5. Cống hiến</span>
                      </div>
                    </div>

                    {/* Luận Giải Logic */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Luận giải tâm lý từ AI:</span>
                      </div>
                      <p className="text-[11.5px] text-slate-600 leading-relaxed">
                        {aiResult.analysisReasoning}
                      </p>
                    </div>

                    {/* Hướng Hành Động Cho CEO */}
                    <div className="p-3 rounded-xl bg-slate-900 text-white space-y-1.5 text-xs shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-extrabold text-emerald-400 text-[11px] uppercase tracking-wide">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Hướng Hành Động Khuyên Dùng Cho CEO:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlan(null);
                            setMName(selectedStaffName);
                            setMDept(selectedStaffInfo?.department || 'Xưởng');
                            setMRole(selectedStaffInfo?.role || 'Nhân sự');
                            setMDominant(aiResult.dominantNeedLevel);
                            setMObservation(staffObservationInput);
                            setMMotivation(aiResult.ceoActionPlan);
                            setMScores(aiResult.satisfactionScores);
                            setMaslowModalOpen(true);
                          }}
                          className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Chỉnh sửa hành động trước khi lưu"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-400" />
                          <span>Chỉnh sửa hành động</span>
                        </button>
                      </div>
                      <p className="text-[11.5px] text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                        {aiResult.ceoActionPlan}
                      </p>
                    </div>

                    {/* Nút Thao Tác 1-Click */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleQuickFfcFromAi}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Khen Ngợi FFC Theo Gợi Ý</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAiResultToMaslowPlan}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lưu Vào Hồ Sơ Động Lực</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[220px] rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
                      <Sparkles className="w-5 h-5 text-emerald-500/60" />
                    </div>
                    <div className="space-y-0.5 max-w-sm">
                      <div className="font-bold text-xs text-slate-700">
                        Chưa có kết quả chẩn đoán
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Hãy chọn một nhân sự bên trái, nhập các biểu hiện quan sát và bấm &quot;AI Chẩn Đoán Maslow&quot; để nhận bảng phân tích tầng nhu cầu và kế hoạch hành động chi tiết dành riêng cho CEO.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DANH SÁCH HỒ SƠ NHÂN SỰ HUẤN LUYỆN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Hồ Sơ Nhu Cầu & Kế Hoạch Động Lực ({maslowPlans.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {maslowPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{plan.employeeName}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {plan.role}
                      </p>
                    </div>
                    {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={() => openEditMaslow(plan)}
                        title="Chỉnh sửa hồ sơ & hành động"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMaslowPlan(plan.id)}
                        title="Xóa hồ sơ"
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Nhu cầu trọng tâm:</span>
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800">
                        Tầng {plan.dominantNeedLevel} / 5
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] space-y-1">
                      <strong className="text-slate-700 block">Tâm tư / Biểu hiện quan sát:</strong>
                      <p className="text-slate-600 italic leading-snug whitespace-pre-line">
                        {plan.currentObservation || 'Chưa ghi chú biểu hiện.'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-amber-900 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#C6A66B]" />
                          Hành động tạo động lực của CEO:
                        </strong>
                        <button
                          type="button"
                          onClick={() => openEditMaslow(plan)}
                          className="text-[10.5px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Bấm để chỉnh sửa hành động cho phù hợp"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Chỉnh sửa</span>
                        </button>
                      </div>
                      <p className="text-slate-800 leading-snug whitespace-pre-line">
                        {plan.motivationAction || 'Chưa thiết lập hành động tạo động lực.'}
                      </p>
                    </div>

                    {/* BƯỚC THỰC THI TIẾP THEO CỦA CEO */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Bước thực thi kế tiếp của CEO:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSchedule1on1Meeting(plan)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Lên kịch bản họp 1-1 / giao ban 3-6-9 để lắng nghe & ủy quyền"
                        >
                          <span>🤝</span>
                          <span className="truncate">Họp 1-1 / 3-6-9</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateSmartTask(plan)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Giao mục tiêu SMART đo lường được cho nhân sự"
                        >
                          <span>🎯</span>
                          <span className="truncate">Giao việc SMART</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickFfcForStaff(plan.employeeName, plan.role)}
                          className="px-2 py-1.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 text-[10.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Gửi lời khen ngợi FFC công khai cho nhân sự"
                        >
                          <span>🏆</span>
                          <span className="truncate">Khen ngợi FFC</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          </div>
      )}

      {/* VIEW 2: FFC RECOGNITION & PRAISE */}
      {activeSubTab === 'FFC' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1">
            <span className="font-extrabold flex items-center gap-1.5 text-sm text-amber-900">
              <Award className="w-4 h-4 text-amber-700" />
              Công Thức Khen Ngợi FFC Của Lãnh Đạo
            </span>
            <p className="text-slate-700 leading-relaxed">
              <strong>Feeling (Cảm xúc):</strong> Thể hiện sự tự hào, an tâm hoặc trân trọng chân thành •{' '}
              <strong>Fact (Sự thật):</strong> Nêu rõ sự việc, con số, hành động cụ thể không nói chung chung •{' '}
              <strong>Compare (So sánh):</strong> So sánh với trước đây hoặc chuẩn mực để thấy sự tiến bộ và lan tỏa tinh thần.
            </p>
          </div>

          <div className="space-y-3">
            {ffcPraises.map((praise) => (
              <div
                key={praise.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs group hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#C6A66B]" />
                    <h4 className="font-black text-sm text-[#14283F]">{praise.recipientName}</h4>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                      {praise.department}
                    </span>
                    {praise.sentToErp && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã đăng ERP
                      </span>
                    )}
                  </div>

                  {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                    {!praise.sentToErp && (
                      <button
                        onClick={() => handlePublishFfcToErp(praise)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Vinh danh ERP</span>
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteFfcPraise(praise.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 space-y-0.5">
                    <span className="font-extrabold text-rose-800 text-[10px] uppercase">F – Feeling (Cảm xúc)</span>
                    <p className="text-slate-800 font-medium">{praise.feeling}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-0.5">
                    <span className="font-extrabold text-blue-800 text-[10px] uppercase">F – Fact (Sự thật & Số liệu)</span>
                    <p className="text-slate-800 font-medium">{praise.fact}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-0.5">
                    <span className="font-extrabold text-emerald-800 text-[10px] uppercase">C – Compare (So sánh & Lan tỏa)</span>
                    <p className="text-slate-800 font-medium">{praise.compare}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA HỒ SƠ MASLOW (KHÔNG GIAN LÀM VIỆC MỞ RỘNG TOÀN DIỆN 2 CỘT) */}
      {maslowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-[96vw] max-w-7xl max-h-[94vh] p-5 sm:p-7 shadow-2xl border border-slate-200 my-auto animate-scaleUp flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-5 h-5 text-[#C6A66B]" />
                </span>
                <div>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <span>{editingPlan ? `Chỉnh Sửa Kế Hoạch Động Lực: ${editingPlan.employeeName}` : 'Thiết Lập Kế Hoạch Động Lực Maslow'}</span>
                    {editingPlan && (
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {editingPlan.role}
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Không gian làm việc mở rộng: Đối chiếu biểu hiện tâm lý bên trái và tinh chỉnh toàn bộ các bước hành động điều hành của CEO bên phải.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMaslowModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-base font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMaslow} className="flex-1 flex flex-col overflow-y-auto pr-1 py-3 space-y-4">
              {/* BỐ CỤC 2 CỘT CHUYÊN NGHIỆP: TRÁI (THÔNG TIN & TÂM TƯ) — PHẢI (HÀNH ĐỘNG CEO) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
                {/* CỘT TRÁI (5/12): THÔNG TIN NHÂN SỰ, TẦNG MASLOW & BIỂU HIỆN QUAN SÁT */}
                <div className="lg:col-span-5 flex flex-col gap-3.5">
                  {/* Nhóm 1: Tên & Chức vụ */}
                  <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-xs">
                        Họ tên nhân sự (ERP MVĐN) *
                      </label>
                      <input
                        type="text"
                        list="mvdn-staff-list"
                        value={mName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMName(val);
                          const match = staffDirectory.find(
                            (s) => s.name.toLowerCase() === val.toLowerCase()
                          );
                          if (match) {
                            if (match.role) setMRole(match.role);
                            if (match.department) setMDept(match.department);
                          }
                        }}
                        placeholder="Gõ để tìm nhân sự..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        required
                      />
                      <datalist id="mvdn-staff-list">
                        {staffDirectory.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.role}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-xs">Vị trí / Chức vụ</label>
                      <input
                        type="text"
                        value={mRole}
                        onChange={(e) => setMRole(e.target.value)}
                        placeholder="Quản lý / Kỹ sư / Thợ..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                  </div>

                  {/* Nhóm 2: Tầng nhu cầu Maslow */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <label className="font-bold text-slate-700 block text-xs">
                      Tầng nhu cầu nổi trội hiện tại:
                    </label>
                    <select
                      value={mDominant}
                      onChange={(e) => setMDominant(Number(e.target.value) as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
                    >
                      <option value={1}>Tầng 1: Nhu cầu Sinh lý (Lương, đãi ngộ, mưu sinh ca kíp)</option>
                      <option value={2}>Tầng 2: Nhu cầu An toàn (Quyền hạn, tránh vi mô, việc làm ổn định)</option>
                      <option value={3}>Tầng 3: Nhu cầu Xã hội (Tin cậy, hòa hợp đội ngũ & liên phòng ban)</option>
                      <option value={4}>Tầng 4: Nhu cầu Tôn trọng (Vị thế lãnh đạo, ghi nhận năng lực, khen FFC)</option>
                      <option value={5}>Tầng 5: Nhu cầu Tự thể hiện (Sáng kiến đổi mới, kiến tạo quy trình SOP)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 italic">
                      {mDominant === 1 && '• Tập trung đảm bảo thu nhập xứng đáng, phụ cấp và giảm gánh nặng mưu sinh.'}
                      {mDominant === 2 && '• Cần sự ủy quyền rõ ràng, tránh can thiệp vi mô/vượt cấp làm suy giảm uy tín quản lý.'}
                      {mDominant === 3 && '• Cần môi trường tin cậy, lắng nghe và hợp tác nhịp nhàng liên phòng ban.'}
                      {mDominant === 4 && '• Khao khát vị thế người đứng đầu, được lắng nghe tiếng nói chuyên môn trong giao ban 3-6-9.'}
                      {mDominant === 5 && '• Trao quyền kiến tạo SOP, dẫn dắt công nghệ tem RFID và đào tạo thế hệ kế cận.'}
                    </p>
                  </div>

                  {/* Nhóm 3: Tâm tư / Biểu hiện quan sát */}
                  <div className="flex-1 flex flex-col p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Tâm tư / Biểu hiện quan sát được:</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAiAutoFillModal}
                        disabled={modalAiLoading}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50 shadow-2xs"
                        title="Nhờ AI Gemini chẩn đoán lại từ biểu hiện quan sát"
                      >
                        <Sparkles className={`w-3 h-3 text-emerald-600 ${modalAiLoading ? 'animate-spin' : ''}`} />
                        <span>{modalAiLoading ? 'AI đang phân tích...' : '✨ AI Chẩn đoán lại'}</span>
                      </button>
                    </div>
                    <textarea
                      value={mObservation}
                      onChange={(e) => setMObservation(e.target.value)}
                      rows={6}
                      placeholder="Ghi nhận cụ thể phát ngôn, tâm tư, sự cố hoặc biểu hiện của nhân sự..."
                      className="w-full flex-1 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
                    />
                  </div>
                </div>

                {/* CỘT PHẢI (7/12): KHÔNG GIAN SOẠN THẢO HÀNH ĐỘNG TẠO ĐỘNG LỰC CỦA CEO */}
                <div className="lg:col-span-7 flex flex-col p-4 rounded-xl bg-slate-50/70 border border-slate-200/90 h-full">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <label className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        Hành Động Tạo Động Lực Của CEO (Kế Hoạch Thực Thi):
                      </label>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Hiển thị toàn bộ các bước 1, 2, 3, 4 không bị che khuất
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={mMotivation}
                      onChange={(e) => setMMotivation(e.target.value)}
                      rows={14}
                      placeholder="Nhập chi tiết các bước hành động điều hành cụ thể của CEO:
1. Gặp gỡ 1-1: Xác nhận phạm vi ủy quyền điều hành, cam kết không can thiệp vi mô...
2. Xây dựng cơ chế an toàn: Cho phép thử nghiệm công nghệ/phương án mới có kiểm soát...
3. Hỗ trợ & Giải pháp linh hoạt: Tháo gỡ khó khăn cá nhân hoặc gia đình...
4. Ghi nhận & Thưởng KPI: Gắn chỉ tiêu OEE và thưởng % trên chi phí tiết kiệm được..."
                      className="w-full flex-1 min-h-[380px] lg:min-h-[460px] p-4 rounded-xl border border-slate-200 text-xs sm:text-[13px] text-slate-800 leading-relaxed font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white shadow-2xs transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="p-1 rounded bg-slate-100 text-slate-600 font-bold">Mẹo CEO</span>
                  <span>Sau khi lưu, bạn có thể bấm 1-click để chuyển ngay sang phòng Họp 1-1 (3-6-9) hoặc giao việc SMART.</span>
                </div>
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMaslowModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-sm transition-transform active:scale-95"
                  >
                    {editingPlan ? 'Cập Nhật Kế Hoạch' : 'Lưu Hồ Sơ Động Lực'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GHI NHẬN FFC */}
      {ffcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-black text-sm text-[#14283F]">Ghi Nhận Lời Khen FFC</h4>
              <button
                onClick={() => setFfcModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFfc} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Người nhận lời khen (ERP MVĐN) *
                  </label>
                  <input
                    type="text"
                    list="mvdn-staff-list"
                    value={pRecipient}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPRecipient(val);
                      const match = staffDirectory.find(
                        (s) => s.name.toLowerCase() === val.toLowerCase()
                      );
                      if (match && match.department) {
                        setPDept(match.department);
                      }
                    }}
                    placeholder="Gõ để tìm nhân sự..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bộ phận</label>
                  <input
                    type="text"
                    value={pDept}
                    onChange={(e) => setPDept(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-rose-800 block mb-1">
                  F1 – Feeling (Cảm xúc chân thành của CEO) *
                </label>
                <input
                  type="text"
                  value={pFeeling}
                  onChange={(e) => setPFeeling(e.target.value)}
                  placeholder="Tôi rất tự hào / Tôi rất an tâm khi thấy..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-blue-800 block mb-1">
                  F2 – Fact (Sự thật & Hành động cụ thể đạt được) *
                </label>
                <textarea
                  value={pFact}
                  onChange={(e) => setPFact(e.target.value)}
                  rows={2}
                  placeholder="Đã xử lý 3 sự cố máy in liên tục, hoàn thành vượt 15% định mức..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-emerald-800 block mb-1">
                  C – Compare (So sánh với trước đây / Giá trị lan tỏa) *
                </label>
                <textarea
                  value={pCompare}
                  onChange={(e) => setPCompare(e.target.value)}
                  rows={2}
                  placeholder="Nhanh hơn 2 giờ so với tháng trước, là tấm gương cho các thợ in trẻ noi theo..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setFfcModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#14283F] text-white font-bold cursor-pointer shadow-xs"
                >
                  Lưu Lời Khen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
