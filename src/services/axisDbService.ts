import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { ErpUser } from '../types/axisTypes';

export const removeUndefinedDeep = (val: any): any => {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map(removeUndefinedDeep).filter((v) => v !== undefined);
  }
  if (typeof val === 'object' && !(val instanceof Date)) {
    const res: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      const cleaned = removeUndefinedDeep(val[key]);
      if (cleaned !== undefined) {
        res[key] = cleaned;
      }
    }
    return res;
  }
  return val;
};

const LOCAL_PREFIX = 'axis_mirror_';
const SEED_FLAG_PREFIX = 'axis_seeded_v1_';
const CLOUD_MIGRATED_PREFIX = 'axis_cloud_migrated_v1_';

function readLocalMirror<T>(collectionName: string): T[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${collectionName}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMirror<T>(collectionName: string, items: T[]) {
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${collectionName}`, JSON.stringify(items));
  } catch (e) {
    console.warn('[axisDbService] Local mirror save warning:', e);
  }
}

// Bus nội bộ để cập nhật UI tức thì ngay cả khi Firestore rules cho axis_* đang chờ deploy
type LocalListener = (items: any[]) => void;
const localListeners: Record<string, Set<LocalListener>> = {};

function emitLocalChange(collectionName: string, items: any[]) {
  const set = localListeners[collectionName];
  if (set) {
    set.forEach((fn) => fn(items));
  }
}

let cloudRulesReady = true;
const cloudListeners = new Set<(ready: boolean) => void>();

export function onCloudSyncStatus(cb: (ready: boolean) => void) {
  cloudListeners.add(cb);
  cb(cloudRulesReady);
  return () => {
    cloudListeners.delete(cb);
  };
}

function setCloudStatus(ready: boolean) {
  if (cloudRulesReady !== ready) {
    cloudRulesReady = ready;
    cloudListeners.forEach((cb) => cb(ready));
  }
}

export const axisDbService = {
  // ─── AUTH USER HELPERS (SHARED WITH PROTRACK) ────────────────────────────
  getUserByUid: async (uid: string): Promise<ErpUser | null> => {
    const snap = await getDocs(query(collection(db, 'users'), where('id', '==', uid)));
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...(snap.docs[0].data() as any) } as ErpUser;
    }
    // Fallback doc ID directly
    const allSnap = await getDocs(collection(db, 'users'));
    const found = allSnap.docs.find((d) => d.id === uid || d.data().uid === uid);
    return found ? ({ id: found.id, ...(found.data() as any) } as ErpUser) : null;
  },

  getUserByIdentifier: async (identifier: string): Promise<ErpUser | null> => {
    const clean = identifier.trim().toLowerCase();
    const snap = await getDocs(collection(db, 'users'));
    const found = snap.docs.find((d) => {
      const data = d.data();
      return (
        String(data.username || '').toLowerCase() === clean ||
        String(data.email || '').toLowerCase() === clean
      );
    });
    return found ? ({ id: found.id, ...(found.data() as any) } as ErpUser) : null;
  },

  // ─── DUAL-SYNC AXIS CEO COLLECTIONS (`axis_*`) ──────────────────────────
  subscribeAxisCollection: <T extends { id: string }>(
    collectionName: string,
    callback: (items: T[]) => void,
    seedDefaults?: T[]
  ) => {
    const seedFlagKey = `${SEED_FLAG_PREFIX}${collectionName}`;
    const migratedKey = `${CLOUD_MIGRATED_PREFIX}${collectionName}`;

    // 1. Hydrate ngay lập tức từ local mirror (0ms latency) — chỉ nạp seed mẫu đúng 1 lần đầu tiên
    let initial = readLocalMirror<T>(collectionName);
    const alreadySeeded = (() => {
      try {
        return localStorage.getItem(seedFlagKey) === '1';
      } catch {
        return false;
      }
    })();

    if (initial.length === 0 && !alreadySeeded && seedDefaults && seedDefaults.length > 0) {
      initial = seedDefaults;
      writeLocalMirror(collectionName, initial);
      try {
        localStorage.setItem(seedFlagKey, '1');
      } catch {}
    } else if (initial.length > 0 && !alreadySeeded) {
      try {
        localStorage.setItem(seedFlagKey, '1');
      } catch {}
    }
    callback(initial);

    if (!localListeners[collectionName]) {
      localListeners[collectionName] = new Set();
    }
    const localHandler: LocalListener = (items) => callback(items as T[]);
    localListeners[collectionName].add(localHandler);

    // 2. Đồng bộ thời gian thực với Cloud Firestore
    let unsubFirestore = () => {};
    try {
      const q = query(collection(db, collectionName));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          setCloudStatus(true);
          const remoteItems = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })) as T[];

          const alreadyMigrated = (() => {
            try {
              return localStorage.getItem(migratedKey) === '1';
            } catch {
              return false;
            }
          })();

          if (remoteItems.length > 0) {
            try {
              localStorage.setItem(seedFlagKey, '1');
              localStorage.setItem(migratedKey, '1');
            } catch {}
            writeLocalMirror(collectionName, remoteItems);
            callback(remoteItems);
          } else if (!alreadyMigrated) {
            // Lần đầu tiên kết nối Cloud khi Cloud còn rỗng: đẩy dữ liệu Local hiện có lên 1 lần duy nhất
            try {
              localStorage.setItem(migratedKey, '1');
              localStorage.setItem(seedFlagKey, '1');
            } catch {}
            const localNow = readLocalMirror<T>(collectionName);
            if (localNow.length > 0) {
              localNow.forEach((item) => {
                const clean = removeUndefinedDeep(item);
                setDoc(
                  doc(db, collectionName, item.id),
                  {
                    ...clean,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                ).catch(() => {});
              });
            }
          } else {
            // Cloud đã từng đồng bộ và hiện tại đã được xóa hết -> tôn trọng trạng thái rỗng, không hồi sinh dữ liệu cũ
            writeLocalMirror(collectionName, []);
            callback([]);
          }
        },
        (err) => {
          if (err?.code === 'permission-denied') {
            setCloudStatus(false);
          }
        }
      );
    } catch {
      // Fallback sang local mirror an toàn
    }

    return () => {
      localListeners[collectionName]?.delete(localHandler);
      try {
        unsubFirestore();
      } catch {}
    };
  },

  saveAxisItem: async <T extends { id: string }>(collectionName: string, item: T) => {
    try {
      localStorage.setItem(`${SEED_FLAG_PREFIX}${collectionName}`, '1');
    } catch {}
    const clean = removeUndefinedDeep(item) as T;
    const current = readLocalMirror<T>(collectionName);
    const idx = current.findIndex((x) => x.id === clean.id);
    const next = idx >= 0 ? current.map((x) => (x.id === clean.id ? clean : x)) : [clean, ...current];
    writeLocalMirror(collectionName, next);
    emitLocalChange(collectionName, next);

    try {
      await setDoc(
        doc(db, collectionName, clean.id),
        {
          ...clean,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setCloudStatus(true);
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setCloudStatus(false);
      } else {
        console.warn(`[axisDbService] Cloud save note (${collectionName}):`, err);
      }
    }
  },

  deleteAxisItem: async (collectionName: string, id: string) => {
    try {
      localStorage.setItem(`${SEED_FLAG_PREFIX}${collectionName}`, '1');
      localStorage.setItem(`${CLOUD_MIGRATED_PREFIX}${collectionName}`, '1');
    } catch {}
    const current = readLocalMirror<{ id: string }>(collectionName);
    const next = current.filter((x) => x.id !== id);
    writeLocalMirror(collectionName, next);
    emitLocalChange(collectionName, next);

    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        setCloudStatus(false);
      }
    }
  },

  // ─── BRIDGE ACTIONS TO PROTRACK ERP (LIVE CLOUD) ────────────────────────

  /**
   * Duyệt hoặc Từ chối Đề xuất trực tiếp trên bảng `proposals` của ProTrack
   */
  decideErpProposal: async (
    proposalId: string,
    decision: 'APPROVED' | 'REJECTED',
    ceoUser: ErpUser,
    comment?: string
  ) => {
    const nowIso = new Date().toISOString();
    const payload: Record<string, any> =
      decision === 'APPROVED'
        ? {
            finalStatus: 'APPROVED',
            approvedById: ceoUser.id,
            approvedByName: ceoUser.name || 'CEO',
            approvedAt: nowIso,
            approvalComment: comment || 'Đã duyệt từ AXIS CEO',
          }
        : {
            finalStatus: 'REJECTED',
            rejectedById: ceoUser.id,
            rejectedByName: ceoUser.name || 'CEO',
            rejectedAt: nowIso,
            rejectionReason: comment || 'Cần xem xét lại (từ AXIS CEO)',
          };

    await updateDoc(doc(db, 'proposals', proposalId), removeUndefinedDeep(payload));
  },

  /**
   * Bắn thông báo Giao việc SMART / Triệu tập họp thẳng sang ProTrack (`notifications`)
   */
  pushNotificationToErpStaff: async (params: {
    title: string;
    content: string;
    targetUser?: string;
    targetRoles?: string[];
    ceoName: string;
    actionType?: string;
  }) => {
    const notifId = `axis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await setDoc(doc(db, 'notifications', notifId), {
      id: notifId,
      title: params.title,
      content: params.content,
      type: 'INFO',
      targetRoles: params.targetRoles || ['ADMIN', 'DIRECTOR', 'PROD_MANAGER', 'HR'],
      ...(params.targetUser ? { targetUser: params.targetUser } : {}),
      readBy: [],
      createdAt: new Date().toISOString(),
      createdBy: params.ceoName || 'Ban Giám Đốc',
      actionType: params.actionType || 'CEO_AXIS_DIRECTIVE',
      tag: `AXIS_${Date.now()}`,
    });
  },

  /**
   * Phát hành Chỉ đạo PREP / Thông báo / Lời khen sang Bảng tin Nội bộ ProTrack (`hr_profiles` docType ANNOUNCEMENT)
   */
  publishAnnouncementToErp: async (params: {
    title: string;
    content: string;
    category: 'DIRECTIVE' | 'REMINDER' | 'PRAISE' | 'ANNOUNCEMENT';
    targetType: 'ALL' | 'DEPARTMENTS' | 'INDIVIDUAL';
    targetValue: string;
    requireAck?: boolean;
    isGlobalPopup?: boolean;
    ceoUser: ErpUser;
  }) => {
    const docRef = doc(collection(db, 'hr_profiles'));
    await setDoc(docRef, {
      senderName: params.ceoUser.name || 'Ban Giám Đốc',
      senderRole: params.ceoUser.role || 'ADMIN',
      category: params.category,
      title: params.title,
      content: params.content,
      targetType: params.targetType,
      targetValue: params.targetType === 'ALL' ? 'Toàn công ty' : params.targetValue,
      createdAt: Date.now(),
      requireAck: Boolean(params.requireAck),
      isGlobalPopup: Boolean(params.isGlobalPopup),
      acknowledgedBy: [],
      images: [],
      docType: 'ANNOUNCEMENT',
    });

    if (params.targetType === 'INDIVIDUAL' && params.targetValue) {
      await axisDbService.pushNotificationToErpStaff({
        title: params.category === 'PRAISE' ? '🏆 Lời khen từ CEO' : '🔔 Chỉ đạo từ Ban Giám Đốc',
        content: `${params.title} — Vui lòng mở mục Thông báo trên ProTrack để xem chi tiết.`,
        targetUser: params.targetValue,
        ceoName: params.ceoUser.name || 'CEO',
        actionType: 'DIRECT_ANNOUNCEMENT',
      });
    }
  },

  /**
   * Ban hành Quyết định Khen thưởng chính thức sang `hr_rewards` (bật popup vinh danh trên ProTrack)
   */
  publishOfficialRewardToErp: async (params: {
    employeeName: string;
    employeeId?: string;
    description: string;
    amount?: number;
    ceoUser: ErpUser;
  }) => {
    const id = `RW-AXIS-${Date.now()}`;
    const todayStr = new Date().toISOString();
    await setDoc(
      doc(db, 'hr_rewards', id),
      removeUndefinedDeep({
        id,
        targetType: 'INDIVIDUAL',
        targetId: params.employeeId || params.employeeName,
        targetName: params.employeeName,
        reason: 'Chuyên cần / Trách nhiệm cao',
        description: params.description,
        rewardType: 'CASH',
        amount: params.amount && params.amount > 0 ? params.amount : 200000,
        proposedBy: params.ceoUser.name || 'Ban Giám Đốc',
        proposedById: params.ceoUser.id,
        approvedBy: params.ceoUser.name || 'Ban Giám Đốc',
        approvedById: params.ceoUser.id,
        status: 'APPROVED',
        date: todayStr,
        approvedDate: todayStr,
        adminNote: 'Ghi nhận trực tiếp theo nguyên tắc FFC từ hệ thống AXIS CEO',
        reactions: [],
      })
    );
  },

  /**
   * Đẩy Quy chuẩn cải tiến PDCA hoặc Giáo án đào tạo sang Kho Tài Liệu Đào Tạo ProTrack (`training_documents`)
   */
  publishTrainingDocToErp: async (params: {
    title: string;
    category: string;
    description: string;
    keyTakeaways: string[];
    ceoUser: ErpUser;
  }) => {
    const id = `TD-AXIS-${Date.now()}`;
    await setDoc(doc(db, 'training_documents', id), {
      id,
      title: params.title,
      category: params.category,
      fileType: 'doc',
      fileUrl: '#axis-standard',
      description: params.description,
      keyTakeaways: params.keyTakeaways,
      uploadedById: params.ceoUser.id,
      uploadedByName: params.ceoUser.name || 'CEO',
      createdAt: new Date().toISOString(),
      views: 0,
    });
  },
};

