export const MIN_PASSWORD_LENGTH = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isNonEmptyString = (v: unknown, maxLength = 200): v is string =>
    typeof v === 'string' && v.trim().length > 0 && v.length <= maxLength;

export const isValidEmail = (v: unknown): v is string => isNonEmptyString(v, 254) && EMAIL_REGEX.test(v);

// Returns an error message, or null if the password is acceptable
export const checkPasswordStrength = (password: unknown): string | null => {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
        return `Le mot de passe doit contenir entre ${MIN_PASSWORD_LENGTH} et 128 caractères`;
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Le mot de passe doit contenir des minuscules, des majuscules et des chiffres';
    }
    return null;
};

// Escapes % and _ for a LIKE/ILIKE pattern
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export const isUuid = (v: unknown): v is string =>
    typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
