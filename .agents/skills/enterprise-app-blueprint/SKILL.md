---
name: enterprise-app-blueprint
description: Cẩm nang kiến trúc phần mềm quản trị & sản xuất doanh nghiệp (MES/ERP/SaaS) đúc kết từ ProTrack. Bao gồm tối ưu hóa Firestore realtime & chi phí cloud, desktop native Tauri v2, quy chuẩn Clean Table UI & Themes, in ấn siêu tốc iframe, paste ảnh clipboard, và tích hợp Gemini AI. Kích hoạt khi bắt đầu dự án mới hoặc tối ưu hóa app.
---

# CẨM NANG KIẾN TRÚC & KỸ NĂNG XÂY DỰNG ỨNG DỤNG DOANH NGHIỆP (ENTERPRISE APP BLUEPRINT)

Tài liệu này đúc kết toàn bộ kiến trúc, giải pháp tối ưu hóa, các đoạn code mẫu và quy chuẩn thực chiến từ hệ thống **Mã Vạch Đồng Nai - ProTrack**. Khi bắt đầu một dự án Web/Desktop App quản trị hoặc sản xuất mới, bạn chỉ cần copy thư mục skill này vào `.agents/skills/enterprise-app-blueprint` để trợ lý AI tự động tuân thủ toàn bộ tiêu chuẩn này.

---

## 1. TECH STACK CHUẨN ĐƯỢC KIỂM CHỨNG

| Thành phần | Công nghệ khuyến nghị | Lý do lựa chọn |
| :--- | :--- | :--- |
| **Frontend Framework** | `React 19` + `TypeScript` + `Vite` | Tốc độ HMR cực nhanh, gõ code có type-safety, tải trang tức thì. |
| **Styling & Motion** | `Tailwind CSS v4` + `clsx` + `tailwind-merge` + `Framer Motion` | Giao diện hiện đại, dễ bảo trì, micro-animation mượt mà. |
| **Backend & Cloud** | `Firebase (Firestore + Storage + FCM + Cloud Functions)` | Realtime hai chiều, zero backend boilerplate, tính sẵn sàng cao. |
| **Desktop Wrapper** | `Tauri v2` (Rust) | Chiếm <80MB RAM, đóng gói NSIS installer nhẹ vài chục MB, native tốc độ cao. |
| **Báo cáo & Xuất file** | `exceljs` + `file-saver` | Xuất bảng tính Excel có format màu sắc, đường kẻ, công thức chuẩn doanh nghiệp. |
| **Nén ảnh máy khách** | `browser-image-compression` | Chạy nén WebWorker dưới nền, giảm 80-90% dung lượng Cloud Storage. |
| **Trí tuệ nhân tạo (AI)**| `@google/genai` (Gemini 3.1 / 2.5 Flash) | SDK mới nhất, hỗ trợ Structured JSON Output phục vụ phân tích dữ liệu. |
| **Bộ Icon** | `lucide-react` | Icon vector sắc nét, đồng bộ cho môi trường doanh nghiệp. |

---

## 2. QUY CHUẨN TỐI ƯU HÓA FIRESTORE & CHI PHÍ CLOUD

Khi ứng dụng chạy realtime với hàng chục ngàn bản ghi, việc lắng nghe thiếu kiểm soát sẽ gây tốn chi phí đọc (reads) và giật lag giao diện. Bắt buộc áp dụng 5 kỹ thuật sau:

### 2.1. Phân tách Context độc lập (Render Isolation)
Không gom toàn bộ dữ liệu vào một Context chung duy nhất. Chia thành 3 tầng:
1. `AppContext`: Thông tin người dùng hiện tại, quyền hạn (Role), theme, bộ lọc ngày tháng toàn cục.
2. `DataContext`: Dữ liệu nghiệp vụ chính (đơn hàng, kế hoạch, kho, danh mục).
3. `NotificationContext`: Lắng nghe thông báo hệ thống và tin nhắn. Tách riêng để khi có thông báo mới, bảng tính và form nhập liệu không bị re-render lại.

### 2.2. Trì hoãn cập nhật khi Tab bị ẩn (Deferred Background Sync)
Khi người dùng chuyển sang tab khác hoặc thu nhỏ app, gom dữ liệu vào `ref` và chỉ render React khi người dùng quay lại:
```typescript
const pendingDataRef = useRef<any[] | null>(null);

useEffect(() => {
  let animFrameId: number | null = null;
  const handleVisibilityChange = () => {
    if (!document.hidden && pendingDataRef.current !== null) {
      const nextData = pendingDataRef.current;
      pendingDataRef.current = null;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(() => {
        React.startTransition(() => {
          setData(nextData);
        });
      });
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);
```

