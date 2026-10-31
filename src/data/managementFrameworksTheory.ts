export type FrameworkCode =
  | 'SMART'
  | 'PDCA'
  | '3-6-9'
  | 'OKR'
  | 'PREP'
  | 'MASLOW'
  | 'FFC'
  | 'SWOT';

export interface FrameworkCoreItem {
  key: string;
  name: string;
  meaning: string;
  detail: string;
  tip: string;
}

export interface FrameworkTheory {
  code: FrameworkCode;
  shortName: string;
  fullName: string;
  subtitle: string;
  mantra: string;
  essence: string;
  origin: string;
  themeColor: {
    primaryBg: string;
    primaryText: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    lightBg: string;
    accent: string;
  };
  whenToUse: string;
  targetTab: 'execution' | 'strategy' | 'people' | 'meetings';
  targetTabName: string;
  coreComponents: FrameworkCoreItem[];
  ceoStepByStep: Array<{
    step: number;
    title: string;
    action: string;
    deliverable: string;
  }>;
  goldenQuestions: string[];
  commonPitfalls: Array<{
    bad: string;
    fix: string;
    why: string;
  }>;
  realisticExample: {
    context: string;
    badSample: string;
    badReason: string;
    goodSample: string;
    goodBreakdown: string[];
  };
  ceoCheatSheet: Array<{
    category: string;
    takeaway: string;
  }>;
}

