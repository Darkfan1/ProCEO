import {
  AxisScheduleItem,
  AxisSmartTask,
  AxisPdcaCycle,
  AxisOkrObjective,
  AxisSwotBoard,
  AxisMeeting,
  CheckinMilestone369,
} from '../types/axisTypes';
import { addLocalDaysYmd, getLocalTodayYmd, parseLocalYmd } from '../utils/dateUtils';

const todayStr = () => getLocalTodayYmd();

const addDaysStr = (days: number) => addLocalDaysYmd(days);

export function buildCheckin369(startDate: string, dueDate: string): CheckinMilestone369[] {
  const startMs = parseLocalYmd(startDate).getTime();
  const endMs = parseLocalYmd(dueDate).getTime();
  const span = Math.max(endMs - startMs, 3 * 24 * 60 * 60 * 1000);

  const fmt = (ratio: number) => getLocalTodayYmd(new Date(startMs + span * ratio));

  return [
    {
      stage: '1',
      label: 'Mốc 1: Khởi động & Thống nhất hướng đi',
      percent: 30,
      dueDate: fmt(0.3),
      guidingQuestion: 'Nhân sự đã hiểu đúng 100% mục tiêu đầu ra và phương pháp thực hiện chưa?',
      completed: false,
    },
    {
      stage: '2',
      label: 'Mốc 2: Giám sát giữa kỳ & Tháo gỡ khó khăn',
      percent: 60,
      dueDate: fmt(0.6),
      guidingQuestion: 'Tiến độ thực tế có đang đúng kế hoạch không? Có điểm nghẽn nào cần CEO tháo gỡ ngay?',
      completed: false,
    },
    {
      stage: '3',
      label: 'Mốc 3: Tiền nghiệm thu & Chuẩn bị bàn giao',
      percent: 90,
      dueDate: fmt(0.9),
      guidingQuestion: 'Chất lượng kết quả đầu ra đã đạt chuẩn chưa, có rủi ro nào cần xử lý trước giờ chốt?',
      completed: false,
    },
  ];
}

export const SEED_SCHEDULES: AxisScheduleItem[] = [
  {
    id: 'seed-sch-1',
    title: 'Điểm tin Radar ERP & duyệt nhanh Đề xuất tồn đọng',
    time: '08:15',
    date: todayStr(),
    recurrence: 'WEEKDAYS',
    category: 'ROUTINE',
    priority: 'HIGH',
    note: 'Kiểm tra LSX sát hạn giao hàng & tình trạng dừng máy.',
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-sch-2',
    title: 'Rà soát các mốc Check-in tiến độ & Khen ngợi FFC',
    time: '16:30',
    date: todayStr(),
    recurrence: 'WEEKDAYS',
    category: 'REMINDER',
    priority: 'NORMAL',
    note: 'Ghi nhận ít nhất 1 hành vi tích cực trong ngày của đội ngũ.',
    completedDates: [],
    createdAt: new Date().toISOString(),
  },
];

export const SEED_SMART_TASKS: AxisSmartTask[] = [
  {
    id: 'seed-smart-1',
    title: 'Chuẩn hóa quy trình bàn giao khuôn bế & giảm thời gian chờ lên máy',
    assigneeName: 'Quản lý sản xuất',
    department: 'Sản Xuất',
    startDate: todayStr(),
    dueDate: addDaysStr(9),
    status: 'IN_PROGRESS',
    specific: 'Thiết lập bảng checklist chuẩn bị sẵn khuôn bế + vật tư trước ca chạy máy 2 giờ.',
    measurable: 'Giảm thời gian dừng chờ khuôn/vật tư đầu ca xuống dưới 15 phút/lệnh.',
    achievable: 'Phối hợp trực tiếp giữa Tổ trưởng Bế, Thiết kế khuôn và Kho NVL trên ProTrack.',
    relevant: 'Tăng năng suất máy chạy thực tế và đảm bảo tỷ lệ giao hàng đúng hẹn > 98%.',
    timeBound: `Hoàn tất thử nghiệm và báo cáo số liệu trước ngày ${addDaysStr(9)}.`,
    checkins: buildCheckin369(todayStr(), addDaysStr(9)),
    createdAt: new Date().toISOString(),
  },
];

export const SEED_PDCA: AxisPdcaCycle[] = [
  {
    id: 'seed-pdca-1',
    title: 'Giảm tỷ lệ hao hụt canh bài công đoạn In Flexo nhiều màu',
    department: 'Xưởng In',
    currentPhase: 'CHECK',
    planRootCause: 'Thông số anilox và công thức pha mực của các mã hàng tái bản chưa được tra cứu đồng nhất trước khi lên máy.',
    planSolution: 'Bắt buộc đối chiếu Hồ sơ In trên ProTrack và ghi nhận thông số canh bài chuẩn cho từng mã sản phẩm.',
    doActions: 'Áp dụng thí điểm trên 15 LSX in màu tái bản trong tuần này.',
    doOwner: 'Tổ trưởng In',
    checkDate: addDaysStr(2),
    checkResult: 'Đang thu thập số mét giấy hao hụt trung bình so với tháng trước.',
    actStandard: '',
    createdAt: new Date().toISOString(),
  },
];

