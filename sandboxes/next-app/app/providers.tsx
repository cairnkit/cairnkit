"use client";

import type { ReactNode } from "react";
import { CairnProvider } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";
import { CairnOverlay } from "@cairnkit/ui";
import { flows } from "@/walkthrough/flows";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CairnProvider flows={flows} router={useAppRouterAdapter()} onEvent={(e) => console.log("[cairn]", e.name, e.props)}>
      {children}
      <CairnOverlay />
    </CairnProvider>
  );
}
