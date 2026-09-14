import { create } from 'zustand';

interface UIStore {
  isAuthGateOpen: boolean;
  authGateMessage: string;
  openAuthGate: (message: string) => void;
  closeAuthGate: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isAuthGateOpen: false,
  authGateMessage: '',
  openAuthGate: (message) => set({ isAuthGateOpen: true, authGateMessage: message }),
  closeAuthGate: () => set({ isAuthGateOpen: false, authGateMessage: '' }),
}));
