import { anchorsFile, flowsFile, providerFile, registerFile, routerAdapterFile } from "./templates";
import type { Context, FileAction, Plan, Reader } from "./types";

const REQUIRED = ["@cairnkit/core", "@cairnkit/react", "@cairnkit/ui"];

const INSTALL: Record<Context["packageManager"], string> = {
  npm: "npm install",
  pnpm: "pnpm add",
  yarn: "yarn add",
  bun: "bun add",
};

const DEV_FLAG: Record<Context["packageManager"], string> = {
  npm: "npm install -D",
  pnpm: "pnpm add -D",
  yarn: "yarn add -D",
  bun: "bun add -d",
};

/**
 * Decides everything, writes nothing.
 *
 * Keeping this pure is what makes the whole matrix — framework, aliases,
 * package managers, half-finished installs — testable without a filesystem,
 * and it means `--dry-run` is the same code path as a real run.
 */
export function plan(context: Context, reader: Reader, dirOverride?: string): Plan {
  const dir = dirOverride ?? (context.usesSrcDir ? "src/walkthrough" : "walkthrough");
  const ext = context.typescript ? "ts" : "js";

  const write: FileAction[] = [];
  const skip: Plan["skip"] = [];
  const warnings: string[] = [];

  // Imports have to resolve. An alias reads better, but only if it is built
  // from where the alias actually points — `@/*` mapped to `./*` and to
  // `./src/*` need different specifiers for the very same file.
  const aliased = (name: string) => aliasSpecifier(context, dir, name);
  const anchorsImport = aliased("anchors") ?? "./anchors";
  const flowsImport = aliased("flows") ?? "./flows";

  if (!context.alias) {
    warnings.push(
      "No path alias found in tsconfig, so generated imports are relative. That is fine; it just reads less neatly.",
    );
  }

  const add = (name: string, contents: string, reason: string) => {
    const path = `${dir}/${name}`;
    if (reader.exists(path)) {
      skip.push({ path, why: "already exists" });
      return;
    }
    write.push({ path, contents, reason });
  };

  add(`anchors.${ext}`, anchorsFile(), "every element a tour can point at");
  add(`flows.${ext}`, flowsFile(anchorsImport, entryRouteFor(context)), "the tours themselves");

  if (context.typescript) {
    add("cairn.d.ts", registerFile("./anchors"), "narrows ids to your own literals");
  } else {
    warnings.push(
      "No tsconfig.json found. cairnkit works in JavaScript, but the typed-anchor registry — the thing that turns a rename into a compile error — needs TypeScript.",
    );
  }

  const providerExt = context.typescript ? "tsx" : "jsx";
  add(`cairn-provider.${providerExt}`, providerFile(context, flowsImport), "mounts the runtime");

  if (context.framework.kind === "react-router" || context.framework.kind === "unknown") {
    add(`router-adapter.${ext}`, routerAdapterFile(context), "the one framework-specific file");
  }

  /**
   * A partial scaffold is the case that actually happens: someone ran this
   * before, edited their anchors, then deleted or lost a file. We keep their
   * registry — overwriting it is never what anyone wants — but the flow we
   * generate points at example anchors that are almost certainly not in it,
   * so it will not compile. Saying so beats letting them wonder why the tool
   * produced broken code.
   */
  const keptAnchors = skip.some((entry) => entry.path.endsWith(`anchors.${ext}`));
  const wroteFlows = write.some((file) => file.path.endsWith(`flows.${ext}`));
  if (keptAnchors && wroteFlows) {
    warnings.push(
      `Kept your existing anchors, so the generated flow still points at example ids (nav.home, home.primary-action) that are probably not in it. Repoint the steps, or start clean with --dir.`,
    );
  }

  // The augmentation is inert if tsconfig does not compile the file. It fails
  // silently — ids just stay `string` — so it is worth saying out loud.
  if (context.typescript && !isCompiled(dir, context.tsconfigInclude)) {
    warnings.push(
      `tsconfig "include" may not cover ${dir}, which would leave cairn.d.ts inert and every id typed as string. Add it to "include" if the types do not narrow.`,
    );
  }

  const missing = REQUIRED.filter((name) => !context.installed.includes(name));
  const needsCli = !context.installed.includes("@cairnkit/cli");
  const needsNext =
    context.framework.kind.startsWith("next") && !context.installed.includes("@cairnkit/next");
  if (needsNext) missing.push("@cairnkit/next");

  const commands: string[] = [];
  if (missing.length > 0) commands.push(`${INSTALL[context.packageManager]} ${missing.join(" ")}`);
  if (needsCli) commands.push(`${DEV_FLAG[context.packageManager]} @cairnkit/cli`);

  return {
    dir,
    write,
    skip,
    install: commands.length > 0 ? { packages: missing, command: commands.join("\n") } : null,
    nextSteps: nextSteps(context, dir),
    warnings,
  };
}

