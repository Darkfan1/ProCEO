import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { axisDbService } from '../services/axisDbService';
import { AxisLogo } from './common/AxisLogo';
import { Lock, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  authError: string | null;
  setAuthError: (msg: string | null) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ authError, setAuthError }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setLoading(true);
    setAuthError(null);

    try {
      let email = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isEmail) {
        const userRecord = await axisDbService.getUserByIdentifier(email);
        if (!userRecord || !userRecord.email) {
          throw new Error('Không tìm thấy tài khoản trên cơ sở dữ liệu ProTrack.');
        }
        email = userRecord.email;
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/user-not-found'
      ) {
        setAuthError('Tên đăng nhập hoặc mật khẩu chưa chính xác.');
      } else {
        setAuthError(err?.message || 'Không thể kết nối xác thực. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setAuthError(err?.message || 'Đăng nhập Google không thành công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle architectural axis background lines */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
        <div className="w-[620px] h-[620px] rounded-full border border-[#0C1B2E]" />
        <div className="absolute w-[380px] h-[380px] rounded-full border border-[#0C1B2E]" />
        <div className="absolute w-full h-px bg-[#0C1B2E]" />
        <div className="absolute h-full w-px bg-[#0C1B2E]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <AxisLogo size={68} />
          <h1 className="mt-5 text-[26px] font-extrabold tracking-[0.28em] text-[#0C1B2E]">
            AXIS
          </h1>
          <p className="mt-1.5 text-[12px] font-semibold tracking-[0.18em] text-[#9D772B] uppercase">
            Trục Điều Phối • Hệ Quy Chiếu CEO
          </p>
          <p className="mt-3 text-[13px] text-slate-500 max-w-xs leading-relaxed">
            Kết nối trực tiếp dữ liệu thời gian thực với hệ thống ERP{' '}
            <span className="font-semibold text-slate-700">Mã Vạch Đồng Nai</span>
          </p>
        </div>

        <div className="axis-card p-7 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Tài khoản CEO / Admin (ProTrack)
              </label>
              <div className="relative">
                <UserIcon
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Tên đăng nhập hoặc Email..."
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-[#0C1B2E] focus:outline-none text-[13.5px] text-slate-800 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-[#0C1B2E] focus:outline-none text-[13.5px] text-slate-800 transition-colors"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[12.5px] text-rose-700 font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0C1B2E] hover:bg-[#152B47] text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập Bàn Điều Hành'}</span>
              {!loading && <ArrowRight size={15} className="text-[#DFBE73]" />}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              hoặc
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[13px] flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.1.74-2.51 1.18-4.22 1.18-3.25 0-6-2.19-6.98-5.14H1.01v3.14C3.02 21.17 7.18 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.02 14.03c-.25-.74-.39-1.54-.39-2.36s.14-1.62.39-2.36V6.17H1.01C.37 7.45 0 8.89 0 10.42s.37 2.97 1.01 4.25l4.01-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.51-3.51C18.07 1.19 15.3 0 12 0 7.18 0 3.02 2.83 1.01 6.83l4.01 3.14c.98-2.95 3.73-5.22 6.98-5.22Z"
              />
            </svg>
            <span>Tiếp tục với Google CEO</span>
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-slate-400">
          <ShieldCheck size={14} className="text-[#C69C47]" />
          <span>Không gian bảo mật dành riêng cho Ban Giám Đốc</span>
        </div>
      </div>
    </div>
  );
};

