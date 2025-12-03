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
  mercado: string;
  oddMin: string;
  oddMax: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setCasa: (casa: string) => void;
  setTipo: (tipo: string) => void;
  setResultado: (resultado: string) => void;
  setSearch: (search: string) => void;
  setMercado: (mercado: string) => void;
  setOddMin: (oddMin: string) => void;
  setOddMax: (oddMax: string) => void;
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
      mercado: "",
      oddMin: "",
      oddMax: "",
      setStartDate: (date) => set({ startDate: date }),
      setEndDate: (date) => set({ endDate: date }),
      setCasa: (casa) => set({ casa }),
      setTipo: (tipo) => set({ tipo }),
      setResultado: (resultado) => set({ resultado }),
      setSearch: (search) => set({ search }),
      setMercado: (mercado) => set({ mercado }),
      setOddMin: (oddMin) => set({ oddMin }),
      setOddMax: (oddMax) => set({ oddMax }),
      resetFilters: () => set({
        startDate: "",
        endDate: "",
        casa: "",
        tipo: "",
        resultado: "",
        search: "",
        mercado: "",
        oddMin: "",
        oddMax: "",
      }),
    }),
    {
      name: "betting-filters",
    }
  )
);
