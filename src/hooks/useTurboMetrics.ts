import { useMemo } from 'react';
import type { Aposta } from '@/types/betting';

export interface TurboMetrics {
  comTurbo: {
    total: number;
    investido: number;
    lucro: number;
    roi: number;
    taxaAcerto: number;
    oddMedia: number;
    lucroMedio: number;
  };
  semTurbo: {
    total: number;
    investido: number;
    lucro: number;
    roi: number;
    taxaAcerto: number;
    oddMedia: number;
    lucroMedio: number;
  };
  porNivelTurbo: {
    nivel: string;
    total: number;
    investido: number;
    lucro: number;
    roi: number;
    taxaAcerto: number;
  }[];
  lucroAdicionalTurbo: number;
  impactoROI: number;
}

export function useTurboMetrics(apostas: Aposta[]): TurboMetrics {
  return useMemo(() => {
    const apostasResolvidas = apostas.filter(a => 
      a.resultado && ['Ganhou', 'Perdeu', 'Cancelado', 'Cashout'].includes(a.resultado)
    );

    // Separar apostas com e sem turbo
    const comTurbo = apostasResolvidas.filter(a => (a.turbo || 0) > 0);
    const semTurbo = apostasResolvidas.filter(a => !(a.turbo || 0));

    // Métricas com turbo
    const turboInvestido = comTurbo.reduce((sum, a) => sum + (a.valor_apostado || 0), 0);
    const turboLucro = comTurbo.reduce((sum, a) => sum + (a.valor_final || 0), 0);
    const turboROI = turboInvestido > 0 ? (turboLucro / turboInvestido) * 100 : 0;
    const turboGanhas = comTurbo.filter(a => a.resultado === 'Ganhou' || a.resultado === 'Cashout');
    const turboTaxaAcerto = comTurbo.length > 0 ? (turboGanhas.length / comTurbo.length) * 100 : 0;
    const turboOddMedia = comTurbo.length > 0 
      ? comTurbo.reduce((sum, a) => sum + (a.odd || 0), 0) / comTurbo.length 
      : 0;
    const turboLucroMedio = comTurbo.length > 0 ? turboLucro / comTurbo.length : 0;

    // Métricas sem turbo
    const normalInvestido = semTurbo.reduce((sum, a) => sum + (a.valor_apostado || 0), 0);
    const normalLucro = semTurbo.reduce((sum, a) => sum + (a.valor_final || 0), 0);
    const normalROI = normalInvestido > 0 ? (normalLucro / normalInvestido) * 100 : 0;
    const normalGanhas = semTurbo.filter(a => a.resultado === 'Ganhou' || a.resultado === 'Cashout');
    const normalTaxaAcerto = semTurbo.length > 0 ? (normalGanhas.length / semTurbo.length) * 100 : 0;
    const normalOddMedia = semTurbo.length > 0 
      ? semTurbo.reduce((sum, a) => sum + (a.odd || 0), 0) / semTurbo.length 
      : 0;
    const normalLucroMedio = semTurbo.length > 0 ? normalLucro / semTurbo.length : 0;

    // Agrupar por nível de turbo
    const turboNiveis: Record<string, Aposta[]> = {};
    comTurbo.forEach(a => {
      const turboRaw = a.turbo || 0;
      const turboNormalizado = turboRaw > 1 ? turboRaw : turboRaw * 100;
      const nivel = `${turboNormalizado.toFixed(0)}%`;
      if (!turboNiveis[nivel]) turboNiveis[nivel] = [];
      turboNiveis[nivel].push(a);
    });

    const porNivelTurbo = Object.entries(turboNiveis)
      .map(([nivel, apostasNivel]) => {
        const investido = apostasNivel.reduce((sum, a) => sum + (a.valor_apostado || 0), 0);
        const lucro = apostasNivel.reduce((sum, a) => sum + (a.valor_final || 0), 0);
        const ganhas = apostasNivel.filter(a => a.resultado === 'Ganhou' || a.resultado === 'Cashout');
        return {
          nivel,
          total: apostasNivel.length,
          investido,
          lucro,
          roi: investido > 0 ? (lucro / investido) * 100 : 0,
          taxaAcerto: apostasNivel.length > 0 ? (ganhas.length / apostasNivel.length) * 100 : 0,
        };
      })
      .sort((a, b) => parseFloat(a.nivel) - parseFloat(b.nivel));

    // Calcular lucro adicional gerado pelo turbo
    // Para isso, precisamos comparar o lucro real com o que teria sido sem turbo
    let lucroAdicionalTurbo = 0;
    comTurbo.forEach(a => {
      if (a.resultado === 'Ganhou' || a.resultado === 'Cashout') {
        const turboRaw = a.turbo || 0;
        const turboNormalizado = turboRaw > 1 ? turboRaw / 100 : turboRaw;
        const lucroBase = (a.valor_apostado || 0) * Math.max((a.odd || 0) - 1, 0);
        const lucroBonus = (a.bonus || 0) * Math.max((a.odd || 0) - 1, 0);
        const lucroSemTurbo = lucroBase + lucroBonus;
        const lucroComTurbo = lucroSemTurbo * (1 + turboNormalizado);
        lucroAdicionalTurbo += lucroComTurbo - lucroSemTurbo;
      }
    });

    // Impacto do turbo no ROI geral
    const totalInvestido = turboInvestido + normalInvestido;
    const totalLucroSemTurbo = (turboLucro - lucroAdicionalTurbo) + normalLucro;
    const roiSemTurbo = totalInvestido > 0 ? (totalLucroSemTurbo / totalInvestido) * 100 : 0;
    const roiComTurbo = totalInvestido > 0 ? ((turboLucro + normalLucro) / totalInvestido) * 100 : 0;
    const impactoROI = roiComTurbo - roiSemTurbo;

    return {
      comTurbo: {
        total: comTurbo.length,
        investido: turboInvestido,
        lucro: turboLucro,
        roi: turboROI,
        taxaAcerto: turboTaxaAcerto,
        oddMedia: turboOddMedia,
        lucroMedio: turboLucroMedio,
      },
      semTurbo: {
        total: semTurbo.length,
        investido: normalInvestido,
        lucro: normalLucro,
        roi: normalROI,
        taxaAcerto: normalTaxaAcerto,
        oddMedia: normalOddMedia,
        lucroMedio: normalLucroMedio,
      },
      porNivelTurbo,
      lucroAdicionalTurbo,
      impactoROI,
    };
  }, [apostas]);
}
