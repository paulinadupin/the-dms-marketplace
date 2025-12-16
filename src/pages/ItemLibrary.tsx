import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { ItemLibraryService } from '../services/item-library.service';
import type { User } from 'firebase/auth';
import type { ItemLibrary } from '../types/firebase';
import { Toast } from '../components/Toast';
import { CreateItemModal } from '../components/CreateItemModal';

const ITEM_LIBRARY_LIMIT = ItemLibraryService.ITEM_LIBRARY_LIMIT;
const WARNING_THRESHOLD = ItemLibraryService.ITEM_LIBRARY_WARNING_THRESHOLD;

export function ItemLibraryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ItemLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((authUser) => {
      if (!authUser) {
        navigate('/auth');
        return;
      }
      setUser(authUser);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user, filterType, filterSource]);

  const loadItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let fetchedItems: ItemLibrary[];

      if (filterSource !== 'all') {
        fetchedItems = await ItemLibraryService.getItemsBySource(
          user.uid,
          filterSource as 'official' | 'custom' | 'modified'
        );
      } else {
        fetchedItems = await ItemLibraryService.getItemsByDM(user.uid);
      }

      // Apply type filter on client side
      if (filterType !== 'all') {
        fetchedItems = fetchedItems.filter(item => item.item.type === filterType);
      }

      setItems(fetchedItems);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    try {
      // Check if item is in active market
      const inActiveMarket = await ItemLibraryService.isItemInActiveMarket(itemId);
      if (inActiveMarket) {
        setToast({
          message: 'Cannot delete: Item is in an active market. Please deactivate the market first.',
          type: 'error'
        });
        return;
      }

      // Check usage count
      const usageCount = await ItemLibraryService.getItemUsageCount(itemId);

      let confirmMessage = `Are you sure you want to delete "${itemName}"?\n\n`;
      if (usageCount > 0) {
        confirmMessage += `⚠️ This item is used in ${usageCount} shop${usageCount > 1 ? 's' : ''}.\n\n`;
        confirmMessage += `This will remove it from all shops.\n\n`;
      }
      confirmMessage += `This action cannot be undone.`;

      const confirmed = window.confirm(confirmMessage);

      if (!confirmed) return;

      await ItemLibraryService.deleteItem(itemId);
      setToast({ message: 'Item deleted successfully!', type: 'success' });
      loadItems();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const formatCost = (cost: any) => {
    if (!cost) return 'No cost';
    const parts = [];
    if (cost.cp) parts.push(`${cost.cp} CP`);
    if (cost.sp) parts.push(`${cost.sp} SP`);
    if (cost.gp) parts.push(`${cost.gp} GP`);
    if (cost.pp) parts.push(`${cost.pp} PP`);
    return parts.length > 0 ? parts.join(', ') : 'No cost';
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'official': return { bg: '#d4edda', color: '#155724' };
      case 'custom': return { bg: '#d1ecf1', color: '#0c5460' };
      case 'modified': return { bg: '#fff3cd', color: '#856404' };
      default: return { bg: '#e7e7e7', color: '#333' };
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      weapon: { bg: '#f8d7da', color: '#721c24' },
      armor: { bg: '#cce5ff', color: '#004085' },
      consumable: { bg: '#d4edda', color: '#155724' },
      tool: { bg: '#fff3cd', color: '#856404' },
      magic: { bg: '#e7d4f0', color: '#5a2a6f' },
      gear: { bg: '#d1ecf1', color: '#0c5460' },
      treasure: { bg: '#fff0c2', color: '#8b6914' },
    };
    return colors[type] || { bg: '#e7e7e7', color: '#333' };
  };

  // Apply search filter to items (client-side, no reload)
  const filteredItems = searchTerm
    ? items.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.item.name.toLowerCase().includes(searchLower) ||
          item.item.description.toLowerCase().includes(searchLower)
        );
      })
    : items;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div>
            <h1 style={{ margin: 0 }}>Item Library</h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              Your personal catalog of reusable items ({items.length}/{ITEM_LIBRARY_LIMIT})
            </p>
            {items.length >= WARNING_THRESHOLD && items.length < ITEM_LIBRARY_LIMIT && (
              <p style={{ margin: '5px 0 0 0', color: '#856404', fontSize: '14px' }}>
                ⚠️ You're approaching the limit ({ITEM_LIBRARY_LIMIT - items.length} slots remaining)
              </p>
            )}
            {items.length >= ITEM_LIBRARY_LIMIT && (
              <p style={{ margin: '5px 0 0 0', color: '#721c24', fontSize: '14px' }}>
                ⚠️ You've reached the maximum limit. Delete items to create new ones.
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Back to Dashboard
          </button>
        </div>

        {/* Filters and Search */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="Search items by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ marginRight: '8px', fontSize: '14px', color: '#666' }}>Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Types</option>
              <option value="weapon">Weapon</option>
              <option value="armor">Armor</option>
              <option value="consumable">Consumable</option>
              <option value="tool">Tool</option>
              <option value="magic">Magic</option>
              <option value="gear">Gear</option>
              <option value="treasure">Treasure</option>
            </select>
          </div>

          <div>
            <label style={{ marginRight: '8px', fontSize: '14px', color: '#666' }}>Source:</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Sources</option>
              <option value="official">Official (D&D)</option>
              <option value="custom">Custom</option>
              <option value="modified">Modified</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={items.length >= ITEM_LIBRARY_LIMIT}
            title={items.length >= ITEM_LIBRARY_LIMIT ? `Maximum of ${ITEM_LIBRARY_LIMIT} items reached` : ''}
            style={{
              padding: '10px 20px',
              backgroundColor: items.length >= ITEM_LIBRARY_LIMIT ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: items.length >= ITEM_LIBRARY_LIMIT ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: items.length >= ITEM_LIBRARY_LIMIT ? 0.6 : 1
            }}
          >
            + Create New Item
          </button>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '2px dashed #ddd'
          }}>
            {items.length === 0 ? (
              <>
                <h2 style={{ marginTop: 0, color: '#666' }}>No Items Yet</h2>
                <p style={{ color: '#999', marginBottom: '30px' }}>
                  Create your first item or import from the D&D API to get started!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={items.length >= ITEM_LIBRARY_LIMIT}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: items.length >= ITEM_LIBRARY_LIMIT ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: items.length >= ITEM_LIBRARY_LIMIT ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    opacity: items.length >= ITEM_LIBRARY_LIMIT ? 0.6 : 1
                  }}
                >
                  + Create Your First Item
                </button>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: 0, color: '#666' }}>No Results Found</h2>
                <p style={{ color: '#999', marginBottom: '0' }}>
                  No items match your search or filters. Try adjusting your criteria.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Item Count */}
            <div style={{ marginBottom: '15px' }}>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Item Grid */}
            <div style={{ display: 'grid', gap: '20px' }}>
              {filteredItems.map((libraryItem) => (
                <div
                  key={libraryItem.id}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0 }}>{libraryItem.item.name}</h3>

                        <span style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          borderRadius: '3px',
                          ...getTypeBadgeColor(libraryItem.item.type),
                          fontWeight: 'bold'
                        }}>
                          {libraryItem.item.type}
                        </span>

                        <span style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          borderRadius: '3px',
                          ...getSourceBadgeColor(libraryItem.source),
                          fontWeight: 'bold'
                        }}>
                          {libraryItem.source}
                        </span>
                      </div>

                      <p style={{ margin: '8px 0', color: '#666' }}>
                        {libraryItem.item.description}
                      </p>

                      <div style={{
                        display: 'flex',
                        gap: '20px',
                        marginTop: '10px',
                        fontSize: '14px',
                        color: '#999'
                      }}>
                        <span><strong>Cost:</strong> {formatCost(libraryItem.item.cost)}</span>
                        {libraryItem.item.weight !== null && (
                          <span><strong>Weight:</strong> {libraryItem.item.weight} lb</span>
                        )}
                        {libraryItem.item.tags && libraryItem.item.tags.length > 0 && (
                          <span><strong>Tags:</strong> {libraryItem.item.tags.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setToast({ message: 'Edit item feature coming soon!', type: 'success' })}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(libraryItem.id, libraryItem.item.name)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Item Modal */}
      {showCreateModal && user && (
        <CreateItemModal
          dmId={user.uid}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadItems();
            setShowCreateModal(false);
            setToast({ message: 'Item created successfully!', type: 'success' });
          }}
        />
      )}
    </>
  );
}
