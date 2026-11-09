import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Shield,
  Target,
  RefreshCw,
  Users,
  Compass,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { ceoAiService } from '../../services/ceoAiService';
import { dialogService } from '../common/CustomDialog';
import { SmartTask, PdcaCycle, Meeting369, OkrObjective } from '../../types/ceoTypes';

interface AiCopilotViewProps {
  smartTasks: SmartTask[];
  pdcaCycles: PdcaCycle[];
  meetings: Meeting369[];
  okrs: OkrObjective[];
  activeUserName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
}

export const AiCopilotView: React.FC<AiCopilotViewProps> = ({
  smartTasks,
  pdcaCycles,
  meetings,
  okrs,
  activeUserName = 'CEO',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'AI',
      text: `Xin chào ${activeUserName}! Tôi là Trợ lý AI C-Level ProCEO. Tôi nắm giữ bức tranh toàn cảnh về ${okrs.length} OKR chiến lược, ${smartTasks.length} nhiệm vụ SMART, ${pdcaCycles.length} chu trình cải tiến PDCA và lịch họp 3-6-9. Hãy hỏi tôi về việc ra quyết định, chẩn đoán điểm nghẽn hoặc soạn thảo văn bản điều hành.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    {
      label: 'Chẩn đoán rủi ro SMART',
      icon: Target,
      prompt: 'Phân tích các mục tiêu SMART đang có nguy cơ trễ hạn và đề xuất biện pháp xử lý cho CEO.',
    },
    {
      label: 'Đánh giá chu trình PDCA',
      icon: RefreshCw,
      prompt: 'Tổng hợp tình hình các chu trình cải tiến PDCA hiện tại, chu trình nào cần tiến hành chuẩn hóa SOP ngay?',
    },
    {
      label: 'Chuẩn bị Họp 3-6-9',
      icon: Users,
      prompt: 'Gợi ý cấu trúc chương trình họp 3-6-9 trong 45 phút để giải quyết dứt điểm các vướng mắc vận hành xưởng.',
    },
    {
      label: 'Soạn thảo PREP',
      icon: FileText,
      prompt: 'Soạn thảo một thông điệp điều hành chuẩn PREP truyền cảm hứng và yêu cầu tuân thủ kỷ luật giao hàng đúng hẹn.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const activeTasksCount = smartTasks.filter((t) => t.status !== 'DONE').length;
      const overdueTasksCount = smartTasks.filter((t) => t.status !== 'DONE' && t.dueDate < new Date().toISOString().slice(0, 10)).length;
      const activePdcaCount = pdcaCycles.filter((p) => p.phase !== 'STANDARDIZED').length;

      const systemContext = `Hệ thống ProCEO - Executive Management Copilot.
Dữ liệu doanh nghiệp thực tế:
- Mục tiêu SMART: ${activeTasksCount} đang mở (${overdueTasksCount} quá hạn).
- Chu trình PDCA: ${activePdcaCount} đang tiến hành cải tiến.
- OKR chiến lược: ${okrs.length} Objective đang thực thi.
- Họp 3-6-9: ${meetings.length} cuộc họp trong hệ thống.
Người dùng hiện tại: ${activeUserName} (Giám đốc điều hành).`;

      const aiResponse = await ceoAiService.chatWithExecutiveAdvisor({
        userMessage: text.trim(),
        systemContext,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      dialogService.toast('Không thể kết nối đến trợ lý AI Copilot, vui lòng thử lại.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* THANH TRẠNG THÁI AI (Không lặp lại tiêu đề từ Header bar) */}
      <div className="flex items-center justify-between gap-3 text-xs pb-1 no-print">
        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
          Chủ Đề Tham Mưu Nhanh
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-white/80 border border-slate-200 text-slate-700 font-bold flex items-center gap-1.5 shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dữ liệu thực tế: Đồng bộ trực tiếp</span>
        </span>
      </div>

      {/* QUICK PROMPTS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickPrompts.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={loading}
              className="p-2.5 rounded-xl glass-liquid hover:bg-white text-left transition-all cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-slate-700">
                <Icon className="w-3.5 h-3.5 text-slate-600" />
                <span className="truncate">{qp.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{qp.prompt}</p>
            </button>
          );
        })}
      </div>

      {/* CHAT MESSAGES DISPLAY */}
      <div className="glass-liquid flex flex-col h-[520px] overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                m.sender === 'USER' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'USER'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                {m.sender === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-600" />}
              </div>

              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed space-y-1 ${
                  m.sender === 'USER'
                    ? 'bg-slate-900 text-white rounded-tr-none shadow-xs'
                    : 'bg-white/90 text-slate-800 border border-slate-200/90 rounded-tl-none whitespace-pre-line shadow-2xs'
                }`}
              >
                <div>{m.text}</div>
                <div
                  className={`text-[9.5px] font-mono text-right ${
                    m.sender === 'USER' ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-2 italic">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
              <span>AI Copilot đang phân tích dữ liệu điều hành và soạn thảo khuyến nghị...</span>
            </div>
          )}
        </div>

        {/* INPUT BAR */}
        <div className="p-3 border-t border-slate-200/80 bg-white/60 flex gap-2 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Đặt câu hỏi hoặc chỉ định công việc cho AI Executive Copilot..."
            disabled={loading}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-slate-400 shadow-2xs"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
