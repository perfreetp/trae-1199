import { create } from 'zustand';
import type {
  MetricCatalog,
  CatalogQuestion,
  RevisionRequest,
} from '../types';
import {
  mockCatalogs,
  mockQuestions,
  mockRevisionRequests,
  mockCurrentUser,
} from '../data/mockData';

interface CatalogState {
  catalogs: MetricCatalog[];
  currentCatalog: MetricCatalog | null;
  questions: CatalogQuestion[];
  revisionRequests: RevisionRequest[];
  setCurrentCatalog: (catalog: MetricCatalog | null) => void;
  searchCatalogs: (keyword: string) => MetricCatalog[];
  addQuestion: (question: Omit<CatalogQuestion, 'id' | 'createdAt' | 'status'>) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  addRevisionRequest: (request: Omit<RevisionRequest, 'id' | 'createdAt' | 'status' | 'approvals'>) => void;
  updateRevisionStatus: (requestId: string, status: RevisionRequest['status']) => void;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  catalogs: mockCatalogs,
  currentCatalog: null,
  questions: mockQuestions,
  revisionRequests: mockRevisionRequests,

  setCurrentCatalog: (catalog) => set({ currentCatalog: catalog }),

  searchCatalogs: (keyword) => {
    const { catalogs } = get();
    const kw = keyword.toLowerCase();
    return catalogs.filter(
      (c) =>
        c.metricName.toLowerCase().includes(kw) ||
        c.definition.toLowerCase().includes(kw)
    );
  },

  addQuestion: (question) => {
    const newQuestion: CatalogQuestion = {
      ...question,
      id: `q${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    set((state) => ({ questions: [newQuestion, ...state.questions] }));
  },

  answerQuestion: (questionId, answer) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId
          ? { ...q, answer, answerer: mockCurrentUser, status: 'answered' }
          : q
      ),
    })),

  addRevisionRequest: (request) => {
    const newRequest: RevisionRequest = {
      ...request,
      id: `rr${Date.now()}`,
      status: 'pending',
      approvals: [],
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    set((state) => ({
      revisionRequests: [newRequest, ...state.revisionRequests],
    }));
  },

  updateRevisionStatus: (requestId, status) =>
    set((state) => ({
      revisionRequests: state.revisionRequests.map((r) =>
        r.id === requestId ? { ...r, status } : r
      ),
    })),
}));
