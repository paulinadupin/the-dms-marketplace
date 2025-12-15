import { Currency, CurrencyType, CURRENCY_VALUES } from '../types/currency';

// Branded type prevents mixing copper with regular numbers
export type CopperAmount = number & { readonly __brand: 'Copper' };

export class CurrencyConverter {
  /**
   * Convert D&D currency to total copper pieces
   * 1 Gold = 100 Copper
   * 1 Silver = 10 Copper
   * 1 Copper = 1 Copper
   */
  static toCopper(currency: Currency): CopperAmount {
    const total =
      currency.gp * CURRENCY_VALUES.gp +
      currency.sp * CURRENCY_VALUES.sp +
      currency.cp * CURRENCY_VALUES.cp;
    return total as CopperAmount;
  }

  /**
   * Convert copper back to D&D currency format
   * Optimizes to use the highest denominations first
   */
  static fromCopper(totalCopper: CopperAmount): Currency {
    let remaining = totalCopper;

    const gp = Math.floor(remaining / CURRENCY_VALUES.gp);
    remaining = remaining % CURRENCY_VALUES.gp;

    const sp = Math.floor(remaining / CURRENCY_VALUES.sp);
    remaining = remaining % CURRENCY_VALUES.sp;

    const cp = remaining;

    return { gp, sp, cp };
  }

  /**
   * Check if player can afford an item
   */
  static canAfford(wallet: Currency, price: Currency): boolean {
    return this.toCopper(wallet) >= this.toCopper(price);
  }

  /**
   * Subtract price from wallet, returns null if can't afford
   */
  static subtract(wallet: Currency, price: Currency): Currency | null {
    const walletCopper = this.toCopper(wallet);
    const priceCopper = this.toCopper(price);

    if (walletCopper < priceCopper) return null;

    const change = (walletCopper - priceCopper) as CopperAmount;
    return this.fromCopper(change);
  }

  /**
   * Add currency together
   */
  static add(wallet: Currency, amount: Currency): Currency {
    const total = (this.toCopper(wallet) + this.toCopper(amount)) as CopperAmount;
    return this.fromCopper(total);
  }

  /**
   * Format currency for display
   */
  static format(currency: Currency): string {
    const parts: string[] = [];
    if (currency.gp > 0) parts.push(`${currency.gp} GP`);
    if (currency.sp > 0) parts.push(`${currency.sp} SP`);
    if (currency.cp > 0) parts.push(`${currency.cp} CP`);
    return parts.join(', ') || '0 CP';
  }

  /**
   * Normalize currency by converting to higher denominations
   * Example: 100 CP becomes 1 GP
   */
  static normalize(currency: Currency): Currency {
    const totalCopper = this.toCopper(currency);
    return this.fromCopper(totalCopper);
  }

  /**
   * Compare two currency amounts
   * Returns: negative if a < b, 0 if equal, positive if a > b
   */
  static compare(a: Currency, b: Currency): number {
    return this.toCopper(a) - this.toCopper(b);
  }

  /**
   * Create a currency object from a single denomination
   */
  static fromSingle(amount: number, type: CurrencyType): Currency {
    return {
      gp: type === 'gp' ? amount : 0,
      sp: type === 'sp' ? amount : 0,
      cp: type === 'cp' ? amount : 0,
    };
  }

  /**
   * Get the total value in a specific currency type
   */
  static convertTo(currency: Currency, targetType: CurrencyType): number {
    const copperAmount = this.toCopper(currency);
    return copperAmount / CURRENCY_VALUES[targetType];
  }

  /**
   * Create an empty currency object
   */
  static empty(): Currency {
    return { gp: 0, sp: 0, cp: 0 };
  }

  /**
   * Check if currency is empty (all zeros)
   */
  static isEmpty(currency: Currency): boolean {
    return currency.gp === 0 && currency.sp === 0 && currency.cp === 0;
  }
}
