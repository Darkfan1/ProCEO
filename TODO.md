# PROCEO — TODO & ROADMAP CHECKLIST

## Phase 1: Foundation (HOÀN TẤT)
- [x] Tài liệu kỹ thuật: `PROJECT_STATUS.md`, `TECHNICAL_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `CHANGELOG.md`, `TODO.md`.
- [x] Thiết lập Design System: Deep Navy `#14283F`, Warm White `#F6F5F1`, Champagne Gold `#C6A66B`.
- [x] Xây dựng Executive Layout chuẩn mực (Sidebar 11 mục, Topbar, Responsive Mobile Shell).
- [x] Xây dựng Executive Dashboard 6 khu vực tương tác (A: Overview, B: Today, C: Strategic Progress, D: Execution Control, E: People, F: AI Executive Briefing).
- [x] Chế độ Personal Mode vs Organization Mode & Cơ chế Backup / Restore dữ liệu (JSON).

## Phase 2: Goal Management (HOÀN TẤT)
- [x] SMART Goals: Form chuẩn hóa 5 tiêu chí, tính SMART Score, KPI, Clean Table UI (`opacity-0 group-hover:opacity-100`).
- [x] OKR Management (`OkrManagementView.tsx`): Objective ➔ Key Results đo lường định lượng, Check-in định kỳ, trạng thái (Completed, On Track, At Risk, Behind), AI chẩn đoán rủi ro.

## Phase 3: Strategic Management (HOÀN TẤT)
- [x] SWOT Analysis (`SwotTowsView.tsx`): Bảng ma trận 4 ô (S, W, O, T) theo phòng ban/dự án/mục tiêu.
- [x] TOWS Matrix: Chuyển hóa 4 nhóm chiến lược SO, WO, ST, WT thành Initiative / SMART Goal có người chịu trách nhiệm (DRI), AI Gợi ý TOWS.

## Phase 4: Execution Management (HOÀN TẤT)
- [x] PDCA Continuous Improvement: 4 pha Plan - Do - Check - Act, đo lường Baseline vs Target vs Actual.
- [x] Chuẩn hóa SOP khi đạt tiêu chuẩn (Act / Standardized), lặp lại iteration + 1 khi chưa đạt.
- [x] Projects & Tasks Management: Phân công DRI, Deadline, Mức độ ưu tiên, đôn đốc nhắc việc.

## Phase 5: Meeting & Communication (HOÀN TẤT)
- [x] Meeting 3-6-9: 3 công thức quản trị, 6 bước tổ chức, 9 nguyên tắc bắt buộc dưới dạng checklist tương tác.
- [x] Ban hành nghị quyết & Action Items có DRI, triệu tập họp ERP, kết nối trực tiếp với SMART Task.
- [x] PREP Reporting (`PrepReportsView.tsx`): Chuẩn hóa báo cáo & chỉ đạo theo cấu trúc Point - Reason - Example - Point, AI soạn thảo, ban hành ERP.

## Phase 6: People Management (HOÀN TẤT)
- [x] Maslow Pyramid (`PeopleManagementView.tsx`): Tháp 5 tầng trực quan (Sinh lý, An toàn, Xã hội, Tôn trọng, Tự thể hiện), hồ sơ động lực 1-on-1.
- [x] FFC Recognition & Praise: Văn hóa ghi nhận Feeling - Fact - Compare, vinh danh trực tiếp lên ERP MVĐN.

## Phase 7: AI Executive Copilot (HOÀN TẤT)
- [x] Gemini AI Assistant xuyên suốt (`AiCopilotView.tsx`): Cố vấn điều hành C-Level, Daily Briefing, Goal Analysis, OKR Monitoring, Meeting Agenda, PREP Drafting.
- [x] Nguyên tắc AI: Không bịa số liệu, phân biệt rõ dữ liệu/suy luận/đề xuất, human-in-the-loop, hỗ trợ Offline mode.

## Phase 8: Optimization & Packaging (Sẵn sàng)
- [x] Tối ưu hóa hiệu năng, Clean Table UI theo Rule 2 (`opacity-0 group-hover:opacity-100`).
- [ ] Kiểm thử toàn diện trên trình duyệt và đóng gói Tauri Desktop khi có yêu cầu.