export const MANAGEMENT_FRAMEWORKS_THEORY: Record<FrameworkCode, FrameworkTheory> = {
  SMART: {
    code: 'SMART',
    shortName: 'Giao Việc SMART',
    fullName: 'Mục Tiêu & Giao Việc Chuẩn SMART',
    subtitle: 'Biến Ý Định Của CEO Thành Kết Quả Rõ Như Pha Lê',
    mantra: 'Nếu nhân viên làm sai, 80% do lúc giao việc người nhận chưa nhìn thấy cùng một bức tranh với CEO.',
    essence:
      'SMART là tiêu chuẩn vàng biến một ý định mơ hồ thành mục tiêu hành động rành mạch, đo lường được, có người chịu trách nhiệm và có thời hạn cam kết dứt khoát.',
    origin:
      'Khởi xướng bởi George T. Doran (1981) và hoàn thiện trong trường phái Quản trị theo Mục tiêu (MBO) của Peter Drucker.',
    themeColor: {
      primaryBg: 'bg-[#0C1B2E]',
      primaryText: 'text-[#0C1B2E]',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-800',
      border: 'border-slate-300',
      lightBg: 'bg-slate-50',
      accent: 'text-[#C69C47]',
    },
    whenToUse:
      'Mỗi khi CEO giao việc mới, ủy quyền dự án, chốt cam kết sản xuất với Quản đốc xưởng hoặc ký thỏa thuận mục tiêu tháng/quý.',
    targetTab: 'execution',
    targetTabName: 'Điều Hành (SMART Tasks)',
    coreComponents: [
      {
        key: 'S',
        name: 'Specific (Cụ thể)',
        meaning: 'Rõ ràng, không đa nghĩa',
        detail:
          'Chỉ đích danh: Ai làm? Làm sản phẩm/hạng mục gì? Tại chuyền/phòng ban nào? Dùng tài nguyên gì?',
        tip: 'Tránh dùng từ ngữ cảm tính như "làm tốt", "chú ý chất lượng", "đẩy nhanh". Hãy thay bằng mô tả thao tác vật lý hoặc biên bản nghiệm thu.',
      },
      {
        key: 'M',
        name: 'Measurable (Đo lường được)',
        meaning: 'Định lượng bằng số hoặc tiêu chí Có/Không',
        detail:
          'Có số liệu cụ thể: Bao nhiêu sản phẩm? Tỷ lệ hao hụt phế phẩm dưới bao nhiêu %? Chi phí tối đa bao nhiêu? Nghiệm thu qua biên bản nào?',
        tip: 'Quy tắc vàng: Nếu không đo lường được thì không thể quản lý và không thể nghiệm thu công bằng.',
      },
      {
        key: 'A',
        name: 'Achievable (Khả thi & Vừa sức)',
        meaning: 'Thách thức nhưng trong tầm với',
        detail:
          'Nhân sự có đủ năng lực chuyên môn không? CEO đã ủy quyền quyết định và cấp đủ ngân sách/máy móc/vật tư chưa?',
        tip: 'Mục tiêu thách thức kích thích sáng tạo (+10-20%), nhưng mục tiêu bất khả thi (+200% mà không cấp người) sẽ gây triệt tiêu động lực.',
      },
      {
        key: 'R',
        name: 'Relevant (Trọng tâm & Liên quan)',
        meaning: 'Phục vụ trực tiếp mục tiêu cốt lõi',
        detail:
          'Đầu việc này đóng góp gì vào OKR quý, doanh thu hay tỷ lệ giao hàng đúng hẹn của nhà máy? Có đáng tiêu tốn thời gian lúc này không?',
        tip: 'Loại bỏ ngay các việc "bận rộn giả tạo" không đem lại giá trị cho khách hàng hoặc dòng tiền công ty.',
      },
      {
        key: 'T',
        name: 'Time-bound (Thời hạn dứt khoát)',
        meaning: 'Có ngày giờ chốt hạ & nhịp kiểm soát',
        detail:
          'Hoàn thành chính xác trước mấy giờ, ngày nào? Kèm theo các mốc rà soát tiến độ chặn trước (Mốc 1, Mốc 2, Mốc 3).',
        tip: 'Không bao giờ dùng chữ "sớm nhất có thể" (ASAP). Phải ghi rõ: "Trước 16h00 Thứ Sáu 24/11".',
      },
    ],
    ceoStepByStep: [
      {
        step: 1,
        title: 'Xác định Kết quả đầu ra (Outcome)',
        action: 'CEO hình dung bức tranh khi việc đã hoàn thành: Nhân viên đưa cho mình cái gì? Chỉ số nào nhảy số trên ERP?',
        deliverable: 'Bản mô tả kết quả nghiệm thu (không phải mô tả quá trình làm).',
      },
      {
        step: 2,
        title: 'Trao đổi & Yêu cầu nhân viên nhắc lại (Paraphrase)',
        action: 'Sau khi giao, CEO hỏi: "Em hãy nói lại bằng lời của em xem việc này đích đến là gì và hạn chót thế nào?"',
        deliverable: 'Sự đồng thuận 100% về kỳ vọng giữa hai bên.',
      },
      {
        step: 3,
        title: 'Ủy thác quyền hạn & Nguồn lực',
        action: 'Hỏi nhân viên: "Để đạt được mục tiêu này đúng hạn, em cần anh phê duyệt nguồn lực hoặc quyền quyết định gì?"',
        deliverable: 'Cam kết trách nhiệm toàn quyền của nhân sự phụ trách.',
      },
      {
        step: 4,
        title: 'Gài lịch kiểm soát nhịp độ tiến độ',
        action: 'Cài đặt tự động 3 mốc giám sát: Mốc 1 (kiểm tra hiểu đề & thống nhất hướng đi), Mốc 2 (giám sát giữa kỳ & gỡ tắc nghẽn), Mốc 3 (tiền nghiệm thu trước giờ chốt).',
        deliverable: 'Lịch nhắc hẹn tự động trên hệ thống AXIS CEO OS.',
      },
    ],
    goldenQuestions: [
      'Con số hoặc bằng chứng cụ thể nào chứng minh đầu việc này đã hoàn thành đạt chuẩn?',
      'Người nhận việc có đủ thẩm quyền quyết định mà không cần hỏi lại CEO từng bước nhỏ không?',
      'Hạn chót chính xác là ngày giờ nào, và mốc rà soát đầu tiên là khi nào chúng ta nhìn vào bản phác thảo?',
    ],
    commonPitfalls: [
      {
        bad: 'Giao việc miệng, chung chung: "Em xử lý dứt điểm phế phẩm xưởng in giúp anh nhé!"',
        fix: 'Chuyển thành: "Tổ in giảm tỷ lệ phế phẩm từ 3.5% xuống dưới 1.5% trong 10 ca tới, nghiệm thu theo báo cáo KCS ngày 20/11."',
        why: 'Nhân viên sẽ không biết thế nào là "dứt điểm", dẫn đến làm qua loa rồi tự cho là đã xong.',
      },
      {
        bad: 'Giao việc nhưng không cấp quyền quyết định vật tư, nhân viên phải chờ CEO duyệt từng chữ ký.',
        fix: 'Trao hạn mức tự quyết: "Được phép điều phối vật tư thay thế dưới 5 triệu đồng mà không cần xin phép trước."',
        why: 'Tắc nghẽn xảy ra ngay tại bàn làm việc của CEO, biến CEO thành điểm nghẽn của công ty.',
      },
    ],
    realisticExample: {
      context: 'Giao việc cho Trưởng phòng Kỹ thuật sản xuất khắc phục tình trạng chậm giao hàng các Lệnh Sản Xuất (LSX).',
      badSample: 'Phòng Kỹ thuật cố gắng đẩy nhanh tiến độ làm khuôn và bảo trì máy để xưởng in kịp tiến độ giao hàng nhé.',
      badReason: 'Không có số lượng, không có hạn chót, không rõ trách nhiệm cá nhân, không thể nghiệm thu.',
      goodSample:
        'Anh Nam (TP Kỹ thuật) trực tiếp chuẩn hóa quy trình thay khuôn in nhanh cho 4 máy in Heidelberg, rút ngắn thời gian chuyển đổi mã hàng từ 55 phút xuống dưới 25 phút/lần thay. Hoàn thành đào tạo và nghiệm thu thực tế trước 17h00 ngày 28/11/2026. Lịch giám sát tiến độ: Ngày 20/11 (duyệt tài liệu SOP nháp), 24/11 (chạy thử máy số 2), 27/11 (chạy thử toàn xưởng).',
      goodBreakdown: [
        'S: Rút ngắn thời gian thay khuôn in nhanh cho 4 máy Heidelberg.',
        'M: Giảm từ 55 phút xuống dưới 25 phút/lần thay, có bấm giờ thực tế.',
        'A: Đã cho phép tạm dừng máy 2 tiếng ngoài ca để huấn luyện kỹ thuật viên.',
        'R: Trực tiếp tăng công suất thực tế của xưởng in thêm 18% để kịp các đơn hàng Tết.',
        'T: Trước 17h00 ngày 28/11/2026 với 3 mốc giám sát tiến độ rành mạch.',
      ],
    },
    ceoCheatSheet: [
      { category: 'Mẫu câu mở lời giao việc', takeaway: '"Mục tiêu đầu ra của việc này là [Con số X], hạn chót là [Ngày Y], người nghiệm thu là [Anh/Khách hàng]."' },
      { category: 'Kỹ thuật chốt cam kết', takeaway: '"Em thấy thời hạn này có khả thi với nguồn lực hiện tại không? Nếu có vướng mắc gì hãy nói ngay lúc này."' },
    ],
  },

  PDCA: {
    code: 'PDCA',
    shortName: 'Chu Trình PDCA',
    fullName: 'Chu Trình Cải Tiến Liên Tục PDCA (Kaizen)',
    subtitle: 'Chấm Dứt Lỗi Lặp Lại - Chuẩn Hóa Tri Thức Vận Hành Doanh Nghiệp',
    mantra: '85% lỗi lầm trong doanh nghiệp là do hệ thống và quy trình, chỉ 15% là do sơ suất cá nhân.',
    essence:
      'PDCA (Plan - Do - Check - Act) là vòng lặp cải tiến khoa học của Dr. W. Edwards Deming. Phương pháp này giúp CEO chuyển từ phản ứng bị động (chữa cháy sự cố) sang quản trị chủ động (cải tiến hệ thống vĩnh viễn).',
    origin:
      'Phát triển bởi Walter A. Shewhart và phổ biến toàn cầu bởi Dr. W. Edwards Deming trong cuộc phục hưng công nghiệp Nhật Bản.',
    themeColor: {
      primaryBg: 'bg-teal-900',
      primaryText: 'text-teal-900',
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-800',
      border: 'border-teal-300',
      lightBg: 'bg-teal-50/50',
      accent: 'text-teal-600',
    },
    whenToUse:
      'Khi xảy ra lỗi sản xuất lặp lại, phế phẩm tăng cao, khách hàng khiếu nại chất lượng, hoặc một quy trình bị nghẽn làm giảm biên lợi nhuận.',
    targetTab: 'execution',
    targetTabName: 'Điều Hành (Vòng lặp PDCA)',
    coreComponents: [
      {
        key: 'P',
        name: 'Plan (Lập kế hoạch & Tìm nguyên nhân gốc)',
        meaning: 'Định nghĩa đúng vấn đề và đào sâu nguyên nhân căn cốt',
        detail:
          'Không dừng lại ở hiện tượng bề mặt. Áp dụng kỹ thuật 5-Why (Hỏi 5 lần Tại sao) và Biểu đồ xương cá (Ishikawa: Con người, Máy móc, Nguyên liệu, Phương pháp, Môi trường).',
        tip: 'Nếu dành 60 phút để giải quyết một bài toán, hãy dành 50 phút đầu tiên để tìm đúng nguyên nhân gốc rễ.',
      },
      {
        key: 'D',
        name: 'Do (Thực thi thử nghiệm Pilot)',
        meaning: 'Triển khai giải pháp trên quy mô nhỏ có kiểm soát',
        detail:
          'Không áp dụng ồ ạt toàn công ty ngay lập tức. Thử nghiệm trên 1 máy, 1 chuyền hoặc 1 tổ trong vài ngày để quan sát biến số phát sinh.',
        tip: 'Phân công rõ 1 người làm chủ nhiệm thử nghiệm (Owner) và ghi chép nhật ký số liệu hàng ngày.',
      },
      {
        key: 'C',
        name: 'Check (Kiểm tra & Đo lường sai lệch)',
        meaning: 'Đo lường lại chỉ số sau thời gian thử nghiệm',
        detail:
          'So sánh số liệu thực tế trước và sau khi làm: Tỷ lệ lỗi có giảm không? Năng suất có tăng thật không? Có phát sinh tác dụng phụ nào khác không?',
        tip: 'Ấn định ngày kiểm tra dứt khoát (Check Date). CEO cần trực tiếp xem số liệu thực chứng, không nghe báo cáo cảm tính.',
      },
      {
        key: 'A',
        name: 'Act (Chuẩn hóa & Mở rộng quy mô)',
        meaning: 'Đóng gói thành quy chuẩn SOP và đưa vào Đào tạo OJT',
        detail:
          'Nếu giải pháp hiệu quả: Viết thành tài liệu hướng dẫn công việc chuẩn (SOP), cập nhật vào Kho Đào Tạo ProTrack để người sau không tái phạm. Nếu chưa đạt: Quay lại Plan với giả thuyết mới.',
        tip: 'Một cải tiến chỉ được coi là hoàn tất khi đã chuẩn hóa thành văn bản và được đào tạo cho toàn bộ nhân sự liên quan.',
      },
    ],
    ceoStepByStep: [
      {
        step: 1,
        title: 'Chặn đứng thiệt hại trước mắt (Containment)',
        action: 'Cách ly lô hàng lỗi hoặc tạm dừng công đoạn có nguy cơ để không lây lan cho khách hàng.',
        deliverable: 'Biên bản phong tỏa sự cố tạm thời.',
      },
      {
        step: 2,
        title: 'Chủ trì mổ xẻ 5-Why tìm Root Cause',
        action: 'Tập hợp Quản đốc, Kỹ thuật và Công nhân trực tiếp đứng máy. Đặt câu hỏi 5-Why xoay quanh quy trình và công cụ, nghiêm cấm chỉ trích cá nhân.',
        deliverable: 'Bản phân tích nguyên nhân gốc rễ khách quan.',
      },
      {
        step: 3,
        title: 'Phê duyệt giải pháp thử nghiệm & Ấn định Check Date',
        action: 'Chỉ định 1 nhân sự phụ trách làm thử nghiệm trong 3-7 ngày và chốt ngày CEO cùng ban điều hành đo lại kết quả.',
        deliverable: 'Lịch nhắc kiểm tra tự động trên AXIS CEO OS.',
      },
      {
        step: 4,
        title: 'Ký lệnh ban hành Chuẩn Hóa (Standardize)',
        action: 'Duyệt văn bản quy trình cải tiến, bắn lên Kho Tài Liệu Đào Tạo ERP và khen thưởng đội ngũ có sáng kiến.',
        deliverable: 'Quy trình SOP mới được tích hợp vào hệ thống đào tạo nội bộ.',
      },
    ],
    goldenQuestions: [
      'Chúng ta đã hỏi đủ 5 lần Tại sao để chạm tới lỗi quy trình chưa, hay vẫn đang kết luận do "công nhân bất cẩn"?',
      'Ngày nào là ngày chốt (Check Date) để anh và em cùng đứng tại xưởng đo lại số liệu xem giải pháp có hiệu quả?',
      'Bài học này đã được đóng gói thành tài liệu hướng dẫn 1 trang để nhân sự mới đọc vào là hiểu ngay chưa?',
    ],
    commonPitfalls: [
      {
        bad: 'Khi xảy ra lỗi, CEO lập tức phạt tiền nhân viên và yêu cầu "lần sau phải chú ý hơn".',
        fix: 'Tìm xem tại sao máy móc/quy trình lại cho phép nhân viên có cơ hội mắc lỗi (Nguyên lý Poka-Yoke / Chống sai lỗi).',
        why: 'Con người sẽ luôn có lúc mệt mỏi hoặc đãng trí; nếu quy trình không có cơ chế chặn lỗi thì chắc chắn lỗi sẽ lặp lại.',
      },
      {
        bad: 'Làm rất tốt khâu Plan và Do, nhưng bỏ quên khâu Check và Act, dẫn đến vài tuần sau xưởng lại quay về thói quen cũ.',
        fix: 'Bắt buộc cài đặt Check Date và chỉ nghiệm thu chu trình PDCA khi đã đẩy tài liệu chuẩn hóa vào Kho Đào Tạo.',
        why: 'Không có chuẩn hóa thì cải tiến chỉ là ngọn lửa rơm, tắt ngấm sau khi đợt kiểm tra của CEO qua đi.',
      },
    ],
    realisticExample: {
      context: 'Khách hàng VIP phản ánh 3 kiện hàng bao bì carton bị bung mép dán keo khi vận chuyển đường xa.',
      badSample: 'Trừ 500k lương của thợ vận hành máy dán vì làm ẩu và nhắc nhở toàn xưởng làm cẩn thận.',
      badReason: 'Tháng sau thợ khác đứng máy vẫn sẽ bị bung keo vì nhiệt độ keo không được kiểm soát tự động.',
      goodSample:
        'Triển khai chu trình PDCA:\n- Plan (5-Why): Keo bung -> Độ bám dính yếu -> Nhiệt độ nồi nấu keo bị hạ dưới 140°C -> Đồng hồ nhiệt cơ học bị lệch kim 15 độ sau 6 tháng chưa hiệu chuẩn.\n- Do: Lắp cảm biến nhiệt độ kỹ thuật số có còi báo động khi dưới 155°C trên máy dán số 1, chạy thử 5 ngày.\n- Check (Ngày 18/11): Thử kéo giật phá hủy 200 mẫu bao bì ở nhiệt độ cao và độ ẩm 85%, tỷ lệ bám dính đạt 100% không bung.\n- Act: Thay cảm biến đồng loạt cho 3 máy dán còn lại, ban hành SOP kiểm tra nhiệt kế đầu mỗi ca, cập nhật vào tài liệu đào tạo thợ dán keo.',
      goodBreakdown: [
        'P: Tìm ra nguyên nhân vật lý là đồng hồ đo nhiệt cơ bị sai số.',
        'D: Thử nghiệm giải pháp cảm biến điện tử có còi báo động trên 1 máy.',
        'C: Kiểm tra thực nghiệm phá hủy mẫu sau 5 ngày với số liệu 100% đạt.',
        'A: Thay thế toàn xưởng và đưa vào quy trình đào tạo OJT vĩnh viễn.',
      ],
    },
    ceoCheatSheet: [
      { category: 'Tư duy cốt lõi của CEO', takeaway: '"Lỗi của nhân viên là cơ hội để hoàn thiện quy trình của công ty."' },
      { category: 'Tiêu chuẩn nghiệm thu PDCA', takeaway: '"Chỉ đóng chu trình khi đã có SOP bằng văn bản và đã tổ chức đào tạo cho thợ."' },
    ],
  },

  '3-6-9': {
    code: '3-6-9',
    shortName: 'Kỷ Luật Họp 3-6-9',
    fullName: 'Nguyên Tắc & Kỷ Luật Họp 3-6-9',
    subtitle: '3 Công Thức Cốt Lõi • 6 Bước Vận Hành • 9 Nguyên Tắc Bắt Buộc',
    mantra:
      'Họp mà không thực hiện thì không đạt hiệu quả; Phân công nhưng không giám sát thì cũng không đạt hiệu quả; Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Công việc được thực thi đúng kế hoạch.',
    essence:
      'Nguyên tắc Họp 3-6-9 là hệ thống quản trị cuộc họp thực chiến gồm 3 Công thức tạo đòn bẩy thực thi, 6 Bước tổ chức chuẩn mực và 9 Nguyên tắc kỷ luật bắt buộc, xóa bỏ triệt để tình trạng họp lê thê vô bổ, không đầu ra và không ai chịu trách nhiệm.',
    origin:
      'Đúc kết từ thực tiễn lãnh đạo điều hành của các CEO xuất sắc và kỷ luật thực thi tại các doanh nghiệp quản trị tinh gọn hàng đầu.',
    themeColor: {
      primaryBg: 'bg-amber-900',
      primaryText: 'text-amber-900',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      border: 'border-amber-300',
      lightBg: 'bg-amber-50/50',
      accent: 'text-amber-600',
    },
    whenToUse:
      'Áp dụng cho mọi cuộc họp trong doanh nghiệp: Giao ban đầu tuần, điều phối sản xuất, xử lý sự cố khẩn cấp, họp chiến lược và các buổi làm việc liên phòng ban.',
    targetTab: 'meetings',
    targetTabName: 'Họp & PREP (Điều phối họp)',
    coreComponents: [
      // ─── 3 CÔNG THỨC CỐT LÕI ─────────────────────────────────────────────
      {
        key: 'CT-1',
        name: 'Công Thức 1: Họp Phải Thực Hiện',
        meaning: 'Họp mà không thực hiện thì không đạt hiệu quả',
        detail:
          'Mọi cuộc họp nếu kết thúc mà không chuyển hóa thành hành động cụ thể ở nhà xưởng hay văn phòng thì 100% thời gian cuộc họp đã bị lãng phí. Cuộc họp chỉ là công cụ, hành động sau họp mới tạo ra giá trị cho công ty.',
        tip: 'Quy tắc bất di bất dịch: Không bao giờ bế mạc cuộc họp nếu chưa có danh sách việc cần làm cụ thể có người nhận trách nhiệm.',
      },
      {
        key: 'CT-2',
        name: 'Công Thức 2: Phân Công Gắn Giám Sát',
        meaning: 'Phân công nhưng không giám sát thì cũng không đạt hiệu quả',
        detail:
          'Tin tưởng nhưng phải kiểm tra. Giao việc mà buông lỏng theo dõi thì công việc chắc chắn sẽ bị trôi vào quên lãng hoặc làm đối phó. Giám sát không phải là săm soi mà là bảo đảm cam kết đã thống nhất trước tập thể.',
        tip: 'Mỗi khi giao việc trong họp, phải chốt luôn: Ai kiểm tra giám sát và ngày giờ nào báo cáo tiến độ.',
      },
      {
        key: 'CT-3',
        name: 'Công Thức 3: Phương Trình Thực Thi Đỉnh Cao',
        meaning: 'Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Công việc được thực thi đúng kế hoạch',
        detail:
          'Phương trình thành công duy nhất của mọi dự án: Luôn theo sát nhịp độ và liên tục đôn đốc người nhận việc chịu trách nhiệm đến cùng. Thiếu 1 trong 2 vế thì kế hoạch hoàn hảo trên giấy cũng thất bại.',
        tip: 'Tận dụng hệ thống nhắc lịch tự động của AXIS CEO OS để đôn đốc đúng người, đúng việc, đúng hạn.',
      },

      // ─── 6 BƯỚC TỔ CHỨC CUỘC HỌP ─────────────────────────────────────────
      {
        key: 'B-1',
        name: 'Bước 1: Chuẩn bị tài liệu trước',
        meaning: 'Soạn và gửi tài liệu trước tối thiểu 12–24h',
        detail:
          'Người chủ trì hoặc người báo cáo phải gửi trước tài liệu, số liệu báo cáo để mọi thành viên nghiên cứu trước. Tuyệt đối cấm vào phòng họp mới phát tài liệu và đọc từng trang từ đầu.',
        tip: 'Quy tắc "No Document, No Meeting": Cuộc họp nào không có tài liệu gửi trước thì kiên quyết hoãn hoặc hủy họp.',
      },
      {
        key: 'B-2',
        name: 'Bước 2: Xác định rõ chủ đề cuộc họp',
        meaning: 'Tiêu đề rõ ràng, phạm vi giải quyết cụ thể',
        detail:
          'Mỗi cuộc họp phải có chủ đề rõ ràng (ví dụ: "Xử lý lỗi lem mực máy in số 2" hay "Duyệt tiến độ đơn hàng LSX-102"). Tránh họp mơ hồ theo kiểu "Họp xem tình hình chung thế nào".',
        tip: 'Giới hạn tối đa 1-2 chủ đề trọng tâm trong một phiên họp dưới 45 phút.',
      },
      {
        key: 'B-3',
        name: 'Bước 3: Thiết lập quy tắc họp',
        meaning: 'Kỷ luật phòng họp nghiêm ngặt',
        detail:
          'Quy định rõ ràng: Đúng giờ từng phút (đến trễ không được vào), để điện thoại chế độ im lặng, phát biểu đi thẳng vào vấn đề theo cấu trúc PREP, không ngắt lời nhau và cấm đổ lỗi cá nhân.',
        tip: 'Bật đồng hồ đếm ngược (Timer) công khai trên màn hình phòng họp để tạo áp lực thời gian tích cực.',
      },
      {
        key: 'B-4',
        name: 'Bước 4: Sắp xếp quy trình cuộc họp',
        meaning: 'Khung thời lượng & lộ trình nghị sự mạch lạc',
        detail:
          'Phân bổ thời gian: 5 phút đầu nêu mục tiêu và bối cảnh -> 15-20 phút thảo luận giải pháp -> 5-10 phút ra quyết định và chốt phân công SMART.',
        tip: 'Người chủ trì phải kiên quyết cắt ngang các ý kiến lan man để giữ đúng quy trình đã định.',
      },
      {
        key: 'B-5',
        name: 'Bước 5: Theo dõi kết quả cuộc họp',
        meaning: 'Ban hành biên bản và chốt đầu mối trách nhiệm ngay',
        detail:
          'Sau khi kết thúc họp, trong vòng 2 giờ phải có biên bản tóm tắt các quyết định và đầu việc SMART được ban hành gửi tới tất cả người liên quan và đồng bộ lên ERP.',
        tip: 'Biên bản phải ghi đích danh: Ai chịu trách nhiệm, kết quả đầu ra là gì, hạn chót khi nào.',
      },
      {
        key: 'B-6',
        name: 'Bước 6: Kiểm tra tiến độ hoàn thành các nhiệm vụ',
        meaning: 'Đôn đốc giám sát đến khi nghiệm thu dứt điểm',
        detail:
          'Thiết lập các mốc kiểm tra định kỳ. Đầu việc của cuộc họp trước phải là nội dung kiểm điểm đầu tiên trong cuộc họp tiếp theo để không việc nào bị rơi rụng.',
        tip: 'Kiểm tra tiến độ trước hạn chót để kịp thời tháo gỡ điểm nghẽn nếu nhân viên gặp khó khăn.',
      },

      // ─── 9 NGUYÊN TẮC BẮT BUỘC ───────────────────────────────────────────
      {
        key: 'NT-1',
        name: 'Nguyên tắc 1: Xác định rõ mục tiêu cuộc họp',
        meaning: 'Không có mục tiêu rõ ràng thì dứt khoát không tổ chức họp',
        detail:
          'Trước khi phát thông báo triệu tập, người chủ trì phải trả lời được câu hỏi: "Sau cuộc họp này, công ty sẽ đạt được kết quả hoặc quyết định cụ thể nào?"',
        tip: 'Mục tiêu phải đo lường được: Ra được quyết định A, duyệt phương án B, hoặc ký cam kết C.',
      },
      {
        key: 'NT-2',
        name: 'Nguyên tắc 2: Chọn đúng người tham dự',
        meaning: 'Đúng người, đúng việc, đúng thẩm quyền',
        detail:
          'Chỉ mời người có trách nhiệm trực tiếp, người có số liệu thực chứng hoặc người có quyền ra quyết định. Không mời cả phòng ban ngồi nghe cho đủ tụ làm loãng cuộc họp.',
        tip: 'Cuộc họp hiệu quả nhất thường có từ 3 đến tối đa 7 người tham gia.',
      },
      {
        key: 'NT-3',
        name: 'Nguyên tắc 3: Chuẩn bị nội dung, tài liệu và cấu trúc chương trình họp',
        meaning: 'Chương trình nghị sự (Agenda) chi tiết từng phút',
        detail:
          'Tài liệu phải có số liệu thực tế từ ERP, tóm tắt vấn đề trong 1 trang A4 và có sẵn đề xuất giải pháp sơ bộ trước khi bước vào phòng họp.',
        tip: 'Người chủ trì phải duyệt nội dung tài liệu trước khi gửi cho các thành viên.',
      },
      {
        key: 'NT-4',
        name: 'Nguyên tắc 4: Bắt đầu đúng giờ và giới thiệu mục tiêu',
        meaning: 'Bắt đầu chính xác từng giây, nêu đích đến trong 2 phút đầu',
        detail:
          'Không bao giờ chờ đợi người đi trễ. Mở đầu bằng tuyên bố rõ ràng: "Cuộc họp hôm nay diễn ra trong 30 phút nhằm giải quyết dứt điểm vấn đề X".',
        tip: 'Tôn trọng thời gian của những người đến đúng giờ; bắt đầu đúng giờ rèn luyện tính kỷ luật cho toàn công ty.',
      },
      {
        key: 'NT-5',
        name: 'Nguyên tắc 5: Giữ cuộc họp đi đúng trọng tâm',
        meaning: 'Kiểm soát chủ đề, triệt tiêu lan man',
        detail:
          'Khi các cuộc tranh luận bắt đầu chệch hướng sang chuyện bên lề hoặc than phiền hoàn cảnh, người chủ trì phải lập tức kéo về trọng tâm bằng câu hỏi: "Điều này có phục vụ mục tiêu cuộc họp không?"',
        tip: 'Lập "Bãi đỗ xe ý tưởng" (Parking Lot) để ghi nhận các vấn đề phát sinh và giải quyết ở dịp khác.',
      },
      {
        key: 'NT-6',
        name: 'Nguyên tắc 6: Ra quyết định và thống nhất hành động ngay trong cuộc họp',
        meaning: 'Không họp để bàn suông, phải ra quyết định dứt khoát',
        detail:
          'Mỗi vấn đề đưa ra thảo luận đều phải kết thúc bằng một quyết định: Đồng ý, Từ chối, hoặc Thử nghiệm phương án nào. Thống nhất phương án và không bàn lùi sau khi đã chốt.',
        tip: 'Tránh câu nói "Để xem xét sau" nếu không ấn định ngày giờ cụ thể đưa ra quyết định.',
      },
      {
        key: 'NT-7',
        name: 'Nguyên tắc 7: Có biên bản và tổng kết rõ ràng',
        meaning: 'Biên bản là văn bản pháp lý của phòng họp',
        detail:
          'Tóm tắt 3 phần ngắn gọn: Các quyết định đã được thông qua, Danh sách việc cần làm SMART (Ai làm, Hạn chót), và Thời gian kiểm tra tiếp theo.',
        tip: 'Gửi biên bản qua ERP/email/Zalo nhóm trong vòng 2 giờ sau khi kết thúc họp.',
      },
      {
        key: 'NT-8',
        name: 'Nguyên tắc 8: Theo dõi tiến độ và nhắc nhở hành động',
        meaning: 'Liên tục đôn đốc, không để việc bị nguội lạnh',
        detail:
          'Người chủ trì hoặc thư ký cuộc họp có trách nhiệm theo sát các mốc cam kết, bắn thông báo nhắc nhở trước ngày đến hạn để người chịu trách nhiệm không quên nhiệm vụ.',
        tip: 'Dùng tính năng Đẩy thông báo sang ProTrack ERP để tự động đôn đốc nhân sự.',
      },
      {
        key: 'NT-9',
        name: 'Nguyên tắc 9: Đánh giá và cải tiến quy trình họp',
        meaning: 'Kaizen chất lượng cuộc họp định kỳ',
        detail:
          'Định kỳ tự soi xét: Cuộc họp vừa rồi có đạt mục tiêu không? Có ai bị thừa thãi trong phòng họp không? Lần sau cần rút ngắn bao nhiêu phút để hiệu quả hơn?',
        tip: 'Dành 1 phút cuối mỗi cuộc họp để hỏi: "Mọi người thấy cuộc họp hôm nay hiệu quả ở mức mấy điểm trên 10?"',
      },
    ],
    ceoStepByStep: [
      {
        step: 1,
        title: 'Giai đoạn 1: Chuẩn Bị Trước Họp (Bước 1, 2 & Nguyên tắc 1, 2, 3)',
        action:
          'Xác định rõ mục tiêu cần đạt, chỉ mời đúng người có thẩm quyền/trách nhiệm (3-7 người), yêu cầu gửi tài liệu tóm tắt 1 trang trước 24 giờ. Không có tài liệu = Hủy họp.',
        deliverable: 'Thông báo triệu tập kèm Agenda chi tiết từng phút trên ERP.',
      },
      {
        step: 2,
        title: 'Giai đoạn 2: Bắt Đầu & Thiết Lập Kỷ Luật (Bước 3, 4 & Nguyên tắc 4, 5)',
        action:
          'Bắt đầu đúng giờ từng phút (không chờ người trễ). Nêu mục tiêu cuộc họp trong 2 phút đầu, bật đồng hồ đếm ngược và yêu cầu phát biểu theo khung PREP.',
        deliverable: 'Toàn bộ phòng họp tập trung cao độ vào mục tiêu cốt lõi.',
      },
      {
        step: 3,
        title: 'Giai đoạn 3: Thảo Luận & Ra Quyết Định (Nguyên tắc 5, 6)',
        action:
          'Giữ cuộc họp đi đúng trọng tâm, gạt bỏ tranh luận lan man. Ra quyết định dứt khoát và chốt danh sách đầu việc SMART kèm người chịu trách nhiệm cụ thể trước khi giải tán.',
        deliverable: 'Các quyết định rõ ràng và danh mục đầu việc SMART có hạn chót.',
      },
      {
        step: 4,
        title: 'Giai đoạn 4: Sau Họp & Đôn Đốc Giám Sát (Bước 5, 6 & Nguyên tắc 7, 8, 9, Công thức 1-2-3)',
        action:
          'Ban hành biên bản trong vòng 2h. Bám sát tiến độ và liên tục đôn đốc người chịu trách nhiệm (Công thức 3) để đảm bảo công việc thực thi 100% đúng kế hoạch.',
        deliverable: 'Công việc hoàn thành đúng hạn, nghiệm thu dứt điểm.',
      },
    ],
    goldenQuestions: [
      'Cuộc họp này nếu không tổ chức thì công ty có chịu thiệt hại gì không (để quyết định có đáng họp hay không)?',
      'Tất cả mọi người trong phòng này đã nghiên cứu tài liệu trước khi bước vào đây chưa?',
      'Ai là người chịu trách nhiệm chính cho đầu việc này và hạn chót nghiệm thu là ngày giờ nào?',
      'Chúng ta đã thiết lập lịch kiểm tra giám sát cụ thể cho đầu việc này chưa, hay chỉ giao rồi để đó?',
    ],
    commonPitfalls: [
      {
        bad: 'Họp không có tài liệu gửi trước, vào phòng họp mới phát giấy và đọc từng chữ làm mất 30 phút vô ích.',
        fix: 'Áp dụng triệt để Bước 1 và Nguyên tắc 3: Bắt buộc gửi tài liệu trước 24h; ai chưa đọc tài liệu không được phát biểu.',
        why: 'Thời gian họp là để thảo luận giải pháp và ra quyết định, không phải là giờ học đọc văn bản.',
      },
      {
        bad: 'Mời quá đông người "cho đông vui", cả phòng ban ngồi nghe thụ động làm lãng phí hàng chục giờ công lao động.',
        fix: 'Áp dụng Nguyên tắc 2: Chỉ mời đúng người có thẩm quyền quyết định hoặc người trực tiếp thực thi (tối ưu từ 3 đến 7 người).',
        why: 'Càng đông người thì trách nhiệm càng bị phân tán và cuộc họp càng dễ biến thành buổi buôn chuyện.',
      },
      {
        bad: 'Thảo luận rất hăng say nhưng kết thúc họp không có biên bản, không ai chịu trách nhiệm cụ thể, tuần sau họp lại phạm đúng lỗi cũ.',
        fix: 'Áp dụng Công thức 1, Bước 5 và Nguyên tắc 6, 7: Chốt việc SMART có người chịu trách nhiệm và ban hành biên bản trong 2h.',
        why: 'Họp mà không có đầu mối chịu trách nhiệm thì bằng thừa, việc sẽ chìm vào quên lãng.',
      },
      {
        bad: 'Giao việc xong buông tay hoàn toàn, không theo sát tiến độ, đến hạn mới hỏi thì nhân viên báo "vướng chưa làm được".',
        fix: 'Áp dụng Công thức 2 và Công thức 3: Theo sát tiến độ + Đôn đốc người chịu trách nhiệm = Thực thi đúng kế hoạch.',
        why: 'Thiếu đôn đốc giám sát thì kế hoạch đẹp đến mấy cũng đổ vỡ.',
      },
    ],
    realisticExample: {
      context: 'Cuộc họp giao ban xử lý sự cố chậm tiến độ các Lệnh sản xuất (LSX) xưởng in trong mùa cao điểm Tết.',
      badSample:
        'Họp không gửi tài liệu trước, triệu tập 15 người cả xưởng vào ngồi nghe, bắt đầu trễ 15 phút vì chờ Trưởng phòng. Trong họp các bên cãi cọ đổ lỗi cho nhau suốt 90 phút. Kết thúc họp CEO nói: "Các bộ phận cố gắng phối hợp giải quyết nhé". Không có biên bản, không ai chịu trách nhiệm chính. Tuần sau đơn hàng vẫn tiếp tục trễ hạn khách.',
      badReason:
        'Vi phạm toàn bộ nguyên tắc: Không tài liệu, mời sai người, trễ giờ, không trọng tâm, không ra quyết định, không biên bản và không có giám sát đôn đốc.',
      goodSample:
        'Áp dụng chuẩn mực Kỷ Luật Họp 3-6-9:\n- Trước họp (Bước 1, 2 & NT 1, 2, 3): CEO yêu cầu Quản đốc chuẩn bị báo cáo 1 trang về 3 LSX bị nghẽn gửi trước 17h hôm trước. Chỉ mời 4 người: Quản đốc xưởng, TP Kỹ thuật, TP Vật tư, TP Kế hoạch.\n- Mở đầu (Bước 3, 4 & NT 4): Đúng 8h00 bắt đầu, tuyên bố mục tiêu: "Họp trong 25 phút để chốt giải pháp thông tuyến cho 3 LSX". Bật timer 25 phút.\n- Trong họp (NT 5, 6): Áp dụng PREP, thảo luận phương án tăng ca đêm và điều chuyển máy in 2. Ra quyết định dứt khoát lúc 8h18.\n- Chốt việc & Biên bản (Bước 5 & NT 7): Chiếu biên bản lên màn hình: Giao anh Nam (Kỹ thuật) đổi khuôn trước 11h; Giao anh Bình (Vật tư) cấp đủ giấy trước 13h; Giao Quản đốc hoàn thành 3 LSX trước 17h ngày mai.\n- Sau họp (Bước 6, NT 8 & Công thức 3): Bắn thông báo lên ProTrack ERP. Trợ lý CEO đôn đốc mốc 11h và 13h. Kết quả: Toàn bộ 3 LSX hoàn thành xuất sắc trước 17h ngày mai đúng cam kết.',
      goodBreakdown: [
        '3 Công thức: Họp có hành động ngay (CT-1), phân công rõ người (CT-2), theo sát đôn đốc từng mốc (CT-3).',
        '6 Bước: Chuẩn bị tài liệu trước -> Chủ đề rõ -> Quy tắc nghiêm -> Quy trình 25 phút -> Biên bản ngay -> Kiểm tra nghiệm thu.',
        '9 Nguyên tắc: Đúng giờ, đúng người, đúng trọng tâm, ra quyết định dứt khoát và theo dõi đến cùng.',
      ],
    },
    ceoCheatSheet: [
      {
        category: '3 Công thức vàng',
        takeaway:
          '1. Họp mà không thực hiện = Không hiệu quả • 2. Phân công không giám sát = Bằng thừa • 3. Theo sát tiến độ + Đôn đốc trách nhiệm = Đúng kế hoạch.',
      },
      {
        category: '6 Bước vận hành',
        takeaway:
          '1. Tài liệu trước -> 2. Chủ đề rõ -> 3. Quy tắc họp -> 4. Quy trình chuẩn -> 5. Theo dõi kết quả -> 6. Kiểm tra tiến độ.',
      },
      {
        category: '9 Nguyên tắc bắt buộc',
        takeaway:
          'Mục tiêu rõ • Đúng người • Đủ tài liệu • Đúng giờ • Đúng trọng tâm • Quyết định ngay • Biên bản chuẩn • Theo sát đôn đốc • Đánh giá cải tiến.',
      },
    ],
  },

  OKR: {
    code: 'OKR',
    shortName: 'Quản Trị OKR',
    fullName: 'Hệ Thống Quản Trị Mục Tiêu & Kết Quả Then Chốt (OKR)',
    subtitle: 'Hội Tụ Toàn Bộ Nguồn Lực - Truyền Cảm Hứng - Bứt Phá Doanh Nghiệp',
    mantra: 'Nếu tất cả mọi thứ đều là ưu tiên số một, thì thực chất công ty chẳng có ưu tiên nào cả.',
    essence:
      'OKR (Objectives & Key Results) là phương thức quản trị chiến lược giúp CEO hội tụ năng lượng toàn công ty vào 3-5 mục tiêu then chốt nhất trong quý, đo lường bằng kết quả đầu ra rành mạch thay vì đếm đầu việc.',
    origin:
      'Sáng lập bởi Andy Grove tại Intel và được John Doerr phổ biến rực rỡ tại Google, sau đó trở thành vũ khí tăng trưởng của hàng loạt tập đoàn Fortune 500.',
    themeColor: {
      primaryBg: 'bg-indigo-950',
      primaryText: 'text-indigo-950',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-800',
      border: 'border-indigo-300',
      lightBg: 'bg-indigo-50/50',
      accent: 'text-indigo-600',
    },
    whenToUse:
      'Đầu mỗi Quý hoặc Tháng khi hoạch định chiến lược công ty, cần gắn kết các phòng ban (Sản xuất, Bán hàng, Tài chính, Nhân sự) vào cùng một hướng đi lớn.',
    targetTab: 'strategy',
    targetTabName: 'Chiến Lược (Quản lý OKR)',
    coreComponents: [
      {
        key: 'O',
        name: 'Objective (Mục tiêu truyền cảm hứng)',
        meaning: 'Đích đến định tính: Chúng ta muốn đạt được điều gì vĩ đại?',
        detail:
          'Ngắn gọn, giàu tính truyền cảm hứng, thúc đẩy toàn thể cán bộ công nhân viên hành động. Trả lời câu hỏi: "Tại sao điều này lại sống còn với công ty trong quý này?"',
        tip: 'Một quý chỉ nên có tối đa 3 Objectives cho toàn công ty. Mục tiêu hay phải khiến mọi người hào hứng khi nhắc đến.',
      },
      {
        key: 'KR',
        name: 'Key Results (Các kết quả then chốt)',
        meaning: 'Thước đo định lượng: Làm sao biết chắc chắn ta đã đến đích?',
        detail:
          '3-4 chỉ số đo lường số liệu cụ thể. Phải là Kết quả đầu ra (Outcome) chứ tuyệt đối không phải là Hành động/Đầu việc (Task). Có số bắt đầu, số mục tiêu và mốc thời gian.',
        tip: 'Công thức vàng: Đạt được [Chỉ số X] từ [Giá trị A] lên [Giá trị B] trước [Ngày Y].',
      },
      {
        key: 'CFR',
        name: 'Văn Hóa CFR (Conversation - Feedback - Recognition)',
        meaning: 'Nhịp thở đồng hành giúp OKR sống động hàng tuần',
        detail:
          'OKR không tự chạy nếu không có nhịp trao đổi 1-1 hàng tuần giữa CEO và các Quản lý (Conversations), phản hồi đa chiều (Feedback) và ghi nhận kịp thời (Recognition).',
        tip: 'Tránh dùng OKR làm công cụ trừ lương/thưởng trực tiếp, nếu không nhân viên sẽ cố tình hạ thấp mục tiêu để đạt điểm an toàn.',
      },
    ],
    ceoStepByStep: [
      {
        step: 1,
        title: 'Chốt 3 Ưu Tiên Sống Còn của Quý (Top 3 Objectives)',
        action: 'CEO ngồi lại với ban điều hành, trả lời: "Nếu quý này chỉ được hoàn thành xuất sắc 1 điều duy nhất, đâu là điều quyết định sự bứt phá?"',
        deliverable: 'Bộ 3 Objective cấp công ty rõ ràng.',
      },
      {
        step: 2,
        title: 'Xây dựng 3-4 Key Results định lượng cho mỗi O',
        action: 'Gắn các chỉ số số liệu thực tế (kết nối trực tiếp với radar dữ liệu ERP: Tỷ lệ đúng hạn, Doanh thu, Tỷ lệ hao hụt phế phẩm, Số giờ đào tạo).',
        deliverable: 'Bảng theo dõi OKR thời gian thực trên AXIS CEO OS.',
      },
      {
        step: 3,
        title: 'Phân tầng OKR xuống các phòng ban (Cascading & Alignment)',
        action: 'Quản đốc xưởng, Trưởng phòng Kinh doanh tự viết OKR bộ phận của mình để đóng góp trực tiếp vào KR của công ty.',
        deliverable: 'Toàn bộ guồng máy công ty cùng nhìn về 1 hướng.',
      },
      {
        step: 4,
        title: 'Họp rà soát nhịp độ hàng tuần (Weekly Check-in)',
        action: 'Mỗi sáng Thứ Hai dành 30 phút rà soát mức độ tự tin (Confidence Level 1-10) và cập nhật tiến độ KR, không bàn chi tiết vụn vặt.',
        deliverable: 'Chủ động điều chỉnh nguồn lực trước khi quý kết thúc.',
      },
    ],
    goldenQuestions: [
      'Nếu Quý này chỉ được chọn 1 mục tiêu duy nhất làm thay đổi vận mệnh công ty, đó là mục tiêu nào?',
      'Chỉ số KR này là Kết quả đầu ra (Outcome) chứng minh ta thắng lợi, hay mới chỉ là việc nhân viên phải đi làm (Task)?',
      'Mức độ tự tin đạt được KR này hiện tại là bao nhiêu trên thang điểm 10? Điều gì đang cản trở?',
    ],
    commonPitfalls: [
      {
        bad: 'Viết Key Result dạng danh sách đầu việc: "KR1: Đi gặp 20 khách hàng", "KR2: Viết xong 3 bài quảng cáo".',
        fix: 'Chuyển thành kết quả đo lường được: "KR1: Đạt doanh số ký mới 3.5 tỷ đồng", "KR2: Thu hút 150 khách hàng doanh nghiệp tiềm năng".',
        why: 'Nhân viên có thể gặp đủ 20 khách nhưng không mang về đồng doanh số nào; OKR chỉ đo lường giá trị thực tế tạo ra.',
      },
      {
        bad: 'Đặt quá nhiều OKR (7-10 mục tiêu), phòng ban nào cũng đòi đưa mục tiêu của mình vào OKR công ty.',
        fix: 'Quy tắc "Ít hơn là nhiều hơn" (Less is more). Tối đa 3 Objectives cho một chu kỳ quý.',
        why: 'Quá nhiều mục tiêu sẽ làm phân tán nguồn lực và không ai biết điều gì là quan trọng nhất khi xảy ra xung đột thời gian.',
      },
    ],
    realisticExample: {
      context: 'Hoạch định chiến lược Quý 4 cho công ty sản xuất bao bì và in ấn ProCEO.',
      badSample: 'Mục tiêu: Đẩy mạnh kinh doanh và nâng cao chất lượng sản xuất để đạt lợi nhuận cao.',
      badReason: 'Chung chung, không truyền cảm hứng, không có số liệu đo lường cụ thể.',
      goodSample:
        'Objective: Trở thành đối tác in ấn bao bì xuất khẩu uy tín số 1 khu vực miền Bắc trong mùa cao điểm Tết.\n- KR 1 (Sản xuất): Tỷ lệ Lệnh sản xuất (LSX) hoàn thành giao đúng hẹn tăng từ 81% lên 96% (Theo dõi tự động từ ERP).\n- KR 2 (Chất lượng): Tỷ lệ phế phẩm hỏng in toàn xưởng giảm từ 2.8% xuống dưới 1.2%.\n- KR 3 (Doanh thu): Doanh số đơn hàng bao bì cao cấp đạt 18 tỷ đồng (trong đó khách hàng FDI chiếm tối thiểu 40%).\n- KR 4 (Vận hành): 100% cán bộ kỹ thuật và thợ máy hoàn thành bài kiểm tra quy trình chuẩn OJT trên hệ thống.',
      goodBreakdown: [
        'Objective: Truyền cảm hứng, rõ định vị thương hiệu và thị trường mục tiêu.',
        'KR 1: Chỉ số hiệu suất vận hành đo bằng số liệu ERP tự động.',
        'KR 2: Chỉ số chất lượng bảo vệ biên lợi nhuận.',
        'KR 3: Chỉ số thương mại thúc đẩy dòng tiền.',
        'KR 4: Chỉ số nội tại củng cố năng lực con người lâu dài.',
      ],
    },
    ceoCheatSheet: [
      { category: 'Phân loại mục tiêu', takeaway: '"Mục tiêu cam kết (Roofshot) phải đạt 100% - Mục tiêu tham vọng (Moonshot) đạt 70% đã là thắng lớn."' },
      { category: 'Thước đo KR chuẩn', takeaway: '"Mỗi KR đều phải trả lời được câu hỏi: Số liệu này lấy từ đâu ra và ai là người đối soát?"' },
    ],
  },

  PREP: {
    code: 'PREP',
    shortName: 'Diễn Đạt PREP',
    fullName: 'Công Thức Diễn Đạt Quyền Lực & Sắc Bén PREP',
    subtitle: 'Nói Đúng Trọng Tâm - Thuyết Phục Tức Thì - Tiết Kiệm Thời Gian Điều Hành',
    mantra: 'Nếu bạn không thể diễn đạt ý tưởng của mình trong 60 giây đầu tiên, người nghe sẽ ngừng chú ý.',
    essence:
      'PREP (Point - Reason - Example - Point) là mô hình giao tiếp 4 bước kinh điển giúp CEO và đội ngũ quản lý trình bày mọi vấn đề gãy gọn, logic, thuyết phục và đi thẳng vào bản chất mà không vòng vo.',
    origin:
      'Bắt nguồn từ nghệ thuật hùng biện cổ điển và được chuẩn hóa trong đào tạo kỹ năng lãnh đạo điều hành tại các trường kinh doanh hàng đầu thế giới.',
    themeColor: {
      primaryBg: 'bg-emerald-950',
      primaryText: 'text-emerald-950',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      border: 'border-emerald-300',
      lightBg: 'bg-emerald-50/50',
      accent: 'text-emerald-600',
    },
    whenToUse:
      'Khi CEO phát biểu chỉ đạo trong các cuộc họp điều hành, ban hành thông báo/chỉ thị toàn công ty, trả lời phê duyệt đề xuất chi tiêu, hoặc yêu cầu nhân viên báo cáo nhanh.',
    targetTab: 'meetings',
    targetTabName: 'Họp & Tư Duy (Soạn thảo PREP)',
    coreComponents: [
      {
        key: 'P1',
        name: 'Point 1 (Điểm cốt lõi / Kết luận ngay)',
        meaning: 'Nêu ngay thông điệp chính hoặc quyết định trong câu đầu tiên',
        detail:
          'Không mở bài dài dòng bằng hoàn cảnh lịch sử. Đưa ngay kết luận: "Tôi đồng ý/không đồng ý...", "Mục tiêu tuần này của chúng ta là...", "Chúng ta cần dừng ngay việc..."',
        tip: 'Quy tắc 10 giây đầu: Giúp người nghe lập tức nắm được định hướng của cuộc trò chuyện.',
      },
      {
        key: 'R',
        name: 'Reason (Lý do cốt lõi / Căn cứ logic)',
        meaning: 'Giải thích TẠI SAO lại đưa ra quyết định đó',
        detail:
          'Nêu 1-2 lý do then chốt, mang tính chiến lược hoặc logic nhân quả. Tránh đưa ra quá nhiều lý do vụn vặt làm loãng thông điệp.',
        tip: 'Dùng từ nối: "Lý do là vì...", "Căn cứ cốt lõi ở đây là..."',
      },
      {
        key: 'E',
        name: 'Example / Evidence (Dẫn chứng / Số liệu thực tế)',
        meaning: 'Chứng minh bằng dữ liệu người thật việc thật từ thực tế',
        detail:
          'Đưa ra bằng chứng không thể chối cãi: Số liệu sản xuất từ ERP, doanh số, hình ảnh phế phẩm thực tế tại xưởng, hoặc câu chuyện phản hồi của khách hàng.',
        tip: 'Dữ liệu cụ thể sẽ xóa tan mọi hoài nghi và tranh cãi cảm tính.',
      },
      {
        key: 'P2',
        name: 'Point 2 (Khẳng định lại & Lệnh hành động)',
        meaning: 'Tái khẳng định thông điệp và đưa ra Call To Action',
        detail:
          'Nhắc lại kết luận và ấn định hành động tiếp theo: Ai phải làm gì, trước mấy giờ, gửi kết quả cho ai.',
        tip: 'Kết thúc bằng một lời kêu gọi hành động dứt khoát, tràn đầy năng lượng.',
      },
    ],
    ceoStepByStep: [
      {
        step: 1,
        title: 'Chắt lọc thông điệp 1 câu duy nhất',
        action: 'Trước khi mở lời hoặc gõ văn bản, tự hỏi: "Nếu người nghe chỉ được nhớ 1 câu duy nhất sau cuộc nói chuyện này, câu đó là gì?"',
        deliverable: 'Câu Point 1 sắc bén.',
      },
      {
        step: 2,
        title: 'Tìm 1 căn cứ logic vững chắc (Reason)',
        action: 'Xác định nguyên nhân gốc rễ hoặc lợi ích tối cao của quyết định đối với sự tồn vong/phát triển của công ty.',
        deliverable: 'Căn cứ logic mạch lạc.',
      },
      {
        step: 3,
        title: 'Chọn 1 con số hoặc dẫn chứng từ xưởng (Example)',
        action: 'Lấy số liệu từ Radar ERP hoặc hình ảnh thực chứng để minh họa cho lý do.',
        deliverable: 'Bằng chứng thực tế thuyết phục.',
      },
      {
        step: 4,
        title: 'Chốt lệnh hành động (Call To Action - Point 2)',
        action: 'Khẳng định lại quyết định và chỉ định nhân sự triển khai ngay kèm hạn chót cụ thể.',
        deliverable: 'Văn bản chỉ đạo hoặc bài phát biểu hoàn chỉnh chuẩn PREP.',
      },
    ],
    goldenQuestions: [
      'Câu đầu tiên của văn bản/lời nói này đã đi thẳng vào kết luận chưa hay còn vòng vo trình bày bối cảnh?',
      'Bằng chứng số liệu hoặc ví dụ thực tế nào đủ sức nặng để bảo vệ cho lý do này?',
      'Sau khi nghe xong, cấp dưới biết chính xác họ phải làm gì tiếp theo vào ngày mai chưa?',
    ],
    commonPitfalls: [
      {
        bad: 'Nói theo kiểu "kể chuyện trinh thám": Trình bày khó khăn từ 3 tháng trước, kể lể lòng vòng 20 phút rồi mới chốt lại yêu cầu ở câu cuối cùng.',
        fix: 'Đảo ngược thứ tự: Đưa ngay kết luận lên đầu (P1), sau đó mới trình bày lý do (R) và dẫn chứng (E).',
        why: 'Trong điều hành, người nghe không có kiên nhẫn nghe kể chuyện; nếu không biết kết luận trước, họ sẽ nghe trong tâm thế hoang mang.',
      },
      {
        bad: 'Nêu kết luận và lý do rất hay nhưng không có ví dụ/số liệu chứng minh (thiếu bước Example).',
        fix: 'Luôn kèm theo ít nhất 1 con số cụ thể từ hệ thống ERP hoặc thực tế xưởng sản xuất.',
        why: 'Lời nói thiếu số liệu chỉ là ý kiến chủ quan, dễ gây tranh cãi và không thuyết phục được người có chuyên môn.',
      },
    ],
    realisticExample: {
      context: 'CEO từ chối đề xuất xin mua thêm máy in mới trị giá 2.5 tỷ của phòng Kỹ thuật khi năng suất máy cũ chưa tối ưu.',
      badSample: 'Anh thấy dạo này xưởng làm ăn chưa hiệu quả lắm, kinh tế đang khó khăn mà các em cứ suốt ngày xin mua máy. Để anh xem xét lại sau nhé.',
      badReason: 'Mơ hồ, né tránh, làm cấp dưới ấm ức và không hiểu tại sao bị từ chối.',
      goodSample:
        'Soạn chỉ đạo theo chuẩn PREP:\n- [P - Point]: "Anh quyết định CHƯA PHÊ DUYỆT đề xuất đầu tư thêm máy in 2.5 tỷ trong quý này."\n- [R - Reason]: "Bởi vì hiệu suất vận hành thực tế (OEE) của 3 máy in hiện hữu mới chỉ đạt 62%, công ty chưa khai thác hết công suất tài sản sẵn có."\n- [E - Example]: "Theo số liệu Radar ERP 30 ngày qua, thời gian máy dừng do chờ bảo trì và đổi mã hàng lên tới 4.2 giờ mỗi ca làm việc, gây lãng phí gần 140 triệu đồng chi phí khấu hao."\n- [P - Point]: "Vì vậy, anh yêu cầu phòng Kỹ thuật phối hợp Quản đốc xưởng chạy ngay chu trình PDCA để tối ưu quy trình thay khuôn, nâng OEE lên 80% trước ngày 15/12. Khi đó chúng ta mới xem xét lại việc mua máy mới."',
      goodBreakdown: [
        'P: Quyết định từ chối rõ ràng ngay câu đầu tiên.',
        'R: Lý do chiến lược là hiệu suất OEE máy cũ chưa tối ưu.',
        'E: Bằng chứng số liệu cụ thể: OEE 62%, dừng 4.2h/ca, thiệt hại 140 triệu từ ERP.',
        'P: Tái khẳng định và giao việc cụ thể với hạn chót 15/12.',
      ],
    },
    ceoCheatSheet: [
      { category: 'Cấu trúc câu vàng', takeaway: '"Tôi quyết định [Point] vì [Reason]. Thực tế cho thấy [Example]. Do đó, chúng ta sẽ [Point 2]."' },
      { category: 'Quy tắc họp nhanh', takeaway: '"Yêu cầu mọi quản lý báo cáo vấn đề theo đúng 4 bước PREP trong tối đa 90 giây."' },
    ],
  },

  MASLOW: {
    code: 'MASLOW',
    shortName: 'Tháp Maslow Nhân Sự',
    fullName: 'Ứng Dụng Tháp Maslow Trong Bắt Mạch & Vực Dậy Động Lực Nhân Viên',
    subtitle: 'Bắt Đúng Bệnh Động Lực - Giữ Chân Hiền Tài - Khai Phóng Tiềm Năng Tối Đa',
    mantra: 'Khi nhân viên mất động lực, đừng vội vung tiền tăng lương; hãy tìm xem họ đang bị tắc nghẽn ở tầng nhu cầu nào.',
    essence:
      'Tháp Nhu cầu Maslow 5 tầng giúp CEO thấu hiểu tâm lý hành vi nhân sự: Con người chỉ có thể cống hiến hết mình (Tầng 4-5) khi các nhu cầu nền tảng về sinh kế, an toàn và gắn kết (Tầng 1-2-3) đã được bảo đảm vững chắc.',
    origin:
      'Nghiên cứu kinh điển của nhà tâm lý học Abraham Maslow (1943), được ứng dụng sâu rộng trong quản trị nhân sự và nghệ thuật lãnh đạo truyền cảm hứng.',
    themeColor: {
      primaryBg: 'bg-rose-950',
      primaryText: 'text-rose-950',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-800',
      border: 'border-rose-300',
      lightBg: 'bg-rose-50/50',
      accent: 'text-rose-600',
    },
    whenToUse:
      'Khi một nhân sự chủ chốt bỗng dưng sa sút hiệu suất, nhân viên trầm lắng trong họp, tinh thần toàn xưởng uể oải, hoặc khi muốn giữ chân người tài trước nguy cơ bị đối thủ lôi kéo.',
    targetTab: 'people',
    targetTabName: 'Nhân Tâm (Bắt mạch Maslow)',
    coreComponents: [
      {
        key: 'T1',
        name: 'Tầng 1: Sinh Lý & Thu Nhập (Physiological)',
        meaning: 'Cơm áo gạo tiền & Điều kiện làm việc cơ bản',
        detail:
          'Lương chi trả đúng hạn, thưởng minh bạch, cơm ca vệ sinh đầy đủ, nước uống sạch, điều kiện thông gió làm mát nhà xưởng trong mùa nóng.',
        tip: 'Nếu nhân viên đang phải vay mượn lo tiền đóng học cho con hay phòng trọ dột nát, họ không thể tập trung tư duy sáng tạo hay cống hiến cho công ty.',
      },
      {
        key: 'T2',
        name: 'Tầng 2: An Toàn & Ổn Định (Safety)',
        meaning: 'Bảo hộ lao động & Sự an tâm về tương lai công việc',
        detail:
          'Hợp đồng lao động, bảo hiểm xã hội, thiết bị che chắn an toàn máy móc, quy trình rõ ràng, công việc ổn định không lo sợ bị phạt oan hay sa thải đột ngột.',
        tip: 'Khi lãnh đạo quản lý bằng nỗi sợ hãi hoặc quy chế mập mờ, nhân viên sẽ chuyển sang chế độ phòng thủ và giấu giếm lỗi lầm.',
      },
      {
        key: 'T3',
        name: 'Tầng 3: Hòa Nhập & Thuộc Về (Belonging)',
        meaning: 'Tình thân đồng đội & Sự chấp nhận của tập thể',
        detail:
          'Môi trường làm việc không bè phái, không bị cô lập trong ca kíp, được Quản đốc và đồng nghiệp tôn trọng lắng nghe, có các hoạt động giao lưu gắn kết.',
        tip: 'Nhiều nhân sự giỏi nghỉ việc không phải vì lương thấp mà vì "không ngửi được" văn hóa toxic hoặc bị cô lập trong phòng ban.',
      },
      {
        key: 'T4',
        name: 'Tầng 4: Tôn Trọng & Ghi Nhận (Esteem)',
        meaning: 'Được công nhận đóng góp & Có vị thế chuyên môn',
        detail:
          'Được CEO và cấp quản lý khen ngợi kịp thời (Mô hình FFC), có tiếng nói trong các quyết định kỹ thuật, chức danh xứng đáng, được vinh danh trước tập thể.',
        tip: 'Lời khen chân thành và kịp thời của CEO trước toàn thể công ty có sức mạnh kích hoạt động lực lớn hơn cả một khoản thưởng tiền mặt.',
      },
      {
        key: 'T5',
        name: 'Tầng 5: Tự Khẳng Định & Khai Phóng (Self-Actualization)',
        meaning: 'Trao quyền tự chủ & Hiện thực hóa ước mơ phát triển',
        detail:
          'Được giao bài toán khó để chinh phục, được quyền tự chủ cách làm (Autonomy), được cử đi học nâng cao, làm Mentor dẫn dắt đàn em, tạo ra giá trị để lại cho đời.',
        tip: 'Với nhân sự cấp cao và chuyên gia đầu ngành, đây là tầng duy nhất giữ chân họ gắn bó dài lâu với doanh nghiệp.',
      },
    ],
    ceoStepByStep: [
      {
        step: 1,
        title: 'Quan sát triệu chứng lâm sàng',
        action: 'Nhận diện dấu hiệu: Nhân viên hay đi muộn, từ chối việc mới, ít phát biểu, xin nghỉ phép nhiều bất thường (kiểm tra hồ sơ ERP 360).',
        deliverable: 'Bản ghi nhận triệu chứng khách quan.',
      },
      {
        step: 2,
        title: 'Chấm điểm 5 tầng nhu cầu trên hệ thống AXIS',
        action: 'Chấm điểm từ 1 (Thiếu hụt nghiêm trọng) đến 5 (Đáp ứng tốt) cho từng tầng nhu cầu của nhân sự.',
        deliverable: 'Xác định chính xác Tầng nghẽn nút thắt (Bottleneck Tier).',
      },
      {
        step: 3,
        title: 'Kê đơn hành động trúng huyệt tâm lý',
        action: 'Thiết kế hành động tương ứng: Nếu nghẽn Tầng 3 (Hòa nhập) -> Đổi ca hoặc hòa giải mâu thuẫn; Nếu nghẽn Tầng 4 (Ghi nhận) -> Áp dụng ngay lời khen FFC; Nếu nghẽn Tầng 5 -> Trao quyền dự án mới.',
        deliverable: 'Kế hoạch hành động cá nhân hóa của CEO.',
      },
      {
        step: 4,
        title: 'Gặp gỡ 1-1 kín đáo & Cài lịch theo dõi',
        action: 'CEO mời uống cà phê hoặc gặp riêng 20 phút. Lắng nghe chân thành 80%, nói 20%. Đặt lịch theo dõi lại sau 14 ngày.',
        deliverable: 'Khôi phục tinh thần chiến đấu và lòng trung thành.',
      },
    ],
    goldenQuestions: [
      'Nhân viên này đang lo lắng về cơm áo/an toàn (Tầng 1-2) hay đang cảm thấy làm nhiều mà không ai trân trọng ghi nhận (Tầng 4)?',
      'Họ có đang có xích mích với Quản đốc hoặc bị cô lập trong ca kíp của mình không (Tầng 3)?',
      'Với nhân sự kỳ cựu này, mình đã trao cho họ thử thách mới đủ tầm để họ thấy bản thân đang tiến bộ vượt bậc chưa (Tầng 5)?',
    ],
    commonPitfalls: [
      {
        bad: 'Thấy nhân viên giỏi nộp đơn xin nghỉ, CEO lập tức đề nghị tăng lương thêm 3 triệu đồng.',
        fix: 'Tìm hiểu nguyên nhân gốc rễ. Nếu họ nghỉ vì mâu thuẫn với Trưởng phòng (Tầng 3) hoặc cảm thấy bị coi thường (Tầng 4), tăng lương chỉ giữ chân họ được thêm 1-2 tháng rồi họ vẫn đi.',
        why: 'Tiền không thể chữa lành được sự tổn thương về mặt cảm xúc và danh dự nghề nghiệp.',
      },
      {
        bad: 'Đòi hỏi công nhân nhà xưởng phải có "tinh thần làm chủ, cống hiến hết mình vì sứ mệnh công ty" (Tầng 5) trong khi quạt xưởng hỏng, nước uống bẩn và lương thường xuyên bị trễ hẹn (Tầng 1-2).',
        fix: 'Chăm lo thật tốt tầng đáy trước: Lương thưởng đúng ngày, cơm ca ngon sạch, bảo hộ đầy đủ. Tự khắc nhân viên sẽ có động lực cống hiến.',
        why: 'Tâm lý học khẳng định không ai có thể bay lên đỉnh tháp khi cái chân tháp đang lung lay sắp sập.',
      },
    ],
    realisticExample: {
      context: 'Anh Tuấn - Thợ in bậc 6 giỏi nhất xưởng, 5 năm gắn bó, dạo gần đây hay cáu gắt, từ chối nhận ca gấp và có tin đồn sắp nhảy việc sang đối thủ.',
      badSample: 'CEO gọi lên phòng mắng: "Dạo này em làm sao thế? Thái độ thế là không được đâu nhé, công ty trả lương cao nhất xưởng mà lại vô trách nhiệm à?"',
      badReason: 'Đẩy nhân viên vào thế phòng thủ, xúc phạm lòng tự trọng (Tầng 4) và khiến họ quyết định dứt áo ra đi ngay.',
      goodSample:
        'CEO dùng thang đo Maslow trên AXIS:\n- Tầng 1 (Sinh lý): Lương 18tr/tháng -> 5/5 điểm (tốt).\n- Tầng 2 (An toàn): Hợp đồng đầy đủ -> 5/5 điểm (tốt).\n- Tầng 3 (Gắn kết): Bình thường -> 4/5 điểm.\n- Tầng 4 (Ghi nhận): Thấp -> 2/5 điểm (Anh Tuấn vừa cải tiến bộ gạt mực giúp xưởng tiết kiệm 40 triệu nhưng Quản đốc xưởng quên báo cáo, không ai khen ngợi).\n- Tầng 5 (Phát triển): Thấp -> 2/5 điểm (5 năm làm một vị trí lặp đi lặp lại, cảm thấy nhàm chán).\nKê đơn điều trị của CEO:\n1. Họp giao ban đầu tuần, CEO dùng công thức FFC khen ngợi đích danh anh Tuấn về sáng kiến bộ gạt mực trước toàn xưởng, trao thưởng nóng 5 triệu đồng (Chữa Tầng 4).\n2. Bổ nhiệm anh Tuấn làm "Chuyên gia Kỹ thuật kiêm Giảng viên nội bộ", giao kèm cặp 3 thợ in trẻ và cho phép chủ động thử nghiệm các dòng mực mới (Kích hoạt Tầng 5). Kết quả: Anh Tuấn hăng hái trở lại và từ chối lời mời của đối thủ.',
      goodBreakdown: [
        'Bắt đúng bệnh: Thiếu ghi nhận (Tầng 4) và thiếu không gian phát triển (Tầng 5).',
        'Kê đơn chính xác: Vinh danh FFC công khai và nâng tầm vị thế làm Giảng viên Mentor.',
        'Chi phí thấp, hiệu quả chuyển hóa lòng trung thành cực kỳ bền vững.',
      ],
    },
    ceoCheatSheet: [
      { category: 'Quy tắc vàng trị liệu', takeaway: '"Tầng 1-2 là Điều Kiện Cần để nhân viên không nghỉ việc. Tầng 3-4-5 là Điều Kiện Đủ để nhân viên cống hiến vượt bậc."' },
      { category: 'Hành động tức thì khi sa sút', takeaway: '"Luôn bắt đầu buổi nói chuyện bằng câu hỏi mở về cuộc sống gia đình trước khi nói về công việc."' },
    ],
  },

  FFC: {
    code: 'FFC',
    shortName: 'Nguyên Tắc FFC',
    fullName: 'Nghệ Thuật Khen Ngợi & Ghi Nhận FFC (Feeling - Fact - Compare)',
    subtitle: 'Khen Trúng Huyệt Tâm Lý - Tạo Động Lực Bùng Nổ Với Chi Phí 0 Đồng',
    mantra: 'Một lời khen chung chung là một lời khen vô giá trị; một lời khen chuẩn FFC có thể thay đổi sự nghiệp của một con người.',
    essence:
      'Mô hình FFC (Feeling - Fact - Compare) là công thức khen ngợi đỉnh cao dành cho CEO: Kết hợp cảm xúc chân thành của người đứng đầu (Feeling), sự thật hành vi cụ thể (Fact) và sự tiến bộ vượt bậc hoặc tác động lan tỏa (Compare).',
    origin:
      'Nghiên cứu về tâm lý học hành vi tổ chức và nghệ thuật lãnh đạo gây ảnh hưởng tích cực của các chuyên gia quản trị hàng đầu.',
    themeColor: {
      primaryBg: 'bg-amber-950',
      primaryText: 'text-amber-950',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-900',
      border: 'border-[#C69C47]',
      lightBg: 'bg-amber-50/40',
      accent: 'text-[#C69C47]',
    },
    whenToUse:
      'Ngay khi phát hiện một nhân sự có hành vi đẹp, nỗ lực vượt khó, sáng kiến cải tiến nhỏ, hoàn thành đơn hàng khó đúng hẹn, hoặc trong các buổi họp sơ kết tuần/tháng.',
    targetTab: 'people',
    targetTabName: 'Nhân Tâm (Khen ngợi FFC)',
    coreComponents: [
      {
        key: 'F1',
        name: 'Feeling (Cảm xúc chân thật của CEO)',
        meaning: 'Bộc lộ sự tự hào, cảm kích, xúc động hoặc an tâm chân thành',
        detail:
          'Không dùng giọng điệu quan liêu, xa cách. Nói bằng trái tim của người anh, người thuyền trưởng: "Anh thực sự tự hào...", "Tôi vô cùng cảm kích và nhẹ cả lòng...", "Anh rất ấn tượng về tinh thần trách nhiệm của em..."',
        tip: 'Cảm xúc chân thành sẽ đánh thức sự gắn kết sâu sắc và lòng tự hào nghề nghiệp của nhân viên.',
      },
      {
        key: 'F2',
        name: 'Fact (Sự thật / Hành vi & Con số cụ thể)',
        meaning: 'Chỉ đích danh hành động, thời gian và chi tiết phi thường',
        detail:
          'Tuyệt đối không khen chung chung ("Em làm tốt lắm"). Phải nói rõ: Em đã làm việc gì? Vào lúc mấy giờ? Với đơn hàng nào? Khắc phục được sự cố gì cụ thể?',
        tip: 'Càng chi tiết bao nhiêu, nhân viên càng hiểu rằng người lãnh đạo luôn dõi theo và trân trọng từng giọt mồ hôi của họ.',
      },
      {
        key: 'C',
        name: 'Compare (So sánh & Tác động lan tỏa)',
        meaning: 'So sánh với quá khứ hoặc tác động to lớn tới tập thể và khách hàng',
        detail:
          'So sánh sự tiến bộ của chính họ so với trước đây ("So với những ngày đầu mới vào xưởng..."), hoặc so sánh với tác động mà hành động đó mang lại ("Nhờ em mà công ty giữ trọn uy tín với khách hàng VIP...").',
        tip: 'Quy tắc bất biến: Chỉ so sánh họ với chính họ trong quá khứ hoặc so với tiêu chuẩn chung; tuyệt đối không so sánh hơn thua với đồng nghiệp khác để tránh gây đố kỵ.',
      },
    ],
    ceoStepByStep: [
      {
        step: 1,
        title: 'Bắt quả tang nhân viên làm đúng (Catch them doing right)',
        action: 'Dành 15 phút mỗi ngày đi dạo nhà xưởng hoặc xem radar ERP tìm kiếm những nỗ lực thầm lặng thay vì chỉ rình rình bắt lỗi.',
        deliverable: 'Ghi nhận 1 sự thật (Fact) đáng giá.',
      },
      {
        step: 2,
        title: 'Ghép công thức 3 bước Feeling -> Fact -> Compare',
        action: 'Soạn thảo lời khen theo đúng 3 thành phần trên hệ thống AXIS CEO OS hoặc nói trực tiếp.',
        deliverable: 'Thông điệp khen ngợi tràn đầy năng lượng.',
      },
      {
        step: 3,
        title: 'Khen ngợi công khai trước tập thể (hoặc bắn ERP)',
        action: 'Nói trong cuộc họp giao ban, bắn thông báo vinh danh trên ProTrack ERP, hoặc gửi tin nhắn riêng nếu là việc nhạy cảm.',
        deliverable: 'Hiệu ứng lan tỏa tinh thần tích cực toàn tổ chức.',
      },
      {
        step: 4,
        title: 'Trao thưởng nóng mang tính biểu tượng (nếu có)',
        action: 'Kèm theo phong bì thưởng nóng 200k - 1 triệu hoặc một cái bắt tay thật chặt từ CEO.',
        deliverable: 'Kỷ niệm khó quên trong cuộc đời đi làm của nhân sự.',
      },
    ],
    goldenQuestions: [
      'Lời khen này đã có hành động và con số cụ thể (Fact) chưa, hay vẫn là lời khen sáo rỗng "Cố gắng phát huy nhé"?',
      'Mình đã bộc lộ cảm xúc trân trọng chân thành của người thuyền trưởng chưa (Feeling)?',
      'Lời so sánh (Compare) đã làm nổi bật sự tiến bộ vượt bậc của họ mà không làm tổn thương đồng nghiệp khác chưa?',
    ],
    commonPitfalls: [
      {
        bad: 'Khen theo kiểu "Sandwich ngược": "Em đợt này làm tốt đấy, NHƯNG mà tháng trước làm ẩu quá làm anh mất mặt."',
        fix: 'Tuyệt đối không dùng chữ "NHƯNG" trong lời khen. Khen là khen trọn vẹn, không bới móc lỗi cũ.',
        why: 'Từ "nhưng" sẽ xóa sạch toàn bộ cảm xúc tích cực phía trước và biến lời khen thành một đòn châm chọc mỉa mai.',
      },
      {
        bad: 'Khen muộn màng: Một sự việc xảy ra từ tháng trước, đến tận cuối năm tổng kết mới lôi ra khen.',
        fix: 'Khen ngay trong vòng 24-48 giờ khi sự việc còn nóng hổi.',
        why: 'Lời khen để nguội sẽ mất 80% giá trị tinh thần; khen kịp thời sẽ nhân đôi động lực ngay tại chỗ.',
      },
    ],
    realisticExample: {
      context: 'Chị Lan - Trưởng ca đóng gói xưởng in, đêm qua đã chủ động ở lại tới 22h cùng công nhân để kiểm tra và đóng gói lại 3,000 hộp quà Tết bị sai tem dán.',
      badSample: 'Chị Lan làm tốt lắm, cố gắng phát huy nhé.',
      badReason: 'Nhạt nhẽo, vô cảm, khiến người đã thức đêm vất vả cảm thấy sự hy sinh của mình không được trân trọng xứng đáng.',
      goodSample:
        'CEO áp dụng chuẩn FFC phát biểu trong giờ giao ban sáng:\n- [F - Feeling]: "Sáng nay đến công ty, anh thực sự xúc động và vô cùng khâm phục tinh thần trách nhiệm của chị Lan cùng tổ đóng gói ca đêm."\n- [F - Fact]: "Tối qua khi phát hiện lỗi tem dán sai lệch ở Lệnh LSX-408 lúc 18h, chị Lan đã không hề đùn đẩy trách nhiệm cho ca sáng mà chủ động ở lại tới 22h đêm, tự tay cùng chị em bóc dán và kiểm tra từng kiện hàng để đảm bảo 3,000 hộp quà Tết hoàn hảo 100%."\n- [C - Compare]: "Nhờ hành động tuyệt vời đó của chị mà sáng nay xe hàng đã xuất phát đúng 6h sáng tới cảng Hải Phòng, giữ trọn chữ Tín của ProCEO với khách hàng Nhật Bản. So với trước đây chúng ta từng bị phạt 50 triệu vì lỗi tem, sự chủ động của chị Lan hôm nay là tấm gương sáng nhất cho toàn nhà máy!"\n(CEO trực tiếp trao thưởng nóng 1.5 triệu cho tổ đóng gói).',
      goodBreakdown: [
        'Feeling: Bộc lộ sự xúc động, cảm phục từ tận đáy lòng của người đứng đầu.',
        'Fact: Chi tiết chính xác: Lệnh LSX-408, từ 18h đến 22h, tự tay bóc dán 3,000 hộp.',
        'Compare: So sánh với vụ phạt 50 triệu trước đây để thấy rõ giá trị cứu nguy cho công ty.',
      ],
    },
    ceoCheatSheet: [
      { category: '3 Từ khóa vàng', takeaway: '"Cảm xúc chân thật (Feeling) + Hành vi con số cụ thể (Fact) + Tác động lan tỏa (Compare)."' },
      { category: 'Quy tắc khen - chê', takeaway: '"Khen công khai trước đám đông - Góp ý riêng tư sau cánh cửa đóng kín."' },
    ],
  },

  SWOT: {
    code: 'SWOT',
    shortName: 'Phân Tích SWOT / TOWS',
    fullName: 'Phân Tích Vị Thế SWOT & Ma Trận Chiến Lược Hành Động TOWS',
    subtitle: 'Nhìn Thấu Nội Tại - Bắt Trọn Thời Cuộc - Chuyển Hóa Nhận Định Thành Đòn Bẩy Thực Thi',
    mantra: 'Một bảng SWOT chỉ để ngắm là vô dụng; sức mạnh của người lãnh đạo nằm ở việc ghép cặp chúng lại thành Ma Trận Hành Động TOWS.',
    essence:
      'SWOT & TOWS giúp CEO nhìn nhận bức tranh tổng thể: Điểm mạnh (S), Điểm yếu (W) thuộc về Nội bộ công ty; Cơ hội (O), Thách thức (T) thuộc về Thị trường bên ngoài. Từ đó ghép nối thành 4 chiến lược hành động: Tấn công (SO), Khắc phục (WO), Phòng thủ (ST) và Rút lui/Sinh tồn (WT).',
    origin:
      'Mô hình SWOT được Albert Humphrey phát triển tại Viện Nghiên cứu Stanford (thập niên 1960) và Ma trận TOWS được Giáo sư Heinz Weihrich hoàn thiện (1982).',
    themeColor: {
      primaryBg: 'bg-blue-950',
      primaryText: 'text-blue-950',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-900',
      border: 'border-blue-400',
      lightBg: 'bg-blue-50/50',
      accent: 'text-blue-600',
    },
    whenToUse:
      'Định kỳ hàng năm hoặc quý khi họp chiến lược công ty, khi chuẩn bị mở rộng quy mô xưởng, đầu tư dây chuyền máy móc mới, hoặc khi thị trường có biến động lớn về giá nguyên liệu/đối thủ.',
    targetTab: 'strategy',
    targetTabName: 'Chiến Lược (SWOT & TOWS)',
    coreComponents: [
      {
        key: 'S',
        name: 'Strengths (Điểm mạnh nội bộ)',
        meaning: 'Những gì công ty làm xuất sắc hơn đối thủ cạnh tranh',
        detail:
          'Dàn máy in offset Heidelberg 6 màu công nghệ cao, đội ngũ thợ lành nghề gắn bó lâu năm, hệ thống ERP quản trị thời gian thực, chi phí sản xuất tối ưu nhờ mặt bằng thuộc sở hữu.',
        tip: 'Chỉ ghi nhận là Điểm mạnh nếu đối thủ trực tiếp khó lòng sao chép được trong vòng 6-12 tháng.',
      },
      {
        key: 'W',
        name: 'Weaknesses (Điểm yếu nội bộ)',
        meaning: 'Những giới hạn nội tại kìm hãm sự tăng trưởng của công ty',
        detail:
          'Phòng kinh doanh mỏng và phụ thuộc vào quan hệ của CEO, tỷ lệ hao hụt nguyên liệu giấy/mực còn cao hơn định mức, quy trình kiểm soát chất lượng KCS còn thủ công.',
        tip: 'CEO phải dũng cảm nhìn thẳng vào sự thật, không giấu giếm hay né tránh các lỗ hổng quản trị.',
      },
      {
        key: 'O',
        name: 'Opportunities (Cơ hội bên ngoài)',
        meaning: 'Những xu hướng và khoảng trống thị trường thuận lợi',
        detail:
          'Nhu cầu bao bì tự hủy/bao bì xanh xuất khẩu tăng vọt, các doanh nghiệp FDI chuyển dịch nhà máy sang Việt Nam, một đối thủ lớn trong ngành vừa phá sản giải thể.',
        tip: 'Cơ hội là thứ khách quan từ bên ngoài; công ty phải có năng lực chớp lấy thì mới biến thành tiền.',
      },
      {
        key: 'T',
        name: 'Threats (Thách thức & Rủi ro bên ngoài)',
        meaning: 'Những yếu tố ngoại cảnh đe dọa sự an toàn của công ty',
        detail:
          'Giá giấy cuộn và mực in nhập khẩu tăng 15% do biến động tỷ giá, khách hàng chậm thanh toán công nợ do kinh tế khó khăn, đối thủ phá giá để tranh giành đơn hàng.',
        tip: 'Cần lập kịch bản ứng phó trước khi thách thức gõ cửa, tránh rơi vào thế bị động phá sản.',
      },
    ],
    ceoStepByStep: [
      {
        step: 1,
        title: 'Liệt kê khách quan 4 ô SWOT',
        action: 'Tập hợp ban giám đốc và các trưởng bộ phận, thu thập dữ liệu thị trường và dữ liệu thực tế từ ERP để điền vào 4 ô S-W-O-T.',
        deliverable: 'Bảng phân tích hiện trạng trung thực, không tô hồng.',
      },
      {
        step: 2,
        title: 'Ghép cặp thành Ma Trận Hành Động TOWS',
        action: 'Ghép S + O thành Chiến lược Tấn công; Ghép W + O thành Chiến lược Cải tổ để đón sóng; Ghép S + T thành Chiến lược Dùng thế mạnh hóa giải rủi ro; Ghép W + T thành Chiến lược Phòng thủ sinh tồn.',
        deliverable: '4 nhóm chiến lược hành động cụ thể.',
      },
      {
        step: 3,
        title: 'Lọc ra 3 Chiến lược Hành động Ưu tiên',
        action: 'Đánh giá tính khả thi và nguồn lực tài chính, chọn ra 2-3 chiến lược then chốt nhất để đưa vào OKR Quý.',
        deliverable: 'Các dự án chiến lược được cấp ngân sách.',
      },
      {
        step: 4,
        title: 'Rà soát định kỳ mỗi Quý',
        action: 'Cập nhật lại các biến số mới: Đối thủ có động thái gì mới? Điểm yếu cũ đã khắc phục được chưa?',
        deliverable: 'Bản đồ chiến lược luôn bám sát nhịp thở thị trường.',
      },
    ],
    goldenQuestions: [
      'Điểm mạnh (S) nào của công ty là "vũ khí sát thủ" mà đối thủ khó sao chép nhất trong 1 năm tới?',
      'Điểm yếu (W) nào nếu không sửa ngay sẽ làm chúng ta mất đứt những hợp đồng lớn vào tay đối thủ?',
      'Chiến lược chúng ta đang chọn thuộc nhóm Tấn công (SO) hay Phòng thủ thu hẹp (WT)?',
    ],
    commonPitfalls: [
      {
        bad: 'Nhầm lẫn giữa Nội bộ và Bên ngoài: Ghi "Chính sách ưu đãi thuế" vào ô Điểm mạnh (S) hoặc ghi "Thiếu vốn" vào ô Thách thức (T).',
        fix: 'Quy tắc phân biệt: Điểm mạnh/Điểm yếu (S/W) là những thứ nằm trong tay CEO kiểm soát được; Cơ hội/Thách thức (O/T) là của thị trường, công ty không kiểm soát được mà chỉ có thể thích ứng.',
        why: 'Nhầm lẫn phân loại sẽ dẫn đến việc chọn sai chiến lược hành động và lãng phí nguồn lực.',
      },
      {
        bad: 'Làm SWOT xong rồi cất vào ngăn kéo, không ghép cặp TOWS để ra được hành động cụ thể.',
        fix: 'Bắt buộc phải có 4 ô TOWS (SO, WO, ST, WT) kèm người phụ trách và ngày hoàn thành.',
        why: 'Phân tích mà không ra hành động thì chỉ là buổi nói chuyện phiếm đắt tiền của ban lãnh đạo.',
      },
    ],
    realisticExample: {
      context: 'Họp chiến lược đầu năm của ProCEO trong bối cảnh giá giấy biến động mạnh và các nhà máy FDI đổ bộ.',
      badSample: 'Công ty mạnh về máy móc, yếu về kinh doanh, thị trường có nhiều khách hàng tiềm năng nhưng cạnh tranh gay gắt. Cần cố gắng hơn.',
      badReason: 'Vô thưởng vô phạt, không thể làm kim chỉ nam điều hành.',
      goodSample:
        'Ma trận SWOT -> TOWS của ProCEO:\n- S (Mạnh): Dây chuyền in 6 màu hiện đại + Chứng chỉ ISO 9001 + Hệ thống ERP quản trị đơn hàng realtime.\n- W (Yếu): Đội ngũ Sales B2B mỏng + Chưa có chứng chỉ xanh FSC cho bao bì xuất khẩu.\n- O (Cơ hội): Các tập đoàn điện tử Hàn Quốc và thực phẩm Nhật mở nhà máy tại Bắc Giang cần nhà cung cấp bao bì đạt chuẩn chất lượng cao tại chỗ.\n- T (Thách thức): Giá hạt nhựa và giấy nhập khẩu tăng 12% + Đối thủ cạnh tranh thi nhau hạ giá 5%.\nCHIẾN LƯỢC TOWS THỰC THI:\n1. Chiến lược SO (Tấn công bứt phá): Dùng năng lực in chuẩn màu cao cấp và hệ thống ERP minh bạch để đấu thầu trực tiếp các gói bao bì cho 3 nhà máy FDI tại Bắc Giang.\n2. Chiến lược WO (Khắc phục để chớp cơ hội): Tuyển ngay 2 chuyên viên Sales B2B thông thạo tiếng Hàn/Anh và hoàn tất chứng chỉ FSC trong Q2 để đủ điều kiện ký hợp đồng xuất khẩu.\n3. Chiến lược ST (Phòng thủ bằng thế mạnh): Ký hợp đồng cung ứng dài hạn 1 năm với nhà sản xuất giấy lớn, dùng uy tín dòng tiền ổn định để chốt giá chiết khấu, tránh bị ảnh hưởng bởi biến động giá thị trường.\n4. Chiến lược WT (Sinh tồn/Tối thiểu rủi ro): Áp dụng triệt để chu trình cải tiến PDCA để giảm hao hụt giấy in từ 3% xuống 1.5%, bù đắp trực tiếp vào chi phí nguyên liệu tăng.',
      goodBreakdown: [
        'SO: Tấn công trực diện vào phân khúc khách hàng FDI cao cấp.',
        'WO: Vá lỗ hổng nhân sự và chứng chỉ xanh để đón đầu dòng vốn đầu tư.',
        'ST: Hóa giải nguy cơ tăng giá nguyên liệu bằng hợp đồng dài hạn.',
        'WT: Siết chặt quản trị nội bộ để tự cứu mình trước khi thị trường cứu mình.',
      ],
    },
    ceoCheatSheet: [
      { category: 'Bản chất 4 chiến lược TOWS', takeaway: '"SO: Tấn công bứt phá • WO: Đổi mới để đón sóng • ST: Hóa giải nguy cơ • WT: Phòng thủ sinh tồn."' },
      { category: 'Tần suất rà soát chuẩn', takeaway: '"Cập nhật SWOT định kỳ 6 tháng/lần và điều chỉnh ngay khi có biến động vĩ mô lớn."' },
    ],
  },
};

export const ALL_FRAMEWORK_CODES: FrameworkCode[] = [
  'SMART',
  'PDCA',
  '3-6-9',
  'OKR',
  'PREP',
  'MASLOW',
  'FFC',
  'SWOT',
];

export const getFrameworkTheory = (code: FrameworkCode): FrameworkTheory => {
  return MANAGEMENT_FRAMEWORKS_THEORY[code] || MANAGEMENT_FRAMEWORKS_THEORY.SMART;
};

