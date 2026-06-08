import { create } from 'zustand';
import type { AnomalyTicket, TicketTimeline, TicketComment, User, ReviewResponsibility } from '../types';
import { mockTickets, mockCurrentUser, mockUsers } from '../data/mockData';
import { loadPersist, savePersist } from './persist';

type TicketStatusFilter = 'all' | AnomalyTicket['status'];
type TicketListTab = AnomalyTicket['status'];

const SLA_HOURS: Record<AnomalyTicket['level'], number> = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 48,
};

function addSLADefaults(list: AnomalyTicket[]): AnomalyTicket[] {
  return list.map((t) => {
    const hasAll = t.slaDeadline && typeof t.urgedCount === 'number';
    if (hasAll) return t;
    const base = t.detectedAt || t.createdAt;
    const dt = new Date(base.replace(/-/g, '/'));
    dt.setHours(dt.getHours() + SLA_HOURS[t.level]);
    const pad = (n: number) => String(n).padStart(2, '0');
    const deadline = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
    return { ...t, slaDeadline: deadline, urgedCount: t.urgedCount ?? 0 };
  });
}

export const RESPONSIBILITY_LABELS: Record<ReviewResponsibility, string> = {
  data: '数据团队',
  business: '业务团队',
  tech: '技术团队',
  thirdparty: '第三方问题',
  none: '无责任（正常波动）',
};

export interface TicketCompletedInfo {
  overdueCompleted: boolean;
  overdueSeconds: number;
  completedTime: string;
}

export interface SLAInfoExtended {
  remainingSeconds: number;
  remainingText: string;
  status: 'overdue' | 'warning-1h' | 'warning-4h' | 'safe';
  percent: number;
  completedInfo?: TicketCompletedInfo;
  urgedCount: number;
}

interface TicketState {
  tickets: AnomalyTicket[];
  comments: TicketComment[];
  statusFilter: TicketStatusFilter;
  listTab: TicketListTab;
  currentTicket: AnomalyTicket | null;
  setStatusFilter: (status: TicketStatusFilter) => void;
  setListTab: (tab: TicketListTab) => void;
  setCurrentTicket: (ticket: AnomalyTicket | null) => void;
  claimTicket: (ticketId: string) => void;
  processTicket: (ticketId: string, rootCause: string, resolution?: string, evidences?: string[]) => void;
  completeTicket: (ticketId: string, resolution: string) => void;
  reassignTicket: (ticketId: string, newHandler: User) => void;
  urgeTicket: (ticketId: string) => void;
  saveReview: (ticketId: string, conclusion: string, responsibility: ReviewResponsibility) => void;
  addComment: (ticketId: string, content: string, mentions?: string[], attachments?: string[]) => void;
  addTimeline: (ticketId: string, action: string, remark?: string) => void;
  getSLAInfo: (ticketId: string, now?: number) => SLAInfoExtended;
  getFilteredTickets: () => AnomalyTicket[];
  getTicketCounts: () => Record<TicketStatusFilter, number>;
}

const _storedTickets = loadPersist<AnomalyTicket[]>('tickets', mockTickets);
const storedTickets: AnomalyTicket[] = addSLADefaults(_storedTickets);

const storedComments = loadPersist<TicketComment[]>('ticket_comments', []);

