import React, { useEffect } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
} from 'lucide-react';
import {
  ALL_FRAMEWORK_CODES,
  FrameworkCode,
  MANAGEMENT_FRAMEWORKS_THEORY,
} from '../../data/managementFrameworksTheory';
import { dialogService } from './CustomDialog';

interface QuickTheoryDrawerProps {
  isOpen: boolean;
  code: FrameworkCode;
  onSelectCode: (code: FrameworkCode) => void;
  onClose: () => void;
  onOpenFullTab: (code: FrameworkCode) => void;
}

export const QuickTheoryDrawer: React.FC<QuickTheoryDrawerProps> = ({
  isOpen,
  code,
  onSelectCode,
  onClose,
  onOpenFullTab,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const theory = MANAGEMENT_FRAMEWORKS_THEORY[code] || MANAGEMENT_FRAMEWORKS_THEORY.SMART;

  const copyQuickCheat = () => {
    const text =
      `📖 ${theory.fullName}\n` +
      `💡 "${theory.mantra}"\n\n` +
      theory.coreComponents.map((c) => `• [${c.key}] ${c.name}: ${c.meaning}`).join('\n') +
      `\n\n❓ Câu hỏi kiểm tra của CEO:\n` +
      theory.goldenQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(text);
    dialogService.toast(`Đã sao chép khung tóm tắt ${theory.shortName}!`);
  };

  return (
    <div className="fixed inset-0 z-[65] flex justify-end bg-slate-900/25 backdrop-blur-[1.5px]">
      <div className="flex-1" onClick={onClose} />
      <aside className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Top Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-[#0C1B2E] text-white shrink-0">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#E5C472]">
              <BookOpen size={12} />
              <span>Tra cứu nhanh (Giữ nguyên màn hình đang làm việc)</span>
            </div>
            <h3 className="text-[16px] font-extrabold truncate mt-0.5">{theory.fullName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
            title="Đóng ngăn kéo (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Framework Switcher Pills */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/90 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {ALL_FRAMEWORK_CODES.map((c) => {
            const active = c === code;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onSelectCode(c)}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#0C1B2E] text-[#F3DA99]'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Mantra */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#9D772B]">
              <Sparkles size={12} />
              <span>Tư duy gốc cho CEO</span>
            </div>
            <p className="text-[13.5px] font-bold text-[#0C1B2E] leading-snug">
              “{theory.mantra}”
            </p>
            <p className="text-[12px] text-slate-600 leading-relaxed">{theory.essence}</p>
          </div>

          {/* Core Components / Formulas */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#0C1B2E]">
              Cấu trúc cốt lõi ({theory.coreComponents.length} phần)
            </h4>
            <div className="space-y-2">
              {theory.coreComponents.map((comp, idx) => (
                <div
                  key={`${comp.key}-${idx}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#0C1B2E] text-[#F3DA99] text-[10.5px] font-extrabold">
                      {comp.key}
                    </span>
                    <span className="text-[13px] font-bold text-[#0C1B2E]">{comp.name}</span>
                  </div>
                  <p className="text-[12px] font-semibold text-slate-700">{comp.meaning}</p>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-line">
                    {comp.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Golden Questions */}
          <div className="p-4 rounded-2xl bg-[#0C1B2E]/[0.03] border border-[#0C1B2E]/10 space-y-2">
            <div className="flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-wider text-[#9D772B]">
              <HelpCircle size={13} />
              <span>Câu hỏi phản biện của CEO khi áp dụng</span>
            </div>
            <ul className="space-y-1.5">
              {theory.goldenQuestions.map((q, i) => (
                <li key={i} className="text-[12.5px] text-slate-700 flex items-start gap-2">
                  <span className="font-bold text-[#9D772B] shrink-0">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Execution Steps */}
          <div className="space-y-2">
            <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#0C1B2E]">
              Các bước thực hành nhanh
            </h4>
            <div className="space-y-2">
              {theory.ceoStepByStep.map((s) => (
                <div
                  key={s.step}
                  className="p-3 rounded-xl border border-slate-200/80 flex items-start gap-2.5"
                >
                  <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-[12px] space-y-0.5">
                    <div className="font-bold text-[#0C1B2E]">
                      Bước {s.step}: {s.title}
                    </div>
                    <div className="text-slate-600">{s.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={copyQuickCheat}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-[12px] font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Copy size={13} />
            <span>Copy tóm tắt</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenFullTab(code)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-[12px] font-semibold text-[#0C1B2E] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Đọc đầy đủ & Ví dụ mẫu</span>
              <ExternalLink size={13} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#0C1B2E] hover:bg-[#162B47] text-white text-[12px] font-semibold cursor-pointer"
            >
              Quay lại làm việc
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

