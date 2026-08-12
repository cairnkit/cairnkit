/**
 * A session id, and a v4 uuid that works outside a secure context.
 *
 * Both live here because both are the same kind of problem: identity that has
 * to be generated in a browser, survive a page load, and never become an
 * identity in the sense a privacy policy would care about.
 */

const SESSION_KEY = "cairn:session";

/**
 * How long a quiet tab keeps the same session.
 *
 * Thirty minutes, which is the convention every analytics tool has settled on
 * and is a reasonable answer to "is this the same visit". It matters because
 * completion rate is computed *within* a session: too short and a person who
 * reads a step carefully starts a new session mid-tour, so the tour looks
 * abandoned and the completion looks like it came from nowhere.
 */
const IDLE_MS = 30 * 60 * 1000;

type StoredSession = { id: string; at: number };

/**
 * The current session, extending it on every call.
 *
 * `localStorage`, not `sessionStorage`, for one specific reason: a tour that
 * spans a full page load in a *new* tab — following a link out and coming back
 * — keeps its session here and would get a new one there. cairnkit already
 * persists tour progress to `localStorage`, so this introduces no storage
 * category the SDK was not already using, and nothing here is readable across
 * origins.
 *
 * Falls back to a per-call id when storage throws, which it does in Safari's
 * private mode and under some cookie-blocking extensions. That degrades
 * completion rate for those visitors — every event looks like its own session —
 * and is much better than throwing inside somebody's tour.
 */
export function currentSession(): string {
  const now = Date.now();

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const stored = raw ? (JSON.parse(raw) as StoredSession) : null;

    const id = stored && now - stored.at < IDLE_MS ? stored.id : uuid();
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id, at: now }));

    return id;
  } catch {
    return uuid();
  }
}

/**
 * A v4 uuid, by whatever means are available.
 *
 * `crypto.randomUUID` is missing outside a secure context — which is every
 * plain-http staging box and every colleague's machine on the office network.
 * The server validates these as uuids, so a missing function would mean a 400
 * on exactly the deployments where someone is trying the product for the first
 * time.
 *
 * `getRandomValues` is the real fallback and exists everywhere `crypto` does.
 * The last resort uses `Math.random`, which is not a CSPRNG and does not need
 * to be: this id is a deduplication token, and the worst case for a collision
 * is one dropped event.
 */
export function uuid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);

  // Version 4, variant 1 — the two fields that make it a well-formed v4.
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
