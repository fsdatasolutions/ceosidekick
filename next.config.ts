import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Output standalone build for better performance on Render
    output: "standalone",

    // Disable x-powered-by header for security
    poweredByHeader: false,

    // Configure allowed image domains if using next/image
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com", // Google profile images
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com", // GitHub profile images
            },
        ],
    },

    // Experimental features (if needed)
    experimental: {
        // serverActions are stable in Next.js 14+
    },
};

export default nextConfig;