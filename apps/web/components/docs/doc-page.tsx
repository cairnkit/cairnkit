import type { ReactNode } from "react";
import { PageNav } from "./page-nav";
import { Toc } from "./toc";
import { pageBySlug } from "@/app/docs/nav";

export type TocItem = { id: string; label: string };

/**
 * Shared shell for every docs page: title block, content column, on-this-page
 * rail, and prev/next. Pages supply only their own body and TOC, so structure
 * stays identical across all of them.
 */
export function DocPage({
  slug,
  toc = [],
  children,
}: {
  slug: string;
  toc?: TocItem[];
  children: ReactNode;
}) {
  const meta = pageBySlug(slug);

  return (
    <div className="doc-grid">
      <article className="doc-body">
        <header className="doc-head">
          <h1>{meta?.title}</h1>
          {meta?.blurb && <p>{meta.blurb}</p>}
        </header>
        {children}
        <PageNav slug={slug} />
      </article>

      {toc.length > 0 && <Toc items={toc} />}
    </div>
  );
}
