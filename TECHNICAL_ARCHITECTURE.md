# PROCEO — TECHNICAL ARCHITECTURE

## 1. Tổng Quan Kiến Trúc
ProCEO là hệ điều hành quản trị dành riêng cho Giám đốc Điều hành (Personal Executive Management System). 
Ứng dụng được thiết kế theo tiêu chí:
- **Personal-First:** Một CEO có thể sử dụng độc lập ngay lập tức mà không cần cấu hình phòng ban phức tạp.
- **Organization-Ready:** Sẵn sàng mở rộng thành nền tảng quản trị phân quyền đa cấp (Owner/CEO, Assistant, Department Manager, Supervisor, Employee).
- **Dual-Storage Engine:** Kết hợp giữa Local Mirror (Offline-first, độ trễ 0ms) và Cloud Firestore (`axis_*`) đảm bảo dữ liệu không bao giờ thất lạc và an toàn tuyệt đối.
- **Cross-cutting AI Copilot:** Trợ lý Gemini AI cố vấn xuyên suốt 8 phân hệ, chỉ đề xuất trên số liệu thực chứng, không tự ý sửa đổi hay bịa đặt dữ liệu.

## 2. Bảng Màu Thiết Kế (Executive Minimalism – Modern Professional)
| Màu Sắc | Mã Hex | Ý Nghĩa / Vị Trí Áp Dụng |
| :--- | :--- | :--- |
| **Deep Navy** | `#14283F` | Màu chủ đạo thương hiệu C-Level, Sidebar, Header quyền lực, Card chính |
| **Warm White** | `#F6F5F1` | Nền canvas làm việc sang trọng, dịu mắt, chống mỏi mắt khi điều hành lâu |
| **Champagne Gold** | `#C6A66B` | Màu điểm nhấn lãnh đạo, huy hiệu chiến lược, KPI trọng điểm, AI Copilot |
| **Slate Gray** | `#64748B` / `#334155` | Màu văn bản phụ, đường kẻ viền phân chia thanh lịch, tinh tế |
| **Status Accents** | Emerald, Rose, Amber | Chỉ dùng có chọn lọc cho trạng thái (On Track / At Risk / Behind / Overdue) |

## 3. Sơ Đồ Luồng Quản Trị Liên Kết Xuyên Suốt 8 Framework
```
[SWOT: Phân tích Điểm mạnh / Yếu / Cơ hội / Thách thức]
      ↓
[TOWS: Phối hợp 4 chiến lược SO - WO - ST - WT]
      ↓
[STRATEGY: Khởi tạo Sáng kiến Chiến lược (Strategic Initiatives)]
      ↓
[OKR: Phân rã Objectives ➔ Key Results đo lường định lượng]
      ↓
[SMART GOALS: Chuẩn hóa mục tiêu hành động rõ ràng S-M-A-R-T]
      ↓
[PDCA CYCLES: Tổ chức thực thi thử nghiệm Plan ➔ Do ➔ Check ➔ Act]
      ↓
[PROJECTS & TASKS: Phân công công việc có DRI, Deadline, Nguồn lực]
      ↓
[MEETINGS 3-6-9: Giám sát, đôn đốc & Thúc đẩy cam kết (3 công thức, 6 bước, 9 nguyên tắc)]
      ↓
[CHECK / REPORT / REVIEW: Đối chiếu Baseline vs Target vs Actual]
      ↓
[ACT / STANDARDIZE: Chuẩn hóa Quy trình SOP toàn xưởng / Tạo chu kỳ mới]

--- HỆ THỐNG HỖ TRỢ XUYÊN SUỐT ---
• PREP: Chuẩn hóa báo cáo, đề xuất, sự cố theo công thức P - R - E - P
• MASLOW: Thấu cảm động lực nhân viên qua tháp 5 tầng nhu cầu
• FFC: Văn hóa khen ngợi & ghi nhận thành tích (Feeling - Fact - Compare)
```

## 4. Cấu Trúc Thư Mục Mục Tiêu
```
src/
├── components/
│   ├── dashboard/               # Executive Dashboard (6 khu vực tương tác)
│   ├── strategy/                # Module 01: SWOT & TOWS
│   ├── okr/                     # Module 02: OKR Management
│   ├── smart/                   # Module 03: SMART Goals
│   ├── execution/               # Module 04 & Tasks: PDCA, Projects, Schedules
│   ├── meetings/                # Module 05: Meeting 3-6-9 (9 nguyên tắc checklist)
│   ├── reports/                 # Module 06: PREP Reports & Proposals
│   ├── people/                  # Module 07 & 08: Maslow Pyramid & FFC Praises
│   ├── copilot/                 # AI Executive Copilot Hub
│   ├── settings/                # Settings, Mode switch, Backup & Restore
│   ├── layout/                  # ExecutiveSidebar, ExecutiveTopbar, Shell
│   └── common/                  # Clean Table, CustomDialog, Metrics, Badges
├── services/
│   ├── ceoStorageService.ts     # Dual-storage persistence, backup/restore
│   ├── ceoAiService.ts          # Gemini AI Copilot multi-module functions
│   └── erpService.ts            # ERP data bridge (optional link)
├── types/
│   ├── ceoTypes.ts              # Core entities for all 8 frameworks
│   └── erpTypes.ts              # External ERP types
├── utils/
│   ├── dateUtils.ts             # Date helpers, relative badges
│   └── printUtils.ts            # Fast iframe print engine
└── App.tsx                      # Root executive orchestrator
```
