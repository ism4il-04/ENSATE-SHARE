const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isNonEmptyString = (v: unknown, maxLength = 200): v is string =>
    typeof v === 'string' && v.trim().length > 0 && v.length <= maxLength;

export const isValidEmail = (v: unknown): v is string => isNonEmptyString(v, 254) && EMAIL_REGEX.test(v);

// Escapes % and _ for a LIKE/ILIKE pattern
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export const isUuid = (v: unknown): v is string =>
    typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
