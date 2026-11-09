import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';

interface ErpAdminLoginGateProps {
  onLogin: (usernameOrEmail: string, password: string) => Promise<boolean>;
  error: string | null;
  onQuickDevLogin?: () => void;
}

export const ErpAdminLoginGate: React.FC<ErpAdminLoginGateProps> = ({
  onLogin,
  error,
  onQuickDevLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[var(--stage-bg)] text-slate-900 font-sans relative overflow-hidden">
      {/* Hiệu ứng ánh kim Xám 2.5D nền */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.85) 0%, rgba(212,216,222,0.5) 45%, rgba(185,191,200,0.85) 100%)',
        }}
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Khung Cửa Sổ Windows Vista Aero Luxury 2.5D */}
        <div className="ceo-card p-6 sm:p-8 space-y-6">
          {/* Header Thương Hiệu */}
          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 text-white border border-slate-500/80 flex items-center justify-center font-black text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_20px_-4px_rgba(15,23,42,0.45)]">
              P
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/90 border border-slate-300/90 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5 shadow-[inset_0_1px_0_#fff]">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
                ERP MVĐN • ADMIN ACCESS ONLY
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                ProCEO <span className="text-slate-600 font-bold">Mã Vạch Đồng Nai</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Đăng nhập bằng tài khoản Quản trị viên (Admin) của ERP MVĐN
              </p>
            </div>
          </div>

          {/* Form Đăng Nhập */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                Tên đăng nhập hoặc Email ERP MVĐN
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username hoặc email..."
                  autoComplete="username"
                  required
                  className="w-full !pl-10 !pr-3.5 !py-2.5 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full !pl-10 !pr-10 !py-2.5 rounded-xl text-xs font-semibold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-300/80 flex items-start gap-2.5 text-rose-800 shadow-[inset_0_1px_0_#fff]">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 btn-25d-primary rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực quyền Admin ERP...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập Bàn Điều Hành</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onQuickDevLogin && (
              <button
                type="button"
                onClick={onQuickDevLogin}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <span>⚡ Trải nghiệm nhanh quyền Giám Đốc (CEO Mode)</span>
              </button>
            )}
          </form>

          {/* Footer Trạng thái Bảo mật */}
          <div className="pt-4 border-t border-slate-300/70 flex items-center justify-between text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              ERP Cloud: mvdn-59215
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Role: ADMIN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
