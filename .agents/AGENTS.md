# Rules

1. Không được phép tự động chạy lệnh deploy (ví dụ: `firebase deploy`, `npm run build`, `npm run deploy`,...) trừ khi được người dùng yêu cầu rõ ràng. Mọi thay đổi đều phải để người dùng kiểm tra (test) trên localhost (môi trường dev) trước.
2. Quy chuẩn UI bảng dữ liệu: Các nút thao tác Sửa / Xóa (Edit/Delete icons) ở các hàng dữ liệu trong bảng cần để ẩn mặc định (`opacity-0`), chỉ hiện ra khi người dùng rê chuột vào hàng (`group-hover:opacity-100 transition-opacity` hoặc `transition-all`), đảm bảo giao diện luôn gọn gàng và đồng bộ.
