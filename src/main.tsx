import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMessage: error?.message || String(error),
    };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[ProCEO ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              Đang đồng bộ lại cấu trúc dữ liệu ProCEO
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Phát hiện dữ liệu bộ nhớ đệm từ phiên bản cũ: {this.state.errorMessage}
            </p>
            <button
              onClick={() => {
                try {
                  Object.keys(localStorage).forEach((k) => {
                    if (k.startsWith('proceo_') || k.startsWith('axis_')) {
                      localStorage.removeItem(k);
                    }
                  });
                } catch {}
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Làm mới & Khôi phục giao diện ngay
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
