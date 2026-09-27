import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The contact Server Action reads the email logo from disk at runtime.
  outputFileTracingIncludes: {
    "/contact": ["./src/emails/static/**"],
  },
};

export default nextConfig;
