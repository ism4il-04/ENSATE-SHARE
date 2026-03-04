/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com'],
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
