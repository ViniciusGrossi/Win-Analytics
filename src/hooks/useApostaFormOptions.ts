import { useEffect, useState } from "react";
import { apostasService } from "@/services/apostas";
import { useBookiesQuery } from "@/hooks/useBookiesQuery";
import { TORNEIOS, TIPOS_APOSTA, CATEGORIAS } from "@/lib/apostas-constants";

/**
 * Opções de bookies/tipos/torneios/categorias para o ApostaForm.
 * Bookies vêm do cache do React Query (["bookies"]) — se a página já
 * carregou (ex: Banca), o diálogo abre sem nova requisição.
 * Tipos e torneios mesclam a lista estática com valores já usados pelo
 * usuário (ex: um torneio digitado manualmente que não está na lista padrão).
 */
export function useApostaFormOptions() {
  const { data: bookies = [], isLoading: loading } = useBookiesQuery();
  const [existingTipos, setExistingTipos] = useState<string[]>([]);
  const [existingTorneios, setExistingTorneios] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    apostasService.list({ limit: 1000 }).then(({ data: apostas }) => {
      if (cancelled) return;
      setExistingTipos([...new Set(apostas.map(a => a.tipo_aposta).filter(Boolean) as string[])]);
      setExistingTorneios([...new Set(apostas.map(a => a.torneio).filter(Boolean) as string[])]);
    }).catch(console.error);
    return () => { cancelled = true; };
  }, []);

  return {
    bookies,
    loading,
    tiposOptions: [...new Set([...TIPOS_APOSTA, ...existingTipos])],
    torneiosOptions: [...new Set([...TORNEIOS, ...existingTorneios])],
    categoriasOptions: [...CATEGORIAS] as string[],
  };
}
