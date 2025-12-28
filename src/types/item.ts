import type { CurrencyType } from "./currency";

export type ItemType = "weapon" | "armor" | "tool" | "consumable" | "gear" | "magic" | "treasure" | "other";

export type DamageType = "slashing" | "piercing" | "bludgeoning";

export type WeaponCategory = "simple" | "martial";

export type ArmorCategory = "light" | "medium" | "heavy" | "shield";

export type ToolCategory = "artisan" | "instrument" | "gaming" | "kits";

export type MagicItemRarity = "common" | "uncommon" | "rare" | "very_rare" | "legendary" | "artifact";

export type WeaponProperty =
  | "finesse"
  | "light"
  | "heavy"
  | "two-handed"
  | "versatile"
  | "reach"
  | "thrown"
  | "loading"
  | "ammunition"
  | "special"
  | "ranged";

export type Ruleset = "2014" | "2024" | "homebrew";

export interface ItemCost {
  amount: number;
  currency: CurrencyType;
}

export interface BaseItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  weight: number | null;
  cost: ItemCost | null;
  source: string;
  tags: string[];
  ruleset?: Ruleset;
  imageUrl?: string | null;
}

export interface WeaponDamage {
  dice: string;
  type: DamageType;
}

export interface WeaponRange {
  normal: number;
  long: number;
}

export interface Weapon extends BaseItem {
  type: "weapon";
  weaponType: WeaponCategory;
  damage: WeaponDamage;
  properties: WeaponProperty[];
  range?: WeaponRange;
}

export interface Armor extends BaseItem {
  type: "armor";
  armorType: ArmorCategory;
  baseAC: number;
  dexModifier?: number;
  strengthRequirement?: number;
  stealthDisadvantage: boolean;
}

export interface Consumable extends BaseItem {
  type: "consumable";
  uses: number;
  effect: string;
  duration?: string;
}

export interface Tool extends BaseItem {
  type: "tool";
  toolType: ToolCategory;
  proficiencyBonus: boolean;
}

export interface MagicItem extends BaseItem {
  type: "magic";
  rarity: MagicItemRarity;
  requiresAttunement: boolean;
  magicalEffects: string[];
}

export interface Gear extends BaseItem {
  type: "gear";
}

export interface Treasure extends BaseItem {
  type: "treasure";
}

export type Item = Weapon | Armor | Consumable | Tool | MagicItem | Gear | Treasure;
