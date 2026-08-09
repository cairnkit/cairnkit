/**
 * Detection and planning are pure, so the whole matrix runs here against
 * fake projects — no temp directories, no fixtures on disk, no I/O.
 *
 * These are the cases that decide whether `init` produces something that
 * compiles in someone else's repo, which is the only thing that matters.
 */
import { describe, expect, it } from "vitest";
import { detect } from "../init/detect";
import { plan } from "../init/plan";
import type { Reader } from "../init/types";

/** A project is just a map of path → contents; directories are inferred. */
function project(files: Record<string, string>): Reader {
  const paths = Object.keys(files);
  return {
    exists: (path) =>
      paths.includes(path) || paths.some((entry) => entry.startsWith(`${path}/`)),
    read: (path) => files[path] ?? null,
  };
}

// What `create-next-app` actually produces without src/: the alias points at
// the project root, not at src. Pointing it at ./src/* here made the fixture
// unrepresentative and hid a real bug.
const NEXT_APP = {
  "package.json": JSON.stringify({ dependencies: { next: "15.0.0", react: "19.0.0" } }),
  "tsconfig.json": JSON.stringify({
    compilerOptions: { paths: { "@/*": ["./*"] } },
    include: ["**/*.ts", "**/*.tsx"],
  }),
  "app/layout.tsx": "",
  "package-lock.json": "",
};

const paths = (reader: Reader, over?: string) => {
  const context = detect(reader);
  return plan(context, reader, over).write.map((file) => file.path);
};

describe("detect", () => {
  it("recognises a Next App Router project", () => {
    expect(detect(project(NEXT_APP)).framework).toEqual({ kind: "next-app", dir: "app" });
  });

  it("prefers app/ over pages/ when both exist", () => {
    const reader = project({ ...NEXT_APP, "pages/index.tsx": "" });
    expect(detect(reader).framework.kind).toBe("next-app");
  });

  it("recognises Pages Router when there is no app dir", () => {
    const reader = project({
      "package.json": JSON.stringify({ dependencies: { next: "14.0.0" } }),
      "pages/_app.tsx": "",
    });
    expect(detect(reader).framework).toEqual({ kind: "next-pages", dir: "pages" });
  });

  it("imports from whichever react-router package is installed", () => {
    // v7 collapsed everything into `react-router`; importing the v6 name there
    // does not resolve, so the adapter has to follow the dependency.
    const v6 = project({
      "package.json": JSON.stringify({ dependencies: { react: "19", "react-router-dom": "6.4.0" } }),
    });
    const v7 = project({
      "package.json": JSON.stringify({ dependencies: { react: "19", "react-router": "7.1.0" } }),
    });

    const adapterOf = (reader: Reader) =>
      plan(detect(reader), reader).write.find((f) => f.path.includes("router-adapter"))?.contents;

    expect(adapterOf(v6)).toContain('from "react-router-dom"');
    expect(adapterOf(v7)).toContain('from "react-router"');
    expect(adapterOf(v7)).not.toContain("react-router-dom");
  });

  it("stubs the adapter for a router it knows but does not support", () => {
    // Falling through to plain `react` would hand them memoryRouter, and every
    // route-aware step would quietly never fire.
    const reader = project({
      "package.json": JSON.stringify({
        dependencies: { react: "19", "@tanstack/react-router": "1.0.0" },
      }),
    });
    const adapter = plan(detect(reader), reader).write.find((f) =>
      f.path.includes("router-adapter"),
    );

    expect(detect(reader).framework.kind).toBe("unknown");
    expect(adapter?.contents).toContain("TanStack Router");
  });

  it("spots Vite without treating it as a router", () => {
    const reader = project({
      "package.json": JSON.stringify({ dependencies: { react: "19" }, devDependencies: { vite: "6" } }),
    });
    const context = detect(reader);

    expect(context.bundler).toBe("vite");
    // Vite is a bundler. Routing is what decides the adapter, and there is none.
    expect(context.framework.kind).toBe("react");
  });

  it("recognises react-router, and plain react without one", () => {
    const withRouter = project({
      "package.json": JSON.stringify({ dependencies: { react: "19", "react-router-dom": "7" } }),
    });
    const without = project({ "package.json": JSON.stringify({ dependencies: { react: "19" } }) });

    expect(detect(withRouter).framework.kind).toBe("react-router");
    expect(detect(without).framework.kind).toBe("react");
  });

  it("reads the package manager from the lockfile", () => {
    const pnpm = project({ "package.json": "{}", "pnpm-lock.yaml": "" });
    const yarn = project({ "package.json": "{}", "yarn.lock": "" });
    expect(detect(pnpm).packageManager).toBe("pnpm");
    expect(detect(yarn).packageManager).toBe("yarn");
  });

  it("prefers the packageManager field over the lockfile", () => {
    // corepack enforces this field, so a stale lockfile must not win.
    const reader = project({
      "package.json": JSON.stringify({ packageManager: "pnpm@9.12.0" }),
      "package-lock.json": "",
    });
    expect(detect(reader).packageManager).toBe("pnpm");
  });

  it("parses a tsconfig containing comments and trailing commas", () => {
    // tsconfig.json is JSONC in practice and JSON.parse will not have it.
    const reader = project({
      "package.json": "{}",
      "tsconfig.json": `{
        // the alias every Next app ships with
        "compilerOptions": { "paths": { "~/*": ["./src/*"] } }, /* block */
      }`,
    });
    expect(detect(reader).alias).toEqual({ prefix: "~", base: "src" });
  });

  it("reports no alias rather than inventing one", () => {
    const reader = project({ "package.json": "{}", "tsconfig.json": "{}" });
    expect(detect(reader).alias).toBeNull();
  });
});

