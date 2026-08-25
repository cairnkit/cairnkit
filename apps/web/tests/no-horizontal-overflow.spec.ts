import { expect, test } from "@playwright/test";

/**
 * Nothing on the site may scroll sideways on a phone.
 *
 * This exists because it already happened, twice, on two properties. Cloud grew
 * this gate after a 32px overflow reached production; the docs site never got
 * one, and so shipped its own — the nav's four links and theme toggle at a 20px
 * gap measured 283px against 269px of room, making the document 404px wide at a
 * 390px viewport with the toggle clipped off the edge.
 *
 * Typecheck, lint and the unit suite were green through all of it. A layout bug
 * is only visible to something that lays the page out.
 */
const PAGES = [
  { path: "/", name: "landing" },
  { path: "/playground", name: "playground" },
  { path: "/docs", name: "docs index" },
  { path: "/docs/install", name: "docs install" },
  { path: "/docs/off-path", name: "docs off-path" },
  { path: "/docs/api", name: "docs api" },
];

// A small phone, and the width the overflow was found at.
test.use({ viewport: { width: 390, height: 844 } });

for (const page of PAGES) {
  test(`${page.name} does not scroll sideways`, async ({ page: browser }) => {
    await browser.goto(page.path, { waitUntil: "networkidle" });

    const { doc, viewport } = await browser.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));

    expect(doc, `${page.name} is ${doc}px wide in a ${viewport}px viewport`).toBeLessThanOrEqual(
      viewport,
    );
  });

  test(`${page.name} keeps every element inside the viewport`, async ({ page: browser }) => {
    await browser.goto(page.path, { waitUntil: "networkidle" });

    /*
     * The document width alone can pass while a single element hangs off the
     * side, because an ancestor may be clipping it. Naming the offender is what
     * turns a red build into a fix, so this reports the element rather than a
     * number.
     *
     * Anything inside a deliberate horizontal scroller is exempt: a wide code
     * block or table that scrolls on its own is the intended design, not a bug.
     */
    const offenders = await browser.evaluate(() => {
      const found: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("body *")) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) continue;

        let parent = el.parentElement;
        let scrollable = false;
        while (parent) {
          if (getComputedStyle(parent).overflowX === "auto") {
            scrollable = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (scrollable) continue;

        if (rect.right > window.innerWidth + 1) {
          const cls = typeof el.className === "string" ? el.className.split(" ")[0] : "";
          found.push(
            `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""} +${Math.round(rect.right - window.innerWidth)}px`,
          );
        }
      }
      return found;
    });

    expect(offenders, `elements past the right edge on ${page.name}`).toEqual([]);
  });
}
