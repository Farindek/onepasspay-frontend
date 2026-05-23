import React from 'react';
import { Merchant } from '../types';
import { MERCHANTS } from '../utils/merchants';
import './MerchantSelector.css';

interface Props {
  selected: Merchant | null;
  onSelect: (merchant: Merchant) => void;
}

export function MerchantSelector({ selected, onSelect }: Props) {
  return (
    <div className="merchant-selector" role="group" aria-label="Select a merchant">
      <h2 className="section-title">Select Merchant</h2>
      <ul className="merchant-list">
        {MERCHANTS.map(merchant => (
          <li key={merchant.id}>
            <button
              className={`merchant-btn${selected?.id === merchant.id ? ' merchant-btn--selected' : ''}`}
              onClick={() => onSelect(merchant)}
              aria-pressed={selected?.id === merchant.id}
            >
              <span className="merchant-name">{merchant.name}</span>
              <span className="merchant-category">{merchant.category}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