describe("plan", () => {
  it("writes the expected files for Next App Router", () => {
    expect(paths(project(NEXT_APP))).toEqual([
      "walkthrough/anchors.ts",
      "walkthrough/flows.ts",
      "walkthrough/cairn.d.ts",
      "walkthrough/cairn-provider.tsx",
    ]);
  });

  it("puts files under src/ when the project does", () => {
    const reader = project({ ...NEXT_APP, "src/app/layout.tsx": "" });
    expect(paths(reader)[0]).toBe("src/walkthrough/anchors.ts");
  });

  it("honours an explicit directory", () => {
    expect(paths(project(NEXT_APP), "tours")[0]).toBe("tours/anchors.ts");
  });

  it("adds a router adapter only when it cannot pick one", () => {
    const unknown = project({ "package.json": "{}" });
    const nextApp = project(NEXT_APP);

    expect(paths(unknown).some((p) => p.includes("router-adapter"))).toBe(true);
    expect(paths(nextApp).some((p) => p.includes("router-adapter"))).toBe(false);
  });

  it("never overwrites a file that already exists", () => {
    const reader = project({ ...NEXT_APP, "walkthrough/anchors.ts": "mine" });
    const result = plan(detect(reader), reader);

    expect(result.write.map((f) => f.path)).not.toContain("walkthrough/anchors.ts");
    expect(result.skip).toEqual([{ path: "walkthrough/anchors.ts", why: "already exists" }]);
  });

  it("always installs @cairnkit/core explicitly", () => {
    // Under pnpm, `declare module "@cairnkit/core"` does not compile unless
    // core is a direct dependency. npm hoists it and hides the problem.
    const reader = project({ ...NEXT_APP, "pnpm-lock.yaml": "" });
    expect(plan(detect(reader), reader).install?.command).toContain("@cairnkit/core");
  });

  it("asks for @cairnkit/next only on Next projects", () => {
    const vite = project({ "package.json": JSON.stringify({ dependencies: { react: "19" } }) });
    expect(plan(detect(project(NEXT_APP)), project(NEXT_APP)).install?.command).toContain(
      "@cairnkit/next",
    );
    expect(plan(detect(vite), vite).install?.command).not.toContain("@cairnkit/next");
  });

  it("does not reinstall what is already there", () => {
    const reader = project({
      ...NEXT_APP,
      "package.json": JSON.stringify({
        dependencies: {
          next: "15",
          "@cairnkit/core": "^0.4.2",
          "@cairnkit/react": "^0.4.2",
          "@cairnkit/ui": "^0.4.2",
          "@cairnkit/next": "^0.4.2",
        },
        devDependencies: { "@cairnkit/cli": "^0.4.2" },
      }),
    });
    expect(plan(detect(reader), reader).install).toBeNull();
  });

  it("uses the right install verb per package manager", () => {
    const yarn = project({ ...NEXT_APP, "yarn.lock": "" });
    expect(plan(detect(yarn), yarn).install?.command).toContain("yarn add");
  });

  it("emits relative imports when there is no alias", () => {
    const reader = project({
      "package.json": JSON.stringify({ dependencies: { next: "15" } }),
      "tsconfig.json": "{}",
      "app/layout.tsx": "",
    });
    const flows = plan(detect(reader), reader).write.find((f) => f.path.endsWith("flows.ts"));

    expect(flows?.contents).toContain('from "./anchors"');
    expect(plan(detect(reader), reader).warnings.join(" ")).toContain("No path alias");
  });

  it("warns when there is no TypeScript, and skips the registry", () => {
    const reader = project({ "package.json": JSON.stringify({ dependencies: { react: "19" } }) });
    const result = plan(detect(reader), reader);

    expect(result.write.map((f) => f.path)).not.toContain("walkthrough/cairn.d.ts");
    expect(result.warnings.join(" ")).toContain("TypeScript");
    expect(result.write.map((f) => f.path)).toContain("walkthrough/anchors.js");
  });

  it("warns when tsconfig include would leave the registry inert", () => {
    const reader = project({
      "package.json": JSON.stringify({ dependencies: { next: "15" } }),
      "tsconfig.json": JSON.stringify({ include: ["src"] }),
      "app/layout.tsx": "",
    });
    // Files land in walkthrough/, which "src" does not cover.
    expect(plan(detect(reader), reader).warnings.join(" ")).toContain("inert");
  });

  it("builds specifiers from where the alias points, not where we assume", () => {
    // `@/*` → `./*` and `@/*` → `./src/*` need different specifiers for the
    // same file. Guessing produced imports that did not resolve.
    const atRoot = project({
      "package.json": JSON.stringify({ dependencies: { react: "19" } }),
      "tsconfig.json": JSON.stringify({ compilerOptions: { paths: { "@/*": ["./*"] } } }),
      "src/main.tsx": "",
    });
    const atSrc = project({
      "package.json": JSON.stringify({ dependencies: { react: "19" } }),
      "tsconfig.json": JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
      "src/main.tsx": "",
    });
    const flowsOf = (reader: Reader) =>
      plan(detect(reader), reader).write.find((f) => f.path.endsWith("flows.ts"))?.contents;

    expect(flowsOf(atRoot)).toContain('"@/src/walkthrough/anchors"');
    expect(flowsOf(atSrc)).toContain('"@/walkthrough/anchors"');
  });

  it("falls back to relative when the files sit outside the alias", () => {
    const reader = project({
      "package.json": JSON.stringify({ dependencies: { react: "19" } }),
      "tsconfig.json": JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
      "src/main.tsx": "",
    });
    // --dir puts them outside src/, which the alias cannot reach.
    const flows = plan(detect(reader), reader, "tours").write.find((f) =>
      f.path.endsWith("flows.ts"),
    );
    expect(flows?.contents).toContain('"./anchors"');
  });

  it("prints an import specifier that actually resolves", () => {
    // A bare "walkthrough/cairn-provider" is not resolvable; if we detected an
    // alias, the instructions have to use it too.
    const aliased = plan(detect(project(NEXT_APP)), project(NEXT_APP));
    expect(aliased.nextSteps.join("\n")).toContain('"@/walkthrough/cairn-provider"');

    const bare = project({
      "package.json": JSON.stringify({ dependencies: { next: "15" } }),
      "tsconfig.json": "{}",
      "app/layout.tsx": "",
    });
    expect(plan(detect(bare), bare).nextSteps.join("\n")).toContain(
      '"./walkthrough/cairn-provider"',
    );
  });

  it('marks the Next provider "use client"', () => {
    const provider = plan(detect(project(NEXT_APP)), project(NEXT_APP)).write.find((f) =>
      f.path.endsWith("cairn-provider.tsx"),
    );
    // Omitting this is the exact bug that breaks a Next App Router setup.
    expect(provider?.contents.startsWith('"use client";')).toBe(true);
  });

  it("wires the Pages Router adapter, not the App Router one", () => {
    const reader = project({
      "package.json": JSON.stringify({ dependencies: { next: "14" } }),
      "tsconfig.json": "{}",
      "pages/_app.tsx": "",
    });
    const provider = plan(detect(reader), reader).write.find((f) =>
      f.path.endsWith("cairn-provider.tsx"),
    );
    expect(provider?.contents).toContain("usePagesRouterAdapter");
  });
});
