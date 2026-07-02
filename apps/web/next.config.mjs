/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The web app is intentionally self-contained (its own SSE contract in
  // lib/types.ts) so it builds and demos without the CAP/agent packages.
  // Live mode proxies to the orchestrator stream at ORCH_URL when set.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
