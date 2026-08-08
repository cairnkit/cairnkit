"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_NAV, href } from "@/app/docs/nav";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="doc-side" aria-label="Documentation">
      {DOC_NAV.map((section) => (
        <div className="doc-side__group" key={section.title}>
          <p className="doc-side__title">{section.title}</p>
          <ul>
            {section.pages.map((page) => {
              const url = href(page.slug);
              return (
                <li key={page.slug}>
                  <Link href={url} className={pathname === url ? "on" : ""} aria-current={pathname === url ? "page" : undefined}>
                    {page.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
