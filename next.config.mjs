/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // SST's platform sources under .sst/ trip TS 5.6 build-time checks despite tsconfig exclude.
    // IDE and pre-commit linting still catch app-level type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
