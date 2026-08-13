import { currentSession } from "./session";

const DEFAULT_ENDPOINT = "https://cloud.cairnkit.dev/api/flows";

/** One step, in the words a reader actually sees. */
export type ReportedStep = {
  index: number;
  anchor?: string | null;
  title: string;
  body: string;
  route?: string | null;
  handoffTo?: string | null;
};

export type ReportedFlow = {
  flowId: string;
  version: number;
  /** Optional human name for the tour, if you have one. */
  name?: string | null;
  steps: ReportedStep[];
};

export type ReportFlowsOptions = {
  key: string;
  flows: ReportedFlow[];
  /** BCP-47. Defaults to the document's language, else "und". */
  locale?: string;
  endpoint?: string;
};

/** Sent at most once per browser session per wording — see `report`. */
const SENT_KEY = "cairn:flows-sent";

/**
 * Tell cloud what your tours actually say.
 *
 * Events record that step 3 was reached; this records that step 3 says "Set
 * when the link expires". Without it a dashboard can only ever show ids and
 * indices, which is unreadable to exactly the people — product owners, support,
 * whoever writes the copy — who most need to act on the numbers.
 *
 * Called with copy you have already resolved, because only you can resolve it.
 * An app that keys its strings through an i18n layer has `steps.expiration.title`
 * in the flow definition and the sentence only at render time, so anything that
 * read the definitions directly — including a build step — would upload keys.
 *
 * Safe to call on every mount. It deduplicates per session against a digest of
 * the content, so a page that renders fifty times sends one request, and a
 * request is sent again only when the copy has actually changed.
 */
export function reportFlows(options: ReportFlowsOptions): void {
  if (typeof window === "undefined") return;
  if (options.flows.length === 0) return;

  const locale = options.locale ?? (document.documentElement.lang || "und");
  const payload = { key: options.key, locale, flows: options.flows };

  /*
   * Deduped on the content, not on a flag.
   *
   * A plain "already sent" boolean would go quiet for the rest of the session
   * even when the copy changed underneath it — which happens on every locale
   * switch, and is precisely when a fresh report is wanted.
   */
  const digest = fingerprint(locale, options.flows);

  try {
    if (window.sessionStorage.getItem(SENT_KEY) === digest) return;
    window.sessionStorage.setItem(SENT_KEY, digest);
  } catch {
    /* Private mode, or storage disabled. Sending again is harmless — the
       server upserts — so carry on rather than skipping the report. */
  }

  void fetch(options.endpoint ?? DEFAULT_ENDPOINT, {
    method: "POST",
    // text/plain to skip the CORS preflight, as with events.
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ ...payload, sessionId: currentSession() }),
    keepalive: true,
    credentials: "omit",
    mode: "cors",
  }).catch(() => {
    /* Describing the tours is never worth interrupting anybody over. The next
       session reports again, and the numbers work without it. */
  });
}

/**
 * A cheap, stable digest of the copy.
 *
 * Not cryptographic and does not need to be — it only has to change when the
 * words change. The server computes its own SHA-256 for storage; this one just
 * avoids a duplicate request.
 */
function fingerprint(locale: string, flows: ReportedFlow[]): string {
  const canonical =
    locale +
    flows
      .map((flow) => `${flow.flowId}@${flow.version}:${flow.steps.map((s) => s.title + s.body).join("|")}`)
      .join(";");

  let hash = 0;
  for (let i = 0; i < canonical.length; i += 1) {
    hash = (hash * 31 + canonical.charCodeAt(i)) | 0;
  }
  return String(hash);
}
