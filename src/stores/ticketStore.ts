import { create } from 'zustand';
import type { AnomalyTicket, TicketTimeline, TicketComment, User } from '../types';
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
    if (t.slaDeadline && typeof t.urgedCount === 'number') return t;
    const base = t.detectedAt || t.createdAt;
    const dt = new Date(base.replace(/-/g, '/'));
    dt.setHours(dt.getHours() + SLA_HOURS[t.level]);
    const pad = (n: number) => String(n).padStart(2, '0');
    const deadline = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
    return { ...t, slaDeadline: deadline, urgedCount: t.urgedCount ?? 0 };
  });
}

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
    const timeline: TicketTimeline = {
      action: '处理中',
      operator: mockCurrentUser,
      remark: rootCause,
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
    const timeline: TicketTimeline = {
      action: '处理完成',
      operator: mockCurrentUser,
      remark: resolution,
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
    const timeline: TicketTimeline = {
      action: '催办工单',
      operator: mockCurrentUser,
      remark: `第${(get().tickets.find((x) => x.id === ticketId)?.urgedCount ?? 0) + 1}次催办，请尽快处理`,
      timestamp: now,
    };
    set((state) => {
      const newTickets = state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, urgedCount: (t.urgedCount ?? 0) + 1, timestamps: [...t.timestamps, timeline] }
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
