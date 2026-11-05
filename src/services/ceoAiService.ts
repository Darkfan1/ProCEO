import { GoogleGenAI, Type } from '@google/genai';
import { SmartCriteria, SmartTask, Meeting369, PdcaCycle } from '../types/ceoTypes';

export interface AiPdcaPlanFromSmart {
  title: string;
  area: 'PRODUCTION' | 'QUALITY' | 'DELIVERY' | 'HR_CULTURE' | 'COST_CONTROL' | 'MANAGEMENT';
  ownerName: string;
  planProblem: string;
  doExperiment: string;
  checkEvaluation: string;
  actStandardize: string;
  metricBaseline: string;
  metricTarget: string;
  metricActual: string;
  dueDate: string;
}

export interface AiPdcaEvaluationResult {
  evaluationSummary: string;
  evaluationStatus: 'ACHIEVED' | 'ADJUST_NEXT_ITERATION';
  sopStandardizedTitle?: string;
  sopStandardizedCode?: string;
  smartProgressRecommended: number;
}

export interface AiMeetingPlanFromSmart {
  title: string;
  topic: string;
  objective: string;
  durationMinutes: number;
  participants: string[];
  preReadDocs: string;
  meetingRules: string;
  agendaFlow: string[];
  aiAdvisorNote: string;
  suggestedActions: Array<{
    taskTitle: string;
    assigneeName: string;
    dueDate: string;
  }>;
}

export interface AiMeetingRefineResult {
  aiReply: string;
  title?: string;
  topic?: string;
  objective?: string;
  preReadDocs?: string;
  agendaFlow?: string[];
  aiAdvisorNote?: string;
  suggestedActions?: Array<{
    taskTitle: string;
    assigneeName: string;
    dueDate: string;
  }>;
}

const getApiKey = (): string => {
  try {
    return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  } catch {
    return '';
  }
};

