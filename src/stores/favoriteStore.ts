import { create } from 'zustand';
import type { FavoriteCategory, OperationLog } from '../types';
import { mockFavoriteCategories, mockOperationLogs, mockCurrentUser } from '../data/mockData';
import { loadPersist, savePersist } from './persist';

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

const storedCategories = loadPersist<FavoriteCategory[]>('favorite_categories', mockFavoriteCategories);
const storedLogs = loadPersist<OperationLog[]>('operation_logs', mockOperationLogs);

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  categories: storedCategories,
  operationLogs: storedLogs,

  addCategory: (name, color) => {
    const newCategory: FavoriteCategory = {
      id: `fc${Date.now()}`,
      name,
      color,
      metricIds: [],
      order: get().categories.length,
    };
    set((state) => {
      const newCategories = [...state.categories, newCategory];
      savePersist('favorite_categories', newCategories);
      return { categories: newCategories };
    });
    get().addOperationLog('新建', '收藏分类', name, '创建新的收藏分类');
  },

  removeCategory: (categoryId) => {
    const category = get().categories.find((c) => c.id === categoryId);
    set((state) => {
      const newCategories = state.categories.filter((c) => c.id !== categoryId);
      savePersist('favorite_categories', newCategories);
      return { categories: newCategories };
    });
    if (category) {
      get().addOperationLog('删除', '收藏分类', category.name, '删除收藏分类');
    }
  },

  updateCategory: (categoryId, updates) =>
    set((state) => {
      const newCategories = state.categories.map((c) =>
        c.id === categoryId ? { ...c, ...updates } : c
      );
      savePersist('favorite_categories', newCategories);
      return { categories: newCategories };
    }),

  addToCategory: (categoryId, metricId) =>
    set((state) => {
      const newCategories = state.categories.map((c) =>
        c.id === categoryId && !c.metricIds.includes(metricId)
          ? { ...c, metricIds: [...c.metricIds, metricId] }
          : c
      );
      savePersist('favorite_categories', newCategories);
      return { categories: newCategories };
    }),

  removeFromCategory: (categoryId, metricId) =>
    set((state) => {
      const newCategories = state.categories.map((c) =>
        c.id === categoryId
          ? { ...c, metricIds: c.metricIds.filter((id) => id !== metricId) }
          : c
      );
      savePersist('favorite_categories', newCategories);
      return { categories: newCategories };
    }),

  toggleMetricFavorite: (categoryId, metricId) =>
    set((state) => {
      const newCategories = state.categories.map((c) => {
        if (c.id !== categoryId) return c;
        const has = c.metricIds.includes(metricId);
        return {
          ...c,
          metricIds: has
            ? c.metricIds.filter((id) => id !== metricId)
            : [...c.metricIds, metricId],
        };
      });
      savePersist('favorite_categories', newCategories);
      return { categories: newCategories };
    }),

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
    set((state) => {
      const newLogs = [log, ...state.operationLogs];
      savePersist('operation_logs', newLogs);
      return { operationLogs: newLogs };
    });
  },

  getMetricsByCategory: (categoryId) => {
    const category = get().categories.find((c) => c.id === categoryId);
    return category?.metricIds || [];
  },

  reorderCategories: (categories) => {
    const newCategories = categories.map((c, idx) => ({ ...c, order: idx }));
    set({ categories: newCategories });
    savePersist('favorite_categories', newCategories);
  },
}));
