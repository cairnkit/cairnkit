"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Mark } from "./mark";
import { ThemeToggle } from "./theme-toggle";
import { site } from "@/app/site";

/**
 * One nav for every page.
 *
 * There were three hand-written copies, and they had already drifted — the
 * landing page used `<nav>`, the docs used `<header>`, and each carried a
 * different set of links. Adding a page meant remembering to edit all three,
 * which is exactly the kind of thing nobody remembers.
 */
export function SiteNav({
  badge,
  extra,
  className = "",
}: {
  /** Small label after the wordmark, e.g. "Docs". */
  badge?: string;
  /** Page-specific links, shown before the shared ones and hidden on mobile. */
  extra?: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  // `startsWith` so /docs/anchors keeps Docs marked as current.
  const current = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className={`nav ${className}`.trim()}>
      <div className="wrap nav__in">
        <Link className="nav__brand" href="/">
          <Mark /> {site.name}
        </Link>
        {badge && <span className="doc-badge">{badge}</span>}

        <div className="nav__links">
          {extra}
          <Link href="/playground" aria-current={current("/playground") ? "page" : undefined}>
            Playground
          </Link>
          <Link href="/docs" aria-current={current("/docs") ? "page" : undefined}>
            Docs
          </Link>
          {/* Last of the links and not marked out, because it is the optional
              paid thing on a page whose argument is the free one. */}
          <a href={site.cloud}>Cloud</a>
          <a href={site.repo}>GitHub</a>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
