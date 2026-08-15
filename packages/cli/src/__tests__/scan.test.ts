import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MissingRoots, defaultRoots, scanProject } from "../scan";

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "cairn-scan-"));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
}

describe("scanProject", () => {
  it("finds anchors that are declared and applied", () => {
    const dir = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ q: { save: "q.save" } });`,
      "Page.tsx": `export const P = () => <button {...anchor(anchors.q.save)} />;`,
    });

    const ctx = scanProject(dir);
    expect([...ctx.registered]).toEqual(["q.save"]);
    expect(ctx.applied.has("q.save")).toBe(true);
  });

  it("reads the id from a data-cairn attribute rather than blanking it", () => {
    /*
     * `stripLiterals` pads out string contents, and a JSX attribute value is a
     * string. Scanning the stripped text captured spaces instead of the id, so
     * a registered anchor applied this way was reported as "not in the
     * registry" and the finding could not say which value it meant.
     */
    const dir = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ help: { link: "help.link" } });`,
      "Help.tsx": `export const H = () => <a data-cairn="help.link" href="/help" />;`,
    });

    const ctx = scanProject(dir);

    expect([...ctx.literals]).toEqual(["help.link"]);
    expect(ctx.applied.has("help.link")).toBe(true);
    // The whole point of the finding is naming the offender, so it has to be
    // locatable by its real id.
    expect(ctx.literalAt.get("help.link")?.file).toContain("Help.tsx");
  });

  it("still ignores a data-cairn attribute quoted inside a template literal", () => {
    // The guard that makes the fix above safe: a documentation snippet showing
    // the attribute must not register as a real use of it.
    const dir = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ real: { one: "real.one" } });`,
      "Docs.tsx": `const sample = \`<button data-cairn="phantom.nope" />\`;
export const D = () => <pre>{sample}</pre>;`,
    });

    const ctx = scanProject(dir);
    expect([...ctx.literals]).toEqual([]);
  });

  it("ignores code quoted inside a template literal", () => {
    // A docs page showing a defineAnchors sample must not register phantom
    // anchors — that false-failed the check on our own landing page.
    const dir = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ real: { one: "real.one" } });`,
      "Docs.tsx": `const sample = \`
export const anchors = defineAnchors({
  phantom: { nope: "phantom.nope" },
});\`;
export const D = () => <pre {...anchor(anchors.real.one)}>{sample}</pre>;`,
    });

    const ctx = scanProject(dir);
    expect([...ctx.registered]).toEqual(["real.one"]);
    expect(ctx.registered.has("phantom.nope")).toBe(false);
  });

  it("does not count a flow file's references as applications", () => {
    const dir = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ q: { save: "q.save" } });`,
      "tour.flow.ts": `import { defineFlow } from "@cairnkit/core";
export const f = defineFlow({ id: "t", version: 1, entryRoute: "/",
  steps: [{ anchor: anchors.q.save }] });`,
    });

    const ctx = scanProject(dir);
    expect(ctx.applied.has("q.save")).toBe(false);
    expect(ctx.flowAnchors.get("t")).toEqual(["q.save"]);
  });
});

describe("multiple roots", () => {
  it("scans every directory it is given", () => {
    // Anchors in one folder, the components using them in another — scanning
    // only the first reported them all as unapplied.
    const a = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ q: { save: "q.save" } });`,
    });
    const b = project({
      "Page.tsx": `export const P = () => <button {...anchor(anchors.q.save)} />;`,
    });

    expect(scanProject([a, b]).applied.has("q.save")).toBe(true);
    expect(scanProject(a).applied.has("q.save")).toBe(false);
  });
});

describe("default roots", () => {
  it("does not insist on src", () => {
    // `src` was the only default, and readdirSync throws on a directory that is
    // not there — so a Next app made with --no-src-dir crashed with a raw
    // ENOENT stack trace instead of checking anything.
    expect(defaultRoots((path) => path === "app")).toEqual(["app"]);
    expect(defaultRoots((path) => path === "src")).toEqual(["src"]);
    expect(defaultRoots((path) => path === "walkthrough")).toEqual(["walkthrough"]);
  });

  it("takes every recognisable root, not just the first", () => {
    expect(defaultRoots((path) => path === "src" || path === "app")).toEqual(["src", "app"]);
  });

  it("falls back to the working directory when it recognises nothing", () => {
    expect(defaultRoots(() => false)).toEqual(["."]);
  });
});

describe("missing roots", () => {
  it("reports them instead of throwing ENOENT", () => {
    // The caller needs to tell the user something useful; a stack trace out of
    // node:fs is neither actionable for a person nor parseable by an agent.
    expect(() => scanProject(["definitely-not-here"])).toThrow(MissingRoots);
  });

  it("names every missing path", () => {
    try {
      scanProject(["nope-one", "nope-two"]);
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(MissingRoots);
      expect((error as MissingRoots).roots).toHaveLength(2);
    }
  });
});

describe("config-driven anchors", () => {
  it("counts an id passed as a bare string as applied", () => {
    const dir = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ nav: { invite: "nav.invite" } });`,
      "menu.ts": `export const menu = [{ path: "/invite", cairnAnchor: "nav.invite" }];`,
    });

    const ctx = scanProject(dir);
    expect(ctx.applied.has("nav.invite")).toBe(true);
    expect(ctx.untypedUse.has("nav.invite")).toBe(true);
  });

  it("finds an id in a file that never says cairn or anchor", () => {
    // The scan skips files that cannot contribute, which is what makes it fast.
    // This fixture is the case that filter can get wrong: the id is present as
    // plain data under a name of the app's own choosing, so the only thing
    // linking the file to cairnkit is the id string itself. Miss it and a live
    // anchor reads as unapplied — the check fails a build for no reason.
    const dir = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ nav: { invite: "nav.invite" } });`,
      "menu.ts": `export const menu = [{ path: "/invite", tourTarget: "nav.invite" }];`,
    });

    const ctx = scanProject(dir);
    expect(ctx.applied.has("nav.invite")).toBe(true);
  });

  it("never counts the registry's own declaration as a use", () => {
    // Otherwise every anchor is trivially "applied" and the check is worthless.
    const dir = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ nav: { invite: "nav.invite" } });`,
    });

    expect(scanProject(dir).applied.has("nav.invite")).toBe(false);
  });
});
