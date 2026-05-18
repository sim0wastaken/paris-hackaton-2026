import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@motive/ds"],
  turbopack: {
    root: path.resolve(process.cwd(), "..", ".."),
  },
};

export default nextConfig;
