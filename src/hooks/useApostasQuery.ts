import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apostasService, type ListParams } from "@/services/apostas";

/**
 * Queries de apostas via React Query. Todas as chaves começam com "apostas",
 * então `useInvalidateApostas()` invalida list/kpis/series de uma vez —
 * qualquer tela montada revalida sozinha, sem botão "Atualizar" manual.
 */
export function useApostasList(params: ListParams = {}) {
  return useQuery({
    queryKey: ["apostas", "list", params],
    queryFn: () => apostasService.list(params).then((r) => r.data),
  });
}

export function useApostasKpis(params: ListParams = {}) {
  return useQuery({
    queryKey: ["apostas", "kpis", params],
    queryFn: () => apostasService.kpis(params),
  });
}

export function useApostasSeries(params: ListParams = {}) {
  return useQuery({
    queryKey: ["apostas", "series", params],
    queryFn: () => apostasService.series(params),
  });
}

export function useInvalidateApostas() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["apostas"] });
}
