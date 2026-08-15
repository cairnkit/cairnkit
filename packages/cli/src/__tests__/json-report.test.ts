import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanProject } from "../scan";
import { checkReport, statusReport } from "../reporters/json";
import { anchorsApplied } from "../checks/anchors-applied";

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "cairn-json-"));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
}

const REGISTRY = `import { defineAnchors } from "@cairnkit/core";
export const anchors = defineAnchors({ a: { one: "a.one" }, b: { two: "b.two" } });`;

const FLOW = `import { defineFlow } from "@cairnkit/core";
import { anchors } from "./anchors";
export const f = defineFlow({
  id: "onboarding", version: 1, entryRoute: "/",
  steps: [{ anchor: anchors.a.one, title: "A", body: "a" }],
});`;

describe("statusReport", () => {
  it("describes every anchor, how it is applied, and which flows use it", () => {
    const dir = project({
      "anchors.ts": REGISTRY,
      "flows.ts": FLOW,
      // a.one via the documented spread, b.two via a bare attribute.
      "App.tsx": `export const A = () => <button {...anchor(anchors.a.one)} />;`,
      "Other.tsx": `export const O = () => <a data-cairn="b.two" />;`,
    });

    const report = statusReport(scanProject(dir));
    const byId = Object.fromEntries(report.anchors.map((a) => [a.id, a]));

    expect(report.summary).toEqual({
      registered: 2,
      applied: 2,
      orphaned: 0,
      unregistered: 0,
      flows: 1,
    });

    // The distinction matters: a typed reference stops compiling when the
    // registry changes, a bare literal does not.
    expect(byId["a.one"]?.appliedAs).toBe("typed");
    expect(byId["b.two"]?.appliedAs).toBe("literal");

    expect(byId["a.one"]?.flows).toEqual(["onboarding"]);
    expect(byId["b.two"]?.flows).toEqual([]);
    expect(byId["a.one"]?.declaredAt?.file).toContain("anchors.ts");
  });

  it("counts an anchor nothing carries as orphaned", () => {
    const dir = project({
      "anchors.ts": REGISTRY,
      "flows.ts": FLOW,
      "App.tsx": `export const A = () => <button {...anchor(anchors.a.one)} />;`,
    });

    const report = statusReport(scanProject(dir));
    expect(report.summary.orphaned).toBe(1);
    expect(report.anchors.find((a) => a.id === "b.two")?.applied).toBe(false);
  });
});

describe("checkReport", () => {
  it("carries the rule, the hint and a resolved file and line", () => {
    const dir = project({
      "anchors.ts": REGISTRY,
      "flows.ts": FLOW,
      "App.tsx": `export const A = () => <button {...anchor(anchors.a.one)} />;`,
    });

    const context = scanProject(dir);
    const report = checkReport(anchorsApplied(context), context.registered.size);

    expect(report.ok).toBe(false);
    expect(report.version).toBe(1);
    expect(report.findings[0]?.rule).toBe("anchors-applied");
    expect(report.findings[0]?.hint).toBeTruthy();

    // `file:line` is the whole point: a consumer should be able to jump
    // straight there rather than parse it back out of prose.
    const at = report.findings[0]?.detail[0]?.at;
    expect(at?.file).toBeTruthy();
    expect(at?.line).toBeGreaterThan(0);
  });

  it("reports ok with no findings", () => {
    const dir = project({
      "anchors.ts": REGISTRY,
      "flows.ts": FLOW,
      "App.tsx": `export const A = () => <button {...anchor(anchors.a.one)} />;
export const B = () => <a data-cairn="b.two" />;`,
    });

    const context = scanProject(dir);
    const report = checkReport(anchorsApplied(context), context.registered.size);
    expect(report.ok).toBe(true);
    expect(report.findings).toEqual([]);
  });
});
