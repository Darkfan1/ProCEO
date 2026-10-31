import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Copy,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BookmarkCheck,
  ChevronRight,
  Target,
  RefreshCw,
  Clock,
  TrendingUp,
  MessageSquareQuote,
  Layers,
  Award,
  Grid2x2,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  FrameworkCode,
  ALL_FRAMEWORK_CODES,
  MANAGEMENT_FRAMEWORKS_THEORY,
  FrameworkTheory,
} from '../../data/managementFrameworksTheory';
import { AxisTabId } from '../../types/axisTypes';
import { dialogService } from '../common/CustomDialog';

interface TheoryHandbookTabProps {
  activeFramework: FrameworkCode;
  onSelectFramework: (code: FrameworkCode) => void;
  onNavigate: (tab: AxisTabId) => void;
}

const FRAMEWORK_ICONS: Record<FrameworkCode, React.FC<{ size?: number; className?: string }>> = {
  SMART: Target,
  PDCA: RefreshCw,
  '3-6-9': Clock,
  OKR: TrendingUp,
  PREP: MessageSquareQuote,
  MASLOW: Layers,
  FFC: Award,
  SWOT: Grid2x2,
};

const FRAMEWORK_GROUPS: Array<{
  name: string;
  desc: string;
  codes: FrameworkCode[];
}> = [
  {
    name: '1. Trục Thực Thi & Cải Tiến',
    desc: 'Giao việc chuẩn mực, kiểm soát tiến độ và chấm dứt sự cố lặp lại',
    codes: ['SMART', '3-6-9', 'PDCA'],
  },
  {
    name: '2. Trục Chiến Lược & Định Hướng',
    desc: 'Hội tụ nguồn lực công ty và chuyển hóa vị thế thành chiến lược',
    codes: ['OKR', 'SWOT'],
  },
  {
    name: '3. Trục Nhân Tâm & Động Lực',
    desc: 'Bắt đúng bệnh động lực và truyền cảm hứng bùng nổ với chi phí 0 đồng',
    codes: ['MASLOW', 'FFC'],
  },
  {
    name: '4. Trục Giao Tiếp & Chỉ Đạo',
    desc: 'Diễn đạt sắc bén, ngắn gọn, đi thẳng vào bản chất và dứt điểm lệnh hành động',
    codes: ['PREP'],
  },
];

