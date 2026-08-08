"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "./doc-page";

/**
 * Highlights the section you are actually reading.
 *
 * Uses IntersectionObserver rather than scroll maths: a rootMargin that clips
 * the viewport to a band near the top means "active" is whatever heading has
 * most recently crossed it, which matches where the eye is. A scroll handler
 * would fire on every frame and still need the same geometry.
 */
export function Toc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Several headings can be in the band at once; take the highest one.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
          return;
        }

        // Nothing in the band — between headings. Keep the last one above it,
        // otherwise the highlight blinks off in the middle of a long section.
        const above = headings.filter((h) => h.getBoundingClientRect().top < 120);
        const last = above[above.length - 1];
        if (last) setActiveId(last.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  return (
    <aside className="doc-toc" aria-label="On this page">
      <p className="doc-toc__title">On this page</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={activeId === item.id ? "on" : ""}
              aria-current={activeId === item.id ? "location" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
