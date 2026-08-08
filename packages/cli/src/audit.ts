/**
 * Browser audit — the drift check that neither TypeScript nor `cairn check`
 * can perform.
 *
 * Those two prove an anchor is *declared* and *applied in source*. Neither can
 * prove it actually renders: an element behind a feature flag, an empty state,
 * or a conditional that no longer fires will pass both and still spotlight
 * nothing. That needs a real browser, so this drives the tour and watches.
 *
 * Typed against a structural subset of Playwright's `Page` so this package
 * takes no dependency on it — pass your `page` straight in.
 */

export type AuditPage = {
  goto(url: string, options?: { waitUntil?: "load" | "networkidle" }): Promise<unknown>;
  $(selector: string): Promise<unknown | null>;
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
  click(selector: string): Promise<void>;
};

export type StepReport = {
  index: number;
  reached: boolean;
  spotlightVisible: boolean;
  title: string | null;
};

export type FlowAudit = {
  flowId: string;
  ok: boolean;
  steps: StepReport[];
  failures: string[];
};

/** The shape `defineFlow` produces — accepted structurally to avoid a core dep. */
export type AuditableFlow = {
  id: string;
  steps: { anchor: string; advanceOn?: { type: string } }[];
};

export type AuditOptions = {
  /** Page the flow starts on. `?tour=<flowId>` is appended. */
  url: string;
  /** Pass the flow itself so the auditor can click the right element. */
  flow: AuditableFlow;
  /** Milliseconds to let each step settle. Default 500. */
  settleMs?: number;
  timeout?: number;
};

const CARD = ".cairn-card";
const NEXT = ".cairn-btn--primary";

/**
 * Walks one flow and reports any step whose anchor failed to produce a
 * spotlight. Advances with Next where offered, otherwise clicks the spotlit
 * element, which is what the step is waiting for anyway.
 */
export async function auditFlow(page: AuditPage, options: AuditOptions): Promise<FlowAudit> {
  const { url, flow, settleMs = 400, timeout = 8000 } = options;
  const flowId = flow.id;
  const stepCount = flow.steps.length;
  const separator = url.includes("?") ? "&" : "?";

  // "load", not "networkidle": a dev server holds an HMR websocket open, so
  // the network never goes idle and the navigation hangs until the test dies.
  await page.goto(`${url}${separator}tour=${flowId}`, { waitUntil: "load" });
  await page.waitForTimeout(settleMs);

  const steps: StepReport[] = [];
  const failures: string[] = [];

  for (let index = 0; index < stepCount; index += 1) {
    let reached = true;
    try {
      await page.waitForSelector(CARD, { timeout });
    } catch {
      reached = false;
    }
    await page.waitForTimeout(settleMs);

    const observed = await page.evaluate(() => {
      const card = document.querySelector(".cairn-card");
      const spot = document.querySelector(".cairn-spotlight");
      const box = spot?.getBoundingClientRect();
      return {
        title: card?.querySelector(".cairn-card__title")?.textContent ?? null,
        // A zero-size cutout means the anchor resolved to nothing worth showing.
        spotlightVisible: Boolean(box && box.width > 0 && box.height > 0),
        nextOffered: Boolean(document.querySelector(".cairn-btn--primary")),
        anchor: card ? null : null,
      };
    });

    steps.push({
      index,
      reached,
      spotlightVisible: observed.spotlightVisible,
      title: observed.title,
    });

    if (!reached) {
      // Everything after an unreachable step is unreachable too, and waiting
      // out the timeout for each one turns a clear failure into a test-suite
      // timeout that says nothing.
      failures.push(`step ${index + 1}: the tour never reached this step`);
      break;
    }

    if (!observed.spotlightVisible) {
      failures.push(`step ${index + 1} ("${observed.title ?? "?"}"): anchor rendered nothing`);
    }

    if (index === stepCount - 1) break;

    if (observed.nextOffered) {
      await page.click(NEXT);
      continue;
    }

    // No Next button means the step waits on the user operating the real
    // control. The overlay is pointer-events:none, so clicking the spotlight
    // does nothing — click the anchored element itself, which is what the
    // step is actually waiting for.
    const anchorId = flow.steps[index]?.anchor;
    if (!anchorId) continue;
    await page.click(`[data-cairn="${anchorId}"]`).catch(() => {
      failures.push(`step ${index + 1}: could not click [data-cairn="${anchorId}"] to advance`);
    });
  }

  return { flowId, ok: failures.length === 0, steps, failures };
}

/** Audits several flows and throws a single readable error if any failed. */
export async function auditFlows(page: AuditPage, flows: AuditOptions[]): Promise<FlowAudit[]> {
  const results: FlowAudit[] = [];

  for (const flow of flows) {
    // Each flow is audited from a clean slate. Progress persists to
    // localStorage by design, so without this the previous flow's state leaks
    // into the next one and failures become order-dependent.
    await page.evaluate(() => {
      try {
        window.localStorage.removeItem("cairn");
      } catch {
        /* storage disabled — nothing to clear */
      }
    });
    results.push(await auditFlow(page, flow));
  }

  const broken = results.filter((result) => !result.ok);
  if (broken.length > 0) {
    const detail = broken
      .map((result) => `  ${result.flowId}\n${result.failures.map((f) => `    - ${f}`).join("\n")}`)
      .join("\n");
    throw new Error(`cairn audit failed — a tour points at UI that does not render:\n${detail}`);
  }

  return results;
}
