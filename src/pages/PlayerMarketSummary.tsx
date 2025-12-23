import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export function PlayerMarketSummary() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    loadPlayerData();
  }, [accessCode]);

  const loadPlayerData = () => {
    if (!accessCode) return;
    const dataStr = localStorage.getItem(`player_${accessCode}_data`);
    if (dataStr) {
      setPlayerData(JSON.parse(dataStr));
    }
  };

  return (
    <div className="player-summary-container">
      <div className="player-summary-card">
        <h1>Market Closed</h1>
        <p className="player-summary-message">
          The market has closed. Here's a summary of your adventure:
        </p>

        {playerData ? (
          <>
            <div className="player-summary-section">
              <h2>Final Currency</h2>
              {playerData.startingCurrency && (
                <p className="player-summary-starting-currency">
                  Started with: {playerData.startingCurrency.gold || 0} GP, {playerData.startingCurrency.silver || 0} SP, {playerData.startingCurrency.copper || 0} CP
                </p>
              )}
              <p>💰 Gold: {playerData.gold || 0} GP</p>
              <p>💰 Silver: {playerData.silver || 0} SP</p>
              <p>💰 Copper: {playerData.copper || 0} CP</p>
            </div>

            <div className="player-summary-section">
              <h2>Purchased Items</h2>
              {playerData.inventory && playerData.inventory.length > 0 ? (
                <ul className="player-summary-items">
                  {playerData.inventory.map((item: any, index: number) => {
                    const totalSpent = item.totalSpent || { gp: 0, sp: 0, cp: 0 };
                    const spentText = [];
                    if (totalSpent.gp > 0) spentText.push(`${totalSpent.gp} GP`);
                    if (totalSpent.sp > 0) spentText.push(`${totalSpent.sp} SP`);
                    if (totalSpent.cp > 0) spentText.push(`${totalSpent.cp} CP`);
                    const displaySpent = spentText.length > 0 ? ` - Spent: ${spentText.join(', ')}` : '';

                    return (
                      <li key={index}>
                        <strong>{item.name}</strong>
                        {item.quantity > 1 && ` (×${item.quantity})`}
                        {displaySpent && <span style={{ color: '#dc3545' }}>{displaySpent}</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>You didn't purchase any items.</p>
              )}
            </div>

            {playerData.soldItems && playerData.soldItems.length > 0 && (
              <div className="player-summary-section">
                <h2>Sold Items</h2>
                <ul className="player-summary-items">
                  {playerData.soldItems.map((item: any, index: number) => (
                    <li key={index}>
                      <strong>{item.name}</strong> - Sold for{' '}
                      {item.price.gp > 0 && `${item.price.gp} GP`}
                      {item.price.sp > 0 && ` ${item.price.sp} SP`}
                      {item.price.cp > 0 && ` ${item.price.cp} CP`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="player-summary-reminder">
              📝 Don't forget to update your character sheet with these items and currency!
            </div>
          </>
        ) : (
          <p>No inventory data found.</p>
        )}
      </div>
    </div>
  );
}
