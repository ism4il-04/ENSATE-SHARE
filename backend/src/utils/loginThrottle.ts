import LoginAttempt from '../models/LoginAttempt.model';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

const keysFor = (ip: string, email: string) => ({
    ipKey: `ip:${ip}`,
    emailKey: `email:${email}`,
});

// Returns seconds until the caller may retry, or 0 if not blocked
export const getLoginBlock = async (ip: string, email: string): Promise<number> => {
    const { ipKey, emailKey } = keysFor(ip, email);
    const now = Date.now();
    const attempts = await LoginAttempt.find({ key: { $in: [ipKey, emailKey] } });

    let retryAfter = 0;
    for (const a of attempts) {
        const limit = a.key === ipKey ? MAX_PER_IP : MAX_PER_EMAIL;
        if (a.count >= limit && a.expiresAt.getTime() > now) {
            retryAfter = Math.max(retryAfter, Math.ceil((a.expiresAt.getTime() - now) / 1000));
        }
    }
    return retryAfter;
};

export const recordLoginFailure = async (ip: string, email: string): Promise<void> => {
    const { ipKey, emailKey } = keysFor(ip, email);
    const expiresAt = new Date(Date.now() + WINDOW_MS);
    await Promise.all(
        [ipKey, emailKey].map((key) =>
            LoginAttempt.updateOne(
                { key },
                { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
                { upsert: true }
            )
        )
    );
};

export const clearLoginFailures = async (email: string): Promise<void> => {
    await LoginAttempt.deleteOne({ key: `email:${email}` });
};
