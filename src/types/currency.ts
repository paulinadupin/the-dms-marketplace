export type CurrencyType = "cp" | "sp" | "gp";

export interface Currency {
  cp: number;
  sp: number;
  gp: number;
}

export const CURRENCY_VALUES: Record<CurrencyType, number> = {
  cp: 1,
  sp: 10,
  gp: 100,
};

export const CURRENCY_NAMES: Record<CurrencyType, string> = {
  cp: "Copper Pieces",
  sp: "Silver Pieces",
  gp: "Gold Pieces",
};
