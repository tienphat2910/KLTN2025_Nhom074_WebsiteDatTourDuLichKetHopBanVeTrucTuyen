/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    images: {
        domains: [
            "res.cloudinary.com",
            "images.unsplash.com",
            "plus.unsplash.com",
            "cloudinary.com",
            "static.vinwonders.com",
            "res.klook.com"
        ]
    }
};

module.exports = nextConfig;