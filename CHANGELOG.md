# CHANGELOG — PROCEO

All notable changes to the ProCEO project will be documented in this file.

## [2.1.0] - 2026-11-05
### Added
- **Real ERP MVĐN Full Integration**:
  - Chuyển tab **"Dữ Liệu ERP MVĐN"** (`erp-bridge`) xuống vị trí cuối cùng riêng biệt trên Sidebar, có đường kẻ ngăn cách (`border-t border-white/10`) và nhóm độc lập `HỆ THỐNG NGOẠI VI ERP`.
  - Kết nối trực tiếp cơ sở dữ liệu sản xuất Cloud Firestore (`mvdn-59215`).
  - `ExecutiveDashboard.tsx` tích hợp toàn diện các chỉ số radar vận hành:
    - Card 1: Lệnh SX đang chạy (`radarMetrics.inProgressLsxCount / totalLsxCount`, cảnh báo lệnh trễ hạn đỏ).
    - Card 2: Chờ lên lệnh (`pendingIntakesCount`) và Đề xuất chờ duyệt (`pendingProposals.length`).
    - Card 3: KPI Số Đơn Hàng Mới Trong Ngày (`todayNewIntakesCount` đơn mới, `todayNewIntakesQuantity` sp/mét).
    - Card 4: Sản lượng xưởng hoàn thành (`todayFinishedQuantity`), số báo cáo ca và công nhân đang chạy máy.
  - Section B (Today) hỗ trợ 3 tab tương tác: Lịch trình CEO, Đơn hàng mới hôm nay (Intakes), Đề xuất phòng ban chờ duyệt (Proposals) kèm nút **Phê duyệt** / **Từ chối** trực tiếp.
  - Section D (Execution Control) hiển thị bảng Cảnh báo Lệnh SX Quá hạn từ ERP kèm nút 1-click **"+ Giao SMART"** cho Quản lý xưởng.
  - Section E (People) đồng bộ trực tiếp danh bạ nhân sự thực tế (`staffDirectory`) từ `hr_personnel`.
  - `ExecutiveSidebar.tsx` bổ sung menu **"Dữ Liệu ERP MVĐN"** (`erp-bridge`) với badge số lượng Lệnh SX đang chạy theo thời gian thực.
  - Hỗ trợ nút đăng nhập nhanh quyền Giám Đốc (CEO Mode) tại màn hình đăng nhập để kiểm tra trên localhost.

## [2.0.0] - 2026-11-05
### Added
- **Product Architecture Specification**: Tích hợp toàn diện 8 framework quản trị (SWOT, OKR, SMART, PDCA, Meeting 3-6-9, PREP, Maslow, FFC).
- **Design System**: Bảng màu Executive Minimalism (Deep Navy `#14283F`, Warm White `#F6F5F1`, Champagne Gold `#C6A66B`, font Inter, Clean Table UI).
- **Executive Layout & Navigation**:
  - `ExecutiveSidebar.tsx`: 11 danh mục điều hành nhóm theo 4 phân hệ (Chiến lược & Mục tiêu, Vận hành & Cải tiến, Con người & Truyền thông, Hệ thống), badge cảnh báo realtime, responsive drawer.
  - `ExecutiveTopbar.tsx`: Hiển thị ngày tháng, vai trò, quick AI Executive Briefing trigger, trạng thái kết nối và chế độ điều hành.
- **Executive Dashboard 6 Khu Vực (`ExecutiveDashboard.tsx`)**:
  - Section F: AI Executive Briefing (Phát hiện sớm rủi ro, 3 hành động trọng tâm cho CEO).
  - Section A: Executive Overview (5 thẻ chỉ số điều hành then chốt).
  - Section B: Today (Việc & Lịch trình điều hành trong ngày).
  - Section C: Strategic Progress (Tiến độ OKR quý và chỉ số KR).
  - Section D: Execution Control (Kiểm soát thực thi SMART & Action items sau họp, Clean Table UI).
  - Section E: People (Động lực nhân sự Maslow & Văn hóa khen ngợi FFC).
- **Dedicated Framework Views**:
  - `OkrManagementView.tsx`: Quản trị Objectives & Key Results, Check-in định lượng, phân cấp P0/P1/P2, AI chẩn đoán rủi ro chiến lược.
  - `SwotTowsView.tsx`: Ma trận 4 ô SWOT (S, W, O, T) và bảng chiến lược hành động TOWS (SO, WO, ST, WT), 1-click chuyển giao việc sang SMART.
  - `PrepReportsView.tsx`: Soạn thảo và ban hành truyền thông điều hành chuẩn PREP (Point - Reason - Example - Point), trợ lý AI soạn thảo, ban hành ERP.
  - `PeopleManagementView.tsx`: Tháp nhu cầu 5 tầng Maslow trực quan, hồ sơ huấn luyện 1-on-1, ghi nhận lời khen FFC và vinh danh ERP.
  - `AiCopilotView.tsx`: Không gian làm việc riêng cho CEO với Trợ lý AI Copilot (Google Gemini 2.5), nạp ngữ cảnh dữ liệu doanh nghiệp thời gian thực.
  - `ExecutiveSettingsView.tsx`: Chuyển đổi Personal Mode vs Organization Mode, sao lưu / phục hồi dữ liệu JSON 1-click, quản lý kết nối Firestore.
- **Data Persistence**:
  - `ceoStorageService.ts`: Hỗ trợ đầy đủ 9 collections quản trị điều hành, đồng bộ 2 chiều giữa Local Mirror (offline) và Firestore Cloud (online) với độ trễ 0ms.
  - Phương thức `exportBackupJson` và `restoreBackupJson` an toàn tuyệt đối.
- **Clean Table UI Rule**:
  - Đảm bảo 100% các nút thao tác Sửa / Xóa / Check-in trong bảng dữ liệu ẩn mặc định (`opacity-0`) và chỉ hiện khi rê chuột (`group-hover:opacity-100 transition-opacity`).
