import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@cairnkit/core", "@cairnkit/react", "@cairnkit/ui", "@cairnkit/next"],
};

export default config;
