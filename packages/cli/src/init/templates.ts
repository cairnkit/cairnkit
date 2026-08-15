import type { Context } from "./types";

/**
 * File bodies, kept apart from the planner so the planner stays about
 * decisions and these stay about content.
 *
 * Everything generated is deliberately small and obviously editable. This is a
 * starting point someone will rewrite within the hour, not a framework.
 */

export function anchorsFile(): string {
  return `import { defineAnchors } from "@cairnkit/core";

/**
 * Every element a tour can point at, declared once.
 *
 * Ids are referenced by name from here — never as CSS selectors — which is
 * what lets \`cairnkit check\` fail the build when one stops being applied.
 */
export const anchors = defineAnchors({
  nav: {
    home: "nav.home",
  },
  home: {
    primaryAction: "home.primary-action",
  },
});
`;
}

export function flowsFile(importPath: string, entryRoute: string): string {
  return `import { defineFlow } from "@cairnkit/core";
import { anchors } from "${importPath}";

/** Tours are plain data, so they diff in review like anything else. */
export const gettingStarted = defineFlow({
  id: "getting-started",
  version: 1,
  entryRoute: "${entryRoute}",
  steps: [
    {
      anchor: anchors.nav.home,
      title: "Start here",
      body: "Replace this with the first thing a new user should notice.",
    },
    {
      anchor: anchors.home.primaryAction,
      title: "The main action",
      body: "Point at the thing you want them to do first.",
    },
  ],
});

export const flows = [gettingStarted];
`;
}

export function registerFile(anchorsImport: string): string {
  return `import type { anchors } from "${anchorsImport}";

/**
 * Opt-in, and the reason any of this is safe.
 *
 * With this in place every anchor id, flow id and action name across the API
 * narrows to your own literals, so a typo fails to compile instead of pointing
 * a tour at nothing. Delete it and everything still works, just as \`string\`.
 */
declare module "@cairnkit/core" {
  interface CairnRegister {
    anchors: typeof anchors;
    flowIds: "getting-started";
  }
}
`;
}

export function providerFile(context: Context, flowsImport: string): string {
  const { framework } = context;
  const ts = context.typescript;

  // A .jsx file containing `: { children: ReactNode }` does not parse. Emitting
  // TypeScript into a JavaScript project is the kind of breakage whose cause is
  // genuinely hard to see from the error message.
  const typeImport = ts ? `import type { ReactNode } from "react";\n` : "";
  const props = ts ? "{ children }: { children: ReactNode }" : "{ children }";

  if (framework.kind === "next-app" || framework.kind === "next-pages") {
    const hook = framework.kind === "next-app" ? "useAppRouterAdapter" : "usePagesRouterAdapter";

    return `"use client";

${typeImport}import { CairnProvider } from "@cairnkit/react";
import { ${hook} } from "@cairnkit/next";
import { CairnOverlay } from "@cairnkit/ui";
import { flows } from "${flowsImport}";

/**
 * A client component, because the provider holds state. It must *wrap* your
 * app — rendered as a sibling it supplies context to nothing, and every
 * \`useTour()\` below it throws.
 */
export function CairnRuntime(${props}) {
  return (
    <CairnProvider flows={flows} router={${hook}()}>
      {children}
      <CairnOverlay />
    </CairnProvider>
  );
}
`;
  }

  const routerImport =
    framework.kind === "react-router"
      ? `import { useReactRouterAdapter } from "./router-adapter";`
      : `import { memoryRouter } from "@cairnkit/react";`;
  const router = framework.kind === "react-router" ? "useReactRouterAdapter()" : "memoryRouter";

  return `${typeImport}import { CairnProvider } from "@cairnkit/react";
import { CairnOverlay } from "@cairnkit/ui";
${routerImport}
import { flows } from "${flowsImport}";

/**
 * Must wrap your app — rendered as a sibling it supplies context to nothing.
 */
export function CairnRuntime(${props}) {
  return (
    <CairnProvider flows={flows} router={${router}}>
      {children}
      <CairnOverlay />
    </CairnProvider>
  );
}
`;
}

export function routerAdapterFile(context: Context): string {
  const ts = context.typescript;
  const adapterImport = ts ? `import type { RouterAdapter } from "@cairnkit/react";\n` : "";
  const returns = ts ? ": RouterAdapter" : "";

  if (context.framework.kind === "react-router") {
    // v7 collapsed everything into `react-router`; `react-router-dom` is a
    // compat shim there. Importing the wrong one simply does not resolve.
    return `import { useLocation, useNavigate } from "${context.framework.pkg}";
${adapterImport}
/** The entire surface cairnkit needs from a router. */
export function useReactRouterAdapter()${returns} {
  const navigate = useNavigate();

  return {
    usePathname: () => useLocation().pathname,
    navigate: (href) => navigate(href),
  };
}
`;
  }

  const why =
    context.framework.kind === "unknown" && context.framework.hint
      ? `${context.framework.hint} is installed, but cairnkit does not ship an adapter for it yet.`
      : "We could not tell which router this project uses, so this is a stub rather than a guess.";

  return `${adapterImport}
/**
 * ${why}
 *
 * Left unimplemented on purpose — an adapter that compiles and then misbehaves
 * at runtime is worse than one that obviously needs finishing.
 *
 * Two methods. \`usePathname\` must be reactive: it has to re-render its
 * consumer when the path changes, or route-aware steps will not fire.
 *
 * https://cairnkit.dev/docs/react
 */
export function useAppRouterAdapter()${returns} {
  return {
    // TODO: return the current pathname, reactively.
    usePathname: () => {
      throw new Error("[cairn] Implement usePathname in router-adapter.");
    },
    // TODO: navigate client-side.
    navigate: () => {
      throw new Error("[cairn] Implement navigate in router-adapter.");
    },
  };
}
`;
}
