import Link from "next/link";
import { href, neighbours } from "@/app/docs/nav";

export function PageNav({ slug }: { slug: string }) {
  const { prev, next } = neighbours(slug);

  return (
    <nav className="doc-pagenav">
      {prev ? (
        <Link href={href(prev.slug)} className="doc-pagenav__link">
          <span>Previous</span>
          <strong>{prev.title}</strong>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={href(next.slug)} className="doc-pagenav__link doc-pagenav__link--next">
          <span>Next</span>
          <strong>{next.title}</strong>
        </Link>
      )}
    </nav>
  );
}
