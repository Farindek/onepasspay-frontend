import React from 'react';
import { TransactionEvent, FraudFlag } from '../types';

interface Props {
  transactions: TransactionEvent[];
  fraudFlags: FraudFlag[];
  onClearFlags: () => void;
}

export function Dashboard({ transactions, fraudFlags, onClearFlags }: Props) {
  const generated = transactions.filter(t => t.action === 'generated').length;
  const used = transactions.filter(t => t.action === 'used').length;
  const expired = transactions.filter(t => t.action === 'expired').length;
  const totalSpend = transactions
    .filter(t => t.action === 'used' && t.amount != null)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{generated}</span>
          <span className="stat-label">Generated</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{used}</span>
          <span className="stat-label">Used</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{expired}</span>
          <span className="stat-label">Expired</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">${totalSpend.toFixed(2)}</span>
          <span className="stat-label">Total Spend</span>
        </div>
      </div>

      <div className="fraud-section">
        <div className="fraud-header">
          <h3 className="section-title">
            Fraud Alerts {fraudFlags.length > 0 && `(${fraudFlags.length})`}
          </h3>
          {fraudFlags.length > 0 && (
            <button className="btn-clear" onClick={onClearFlags}>
              Clear All
            </button>
          )}
        </div>
        {fraudFlags.length === 0 ? (
          <p className="no-flags">No fraud alerts.</p>
        ) : (
          <ul className="flag-list" aria-label="Fraud alerts">
            {fraudFlags.map(flag => (
              <li key={flag.id} className={`flag-item flag-item--${flag.severity}`}>
                <strong>{flag.severity.toUpperCase()}</strong> — {flag.reason}
                <span className="flag-time">
                  {new Date(flag.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
