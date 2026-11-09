import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Sparkles,
  Printer,
  Trash2,
  Edit3,
  Send,
  CheckCircle2,
  Share2,
  Layers,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { PrepMessage, CeoTabId, NavigationContextIntent } from '../../types/ceoTypes';
import { dialogService } from '../common/CustomDialog';
import { triggerPrint } from '../../utils/printUtils';
import { erpService } from '../../services/erpService';
import { ceoAiService } from '../../services/ceoAiService';

interface PrepReportsViewProps {
  prepMessages: PrepMessage[];
  onSavePrep: (msg: PrepMessage) => Promise<void> | void;
  onDeletePrep: (id: string) => Promise<void> | void;
  navIntent?: NavigationContextIntent | null;
  onClearIntent?: () => void;
  onNavigateTab: (tab: CeoTabId, subView?: string, prefill?: any) => void;
  activeUserName?: string;
}

export const PrepReportsView: React.FC<PrepReportsViewProps> = ({
  prepMessages,
  onSavePrep,
  onDeletePrep,
  navIntent,
  onClearIntent,
  onNavigateTab,
  activeUserName = 'CEO',
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<PrepMessage | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('Toàn công ty MVĐN');
  const [category, setCategory] = useState<'DIRECTIVE' | 'ALIGNMENT' | 'POLICY' | 'MOTIVATION'>('DIRECTIVE');
  const [pointOpening, setPointOpening] = useState('');
  const [reasonWhy, setReasonWhy] = useState('');
  const [exampleEvidence, setExampleEvidence] = useState('');
  const [pointClosing, setPointClosing] = useState('');

  // AI Assistant State
  const [aiIdea, setAiIdea] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Nhận dữ liệu chuyển tiếp 1-Click từ Chuẩn hóa SOP hoặc phân hệ khác để soạn chỉ đạo PREP
  useEffect(() => {
    if (!navIntent || navIntent.tab !== 'prep') return;
    setEditingMsg(null);
    const incomingTitle = navIntent.prefillTitle || '';
    const incomingDesc = navIntent.prefillDescription || '';
    setTitle(incomingTitle);
    setAudience(navIntent.prefillAudience || 'Toàn công ty MVĐN');
    setCategory('DIRECTIVE');
    setPointOpening(
      incomingTitle
        ? `Ban Giám Đốc chính thức yêu cầu triển khai đồng bộ: ${incomingTitle}.`
        : ''
    );
    setReasonWhy(
      'Nhằm chuẩn hóa thao tác vận hành, loại bỏ điểm nghẽn tái diễn và giữ vững cam kết chất lượng - tiến độ đơn hàng.'
    );
    setExampleEvidence(incomingDesc);
    setPointClosing(
      'Yêu cầu Quản lý các bộ phận phổ biến ngay tại đầu ca và nghiêm túc tuân thủ 100% kể từ hôm nay.'
    );
    setAiIdea(
      incomingDesc ? `${incomingTitle}. Chi tiết: ${incomingDesc}` : incomingTitle
    );
    setModalOpen(true);
    onClearIntent?.();
  }, [navIntent, onClearIntent]);

  const openCreateModal = () => {
    setEditingMsg(null);
    setTitle('');
    setAudience('Toàn công ty MVĐN');
    setCategory('DIRECTIVE');
    setPointOpening('');
    setReasonWhy('');
    setExampleEvidence('');
    setPointClosing('');
    setAiIdea('');
    setModalOpen(true);
  };

  const openEditModal = (msg: PrepMessage) => {
    setEditingMsg(msg);
    setTitle(msg.title);
    setAudience(msg.audience);
    setCategory(msg.category);
    setPointOpening(msg.pointOpening);
    setReasonWhy(msg.reasonWhy);
    setExampleEvidence(msg.exampleEvidence);
    setPointClosing(msg.pointClosing);
    setAiIdea('');
    setModalOpen(true);
  };

  const handleAiDraftPrep = async () => {
    if (!aiIdea.trim()) {
      dialogService.toast('Vui lòng nhập ý tưởng hoặc yêu cầu ngắn gọn của CEO.', 'warning');
      return;
    }
    setLoadingAi(true);
    try {
      const prompt = `Bạn là Chuyên gia Truyền thông Điều hành C-Level. Hãy chuyển ý định điều hành sau thành cấu trúc PREP hoàn chỉnh:
Ý định: "${aiIdea}"

Trả về định dạng JSON thuần túy (không bọc markdown backtick) với cấu trúc:
{
  "title": "Tiêu đề ngắn gọn, uy quyền",
  "pointOpening": "Điểm chính (Point): Kết luận hoặc thông điệp rõ ràng ngay câu đầu",
  "reasonWhy": "Lý do (Reason): Căn cứ vì sao điều này quan trọng và cấp thiết",
  "exampleEvidence": "Dẫn chứng (Example): Số liệu hoặc tình huống thực tế chứng minh",
  "pointClosing": "Kêu gọi hành động (Point): Khẳng định lại và chỉ định việc cần làm ngay"
}`;

      const raw = await ceoAiService.chatWithExecutiveAdvisor({
        userMessage: prompt,
        systemContext: 'PREP Communication Generator',
      });

      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.title) setTitle(parsed.title);
      if (parsed.pointOpening) setPointOpening(parsed.pointOpening);
      if (parsed.reasonWhy) setReasonWhy(parsed.reasonWhy);
      if (parsed.exampleEvidence) setExampleEvidence(parsed.exampleEvidence);
      if (parsed.pointClosing) setPointClosing(parsed.pointClosing);

      dialogService.toast('AI đã soạn thảo thông điệp PREP chuẩn hóa!', 'success');
    } catch {
      dialogService.toast('Không thể tải bản thảo AI, vui lòng nhập thủ công.', 'warning');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !pointOpening.trim()) {
      dialogService.toast('Vui lòng nhập tiêu đề và thông điệp mở đầu (Point).', 'warning');
      return;
    }

    const payload: PrepMessage = {
      id: editingMsg ? editingMsg.id : `prep-${Date.now()}`,
      title: title.trim(),
      audience: audience.trim() || 'Toàn công ty MVĐN',
      category,
      pointOpening: pointOpening.trim(),
      reasonWhy: reasonWhy.trim(),
      exampleEvidence: exampleEvidence.trim(),
      pointClosing: pointClosing.trim(),
      publishedToErp: editingMsg?.publishedToErp || false,
      createdAt: editingMsg?.createdAt || new Date().toISOString(),
    };

    await onSavePrep(payload);
    setModalOpen(false);
    dialogService.toast(editingMsg ? 'Đã cập nhật PREP!' : 'Đã tạo báo cáo PREP mới!', 'success');
  };

  const handlePublishToErp = async (msg: PrepMessage) => {
    try {
      await erpService.publishAnnouncement({
        title: `📢 [CHỈ ĐẠO CEO] ${msg.title}`,
        content: `MỤC TIÊU & KẾT LUẬN (Point):\n${msg.pointOpening}\n\nLÝ DO & CĂN CỨ (Reason):\n${msg.reasonWhy}\n\nDẪN CHỨNG & SỐ LIỆU (Example):\n${msg.exampleEvidence}\n\nKÊU GỌI HÀNH ĐỘNG (Point):\n${msg.pointClosing}`,
        category: 'DIRECTIVE',
        targetType: 'ALL',
        targetValue: 'ALL',
        requireAck: true,
        publisherName: activeUserName,
      });

      await onSavePrep({ ...msg, publishedToErp: true });
      dialogService.toast(`Đã ban hành văn bản PREP "${msg.title}" lên bảng tin ERP MVĐN!`, 'success');
    } catch {
      dialogService.toast('Không thể ban hành lên ERP, vui lòng kiểm tra kết nối mạng.', 'warning');
    }
  };

  const handleDelete = async (msg: PrepMessage) => {
    const ok = await dialogService.confirm(
      `Bạn có chắc muốn xóa bản ghi "${msg.title}"?`,
      'Xóa Thông Điệp PREP'
    );
    if (ok) {
      await onDeletePrep(msg.id);
      dialogService.toast('Đã xóa thông điệp PREP!', 'info');
    }
  };

  return (
    <div id="prep-print-section" className="space-y-4">
      {/* THANH THAO TÁC TINH GỌN (Không lặp lại tiêu đề từ Header bar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
            Danh Sách Thông Điệp Điều Hành PREP
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-bold">
            {prepMessages.length} Bản Ghi
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => triggerPrint('prep-print-section', 'ProCEO_PREP_Reports')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In PREP</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 text-white cursor-pointer shadow-xs transition-transform active:scale-95 bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Soạn Thảo PREP Mới</span>
          </button>
        </div>
      </div>

      {/* DANH SÁCH PREP CARDS */}
      <div className="space-y-3">
        {prepMessages.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-slate-300 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700">Chưa có thông điệp PREP nào</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Chuẩn hóa các chỉ đạo, đề xuất và báo cáo để toàn bộ quản lý và nhân sự hiểu đúng trong 30 giây.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 px-3 py-1.5 rounded-xl font-bold text-xs bg-[#14283F] text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C6A66B]" />
              <span>Soạn Thảo PREP Đầu Tiên</span>
            </button>
          </div>
        ) : (
          prepMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3 group hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      msg.category === 'DIRECTIVE'
                        ? 'bg-rose-100 text-rose-800'
                        : msg.category === 'ALIGNMENT'
                        ? 'bg-blue-100 text-blue-800'
                        : msg.category === 'POLICY'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {msg.category}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Đối tượng: <strong className="text-slate-800">{msg.audience}</strong>
                  </span>
                  {msg.publishedToErp && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Đã ban hành ERP
                    </span>
                  )}
                </div>

                {/* Rule 2: Clean Table UI: Action buttons opacity-0 group-hover:opacity-100 */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 self-end sm:self-center">
                  {!msg.publishedToErp && (
                    <button
                      onClick={() => handlePublishToErp(msg)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Ban hành ERP</span>
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(msg)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(msg)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-base text-slate-900">{msg.title}</h3>

              {/* 4 PHẦN PREP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* POINT 1 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="font-black text-[#14283F] text-[10px] uppercase flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-[#14283F] text-white flex items-center justify-center text-[9px]">P</span>
                    Point (Điểm chính / Kết luận mở đầu)
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">{msg.pointOpening}</p>
                </div>

                {/* REASON */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="font-black text-amber-800 text-[10px] uppercase flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px]">R</span>
                    Reason (Lý do / Cơ sở pháp lý / Thực trạng)
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">{msg.reasonWhy}</p>
                </div>

                {/* EXAMPLE */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="font-black text-blue-800 text-[10px] uppercase flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">E</span>
                    Example (Dẫn chứng / Dữ liệu thực tế)
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">{msg.exampleEvidence}</p>
                </div>

                {/* POINT 2 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="font-black text-emerald-800 text-[10px] uppercase flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">P</span>
                    Point (Khẳng định lại / Kêu gọi hành động)
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">{msg.pointClosing}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL SOẠN THẢO PREP */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-[#14283F]">
                {editingMsg ? 'Chỉnh Sửa PREP' : 'Soạn Thảo Thông Điệp / Báo Cáo Chuẩn PREP'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* AI PREP Assistant bar */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#C6A66B]" />
                Trợ lý AI Gemini: Soạn thảo PREP từ ý tưởng nhanh
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiIdea}
                  onChange={(e) => setAiIdea(e.target.value)}
                  placeholder="VD: Yêu cầu xưởng in giảm tỷ lệ lỗi sai màu, tăng ca kíp 2 hoàn thành đơn Flexo..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={handleAiDraftPrep}
                  disabled={loadingAi}
                  className="px-3 py-1.5 rounded-lg bg-[#14283F] text-white font-bold text-xs cursor-pointer hover:bg-[#1E3A5F] shrink-0 disabled:opacity-50"
                >
                  {loadingAi ? 'Đang tạo...' : 'AI Soạn Thảo'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tiêu đề văn bản *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Chỉ đạo kiểm soát chất lượng & tiến độ đơn hàng gấp"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại thông điệp</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="DIRECTIVE">DIRECTIVE – Chỉ đạo điều hành</option>
                    <option value="ALIGNMENT">ALIGNMENT – Đồng bộ mục tiêu</option>
                    <option value="POLICY">POLICY – Quy định & Chính sách</option>
                    <option value="MOTIVATION">MOTIVATION – Động viên & Truyền lửa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Đối tượng tiếp nhận</label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Toàn công ty / Khối Sản xuất / Quản lý cấp trung"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              {/* 4 Ô PREP */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="font-extrabold text-[#14283F] block mb-1">
                    P1 – Point (Kết luận / Thông điệp then chốt mở đầu) *
                  </label>
                  <textarea
                    value={pointOpening}
                    onChange={(e) => setPointOpening(e.target.value)}
                    rows={2}
                    placeholder="Nêu bật kết luận hoặc mệnh lệnh rõ ràng ngay dòng đầu tiên..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="font-extrabold text-amber-800 block mb-1">
                    R – Reason (Lý do / Căn cứ tại sao)
                  </label>
                  <textarea
                    value={reasonWhy}
                    onChange={(e) => setReasonWhy(e.target.value)}
                    rows={2}
                    placeholder="Giải thích nguyên nhân, bối cảnh vì sao cần thực hiện..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-blue-800 block mb-1">
                    E – Example (Dẫn chứng / Dữ liệu thực tế chứng minh)
                  </label>
                  <textarea
                    value={exampleEvidence}
                    onChange={(e) => setExampleEvidence(e.target.value)}
                    rows={2}
                    placeholder="Số liệu cụ thể, ví dụ thực tế hoặc bằng chứng so sánh..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-emerald-800 block mb-1">
                    P2 – Point (Khẳng định lại / Chỉ định hành động tiếp theo)
                  </label>
                  <textarea
                    value={pointClosing}
                    onChange={(e) => setPointClosing(e.target.value)}
                    rows={2}
                    placeholder="Khẳng định thông điệp và giao hành động cụ thể, thời hạn..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#14283F] text-white font-bold cursor-pointer shadow-xs"
                >
                  {editingMsg ? 'Lưu Thay Đổi' : 'Tạo Văn Bản PREP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
