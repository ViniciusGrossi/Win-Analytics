import { useMemo } from 'react';
import type { Aposta } from '@/types/betting';
import dayjs from 'dayjs';

export function useChartData(apostas: Aposta[]) {
    const equityCurveData = useMemo(() => {
        const sorted = [...apostas]
            .filter(a => a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
            .sort((a, b) => dayjs(a.data).diff(dayjs(b.data)));

        let acumuladoInvestido = 0;
        let acumuladoSaldo = 0;

        return sorted.map(a => {
            acumuladoInvestido += a.valor_apostado || 0;
            acumuladoSaldo += a.valor_final || 0;
            const retorno = acumuladoInvestido > 0 ? (acumuladoSaldo / acumuladoInvestido) * 100 : 0;

            return {
                data: dayjs(a.data).format('DD/MM'),
                retorno,
                saldo: acumuladoSaldo,
                investido: acumuladoInvestido,
            };
        });
    }, [apostas]);

    const lucroMensalData = useMemo(() => {
        const porMes = apostas
            .filter(a => a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
            .reduce((acc, a) => {
                const mes = dayjs(a.data).format('MMM/YY');
                if (!acc[mes]) acc[mes] = { investido: 0, lucro: 0 };
                acc[mes].investido += a.valor_apostado || 0;
                acc[mes].lucro += a.valor_final || 0;
                return acc;
            }, {} as Record<string, { investido: number; lucro: number }>);

        return Object.entries(porMes).map(([mes, data]) => ({
            mes,
            lucro: data.lucro,
            roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
        }));
    }, [apostas]);

    const valoresApostadosData = useMemo(() => {
        const faixas = [
            { label: '0-50', min: 0, max: 50 },
            { label: '51-100', min: 51, max: 100 },
            { label: '101-200', min: 101, max: 200 },
            { label: '201-500', min: 201, max: 500 },
            { label: '500+', min: 501, max: Infinity },
        ];

        return faixas.map(faixa => ({
            faixa: faixa.label,
            count: apostas.filter(a =>
                (a.valor_apostado || 0) >= faixa.min && (a.valor_apostado || 0) <= faixa.max
            ).length,
        }));
    }, [apostas]);

    const tipoApostaData = useMemo(() => {
        const porTipo = apostas
            .filter(a => a.tipo_aposta && a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
            .reduce((acc, a) => {
                const tipo = a.tipo_aposta || 'Outros';
                if (!acc[tipo]) acc[tipo] = { investido: 0, lucro: 0 };
                acc[tipo].investido += a.valor_apostado || 0;
                acc[tipo].lucro += a.valor_final || 0;
                return acc;
            }, {} as Record<string, { investido: number; lucro: number }>);

        return Object.entries(porTipo).map(([tipo, data]) => ({
            name: tipo,
            value: data.lucro,
            roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
        }));
    }, [apostas]);

    const performancePorCasaData = useMemo(() => {
        const porCasa = apostas
            .filter(a => a.casa_de_apostas && a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
            .reduce((acc, a) => {
                const casa = a.casa_de_apostas || 'Outros';
                if (!acc[casa]) acc[casa] = {
                    investido: 0,
                    lucro: 0,
                    apostas: 0,
                    vitorias: 0,
                    odds: [] as number[]
                };
                acc[casa].investido += a.valor_apostado || 0;
                acc[casa].lucro += a.valor_final || 0;
                acc[casa].apostas += 1;
                if (a.resultado === 'Ganhou') acc[casa].vitorias += 1;
                if (a.odd) acc[casa].odds.push(a.odd);
                return acc;
            }, {} as Record<string, { investido: number; lucro: number; apostas: number; vitorias: number; odds: number[] }>);

        return Object.entries(porCasa).map(([casa, data]) => ({
            casa,
            lucro: data.lucro,
            roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
            taxaAcerto: data.apostas > 0 ? (data.vitorias / data.apostas) * 100 : 0,
            apostas: data.apostas,
            oddMedia: data.odds.length > 0 ? data.odds.reduce((s, o) => s + o, 0) / data.odds.length : 0,
        })).sort((a, b) => b.roi - a.roi);
    }, [apostas]);

    const categoriaData = useMemo(() => {
        const apostasComCategoria = apostas.filter(a =>
            a.categoria &&
            a.resultado &&
            ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado)
        );

        const porCategoria = apostasComCategoria.reduce((acc, a) => {
            const categorias = (a.categoria || '').split(/[,;]/).map(c => c.trim()).filter(Boolean);

            categorias.forEach(cat => {
                if (!acc[cat]) acc[cat] = {
                    investido: 0,
                    lucro: 0,
                    apostas: 0,
                    vitorias: 0,
                    odds: [] as number[]
                };
                acc[cat].investido += a.valor_apostado || 0;
                acc[cat].lucro += a.valor_final || 0;
                acc[cat].apostas += 1;
                if (a.resultado === 'Ganhou') acc[cat].vitorias += 1;
                if (a.odd) acc[cat].odds.push(a.odd);
            });

            return acc;
        }, {} as Record<string, { investido: number; lucro: number; apostas: number; vitorias: number; odds: number[] }>);

        return Object.entries(porCategoria)
            .filter(([, data]) => data.apostas >= 3)
            .map(([categoria, data]) => ({
                categoria,
                lucro: data.lucro,
                roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
                taxaAcerto: data.apostas > 0 ? (data.vitorias / data.apostas) * 100 : 0,
                apostas: data.apostas,
                oddMedia: data.odds.length > 0 ? data.odds.reduce((s, o) => s + o, 0) / data.odds.length : 0,
            }))
            .sort((a, b) => b.lucro - a.lucro);
    }, [apostas]);

    const oddsRangeData = useMemo(() => {
        const faixas = [
            { label: '1.0-1.5', min: 1.0, max: 1.5 },
            { label: '1.5-2.0', min: 1.5, max: 2.0 },
            { label: '2.0-3.0', min: 2.0, max: 3.0 },
            { label: '3.0+', min: 3.0, max: Infinity },
        ];

        const apostasResolvidas = apostas.filter(a =>
            a.odd &&
            a.resultado &&
            ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado)
        );

        return faixas.map(faixa => {
            const apostasNaFaixa = apostasResolvidas.filter(a =>
                (a.odd || 0) >= faixa.min && (a.odd || 0) < faixa.max
            );

            const investido = apostasNaFaixa.reduce((s, a) => s + (a.valor_apostado || 0), 0);
            const lucro = apostasNaFaixa.reduce((s, a) => s + (a.valor_final || 0), 0);
            const vitorias = apostasNaFaixa.filter(a => a.resultado === 'Ganhou').length;

            return {
                faixa: faixa.label,
                taxaAcerto: apostasNaFaixa.length > 0 ? (vitorias / apostasNaFaixa.length) * 100 : 0,
                roi: investido > 0 ? (lucro / investido) * 100 : 0,
                count: apostasNaFaixa.length,
            };
        });
    }, [apostas]);

    const performanceDiaSemanaData = useMemo(() => {
        const porDia = apostas
            .filter(a => a.resultado && ['Ganhou', 'Perdeu', 'Cashout', 'Cancelado'].includes(a.resultado))
            .reduce((acc, a) => {
                const dia = dayjs(a.data).format('dddd');
                if (!acc[dia]) acc[dia] = { lucro: 0, apostas: 0 };
                acc[dia].lucro += a.valor_final || 0;
                acc[dia].apostas += 1;
                return acc;
            }, {} as Record<string, { lucro: number; apostas: number }>);

        const diasOrdem = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

        return diasOrdem.map(dia => ({
            dia: dia.charAt(0).toUpperCase() + dia.slice(1, 3),
            lucro: porDia[dia]?.lucro || 0,
            apostas: porDia[dia]?.apostas || 0,
        }));
    }, [apostas]);

    return {
        equityCurveData,
        lucroMensalData,
        valoresApostadosData,
        tipoApostaData,
        performancePorCasaData,
        categoriaData,
        oddsRangeData,
        performanceDiaSemanaData,
    };
}
