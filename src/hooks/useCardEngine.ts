// src/hooks/useCardEngine.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { VirtualCard, TransactionEvent, FraudFlag } from '../types';
import {
  generateValidPan,
  generateCvv,
  generateExpiry,
  formatPan,
} from '../utils/luhn';
import { detectFraudFlags } from '../utils/merchants';

const CARD_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function useCardEngine() {
  const [activeCard, setActiveCard] = useState<VirtualCard | null>(null);
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const expiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const generateCard = useCallback(
    (merchantId: string, merchantName: string) => {
      clearTimers();

      const pan = generateValidPan();
      const now = Date.now();
      const expiresAt = now + CARD_TTL_MS;

      const card: VirtualCard = {
        id: crypto.randomUUID(),
        pan,
        merchantId,
        merchantName,
        issuedAt: now,
        expiresAt,
        status: 'active',
        cvv: generateCvv(),
        expiryDisplay: generateExpiry(),
      };

      setActiveCard(card);

      // Start countdown — derive remaining time from expiresAt on each tick to prevent drift
      setCountdown(Math.ceil(CARD_TTL_MS / 1000));
      countdownRef.current = setInterval(() => {
        const remaining = Math.ceil((card.expiresAt - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(countdownRef.current!);
          setCountdown(0);
        } else {
          setCountdown(remaining);
        }
      }, 1000);

      // Auto-expire
      expiryTimerRef.current = setTimeout(() => {
        setActiveCard(prev =>
          prev?.id === card.id ? { ...prev, status: 'expired' } : prev
        );
        setTransactions(prev => [
          {
            id: crypto.randomUUID(),
            cardId: card.id,
            pan: formatPan(pan),
            merchantName,
            action: 'expired',
            timestamp: Date.now(),
          },
          ...prev,
        ]);
      }, CARD_TTL_MS);

      // Log generation event and run fraud detection against the updated array
      setTransactions(prev => {
        const updated = [
          {
            id: crypto.randomUUID(),
            cardId: card.id,
            pan: formatPan(pan),
            merchantName,
            action: 'generated' as const,
            timestamp: now,
            amount: parseFloat((Math.random() * 200 + 5).toFixed(2)),
          },
          ...prev,
        ];

        const recentCount = updated.filter(
          t => t.action === 'generated' && now - t.timestamp < CARD_TTL_MS
        ).length;

        const flags = detectFraudFlags(merchantId, recentCount);
        if (flags.length > 0) {
          setFraudFlags(f => [...flags, ...f]);
        }

        return updated;
      });
    },
    []
  );

  const markUsed = useCallback(() => {
    if (!activeCard || activeCard.status !== 'active') return;
    clearTimers();
    setCountdown(0);
    setActiveCard(prev => (prev ? { ...prev, status: 'used' } : null));
    setTransactions(prev => [
      {
        id: crypto.randomUUID(),
        cardId: activeCard.id,
        pan: formatPan(activeCard.pan),
        merchantName: activeCard.merchantName,
        action: 'used',
        timestamp: Date.now(),
        amount: parseFloat((Math.random() * 200 + 5).toFixed(2)),
      },
      ...prev,
    ]);
  }, [activeCard]);

  const clearFlags = useCallback(() => setFraudFlags([]), []);

  useEffect(() => () => clearTimers(), []);

  return {
    activeCard,
    transactions,
    fraudFlags,
    countdown,
    generateCard,
    markUsed,
    clearFlags,
  };
}
