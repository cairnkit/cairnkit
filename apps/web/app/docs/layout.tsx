import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { DocsSidebar } from "@/components/docs/sidebar";
import { Mark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "../site";
import "./docs.css";

export const metadata: Metadata = {
  title: { default: "Documentation", template: `%s — ${site.name} docs` },
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="nav doc-topbar">
        <div className="wrap nav__in">
          <Link className="nav__brand" href="/">
            <Mark /> {site.name}
          </Link>
          <span className="doc-badge">Docs</span>
          <div className="nav__links">
            <Link href="/docs">Documentation</Link>
            <a href={site.repo}>GitHub</a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="doc-shell">
        <DocsSidebar />
        <main className="doc-main">{children}</main>
      </div>
    </>
  );
}
