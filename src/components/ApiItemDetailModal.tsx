import { useState } from 'react';
import { parseMarkdownTables } from '../utils/markdown';

interface ApiItemDetailModalProps {
  item: {
    index: string;
    name: string;
    category: string;
    itemType: 'equipment' | 'magic';
  };
  itemDetails: any;
  onClose: () => void;
  onImport: () => Promise<void>;
}

export function ApiItemDetailModal({ item, itemDetails, onClose, onImport }: ApiItemDetailModalProps) {
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      await onImport();
      // Success - modal will be closed by parent
    } catch (err) {
      // Error handled by parent
      setImporting(false);
    }
  };

  const renderDescription = () => {
    if (!itemDetails.desc || itemDetails.desc.length === 0) return null;

    const descriptionText = Array.isArray(itemDetails.desc)
      ? itemDetails.desc.join('\n\n')
      : itemDetails.desc;

    const parsedContent = parseMarkdownTables(descriptionText);

    return (
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--background-card-secondary)'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>Description</h3>
        <div style={{ lineHeight: '1.6' }}>
          {parsedContent.map((block, idx) => {
            if (block.type === 'text') {
              return (
                <p key={idx} style={{ whiteSpace: 'pre-wrap', marginBottom: idx === parsedContent.length - 1 ? 0 : '10px' }}>
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
                    marginBottom: idx === parsedContent.length - 1 ? 0 : '15px',
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
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-title">{itemDetails.name}</h2>

        {/* Badge */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span className="badge badge-type">
            {item.category}
          </span>
          <span className="badge badge-official">
            Official D&D
          </span>
        </div>

        {/* Weapon Stats */}
        {itemDetails.damage && (
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
                <strong>Damage:</strong> {itemDetails.damage.damage_dice} {itemDetails.damage.damage_type?.name}
              </div>
              {itemDetails.weapon_category && (
                <div>
                  <strong>Category:</strong> {itemDetails.weapon_category}
                </div>
              )}
              {itemDetails.weapon_range && (
                <div>
                  <strong>Range:</strong> {itemDetails.weapon_range}
                </div>
              )}
              {itemDetails.properties && itemDetails.properties.length > 0 && (
                <div>
                  <strong>Properties:</strong> {itemDetails.properties.map((p: any) => p.name).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Armor Stats */}
        {itemDetails.armor_class && (
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
                <strong>Base AC:</strong> {itemDetails.armor_class.base}
                {itemDetails.armor_class.dex_bonus && ' + Dex modifier'}
                {itemDetails.armor_class.max_bonus && ` (max ${itemDetails.armor_class.max_bonus})`}
              </div>
              {itemDetails.armor_category && (
                <div>
                  <strong>Category:</strong> {itemDetails.armor_category}
                </div>
              )}
              {itemDetails.stealth_disadvantage && (
                <div>
                  <strong>Stealth:</strong> Disadvantage
                </div>
              )}
            </div>
          </div>
        )}

        {/* Magic Item Stats */}
        {itemDetails.rarity && (
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
                <strong>Rarity:</strong> {itemDetails.rarity.name}
              </div>
            </div>
          </div>
        )}

        {/* Basic Details */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--background-card-secondary)'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', marginTop: 0 }}>Details</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {itemDetails.cost && (
              <div>
                <strong>Cost:</strong> {itemDetails.cost.quantity} {itemDetails.cost.unit}
              </div>
            )}
            {itemDetails.weight && (
              <div>
                <strong>Weight:</strong> {itemDetails.weight} lb
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {renderDescription()}

        {/* Import Button */}
        <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className={`btn ${importing ? 'btn-secondary' : 'btn-success'}`}
          >
            {importing ? 'Importing...' : 'Import to Library'}
          </button>
        </div>
      </div>
    </div>
  );
}
