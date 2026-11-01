import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ErpUser,
  ErpProposal,
  ErpNotification,
  ErpAnnouncement,
} from '../types/erpTypes';

/**
 * Loại bỏ undefined sâu để tránh Firestore crash (tuân thủ enterprise-app-blueprint)
 */
export const removeUndefinedDeep = (val: any): any => {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (Array.isArray(val)) return val.map(removeUndefinedDeep).filter((v) => v !== undefined);
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

export const erpService = {
  /**
   * Lấy danh sách tài khoản ProTrack ERP
   */
  getUsers: async (): Promise<ErpUser[]> => {
    const snap = await getDocs(query(collection(db, 'users'), limit(150)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ErpUser);
  },

  /**
   * Lấy thông tin tài khoản hiện tại từ Firestore theo uid hoặc email
   */
  getUserProfile: async (uidOrEmail: string): Promise<ErpUser | null> => {
    const userDocRef = doc(db, 'users', uidOrEmail);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as ErpUser;
    }
    // Query theo email
    const q = query(collection(db, 'users'), where('email', '==', uidOrEmail), limit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const d = querySnap.docs[0];
      return { id: d.id, ...d.data() } as ErpUser;
    }
    return null;
  },

  /**
   * Phê duyệt hoặc Từ chối Đề xuất trực tiếp trên bảng `proposals` của ProTrack ERP
   */
  decideProposal: async (
    proposalId: string,
    decision: 'APPROVED' | 'REJECTED',
    decidedBy: { id: string; name: string },
    comment?: string
  ): Promise<void> => {
    const nowIso = new Date().toISOString();
    const payload =
      decision === 'APPROVED'
        ? {
            finalStatus: 'APPROVED',
            approvedById: decidedBy.id,
            approvedByName: decidedBy.name,
            approvedAt: nowIso,
            approvalComment: comment || 'Đã duyệt qua ProCEO',
          }
        : {
            finalStatus: 'REJECTED',
            rejectedById: decidedBy.id,
            rejectedByName: decidedBy.name,
            rejectedAt: nowIso,
            rejectionReason: comment || 'Cần xem xét lại (qua ProCEO)',
          };

    await updateDoc(doc(db, 'proposals', proposalId), removeUndefinedDeep(payload));
  },

  /**
   * Gửi thông báo trực tiếp sang hệ thống thông báo ProTrack ERP (`notifications`)
   */
  pushNotification: async (params: {
    title: string;
    content: string;
    targetUser?: string;
    targetRoles?: string[];
    senderName: string;
    actionType?: string;
  }): Promise<string> => {
    const notifId = `ceo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const notification: ErpNotification = {
      id: notifId,
      title: params.title,
      content: params.content,
      type: 'INFO',
      targetRoles: params.targetRoles || ['ADMIN', 'DIRECTOR', 'PROD_MANAGER', 'HR'],
      ...(params.targetUser ? { targetUser: params.targetUser } : {}),
      readBy: [],
      createdAt: new Date().toISOString(),
      createdBy: params.senderName || 'Ban Giám Đốc',
      actionType: params.actionType || 'CEO_DIRECTIVE',
      tag: `CEO_${Date.now()}`,
    };

    await setDoc(doc(db, 'notifications', notifId), removeUndefinedDeep(notification));
    return notifId;
  },

  /**
   * Phát hành Chỉ đạo / Thông báo sang Bảng tin Nội bộ ProTrack ERP (`hr_profiles`)
   */
  publishAnnouncement: async (params: {
    title: string;
    content: string;
    category?: 'DIRECTIVE' | 'REMINDER' | 'PRAISE' | 'ANNOUNCEMENT';
    targetType?: 'ALL' | 'DEPARTMENTS' | 'INDIVIDUAL';
    targetValue?: string;
    requireAck?: boolean;
    publisherName: string;
  }): Promise<string> => {
    const announcementId = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const announcement: ErpAnnouncement = {
      id: announcementId,
      title: params.title,
      content: params.content,
      category: params.category || 'DIRECTIVE',
      targetType: params.targetType || 'ALL',
      targetValue: params.targetValue || 'ALL',
      requireAck: params.requireAck ?? false,
      publishedBy: params.publisherName || 'Ban Giám Đốc',
      publishedAt: new Date().toISOString(),
      docType: 'ANNOUNCEMENT',
    };

    await setDoc(doc(db, 'hr_profiles', announcementId), removeUndefinedDeep(announcement));
    return announcementId;
  },
};
