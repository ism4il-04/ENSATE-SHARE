import { Request, Response, NextFunction } from 'express';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Recursively drops keys that could inject MongoDB operators ($ne, $gt, dotted paths)
// or pollute object prototypes.
const clean = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(clean);
    }
    if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, v] of Object.entries(value)) {
            if (key.startsWith('$') || key.includes('.') || FORBIDDEN_KEYS.has(key)) continue;
            result[key] = clean(v);
        }
        return result;
    }
    return value;
};

const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
        req.body = clean(req.body);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = clean(req.params) as Request['params'];
    }
    next();
};

export default sanitizeRequest;