export const ceoAiService = {
  /**
   * 1. Tự động chuẩn hóa Mục tiêu / Công việc theo 5 tiêu chí SMART chuyên sâu cấp CEO
   */
  generateSmartCriteria: async (
    taskTitle: string,
    department: string,
    assigneeName: string,
    dueDate: string,
    lsxCode?: string,
    domain?: string
  ): Promise<SmartCriteria> => {
    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const domainLabel =
          domain === 'SALES'
            ? 'Kinh doanh & Phát triển thị trường'
            : domain === 'FINANCE'
            ? 'Tài chính, Dòng tiền & Chi phí'
            : domain === 'QUALITY'
            ? 'Chất lượng (QA/QC) & Cải tiến Kỹ thuật'
            : domain === 'HR'
            ? 'Nhân sự, Đào tạo & Văn hóa tổ chức'
            : domain === 'SUPPLY_CHAIN'
            ? 'Kho vận, Mua hàng & Chuỗi cung ứng'
            : domain === 'MANAGEMENT'
            ? 'Chiến lược, Quản trị hệ thống & Chuyển đổi số'
            : 'Sản xuất & Vận hành nhà máy';

        const prompt = `Bạn là Chuyên gia Cố vấn Quản trị Chiến lược C-Level và Trợ lý Điều hành của CEO Công ty Sản xuất & Thương mại Bao bì Tem Nhãn Mã Vạch Đồng Nai (MVĐN).
Hãy chuyển đổi và chuẩn hóa mục tiêu/nhiệm vụ được giao dưới đây thành một bộ tiêu chí SMART hoàn hảo, thực tế, sâu sắc và có tính hành động cao:

- Mục tiêu / Ý tưởng giao việc: "${taskTitle}"
- Lĩnh vực quản trị: ${domainLabel}
- Bộ phận chịu trách nhiệm: ${department}
- Nhân sự phụ trách: ${assigneeName || 'Cán bộ quản lý phụ trách'}
- Thời hạn hoàn thành: ${dueDate}
${lsxCode ? `- Lệnh sản xuất liên quan: ${lsxCode}` : ''}

YÊU CẦU BẮT BUỘC ĐỐI VỚI TỪNG TIÊU CHÍ (TUYỆT ĐỐI KHÔNG DÙNG CÂU TỪ CHUNG CHUNG):
1. Specific (S - Cụ thể): Xác định chính xác hành động then chốt, giải pháp kỹ thuật/nghiệp vụ, phạm vi áp dụng và tiêu chuẩn đầu ra. TUYỆT ĐỐI KHÔNG chỉ ghi tên người phụ trách hay lặp lại tiêu đề một cách máy móc.
2. Measurable (M - Đo lường được): BẮT BUỘC đưa ra các chỉ số định lượng sắc nét, sát sườn thực tế kinh doanh/sản xuất (ví dụ: % tăng/giảm, số lượng cụ thể, định mức thời gian, chi phí tiết giảm, tỷ lệ sai lỗi/phế phẩm). KHÔNG DÙNG câu sáo rỗng "hoàn thành 100% khối lượng".
3. Achievable (A - Khả thi): Nêu rõ phương pháp thực thi, công cụ, quy trình (SOP/Checklist), nguồn lực nhân lực & thiết bị cần huy động, giải pháp kiểm soát rủi ro để đảm bảo tính khả thi.
4. Relevant (R - Liên quan): Phân tích giá trị chiến lược và tác động trực tiếp của mục tiêu này đến sự phát triển của công ty (tăng biên lợi nhuận, giữ chân khách hàng FDI, tối ưu dòng tiền, nâng cao OEE máy móc, giảm chi phí ẩn...).
5. Time-bound (T - Thời hạn): Mốc thời gian hoàn tất chính xác, kèm các mốc kiểm tra/nghiệm thu trung gian (milestones) định kỳ.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                specific: {
                  type: Type.STRING,
                  description: 'S - Cụ thể: Hành động, giải pháp, phạm vi và kết quả đầu ra rõ ràng',
                },
                measurable: {
                  type: Type.STRING,
                  description: 'M - Đo lường: Các chỉ số KPI định lượng cụ thể (%, con số, định mức, chi phí)',
                },
                achievable: {
                  type: Type.STRING,
                  description: 'A - Khả thi: Phương pháp thực thi, công cụ, quy trình và nguồn lực đảm bảo',
                },
                relevant: {
                  type: Type.STRING,
                  description: 'R - Liên quan: Giá trị chiến lược đối với hiệu quả kinh doanh & vận hành',
                },
                timeBound: {
                  type: Type.STRING,
                  description: 'T - Thời hạn: Mốc hoàn thành kèm các mốc nghiệm thu tiến độ cụ thể',
                },
              },
              required: ['specific', 'measurable', 'achievable', 'relevant', 'timeBound'],
            },
          },
        });
        if (response.text) {
          const parsed = JSON.parse(response.text) as SmartCriteria;
          if (parsed.specific && parsed.measurable && parsed.achievable) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[ceoAiService] Fallback local SMART generator:', e);
      }
    }

    // ── FALLBACK QUẢN TRỊ CHUYÊN SÂU THEO TỪNG LĨNH VỰC DOANH NGHIỆP ──
    const titleLower = taskTitle.toLowerCase();

    // 1. Lĩnh vực Kinh doanh / Bán hàng / Khách hàng
    if (
      domain === 'SALES' ||
      titleLower.includes('khách') ||
      titleLower.includes('bán') ||
      titleLower.includes('doanh số') ||
      titleLower.includes('fdi') ||
      titleLower.includes('báo giá') ||
      titleLower.includes('thị trường')
    ) {
      return {
        specific: `Triển khai chiến dịch tiếp cận, tư vấn kỹ thuật quy cách tem nhãn chuyên sâu và thiết lập quan hệ hợp tác cung ứng cho nhóm khách hàng mục tiêu: "${taskTitle}".`,
        measurable:
          'Tăng tỷ lệ chốt đơn từ báo giá thành công đạt tối thiểu 50%; phát triển ít nhất 3 khách hàng FDI mới; doanh thu mục tiêu đạt từ 300 triệu trở lên.',
        achievable:
          'Tận dụng hồ sơ năng lực nhà máy MVĐN (in Flexo, Letterpress, bế tự động), chính sách gửi mẫu thử miễn phí trong 24 giờ và cam kết giao hàng trong 48 giờ.',
        relevant:
          'Đóng góp trực tiếp vào chỉ tiêu doanh thu quý, mở rộng thị phần tem nhãn công nghiệp và tăng tỷ trọng khách hàng FDI có hợp đồng dài hạn.',
        timeBound: `Chốt danh sách khách hàng và tiếp cận bước 1 trước ngày thứ 3; hoàn tất ký kết đơn hàng chính thức trước 17:00 ngày ${dueDate}.`,
      };
    }

    // 2. Lĩnh vực Tài chính / Dòng tiền / Công nợ / Chi phí
    if (
      domain === 'FINANCE' ||
      titleLower.includes('tiền') ||
      titleLower.includes('nợ') ||
      titleLower.includes('chi phí') ||
      titleLower.includes('tài chính') ||
      titleLower.includes('giá thành') ||
      titleLower.includes('lợi nhuận')
    ) {
      return {
        specific: `Thiết lập và thực thi quy trình kiểm soát chi phí chặt chẽ, tối ưu hóa vòng quay vốn lưu động và đôn đốc thu hồi dòng tiền: "${taskTitle}".`,
        measurable:
          'Rút ngắn chu kỳ thu hồi công nợ DSO xuống dưới 30 ngày; khống chế tỷ lệ nợ quá hạn < 1.0%; tiết giảm 5% chi phí vận hành biến đổi.',
        achievable:
          'Phối hợp nhịp nhàng giữa Kế toán và Kinh doanh, áp dụng chính sách chiết khấu thanh toán sớm 1.5% và thiết lập cảnh báo công nợ tự động trên ERP.',
        relevant:
          'Bảo toàn thanh khoản dòng tiền doanh nghiệp, loại bỏ rủi ro nợ khó đòi và đảm bảo nguồn vốn chủ động đầu tư máy móc công nghệ cao.',
        timeBound: `Đối soát số liệu công nợ vào 16:00 thứ Sáu hàng tuần; hoàn tất quyết toán và thu hồi toàn bộ chỉ tiêu trước ngày ${dueDate}.`,
      };
    }

    // 3. Lĩnh vực Chất lượng / Kỹ thuật / R&D / Khuôn mẫu
    if (
      domain === 'QUALITY' ||
      titleLower.includes('chất lượng') ||
      titleLower.includes('lỗi') ||
      titleLower.includes('khuôn') ||
      titleLower.includes('film') ||
      titleLower.includes('bản in') ||
      titleLower.includes('mực') ||
      titleLower.includes('keo') ||
      titleLower.includes('tiêu chuẩn')
    ) {
      return {
        specific: `Chuẩn hóa quy trình kỹ thuật, kiểm soát thông số film bản/khuôn dao và áp dụng biện pháp phòng ngừa sai lỗi tại nguồn: "${taskTitle}".`,
        measurable:
          'Giảm tỷ lệ phế phẩm công đoạn xuống dưới 0.4%; triệt tiêu 100% lỗi sai màu hoặc lệch khuôn; tỷ lệ khách hàng khiếu nại chất lượng = 0 vụ/tháng.',
        achievable:
          'Trang bị bảng so màu chuẩn Pantone, dụng cụ đo độ dày màng keo panme và ban hành checklist kiểm tra xác suất 300 mét in/lần trước khi chạy hàng loạt.',
        relevant:
          'Cắt giảm triệt để chi phí in ấn sản xuất lại (rework), nâng cao uy tín thương hiệu MVĐN và đáp ứng tiêu chuẩn kiểm xưởng khắt khe của khách hàng Nhật Bản, Hàn Quốc.',
        timeBound: `Hoàn thành thẩm định kỹ thuật mẫu thử nghiệm trước ngày thứ 5; ban hành quy chuẩn nghiệm thu chính thức trước 17:00 ngày ${dueDate}.`,
      };
    }

    // 4. Lĩnh vực Nhân sự / Đào tạo / An toàn lao động
    if (
      domain === 'HR' ||
      titleLower.includes('nhân sự') ||
      titleLower.includes('đào tạo') ||
      titleLower.includes('kỹ năng') ||
      titleLower.includes('tuyển') ||
      titleLower.includes('kỷ luật') ||
      titleLower.includes('an toàn')
    ) {
      return {
        specific: `Xây dựng và triển khai chương trình đào tạo nâng cao tay nghề, hoàn thiện ma trận kỹ năng và siết chặt kỷ luật hiện trường 5S: "${taskTitle}".`,
        measurable:
          '100% nhân sự tham gia đạt điểm kiểm tra nghiệp vụ từ 85/100 trở lên; tối thiểu 2 thợ phụ được nâng bậc thợ chính; 0 vụ vi phạm an toàn lao động.',
        achievable:
          'Áp dụng phương pháp đào tạo tại chỗ OJT (On-the-Job Training) do Quản đốc và thợ bậc cao kèm cặp, kết hợp cơ chế khen thưởng kịp thời theo nguyên tắc FFC.',
        relevant:
          'Xây dựng đội ngũ nhân sự kế cận tinh nhuệ, giảm thiểu rủi ro gián đoạn sản xuất khi biến động nhân lực và nâng cao năng suất lao động toàn công ty.',
        timeBound: `Tổ chức các buổi huấn luyện thực hành vào đầu ca làm việc; tổng kết đánh giá năng lực và cấp chứng nhận trước ngày ${dueDate}.`,
      };
    }

    // 5. Lĩnh vực Kho vận & Chuỗi cung ứng
    if (
      domain === 'SUPPLY_CHAIN' ||
      titleLower.includes('kho') ||
      titleLower.includes('mua hàng') ||
      titleLower.includes('vật tư') ||
      titleLower.includes('nguyên liệu') ||
      titleLower.includes('tồn kho') ||
      titleLower.includes('decal')
    ) {
      return {
        specific: `Thiết lập định mức tồn kho an toàn nguyên vật liệu Decal và Ruy băng mực, tối ưu hóa quy trình cấp phát vật tư theo lệnh sản xuất: "${taskTitle}".`,
        measurable:
          'Giảm 30% giá trị hàng tồn đọng quá 60 ngày; rút ngắn thời gian chuẩn bị và xuất kho nguyên liệu xuống dưới 10 phút/lệnh sản xuất; sai lệch kiểm kê < 0.1%.',
        achievable:
          'Phân vùng layout kho theo mã vị trí kệ, áp dụng nguyên tắc FIFO (nhập trước xuất trước) và cập nhật số liệu tồn kho realtime trên phần mềm ERP.',
        relevant:
          'Loại bỏ rủi ro thiếu hụt nguyên vật liệu làm ngưng trệ dây chuyền sản xuất, giải phóng diện tích mặt bằng kho và tiết kiệm chi phí bảo quản nguyên liệu.',
        timeBound: `Hoàn tất phân loại và dán nhãn định danh toàn bộ cuộn giấy trong tuần; nghiệm thu quy trình xuất nhập mới trước 17:00 ngày ${dueDate}.`,
      };
    }

    // 6. Lĩnh vực Sản xuất & Vận hành nhà máy (Mặc định nếu liên quan đến xưởng/máy móc/LSX)
    return {
      specific: `Chuẩn hóa thao tác vận hành, tối ưu hóa thời gian căn chỉnh dao/khuôn/bản in và kiểm soát quy trình theo tiêu chuẩn: "${taskTitle}"${
        lsxCode ? ` (áp dụng cho LSX ${lsxCode})` : ''
      }.`,
      measurable:
        'Rút ngắn thời gian setup bài in mới từ 45 phút xuống dưới 25 phút/lần; tỷ lệ hao hụt giấy đầu cuộn giảm xuống < 0.8%; hiệu suất thiết bị OEE đạt trên 85%.',
      achievable:
        'Chuẩn bị sẵn sàng túi hồ sơ kỹ thuật, bản in và vật tư trước giờ giao ca 15 phút; tuân thủ nghiêm ngặt bảng thông số chạy máy chuẩn của từng dòng máy Flexo/Bế.',
      relevant:
        'Loại bỏ thời gian chết (Downtime), tăng sản lượng tem nhãn thực tế mỗi ca lên 15% và bảo đảm cam kết giao hàng đúng hẹn (On-time Delivery) 100%.',
      timeBound: `Thực hiện đánh giá thí điểm trong 3 ngày đầu; hoàn thiện quy trình chuẩn hóa và nghiệm thu toàn diện trước 17:00 ngày ${dueDate}.`,
    };
  },

  /**
   * 2. Chuyển ý tưởng chỉ đạo của CEO thành thông điệp PREP (Point - Reason - Example - Point)
   */
  generatePrepDirective: async (
    topic: string,
    audience: string,
    erpContextSummary: string
  ): Promise<{
    pointOpening: string;
    reasonWhy: string;
    exampleEvidence: string;
    pointClosing: string;
  }> => {
    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Soạn thông điệp chỉ đạo điều hành của CEO theo cấu trúc PREP (Point - Reason - Example - Point):
- Chủ đề chỉ đạo: ${topic}
- Đối tượng nhận: ${audience}
- Số liệu thực tế từ ERP MVĐN: ${erpContextSummary}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                pointOpening: { type: Type.STRING },
                reasonWhy: { type: Type.STRING },
                exampleEvidence: { type: Type.STRING },
                pointClosing: { type: Type.STRING },
              },
              required: ['pointOpening', 'reasonWhy', 'exampleEvidence', 'pointClosing'],
            },
          },
        });
        if (response.text) {
          return JSON.parse(response.text);
        }
      } catch (e) {
        console.warn('[ceoAiService] Fallback local PREP generator:', e);
      }
    }

    return {
      pointOpening: `Ban Giám Đốc yêu cầu ${audience} tập trung thực hiện nghiêm túc chủ trương: "${topic}" ngay từ hôm nay.`,
      reasonWhy:
        'Bởi vì đây là yếu tố then chốt giúp chuẩn hóa quy trình phối hợp, loại bỏ thời gian chờ đợi và đảm bảo cam kết tiến độ với khách hàng.',
      exampleEvidence: `Theo dữ liệu thời gian thực từ ERP MVĐN (${erpContextSummary}), việc kiểm soát sát sao từng công đoạn giúp tăng ngay 20-25% tốc độ hoàn thành đơn hàng.`,
      pointClosing: `Vì vậy, đề nghị toàn thể ${audience} triển khai đồng bộ và cập nhật kết quả thực hiện lên hệ thống đúng thời hạn quy định.`,
    };
  },

  /**
   * 3. Soạn lời khen cụ thể theo nguyên tắc FFC (Feeling - Fact - Compare)
   */
  generateFfcPraise: async (
    recipientName: string,
    department: string,
    achievementFact: string
  ): Promise<{
    feeling: string;
    fact: string;
    compare: string;
  }> => {
    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Soạn lời khen ngợi nhân viên theo đúng nguyên tắc FFC (Feeling - Fact - Compare):
- Người được khen: ${recipientName} (${department})
- Thành tích cụ thể: ${achievementFact}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                feeling: { type: Type.STRING },
                fact: { type: Type.STRING },
                compare: { type: Type.STRING },
              },
              required: ['feeling', 'fact', 'compare'],
            },
          },
        });
        if (response.text) {
          return JSON.parse(response.text);
        }
      } catch (e) {
        console.warn('[ceoAiService] Fallback local FFC generator:', e);
      }
    }

    return {
      feeling: `Ban Giám Đốc thực sự rất vui mừng, tự hào và trân trọng tinh thần làm việc tận tâm của ${recipientName}.`,
      fact: `Cụ thể, tại bộ phận ${department}, ${achievementFact}.`,
      compare:
        'Kết quả này vượt trội hơn hẳn định mức trung bình và truyền cảm hứng làm việc chất lượng cao cho toàn thể anh chị em trong công ty!',
    };
  },

  /**
   * 4. Phân tích Tổng hợp Briefing Điều hành cho CEO từ dữ liệu ERP + Công việc
   */
  generateExecutiveBriefing: async (params: {
    inProgressLsx: number;
    overdueLsx: number;
    pendingProposals: number;
    todayOutput: number;
    openSmartTasks: number;
    activePdca: number;
  }): Promise<{ analysis: string; topThreeActions: string[] }> => {
    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Phân tích ngắn gọn tình hình điều hành trong ngày cho CEO Mã Vạch Đồng Nai:
- LSX đang chạy: ${params.inProgressLsx} (trong đó sát/quá hạn: ${params.overdueLsx})
- Đề xuất chờ CEO duyệt: ${params.pendingProposals}
- Sản lượng báo cáo hôm nay: ${params.todayOutput}
- Nhiệm vụ SMART đang mở: ${params.openSmartTasks}
- Chu trình cải tiến PDCA đang chạy: ${params.activePdca}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING },
                topThreeActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['analysis', 'topThreeActions'],
            },
          },
        });
        if (response.text) {
          return JSON.parse(response.text);
        }
      } catch (e) {
        console.warn('[ceoAiService] Fallback Executive Briefing:', e);
      }
    }

    const actions: string[] = [];
    if (params.overdueLsx > 0) {
      actions.push(
        `Áp dụng Họp 3-6-9 (Công thức 3): Đôn đốc ngay người phụ trách ${params.overdueLsx} Lệnh sản xuất sát/quá hạn trên ERP.`
      );
    } else {
      actions.push('Tiến độ LSX đang kiểm soát tốt — Duy trì kiểm tra định kỳ tại các công đoạn In & Bế.');
    }

    if (params.pendingProposals > 0) {
      actions.push(
        `Phê duyệt ngay ${params.pendingProposals} Đề xuất đang chờ quyết định của CEO để giải phóng điểm nghẽn vận hành.`
      );
    } else {
      actions.push('100% Đề xuất trên ERP đã được xử lý thông suốt, không có hồ sơ tồn đọng.');
    }

    actions.push(
      `Rà soát ${params.openSmartTasks} nhiệm vụ SMART trọng tâm và ${params.activePdca} vòng cải tiến PDCA; gửi 1 lời khen FFC cho cá nhân đạt sản lượng cao.`
    );

    return {
      analysis: `Hệ thống ERP MVĐN ghi nhận ${params.inProgressLsx} LSX đang vận hành (sản lượng hôm nay đạt ${params.todayOutput.toLocaleString('vi-VN')} đơn vị). Trọng tâm điều hành hôm nay là xử lý dứt điểm ${params.overdueLsx} LSX sát hạn và ${params.pendingProposals} đề xuất chờ duyệt.`,
      topThreeActions: actions,
    };
  },

  /**
   * 5. AI Tư vấn & Chuẩn bị Kịch bản Họp 3-6-9 chuyên sâu từ một Mục tiêu SMART
   */
  generateMeetingPlanFromSmart: async (
    task: SmartTask
  ): Promise<AiMeetingPlanFromSmart> => {
    const assignees = (task.assigneeName || 'Trưởng bộ phận')
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Bạn là Cố vấn Điều hành C-Level (Chief of Staff) cho CEO Công ty Mã Vạch Đồng Nai (MVĐN).
CEO có một Mục tiêu SMART cần đưa vào PHÒNG HỌP 3-6-9 để giải quyết điểm nghẽn, thống nhất phương án liên phòng ban và phân công thực thi dứt điểm.

THÔNG TIN MỤC TIÊU SMART GỐC:
- Tên mục tiêu: "${task.title}"
- Bộ phận chủ trì: "${task.department}" (Lĩnh vực: ${task.domain || 'GENERAL'})
- Người phụ trách / Tập thể: "${task.assigneeName}"
- Hạn hoàn thành mục tiêu (T): "${task.dueDate}"
- Tiến độ hiện tại: ${task.progress ?? 0}%
${task.linkedLsxCode ? `- Mã LSX liên kết: "${task.linkedLsxCode}"` : ''}
- Chi tiết 5 tiêu chí SMART:
  + S (Specific): ${task.smart?.specific || ''}
  + M (Measurable): ${task.smart?.measurable || ''}
  + A (Achievable): ${task.smart?.achievable || ''}
  + R (Relevant): ${task.smart?.relevant || ''}
  + T (Time-bound): ${task.smart?.timeBound || ''}

YÊU CẦU TƯ VẤN TỔ CHỨC HỌP THEO ĐÚNG CHUẨN 3-6-9 (3 Công thức - 6 Bước - 9 Nguyên tắc):
1. title: Tên cuộc họp ngắn gọn, sắc bén, thể hiện rõ tính hành động (VD: "Họp 3-6-9: Giải pháp chốt chất lượng bản in mới & chuẩn hóa SOP").
2. topic: Chủ đề cuộc họp rõ ràng (Bước 2).
3. objective: Mục tiêu bắt buộc phải chốt xong khi rời phòng họp (Nguyên tắc 1 - gắn chặt với chỉ số M của SMART).
4. durationMinutes: Thời lượng khuyến nghị tinh gọn (từ 20 đến 45 phút tùy độ phức tạp).
5. participants: Danh sách thành phần tham dự đúng người (Nguyên tắc 2), bao gồm Ban Giám Đốc, các nhân sự trong "${task.assigneeName}" và bộ phận liên đới.
6. preReadDocs: Tài liệu, số liệu thực tế bắt buộc các thành viên phải chuẩn bị trước khi bước vào phòng họp (Bước 1 & Nguyên tắc 3).
7. meetingRules: Quy tắc điều hành cuộc họp (Bước 3: Đúng giờ, trình bày theo cấu trúc PREP, không đổ lỗi vòng vo, tập trung giải pháp).
8. agendaFlow: Mảng 3 phần kịch bản cuộc họp có chia số phút cụ thể (Bước 4: Phần 1 Mở đầu & Rà soát dữ liệu; Phần 2 Thảo luận tháo gỡ điểm nghẽn kỹ thuật/quy trình; Phần 3 Chốt quyết định & Phân công giám sát).
9. aiAdvisorNote: Lời khuyên chiến lược dành riêng cho CEO/Chủ tọa (Tại sao mục tiêu này cần họp, 2-3 câu hỏi sắc bén CEO cần đặt ra để bóc tách gốc rễ vấn đề, và cách kiểm soát hậu kiểm theo Công thức 2 & 3).
10. suggestedActions: Mảng 2-3 đầu việc nhỏ (Action Items) tách ra từ mục tiêu SMART để phân công ngay tại Bước 5 & Bước 6 của cuộc họp, gán cho từng người cụ thể trong nhóm phụ trách.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                topic: { type: Type.STRING },
                objective: { type: Type.STRING },
                durationMinutes: { type: Type.NUMBER },
                participants: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                preReadDocs: { type: Type.STRING },
                meetingRules: { type: Type.STRING },
                agendaFlow: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                aiAdvisorNote: { type: Type.STRING },
                suggestedActions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      taskTitle: { type: Type.STRING },
                      assigneeName: { type: Type.STRING },
                      dueDate: { type: Type.STRING },
                    },
                    required: ['taskTitle', 'assigneeName', 'dueDate'],
                  },
                },
              },
              required: [
                'title',
                'topic',
                'objective',
                'durationMinutes',
                'participants',
                'preReadDocs',
                'meetingRules',
                'agendaFlow',
                'aiAdvisorNote',
                'suggestedActions',
              ],
            },
          },
        });
        if (response.text) {
          return JSON.parse(response.text);
        }
      } catch (e) {
        console.warn('[ceoAiService] Fallback local Meeting 3-6-9 advisor:', e);
      }
    }

    // Fallback chuyên sâu nếu không có kết nối mạng
    const participants = Array.from(
      new Set(['Ban Giám Đốc (Chủ tọa)', ...assignees, `Đại diện ${task.department}`, 'Bộ phận QC / Kế hoạch'])
    );

    const suggestedActions = assignees.map((person, index) => {
      if (index === 0) {
        return {
          taskTitle: `Chủ trì lập phương án kỹ thuật & checklist kiểm soát cho mục tiêu: "${task.title}"`,
          assigneeName: person,
          dueDate: task.dueDate,
        };
      }
      if (index === 1) {
        return {
          taskTitle: `Phối hợp chuẩn bị nguồn lực thực thi (${task.smart?.achievable?.slice(0, 80) || 'máy móc, vật tư, SOP'}) & đo lường kết quả thực tế`,
          assigneeName: person,
          dueDate: task.dueDate,
        };
      }
      return {
        taskTitle: `Giám sát hiện trường, nghiệm thu theo tiêu chí M và báo cáo tiến độ lên ERP trước hạn ${task.dueDate}`,
        assigneeName: person,
        dueDate: task.dueDate,
      };
    });

    if (suggestedActions.length === 1) {
      suggestedActions.push({
        taskTitle: `Kiểm tra chéo chỉ số đo lường (M) và nghiệm thu kết quả mục tiêu "${task.title}"`,
        assigneeName: `Bộ phận ${task.department}`,
        dueDate: task.dueDate,
      });
    }

    return {
      title: `Họp 3-6-9: Triển khai & Tháo gỡ điểm nghẽn — ${task.title}`,
      topic: `Thống nhất giải pháp thực thi & phân công trách nhiệm cho mục tiêu: "${task.title}" (${task.department})`,
      objective: `Chốt phương án khả thi (A) để đạt 100% chỉ số đo lường (M): ${task.smart?.measurable || 'Hoàn thành đúng hạn và đạt chuẩn chất lượng'} trước ngày ${task.dueDate}.`,
      durationMinutes: 30,
      participants,
      preReadDocs: `1. Bản tiêu chí S-M-A-R-T của mục tiêu "${task.title}" (Tiến độ hiện tại: ${task.progress ?? 0}%).\n2. Số liệu thống kê thực tế từ ERP MVĐN${task.linkedLsxCode ? ` (Mã LSX: ${task.linkedLsxCode})` : ''} & các vướng mắc phát sinh tại bộ phận ${task.department}.`,
      meetingRules:
        '1. Đúng giờ (Nguyên tắc 4) • 2. Trình bày thẳng vào giải pháp theo cấu trúc PREP (Point - Reason - Example - Point) • 3. Không đổ lỗi vòng vo, mọi vướng mắc phải gắn với 1 người chịu trách nhiệm chính và thời hạn xử lý.',
      agendaFlow: [
        `Phần 1 (5 phút) — Mở đầu & Rà soát dữ liệu (Bước 1-2): Chủ tọa nêu mục tiêu cần chốt; ${assignees[0] || task.department} báo cáo nhanh hiện trạng (${task.progress ?? 0}%) và số liệu chuẩn bị trước.`,
        `Phần 2 (15 phút) — Thảo luận trọng tâm & Tháo gỡ điểm nghẽn (Nguyên tắc 5): Phân tích nguyên nhân cản trở tiêu chí M (${task.smart?.measurable?.slice(0, 90) || 'chỉ số mục tiêu'}), thống nhất nguồn lực & quy trình phối hợp (A).`,
        `Phần 3 (10 phút) — Ra quyết định & Phân công 3-6-9 (Bước 5-6 & Nguyên tắc 6-7): Chốt biên bản quyết định, tách các đầu việc nhỏ gán đích danh cho ${assignees.join(', ')} và thiết lập lịch hậu kiểm trên ERP.`,
      ],
      aiAdvisorNote: `💡 TƯ VẤN CHO CEO / CHỦ TỌA:\n• Lý do cần họp: Mục tiêu này có sự tham gia của "${task.assigneeName}" (${task.department}), đòi hỏi sự đồng thuận về quy chuẩn kỹ thuật và phối hợp thực thi.\n• 3 Câu hỏi trọng tâm CEO cần hỏi trong phòng họp:\n  1. "Đâu là rào cản lớn nhất khiến chúng ta chưa đạt hoặc có nguy cơ trượt chỉ số M?"\n  2. "Giải pháp đề xuất hôm nay cần hỗ trợ gì về mặt cơ chế/vật tư/quy trình để làm được ngay?"\n  3. "Ai là người ký nghiệm thu cuối cùng và mốc kiểm tra giữa kỳ (Milestone) là ngày nào?"`,
      suggestedActions,
    };
  },

  /**
   * 6. AI Lên kịch bản họp trực tiếp chuẩn 3-6-9 từ Tên cuộc họp, Chủ đề và Mục tiêu cần chốt
   */
  generateMeetingPlanFromInputs: async (params: {
    title: string;
    topic?: string;
    objective?: string;
    participants?: string[];
    location?: string;
    durationMinutes?: number;
    meetingDate?: string;
  }): Promise<AiMeetingPlanFromSmart> => {
    const rawTitle = params.title.trim() || 'Cuộc Họp Điều Hành';
    const rawTopic = params.topic?.trim() || rawTitle;
    const rawObjective = params.objective?.trim() || 'Thống nhất giải pháp & chốt người chịu trách nhiệm.';
    const participantsList =
      params.participants && params.participants.length > 0
        ? params.participants
        : ['Ban Giám Đốc', 'Quản đốc Sản xuất', 'Bộ phận QC', 'Kế hoạch'];
    const duration = params.durationMinutes || 30;
    const meetingDate = params.meetingDate || new Date().toISOString().slice(0, 10);

    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Bạn là Cố vấn Điều hành C-Level cho CEO Công ty In ấn & Bao bì Mã Vạch Đồng Nai (MVĐN).
CEO muốn tổ chức một CUỘC HỌP TRỰC TIẾP tại công ty theo NGUYÊN TẮC 3-6-9 (3 Công thức - 6 Bước - 9 Nguyên tắc).

THÔNG TIN ĐẦU VÀO TỪ CEO:
- Tên cuộc họp: "${rawTitle}"
- Chủ đề trọng tâm: "${rawTopic}"
- Mục tiêu bắt buộc phải chốt xong khi tan họp: "${rawObjective}"
- Địa điểm: "${params.location || 'Phòng họp Ban Giám Đốc'}"
- Thành phần tham dự: ${participantsList.join(', ')}
- Thời lượng dự kiến: ${duration} phút

YÊU CẦU AI LÊN KỊCH BẢN HỌP TRỰC TIẾP CHUYÊN SÂU:
1. title: Chuẩn hóa tên cuộc họp chuyên nghiệp, dứt khoát.
2. topic: Chủ đề trọng tâm rõ ràng (Bước 2).
3. objective: Mục tiêu cốt lõi cần chốt (gắn với con số, mốc thời gian hoặc checklist nghiệm thu - Nguyên tắc 1).
4. durationMinutes: Thời lượng khuyến nghị hợp lý (20 - 45 phút).
5. participants: Danh sách thành phần bắt buộc (giữ các nhân sự/tập thể đã chọn, bổ sung người liên đới nếu cần).
6. preReadDocs: Danh mục tài liệu, số liệu hoặc mẫu vật thực tế các bộ phận BẮT BUỘC phải chuẩn bị mang vào phòng họp (Bước 1 & Nguyên tắc 3).
7. meetingRules: Quy tắc điều hành họp ngắn gọn (Bước 3: Đúng giờ, PREP, không đổ lỗi, chốt tại bàn).
8. agendaFlow: Mảng các phần kịch bản họp (mỗi phần ghi rõ số phút và mục tiêu cần giải quyết, thường từ 3 đến 5 phần).
9. aiAdvisorNote: Cố vấn chiến lược cho CEO/Chủ tọa (Lý do triệu tập, 3 câu hỏi xoáy sắc bén bóc tách điểm nghẽn, lưu ý hậu kiểm).
10. suggestedActions: Mảng 2-4 đầu việc cụ thể phân công cho từng người/tập thể có mặt trong cuộc họp để đưa vào biên bản chốt tại bàn họp.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                topic: { type: Type.STRING },
                objective: { type: Type.STRING },
                durationMinutes: { type: Type.NUMBER },
                participants: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                preReadDocs: { type: Type.STRING },
                meetingRules: { type: Type.STRING },
                agendaFlow: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                aiAdvisorNote: { type: Type.STRING },
                suggestedActions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      taskTitle: { type: Type.STRING },
                      assigneeName: { type: Type.STRING },
                      dueDate: { type: Type.STRING },
                    },
                    required: ['taskTitle', 'assigneeName', 'dueDate'],
                  },
                },
              },
              required: [
                'title',
                'topic',
                'objective',
                'durationMinutes',
                'participants',
                'preReadDocs',
                'meetingRules',
                'agendaFlow',
                'aiAdvisorNote',
                'suggestedActions',
              ],
            },
          },
        });
        if (response.text) {
          return JSON.parse(response.text);
        }
      } catch (e) {
        console.warn('[ceoAiService] Fallback Meeting inputs generator:', e);
      }
    }

    // Fallback nội bộ nếu không có mạng
    const firstAssignee = participantsList.find((p) => !p.includes('Giám Đốc')) || 'Quản đốc Sản xuất';
    return {
      title: rawTitle.startsWith('Họp') ? rawTitle : `Họp Điều Hành: ${rawTitle}`,
      topic: rawTopic,
      objective: rawObjective,
      durationMinutes: duration,
      participants: participantsList,
      preReadDocs: `1. Báo cáo số liệu thực tế liên quan đến "${rawTopic}" từ ERP MVĐN.\n2. Mẫu vật, biên bản kỹ thuật hoặc danh sách các điểm nghẽn hiện trường cần giải quyết dứt điểm.`,
      meetingRules:
        '1. Đúng giờ • 2. Đem đủ số liệu/mẫu vật vào phòng họp • 3. Trình bày theo cấu trúc PREP • 4. Chốt người chịu trách nhiệm & hạn hoàn thành ngay tại bàn.',
      agendaFlow: [
        `Phần 1 (5 phút) — Mở đầu: Chủ tọa nêu mục tiêu bắt buộc phải chốt ("${rawObjective.slice(0, 80)}"); kiểm tra số liệu/tài liệu chuẩn bị trước của các bộ phận.`,
        `Phần 2 (15 phút) — Thảo luận trọng tâm: Mổ xẻ nguyên nhân gốc rễ của chủ đề "${rawTopic.slice(0, 80)}", thống nhất phương án xử lý khả thi.`,
        `Phần 3 (10 phút) — Ra quyết định & Phân công: Chốt quyết định chính thức, gán đầu việc cụ thể cho từng thành viên và thiết lập lịch hậu kiểm.`,
      ],
      aiAdvisorNote: `💡 CỐ VẤN CHO CHỦ TỌA (CEO):\n• Trọng tâm cuộc họp: Đảm bảo chốt dứt điểm "${rawObjective.slice(0, 90)}".\n• 3 Câu hỏi xoáy CEO cần hỏi trực tiếp tại bàn họp:\n  1. "Đâu là điểm nghẽn lớn nhất khiến công việc bị chậm hoặc chưa đạt chuẩn?"\n  2. "Giải pháp đề xuất có cần thêm nguồn lực máy móc, vật tư hay thẩm quyền gì không?"\n  3. "Ai là người chịu trách nhiệm chính ký nghiệm thu và hạn chót bàn giao là khi nào?"`,
      suggestedActions: [
        {
          taskTitle: `Triển khai phương án xử lý dứt điểm cho nội dung: "${rawTopic}"`,
          assigneeName: firstAssignee,
          dueDate: meetingDate,
        },
        {
          taskTitle: `Nghiệm thu thực tế và báo cáo kết quả lên hệ thống ERP trước 17:00`,
          assigneeName: participantsList[1] || 'Bộ phận QC',
          dueDate: meetingDate,
        },
      ],
    };
  },

  /**
   * 7. Trao đổi với AI để tinh chỉnh hoặc lên kịch bản từng mục nhỏ (Interactive Copilot)
   */
  refineMeetingWithAi: async (params: {
    currentMeeting: Partial<Meeting369>;
    instruction: string;
    targetSection?: 'ALL' | 'OBJECTIVE' | 'AGENDA' | 'PRE_READ' | 'ADVISOR_NOTE' | 'ACTIONS';
  }): Promise<AiMeetingRefineResult> => {
    const { currentMeeting, instruction, targetSection = 'ALL' } = params;

    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Bạn là Cố vấn Điều hành C-Level cho CEO Công ty In ấn & Bao bì Mã Vạch Đồng Nai (MVĐN).
CEO đang chuẩn bị hoặc điều hành một CUỘC HỌP TRỰC TIẾP và muốn TRAO ĐỔI VỚI BẠN để tinh chỉnh kịch bản họp.

THÔNG TIN CUỘC HỌP HIỆN TẠI:
- Tên cuộc họp: "${currentMeeting.title || ''}"
- Chủ đề: "${currentMeeting.topic || ''}"
- Mục tiêu cần chốt: "${currentMeeting.objective || ''}"
- Thành phần tham dự: ${(currentMeeting.participants || []).join(', ')}
- Tài liệu chuẩn bị trước: "${currentMeeting.preReadDocs || ''}"
- Kịch bản các phần: ${JSON.stringify(currentMeeting.agendaFlow || [])}
- Cố vấn Chủ tọa hiện tại: "${currentMeeting.aiAdvisorNote || ''}"
- Đầu việc phân công: ${JSON.stringify(currentMeeting.actionItems || [])}

YÊU CẦU / LỆNH CỦA CEO:
"${instruction}"
(Mục tiêu tinh chỉnh: ${targetSection})

HÃY ĐÁP ỨNG CHÍNH XÁC YÊU CẦU CỦA CEO:
- Trả về aiReply: Câu phản hồi ngắn gọn, kính cẩn, giải thích rõ những gì bạn vừa cải tiến cho CEO.
- Cập nhật các trường tương ứng theo yêu cầu (chỉ thay đổi những trường mà CEO yêu cầu hoặc liên đới cần tinh chỉnh, các trường không liên quan giữ nguyên hoặc trả về phiên bản hoàn thiện).`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                aiReply: { type: Type.STRING },
                title: { type: Type.STRING },
                topic: { type: Type.STRING },
                objective: { type: Type.STRING },
                preReadDocs: { type: Type.STRING },
                agendaFlow: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                aiAdvisorNote: { type: Type.STRING },
                suggestedActions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      taskTitle: { type: Type.STRING },
                      assigneeName: { type: Type.STRING },
                      dueDate: { type: Type.STRING },
                    },
                    required: ['taskTitle', 'assigneeName', 'dueDate'],
                  },
                },
              },
              required: ['aiReply'],
            },
          },
        });
        if (response.text) {
          return JSON.parse(response.text);
        }
      } catch (e) {
        console.warn('[ceoAiService] Fallback Refine Meeting generator:', e);
      }
    }

    // Fallback nếu không có mạng
    const lower = instruction.toLowerCase();
    if (lower.includes('mục tiêu') || lower.includes('objective')) {
      return {
        aiReply: 'Em đã chuẩn hóa lại mục tiêu sắc bén hơn với chỉ số đo lường cụ thể cho CEO!',
        objective: `Chốt dứt điểm 100% phương án giải quyết "${currentMeeting.topic || 'công việc'}", nghiệm thu đạt chuẩn không để phát sinh lỗi lặp lại.`,
      };
    }
    if (lower.includes('câu hỏi') || lower.includes('chủ tọa') || lower.includes('xoáy')) {
      return {
        aiReply: 'Em đã cập nhật 3 câu hỏi xoáy thẳng vào trách nhiệm cá nhân cho Chủ tọa!',
        aiAdvisorNote: `💡 CÂU HỎI XOÁY CHO CHỦ TỌA (TINH CHỈNH):\n1. "Nguyên nhân gốc rễ là do con người, máy móc hay vật tư? Ai chịu trách nhiệm chính?"\n2. "Nếu làm theo phương án này, rủi ro lớn nhất là gì và kế hoạch dự phòng là gì?"\n3. "Cam kết mốc giờ nào hôm nay sẽ có kết quả đầu tiên báo cáo lên ERP?"`,
      };
    }
    if (lower.includes('tài liệu') || lower.includes('chuẩn bị')) {
      return {
        aiReply: 'Em đã bổ sung chi tiết danh mục tài liệu & mẫu vật các bộ phận phải mang vào phòng họp!',
        preReadDocs: `1. Số liệu chi tiết từ ERP ProTrack trong 7 ngày gần nhất.\n2. 03 mẫu thực tế tại hiện trường (mẫu đạt & mẫu lỗi) để đối chứng trực tiếp tại bàn họp.\n3. Phương án đề xuất bằng văn bản hoặc checklist ngắn của Quản đốc/Trưởng bộ phận.`,
      };
    }

    return {
      aiReply: `Em đã tiếp thu ý kiến của CEO ("${instruction}") và hoàn thiện kịch bản điều hành cuộc họp!`,
      agendaFlow: [
        ...(currentMeeting.agendaFlow || []),
        `Phần bổ sung theo chỉ đạo CEO: ${instruction}`,
      ],
    };
  },

  /**
   * 8. AI Chuyển đổi Mục tiêu SMART thành Kế hoạch Thực thi PDCA (SMART -> PDCA)
   */
  generatePdcaPlanFromSmart: async (
    task: SmartTask
  ): Promise<AiPdcaPlanFromSmart> => {
    const areaMap: Record<string, AiPdcaPlanFromSmart['area']> = {
      PRODUCTION: 'PRODUCTION',
      QUALITY: 'QUALITY',
      FINANCE: 'COST_CONTROL',
      HR: 'HR_CULTURE',
      SALES: 'DELIVERY',
      SUPPLY_CHAIN: 'DELIVERY',
      MANAGEMENT: 'MANAGEMENT',
    };
    const area = areaMap[task.domain || ''] || 'PRODUCTION';
    const primaryOwner = (task.assigneeName || 'Quản đốc')
      .split(/[,;\n]+/)[0]
      .trim() || 'Quản đốc Sản xuất';

    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Bạn là Chuyên gia Quản trị Doanh nghiệp (Lean / Kaizen / PDCA).
Hãy chuyển đổi Mục tiêu SMART sau thành Kế hoạch Thực thi chi tiết theo Chu trình PDCA (Plan - Do - Check - Act):
- Mục tiêu SMART: "${task.title}" (Bộ phận: ${task.department}, Phụ trách: ${task.assigneeName}, Hạn: ${task.dueDate})
- Chi tiết 5 tiêu chí: S="${task.smart?.specific}", M="${task.smart?.measurable}", A="${task.smart?.achievable}", R="${task.smart?.relevant}", T="${task.smart?.timeBound}".

Yêu cầu xuất JSON:
- title: Tên chu trình PDCA thực thi
- area: Chọn một trong ['PRODUCTION', 'QUALITY', 'DELIVERY', 'HR_CULTURE', 'COST_CONTROL', 'MANAGEMENT']
- ownerName: Người chịu trách nhiệm chính
- planProblem: P - Phân tích nguyên nhân gốc rễ và mục tiêu cải tiến cụ thể
- doExperiment: D - Giải pháp thực thi thử nghiệm tại công đoạn
- checkEvaluation: C - Phương án kiểm tra đo lường kết quả (sẽ đưa vào Họp 3-6-9)
- actStandardize: A - Hướng chuẩn hóa SOP hoặc kế hoạch nhân rộng
- metricBaseline: Chỉ số trước thực hiện
- metricTarget: Chỉ số mục tiêu cần đạt (M)
- metricActual: Ghi "Đang triển khai thử nghiệm"
- dueDate: Hạn hoàn thành`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                area: { type: Type.STRING },
                ownerName: { type: Type.STRING },
                planProblem: { type: Type.STRING },
                doExperiment: { type: Type.STRING },
                checkEvaluation: { type: Type.STRING },
                actStandardize: { type: Type.STRING },
                metricBaseline: { type: Type.STRING },
                metricTarget: { type: Type.STRING },
                metricActual: { type: Type.STRING },
                dueDate: { type: Type.STRING },
              },
              required: [
                'title',
                'area',
                'ownerName',
                'planProblem',
                'doExperiment',
                'checkEvaluation',
                'actStandardize',
                'metricBaseline',
                'metricTarget',
                'metricActual',
                'dueDate',
              ],
            },
          },
        });
        if (response.text) {
          const parsed = JSON.parse(response.text);
          return {
            ...parsed,
            area: ['PRODUCTION', 'QUALITY', 'DELIVERY', 'HR_CULTURE', 'COST_CONTROL', 'MANAGEMENT'].includes(parsed.area)
              ? parsed.area
              : area,
          };
        }
      } catch (err) {
        console.warn('AI PDCA from SMART error:', err);
      }
    }

    return {
      title: `Chu trình PDCA: ${task.title}`,
      area,
      ownerName: primaryOwner,
      planProblem: `P: ${task.smart?.specific || task.title}. Nguyên nhân cần giải quyết để đảm bảo đạt tiêu chí đo lường.`,
      doExperiment: `D: Thử nghiệm giải pháp dựa trên nguồn lực ${task.smart?.achievable || 'hiện có tại bộ phận'}.`,
      checkEvaluation: `C: Giám sát đo lường qua Họp 3-6-9 đối chiếu với mốc ${task.smart?.measurable || '100% mục tiêu'}.`,
      actStandardize: `A: Chuẩn hóa thành quy trình thao tác chuẩn (SOP) khi đạt chỉ số cam kết.`,
      metricBaseline: `Hiện trạng (${task.progress ?? 0}%)`,
      metricTarget: task.smart?.measurable || 'Đạt 100% tiêu chuẩn',
      metricActual: 'Đang triển khai thử nghiệm',
      dueDate: task.dueDate,
    };
  },

  /**
   * 9. AI Lên Kịch bản Họp 3-6-9 từ Chu trình PDCA (Pha Check: Giám sát & Tháo gỡ điểm nghẽn)
   */
  generateMeetingPlanFromPdca: async (
    cycle: PdcaCycle,
    smartTask?: SmartTask
  ): Promise<AiMeetingPlanFromSmart> => {
    return ceoAiService.generateMeetingPlanFromInputs({
      title: `Họp 3-6-9 Giám Sát & Tháo Gỡ: ${cycle.title}`,
      topic: `Đo lường pha Check & tháo gỡ điểm nghẽn chu trình PDCA: "${cycle.title}" (Phụ trách: ${cycle.ownerName})`,
      objective: `Đối chiếu kết quả thực tế ("${cycle.metricActual}") với mục tiêu ("${cycle.metricTarget}") và chốt hành động xử lý dứt điểm.`,
      participants: ['Ban Giám Đốc (Chủ tọa)', cycle.ownerName, 'Bộ phận QC / Kỹ thuật', 'Bộ phận Kế hoạch'],
      location: 'Phòng họp Ban Giám Đốc',
      durationMinutes: 30,
      meetingDate: cycle.dueDate || new Date().toISOString().slice(0, 10),
    });
  },

  /**
   * 10. AI Đánh Giá & Báo Cáo Hiệu Quả Chu Trình PDCA (Pha Act: Chuẩn hóa SOP hoặc chạy vòng tiếp theo)
   */
  generatePdcaEvaluation: async (
    cycle: PdcaCycle,
    smartTask?: SmartTask
  ): Promise<AiPdcaEvaluationResult> => {
    const isTargetAchieved =
      cycle.phase === 'STANDARDIZED' ||
      (cycle.metricActual &&
        cycle.metricTarget &&
        cycle.metricActual.trim() !== 'Đang theo dõi' &&
        cycle.metricActual.trim() !== 'Chưa đạt');

    const cleanCode = `SOP-MVDN-${Math.floor(100 + Math.random() * 900)}`;

    return {
      evaluationSummary: `Chu trình PDCA "${cycle.title}" do ${cycle.ownerName} phụ trách tại vòng lặp #${cycle.iteration}. Chỉ số ban đầu: "${cycle.metricBaseline}" ➔ Mục tiêu: "${cycle.metricTarget}" ➔ Kết quả ghi nhận: "${cycle.metricActual}".`,
      evaluationStatus: isTargetAchieved ? 'ACHIEVED' : 'ADJUST_NEXT_ITERATION',
      sopStandardizedTitle: isTargetAchieved ? `Quy trình thao tác chuẩn (SOP): ${cycle.title}` : undefined,
      sopStandardizedCode: isTargetAchieved ? cleanCode : undefined,
      smartProgressRecommended: isTargetAchieved ? 100 : 75,
    };
  },
};
