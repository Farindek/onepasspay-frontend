// src/utils/luhn.ts
// Implements ISO/IEC 7812 Luhn algorithm for card number validation

/**
 * Calculate the Luhn check digit for a partial card number.
 * @param partialPan - 15-digit string (first 15 digits of the card)
 * @returns single check digit (0-9)
 */
export function luhnCheckDigit(partialPan: string): number {
  const digits = partialPan.split('').map(Number).reverse();
  const sum = digits.reduce((acc, digit, idx) => {
    if (idx % 2 === 0) {
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);
  return (10 - (sum % 10)) % 10;
}

/**
 * Validate a full 16-digit PAN using the Luhn algorithm.
 * @param pan - 16-digit card number string (spaces optional)
 */
export function luhnValid(pan: string): boolean {
  const digits = pan.replace(/\s/g, '').split('').map(Number);
  if (digits.length !== 16) return false;
  const sum = digits.reverse().reduce((acc, digit, idx) => {
    if (idx % 2 === 0) return acc + digit;
    const doubled = digit * 2;
    return acc + (doubled > 9 ? doubled - 9 : doubled);
  }, 0);
  return sum % 10 === 0;
}

/**
 * Generate a Luhn-valid 16-digit Visa card number.
 * Uses BIN prefix 411111 (Visa test range, safe for demos).
 */
export function generateValidPan(): string {
  // Visa BIN prefix
  const bin = '411111';
  // Generate 9 random middle digits
  const middle = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');
  const partial = bin + middle;
  const check = luhnCheckDigit(partial);
  return partial + check;
}

/**
 * Format a 16-digit PAN into groups of 4 for display.
 */
export function formatPan(pan: string): string {
  return pan.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Generate a 3-digit CVV.
 */
export function generateCvv(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

/**
 * Generate an expiry date string (MM/YY) set 2 years from now.
 */
export function generateExpiry(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear() + 2).slice(-2);
  return `${month}/${year}`;
}
