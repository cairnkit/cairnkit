"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createTourStore, localStoragePersist } from "@cairnkit/core";
import { CairnProvider, memoryRouter } from "@cairnkit/react";
import { CairnOverlay } from "@cairnkit/ui";
import { buildFlow, type Config } from "./scenarios";

type PlaygroundValue = {
  config: Config;
  set: <K extends keyof Config>(key: K, value: Config[K]) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
};

const Ctx = createContext<PlaygroundValue | null>(null);

export function usePlayground() {
  const value = useContext(Ctx);
  if (!value) throw new Error("usePlayground must be used inside <PlaygroundRoot>");
  return value;
}

/**
 * One provider for the whole page.
 *
 * The stage and the launcher used to own separate providers, which meant the
 * launcher always replayed whichever flow it had been built with while the
 * stage ran the one you had selected — two sources of truth for the same
 * question. Sharing a provider makes the launcher start exactly what the
 * controls describe, which is the only answer that is not confusing.
 */
export function PlaygroundRoot({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>({
    scenario: "basic",
    placement: "bottom",
    padding: 8,
    beacon: false,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const flow = useMemo(() => buildFlow(config), [config]);

  // Its own key: the site mounts a provider for its own tour, and a shared
  // key would let playing here mark that one complete.
  const store = useMemo(
    () => createTourStore({ persist: localStoragePersist("cairn:playground") }),
    [],
  );

  const value = useMemo<PlaygroundValue>(
    () => ({
      config,
      set: (key, next) => setConfig((prev) => ({ ...prev, [key]: next })),
      settingsOpen,
      setSettingsOpen,
    }),
    [config, settingsOpen],
  );

  return (
    <CairnProvider flows={[flow]} router={memoryRouter} store={store}>
      <Ctx.Provider value={value}>
        {children}
        <CairnOverlay labels={{ done: "Done" }} />
      </Ctx.Provider>
    </CairnProvider>
  );
}
