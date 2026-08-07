"use client";

import { useState, type ReactNode } from "react";
import { CairnProvider, type CairnNotice } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";
import { CairnNoticeBar, CairnOverlay } from "@cairnkit/ui";
import { flows } from "@/walkthrough/flows";

export function Providers({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<CairnNotice | null>(null);

  return (
    <CairnProvider flows={flows} router={useAppRouterAdapter()} onNotice={setNotice}>
      {children}
      <CairnOverlay labels={{ done: "Nice" }} />
      <CairnNoticeBar notice={notice} onDismiss={() => setNotice(null)} />
    </CairnProvider>
  );
}
