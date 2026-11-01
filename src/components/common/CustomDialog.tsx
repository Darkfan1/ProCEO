import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

type DialogMode = 'alert' | 'confirm';
type ToastTone = 'success' | 'info' | 'warning' | 'error';

interface DialogRequest {
  mode: DialogMode;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  resolve: (val: boolean) => void;
}

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

let pushDialogFn: ((req: DialogRequest) => void) | null = null;
let pushToastFn: ((item: ToastItem) => void) | null = null;

export const dialogService = {
  alert: (message: string, title = 'Thông báo'): Promise<boolean> => {
    return new Promise((resolve) => {
      if (pushDialogFn) {
        pushDialogFn({ mode: 'alert', title, message, resolve });
      } else {
        resolve(true);
      }
    });
  },
  confirm: (
    message: string,
    title = 'Xác nhận thao tác',
    options?: { confirmText?: string; cancelText?: string; danger?: boolean }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      if (pushDialogFn) {
        pushDialogFn({
          mode: 'confirm',
          title,
          message,
          confirmText: options?.confirmText,
          cancelText: options?.cancelText,
          danger: options?.danger,
          resolve,
        });
      } else {
        resolve(true);
      }
    });
  },
  toast: (message: string, tone: ToastTone = 'success') => {
    if (pushToastFn) {
      pushToastFn({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        message,
        tone,
      });
    }
  },
};

export const CustomDialogHost: React.FC = () => {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    pushDialogFn = (req) => setDialog(req);
    pushToastFn = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    return () => {
      pushDialogFn = null;
      pushToastFn = null;
    };
  }, []);

  const handleResolve = (val: boolean) => {
    if (dialog) {
      dialog.resolve(val);
      setDialog(null);
    }
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium backdrop-blur-md transition-all bg-white/95 border-black/10 text-slate-800"
            >
              {t.tone === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {t.tone === 'error' && <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />}
              {t.tone === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
              {t.tone === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 text-xs ml-1"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Dialog */}
      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleResolve(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 overflow-hidden z-10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${dialog.danger ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                    {dialog.danger ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base">{dialog.title}</h3>
                </div>
                <button
                  onClick={() => handleResolve(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {dialog.message}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                {dialog.mode === 'confirm' && (
                  <button
                    onClick={() => handleResolve(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {dialog.cancelText || 'Hủy bỏ'}
                  </button>
                )}
                <button
                  onClick={() => handleResolve(true)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm transition-colors ${
                    dialog.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {dialog.confirmText || 'Đồng ý'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
