import { expect, test } from "@playwright/test";
import { auditFlows } from "@cairnkit/cli";
import { inviteFlow, questionsFlow } from "../src/walkthrough/flows";

const BASE = "http://localhost:4200";

/**
 * The third drift check. TypeScript catches a typo; `cairnkit check` catches an
 * element deleted from source. Only a browser catches an anchor that exists in
 * source but never renders — behind a feature flag, an empty state, or a
 * conditional that no longer fires.
 */
test("every step of every flow spotlights something", async ({ page }) => {
  await auditFlows(page, [
    { url: BASE, flow: inviteFlow },
    { url: `${BASE}/questions`, flow: questionsFlow },
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

/**
 * Regression: the overlay re-portals into a dialog, which gives React a new
 * card element. If the positioning effect does not re-run for the new node it
 * keeps its default position and lands at the viewport origin, while the
 * spotlight still highlights correctly — so the tour looks half-broken.
 */
test("card follows the target into a dialog", async ({ page }) => {
  await page.goto("http://localhost:4200/?tour=invite-candidate", { waitUntil: "load" });
  await page.waitForSelector(".cairn-card", { timeout: 15000 });
  await page.waitForTimeout(700);

  const read = () => page.evaluate(() => {
    const card = document.querySelector(".cairn-card")!.getBoundingClientRect();
    const spot = document.querySelector(".cairn-spotlight")!.getBoundingClientRect();
    const host = document.querySelector("[data-cairn-overlay]")?.parentElement;
    // Gap between the card's nearest edge and the spotlight ring.
    const gap = Math.round(Math.min(
      Math.abs(card.top - spot.bottom), Math.abs(spot.top - card.bottom),
      Math.abs(card.left - spot.right), Math.abs(spot.left - card.right),
    ));
    return {
      cardX: Math.round(card.left), cardY: Math.round(card.top),
      atOrigin: card.left < 20 && card.top < 20,
      gapToSpotlight: gap,
      portaledInto: host?.getAttribute("role") ?? host?.tagName ?? null,
    };
  });

  const onPage = await read();

  await page.click(".cairn-btn--primary"); await page.waitForTimeout(500);
  await page.click(".cairn-btn--primary"); await page.waitForTimeout(500);
  await page.click('[data-cairn="pipeline.invite-cta"]');   // opens the modal
  await page.waitForTimeout(1200);
  const inModal = await read();

  console.log("\n===MODAL===\n" + JSON.stringify({ onPage, inModal }, null, 1) + "\n===END===");
  expect(inModal.atOrigin, "card must not sit at the viewport origin").toBe(false);
  expect(inModal.portaledInto).toBe("dialog");
});
