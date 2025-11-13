import { useMemo } from 'react';
import type { Aposta } from '@/types/betting';
import dayjs from 'dayjs';

export interface DashboardMetrics {
  totalInvestido: number;
  totalInvestidoVariacao: number;
  roi: number;
  roiStatus: 'Excelente' | 'Positivo' | 'Negativo';
  lucroTotal: number;
  maiorGanho: { valor: number; aposta: Aposta | null };
  taxaAcerto: number;
  taxaStatus: 'Excelente' | 'Bom' | 'Abaixo';
  totalApostas: number;
  apostasPorDia: number;
  diasAtivos: number;
  oddMedia: number;
  oddMaisAlta: number;
  oddMaisBaixa: number;
  maiorSequenciaVitorias: number;
  maiorSequenciaDerrotas: number;
  sequenciaAtual: number;
}

export interface PerformanceMetrics {
  yield: number;
  consistenciaROI: number;
  strikeRateOddsAltas: number;
  apostasPorMes: number;
  melhorMes: { mes: string; roi: number };
  piorMes: { mes: string; roi: number };
  roiMesAtual: number;
  oddOtima: { faixa: string; roi: number };
  volumeIdeal: number;
  roiProjetado: number;
  precisao: number;
  recall: number;
  f1Score: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  winLossRatio: number;
}

export interface RiskMetrics {
  maxDrawdown: number;
  volatilidade: number;
  scoreRisco: number;
  kellyPercentual: number;
  valueAtRisk: number;
  expectedShortfall: number;
  recoveryTime: number;
  riskAdjustedReturn: number;
  drawdownSeries: { date: string; drawdown: number }[];
}

export interface OddsMetrics {
  valueBets: number;
  acertoOddsBaixas: number;
  acertoOddsAltas: number;
  oddMediaVencedora: number;
  sweetSpot: { faixa: string; roi: number; taxa: number };
  movimentoOdds: {
    subiram: { total: number; vitorias: number; taxa: number };
    desceram: { total: number; vitorias: number; taxa: number };
    estaveis: { total: number; vitorias: number; taxa: number };
  };
  timingInsight: string;
}

export interface TemporalMetrics {
  melhorDia: { dia: string; lucro: number };
  melhorHorario: { hora: number; lucro: number } | null;
  melhorMes: { mes: string; roi: number };
  diasConsecutivos: number;
  heatmapMensal: { ano: number; mes: number; roi: number; lucro: number }[];
}

