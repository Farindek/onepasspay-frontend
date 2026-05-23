import { Merchant, FraudFlag } from '../types';

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const MERCHANTS: Merchant[] = [
  { id: 'amazon',    name: 'Amazon',          category: 'E-commerce',    riskScore: 0.10 },
  { id: 'netflix',   name: 'Netflix',          category: 'Entertainment', riskScore: 0.10 },
  { id: 'uber',      name: 'Uber',             category: 'Transportation',riskScore: 0.20 },
  { id: 'doordash',  name: 'DoorDash',         category: 'Food Delivery', riskScore: 0.25 },
  { id: 'airbnb',    name: 'Airbnb',           category: 'Travel',        riskScore: 0.35 },
  { id: 'steam',     name: 'Steam',            category: 'Gaming',        riskScore: 0.30 },
  { id: 'alibaba',   name: 'Alibaba',          category: 'E-commerce',    riskScore: 0.65 },
  { id: 'crypto-ex', name: 'Crypto Exchange',  category: 'Finance',       riskScore: 0.85 },
];

export function detectFraudFlags(merchantId: string, recentCount: number): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const merchant = MERCHANTS.find(m => m.id === merchantId);

  if (recentCount >= 3) {
    flags.push({
      id: uid(),
      merchantId,
      reason: `Velocity: ${recentCount} cards generated within 10 minutes`,
      severity: recentCount >= 5 ? 'high' : 'medium',
      timestamp: Date.now(),
    });
  }

  if (merchant && merchant.riskScore >= 0.6) {
    flags.push({
      id: uid(),
      merchantId,
      reason: `High-risk merchant category: ${merchant.category}`,
      severity: merchant.riskScore >= 0.8 ? 'high' : 'medium',
      timestamp: Date.now(),
    });
  }

  return flags;
}
