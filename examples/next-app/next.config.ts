import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace packages ship untranspiled-friendly ESM; this keeps HMR honest
  // while developing them alongside the app.
  transpilePackages: ["@cairnkit/core", "@cairnkit/react", "@cairnkit/ui", "@cairnkit/next"],
};

export default config;
