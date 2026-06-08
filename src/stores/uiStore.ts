import { create } from 'zustand';
import type { ToastState, ModalState, BottomNavKey, ToastType } from '../types';

interface UIState {
  loading: boolean;
  loadingCount: number;
  toast: ToastState;
  modal: ModalState;
  activeNav: BottomNavKey;
  setLoading: (loading: boolean) => void;
  showLoading: () => void;
  hideLoading: () => void;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
  showModal: (type: string, data?: unknown) => void;
  hideModal: () => void;
  setActiveNav: (nav: BottomNavKey) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set, get) => ({
  loading: false,
  loadingCount: 0,
  toast: { visible: false, type: 'info', message: '' },
  modal: { visible: false, type: '', data: undefined },
  activeNav: 'dashboard',

  setLoading: (loading) => set({ loading, loadingCount: loading ? 1 : 0 }),

  showLoading: () =>
    set((state) => ({
      loading: true,
      loadingCount: state.loadingCount + 1,
    })),

  hideLoading: () =>
    set((state) => {
      const count = Math.max(0, state.loadingCount - 1);
      return { loading: count > 0, loadingCount: count };
    }),

  showToast: (message, type = 'info', duration = 2500) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { visible: true, type, message } });
    toastTimer = setTimeout(() => {
      get().hideToast();
    }, duration);
  },

  hideToast: () =>
    set({ toast: { visible: false, type: 'info', message: '' } }),

  showModal: (type, data) =>
    set({ modal: { visible: true, type, data } }),

  hideModal: () =>
    set({ modal: { visible: false, type: '', data: undefined } }),

  setActiveNav: (nav) => set({ activeNav: nav }),
}));
