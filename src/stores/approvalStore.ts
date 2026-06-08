import { create } from 'zustand';
import type { RevisionRequest, ApprovalNode } from '../types';
import { mockRevisionRequests, mockCurrentUser } from '../data/mockData';
import { useCatalogStore } from './catalogStore';
import { loadPersist, savePersist } from './persist';

interface ApprovalState {
  pendingList: RevisionRequest[];
  approvedList: RevisionRequest[];
  currentApproval: RevisionRequest | null;
  setCurrentApproval: (approval: RevisionRequest | null) => void;
  submitApproval: (requestId: string, approverIndex: number, approved: boolean, opinion: string) => void;
  publishChange: (requestId: string) => void;
  loadLists: () => void;
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
        list.map((r) => (r.id === requestId ? { ...r, status: 'published' as const } : r));

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

    loadLists: () => {
      const catalogRequests = useCatalogStore.getState().revisionRequests;
      const split = splitByStatus(catalogRequests);
      set({ pendingList: split.pending, approvedList: split.approved });
    },
  };
});