function nowStr() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function calcSlaDeadline(level: AnomalyTicket['level'], baseDate: string): string {
  const dt = new Date(baseDate.replace(/-/g, '/'));
  dt.setHours(dt.getHours() + SLA_HOURS[level]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: storedTickets,
  comments: storedComments,
  statusFilter: 'all',
  listTab: 'pending',
  currentTicket: null,

  setStatusFilter: (status) => set({ statusFilter: status }),
  setListTab: (tab) => set({ listTab: tab }),

  setCurrentTicket: (ticket) => set({ currentTicket: ticket }),

  claimTicket: (ticketId) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const timeline: TicketTimeline = {
      action: '认领工单',
      operator: mockCurrentUser,
      remark: '已认领处理',
      timestamp: now,
    };
    set((state) => {
      const newTickets = state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              handler: mockCurrentUser,
              status: 'processing' as const,
              timestamps: [...t.timestamps, timeline],
            }
          : t
      );
      savePersist('tickets', newTickets);
      return { tickets: newTickets };
    });
  },

  processTicket: (ticketId, rootCause, resolution, evidences = []) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const ticket = get().tickets.find((t) => t.id === ticketId);
    const handlerName = ticket?.handler?.name;
    const isDelegate = handlerName && ticket?.handler?.id !== mockCurrentUser.id;
    const remark = isDelegate
      ? `[代处理（实际处理人：${mockCurrentUser.name} / 指派处理人：${handlerName}）] ${rootCause}`
      : rootCause;
    const timeline: TicketTimeline = {
      action: isDelegate ? '代处理' : '处理中',
      operator: mockCurrentUser,
      remark,
      timestamp: now,
    };
    set((state) => {
      const newTickets = state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              rootCause,
              resolution,
              evidences: [...t.evidences, ...evidences],
              timestamps: [...t.timestamps, timeline],
            }
          : t
      );
      savePersist('tickets', newTickets);
      return { tickets: newTickets };
    });
  },

  completeTicket: (ticketId, resolution) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const ticket = get().tickets.find((t) => t.id === ticketId);
    const handlerName = ticket?.handler?.name;
    const isDelegate = handlerName && ticket?.handler?.id !== mockCurrentUser.id;
    const remark = isDelegate
      ? `[代完成（操作人：${mockCurrentUser.name} / 指派处理人：${handlerName}）] ${resolution}`
      : resolution;
    const timeline: TicketTimeline = {
      action: isDelegate ? '代处理完成' : '处理完成',
      operator: mockCurrentUser,
      remark,
      timestamp: now,
    };
    set((state) => {
      const newTickets = state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'completed' as const, resolution, timestamps: [...t.timestamps, timeline] }
          : t
      );
      savePersist('tickets', newTickets);
      return { tickets: newTickets };
    });
  },

  reassignTicket: (ticketId, newHandler) => {
    const now = nowStr();
    const currentHandler = get().tickets.find((t) => t.id === ticketId)?.handler;
    const timeline: TicketTimeline = {
      action: '转派工单',
      operator: mockCurrentUser,
      remark: `从 ${currentHandler?.name ?? '未指定'} 转派给 ${newHandler.name}`,
      timestamp: now,
    };
    set((state) => {
      const newTickets = state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, handler: newHandler, timestamps: [...t.timestamps, timeline] }
          : t
      );
      savePersist('tickets', newTickets);
      return { tickets: newTickets };
    });
  },

  urgeTicket: (ticketId) => {
    const now = nowStr();
    const ticket = get().tickets.find((x) => x.id === ticketId);
    const urgeTarget = ticket?.handler ?? ticket?.assignee;
    const urgeTargetName = urgeTarget?.name ?? '当前处理人';
    const urgeCount = (ticket?.urgedCount ?? 0) + 1;
    const timeline: TicketTimeline = {
      action: '催办工单',
      operator: mockCurrentUser,
      remark: `第${urgeCount}次催办（催办对象：${urgeTargetName}），请尽快处理`,
      timestamp: now,
    };
    set((state) => {
      const newTickets = state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, urgedCount: (t.urgedCount ?? 0) + 1, timestamps: [...t.timestamps, timeline] }
          : t
      );
      savePersist('tickets', newTickets);
      if (urgeTarget && urgeTarget.id !== mockCurrentUser.id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { useSubscriptionStore } = require('./subscriptionStore');
          useSubscriptionStore.getState().addNotification({
            id: `urge_${ticketId}_${Date.now()}`,
            type: 'anomaly',
            title: `工单被催办`,
            content: `${mockCurrentUser.name} 催办工单「${ticket?.title ?? ''}」（第${urgeCount}次）`,
            relatedId: ticketId,
            relatedType: 'ticket',
            relatedPath: `/tickets/${ticketId}`,
            isRead: false,
            createdAt: now,
          });
        } catch (_e) { /* ignore */ }
      }
      return { tickets: newTickets };
    });
  },

  saveReview: (ticketId, conclusion, responsibility) => {
    const now = nowStr();
    const timeline: TicketTimeline = {
      action: '补充复盘',
      operator: mockCurrentUser,
      remark: `责任分类：${RESPONSIBILITY_LABELS[responsibility]}｜复盘结论：${conclusion}`,
      timestamp: now,
    };
    set((state) => {
      const newTickets = state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              reviewConclusion: conclusion,
              reviewResponsibility: responsibility,
              reviewBy: mockCurrentUser,
              reviewTime: now,
              timestamps: [...t.timestamps, timeline],
            }
          : t
      );
      savePersist('tickets', newTickets);
      return { tickets: newTickets };
    });
  },

  addComment: (ticketId, content, mentions = [], attachments = []) => {
    const now = nowStr();
    const newComment: TicketComment = {
      id: `tc${Date.now()}`,
      ticketId,
      author: mockCurrentUser,
      content,
      mentions,
      attachments,
      createdAt: now,
    };
    set((state) => {
      const newComments = [newComment, ...state.comments];
      savePersist('ticket_comments', newComments);
      return { comments: newComments };
    });
  },

  addTimeline: (ticketId, action, remark) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const timeline: TicketTimeline = {
      action,
      operator: mockCurrentUser,
      remark,
      timestamp: now,
    };
    set((state) => {
      const newTickets = state.tickets.map((t) =>
        t.id === ticketId ? { ...t, timestamps: [...t.timestamps, timeline] } : t
      );
      savePersist('tickets', newTickets);
      return { tickets: newTickets };
    });
  },

  getSLAInfo: (ticketId, nowTs) => {
    const t = get().tickets.find((x) => x.id === ticketId);
    const now = nowTs ?? Date.now();
    const empty: SLAInfoExtended = {
      remainingSeconds: 0, remainingText: '无', status: 'safe', percent: 0, urgedCount: 0,
    };
    if (!t) return empty;

    const deadline = new Date(t.slaDeadline.replace(/-/g, '/')).getTime();
    const base = new Date((t.detectedAt || t.createdAt).replace(/-/g, '/')).getTime();
    const totalMs = deadline - base;
    const remainingMs = deadline - now;
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const percent = totalMs > 0 ? Math.min(100, Math.max(0, (remainingMs / totalMs) * 100)) : 0;

    let status: SLAInfoExtended['status'] = 'safe';
    if (remainingSeconds < 0) status = 'overdue';
    else if (remainingSeconds < 3600) status = 'warning-1h';
    else if (remainingSeconds < 14400) status = 'warning-4h';

    const absSec = Math.abs(remainingSeconds);
    const hours = Math.floor(absSec / 3600);
    const minutes = Math.floor((absSec % 3600) / 60);
    let remainingText: string;
    if (status === 'overdue') {
      remainingText = hours > 0 ? `已超时${hours}h${minutes}m` : `已超时${minutes}m`;
    } else {
      remainingText = hours > 0 ? `剩余${hours}h${minutes}m` : `剩余${minutes}m`;
    }

    let completedInfo: TicketCompletedInfo | undefined;
    if (t.status === 'completed') {
      const completedTs = t.timestamps.find((tl) => tl.action === '处理完成')?.timestamp;
      const completedTime = completedTs ?? t.createdAt;
      const completedMs = new Date(completedTime.replace(/-/g, '/')).getTime();
      const overdueMs = completedMs - deadline;
      completedInfo = {
        completedTime,
        overdueCompleted: overdueMs > 0,
        overdueSeconds: Math.floor(overdueMs / 1000),
      };
    }

    return {
      remainingSeconds, remainingText, status, percent,
      completedInfo, urgedCount: t.urgedCount ?? 0,
    };
  },

  getFilteredTickets: () => {
    const { tickets, statusFilter } = get();
    if (statusFilter === 'all') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  },

  getTicketCounts: () => {
    const { tickets } = get();
    return {
      all: tickets.length,
      pending: tickets.filter((t) => t.status === 'pending').length,
      processing: tickets.filter((t) => t.status === 'processing').length,
      completed: tickets.filter((t) => t.status === 'completed').length,
    };
  },
}));
