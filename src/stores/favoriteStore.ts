import { create } from 'zustand';
import type { FavoriteCategory, OperationLog } from '../types';
import { mockFavoriteCategories, mockOperationLogs, mockCurrentUser } from '../data/mockData';

interface FavoriteState {
  categories: FavoriteCategory[];
  operationLogs: OperationLog[];
  addCategory: (name: string, color: string) => void;
  removeCategory: (categoryId: string) => void;
  updateCategory: (categoryId: string, updates: Partial<FavoriteCategory>) => void;
  addToCategory: (categoryId: string, metricId: string) => void;
  removeFromCategory: (categoryId: string, metricId: string) => void;
  toggleMetricFavorite: (categoryId: string, metricId: string) => void;
  addOperationLog: (type: string, module: string, targetName: string, detail: string) => void;
  getMetricsByCategory: (categoryId: string) => string[];
  reorderCategories: (categories: FavoriteCategory[]) => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  categories: mockFavoriteCategories,
  operationLogs: mockOperationLogs,

  addCategory: (name, color) => {
    const newCategory: FavoriteCategory = {
      id: `fc${Date.now()}`,
      name,
      color,
      metricIds: [],
      order: get().categories.length,
    };
    set((state) => ({ categories: [...state.categories, newCategory] }));
    get().addOperationLog('新建', '收藏分类', name, '创建新的收藏分类');
  },

  removeCategory: (categoryId) => {
    const category = get().categories.find((c) => c.id === categoryId);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== categoryId),
    }));
    if (category) {
      get().addOperationLog('删除', '收藏分类', category.name, '删除收藏分类');
    }
  },

  updateCategory: (categoryId, updates) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId ? { ...c, ...updates } : c
      ),
    })),

  addToCategory: (categoryId, metricId) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId && !c.metricIds.includes(metricId)
          ? { ...c, metricIds: [...c.metricIds, metricId] }
          : c
      ),
    })),

  removeFromCategory: (categoryId, metricId) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId
          ? { ...c, metricIds: c.metricIds.filter((id) => id !== metricId) }
          : c
      ),
    })),

  toggleMetricFavorite: (categoryId, metricId) =>
    set((state) => ({
      categories: state.categories.map((c) => {
        if (c.id !== categoryId) return c;
        const has = c.metricIds.includes(metricId);
        return {
          ...c,
          metricIds: has
            ? c.metricIds.filter((id) => id !== metricId)
            : [...c.metricIds, metricId],
        };
      }),
    })),

  addOperationLog: (type, module, targetName, detail) => {
    const log: OperationLog = {
      id: `ol${Date.now()}`,
      type,
      module,
      targetName,
      detail,
      operator: mockCurrentUser,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    set((state) => ({ operationLogs: [log, ...state.operationLogs] }));
  },

  getMetricsByCategory: (categoryId) => {
    const category = get().categories.find((c) => c.id === categoryId);
    return category?.metricIds || [];
  },

  reorderCategories: (categories) =>
    set({
      categories: categories.map((c, idx) => ({ ...c, order: idx })),
    }),
}));
