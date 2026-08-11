import { expect, test } from "@playwright/test";

const SETTINGS = "http://localhost:4200/settings";

/**
 * The cases that only a real browser can settle: a tab switch that changes no
 * URL, an element that re-mounts, and one that leaves for good.
 *
 * Each of these is also reproducible by hand — open /settings and follow the
 * steps in the comment. See docs/testing.md.
 */

const card = ".cairn-card";
const launcher = ".cairn-launcher__btn";

const title = ".cairn-card__title";

test.describe("two guides behind one URL", () => {
  test("switching tabs sends the running guide dormant, not away", async ({ page }) => {
    await page.goto(`${SETTINGS}?tour=settings-members`, { waitUntil: "networkidle" });
    await expect(page.locator(card)).toBeVisible();

    // Second step, so there is progress worth keeping.
    await page.getByRole("button", { name: "Next" }).click();
    const before = await page.locator(title).textContent();
    // Guard against the comparison below passing on two nulls.
    expect(before).toBe("Everyone With Access");

    await page.getByRole("button", { name: "Sharing" }).click();

    // Gone from view. The old behaviour was to sit for four seconds and then
    // end, because `settings.tabs` is still on screen in both tabs.
    await expect(page.locator(card)).toHaveCount(0, { timeout: 2000 });

    await page.getByRole("button", { name: "Members" }).click();

    // Same step it left on: dormant, not dismissed.
    await expect(page.locator(card)).toBeVisible();
    await expect(page.locator(title)).toHaveText(before!);
  });

  test("the other tab offers its own guide while the first is dormant", async ({ page }) => {
    await page.goto(`${SETTINGS}?tour=settings-members`, { waitUntil: "networkidle" });
    await expect(page.locator(card)).toBeVisible();
    // While a tour is on screen the launcher stays out of its way.
    await expect(page.locator(launcher)).toHaveCount(0);

    await page.getByRole("button", { name: "Sharing" }).click();

    // Dormant is the one state where both can be true: no card, and a launcher
    // offering the guide that does cover this tab.
    await expect(page.locator(launcher)).toBeVisible();
    await expect(page.getByLabel("Guide: sharing")).toBeVisible();

    await page.getByLabel("Guide: sharing").click();
    await expect(page.locator(card)).toBeVisible();
    await expect(page.locator(card)).toContainText("Sharing Lives Here");
  });
});

test.describe("an anchored element that leaves", () => {
  test("survives a re-mount", async ({ page }) => {
    await page.goto(`${SETTINGS}?tour=settings-members`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.locator(card)).toContainText("A Card That Can Vanish");

    // React destroys and rebuilds the node in one commit — a changed key, a
    // reordered list, a parent re-render. The guide must not notice.
    await page.getByRole("button", { name: "Re-mount the card" }).click();

    await page.waitForTimeout(1000);
    await expect(page.locator(card)).toContainText("A Card That Can Vanish");
    await expect(page.locator(".cairn-spotlight")).toBeVisible();
  });

  test("gives up promptly when it is gone for good", async ({ page }) => {
    await page.goto(`${SETTINGS}?tour=settings-members`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.locator(card)).toContainText("A Card That Can Vanish");

    const start = Date.now();
    await page.getByRole("button", { name: "Remove the card" }).click();

    await expect(page.locator(card)).toHaveCount(0, { timeout: 3000 });

    // The whole point of the grace window: this used to take the full 4s wait,
    // during which the guide sat frozen on an element that no longer existed.
    expect(Date.now() - start).toBeLessThan(3000);
    await expect(page.locator(".cairn-notice")).toBeVisible();
  });
});

test("a guide that crosses a route keeps going", async ({ page }) => {
  await page.goto("http://localhost:4200/questions?tour=write-question", {
    waitUntil: "networkidle",
  });
  await expect(page.locator(card)).toBeVisible();

  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator(card)).toContainText("Write A New One");

  // The user does the navigating — the guide points and waits. Its next step
  // is anchored on the page they land on.
  await page.getByRole("button", { name: "New Question" }).click();

  await expect(page).toHaveURL(/\/questions\/new$/);
  await expect(page.locator(card)).toBeVisible();
  await expect(page.locator(card)).toContainText("Name It");

  // Back would land on a step anchored to the page we just left, so the button
  // is not offered. It used to be there and do nothing: `resumeAt` for this
  // route pulled the tour straight forward again.
  await expect(page.getByRole("button", { name: "Back" })).toHaveCount(0);
});

test("browser Back sends the guide dormant, and returning wakes it", async ({ page }) => {
  await page.goto("http://localhost:4200/questions?tour=write-question", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "New Question" }).click();
  await expect(page.locator(title)).toHaveText("Name It");

  await page.goBack();
  await expect(page).toHaveURL(/\/questions(\?|$)/);
  await expect(page.locator(card)).toHaveCount(0);

  /*
   * Sit here long past the step's `waitForMs`, which is when the runtime
   * decides what the missing anchor means. The whole point is that it decides
   * "dormant" rather than "broken", so the wait is the test.
   */
  await page.waitForTimeout(5000);

  await expect(page.locator(".cairn-notice")).toHaveCount(0);
  const saved = await page.evaluate(() => localStorage.getItem("cairn"));
  expect(JSON.parse(saved!)).toMatchObject({ activeFlowId: "write-question", stepIndex: 3 });

  await page.getByRole("button", { name: "New Question" }).click();
  await expect(page).toHaveURL(/\/questions\/new$/);

  // Back on the page it lives on, the guide wakes on the step it left.
  await expect(page.locator(title)).toHaveText("Name It");
});
