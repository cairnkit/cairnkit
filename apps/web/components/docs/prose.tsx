import type { ReactNode } from "react";

export const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="doc-h2">
    <a href={`#${id}`} aria-label="Link to this section">
      {children}
    </a>
  </h2>
);

export const H3 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h3 id={id} className="doc-h3">
    {children}
  </h3>
);

export const P = ({ children }: { children: ReactNode }) => <p className="doc-p">{children}</p>;

export const Ul = ({ children }: { children: ReactNode }) => <ul className="doc-ul">{children}</ul>;

export const C = ({ children }: { children: ReactNode }) => <code className="doc-c">{children}</code>;

export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: "note" | "warn" | "good";
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className={`doc-callout doc-callout--${kind}`}>
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </aside>
  );
}
