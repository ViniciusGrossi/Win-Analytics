import { create } from "zustand";
import { persist } from "zustand/middleware";
import dayjs from "dayjs";

interface FilterState {
  startDate: string;
  endDate: string;
  casa: string;
  tipo: string;
  resultado: string;
  search: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setCasa: (casa: string) => void;
  setTipo: (tipo: string) => void;
  setResultado: (resultado: string) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      startDate: "",
      endDate: "",
      casa: "",
      tipo: "",
      resultado: "",
      search: "",
      setStartDate: (date) => set({ startDate: date }),
      setEndDate: (date) => set({ endDate: date }),
      setCasa: (casa) => set({ casa }),
      setTipo: (tipo) => set({ tipo }),
      setResultado: (resultado) => set({ resultado }),
      setSearch: (search) => set({ search }),
      resetFilters: () => set({
        startDate: "",
        endDate: "",
        casa: "",
        tipo: "",
        resultado: "",
        search: "",
      }),
    }),
    {
      name: "betting-filters",
    }
  )
);
