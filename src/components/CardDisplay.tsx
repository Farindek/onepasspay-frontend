import React from 'react';
import { VirtualCard } from '../types';
import { formatPan } from '../utils/luhn';
import './CardDisplay.css';

interface Props {
  card: VirtualCard | null;
  countdown: number;
  onMarkUsed: () => void;
}

export function CardDisplay({ card, countdown, onMarkUsed }: Props) {
  if (!card) {
    return (
      <div className="card-display card-display--empty" aria-live="polite">
        <p>No active card — select a merchant and generate one.</p>
      </div>
    );
  }

  const isActive = card.status === 'active';
  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className={`card-display card-display--${card.status}`}>
      <div className="card-visual" role="group" aria-label="Virtual card details">

        {/* Top bar: issuer brand + countdown or status pill */}
        <div className="card-top">
          <span className="card-issuer">OnePassPay</span>
          {isActive ? (
            <span className="card-countdown" aria-live="polite" aria-label="Time remaining">
              {mins}:{String(secs).padStart(2, '0')}
            </span>
          ) : (
            <span className={`card-status-pill card-status-pill--${card.status}`}>
              {card.status}
            </span>
          )}
        </div>

        {/* EMV chip */}
        <div className="card-chip" aria-hidden="true" />

        {/* PAN */}
        <div className="card-pan" aria-label="Card number">
          {formatPan(card.pan)}
        </div>

        {/* Bottom row: merchant / expiry / CVV / network */}
        <div className="card-bottom">
          <div className="card-field">
            <span className="card-label">Locked to</span>
            <span className="card-value card-value--name">{card.merchantName}</span>
          </div>
          <div className="card-field">
            <span className="card-label">Valid thru</span>
            <span className="card-value">{card.expiryDisplay}</span>
          </div>
          <div className="card-field">
            <span className="card-label">CVV</span>
            <span className="card-value">{card.cvv}</span>
          </div>
          <span className="card-network" aria-hidden="true">VISA</span>
        </div>

      </div>

      {isActive && (
        <button className="btn-mark-used" onClick={onMarkUsed}>
          Mark as Used
        </button>
      )}
    </div>
  );
}
