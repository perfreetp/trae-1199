import { create } from 'zustand';
import type { AnomalyTicket, TicketTimeline } from '../types';
import { mockTickets, mockCurrentUser } from '../data/mockData';

type TicketStatusFilter = 'all' | AnomalyTicket['status'];

interface TicketState {
  tickets: AnomalyTicket[];
  statusFilter: TicketStatusFilter;
  currentTicket: AnomalyTicket | null;
  setStatusFilter: (status: TicketStatusFilter) => void;
  setCurrentTicket: (ticket: AnomalyTicket | null) => void;
  claimTicket: (ticketId: string) => void;
  processTicket: (ticketId: string, rootCause: string, resolution?: string, evidences?: string[]) => void;
  completeTicket: (ticketId: string, resolution: string) => void;
  addTimeline: (ticketId: string, action: string, remark?: string) => void;
  getFilteredTickets: () => AnomalyTicket[];
  getTicketCounts: () => Record<TicketStatusFilter, number>;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: mockTickets,
  statusFilter: 'all',
  currentTicket: null,

  setStatusFilter: (status) => set({ statusFilter: status }),

  setCurrentTicket: (ticket) => set({ currentTicket: ticket }),

  claimTicket: (ticketId) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const timeline: TicketTimeline = {
      action: '认领工单',
      operator: mockCurrentUser,
      remark: '已认领处理',
      timestamp: now,
    };
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              handler: mockCurrentUser,
              status: 'processing',
              timestamps: [...t.timestamps, timeline],
            }
          : t
      ),
    }));
  },

  processTicket: (ticketId, rootCause, resolution, evidences = []) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const timeline: TicketTimeline = {
      action: '处理中',
      operator: mockCurrentUser,
      remark: rootCause,
      timestamp: now,
    };
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              rootCause,
              resolution,
              evidences: [...t.evidences, ...evidences],
              timestamps: [...t.timestamps, timeline],
            }
          : t
      ),
    }));
  },

  completeTicket: (ticketId, resolution) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const timeline: TicketTimeline = {
      action: '处理完成',
      operator: mockCurrentUser,
      remark: resolution,
      timestamp: now,
    };
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'completed', resolution, timestamps: [...t.timestamps, timeline] }
          : t
      ),
    }));
  },

  addTimeline: (ticketId, action, remark) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const timeline: TicketTimeline = {
      action,
      operator: mockCurrentUser,
      remark,
      timestamp: now,
    };
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, timestamps: [...t.timestamps, timeline] } : t
      ),
    }));
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
