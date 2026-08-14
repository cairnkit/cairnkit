import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CairnEvent } from "@cairnkit/core";
import { __resetTransports, sendToCloud } from "../transport";

/**
 * The transport is the only code in cairnkit that runs on somebody else's site,
 * in a page that may be closing, against a network that may be gone. Every case
 * here is one that produced a real defect: a leak, an inverted drop rule, and a
 * flush that abandoned most of its queue.
 */

const ENDPOINT = "https://example.test/api/events";

type WireEvent = { id: string; name: string; runId?: string };
type Sent = { via: "fetch" | "beacon"; key: string; userId?: string; events: WireEvent[] };

/**
 * Both transports land here, in order.
 *
 * Recording only beacons hides most of what happens: terminal events and full
 * batches leave over `fetch`, and only the unload path uses `sendBeacon`. A
 * test that watched one of the two would assert against an empty array and
 * pass for the wrong reason.
 */
let sent: Sent[];
let fetchStatus: number | "reject";
let beaconOk: boolean;

function evt(name: string, flowId = "tour"): CairnEvent {
  return { name, props: { flowId } } as CairnEvent;
}

/** Queue `count` non-terminal events. */
function pump(handler: (e: CairnEvent) => void, count: number) {
  for (let i = 0; i < count; i += 1) handler(evt("step_viewed"));
}

const eventsIn = (via?: Sent["via"]) =>
  sent.filter((s) => !via || s.via === via).flatMap((s) => s.events);

beforeEach(() => {
  __resetTransports();
  vi.useFakeTimers();

  sent = [];
  fetchStatus = 200;
  beaconOk = true;

  /*
   * jsdom's Blob can only be read asynchronously, and these assertions are
   * about what was handed to the browser at that instant. Stashing the text on
   * the instance keeps the tests synchronous without mocking JSON.
   */
  const RealBlob = globalThis.Blob;
  globalThis.Blob = class extends RealBlob {
    _text: string;
    constructor(parts: BlobPart[], options?: BlobPropertyBag) {
      super(parts, options);
      this._text = String(parts[0]);
    }
  } as unknown as typeof Blob;

  navigator.sendBeacon = vi.fn((_url: string, body?: BodyInit | null) => {
    if (!beaconOk) return false;
    sent.push({ via: "beacon", ...JSON.parse((body as Blob & { _text: string })._text) });
    return true;
  }) as typeof navigator.sendBeacon;

  globalThis.fetch = vi.fn((_url: string, init?: RequestInit) => {
    if (fetchStatus === "reject") return Promise.reject(new Error("offline"));
    // Recorded even on failure: the server saw it, the client just isn't told.
    sent.push({ via: "fetch", ...JSON.parse(String(init?.body)) });
    return Promise.resolve(new Response("", { status: fetchStatus }));
  }) as unknown as typeof fetch;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("one transport per endpoint and key", () => {
  it("returns the same handler rather than building a second queue", () => {
    const a = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });
    const b = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    expect(b).toBe(a);
  });

  it("does not add a second pair of unload listeners on re-render", () => {
    const onWindow = vi.spyOn(window, "addEventListener");
    const onDocument = vi.spyOn(document, "addEventListener");

    // The documented integration, called inline in JSX — so, once per render.
    for (let i = 0; i < 5; i += 1) sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    expect(onWindow.mock.calls.filter(([name]) => name === "pagehide")).toHaveLength(1);
    expect(onDocument.mock.calls.filter(([name]) => name === "visibilitychange")).toHaveLength(1);
  });

  it("sends one beacon on unload, not one per render", () => {
    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });
    sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });
    sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    handler(evt("step_viewed"));
    window.dispatchEvent(new Event("pagehide"));

    expect(sent.filter((s) => s.via === "beacon")).toHaveLength(1);
    expect(eventsIn("beacon")).toHaveLength(1);
  });

  it("keeps different keys apart", () => {
    expect(sendToCloud({ key: "ck_pub_b", endpoint: ENDPOINT })).not.toBe(
      sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT }),
    );
  });

  it("takes the newest userId getter, so a later sign-in is not lost", () => {
    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    // A later render supplies the getter — at first paint nobody was signed in.
    sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT, userId: () => "user_42" });

    handler(evt("flow_completed"));

    expect(sent[0]?.userId).toBe("user_42");
  });
});

