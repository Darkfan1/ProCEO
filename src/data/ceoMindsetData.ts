export type FrameworkCode =
  | 'SMART'
  | 'PDCA'
  | 'MEETING_369'
  | 'OKR'
  | 'PREP'
  | 'MASLOW'
  | 'FFC'
  | 'SWOT';

export interface MindsetPillar {
  key: string;
  label: string;
  subtitle: string;
  description: string;
  ceoQuestion: string;
  exampleAtMvdn: string;
}

export interface LibrarySectionArticle {
  title: string;
  content: string;
  bulletPoints?: string[];
}

export interface LibraryComparisonTable {
  title: string;
  leftHeader: string;
  rightHeader: string;
  rows: Array<{
    criterion: string;
    leftValue: string;
    rightValue: string;
  }>;
}

export interface LibraryStandardTemplate {
  name: string;
  usageWhen: string;
  templateText: string;
}

export interface LibraryClassicReference {
  workTitle: string;
  author: string;
  keyTakeaway: string;
}

export interface MindsetFrameworkDoc {
  code: FrameworkCode;
  docNumber: string;
  readingTime: string;
  shortName: string;
  fullTitle: string;
  category: string;
  tagline: string;
  corePhilosophy: string;
  accentColor: string;
  badgeClass: string;
  targetTab:
    | 'cockpit'
    | 'execution'
    | 'erp-bridge'
    | 'mindset-hub';
  targetSubView?: string;
  originAndHistory: {
    author: string;
    yearAndSource: string;
    historicalContext: string;
  };
  theoreticalFoundation: {
    academicEssence: string;
    formulaOrModel: string;
    synergyWithOtherFrameworks: string;
  };
  detailedSections: LibrarySectionArticle[];
  comparisonTable: LibraryComparisonTable;
  standardTemplates: LibraryStandardTemplate[];
  classicReferences: LibraryClassicReference[];
  pillars: MindsetPillar[];
  goldenRules: string[];
  commonPitfalls: string[];
  realCaseStudy: {
    context: string;
    badApproach: string;
    goodApproach: string;
    outcome: string;
  };
}

// ─── HẰNG SỐ CHUẨN HỌP 3-6-9 THEO ĐÚNG NỘI DUNG YÊU CẦU ─────────────────────
export const MEETING_369_FORMULAS = [
  {
    number: 'Công thức 1',
    title: 'Họp mà không thực hiện thì không đạt hiệu quả',
    formula: 'Họp + Không thực thi = 0 hiệu quả',
    actionableRule:
      'Mọi quyết định trong cuộc họp phải được chuyển hóa ngay thành hành động cụ thể trước khi rời phòng họp.',
  },
  {
    number: 'Công thức 2',
    title: 'Phân công nhưng không giám sát thì cũng không đạt hiệu quả',
    formula: 'Phân công + Không giám sát = 0 hiệu quả',
    actionableRule:
      'Mỗi đầu việc giao đi bắt buộc có mốc kiểm tra giữa kỳ (checkpoint) và trạng thái theo dõi trên hệ thống.',
  },
  {
    number: 'Công thức 3',
    title: 'Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Công việc được thực thi đúng kế hoạch',
    formula: 'Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Thực thi đúng kế hoạch',
    actionableRule:
      'CEO/Quản lý chủ động theo sát tiến độ và gửi nhắc nhở đôn đốc trực tiếp tới người chịu trách nhiệm.',
  },
];

export const MEETING_369_SIX_STEPS = [
  {
    step: 1,
    title: 'Chuẩn bị tài liệu trước',
    detail: 'Gửi trước số liệu ERP, báo cáo LSX, đề xuất liên quan tối thiểu 2-4 giờ trước khi họp để mọi người đọc trước.',
  },
  {
    step: 2,
    title: 'Xác định rõ chủ đề cuộc họp',
    detail: 'Mỗi cuộc họp chỉ tập trung giải quyết 1-3 chủ đề trọng tâm đã được định danh rõ ràng.',
  },
  {
    step: 3,
    title: 'Thiết lập quy tắc họp',
    detail: 'Đúng giờ, không dùng điện thoại riêng, phát biểu theo cấu trúc PREP, tập trung vào giải pháp thay vì đổ lỗi.',
  },
  {
    step: 4,
    title: 'Sắp xếp quy trình cuộc họp',
    detail: 'Phân bổ thời lượng rõ ràng cho từng phần: Mở đầu nêu mục tiêu → Thảo luận trọng tâm → Chốt quyết định & Phân công.',
  },
  {
    step: 5,
    title: 'Theo dõi kết quả cuộc họp',
    detail: 'Xuất biên bản họp rõ ràng ngay sau cuộc họp và chuyển các quyết định thành đầu việc SMART trên hệ thống.',
  },
  {
    step: 6,
    title: 'Kiểm tra tiến độ hoàn thành các nhiệm vụ đặt ra trong cuộc họp',
    detail: 'Rà soát định kỳ, đôn đốc người chịu trách nhiệm cho tới khi nhiệm vụ hoàn thành 100% đúng kế hoạch.',
  },
];

export const MEETING_369_NINE_PRINCIPLES = [
  'Xác định rõ mục tiêu cuộc họp',
  'Chọn đúng người tham dự',
  'Chuẩn bị nội dung, tài liệu và cấu trúc chương trình họp',
  'Bắt đầu đúng giờ và giới thiệu mục tiêu',
  'Giữ cuộc họp đi đúng trọng tâm',
  'Ra quyết định và thống nhất hành động ngay trong cuộc họp',
  'Có biên bản và tổng kết rõ ràng',
  'Theo dõi tiến độ và nhắc nhở hành động',
  'Đánh giá và cải tiến quy trình họp',
];

export const MASLOW_FIVE_LEVELS = [
  {
    level: 1 as const,
    name: 'Nhu cầu Sinh lý (Physiological)',
    subtitle: 'Thu nhập, lương thưởng, điều kiện làm việc tại xưởng',
    color: 'bg-rose-500',
    lightBg: 'bg-rose-50 text-rose-800 border-rose-200',
    indicators: 'Nhân viên lo lắng về thu nhập, tăng ca quá sức, môi trường xưởng nóng bức hoặc công cụ máy móc bất tiện.',
    ceoActions: [
      'Đảm bảo trả lương, phụ cấp ca kíp, thưởng năng suất đúng hạn và minh bạch.',
      'Cải thiện điều kiện thông gió, ánh sáng, nước uống và bữa ăn ca tại xưởng in/bế.',
      'Rà soát định mức đơn giá công đoạn công bằng theo tay nghề.',
    ],
  },
  {
    level: 2 as const,
    name: 'Nhu cầu An toàn (Safety)',
    subtitle: 'Sự ổn định công việc, bảo hiểm, an toàn lao động & quy trình rõ ràng',
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50 text-amber-800 border-amber-200',
    indicators: 'Nhân sự bất an khi đơn hàng biến động, sợ mắc lỗi bị phạt nặng hoặc quy trình vận hành máy chưa an toàn.',
    ceoActions: [
      'Ký hợp đồng lao động, BHXH đầy đủ và huấn luyện an toàn vận hành máy in/máy bế.',
      'Xây dựng SOP chuẩn cho từng công đoạn để công nhân yên tâm thao tác không sợ sai sót.',
      'Áp dụng phê bình xây dựng và hướng dẫn kèm cặp trước khi xử lý kỷ luật.',
    ],
  },
  {
    level: 3 as const,
    name: 'Nhu cầu Xã hội & Gắn kết (Belonging)',
    subtitle: 'Tình đồng nghiệp, văn hóa đội nhóm, sự quan tâm của cấp trên',
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    indicators: 'Nhân viên mới cô lập, thiếu phối hợp giữa bộ phận Kinh doanh - Thiết kế - Xưởng in.',
    ceoActions: [
      'Tổ chức chúc mừng sinh nhật, thăm hỏi gia đình, giao lưu giữa khối Văn phòng và Xưởng.',
      'Phân công Mentor kèm cặp nhân viên mới trong 30 ngày đầu.',
      'Xây dựng văn hóa hỗ trợ chéo giữa các công đoạn khi có đơn hàng gấp.',
    ],
  },
  {
    level: 4 as const,
    name: 'Nhu cầu Được tôn trọng (Esteem)',
    subtitle: 'Ghi nhận thành tích, lời khen FFC, danh hiệu & sự tin tưởng',
    color: 'bg-indigo-500',
    lightBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    indicators: 'Nhân viên giỏi làm nhiều nhưng chưa được tuyên dương kịp thời, cảm thấy đóng góp bị xem nhẹ.',
    ceoActions: [
      'Gửi lời khen theo nguyên tắc FFC (Feeling - Fact - Compare) ngay khi nhân sự vượt định mức hoặc cứu đơn gấp.',
      'Vinh danh Top công nhân có sản lượng đạt chuẩn cao nhất tuần/tháng trên bảng tin ERP.',
      'Lắng nghe ý kiến cải tiến kỹ thuật từ các tổ trưởng và thợ lành nghề.',
    ],
  },
  {
    level: 5 as const,
    name: 'Nhu cầu Tự thể hiện & Phát triển (Self-Actualization)',
    subtitle: 'Trao quyền làm chủ, sáng tạo cải tiến PDCA, lộ trình thăng tiến',
    color: 'bg-purple-600',
    lightBg: 'bg-purple-50 text-purple-800 border-purple-200',
    indicators: 'Quản lý cấp trung / kỹ thuật viên trưởng muốn thử thách mới, muốn tự chủ dẫn dắt dự án.',
    ceoActions: [
      'Trao quyền làm chủ các mục tiêu Key Results (OKR) và các dự án cải tiến PDCA.',
      'Đào tạo nâng cấp từ Thợ chính lên Tổ trưởng sản xuất / Quản đốc xưởng.',
      'Khuyến khích đề xuất sáng kiến tối ưu hao hụt vật tư và thưởng theo % giá trị làm lợi.',
    ],
  },
];

