import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('braseiro_user') || 'null'),
  token: localStorage.getItem('braseiro_token'),
  isAuthenticated: !!localStorage.getItem('braseiro_token'),

  login: (user, token) => {
    localStorage.setItem('braseiro_token', token);
    localStorage.setItem('braseiro_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('braseiro_token');
    localStorage.removeItem('braseiro_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...userData } : null;
      if (updatedUser) {
        localStorage.setItem('braseiro_user', JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },
}));
