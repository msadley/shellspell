import { create } from "zustand";

interface UIState {
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
  selectedCode: string | null;
  setSelectedCode: (code: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  errorMsg: null,
  setErrorMsg: (errorMsg) => set({ errorMsg }),
  selectedCode: null,
  setSelectedCode: (selectedCode) => set({ selectedCode }),
}));
