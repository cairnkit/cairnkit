import type { CairnEvent, CairnEventHandler } from "@cairnkit/core";
import { currentSession, uuid } from "./session";

/** Where cairnkit cloud receives events. Override for self-hosting or tests. */
const DEFAULT_ENDPOINT = "https://cloud.cairnkit.dev/api/events";

/**
 * How long a batch waits for company.
 *
 * Long enough that the three or four events a step produces leave as one
 * request, short enough that nothing sits in memory waiting for a tab to close.
 * Terminal events ignore it entirely and flush at once — see `TERMINAL`.
 */
const FLUSH_MS = 1000;

/** Matches the server's cap. A larger batch would be rejected whole. */
const MAX_BATCH = 50;

/**
 * Stop growing the queue after this many events.
 *
 * Reached only when sending has been failing for a while — a tab left open on a
 * dead connection, or a firewall swallowing the endpoint. Dropping the oldest
 * events is the right way to lose: the newest ones are the ones still being
 * argued about.
 */
const MAX_QUEUE = 500;

/**
 * The events worth a request of their own.
 *
 * A completion is the number the whole product is about, and it lands at the
 * exact moment someone is most likely to navigate away — waiting a full second
 * for a batch that may never flush is how the most valuable event becomes the
 * least reliable one. `flow_dismissed` is the same event with the opposite
 * sign, and just as load-bearing for drop-off.
 */
const TERMINAL = new Set(["flow_completed", "flow_dismissed"]);

export type CloudOptions = {
  /**
   * The project's publishable key, from the project screen in cloud.
   *
   * Safe to ship in your bundle — that is what it is for. It can write events
   * to one project and can read nothing at all.
   */
  key: string;
  /** Defaults to cairnkit cloud. Point it anywhere that speaks the same shape. */
  endpoint?: string;
  /**
   * Called when a batch is refused for good — a revoked key, a rejected
   * payload. Not called for network failures, which are retried silently.
   * Defaults to a console warning in development and silence in production.
   */
  onError?: (error: { status: number; body: string }) => void;
};

type WireEvent = {
  id: string;
  name: string;
  at: string;
  viewport: { w: number; h: number };
  props: Record<string, unknown>;
};

/**
 * A `CairnEventHandler` that sends every tour event to cairnkit cloud.
 *
 *     <CairnProvider flows={flows} onEvent={sendToCloud({ key: KEY })}>
 *
 * Everything hard about doing this well is in here rather than in the app:
 * batching, the session id, capturing the viewport at the right moment, and
 * surviving a page that closes mid-tour.
 */
export function sendToCloud(options: CloudOptions): CairnEventHandler {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;

  // Server rendering emits no tour events, but the handler is constructed
  // during render — so this must be inert rather than absent.
  if (typeof window === "undefined") return () => {};

  let queue: WireEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * The unload flush, which is the one that has to work.
   *
   * `sendBeacon` is the only transport a browser will still run after the page
   * is gone, and it cannot set headers — which is why the key travels in the
   * body. The `text/plain` blob type is equally deliberate: it is one of the
   * three types that skip the CORS preflight, so the batch is a single request
   * rather than an OPTIONS that a closing page may not survive.
   */
  const flushBeacon = (events: WireEvent[]) => {
    const body = JSON.stringify(payload(events));
    if (!navigator.sendBeacon?.(endpoint, new Blob([body], { type: "text/plain" }))) {
      // Queued rather than dropped: `sendBeacon` returns false when the browser
      // refuses to take it, usually because too much is already in flight.
      requeue(events);
    }
  };

  const payload = (events: WireEvent[]) => ({
    key: options.key,
    sessionId: currentSession(),
    events,
  });

  const requeue = (events: WireEvent[]) => {
    /*
     * Failed events go back to the *front*, in order.
     *
     * Every event carries the id it was first created with, so the server
     * recognises a redelivery and ignores it. That is what makes a blind retry
     * correct here rather than a way to double every number.
     */
    queue = [...events, ...queue].slice(0, MAX_QUEUE);
  };

  const flush = (final = false) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (queue.length === 0) return;

    const batch = queue.slice(0, MAX_BATCH);
    queue = queue.slice(MAX_BATCH);

    if (final) {
      flushBeacon(batch);
      return;
    }

    /*
     * `keepalive` so a flush already in flight is not cancelled if the user
     * navigates a moment later. It is the same guarantee `sendBeacon` gives,
     * on a request whose response we can actually read.
     */
    fetch(endpoint, {
      method: "POST",
      // Skips the preflight, exactly as the beacon does. The server reads the
      // body as text and parses it itself.
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload(batch)),
      keepalive: true,
      // No cookies, ever. The key is the entire credential, and sending
      // credentials would make the wildcard CORS on the endpoint invalid.
      credentials: "omit",
      mode: "cors",
    })
      .then(async (response) => {
        if (response.ok) return;

        /*
         * 4xx is final; 5xx and network failures are retried.
         *
         * A revoked key or a malformed payload will be just as wrong in ten
         * seconds, so retrying it is a loop that never ends and never succeeds.
         * A 500 or a dropped connection is worth another attempt.
         */
        if (response.status >= 500) {
          requeue(batch);
          return;
        }

        report(options, { status: response.status, body: await response.text().catch(() => "") });
      })
      .catch(() => {
        // Offline, DNS, a blocked request. Keep them and try on the next flush.
        requeue(batch);
      });
  };

  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => flush(), FLUSH_MS);
  };

  /*
   * `pagehide`, not `unload` or `beforeunload`.
   *
   * `unload` is ignored on iOS and disqualifies the page from the back/forward
   * cache everywhere else. `pagehide` fires in the cases the others miss —
   * including a tab being backgrounded on a phone and never coming back, which
   * is where a large share of mobile tours end.
   */
  window.addEventListener("pagehide", () => flush(true));

  /*
   * And on the way to hidden, because on mobile that is often the last callback
   * a page ever gets: switching apps fires `visibilitychange` and may never
   * fire anything again.
   */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });

  return (event: CairnEvent) => {
    queue.push({
      id: uuid(),
      name: event.name,
      at: new Date().toISOString(),
      /*
       * Read now, not at flush time.
       *
       * The viewport belongs to the moment of the event. A phone turned
       * sideways between two steps would otherwise report both at whichever
       * orientation happened to be current when the batch left.
       */
      viewport: { w: window.innerWidth, h: window.innerHeight },
      props: (event.props ?? {}) as Record<string, unknown>,
    });

    if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);

    if (TERMINAL.has(event.name) || queue.length >= MAX_BATCH) flush();
    else schedule();
  };
}

/**
 * Say something when a batch is refused for good.
 *
 * Loud in development, silent in production unless the host app asked to hear
 * about it. A wrong key is the most likely thing to go wrong during setup and
 * produces no other visible symptom — the tours keep working perfectly and
 * nothing ever appears in the dashboard, which is the worst kind of bug to
 * debug without a message.
 */
function report(options: CloudOptions, error: { status: number; body: string }) {
  if (options.onError) {
    options.onError(error);
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[cairnkit/cloud] events rejected (${error.status}). ` +
        `Check the project key. ${error.body}`,
    );
  }
}
