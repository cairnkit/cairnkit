import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
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
      <SiteNav badge="Docs" className="doc-topbar" />

      <div className="doc-shell">
        <DocsSidebar />
        <main className="doc-main">{children}</main>
      </div>
    </>
  );
}