export function useDashboardMetrics(apostas: Aposta[]): DashboardMetrics {
  return useMemo(() => {
    const totalInvestido = apostas.reduce((sum, a) => sum + (a.valor_apostado || 0), 0);
    
    // Variação do período anterior
    const hoje = dayjs();
    const diasPeriodo = apostas.length > 0 
      ? hoje.diff(dayjs(apostas[apostas.length - 1]?.data), 'days') 
      : 30;
    const dataInicioPeriodoAnterior = hoje.subtract(diasPeriodo * 2, 'days');
    const dataFimPeriodoAnterior = hoje.subtract(diasPeriodo, 'days');
    
    const apostasAnterior = apostas.filter(a => 
      dayjs(a.data).isAfter(dataInicioPeriodoAnterior) && 
      dayjs(a.data).isBefore(dataFimPeriodoAnterior)
    );
    const totalInvestidoAnterior = apostasAnterior.reduce((sum, a) => sum + (a.valor_apostado || 0), 0);
    const totalInvestidoVariacao = totalInvestidoAnterior > 0 
      ? ((totalInvestido - totalInvestidoAnterior) / totalInvestidoAnterior) * 100 
      : 0;

    const apostasResolvidas = apostas.filter(a => 
      a.resultado && ['Ganhou', 'Perdeu', 'Cancelado', 'Cashout'].includes(a.resultado)
    );
    
    const lucroTotal = apostasResolvidas.reduce((sum, a) => sum + (a.valor_final || 0), 0);
    const roi = totalInvestido > 0 ? (lucroTotal / totalInvestido) * 100 : 0;
    const roiStatus = roi >= 5 ? 'Excelente' : roi >= 0 ? 'Positivo' : 'Negativo';

    // Maior ganho
    let maiorGanho = { valor: 0, aposta: null as Aposta | null };
    apostasResolvidas.forEach(a => {
      const lucroAposta = (a.valor_final || 0);
      if (lucroAposta > maiorGanho.valor) {
        maiorGanho = { valor: lucroAposta, aposta: a };
      }
    });

    const apostasGanhas = apostasResolvidas.filter(a => a.resultado === 'Ganhou');
    const taxaAcerto = apostasResolvidas.length > 0 
      ? (apostasGanhas.length / apostasResolvidas.length) * 100 
      : 0;
    const taxaStatus = taxaAcerto >= 60 ? 'Excelente' : taxaAcerto >= 50 ? 'Bom' : 'Abaixo';

    // Dias ativos
    const diasUnicos = new Set(apostas.map(a => a.data).filter(Boolean));
    const diasAtivos = diasUnicos.size;
    const apostasPorDia = diasAtivos > 0 ? apostas.length / diasAtivos : 0;

    // Odds
    const oddsValidas = apostas.map(a => a.odd).filter((o): o is number => o != null && o > 0);
    const oddMedia = oddsValidas.length > 0 
      ? oddsValidas.reduce((sum, o) => sum + o, 0) / oddsValidas.length 
      : 0;
    const oddMaisAlta = oddsValidas.length > 0 ? Math.max(...oddsValidas) : 0;
    const oddMaisBaixa = oddsValidas.length > 0 ? Math.min(...oddsValidas) : 0;

    // Sequências
    let sequenciaAtual = 0;
    let maiorSequenciaVitorias = 0;
    let maiorSequenciaDerrotas = 0;
    let tempVitorias = 0;
    let tempDerrotas = 0;

    const apostasOrdenadas = [...apostasResolvidas].sort((a, b) => 
      dayjs(a.data).diff(dayjs(b.data))
    );

    apostasOrdenadas.forEach(a => {
      if (a.resultado === 'Ganhou' || a.resultado === 'Cashout') {
        tempVitorias++;
        tempDerrotas = 0;
        maiorSequenciaVitorias = Math.max(maiorSequenciaVitorias, tempVitorias);
      } else if (a.resultado === 'Perdeu') {
        tempDerrotas++;
        tempVitorias = 0;
        maiorSequenciaDerrotas = Math.max(maiorSequenciaDerrotas, tempDerrotas);
      }
    });

    sequenciaAtual = tempVitorias > 0 ? tempVitorias : -tempDerrotas;

    return {
      totalInvestido,
      totalInvestidoVariacao,
      roi,
      roiStatus,
      lucroTotal,
      maiorGanho,
      taxaAcerto,
      taxaStatus,
      totalApostas: apostas.length,
      apostasPorDia,
      diasAtivos,
      oddMedia,
      oddMaisAlta,
      oddMaisBaixa,
      maiorSequenciaVitorias,
      maiorSequenciaDerrotas,
      sequenciaAtual,
    };
  }, [apostas]);
}