### 2.3. Lọc dữ liệu Server-side & Giới hạn thời gian
* Luôn thêm điều kiện thời gian khi lắng nghe dữ liệu biến động nhiều:
  ```typescript
  const constraints = [
    where('createdAt', '>=', fourteenDaysAgoStr),
    orderBy('createdAt', 'desc'),
    limit(60)
  ];
  ```
* Dọn dẹp dữ liệu cũ (như log, thông báo > 14 ngày) theo lô 500 documents:
  ```typescript
  const cleanupOldDocs = async (cutoffDateStr: string) => {
    const q = query(collection(db, 'notifications'), where('createdAt', '<', cutoffDateStr));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);
      docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  };
  ```

### 2.4. Hàm làm sạch `undefined` đệ quy (`removeUndefinedDeep`)
Firestore sẽ crash nếu lưu object chứa giá trị `undefined`. Luôn bọc hàm lưu qua bộ lọc:
```typescript
export const removeUndefinedDeep = (val: any): any => {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (Array.isArray(val)) return val.map(removeUndefinedDeep).filter(v => v !== undefined);
  if (typeof val === 'object' && !(val instanceof Date)) {
    const res: any = {};
    for (const key of Object.keys(val)) {
      const cleaned = removeUndefinedDeep(val[key]);
      if (cleaned !== undefined) res[key] = cleaned;
    }
    return res;
  }
  return val;
};
```

---

## 3. KIẾN TRÚC DESKTOP NATIVE CHUYÊN NGHIỆP (TAURI v2)

### 3.1. Chống đóng băng WebView2 khi chạy nền
Trong `src-tauri/src/lib.rs`, bắt buộc cấu hình biến môi trường trước khi khởi động:
```rust
#[cfg(target_os = "windows")]
{
    let background_args = "--disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-features=CalculateNativeWinOcclusion";
    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", background_args);
}
```

### 3.2. Cửa sổ phụ đối chiếu dữ liệu song song (Multi-Window)
* Khi cần so sánh đơn hàng hoặc đối chiếu tồn kho:
  * Mở cửa sổ mới với URL kèm tham số `/?w=s`.
  * Phím tắt toàn cục: `Ctrl + Shift + N`.
  * Trong Rust (`lib.rs`), cấu hình nhãn `secondary`:
  ```rust
  let _ = WebviewWindowBuilder::new(app, "secondary", secondary_url)
      .title("Cửa Sổ Phụ Đối Chiếu")
      .inner_size(1280.0, 800.0)
      .center()
      .build();
  ```

### 3.3. System Tray & Ẩn khi bấm Đóng
* Chặn sự kiện đóng để app chạy ngầm tại thanh Taskbar:
  ```rust
  .on_window_event(|window, event| {
      if let WindowEvent::CloseRequested { api, .. } = event {
          if window.label() == "main" {
              api.prevent_close();
              let _ = window.hide();
          }
      }
  })
  ```
* Bật plugin `tauri_plugin_single_instance` để ngăn người dùng mở trùng nhiều phiên bản app.

### 3.4. Thông báo Native Windows (WinRT Toast)
* Đăng ký AUMID `com.yourcompany.appname`.
* Fallback sang `Toast::POWERSHELL_APP_ID` nếu app chưa được cài đặt chính thức để luôn phát được âm thanh và banner thông báo.
* Khi click vào thông báo: Tự động khôi phục và đưa cửa sổ lên Foreground (`set_focus()`).

---

## 4. QUY CHUẨN GIAO DIỆN & TRẢI NGHIỆM DOANH NGHIỆP

### 4.1. Quy chuẩn Bảng Sạch (The Clean Table Rule)
> **Bắt buộc**: Các nút thao tác Sửa / Xóa / In ấn trên từng dòng trong bảng dữ liệu phải để ẩn mặc định (`opacity-0`), và chỉ hiện ra khi rê chuột vào hàng (`group-hover:opacity-100 transition-opacity`).
```tsx
<tr className="group hover:bg-slate-50 transition-colors">
  <td className="p-3">{item.name}</td>
  <td className="p-3 text-right">
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
      <button onClick={() => handleEdit(item)} className="p-1 hover:text-blue-600">
        <Edit3 size={16} />
      </button>
      <button onClick={() => handleDelete(item)} className="p-1 hover:text-red-600">
        <Trash2 size={16} />
      </button>
    </div>
  </td>
</tr>
```

### 4.2. Hộp thoại thay thế `window.alert` (`CustomDialog`)
Xây dựng Service Dialog dạng Promise để `await` trực tiếp trong hàm async:
```typescript
const isConfirmed = await dialogService.confirm(
  'Bạn có chắc chắn muốn xóa bản ghi này? Hành động không thể hoàn tác.',
  'Xác nhận xóa'
);
if (!isConfirmed) return;
```
Bọc `window.alert = (msg) => dialogService.alert(msg);` tại root app để chuẩn hóa mọi thông báo phát sinh.

