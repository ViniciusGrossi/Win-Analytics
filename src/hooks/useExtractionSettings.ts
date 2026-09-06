import { useCallback, useEffect, useRef, useState } from "react";
import { aiExtractionSettingsService } from "@/services/aiExtractionSettings";
import { toast } from "@/hooks/use-toast";

export interface UseExtractionSettings {
  geral: string;
  sections: Record<string, string>;
  setGeral: (v: string) => void;
  setSection: (key: string, v: string) => void;
  appendGeral: (rule: string) => Promise<void>;
  appendSection: (key: string, rule: string) => Promise<void>;
  save: () => Promise<void>;
  saving: boolean;
  loading: boolean;
}

const append = (current: string, rule: string) => (current.trim() ? `${current.trim()}\n${rule}` : rule);

export function useExtractionSettings(): UseExtractionSettings {
  const [geral, setGeralState] = useState("");
  const [sections, setSectionsState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Espelho síncrono do state — chamadas consecutivas no mesmo tick compõem
  // sem ler estado stale (ex: ImportarAposta dispara casa + torneio em sequência).
  const stateRef = useRef({ geral, sections });
  useEffect(() => {
    stateRef.current = { geral, sections };
  }, [geral, sections]);

  useEffect(() => {
    aiExtractionSettingsService
      .get()
      .then((s) => {
        setGeralState(s.geral);
        setSectionsState(s.sections);
        stateRef.current = { geral: s.geral, sections: s.sections };
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setGeral = useCallback((v: string) => {
    stateRef.current = { ...stateRef.current, geral: v };
    setGeralState(v);
  }, []);

  const setSection = useCallback((key: string, v: string) => {
    const prev = stateRef.current.sections;
    let next: Record<string, string>;
    if (!v.trim()) {
      const { [key]: _drop, ...rest } = prev;
      next = rest;
    } else {
      next = { ...prev, [key]: v };
    }
    stateRef.current = { ...stateRef.current, sections: next };
    setSectionsState(next);
  }, []);

  // persist recebe os valores computados direto — evita ler estado stale no mesmo tick.
  const persist = useCallback(async (nextGeral: string, nextSections: Record<string, string>) => {
    setSaving(true);
    try {
      await aiExtractionSettingsService.save({ geral: nextGeral, sections: nextSections });
    } finally {
      setSaving(false);
    }
  }, []);

  const save = useCallback(async () => {
    try {
      await persist(stateRef.current.geral, stateRef.current.sections);
      toast({ title: "Configuração salva" });
    } catch (e) {
      toast({ title: "Erro ao salvar", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
    }
  }, [persist]);

  const appendGeral = useCallback(
    async (rule: string) => {
      const nextGeral = append(stateRef.current.geral, rule);
      stateRef.current = { ...stateRef.current, geral: nextGeral };
      setGeralState(nextGeral);
      try {
        await persist(nextGeral, stateRef.current.sections);
        toast({ title: "Regra salva", description: "A IA vai considerar isso nas próximas extrações" });
      } catch (e) {
        toast({ title: "Erro ao salvar regra", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
      }
    },
    [persist],
  );

  const appendSection = useCallback(
    async (key: string, rule: string) => {
      const nextSections = {
        ...stateRef.current.sections,
        [key]: append(stateRef.current.sections[key] ?? "", rule),
      };
      stateRef.current = { ...stateRef.current, sections: nextSections };
      setSectionsState(nextSections);
      try {
        await persist(stateRef.current.geral, nextSections);
        toast({ title: "Regra salva", description: "A IA vai considerar isso nas próximas extrações" });
      } catch (e) {
        toast({ title: "Erro ao salvar regra", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
      }
    },
    [persist],
  );

  return { geral, sections, setGeral, setSection, appendGeral, appendSection, save, saving, loading };
}
