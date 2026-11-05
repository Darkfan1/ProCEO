import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import { erpService } from '../services/erpService';
import { ErpUser } from '../types/erpTypes';

const ADMIN_CACHE_KEY = 'proceo_admin_user';

const getCachedAdminUser = (): ErpUser | null => {
  try {
    const raw =
      localStorage.getItem(ADMIN_CACHE_KEY) ||
      localStorage.getItem('protrack_current_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ErpUser;
    if (parsed && erpService.isErpAdminUser(parsed, parsed.email)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const useErpAdminAuth = () => {
  const [adminUser, setAdminUser] = useState<ErpUser | null>(() => getCachedAdminUser());
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let authResolved = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      authResolved = true;

      if (!firebaseUser) {
        setAdminUser(null);
        try {
          localStorage.removeItem(ADMIN_CACHE_KEY);
        } catch {}
        setIsAuthReady(true);
        return;
      }

      // 1. Hydrate ngay từ cache nếu khớp UID và là Admin để giao diện phản hồi tức thì
      const cached = getCachedAdminUser();
      if (
        cached &&
        (cached.id === firebaseUser.uid ||
          cached.uid === firebaseUser.uid ||
          cached.email === firebaseUser.email)
      ) {
        setAdminUser(cached);
      }

      // 2. Đối chiếu trực tiếp hồ sơ trên bảng `users` của ERP MVĐN (Firestore)
      try {
        const profile = await erpService.getUserProfile(
          firebaseUser.uid,
          firebaseUser.email
        );

        if (profile && erpService.isErpAdminUser(profile, firebaseUser.email)) {
          const verifiedAdmin: ErpUser = {
            ...profile,
            id: profile.id || firebaseUser.uid,
            email: firebaseUser.email || profile.email,
          };
          setAdminUser(verifiedAdmin);
          setAuthError(null);
          try {
            localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(verifiedAdmin));
          } catch {}
        } else if (!profile && erpService.isErpAdminUser(null, firebaseUser.email)) {
          // Trường hợp Super Admin email được định nghĩa trong firestore.rules
          const superAdmin: ErpUser = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            username: 'admin',
            email: firebaseUser.email || 'furywing2608@gmail.com',
            name: firebaseUser.displayName || 'Ban Giám Đốc MVĐN',
            role: 'ADMIN',
            department: 'Ban Giám Đốc',
          };
          setAdminUser(superAdmin);
          setAuthError(null);
          try {
            localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(superAdmin));
          } catch {}
        } else {
          // Tài khoản hợp lệ trên ERP nhưng KHÔNG có quyền ADMIN
          const roleLabel = profile?.role || 'Nhân viên';
          const displayName = profile?.name || firebaseUser.email || 'Tài khoản';
          setAdminUser(null);
          try {
            localStorage.removeItem(ADMIN_CACHE_KEY);
          } catch {}
          setAuthError(
            `Truy cập bị từ chối: Tài khoản "${displayName}" (Vai trò: ${roleLabel}) không có quyền Quản trị viên (ADMIN) trên hệ thống ERP MVĐN.`
          );
          await signOut(auth).catch(() => {});
        }
      } catch (err) {
        console.warn('[useErpAdminAuth] Lỗi kiểm tra quyền Admin:', err);
      } finally {
        setIsAuthReady(true);
      }
    });

    // Fallback an toàn sau 3 giây nếu IndexedDB Auth bị trễ
    const fallbackTimer = setTimeout(() => {
      if (!authResolved) {
        setIsAuthReady(true);
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      try {
        unsubscribe();
      } catch {}
    };
  }, []);

  const loginWithErp = useCallback(
    async (usernameOrEmail: string, password: string): Promise<boolean> => {
      setAuthError(null);
      const cleanInput = usernameOrEmail.trim();
      if (!cleanInput || !password) {
        setAuthError('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu ERP MVĐN.');
        return false;
      }

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanInput);

      try {
        let targetEmail = cleanInput;
        let preLookupUser: ErpUser | null = null;

        if (!isEmail) {
          preLookupUser = await erpService.getUserByIdentifier(cleanInput);
          if (!preLookupUser || !preLookupUser.email) {
            setAuthError('Tài khoản không tồn tại trên hệ thống ERP MVĐN.');
            return false;
          }
          targetEmail = preLookupUser.email;
        }

        const credential = await signInWithEmailAndPassword(auth, targetEmail, password);
        const fbUser = credential.user;

        const profile =
          (await erpService.getUserProfile(fbUser.uid, fbUser.email)) || preLookupUser;

        if (!erpService.isErpAdminUser(profile, fbUser.email)) {
          const roleLabel = profile?.role || 'Nhân viên';
          const displayName = profile?.name || cleanInput;
          await signOut(auth).catch(() => {});
          setAdminUser(null);
          try {
            localStorage.removeItem(ADMIN_CACHE_KEY);
          } catch {}
          setAuthError(
            `Truy cập bị từ chối: Tài khoản "${displayName}" (Vai trò: ${roleLabel}) không có quyền Quản trị viên (ADMIN). Chỉ tài khoản Admin của ERP MVĐN mới được phép sử dụng ProCEO.`
          );
          return false;
        }

        const verifiedAdmin: ErpUser = {
          ...(profile || {
            id: fbUser.uid,
            username: cleanInput,
            name: fbUser.displayName || 'Ban Giám Đốc MVĐN',
            role: 'ADMIN',
            department: 'Ban Giám Đốc',
          }),
          id: profile?.id || fbUser.uid,
          email: fbUser.email || targetEmail,
        };

        setAdminUser(verifiedAdmin);
        try {
          localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(verifiedAdmin));
        } catch {}
        return true;
      } catch (err: any) {
        console.error('[useErpAdminAuth] Login error:', err);
        let msg = 'Không thể đăng nhập hệ thống ERP MVĐN. Vui lòng thử lại.';
        if (
          err?.code === 'auth/invalid-credential' ||
          err?.code === 'auth/user-not-found' ||
          err?.code === 'auth/wrong-password' ||
          err?.code === 'auth/invalid-email'
        ) {
          msg = 'Sai tên đăng nhập hoặc mật khẩu tài khoản ERP MVĐN.';
        } else if (err?.code === 'auth/too-many-requests') {
          msg = 'Tài khoản tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ít phút.';
        } else if (err?.message) {
          msg = err.message;
        }
        setAuthError(msg);
        return false;
      }
    },
    []
  );

  const logoutErp = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('[useErpAdminAuth] Logout error:', err);
    } finally {
      setAdminUser(null);
      setAuthError(null);
      try {
        localStorage.removeItem(ADMIN_CACHE_KEY);
      } catch {}
    }
  }, []);

  return {
    adminUser,
    isAuthReady,
    authError,
    setAuthError,
    loginWithErp,
    logoutErp,
  };
};
