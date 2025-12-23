interface InventoryItemDetailModalProps {
  item: any;
  onClose: () => void;
}

export function InventoryItemDetailModal({ item, onClose }: InventoryItemDetailModalProps) {
  const itemData = item.details;

  if (!itemData) {
    return (
      <div className="player-modal-overlay" onClick={onClose}>
        <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="player-modal-close" onClick={onClose}>×</button>
          <h2>{item.name}</h2>
          <p className="player-item-type">{item.type}</p>
          <p className="inventory-item-quantity">Quantity: {item.quantity}</p>
          <div className="player-modal-section">
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              No additional details available. This item was purchased before the detailed tracking system was implemented.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render item properties based on type
  const renderItemProperties = () => {
    const properties: JSX.Element[] = [];

    // Common properties
    if (itemData.rarity) {
      properties.push(<p key="rarity"><strong>Rarity:</strong> {itemData.rarity}</p>);
    }

    // Type-specific properties
    switch (itemData.type) {
      case 'weapon':
        if (itemData.damage) {
          properties.push(
            <p key="damage"><strong>Damage:</strong> {itemData.damage.dice} {itemData.damage.type}</p>
          );
        }
        if (itemData.weaponType) {
          properties.push(<p key="weaponType"><strong>Weapon Type:</strong> {itemData.weaponType}</p>);
        }
        if (itemData.properties && itemData.properties.length > 0) {
          properties.push(
            <p key="properties"><strong>Properties:</strong> {itemData.properties.join(', ')}</p>
          );
        }
        break;

      case 'armor':
        if (itemData.armorClass) {
          properties.push(<p key="ac"><strong>Armor Class:</strong> {itemData.armorClass}</p>);
        }
        if (itemData.armorType) {
          properties.push(<p key="armorType"><strong>Armor Type:</strong> {itemData.armorType}</p>);
        }
        if (itemData.stealthDisadvantage) {
          properties.push(<p key="stealth"><strong>Stealth:</strong> Disadvantage</p>);
        }
        break;

      case 'consumable':
        if (itemData.consumableType) {
          properties.push(<p key="consumableType"><strong>Type:</strong> {itemData.consumableType}</p>);
        }
        if (itemData.duration) {
          properties.push(<p key="duration"><strong>Duration:</strong> {itemData.duration}</p>);
        }
        break;

      case 'magic':
        if (itemData.requiresAttunement) {
          properties.push(<p key="attunement"><strong>Requires Attunement:</strong> Yes</p>);
        }
        if (itemData.charges) {
          properties.push(<p key="charges"><strong>Charges:</strong> {itemData.charges}</p>);
        }
        break;
    }

    if (itemData.weight) {
      properties.push(<p key="weight"><strong>Weight:</strong> {itemData.weight} lbs</p>);
    }

    return properties;
  };

  return (
    <div className="player-modal-overlay" onClick={onClose}>
      <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="player-modal-close" onClick={onClose}>×</button>

        <h2>{itemData.name}</h2>
        <p className="player-item-type">{itemData.type}</p>
        <p className="inventory-item-quantity">Quantity: {item.quantity}</p>

        {itemData.description && (
          <div className="player-modal-section">
            <h3>Description</h3>
            <p>{itemData.description}</p>
          </div>
        )}

        {renderItemProperties().length > 0 && (
          <div className="player-modal-section">
            <h3>Properties</h3>
            {renderItemProperties()}
          </div>
        )}
      </div>
    </div>
  );
}
