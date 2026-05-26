// Shared input validators / sanitizers

export const onlyDigits = (s: string) => s.replace(/\D+/g, '');

// Alphanumeric only (a-zA-Z0-9), max 14 chars
export const sanitizePassword = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').slice(0, 14);
export const isValidPassword = (s: string) => /^[A-Za-z0-9]{1,14}$/.test(s);

// Common / weak passwords blocklist
const WEAK_PASSWORDS = new Set([
  '123456', '12345678', '123456789', '1234567890', '111111', '000000',
  'password', 'password1', 'qwerty', 'qwerty123', 'abc123', 'admin',
  'admin123', '123123', '654321', '11111111', '00000000', 'iloveyou',
  '1q2w3e4r', 'aaaaaa', 'letmein', 'welcome', 'monkey', 'dragon',
]);
export const isWeakPassword = (s: string) => {
  if (s.length < 6) return true;
  if (/^(.)\1+$/.test(s)) return true; // all same char
  if (/^[0-9]+$/.test(s) && s.length <= 8) return true; // short pure digits
  return WEAK_PASSWORDS.has(s.toLowerCase());
};

// Strip programming/markup symbols from search inputs to mitigate XSS / injection
export const sanitizeSearch = (s: string) => s.replace(/[<>/\\;'"`{}()|&$]/g, '');

export const WA_NUMBER = '201012345678'; // store WhatsApp (no +)
