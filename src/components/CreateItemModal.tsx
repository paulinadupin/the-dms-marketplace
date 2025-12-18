import { useState } from 'react';
import { ItemLibraryService } from '../services/item-library.service';
import type { Item, ItemType } from '../types/item';
import { getFieldsForType, getEnabledItemTypes } from '../config/item-fields.config';
import { DynamicFormField } from './DynamicFormField';

interface CreateItemModalProps {
  dmId: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to set nested object values (e.g., 'damage.dice' -> { damage: { dice: value } })
function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

// Helper to get nested object values
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

export function CreateItemModal({ dmId, onClose, onSuccess }: CreateItemModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('gear');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [tags, setTags] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const enabledTypes = getEnabledItemTypes();
  const typeFields = getFieldsForType(type);

  const handleDynamicFieldChange = (fieldName: string, value: any) => {
    setDynamicFields(prev => {
      const updated = { ...prev };
      setNestedValue(updated, fieldName, value);
      return updated;
    });
  };

  const handleTypeChange = (newType: ItemType) => {
    setType(newType);
    setDynamicFields({}); // Reset dynamic fields when type changes
  };

  const buildItem = (): Item => {
    // Parse weight
    const parsedWeight = weight ? parseFloat(weight) : null;

    // Parse tags
    const parsedTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Base item properties
    const baseItem = {
      id: '', // Will be set by Firestore
      name: name.trim(),
      type,
      description: description.trim(),
      weight: parsedWeight,
      source: 'Custom',
      tags: parsedTags,
    };

    // Merge with dynamic fields based on type
    const item: any = { ...baseItem, ...dynamicFields };

    // Type-specific processing
    switch (type) {
      case 'magic':
        // Convert magicalEffects textarea to array
        if (item.magicalEffects && typeof item.magicalEffects === 'string') {
          item.magicalEffects = item.magicalEffects
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);
        }
        break;

      case 'weapon':
        // Ensure properties is an array
        if (!item.properties) {
          item.properties = [];
        }
        // Only include range if it has values
        if (!item.range?.normal && !item.range?.long) {
          delete item.range;
        }
        break;

      case 'armor':
        // Convert numeric strings to numbers
        if (item.baseAC) item.baseAC = Number(item.baseAC);
        if (item.dexModifier) item.dexModifier = Number(item.dexModifier);
        if (item.strengthRequirement) item.strengthRequirement = Number(item.strengthRequirement);
        if (item.stealthDisadvantage === undefined) item.stealthDisadvantage = false;
        break;

      case 'consumable':
        // Convert uses to number
        if (item.uses) item.uses = Number(item.uses);
        break;

      case 'tool':
        // Ensure proficiencyBonus is boolean
        if (item.proficiencyBonus === undefined) item.proficiencyBonus = false;
        break;
    }

    return item as Item;
  };

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Item name is required';
    }

    if (!description.trim()) {
      return 'Item description is required';
    }

    // Validate required dynamic fields
    for (const field of typeFields) {
      if (field.required) {
        const value = getNestedValue(dynamicFields, field.name);
        if (value === undefined || value === null || value === '') {
          return `${field.label} is required`;
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const item = buildItem();

      await ItemLibraryService.createItem(dmId, {
        item,
        source: 'custom',
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>Create New Item</h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '5px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Item Name */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Longsword, Potion of Healing"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Item Type */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Item Type *
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as ItemType)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              {enabledTypes.map((itemType) => (
                <option key={itemType} value={itemType}>
                  {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item..."
              required
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Weight */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Weight (lb, optional)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 3"
              min="0"
              step="0.1"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tags (optional, comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., martial, melee, versatile"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Dynamic Type-Specific Fields */}
          {typeFields.length > 0 && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
                {type.charAt(0).toUpperCase() + type.slice(1)}-Specific Fields
              </h3>
              {typeFields.map((field) => (
                <DynamicFormField
                  key={field.name}
                  field={field}
                  value={getNestedValue(dynamicFields, field.name)}
                  onChange={handleDynamicFieldChange}
                />
              ))}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
