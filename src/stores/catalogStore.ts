import { create } from 'zustand';
import type {
  MetricCatalog,
  CatalogQuestion,
  RevisionRequest,
  User,
} from '../types';
import {
  mockCatalogs,
  mockQuestions,
  mockRevisionRequests,
  mockCurrentUser,
  mockUsers,
} from '../data/mockData';
import { loadPersist, savePersist } from './persist';

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

const storedQuestions = loadPersist<CatalogQuestion[]>('catalog_questions', mockQuestions);
const storedRevisionRequests = loadPersist<RevisionRequest[]>('catalog_revision_requests', mockRevisionRequests);

export const useCatalogStore = create<CatalogState>((set, get) => ({
  catalogs: mockCatalogs,
  currentCatalog: null,
  questions: storedQuestions,
  revisionRequests: storedRevisionRequests,

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
    set((state) => {
      const newQuestions = [newQuestion, ...state.questions];
      savePersist('catalog_questions', newQuestions);
      return { questions: newQuestions };
    });
  },

  answerQuestion: (questionId, answer) =>
    set((state) => {
      const newQuestions = state.questions.map((q) =>
        q.id === questionId
          ? { ...q, answer, answerer: mockCurrentUser, status: 'answered' as const }
          : q
      );
      savePersist('catalog_questions', newQuestions);
      return { questions: newQuestions };
    }),

  addRevisionRequest: (request) => {
    const approvers: User[] = mockUsers.filter((u) => u.role === 'manager' || u.role === 'admin').slice(0, 2);
    const newRequest: RevisionRequest = {
      ...request,
      id: `rr${Date.now()}`,
      status: 'pending',
      approvals: approvers.map((u, idx) => ({
        id: `a${Date.now()}-${idx}`,
        order: idx + 1,
        approver: u,
        status: idx === 0 ? 'pending' : 'pending',
      })),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    set((state) => {
      const newRevisionRequests = [newRequest, ...state.revisionRequests];
      savePersist('catalog_revision_requests', newRevisionRequests);
      return { revisionRequests: newRevisionRequests };
    });
  },

  updateRevisionStatus: (requestId, status) =>
    set((state) => {
      const newRevisionRequests = state.revisionRequests.map((r) =>
        r.id === requestId ? { ...r, status } : r
      );
      savePersist('catalog_revision_requests', newRevisionRequests);
      return { revisionRequests: newRevisionRequests };
    }),
}));
