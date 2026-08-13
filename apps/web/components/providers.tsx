"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CairnProvider, type CairnNotice } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";
import { CairnNoticeBar, CairnOverlay } from "@cairnkit/ui";
import { sendToCloud } from "@cairnkit/cloud";
import { flows } from "@/walkthrough/flows";

const CAIRNKIT_KEY = process.env.NEXT_PUBLIC_CAIRNKIT_KEY;

export function Providers({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<CairnNotice | null>(null);

  /**
   * This site reports to cairnkit cloud, on the same terms as any customer.
   *
   * Dogfooding in the way that actually costs something: the tours on the docs
   * are the first tours most people ever see, so if completion here is poor we
   * are the ones being told, by our own product, that our own onboarding does
   * not work. A landing page claiming to measure tours while measuring none of
   * its own is a claim nobody has tested.
   *
   * No `userId` — nobody signs in to a documentation site, and inventing an
   * identifier for anonymous readers is exactly what cairnkit declines to do.
   *
   * Absent key means absent handler, so a contributor cloning the repo gets
   * working tours and a clean console rather than a failed request per step.
   */
  const onEvent = useMemo(
    () => (CAIRNKIT_KEY ? sendToCloud({ key: CAIRNKIT_KEY }) : undefined),
    [],
  );

  return (
    <CairnProvider
      flows={flows}
      router={useAppRouterAdapter()}
      onNotice={setNotice}
      onEvent={onEvent}
    >
      {children}
      <CairnOverlay labels={{ done: "Nice" }} />
      <CairnNoticeBar notice={notice} onDismiss={() => setNotice(null)} />
    </CairnProvider>
  );
}
