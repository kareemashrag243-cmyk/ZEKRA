/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Supabase Storage serves images from a dynamic project URL,
    // so we allow any https host rather than hardcoding one.
    remotePatterns: [{ protocol: "https", hostname: "**" }]
  }
};

module.exports = nextConfig;