export const CEO_MINDSET_FRAMEWORKS: MindsetFrameworkDoc[] = [
  // ─── 1. NGUYÊN TẮC SMART ───────────────────────────────────────────────────
  {
    code: 'SMART',
    docNumber: 'DOC-CEO-01',
    readingTime: '10 phút đọc • Nền tảng Thực thi',
    shortName: 'Nguyên tắc SMART',
    fullTitle: 'Quản lý thiết lập mục tiêu doanh nghiệp - Nguyên tắc SMART',
    category: 'Thiết lập mục tiêu & Giao việc',
    tagline: 'Biến mệnh lệnh mơ hồ thành mục tiêu rõ ràng, đo lường được và có hạn chót cụ thể.',
    corePhilosophy:
      'Mọi mục tiêu hoặc công việc CEO giao xuống nếu thiếu bất kỳ chữ cái nào trong S-M-A-R-T đều dễ dẫn đến hiểu sai ý, đùn đẩy trách nhiệm hoặc trễ tiến độ. SMART là bộ lọc bắt buộc trước khi phát hành chỉ đạo.',
    accentColor: '#2563eb',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    targetTab: 'execution',
    targetSubView: 'SMART',
    originAndHistory: {
      author: 'George T. Doran (Cố vấn quản trị doanh nghiệp Hoa Kỳ), kế thừa nền tảng MBO của Peter Drucker (1954)',
      yearAndSource:
        'Tháng 11/1981 – Tạp chí Management Review (Tập 70, Số 11): "There\'s a S.M.A.R.T. way to write management\'s goals and objectives"',
      historicalContext:
        'Năm 1954, cha đẻ ngành quản trị hiện đại Peter Drucker giới thiệu học thuyết Quản trị theo Mục tiêu (Management by Objectives – MBO) trong cuốn "The Practice of Management". Tuy nhiên, suốt hơn hai thập kỷ sau đó, các tổng giám đốc và quản lý cấp trung vẫn gặp khó khăn khi chuyển hóa tầm nhìn chiến lược thành các chỉ tiêu thực thi hàng ngày. Tháng 11 năm 1981, George T. Doran xuất bản bài báo kinh điển trên tạp chí của Hiệp hội Quản lý Hoa Kỳ (AMA), lần đầu tiên định hình bộ tiêu chí 5 chữ cái S-M-A-R-T để chuẩn hóa cách viết mục tiêu trong doanh nghiệp.',
    },
    theoreticalFoundation: {
      academicEssence:
        'Theo Lý thuyết Thiết lập Mục tiêu (Goal-Setting Theory) của hai nhà tâm lý học tổ chức Edwin Locke và Gary Latham (1990), các mục tiêu cụ thể và có độ khó phù hợp tạo ra hiệu suất làm việc cao hơn từ 16% đến 25% so với các lời kêu gọi "hãy cố gắng hết sức". Nguyên tắc SMART loại bỏ "khoảng trống nhận thức" giữa ý chí của CEO và hành động của nhân viên thông qua việc định danh rõ đầu ra (Specific), thước đo nghiệm thu (Measurable), sự cân đối nguồn lực (Achievable/Assignable), tính liên kết chiến lược (Relevant) và áp lực thời gian (Time-bound).',
      formulaOrModel:
        'Mục tiêu chuẩn = [Động từ hành động] + [Đối tượng cụ thể (S)] + [Chỉ số đo lường định lượng (M)] + [Phương thức/Nguồn lực khả thi (A)] + [Đóng góp vào mục tiêu lớn (R)] + [Thời hạn hoàn thành chính xác (T)]',
      synergyWithOtherFrameworks:
        'Trong hệ sinh thái quản trị ProCEO: Phân tích SWOT xác định hướng đi chiến lược → OKR đặt cột mốc trọng tâm Quý → Nguyên tắc SMART bẻ nhỏ Key Results thành nhiệm vụ thực thi hàng ngày/hàng tuần → Chu trình PDCA kiểm soát và cải tiến khi nhiệm vụ SMART gặp vướng mắc.',
    },
    detailedSections: [
      {
        title: '1. Giải phẫu chuyên sâu 5 tiêu chí S – M – A – R – T trong quản trị điều hành',
        content:
          'Trong bài báo gốc năm 1981 của George T. Doran và sự phát triển của quản trị học hiện đại, mỗi chữ cái trong SMART đóng vai trò như một chốt chặn kiểm soát rủi ro thực thi:',
        bulletPoints: [
          'S – Specific (Cụ thể, Rõ ràng): Trả lời trọn vẹn câu hỏi 5W (What: Làm chính xác việc gì? Who: Ai là người chịu trách nhiệm duy nhất - Single Wringable Neck? Where: Tại bộ phận/công đoạn nào?). Tuyệt đối cấm các từ ngữ định tính như "nâng cao", "tăng cường", "cải thiện", "sớm nhất có thể".',
          'M – Measurable (Đo lường được): "Cái gì không đo lường được thì không quản lý được". Mỗi mục tiêu phải có ít nhất một chỉ số định lượng (Số lượng sản phẩm, Tỷ lệ % lỗi, Doanh thu VNĐ, Thời gian xử lý tính bằng phút/giờ) để khi đến hạn, bất kỳ ai nhìn vào cũng kết luận được ngay là ĐẠT hay CHƯA ĐẠT mà không cần tranh cãi.',
          'A – Achievable / Assignable (Khả thi & Giao đúng người): Trong bản gốc của Doran, chữ A là "Assignable" (xác định rõ ai sẽ làm). Trong quản trị hiện đại, A còn là "Achievable" (khả thi). Mục tiêu tốt là mục tiêu "kéo giãn" (Stretch Goal) nằm ở ngưỡng 110%–120% năng lực hiện tại nhưng phải được bảo chứng bằng máy móc, nguyên vật liệu, ngân sách và quyền hạn tương xứng.',
          'R – Relevant / Realistic (Liên quan & Thực tế): Áp dụng quy luật Pareto 80/20 – công việc này có đóng góp trực tiếp vào mục tiêu OKR của Quý hoặc giải quyết điểm nghẽn sống còn của doanh nghiệp hay không? Nếu một nhiệm vụ rất cụ thể nhưng không phục vụ mục tiêu chiến lược, đó là sự lãng phí nguồn lực.',
          'T – Time-bound (Có thời hạn rõ ràng): Định luật Parkinson chỉ ra rằng "Công việc sẽ luôn tự kéo giãn ra để lấp đầy thời gian được giao". Do đó, mọi mục tiêu phải có Deadline cụ thể đến từng giờ/ngày và các mốc kiểm tra giữa kỳ (Milestones) đối với nhiệm vụ kéo dài trên 3 ngày.',
        ],
      },
      {
        title: '2. Mô hình mở rộng SMARTER dành cho CEO hiện đại',
        content:
          'Để hoàn thiện vòng lặp quản trị thực thi, nhiều tập đoàn quốc tế mở rộng SMART thành SMARTER bằng cách bổ sung thêm 2 chữ cái cuối là E (Evaluated) và R (Reviewed/Rewarded):',
        bulletPoints: [
          'E – Evaluated (Đánh giá định kỳ): Không chờ đến phút chót mới kiểm tra. Mục tiêu phải được theo dõi tiến độ định kỳ trên hệ thống phần mềm để phát hiện sớm nguy cơ trễ hạn.',
          'R – Reviewed & Rewarded (Rà soát & Ghi nhận): Sau khi hoàn thành mục tiêu SMART, CEO thực hiện rà soát kết quả, chuẩn hóa bài học kinh nghiệm (kết nối sang PDCA) và khen thưởng kịp thời theo công thức FFC.',
        ],
      },
    ],
    comparisonTable: {
      title: 'Bảng đối sánh: Giao việc truyền thống cảm tính vs. Giao việc chuẩn SMART',
      leftHeader: 'Giao việc cảm tính (Truyền thống)',
      rightHeader: 'Giao việc chuẩn SMART (ProCEO)',
      rows: [
        {
          criterion: 'Cách diễn đạt mục tiêu',
          leftValue: '"Anh em xưởng cố gắng đẩy nhanh các đơn tem nhãn đang gấp nhé!"',
          rightValue: '"Hoàn thành in & bế 50.000 tem đơn LSX-2026-089 trên máy Flexo số 2"',
        },
        {
          criterion: 'Người chịu trách nhiệm',
          leftValue: 'Giao chung cho "tập thể xưởng sản xuất" (cha chung không ai khóc)',
          rightValue: 'Đích danh Tổ trưởng Hùng chịu trách nhiệm chính (1 đầu mối duy nhất)',
        },
        {
          criterion: 'Thước đo nghiệm thu',
          leftValue: 'Không có tiêu chuẩn rõ ràng, làm xong mới phát hiện thiếu số lượng hoặc lem mực',
          rightValue: 'Đủ 50.000 tem thành phẩm, tỷ lệ phế phẩm công đoạn < 0.5%',
        },
        {
          criterion: 'Thời hạn (Deadline)',
          leftValue: '"Làm càng sớm càng tốt", "Xong báo anh"',
          rightValue: 'Bàn giao kho thành phẩm trước 16:30 ngày hôm nay (kiểm tra tiến độ lúc 14:00)',
        },
      ],
    },
    standardTemplates: [
      {
        name: 'Mẫu 1: Khung câu lệnh giao việc SMART chuẩn CEO',
        usageWhen: 'Dùng khi giao việc trực tiếp cho Trưởng bộ phận / Quản đốc xưởng hoặc tạo nhiệm vụ trên ProCEO.',
        templateText:
          '[TÊN NGƯỜI PHỤ TRÁCH] chịu trách nhiệm [ĐỘNG TỪ HÀNH ĐỘNG + ĐẦU RA CỤ THỂ (S)], đạt chỉ số [CON SỐ ĐO LƯỜNG & TIÊU CHUẨN CHẤT LƯỢNG (M)], sử dụng nguồn lực [MÁY MÓC / NHÂN SỰ / CÔNG CỤ HỖ TRỢ (A)] nhằm phục vụ mục tiêu [OKR / ĐƠN HÀNG TRỌNG ĐIỂM (R)], hoàn thành bàn giao trước [GIỜ : PHÚT, NGÀY/THÁNG/NĂM (T)]. Báo cáo tiến độ giữa kỳ lúc [THỜI GIAN CHECKPOINT].',
      },
      {
        name: 'Mẫu 2: Thiết lập mục tiêu SMART cấp Phòng ban (Tháng/Quý)',
        usageWhen: 'Dùng khi giao chỉ tiêu vận hành cho bộ phận Sản xuất, Kinh doanh hoặc Kho vận.',
        templateText:
          'Bộ phận [TÊN BỘ PHẬN] do [TRƯỞNG BỘ PHẬN] phụ trách thực hiện mục tiêu [TÊN MỤC TIÊU], nâng/giảm chỉ số từ [SỐ HIỆN TẠI] lên/xuống [SỐ MỤC TIÊU] trong giai đoạn từ [NGÀY BẮT ĐẦU] đến [NGÀY KẾT THÚC], thông qua giải pháp trọng tâm [GIẢI PHÁP KHẢ THI], đối chiếu nghiệm thu trực tiếp bằng dữ liệu báo cáo trên hệ thống ERP.',
      },
    ],
    classicReferences: [
      {
        workTitle: 'There\'s a S.M.A.R.T. way to write management\'s goals and objectives (1981)',
        author: 'George T. Doran – Management Review',
        keyTakeaway: 'Bài báo khai sinh thuật ngữ SMART, khẳng định việc định lượng hóa và định danh người phụ trách là chìa khóa biến chiến lược thành hành động.',
      },
      {
        workTitle: 'The Practice of Management (1954)',
        author: 'Peter F. Drucker',
        keyTakeaway: 'Đặt nền móng cho Quản trị theo Mục tiêu (MBO): Nhân viên chỉ thực sự cam kết khi họ hiểu rõ mục tiêu của mình đóng góp gì vào mục tiêu chung của tổ chức.',
      },
      {
        workTitle: 'A Theory of Goal Setting & Task Performance (1990)',
        author: 'Edwin A. Locke & Gary P. Latham',
        keyTakeaway: 'Chứng minh thực nghiệm trên 400 nghiên cứu rằng mục tiêu cụ thể và có thời hạn làm tăng mạnh sự tập trung, nỗ lực và tính kiên trì của nhân sự.',
      },
    ],
    pillars: [
      {
        key: 'S',
        label: 'Specific (Cụ thể)',
        subtitle: 'Làm cái gì? Ai chịu trách nhiệm? Ở bộ phận nào?',
        description: 'Mục tiêu phải được diễn đạt rõ ràng, không dùng từ chung chung như "cố gắng", "tăng cường", "sớm nhất".',
        ceoQuestion: 'Người nhận việc đọc xong có biết chính xác kết quả đầu ra cần bàn giao là gì không?',
        exampleAtMvdn: 'Hoàn thành in và bế toàn bộ đơn tem nhãn LSX-2026-089 cho khách hàng Logistics Đồng Nai.',
      },
      {
        key: 'M',
        label: 'Measurable (Đo lường được)',
        subtitle: 'Con số định lượng đánh giá hoàn thành là bao nhiêu?',
        description: 'Gắn liền với số lượng, tỷ lệ %, thời gian hoặc tiêu chuẩn chất lượng cụ thể.',
        ceoQuestion: 'Khi nghiệm thu, dùng con số nào để kết luận là Đạt hay Chưa đạt?',
        exampleAtMvdn: 'Đạt đủ 50.000 tem thành phẩm, tỷ lệ tem lỗi/lem mực dưới 0.5%.',
      },
      {
        key: 'A',
        label: 'Achievable (Khả thi)',
        subtitle: 'Nguồn lực máy móc, vật tư, con người có đáp ứng được không?',
        description: 'Mục tiêu có tính thách thức nhưng nằm trong năng lực thực thi khi sắp xếp đúng nguồn lực.',
        ceoQuestion: 'Đã đủ giấy decal, khuôn bế và ca máy để hoàn thành chưa?',
        exampleAtMvdn: 'Bố trí máy Flexo số 2 chạy 2 ca liên tục với sự phụ trách của Tổ trưởng Hùng.',
      },
      {
        key: 'R',
        label: 'Relevant (Liên quan)',
        subtitle: 'Đóng góp gì cho mục tiêu OKR chung của doanh nghiệp?',
        description: 'Đảm bảo công việc phục vụ trực tiếp cho ưu tiên chiến lược (giao hàng đúng hạn, giữ chân khách hàng lớn).',
        ceoQuestion: 'Việc này tác động thế nào đến uy tín giao hàng và doanh thu quý này của MVĐN?',
        exampleAtMvdn: 'Đảm bảo chỉ số giao hàng đúng hạn (On-time Delivery) >= 98% cho nhóm khách VIP.',
      },
      {
        key: 'T',
        label: 'Time-bound (Có thời hạn)',
        subtitle: 'Chính xác ngày nào, mấy giờ phải hoàn thành?',
        description: 'Mốc thời gian cụ thể tạo áp lực tích cực và giúp CEO đặt lịch nhắc tự động.',
        ceoQuestion: 'Hạn chót bàn giao là mấy giờ, ngày nào và khi nào cần báo cáo giữa kỳ?',
        exampleAtMvdn: 'Hoàn thành đóng gói trước 16:30 ngày hôm nay để xe tải xuất kho lúc 17:00.',
      },
    ],
    goldenRules: [
      'Không giao việc miệng mà không có người chịu trách nhiệm chính (1 việc = 1 đầu mối duy nhất).',
      'Luôn định lượng kết quả bằng con số (Số lượng, %, VNĐ, Giờ).',
      'Mọi nhiệm vụ SMART quan trọng đều phải gắn mốc nhắc việc trước hạn chót.',
    ],
    commonPitfalls: [
      'Giao việc kiểu "Em xem xử lý gấp đơn hàng này nhé" (thiếu giờ hoàn thành và tiêu chuẩn đạt).',
      'Giao cho cả "tập thể phòng sản xuất" dẫn đến không ai chịu trách nhiệm cuối cùng.',
    ],
    realCaseStudy: {
      context: 'Đơn hàng tem mã vạch xuất khẩu có nguy cơ trễ tiến độ giao hàng.',
      badApproach: '"Anh em xưởng cố gắng đẩy nhanh tiến độ các đơn đang tồn đọng nhé!"',
      goodApproach:
        '"Tổ trưởng Hùng phụ trách chạy dứt điểm 30.000 tem đơn LSX-108 trên máy số 2, tỷ lệ đạt 99.5%, bàn giao kho thành phẩm trước 15:00 chiều nay."',
      outcome: '100% đơn hàng xuất kho đúng 15:00, số liệu cập nhật trực tiếp lên ERP ProTrack.',
    },
  },

  // ─── 2. CHU TRÌNH PDCA ─────────────────────────────────────────────────────
  {
    code: 'PDCA',
    docNumber: 'DOC-CEO-02',
    readingTime: '12 phút đọc • Cải tiến Kaizen & Vận hành',
    shortName: 'Chu trình PDCA',
    fullTitle: 'Không ngừng nâng cao năng lực quản trị doanh nghiệp - Chu trình PDCA',
    category: 'Cải tiến liên tục (Kaizen)',
    tagline: 'Xoay vòng liên tục Plan – Do – Check – Act để nâng chuẩn vận hành doanh nghiệp mỗi ngày.',
    corePhilosophy:
      'Quản trị doanh nghiệp không phải là giải quyết sự cố theo kiểu chữa cháy lặp đi lặp lại. Chu trình PDCA (Deming Cycle) giúp CEO biến mỗi điểm nghẽn trong sản xuất, chất lượng, giao hàng thành một quy trình chuẩn mới cao hơn.',
    accentColor: '#059669',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    targetTab: 'execution',
    targetSubView: 'PDCA',
    originAndHistory: {
      author: 'Tiến sĩ Walter A. Shewhart (1939) & Giáo sư W. Edwards Deming (1950) & Kaoru Ishikawa',
      yearAndSource:
        'Năm 1939 (Cuốn "Statistical Method from the Viewpoint of Quality Control" của Shewhart) & Chuỗi bài giảng của Deming tại Nhật Bản năm 1950 (JUSE)',
      historicalContext:
        'Khởi nguồn từ phương pháp kiểm soát chất lượng bằng thống kê của Tiến sĩ Walter A. Shewhart tại Bell Labs năm 1939 với 3 bước (Specification – Production – Inspection), Giáo sư W. Edwards Deming đã phát triển thành vòng tròn 4 bước và truyền bá cho Liên đoàn các nhà khoa học và kỹ sư Nhật Bản (JUSE) vào năm 1950. Người Nhật gọi đây là "Vòng tròn Deming" (Deming Wheel) hay chu trình PDCA, kết hợp cùng triết lý Kaizen của Masaaki Imai và Toyota Production System để đưa ngành sản xuất Nhật Bản vươn lên vị trí số 1 thế giới về chất lượng.',
    },
    theoreticalFoundation: {
      academicEssence:
        'Bản chất của PDCA là áp dụng Phương pháp Khoa học (Scientific Method: Giả thuyết → Thí nghiệm → Đánh giá → Kết luận) vào quản trị doanh nghiệp. Thay vì đưa ra các thay đổi cảm tính quy mô lớn đầy rủi ro, PDCA yêu cầu phân tích nguyên nhân gốc rễ (Root Cause Analysis), thử nghiệm giải pháp ở quy mô kiểm soát (Do), đo lường bằng dữ liệu thực tế (Check) và khi chứng minh được hiệu quả thì khóa chặt kết quả bằng Tiêu chuẩn hóa (Act / Standardize). Nhờ đó, năng lực quản trị của doanh nghiệp đi lên theo hình xoắn ốc trôn ốc thay vì trượt dốc trở lại thói quen cũ.',
      formulaOrModel:
        'Năng lực Quản trị Bền vững = PDCA (Tìm giải pháp đột phá nâng chuẩn) + SDCA (Standardize – Do – Check – Act: Duy trì quy trình chuẩn không tụt hậu)',
      synergyWithOtherFrameworks:
        'Khi một Key Result trong OKR hoặc một nhiệm vụ SMART không đạt chỉ số kỳ vọng, CEO kích hoạt ngay một vòng PDCA để tìm nguyên nhân gốc rễ. Khi bước Act của PDCA hoàn tất, quy trình SOP mới được truyền thông xuống toàn xưởng bằng cấu trúc PREP.',
    },
    detailedSections: [
      {
        title: '1. Phân tích chuyên sâu 4 giai đoạn P – D – C – A theo chuẩn Quản lý Chất lượng Toàn diện (TQM)',
        content:
          'Giáo sư Kaoru Ishikawa nhấn mạnh rằng một vòng PDCA chỉ thực sự hiệu quả khi CEO và đội ngũ tuân thủ đúng trọng tâm của từng pha:',
        bulletPoints: [
          'P – Plan (Lập kế hoạch & Truy tìm nguyên nhân gốc rễ - chiếm 50% thành công): Không vội vàng đưa ra giải pháp ngay khi thấy hiện tượng. Phải thực hiện 4 bước nhỏ: (1) Định lượng rõ khoảng cách giữa hiện trạng và mục tiêu; (2) Phân tích nguyên nhân gốc rễ bằng kỹ thuật "5 Tại sao" (5 Whys) hoặc Biểu đồ xương cá Ishikawa (6M: Man - Con người, Machine - Máy móc, Material - Vật tư, Method - Phương pháp, Measurement - Đo lường, Milieu - Môi trường); (3) Chọn giải pháp tác động đúng gốc rễ; (4) Thiết lập chỉ số KPI đo lường.',
          'D – Do (Thực thi thử nghiệm có kiểm soát): Đào tạo ngắn gọn cho nhân sự liên quan và triển khai giải pháp trên một tổ máy, một ca sản xuất hoặc một nhóm đơn hàng cụ thể (Pilot). Ghi nhận đầy đủ các thông số phát sinh trong quá trình chạy thử.',
          'C – Check (Kiểm tra & Đối chiếu dữ liệu khách quan): So sánh số liệu thực tế thu được sau giai đoạn Do với chỉ số Baseline (trước cải tiến) và chỉ số Target (mục tiêu ở bước Plan). Đánh giá xem giải pháp có thực sự giải quyết tận gốc vấn đề hay có gây ra tác dụng phụ ở công đoạn khác không.',
          'A – Act / Adjust (Chuẩn hóa quy trình hoặc Điều chỉnh vòng lặp mới): Đây là bước quyết định việc nâng tầm năng lực quản trị. Nếu Check đạt mục tiêu: Bắt buộc văn bản hóa thành Quy trình thao tác chuẩn (SOP), checklist kiểm soát hoặc định mức mới. Nếu chưa đạt: Phân tích lý do và khởi tạo vòng PDCA tiếp theo với dữ liệu sâu sắc hơn.',
        ],
      },
      {
        title: '2. Sự kết hợp sống còn giữa PDCA và SDCA (Cái nêm chống tụt hậu)',
        content:
          'Trong quản trị sản xuất (như in ấn tem nhãn, bao bì), rất nhiều doanh nghiệp gặp tình trạng: khi CEO sát sao chấn chỉnh thì chất lượng tốt lên, nhưng khi CEO bận việc khác thì lỗi cũ lập tức tái diễn. Nguyên nhân là thiếu chu trình SDCA (Standardize – Do – Check – Act):',
        bulletPoints: [
          'Chu trình SDCA (Tiêu chuẩn hóa – Thực hiện – Kiểm tra – Hành động) đóng vai trò như "cái nêm" giữ cho mặt phẳng quản trị không bị lăn ngược xuống dốc.',
          'Mỗi khi một vòng PDCA nâng hiệu suất lên một bậc mới (ví dụ giảm hao hụt giấy từ 4.2% xuống 1.8%), bước Act sẽ chuyển giao sang chu trình SDCA để duy trì ổn định mức 1.8% đó hàng ngày trước khi mở vòng PDCA tiếp theo hướng tới mốc 1.0%.',
        ],
      },
    ],
    comparisonTable: {
      title: 'Bảng đối sánh: Quản trị "Chữa cháy sự vụ" vs. Quản trị theo Chu trình PDCA – SDCA',
      leftHeader: 'Quản trị Chữa cháy (Firefighting)',
      rightHeader: 'Quản trị theo Chu trình PDCA (Kaizen)',
      rows: [
        {
          criterion: 'Phản ứng khi xảy ra lỗi sản xuất / trễ đơn',
          leftValue: 'La mắng nhân viên, xử lý tình thế cho xong đơn hàng đó rồi quên luôn',
          rightValue: 'Dùng 5 Whys tìm nguyên nhân gốc rễ trong quy trình, máy móc, vật tư (Bước Plan)',
        },
        {
          criterion: 'Cách triển khai giải pháp',
          leftValue: 'Ra mệnh lệnh cảm tính toàn xưởng nhưng không ai đo lường hiệu quả',
          rightValue: 'Thử nghiệm có kiểm soát (Do) và đối chiếu số liệu trước - sau trên ERP (Check)',
        },
        {
          criterion: 'Tính bền vững sau 1-3 tháng',
          leftValue: 'Lỗi cũ lặp đi lặp lại; CEO luôn quá tải vì phải giải quyết sự vụ cũ',
          rightValue: 'Đóng gói thành SOP bắt buộc (Act); năng lực vận hành của tổ chức tăng lũy tiến',
        },
        {
          criterion: 'Văn hóa doanh nghiệp',
          leftValue: 'Nhân viên giấu lỗi vì sợ trách phạt',
          rightValue: 'Nhân viên chủ động báo cáo điểm nghẽn để cùng cải tiến quy trình',
        },
      ],
    },
    standardTemplates: [
      {
        name: 'Mẫu 1: Phiếu Phân tích 5 Whys & Khởi tạo PDCA (A3 Problem Solving)',
        usageWhen: 'Dùng khi phát sinh lỗi chất lượng, hao hụt vật tư vượt mức hoặc trễ tiến độ LSX.',
        templateText:
          '1. VẤN ĐỀ HIỆN TẠI (Baseline): [Mô tả sự cố + Con số thiệt hại/hao hụt hiện tại]\n2. PHÂN TÍCH 5 TẠI SAO (5 Whys):\n   - Tại sao 1: [Nguyên nhân trực tiếp]\n   - Tại sao 2: [Nguyên nhân sâu hơn]\n   - Tại sao 3: [Nguyên nhân hệ thống/quy trình]\n   → NGUYÊN NHÂN GỐC RỄ: [Kết luận gốc rễ]\n3. KẾ HOẠCH CẢI TIẾN (PLAN): Mục tiêu đưa chỉ số từ [X] về [Y] trước ngày [Ngày].\n4. THỬ NGHIỆM (DO): [Giải pháp cụ thể + Người phụ trách + Phạm vi áp dụng thử].\n5. ĐỐI CHIẾU KẾT QUẢ (CHECK): Số liệu thực tế đạt [Z] sau [Số ngày] thử nghiệm.\n6. CHUẨN HÓA (ACT): [Ban hành SOP số... / Cập nhật biểu mẫu kiểm soát...].',
      },
    ],
    classicReferences: [
      {
        workTitle: 'Out of the Crisis (1982)',
        author: 'W. Edwards Deming',
        keyTakeaway: '94% các vấn đề và sai lỗi trong doanh nghiệp thuộc về hệ thống và quy trình (trách nhiệm của nhà quản trị), chỉ có 6% thuộc về lỗi cá nhân người lao động.',
      },
      {
        workTitle: 'Kaizen: The Key to Japan\'s Competitive Success (1986)',
        author: 'Masaaki Imai',
        keyTakeaway: 'Giải thích cơ chế phối hợp giữa PDCA (cải tiến nâng chuẩn) và SDCA (tiêu chuẩn hóa giữ chuẩn) tạo nên sức mạnh sản xuất vượt trội.',
      },
    ],
    pillars: [
      {
        key: 'P',
        label: 'Plan (Lập kế hoạch & Tìm nguyên nhân gốc)',
        subtitle: 'Xác định vấn đề, phân tích nguyên nhân gốc rễ (5 Whys) và đặt mục tiêu cải tiến',
        description: 'Định nghĩa rõ hiện trạng đang thất thoát/chậm trễ ở đâu, tại sao xảy ra và mục tiêu sau cải tiến là gì.',
        ceoQuestion: 'Nguyên nhân gốc rễ thực sự của lỗi này là do quy trình, máy móc, vật tư hay tay nghề?',
        exampleAtMvdn: 'Tỷ lệ hao hụt giấy decal khi lên khuôn máy in đang ở mức 4.2%, mục tiêu giảm xuống dưới 2.0%.',
      },
      {
        key: 'D',
        label: 'Do (Thực thi thử nghiệm)',
        subtitle: 'Triển khai giải pháp cải tiến ở quy mô kiểm soát',
        description: 'Thực hiện ngay hành động khắc phục/cải tiến với người phụ trách và hướng dẫn thao tác cụ thể.',
        ceoQuestion: 'Ai sẽ trực tiếp thử nghiệm giải pháp này và bắt đầu từ ca sản xuất nào?',
        exampleAtMvdn: 'Áp dụng bảng thông số căn chỉnh lực căng giấy và vạch chuẩn gắn khuôn nhanh trên máy in số 1 & số 2.',
      },
      {
        key: 'C',
        label: 'Check (Kiểm tra & Đối chiếu số liệu)',
        subtitle: 'Đo lường kết quả thực tế so với chỉ số mục tiêu ban đầu',
        description: 'Dùng dữ liệu báo cáo công đoạn trên ERP để đánh giá giải pháp có thực sự hiệu quả hay không.',
        ceoQuestion: 'Con số thực tế sau 7 ngày thử nghiệm thay đổi như thế nào so với trước khi làm?',
        exampleAtMvdn: 'Sau 1 tuần chạy thử trên 18 LSX, tỷ lệ hao hụt giấy giảm từ 4.2% xuống còn 1.75%.',
      },
      {
        key: 'A',
        label: 'Act (Chuẩn hóa quy trình hoặc Điều chỉnh)',
        subtitle: 'Đóng gói thành tiêu chuẩn SOP toàn xưởng và mở vòng PDCA mới cao hơn',
        description: 'Nếu đạt mục tiêu: ban hành thành quy định chuẩn bắt buộc. Nếu chưa đạt: rút kinh nghiệm và quay lại bước Plan.',
        ceoQuestion: 'Đã cập nhật vào SOP đào tạo công nhân để lỗi cũ không bao giờ tái diễn chưa?',
        exampleAtMvdn: 'Ban hành SOP Căn chỉnh khuôn in chuẩn 10 phút áp dụng cho toàn bộ máy in trong xưởng MVĐN.',
      },
    ],
    goldenRules: [
      'Không bao giờ dừng ở bước Do (Làm xong rồi bỏ đó không kiểm tra Check).',
      'Mọi cải tiến thành công đều phải được khóa chặt bằng bước Act (Chuẩn hóa thành quy trình SOP).',
      'Mỗi khi có Lệnh sản xuất trễ hạn hoặc lỗi kỹ thuật, hãy mở ngay 1 vòng PDCA thay vì chỉ nhắc nhở miệng.',
    ],
    commonPitfalls: [
      'Lập kế hoạch quá phức tạp nhưng không đưa vào thử nghiệm thực tế tại xưởng.',
      'Khi giải pháp có hiệu quả lại không viết thành quy trình chuẩn, sau 1 tháng nhân viên quay lại thói quen cũ.',
    ],
    realCaseStudy: {
      context: 'Thời gian chờ duyệt mẫu thiết kế và bình bản kéo dài làm chậm ngày khởi chạy LSX.',
      badApproach: 'Nhắc bộ phận thiết kế làm nhanh hơn mỗi khi khách hối.',
      goodApproach:
        'Áp dụng PDCA: (P) Phát hiện thiếu checklist thông số file in → (D) Tạo biểu mẫu xác nhận kích thước/màu/mã vạch chuẩn 1 trang → (C) Thời gian duyệt mẫu giảm từ 24h xuống 4h → (A) Chuẩn hóa bắt buộc cho mọi đơn hàng mới.',
      outcome: 'Tốc độ chuyển từ Đơn hàng sang Lệnh sản xuất tăng gấp 3 lần.',
    },
  },

  // ─── 3. HỌP THEO NGUYÊN TẮC 3-6-9 ──────────────────────────────────────────
  {
    code: 'MEETING_369',
    docNumber: 'DOC-CEO-03',
    readingTime: '14 phút đọc • Kỷ luật Phòng họp & Giám sát Thực thi',
    shortName: 'Họp nguyên tắc 3-6-9',
    fullTitle: 'Họp theo nguyên tắc 3-6-9: 3 Công thức • 6 Bước • 9 Nguyên tắc bắt buộc',
    category: 'Điều hành cuộc họp & Giám sát thực thi',
    tagline: 'Chấm dứt những cuộc họp kéo dài không lối thoát. Biến phòng họp thành nơi ra quyết định và cam kết thực thi.',
    corePhilosophy:
      'Cuộc họp chỉ có giá trị khi tạo ra quyết định rõ ràng và hành động được giám sát đến cùng. Nguyên tắc 3-6-9 giúp CEO khóa chặt từ khâu chuẩn bị trước giờ họp, điều phối đúng trọng tâm trong phòng họp, đến theo sát đôn đốc người chịu trách nhiệm sau cuộc họp.',
    accentColor: '#7c3aed',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    targetTab: 'execution',
    targetSubView: 'MEETINGS',
    originAndHistory: {
      author: 'Hệ thống Quản trị Thực thi Doanh nghiệp Hiện đại & Tư duy Quản trị Cuộc họp Hiệu suất cao (High-Output Meetings)',
      yearAndSource:
        'Mô hình Quản trị Thực thi 3-6-9 (3 Công thức Thực thi • 6 Bước Tổ chức • 9 Nguyên tắc Kỷ luật Bắt buộc)',
      historicalContext:
        'Thống kê quản trị doanh nghiệp cho thấy các nhà quản lý dành tới 35%–50% thời gian làm việc trong các cuộc họp, nhưng hơn 67% cuộc họp thất bại trong việc tạo ra kết quả thực tế vì thiếu sự chuẩn bị trước và thiếu cơ chế giám sát sau cuộc họp. Hệ thống Họp theo nguyên tắc 3-6-9 được đúc kết nhằm giải quyết triệt để căn bệnh "họp nhiều nhưng không làm, giao việc nhưng không kiểm tra" trong các doanh nghiệp sản xuất và dịch vụ.',
    },
    theoreticalFoundation: {
      academicEssence:
        'Nguyên tắc 3-6-9 thiết lập một cơ chế kiểm soát khép kín 3 giai đoạn (Pre-Meeting → In-Meeting → Post-Meeting). Trọng tâm học thuật của mô hình nằm ở việc chuyển dịch trọng lượng cuộc họp: 40% giá trị nằm ở khâu chuẩn bị tài liệu trước (Bước 1-3), 20% nằm ở khâu ra quyết định tập trung trong phòng họp (Bước 4), và 40% quyết định thành bại nằm ở khâu theo dõi, giám sát, đôn đốc thực thi sau cuộc họp (Bước 5-6 & Công thức 1-2-3).',
      formulaOrModel:
        'Hiệu quả Cuộc họp = (Họp đúng trọng tâm × Phân công rõ người) × (Theo sát tiến độ + Đôn đốc người chịu trách nhiệm)',
      synergyWithOtherFrameworks:
        'Trong phòng họp 3-6-9: Người tham dự phát biểu đề xuất theo cấu trúc PREP (ngắn gọn trong 2 phút); các quyết định sau cuộc họp được chuyển hóa ngay thành nhiệm vụ SMART có hạn chót và số lần đôn đốc trên ProCEO.',
    },
    detailedSections: [
      {
        title: '1. Phân tích 3 Công thức Thực thi Cốt lõi (Tại sao họp xong việc vẫn đứng yên?)',
        content:
          'Ba công thức của nguyên tắc 3-6-9 hoạt động như một phương trình nhân (nếu bất kỳ thừa số nào bằng 0 thì kết quả cuối cùng bằng 0):',
        bulletPoints: [
          'Công thức 1 – "Họp mà không thực hiện thì không đạt hiệu quả": Một cuộc họp dù sôi nổi đến đâu nhưng khi bước ra khỏi phòng họp mà không ai bắt tay vào hành động cụ thể thì toàn bộ giờ công của các thành viên tham dự đều là chi phí chìm lãng phí.',
          'Công thức 2 – "Phân công nhưng không giám sát thì cũng không đạt hiệu quả": Con người có xu hướng ưu tiên những việc bị kiểm tra hơn là những việc chỉ được giao suông. Giao việc mà không có lịch kiểm tra giữa kỳ (Checkpoint) đồng nghĩa với việc phó mặc kết quả cho sự may rủi.',
          'Công thức 3 – "Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Công việc được thực thi đúng kế hoạch": Đây là chìa khóa vàng của CEO. Khi người chịu trách nhiệm biết rõ tiến độ của mình đang được hiển thị minh bạch và nhận được sự đôn đốc sát sao từ lãnh đạo, tỷ lệ hoàn thành đúng hạn sẽ đạt mức tối đa.',
        ],
      },
      {
        title: '2. Quy trình 6 Bước Tổ chức & Kiểm soát Cuộc họp (Trước – Trong – Sau)',
        content:
          'Để vận hành trơn tru một cuộc họp điều hành sản xuất hoặc giao ban đầu tuần, 6 bước phải được thực hiện tuần tự không bỏ sót:',
        bulletPoints: [
          'Bước 1 – Chuẩn bị tài liệu trước: Toàn bộ báo cáo số liệu ERP, danh sách Lệnh sản xuất (LSX) trễ/sát hạn, tờ trình đề xuất phải được gửi trước tối thiểu 2–4 giờ để các thành viên đọc và suy nghĩ phương án trước khi vào phòng họp.',
          'Bước 2 – Xác định rõ chủ đề cuộc họp: Định danh chính xác chủ đề cuộc họp (không họp kiểu "họp tổng hợp đủ thứ chuyện").',
          'Bước 3 – Thiết lập quy tắc họp: Bắt đầu đúng giờ (không chờ người đi muộn), không sử dụng điện thoại làm việc riêng, phát biểu theo nguyên tắc PREP, tập trung tìm giải pháp thay vì đổ lỗi giữa các bộ phận.',
          'Bước 4 – Sắp xếp quy trình cuộc họp: Phân bổ thời lượng rõ ràng theo đồng hồ đếm ngược (ví dụ: 5 phút điểm nhanh số liệu → 15 phút giải quyết 3 điểm nghẽn chính → 5 phút chốt quyết định & phân công).',
          'Bước 5 – Theo dõi kết quả cuộc họp: Xuất biên bản họp ngay khi kết thúc, liệt kê rõ từng đầu việc, người chịu trách nhiệm duy nhất và thời hạn hoàn thành.',
          'Bước 6 – Kiểm tra tiến độ hoàn thành các nhiệm vụ đặt ra trong cuộc họp: Định kỳ rà soát trạng thái từng nhiệm vụ (Pending → In Progress → Completed) và thực hiện đôn đốc cho đến khi đóng 100% đầu việc.',
        ],
      },
      {
        title: '3. 9 Nguyên tắc Bắt buộc của một Cuộc họp Chuẩn CEO',
        content:
          '9 nguyên tắc này là bảng tiêu chuẩn chấm điểm kỷ luật phòng họp (Meeting Audit Checklist) tại doanh nghiệp:',
        bulletPoints: [
          'Nguyên tắc 1: Xác định rõ mục tiêu cuộc họp (Kết thúc cuộc họp này chúng ta cần ra quyết định gì?).',
          'Nguyên tắc 2: Chọn đúng người tham dự (Chỉ triệu tập những người có quyền quyết định hoặc trực tiếp nắm dữ liệu/thực thi; tránh kéo cả phòng ban ngồi nghe thụ động).',
          'Nguyên tắc 3: Chuẩn bị nội dung, tài liệu và cấu trúc chương trình họp (Agenda có khung giờ cụ thể).',
          'Nguyên tắc 4: Bắt đầu đúng giờ và giới thiệu mục tiêu ngay phút đầu tiên.',
          'Nguyên tắc 5: Giữ cuộc họp đi đúng trọng tâm (Chủ tọa cắt ngay các cuộc tranh luận lan man ngoài chủ đề).',
          'Nguyên tắc 6: Ra quyết định và thống nhất hành động ngay trong cuộc họp.',
          'Nguyên tắc 7: Có biên bản và tổng kết rõ ràng (Ai làm gì – Khi nào xong – Tiêu chuẩn kết quả).',
          'Nguyên tắc 8: Theo dõi tiến độ và nhắc nhở hành động liên tục sau cuộc họp.',
          'Nguyên tắc 9: Đánh giá và cải tiến quy trình họp (Mỗi cuộc họp sau phải ngắn gọn và hiệu quả hơn cuộc họp trước).',
        ],
      },
    ],
    comparisonTable: {
      title: 'Bảng đối sánh: Họp giao ban truyền thống vs. Họp theo Nguyên tắc 3-6-9',
      leftHeader: 'Họp giao ban truyền thống',
      rightHeader: 'Họp theo Nguyên tắc 3-6-9 (ProCEO)',
      rows: [
        {
          criterion: 'Trước giờ họp',
          leftValue: 'Không ai chuẩn bị trước; vào phòng họp mới bắt đầu mở sổ tìm số liệu (mất 30 phút đầu)',
          rightValue: 'Tài liệu & dữ liệu LSX từ ERP được chuẩn bị trước (Bước 1); mọi người nắm rõ vấn đề trước khi ngồi xuống',
        },
        {
          criterion: 'Diễn biến trong phòng họp',
          leftValue: 'Các bộ phận đổ lỗi qua lại (Kinh doanh trách Xưởng, Xưởng trách Kho), kéo dài 90-120 phút',
          rightValue: 'Bắt đầu đúng giờ, đi thẳng vào giải pháp theo quy trình (Bước 3 & 4), gói gọn trong 25-30 phút',
        },
        {
          criterion: 'Kết thúc cuộc họp',
          leftValue: 'Giải tán trong sự mơ hồ, mỗi người hiểu kết luận theo một kiểu khác nhau',
          rightValue: 'Chốt biên bản tại chỗ (Nguyên tắc 6 & 7): Gắn tên người phụ trách + Deadline rõ ràng',
        },
        {
          criterion: 'Sau cuộc họp (Hậu kiểm)',
          leftValue: 'Đến kỳ họp tuần sau mới hỏi lại thì phát hiện việc tuần trước vẫn chưa ai làm',
          rightValue: 'Áp dụng Công thức 2 & 3: Hệ thống theo sát tiến độ và đôn đốc người chịu trách nhiệm hàng ngày',
        },
      ],
    },
    standardTemplates: [
      {
        name: 'Mẫu 1: Khung Chương trình & Biên bản Họp 3-6-9 Chuẩn (25 Phút)',
        usageWhen: 'Dùng cho cuộc họp giao ban điều hành sản xuất hoặc họp giải quyết điểm nghẽn hàng tuần.',
        templateText:
          '• CHỦ ĐỀ CUỘC HỌP (Bước 2): [Tên chủ đề cụ thể]\n• MỤC TIÊU CẦN CHỐT (Nguyên tắc 1): [Quyết định cần đạt được sau 25 phút]\n• THÀNH PHẦN ĐÚNG NGƯỜI (Nguyên tắc 2): [Danh sách người có trách nhiệm trực tiếp]\n• TÀI LIỆU ĐỌC TRƯỚC (Bước 1): [Số liệu LSX / Báo cáo đính kèm]\n• QUY TRÌNH THỜI LƯỢNG (Bước 4):\n  - Phút 00-03: Tuyên bố mục tiêu & quy tắc họp\n  - Phút 03-18: Thảo luận giải pháp theo cấu trúc PREP\n  - Phút 18-25: Chốt quyết định, phân công Action Items & lịch giám sát\n• DANH SÁCH HÀNH ĐỘNG & GIÁM SÁT (Bước 5 & 6):\n  1. [Đầu việc cụ thể] — Phụ trách: [Tên] — Hạn chót: [Ngày/Giờ] — Mốc đôn đốc: [Ngày/Giờ]',
      },
    ],
    classicReferences: [
      {
        workTitle: 'High Output Management – Chương "Meetings: The Medium of Managerial Work"',
        author: 'Andrew S. Grove (Cựu CEO Intel)',
        keyTakeaway: 'Một giờ họp của 10 quản lý không phải là 1 giờ, mà là 10 giờ lao động của công ty. Chủ tọa có trách nhiệm tuyệt đối về agenda, quyết định và biên bản thực thi.',
      },
      {
        workTitle: 'Death by Meeting (2004)',
        author: 'Patrick Lencioni',
        keyTakeaway: 'Tách biệt rõ các loại cuộc họp (Check-in nhanh hàng ngày 10 phút, Họp chiến thuật hàng tuần 30-45 phút, Họp chiến lược hàng tháng) để giữ sự tập trung cao độ.',
      },
    ],
    pillars: [
      {
        key: '3',
        label: '3 Công thức hiệu quả thực thi',
        subtitle: 'Thực hiện + Giám sát + Theo sát đôn đốc = Đúng kế hoạch',
        description:
          '(1) Họp mà không thực hiện thì không đạt hiệu quả. (2) Phân công nhưng không giám sát thì cũng không đạt hiệu quả. (3) Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Công việc được thực thi đúng kế hoạch.',
        ceoQuestion: 'Sau cuộc họp này, cơ chế nào đảm bảo từng việc được giám sát và đôn đốc đến khi hoàn tất?',
        exampleAtMvdn: 'Mỗi kết luận trong cuộc họp giao ban sáng Thứ Hai đều gắn tên 1 người phụ trách, hạn chót và lịch nhắc đôn đốc.',
      },
      {
        key: '6',
        label: '6 Bước tổ chức cuộc họp chuẩn',
        subtitle: 'Chuẩn bị → Chủ đề → Quy tắc → Quy trình → Theo dõi → Kiểm tra tiến độ',
        description:
          '1. Chuẩn bị tài liệu trước • 2. Xác định rõ chủ đề cuộc họp • 3. Thiết lập quy tắc họp • 4. Sắp xếp quy trình cuộc họp • 5. Theo dõi kết quả cuộc họp • 6. Kiểm tra tiến độ hoàn thành các nhiệm vụ đặt ra trong cuộc họp.',
        ceoQuestion: 'Đã hoàn thành đủ 4 bước trước & trong cuộc họp và 2 bước hậu kiểm sau cuộc họp chưa?',
        exampleAtMvdn: 'Trước họp giao ban 15 phút, bảng tổng hợp LSX sát hạn từ ERP đã được mở sẵn; sau họp hệ thống tự nhắc kiểm tra tiến độ.',
      },
      {
        key: '9',
        label: '9 Nguyên tắc bắt buộc của cuộc họp',
        subtitle: 'Tiêu chuẩn kỷ luật phòng họp từ lúc bắt đầu đến khi cải tiến',
        description:
          '1. Xác định rõ mục tiêu • 2. Chọn đúng người tham dự • 3. Chuẩn bị nội dung, tài liệu & cấu trúc • 4. Bắt đầu đúng giờ & giới thiệu mục tiêu • 5. Giữ đúng trọng tâm • 6. Ra quyết định & thống nhất hành động ngay • 7. Có biên bản & tổng kết rõ ràng • 8. Theo dõi tiến độ & nhắc nhở hành động • 9. Đánh giá & cải tiến quy trình họp.',
        ceoQuestion: 'Cuộc họp hôm nay đạt bao nhiêu trên 9 nguyên tắc bắt buộc?',
        exampleAtMvdn: 'Họp điều độ sản xuất đúng 08:00 sáng, chỉ triệu tập Quản đốc, Kế hoạch, Kho (đúng người), chốt phương án trong 20 phút.',
      },
    ],
    goldenRules: [
      'Họp mà không thực hiện thì không đạt hiệu quả.',
      'Phân công nhưng không giám sát thì cũng không đạt hiệu quả.',
      'Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Công việc được thực thi đúng kế hoạch.',
    ],
    commonPitfalls: [
      'Họp không chuẩn bị tài liệu trước, mất 70% thời gian cuộc họp chỉ để hỏi số liệu.',
      'Triệu tập quá nhiều người không liên quan làm lãng phí giờ công sản xuất.',
      'Kết thúc cuộc họp chỉ có lời hứa chung chung mà không có biên bản phân công ai làm gì, bao giờ xong.',
    ],
    realCaseStudy: {
      context: 'Họp giao ban sản xuất đầu tuần trước đây kéo dài 90 phút nhưng đơn hàng vẫn trễ.',
      badApproach: 'Mọi người vào phòng họp mới bắt đầu mở sổ tìm đơn hàng, tranh luận lan man không ghi biên bản.',
      goodApproach:
        'Áp dụng Họp 3-6-9: Chuẩn bị sẵn danh sách LSX từ ERP (Bước 1), họp đúng 25 phút theo đồng hồ đếm ngược, chốt ngay người chịu trách nhiệm xử lý từng đơn trễ và bấm nút Đôn đốc trực tiếp trên ProCEO.',
      outcome: 'Thời gian họp giảm 65%, tỷ lệ hoàn thành nhiệm vụ sau họp tăng lên 96%.',
    },
  },

  // ─── 4. CÔNG CỤ OKR ────────────────────────────────────────────────────────
  {
    code: 'OKR',
    docNumber: 'DOC-CEO-04',
    readingTime: '12 phút đọc • Quản trị Mục tiêu Trọng tâm',
    shortName: 'Công cụ OKR',
    fullTitle: 'Sắp xếp công việc: Tập trung vào mục tiêu, thúc đẩy hành động hiệu quả - Công cụ OKR',
    category: 'Quản trị mục tiêu trọng tâm',
    tagline: 'Tập trung 100% nguồn lực vào những mục tiêu quan trọng nhất (Objectives) và đo bằng kết quả then chốt (Key Results).',
    corePhilosophy:
      'Một CEO có hàng trăm việc mỗi tuần, nhưng chỉ có 3-5 mục tiêu thực sự quyết định sự bứt phá của doanh nghiệp. OKR giúp toàn bộ đội ngũ biết rõ Bắc Đẩu Tinh của quý này là gì và tiến độ hiện tại đang ở mức bao nhiêu %.',
    accentColor: '#d97706',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    targetTab: 'execution',
    targetSubView: 'SMART',
    originAndHistory: {
      author: 'Andrew S. Grove (Cha đẻ OKR tại Intel – thập niên 1970) & John Doerr (Người truyền bá OKR vào Google năm 1999)',
      yearAndSource:
        'Năm 1983 (Cuốn "High Output Management" của Andy Grove) & Năm 2018 (Cuốn "Measure What Matters – Làm điều quan trọng" của John Doerr)',
      historicalContext:
        'Vào thập niên 1970 tại tập đoàn bán dẫn Intel, Tiến sĩ Andy Grove đã nâng cấp mô hình MBO của Peter Drucker thành iMBOs (Intel Management by Objectives) để giúp Intel chuyển hướng thần tốc từ bộ nhớ sang vi xử lý. Grove đặt ra 2 câu hỏi kinh điển: (1) Tôi muốn đi đâu? (Objective) và (2) Làm sao tôi biết mình đang tiến tới đó? (Key Results). Năm 1999, nhà đầu tư mạo hiểm John Doerr (từng là học trò của Grove tại Intel) đã mang công cụ OKR giới thiệu cho hai nhà sáng lập Google là Larry Page và Sergey Brin khi Google mới chỉ có 40 nhân viên, trở thành bệ phóng quản trị đưa Google thành gã khổng lồ công nghệ toàn cầu.',
    },
    theoreticalFoundation: {
      academicEssence:
        'John Doerr tổng kết sức mạnh của OKR trong 4 siêu quyền năng (Four Superpowers): (1) Focus & Commit to Priorities (Tập trung và cam kết vào ưu tiên tối thượng: "Ít hơn là nhiều hơn" – tối đa 3 đến 5 Objectives mỗi Quý); (2) Align & Connect for Teamwork (Liên kết ngang và dọc minh bạch giữa CEO và các bộ phận); (3) Track for Accountability (Theo dõi tiến độ định kỳ bằng dữ liệu thời gian thực); (4) Stretch for Amazing (Kéo giãn giới hạn với phân loại OKR Cam kết – Committed OKRs cần đạt 100% và OKR Khát vọng – Aspirational OKRs đạt 70% đã là thành công vượt bậc).',
      formulaOrModel:
        'Công thức chuẩn của John Doerr: "Tôi sẽ [OBJECTIVE – Mục tiêu truyền cảm hứng] được đo lường bằng [KEY RESULTS – Tập hợp 3 đến 4 kết quả then chốt có con số định lượng từ X lên Y]."',
      synergyWithOtherFrameworks:
        'OKR đi đôi với hệ thống quản trị hiệu suất liên tục CFRs (Conversations – Trò chuyện 1-1 theo Tháp Maslow, Feedback – Phản hồi hai chiều theo PREP, Recognition – Ghi nhận khen ngợi theo nguyên tắc FFC).',
    },
    detailedSections: [
      {
        title: '1. Phân biệt rõ Objective (O), Key Results (KR) và Initiatives (Hành động)',
        content:
          'Sai lầm lớn nhất khi áp dụng OKR là nhầm lẫn giữa Kết quả then chốt (Key Result) và Công việc phải làm (To-do list / Initiative):',
        bulletPoints: [
          'Objective (Mục tiêu – Đi về đâu?): Định tính, ngắn gọn, truyền cảm hứng mạnh mẽ, có giới hạn thời gian theo Quý. Ví dụ: "Xây dựng hệ thống sản xuất Mã Vạch Đồng Nai chuẩn mực, giao hàng thần tốc nhất khu vực Đông Nam Bộ".',
          'Key Results (Kết quả then chốt – Làm sao biết đã tới đích?): Định lượng tuyệt đối (từ X lên Y). Marissa Mayer (cựu Phó Chủ tịch Google) khẳng định: "Nếu không có một con số, đó không phải là Key Result". Mỗi Objective chỉ nên có 3–4 Key Results.',
          'Initiatives / SMART Tasks (Sáng kiến & Công việc hàng tuần – Làm thế nào để đẩy con số KR?): Đây là các công việc cụ thể được quản lý bằng nguyên tắc SMART. Nếu thực hiện hết các công việc mà con số Key Result chưa nhích lên, nghĩa là cần thay đổi cách làm (mở vòng PDCA).',
        ],
      },
      {
        title: '2. Hai loại OKR và Thang điểm đánh giá 0.0 – 1.0',
        content:
          'Trong quản trị thực chiến, CEO cần phân định rõ 2 nhóm mục tiêu OKR để đánh giá công tâm:',
        bulletPoints: [
          'OKR Cam kết (Committed OKRs / Roofshots): Các mục tiêu gắn với cam kết sống còn (ví dụ: Tỷ lệ giao hàng đúng hạn >= 98%, Tỷ lệ lỗi < 0.5%). Nhóm này bắt buộc phải đạt 1.0 (100%) vào cuối kỳ. Nếu đạt dưới 1.0 cần phân tích nguyên nhân gốc rễ.',
          'OKR Khát vọng (Aspirational OKRs / Moonshots): Các mục tiêu đột phá mở rộng thị trường mới hoặc nâng công suất vượt ngưỡng. Điểm chuẩn thành công của nhóm này nằm ở mức 0.7 – 0.8 (70%–80%).',
        ],
      },
    ],
    comparisonTable: {
      title: 'Bảng đối sánh chuyên sâu: Công cụ OKR vs. Chỉ số KPI truyền thống',
      leftHeader: 'KPI (Key Performance Indicators)',
      rightHeader: 'OKR (Objectives & Key Results)',
      rows: [
        {
          criterion: 'Bản chất quản trị',
          leftValue: 'Đo lường sức khỏe vận hành thường nhật (Business as Usual - giữ cho tàu chạy ổn định)',
          rightValue: 'La bàn tập trung nguồn lực tạo sự bứt phá và thay đổi chiến lược (Thay đổi hướng đi & tốc độ)',
        },
        {
          criterion: 'Số lượng chỉ tiêu',
          leftValue: 'Thường nhiều (10-15 chỉ số/bộ phận), dễ gây phân tán sự chú ý của CEO',
          rightValue: 'Tinh gọn tối đa: 3 Objectives × 3 Key Results trọng yếu nhất mỗi Quý',
        },
        {
          criterion: 'Tính minh bạch & Liên kết',
          leftValue: 'Thường giao từ trên xuống (Top-down) và đóng kín trong từng phòng ban',
          rightValue: 'Công khai 100% toàn công ty; kết hợp cả chiều từ trên xuống và từ dưới lên',
        },
        {
          criterion: 'Cách ví von thực tế',
          leftValue: 'Đồng hồ tốc độ và báo xăng trên taplo xe hơi',
          rightValue: 'Bản đồ GPS dẫn đường đưa doanh nghiệp tới đích đến mới',
        },
      ],
    },
    standardTemplates: [
      {
        name: 'Mẫu 1: Thiết lập bộ OKR Quý chuẩn Doanh nghiệp Sản xuất',
        usageWhen: 'Dùng khi lập kế hoạch trọng tâm đầu Quý cho Ban Giám đốc và các Trưởng bộ phận.',
        templateText:
          'OBJECTIVE (Mục tiêu Quý [Q/Năm]): [Câu tuyên bố mục tiêu truyền cảm hứng, ngắn gọn]\n• Key Result 1 (Tiến độ/Giao hàng): Nâng tỷ lệ [Chỉ số] từ [X%] lên [Y%] trước ngày [Cuối Quý].\n• Key Result 2 (Chất lượng/Chi phí): Giảm tỷ lệ [Hao hụt/Lỗi] từ [A%] xuống dưới [B%].\n• Key Result 3 (Năng suất/Doanh thu): Đạt sản lượng/doanh thu [Con số mục tiêu] [Đơn vị tính].\n• Hành động SMART ưu tiên tuần này: [3 đầu việc cốt lõi thúc đẩy KR1, KR2, KR3].',
      },
    ],
    classicReferences: [
      {
        workTitle: 'Measure What Matters (Làm Điều Quan Trọng – 2018)',
        author: 'John Doerr',
        keyTakeaway: 'Cẩm nang toàn diện nhất về OKR và CFRs với các case study thực tế từ Intel, Google, Bono, Gates Foundation.',
      },
      {
        workTitle: 'High Output Management (Quản Trị Hiệu Suất Cao – 1983)',
        author: 'Andrew S. Grove',
        keyTakeaway: 'Tác phẩm gốc khai sinh hệ thống OKR: Sự tập trung tuyệt đối vào một số ít mục tiêu có đòn bẩy cao nhất (High-Leverage Activities).',
      },
    ],
    pillars: [
      {
        key: 'O',
        label: 'Objective (Mục tiêu truyền cảm hứng)',
        subtitle: 'Định hướng rõ ràng, ngắn gọn, tạo động lực mạnh mẽ cho tổ chức',
        description: 'Trả lời câu hỏi: "Chúng ta muốn đạt đến đỉnh cao nào trong Quý này?".',
        ceoQuestion: 'Mục tiêu này có đủ rõ ràng và truyền lửa để cả công ty cùng hướng tới không?',
        exampleAtMvdn: 'Nâng tầm uy tín giao hàng thần tốc & chất lượng tem nhãn chuẩn xuất khẩu của Mã Vạch Đồng Nai.',
      },
      {
        key: 'KR',
        label: 'Key Results (Kết quả then chốt định lượng)',
        subtitle: '3-4 cột mốc đo lường bằng con số chứng minh Objective đã đạt được',
        description: 'Không phải là danh sách việc làm (To-do list), mà là kết quả đầu ra có số bắt đầu và số mục tiêu.',
        ceoQuestion: 'Khi các con số KR này đạt 100%, thì Objective đã chắc chắn thành công chưa?',
        exampleAtMvdn: 'KR1: Nâng tỷ lệ LSX giao đúng hạn từ 90% lên 98% • KR2: Giảm tỷ lệ tem lỗi công đoạn in xuống < 0.5%.',
      },
      {
        key: 'ACT',
        label: 'Aligned Actions (Hành động thúc đẩy hàng tuần)',
        subtitle: 'Kết nối từng công việc SMART hàng ngày vào đúng Key Result',
        description: 'Mọi công việc ưu tiên cao trong ngày đều phải đóng góp đẩy thanh tiến độ của ít nhất 1 Key Result.',
        ceoQuestion: 'Những việc làm hôm nay có thực sự làm nhích con số Key Result lên không?',
        exampleAtMvdn: 'Liên kết trực tiếp chỉ số On-time LSX Rate từ ERP ProTrack vào thanh tiến độ KR1 theo thời gian thực.',
      },
    ],
    goldenRules: [
      'Mỗi Quý chỉ chọn tối đa 3-4 Objectives cấp công ty để giữ sự tập trung tuyệt đối.',
      'Key Result bắt buộc phải có con số định lượng (Không có số = Không phải Key Result).',
      'Rà soát tiến độ OKR hàng tuần để kịp thời tháo gỡ điểm nghẽn.',
    ],
    commonPitfalls: [
      'Đặt quá nhiều OKR dẫn đến cái gì cũng quan trọng, cuối cùng không cái nào về đích.',
      'Viết Key Result giống như mô tả công việc hàng ngày thay vì kết quả đầu ra đo lường được.',
    ],
    realCaseStudy: {
      context: 'Công ty muốn vừa tăng sản lượng, vừa giảm lỗi, vừa rút ngắn thời gian báo giá.',
      badApproach: 'Giao 20 chỉ tiêu rời rạc cho các phòng ban và chỉ kiểm tra vào cuối năm.',
      goodApproach:
        'Thiết lập 3 Objectives trọng tâm Quý kèm các Key Results định lượng đối chiếu trực tiếp với dữ liệu ERP hàng ngày.',
      outcome: 'Toàn bộ quản lý cấp trung tự giác ưu tiên các đầu việc đẩy chỉ số KR.',
    },
  },

  // ─── 5. TRUYỀN THÔNG - DIỄN ĐẠT PREP ────────────────────────────────────────
  {
    code: 'PREP',
    docNumber: 'DOC-CEO-05',
    readingTime: '9 phút đọc • Giao tiếp & Chỉ đạo Sắc bén',
    shortName: 'Truyền thông PREP',
    fullTitle: 'Truyền thông - Diễn đạt PREP (Point - Reason - Example - Point)',
    category: 'Truyền thông & Chỉ đạo điều hành',
    tagline: 'Nói và viết đi thẳng vào kết luận, có lý lẽ thuyết phục và số liệu thực tế minh chứng.',
    corePhilosophy:
      'Trong điều hành doanh nghiệp, thời gian của CEO và nhân sự vô cùng quý giá. Cấu trúc PREP giúp mọi thông báo, chỉ đạo hoặc phát biểu trong cuộc họp luôn sắc bén, dễ hiểu trong 30 giây đầu tiên và thuyết phục tuyệt đối.',
    accentColor: '#0284c7',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    targetTab: 'execution',
    targetSubView: 'MEETINGS',
    originAndHistory: {
      author: 'Trường phái Tư duy Truyền thông Quản trị Diễn dịch & Nguyên lý Kim Tự Tháp (Barbara Minto – McKinsey & Company)',
      yearAndSource:
        'Mô hình Truyền thông Điều hành PREP (Point – Reason – Example – Point), tương đồng cốt lõi với Minto Pyramid Principle (Answer First)',
      historicalContext:
        'Trong môi trường kinh doanh tốc độ cao, các nhà lãnh đạo thường xuyên đối mặt với những báo cáo dài dòng kể lể hoàn cảnh mà không rõ kết luận, hoặc ngược lại là những mệnh lệnh áp đặt thiếu tính thuyết phục. Cấu trúc PREP ra đời từ nghệ thuật hùng biện kinh doanh và tư vấn quản trị chiến lược (đặt Kết luận lên đầu tiên – Answer First / Bottom Line Up Front), trở thành chuẩn mực giao tiếp bắt buộc tại các tập đoàn đa quốc gia Nhật Bản và phương Tây.',
    },
    theoreticalFoundation: {
      academicEssence:
        'Não bộ con người xử lý thông tin hiệu quả nhất theo trình tự Diễn dịch (Deductive Reasoning): Khi biết trước Kết luận cốt lõi (Point 1), người nghe lập tức có một "khung tham chiếu" để tiếp nhận Lý do (Reason); tiếp theo, Ví dụ/Số liệu thực chứng (Example) kích hoạt cả tư duy logic lẫn hình ảnh thực tế giúp xóa bỏ sự hoài nghi; cuối cùng, việc tái khẳng định Kết luận kèm lời kêu gọi hành động (Point 2) tạo ra hiệu ứng khắc sâu (Primacy & Recency Effect trong tâm lý học nhận thức).',
      formulaOrModel:
        'PREP = P1 (Kết luận/Chỉ đạo mở đầu) → R (Bởi vì: Lý do cốt lõi) → E (Ví dụ: Số liệu/Bằng chứng thực tế) → P2 (Vì vậy: Khẳng định lại & Hành động ngay)',
      synergyWithOtherFrameworks:
        'PREP là ngôn ngữ chuẩn dùng trong Họp 3-6-9 (giúp mỗi lượt phát biểu chỉ mất 60–90 giây mà cực kỳ rõ ý) và là khung soạn thảo các bản tin chỉ đạo từ ProCEO phát hành trực tiếp sang bảng thông báo ERP ProTrack.',
    },
    detailedSections: [
      {
        title: '1. Giải phẫu 4 bước P – R – E – P trong Chỉ đạo của CEO và Báo cáo của Nhân sự',
        content:
          'Bất kể là một văn bản chỉ đạo toàn công ty hay một câu trả lời dài 1 phút trong cuộc họp, cấu trúc PREP luôn đi qua 4 nhịp mạch lạc:',
        bulletPoints: [
          'P1 – Point (Điểm cốt lõi / Kết luận mở đầu): Nêu ngay lập tức quyết định, chủ trương, đề xuất hoặc câu trả lời "Có/Không", "Chọn phương án A hay B" ngay ở câu đầu tiên. Tuyệt đối không mở đầu bằng việc kể lể lịch sử.',
          'R – Reason (Lý do căn cốt): Nối bằng cụm từ "Bởi vì...". Đưa ra 1 đến tối đa 3 lý do sắc bén nhất giải thích tại sao quyết định ở P1 lại mang lại lợi ích cho khách hàng, công ty và chính người lao động. Simon Sinek gọi đây là "Start with Why" – khi nhân sự hiểu chữ Why, họ sẽ làm việc bằng sự tự giác.',
          'E – Example (Ví dụ & Dẫn chứng dữ liệu): Nối bằng cụm từ "Cụ thể là..." hoặc "Ví dụ thực tế...". Đưa ra con số thống kê từ ERP, một đơn hàng cụ thể hoặc một sự việc vừa diễn ra tại xưởng để chứng minh Lý do (R) là hoàn toàn xác thực.',
          'P2 – Point (Chốt lại thông điệp & Hành động tiếp theo): Nối bằng cụm từ "Vì vậy / Tóm lại...". Khẳng định lại quyết định một lần nữa gắn với hành động cụ thể mà người nghe cần thực hiện ngay sau khi đọc/nghe xong.',
        ],
      },
      {
        title: '2. Ứng dụng PREP để huấn luyện đội ngũ Quản lý cấp trung báo cáo lên CEO',
        content:
          'CEO không chỉ dùng PREP để ban hành chỉ đạo mà còn nên quy định toàn bộ Trưởng bộ phận/Tổ trưởng khi trình bày vấn đề hoặc xin ý kiến CEO phải nói theo đúng 4 câu PREP:',
        bulletPoints: [
          'Câu 1 (P): "Thưa anh, em đề xuất chuyển đơn hàng LSX-105 sang chạy trên máy số 3 ngay chiều nay."',
          'Câu 2 (R): "Bởi vì máy số 1 đang cần bảo dưỡng lô mực 2 tiếng, nếu chờ sẽ trễ giờ giao hàng 17h."',
          'Câu 3 (E): "Cụ thể máy số 3 vừa hoàn tất đơn trước sớm hơn dự kiến 90 phút và có sẵn khổ trục tương ứng."',
          'Câu 4 (P): "Vì vậy em xin phép điều phối tổ máy số 3 nhận lệnh này ngay lúc 13h30 ạ." → Chỉ mất 20 giây để CEO duyệt ngay lập tức!',
        ],
      },
    ],
    comparisonTable: {
      title: 'Bảng đối sánh: Truyền đạt Quy nạp vòng vo vs. Truyền đạt Diễn dịch PREP',
      leftHeader: 'Truyền đạt vòng vo (Quy nạp cảm tính)',
      rightHeader: 'Truyền đạt chuẩn PREP (Diễn dịch sắc bén)',
      rows: [
        {
          criterion: 'Câu mở đầu',
          leftValue: 'Kể lể bối cảnh, khó khăn, nguyên nhân dài dòng suốt 5 phút chưa biết muốn nói gì',
          rightValue: 'Đi thẳng vào kết luận/chỉ đạo ngay câu đầu tiên (Point 1)',
        },
        {
          criterion: 'Sức thuyết phục',
          leftValue: 'Nói chung chung hoặc ra mệnh lệnh khô khan khiến nhân viên làm đối phó',
          rightValue: 'Giải thích rõ Lý do (Reason) kèm Số liệu thực tế tại xưởng (Example)',
        },
        {
          criterion: 'Hành động sau khi nghe',
          leftValue: 'Người nghe phải hỏi lại "Vậy tóm lại bây giờ em cần làm gì ạ?"',
          rightValue: 'Khép lại bằng yêu cầu hành động dứt khoát, rõ ràng (Point 2)',
        },
      ],
    },
    standardTemplates: [
      {
        name: 'Mẫu 1: Khung Ban hành Chỉ đạo / Thông báo Nội bộ chuẩn PREP',
        usageWhen: 'Dùng khi CEO soạn thông báo quy định mới hoặc chỉ đạo vận hành gửi toàn công ty.',
        templateText:
          '• [POINT 1 - CHỦ TRƯƠNG]: Kể từ [Thời điểm], toàn bộ [Bộ phận/Đối tượng] chính thức áp dụng quy định [Nội dung quyết định cốt lõi].\n• [REASON - LÝ DO]: Bởi vì việc này giúp chúng ta [Lợi ích 1 về tiến độ/chất lượng] và đảm bảo [Lợi ích 2 cho quyền lợi nhân sự/khách hàng].\n• [EXAMPLE - DẪN CHỨNG]: Cụ thể, theo số liệu thực tế tại MVĐN [Trích dẫn ví dụ đơn hàng LSX hoặc con số thống kê chứng minh].\n• [POINT 2 - HÀNH ĐỘNG]: Vì vậy, đề nghị 100% [Đối tượng] thực hiện nghiêm túc [Hành động cụ thể] ngay từ ca làm việc hôm nay.',
      },
    ],
    classicReferences: [
      {
        workTitle: 'The Pyramid Principle: Logic in Writing and Thinking (1987)',
        author: 'Barbara Minto (McKinsey & Company)',
        keyTakeaway: 'Nguyên tắc vàng trong giao tiếp điều hành: Luôn bắt đầu bằng Kết luận trước (Answer First), sau đó mới triển khai các nhóm luận điểm và dữ liệu chứng minh.',
      },
      {
        workTitle: 'Start with Why (Bắt Đầu Với Câu Hỏi Tại Sao – 2009)',
        author: 'Simon Sinek',
        keyTakeaway: 'Con người không hành động nhiệt huyết chỉ vì biết cần làm Cái gì (What), họ cống hiến hết mình khi hiểu rõ Tại sao (Reason/Why) việc đó lại quan trọng.',
      },
    ],
    pillars: [
      {
        key: 'P',
        label: 'Point (Kết luận / Mệnh lệnh mở đầu)',
        subtitle: 'Nêu ngay thông điệp chính hoặc quyết định cốt lõi ở câu đầu tiên',
        description: 'Không vòng vo rào đón. Cho người nghe biết ngay chủ trương hoặc yêu cầu cần thực hiện.',
        ceoQuestion: 'Nếu nhân viên chỉ đọc câu đầu tiên, họ đã nắm được quyết định chính của tôi chưa?',
        exampleAtMvdn: 'Từ hôm nay, toàn bộ Lệnh sản xuất phải được cập nhật báo cáo sản lượng lên ERP ngay khi kết thúc ca máy.',
      },
      {
        key: 'R',
        label: 'Reason (Lý do / Nguyên nhân)',
        subtitle: 'Giải thích ngắn gọn tại sao quyết định này là cần thiết',
        description: 'Khi nhân sự hiểu rõ "Tại sao", họ sẽ tự giác thực hiện thay vì làm đối phó.',
        ceoQuestion: 'Lý do cốt lõi nhất mang lại lợi ích cho công ty và chính nhân viên là gì?',
        exampleAtMvdn: 'Bởi vì việc nắm số liệu tức thì giúp bộ phận Kế hoạch & Kinh doanh trả lời chính xác lịch giao hàng cho khách và tính thưởng năng suất minh bạch.',
      },
      {
        key: 'E',
        label: 'Example (Ví dụ / Dẫn chứng cụ thể)',
        subtitle: 'Đưa ra số liệu thực tế hoặc tình huống điển hình để chứng minh',
        description: 'Dẫn chứng cụ thể làm thông điệp trở nên sống động và không thể bàn cãi.',
        ceoQuestion: 'Có con số hoặc tình huống thực tế nào tại xưởng MVĐN minh họa rõ nhất cho điều này?',
        exampleAtMvdn: 'Ví dụ tuần trước, nhờ Tổ in số 1 báo cáo realtime trên ProTrack, chúng ta đã phát hiện sớm thiếu 2.000 tem của đơn LSX-082 và bù kịp trước giờ xe chạy.',
      },
      {
        key: 'P',
        label: 'Point (Khẳng định lại & Kêu gọi hành động)',
        subtitle: 'Chốt lại thông điệp một lần nữa kèm hành động cụ thể ngay lập tức',
        description: 'Đóng lại bằng một lời khẳng định dứt khoát để khắc sâu vào trí nhớ người nhận.',
        ceoQuestion: 'Hành động cụ thể ngay sau khi đọc xong thông điệp này là gì?',
        exampleAtMvdn: 'Vì vậy, yêu cầu 100% Tổ trưởng và vận hành máy nghiêm túc chốt sản lượng trên app trước khi rời vị trí sau mỗi ca.',
      },
    ],
    goldenRules: [
      'Luôn mở đầu bằng Kết luận (Point) trước khi giải thích dài dòng.',
      'Luôn kèm ít nhất 1 con số hoặc ví dụ thực tế (Example) lấy từ vận hành.',
      'Yêu cầu nhân viên khi báo cáo lên CEO cũng áp dụng đúng cấu trúc PREP.',
    ],
    commonPitfalls: [
      'Trình bày theo kiểu kể lể nguyên nhân dài 3 trang rồi mới nêu đề xuất ở dòng cuối cùng.',
      'Ra chỉ đạo cứng nhắc mà không giải thích Lý do (Reason) khiến nhân viên tâm phục khẩu phục.',
    ],
    realCaseStudy: {
      context: 'Ban hành quy định kiểm tra 100% chất lượng cuộn tem trước khi đóng thùng.',
      badApproach: 'Gửi thông báo 1 câu cụt lủn hoặc 1 văn bản hành chính dài dòng khó nhớ.',
      goodApproach:
        'Soạn chỉ đạo theo đúng 4 đoạn P-R-E-P và phát hành trực tiếp lên Bảng tin Nội bộ ERP ProTrack.',
      outcome: '100% nhân sự nắm rõ mục tiêu, tỷ lệ khiếu nại khách hàng giảm về 0.',
    },
  },

  // ─── 6. THÁP NHU CẦU MASLOW ────────────────────────────────────────────────
  {
    code: 'MASLOW',
    docNumber: 'DOC-CEO-06',
    readingTime: '12 phút đọc • Tâm lý học Tổ chức & Đãi ngộ',
    shortName: 'Tháp Maslow',
    fullTitle: 'Tạo động lực cho nhân viên - Tháp nhu cầu Maslow (5 tầng)',
    category: 'Quản trị con người & Tạo động lực',
    tagline: 'Thấu hiểu đúng tầng nhu cầu hiện tại của từng nhân sự để trao đúng đòn bẩy động lực.',
    corePhilosophy:
      'Mỗi nhân viên ở từng giai đoạn có một mối quan tâm hàng đầu khác nhau. Người đang lo trang trải cuộc sống cần thu nhập ổn định (Tầng 1-2); người đã vững tay nghề cần sự gắn kết, ghi nhận (Tầng 3-4); quản lý nòng cốt cần không gian tự chủ và phát triển (Tầng 5). CEO giỏi là người đọc vị đúng tầng nhu cầu để kích hoạt tối đa nội lực đội ngũ.',
    accentColor: '#e11d48',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    targetTab: 'cockpit',
    originAndHistory: {
      author: 'Giáo sư Tâm lý học Abraham Harold Maslow (1908–1970, Đại học Brandeis, Hoa Kỳ)',
      yearAndSource:
        'Năm 1943 – Bài báo khoa học "A Theory of Human Motivation" trên tạp chí Psychological Review & Cuốn sách "Motivation and Personality" (1954)',
      historicalContext:
        'Năm 1943, nhà tâm lý học nhân văn Abraham Maslow công bố công trình nghiên cứu mang tính bước ngoặt về động lực con người. Thay vì coi con người chỉ phản ứng thụ động trước phần thưởng tiền bạc hay hình phạt như thuyết Hành vi (Behaviorism), Maslow chứng minh rằng con người được thúc đẩy bởi một hệ thống nhu cầu phân tầng từ thấp đến cao. Trong quản trị nhân sự hiện đại, Tháp Maslow là nền tảng để xây dựng Chiến lược Đãi ngộ Toàn diện (Total Rewards Strategy) và giữ chân nhân tài.',
    },
    theoreticalFoundation: {
      academicEssence:
        'Maslow chia 5 tầng nhu cầu thành 2 nhóm bản chất khác biệt: (1) Nhóm Nhu cầu Thiếu hụt (Deficiency Needs / D-Needs – gồm Tầng 1 Sinh lý, Tầng 2 An toàn, Tầng 3 Xã hội, Tầng 4 Tôn trọng): Khi các nhu cầu này bị thiếu hụt, nhân sự sẽ cảm thấy bất an, lo lắng và giảm sút hiệu suất; nhưng khi đã được đáp ứng đủ ngưỡng, việc bơm thêm tiền đơn thuần sẽ giảm dần tác dụng tạo động lực. (2) Nhóm Nhu cầu Phát triển (Growth / Being Needs / B-Needs – Tầng 5 Tự thể hiện): Đây là nguồn động lực nội sinh vô tận; càng được trao quyền sáng tạo, làm chủ và phát triển bản thân, nhân sự nòng cốt càng gắn bó và cống hiến mạnh mẽ hơn.',
      formulaOrModel:
        'Động lực Bền vững = Đảm bảo vững chắc D-Needs (Tầng 1 Sinh lý + Tầng 2 An toàn) × Kích hoạt mạnh mẽ Tầng 3 (Gắn kết) + Tầng 4 (Ghi nhận FFC) + Tầng 5 (Trao quyền tự chủ)',
      synergyWithOtherFrameworks:
        'Tháp Maslow cho CEO biết "Nhân viên này đang cần gì nhất?", từ đó sử dụng công cụ Khen ngợi FFC để đáp ứng Tầng 4 (Nhu cầu được tôn trọng) hoặc giao làm chủ các mục tiêu OKR / dự án cải tiến PDCA để đáp ứng Tầng 5 (Nhu cầu tự thể hiện).',
    },
    detailedSections: [
      {
        title: '1. Bản đồ chuyển hóa 5 Tầng Maslow thành Chính sách Quản trị Nhân sự tại Doanh nghiệp',
        content:
          'Để áp dụng Tháp Maslow vào điều hành thực tế tại doanh nghiệp sản xuất như MVĐN, CEO cần ánh xạ từng tầng nhu cầu sang các đòn bẩy quản trị cụ thể:',
        bulletPoints: [
          'Tầng 1 – Nhu cầu Sinh lý (Physiological Needs): Tương ứng với Lương cơ bản, đơn giá thưởng sản lượng công đoạn, phụ cấp tăng ca, bữa ăn giữa ca đủ dinh dưỡng, nước uống, hệ thống thông gió/làm mát tại xưởng in và thời gian nghỉ ngơi hợp lý.',
          'Tầng 2 – Nhu cầu An toàn (Safety Needs): Tương ứng với Hợp đồng lao động dài hạn, Bảo hiểm xã hội/y tế, trang thiết bị bảo hộ lao động khi vận hành máy bế/máy xẻ, và đặc biệt là "An toàn tâm lý" nhờ có quy trình SOP rõ ràng (công nhân biết làm đúng quy trình sẽ không sợ bị phạt oan).',
          'Tầng 3 – Nhu cầu Xã hội & Gắn kết (Love & Belonging Needs): Tương ứng với Văn hóa đồng đội hỗ trợ nhau giữa các ca máy, sự phối hợp hòa thuận giữa khối Văn phòng (Kinh doanh, Kế kế hoạch) và khối Xưởng, người hướng dẫn (Mentor) kèm cặp nhân viên mới, các dịp sinh nhật và thăm hỏi gia đình.',
          'Tầng 4 – Nhu cầu Được tôn trọng (Esteem Needs): Tương ứng với Sự ghi nhận kịp thời từ Ban Giám đốc (qua lời khen FFC), bảng vinh danh cá nhân xuất sắc trên hệ thống ERP, chức danh chuyên môn (Thợ chính, Tổ trưởng) và việc lắng nghe ý kiến đóng góp kỹ thuật của người lao động.',
          'Tầng 5 – Nhu cầu Tự thể hiện & Phát triển (Self-Actualization Needs): Tương ứng với Việc trao quyền tự chủ dẫn dắt dự án cải tiến PDCA, cơ hội học nâng cao tay nghề quản lý, lộ trình thăng tiến rõ ràng lên Quản đốc/Trưởng phòng và cơ chế chia sẻ thành quả sáng kiến.',
        ],
      },
      {
        title: '2. Nghệ thuật "Chẩn đoán đúng tầng nhu cầu" cho từng nhóm nhân sự',
        content:
          'Không phải mọi nhân viên trong cùng một thời điểm đều nằm ở cùng một tầng nhu cầu. CEO cần cá nhân hóa cách tiếp cận:',
        bulletPoints: [
          'Với công nhân mới vào hoặc đang có gánh nặng tài chính gia đình (Đang ưu tiên Tầng 1 & 2): Đòn bẩy hiệu quả nhất là hướng dẫn thao tác chuẩn để họ nhanh chóng đạt định mức thưởng năng suất và ổn định thu nhập.',
          'Với thợ lành nghề lâu năm đã có thu nhập ổn định (Đang ưu tiên Tầng 3 & 4): Đòn bẩy hiệu quả nhất là sự tôn trọng, tuyên dương công khai tay nghề của họ trước tập thể và giao vai trò kèm cặp lớp kế cận.',
          'Với Quản đốc, Tổ trưởng, Trưởng bộ phận (Đang ưu tiên Tầng 4 & 5): Đòn bẩy hiệu quả nhất là trao quyền quyết định trong phạm vi trách nhiệm, giao mục tiêu OKR thách thức và đồng hành huấn luyện (Coaching).',
        ],
      },
    ],
    comparisonTable: {
      title: 'Bảng đối sánh: Đãi ngộ đồng loạt một kiểu vs. Quản trị động lực theo Tháp Maslow',
      leftHeader: 'Đãi ngộ đồng loạt (One-size-fits-all)',
      rightHeader: 'Quản trị động lực theo Tháp Maslow (ProCEO)',
      rows: [
        {
          criterion: 'Quan niệm về động lực',
          leftValue: 'Cho rằng mọi vấn đề của nhân viên chỉ xoay quanh tiền lương hoặc kỷ luật phạt',
          rightValue: 'Hiểu rõ sự kết hợp giữa Đãi ngộ vật chất (Tầng 1-2) và Đãi ngộ tinh thần & Phát triển (Tầng 3-4-5)',
        },
        {
          criterion: 'Cách xử lý khi nhân sự giỏi giảm nhiệt huyết',
          leftValue: 'Bỏ mặc hoặc trách móc nhân viên thiếu trách nhiệm',
          rightValue: 'Chấm điểm 5 tầng nhu cầu để phát hiện đúng điểm khuyết (thường thiếu sự ghi nhận Tầng 4 hoặc thử thách mới Tầng 5)',
        },
        {
          criterion: 'Tỷ lệ giữ chân nhân sự nòng cốt',
          leftValue: 'Dễ chảy máu chất xám khi đối thủ trả lương cao hơn một chút',
          rightValue: 'Nhân sự gắn bó bền chặt nhờ môi trường an toàn, ấm áp, được tôn trọng và có lộ trình phát triển',
        },
      ],
    },
    standardTemplates: [
      {
        name: 'Mẫu 1: Khung Trò chuyện 1-1 (One-on-One Check-in) theo 5 Tầng Maslow',
        usageWhen: 'Dùng khi CEO hoặc Trưởng bộ phận ngồi trò chuyện định kỳ 15 phút với nhân sự chủ chốt.',
        templateText:
          '1. KIỂM TRA TẦNG 1 & 2 (Thu nhập & Công cụ làm việc): "Trong tháng qua, công việc tại máy/bộ phận của em có gặp bất tiện gì về máy móc, quy trình hay thu nhập không?"\n2. KIỂM TRA TẦNG 3 (Phối hợp đội nhóm): "Sự phối hợp giữa tổ mình với các bộ phận liên quan (Kế hoạch, Kho, Kinh doanh) có điểm nào cần anh hỗ trợ tháo gỡ không?"\n3. KÍCH HOẠT TẦNG 4 (Ghi nhận): [Gửi lời khen FFC về 1 đóng góp cụ thể của nhân viên trong tháng qua].\n4. KÍCH HOẠT TẦNG 5 (Phát triển & Trao quyền): "Trong Quý tới, em muốn thử sức cải tiến khâu nào hoặc phát triển thêm kỹ năng gì để tiến xa hơn?"',
      },
    ],
    classicReferences: [
      {
        workTitle: 'A Theory of Human Motivation (1943) & Motivation and Personality (1954)',
        author: 'Abraham H. Maslow',
        keyTakeaway: 'Tác phẩm gốc phân tích 5 tầng nhu cầu của con người và cơ chế chuyển dịch từ nhu cầu thiếu hụt (D-Needs) sang nhu cầu phát triển bản thân (B-Needs).',
      },
      {
        workTitle: 'One More Time: How Do You Motivate Employees? (Harvard Business Review, 1968)',
        author: 'Frederick Herzberg',
        keyTakeaway: 'Bổ sung hoàn hảo cho Maslow với Thuyết Hai Nhân Tố: Tầng 1-2-3 là Nhân tố Duy trì (Hygiene Factors – giúp nhân viên không bất mãn), còn Tầng 4-5 là Nhân tố Tạo động lực thật sự (Motivators – giúp nhân viên cống hiến xuất sắc).',
      },
    ],
    pillars: [
      {
        key: 'L1',
        label: 'Tầng 1: Sinh lý (Physiological)',
        subtitle: 'Lương, thưởng năng suất, bữa ăn ca, môi trường làm việc',
        description: 'Đảm bảo đời sống vật chất cơ bản và sức khỏe thể chất để người lao động yên tâm làm việc.',
        ceoQuestion: 'Thu nhập và điều kiện làm việc tại xưởng của nhân sự này đã đảm bảo tốt chưa?',
        exampleAtMvdn: 'Chi trả lương đúng ngày, thưởng vượt định mức rõ ràng, cải thiện hệ thống làm mát khu vực máy in.',
      },
      {
        key: 'L2',
        label: 'Tầng 2: An toàn (Safety)',
        subtitle: 'Ổn định công việc, bảo hiểm, an toàn máy móc, quy trình minh bạch',
        description: 'Tạo cảm giác an tâm lâu dài, không lo rủi ro tai nạn hay bị đối xử thiếu công bằng.',
        ceoQuestion: 'Nhân viên có cảm thấy an toàn về công việc, chế độ và quy trình làm việc không?',
        exampleAtMvdn: 'Đóng BHXH đầy đủ, trang bị đồ bảo hộ máy bế/xẻ và ban hành quy trình xử lý sự cố công tâm.',
      },
      {
        key: 'L3',
        label: 'Tầng 3: Xã hội & Gắn kết (Belonging)',
        subtitle: 'Tình đồng nghiệp, văn hóa sẻ chia, sự quan tâm của lãnh đạo',
        description: 'Ai cũng muốn thuộc về một tập thể đoàn kết, ấm áp và được lắng nghe.',
        ceoQuestion: 'Nhân sự này có hòa nhập tốt với đội nhóm và nhận được sự hỗ trợ từ cấp trên không?',
        exampleAtMvdn: 'Tổ chức mừng sinh nhật trên ERP, phân công người kèm cặp nhân viên mới, gắn kết khối Văn phòng & Xưởng.',
      },
      {
        key: 'L4',
        label: 'Tầng 4: Được tôn trọng (Esteem)',
        subtitle: 'Sự công nhận, khen ngợi cụ thể (FFC), uy tín chuyên môn',
        description: 'Khi đóng góp được ghi nhận xứng đáng trước tập thể, nhân viên sẽ làm việc với niềm tự hào.',
        ceoQuestion: 'Lần gần nhất tôi khen ngợi cụ thể thành tích của nhân sự này trước tập thể là khi nào?',
        exampleAtMvdn: 'Vinh danh công nhân đạt sản lượng và chất lượng cao nhất tuần trên bảng thông báo toàn công ty.',
      },
      {
        key: 'L5',
        label: 'Tầng 5: Tự thể hiện (Self-Actualization)',
        subtitle: 'Trao quyền, thử thách lớn, sáng tạo cải tiến PDCA, lộ trình thăng tiến',
        description: 'Giúp nhân sự chủ chốt phát huy tối đa tài năng và trở thành phiên bản xuất sắc nhất.',
        ceoQuestion: 'Tôi đã trao cơ hội dẫn dắt dự án hoặc lộ trình phát triển nào cho nhân sự nòng cốt này?',
        exampleAtMvdn: 'Giao quyền làm chủ dự án cải tiến PDCA giảm hao hụt vật tư và quy hoạch lên vị trí Quản đốc.',
      },
    ],
    goldenRules: [
      'Không dùng một cách tạo động lực giống hệt nhau cho tất cả mọi người.',
      'Đảm bảo vững chắc Tầng 1 & Tầng 2 cho khối công nhân trực tiếp, đồng thời đẩy mạnh Tầng 3, 4, 5 để giữ chân nhân tài.',
      'Kết hợp đánh giá Maslow với việc trò chuyện 1-1 định kỳ.',
    ],
    commonPitfalls: [
      'Nói chuyện tầm nhìn xa vời với nhân viên đang gặp khó khăn kinh tế gia đình (lệch tầng nhu cầu).',
      'Chỉ trả lương mà quên mất nhu cầu được tôn trọng và ghi nhận (Tầng 4) khiến thợ giỏi rời đi.',
    ],
    realCaseStudy: {
      context: 'Thợ đứng máy in lành nghề có dấu hiệu giảm nhiệt huyết dù lương vẫn tốt.',
      badApproach: 'Nghĩ rằng nhân viên đòi tăng lương hoặc chểnh mảng.',
      goodApproach:
        'Phân tích theo Tháp Maslow: Nhân sự đã thỏa mãn tầng 1-2 nhưng đang thiếu tầng 4 & 5 → Trao vai trò Mentor đào tạo thợ mới và tuyên dương kỹ thuật căn màu xuất sắc trên hệ thống.',
      outcome: 'Nhân sự gắn bó mạnh mẽ và đào tạo thêm được 3 thợ phụ lành nghề cho xưởng.',
    },
  },

  // ─── 7. NGUYÊN TẮC KHEN NGỢI FFC ───────────────────────────────────────────
  {
    code: 'FFC',
    docNumber: 'DOC-CEO-07',
    readingTime: '9 phút đọc • Nghệ thuật Ghi nhận & Củng cố Hành vi',
    shortName: 'Khen ngợi FFC',
    fullTitle: 'Giúp lời khen trở nên cụ thể hơn - Nguyên tắc khen ngợi FFC (Feeling - Fact - Compare)',
    category: 'Nghệ thuật ghi nhận & Khen thưởng',
    tagline: 'Thay lời khen xã giao "Giỏi lắm" bằng lời khen chạm cảm xúc, đúng sự thật và nhân rộng hành vi tốt.',
    corePhilosophy:
      'Một lời khen chung chung như "Em làm tốt lắm" sẽ bị quên ngay sau 5 phút. Nhưng một lời khen theo công thức FFC (Cảm xúc chân thành + Sự thật/Số liệu cụ thể + So sánh tạo giá trị) sẽ khiến nhân viên nhớ mãi và biết chính xác hành vi xuất sắc nào cần tiếp tục phát huy.',
    accentColor: '#ea580c',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    targetTab: 'cockpit',
    originAndHistory: {
      author: 'Tâm lý học Hành vi Tổ chức (Positive Reinforcement – B.F. Skinner & Kenneth Blanchard) & Mô hình Huấn luyện Lãnh đạo Hiện đại',
      yearAndSource:
        'Công thức Khen ngợi Đích danh FFC (Feeling – Fact – Compare) & Học thuyết "One Minute Praisings" (Kenneth Blanchard – The One Minute Manager)',
      historicalContext:
        'Nghiên cứu của Gallup trên hơn 4 triệu nhân viên toàn cầu chỉ ra rằng: lý do số 1 khiến nhân sự giỏi rời bỏ tổ chức không phải vì lương thấp, mà vì họ cảm thấy nỗ lực của mình không được ghi nhận xứng đáng. Tuy nhiên, phần lớn các nhà quản lý khi khen ngợi lại dùng những câu xã giao chung chung ("Làm tốt lắm", "Cố gắng phát huy nhé") khiến người nghe cảm thấy sáo rỗng. Công thức FFC (Feeling – Fact – Compare) ra đời để biến lời khen của CEO thành một công cụ quản trị sắc bén, vừa chạm đến trái tim vừa định hướng chuẩn hành vi chuyên nghiệp.',
    },
    theoreticalFoundation: {
      academicEssence:
        'Dựa trên Nguyên lý Củng cố Tích cực (Positive Reinforcement): "Hành vi nào được ghi nhận cụ thể và tức thì, hành vi đó sẽ được lặp lại với tần suất cao hơn". Công thức FFC kết hợp 3 tầng tác động tâm lý: (1) Feeling (Cảm xúc chân thành của người lãnh đạo) tạo sự kết nối cảm xúc ấm áp (Emotional Resonance); (2) Fact (Sự thật/Số liệu khách quan) chứng minh CEO thực sự quan sát và biết rõ chi tiết nỗ lực của nhân viên chứ không khen đại khái; (3) Compare (So sánh đối chiếu) giúp nhân viên nhận thức rõ sự tiến bộ vượt bậc của bản thân so với quá khứ hoặc giá trị to lớn mà họ vừa đóng góp cho tập thể.',
      formulaOrModel:
        'Lời khen FFC = F1 (Cảm xúc thật của CEO) + F2 (Hành vi & Con số thực tế đạt được) + C (So sánh với quá khứ / định mức & Khẳng định giá trị lan tỏa)',
      synergyWithOtherFrameworks:
        'Khen ngợi FFC là công cụ trực tiếp nhất để thỏa mãn Tầng 4 (Nhu cầu được tôn trọng – Esteem) trong Tháp Maslow, đồng thời là mảnh ghép Recognition (Ghi nhận) trong hệ thống CFRs đi kèm công cụ OKR.',
    },
    detailedSections: [
      {
        title: '1. Giải phẫu chi tiết 3 thành tố F – F – C để lời khen có sức nặng ngàn cân',
        content:
          'Một lời khen FFC hoàn chỉnh chỉ cần 3 câu ngắn gọn nhưng phải chứa đựng đủ 3 yếu tố sau:',
        bulletPoints: [
          'F1 – Feeling (Cảm xúc chân thành của người lãnh đạo): Mở đầu bằng đại từ nhân xưng của lãnh đạo ("Anh thực sự rất tự hào...", "Anh rất yên tâm và cảm kích...", "Ban Giám đốc rất ấn tượng..."). Cảm xúc thật của CEO là phần thưởng tinh thần quý giá mở cánh cửa đón nhận của nhân viên.',
          'F2 – Fact (Sự thật khách quan, Hành vi cụ thể & Con số định lượng): Đây là linh hồn của phương pháp FFC. Tuyệt đối không khen phẩm chất mơ hồ ("Em rất chăm chỉ"), mà phải chỉ rõ hành vi và con số ("...khi hôm nay em chủ động phát hiện sớm lỗi lệch khuôn ở 30 mét decal đầu tiên và hoàn thành trọn vẹn 45.000 tem đơn LSX-092 đạt chuẩn 100%").',
          'C – Compare (So sánh tạo điểm nhấn & Khẳng định giá trị): Đặt thành tích vừa nêu vào một hệ quy chiếu so sánh: (a) So sánh với chính nhân viên đó trước đây ("Tốc độ căn chỉnh máy của em đã nhanh hơn 30% so với tháng trước"); hoặc (b) So sánh với tiêu chuẩn/tác động chung ("Nhờ sự cẩn thận của em mà công ty tiết kiệm được cả cuộn decal lớn và giữ trọn uy tín với khách hàng VIP").',
        ],
      },
      {
        title: '2. Những điều cấm kỵ tuyệt đối khi khen ngợi nhân sự',
        content:
          'Để lời khen FFC phát huy 100% công năng tạo động lực, CEO và các cấp quản lý cần tránh 3 chiếc bẫy tâm lý sau:',
        bulletPoints: [
          'Không dùng từ "NHƯNG" ngay sau lời khen (Bẫy Sandwich lỗi thời): Nhiều quản lý khen 1 câu rồi lập tức nói "Tuy nhiên/Nhưng mà hôm trước em vẫn còn lỗi...". Từ "Nhưng" sẽ xóa sạch toàn bộ cảm xúc tích cực phía trước và khiến nhân viên nghĩ rằng lời khen chỉ là cái cớ mở màn để phê bình.',
          'Không khen trễ hạn: Hãy khen ngay trong ngày hoặc ngay khi báo cáo công đoạn vừa cập nhật lên ERP (Khen nóng tại hiện trường).',
          'Không khen sai sự thật hoặc khen quá lời không có căn cứ số liệu: Khen không đúng người, đúng việc sẽ làm mất uy tín của người lãnh đạo trước tập thể.',
        ],
      },
    ],
    comparisonTable: {
      title: 'Bảng đối sánh: Khen xã giao truyền thống vs. Khen ngợi theo Nguyên tắc FFC',
      leftHeader: 'Khen xã giao truyền thống',
      rightHeader: 'Khen ngợi chuẩn FFC (ProCEO)',
      rows: [
        {
          criterion: 'Nội dung câu khen',
          leftValue: '"Dạo này làm việc tốt lắm em, cố gắng phát huy nhé!"',
          rightValue: 'Đầy đủ 3 phần: Cảm xúc của CEO (Feeling) + Số liệu/Hành vi thực tế (Fact) + So sánh tiến bộ (Compare)',
        },
        {
          criterion: 'Cảm nhận của nhân viên',
          leftValue: 'Cảm thấy sáo rỗng, xã giao; không biết cụ thể mình đã làm tốt ở điểm nào',
          rightValue: 'Xúc động và tự hào vì biết lãnh đạo thực sự quan sát và trân trọng từng nỗ lực cụ thể của mình',
        },
        {
          criterion: 'Tác động đến đội ngũ xung quanh',
          leftValue: 'Không tạo ra bài học hay chuẩn mực nào cho các đồng nghiệp khác học tập',
          rightValue: 'Cả tập thể nhìn vào phần Fact & Compare đều hiểu rõ tiêu chuẩn hành vi xuất sắc mà công ty đề cao',
        },
      ],
    },
    standardTemplates: [
      {
        name: 'Mẫu 1: Khung Khen ngợi FFC dành cho Nhân sự Sản xuất / Vận hành',
        usageWhen: 'Dùng khi nhân viên vượt định mức sản lượng, phát hiện lỗi sớm hoặc hỗ trợ đơn hàng gấp.',
        templateText:
          '• [FEELING]: Anh và Ban Giám đốc thực sự rất [ấn tượng / tự hào / yên tâm và trân trọng] trước tinh thần làm việc của [Tên nhân viên] hôm nay.\n• [FACT]: Cụ thể, trong ca làm việc ngày [Ngày], em đã [Mô tả hành vi cụ thể + Con số sản lượng/chất lượng đạt được trên đơn LSX...].\n• [COMPARE]: Kết quả này đã vượt [X%] so với định mức chuẩn (hoặc nhanh hơn rõ rệt so với tháng trước), trực tiếp giúp công ty [Giá trị mang lại: giao hàng đúng hẹn / tiết kiệm vật tư]. Cảm ơn sự đóng góp tuyệt vời của em!',
      },
    ],
    classicReferences: [
      {
        workTitle: 'The One Minute Manager (Vị Giám Đốc Một Phút – 1982)',
        author: 'Kenneth Blanchard & Spencer Johnson',
        keyTakeaway: 'Bí quyết quản trị con người hiệu quả nhất: "Hãy bắt quả tang nhân viên khi họ đang làm điều gì đó đúng đắn" (Catch them doing something right) và khen ngợi cụ thể ngay lập tức.',
      },
      {
        workTitle: 'First, Break All the Rules (Gallup Workplace Study)',
        author: 'Marcus Buckingham & Curt Coffman',
        keyTakeaway: 'Những đội ngũ có hiệu suất cao nhất luôn nhận được sự ghi nhận cụ thể tối thiểu 1 lần mỗi 7 ngày làm việc.',
      },
    ],
    pillars: [
      {
        key: 'F1',
        label: 'Feeling (Cảm xúc của người lãnh đạo)',
        subtitle: 'Mở đầu bằng cảm xúc thật: Vui mừng, tự hào, trân trọng, yên tâm',
        description: 'Chia sẻ cảm xúc tích cực của CEO khi chứng kiến nỗ lực hoặc kết quả của nhân viên.',
        ceoQuestion: 'Kết quả của nhân viên mang lại cho tôi cảm xúc tích cực cụ thể nào?',
        exampleAtMvdn: '"Anh thực sự rất ấn tượng và yên tâm khi nhìn thấy tinh thần trách nhiệm của em hôm nay..."',
      },
      {
        key: 'F2',
        label: 'Fact (Sự thật / Hành vi & Con số cụ thể)',
        subtitle: 'Nêu chính xác việc nhân viên đã làm và con số đạt được',
        description: 'Không khen tính cách chung chung; hãy khen hành động cụ thể và kết quả định lượng.',
        ceoQuestion: 'Hành động cụ thể nào hoặc con số báo cáo nào trên ERP chứng minh sự xuất sắc đó?',
        exampleAtMvdn: '"...khi em chủ động kiểm tra phát hiện lệch khuôn ở 50m decal đầu tiên và hoàn thành 45.000 tem đơn LSX-092 không một lỗi nhỏ."',
      },
      {
        key: 'C',
        label: 'Compare (So sánh & Khẳng định giá trị)',
        subtitle: 'So sánh với trước đây, với định mức chuẩn hoặc tác động tích cực mang lại',
        description: 'Cho nhân viên thấy bước tiến vượt bậc của chính họ hoặc giá trị to lớn họ vừa đóng góp cho tập thể.',
        ceoQuestion: 'Kết quả này vượt trội thế nào so với tháng trước hoặc giúp công ty tránh được thiệt hại gì?',
        exampleAtMvdn: '"Tốc độ căn máy của em đã nhanh hơn 30% so với tháng trước, giúp công ty tiết kiệm cả cuộn decal lớn và giao hàng sớm hơn 2 tiếng cho khách VIP!"',
      },
    ],
    goldenRules: [
      'Khen ngay khi sự việc vừa diễn ra (càng sớm hiệu quả tạo động lực càng cao).',
      'Luôn trích dẫn con số hoặc hành vi thực tế (Fact) từ báo cáo công việc/ERP.',
      'Kết hợp gửi lời khen FFC cá nhân và vinh danh công khai trên bảng thông báo ProTrack.',
    ],
    commonPitfalls: [
      'Khen sáo rỗng "Cố gắng phát huy nhé" khiến nhân viên cảm thấy xã giao.',
      'Vừa khen được 1 câu đã nối ngay bằng từ "Nhưng mà..." để chê bai làm mất sạch tác dụng của lời khen.',
    ],
    realCaseStudy: {
      context: 'Công nhân đứng máy bế hoàn thành vượt sản lượng trong ngày cao điểm.',
      badApproach: 'Nhắn tin "Hôm nay làm tốt đấy em".',
      goodApproach:
        'Dùng công cụ FFC trên ProCEO lấy trực tiếp số lượng đạt từ báo cáo ERP và gửi thông báo tuyên dương 3 phần Feeling - Fact - Compare.',
      outcome: 'Nhân viên hào hứng chia sẻ niềm vui với cả tổ, năng suất cả ca tăng rõ rệt.',
    },
  },

  // ─── 8. PHÂN TÍCH SWOT & MA TRẬN TOWS ──────────────────────────────────────
  {
    code: 'SWOT',
    docNumber: 'DOC-CEO-08',
    readingTime: '14 phút đọc • Quản trị Chiến lược Cạnh tranh',
    shortName: 'Phân tích SWOT',
    fullTitle: 'Quản trị chiến lược cạnh tranh của doanh nghiệp - Phân tích SWOT & Ma trận TOWS',
    category: 'Chiến lược cạnh tranh',
    tagline: 'Nhận diện thấu đáo Điểm mạnh (S), Điểm yếu (W), Cơ hội (O), Thách thức (T) để ra quyết sách thắng lợi.',
    corePhilosophy:
      'Phân tích SWOT không chỉ để liệt kê 4 ô tĩnh, mà quan trọng nhất là ghép cặp thành hành động chiến lược (TOWS): Dùng Điểm mạnh chớp Cơ hội (SO), Khắc phục Điểm yếu để đón Cơ hội (WO), Dùng Điểm mạnh hóa giải Thách thức (ST), và Phòng thủ giảm Điểm yếu trước Thách thức (WT).',
    accentColor: '#4f46e5',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    targetTab: 'execution',
    targetSubView: 'SMART',
    originAndHistory: {
      author: 'Albert S. Humphrey (Viện Nghiên cứu Stanford – SRI, thập niên 1960) & Giáo sư Heinz Weihrich (Ma trận TOWS, 1982)',
      yearAndSource:
        'Nghiên cứu Hoạch định Chiến lược Fortune 500 tại Stanford Research Institute (1960–1970) & Bài báo "The TOWS Matrix: A Tool for Situational Analysis" của Heinz Weihrich trên tạp chí Long Range Planning (1982)',
      historicalContext:
        'Vào thập niên 1960, Viện Nghiên cứu Stanford (SRI) dưới sự dẫn dắt của Albert Humphrey đã thực hiện dự án nghiên cứu kéo dài 10 năm trên 500 tập đoàn lớn nhất Hoa Kỳ (Fortune 500) để tìm hiểu tại sao nhiều kế hoạch dài hạn của doanh nghiệp lại thất bại. Nhóm nghiên cứu phát triển mô hình SOFT (Satisfactory – Opportunity – Fault – Threat), sau đó được hoàn thiện thành SWOT (Strengths – Weaknesses – Opportunities – Threats). Đến năm 1982, Giáo sư Heinz Weihrich (Đại học San Francisco) đã nâng cấp SWOT tĩnh thành Ma trận động TOWS nhằm kết hợp các yếu tố nội tại và ngoại cảnh thành 4 nhóm hành động chiến lược cụ thể.',
    },
    theoreticalFoundation: {
      academicEssence:
        'Quản trị chiến lược hiện đại đòi hỏi sự tương thích chiến lược (Strategic Fit) giữa Năng lực Nội tại (Internal Environment – những yếu tố CEO có thể kiểm soát trực tiếp gồm Strengths & Weaknesses) và Môi trường Bên ngoài (External Environment – xu hướng thị trường, khách hàng, đối thủ, công nghệ gồm Opportunities & Threats). Điểm mấu chốt của tư duy SWOT chuẩn học thuật là không dừng lại ở việc liệt kê 4 danh sách, mà sử dụng Ma trận giao thoa TOWS để biến phân tích thành các quyết sách cạnh tranh có người phụ trách và thời hạn thực thi.',
      formulaOrModel:
        'Ma trận Chiến lược TOWS = [SO: Maxi-Maxi (Tấn công)] + [WO: Mini-Maxi (Chuyển dịch cải tiến)] + [ST: Maxi-Mini (Khác biệt hóa)] + [WT: Mini-Mini (Phòng thủ tối ưu)]',
      synergyWithOtherFrameworks:
        'SWOT & TOWS là điểm khởi đầu của toàn bộ chu trình quản trị: Các chiến lược SO và ST được chuyển hóa thành mục tiêu OKR của Quý; các chiến lược khắc phục điểm yếu WO và WT được đưa vào chu trình cải tiến PDCA và giao việc theo nguyên tắc SMART.',
    },
    detailedSections: [
      {
        title: '1. Phân tích 2 Trục: Nội lực Doanh nghiệp (S – W) và Môi trường Cạnh tranh (O – T)',
        content:
          'Để bản phân tích SWOT sắc bén và trung thực, CEO cần phân tách rõ ranh giới giữa bên trong và bên ngoài doanh nghiệp:',
        bulletPoints: [
          'Strengths (Điểm mạnh nội tại – Bên trong): Những năng lực cốt lõi (Core Competencies) mà doanh nghiệp thực sự làm tốt hơn đối thủ cạnh tranh. Ví dụ tại MVĐN: Hệ thống quản trị sản xuất ProTrack ERP theo dõi tiến độ từng công đoạn theo thời gian thực, khả năng đáp ứng đơn hàng tem nhãn gấp trong 24h, đội ngũ kỹ thuật in lành nghề.',
          'Weaknesses (Điểm yếu nội tại – Bên trong): Những mắt xích còn hạn chế làm giảm năng lực cạnh tranh hoặc làm tăng giá thành. Ví dụ: Thời gian chuẩn bị khuôn/bình bản cho một số dòng tem mới còn lâu, tỷ lệ hao hụt vật tư khi đổi mã hàng ngắn.',
          'Opportunities (Cơ hội thị trường – Bên ngoài): Các xu hướng tích cực từ thị trường, chuỗi cung ứng hoặc chính sách mà doanh nghiệp có thể khai thác. Ví dụ: Làn sóng dịch chuyển nhà máy FDI, kho vận Logistics và thương mại điện tử về Đồng Nai – Bình Dương kéo theo nhu cầu tem mã vạch truy xuất nguồn gốc tăng mạnh.',
          'Threats (Thách thức & Rủi ro – Bên ngoài): Các áp lực từ đối thủ cạnh tranh hạ giá bán, biến động giá giấy decal/mực in nhập khẩu, hoặc yêu cầu khắt khe hơn về tiêu chuẩn chất lượng của các tập đoàn quốc tế.',
        ],
      },
      {
        title: '2. Ma trận TOWS của Heinz Weihrich: 4 Chiến lược Hành động dành cho CEO',
        content:
          'Sau khi xác định S, W, O, T, CEO ghép cặp từng yếu tố bên trong với yếu tố bên ngoài để tạo ra 4 mũi nhọn chiến lược:',
        bulletPoints: [
          'Chiến lược SO (Strengths × Opportunities – Chiến lược Tấn công Maxi-Maxi): Phát huy Điểm mạnh nhất của công ty để chớp lấy Cơ hội lớn nhất trên thị trường. (VD: Dùng lợi thế theo dõi tiến độ realtime trên ERP và tốc độ giao hàng 24h để chinh phục nhóm khách hàng FDI & Logistics lớn cần nhà cung cấp tem nhãn chuẩn xác tuyệt đối).',
          'Chiến lược WO (Weaknesses × Opportunities – Chiến lược Cải tiến Mini-Maxi): Khắc phục ngay Điểm yếu nội tại để không bỏ lỡ Cơ hội thị trường. (VD: Mở dự án PDCA chuẩn hóa quy trình lên khuôn nhanh nhằm đón nhận các đơn hàng đa quy cách từ khối khách hàng mới).',
          'Chiến lược ST (Strengths × Threats – Chiến lược Khác biệt hóa Maxi-Mini): Sử dụng Điểm mạnh vượt trội để vô hiệu hóa Thách thức từ đối thủ cạnh tranh. (VD: Khi đối thủ nhỏ cạnh tranh bằng cách giảm giá và giảm chất lượng giấy, MVĐN dùng chất lượng in sắc nét ổn định + dịch vụ cam kết giao đúng hẹn 98% để giữ vững phân khúc khách hàng trung thành).',
          'Chiến lược WT (Weaknesses × Threats – Chiến lược Phòng thủ Mini-Mini): Kiểm soát chặt Điểm yếu nội bộ để tránh bị tổn thương trước biến động thị trường. (VD: Kiểm soát định mức tồn kho giấy decal và tối ưu hao hụt dưới 1.8% để bảo vệ biên lợi nhuận khi giá nguyên liệu đầu vào biến động).',
        ],
      },
    ],
    comparisonTable: {
      title: 'Bảng đối sánh: Liệt kê SWOT hình thức vs. Quản trị Chiến lược SWOT – TOWS',
      leftHeader: 'Liệt kê SWOT hình thức (Tĩnh)',
      rightHeader: 'Quản trị Chiến lược SWOT – TOWS (Động)',
      rows: [
        {
          criterion: 'Cách thực hiện',
          leftValue: 'Kẻ 4 ô viết vài gạch đầu dòng chung chung rồi cất vào ngăn kéo',
          rightValue: 'Đánh giá mức độ tác động (High/Medium) và ghép cặp thành 4 nhóm hành động SO, WO, ST, WT',
        },
        {
          criterion: 'Tính liên kết thực thi',
          leftValue: 'Hoàn toàn tách rời khỏi công việc hàng ngày của các phòng ban',
          rightValue: 'Mỗi chiến lược TOWS được gắn người phụ trách, hạn chót và chuyển tiếp thẳng sang mục tiêu OKR Quý',
        },
        {
          criterion: 'Tư duy cạnh tranh của CEO',
          leftValue: 'Bị động phản ứng khi đối thủ giảm giá hoặc khi khách hàng phàn nàn',
          rightValue: 'Chủ động định vị lợi thế cạnh tranh khác biệt và chuẩn bị sẵn kịch bản ứng phó rủi ro',
        },
      ],
    },
    standardTemplates: [
      {
        name: 'Mẫu 1: Khung Hoạch định Hành động Chiến lược TOWS từ bảng SWOT',
        usageWhen: 'Dùng khi CEO họp chiến lược Quý/Năm để chuyển hóa phân tích SWOT thành kế hoạch hành động.',
        templateText:
          '1. CHIẾN LƯỢC TẤN CÔNG (SO = Điểm mạnh [S...] + Cơ hội [O...]):\n   → Hành động trọng tâm: [Mô tả quyết sách] | Phụ trách: [Tên] | Hạn: [Ngày]\n2. CHIẾN LƯỢC NÂNG CẤP NỘI LỰC (WO = Khắc phục [W...] để đón [O...]):\n   → Hành động cải tiến PDCA: [Mô tả giải pháp] | Phụ trách: [Tên] | Hạn: [Ngày]\n3. CHIẾN LƯỢC KHÁC BIỆT HÓA (ST = Dùng [S...] hóa giải thách thức [T...]):\n   → Hành động cạnh tranh: [Mô tả giải pháp] | Phụ trách: [Tên] | Hạn: [Ngày]\n4. CHIẾN LƯỢC PHÒNG THỦ TỐI ƯU (WT = Kiểm soát [W...] trước rủi ro [T...]):\n   → Hành động kiểm soát: [Mô tả giải pháp] | Phụ trách: [Tên] | Hạn: [Ngày]',
      },
    ],
    classicReferences: [
      {
        workTitle: 'The TOWS Matrix: A Tool for Situational Analysis (Long Range Planning, 1982)',
        author: 'Heinz Weihrich',
        keyTakeaway: 'Công trình học thuật kinh điển hướng dẫn cách kết hợp 4 yếu tố S-W-O-T thành ma trận hành động chiến lược SO, WO, ST, WT.',
      },
      {
        workTitle: 'Competitive Strategy (Chiến Lược Cạnh Tranh – 1980)',
        author: 'Michael E. Porter (Harvard Business School)',
        keyTakeaway: 'Bổ sung khung phân tích áp lực cạnh tranh ngành để nhận diện chính xác Opportunities và Threats trong bảng SWOT.',
      },
    ],
    pillars: [
      {
        key: 'S',
        label: 'Strengths (Điểm mạnh nội tại)',
        subtitle: 'Năng lực cốt lõi và lợi thế cạnh tranh vượt trội của doanh nghiệp',
        description: 'Những gì doanh nghiệp đang làm tốt hơn đối thủ (công nghệ, tốc độ giao hàng, hệ thống ERP, tay nghề).',
        ceoQuestion: 'Đâu là lý do lớn nhất khiến khách hàng chọn Mã Vạch Đồng Nai thay vì đối thủ?',
        exampleAtMvdn: 'Hệ thống điều hành sản xuất ProTrack ERP realtime, đáp ứng đơn hàng gấp trong 24h, chất lượng in sắc nét ổn định.',
      },
      {
        key: 'W',
        label: 'Weaknesses (Điểm yếu nội tại)',
        subtitle: 'Những hạn chế bên trong cần cải thiện bằng PDCA & đào tạo',
        description: 'Nhìn thẳng vào các khâu còn phụ thuộc cá nhân, hao hụt vật tư hoặc quy trình chưa đồng bộ.',
        ceoQuestion: 'Khâu nào trong chuỗi Báo giá → Thiết kế → In → Bế → Giao hàng đang là nút thắt cổ chai?',
        exampleAtMvdn: 'Thời gian lên khuôn một số dòng tem đặc thù còn lâu; phụ thuộc vào một số thợ chính.',
      },
      {
        key: 'O',
        label: 'Opportunities (Cơ hội thị trường)',
        subtitle: 'Xu hướng bên ngoài giúp doanh nghiệp mở rộng thị phần & doanh thu',
        description: 'Nhu cầu mới của thị trường, sự phát triển của các khu công nghiệp, thương mại điện tử và logistics.',
        ceoQuestion: 'Thị trường đang mở ra cơ hội tăng trưởng lớn nào trong 6-12 tháng tới?',
        exampleAtMvdn: 'Nhu cầu tem nhãn mã vạch truy xuất nguồn gốc và tem vận chuyển tại các KCN Đồng Nai - Bình Dương tăng mạnh.',
      },
      {
        key: 'T',
        label: 'Threats (Thách thức & Rủi ro)',
        subtitle: 'Áp lực cạnh tranh về giá, biến động nguyên vật liệu, yêu cầu khắt khe',
        description: 'Những yếu tố bên ngoài có thể ảnh hưởng đến biên lợi nhuận hoặc thị phần nếu không chủ động ứng phó.',
        ceoQuestion: 'Rủi ro bên ngoài nào cần có kịch bản phòng ngừa ngay từ hôm nay?',
        exampleAtMvdn: 'Đối thủ nhỏ cạnh tranh phá giá ở phân khúc tem thông thường; biến động giá giấy decal nhập khẩu.',
      },
    ],
    goldenRules: [
      'Sau khi lập SWOT, bắt buộc phải chốt ít nhất 2-4 Hành động Chiến lược TOWS (SO, WO, ST, WT).',
      'Chuyển hóa các hành động chiến lược từ SWOT thành các mục tiêu OKR của Quý.',
      'Cập nhật bảng SWOT mỗi Quý một lần dựa trên dữ liệu vận hành và thị trường mới.',
    ],
    commonPitfalls: [
      'Chỉ liệt kê SWOT cho có rồi cất vào ngăn kéo, không biến thành hành động cụ thể.',
      'Nhầm lẫn giữa Điểm mạnh nội tại (S) với Cơ hội bên ngoài (O).',
    ],
    realCaseStudy: {
      context: 'Nhiều đối thủ nhỏ chào giá thấp cho các mặt hàng tem nhãn phổ thông.',
      badApproach: 'Cuốn theo cuộc chiến giảm giá làm giảm biên lợi nhuận.',
      goodApproach:
        'Phân tích SWOT → Chọn chiến lược SO & ST: Tập trung vào phân khúc khách hàng doanh nghiệp cần tiến độ chuẩn xác, truy xuất tiến độ đơn hàng minh bạch qua ERP và chất lượng tem xuất khẩu ổn định.',
      outcome: 'Giữ vững biên lợi nhuận và ký thêm hợp đồng dài hạn với các nhà máy FDI lớn.',
    },
  },
];

export function getFrameworkByCode(code: FrameworkCode): MindsetFrameworkDoc {
  return CEO_MINDSET_FRAMEWORKS.find((f) => f.code === code) || CEO_MINDSET_FRAMEWORKS[0];
}
