export interface Aposta {
  id: number;
  categoria: string | null;
  tipo_aposta: string | null;
  casa_de_apostas: string | null;
  valor_apostado: number | null;
  odd: number | null;
  valor_final: number | null;
  bonus: number | null;
  turbo: number | null;
  resultado: string | null;
  detalhes: string | null;
  partida: string | null;
  torneio: string | null;
  data: string | null;
}

export interface Bookie {
  id: number;
  name: string;
  balance: number | null;
  last_deposit: string | null;
  last_withdraw: string | null;
  last_update: string | null;
  created_at: string | null;
}

export interface ApostaFormData {
  categoria: string;
  tipo_aposta: string;
  casa_de_apostas: string;
  valor_apostado: number;
  odd: number;
  bonus: number;
  turbo: number;
  detalhes?: string;
  partida?: string;
  torneio?: string;
  data: string;
}

export interface KPIData {
  totalApostado: number;
  lucro: number;
  roi: number;
  taxaAcerto: number;
  totalApostas: number;
  apostasPendentes: number;
}

export interface SeriesData {
  date: string;
  lucro: number;
  apostas: number;
}

export interface DistributionData {
  name: string;
  value: number;
  percentage: number;
}

export type ResultadoType = 'Ganhou' | 'Perdeu' | 'Cancelado' | 'Cashout' | 'Pendente';

export type TransactionType = 'deposit' | 'withdraw' | 'recarga' | 'saque' | 'transferencia' | 'bonus' | 'ajuste' | 'outros_esportes';

export interface Transaction {
  id: number;
  bookie_id: number | null;
  amount: number | null;
  type: string;
  description: string | null;
  created_at: string | null;
}

export interface Goal {
  id: number;
  daily_goal: number | null;
  monthly_goal: number | null;
  loss_limit: number | null;
  result: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
