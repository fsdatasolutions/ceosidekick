/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;