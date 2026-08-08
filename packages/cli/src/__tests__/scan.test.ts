import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanProject } from "../scan";

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

  it("never counts the registry's own declaration as a use", () => {
    // Otherwise every anchor is trivially "applied" and the check is worthless.
    const dir = project({
      "anchors.ts": `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ nav: { invite: "nav.invite" } });`,
    });

    expect(scanProject(dir).applied.has("nav.invite")).toBe(false);
  });
});
