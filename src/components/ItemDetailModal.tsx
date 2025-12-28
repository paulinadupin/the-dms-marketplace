import type { ItemLibrary } from '../types/firebase';
import { parseMarkdownTables } from '../utils/markdown';

interface ItemDetailModalProps {
  item: ItemLibrary;
  onClose: () => void;
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const parsedDescription = parseMarkdownTables(item.item.description);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-title">{item.item.name}</h2>

        {/* Item Image */}
        {item.item.imageUrl && (
          <div className="modal-image-container">
            <img
              src={item.item.imageUrl}
              alt={item.item.name}
              className="modal-image"
              onError={(e) => {
                const container = e.currentTarget.parentElement;
                if (container) container.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Badges */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span className={`badge badge-${item.item.type}`}>
            {item.item.type}
          </span>
          <span className={`badge badge-${item.source}`}>
            {item.source}
          </span>
        </div>

        {/* Description */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--background-card-secondary)'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>Description</h3>
          <div style={{ lineHeight: '1.6' }}>
            {parsedDescription.map((block, idx) => {
              if (block.type === 'text') {
                return (
                  <p key={idx} style={{ whiteSpace: 'pre-wrap', marginBottom: idx === parsedDescription.length - 1 ? 0 : '10px' }}>
                    {block.content}
                  </p>
                );
              } else {
                // Render table
                const tableData = block.content as string[][];
                const headers = tableData[0];
                const rows = tableData.slice(1);

                return (
                  <table
                    key={idx}
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginBottom: idx === parsedDescription.length - 1 ? 0 : '15px',
                      fontSize: '14px'
                    }}
                  >
                    <thead>
                      <tr>
                        {headers.map((header, hIdx) => (
                          <th
                            key={hIdx}
                            style={{
                              border: '1px solid var(--color-border)',
                              padding: '8px',
                              backgroundColor: 'var(--background-card)',
                              fontWeight: 'bold',
                              textAlign: 'left'
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              style={{
                                border: '1px solid var(--color-border)',
                                padding: '8px',
                                textAlign: 'left'
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              }
            })}
          </div>
        </div>

        {/* Basic Info */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--background-card-secondary)'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>Details</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {item.item.weight !== null && (
              <div>
                <strong>Weight:</strong> {item.item.weight} lb
              </div>
            )}
            {item.item.tags && item.item.tags.length > 0 && (
              <div>
                <strong>Tags:</strong> {item.item.tags.join(', ')}
              </div>
            )}
            {item.item.source && (
              <div>
                <strong>Source:</strong> {item.item.source}
              </div>
            )}
          </div>
        </div>

        {/* Type-specific fields */}
        {item.item.type === 'weapon' && 'damage' in item.item && item.item.damage && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--background-card-secondary)'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>Weapon Stats</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <strong>Damage:</strong> {item.item.damage.dice} {item.item.damage.type}
              </div>
              {'weaponType' in item.item && item.item.weaponType && (
                <div>
                  <strong>Type:</strong> {item.item.weaponType}
                </div>
              )}
              {'properties' in item.item && item.item.properties && item.item.properties.length > 0 && (
                <div>
                  <strong>Properties:</strong> {item.item.properties.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {item.item.type === 'armor' && 'baseAC' in item.item && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--background-card-secondary)'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>Armor Stats</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <strong>Base AC:</strong> {item.item.baseAC}
              </div>
              {'armorType' in item.item && item.item.armorType && (
                <div>
                  <strong>Type:</strong> {item.item.armorType}
                </div>
              )}
              {'stealthDisadvantage' in item.item && item.item.stealthDisadvantage && (
                <div>
                  <strong>Stealth:</strong> Disadvantage
                </div>
              )}
            </div>
          </div>
        )}

        {item.item.type === 'magic' && 'rarity' in item.item && item.item.rarity && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--background-card-secondary)'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>Magic Item</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <strong>Rarity:</strong> {item.item.rarity}
              </div>
              {'requiresAttunement' in item.item && item.item.requiresAttunement && (
                <div>
                  <strong>Attunement:</strong> Required
                </div>
              )}
              {'magicalEffects' in item.item && item.item.magicalEffects && item.item.magicalEffects.length > 0 && (
                <div>
                  <strong>Magical Effects:</strong>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    {item.item.magicalEffects.map((effect, idx) => (
                      <li key={idx}>{effect}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
