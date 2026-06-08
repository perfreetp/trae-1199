import { create } from 'zustand';
import type { RevisionRequest, ApprovalNode, ApprovalComment, User, Notification } from '../types';
import { mockRevisionRequests, mockCurrentUser, mockUsers } from '../data/mockData';
import { useCatalogStore } from './catalogStore';
import { useFavoriteStore } from './favoriteStore';
import { useSubscriptionStore } from './subscriptionStore';
import { loadPersist, savePersist } from './persist';

const nowStr = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

interface ApprovalState {
  pendingList: RevisionRequest[];
  approvedList: RevisionRequest[];
  comments: ApprovalComment[];
  currentApproval: RevisionRequest | null;
  setCurrentApproval: (approval: RevisionRequest | null) => void;
  submitApproval: (requestId: string, approverIndex: number, approved: boolean, opinion: string) => void;
  publishChange: (requestId: string) => void;
  addComment: (requestId: string, content: string, mentions: string[], attachments: string[]) => void;
  loadLists: () => void;
  loadComments: () => void;
}

const splitByStatus = (list: RevisionRequest[]) => {
  const pending: RevisionRequest[] = [];
  const approved: RevisionRequest[] = [];
  list.forEach((item) => {
    if ((item.status as string) === 'pending') pending.push(item);
    else approved.push(item);
  });
  return { pending, approved };
};

export const useApprovalStore = create<ApprovalState>((set, get) => {
  const initialSource = loadPersist<RevisionRequest[]>('catalog_revision_requests', mockRevisionRequests);
  const initial = splitByStatus(initialSource);
  const initialComments = loadPersist<ApprovalComment[]>('approval_comments', []);

  const syncToCatalog = (allRequests: RevisionRequest[]) => {
    savePersist('catalog_revision_requests', allRequests);
    const catalogState = useCatalogStore.getState();
    if (catalogState && catalogState.revisionRequests) {
      catalogState.revisionRequests = allRequests;
    }
  };

  return {
    pendingList: initial.pending,
    approvedList: initial.approved,
    comments: initialComments,
    currentApproval: null,

    setCurrentApproval: (approval) => set({ currentApproval: approval }),

    submitApproval: (requestId, approverIndex, approved, opinion) => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      const updateApproval = (list: RevisionRequest[]) =>
        list.map((r) => {
          if (r.id !== requestId) return r;
          const newApprovals: ApprovalNode[] = r.approvals.map((a, idx) =>
            idx === approverIndex
              ? {
                  ...a,
                  status: approved ? 'approved' : 'rejected',
                  opinion,
                  operatedAt: now,
                  approver: mockCurrentUser,
                }
              : a
          );
          const allApproved = newApprovals.every((a) => a.status === 'approved');
          const anyRejected = newApprovals.some((a) => a.status === 'rejected');
          let status: RevisionRequest['status'] = r.status;
          if (anyRejected) status = 'rejected';
          else if (allApproved) status = 'approved';
          return { ...r, approvals: newApprovals, status };
        });

      set((state) => {
        const newPending = updateApproval(state.pendingList);
        const newApproved = updateApproval(state.approvedList);
        const allRequests = [...newPending, ...newApproved];
        const split = splitByStatus(allRequests);
        syncToCatalog(allRequests);
        useCatalogStore.getState().revisionRequests = allRequests;
        return { pendingList: split.pending, approvedList: split.approved };
      });
    },

    publishChange: (requestId) => {
      const updateStatus = (list: RevisionRequest[]) =>
        list.map((r) => {
          if (r.id !== requestId) return r;
          const passed = r.approvals.filter((a) => a.status === 'approved');
          const opinions = passed.map((a) => `${a.approver.name}：${a.opinion ?? '同意'}`).join('；');
          return {
            ...r,
            status: 'published' as const,
            publishedBy: mockCurrentUser,
            publishedAt: nowStr(),
            approvalSummary: opinions || '审批全票通过',
          };
        });

      set((state) => {
        const newApproved = updateStatus(state.approvedList);
        const newPending = updateStatus(state.pendingList);
        const allRequests = [...newPending, ...newApproved];
        const split = splitByStatus(allRequests);
        syncToCatalog(allRequests);
        useCatalogStore.getState().revisionRequests = allRequests;
        return { pendingList: split.pending, approvedList: split.approved };
      });
    },

    addComment: (requestId, content, mentions, attachments) => {
      const now = nowStr();
      const newComment: ApprovalComment = {
        id: `ac${Date.now()}`,
        requestId,
        author: mockCurrentUser,
        content,
        mentions,
        attachments,
        createdAt: now,
      };
      set((state) => {
        const newComments = [newComment, ...state.comments];
        savePersist('approval_comments', newComments);
        return { comments: newComments };
      });
      mentions.forEach((mentionName, i) => {
        const user = mockUsers.find((u) => u.name === mentionName);
        if (user) {
          const notification: Notification = {
            id: `mention_${Date.now()}_${i}`,
            type: 'mention',
            title: '有人在审批中@了你',
            content: `${mockCurrentUser.name}：${content.slice(0, 30)}${content.length > 30 ? '...' : ''}`,
            relatedId: requestId,
            relatedType: 'approval',
            relatedPath: `/approvals/${requestId}`,
            isRead: false,
            createdAt: now,
          };
          useSubscriptionStore.getState().addNotification(notification);
        }
      });
      useFavoriteStore.getState().addOperationLog('评论', '审批中心', requestId, content);
    },

    loadLists: () => {
      const catalogRequests = useCatalogStore.getState().revisionRequests;
      const split = splitByStatus(catalogRequests);
      set({ pendingList: split.pending, approvedList: split.approved });
    },

    loadComments: () => {
      const stored = loadPersist<ApprovalComment[]>('approval_comments', []);
      set({ comments: stored });
    },
  };
});
