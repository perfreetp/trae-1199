import { create } from 'zustand';
import type { User } from '../types';
import { mockCurrentUser, mockUsers } from '../data/mockData';

interface UserState {
  currentUser: User | null;
  userList: User[];
  isLoggedIn: boolean;
  setCurrentUser: (user: User) => void;
  login: (userId: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: mockCurrentUser,
  userList: mockUsers,
  isLoggedIn: true,

  setCurrentUser: (user) => set({ currentUser: user }),

  login: (userId) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user, isLoggedIn: true });
      return true;
    }
    return false;
  },

  logout: () => set({ currentUser: null, isLoggedIn: false }),

  addUser: (user) =>
    set((state) => ({ userList: [...state.userList, user] })),
}));
