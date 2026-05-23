import React from 'react';
import { VirtualCard } from '../types';
import { MERCHANTS } from '../utils/merchants';
import { formatPan } from '../utils/luhn';
import './CardDetail.css';

interface Props {
  card: VirtualCard | null;
  countdown: number;
}

function computeScore(card: VirtualCard, countdown: number): number {
  const merchant = MERCHANTS.find(m => m.id === card.merchantId);
  const ttlSeconds = (card.expiresAt - card.issuedAt) / 1000;
  const riskPenalty = Math.round((merchant?.riskScore ?? 0.3) * 45);
  const agePenalty = Math.round((1 - Math.min(countdown, ttlSeconds) / ttlSeconds) * 8);
  return Math.max(0, 100 - riskPenalty - agePenalty);
}

function riskDots(riskScore: number): number {
  return Math.max(1, Math.round((1 - riskScore) * 5));
}

function scoreGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

function scoreColor(score: number): string {
  if (score >= 85) return 'var(--success)';
  if (score >= 70) return 'var(--warning)';
  return 'var(--danger)';
}

function riskLabel(riskScore: number): string {
  if (riskScore < 0.3) return 'Low';
  if (riskScore < 0.6) return 'Medium';
  return 'High';
}

function Dots({ filled, color }: { filled: number; color: string }) {
  return (
    <span className="cd-dots" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => (
        <span
          key={i}
          className="cd-dot"
          style={{ background: i < filled ? color : undefined }}
        />
      ))}
    </span>
  );
}

export function CardDetail({ card, countdown }: Props) {
  if (!card) {
    return <SecurityModelPlaceholder />;
  }

  const merchant = MERCHANTS.find(m => m.id === card.merchantId);
  const score = computeScore(card, countdown);
  const grade = scoreGrade(score);
  const color = scoreColor(score);
  const isActive = card.status === 'active';

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  const issuedDate = new Date(card.issuedAt);
  const issuedTime = issuedDate.toLocaleTimeString('en-US', { hour12: false });
  const issuedFull = issuedDate.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  return (
    <div className="card-detail">

      {/* ── Header ───────────────────────────────────── */}
      <div className="cd-header">
        <span className="cd-title">Live Card Detail</span>
        <span className={`cd-status-badge cd-status-badge--${card.status}`}>
          {card.status}
        </span>
      </div>
      <span className="cd-card-id">
        Card · {card.id.slice(0, 8).toUpperCase()}
      </span>

      {/* ── Info pills ───────────────────────────────── */}
      <div className="cd-pills">
        <div className="cd-pill">
          <span className="cd-pill-label">Issued</span>
          <span className="cd-pill-value">{issuedTime}</span>
        </div>
        <div className="cd-pill">
          <span className="cd-pill-label">Locked to</span>
          <span className="cd-pill-value cd-pill-value--name">{card.merchantName}</span>
        </div>
        <div className="cd-pill">
          <span className="cd-pill-label">{isActive ? 'Expires in' : 'Status'}</span>
          <span className={`cd-pill-value${isActive ? ' cd-pill-value--countdown' : ' cd-pill-value--inactive'}`}>
            {isActive
              ? `${mins}:${String(secs).padStart(2, '0')}`
              : card.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── Security score ───────────────────────────── */}
      <div className="cd-score-card">
        <div className="cd-score-top">
          <div>
            <div className="cd-score-heading">Security Score</div>
            <div className="cd-score-row">
              <span className="cd-score-number" style={{ color }}>{score}</span>
              <span className="cd-score-denom">/100</span>
              <span className="cd-score-grade" style={{ color }}>{grade}</span>
            </div>
          </div>
          <div className="cd-score-track-wrap">
            <div className="cd-score-track">
              <div
                className="cd-score-fill"
                style={{ width: `${score}%`, background: color }}
              />
            </div>
          </div>
        </div>

        <div className="cd-factors">
          <div className="cd-factor">
            <span className="cd-factor-name">Merchant Risk</span>
            <span className="cd-factor-badge"
              style={{
                color: merchant && merchant.riskScore >= 0.6
                  ? 'var(--danger)'
                  : merchant && merchant.riskScore >= 0.3
                    ? 'var(--warning)'
                    : 'var(--success)',
              }}
            >
              {merchant ? riskLabel(merchant.riskScore) : '—'}
            </span>
            <Dots filled={riskDots(merchant?.riskScore ?? 0.3)} color={color} />
          </div>
          <div className="cd-factor">
            <span className="cd-factor-name">TTL Enforcement</span>
            <span className="cd-factor-badge" style={{ color: 'var(--success)' }}>10-min TTL</span>
            <Dots filled={5} color="var(--success)" />
          </div>
          <div className="cd-factor">
            <span className="cd-factor-name">Luhn Integrity</span>
            <span className="cd-factor-badge" style={{ color: 'var(--success)' }}>ISO/IEC 7812</span>
            <Dots filled={5} color="var(--success)" />
          </div>
          <div className="cd-factor">
            <span className="cd-factor-name">Merchant Lock</span>
            <span className="cd-factor-badge" style={{ color: 'var(--success)' }}>Enforced</span>
            <Dots filled={5} color="var(--success)" />
          </div>
        </div>
      </div>

      {/* ── Card fields ──────────────────────────────── */}
      <div className="cd-fields">
        <div className="cd-field">
          <span className="cd-field-label">PAN</span>
          <span className="cd-field-value cd-mono">{formatPan(card.pan)}</span>
        </div>
        <div className="cd-field">
          <span className="cd-field-label">CVV</span>
          <span className="cd-field-value cd-mono">{card.cvv}</span>
        </div>
        <div className="cd-field">
          <span className="cd-field-label">Expiry</span>
          <span className="cd-field-value cd-mono">{card.expiryDisplay}</span>
        </div>
        <div className="cd-field">
          <span className="cd-field-label">Merchant Lock</span>
          <span className="cd-field-value">
            {card.merchantName}
            {merchant && <span className="cd-muted"> · {merchant.category}</span>}
          </span>
        </div>
        <div className="cd-field">
          <span className="cd-field-label">Issued At</span>
          <span className="cd-field-value">{issuedFull}</span>
        </div>
        <div className="cd-field">
          <span className="cd-field-label">Card ID</span>
          <span className="cd-field-value cd-mono cd-dim">{card.id}</span>
        </div>
      </div>

    </div>
  );
}

