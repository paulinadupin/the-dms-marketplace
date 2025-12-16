/**
 * Dynamic Item Field Configuration
 *
 * This file defines the form fields for each item type.
 * To add a new item type, simply add a new entry to ITEM_TYPE_FIELDS.
 */

export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'textarea';

export interface FieldConfig {
  name: string; // Field path (e.g., 'damage.dice' or 'baseAC')
  label: string; // Display label
  type: FieldType; // Input type
  required: boolean; // Is field required?
  placeholder?: string; // Placeholder text
  options?: string[] | { value: string; label: string }[]; // For select/multiselect
  min?: number; // For number inputs
  max?: number; // For number inputs
  step?: number; // For number inputs
  helpText?: string; // Additional help text
}

/**
 * Field configurations for each item type
 * Add new item types here to enable them in the create/edit forms
 */
export const ITEM_TYPE_FIELDS: Record<string, FieldConfig[]> = {
  // Gear - Simple items (no additional fields)
  gear: [],

  // Treasure - Valuable items (no additional fields)
  treasure: [],

  // Weapon - Combat items
  weapon: [
    {
      name: 'weaponType',
      label: 'Weapon Category',
      type: 'select',
      required: true,
      options: [
        { value: 'simple', label: 'Simple' },
        { value: 'martial', label: 'Martial' },
      ],
    },
    {
      name: 'damage.dice',
      label: 'Damage Dice',
      type: 'text',
      required: true,
      placeholder: 'e.g., 1d8, 2d6',
      helpText: 'Damage dice notation (e.g., 1d8 for longsword)',
    },
    {
      name: 'damage.type',
      label: 'Damage Type',
      type: 'select',
      required: true,
      options: [
        { value: 'slashing', label: 'Slashing' },
        { value: 'piercing', label: 'Piercing' },
        { value: 'bludgeoning', label: 'Bludgeoning' },
      ],
    },
    {
      name: 'properties',
      label: 'Weapon Properties',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'finesse', label: 'Finesse' },
        { value: 'light', label: 'Light' },
        { value: 'heavy', label: 'Heavy' },
        { value: 'two-handed', label: 'Two-Handed' },
        { value: 'versatile', label: 'Versatile' },
        { value: 'reach', label: 'Reach' },
        { value: 'thrown', label: 'Thrown' },
        { value: 'loading', label: 'Loading' },
        { value: 'ammunition', label: 'Ammunition' },
        { value: 'ranged', label: 'Ranged' },
        { value: 'special', label: 'Special' },
      ],
    },
    {
      name: 'range.normal',
      label: 'Normal Range (feet)',
      type: 'number',
      required: false,
      min: 0,
      step: 5,
      helpText: 'Leave empty for melee weapons',
    },
    {
      name: 'range.long',
      label: 'Long Range (feet)',
      type: 'number',
      required: false,
      min: 0,
      step: 5,
      helpText: 'Maximum range for ranged weapons',
    },
  ],

  // Armor - Protective gear
  armor: [
    {
      name: 'armorType',
      label: 'Armor Type',
      type: 'select',
      required: true,
      options: [
        { value: 'light', label: 'Light Armor' },
        { value: 'medium', label: 'Medium Armor' },
        { value: 'heavy', label: 'Heavy Armor' },
        { value: 'shield', label: 'Shield' },
      ],
    },
    {
      name: 'baseAC',
      label: 'Base AC',
      type: 'number',
      required: true,
      min: 10,
      max: 20,
      step: 1,
      helpText: 'Armor Class provided by this armor',
    },
    {
      name: 'dexModifier',
      label: 'Max Dex Modifier',
      type: 'number',
      required: false,
      min: 0,
      max: 10,
      step: 1,
      helpText: 'Maximum Dexterity modifier that can be added (leave empty for no limit)',
    },
    {
      name: 'strengthRequirement',
      label: 'Strength Requirement',
      type: 'number',
      required: false,
      min: 0,
      max: 20,
      step: 1,
      helpText: 'Minimum Strength score required to wear this armor',
    },
    {
      name: 'stealthDisadvantage',
      label: 'Stealth Disadvantage',
      type: 'checkbox',
      required: false,
      helpText: 'Does this armor impose disadvantage on Stealth checks?',
    },
  ],

  // Consumable - Potions, food, scrolls
  consumable: [
    {
      name: 'uses',
      label: 'Number of Uses',
      type: 'number',
      required: true,
      min: 1,
      step: 1,
      helpText: 'How many times can this item be used before depleted?',
    },
    {
      name: 'effect',
      label: 'Effect',
      type: 'textarea',
      required: true,
      placeholder: 'Describe the effect when consumed...',
      helpText: 'What happens when this item is used?',
    },
    {
      name: 'duration',
      label: 'Duration',
      type: 'text',
      required: false,
      placeholder: 'e.g., 1 hour, instantaneous',
      helpText: 'How long does the effect last?',
    },
  ],

  // Tool - Artisan tools, instruments, etc.
  tool: [
    {
      name: 'toolType',
      label: 'Tool Category',
      type: 'select',
      required: true,
      options: [
        { value: 'artisan', label: "Artisan's Tools" },
        { value: 'instrument', label: 'Musical Instrument' },
        { value: 'gaming', label: 'Gaming Set' },
        { value: 'kits', label: 'Kit' },
      ],
    },
    {
      name: 'proficiencyBonus',
      label: 'Requires Proficiency',
      type: 'checkbox',
      required: false,
      helpText: 'Does this tool require proficiency to use effectively?',
    },
  ],

  // Magic - Magical items
  magic: [
    {
      name: 'rarity',
      label: 'Rarity',
      type: 'select',
      required: true,
      options: [
        { value: 'common', label: 'Common' },
        { value: 'uncommon', label: 'Uncommon' },
        { value: 'rare', label: 'Rare' },
        { value: 'very_rare', label: 'Very Rare' },
        { value: 'legendary', label: 'Legendary' },
        { value: 'artifact', label: 'Artifact' },
      ],
    },
    {
      name: 'requiresAttunement',
      label: 'Requires Attunement',
      type: 'checkbox',
      required: false,
      helpText: 'Does this item require attunement to use?',
    },
    {
      name: 'magicalEffects',
      label: 'Magical Effects',
      type: 'textarea',
      required: true,
      placeholder: 'List magical effects (one per line)...',
      helpText: 'Describe the magical properties of this item',
    },
  ],
};

/**
 * Get enabled item types (types that have field configurations)
 */
export function getEnabledItemTypes(): string[] {
  return Object.keys(ITEM_TYPE_FIELDS);
}

/**
 * Get field configuration for a specific item type
 */
export function getFieldsForType(itemType: string): FieldConfig[] {
  return ITEM_TYPE_FIELDS[itemType] || [];
}

/**
 * Check if an item type is enabled
 */
export function isItemTypeEnabled(itemType: string): boolean {
  return itemType in ITEM_TYPE_FIELDS;
}
