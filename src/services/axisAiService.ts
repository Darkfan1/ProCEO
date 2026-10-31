import { GoogleGenAI, Type } from '@google/genai';
import { MaslowTierKey } from '../types/axisTypes';

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey: apiKey.trim() });
  } catch {
    return null;
  }
};

const MODEL_NAME = 'gemini-2.5-flash';

export const axisAiService = {
  /**
   * 1. Chuẩn hóa yêu cầu giao việc thô thành 5 tiêu chí SMART sắc bén
   */
  refineSmartTask: async (rawIdea: string, assigneeName: string, dueDate: string) => {
    const ai = getAiClient();
    if (ai) {
      try {
        const res = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Bạn là Cố vấn Điều hành CEO (hệ thống AXIS). Hãy chuẩn hóa yêu cầu giao việc sau thành mục tiêu SMART rõ ràng, thực chiến cho doanh nghiệp sản xuất & in ấn tem nhãn:
- Ý tưởng/Yêu cầu gốc: "${rawIdea}"
- Người nhận việc: "${assigneeName || 'Nhân sự phụ trách'}"
- Hạn hoàn thành: "${dueDate}"
Trả về JSON tiếng Việt súc tích, chuyên nghiệp.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                specific: { type: Type.STRING },
                measurable: { type: Type.STRING },
                achievable: { type: Type.STRING },
                relevant: { type: Type.STRING },
                timeBound: { type: Type.STRING },
              },
              required: ['title', 'specific', 'measurable', 'achievable', 'relevant', 'timeBound'],
            },
          },
        });
        if (res.text) return JSON.parse(res.text);
      } catch (e) {
        console.warn('[axisAiService] SMART fallback used:', e);
      }
    }

    // Fallback thông minh khi chưa cấu hình API key hoặc mất mạng
    const clean = rawIdea.trim() || 'Hoàn thành hạng mục trọng tâm được giao';
    return {
      title: clean.length > 65 ? `${clean.slice(0, 62)}...` : clean,
      specific: `Triển khai cụ thể: ${clean} (phụ trách chính: ${assigneeName || 'Nhân sự được giao'}).`,
      measurable: 'Có báo cáo kết quả định lượng rõ ràng, biên bản/hình ảnh nghiệm thu đạt 100% yêu cầu đề ra.',
      achievable: 'Sử dụng nguồn lực, dữ liệu trên ProTrack và phối hợp trực tiếp với bộ phận liên quan.',
      relevant: 'Đóng góp trực tiếp vào mục tiêu chuẩn hóa vận hành, tiến độ giao hàng và chất lượng nhà máy.',
      timeBound: `Hoàn thành dứt điểm chậm nhất ngày ${dueDate}, báo cáo tiến độ qua 3 mốc giám sát.`,
    };
  },

  /**
   * 2. Biên tập ý nháp rời rạc thành cấu trúc diễn đạt PREP (Point - Reason - Example - Point)
   */
  composePrepMessage: async (rawNotes: string, contextType: string) => {
    const ai = getAiClient();
    if (ai) {
      try {
        const res = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Bạn là Chuyên gia Truyền thông Lãnh đạo cho CEO. Hãy chuyển các ý nháp rời rạc sau thành bài diễn đạt theo cấu trúc PREP (Point - Reason - Example - Point) thật đĩnh đạc, gãy gọn, truyền cảm hứng và đi thẳng vào trọng tâm:
- Bối cảnh: ${contextType}
- Ý nháp của CEO: "${rawNotes}"
Trả về JSON tiếng Việt.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                pointStart: { type: Type.STRING },
                reason: { type: Type.STRING },
                example: { type: Type.STRING },
                pointEnd: { type: Type.STRING },
                polishedText: { type: Type.STRING },
              },
              required: ['title', 'pointStart', 'reason', 'example', 'pointEnd', 'polishedText'],
            },
          },
        });
        if (res.text) return JSON.parse(res.text);
      } catch (e) {
        console.warn('[axisAiService] PREP fallback used:', e);
      }
    }

    const clean = rawNotes.trim() || 'Chuẩn hóa kỷ luật phối hợp và kiểm soát tiến độ giữa các công đoạn';
    const p1 = `Tôi quyết định chúng ta cần tập trung thực hiện ngay: ${clean}.`;
    const r = 'Bởi vì sự đồng bộ và chuẩn xác ngay từ khâu đầu tiên là chìa khóa giảm hao hụt thời gian, giữ vững uy tín giao hàng với khách hàng.';
    const ex = 'Thực tế qua theo dõi các lệnh sản xuất gần đây trên hệ thống, những ca làm việc có xác nhận thông tin rõ ràng từ sớm đều đạt năng suất vượt trội và không phát sinh sửa lỗi.';
    const p2 = 'Vì vậy, từ hôm nay tôi đề nghị toàn thể anh chị em nghiêm túc áp dụng nguyên tắc này trong từng đầu việc hàng ngày.';
    return {
      title: clean.length > 55 ? `${clean.slice(0, 55)}...` : clean,
      pointStart: p1,
      reason: r,
      example: ex,
      pointEnd: p2,
      polishedText: `${p1}\n\n${r}\n\n${ex}\n\n${p2}`,
    };
  },

  /**
   * 3. Soạn lời khen ngợi nhân viên tinh tế theo nguyên tắc FFC (Feeling - Fact - Compare)
   */
  composeFfcPraise: async (employeeName: string, rawAchievement: string) => {
    const ai = getAiClient();
    if (ai) {
      try {
        const res = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Bạn là Cố vấn Nhân tâm cho CEO. Hãy soạn lời khen ngợi nhân viên "${employeeName}" dựa trên ghi nhận thực tế: "${rawAchievement}" theo đúng nguyên tắc FFC:
- Feeling (Cảm xúc chân thành, ấm áp của người lãnh đạo)
- Fact (Sự thật, hành vi hoặc con số cụ thể không khen sáo rỗng)
- Compare (So sánh sự tiến bộ vượt bậc hoặc tác động tích cực lan tỏa cho tập thể)
Trả về JSON tiếng Việt tự nhiên, chân thành, không sáo ngữ.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                feeling: { type: Type.STRING },
                fact: { type: Type.STRING },
                compare: { type: Type.STRING },
                finalMessage: { type: Type.STRING },
              },
              required: ['feeling', 'fact', 'compare', 'finalMessage'],
            },
          },
        });
        if (res.text) return JSON.parse(res.text);
      } catch (e) {
        console.warn('[axisAiService] FFC fallback used:', e);
      }
    }

    const feeling = `Anh thực sự rất vui và tự hào khi theo dõi kết quả làm việc của ${employeeName}.`;
    const fact = `Cụ thể là ${rawAchievement || 'sự chủ động, tỉ mỉ hoàn thành xuất sắc khối lượng công việc với độ chính xác rất cao'}.`;
    const compare = `So với giai đoạn trước, tinh thần trách nhiệm này của em đã tạo ra bước tiến rõ rệt, giúp cả dây chuyền vận hành trôi chảy và truyền năng lượng rất tích cực cho anh em xung quanh.`;
    return {
      feeling,
      fact,
      compare,
      finalMessage: `${feeling} ${fact} ${compare} Cảm ơn sự đồng hành của em!`,
    };
  },

  /**
   * 4. Tư vấn gỡ rối động lực nhân sự theo Tháp Maslow + dữ liệu 360° ERP
   */
  diagnoseMaslowMotivation: async (params: {
    employeeName: string;
    symptoms: string;
    bottleneckTier: MaslowTierKey;
    erpSummary: string;
  }) => {
    const tierNames: Record<MaslowTierKey, string> = {
      PHYSIOLOGICAL: 'Tầng 1: Sinh lý, Sức khỏe & Thu nhập cơ bản',
      SAFETY: 'Tầng 2: An toàn, Ổn định công việc & Quy trình rõ ràng',
      BELONGING: 'Tầng 3: Gắn kết đội nhóm & Môi trường thấu hiểu',
      ESTEEM: 'Tầng 4: Được tôn trọng, Ghi nhận thành quả & Vị thế',
      SELF_ACTUALIZATION: 'Tầng 5: Tự thể hiện, Trao quyền & Phát triển sự nghiệp',
    };

    const ai = getAiClient();
    if (ai) {
      try {
        const res = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Bạn là Chuyên gia Tâm lý Quản trị đồng hành cùng CEO. Hãy phân tích trường hợp nhân sự mất động lực sau:
- Nhân sự: ${params.employeeName}
- Dữ liệu thực tế từ ERP: ${params.erpSummary}
- Biểu hiện CEO quan sát thấy: "${params.symptoms}"
- Tầng Maslow đang thiếu hụt mạnh nhất: ${tierNames[params.bottleneckTier]}

Hãy đưa ra kế hoạch can thiệp ngắn gọn, thực tế gồm: (1) Chẩn đoán nguyên nhân ngầm, (2) 3 câu hỏi mở để CEO trò chuyện 1-on-1 không gây phòng vệ, (3) Hành động cụ thể trong 7 ngày tới.`,
        });
        if (res.text) return res.text.trim();
      } catch (e) {
        console.warn('[axisAiService] Maslow fallback used:', e);
      }
    }

    return `• Điểm nghẽn trọng tâm (${tierNames[params.bottleneckTier]}): Nhân sự đang thiếu điểm tựa tâm lý ở tầng nhu cầu này dẫn đến giảm nhiệt huyết.\n• Gợi ý mở lời 1-on-1 (15 phút riêng tư): "Dạo này anh thấy khối lượng công việc của em khá dày, điều gì trong quy trình hoặc phối hợp đang làm em thấy nặng nề nhất?"\n• Hành động 7 ngày tới: Lắng nghe không phán xét, tháo gỡ ngay 1 vướng mắc thực tế và áp dụng nguyên tắc FFC để ghi nhận ngay khi nhân sự có chuyển biến nhỏ đầu tiên.`;
  },

  /**
   * 5. Tổng hợp Ma trận Chiến lược hành động TOWS từ 4 ô SWOT
   */
  generateTowsFromSwot: async (swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }) => {
    const ai = getAiClient();
    if (ai) {
      try {
        const res = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Từ bảng phân tích SWOT sau của doanh nghiệp sản xuất in ấn bao bì/tem nhãn:
- Điểm mạnh (S): ${swot.strengths.join('; ')}
- Điểm yếu (W): ${swot.weaknesses.join('; ')}
- Cơ hội (O): ${swot.opportunities.join('; ')}
- Thách thức (T): ${swot.threats.join('; ')}
Hãy đề xuất 4 mũi nhọn hành động TOWS (SO, WO, ST, WT) ngắn gọn, sắc bén để CEO chuyển hóa thành OKR.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                so: { type: Type.STRING },
                wo: { type: Type.STRING },
                st: { type: Type.STRING },
                wt: { type: Type.STRING },
              },
              required: ['so', 'wo', 'st', 'wt'],
            },
          },
        });
        if (res.text) return JSON.parse(res.text);
      } catch (e) {
        console.warn('[axisAiService] SWOT fallback used:', e);
      }
    }

    return {
      so: 'Tận dụng năng lực sản xuất nhanh và hệ thống ERP thời gian thực để chinh phục nhóm khách hàng doanh nghiệp yêu cầu tiến độ gấp.',
      wo: 'Chuẩn hóa đào tạo OJT và quy trình kiểm soát chất lượng (PDCA) để giảm phụ thuộc cá nhân trước khi mở rộng đơn hàng mới.',
      st: 'Lấy chất lượng ổn định và dịch vụ giao hàng đúng hẹn 98%+ làm rào cản cạnh tranh trước áp lực phá giá thị trường.',
      wt: 'Kiểm soát chặt định mức hao hụt vật tư và tối ưu lịch chạy máy để bảo vệ biên lợi nhuận trong giai đoạn biến động.',
    };
  },

  /**
   * 6. Soạn nhanh khung bài giảng & tình huống đào tạo nội bộ cho CEO
   */
  generateTrainingOutline: async (topic: string, frameworkTag: string, audience: string) => {
    const ai = getAiClient();
    if (ai) {
      try {
        const res = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Hãy thiết kế khung buổi đào tạo nội bộ 30-45 phút do CEO trực tiếp đứng lớp:
- Chủ đề: "${topic}"
- Hệ quy chiếu áp dụng: ${frameworkTag}
- Đối tượng học: ${audience}
Trả về JSON gồm 4 điểm cốt lõi dễ nhớ (keyTakeaways) và 1 bài tập tình huống thực tế tại xưởng/văn phòng (practicalScenario).`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                practicalScenario: { type: Type.STRING },
              },
              required: ['keyTakeaways', 'practicalScenario'],
            },
          },
        });
        if (res.text) return JSON.parse(res.text);
      } catch (e) {
        console.warn('[axisAiService] Training fallback used:', e);
      }
    }

    return {
      keyTakeaways: [
        `Hiểu đúng bản chất cốt lõi của ${frameworkTag} trong công việc hàng ngày, tránh lý thuyết suông.`,
        'Luôn bắt đầu từ mục tiêu đầu ra đo lường được và thời hạn cụ thể.',
        'Chủ động báo cáo sớm tại các mốc 30% - 60% - 90% thay vì đợi tới hạn chót.',
        'Biến mọi sự cố phát sinh thành bài học chuẩn hóa quy trình chung.',
      ],
      practicalScenario: `Tình huống thực hành (10 phút): Một đơn hàng gấp của khách lớn phát sinh nguy cơ trễ tiến độ công đoạn Bế. Học viên chia cặp áp dụng ngay khung ${frameworkTag} để báo cáo lên quản lý trong 60 giây và đề xuất phương án xử lý.`,
    };
  },
};

