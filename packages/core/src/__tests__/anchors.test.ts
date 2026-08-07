import { describe, expect, it } from "vitest";
import { anchorSelector } from "../anchors/anchor";
import { resolveAnchor } from "../anchors/resolve-anchor";
import { createFlowRegistry, getFlow } from "../flows/registry";

describe("anchorSelector", () => {
  it("builds an attribute selector", () => {
    expect(anchorSelector("questions.tab")).toContain("data-cairn");
  });

  it("escapes ids so they cannot break out of the selector", () => {
    // Ids reach querySelector and can arrive from config or a ?tour= link.
    const selector = anchorSelector('a"] , [data-x="b');
    expect(() => document.querySelectorAll(selector)).not.toThrow();
    expect(selector.startsWith('[data-cairn="')).toBe(true);
  });
});

describe("flow registry", () => {
  const flow = { id: "a", version: 1, entryRoute: "/", steps: [] };

  it("looks flows up by id", () => {
    const registry = createFlowRegistry([flow]);
    expect(getFlow(registry, "a")).toBe(flow);
    expect(getFlow(registry, "missing")).toBeNull();
    expect(getFlow(registry, null)).toBeNull();
  });
});

describe("resolveAnchor outside a browser", () => {
  it("returns null instead of throwing when there is no document", () => {
    // Guards server rendering: a default parameter of `document` would throw a
    // ReferenceError in Node before any guard could run.
    const original = globalThis.document;
    // @ts-expect-error -- simulating a server environment
    delete globalThis.document;

    try {
      expect(resolveAnchor("anything.at.all")).toBeNull();
    } finally {
      globalThis.document = original;
    }
  });
});