describe("the queue under pressure", () => {
  it("drops the oldest events, never the completion that just happened", async () => {
    fetchStatus = 500;
    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    // Saturate: every send fails and comes back, so the queue only grows.
    pump(handler, 600);
    await vi.runAllTimersAsync();

    handler(evt("flow_completed"));
    await vi.runAllTimersAsync();

    window.dispatchEvent(new Event("pagehide"));

    /*
     * The whole point of the overflow rule. Truncating from the front kept the
     * stale failed batch and discarded this event — the one the funnel is
     * computed from, arriving at the moment the queue is most likely to be full.
     */
    expect(eventsIn("beacon").map((e) => e.name)).toContain("flow_completed");
  });

  it("beacons the whole queue on unload, not just the first batch", async () => {
    fetchStatus = "reject";
    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    // 120 queued events is a tab that could not reach the network for a while.
    pump(handler, 120);
    await vi.runAllTimersAsync();

    window.dispatchEvent(new Event("pagehide"));

    expect(eventsIn("beacon")).toHaveLength(120);
    // Chunked to the server's cap, never one oversized body.
    expect(Math.max(...sent.map((s) => s.events.length))).toBeLessThanOrEqual(50);
  });

  it("keeps events a refused beacon could not take", () => {
    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });
    handler(evt("step_viewed"));

    beaconOk = false;
    window.dispatchEvent(new Event("pagehide"));
    expect(eventsIn("beacon")).toHaveLength(0);

    // Requeued rather than dropped, so the next opportunity still has them.
    beaconOk = true;
    window.dispatchEvent(new Event("pagehide"));
    expect(eventsIn("beacon")).toHaveLength(1);
  });

  it("retries a 429 instead of dropping the batch", async () => {
    /*
     * The case that spans two repositories. The server gained a rate limit and
     * answers 429; this client treated every 4xx as permanent, so a customer
     * throttled for one minute would have lost that minute's events outright
     * rather than sending them a moment later.
     */
    fetchStatus = 429;
    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    handler(evt("flow_completed"));
    await vi.runAllTimersAsync();

    fetchStatus = 200;
    window.dispatchEvent(new Event("pagehide"));

    expect(eventsIn("beacon").map((e) => e.name)).toContain("flow_completed");
  });

  it("does not report a 429 as a permanent rejection", async () => {
    // onError means "stop, this will never work". A throttle is the opposite,
    // and waking a customer's Sentry for it would be a false alarm every time.
    const onError = vi.fn();
    fetchStatus = 429;

    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT, onError });
    handler(evt("flow_completed"));
    await vi.runAllTimersAsync();

    expect(onError).not.toHaveBeenCalled();
  });

  it("still reports a revoked key as permanent", async () => {
    const onError = vi.fn();
    fetchStatus = 401;

    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT, onError });
    handler(evt("flow_completed"));
    await vi.runAllTimersAsync();

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("never sends the same event id twice from one queue", async () => {
    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    pump(handler, 60);
    await vi.runAllTimersAsync();
    window.dispatchEvent(new Event("pagehide"));

    const ids = eventsIn().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("run ids", () => {
  it("gives a restart its own run id", () => {
    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    handler(evt("flow_started"));
    handler(evt("flow_dismissed"));
    handler(evt("flow_started"));
    handler(evt("flow_completed"));

    const runs = new Set(eventsIn().map((e) => e.runId));
    expect(runs.size).toBe(2);
  });

  it("keeps two concurrent flows on separate runs", () => {
    const handler = sendToCloud({ key: "ck_pub_a", endpoint: ENDPOINT });

    handler(evt("flow_started", "alpha"));
    handler(evt("flow_started", "beta"));
    handler(evt("flow_completed", "alpha"));

    const runs = new Set(eventsIn().map((e) => e.runId));
    expect(runs.size).toBe(2);
  });
});