### 4.3. Hệ thống Theme linh hoạt (Stage Themes)
Hỗ trợ các theme màu phù hợp với từng phân khu làm việc:
* `bento-glass`: Phong cách giao diện thẻ kính nổi, đổ bóng mịn.
* `aubergine-studio`: Phong cách Slack sang trọng (tím mận đậm + nền sáng dịu mắt).
* `rose-stage`: Nhẹ nhàng, tươi sáng cho khối nhân sự / văn phòng.
* `grayscale-stage`: Tương phản cao, tập trung tuyệt đối cho kỹ thuật / thiết kế.
Đồng bộ thuộc tính `meta[name="theme-color"]` theo theme để thanh trạng thái trên mobile đổi màu tương ứng.

---

## 5. TIỆN ÍCH VĂN PHÒNG & MEDIA THỰC CHIẾN

### 5.1. Dán ảnh trực tiếp từ Clipboard (`Ctrl + V`)
Cho phép người dùng chụp ảnh màn hình (Snipping Tool, Zalo,...) rồi bấm `Ctrl + V` trực tiếp vào bảng hoặc form để upload ảnh ngay lập tức:
```typescript
const handlePaste = async (e: React.ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (file) {
        const compressed = await compressImageIfNeeded(file);
        const downloadUrl = await uploadToStorage(compressed);
        // Lưu URL vào form hoặc dữ liệu dòng
      }
    }
  }
};
```

### 5.2. In ấn siêu tốc qua thẻ Iframe ẩn (Safari/Chrome Print Fix)
Không dùng `window.print()` trực tiếp vì trình duyệt sẽ phải layout lại toàn bộ cây DOM của React SPA (gây đơ 30s). Sử dụng kỹ thuật clone DOM vào iframe ẩn:
```typescript
export function triggerPrint(elementId: string) {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) return;
  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach(el => el.remove());

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) return;

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML).join('\n');

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html><html><head>${styles}<style>@page{size:A4;margin:10mm;}body{background:white!important;}</style></head><body>${clone.outerHTML}</body></html>`);
  iframeDoc.close();

  // Đợi ảnh load xong mới kích hoạt in
  const images = Array.from(iframeDoc.querySelectorAll('img'));
  Promise.all(images.map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; }))).then(() => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 150);
  });
}
```

### 5.3. Nén ảnh máy khách (Client-side Compression)
Trước khi upload lên Cloud Storage:
```typescript
const options = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
};
const compressedBlob = await imageCompression(file, options);
```

---

## 6. TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI WITH GEMINI)

Sử dụng thư viện mới nhất `@google/genai` với cơ chế **Structured JSON Output**:
```typescript
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-lite",
  contents: promptContent,
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        analysis: { type: Type.STRING, description: "Phân tích điểm nghẽn hiện tại" },
        forecast: { type: Type.STRING, description: "Dự báo tiến độ 5 ngày tới" }
      },
      required: ["analysis", "forecast"]
    }
  }
});
```

---

## 7. BỘ QUY TẮC AN TOÀN BẮT BUỘC (GUARDRAILS)

1. **Tuyệt đối không tự ý Deploy**:
   * Không chạy `firebase deploy`, `npm run build`, `tauri build` nếu người dùng chưa yêu cầu rõ ràng.
   * Mọi thay đổi đều phải được nghiệm thu trên môi trường phát triển local (`npm run dev`) trước.
2. **Kiểm tra Type-Safety định kỳ**:
   * Chạy `npm run lint` (`tsc --noEmit`) để đảm bảo không phát sinh lỗi ép kiểu hoặc sai Interface.
3. **Bảo toàn chú thích & tài liệu**:
   * Không tự ý xóa các comment nghiệp vụ hoặc đoạn code ghi chú của lập trình viên trước đó.

---

## 8. HƯỚNG DẪN TÁI SỬ DỤNG CHO DỰ ÁN MỚI

Khi bạn tạo một thư mục dự án mới:
1. Tạo thư mục `.agents/skills/enterprise-app-blueprint/` trong thư mục gốc của dự án.
2. Đặt file này dưới tên `SKILL.md`.
3. Tạo file `.agents/AGENTS.md` với nội dung tóm tắt các quy tắc làm việc và quy chuẩn Clean Table.
4. Trợ lý Antigravity sẽ tự động kích hoạt bộ kỹ năng này khi bạn yêu cầu xây dựng kiến trúc, tối ưu hóa hoặc viết các module quản trị.
