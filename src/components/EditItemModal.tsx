import { useState, useEffect } from 'react';
import { ItemLibraryService } from '../services/item-library.service';
import type { ItemLibrary } from '../types/firebase';
import { Toast } from './Toast';
import { getEnabledItemTypes, getFieldsForType } from '../config/item-fields.config';
import { DynamicFormField } from './DynamicFormField';

interface EditItemModalProps {
  item: ItemLibrary;
  onClose: () => void;
  onSuccess: () => void;
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  gear: 'Adventuring Gear',
  treasure: 'Treasure',
  weapon: 'Weapon',
  armor: 'Armor',
  consumable: 'Consumable (Potion, Scroll, etc.)',
  tool: 'Tool',
  magic: 'Magic Item',
};

// Helper to set nested object values
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

export function EditItemModal({ item, onClose, onSuccess }: EditItemModalProps) {
  const [name, setName] = useState(item.item.name);
  const [description, setDescription] = useState(item.item.description || '');
  const [type, setType] = useState(item.item.type || 'gear');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [checkingUsage, setCheckingUsage] = useState(true);
  const [editChoice, setEditChoice] = useState<'update' | 'create' | null>(null);

  const typeFields = getFieldsForType(type);

  // Initialize dynamic fields from the existing item
  useEffect(() => {
    const fields: Record<string, any> = {};

    // Extract all type-specific fields from the item
    const itemData = item.item as any;
    typeFields.forEach(field => {
      let value = getNestedValue(itemData, field.name);

      // Convert database format to form format based on field type
      if (value !== undefined && value !== null) {
        // Convert arrays to newline-separated strings for textareas
        if (field.type === 'textarea' && Array.isArray(value)) {
          value = value.join('\n');
        }
        // Ensure multiselect values are arrays
        else if (field.type === 'multiselect' && !Array.isArray(value)) {
          value = value ? [value] : [];
        }
        // Convert string numbers to actual numbers for number fields
        else if (field.type === 'number' && typeof value === 'string') {
          const parsed = parseFloat(value);
          value = isNaN(parsed) ? null : parsed;
        }

        setNestedValue(fields, field.name, value);
      }
    });

    setDynamicFields(fields);
  }, [type]); // Re-initialize when type changes

  useEffect(() => {
    checkItemUsage();
  }, []);

  const checkItemUsage = async () => {
    setCheckingUsage(true);
    try {
      const count = await ItemLibraryService.getItemUsageCount(item.id);
      setUsageCount(count);
    } catch (err: any) {
      console.error('Error checking usage:', err);
    } finally {
      setCheckingUsage(false);
    }
  };

  const handleDynamicFieldChange = (fieldName: string, value: any) => {
    setDynamicFields(prev => {
      const updated = { ...prev };
      setNestedValue(updated, fieldName, value);
      return updated;
    });
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setDynamicFields({}); // Reset dynamic fields when type changes
  };

  const buildUpdatedItem = () => {
    // Base item properties
    const baseItem = {
      ...item.item,
      name,
      description,
      type,
    };

    // Merge with dynamic fields
    const updatedItem: any = { ...baseItem, ...dynamicFields };

    // Type-specific processing
    switch (type) {
      case 'magic':
        // Convert magicalEffects textarea to array if needed
        if (updatedItem.magicalEffects && typeof updatedItem.magicalEffects === 'string') {
          updatedItem.magicalEffects = updatedItem.magicalEffects
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);
        }
        break;

      case 'weapon':
        // Ensure properties is an array
        if (!updatedItem.properties) {
          updatedItem.properties = [];
        }
        break;

      case 'consumable':
        // Parse charges if it's a number
        if (updatedItem.charges && typeof updatedItem.charges === 'string') {
          updatedItem.charges = parseInt(updatedItem.charges, 10);
        }
        break;
    }

    return updatedItem;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    if (!type.trim()) {
      setError('Item type is required');
      return;
    }

    // If item is used in shops, require choice
    if (usageCount > 0 && !editChoice) {
      setError('Please choose whether to update existing items or create a new one');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updatedItem = buildUpdatedItem();

      if (usageCount > 0 && editChoice === 'create') {
        // Create a new item instead of updating
        await ItemLibraryService.createItem(item.dmId, {
          item: updatedItem,
          source: 'custom', // New item is always custom
          officialId: undefined,
        });
        setToast({ message: 'New item created successfully!', type: 'success' });
      } else {
        // Update existing item
        await ItemLibraryService.updateItem(item.id, {
          item: updatedItem,
        });
        setToast({
          message: usageCount > 0
            ? `Item updated! Changes applied to ${usageCount} shop${usageCount > 1 ? 's' : ''}.`
            : 'Item updated successfully!',
          type: 'success'
        });
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    name !== item.item.name ||
    description !== (item.item.description || '') ||
    type !== (item.item.type || '') ||
    JSON.stringify(dynamicFields) !== JSON.stringify({});

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <h2 style={{ marginTop: 0 }}>Edit Item</h2>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Update the details of this item in your library.
          </p>

          {checkingUsage ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Checking item usage...
            </div>
          ) : (
            <>
              {usageCount > 0 && (
                <div style={{
                  padding: '15px',
                  marginBottom: '20px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '5px',
                  fontSize: '14px',
                  color: '#856404'
                }}>
                  <strong>⚠️ This item is used in {usageCount} shop{usageCount > 1 ? 's' : ''}</strong>
                  <p style={{ margin: '10px 0 0 0' }}>
                    You can either update all existing instances or create a new separate item.
                  </p>
                </div>
              )}

              {error && (
                <div style={{
                  padding: '10px',
                  marginBottom: '15px',
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Longsword, Potion of Healing"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Type */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Item Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select item type...</option>
                    {getEnabledItemTypes().map(itemType => (
                      <option key={itemType} value={itemType}>
                        {ITEM_TYPE_LABELS[itemType] || itemType}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the item's appearance, properties, or effects"
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

                {/* Dynamic Type-Specific Fields */}
                {typeFields.length > 0 && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '5px'
                  }}>
                    <h4 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
                      {ITEM_TYPE_LABELS[type] || type} Properties
                    </h4>
                    {typeFields.map(field => (
                      <DynamicFormField
                        key={field.name}
                        field={field}
                        value={getNestedValue(dynamicFields, field.name)}
                        onChange={handleDynamicFieldChange}
                      />
                    ))}
                  </div>
                )}

                {/* Choice: Update or Create New (only if item is used) */}
                {usageCount > 0 && hasChanges && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '5px'
                  }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                      What would you like to do? *
                    </label>

                    <label style={{
                      display: 'block',
                      marginBottom: '10px',
                      padding: '12px',
                      border: `2px solid ${editChoice === 'update' ? '#007bff' : '#ddd'}`,
                      borderRadius: '5px',
                      cursor: 'pointer',
                      backgroundColor: editChoice === 'update' ? '#e7f3ff' : 'white'
                    }}>
                      <input
                        type="radio"
                        name="editChoice"
                        value="update"
                        checked={editChoice === 'update'}
                        onChange={(e) => setEditChoice(e.target.value as 'update')}
                        style={{ marginRight: '10px' }}
                      />
                      <strong>Update existing items</strong>
                      <p style={{ margin: '5px 0 0 28px', fontSize: '13px', color: '#666' }}>
                        Changes will be applied to all {usageCount} shop{usageCount > 1 ? 's' : ''} using this item
                      </p>
                    </label>

                    <label style={{
                      display: 'block',
                      padding: '12px',
                      border: `2px solid ${editChoice === 'create' ? '#007bff' : '#ddd'}`,
                      borderRadius: '5px',
                      cursor: 'pointer',
                      backgroundColor: editChoice === 'create' ? '#e7f3ff' : 'white'
                    }}>
                      <input
                        type="radio"
                        name="editChoice"
                        value="create"
                        checked={editChoice === 'create'}
                        onChange={(e) => setEditChoice(e.target.value as 'create')}
                        style={{ marginRight: '10px' }}
                      />
                      <strong>Create a new item</strong>
                      <p style={{ margin: '5px 0 0 28px', fontSize: '13px', color: '#666' }}>
                        Keep the original item unchanged and create a new separate item with these changes
                      </p>
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !hasChanges}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: loading || !hasChanges ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: loading || !hasChanges ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
