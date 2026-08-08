import { afterEach, describe, expect, it, vi } from "vitest";
import { createActionRegistry } from "../engine/actions";

afterEach(() => vi.restoreAllMocks());

describe("action registry", () => {
  it("runs a published action and awaits it", async () => {
    const registry = createActionRegistry();
    const order: string[] = [];

    registry.register("close", async () => {
      await new Promise((r) => setTimeout(r, 20));
      order.push("closed");
    });

    await registry.run("close");
    order.push("after");

    expect(order).toEqual(["closed", "after"]);
  });

  it("stops running an action once its component unmounts", async () => {
    const registry = createActionRegistry();
    const fn = vi.fn();

    const withdraw = registry.register("close", fn);
    expect(registry.has("close")).toBe(true);

    withdraw();

    expect(registry.has("close")).toBe(false);
    await registry.run("close");
    expect(fn).not.toHaveBeenCalled();
  });

  it("warns rather than throwing when nothing is published", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const registry = createActionRegistry();

    // Must resolve: a step calling a missing action should not strand the tour.
    await expect(registry.run("nope")).resolves.toBeUndefined();

    // But it must still say so — a silent no-op hides the typo.
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain('"nope"');
  });

  it("does not let a stale unmount withdraw a newer registration", async () => {
    // Two components publishing the same name overlap during a transition:
    // the replacement mounts before the outgoing one cleans up.
    const registry = createActionRegistry();
    const older = vi.fn();
    const newer = vi.fn();

    const withdrawOlder = registry.register("close", older);
    registry.register("close", newer);

    withdrawOlder();

    expect(registry.has("close")).toBe(true);
    await registry.run("close");
    expect(newer).toHaveBeenCalledOnce();
    expect(older).not.toHaveBeenCalled();
  });

  it("keeps registries independent", async () => {
    // Two providers on one page, and a server rendering many requests, must
    // not share published actions.
    const a = createActionRegistry();
    const b = createActionRegistry();
    const fn = vi.fn();

    a.register("close", fn);

    expect(b.has("close")).toBe(false);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await b.run("close");
    expect(fn).not.toHaveBeenCalled();
  });
});
