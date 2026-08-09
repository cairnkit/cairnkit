/**
 * Reading the project is separated from deciding what to do about it, and both
 * are separated from writing. `detect` and `plan` are pure functions over this
 * interface, so the whole decision matrix — framework, aliases, package
 * manager, partial installs — is testable without a filesystem.
 */
export type Reader = {
  exists(relativePath: string): boolean;
  read(relativePath: string): string | null;
};

export type Framework =
  | { kind: "next-app"; dir: string }
  | { kind: "next-pages"; dir: string }
  /** `pkg` differs between v6 (`react-router-dom`) and v7 (`react-router`). */
  | { kind: "react-router"; pkg: "react-router-dom" | "react-router" }
  | { kind: "react" }
  | { kind: "unknown"; hint?: string };

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type Context = {
  framework: Framework;
  /** Source lives under `src/`. Decides where generated files go. */
  usesSrcDir: boolean;
  /**
   * The path alias, or null when there is none.
   *
   * Both halves matter. `"@/*": ["./src/*"]` and `"@/*": ["./*"]` share a
   * prefix but resolve differently, so knowing only the prefix produces an
   * import that does not resolve in one of the two.
   */
  alias: { prefix: string; base: string } | null;
  typescript: boolean;
  /** Only affects which file the instructions name. Routing is unaffected. */
  bundler: "vite" | "next" | null;
  packageManager: PackageManager;
  /** `@cairnkit/*` packages already in package.json. */
  installed: string[];
  /** Directories tsconfig actually compiles. An augmentation outside these is inert. */
  tsconfigInclude: string[];
};

export type FileAction = {
  path: string;
  contents: string;
  /** Shown next to the path so the plan explains itself. */
  reason: string;
};

export type Plan = {
  dir: string;
  write: FileAction[];
  /** Files that already exist. Never overwritten without being asked. */
  skip: { path: string; why: string }[];
  install: { packages: string[]; command: string } | null;
  /**
   * The parts we deliberately do not automate.
   *
   * Structured rather than pre-formatted so the planner stays about content
   * and the command decides how it looks — which is also what lets the same
   * plan render with or without colour.
   */
  nextSteps: { text: string; file?: string; code?: string[] }[];
  warnings: string[];
};
