export const FREELOVABLE_PLANS = {
  diario: {
    id: "diario",
    nome: "Plano Diário",
    periodo: "1 dia de acesso",
    valor: 17,
    maxParcelas: 1,
  },
  mensal: {
    id: "mensal",
    nome: "Plano Mensal",
    periodo: "30 dias de acesso",
    valor: 47,
    maxParcelas: 1,
  },
  trimestral: {
    id: "trimestral",
    nome: "Plano Trimestral",
    periodo: "90 dias de acesso",
    valor: 111,
    maxParcelas: 3,
  },
  anual: {
    id: "anual",
    nome: "Plano Anual",
    periodo: "365 dias de acesso",
    valor: 324,
    maxParcelas: 12,
  },
} as const;

export type FreelovablePlanId = keyof typeof FREELOVABLE_PLANS;

export function isFreelovablePlanId(value: unknown): value is FreelovablePlanId {
  return typeof value === "string" && value in FREELOVABLE_PLANS;
}
