import { CookieOptions, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';

export const MIN_PASSWORD_LENGTH = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isNonEmptyString = (v: unknown, maxLength = 200): v is string =>
    typeof v === 'string' && v.trim().length > 0 && v.length <= maxLength;

export const isValidEmail = (v: unknown): v is string =>
    isNonEmptyString(v, 254) && EMAIL_REGEX.test(v);

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

export const generateToken = (id: string, expiresIn: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id }, secret, { expiresIn, algorithm: 'HS256' } as SignOptions);
};

const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
};

// rememberMe: persistent 30-day cookie; otherwise a session cookie with a 24h token
export const setAuthCookie = (res: Response, userId: string, rememberMe: boolean): void => {
    const token = generateToken(userId, rememberMe ? '30d' : '24h');
    res.cookie('token', token, {
        ...baseCookieOptions,
        ...(rememberMe && { maxAge: 30 * 24 * 60 * 60 * 1000 }),
    });
};

export const clearAuthCookie = (res: Response): void => {
    res.clearCookie('token', baseCookieOptions);
};