export const TheoryHandbookTab: React.FC<TheoryHandbookTabProps> = ({
  activeFramework,
  onSelectFramework,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTab, setContentTab] = useState<
    'PILLARS' | 'STEPS' | 'EXAMPLE' | 'QUESTIONS' | 'CHEATSHEET'
  >('PILLARS');

  const currentTheory: FrameworkTheory = useMemo(() => {
    return MANAGEMENT_FRAMEWORKS_THEORY[activeFramework] || MANAGEMENT_FRAMEWORKS_THEORY.SMART;
  }, [activeFramework]);

  const filteredCodes = useMemo(() => {
    if (!searchQuery.trim()) return ALL_FRAMEWORK_CODES;
    const q = searchQuery.toLowerCase();
    return ALL_FRAMEWORK_CODES.filter((code) => {
      const item = MANAGEMENT_FRAMEWORKS_THEORY[code];
      return (
        item.shortName.toLowerCase().includes(q) ||
        item.fullName.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.mantra.toLowerCase().includes(q) ||
        item.essence.toLowerCase().includes(q) ||
        item.coreComponents.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.meaning.toLowerCase().includes(q) ||
            c.detail.toLowerCase().includes(q)
        )
      );
    });
  }, [searchQuery]);

  const handleCopySummary = () => {
    const t = currentTheory;
    const text =
      `📖 CẨM NANG QUẢN TRỊ CEO: ${t.fullName.toUpperCase()}\n` +
      `💡 Triết lý: "${t.mantra}"\n\n` +
      `🎯 Bản chất: ${t.essence}\n\n` +
      `📌 Khi nào áp dụng: ${t.whenToUse}\n\n` +
      `🔹 Các trụ cột cốt lõi:\n` +
      t.coreComponents.map((c) => `  • [${c.key}] ${c.name}: ${c.meaning} — ${c.detail}`).join('\n') +
      `\n\n❓ Bộ câu hỏi vàng của CEO:\n` +
      t.goldenQuestions.map((q, i) => `  ${i + 1}. ${q}`).join('\n') +
      `\n\n(Trích từ Trục Điều Phối Quản Trị AXIS CEO OS)`;

    navigator.clipboard.writeText(text);
    dialogService.toast(`Đã sao chép tóm tắt lý thuyết "${t.shortName}" vào Clipboard!`);
  };

  const handleGoToTool = () => {
    if (currentTheory.targetTab) {
      onNavigate(currentTheory.targetTab);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── TOP HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#9D772B]">
            <BookOpen size={14} />
            <span>Kho Tri Thức Điều Hành Doanh Nghiệp</span>
          </div>
          <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[#0C1B2E] tracking-tight mt-0.5">
            Thư Viện Lý Thuyết & Cẩm Nang Quản Trị Thực Chiến
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Hệ thống 8 phương pháp chuẩn quốc tế dành riêng cho CEO để xem lại bản chất, công thức thực thi và bộ câu hỏi chất vấn.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Quick Search Input */}
          <div className="relative w-64 sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo từ khóa (30%, 5-Why, KR...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C1B2E]/20 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            title="Sao chép tóm tắt phương pháp đang xem"
          >
            <Copy size={14} className="text-[#C69C47]" />
            <span className="hidden sm:inline">Copy tóm tắt</span>
          </button>
        </div>
      </div>

      {/* ─── 8 FRAMEWORKS SELECTOR GRID ───────────────────────────────────────── */}
      <div className="axis-card p-4 sm:p-5 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-extrabold text-[#0C1B2E] uppercase tracking-wider flex items-center gap-1.5">
            <span>Chọn phương pháp cần tra cứu (8 Hệ Quy Chiếu Cốt Lõi):</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Đang hiển thị {filteredCodes.length}/8 phương pháp
          </span>
        </div>

        {/* 4 Groups or Grid of 8 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {ALL_FRAMEWORK_CODES.map((code) => {
            const item = MANAGEMENT_FRAMEWORKS_THEORY[code];
            const Icon = FRAMEWORK_ICONS[code];
            const isSelected = activeFramework === code;
            const isMatch = filteredCodes.includes(code);

            return (
              <button
                key={code}
                onClick={() => {
                  onSelectFramework(code);
                  setContentTab('PILLARS');
                }}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between border relative overflow-hidden group ${
                  isSelected
                    ? 'bg-[#0C1B2E] text-white border-[#0C1B2E] shadow-md ring-2 ring-[#C69C47]/40'
                    : isMatch
                    ? 'bg-slate-50/80 hover:bg-white hover:border-slate-300 border-slate-200 text-slate-800'
                    : 'opacity-40 bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#C69C47] text-[#0C1B2E]'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Icon size={14} className="font-bold" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-white/15 text-[#E5C472]'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {code}
                  </span>
                </div>

                <div>
                  <div className="text-[12.5px] font-bold leading-tight truncate">
                    {item.shortName}
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {item.targetTabName.split(' ')[0]}
                  </div>
                </div>

                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#C69C47]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── DETAILED THEORY WORKSPACE FOR SELECTED FRAMEWORK ────────────────── */}
      <div className="axis-card p-0 bg-white overflow-hidden shadow-sm border border-slate-200/90">
        {/* Framework Hero Banner */}
        <div className="p-6 sm:p-7 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-amber-50/30">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${currentTheory.themeColor.badgeBg} ${currentTheory.themeColor.badgeText} border ${currentTheory.themeColor.border}`}
                >
                  {currentTheory.code}
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-600">
                  {currentTheory.origin}
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-bold text-amber-800">
                  Phục vụ: {currentTheory.targetTabName}
                </span>
              </div>

              <h2 className="text-xl sm:text-[24px] font-extrabold text-[#0C1B2E] tracking-tight">
                {currentTheory.fullName}
              </h2>
              <p className="text-xs sm:text-[13.5px] text-slate-600 font-medium leading-relaxed">
                {currentTheory.subtitle}
              </p>

              {/* Mantra Quote Box */}
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
                <Sparkles size={17} className="text-[#9D772B] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9D772B]">
                    Triết lý cốt lõi của CEO:
                  </span>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#0C1B2E] italic mt-0.5 leading-snug">
                    "{currentTheory.mantra}"
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 shrink-0">
              <button
                onClick={handleGoToTool}
                className="px-4 py-2.5 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span>Mở công cụ {currentTheory.shortName}</span>
                <ArrowRight size={14} className="text-[#E5C472]" />
              </button>

              <button
                onClick={handleCopySummary}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={13} />
                <span>Sao chép tóm tắt</span>
              </button>
            </div>
          </div>

          {/* Sub-Tabs Navigation Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-5 border-t border-slate-200/70 mt-5 text-xs font-bold">
            <button
              onClick={() => setContentTab('PILLARS')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                contentTab === 'PILLARS'
                  ? 'bg-[#0C1B2E] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              1. Nguyên Lý & Trụ Cột ({currentTheory.coreComponents.length})
            </button>
            <button
              onClick={() => setContentTab('STEPS')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                contentTab === 'STEPS'
                  ? 'bg-[#0C1B2E] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              2. Quy Trình 4 Bước Cho CEO
            </button>
            <button
              onClick={() => setContentTab('EXAMPLE')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                contentTab === 'EXAMPLE'
                  ? 'bg-[#0C1B2E] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              3. Ví Dụ Mẫu & So Sánh (Sai vs Chuẩn)
            </button>
            <button
              onClick={() => setContentTab('QUESTIONS')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                contentTab === 'QUESTIONS'
                  ? 'bg-[#0C1B2E] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              4. Bộ Câu Hỏi Vàng & Bẫy Sai
            </button>
            <button
              onClick={() => setContentTab('CHEATSHEET')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                contentTab === 'CHEATSHEET'
                  ? 'bg-[#0C1B2E] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              5. Sổ Tay Ghi Nhớ Bỏ Túi
            </button>
          </div>
        </div>

        {/* Sub-Tab Dynamic Content */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* TAB 1: CORE PILLARS */}
          {contentTab === 'PILLARS' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                <span className="font-bold text-[#0C1B2E]">🎯 Bản chất quản trị: </span>
                {currentTheory.essence}
              </div>

              {/* Special Structured Layout for 3-6-9 Framework */}
              {currentTheory.code === '3-6-9' ? (
                <div className="space-y-7">
                  {/* Section 1: 3 Formulas */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs font-black flex items-center justify-center">
                        3
                      </span>
                      <h3 className="text-[14.5px] font-extrabold text-[#0C1B2E] uppercase tracking-wide">
                        3 Công Thức Cốt Lõi (Đòn Bẩy Thực Thi Sau Họp)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {currentTheory.coreComponents
                        .filter((c) => c.key.startsWith('CT-'))
                        .map((c) => (
                          <div
                            key={c.key}
                            className="p-4.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-xs space-y-2.5 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md bg-[#0C1B2E] text-[#E5C472] font-extrabold text-[11px]">
                                  {c.key}
                                </span>
                              </div>
                              <h4 className="text-[14px] font-bold text-[#0C1B2E]">{c.name}</h4>
                              <p className="text-xs sm:text-[12.5px] font-semibold text-amber-950">
                                📌 "{c.meaning}"
                              </p>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {c.detail}
                              </p>
                            </div>
                            <div className="p-2 rounded-xl bg-white/90 border border-amber-200/70 text-[11px] text-amber-900 font-medium">
                              <strong>Mẹo cho CEO: </strong> {c.tip}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Section 2: 6 Steps */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-600 text-white text-xs font-black flex items-center justify-center">
                        6
                      </span>
                      <h3 className="text-[14.5px] font-extrabold text-[#0C1B2E] uppercase tracking-wide">
                        6 Bước Tổ Chức Cuộc Họp Chuẩn Mực
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {currentTheory.coreComponents
                        .filter((c) => c.key.startsWith('B-'))
                        .map((c) => (
                          <div
                            key={c.key}
                            className="p-4.5 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 transition-all shadow-xs space-y-2.5 flex flex-col justify-between"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 font-extrabold text-xs flex items-center justify-center">
                                  {c.key}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500">
                                  {c.meaning}
                                </span>
                              </div>
                              <h4 className="text-[13.5px] font-bold text-[#0C1B2E]">{c.name}</h4>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {c.detail}
                              </p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                              <strong className="text-sky-800">Quy tắc thực hành: </strong> {c.tip}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Section 3: 9 Mandatory Principles */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                        9
                      </span>
                      <h3 className="text-[14.5px] font-extrabold text-[#0C1B2E] uppercase tracking-wide">
                        9 Nguyên Tắc Bắt Buộc Của Cuộc Họp (Kỷ Luật Thép)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {currentTheory.coreComponents
                        .filter((c) => c.key.startsWith('NT-'))
                        .map((c) => (
                          <div
                            key={c.key}
                            className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 hover:border-emerald-300 transition-all shadow-xs space-y-2 flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-extrabold text-[10.5px]">
                                  {c.key}
                                </span>
                              </div>
                              <h4 className="text-[13px] font-bold text-[#0C1B2E]">{c.name}</h4>
                              <p className="text-[11.5px] font-medium text-emerald-900">
                                • {c.meaning}
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {c.detail}
                              </p>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-emerald-200 text-[11px] text-emerald-950 font-medium">
                              <strong>Lưu ý: </strong> {c.tip}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Grid for other frameworks */
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Phân tích chi tiết từng trụ cột cấu thành:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentTheory.coreComponents.map((c) => (
                      <div
                        key={c.key}
                        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-xs space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-[#0C1B2E] text-[#E5C472] font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                {c.key}
                              </span>
                              <h3 className="text-[14.5px] font-bold text-[#0C1B2E]">{c.name}</h3>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                              {c.meaning}
                            </span>
                          </div>

                          <p className="text-xs sm:text-[12.5px] text-slate-700 leading-relaxed">
                            {c.detail}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2 text-[11.5px] text-amber-900 font-medium">
                          <Sparkles size={13} className="text-[#9D772B] shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-bold text-[#9D772B]">Mẹo cho CEO: </strong>
                            {c.tip}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/70 text-xs text-blue-900 leading-relaxed">
                <span className="font-bold">📌 Khi nào CEO cần áp dụng phương pháp này: </span>
                {currentTheory.whenToUse}
              </div>
            </div>
          )}

          {/* TAB 2: STEP BY STEP EXECUTION */}
          {contentTab === 'STEPS' && (
            <div className="space-y-5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Lộ trình 4 bước chuẩn hóa dành cho người đứng đầu:
              </div>

              <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {currentTheory.ceoStepByStep.map((s) => (
                  <div key={s.step} className="relative space-y-2">
                    <div className="absolute -left-7 top-0 w-7 h-7 rounded-full bg-[#0C1B2E] text-[#E5C472] font-bold text-xs flex items-center justify-center shadow-sm">
                      {s.step}
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
                      <h4 className="text-[14.5px] font-bold text-[#0C1B2E]">{s.title}</h4>
                      <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                        {s.action}
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span>Kết quả đầu ra (Deliverable): {s.deliverable}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REAL EXAMPLES */}
          {contentTab === 'EXAMPLE' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-100 text-xs sm:text-[13px] font-semibold text-slate-800">
                🏢 Bối cảnh thực tế tại doanh nghiệp: {currentTheory.realisticExample.context}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bad Sample */}
                <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle size={15} />
                    <span>Cách làm sai / Thường gặp ở doanh nghiệp</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-rose-200 text-xs sm:text-[12.5px] text-rose-950 italic leading-relaxed">
                    "{currentTheory.realisticExample.badSample}"
                  </div>
                  <div className="text-[12px] text-rose-800 font-medium">
                    <strong>Tại sao chưa đạt: </strong>
                    {currentTheory.realisticExample.badReason}
                  </div>
                </div>

                {/* Good Sample */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 size={15} />
                    <span>Cách làm chuẩn mực của CEO</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-xs sm:text-[12.5px] text-emerald-950 font-medium leading-relaxed whitespace-pre-line">
                    {currentTheory.realisticExample.goodSample}
                  </div>
                </div>
              </div>

              {/* Good Breakdown */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bóc tách vì sao cách làm này đạt hiệu quả tối ưu:
                </div>
                <ul className="space-y-2">
                  {currentTheory.realisticExample.goodBreakdown.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-[12.5px] text-slate-700 flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C69C47] shrink-0 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: GOLDEN QUESTIONS & PITFALLS */}
          {contentTab === 'QUESTIONS' && (
            <div className="space-y-6">
              {/* Golden Questions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#9D772B] uppercase tracking-wider">
                  <HelpCircle size={15} />
                  <span>Bộ câu hỏi vàng CEO dùng để soi xét & chất vấn cấp dưới:</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {currentTheory.goldenQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#0C1B2E] text-[#E5C472] font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-[13.5px] font-bold text-[#0C1B2E] leading-relaxed pt-0.5">
                        "{q}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Pitfalls */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
                  <AlertTriangle size={15} />
                  <span>Các cạm bẫy sai lầm kinh điển cần triệt tiêu:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {currentTheory.commonPitfalls.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5"
                    >
                      <div className="text-xs sm:text-[12.5px] text-rose-700 font-semibold flex items-start gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold shrink-0">
                          Bẫy sai:
                        </span>
                        <span>{p.bad}</span>
                      </div>
                      <div className="text-xs sm:text-[12.5px] text-emerald-800 font-semibold flex items-start gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                          Cách sửa:
                        </span>
                        <span>{p.fix}</span>
                      </div>
                      <div className="text-[11.5px] text-slate-500 italic pl-10">
                        Căn nguyên: {p.why}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CEO CHEATSHEET */}
          {contentTab === 'CHEATSHEET' && (
            <div className="space-y-5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sổ tay ghi nhớ nhanh cho người đứng đầu:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentTheory.ceoCheatSheet.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-3.5"
                  >
                    <BookmarkCheck size={20} className="text-[#C69C47] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                        {item.category}
                      </div>
                      <div className="text-sm font-bold text-[#0C1B2E] mt-1.5 leading-relaxed">
                        {item.takeaway}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#E5C472] flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Khuyến nghị thực thi từ AXIS CEO OS:</span>
                </div>
                <p className="text-xs sm:text-[12.5px] text-slate-300 leading-relaxed">
                  Lý thuyết chỉ có giá trị khi được đưa vào nhịp điều hành hàng ngày. Hãy tận dụng các
                  công cụ thực thi tích hợp sẵn trên hệ thống (Giao việc SMART, Lịch giám sát tiến độ, Vòng lặp
                  PDCA, Kỷ luật Họp 3-6-9, Bảng OKR, Ma trận SWOT, Tháp Maslow, Lời khen FFC, Văn bản PREP) để tự động
                  hóa văn hóa quản trị cho toàn bộ đội ngũ.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleGoToTool}
                    className="px-4 py-2 rounded-xl bg-[#C69C47] hover:bg-[#d8b560] text-[#0C1B2E] text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Mở công cụ thực hành của {currentTheory.shortName} ngay</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

