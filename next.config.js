const withPWA = require('@ducanh2912/next-pwa').default

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    reactStrictMode: true,
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;
        return config;
    },
}

module.exports = withPWA({
    dest: 'public',
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    disable: process.env.NODE_ENV === 'development',
    workboxOptions: {
        disableDevLogs: true,
        runtimeCaching: [
            {
                urlPattern: /^\/admin(\/.*)?$/,
                handler: 'NetworkOnly',
            },
            {
                urlPattern: /^\/login$/,
                handler: 'NetworkOnly',
            },
            {
                urlPattern: /^\/api\//,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'nkgc-api',
                    expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                },
            },
            {
                urlPattern: /\/_next\/static\//,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'nkgc-static',
                    expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
            },
            {
                urlPattern: /^\/(?:notices|boards|about|organizations|resources)(\/.*)?$/,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'nkgc-pages',
                    expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
                },
            },
        ],
    },
})(nextConfig)
