import {
  luhnCheckDigit,
  luhnValid,
  generateValidPan,
} from './luhn';
import { detectFraudFlags } from './merchants';

describe('luhnCheckDigit', () => {
  it('returns the correct check digit for a known partial PAN', () => {
    // 411111111111111 → check digit 1 → full PAN 4111111111111111
    expect(luhnCheckDigit('411111111111111')).toBe(1);
  });

  it('returns 0 when the partial PAN already sums to a multiple of 10', () => {
    // All-zero partial: reversed even-index digits doubled = 0, sum = 0 → (10 - 0) % 10 = 0
    expect(luhnCheckDigit('000000000000000')).toBe(0);
  });
});

describe('luhnValid', () => {
  it('validates a known-good Visa test PAN', () => {
    expect(luhnValid('4111111111111111')).toBe(true);
  });

  it('rejects a PAN with a wrong check digit', () => {
    expect(luhnValid('4111111111111112')).toBe(false);
  });

  it('rejects a PAN shorter than 16 digits', () => {
    expect(luhnValid('411111111111111')).toBe(false);
  });

  it('rejects a PAN longer than 16 digits', () => {
    expect(luhnValid('41111111111111111')).toBe(false);
  });

  it('accepts PANs formatted with spaces between groups', () => {
    expect(luhnValid('4111 1111 1111 1111')).toBe(true);
  });
});

describe('generateValidPan', () => {
  it('generates a 16-digit string', () => {
    const pan = generateValidPan();
    expect(pan).toHaveLength(16);
    expect(/^\d{16}$/.test(pan)).toBe(true);
  });

  it('always generates a Luhn-valid PAN', () => {
    for (let i = 0; i < 20; i++) {
      expect(luhnValid(generateValidPan())).toBe(true);
    }
  });

  it('uses the Visa BIN prefix 411111', () => {
    expect(generateValidPan().startsWith('411111')).toBe(true);
  });
});

describe('detectFraudFlags', () => {
  it('returns no flags for low velocity and a low-risk merchant', () => {
    expect(detectFraudFlags('amazon', 1)).toHaveLength(0);
  });

  it('raises a medium velocity flag at recentCount === 3', () => {
    const flags = detectFraudFlags('amazon', 3);
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe('medium');
    expect(flags[0].reason).toMatch(/Velocity/);
  });

  it('raises a high velocity flag at recentCount >= 5', () => {
    const flags = detectFraudFlags('amazon', 5);
    const velocityFlag = flags.find(f => f.reason.includes('Velocity'));
    expect(velocityFlag?.severity).toBe('high');
  });

  it('raises a high-risk merchant flag for crypto-ex', () => {
    const flags = detectFraudFlags('crypto-ex', 1);
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe('high');
    expect(flags[0].reason).toMatch(/High-risk/);
  });

  it('raises both velocity and merchant flags simultaneously', () => {
    const flags = detectFraudFlags('crypto-ex', 3);
    expect(flags).toHaveLength(2);
  });

  it('returns no flags for an unknown merchant with low velocity', () => {
    expect(detectFraudFlags('unknown-merchant', 1)).toHaveLength(0);
  });
});