export const SEED_OKRS: AxisOkrObjective[] = [
  {
    id: 'seed-okr-1',
    period: `Q${Math.floor(new Date().getMonth() / 3) + 1}/${new Date().getFullYear()}`,
    title: 'Vận hành nhà máy chuẩn xác, giao hàng đúng cam kết và nâng tầm đội ngũ kế cận',
    whyItMatters: 'Xây dựng uy tín tuyệt đối với khách hàng lớn và giải phóng CEO khỏi sự vụ hàng ngày.',
    status: 'ON_TRACK',
    keyResults: [
      {
        id: 'kr-1',
        title: 'Tỷ lệ Lệnh sản xuất (LSX) đảm bảo tiến độ giao hàng',
        targetValue: 95,
        currentValue: 90,
        unit: '%',
        autoMetric: 'ON_TIME_LSX_RATE',
      },
      {
        id: 'kr-2',
        title: 'Tỷ lệ giải quyết dứt điểm các Đề xuất nội bộ trên ERP',
        targetValue: 100,
        currentValue: 85,
        unit: '%',
        autoMetric: 'PROPOSAL_RESOLVED_RATE',
      },
      {
        id: 'kr-3',
        title: 'Chuẩn hóa và ban hành tài liệu quy trình cải tiến (PDCA / OJT)',
        targetValue: 6,
        currentValue: 2,
        unit: 'quy trình',
        autoMetric: 'NONE',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const SEED_SWOT: AxisSwotBoard = {
  id: 'main-swot',
  title: 'Hệ Quy Chiếu Chiến Lược Toàn Công Ty',
  period: `Năm ${new Date().getFullYear()}`,
  strengths: [
    'Hệ thống ERP ProTrack theo dõi thời gian thực từng công đoạn In - Bế - Xẻ - Đóng gói',
    'Đáp ứng linh hoạt cả đơn hàng Flexo số lượng lớn, In nhanh và Mực Ribbon',
  ],
  weaknesses: [
    'Một số vị trí kỹ thuật chủ chốt còn phụ thuộc tay nghề cá nhân, cần đẩy mạnh OJT',
    'Khâu kiểm soát tiến độ giữa chừng đôi khi chưa sát, cần áp dụng kỷ luật Họp 3-6-9',
  ],
  opportunities: [
    'Nhu cầu tem nhãn mã vạch truy xuất nguồn gốc, logistics và xuất khẩu tăng trưởng đều',
    'Ứng dụng AI & dữ liệu sản xuất để báo giá nhanh và tối ưu biên lợi nhuận',
  ],
  threats: [
    'Cạnh tranh về giá ở phân khúc tem nhãn phổ thông',
    'Biến động giá nguyên vật liệu giấy decal và film mực theo chu kỳ',
  ],
  towsStrategies: {
    so: 'Dùng lợi thế tốc độ phản hồi & quản trị tiến độ minh bạch trên ERP để chinh phục nhóm khách hàng FDI/xuất khẩu.',
    wo: 'Chuẩn hóa thư viện Hồ sơ In + Đào tạo OJT kèm cặp để nhân bản nhanh đội ngũ thợ vận hành.',
    st: 'Giữ chân khách hàng chiến lược bằng cam kết giao hàng đúng hẹn 98%+ thay vì chạy đua giảm giá.',
    wt: 'Áp dụng vòng lặp PDCA hàng tháng để kéo giảm tỷ lệ hao hụt vật tư và thời gian dừng máy.',
  },
  updatedAtStr: new Date().toISOString(),
};

export const SEED_MEETINGS: AxisMeeting[] = [
  {
    id: 'seed-meet-1',
    title: 'Họp Giao Ban Điều Phối 3-6-9 Đầu Tuần',
    meetingType: 'MEETING_369',
    date: addDaysStr(1),
    time: '08:30',
    durationMinutes: 30,
    participants: ['Quản lý sản xuất', 'Kế toán kho', 'Sales Admin'],
    agenda: '1. Rà soát các đơn hàng trọng tâm trong tuần (10p)\n2. Báo cáo ngắn gọn theo chuẩn PREP các điểm nghẽn vật tư/khuôn bế (10p)\n3. Chốt đầu việc SMART & mốc kiểm tra 3-6-9 (10p)',
    notes: '',
    actionItems: [],
    status: 'UPCOMING',
    createdAt: new Date().toISOString(),
  },
];

