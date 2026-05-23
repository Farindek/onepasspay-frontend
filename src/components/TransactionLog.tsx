import React from 'react';
import { TransactionEvent } from '../types';

interface Props {
  transactions: TransactionEvent[];
}

const ACTION_LABELS: Record<TransactionEvent['action'], string> = {
  generated: 'Generated',
  used: 'Used',
  expired: 'Expired',
};

export function TransactionLog({ transactions }: Props) {
  if (transactions.length === 0) {
    return <p className="log-empty">No transactions yet.</p>;
  }

  return (
    <div className="transaction-log">
      <table aria-label="Transaction log">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Merchant</th>
            <th scope="col">PAN (last 4)</th>
            <th scope="col">Action</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td>{new Date(tx.timestamp).toLocaleTimeString()}</td>
              <td>{tx.merchantName}</td>
              <td>•••• {tx.pan.replace(/\s/g, '').slice(-4)}</td>
              <td>
                <span className={`badge badge--${tx.action}`}>
                  {ACTION_LABELS[tx.action]}
                </span>
              </td>
              <td>{tx.amount != null ? `$${tx.amount.toFixed(2)}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
