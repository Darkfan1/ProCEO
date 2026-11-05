/**
 * In ấn siêu tốc qua thẻ Iframe ẩn (Safari/Chrome Print Fix - chuẩn enterprise-app-blueprint)
 */
export function triggerPrint(elementId: string, documentTitle = 'ProCEO - Báo Cáo Điều Hành') {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) return;

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-99999px';
  iframe.style.top = '0';
  iframe.style.width = '1024px';
  iframe.style.height = '768px';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    iframe.remove();
    return;
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${documentTitle}</title>
    ${styles}
    <style>
      @page { size: A4; margin: 12mm; }
      body {
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 8px;
      }
      .no-print { display: none !important; }
    </style>
  </head>
  <body>
    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 18px; font-weight: 800; color: #0f172a;">PROCEO • HỆ ĐIỀU HÀNH QUẢN TRỊ DOANH NGHIỆP</div>
        <div style="font-size: 12px; color: #475569;">Kết nối dữ liệu ERP Mã Vạch Đồng Nai (MVĐN)</div>
      </div>
      <div style="font-size: 11px; color: #64748b;">Ngày in: ${new Date().toLocaleString('vi-VN')}</div>
    </div>
    ${clone.outerHTML}
  </body>
</html>`);
  iframeDoc.close();

  const images = Array.from(iframeDoc.querySelectorAll('img'));
  Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          })
    )
  ).then(() => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1200);
    }, 180);
  });
}
