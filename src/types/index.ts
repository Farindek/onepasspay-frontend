export interface Merchant {
  id: string;
  name: string;
  category: string;
  riskScore: number;
}

export interface VirtualCard {
  id: string;
  pan: string;
  merchantId: string;
  merchantName: string;
  issuedAt: number;
  expiresAt: number;
  status: 'active' | 'expired' | 'used';
  cvv: string;
  expiryDisplay: string;
}

export interface TransactionEvent {
  id: string;
  cardId: string;
  pan: string;
  merchantName: string;
  action: 'generated' | 'expired' | 'used';
  timestamp: number;
  amount?: number;
}

export interface FraudFlag {
  id: string;
  merchantId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}
