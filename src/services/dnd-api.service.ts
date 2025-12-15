import type { Item, Weapon, Armor, MagicItem, Gear } from '../types/item';

/**
 * D&D 5e API Service
 * Free API for official D&D content: https://www.dnd5eapi.co/
 */

interface DnDApiEquipment {
  index: string;
  name: string;
  equipment_category: { name: string };
  weapon_category?: string;
  weapon_range?: string;
  damage?: { damage_dice: string; damage_type: { name: string } };
  range?: { normal: number; long?: number };
  properties?: Array<{ name: string }>;
  armor_category?: string;
  armor_class?: { base: number; dex_bonus?: boolean; max_bonus?: number };
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  cost?: { quantity: number; unit: string };
  weight?: number;
  desc?: string[];
  special?: string[];
}

interface DnDApiMagicItem {
  index: string;
  name: string;
  equipment_category: { name: string };
  rarity: { name: string };
  desc: string[];
  variant?: boolean;
}

export class DnDApiService {
  private static readonly BASE_URL = 'https://www.dnd5eapi.co/api';

  /**
   * Search for equipment by name
   */
  static async searchEquipment(searchTerm: string): Promise<Array<{ index: string; name: string; url: string }>> {
    try {
      const response = await fetch(`${this.BASE_URL}/equipment`);
      const data = await response.json();

      // Filter results by search term
      const filtered = data.results.filter((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return filtered;
    } catch (error) {
      console.error('Failed to search equipment:', error);
      return [];
    }
  }

  /**
   * Search for magic items by name
   */
  static async searchMagicItems(searchTerm: string): Promise<Array<{ index: string; name: string; url: string }>> {
    try {
      const response = await fetch(`${this.BASE_URL}/magic-items`);
      const data = await response.json();

      const filtered = data.results.filter((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return filtered;
    } catch (error) {
      console.error('Failed to search magic items:', error);
      return [];
    }
  }

  /**
   * Get equipment details by index
   */
  static async getEquipment(index: string): Promise<DnDApiEquipment | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/equipment/${index}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to get equipment:', error);
      return null;
    }
  }

  /**
   * Get magic item details by index
   */
  static async getMagicItem(index: string): Promise<DnDApiMagicItem | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/magic-items/${index}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to get magic item:', error);
      return null;
    }
  }

  /**
   * Convert D&D API equipment to our Item type
   */
  static convertEquipmentToItem(apiItem: DnDApiEquipment): Partial<Item> {
    const baseItem: Partial<Item> = {
      id: apiItem.index,
      name: apiItem.name,
      description: apiItem.desc?.join('\n') || '',
      weight: apiItem.weight || null,
      cost: this.parseCost(apiItem.cost),
      source: 'D&D 5e SRD',
      tags: [apiItem.equipment_category.name],
    };

    // Determine type based on category
    if (apiItem.weapon_category) {
      return {
        ...baseItem,
        type: 'weapon',
        weaponType: apiItem.weapon_category.toLowerCase() as 'simple' | 'martial',
        damage: apiItem.damage
          ? {
              dice: apiItem.damage.damage_dice,
              type: this.parseDamageType(apiItem.damage.damage_type.name),
            }
          : undefined,
        properties: apiItem.properties?.map((p) => this.parseWeaponProperty(p.name)) || [],
        range: apiItem.range
          ? {
              normal: apiItem.range.normal,
              long: apiItem.range.long || apiItem.range.normal,
            }
          : undefined,
      } as Partial<Weapon>;
    }

    if (apiItem.armor_category) {
      return {
        ...baseItem,
        type: 'armor',
        armorType: apiItem.armor_category.toLowerCase() as 'light' | 'medium' | 'heavy' | 'shield',
        baseAC: apiItem.armor_class?.base || 10,
        dexModifier: apiItem.armor_class?.max_bonus,
        strengthRequirement: apiItem.str_minimum,
        stealthDisadvantage: apiItem.stealth_disadvantage || false,
      } as Partial<Armor>;
    }

    // Default to gear
    return {
      ...baseItem,
      type: 'gear',
    } as Partial<Gear>;
  }

  /**
   * Convert D&D API magic item to our Item type
   */
  static convertMagicItemToItem(apiItem: DnDApiMagicItem): Partial<MagicItem> {
    return {
      id: apiItem.index,
      name: apiItem.name,
      type: 'magic',
      description: apiItem.desc.join('\n'),
      weight: null,
      cost: null, // Magic items usually don't have standard costs
      source: 'D&D 5e SRD',
      tags: ['Magic Item'],
      rarity: this.parseRarity(apiItem.rarity.name),
      requiresAttunement: apiItem.desc.some((d) => d.toLowerCase().includes('attunement')),
      magicalEffects: apiItem.desc,
    };
  }

  /**
   * Parse cost from API format to our format
   */
  private static parseCost(cost: DnDApiEquipment['cost']) {
    if (!cost) return null;

    const currency = cost.unit === 'gp' ? 'gp' : cost.unit === 'sp' ? 'sp' : 'cp';
    return {
      amount: cost.quantity,
      currency: currency as 'cp' | 'sp' | 'gp',
    };
  }

  /**
   * Parse damage type
   */
  private static parseDamageType(type: string): 'slashing' | 'piercing' | 'bludgeoning' {
    const lower = type.toLowerCase();
    if (lower.includes('slashing')) return 'slashing';
    if (lower.includes('piercing')) return 'piercing';
    return 'bludgeoning';
  }

  /**
   * Parse weapon property
   */
  private static parseWeaponProperty(prop: string): any {
    return prop.toLowerCase().replace(/[^a-z]/g, '');
  }

  /**
   * Parse magic item rarity
   */
  private static parseRarity(rarity: string): 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact' {
    const lower = rarity.toLowerCase();
    if (lower.includes('very rare')) return 'very_rare';
    if (lower.includes('uncommon')) return 'uncommon';
    if (lower.includes('rare')) return 'rare';
    if (lower.includes('legendary')) return 'legendary';
    if (lower.includes('artifact')) return 'artifact';
    return 'common';
  }

  /**
   * Get all available equipment categories
   */
  static async getEquipmentCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/equipment-categories`);
      const data = await response.json();
      return data.results.map((cat: any) => cat.name);
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }
}
