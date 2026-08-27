/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Build output directory.
   *
   * Defaults to `.next`. Set NEXT_BUILD_DIR to build into a separate folder —
   * useful when a dev server is already running against this project, since a
   * concurrent `next build` writing the same directory makes page-data
   * collection fail with a spurious PageNotFoundError.
   */
  distDir: process.env.NEXT_BUILD_DIR || '.next',
};

export default nextConfig;
