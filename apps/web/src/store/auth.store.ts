import { create } from 'zustand';
import type { IUserDto } from '@sbrb/shared-types';

interface IAuthStore {
  user: IUserDto | null;
  accessToken: string | null; // memory only — NOT localStorage
  currentBusinessId: string | null;
  setAuth: (user: IUserDto, token: string) => void;
  clearAuth: () => void;
  setCurrentBusiness: (id: string) => void;
}

export const useAuthStore = create<IAuthStore>((set) => ({
  user: null,
  accessToken: null,
  currentBusinessId: null,
  setAuth: (user, token) => set({ user, accessToken: token }),
  clearAuth: () => set({ user: null, accessToken: null, currentBusinessId: null }),
  setCurrentBusiness: (id) => set({ currentBusinessId: id }),
}));
