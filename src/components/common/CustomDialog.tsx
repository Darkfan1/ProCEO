import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

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
  alert: (message: string, title = 'Thông báo từ AXIS'): Promise<boolean> => {
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
    pushToastFn = (item) => {
      setToasts((prev) => [...prev, item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 3600);
    };
    return () => {
      pushDialogFn = null;
      pushToastFn = null;
    };
  }, []);

  const handleClose = (result: boolean) => {
    if (dialog) {
      dialog.resolve(result);
      setDialog(null);
    }
  };

  return (
    <>
      {/* Floating Executive Toasts */}
      <div className="fixed top-4 right-4 z-[120] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_30px_rgba(12,27,46,0.1)] rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              {t.tone === 'success' && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
              {t.tone === 'info' && <Info size={18} className="text-[#0C1B2E] shrink-0" />}
              {t.tone === 'warning' && <AlertTriangle size={18} className="text-amber-600 shrink-0" />}
              {t.tone === 'error' && <ShieldAlert size={18} className="text-rose-600 shrink-0" />}
              <span className="text-[13px] font-medium text-slate-800 leading-snug">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Dialog */}
      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.16 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    dialog.danger
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-[#0C1B2E]/5 text-[#0C1B2E]'
                  }`}
                >
                  {dialog.danger ? <AlertTriangle size={20} /> : <Info size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-[#0C1B2E]">{dialog.title}</h3>
                  <p className="text-[13.5px] text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                    {dialog.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                {dialog.mode === 'confirm' && (
                  <button
                    onClick={() => handleClose(false)}
                    className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {dialog.cancelText || 'Hủy'}
                  </button>
                )}
                <button
                  onClick={() => handleClose(true)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer shadow-sm ${
                    dialog.danger
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-[#0C1B2E] hover:bg-[#162B47]'
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