export function usePerformanceMetrics(apostas: Aposta[]): PerformanceMetrics {
  return useMemo(() => {
    const apostasResolvidas = apostas.filter(a => 
      a.resultado && ['Ganhou', 'Perdeu', 'Cancelado', 'Cashout'].includes(a.resultado)
    );

    const totalInvestido = apostas.reduce((sum, a) => sum + (a.valor_apostado || 0), 0);
    const lucroTotal = apostasResolvidas.reduce((sum, a) => sum + (a.valor_final || 0), 0);
    const yield_ = totalInvestido > 0 ? (lucroTotal / totalInvestido) * 100 : 0;

    // ROI por mês
    const porMes = apostasResolvidas.reduce((acc, a) => {
      const mes = dayjs(a.data).format('YYYY-MM');
      if (!acc[mes]) acc[mes] = { investido: 0, lucro: 0 };
      acc[mes].investido += a.valor_apostado || 0;
      acc[mes].lucro += a.valor_final || 0;
      return acc;
    }, {} as Record<string, { investido: number; lucro: number }>);

    const mesesData = Object.entries(porMes).map(([mes, data]) => ({
      mes,
      roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
      lucro: data.lucro,
    }));

    const mesesLucrativos = mesesData.filter(m => m.lucro > 0);
    const consistenciaROI = mesesData.length > 0 
      ? (mesesLucrativos.length / mesesData.length) * 100 
      : 0;

    const melhorMes = mesesData.length > 0
      ? mesesData.reduce((max, m) => m.roi > max.roi ? m : max, mesesData[0])
      : { mes: '—', roi: 0 };

    const piorMes = mesesData.length > 0
      ? mesesData.reduce((min, m) => m.roi < min.roi ? m : min, mesesData[0])
      : { mes: '—', roi: 0 };

    const mesAtual = dayjs().format('YYYY-MM');
    const roiMesAtual = porMes[mesAtual] 
      ? (porMes[mesAtual].lucro / porMes[mesAtual].investido) * 100 
      : 0;

    // Strike rate odds altas
    const apostasOddsAltas = apostasResolvidas.filter(a => (a.odd || 0) > 2.0);
    const strikeRateOddsAltas = apostasOddsAltas.length > 0
      ? (apostasOddsAltas.filter(a => a.resultado === 'Ganhou').length / apostasOddsAltas.length) * 100
      : 0;

    const apostasPorMes = mesesData.length > 0 ? apostas.length / mesesData.length : 0;

    // Odd ótima
    const faixasOdd = apostasResolvidas.reduce((acc, a) => {
      const odd = a.odd || 0;
      const faixa = Math.floor(odd / 0.5) * 0.5;
      const faixaStr = `${faixa.toFixed(1)}-${(faixa + 0.5).toFixed(1)}`;
      if (!acc[faixaStr]) acc[faixaStr] = { investido: 0, lucro: 0, count: 0 };
      acc[faixaStr].investido += a.valor_apostado || 0;
      acc[faixaStr].lucro += a.valor_final || 0;
      acc[faixaStr].count += 1;
      return acc;
    }, {} as Record<string, { investido: number; lucro: number; count: number }>);

    const faixasArray = Object.entries(faixasOdd)
      .filter(([, data]) => data.count >= 5)
      .map(([faixa, data]) => ({
        faixa,
        roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
      }));

    const oddOtima = faixasArray.length > 0
      ? faixasArray.reduce((max, f) => f.roi > max.roi ? f : max, faixasArray[0])
      : { faixa: '—', roi: 0 };

    const volumeIdeal = mesesLucrativos.length > 0
      ? mesesLucrativos.reduce((sum, m) => sum + porMes[m.mes].investido, 0) / mesesLucrativos.length
      : totalInvestido / (mesesData.length || 1);

    const roiProjetado = oddOtima.roi;

    // Precision, Recall, F1
    const vp = apostasResolvidas.filter(a => a.resultado === 'Ganhou').length;
    const fn = apostasResolvidas.filter(a => a.resultado === 'Perdeu').length;
    const precisao = (vp + fn) > 0 ? (vp / (vp + fn)) * 100 : 0;
    const recall = precisao; // Simplificado
    const f1Score = (precisao + recall) > 0 ? 2 * (precisao * recall) / (precisao + recall) : 0;

    // KPIs avançados
    const retornos = apostasResolvidas.map(a => {
      const investido = a.valor_apostado || 0;
      return investido > 0 ? ((a.valor_final || 0) / investido) * 100 : 0;
    });

    const retornoMedio = retornos.length > 0 
      ? retornos.reduce((sum, r) => sum + r, 0) / retornos.length 
      : 0;

    const variancia = retornos.length > 0
      ? retornos.reduce((sum, r) => sum + Math.pow(r - retornoMedio, 2), 0) / retornos.length
      : 0;
    const desvio = Math.sqrt(variancia);

    const sharpeRatio = desvio > 0 ? retornoMedio / desvio : 0;

    const retornosNegativos = retornos.filter(r => r < 0);
    const desvioNegativo = retornosNegativos.length > 0
      ? Math.sqrt(
          retornosNegativos.reduce((sum, r) => sum + Math.pow(r - retornoMedio, 2), 0) / 
          retornosNegativos.length
        )
      : 0;
    const sortinoRatio = desvioNegativo > 0 ? retornoMedio / desvioNegativo : 0;

    // Max drawdown simplificado
    let peak = 0;
    let maxDD = 0;
    let acumulado = 0;
    apostasResolvidas.forEach(a => {
      acumulado += a.valor_final || 0;
      if (acumulado > peak) peak = acumulado;
      const dd = peak > 0 ? ((peak - acumulado) / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
    });

    const calmarRatio = maxDD > 0 ? yield_ / maxDD : 0;

    const vitorias = apostasResolvidas.filter(a => a.resultado === 'Ganhou').length;
    const derrotas = apostasResolvidas.filter(a => a.resultado === 'Perdeu').length;
    const winLossRatio = derrotas > 0 ? vitorias / derrotas : vitorias;

    return {
      yield: yield_,
      consistenciaROI,
      strikeRateOddsAltas,
      apostasPorMes,
      melhorMes,
      piorMes,
      roiMesAtual,
      oddOtima,
      volumeIdeal,
      roiProjetado,
      precisao,
      recall,
      f1Score,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      winLossRatio,
    };
  }, [apostas]);
}

export function useRiskMetrics(apostas: Aposta[]): RiskMetrics {
  return useMemo(() => {
    const apostasResolvidas = apostas.filter(a => 
      a.resultado && ['Ganhou', 'Perdeu', 'Cancelado', 'Cashout'].includes(a.resultado)
    );

    // Drawdown
    const apostasOrdenadas = [...apostasResolvidas].sort((a, b) => 
      dayjs(a.data).diff(dayjs(b.data))
    );

    let peak = 0;
    let maxDrawdown = 0;
    let acumulado = 0;
    const drawdownSeries: { date: string; drawdown: number }[] = [];

    apostasOrdenadas.forEach(a => {
      acumulado += a.valor_final || 0;
      if (acumulado > peak) peak = acumulado;
      const dd = peak > 0 ? ((peak - acumulado) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
      drawdownSeries.push({ date: a.data || '', drawdown: -dd });
    });

    // Volatilidade
    const retornos = apostasResolvidas.map(a => {
      const investido = a.valor_apostado || 0;
      return investido > 0 ? ((a.valor_final || 0) / investido) * 100 : 0;
    });

    const retornoMedio = retornos.length > 0 
      ? retornos.reduce((sum, r) => sum + r, 0) / retornos.length 
      : 0;

    const variancia = retornos.length > 0
      ? retornos.reduce((sum, r) => sum + Math.pow(r - retornoMedio, 2), 0) / retornos.length
      : 0;
    const volatilidade = Math.sqrt(variancia);

    // Score de risco
    const taxaAcerto = apostasResolvidas.length > 0
      ? (apostasResolvidas.filter(a => a.resultado === 'Ganhou').length / apostasResolvidas.length) * 100
      : 0;
    const scoreRisco = Math.min(100, 
      (maxDrawdown * 0.4) + (volatilidade * 0.4) + ((100 - taxaAcerto) * 0.2)
    );

    // Kelly
    const vitorias = apostasResolvidas.filter(a => a.resultado === 'Ganhou');
    const p = apostasResolvidas.length > 0 ? vitorias.length / apostasResolvidas.length : 0;
    const oddsVencedoras = vitorias.map(a => a.odd).filter((o): o is number => o != null && o > 0);
    const b = oddsVencedoras.length > 0
      ? (oddsVencedoras.reduce((sum, o) => sum + o, 0) / oddsVencedoras.length) - 1
      : 0;
    const kelly = b > 0 ? ((p * b - (1 - p)) / b) * 100 : 0;
    const kellyPercentual = Math.max(0, Math.min(25, kelly));

    // VaR e Expected Shortfall
    const retornosOrdenados = [...retornos].sort((a, b) => a - b);
    const indiceVaR = Math.floor(retornosOrdenados.length * 0.05);
    const valueAtRisk = retornosOrdenados[indiceVaR] || 0;
    const expectedShortfall = retornosOrdenados.length > 0
      ? retornosOrdenados.slice(0, indiceVaR).reduce((sum, r) => sum + r, 0) / Math.max(1, indiceVaR)
      : 0;

    // Recovery time
    let maxRecoveryDays = 0;
    let inDrawdown = false;
    let drawdownStart = '';

    apostasOrdenadas.forEach(a => {
      acumulado += a.valor_final || 0;
      if (acumulado < peak) {
        if (!inDrawdown) {
          inDrawdown = true;
          drawdownStart = a.data || '';
        }
      } else {
        if (inDrawdown) {
          const days = dayjs(a.data).diff(dayjs(drawdownStart), 'days');
          maxRecoveryDays = Math.max(maxRecoveryDays, days);
          inDrawdown = false;
        }
        peak = acumulado;
      }
    });

    const recoveryTime = maxRecoveryDays;

    const sharpeRatio = volatilidade > 0 ? retornoMedio / volatilidade : 0;
    const riskAdjustedReturn = sharpeRatio * 100;

    return {
      maxDrawdown,
      volatilidade,
      scoreRisco,
      kellyPercentual,
      valueAtRisk,
      expectedShortfall,
      recoveryTime,
      riskAdjustedReturn,
      drawdownSeries,
    };
  }, [apostas]);
}

export function useOddsMetrics(apostas: Aposta[]): OddsMetrics {
  return useMemo(() => {
    const apostasResolvidas = apostas.filter(a => 
      a.resultado && ['Ganhou', 'Perdeu', 'Cancelado', 'Cashout'].includes(a.resultado)
    );

    // Value bets
    const valueBetsCount = apostasResolvidas.filter(a => {
      if (a.resultado === 'Ganhou') {
        const investido = a.valor_apostado || 0;
        const lucro = a.valor_final || 0;
        const roiAposta = investido > 0 ? (lucro / investido) * 100 : 0;
        return roiAposta > 10;
      }
      return false;
    }).length;
    const valueBets = apostasResolvidas.length > 0 
      ? (valueBetsCount / apostasResolvidas.length) * 100 
      : 0;

    // Odds baixas e altas
    const oddsBaixas = apostasResolvidas.filter(a => (a.odd || 0) >= 1.0 && (a.odd || 0) <= 1.5);
    const acertoOddsBaixas = oddsBaixas.length > 0
      ? (oddsBaixas.filter(a => a.resultado === 'Ganhou').length / oddsBaixas.length) * 100
      : 0;

    const oddsAltas = apostasResolvidas.filter(a => (a.odd || 0) > 3.0);
    const acertoOddsAltas = oddsAltas.length > 0
      ? (oddsAltas.filter(a => a.resultado === 'Ganhou').length / oddsAltas.length) * 100
      : 0;

    const apostasGanhas = apostasResolvidas.filter(a => a.resultado === 'Ganhou');
    const oddsVencedoras = apostasGanhas.map(a => a.odd).filter((o): o is number => o != null && o > 0);
    const oddMediaVencedora = oddsVencedoras.length > 0
      ? oddsVencedoras.reduce((sum, o) => sum + o, 0) / oddsVencedoras.length
      : 0;

    // Sweet spot
    const faixasDetalhadas = apostasResolvidas.reduce((acc, a) => {
      const odd = a.odd || 0;
      const faixa = Math.floor(odd / 0.25) * 0.25;
      const faixaStr = `${faixa.toFixed(2)}-${(faixa + 0.25).toFixed(2)}`;
      if (!acc[faixaStr]) acc[faixaStr] = { investido: 0, lucro: 0, count: 0, vitorias: 0 };
      acc[faixaStr].investido += a.valor_apostado || 0;
      acc[faixaStr].lucro += a.valor_final || 0;
      acc[faixaStr].count += 1;
      if (a.resultado === 'Ganhou') acc[faixaStr].vitorias += 1;
      return acc;
    }, {} as Record<string, { investido: number; lucro: number; count: number; vitorias: number }>);

    const faixasArray = Object.entries(faixasDetalhadas)
      .filter(([, data]) => data.count >= 5)
      .map(([faixa, data]) => ({
        faixa,
        roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
        taxa: data.count > 0 ? (data.vitorias / data.count) * 100 : 0,
      }));

    const sweetSpot = faixasArray.length > 0
      ? faixasArray.reduce((max, f) => f.roi > max.roi ? f : max, faixasArray[0])
      : { faixa: '—', roi: 0, taxa: 0 };

    // Movimento de odds (simplificado - assumindo que não temos oddInicial/oddFinal)
    const movimentoOdds = {
      subiram: { total: 0, vitorias: 0, taxa: 0 },
      desceram: { total: 0, vitorias: 0, taxa: 0 },
      estaveis: { total: apostasResolvidas.length, vitorias: apostasGanhas.length, taxa: 0 },
    };
    movimentoOdds.estaveis.taxa = movimentoOdds.estaveis.total > 0
      ? (movimentoOdds.estaveis.vitorias / movimentoOdds.estaveis.total) * 100
      : 0;

    const timingInsight = 'Performance similar independente do movimento';

    return {
      valueBets,
      acertoOddsBaixas,
      acertoOddsAltas,
      oddMediaVencedora,
      sweetSpot,
      movimentoOdds,
      timingInsight,
    };
  }, [apostas]);
}

export function useTemporalMetrics(apostas: Aposta[]): TemporalMetrics {
  return useMemo(() => {
    const apostasResolvidas = apostas.filter(a => 
      a.resultado && ['Ganhou', 'Perdeu', 'Cancelado', 'Cashout'].includes(a.resultado)
    );

    // Por dia da semana
    const porDia = apostasResolvidas.reduce((acc, a) => {
      const dia = dayjs(a.data).format('dddd');
      if (!acc[dia]) acc[dia] = { lucro: 0 };
      acc[dia].lucro += a.valor_final || 0;
      return acc;
    }, {} as Record<string, { lucro: number }>);

    const melhorDia = Object.keys(porDia).length > 0
      ? Object.entries(porDia).reduce((max, [dia, data]) => 
          data.lucro > max.lucro ? { dia, lucro: data.lucro } : max,
          { dia: '—', lucro: 0 }
        )
      : { dia: '—', lucro: 0 };

    // Melhor horário (não disponível sem dataHoraAposta)
    const melhorHorario = null;

    // Por mês
    const porMes = apostasResolvidas.reduce((acc, a) => {
      const mes = dayjs(a.data).format('MMMM');
      if (!acc[mes]) acc[mes] = { investido: 0, lucro: 0 };
      acc[mes].investido += a.valor_apostado || 0;
      acc[mes].lucro += a.valor_final || 0;
      return acc;
    }, {} as Record<string, { investido: number; lucro: number }>);

    const mesesArray = Object.entries(porMes)
      .filter(([, data]) => data.investido > 0)
      .map(([mes, data]) => ({
        mes,
        roi: (data.lucro / data.investido) * 100,
      }));

    const melhorMes = mesesArray.length > 0
      ? mesesArray.reduce((max, m) => m.roi > max.roi ? m : max, mesesArray[0])
      : { mes: '—', roi: 0 };

    // Dias consecutivos
    const datasOrdenadas = [...new Set(apostas.map(a => a.data).filter(Boolean))]
      .sort()
      .reverse();
    
    let diasConsecutivos = 0;
    for (let i = 0; i < datasOrdenadas.length - 1; i++) {
      const diff = dayjs(datasOrdenadas[i]).diff(dayjs(datasOrdenadas[i + 1]), 'days');
      if (diff === 1) {
        diasConsecutivos++;
      } else {
        break;
      }
    }
    if (datasOrdenadas.length > 0) diasConsecutivos++;

    // Heatmap mensal
    const heatmapData = apostasResolvidas.reduce((acc, a) => {
      const ano = dayjs(a.data).year();
      const mes = dayjs(a.data).month();
      const key = `${ano}-${mes}`;
      if (!acc[key]) acc[key] = { ano, mes, investido: 0, lucro: 0 };
      acc[key].investido += a.valor_apostado || 0;
      acc[key].lucro += a.valor_final || 0;
      return acc;
    }, {} as Record<string, { ano: number; mes: number; investido: number; lucro: number }>);

    const heatmapMensal = Object.values(heatmapData).map(data => ({
      ano: data.ano,
      mes: data.mes,
      roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
      lucro: data.lucro,
    }));

    return {
      melhorDia,
      melhorHorario,
      melhorMes,
      diasConsecutivos,
      heatmapMensal,
    };
  }, [apostas]);
}
