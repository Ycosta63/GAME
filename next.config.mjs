/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cover art comes from three different platforms' own CDNs (Steam,
    // PSN, GOG) whose exact hostnames we don't control, so a fixed
    // allowlist would silently break images if a platform changes CDN.
    // Every coverUrl we ever hand next/image is built from our own
    // trusted API responses (Steam CDN pattern we construct ourselves,
    // or the user's own PSN/GOG library data), never arbitrary input.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
