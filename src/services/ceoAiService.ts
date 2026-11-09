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

export interface AiMaslowConsultingResult {
  dominantNeedLevel: 1 | 2 | 3 | 4 | 5;
  levelName: string;
  analysisReasoning: string;
  ceoActionPlan: string;
  suggestedPraiseHint?: string;
  roleTierDetected?: 'MANAGEMENT' | 'SPECIALIST' | 'OPERATOR';
  satisfactionScores: {
    level1Physiological: number;
    level2Safety: number;
    level3Belonging: number;
    level4Esteem: number;
    level5SelfActualization: number;
  };
}

export type StaffRoleTier = 'MANAGEMENT' | 'SPECIALIST' | 'OPERATOR';

export function detectStaffRoleTier(role?: string, department?: string): StaffRoleTier {
  const text = `${role || ''} ${department || ''}`.toLowerCase();
  if (
    text.includes('quản lý') ||
    text.includes('quản đốc') ||
    text.includes('trưởng') ||
    text.includes('phó') ||
    text.includes('giám đốc') ||
    text.includes('kế toán trưởng') ||
    text.includes('chủ nhiệm') ||
    text.includes('lead') ||
    text.includes('manager') ||
    text.includes('head') ||
    text.includes('supervisor')
  ) {
    return 'MANAGEMENT';
  }
  if (
    text.includes('kỹ sư') ||
    text.includes('thiết kế') ||
    text.includes('chế bản') ||
    text.includes('kế hoạch') ||
    text.includes('điều độ') ||
    text.includes('qa') ||
    text.includes('qc') ||
    text.includes('kcs') ||
    text.includes('thu mua') ||
    text.includes('kho') ||
    text.includes('kế toán') ||
    text.includes('chuyên viên') ||
    text.includes('nhân viên') ||
    text.includes('engineer') ||
    text.includes('specialist')
  ) {
    return 'SPECIALIST';
  }
  return 'OPERATOR';
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
   * 3.5. Chẩn đoán Tầng Tháp Maslow & Tư Vấn Hành Động CEO dựa trên Biểu hiện quan sát và ERP MVĐN
   * Nhận diện chính xác Chức vụ & Vị thế tổ chức (Quản lý cấp trung vs Kỹ sư chuyên môn vs Thợ vận hành)
   */
  analyzeEmployeeMaslowNeeds: async (params: {
    employeeName: string;
    department: string;
    role: string;
    roleTier?: 'MANAGEMENT' | 'SPECIALIST' | 'OPERATOR';
    observations: string;
    erpContext?: {
      status?: string;
      totalReports?: number;
      recentStages?: string[];
      recentLsxCodes?: string[];
      defectSummary?: string;
      outputSummary?: string;
    };
  }): Promise<AiMaslowConsultingResult> => {
    const apiKey = getApiKey();
    const roleTier = params.roleTier || detectStaffRoleTier(params.role, params.department);
    const tierLabel =
      roleTier === 'MANAGEMENT'
        ? 'CẤP QUẢN LÝ / LÃNH ĐẠO CẤP TRUNG (Trực thuộc CEO/Ban Giám Đốc. Quản lý điều hành phân xưởng hoặc phòng ban, chịu trách nhiệm về đội ngũ thợ, mục tiêu OEE, tiến độ và tỷ lệ phế phẩm)'
        : roleTier === 'SPECIALIST'
        ? 'CẤP KỸ SƯ / CHUYÊN VIÊN (Chuyên môn sâu về Kỹ thuật, Chế bản & Khuôn in, QA/QC, Điều độ kế hoạch, Mua hàng)'
        : 'CẤP KỸ THUẬT VIÊN / THỢ VẬN HÀNH TRỰC TIẾP (Trực tiếp đứng máy in Flexo, bế tem, chia cuộn, kiểm tra lỗi trên từng đơn hàng)';

    const erpSummary =
      params.erpContext && (params.erpContext.totalReports || 0) > 0
        ? `Trạng thái: ${params.erpContext.status || 'Chính thức'}, Tham gia trực tiếp ${params.erpContext.totalReports} ca máy, Công đoạn: ${(params.erpContext.recentStages || []).join(', ') || 'Xưởng in & Bế tem Flexo'}, LSX gần nhất: ${(params.erpContext.recentLsxCodes || []).slice(0, 3).join(', ') || 'N/A'}. ${params.erpContext.outputSummary || ''} ${params.erpContext.defectSummary || ''}`
        : roleTier === 'MANAGEMENT'
        ? 'Nhân sự cấp quản lý điều hành, phụ trách quản trị mục tiêu OEE, tỷ lệ hao hụt và tiến độ giao hàng chung của toàn bộ phận.'
        : roleTier === 'SPECIALIST'
        ? 'Nhân sự khối chuyên môn kỹ thuật & gián tiếp, không tham gia đứng máy trực tiếp.'
        : 'Nhân sự xưởng vận hành.';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Bạn là Chuyên gia Cố vấn Quản trị Nhân sự Chiến lược & Huấn luyện Lãnh đạo C-Level (Executive Maslow Coach) cho CEO Công ty Sản xuất Bao bì Tem Nhãn Mã Vạch Đồng Nai (MVĐN).

HỒ SƠ NHÂN SỰ ĐƯỢC CHẨN ĐOÁN:
- Họ và tên: ${params.employeeName}
- Vị trí / Chức vụ hiện tại: "${params.role}"
- Bộ phận: ${params.department}
- PHÂN HẠNG VỊ THẾ TỔ CHỨC: ${tierLabel}
- Dữ liệu thực tế từ hệ thống ERP MVĐN: ${erpSummary}
- Biểu hiện quan sát, tâm tư, phát ngôn & hành vi ghi nhận được từ CEO/Quản lý:
"${params.observations}"

NGUYÊN TẮC CỐT LÕI (BẮT BUỘC NHẬN DIỆN CHỨC VỤ VÀ TƯ VẤN ĐÚNG TẦM):
1. NHẬN DIỆN VỊ THẾ & KHÔNG NHẦM LẪN CẤP BẬC:
   ${
     roleTier === 'MANAGEMENT'
       ? `• ĐẶC BIỆT LƯU Ý: Nhân sự ${params.employeeName} là CẤP QUẢN LÝ (Quản Lý Sản Xuất / Quản Đốc / Trưởng Bộ Phận). Họ là lãnh đạo điều hành xưởng, báo cáo trực tiếp cho CEO!
• TUYỆT ĐỐI KHÔNG ĐƯỢC TƯ VẤN NHƯ ĐỐI VỚI MỘT THỢ ĐỨNG MÁY! Dù trong lời nhận xét của người dùng có nhắc đến thợ in hay kỹ thuật, bạn phải hiểu đây là Quản lý điều hành đội ngũ thợ. KHÔNG ĐƯỢC có câu từ như "chờ quản đốc ghi nhận" vì họ chính là cấp quản lý!
• Mọi tư vấn cho CEO phải hướng vào: Cách CEO ủy quyền (Delegation), trao quyền tự chủ điều hành xưởng, tôn trọng quyền hạn trước mặt cấp dưới, cơ chế thưởng KPI/OKR theo hiệu quả toàn xưởng (OEE, tiến độ giao hàng, kiểm soát phế phẩm), và cách CEO làm việc 1-1 với một Quản lý cấp trung.`
       : roleTier === 'SPECIALIST'
       ? `• Nhân sự là CẤP KỸ SƯ / CHUYÊN VIÊN. Tư vấn của bạn phải tập trung vào uy tín chuyên môn, thẩm quyền kỹ thuật, công cụ đo kiểm chuẩn, giảm thiểu rủi ro đổ lỗi và sự phối hợp liên phòng ban.`
       : `• Nhân sự là THỢ VẬN HÀNH / CÔNG NHÂN TRỰC TIẾP. Tư vấn tập trung vào tay nghề, bảo hộ an toàn máy in/bế, phụ cấp ca kíp, nâng bậc thợ và văn hóa khen ngợi FFC cụ thể trên từng LSX.`
   }

2. CHẨN ĐOÁN TẦNG THÁP MASLOW:
   Xác định nhân sự đang có nhu cầu trọng tâm nhất ở TẦNG NÀO của Tháp Maslow (1 đến 5) phù hợp với vị thế ${params.role}:
   - Tầng 1: Nhu cầu Thiết yếu (Lương & Chế độ đãi ngộ tương xứng với cấp bậc).
   - Tầng 2: Nhu cầu An toàn & Quyền hạn (Với Quản lý: Quyền hạn điều hành rõ ràng, không bị can thiệp vi mô/vượt cấp; Với Thợ: An toàn lao động, việc làm ổn định).
   - Tầng 3: Nhu cầu Gắn kết & Tin cậy (Với Quản lý: Sự tin cậy từ CEO & phối hợp liên phòng ban; Với Thợ: Tình đồng đội ca kíp).
   - Tầng 4: Nhu cầu Tôn trọng & Ghi nhận (Với Quản lý: Tôn trọng vị thế lãnh đạo, tiếng nói chiến lược trong giao ban 3-6-9, ghi nhận công trạng quản trị; Với Thợ: Khen tay nghề FFC).
   - Tầng 5: Nhu cầu Tự khẳng định & Cống hiến (Với Quản lý: Kiến tạo hệ thống SOP, dẫn dắt đổi mới công nghệ RFID/Lean, đồng hành dài hạn; Với Thợ: Trở thành thợ bậc cao, truyền nghề).

3. YÊU CẦU ĐẦU RA:
   - dominantNeedLevel: Số nguyên 1, 2, 3, 4 hoặc 5.
   - levelName: Tên tầng tương ứng (ví dụ: "Cấp 4: Nhu Cầu Tôn Trọng Năng Lực Lãnh Đạo & Vị Thế Quản Lý").
   - analysisReasoning: Phân tích sâu sắc tâm lý gắn liền với chức vụ "${params.role}" và dữ liệu ERP.
   - ceoActionPlan: Đưa ra 3-4 bước hành động cụ thể đánh số 1, 2, 3, 4 có tính thực thi cao ngay trong tuần dành cho CEO.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dominantNeedLevel: { type: Type.INTEGER, description: '1, 2, 3, 4, or 5' },
                levelName: { type: Type.STRING },
                analysisReasoning: { type: Type.STRING },
                ceoActionPlan: { type: Type.STRING },
                suggestedPraiseHint: { type: Type.STRING },
                satisfactionScores: {
                  type: Type.OBJECT,
                  properties: {
                    level1Physiological: { type: Type.INTEGER },
                    level2Safety: { type: Type.INTEGER },
                    level3Belonging: { type: Type.INTEGER },
                    level4Esteem: { type: Type.INTEGER },
                    level5SelfActualization: { type: Type.INTEGER },
                  },
                  required: [
                    'level1Physiological',
                    'level2Safety',
                    'level3Belonging',
                    'level4Esteem',
                    'level5SelfActualization',
                  ],
                },
              },
              required: [
                'dominantNeedLevel',
                'levelName',
                'analysisReasoning',
                'ceoActionPlan',
                'satisfactionScores',
              ],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const lvl = Math.max(1, Math.min(5, Number(parsed.dominantNeedLevel) || 3)) as 1 | 2 | 3 | 4 | 5;
          return {
            ...parsed,
            dominantNeedLevel: lvl,
            roleTierDetected: roleTier,
          };
        }
      } catch (e) {
        console.warn('[ceoAiService] Fallback local Maslow analyzer:', e);
      }
    }

    // Heuristic Fallback thông minh chuẩn hóa theo Chức Vụ khi không có kết nối internet
    const obsLower = (params.observations || '').toLowerCase();
    let detectedLevel: 1 | 2 | 3 | 4 | 5 = 4;
    let levelTitle = '';
    let reasoning = '';
    let action = '';

    if (roleTier === 'MANAGEMENT') {
      if (obsLower.includes('lương') || obsLower.includes('thưởng') || obsLower.includes('đãi ngộ') || obsLower.includes('thu nhập') || obsLower.includes('chỉ tiêu')) {
        detectedLevel = 1;
        levelTitle = 'Cấp 1: Đãi Ngộ & Cơ Chế Thu Nhập Xứng Đáng Với Trách Nhiệm Quản Lý';
        reasoning = `Nhân sự ${params.employeeName} với vai trò ${params.role} đang gánh vác trách nhiệm điều hành lớn nhưng cảm thấy cơ chế đãi ngộ và thưởng hiệu quả sản xuất chưa tương xứng với công sức và rủi ro quản trị.`;
        action = `CEO nên: 1) Rà soát lại cơ chế khoán sản lượng xưởng và quỹ thưởng theo hiệu quả OEE; 2) Thiết lập chính sách thưởng KPI rõ ràng gắn với tỷ lệ giao hàng đúng hẹn và giảm phế phẩm; 3) Gặp gỡ riêng khẳng định sự đầu tư xứng đáng của công ty cho đội ngũ lãnh đạo chủ chốt.`;
      } else if (obsLower.includes('vi mô') || obsLower.includes('vượt cấp') || obsLower.includes('quyền') || obsLower.includes('can thiệp') || obsLower.includes('bất an') || obsLower.includes('sợ sai')) {
        detectedLevel = 2;
        levelTitle = 'Cấp 2: An Toàn Về Quyền Hạn & Tự Chủ Điều Hành Cấp Quản Lý';
        reasoning = `Nhân sự ${params.employeeName} đang cần sự bảo đảm vững chắc về ranh giới quyền hạn, tránh tình trạng bị chỉ đạo vượt cấp qua mặt quản lý làm suy giảm uy tín điều hành trước công nhân xưởng.`;
        action = `CEO nên: 1) Cam kết nguyên tắc 'Ủy quyền có kiểm soát' - CEO chỉ đạo thông qua ${params.role}, không can thiệp vi mô xuống từng thợ; 2) Hậu thuẫn mạnh mẽ cho các quyết định điều chuyển ca và kỷ luật của quản lý; 3) Thiết lập kênh báo cáo định kỳ thay vì kiểm tra đột xuất gây căng thẳng.`;
      } else if (obsLower.includes('phối hợp') || obsLower.includes('liên phòng') || obsLower.includes('tin cậy') || obsLower.includes('gắn kết') || obsLower.includes('đoàn kết')) {
        detectedLevel = 3;
        levelTitle = 'Cấp 3: Tin Cậy Điều Hành & Phối Hợp Liên Phòng Ban';
        reasoning = `Nhân sự ${params.employeeName} (${params.role}) mong muốn có sự tin cậy cao hơn từ Ban Giám Đốc và sự phối hợp nhịp nhàng, thông suốt từ các phòng ban liên quan (Kế hoạch, Mua hàng, Kỹ thuật).`;
        action = `CEO nên: 1) Chủ trì giao ban liên bộ phận để tháo gỡ điểm nghẽn bàn giao công việc; 2) Khẳng định vai trò hạt nhân của khối Quản lý trong bộ máy điều hành; 3) Xây dựng cơ chế trao đổi mở định kỳ 1-1 với CEO.`;
      } else if (obsLower.includes('sáng kiến') || obsLower.includes('sop') || obsLower.includes('chiến lược') || obsLower.includes('đổi mới') || obsLower.includes('rfid') || obsLower.includes('kế cận') || obsLower.includes('cống hiến')) {
        detectedLevel = 5;
        levelTitle = 'Cấp 5: Tự Khẳng Định & Kiến Tạo Hệ Thống Sản Xuất Bền Vững';
        reasoning = `Nhân sự ${params.employeeName} đã khẳng định được năng lực vận hành và đang có khát vọng lớn trong việc chuẩn hóa toàn bộ quy trình xưởng (SOP), dẫn dắt các dự án công nghệ đột phá (nhãn RFID, Lean Kaizen) và đào tạo thế hệ kế cận.`;
        action = `CEO nên: 1) Trao toàn quyền (Empowerment) cho anh ${params.employeeName} làm Chủ nhiệm Đề án chuẩn hóa quy trình sản xuất; 2) Mời tham gia Ban Cố Vấn Chiến Lược C-Level của công ty; 3) Thiết lập cơ chế thưởng chia sẻ giá trị (thưởng % trên chi phí phế phẩm tiết kiệm được hàng quý).`;
      } else {
        detectedLevel = 4;
        levelTitle = 'Cấp 4: Tôn Trọng Năng Lực Lãnh Đạo & Vị Thế Quản Lý';
        reasoning = `Nhân sự ${params.employeeName} giữ vị trí ${params.role}, có năng lực chuyên môn và quản trị vững vàng, khao khát được Ban Giám Đốc tin cậy lắng nghe các đề xuất cải tiến và tôn trọng vị thế người đứng đầu bộ phận.`;
        action = `CEO nên: 1) Tham vấn ý kiến chuyên môn của anh ${params.employeeName} trước khi đưa ra các quyết định thay đổi về kế hoạch sản xuất; 2) Tuyên dương công khai trước buổi giao ban Ban Giám Đốc về thành tích quản trị của bộ phận; 3) Trao quyền chủ động thử nghiệm các phương án kỹ thuật mới do anh đề xuất.`;
      }
    } else {
      // Dành cho Kỹ sư và Thợ vận hành
      if (obsLower.includes('lương') || obsLower.includes('tăng ca') || obsLower.includes('tiền')) {
        detectedLevel = 1;
        levelTitle = 'Cấp 1: Nhu Cầu Thu Nhập Mưu Sinh & Phụ Cấp Ca';
        reasoning = `Nhân sự ${params.employeeName} (${params.role}) đang có áp lực lớn về tài chính và sinh kế, mong muốn được bảo đảm thu nhập và giờ tăng ca hợp lý.`;
        action = `CEO và Quản lý bộ phận nên: 1) Bố trí ca làm việc công bằng; 2) Đảm bảo chi trả phụ cấp ca đêm và thưởng năng suất kịp thời; 3) Lắng nghe hỗ trợ nếu có khó khăn đột xuất.`;
      } else if (obsLower.includes('an toàn') || obsLower.includes('phạt') || obsLower.includes('sợ hỏng')) {
        detectedLevel = 2;
        levelTitle = 'Cấp 2: Nhu Cầu An Toàn Lao Động & Ổn Định Việc Làm';
        reasoning = `Nhân sự lo ngại về an toàn máy móc hoặc sợ bị phạt khi xảy ra lỗi decal.`;
        action = `CEO nên: 1) Chuẩn hóa quy trình an toàn bảo hộ; 2) Áp dụng nguyên tắc học hỏi từ lỗi kỹ thuật, không phạt lỗi vô ý khi chạy thử mẫu; 3) Đảm bảo hợp đồng lao động và bảo hiểm.`;
      } else if (obsLower.includes('gắn kết') || obsLower.includes('đồng đội') || obsLower.includes('cô lập') || obsLower.includes('hòa nhập')) {
        detectedLevel = 3;
        levelTitle = 'Cấp 3: Nhu Cầu Gắn Kết Đồng Đội & Hòa Nhập Văn Hóa';
        reasoning = `Nhân sự ${params.employeeName} cảm thấy chưa gắn kết chặt chẽ với tập thể, cần sự hỗ trợ kèm cặp và môi trường làm việc cởi mở.`;
        action = `CEO và Quản đốc nên: 1) Phân công thợ giàu kinh nghiệm kèm cặp trực tiếp; 2) Tổ chức họp ca ngắn chia sẻ khó khăn; 3) Ghi nhận các đóng góp nhỏ để tạo sự tự tin hòa nhập.`;
      } else if (obsLower.includes('sáng kiến') || obsLower.includes('cải tiến') || obsLower.includes('rfid')) {
        detectedLevel = 5;
        levelTitle = 'Cấp 5: Tự Khẳng Định & Cống Hiến Đổi Mới';
        reasoning = `Nhân sự có tinh thần đổi mới sáng tạo cao, mong muốn chinh phục các kỹ thuật in/bế phức tạp.`;
        action = `CEO nên: 1) Giao tham gia các dự án tem công nghệ mới; 2) Thưởng nóng khi có sáng kiến giảm hao hụt; 3) Bồi dưỡng trở thành thợ bậc cao hạt giống.`;
      } else {
        detectedLevel = 4;
        levelTitle = 'Cấp 4: Tôn Trọng & Ghi Nhận Tay Nghề (Esteem)';
        reasoning = `Nhân sự ${params.employeeName} mong muốn tay nghề và sự cống hiến được cấp quản lý và Ban Giám Đốc ghi nhận công khai.`;
        action = `CEO nên: 1) Khen ngợi công khai theo công thức FFC sau mỗi ca máy xuất sắc; 2) Giao phụ trách các đơn hàng tem đòi hỏi kỹ thuật cao; 3) Nâng bậc thợ tương xứng với năng lực.`;
      }
    }

    return {
      dominantNeedLevel: detectedLevel,
      levelName: levelTitle,
      analysisReasoning: reasoning,
      ceoActionPlan: action,
      suggestedPraiseHint: `Ghi nhận năng lực điều hành và tinh thần trách nhiệm của ${params.employeeName} (${params.role}) trong việc kiểm soát tiến độ và chất lượng xưởng.`,
      roleTierDetected: roleTier,
      satisfactionScores: {
        level1Physiological: detectedLevel === 1 ? 4 : 8,
        level2Safety: detectedLevel <= 2 ? 5 : 8,
        level3Belonging: detectedLevel === 3 ? 5 : 7,
        level4Esteem: detectedLevel === 4 ? 5 : 7,
        level5SelfActualization: detectedLevel === 5 ? 6 : 4,
      },
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

  /**
   * 11. AI Executive Copilot - Trò chuyện & Cố vấn Điều hành C-Level
   */
  chatWithExecutiveAdvisor: async (params: {
    userMessage: string;
    systemContext?: string;
  }): Promise<string> => {
    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `${params.systemContext ? `[HỆ THỐNG / BỐI CẢNH ĐIỀU HÀNH]:\n${params.systemContext}\n\n` : ''}[YÊU CẦU TỪ CEO]:\n${params.userMessage}`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text || 'AI đã xử lý yêu cầu nhưng không có nội dung văn bản phản hồi.';
      } catch (err) {
        console.warn('AI Executive Advisor Error:', err);
      }
    }

    // Phản hồi mẫu dự phòng ngoại tuyến
    return `[Chế độ Ngoại Tuyến / ProCEO Advisory]\nĐã tiếp nhận yêu cầu điều hành: "${params.userMessage.slice(0, 80)}...".\nKhuyến nghị ưu tiên: Rà soát các mục tiêu SMART có hạn chót trong tuần, đối chiếu kết quả kiểm tra với chu trình PDCA và triệu tập họp 3-6-9 với DRI phụ trách để giải quyết điểm nghẽn.`;
  },

  /**
   * 12. AI Phân Tích Chỉ Thị PREP Của CEO & Tự Động Thiết Lập Kế Hoạch 4 Tầng
   */
  parsePrepToFourTierPlan: async (input: {
    point: string;
    reason: string;
    evidence: string;
    action: string;
    driName: string;
    timeframe?: string;
    targetDate?: string;
    budgetOrAuthority?: string;
    mainRisk?: string;
  }): Promise<{
    missionTitle: string;
    timeframe: string;
    driName: string;
    objectiveTitle: string;
    keyResults: Array<{
      title: string;
      baselineValue: number;
      targetValue: number;
      unit: string;
      driName: string;
    }>;
    initiatives: Array<{
      title: string;
      hypothesis: string;
      driName: string;
      targetDate: string;
    }>;
    tasks: Array<{
      title: string;
      driName: string;
      approverName: string;
      supporters: string[];
      priority: 'URGENT' | 'HIGH' | 'NORMAL';
      dueDate: string;
      specific: string;
      measurable: string;
    }>;
  }> => {
    const today = new Date().toISOString().slice(0, 10);
    const targetDate = input.targetDate || today;
    const timeframe = input.timeframe || '30 ngày tới';
    const primaryDri = input.driName || 'Quản Đốc Sản Xuất';

    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Bạn là Trợ lý Cố vấn Chiến lược C-Level và Chuyên gia Quản trị Vận hành Nhà máy (Lean/OEE/TOC).
CEO vừa ban hành một "Chỉ thị Điều hành" theo cấu trúc PREP:
- POINT (Mục tiêu cốt lõi): "${input.point}"
- REASON (Vì sao quan trọng): "${input.reason}"
- EVIDENCE (Bằng chứng & Số liệu thực tế): "${input.evidence}"
- ACTION (Chỉ đạo hành động & Phân công): "${input.action}"
- THỜI HẠN: "${timeframe}" (Hạn chót: ${targetDate})
- DRI TỐI CAO (Single DRI): "${primaryDri}"
- NGÂN SÁCH/QUYỀN HẠN: "${input.budgetOrAuthority || 'Theo thẩm quyền quy định'}"
- RỦI RO CHÍNH: "${input.mainRisk || 'Chưa xác định'}"

Nhiệm vụ: Phân rã chỉ thị PREP này thành hệ thống điều hành 4 tầng khép kín:
1. missionTitle: Khẩu hiệu hành động cấp CEO, ngắn gọn, gắn mục tiêu với thời hạn.
2. objectiveTitle: Mục tiêu định tính truyền cảm hứng theo chuẩn OKR.
3. keyResults (2 đến 3 kết quả then chốt): Đo lường được, PHẢI CÓ baselineValue (Hiện trạng), targetValue (Mục tiêu), unit (phút, %, lỗi, triệu VNĐ), và driName (1 người duy nhất).
4. initiatives (1 đến 2 dự án PDCA): Có giả thuyết giải pháp kỹ thuật cụ thể.
5. tasks (2 đến 3 hành động cụ thể): Rõ ràng, driName (1 người duy nhất), approverName, supporters (mảng string), priority, dueDate, specific, measurable.

TRẢ VỀ DUY NHẤT một chuỗi JSON hợp lệ theo schema sau (không thêm bất kỳ văn bản nào khác ngoài JSON):
{
  "missionTitle": "string",
  "timeframe": "${timeframe}",
  "driName": "${primaryDri}",
  "objectiveTitle": "string",
  "keyResults": [
    {
      "title": "string",
      "baselineValue": 60,
      "targetValue": 42,
      "unit": "phút",
      "driName": "${primaryDri}"
    }
  ],
  "initiatives": [
    {
      "title": "string",
      "hypothesis": "string",
      "driName": "${primaryDri}",
      "targetDate": "${targetDate}"
    }
  ],
  "tasks": [
    {
      "title": "string",
      "driName": "${primaryDri}",
      "approverName": "CEO Tôn Đăng Vũ",
      "supporters": ["Trưởng BP Kỹ Thuật", "QA/QC"],
      "priority": "HIGH",
      "dueDate": "${targetDate}",
      "specific": "string",
      "measurable": "string"
    }
  ]
}`;

        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const rawText = res.text || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.missionTitle && Array.isArray(parsed.keyResults) && parsed.keyResults.length > 0) {
          return {
            missionTitle: String(parsed.missionTitle),
            timeframe: String(parsed.timeframe || timeframe),
            driName: String(parsed.driName || primaryDri),
            objectiveTitle: String(parsed.objectiveTitle || `Tối ưu hóa & Đạt đột phá: ${input.point}`),
            keyResults: parsed.keyResults.map((kr: any) => ({
              title: String(kr.title || 'Kết quả then chốt'),
              baselineValue: Number(kr.baselineValue ?? 0),
              targetValue: Number(kr.targetValue ?? 100),
              unit: String(kr.unit || '%'),
              driName: String(kr.driName || primaryDri),
            })),
            initiatives: Array.isArray(parsed.initiatives)
              ? parsed.initiatives.map((init: any) => ({
                  title: String(init.title || 'Dự án cải tiến PDCA'),
                  hypothesis: String(init.hypothesis || 'Áp dụng giải pháp kỹ thuật chuẩn hóa để đạt KR'),
                  driName: String(init.driName || primaryDri),
                  targetDate: String(init.targetDate || targetDate),
                }))
              : [],
            tasks: Array.isArray(parsed.tasks)
              ? parsed.tasks.map((t: any) => ({
                  title: String(t.title || 'Hành động cụ thể'),
                  driName: String(t.driName || primaryDri),
                  approverName: String(t.approverName || 'CEO Tôn Đăng Vũ'),
                  supporters: Array.isArray(t.supporters) ? t.supporters : ['Đội ngũ vận hành'],
                  priority: (t.priority === 'URGENT' || t.priority === 'HIGH' || t.priority === 'NORMAL' ? t.priority : 'HIGH') as any,
                  dueDate: String(t.dueDate || targetDate),
                  specific: String(t.specific || t.title || ''),
                  measurable: String(t.measurable || 'Hoàn thành đúng hạn và có báo cáo nghiệm thu'),
                }))
              : [],
          };
        }
      } catch (err) {
        console.warn('AI PREP Parsing Error, using offline domain logic:', err);
      }
    }

    // Logic ngoại tuyến thông minh (Domain Logic)
    const missionTitle = `[Chiến Lược] ${input.point.trim()} (${timeframe})`;
    const objectiveTitle = `Nâng cao hiệu suất vận hành & Kiểm soát chất lượng vượt trội: ${input.point}`;

    return {
      missionTitle,
      timeframe,
      driName: primaryDri,
      objectiveTitle,
      keyResults: [
        {
          title: `Đạt mục tiêu chỉ số định lượng: ${input.point.slice(0, 60)}`,
          baselineValue: 100,
          targetValue: 70,
          unit: '% hoặc phút',
          driName: primaryDri,
        },
        {
          title: '100% các công đoạn tuân thủ quy trình kiểm soát chất lượng & an toàn',
          baselineValue: 75,
          targetValue: 100,
          unit: '% tuân thủ',
          driName: 'Trưởng BP QA/QC',
        },
      ],
      initiatives: [
        {
          title: `Triển khai dự án cải tiến: ${input.point.slice(0, 50)}`,
          hypothesis: `Áp dụng chuẩn hóa thao tác và phân bổ nguồn lực sẽ giải quyết triệt để vấn đề: ${input.reason.slice(0, 80)}`,
          driName: primaryDri,
          targetDate,
        },
      ],
      tasks: [
        {
          title: `Khảo sát hiện trạng chi tiết và ban hành checklist: ${input.point.slice(0, 45)}`,
          driName: primaryDri,
          approverName: 'Tôn Đăng Vũ (CEO)',
          supporters: ['Trưởng BP Kỹ Thuật', 'Quản Đốc Phân Xưởng'],
          priority: 'URGENT',
          dueDate: targetDate,
          specific: `Thực hiện đánh giá hiện trường dựa trên bằng chứng: ${input.evidence.slice(0, 80)}`,
          measurable: 'Ban hành bảng tiêu chuẩn thao tác được phê duyệt và đào tạo 100% thợ máy',
        },
        {
          title: `Họp triển khai hành động: ${input.action.slice(0, 50)}`,
          driName: primaryDri,
          approverName: 'Tôn Đăng Vũ (CEO)',
          supporters: ['Bộ Phận Sản Xuất', 'Bộ Phận Kỹ Thuật'],
          priority: 'HIGH',
          dueDate: targetDate,
          specific: `Tổ chức phối hợp các bên theo phân công: ${input.action.slice(0, 80)}`,
          measurable: 'Biên bản thống nhất phương án và cam kết tiến độ từ các bộ phận liên quan',
        },
      ],
    };
  },
};
