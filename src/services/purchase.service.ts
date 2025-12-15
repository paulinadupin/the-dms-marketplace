import type { Currency } from '../types/currency';
import type { Item } from '../types/item';
import { CurrencyConverter } from '../utils/currency';
import { ItemService } from './item.service';
import { ShopService } from './shop.service';

export interface PurchaseResult {
  success: boolean;
  message: string;
  newCurrency?: Currency;
  newShopCurrency?: Currency;
}

export class PurchaseService {
  /**
   * Purchase an item (decreases player currency, decreases stock, increases shop currency)
   * This handles the Firebase stock update, while player currency is managed in localStorage
   */
  static async purchaseItem(
    itemId: string,
    shopId: string,
    playerCurrency: Currency,
    shopCurrency: Currency,
    item: Item
  ): Promise<PurchaseResult> {
    try {
      // Check if player can afford
      if (!item.cost) {
        return {
          success: false,
          message: 'Item has no price set',
        };
      }

      const itemCost = {
        cp: item.cost.currency === 'cp' ? item.cost.amount : 0,
        sp: item.cost.currency === 'sp' ? item.cost.amount : 0,
        gp: item.cost.currency === 'gp' ? item.cost.amount : 0,
      };

      if (!CurrencyConverter.canAfford(playerCurrency, itemCost)) {
        return {
          success: false,
          message: 'You cannot afford this item',
        };
      }

      // Try to decrease stock in Firebase (atomic transaction)
      const stockDecreased = await ItemService.decreaseStock(itemId, 1);

      if (!stockDecreased) {
        return {
          success: false,
          message: 'This item is out of stock',
        };
      }

      // Calculate new currencies
      const newPlayerCurrency = CurrencyConverter.subtract(playerCurrency, itemCost);
      const newShopCurrency = CurrencyConverter.add(shopCurrency, itemCost);

      if (!newPlayerCurrency) {
        // This shouldn't happen since we already checked, but just in case
        // Restore stock
        await ItemService.increaseStock(itemId, 1);
        return {
          success: false,
          message: 'Transaction failed',
        };
      }

      // Update shop currency in Firebase
      await ShopService.updateShopCurrency(shopId, newShopCurrency);

      return {
        success: true,
        message: `Successfully purchased ${item.name}!`,
        newCurrency: newPlayerCurrency,
        newShopCurrency,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Purchase failed: ${error.message}`,
      };
    }
  }

  /**
   * Sell an item back to the shop (increases player currency, increases stock, decreases shop currency)
   * Typically at reduced price (e.g., 50% of original)
   */
  static async sellItem(
    itemId: string,
    shopId: string,
    playerCurrency: Currency,
    shopCurrency: Currency,
    item: Item,
    sellPriceModifier: number = 0.5 // 50% of original price
  ): Promise<PurchaseResult> {
    try {
      if (!item.cost) {
        return {
          success: false,
          message: 'Cannot determine sell price',
        };
      }

      // Calculate sell price
      const sellAmount = Math.floor(item.cost.amount * sellPriceModifier);
      const sellCurrency = {
        cp: item.cost.currency === 'cp' ? sellAmount : 0,
        sp: item.cost.currency === 'sp' ? sellAmount : 0,
        gp: item.cost.currency === 'gp' ? sellAmount : 0,
      };

      // Check if shop can afford to buy it back
      if (!CurrencyConverter.canAfford(shopCurrency, sellCurrency)) {
        return {
          success: false,
          message: 'The shop cannot afford to buy this item',
        };
      }

      // Increase stock in Firebase
      await ItemService.increaseStock(itemId, 1);

      // Calculate new currencies
      const newPlayerCurrency = CurrencyConverter.add(playerCurrency, sellCurrency);
      const newShopCurrency = CurrencyConverter.subtract(shopCurrency, sellCurrency);

      if (!newShopCurrency) {
        // Restore stock
        await ItemService.decreaseStock(itemId, 1);
        return {
          success: false,
          message: 'Transaction failed',
        };
      }

      // Update shop currency in Firebase
      await ShopService.updateShopCurrency(shopId, newShopCurrency);

      return {
        success: true,
        message: `Successfully sold ${item.name}!`,
        newCurrency: newPlayerCurrency,
        newShopCurrency,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Sell failed: ${error.message}`,
      };
    }
  }

  /**
   * Check if an item is in stock
   */
  static async checkStock(itemId: string): Promise<{ inStock: boolean; quantity: number | null }> {
    try {
      const item = await ItemService.getItem(itemId);

      if (!item) {
        return { inStock: false, quantity: 0 };
      }

      if (item.stock === null) {
        return { inStock: true, quantity: null }; // Unlimited
      }

      return {
        inStock: item.stock > 0,
        quantity: item.stock,
      };
    } catch (error) {
      return { inStock: false, quantity: 0 };
    }
  }
}
