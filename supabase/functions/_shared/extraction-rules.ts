// SSOT das regras base do extrator de apostas. Importado pela edge function
// (Deno, ../_shared/extraction-rules.ts) e pelo frontend Vite (@shared/extraction-rules).
// Sem imports — módulo de dados puro para não arrastar runtime de nenhum dos lados.

export const SECTION_ORDER = [
  "geral",
  "casa_de_apostas",
  "tipo_aposta",
  "partida",
  "torneio",
  "categoria",
  "valor_apostado",
  "odd",
  "is_super_odd",
  "bonus",
  "turbo",
  "data",
  "detalhes",
] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];

export const SECTION_RULES: Record<SectionKey, { titulo: string; regra: string }> = {
  geral: {
    titulo: "Geral",
    regra:
      "Você é um extrator especializado de dados de apostas esportivas brasileiras. Analise a imagem de um comprovante/ticket de aposta e extraia os dados em JSON, seguindo a estrutura exata definida no preâmbulo.",
  },
  casa_de_apostas: {
    titulo: "Casa de apostas",
    regra:
      'Se a casa estiver na lista cadastrada, use o nome EXATO da lista. Se não estiver, use o nome que aparecer na imagem ou identifique pelos padrões visuais. TURBINACO e eventos com "(BN)" indicam Betnacional.',
  },
  tipo_aposta: {
    titulo: "Tipo de aposta",
    regra: "Conte as seleções/eventos: 1=Simples, 2=Dupla, 3=Tripla, 4+=Múltipla.",
  },
  partida: {
    titulo: "Partida",
    regra:
      'SEMPRE use "x" minúsculo como separador entre os dois lados (ex: "Espanha x França"). NUNCA use "vs", "vs.", "versus" ou "×" — normalize qualquer um desses para "x".',
  },
  torneio: {
    titulo: "Torneio",
    regra:
      'OBRIGATÓRIO usar um dos valores da lista do sistema quando a competição corresponder (ex: "English Premier League"/"EPL"/"PL" → "Premier League"; "UEFA Champions League" → "Champions League"). TURBINACO não é torneio — extraia a competição real ou retorne null. Se não corresponder a nenhum da lista, retorne null.',
  },
  categoria: {
    titulo: "Categoria",
    regra:
      'Array com TODAS as categorias da aposta, usando APENAS valores da lista: ["Resultado","Finalizacoes","Escanteios","HT","FT","Gols","Chance Dupla","Chutes ao Gol","Ambas Marcam","Sofrer Falta","Cometer Falta","Cartoes","Defesas","Tiros livres","Tiros de Meta","Laterais","Desarmes","Impedimentos","Handicap","Outros"]. Se não corresponder a nenhum, retorne ["Outros"]. NUNCA retorne string, sempre array.',
  },
  valor_apostado: {
    titulo: "Valor apostado",
    regra:
      'Valor em REAIS (R$) que o usuário apostou. Rotulado como "Valor", "Aposta", "Stake", "R$", "Valor da Aposta". SEMPRE acompanhado de símbolo monetário (R$). NUNCA confunda com a odd (número decimal sem R$). Ex: "R$ 20,00" ao lado de "Valor da Aposta" e "3.00" ao lado de "Odd" → valor_apostado=20, odd=3.',
  },
  odd: {
    titulo: "Odd",
    regra:
      'Multiplicador decimal SEM símbolo monetário (ex: 1.50, 2.30, 3.00). Rotulado como "Odd", "Cota", "@ 3.00". Verificação cruzada: valor_apostado × odd ≈ "Potencial ganho"/"Retorno". Se não bater, revise os dois campos.',
  },
  is_super_odd: {
    titulo: "Super Odd",
    regra:
      "true se houver badge/destaque de Super Odd, Odd Boost, Odd Melhorada, Aposta Especial, ou prefixo TURBINACO (produto de Super Odds da Betnacional). Caso contrário false.",
  },
  bonus: {
    titulo: "Bônus",
    regra: "0 para dinheiro real. Valor numérico se indicar Freebet, Bônus, Saldo Bônus, Aposta Grátis.",
  },
  turbo: {
    titulo: "Turbo",
    regra: '0 se não houver boost. "+25%" → 0.25, "+30%" → 0.30, "+50%" → 0.50.',
  },
  data: {
    titulo: "Data",
    regra:
      'Extraia dia e mês da imagem. Para o ANO, use SEMPRE o ano atual do sistema, exceto se um ano diferente estiver claramente impresso na imagem E fizer sentido. Se só vir "HH:MM" ou "DD/MM" sem ano, use o ano atual.',
  },
  detalhes: {
    titulo: "Detalhes",
    regra: "Descrição completa da seleção da aposta.",
  },
};

/** Corpo do bloco `REGRAS DE EXTRAÇÃO` (sem header). `geral` é tratado à parte no buildPrompt. */
export function composeRules(sectionInstructions: Record<string, string> = {}): string {
  const lines: string[] = [];
  for (const key of SECTION_ORDER) {
    if (key === "geral") continue;
    lines.push(`- ${key}: ${SECTION_RULES[key].regra}`);
    const raw = sectionInstructions[key];
    const adj = typeof raw === "string" ? raw.trim() : "";
    if (adj) lines.push(`  → AJUSTE DO USUÁRIO: ${adj}`);
  }
  lines.push("- Para campos não encontrados, use null");
  lines.push("- Responda APENAS com o JSON, sem markdown, sem explicações");
  return lines.join("\n");
}

// Self-check — roda com `node supabase/functions/_shared/extraction-rules.ts`
// (Node 24: type-stripping + import.meta.main). Também true sob `deno run`.
if (import.meta.main) {
  const orderKeys = [...SECTION_ORDER].sort();
  const ruleKeys = Object.keys(SECTION_RULES).sort();
  console.assert(
    JSON.stringify(orderKeys) === JSON.stringify(ruleKeys),
    "SECTION_ORDER e SECTION_RULES precisam ter as mesmas chaves",
  );

  const out = composeRules({ categoria: "categoria sempre inclui Escanteios quando houver linha de escanteio" });
  const catLine = out.indexOf("- categoria:");
  const adjLine = out.indexOf("→ AJUSTE DO USUÁRIO:", catLine);
  const nextLine = out.indexOf("- valor_apostado:", catLine);
  console.assert(catLine >= 0, "composeRules deve emitir a linha de categoria");
  console.assert(adjLine > catLine && adjLine < nextLine, "ajuste de categoria deve vir logo após a regra base e antes de valor_apostado");

  const clean = composeRules();
  console.assert(!clean.includes("AJUSTE DO USUÁRIO"), "sem sectionInstructions não deve haver linha de ajuste");
  console.assert(clean.trimEnd().endsWith("sem markdown, sem explicações"), "linhas fixas devem fechar o bloco");

  console.log("extraction-rules self-check OK");
}
