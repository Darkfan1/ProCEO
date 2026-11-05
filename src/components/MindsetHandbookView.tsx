import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  X,
  Compass,
  Lightbulb,
  Layers,
  Search,
  Printer,
  Copy,
  Check,
  Bookmark,
  GraduationCap,
  FileText,
  Scale,
  History,
  Network,
  PenTool,
  Save,
} from 'lucide-react';
import {
  CEO_MINDSET_FRAMEWORKS,
  FrameworkCode,
  MindsetFrameworkDoc,
  getFrameworkByCode,
  MEETING_369_FORMULAS,
  MEETING_369_SIX_STEPS,
  MEETING_369_NINE_PRINCIPLES,
} from '../data/ceoMindsetData';
import { CeoTabId } from '../types/ceoTypes';
import { triggerPrint } from '../utils/printUtils';
import { dialogService } from './common/CustomDialog';

interface MindsetHandbookTabProps {
  selectedCode: FrameworkCode;
  onSelectCode: (code: FrameworkCode) => void;
  onApplyFramework: (tab: CeoTabId, subView?: string) => void;
}

type LibraryCategoryFilter = 'ALL' | 'EXECUTION' | 'MEETING_KAIZEN' | 'STRATEGY' | 'PEOPLE';

type ReaderSectionId = 'ALL_SECTIONS' | 'ACADEMIC' | 'METHODOLOGY' | 'TEMPLATES' | 'CASESTUDY';

const NOTES_STORAGE_KEY = 'proceo_library_ceo_notes_v1';
const BOOKMARKS_STORAGE_KEY = 'proceo_library_bookmarks_v1';

