import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { removeUndefinedDeep } from './erpService';
import { addLocalDaysYmd, getLocalTodayYmd } from '../utils/dateUtils';
import {
  ScheduleItem,
  SmartTask,
  SmartCriteria,
  PdcaCycle,
  Meeting369,
  OkrObjective,
  PrepMessage,
  MaslowEmployeePlan,
  MaslowLevelNumber,
  FfcPraiseRecord,
  SwotBoard,
  SwotEntry,
  TowsStrategicAction,
  CeoMission,
  CeoInitiative,
  AndonIssue,
  CeoDecisionItem,
} from '../types/ceoTypes';
import {
  ErpLsxOrder,
  ErpStaffMember,
  ErpMachine,
  ErpOrderIntake,
  ErpRadarMetrics,
} from '../types/erpTypes';
import {
  getLsxItemName,
  getLsxTotalQuantity,
  getLsxUnit,
  isLsxInProduction,
  isLsxOverdue,
} from '../utils/erpDataUtils';

export function computeSmartScore(smart?: Partial<SmartCriteria> | null): number {
  if (!smart) return 0;
  let score = 0;
  if (smart.specific && smart.specific.trim().length >= 8) score += 20;
  if (smart.measurable && (/\d/.test(smart.measurable) || smart.measurable.trim().length >= 6)) score += 20;
  if (smart.achievable && smart.achievable.trim().length >= 6) score += 20;
  if (smart.relevant && smart.relevant.trim().length >= 6) score += 20;
  if (smart.timeBound && smart.timeBound.trim().length >= 4) score += 20;
  return score;
}

const today = getLocalTodayYmd();

// ─── DANH SÁCH ID MẪU CẦN XÓA BỎ VĨNH VIỄN KHỎI HỆ THỐNG ──────────────────────
export const DEMO_IDS = new Set<string>([
  'sched-1',
  'sched-2',
  'sched-3',
  'sched-4',
  'sched-5',
  'smart-1',
  'smart-2',
  'smart-3',
  'pdca-1',
  'pdca-2',
  'meet-1',
  'okr-1',
  'okr-2',
  'swot-1',
  'prep-1',
  'maslow-1',
  'maslow-2',
  'ffc-1',
]);

// ─── TỰ ĐỘNG KẾT NỐI VÀ LÀM GIÀU DỮ LIỆU MẪU TỪ ERP MVĐN THỰC TẾ ──────────────
export interface ErpSeedParams {
  lsxOrders?: ErpLsxOrder[];
  staffDirectory?: ErpStaffMember[];
  machines?: ErpMachine[];
  intakes?: ErpOrderIntake[];
  radarMetrics?: ErpRadarMetrics;
}

