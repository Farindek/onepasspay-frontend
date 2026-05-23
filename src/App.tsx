// src/App.tsx
import React, { useState } from 'react';
import { Merchant } from './types';
import { useCardEngine } from './hooks/useCardEngine';
import { CardDisplay } from './components/CardDisplay';
import { MerchantSelector } from './components/MerchantSelector';
import { TransactionLog } from './components/TransactionLog';
import { Dashboard } from './components/Dashboard';
import { CardDetail } from './components/CardDetail';
import './App.css';

type Tab = 'card' | 'log' | 'analytics';

export default function App() {
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('card');

  const { activeCard, transactions, fraudFlags, countdown, generateCard, markUsed, clearFlags } =
    useCardEngine();

  const handleGenerate = () => {
    if (!selectedMerchant) return;
    generateCard(selectedMerchant.id, selectedMerchant.name);
    setActiveTab('card');
  };

  const canGenerate = selectedMerchant !== null;

  return (
    <div className="app">
      {/* Skip to main content for screen readers */}
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className="app-header" role="banner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">⬡</span>
          <span className="brand-name">OnePassPay</span>
          <span className="brand-tag">PROTOTYPE</span>
        </div>
        <p className="brand-tagline">
          Merchant-locked virtual cards · Single-use · Luhn-validated
        </p>
      </header>

      <main id="main" className="app-main">
        <section className="panel panel-left" aria-label="Card generation">
          <MerchantSelector selected={selectedMerchant} onSelect={setSelectedMerchant} />

          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={!canGenerate}
            aria-label={
              canGenerate
                ? `Generate virtual card locked to ${selectedMerchant?.name}`
                : 'Select a merchant to generate a card'
            }
          >
            {canGenerate
              ? `Generate Card → ${selectedMerchant?.name}`
              : 'Select a merchant above'}
          </button>

          <CardDisplay card={activeCard} countdown={countdown} onMarkUsed={markUsed} />
        </section>

        <section className="panel panel-right" aria-label="Activity and analytics">
          <nav className="tabs" role="tablist" aria-label="View selector">
            {(['card', 'log', 'analytics'] as Tab[]).map(tab => (
              <button
                key={tab}
                id={`tab-${tab}`}
                role="tab"
                aria-selected={activeTab === tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'card' && 'Card Detail'}
                {tab === 'log' && `Log ${transactions.length > 0 ? `(${transactions.length})` : ''}`}
                {tab === 'analytics' && `Analytics ${fraudFlags.length > 0 ? `⚑${fraudFlags.length}` : ''}`}
              </button>
            ))}
          </nav>

          <div role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="tab-content">
            {activeTab === 'card' && (
              <CardDetail card={activeCard} countdown={countdown} />
            )}

            {activeTab === 'log' && <TransactionLog transactions={transactions} />}

            {activeTab === 'analytics' && (
              <Dashboard
                transactions={transactions}
                fraudFlags={fraudFlags}
                onClearFlags={clearFlags}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>
          © 2025 OnePassPay · MIT License ·{' '}
          <a
            href="https://github.com/yourusername/onepasspay"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>{' '}
          · Demonstration prototype — not for production financial use
        </p>
      </footer>
    </div>
  );
}
