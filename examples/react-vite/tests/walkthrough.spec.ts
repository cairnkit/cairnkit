import { expect, test } from "@playwright/test";
import { auditFlows } from "@cairnkit/cli";
import { inviteFlow, questionsFlow } from "../src/walkthrough/flows";

const BASE = "http://localhost:4200";

/**
 * The third drift check. TypeScript catches a typo; `cairn check` catches an
 * element deleted from source. Only a browser catches an anchor that exists in
 * source but never renders — behind a feature flag, an empty state, or a
 * conditional that no longer fires.
 */
test("every step of every flow spotlights something", async ({ page }) => {
  await auditFlows(page, [
    { url: BASE, flowId: inviteFlow.id, stepCount: inviteFlow.steps.length },
    { url: `${BASE}/questions`, flowId: questionsFlow.id, stepCount: questionsFlow.steps.length },
  ]);
});

test("a tour that loses its anchor explains itself", async ({ page }) => {
  await page.goto(`${BASE}/?tour=invite-candidate`, { waitUntil: "networkidle" });
  await page.waitForSelector(".cairn-card");

  // Rip the anchored element out, as a redeploy would.
  await page.evaluate(() => document.querySelectorAll("[data-cairn]").forEach((el) => el.remove()));

  await expect(page.locator(".cairn-notice")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".cairn-card")).toHaveCount(0);
});