export function buildRealErpSeeds(params?: ErpSeedParams) {
  const currentToday = getLocalTodayYmd();

  // 1. Tìm đơn hàng trọng điểm thực tế từ ERP: Ưu tiên đơn trễ hạn -> đơn đang chạy -> đơn bất kỳ
  const overdueList =
    params?.radarMetrics?.overdueLsx && params.radarMetrics.overdueLsx.length > 0
      ? params.radarMetrics.overdueLsx
      : (params?.lsxOrders || []).filter(
          (o) => isLsxOverdue(o.deliveryDate) && isLsxInProduction(o)
        );

  const inProgressList = (params?.lsxOrders || []).filter((o) => isLsxInProduction(o));
  const targetLsx = overdueList[0] || inProgressList[0] || params?.lsxOrders?.[0];

  const lsxCode = targetLsx
    ? targetLsx.lsxCode || targetLsx.orderCode || targetLsx.id
    : 'LSX-2026-8889';

  const customer = targetLsx?.customer?.trim() || 'Khách hàng MVĐN';
  const itemName = targetLsx
    ? getLsxItemName(targetLsx)
    : 'Tem nhãn Decal Fasson 4 màu UV';

  const totalQty = targetLsx ? getLsxTotalQuantity(targetLsx) : 65000;
  const quantity = totalQty > 0 ? totalQty.toLocaleString('vi-VN') : '65.000';
  const unit = targetLsx ? getLsxUnit(targetLsx) : 'con';
  const deliveryDate = targetLsx?.deliveryDate || addLocalDaysYmd(7, currentToday);

  // Danh sách các mã LSX cần xử lý gấp
  const overdueCodes = overdueList.slice(0, 3).map((o) => o.lsxCode || o.orderCode || o.id).join(', ');

  // 2. Tìm máy móc thực tế từ ERP
  const machineIn =
    params?.machines?.find((m) => m.type === 'IN' || m.name.toLowerCase().includes('in')) ||
    params?.machines?.[0];
  const machineName = machineIn?.name || 'Máy In Flexo 8 màu Mark Andy';

  // 3. Tìm nhân sự thực tế từ danh bạ ERP MVĐN (Tab Nhân Sự)
  const prodStaff =
    params?.staffDirectory?.find(
      (s) =>
        s.department.toLowerCase().includes('sản xuất') ||
        s.role.toLowerCase().includes('in') ||
        s.role.toLowerCase().includes('quản đốc')
    ) || params?.staffDirectory?.[0];

  const staffName1 = targetLsx?.operatorIn?.trim() || prodStaff?.name || 'Nguyễn Văn Hùng';
  const staffRole1 = prodStaff?.role || 'Quản Đốc Phân Xưởng In';
  const staffDept1 = prodStaff?.department || 'Xưởng In Flexo';

  const officeStaff =
    params?.staffDirectory?.find(
      (s) =>
        s.id !== prodStaff?.id &&
        (s.department.toLowerCase().includes('kế hoạch') ||
          s.department.toLowerCase().includes('kho') ||
          s.department.toLowerCase().includes('kỹ thuật') ||
          s.department.toLowerCase().includes('điều độ') ||
          s.role.toLowerCase().includes('kế hoạch'))
    ) || params?.staffDirectory?.[1] || params?.staffDirectory?.[0];

  const staffName2 = officeStaff?.name || 'Lê Thị Bích Ngọc';
  const staffRole2 = officeStaff?.role || 'Điều độ Kế hoạch & Kho vận';
  const staffDept2 = officeStaff?.department || 'Phòng Kế Hoạch & Kho Vận';

  // 4. Các số liệu radar thực tế từ ERP
  const totalLsxCount = params?.radarMetrics?.totalLsxCount || params?.lsxOrders?.length || 184;
  const inProgressCount = params?.radarMetrics?.inProgressLsxCount || inProgressList.length || 115;
  const overdueCount = overdueList.length || 4;
  const intakesCount = params?.radarMetrics?.todayNewIntakesCount || params?.intakes?.length || 11;
  const onTimeRate = params?.radarMetrics?.onTimeLsxRate ?? 94;

  const schedules: ScheduleItem[] = [
    {
      id: 'sample-sched-01',
      title: `Giao ban Ban Giám Đốc: Rà soát ${overdueCount} LSX gấp & Điều phối ${machineName}`,
      startTime: '08:30',
      endTime: '09:15',
      date: currentToday,
      repeat: 'DAILY',
      category: 'MEETING_369',
      priority: 'HIGH',
      remindMinutesBefore: 10,
      linkedPerson: `Ban Giám Đốc & ${staffName1}`,
      linkedLsxCode: lsxCode,
      notes: `Đánh giá tiến độ LSX ${lsxCode} (${customer}), rà soát màng cuộn và mực in cho ${intakesCount} đơn hàng mới tiếp nhận hôm nay.`,
      completedDates: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-sched-02',
      title: `Kiểm tra Gemba xưởng in: Thị sát quy trình vận hành & hao hụt decal trên ${machineName}`,
      startTime: '10:00',
      endTime: '10:45',
      date: currentToday,
      repeat: 'DAILY',
      category: 'ERP_REVIEW',
      priority: 'HIGH',
      remindMinutesBefore: 15,
      linkedPerson: staffName1,
      linkedLsxCode: lsxCode,
      notes: `Kiểm tra tốc độ chạy chuẩn 85m/phút, độ bám dính màng và kiểm soát tỷ lệ hao hụt phế phẩm dưới 1.8%.`,
      completedDates: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-sched-03',
      title: `Họp 3-6-9: Giải quyết nút thắt giao hàng đơn hàng ${lsxCode} (${customer})`,
      startTime: '14:00',
      endTime: '14:45',
      date: currentToday,
      repeat: 'ONCE',
      category: 'MEETING_369',
      priority: 'HIGH',
      remindMinutesBefore: 10,
      linkedPerson: `${staffName2} & Bộ phận Kế hoạch`,
      linkedLsxCode: lsxCode,
      notes: `Chốt phương án ca kíp, điều phối xe giao hàng kịp deadline ${deliveryDate}.`,
      completedDates: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-sched-04',
      title: `Rà soát Tài chính & Phê duyệt hạn mức mua vật tư decal cuộn cho ${intakesCount} đơn mới`,
      startTime: '16:30',
      endTime: '17:15',
      date: currentToday,
      repeat: 'WEEKDAYS',
      category: 'DEEP_WORK',
      priority: 'MEDIUM',
      remindMinutesBefore: 10,
      linkedPerson: 'Ban Tài Chính & Kế Toán',
      notes: `Đối chiếu công nợ nhà cung cấp màng decal và phê duyệt đề xuất chi cho tuần tới.`,
      completedDates: [],
      createdAt: new Date().toISOString(),
    },
  ];

  const missions: CeoMission[] = [
    {
      id: 'sample-mission-01',
      title: 'Tối ưu hóa năng suất & Kéo giảm 30% thời gian setup dây chuyền in Flexo trong 30 ngày',
      timeframe: '30 ngày (Tháng 11/2026)',
      startDate: currentToday,
      targetDate: addLocalDaysYmd(30, currentToday),
      driName: `${staffName1} (${staffRole1})`,
      status: 'ON_TRACK',
      progress: 35,
      prep: {
        point: 'Giảm 30% thời gian setup máy in Flexo và bế decal trong 30 ngày tới.',
        reason: 'Setup chậm làm giảm năng suất toàn xưởng, tạo nút thắt cổ chai và đe dọa kế hoạch giao hàng OTD cho các khách hàng VIP.',
        evidence: 'Dữ liệu ERP 4 tuần gần nhất cho thấy setup trung bình 60 phút/lượt; hao hụt decal lên bài in chiếm 3.8% tổng sản lượng.',
        action: 'Sản xuất là Single DRI chịu trách nhiệm kết quả; QA và Kỹ thuật là Supporter phối hợp; check-in số liệu hằng tuần.',
        budgetOrAuthority: 'Được quyền điều chỉnh ca kíp và duyệt mua dụng cụ gá kẹp nhanh SMED dưới 25 triệu VNĐ.',
        mainRisk: 'Thợ máy quen nếp cũ, không tuân thủ checklist; cần đào tạo và giám sát chặt chẽ.',
      },
      linkedOkrIds: ['sample-okr-01'],
      linkedInitiativeIds: ['sample-init-01', 'sample-init-02'],
      createdAt: new Date().toISOString(),
    },
  ];

  const initiatives: CeoInitiative[] = [
    {
      id: 'sample-init-01',
      missionId: 'sample-mission-01',
      linkedOkrId: 'sample-okr-01',
      linkedKrId: 'sample-kr-01',
      title: 'Triển khai phương pháp SMED tách biệt Internal/External setup trên các dây chuyền Flexo',
      hypothesis: 'Chuẩn bị sẵn cuộn decal, mực in và bản in trước khi dừng máy cũ sẽ cắt giảm ít nhất 18 phút thời gian máy dừng.',
      driName: 'Trần Đình Trọng (Trưởng BP Kỹ Thuật)',
      targetDate: addLocalDaysYmd(15, currentToday),
      status: 'IN_PROGRESS',
      pdcaPhase: 'DO',
      taskIds: ['sample-dri-01', 'sample-smart-02'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-init-02',
      missionId: 'sample-mission-01',
      linkedOkrId: 'sample-okr-01',
      linkedKrId: 'sample-kr-02',
      title: 'Xây dựng checklist số hóa chuẩn bị setup, phê duyệt bài in đầu tiên (First-Piece Approval) và Andon số',
      hypothesis: 'Thợ máy không được chạy hàng loạt khi chưa có chữ ký QA phê duyệt bài in mẫu đầu tiên, ngăn chặn hoàn toàn rủi ro in lệch màu hàng loạt.',
      driName: 'Nguyễn Thị Lan (Trưởng BP QA/QC)',
      targetDate: addLocalDaysYmd(20, currentToday),
      status: 'IN_PROGRESS',
      pdcaPhase: 'PLAN',
      taskIds: ['sample-smart-03'],
      createdAt: new Date().toISOString(),
    },
  ];

  const smartTasks: SmartTask[] = [
    {
      id: 'sample-task-blocked-01',
      missionId: 'sample-mission-01',
      initiativeId: 'sample-init-01',
      taskType: 'DRI_ACTION',
      title: 'Mua bổ sung cảm biến lực căng điện tử và dao bế tròn dự phòng cho dây chuyền Flexo',
      department: 'Phòng Kỹ Thuật & Mua Hàng',
      domain: 'SUPPLY_CHAIN',
      assigneeName: 'Trần Đình Trọng (Trưởng BP Kỹ Thuật)',
      assigneeRole: 'Trưởng BP Kỹ Thuật',
      approverName: 'Tôn Đăng Vũ (CEO)',
      supporters: ['Nguyễn Văn Huy (Mua Hàng)', 'Kế Toán Kho'],
      consulted: ['Quản Đốc Sản Xuất'],
      informed: ['Ban Giám Đốc'],
      driConfirmed: true,
      driConfirmedAt: currentToday,
      dueDate: currentToday,
      dueTime: '17:00',
      priority: 'URGENT',
      status: 'BLOCKED',
      progress: 40,
      smart: {
        specific: 'Trang bị 01 bộ cảm biến lực căng tự động và 01 dao bế tròn dự phòng cho máy Flexo.',
        measurable: 'Lắp đặt hoàn thiện và nghiệm thu chạy thử nghiệm không rung lắc trước ngày mai.',
        achievable: 'Nhà cung cấp sẵn hàng trong kho tại TP.HCM, giao hàng trong 4 giờ.',
        relevant: 'Tránh dừng máy đột ngột khi chạy các đơn hàng tem dược phẩm độ chính xác cao.',
        timeBound: 'Cần quyết định ngân sách trước 15:00 hôm nay.',
      },
      smartScore: 90,
      blockerReason: 'Chi phí báo giá là 18.5 triệu VNĐ, vượt thẩm quyền phê duyệt của Trưởng phòng Kỹ thuật (hạn mức 10 triệu). Nhà cung cấp yêu cầu tạm ứng 50% để xuất kho.',
      blockerDecisionNeeded: 'CEO phê duyệt duyệt chi tạm ứng 9.25 triệu VNĐ để nhà cung cấp giao cảm biến ngay chiều nay.',
      escalatedToCeo: true,
      escalatedAt: currentToday,
      followUpCount: 1,
      isPushedToErp: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-smart-01',
      title: `Thúc đẩy tiến độ & Kiểm soát chất lượng LSX ${lsxCode} (${customer})`,
      department: staffDept1,
      domain: 'PRODUCTION',
      assigneeName: `${staffName1} (${staffRole1})`,
      assigneeRole: staffRole1,
      dueDate: deliveryDate,
      dueTime: '17:00',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      progress: 65,
      smart: {
        specific: `Tập trung in và hoàn thiện ${quantity} ${unit} sản phẩm ${itemName} cho khách hàng ${customer} theo lệnh ${lsxCode}.`,
        measurable: `Hoàn thành 100% sản lượng ${quantity} ${unit}, tỷ lệ phế liệu in cuộn dưới 2.0%, kiểm tra mã Barcode/RFID đạt chuẩn AQL 1.0.`,
        achievable: `Đã ưu tiên trạm in trên ${machineName}, chuẩn hóa dao bế và phân công thợ chính phụ trách trực tiếp.`,
        relevant: `Giải quyết dứt điểm cảnh báo tiến độ LSX trên hệ thống ERP MVĐN, bảo đảm uy tín giao hàng cho khách hàng ${customer}.`,
        timeBound: `Bàn giao sang tổ đóng gói trước ngày ${deliveryDate}.`,
      },
      smartScore: 100,
      linkedLsxCode: lsxCode,
      linkedOkrId: 'sample-okr-01',
      followUpCount: 2,
      isPushedToErp: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-smart-02',
      title: `Bảo dưỡng phòng ngừa dao bế & Căn chỉnh trục in trạm 2 trên ${machineName}`,
      department: 'Phòng Kỹ Thuật & Bảo Trì',
      domain: 'QUALITY',
      assigneeName: 'Trần Đình Trọng (Trưởng BP Kỹ Thuật)',
      assigneeRole: 'Trưởng BP Kỹ Thuật',
      dueDate: addLocalDaysYmd(2, currentToday),
      dueTime: '20:00',
      priority: 'HIGH',
      status: 'TODO',
      progress: 0,
      smart: {
        specific: `Thay dầu hộp số, kiểm tra độ mòn dao bế từ và căn chỉnh trục bản in trạm 2 máy ${machineName}.`,
        measurable: `Độ lệch bế dưới 0.15mm, kiểm tra 100% các trục không có vết xước hoặc rung lắc.`,
        achievable: `Bộ phận bảo trì chuẩn bị sẵn phụ tùng thay thế và căn chỉnh trong 2 giờ dừng máy ca 3.`,
        relevant: `Đảm bảo độ chính xác cho các đơn hàng tem nhãn cuộn Flexo tốc độ cao.`,
        timeBound: `Hoàn tất trước 20:00 ngày ${addLocalDaysYmd(2, currentToday)}.`,
      },
      smartScore: 95,
      linkedLsxCode: lsxCode,
      followUpCount: 1,
      isPushedToErp: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-smart-03',
      title: `Nghiệm thu thử nghiệm công nghệ phủ màng UV chống trầy cho bao bì xuất khẩu`,
      department: 'KCS & Quản Lý Chất Lượng',
      domain: 'QUALITY',
      assigneeName: 'Nguyễn Thị Lan (Trưởng BP QA/QC)',
      assigneeRole: 'Trưởng BP QA/QC',
      dueDate: addLocalDaysYmd(1, currentToday),
      dueTime: '16:00',
      priority: 'MEDIUM',
      status: 'REVIEW',
      progress: 90,
      smart: {
        specific: `Thử nghiệm test độ bám mực và chống trầy xước bằng băng keo 3M và cồn 90 độ trên 5 mẫu in thử.`,
        measurable: `5/5 mẫu đạt độ bám dính cấp độ 5B theo tiêu chuẩn ASTM D3359, lập biên bản nghiệm thu.`,
        achievable: `Phòng Lab QC đã trang bị máy đo độ bám dính và dung môi thử nghiệm đạt chuẩn ISO.`,
        relevant: `Điều kiện tiên quyết để ký hợp đồng cung ứng dài hạn năm 2027 với khách hàng FDI.`,
        timeBound: `Báo cáo kết quả nghiệm thu trước 16:00 ngày ${addLocalDaysYmd(1, currentToday)}.`,
      },
      smartScore: 100,
      linkedOkrId: 'sample-okr-01',
      followUpCount: 3,
      isPushedToErp: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-smart-04',
      title: `Đối soát chứng từ & Thu hồi công nợ đến hạn đợt 1 đối tác thương mại`,
      department: 'Phòng Kế Toán & Tài Chính',
      domain: 'FINANCE',
      assigneeName: 'Lê Thị Mai (Kế Toán Trưởng)',
      assigneeRole: 'Kế Toán Trưởng',
      dueDate: currentToday,
      dueTime: '17:30',
      priority: 'HIGH',
      status: 'DONE',
      progress: 100,
      smart: {
        specific: `Đối soát công nợ tháng trước và thu hồi 100% khoản thanh toán đợt 1 từ đối tác thương mại.`,
        measurable: `Số tiền thu hồi đạt 485,000,000 VNĐ, biên bản đối chiếu công nợ có chữ ký 2 bên.`,
        achievable: `Khách hàng đã nhận đủ hàng và đồng ý lịch thanh toán theo hợp đồng thương mại.`,
        relevant: `Đảm bảo dòng tiền thanh toán cho nhà cung cấp nguyên vật liệu màng decal.`,
        timeBound: `Hoàn tất trước 17:30 ngày hôm nay.`,
      },
      smartScore: 92,
      taskType: 'SMART_GOAL',
      followUpCount: 1,
      isPushedToErp: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-dri-01',
      taskType: 'DRI_ACTION',
      title: `Điều phối cuộn màng decal & bản in trước 11h00 cho lệnh gấp ${lsxCode}`,
      department: staffDept2,
      domain: 'SUPPLY_CHAIN',
      assigneeName: `${staffName2} (${staffRole2})`,
      assigneeRole: staffRole2,
      dueDate: currentToday,
      dueTime: '11:00',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      progress: 60,
      smart: {
        specific: `Xuất kho đủ cuộn màng decal và bàn giao bản in tận máy cho lệnh ${lsxCode}`,
        measurable: `Đủ 100% vật tư tại đầu máy trước 11:00 trưa nay, không chờ vật tư`,
        achievable: `Kho vận & Kỹ thuật phối hợp trực tiếp`,
        relevant: `Tác vụ điều phối ngày từ giao ban sáng`,
        timeBound: `Trước 11:00 ngày ${currentToday}`,
      },
      smartScore: 85,
      linkedLsxCode: lsxCode,
      followUpCount: 1,
      isPushedToErp: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-dri-02',
      taskType: 'DRI_ACTION',
      title: `Gửi lịch xác nhận giờ xe giao hàng đợt 1 cho khách hàng ${customer}`,
      department: 'Kinh Doanh & Điều Phối',
      domain: 'SALES',
      assigneeName: staffName2,
      assigneeRole: staffRole2,
      dueDate: addLocalDaysYmd(1, currentToday),
      dueTime: '15:00',
      priority: 'HIGH',
      status: 'TODO',
      progress: 0,
      smart: {
        specific: `Chốt khung giờ xe tải nhận hàng và thông báo cho kho thành phẩm`,
        measurable: `Xác nhận văn bản/Zalo với khách hàng ${customer} trước 15:00`,
        achievable: `Đội điều phối giao nhận thực hiện`,
        relevant: `Đảm bảo giao hàng đúng cam kết`,
        timeBound: `Trước 15:00 ngày ${addLocalDaysYmd(1, currentToday)}`,
      },
      smartScore: 85,
      linkedLsxCode: lsxCode,
      followUpCount: 0,
      isPushedToErp: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const pdcaCycles: PdcaCycle[] = [
    {
      id: 'sample-pdca-01',
      title: `Khắc phục lỗi lệch chồng màu (Misregister) và hao hụt decal trên ${machineName}`,
      area: 'PRODUCTION',
      ownerName: 'Trần Đình Trọng (Trưởng BP Kỹ Thuật)',
      phase: 'CHECK',
      planProblem: `Tỷ lệ hàng lỗi ở các đơn hàng ${itemName} chạy trên ${machineName} đạt 4.2% do dao động lực căng cuộn giấy và mòn trục in.`,
      doExperiment: `Thay vòng bi trục in số 3 & 4, lắp cảm biến lực căng điện tử mới và thử nghiệm chạy tốc độ chuẩn 85m/phút với mực UV DIC.`,
      checkEvaluation: `Sau 5 ca chạy thử nghiệm trên 30,000m decal đơn hàng ${lsxCode}, tỷ lệ phế phẩm giảm còn 0.8%, độ đồng màu Delta-E < 1.2 đạt chuẩn ISO 12647-6.`,
      actStandardize: `Ban hành quy trình chuẩn SOP-TECH-04 về bảo dưỡng trục bản in và checklist cân chỉnh lực căng trước mỗi ca làm việc.`,
      metricBaseline: '4.2% tỷ lệ phế phẩm',
      metricTarget: '< 1.0% phế phẩm',
      metricActual: '0.8% phế phẩm (Đạt mục tiêu)',
      dueDate: addLocalDaysYmd(7, currentToday),
      linkedSmartTaskId: 'sample-smart-01',
      linkedLsxCode: lsxCode,
      iteration: 1,
      sopStandardizedTitle: `Quy trình kiểm soát lực căng cuộn & căn chỉnh trục in trên ${machineName}`,
      sopStandardizedCode: 'SOP-TECH-04',
      evaluationStatus: 'ACHIEVED',
      evaluationSummary: `Thử nghiệm thành công trên đơn hàng ${lsxCode}, chất lượng in sắc nét đạt chuẩn xuất xưởng.`,
      createdAt: new Date().toISOString(),
    },
  ];

  const meetings: Meeting369[] = [
    {
      id: 'sample-meet-01',
      title: `Họp Giao Ban Sản Xuất 3-6-9: Giải quyết nút thắt ${overdueCount} đơn hàng sản xuất Quý 4`,
      topic: `Tháo gỡ tiến độ LSX ${lsxCode} (${customer}) và phân bổ công suất ${machineName}`,
      objective: `Chốt phương án bố trí tăng ca, điều chuyển vật tư và cam kết giao hàng đúng hẹn 100% cho các LSX gấp.`,
      date: currentToday,
      startTime: '09:30',
      durationMinutes: 45,
      location: 'Phòng Họp Điều Hành Nhà Máy MVĐN',
      chairperson: 'Tôn Đăng Vũ (CEO)',
      participants: [
        'Tôn Đăng Vũ (CEO)',
        `${staffName1} (${staffDept1})`,
        `${staffName2} (${staffDept2})`,
        'Trần Đình Trọng (Kỹ thuật)',
      ],
      preReadDocs: `Báo cáo ERP MVĐN: Radar ${inProgressCount} LSX đang chạy, ${overdueCount} LSX trễ hạn & ${intakesCount} đơn hàng tiếp nhận hôm nay`,
      meetingRules: 'Đúng giờ • Tập trung giải pháp tháo gỡ điểm nghẽn • Không đổ lỗi • Chốt biên bản có DRI & Deadline',
      agendaFlow: [
        '09:30 - 09:35: Khởi động & Điểm danh mục tiêu (Nguyên tắc 4)',
        `09:35 - 09:55: Phân tích nguyên nhân chậm tiến độ LSX ${lsxCode} và ${overdueCount} đơn hàng cảnh báo (Nguyên tắc 5)`,
        `09:55 - 10:10: Chốt quyết định điều ca máy trên ${machineName} & phụ cấp tăng ca (Nguyên tắc 6)`,
        '10:10 - 10:15: Ký biên bản hành động DRI & Deadline (Nguyên tắc 7)',
      ],
      decisionsSummary: `Thống nhất tăng cường ca phụ trên ${machineName} từ 18:00 - 22:00, ưu tiên vật tư hoàn thiện đơn ${lsxCode} trước ngày ${deliveryDate}.`,
      sixStepsCompleted: [true, true, true, true, false, false],
      ninePrinciplesChecked: [true, true, true, true, true, true, false, false, false],
      actionItems: [
        {
          id: 'sample-meet-act-01',
          taskTitle: `Điều phối màng cuộn và dao bế cho đơn hàng ${lsxCode} (${customer}) hoàn tất trước 14:00`,
          assigneeName: staffName2,
          dueDate: currentToday,
          status: 'IN_PROGRESS',
          supervisedCount: 1,
        },
        {
          id: 'sample-meet-act-02',
          taskTitle: `Bố trí tổ thợ máy chạy bù sản lượng ${quantity} ${unit} trên ${machineName}`,
          assigneeName: staffName1,
          dueDate: currentToday,
          status: 'PENDING',
          supervisedCount: 0,
        },
      ],
      status: 'FOLLOW_UP',
      createdAt: new Date().toISOString(),
    },
  ];

  const okrs: OkrObjective[] = [
    {
      id: 'sample-okr-01',
      quarter: 'Q4/2026',
      title: 'Tối ưu hóa năng lực sản xuất và nâng cao tỷ lệ giao hàng đúng hẹn (OTD) toàn nhà máy MVĐN',
      department: 'Ban Giám Đốc & Khối Vận Hành Nhà Máy',
      ownerName: 'Tôn Đăng Vũ (CEO)',
      priority: 'P0',
      keyResults: [
        {
          id: 'sample-kr-01',
          title: `Nâng tỷ lệ giao hàng LSX đúng hẹn (OTD) toàn nhà xưởng từ 88% lên 98% (Hiện tại: ${onTimeRate}%)`,
          startValue: 88,
          targetValue: 98,
          currentValue: onTimeRate,
          unit: '%',
          linkedErpMetric: 'ON_TIME_LSX_RATE',
        },
        {
          id: 'sample-kr-02',
          title: `Kéo giảm số lượng LSX có nguy cơ trễ hạn trên hệ thống Radar từ ${overdueCount} đơn về 0 đơn`,
          startValue: overdueCount,
          targetValue: 0,
          currentValue: Math.max(0, overdueCount - 2),
          unit: 'LSX',
          linkedErpMetric: 'MANUAL',
        },
        {
          id: 'sample-kr-03',
          title: `Kiểm soát năng lực xử lý ${intakesCount} đơn hàng tiếp nhận mỗi ngày đạt chuẩn ra LSX trong 24h`,
          startValue: 5,
          targetValue: 20,
          currentValue: intakesCount,
          unit: 'đơn/ngày',
          linkedErpMetric: 'TODAY_OUTPUT',
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  const swotBoards: SwotBoard[] = [
    {
      id: 'sample-swot-01',
      title: 'Ma trận Chiến lược Cạnh tranh Nhà máy Sản xuất Nhãn Thông minh MVĐN',
      period: `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`,
      focusDomain: `Vận hành ${inProgressCount} LSX, Máy in Flexo công nghiệp, Tem RFID & Nhãn truy xuất nguồn gốc`,
      entries: [
        {
          id: 'swot-s1',
          type: 'S',
          content: `Hệ thống thiết bị ${machineName} hiện đại, tích hợp trạm phủ UV và bế tự động tốc độ cao.`,
          impact: 'HIGH',
        },
        {
          id: 'swot-s2',
          type: 'S',
          content: 'Đội ngũ kỹ thuật viên tay nghề cao, kiểm soát dung sai màu chuẩn xác và am hiểu công nghệ chip RFID.',
          impact: 'HIGH',
        },
        {
          id: 'swot-w1',
          type: 'W',
          content: 'Tồn kho nguyên phụ liệu decal nhập khẩu còn phụ thuộc thời gian vận chuyển của nhà cung cấp quốc tế.',
          impact: 'MEDIUM',
        },
        {
          id: 'swot-w2',
          type: 'W',
          content: 'Tỷ lệ hao hụt lên bài in ở các mã hàng tem nhiều màu còn cao trong giai đoạn chạy thử.',
          impact: 'HIGH',
        },
        {
          id: 'swot-o1',
          type: 'O',
          content: 'Nhu cầu chuyển đổi số chuỗi cung ứng bằng nhãn RFID trong ngành may mặc và dược phẩm tăng trưởng 35%/năm.',
          impact: 'HIGH',
        },
        {
          id: 'swot-o2',
          type: 'O',
          content: 'Các hiệp định thương mại tự do mở rộng xuất khẩu hàng tiêu dùng dán nhãn Việt Nam sang EU và Bắc Mỹ.',
          impact: 'HIGH',
        },
        {
          id: 'swot-t1',
          type: 'T',
          content: 'Biến động tỷ giá ngoại tệ ảnh hưởng đến giá vốn giấy decal cuộn và mực in gốc nước.',
          impact: 'MEDIUM',
        },
        {
          id: 'swot-t2',
          type: 'T',
          content: 'Sự cạnh tranh gay gắt về giá từ các xưởng in gia công nhỏ lẻ ở phân khúc nhãn barcode thông thường.',
          impact: 'HIGH',
        },
      ],
      towsActions: [
        {
          id: 'tows-so-1',
          strategyType: 'SO',
          actionTitle: 'Tập trung mũi nhọn tiếp cận các tập đoàn Dược phẩm & May mặc xuất khẩu với giải pháp nhãn RFID trọn gói',
          ownerName: 'Tôn Đăng Vũ (CEO)',
          dueDate: addLocalDaysYmd(30, currentToday),
          status: 'EXECUTING',
        },
        {
          id: 'tows-wo-1',
          strategyType: 'WO',
          actionTitle: 'Triển khai chu trình PDCA chuẩn hóa checklist lên bài in để kéo giảm phế phẩm xuống dưới 2.5%',
          ownerName: 'Trần Đình Trọng (Kỹ thuật)',
          dueDate: addLocalDaysYmd(15, currentToday),
          status: 'EXECUTING',
        },
        {
          id: 'tows-st-1',
          strategyType: 'ST',
          actionTitle: 'Định vị thương hiệu MVĐN ở phân khúc chất lượng cao, từ chối cạnh tranh phá giá ở phân khúc tem nhãn cấp thấp',
          ownerName: 'Ban Giám Đốc',
          dueDate: addLocalDaysYmd(60, currentToday),
          status: 'PLANNED',
        },
        {
          id: 'tows-wt-1',
          strategyType: 'WT',
          actionTitle: 'Đàm phán hợp đồng cung ứng decal Fasson kỳ hạn 6 tháng để cố định đơn giá và dự phòng tồn kho an toàn 20%',
          ownerName: 'Khối Mua Hàng & Kho',
          dueDate: addLocalDaysYmd(20, currentToday),
          status: 'PLANNED',
        },
      ],
      updatedAt: new Date().toISOString(),
    },
  ];

  const maslowPlans: MaslowEmployeePlan[] = [
    {
      id: 'sample-maslow-01',
      employeeName: staffName1,
      department: staffDept1,
      role: staffRole1,
      dominantNeedLevel: 4,
      satisfactionScores: {
        level1Physiological: 9,
        level2Safety: 9,
        level3Belonging: 8,
        level4Esteem: 6,
        level5SelfActualization: 7,
      },
      currentObservation: `Anh ${staffName1} nắm rất vững vận hành xưởng và kỹ thuật máy, nhưng đang cảm thấy tiếng nói chuyên môn trong các quyết định nhận đơn hàng gấp chưa được Ban Giám Đốc tham vấn đầy đủ, có biểu hiện e ngại phản hồi.`,
      motivationAction: `Trao quyền cho anh ${staffName1} trực tiếp ký duyệt kế hoạch bố trí ca kíp trên ${machineName}, mời anh tham gia phiên thẩm định kỹ thuật trước khi ký kết các hợp đồng tem nhãn phức tạp.`,
      nextCheckInDate: addLocalDaysYmd(5, currentToday),
      createdAt: new Date().toISOString(),
    },
  ];

  const ffcPraises: FfcPraiseRecord[] = [
    {
      id: 'sample-ffc-01',
      recipientName: staffName2,
      department: staffDept2,
      feeling: `Ban Giám Đốc vô cùng trân trọng và an tâm trước tinh thần trách nhiệm, sự nhạy bén và chủ động của em trong đợt điều độ cao điểm vừa qua.`,
      fact: `Em đã kịp thời phát hiện sớm nguy cơ thiếu hụt vật tư cho đơn hàng ${lsxCode} (${customer}), chủ động thương lượng đổi lịch giao hàng với nhà cung cấp decal sớm hơn 2 ngày và điều chỉnh lịch chạy máy ${machineName} linh hoạt.`,
      compare: `Nhờ phản ứng nhanh nhạy vượt trội so với các đợt phát sinh trước đây, nhà máy đã không bị gián đoạn 1 giờ máy nào và bàn giao 100% lô hàng cho khách hàng ${customer} đúng hẹn.`,
      linkedLsxCode: lsxCode,
      sentToErp: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const prepMessages: PrepMessage[] = [
    {
      id: 'sample-prep-01',
      title: `Chỉ thị V/v Kiểm soát nhiệt độ & độ ẩm tiêu chuẩn tại Kho Decal và Phòng Máy In phục vụ ${inProgressCount} LSX Quý 4`,
      audience: 'Toàn bộ Quản đốc Xưởng, Trưởng BP Kỹ thuật, Tổ trưởng Vận hành máy và Thủ kho Vật tư MVĐN',
      category: 'DIRECTIVE',
      pointOpening: `Bắt buộc duy trì nghiêm ngặt nhiệt độ 24°C ± 2°C và độ ẩm 55% ± 5% tại khu vực lưu trữ decal cuộn và phòng máy ${machineName} suốt 24/7.`,
      reasonWhy: `Giấy decal tự dính là vật liệu rất nhạy cảm với thời tiết; độ ẩm cao gây phồng rộp keo và cong vênh bề mặt giấy, dẫn đến kẹt giấy và sai lệch bước in Flexo.`,
      exampleEvidence: `Tuần trước khi máy lạnh kho phụ gặp sự cố khiến độ ẩm vọt lên 78%, xưởng đã ghi nhận tỷ lệ lỗi nhão keo làm hao hụt gần 1,200 mét decal Fasson trong ca sáng, làm chậm tiến độ giao hàng cho khách hàng.`,
      pointClosing: `Thủ kho và Kỹ thuật trực ca ghi nhật ký đo nhiệt ẩm 3 lần/ngày; mọi sai lệch quá ngưỡng phải báo cáo Quản đốc xử lý bật máy hút ẩm dự phòng ngay trong vòng 15 phút.`,
      publishedToErp: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const andonIssues: AndonIssue[] = [
    {
      id: 'sample-andon-01',
      issueCode: 'ANDON-20261109-01',
      category: 'MACHINE_STOP',
      severity: 'LINE_STOP',
      lineOrMachine: `Dây chuyền máy in ${machineName}`,
      productOrLsxCode: lsxCode,
      shift: 'Ca 1 (Sáng)',
      stage: 'Công đoạn In Flexo',
      description: `Máy in dừng khẩn cấp do trục bản in trạm 3 bị kẹt màng decal, nguy cơ trễ tiến độ giao đơn hàng ${lsxCode} (${customer}).`,
      reportedBy: `${staffName1} (Quản đốc xưởng)`,
      detectedAt: `${currentToday} 09:15`,
      driName: 'Trần Đình Trọng (Trưởng BP Kỹ Thuật)',
      status: 'ACTION_IN_PROGRESS',
      correctiveActionTaskId: 'sample-smart-02',
      correctiveActionTitle: `Căn chỉnh lại áp lực trục và thông màng kẹt trên ${machineName}`,
      correctiveActionDueDate: currentToday,
      fiveWhys: [
        'Tại sao máy dừng? Vì màng decal bị kẹt và quấn vào trục in số 3.',
        'Tại sao màng bị quấn? Vì lực căng màng bị chùng đột ngột.',
        'Tại sao lực căng bị chùng? Vì cảm biến lực căng cũ bị bám bụi mực và báo sai tín hiệu.',
        'Tại sao bám bụi mực? Vì tấm chắn bảo vệ cảm biến bị gãy chưa được thay thế.',
        'Tại sao chưa thay thế? Vì thiếu checklist kiểm tra tấm chắn bảo vệ trong ca bảo dưỡng tuần.',
      ],
      preventiveAction: 'Lắp tấm chắn bảo vệ mới và cập nhật hạng mục kiểm tra cảm biến vào SOP bảo trì tuần.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-andon-02',
      issueCode: 'ANDON-20261109-02',
      category: 'QUALITY_DEFECT',
      severity: 'CRITICAL',
      lineOrMachine: 'Máy bế decal tự động 02',
      productOrLsxCode: 'LSX-GC-2710',
      shift: 'Ca 1 (Sáng)',
      stage: 'Công đoạn Bế tem',
      description: 'Dao bế bị mòn góc mép làm tem bị dính răng cưa, tỷ lệ lỗi phát hiện tại bàn KCS đạt 4.5%.',
      reportedBy: 'Nguyễn Thị Lan (QA/QC)',
      detectedAt: `${currentToday} 10:45`,
      driName: `${staffName2} (Thiết Kế & Kỹ Thuật)`,
      status: 'TRIAGING',
      correctiveActionTitle: 'Mài lại lưỡi dao bế và kiểm tra 100% cuộn tem trước khi sang tổ đóng gói',
      correctiveActionDueDate: currentToday,
      createdAt: new Date().toISOString(),
    },
  ];

  const decisionItems: CeoDecisionItem[] = [
    {
      id: 'dec-01',
      type: 'BLOCKED_TASK',
      title: 'Phê duyệt chi ngân sách 9.25 triệu tạm ứng mua cảm biến lực căng điện tử (Task bị Blocked)',
      requestedBy: 'Trần Đình Trọng (Trưởng BP Kỹ Thuật)',
      requestedAt: `${currentToday} 09:30`,
      reason: 'Vượt hạn mức duyệt của cấp Trưởng phòng, cần linh kiện gấp để dây chuyền không bị dừng.',
      decisionNeeded: 'CEO ký duyệt chi ngân sách tạm ứng 50% để giao hàng trong 4 giờ.',
      urgency: 'URGENT',
      status: 'PENDING',
      linkedEntityId: 'sample-task-blocked-01',
    },
    {
      id: 'dec-02',
      type: 'ANDON_ESCALATION',
      title: `Bố trí tăng ca máy ${machineName} từ 18:00 - 22:00 giải quyết sự cố Andon dừng dòng`,
      requestedBy: `${staffName1} (Quản đốc xưởng)`,
      requestedAt: `${currentToday} 10:00`,
      reason: `Sự cố kẹt màng làm mất 45 phút ca sáng, cần chạy bù sản lượng để kịp xe giao hàng ${customer}.`,
      decisionNeeded: 'CEO phê duyệt phụ cấp tăng ca cho 04 thợ máy ca phụ tối nay.',
      urgency: 'HIGH',
      status: 'PENDING',
      linkedEntityId: 'sample-andon-01',
    },
  ];

  return {
    missions,
    initiatives,
    andonIssues,
    decisionItems,
    schedules,
    smartTasks,
    pdcaCycles,
    meetings,
    okrs,
    swotBoards,
    maslowPlans,
    ffcPraises,
    prepMessages,
  };
}

const defaultBundle = buildRealErpSeeds();
export const INITIAL_MISSIONS: CeoMission[] = defaultBundle.missions;
export const INITIAL_INITIATIVES: CeoInitiative[] = defaultBundle.initiatives;
export const INITIAL_ANDON_ISSUES: AndonIssue[] = defaultBundle.andonIssues;
export const INITIAL_DECISIONS: CeoDecisionItem[] = defaultBundle.decisionItems;
export const INITIAL_SCHEDULES: ScheduleItem[] = defaultBundle.schedules;
export const INITIAL_SMART_TASKS: SmartTask[] = defaultBundle.smartTasks;
export const INITIAL_PDCA_CYCLES: PdcaCycle[] = defaultBundle.pdcaCycles;
export const INITIAL_MEETINGS_369: Meeting369[] = defaultBundle.meetings;
export const INITIAL_OKRS: OkrObjective[] = defaultBundle.okrs;
export const INITIAL_SWOT_BOARDS: SwotBoard[] = defaultBundle.swotBoards;
export const INITIAL_MASLOW_PLANS: MaslowEmployeePlan[] = defaultBundle.maslowPlans;
export const INITIAL_FFC_PRAISES: FfcPraiseRecord[] = defaultBundle.ffcPraises;
export const INITIAL_PREP_MESSAGES: PrepMessage[] = defaultBundle.prepMessages;

// ─── BỘ CHUẨN HÓA DỮ LIỆU TƯƠNG THÍCH NGƯỢC VỚI BẢN GHI FIRESTORE CŨ (`axis_*`) ─
function normalizeDocument(collectionName: string, raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;

  if (collectionName.includes('schedules')) {
    const startTime = String(raw.startTime || raw.time || '08:30');
    return {
      ...raw,
      id: String(raw.id || `sched-${Date.now()}`),
      title: String(raw.title || 'Lịch trình điều hành'),
      startTime,
      endTime: String(raw.endTime || '09:00'),
      date: raw.id === 'sample-sched-01' ? today : String(raw.date || today),
      repeat: raw.repeat || raw.recurrence || 'DAILY',
      category: raw.category || 'MEETING_369',
      priority: raw.priority || 'HIGH',
      remindMinutesBefore: Number(raw.remindMinutesBefore ?? 10),
      notes: String(raw.notes || raw.note || ''),
      completedDates: Array.isArray(raw.completedDates) ? raw.completedDates : [],
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies ScheduleItem;
  }

  if (collectionName.includes('tasks')) {
    const smart: SmartCriteria = {
      specific: String(raw.smart?.specific || raw.specific || raw.title || 'Thực hiện nhiệm vụ cụ thể'),
      measurable: String(
        raw.smart?.measurable || raw.measurable || 'Hoàn thành 100% khối lượng đạt chuẩn chất lượng'
      ),
      achievable: String(raw.smart?.achievable || raw.achievable || 'Nguồn lực nội bộ MVĐN'),
      relevant: String(raw.smart?.relevant || raw.relevant || 'Đảm bảo mục tiêu tiến độ & chất lượng'),
      timeBound: String(raw.smart?.timeBound || raw.timeBound || raw.dueDate || today),
    };
    const isCompleted = raw.status === 'DONE' || raw.status === 'COMPLETED';
    const normalizedStatus: SmartTask['status'] = isCompleted
      ? 'DONE'
      : raw.status === 'TODO' || raw.status === 'REVIEW' || raw.status === 'IN_PROGRESS'
      ? raw.status
      : 'IN_PROGRESS';
    const rawId = String(raw.id || `smart-${Date.now()}`);
    const inferredType: SmartTask['taskType'] =
      raw.taskType === 'DRI_ACTION' || raw.taskType === 'SMART_GOAL'
        ? raw.taskType
        : rawId.startsWith('task-') || rawId.startsWith('dri-') || rawId.startsWith('sample-dri-')
        ? 'DRI_ACTION'
        : 'SMART_GOAL';
    return {
      ...raw,
      id: rawId,
      taskType: inferredType,
      title: String(raw.title || 'Nhiệm vụ SMART'),
      department: String(raw.department || 'Sản xuất'),
      assigneeName: String(raw.assigneeName || 'Quản đốc Sản xuất'),
      dueDate: String(raw.dueDate || today),
      priority: raw.priority || 'HIGH',
      status: normalizedStatus,
      progress: typeof raw.progress === 'number' ? raw.progress : isCompleted ? 100 : 50,
      smart,
      smartScore: typeof raw.smartScore === 'number' ? raw.smartScore : computeSmartScore(smart),
      followUpCount: Number(raw.followUpCount || 0),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies SmartTask;
  }

  if (collectionName.includes('pdca')) {
    return {
      ...raw,
      id: String(raw.id || `pdca-${Date.now()}`),
      title: String(raw.title || 'Chu trình cải tiến PDCA'),
      area: raw.area || 'PRODUCTION',
      ownerName: String(raw.ownerName || raw.doOwner || 'Quản đốc Sản xuất'),
      phase: raw.phase || raw.currentPhase || 'PLAN',
      planProblem: String(raw.planProblem || raw.planRootCause || 'Xác định nguyên nhân gốc rễ'),
      doExperiment: String(raw.doExperiment || raw.doActions || raw.planSolution || 'Thử nghiệm giải pháp'),
      checkEvaluation: String(raw.checkEvaluation || raw.checkResult || 'Đo lường kết quả thực tế'),
      actStandardize: String(raw.actStandardize || raw.actStandard || 'Chuẩn hóa quy trình SOP'),
      metricBaseline: String(raw.metricBaseline || 'Trước cải tiến'),
      metricTarget: String(raw.metricTarget || 'Mục tiêu'),
      metricActual: String(raw.metricActual || 'Đang đo lường'),
      dueDate: String(raw.dueDate || raw.checkDate || today),
      iteration: Number(raw.iteration || 1),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies PdcaCycle;
  }

  if (collectionName.includes('meetings')) {
    const rawActions = Array.isArray(raw.actionItems) ? raw.actionItems : [];
    return {
      ...raw,
      id: String(raw.id || `meet-${Date.now()}`),
      title: String(raw.title || 'Cuộc họp điều hành 3-6-9'),
      topic: String(raw.topic || raw.agenda || raw.title || ''),
      objective: String(raw.objective || 'Ra quyết định & thống nhất hành động ngay trong cuộc họp'),
      date: raw.id === 'sample-meet-01' ? today : String(raw.date || today),
      startTime: String(raw.startTime || raw.time || '08:30'),
      durationMinutes: Number(raw.durationMinutes || 30),
      chairperson: String(raw.chairperson || 'CEO / Giám Đốc Điều Hành'),
      participants: Array.isArray(raw.participants) ? raw.participants : ['Ban Giám Đốc'],
      preReadDocs: String(raw.preReadDocs || 'Dữ liệu ERP ProTrack'),
      meetingRules: String(raw.meetingRules || 'Đúng giờ • Trọng tâm • Quyết định rõ ràng'),
      agendaFlow: Array.isArray(raw.agendaFlow) ? raw.agendaFlow : [],
      decisionsSummary: String(raw.decisionsSummary || raw.notes || ''),
      sixStepsCompleted:
        Array.isArray(raw.sixStepsCompleted) && raw.sixStepsCompleted.length === 6
          ? raw.sixStepsCompleted
          : [true, true, true, true, false, false],
      ninePrinciplesChecked:
        Array.isArray(raw.ninePrinciplesChecked) && raw.ninePrinciplesChecked.length === 9
          ? raw.ninePrinciplesChecked
          : [true, true, true, true, true, true, false, false, false],
      actionItems: rawActions.map((a: any, idx: number) => ({
        id: String(a?.id || `act-${idx}`),
        taskTitle: String(a?.taskTitle || 'Nhiệm vụ sau họp'),
        assigneeName: String(a?.assigneeName || 'Quản đốc Sản xuất'),
        dueDate: String(a?.dueDate || today),
        status: a?.status || (a?.completed ? 'COMPLETED' : 'PENDING'),
        supervisedCount: Number(a?.supervisedCount || 0),
      })),
      status: raw.status || 'FOLLOW_UP',
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies Meeting369;
  }

  if (collectionName.includes('okrs')) {
    const rawKrs = Array.isArray(raw.keyResults) ? raw.keyResults : [];
    return {
      ...raw,
      id: String(raw.id || `okr-${Date.now()}`),
      quarter: String(raw.quarter || raw.period || 'Q4/2026'),
      title: String(raw.title || 'Mục tiêu OKR'),
      department: String(raw.department || 'Toàn Công Ty MVĐN'),
      ownerName: String(raw.ownerName || 'Ban Giám Đốc'),
      priority: raw.priority || 'P0',
      keyResults: rawKrs.map((kr: any, idx: number) => ({
        id: String(kr?.id || `kr-${idx}`),
        title: String(kr?.title || 'Kết quả then chốt'),
        startValue: Number(kr?.startValue ?? 0),
        targetValue: Number(kr?.targetValue ?? 100),
        currentValue: Number(kr?.currentValue ?? 0),
        unit: String(kr?.unit || '%'),
        linkedErpMetric:
          kr?.linkedErpMetric ||
          (kr?.autoMetric === 'ON_TIME_LSX_RATE' ? 'ON_TIME_LSX_RATE' : 'MANUAL'),
      })),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies OkrObjective;
  }

  if (collectionName.includes('swot')) {
    let entries: SwotEntry[] = Array.isArray(raw.entries) ? raw.entries : [];
    if (entries.length === 0) {
      const sList = Array.isArray(raw.strengths) ? raw.strengths : [];
      const wList = Array.isArray(raw.weaknesses) ? raw.weaknesses : [];
      const oList = Array.isArray(raw.opportunities) ? raw.opportunities : [];
      const tList = Array.isArray(raw.threats) ? raw.threats : [];
      entries = [
        ...sList.map((c: string, i: number) => ({ id: `s-${i}`, type: 'S' as const, content: String(c), impact: 'HIGH' as const })),
        ...wList.map((c: string, i: number) => ({ id: `w-${i}`, type: 'W' as const, content: String(c), impact: 'HIGH' as const })),
        ...oList.map((c: string, i: number) => ({ id: `o-${i}`, type: 'O' as const, content: String(c), impact: 'HIGH' as const })),
        ...tList.map((c: string, i: number) => ({ id: `t-${i}`, type: 'T' as const, content: String(c), impact: 'HIGH' as const })),
      ];
    }

    let towsActions: TowsStrategicAction[] = Array.isArray(raw.towsActions) ? raw.towsActions : [];
    if (towsActions.length === 0 && raw.towsStrategies) {
      const ts = raw.towsStrategies;
      if (ts.so) towsActions.push({ id: 'tows-so', strategyType: 'SO', actionTitle: String(ts.so), ownerName: 'Ban Giám Đốc', dueDate: today, status: 'EXECUTING' });
      if (ts.wo) towsActions.push({ id: 'tows-wo', strategyType: 'WO', actionTitle: String(ts.wo), ownerName: 'Quản đốc Sản xuất', dueDate: today, status: 'EXECUTING' });
      if (ts.st) towsActions.push({ id: 'tows-st', strategyType: 'ST', actionTitle: String(ts.st), ownerName: 'Ban Giám Đốc', dueDate: today, status: 'PLANNED' });
      if (ts.wt) towsActions.push({ id: 'tows-wt', strategyType: 'WT', actionTitle: String(ts.wt), ownerName: 'Mua hàng & Kho', dueDate: today, status: 'PLANNED' });
    }

    return {
      ...raw,
      id: String(raw.id || `swot-${Date.now()}`),
      title: String(raw.title || 'Phân tích Chiến lược Cạnh tranh SWOT'),
      period: String(raw.period || `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`),
      focusDomain: String(raw.focusDomain || 'Sản xuất & Kinh doanh MVĐN'),
      entries: Array.isArray(entries) ? entries : [],
      towsActions: Array.isArray(towsActions) ? towsActions : [],
      updatedAt: String(raw.updatedAt || raw.updatedAtStr || new Date().toISOString()),
    } satisfies SwotBoard;
  }

  if (collectionName.includes('coaching')) {
    const tierMap: Record<string, MaslowLevelNumber> = {
      PHYSIOLOGICAL: 1,
      SAFETY: 2,
      BELONGING: 3,
      ESTEEM: 4,
      SELF_ACTUALIZATION: 5,
    };
    const level: MaslowLevelNumber =
      (raw.dominantNeedLevel as MaslowLevelNumber) ||
      tierMap[raw.bottleneckTier] ||
      4;

    return {
      ...raw,
      id: String(raw.id || `maslow-${Date.now()}`),
      employeeName: String(raw.employeeName || 'Nhân sự MVĐN'),
      department: String(raw.department || 'Sản xuất'),
      role: String(raw.role || 'Nhân viên'),
      dominantNeedLevel: level,
      satisfactionScores: raw.satisfactionScores || {
        level1Physiological: 8,
        level2Safety: 8,
        level3Belonging: 8,
        level4Esteem: 7,
        level5SelfActualization: 7,
      },
      currentObservation: String(raw.currentObservation || raw.observedSymptoms || 'Đang theo dõi tạo động lực'),
      motivationAction: String(raw.motivationAction || raw.aiActionPlan || 'Ghi nhận & trao quyền phát triển'),
      nextCheckInDate: String(raw.nextCheckInDate || raw.followUpDate || today),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies MaslowEmployeePlan;
  }

  if (collectionName.includes('praises')) {
    return {
      ...raw,
      id: String(raw.id || `ffc-${Date.now()}`),
      recipientName: String(raw.recipientName || raw.employeeName || 'Nhân sự xuất sắc'),
      department: String(raw.department || 'Sản xuất'),
      feeling: String(raw.feeling || 'Ban Giám Đốc rất vui mừng và tự hào.'),
      fact: String(raw.fact || raw.finalMessage || 'Đã hoàn thành xuất sắc công việc được giao.'),
      compare: String(raw.compare || 'Vượt định mức kỳ vọng và lan tỏa tinh thần tích cực.'),
      sentToErp: Boolean(raw.sentToErp ?? raw.sentToErpAnnouncement ?? true),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies FfcPraiseRecord;
  }

  if (collectionName.includes('prep')) {
    return {
      ...raw,
      id: String(raw.id || `prep-${Date.now()}`),
      title: String(raw.title || 'Thông điệp điều hành PREP'),
      audience: String(raw.audience || 'Toàn bộ nhân sự MVĐN'),
      category: raw.category || 'DIRECTIVE',
      pointOpening: String(raw.pointOpening || raw.pointStart || ''),
      reasonWhy: String(raw.reasonWhy || raw.reason || ''),
      exampleEvidence: String(raw.exampleEvidence || raw.example || ''),
      pointClosing: String(raw.pointClosing || raw.pointEnd || ''),
      publishedToErp: Boolean(raw.publishedToErp ?? true),
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies PrepMessage;
  }

  if (collectionName.includes('missions')) {
    return {
      ...raw,
      id: String(raw.id || `mission-${Date.now()}`),
      title: String(raw.title || 'Nhiệm vụ chiến lược'),
      timeframe: String(raw.timeframe || '30 ngày'),
      startDate: String(raw.startDate || today),
      targetDate: String(raw.targetDate || today),
      driName: String(raw.driName || 'Quản Đốc Sản Xuất'),
      status: raw.status || 'ON_TRACK',
      progress: Number(raw.progress || 0),
      prep: {
        point: String(raw.prep?.point || ''),
        reason: String(raw.prep?.reason || ''),
        evidence: String(raw.prep?.evidence || ''),
        action: String(raw.prep?.action || ''),
        budgetOrAuthority: String(raw.prep?.budgetOrAuthority || ''),
        mainRisk: String(raw.prep?.mainRisk || ''),
      },
      linkedOkrIds: Array.isArray(raw.linkedOkrIds) ? raw.linkedOkrIds : [],
      linkedInitiativeIds: Array.isArray(raw.linkedInitiativeIds) ? raw.linkedInitiativeIds : [],
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies CeoMission;
  }

  if (collectionName.includes('initiatives')) {
    return {
      ...raw,
      id: String(raw.id || `init-${Date.now()}`),
      title: String(raw.title || 'Dự án cải tiến PDCA'),
      driName: String(raw.driName || 'Trưởng BP Kỹ Thuật'),
      targetDate: String(raw.targetDate || today),
      status: raw.status || 'IN_PROGRESS',
      pdcaPhase: raw.pdcaPhase || 'PLAN',
      taskIds: Array.isArray(raw.taskIds) ? raw.taskIds : [],
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies CeoInitiative;
  }

  if (collectionName.includes('andon')) {
    return {
      ...raw,
      id: String(raw.id || `andon-${Date.now()}`),
      issueCode: String(raw.issueCode || `ANDON-${Date.now()}`),
      category: raw.category || 'OTHER',
      severity: raw.severity || 'MINOR',
      lineOrMachine: String(raw.lineOrMachine || 'Dây chuyền sản xuất'),
      description: String(raw.description || ''),
      reportedBy: String(raw.reportedBy || 'Thợ máy'),
      detectedAt: String(raw.detectedAt || new Date().toISOString()),
      driName: String(raw.driName || 'Trưởng BP Kỹ Thuật'),
      status: raw.status || 'REPORTED',
      createdAt: String(raw.createdAt || new Date().toISOString()),
    } satisfies AndonIssue;
  }

  if (collectionName.includes('decisions')) {
    return {
      ...raw,
      id: String(raw.id || `dec-${Date.now()}`),
      type: raw.type || 'BLOCKED_TASK',
      title: String(raw.title || 'Quyết định cần xử lý'),
      requestedBy: String(raw.requestedBy || 'Nhân viên'),
      requestedAt: String(raw.requestedAt || new Date().toISOString()),
      reason: String(raw.reason || ''),
      decisionNeeded: String(raw.decisionNeeded || ''),
      urgency: raw.urgency || 'NORMAL',
      status: raw.status || 'PENDING',
    } satisfies CeoDecisionItem;
  }

  return raw;
}

// ─── HỆ THỐNG LƯU TRỮ DUAL-SYNC (LOCAL MIRROR + FIRESTORE `axis_*`) ─────────
const STORAGE_PREFIX = 'proceo_v2_';

function getDeletedSampleIds(): Set<string> {
  try {
    const raw = localStorage.getItem('proceo_deleted_sample_ids');
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function markSampleIdDeleted(id: string): void {
  if (!id.startsWith('sample-')) return;
  try {
    const set = getDeletedSampleIds();
    set.add(id);
    localStorage.setItem('proceo_deleted_sample_ids', JSON.stringify(Array.from(set)));
  } catch {}
}

export function mergeWithSampleSeeds<T extends { id: string }>(
  _collectionName: string,
  items: T[],
  seeds: T[]
): T[] {
  if (!seeds || seeds.length === 0) return items || [];
  const deletedSet = getDeletedSampleIds();
  const seedIds = new Set(seeds.map((s) => s.id));
  const itemMap = new Map<string, T>();

  // 1. Giữ lại toàn bộ các bản ghi do người dùng tự tạo (không phải ID mẫu hệ thống)
  (items || []).forEach((item) => {
    if (item && item.id && !DEMO_IDS.has(item.id) && !seedIds.has(item.id)) {
      itemMap.set(item.id, item);
    }
  });

  // 2. Cập nhật các bản ghi mẫu chuẩn theo dữ liệu mới nhất (từ ERP) nếu chưa bị xóa
  seeds.forEach((seed) => {
    if (!deletedSet.has(seed.id)) {
      itemMap.set(seed.id, seed);
    }
  });

  return Array.from(itemMap.values());
}

function loadLocal<T extends { id?: string }>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) {
      if (fallback && fallback.length > 0) {
        saveLocal(key, fallback);
        return fallback;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback || [];
    const filtered = parsed
      .filter((item) => item && typeof item === 'object' && !DEMO_IDS.has(item.id))
      .map((item) => normalizeDocument(key, item)) as T[];
    return filtered;
  } catch {
    return fallback || [];
  }
}

function saveLocal<T>(key: string, items: T[]): void {
  try {
    const cleanItems = Array.isArray(items)
      ? items.filter((item: any) => !DEMO_IDS.has(item?.id))
      : [];
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(cleanItems));
  } catch (err) {
    console.warn('[ceoStorageService] LocalStorage save error:', err);
  }
}

let dynamicSeedsBundle = defaultBundle;

function getCollectionSeeds<T extends { id: string }>(collectionName: string, fallback: T[]): T[] {
  if (collectionName.includes('missions')) return (dynamicSeedsBundle.missions as any) || fallback;
  if (collectionName.includes('initiatives')) return (dynamicSeedsBundle.initiatives as any) || fallback;
  if (collectionName.includes('andon')) return (dynamicSeedsBundle.andonIssues as any) || fallback;
  if (collectionName.includes('decisions')) return (dynamicSeedsBundle.decisionItems as any) || fallback;
  if (collectionName.includes('schedules')) return (dynamicSeedsBundle.schedules as any) || fallback;
  if (collectionName.includes('tasks')) return (dynamicSeedsBundle.smartTasks as any) || fallback;
  if (collectionName.includes('pdca')) return (dynamicSeedsBundle.pdcaCycles as any) || fallback;
  if (collectionName.includes('meetings')) return (dynamicSeedsBundle.meetings as any) || fallback;
  if (collectionName.includes('okrs')) return (dynamicSeedsBundle.okrs as any) || fallback;
  if (collectionName.includes('swot')) return (dynamicSeedsBundle.swotBoards as any) || fallback;
  if (collectionName.includes('coaching')) return (dynamicSeedsBundle.maslowPlans as any) || fallback;
  if (collectionName.includes('praises')) return (dynamicSeedsBundle.ffcPraises as any) || fallback;
  if (collectionName.includes('prep')) return (dynamicSeedsBundle.prepMessages as any) || fallback;
  return fallback;
}

export const ceoStorageService = {
  updateDynamicSeeds(bundle: ReturnType<typeof buildRealErpSeeds>) {
    dynamicSeedsBundle = bundle;
  },

  getCollectionSeeds,

  getLocalMerged<T extends { id: string }>(collectionName: string, defaultSeed: T[]): T[] {
    const activeSeeds = getCollectionSeeds<T>(collectionName, defaultSeed);
    const local = loadLocal<T>(collectionName, activeSeeds);
    return mergeWithSampleSeeds(collectionName, local, activeSeeds);
  },

  subscribeCollection<T extends { id: string }>(
    collectionName: string,
    defaultSeed: T[],
    onData: (items: T[]) => void
  ): () => void {
    // 1. Nạp ngay từ LocalStorage sạch và kết hợp với bộ ví dụ mẫu chuẩn
    const activeSeeds = getCollectionSeeds<T>(collectionName, defaultSeed);
    const initialLocal = loadLocal<T>(collectionName, activeSeeds);
    const initialMerged = mergeWithSampleSeeds(collectionName, initialLocal, activeSeeds);
    onData(initialMerged);

    // 2. Lắng nghe realtime từ Firestore (loại bỏ và xóa vĩnh viễn các bản ghi mẫu demo cũ)
    let unsubFirestore: (() => void) | null = null;
    try {
      unsubFirestore = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          // Xóa ngay các document demo nếu còn tồn tại trên Firestore
          snapshot.docs.forEach((d) => {
            if (DEMO_IDS.has(d.id)) {
              deleteDoc(d.ref).catch(() => {});
            }
          });

          const remoteItems = snapshot.docs
            .filter((d) => !DEMO_IDS.has(d.id))
            .map((d) =>
              normalizeDocument(collectionName, {
                id: d.id,
                ...(d.data() as any),
              })
            ) as T[];

          // Luôn kết hợp dữ liệu Firestore với các ví dụ mẫu chuẩn mới nhất
          const freshSeeds = getCollectionSeeds<T>(collectionName, defaultSeed);
          const merged = mergeWithSampleSeeds(collectionName, remoteItems, freshSeeds);
          saveLocal(collectionName, merged);
          onData(merged);

          // Tự động đồng bộ các ví dụ mẫu lên Firestore nếu trên đám mây chưa có
          if (remoteItems.length === 0 && freshSeeds.length > 0) {
            freshSeeds.forEach((seed) => {
              setDoc(doc(db, collectionName, seed.id), removeUndefinedDeep(seed), {
                merge: true,
              }).catch(() => {});
            });
          }
        },
        () => {
          // Khi offline hoặc chưa có quyền, dùng bản hợp nhất từ LocalStorage
          const freshSeeds = getCollectionSeeds<T>(collectionName, defaultSeed);
          const local = loadLocal<T>(collectionName, freshSeeds);
          const merged = mergeWithSampleSeeds(collectionName, local, freshSeeds);
          onData(merged);
        }
      );
    } catch {
      // Fallback LocalStorage
      const freshSeeds = getCollectionSeeds<T>(collectionName, defaultSeed);
      const local = loadLocal<T>(collectionName, freshSeeds);
      const merged = mergeWithSampleSeeds(collectionName, local, freshSeeds);
      onData(merged);
    }

    return () => {
      if (unsubFirestore) {
        try {
          unsubFirestore();
        } catch {}
      }
    };
  },

  async upsertItem<T extends { id: string }>(
    collectionName: string,
    item: T,
    currentList: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>
  ): Promise<void> {
    const cleaned = normalizeDocument(collectionName, removeUndefinedDeep(item)) as T;
    const exists = currentList.some((x) => x.id === cleaned.id);
    const nextList = exists
      ? currentList.map((x) => (x.id === cleaned.id ? cleaned : x))
      : [cleaned, ...currentList];

    setList(nextList);
    saveLocal(collectionName, nextList);

    try {
      await setDoc(doc(db, collectionName, cleaned.id), removeUndefinedDeep(cleaned), {
        merge: true,
      });
    } catch {
      // Đã lưu an toàn vào Local Mirror
    }
  },

  async removeItem<T extends { id: string }>(
    collectionName: string,
    id: string,
    currentList: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>
  ): Promise<void> {
    markSampleIdDeleted(id);
    const nextList = currentList.filter((x) => x.id !== id);
    setList(nextList);
    saveLocal(collectionName, nextList);

    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch {
      // Đã xóa trong Local Mirror
    }
  },

  /**
   * Xuất toàn bộ dữ liệu 8 hệ thống quản trị thành chuỗi JSON backup hoàn chỉnh
   */
  exportBackupJson(dataSnapshot: {
    schedules: ScheduleItem[];
    smartTasks: SmartTask[];
    pdcaCycles: PdcaCycle[];
    meetings: Meeting369[];
    okrs: OkrObjective[];
    swotBoards: SwotBoard[];
    maslowPlans: MaslowEmployeePlan[];
    ffcPraises: FfcPraiseRecord[];
    prepMessages: PrepMessage[];
  }): string {
    const payload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'ProCEO - Personal Executive Management System',
      data: dataSnapshot,
    };
    return JSON.stringify(payload, null, 2);
  },

  /**
   * Phục hồi dữ liệu từ file backup JSON
   */
  async restoreBackupJson(
    jsonString: string,
    setters: {
      setSchedules: (v: ScheduleItem[]) => void;
      setSmartTasks: (v: SmartTask[]) => void;
      setPdcaCycles: (v: PdcaCycle[]) => void;
      setMeetings: (v: Meeting369[]) => void;
      setOkrs: (v: OkrObjective[]) => void;
      setSwotBoards: (v: SwotBoard[]) => void;
      setMaslowPlans: (v: MaslowEmployeePlan[]) => void;
      setFfcPraises: (v: FfcPraiseRecord[]) => void;
      setPrepMessages: (v: PrepMessage[]) => void;
    }
  ): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        return { success: false, message: 'File backup không hợp lệ hoặc thiếu cấu trúc data.' };
      }
      const d = parsed.data;
      if (Array.isArray(d.schedules)) {
        saveLocal('axis_ceo_schedules', d.schedules);
        setters.setSchedules(d.schedules);
      }
      if (Array.isArray(d.smartTasks)) {
        saveLocal('axis_ceo_tasks', d.smartTasks);
        setters.setSmartTasks(d.smartTasks);
      }
      if (Array.isArray(d.pdcaCycles)) {
        saveLocal('axis_ceo_pdca', d.pdcaCycles);
        setters.setPdcaCycles(d.pdcaCycles);
      }
      if (Array.isArray(d.meetings)) {
        saveLocal('axis_ceo_meetings', d.meetings);
        setters.setMeetings(d.meetings);
      }
      if (Array.isArray(d.okrs)) {
        saveLocal('axis_ceo_okrs', d.okrs);
        setters.setOkrs(d.okrs);
      }
      if (Array.isArray(d.swotBoards)) {
        saveLocal('axis_ceo_swot', d.swotBoards);
        setters.setSwotBoards(d.swotBoards);
      }
      if (Array.isArray(d.maslowPlans)) {
        saveLocal('axis_ceo_coaching', d.maslowPlans);
        setters.setMaslowPlans(d.maslowPlans);
      }
      if (Array.isArray(d.ffcPraises)) {
        saveLocal('axis_ceo_praises', d.ffcPraises);
        setters.setFfcPraises(d.ffcPraises);
      }
      if (Array.isArray(d.prepMessages)) {
        saveLocal('axis_ceo_prep_docs', d.prepMessages);
        setters.setPrepMessages(d.prepMessages);
      }
      return { success: true, message: 'Đã phục hồi dữ liệu thành công!', count: Object.keys(d).length };
    } catch (e: any) {
      return { success: false, message: `Lỗi đọc dữ liệu backup: ${e.message || String(e)}` };
    }
  },

  getOperatingMode(): 'PERSONAL' | 'ORGANIZATION' {
    try {
      const saved = localStorage.getItem('proceo_operating_mode');
      return saved === 'ORGANIZATION' ? 'ORGANIZATION' : 'PERSONAL';
    } catch {
      return 'PERSONAL';
    }
  },

  setOperatingMode(mode: 'PERSONAL' | 'ORGANIZATION'): void {
    try {
      localStorage.setItem('proceo_operating_mode', mode);
    } catch {}
  },
};
