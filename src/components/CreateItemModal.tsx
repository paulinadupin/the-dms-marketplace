import { useState, useEffect } from 'react';
import { ItemLibraryService } from '../services/item-library.service';
import { DnDApiService } from '../services/dnd-api.service';
import { StorageService } from '../services/storage.service';
import type { Item, ItemType } from '../types/item';
import { getFieldsForType, getEnabledItemTypes } from '../config/item-fields.config';
import { DynamicFormField } from './DynamicFormField';
import { ApiItemDetailModal } from './ApiItemDetailModal';
import { ImageInput } from './ImageInput';

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
  // Tab state - Custom first
  const [activeTab, setActiveTab] = useState<'custom' | 'api'>('custom');

  // Custom item state
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('gear');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [tags, setTags] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Image state
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');

  // API search state
  const [apiSearch, setApiSearch] = useState('');
  const [allApiItems, setAllApiItems] = useState<Array<{ index: string; name: string; url: string; category: string; itemType: 'equipment' | 'magic'; rarity?: string }>>([]);
  const [allFilteredResults, setAllFilteredResults] = useState<Array<{ index: string; name: string; url: string; category: string; itemType: 'equipment' | 'magic'; rarity?: string }>>([]);
  const [apiSearching, setApiSearching] = useState(false);
  const [selectedApiItem, setSelectedApiItem] = useState<any>(null);
  const [apiItemDetails, setApiItemDetails] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState<number>(8);

  const enabledTypes = getEnabledItemTypes();
  const typeFields = getFieldsForType(type);

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(8);
  }, [apiSearch, filterCategory]);

  // Load all API items on mount with categories
  useEffect(() => {
    const loadAllItems = async () => {
      setApiSearching(true);
      try {
        // Get all equipment categories
        const categories = await DnDApiService.getEquipmentCategories();

        // Fetch items from key categories
        const categoryPromises = categories
          .filter(cat => ['Weapon', 'Armor', 'Adventuring Gear', 'Tools', 'Mounts and Vehicles'].includes(cat.name))
          .map(async cat => {
            const items = await DnDApiService.getEquipmentByCategory(cat.index);
            return items.map(item => ({
              ...item,
              category: cat.name,
              itemType: 'equipment' as const
            }));
          });

        const magicItemsBasic = await DnDApiService.searchMagicItems('');

        // Add magic items without rarity (to avoid rate limiting)
        const magicItems = magicItemsBasic.map(item => ({
          ...item,
          category: 'Magic Items',
          itemType: 'magic' as const
        }));

        const equipmentByCategory = await Promise.all(categoryPromises);
        const allEquipment = equipmentByCategory.flat();

        // Combine and deduplicate by index
        const itemMap = new Map();

        // Add magic items first
        magicItems.forEach(item => {
          itemMap.set(item.index, item);
        });

        // Add equipment only if not already exists
        allEquipment.forEach(item => {
          if (!itemMap.has(item.index)) {
            itemMap.set(item.index, item);
          }
        });

        const combined = Array.from(itemMap.values());

        setAllApiItems(combined);
        setAllFilteredResults(combined); // Store all items, display limit handled separately
      } catch (err) {
        setError('Failed to load D&D items');
      } finally {
        setApiSearching(false);
      }
    };

    if (activeTab === 'api') {
      loadAllItems();
    }
  }, [activeTab]);

  // Debounced search + filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      let results = [...allApiItems];

      // Search filter
      if (apiSearch.trim()) {
        const searchLower = apiSearch.toLowerCase();
        results = results.filter(item =>
          item.name.toLowerCase().includes(searchLower)
        );
      }

      // Category filter
      if (filterCategory !== 'all') {
        results = results.filter(item => item.category === filterCategory);
      }

      // Sort alphabetically
      results.sort((a, b) => a.name.localeCompare(b.name));

      setAllFilteredResults(results); // Store all filtered results
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [apiSearch, allApiItems, filterCategory]);

  // Compute displayed results based on display limit
  const displayedResults = allFilteredResults.slice(0, displayLimit);
  const hasMoreResults = allFilteredResults.length > displayLimit;

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
      imageUrl: imageUrl || null, // Add image URL if provided
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

  // API item selection handler
  const handleSelectApiItem = async (item: { index: string; name: string; category: string; itemType: 'equipment' | 'magic'; rarity?: string }) => {
    // Select item and load details
    setSelectedApiItem(item);
    setApiItemDetails(null);

    try {
      const details = item.itemType === 'equipment'
        ? await DnDApiService.getEquipment(item.index)
        : await DnDApiService.getMagicItem(item.index);
      setApiItemDetails(details);
      setShowDetailModal(true); // Open the detail modal
    } catch (err) {
      setError(`Failed to load details for ${item.name}`);
    }
  };

  const handleImportApiItem = async () => {
    if (!apiItemDetails || !selectedApiItem) return;

    setLoading(true);
    try {
      // Convert API item to our Item format
      const convertedItem = selectedApiItem.itemType === 'equipment'
        ? DnDApiService.convertEquipmentToItem(apiItemDetails)
        : DnDApiService.convertMagicItemToItem(apiItemDetails);

      // Save to library
      await ItemLibraryService.createItem(dmId, {
        item: convertedItem as Item,
        source: 'official',
        officialId: apiItemDetails.index,
      });

      // Close detail modal and main modal
      setShowDetailModal(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err; // Re-throw so modal can handle it
    }
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

      // Create item first (to get itemId)
      const createdItem = await ItemLibraryService.createItem(dmId, {
        item,
        source: 'custom',
      });

      // Handle image upload if file provided
      if (imageFile && imageMode === 'upload') {
        try {
          const uploadedUrl = await StorageService.uploadItemImage(
            dmId,
            createdItem.id,
            imageFile
          );

          // Update item with uploaded image URL
          await ItemLibraryService.updateItem(createdItem.id, {
            item: { ...item, imageUrl: uploadedUrl }
          });
        } catch (uploadErr: any) {
          console.error('Failed to upload image:', uploadErr);
          // Item created successfully, but image upload failed
          // Don't fail the whole operation
          setError('Item created, but image upload failed. You can add an image by editing the item.');
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '90%', height: '90%', maxWidth: 'none', maxHeight: 'none', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Create New Item</h2>

        {/* Tab Switcher */}
        <div className="tab-switcher" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'custom' ? '2px solid var(--color-button-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'custom' ? 'bold' : 'normal',
              color: activeTab === 'custom' ? 'var(--color-button-primary)' : 'var(--color-text-secondary)',
              marginBottom: '-2px'
            }}
          >
            Create Custom
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`tab-button ${activeTab === 'api' ? 'active' : ''}`}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'api' ? '2px solid var(--color-button-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'api' ? 'bold' : 'normal',
              color: activeTab === 'api' ? 'var(--color-button-primary)' : 'var(--color-text-secondary)',
              marginBottom: '-2px'
            }}
          >
            Import from D&D Official
          </button>
        </div>

        {/* Custom Form Tab */}
        {activeTab === 'custom' && (
          <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Item Name */}
          <div className="form-group-lg">
            <label className="form-label">
              Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Longsword, Potion of Healing"
              required
              className="form-input"
            />
          </div>

          {/* Item Type */}
          <div className="form-group-lg">
            <label className="form-label">
              Item Type *
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as ItemType)}
              required
              className="form-select"
            >
              {enabledTypes.map((itemType) => (
                <option key={itemType} value={itemType}>
                  {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group-lg">
            <label className="form-label">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item..."
              required
              rows={4}
              className="form-textarea"
            />
          </div>

          {/* Weight */}
          <div className="form-group-lg">
            <label className="form-label">
              Weight (lb, optional)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 3"
              min="0"
              step="0.1"
              className="form-input"
            />
          </div>

          {/* Tags */}
          <div className="form-group-lg">
            <label className="form-label">
              Tags (optional, comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., martial, melee, versatile"
              className="form-input"
            />
          </div>

          {/* Item Image */}
          <div className="form-group-lg" style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '15px',
            backgroundColor: 'var(--background-card-secondary)'
          }}>
            <label className="form-label">Item Image (optional)</label>
            <ImageInput
              mode={imageMode}
              url={imageUrl}
              file={imageFile}
              onUrlChange={setImageUrl}
              onFileChange={setImageFile}
              onModeChange={setImageMode}
            />
          </div>

          {/* Dynamic Type-Specific Fields */}
          {typeFields.length > 0 && (
            <div className="type-fields-section">
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
          <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn ${loading ? 'btn-secondary' : 'btn-success'}`}
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
        )}

        {/* API Import Tab */}
        {activeTab === 'api' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(90vh - 150px)' }}>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Search Bar & Filters */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <label className="form-label">Search D&D 5e SRD</label>
                <input
                  type="text"
                  value={apiSearch}
                  onChange={(e) => setApiSearch(e.target.value)}
                  placeholder="Search for items... (e.g., longsword, potion, studded leather)"
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="form-label">Item Type</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Items</option>
                  <option value="Weapon">Weapon</option>
                  <option value="Armor">Armor</option>
                  <option value="Adventuring Gear">Adventuring Gear</option>
                  <option value="Tools">Tools</option>
                  <option value="Mounts and Vehicles">Mounts & Vehicles</option>
                  <option value="Magic Items">Magic Items</option>
                </select>
              </div>
            </div>

            {/* Main Content: Vertical List */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>
                  {apiSearching ? 'Loading...' : `Results (${allFilteredResults.length})`}
                </h3>
              </div>

              {/* Results Grid/List */}
              <div style={{
                overflowY: 'auto',
                padding: '5px',
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '15px',
                alignContent: 'start'
              }}
              className="api-results-container">
                <style>
                  {`
                    @media (max-width: 768px) {
                      .api-results-container {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 10px !important;
                      }
                    }
                  `}
                </style>
                {displayedResults.map(item => (
                  <div
                    key={item.index}
                    onClick={() => handleSelectApiItem(item)}
                    style={{
                      padding: '15px',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid var(--color-border)',
                      backgroundColor: 'var(--background-card)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      minHeight: '80px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-text-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {item.category}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show More Results Button */}
                {hasMoreResults && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    gridColumn: '1 / -1'
                  }}>
                    <button
                      type="button"
                      onClick={() => setDisplayLimit(prev => prev + 8)}
                      className="btn btn-secondary"
                      style={{ minWidth: '200px' }}
                    >
                      Show More Results ({allFilteredResults.length - displayLimit} more)
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* API Item Detail Modal */}
      {showDetailModal && selectedApiItem && apiItemDetails && (
        <ApiItemDetailModal
          item={selectedApiItem}
          itemDetails={apiItemDetails}
          onClose={() => setShowDetailModal(false)}
          onImport={handleImportApiItem}
        />
      )}
    </div>
  );
}