function buildPrintableLibraryHtml(doc: MindsetFrameworkDoc, ceoNote: string): string {
  const pillarsHtml = doc.pillars
    .map(
      (p) => `
      <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; page-break-inside: avoid;">
        <div style="font-weight: 700; font-size: 13px; color: #0f172a;">[${p.key}] ${p.label} — <span style="font-weight: 400; color: #475569;">${p.subtitle}</span></div>
        <div style="font-size: 12px; color: #334155; margin-top: 4px;">${p.description}</div>
        <div style="font-size: 11.5px; color: #1e293b; margin-top: 6px;"><strong>• Câu hỏi kiểm tra CEO:</strong> <em>"${p.ceoQuestion}"</em></div>
        <div style="font-size: 11.5px; color: #0f766e; margin-top: 3px;"><strong>• Ứng dụng thực tế MVĐN:</strong> ${p.exampleAtMvdn}</div>
      </div>`
    )
    .join('');

  const sectionsHtml = doc.detailedSections
    .map(
      (sec) => `
      <div style="margin-bottom: 14px; page-break-inside: avoid;">
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">${sec.title}</h3>
        <p style="font-size: 12px; color: #334155; margin: 0 0 6px 0; line-height: 1.55;">${sec.content}</p>
        ${
          sec.bulletPoints
            ? `<ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #1e293b; line-height: 1.55;">
                ${sec.bulletPoints.map((b) => `<li style="margin-bottom: 4px;">${b}</li>`).join('')}
               </ul>`
            : ''
        }
      </div>`
    )
    .join('');

  const comparisonRowsHtml = doc.comparisonTable.rows
    .map(
      (r) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 7px; font-weight: 600; font-size: 11.5px; width: 24%;">${r.criterion}</td>
        <td style="border: 1px solid #cbd5e1; padding: 7px; font-size: 11.5px; color: #7f1d1d; width: 38%;">${r.leftValue}</td>
        <td style="border: 1px solid #cbd5e1; padding: 7px; font-size: 11.5px; color: #064e3b; font-weight: 500; width: 38%;">${r.rightValue}</td>
      </tr>`
    )
    .join('');

  const templatesHtml = doc.standardTemplates
    .map(
      (tpl) => `
      <div style="margin-bottom: 10px; padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; page-break-inside: avoid;">
        <div style="font-weight: 700; font-size: 12.5px; color: #0f172a;">${tpl.name}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Khi sử dụng: ${tpl.usageWhen}</div>
        <pre style="white-space: pre-wrap; font-family: inherit; font-size: 11.5px; color: #0f172a; margin: 0; line-height: 1.5;">${tpl.templateText}</pre>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${doc.docNumber} - ${doc.fullTitle}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.5; margin: 0; }
    h1 { font-size: 19px; margin: 4px 0 6px 0; color: #0f172a; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em; color: #1e293b; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-top: 16px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; page-break-inside: avoid; }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px;">
    <div>
      <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">THƯ VIỆN TÀI LIỆU QUẢN TRỊ ĐIỀU HÀNH PROCEO • MÃ VẠCH ĐỒNG NAI (MVĐN)</div>
      <h1>${doc.fullTitle}</h1>
      <div style="font-size: 12px; color: #334155;">Mã tài liệu: <strong>${doc.docNumber}</strong> • Phân mục: <strong>${doc.category}</strong></div>
    </div>
  </div>

  <div style="padding: 10px 12px; background: #f1f5f9; border-left: 4px solid #0f172a; font-size: 12px; margin-bottom: 12px;">
    <div><strong>Tác giả & Nguồn gốc học thuật:</strong> ${doc.originAndHistory.author}</div>
    <div style="margin-top: 3px;"><strong>Công trình gốc:</strong> ${doc.originAndHistory.yearAndSource}</div>
    <div style="margin-top: 6px;"><strong>Triết lý cốt lõi của CEO:</strong> ${doc.corePhilosophy}</div>
  </div>

  <h2>I. Nguồn Gốc Lịch Sử & Nền Tảng Lý Thuyết Quản Trị</h2>
  <p style="font-size: 12px; color: #334155; margin: 0 0 8px 0;"><strong>Bối cảnh ra đời:</strong> ${doc.originAndHistory.historicalContext}</p>
  <p style="font-size: 12px; color: #334155; margin: 0 0 8px 0;"><strong>Cơ chế khoa học:</strong> ${doc.theoreticalFoundation.academicEssence}</p>
  <p style="font-size: 12px; color: #0f172a; margin: 0 0 8px 0;"><strong>Công thức / Mô hình cốt lõi:</strong> ${doc.theoreticalFoundation.formulaOrModel}</p>

  <h2>II. Phân Tích Chuyên Sâu & Phương Pháp Triển Khai</h2>
  ${sectionsHtml}

  <h2>III. Cấu Trúc Các Thành Tố & Câu Hỏi Phản Tư Dành Cho CEO</h2>
  ${pillarsHtml}

  <h2>IV. ${doc.comparisonTable.title}</h2>
  <table>
    <thead>
      <tr style="background: #f1f5f9;">
        <th style="border: 1px solid #cbd5e1; padding: 7px; text-align: left; font-size: 11.5px;">Tiêu chí đối sánh</th>
        <th style="border: 1px solid #cbd5e1; padding: 7px; text-align: left; font-size: 11.5px;">${doc.comparisonTable.leftHeader}</th>
        <th style="border: 1px solid #cbd5e1; padding: 7px; text-align: left; font-size: 11.5px;">${doc.comparisonTable.rightHeader}</th>
      </tr>
    </thead>
    <tbody>
      ${comparisonRowsHtml}
    </tbody>
  </table>

  <h2>V. Biểu Mẫu Áp Dụng Chuẩn Dành Cho CEO & Quản Lý</h2>
  ${templatesHtml}

  ${
    ceoNote.trim()
      ? `<h2>VI. Ghi Chú Điều Hành Riêng Của CEO</h2>
         <div style="padding: 10px; border: 1px dashed #64748b; font-size: 12px; white-space: pre-wrap;">${ceoNote}</div>`
      : ''
  }
</body>
</html>`;
}

export const MindsetHandbookTab: React.FC<MindsetHandbookTabProps> = ({
  selectedCode,
  onSelectCode,
  onApplyFramework,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LibraryCategoryFilter>('ALL');
  const [activeSection, setActiveSection] = useState<ReaderSectionId>('ALL_SECTIONS');
  const [copiedTemplateIdx, setCopiedTemplateIdx] = useState<number | null>(null);
  const [ceoNotes, setCeoNotes] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [bookmarkedCodes, setBookmarkedCodes] = useState<FrameworkCode[]>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : ['SMART', 'MEETING_369', 'OKR'];
    } catch {
      return ['SMART', 'MEETING_369', 'OKR'];
    }
  });

  const activeDoc = getFrameworkByCode(selectedCode);
  const currentNote = ceoNotes[activeDoc.code] || '';

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(ceoNotes));
    } catch {
      // Ignore storage quota errors
    }
  }, [ceoNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedCodes));
    } catch {
      // Ignore storage quota errors
    }
  }, [bookmarkedCodes]);

  const toggleBookmark = (code: FrameworkCode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const filteredDocs = useMemo(() => {
    return CEO_MINDSET_FRAMEWORKS.filter((doc) => {
      if (categoryFilter === 'EXECUTION' && doc.code !== 'SMART') return false;
      if (
        categoryFilter === 'MEETING_KAIZEN' &&
        doc.code !== 'PDCA' &&
        doc.code !== 'MEETING_369'
      ) {
        return false;
      }
      if (categoryFilter === 'STRATEGY' && doc.code !== 'OKR' && doc.code !== 'SWOT') {
        return false;
      }
      if (
        categoryFilter === 'PEOPLE' &&
        doc.code !== 'MASLOW' &&
        doc.code !== 'FFC' &&
        doc.code !== 'PREP'
      ) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const searchableText = [
        doc.docNumber,
        doc.shortName,
        doc.fullTitle,
        doc.category,
        doc.tagline,
        doc.corePhilosophy,
        doc.originAndHistory.author,
        doc.originAndHistory.yearAndSource,
        doc.originAndHistory.historicalContext,
        doc.theoreticalFoundation.academicEssence,
        doc.theoreticalFoundation.formulaOrModel,
        ...doc.detailedSections.map((s) => `${s.title} ${s.content} ${(s.bulletPoints || []).join(' ')}`),
        ...doc.pillars.map((p) => `${p.label} ${p.subtitle} ${p.description} ${p.exampleAtMvdn}`),
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(q);
    });
  }, [searchQuery, categoryFilter]);

  const handleCopyTemplate = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplateIdx(idx);
    dialogService.toast('Đã sao chép biểu mẫu chuẩn vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedTemplateIdx(null), 2000);
  };

  const handlePrintCurrentDoc = () => {
    const html = buildPrintableLibraryHtml(activeDoc, currentNote);
    triggerPrint(html);
  };

  return (
    <div className="space-y-6">
      {/* BANNER THƯ VIỆN TÀI LIỆU QUẢN TRỊ CEO (VISTA AERO 2.5D GRAPHITE) */}
      <div className="vista-hero p-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[11px] font-bold uppercase tracking-wider border border-white/10">
              <BookOpen className="w-3.5 h-3.5" />
              CEO Knowledge Base • 8 Tài Liệu Chuyên Khảo
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Thư Viện Tài Liệu Quản Trị & Điều Hành Doanh Nghiệp
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handlePrintCurrentDoc}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              In A4 ({activeDoc.docNumber})
            </button>
            <button
              onClick={() => onApplyFramework(activeDoc.targetTab, activeDoc.targetSubView)}
              className="btn-25d-secondary px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-700" />
              Mở Công Cụ {activeDoc.shortName}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Phân loại thư viện */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm học thuyết, tác giả (Deming, Doerr, Maslow...), công thức..."
              className="!bg-white/10 !border-white/15 !text-white placeholder:!text-slate-400 w-full pl-10 pr-8 py-2 rounded-xl text-xs outline-none focus:!bg-white/15"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['ALL', 'Tất cả (8)'],
                ['EXECUTION', 'Mục tiêu SMART'],
                ['MEETING_KAIZEN', 'PDCA & Họp 3-6-9'],
                ['STRATEGY', 'OKR & SWOT'],
                ['PEOPLE', 'Maslow • FFC • PREP'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setCategoryFilter(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BỐ CỤC THƯ VIỆN 2 CỘT: DANH MỤC TÀI LIỆU (3/12) & TRÌNH ĐỌC CHUYÊN KHẢO (9/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* CỘT TRÁI (3/12): DANH MỤC 8 TÀI LIỆU CHUYÊN KHẢO & SƠ ĐỒ LIÊN KẾT */}
        <div className="lg:col-span-3 space-y-3.5">
          <div className="ceo-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Danh Mục Tài Liệu ({filteredDocs.length}/8)
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Đã đánh dấu: {bookmarkedCodes.length}
              </span>
            </div>

            <div className="space-y-2">
              {filteredDocs.map((fw, index) => {
                const isSelected = fw.code === selectedCode;
                const isBookmarked = bookmarkedCodes.includes(fw.code);
                return (
                  <div
                    key={fw.code}
                    onClick={() => onSelectCode(fw.code)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-white"
                          style={{ backgroundColor: fw.accentColor }}
                        >
                          {fw.docNumber}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {fw.readingTime.split('•')[0]}
                        </span>
                      </div>
                      <button
                        onClick={(e) => toggleBookmark(fw.code, e)}
                        title="Đánh dấu tài liệu quan trọng"
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'text-amber-400'
                            : isSelected
                              ? 'text-slate-500 hover:text-slate-300'
                              : 'text-slate-300 hover:text-slate-600'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <div className="font-extrabold text-sm mt-1.5 leading-snug">
                      {index + 1}. {fw.shortName}: {fw.category}
                    </div>

                    <p
                      className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {fw.tagline}
                    </p>

                    <div
                      className={`mt-2 pt-2 border-t text-[11px] flex items-center justify-between ${
                        isSelected
                          ? 'border-white/15 text-indigo-300'
                          : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      <span className="truncate max-w-[210px]">{fw.originAndHistory.author}</span>
                      <span className="font-bold shrink-0">Đọc tài liệu →</span>
                    </div>
                  </div>
                );
              })}

              {filteredDocs.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Không tìm thấy tài liệu phù hợp với từ khóa "{searchQuery}".
                </div>
              )}
            </div>
          </div>

          {/* Sơ đồ Hệ sinh thái 8 Tư duy phối hợp */}
          <div className="ceo-card p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              <Network className="w-4 h-4 text-slate-700" />
              Chuỗi Liên Kết 8 Tư Duy
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
                <strong className="text-slate-900">1. Hoạch định:</strong>{' '}
                <button
                  onClick={() => onSelectCode('SWOT')}
                  className="underline font-bold cursor-pointer"
                >
                  SWOT & TOWS
                </button>{' '}
                →{' '}
                <button
                  onClick={() => onSelectCode('OKR')}
                  className="underline font-bold cursor-pointer"
                >
                  OKR Quý
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
                <strong className="text-slate-900">2. Thực thi:</strong>{' '}
                <button
                  onClick={() => onSelectCode('SMART')}
                  className="underline font-bold cursor-pointer"
                >
                  SMART
                </button>{' '}
                →{' '}
                <button
                  onClick={() => onSelectCode('MEETING_369')}
                  className="underline font-bold cursor-pointer"
                >
                  Họp 3-6-9
                </button>{' '}
                →{' '}
                <button
                  onClick={() => onSelectCode('PDCA')}
                  className="underline font-bold cursor-pointer"
                >
                  PDCA
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
                <strong className="text-slate-900">3. Đội ngũ:</strong>{' '}
                <button
                  onClick={() => onSelectCode('PREP')}
                  className="underline font-bold cursor-pointer"
                >
                  PREP
                </button>{' '}
                →{' '}
                <button
                  onClick={() => onSelectCode('MASLOW')}
                  className="underline font-bold cursor-pointer"
                >
                  Maslow
                </button>{' '}
                →{' '}
                <button
                  onClick={() => onSelectCode('FFC')}
                  className="underline font-bold cursor-pointer"
                >
                  Khen FFC
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (9/12): TRÌNH ĐỌC TÀI LIỆU CHUYÊN KHẢO CHI TIẾT */}
        <div className="lg:col-span-9 space-y-4">
          {/* Phần Đầu Tài Liệu (Document Cover & Metadata) */}
          <div className="ceo-card p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-900 text-white">
                  {activeDoc.docNumber}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full border border-slate-300 bg-slate-100 text-slate-800">
                  {activeDoc.category}
                </span>
                <span className="text-xs text-slate-500 font-medium">{activeDoc.readingTime}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(activeDoc.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    bookmarkedCodes.includes(activeDoc.code)
                      ? 'btn-25d-primary'
                      : 'btn-25d-secondary'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  {bookmarkedCodes.includes(activeDoc.code) ? 'Đã lưu' : 'Đánh dấu'}
                </button>
                <button
                  onClick={handlePrintCurrentDoc}
                  className="btn-25d-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In A4
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {activeDoc.fullTitle}
              </h3>
              <p className="text-sm font-medium text-slate-600 mt-1 pretty-text">
                {activeDoc.tagline}
              </p>
            </div>

            {/* Hộp thông tin Tác giả & Xuất xứ học thuật */}
            <div className="vista-hero p-4 text-white space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">
                    Tác giả & Trường phái khởi nguồn:
                  </span>
                  <span className="font-bold text-slate-100">
                    {activeDoc.originAndHistory.author}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">
                    Ấn phẩm / Công trình gốc:
                  </span>
                  <span className="font-bold text-slate-200">
                    {activeDoc.originAndHistory.yearAndSource}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-slate-200 leading-relaxed">
                <strong className="text-white">Triết lý điều hành cốt lõi: </strong>
                {activeDoc.corePhilosophy}
              </div>
            </div>

            {/* Thanh Mục lục Chuyển nhanh trong Tài liệu */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-b border-slate-200 pb-3">
              {(
                [
                  ['ALL_SECTIONS', 'Toàn bộ tài liệu'],
                  ['ACADEMIC', 'I. Nguồn gốc & Lý thuyết'],
                  ['METHODOLOGY', 'II. Phương pháp luận'],
                  ['TEMPLATES', 'III. Đối sánh & Biểu mẫu'],
                  ['CASESTUDY', 'IV. Case Study & Tham khảo'],
                ] as const
              ).map(([secId, label]) => (
                <button
                  key={secId}
                  onClick={() => setActiveSection(secId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSection === secId ? 'btn-25d-primary' : 'btn-25d-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* PHẦN I: NGUỒN GỐC LỊCH SỬ & NỀN TẢNG HỌC THUẬT */}
          {(activeSection === 'ALL_SECTIONS' || activeSection === 'ACADEMIC') && (
            <div className="ceo-card p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <History className="w-5 h-5 text-slate-700" />
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Phần I. Nguồn Gốc Lịch Sử & Nền Tảng Khoa Học Quản Trị
                </h4>
              </div>

              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    1. Bối cảnh lịch sử & Sự ra đời
                  </div>
                  <p className="pretty-text text-xs sm:text-sm">
                    {activeDoc.originAndHistory.historicalContext}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    2. Bản chất khoa học & Cơ chế tác động
                  </div>
                  <p className="pretty-text text-xs sm:text-sm text-slate-800">
                    {activeDoc.theoreticalFoundation.academicEssence}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-100 border border-slate-300/90 space-y-1.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    3. Công thức / Mô hình cấu trúc chuẩn
                  </div>
                  <p className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                    {activeDoc.theoreticalFoundation.formulaOrModel}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    4. Phối hợp liên hoàn với các Tư duy khác
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 pretty-text">
                    {activeDoc.theoreticalFoundation.synergyWithOtherFrameworks}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PHẦN II: PHÂN TÍCH CHUYÊN SÂU & CẤU TRÚC TRỤ CỘT */}
          {(activeSection === 'ALL_SECTIONS' || activeSection === 'METHODOLOGY') && (
            <div className="ceo-card p-6 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Layers className="w-5 h-5 text-slate-700" />
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Phần II. Phân Tích Chuyên Sâu & Cấu Trúc Phương Pháp Luận
                </h4>
              </div>

              {/* Các chương biên soạn chi tiết */}
              <div className="space-y-4">
                {activeDoc.detailedSections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3"
                  >
                    <h5 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {sec.title}
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pretty-text">
                      {sec.content}
                    </p>
                    {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                      <ul className="space-y-2 pt-1">
                        {sec.bulletPoints.map((bp, bIdx) => (
                          <li
                            key={bIdx}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80"
                          >
                            <span className="w-5 h-5 rounded-md bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              {bIdx + 1}
                            </span>
                            <span className="pretty-text">{bp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Hộp chuyên biệt cho Họp 3-6-9: 3 Công thức • 6 Bước • 9 Nguyên tắc */}
              {activeDoc.code === 'MEETING_369' && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                    <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-slate-700" />
                      3 Công Thức Hiệu Quả Của Cuộc Họp
                    </h5>
                    <div className="grid grid-cols-1 gap-2.5">
                      {MEETING_369_FORMULAS.map((f, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-slate-600 uppercase">
                              {f.number}
                            </span>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-300">
                              {f.formula}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-1">{f.title}</div>
                          <div className="text-xs text-slate-600 mt-0.5">{f.actionableRule}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                    <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-700" />
                      6 Bước Tổ Chức & Kiểm Soát Cuộc Họp
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {MEETING_369_SIX_STEPS.map((s) => (
                        <div key={s.step} className="p-3 rounded-xl bg-white border border-slate-200/90">
                          <div className="text-xs font-extrabold text-slate-500">BƯỚC {s.step}</div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">{s.title}</div>
                          <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {s.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                    <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-700" />
                      9 Nguyên Tắc Bắt Buộc Của Cuộc Họp
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {MEETING_369_NINE_PRINCIPLES.map((p, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-start gap-2 text-xs"
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-slate-800 leading-snug">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chi tiết từng Trụ cột & Câu hỏi phản tư CEO */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Bảng Giải Phẫu Các Thành Tố & Câu Hỏi Phản Tư Dành Cho CEO
                </h5>
                <div className="space-y-3">
                  {activeDoc.pillars.map((pillar) => (
                    <div
                      key={pillar.key}
                      className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {pillar.key}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h6 className="font-bold text-slate-900 text-sm">{pillar.label}</h6>
                            <span className="text-xs text-slate-500 font-medium">
                              {pillar.subtitle}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pretty-text">
                            {pillar.description}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            <div className="p-3 rounded-xl bg-slate-100 border border-slate-300/80 text-xs">
                              <span className="font-bold text-slate-900 block mb-0.5">
                                Câu hỏi kiểm tra của CEO:
                              </span>
                              <span className="text-slate-700 italic">"{pillar.ceoQuestion}"</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                              <span className="font-bold text-slate-800 block mb-0.5">
                                Ví dụ áp dụng tại Xưởng MVĐN:
                              </span>
                              <span className="text-slate-600">{pillar.exampleAtMvdn}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PHẦN III: BẢNG ĐỐI SÁNH & BIỂU MẪU CHUẨN CEO */}
          {(activeSection === 'ALL_SECTIONS' || activeSection === 'TEMPLATES') && (
            <div className="ceo-card p-6 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Scale className="w-5 h-5 text-slate-700" />
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Phần III. Bảng Đối Sánh Thực Tiễn & Biểu Mẫu Áp Dụng Chuẩn
                </h4>
              </div>

              {/* Bảng đối sánh */}
              <div className="space-y-3">
                <h5 className="text-sm font-extrabold text-slate-900">
                  1. {activeDoc.comparisonTable.title}
                </h5>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-xs">
                        <th className="p-3.5 font-bold w-1/4">Tiêu chí đối sánh</th>
                        <th className="p-3.5 font-bold text-slate-300 w-[37.5%]">
                          {activeDoc.comparisonTable.leftHeader}
                        </th>
                        <th className="p-3.5 font-bold text-white w-[37.5%]">
                          {activeDoc.comparisonTable.rightHeader}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                      {activeDoc.comparisonTable.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-bold text-slate-900 bg-slate-50/50">
                            {row.criterion}
                          </td>
                          <td className="p-3.5 text-slate-600 bg-white leading-relaxed">
                            {row.leftValue}
                          </td>
                          <td className="p-3.5 text-slate-900 bg-slate-50/60 font-medium leading-relaxed">
                            {row.rightValue}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Biểu mẫu chuẩn sao chép nhanh */}
              <div className="space-y-3 pt-2">
                <h5 className="text-sm font-extrabold text-slate-900">
                  2. Biểu Mẫu Chuẩn Hóa Dành Cho CEO & Trưởng Bộ Phận
                </h5>
                <div className="space-y-3">
                  {activeDoc.standardTemplates.map((tpl, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">{tpl.name}</div>
                          <div className="text-xs text-slate-500">
                            Khi sử dụng: {tpl.usageWhen}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyTemplate(tpl.templateText, idx)}
                          className="btn-25d-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedTemplateIdx === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Đã sao chép
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Sao chép mẫu
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3.5 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                        {tpl.templateText}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PHẦN IV: CASE STUDY MVĐN, NGUYÊN TẮC VÀNG, SAI LẦM CẦN TRÁNH & TÀI LIỆU THAM KHẢO */}
          {(activeSection === 'ALL_SECTIONS' || activeSection === 'CASESTUDY') && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="ceo-card p-5 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Nguyên tắc vàng khi điều hành
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    {activeDoc.goldenRules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-2 shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="ceo-card p-5 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Sai lầm phổ biến cần tránh
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    {activeDoc.commonPitfalls.map((pitfall, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                        <span>{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tình huống thực chiến tại MVĐN */}
              <div className="ceo-card p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <Lightbulb className="w-4 h-4 text-slate-700" />
                    Tình Huống Thực Chiến Tại Mã Vạch Đồng Nai (MVĐN)
                  </div>
                  <button
                    onClick={() => onApplyFramework(activeDoc.targetTab, activeDoc.targetSubView)}
                    className="btn-25d-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    Thực hành <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                    <span className="font-bold text-slate-900">Bối cảnh vận hành: </span>
                    <span className="text-slate-700">{activeDoc.realCaseStudy.context}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700">
                      <span className="font-extrabold block mb-1 text-rose-700">
                        ✗ Cách làm cũ:
                      </span>
                      {activeDoc.realCaseStudy.badApproach}
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300/90 text-slate-900">
                      <span className="font-extrabold block mb-1 text-emerald-700">
                        ✓ Giải pháp {activeDoc.shortName}:
                      </span>
                      {activeDoc.realCaseStudy.goodApproach}
                    </div>
                  </div>
                  <div className="vista-hero p-3.5 text-white font-medium">
                    <span className="font-bold text-slate-300">Kết quả định lượng: </span>
                    {activeDoc.realCaseStudy.outcome}
                  </div>
                </div>
              </div>

              {/* Danh mục Sách & Ấn phẩm học thuật kinh điển */}
              <div className="ceo-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-slate-700" />
                  Tài Liệu & Sách Kinh Điển Tham Khảo
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeDoc.classicReferences.map((ref, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                    >
                      <div className="text-xs font-extrabold text-slate-600">{ref.author}</div>
                      <div className="text-sm font-bold text-slate-900">{ref.workTitle}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{ref.keyTakeaway}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sổ tay Ghi chú Tâm đắc của CEO cho từng Tài liệu */}
              <div className="ceo-card p-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <PenTool className="w-4 h-4 text-slate-700" />
                    Ghi Chú Của CEO ({activeDoc.shortName})
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                    <Save className="w-3 h-3" /> Tự động lưu
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={currentNote}
                  onChange={(e) =>
                    setCeoNotes((prev) => ({
                      ...prev,
                      [activeDoc.code]: e.target.value,
                    }))
                  }
                  placeholder={`Ghi chú quy định riêng của CEO khi áp dụng ${activeDoc.shortName}...`}
                  className="w-full p-3.5 rounded-xl text-xs sm:text-sm text-slate-800 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── NGĂN TRƯỢT TRA CỨU NHANH TÀI LIỆU QUẢN TRỊ (QUICK DRAWER) ───────────────
interface QuickMindsetDrawerProps {
  isOpen: boolean;
  code: FrameworkCode;
  onSelectCode: (code: FrameworkCode) => void;
  onClose: () => void;
  onOpenFullHandbook: (code: FrameworkCode) => void;
}

export const QuickMindsetDrawer: React.FC<QuickMindsetDrawerProps> = ({
  isOpen,
  code,
  onSelectCode,
  onClose,
  onOpenFullHandbook,
}) => {
  if (!isOpen) return null;
  const doc = getFrameworkByCode(code);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-300 flex flex-col overflow-hidden">
        <div className="vista-hero !rounded-none p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-slate-300" />
            <h3 className="font-bold text-sm">
              Tra Cứu Nhanh • {doc.docNumber} ({doc.shortName})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bộ chọn 8 tài liệu */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          {CEO_MINDSET_FRAMEWORKS.map((fw) => (
            <button
              key={fw.code}
              onClick={() => onSelectCode(fw.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                fw.code === code ? 'btn-25d-primary' : 'btn-25d-secondary'
              }`}
            >
              {fw.shortName}
            </button>
          ))}
        </div>

        {/* Nội dung tóm tắt học thuật & trụ cột */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-extrabold text-white">
                {doc.docNumber}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-300 bg-slate-100 text-slate-800">
                {doc.category}
              </span>
            </div>
            <h4 className="text-base font-extrabold text-slate-900 mt-2">{doc.fullTitle}</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {doc.originAndHistory.author}
            </p>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/90">
              {doc.corePhilosophy}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300/90 text-xs">
            <div className="font-extrabold text-slate-600 uppercase mb-1">
              Công thức / Mô hình cốt lõi:
            </div>
            <div className="font-mono font-bold text-slate-900">
              {doc.theoreticalFoundation.formulaOrModel}
            </div>
          </div>

          <div className="space-y-2.5">
            {doc.pillars.map((p) => (
              <div
                key={p.key}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {p.key}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">{p.label}</span>
                </div>
                <p className="text-xs text-slate-600">{p.description}</p>
                <div className="text-[11px] text-slate-800 font-medium pt-0.5">
                  VD MVĐN: {p.exampleAtMvdn}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-100 flex items-center justify-between">
          <button
            onClick={() => onOpenFullHandbook(code)}
            className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Đọc Toàn Bộ Tài Liệu ({doc.docNumber}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="btn-25d-primary px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
