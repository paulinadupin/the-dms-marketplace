import { useEffect, useState } from 'react';
import { PlayerSessionService } from '../services/player-session.service';
import type { PlayerSession } from '../services/player-session.service';

interface PlayerActivityModalProps {
  marketId: string;
  marketName: string;
  onClose: () => void;
}

export function PlayerActivityModal({ marketId, marketName, onClose }: PlayerActivityModalProps) {
  const [sessions, setSessions] = useState<PlayerSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = PlayerSessionService.subscribeToMarketSessions(
      marketId,
      (updatedSessions) => {
        setSessions(updatedSessions);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [marketId]);

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Player Activity - {marketName}</h2>
          <button onClick={onClose} className="modal-close-button">
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="player-activity-loading">
              <p>Loading player activity...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="player-activity-empty">
              <p>No players have entered this market yet.</p>
            </div>
          ) : (
            <div className="player-activity-list">
              {sessions.map((session) => (
                <div key={session.id} className="player-activity-item">
                  <div className="player-activity-header">
                    <div className="player-name">
                      👤 {session.playerName}
                    </div>
                    <div className="player-time">
                      Entered: {formatTime(session.enteredAt)}
                    </div>
                  </div>
                  <div className="player-transactions">
                    <strong>Activity:</strong>{' '}
                    <span className="transaction-text">
                      {PlayerSessionService.formatTransactions(session.transactions)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
