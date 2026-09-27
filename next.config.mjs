/** @type {import('next').NextConfig} */

const securityHeaders = [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig = {
    poweredByHeader: false,
    // All images are local files in /public; no remote image sources are allowed
    images: {
        remotePatterns: [],
    },
    async headers() {
        return [{ source: '/:path*', headers: securityHeaders }];
    },
    // In local dev, proxy /api requests to the Express backend
    async rewrites() {
        // Only apply rewrites in development (Vercel handles routing in production)
        if (process.env.NODE_ENV === 'development') {
            return [
                {
                    source: '/api/:path*',
                    destination: 'http://localhost:5000/api/:path*',
                },
            ];
        }
        return [];
    },
};

export default nextConfig;
