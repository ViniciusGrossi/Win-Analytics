import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDate(date: string): string {
  return dayjs(date).format("DD/MM/YYYY");
}

export function normalizeTurbo(turbo: number | null | undefined): number {
  if (!turbo) return 0;
  // Se for maior que 1, assumir que é porcentagem inteira (25, 50, etc) e converter para decimal
  return turbo > 1 ? turbo / 100 : turbo;
}
