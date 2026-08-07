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

export type AuditOptions = {
  /** Page the flow starts on. `?tour=<flowId>` is appended. */
  url: string;
  flowId: string;
  /** How many steps the flow declares. */
  stepCount: number;
  /** Milliseconds to let each step settle. Default 500. */
  settleMs?: number;
  timeout?: number;
};

const CARD = ".cairn-card";
const SPOTLIGHT = ".cairn-spotlight";
const NEXT = ".cairn-btn--primary";

/**
 * Walks one flow and reports any step whose anchor failed to produce a
 * spotlight. Advances with Next where offered, otherwise clicks the spotlit
 * element, which is what the step is waiting for anyway.
 */
export async function auditFlow(page: AuditPage, options: AuditOptions): Promise<FlowAudit> {
  const { url, flowId, stepCount, settleMs = 500, timeout = 15000 } = options;
  const separator = url.includes("?") ? "&" : "?";

  await page.goto(`${url}${separator}tour=${flowId}`, { waitUntil: "networkidle" });

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

    if (!reached) failures.push(`step ${index + 1}: the tour never reached this step`);
    else if (!observed.spotlightVisible) {
      failures.push(`step ${index + 1} ("${observed.title ?? "?"}"): anchor rendered nothing`);
    }

    if (index === stepCount - 1) break;

    if (observed.nextOffered) await page.click(NEXT);
    else await page.click(SPOTLIGHT).catch(() => undefined);
  }

  return { flowId, ok: failures.length === 0, steps, failures };
}

/** Audits several flows and throws a single readable error if any failed. */
export async function auditFlows(page: AuditPage, flows: AuditOptions[]): Promise<FlowAudit[]> {
  const results: FlowAudit[] = [];
  for (const flow of flows) results.push(await auditFlow(page, flow));

  const broken = results.filter((result) => !result.ok);
  if (broken.length > 0) {
    const detail = broken
      .map((result) => `  ${result.flowId}\n${result.failures.map((f) => `    - ${f}`).join("\n")}`)
      .join("\n");
    throw new Error(`cairn audit failed — a tour points at UI that does not render:\n${detail}`);
  }

  return results;
}
