import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IUserDto } from '@sbrb/shared-types';

interface IAuthStore {
  user: IUserDto | null;
  accessToken: string | null;
  currentBusinessId: string | null;
  _hasHydrated: boolean;
  setAuth: (user: IUserDto, token: string) => void;
  setUser: (user: IUserDto) => void;
  clearAuth: () => void;
  setCurrentBusiness: (id: string | null) => void;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      currentBusinessId: null,
      _hasHydrated: false,
      setAuth: (user, token) => set({ user, accessToken: token }),
      setUser: (user) => set({ user }),
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

// Subscribe to future hydrations (e.g. manual rehydrate calls)
useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.setState({ _hasHydrated: true });
});
// Hydration from localStorage is synchronous — may have already completed
// during create(), before the subscription above was registered.
if (useAuthStore.persist.hasHydrated()) {
  useAuthStore.setState({ _hasHydrated: true });
}