function SecurityModelPlaceholder() {
  return (
    <div className="security-model">
      <h2 className="section-title">How it works</h2>
      <ol className="security-steps">
        <li>
          <strong>Merchant locking</strong>
          <p>Each card is cryptographically scoped to one merchant at issuance. If stolen, it cannot be used elsewhere.</p>
        </li>
        <li>
          <strong>Luhn-valid PAN</strong>
          <p>Card numbers pass the ISO/IEC 7812 checksum — structurally identical to real Visa cards, ensuring compatibility with payment terminals.</p>
        </li>
        <li>
          <strong>Time-limited TTL</strong>
          <p>Cards expire after 10 minutes or first use, whichever comes first. Replay attacks fail instantly.</p>
        </li>
        <li>
          <strong>Fraud detection</strong>
          <p>Generation velocity and merchant risk scores are monitored. Suspicious patterns trigger alerts in real time.</p>
        </li>
      </ol>
      <div className="threat-table-wrap">
        <table className="threat-table" aria-label="Threat mitigation matrix">
          <thead>
            <tr>
              <th scope="col">Threat</th>
              <th scope="col">Mitigation</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Merchant data breach</td><td>Card scoped to that merchant — useless elsewhere</td></tr>
            <tr><td>Card skimming</td><td>Single-use — replay attacks fail</td></tr>
            <tr><td>Unauthorized recurring</td><td>Auto-expiry invalidates the card</td></tr>
            <tr><td>Enumeration attacks</td><td>BIN prefix + Luhn shrinks valid space</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
