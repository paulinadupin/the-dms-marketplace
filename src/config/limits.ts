/**
 * Application Limits Configuration
 *
 * All resource limits are defined here in a single location.
 * Update these values to change limits throughout the application.
 */

export const LIMITS = {
  /**
   * Maximum number of markets a DM can create
   * Default: 20
   */
  MARKETS_PER_DM: 20,

  /**
   * Maximum number of shops per market
   * Default: 20
   */
  SHOPS_PER_MARKET: 20,

  /**
   * Maximum number of items in a DM's item library
   * Default: 500 (adjust as needed)
   */
  ITEMS_PER_LIBRARY: 500,

  /**
   * Maximum number of items per shop inventory
   * Default: 50 (adjust as needed)
   */
  ITEMS_PER_SHOP: 50,
} as const;
