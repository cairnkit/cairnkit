export type DocPage = { slug: string; title: string; blurb: string };
export type DocSection = { title: string; pages: DocPage[] };

/**
 * Single source of truth for the sidebar, prev/next links, and the sitemap.
 * Adding a page here and creating its route is the whole checklist.
 */
export const DOC_NAV: DocSection[] = [
  {
    title: "Getting started",
    pages: [
      { slug: "", title: "Introduction", blurb: "What cairnkit is, and the problem it solves." },
      { slug: "install", title: "Installation", blurb: "Packages, provider, and your first tour." },
    ],
  },
  {
    title: "Frameworks",
    pages: [
      { slug: "nextjs", title: "Next.js", blurb: "App Router, Pages Router, and SSR notes." },
      {
        slug: "react",
        title: "React",
        blurb: "Vite, react-router, TanStack, or no router at all.",
      },
    ],
  },
  {
    title: "Core concepts",
    pages: [
      { slug: "anchors", title: "Anchors", blurb: "Marking elements, and why not CSS selectors." },
      {
        slug: "flows",
        title: "Flows and steps",
        blurb: "Tours as data, and the five advance rules.",
      },
      {
        slug: "off-path",
        title: "When users go off-script",
        blurb: "resumeAt, handoffRoutes, pauseRoutes.",
      },
      { slug: "modals", title: "Modals and portals", blurb: "Anchoring inside dialogs." },
    ],
  },
  {
    title: "Customising",
    pages: [
      { slug: "theming", title: "Theming", blurb: "Tokens, light and dark, launcher placement." },
      {
        slug: "headless",
        title: "Headless usage",
        blurb: "Build your own overlay with useTour().",
      },
      { slug: "i18n", title: "Copy and i18n", blurb: "Inline strings or your own catalogue." },
    ],
  },
  {
    title: "Keeping tours correct",
    pages: [
      {
        slug: "ci",
        title: "cairnkit check",
        // `status` is named in the blurb on purpose: it lives on this page, and
        // a reader looking for it will not find it under a heading that only
        // says "check".
        blurb: "Failing the build when a tour breaks, and cairnkit status for reading what is there.",
      },
      { slug: "audit", title: "Browser audit", blurb: "Catching anchors that never render." },
    ],
  },
  { title: "Reference", pages: [{ slug: "api", title: "API reference", blurb: "Every export." }] },
];

export const FLAT = DOC_NAV.flatMap((s) => s.pages);

export function href(slug: string) {
  return slug ? `/docs/${slug}` : "/docs";
}

export function neighbours(slug: string) {
  const i = FLAT.findIndex((p) => p.slug === slug);
  return {
    prev: i > 0 ? FLAT[i - 1] : null,
    next: i >= 0 && i < FLAT.length - 1 ? FLAT[i + 1] : null,
  };
}

export function pageBySlug(slug: string) {
  return FLAT.find((p) => p.slug === slug);
}