/**
 * An import specifier via the project's alias, or null when the file is not
 * under whatever the alias points at — in which case a relative import is the
 * only thing guaranteed to resolve.
 */
function aliasSpecifier(context: Context, dir: string, name: string): string | null {
  if (!context.alias) return null;
  const { prefix, base } = context.alias;

  if (base === "") return `${prefix}/${dir}/${name}`;
  if (dir === base) return `${prefix}/${name}`;
  if (dir.startsWith(`${base}/`)) return `${prefix}/${dir.slice(base.length + 1)}/${name}`;
  return null;
}

function entryRouteFor(context: Context): string {
  return context.framework.kind === "next-pages" ? "/" : "/";
}

function isCompiled(dir: string, include: string[]): boolean {
  // An empty `include` means tsconfig compiles everything under its root.
  if (include.length === 0) return true;
  const root = dir.split("/")[0] ?? dir;
  return include.some((entry) => entry.startsWith("**") || entry.split("/")[0] === root);
}

/**
 * The parts we deliberately do not automate.
 *
 * Editing someone's root layout on first contact is where these tools lose
 * trust — a mangled file is not recoverable by undoing a command. Printing the
 * exact snippet and the exact path is slower for the user by about a minute
 * and costs nothing if we are wrong about their setup.
 */
function nextSteps(context: Context, dir: string): Plan["nextSteps"] {
  const provider = aliasSpecifier(context, dir, "cairn-provider") ?? `./${dir}/cairn-provider`;

  const mount = (file: string, body: string[]) => ({
    text: "Mount the provider — it has to wrap your app, not sit beside it.",
    file,
    code: [
      `import { CairnRuntime } from "${provider}";`,
      `import "@cairnkit/ui/styles.css";`,
      "",
      ...body,
    ],
  });

  const apply = {
    text: "Apply an anchor to a real element.",
    file: "any component",
    code: [
      `import { anchor } from "@cairnkit/core";`,
      "",
      `<button {...anchor(anchors.home.primaryAction)}>Upgrade</button>`,
    ],
  };

  if (context.framework.kind === "next-app") {
    return [
      mount(`${context.framework.dir}/layout.tsx`, [
        "<body>",
        "  <CairnRuntime>{children}</CairnRuntime>",
        "</body>",
      ]),
      apply,
    ];
  }

  if (context.framework.kind === "next-pages") {
    return [
      mount(`${context.framework.dir}/_app.tsx`, [
        "<CairnRuntime>",
        "  <Component {...pageProps} />",
        "</CairnRuntime>",
      ]),
      apply,
    ];
  }

  const steps: Plan["nextSteps"] = [
    mount(context.bundler === "vite" ? "src/main.tsx" : "your root component", [
      "<CairnRuntime>",
      "  <App />",
      "</CairnRuntime>",
    ]),
    apply,
  ];

  if (context.framework.kind === "unknown") {
    steps.push({
      text: "Finish the router adapter — we could not tell which router you use.",
      file: `${dir}/router-adapter`,
    });
  }
  return steps;
}
