import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IUserDto } from '@sbrb/shared-types';

interface IAuthStore {
  user: IUserDto | null;
  accessToken: string | null;
  currentBusinessId: string | null;
  setAuth: (user: IUserDto, token: string) => void;
  clearAuth: () => void;
  setCurrentBusiness: (id: string | null) => void;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      currentBusinessId: null,
      setAuth: (user, token) => set({ user, accessToken: token }),
      clearAuth: () => set({ user: null, accessToken: null, currentBusinessId: null }),
      setCurrentBusiness: (id) => set({ currentBusinessId: id }),
    }),
    {
      name: 'sbrb-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        currentBusinessId: state.currentBusinessId,
      }),
    },
  ),
);
