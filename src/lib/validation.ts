// Shared input validators / sanitizers

export const onlyDigits = (s: string) => s.replace(/\D+/g, '');

// Alphanumeric only (a-zA-Z0-9), max 14 chars
export const sanitizePassword = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').slice(0, 14);
export const isValidPassword = (s: string) => /^[A-Za-z0-9]{1,14}$/.test(s);

// Strip programming/markup symbols from search inputs to mitigate XSS / injection
export const sanitizeSearch = (s: string) => s.replace(/[<>/\\;'"`{}()|&$]/g, '');

export const WA_NUMBER = '201012345678'; // store WhatsApp (no +)
