import type { ReactNode } from "react";
import Link from "next/link";
import { anchor } from "@cairnkit/core";
import { anchors } from "@/walkthrough/anchors";
import { Providers } from "./providers";
import "@cairnkit/ui/styles.css";
import "./globals.css";

export const metadata = { title: "Cairn example" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="shell">
            <nav className="side">
              <Link href="/" {...anchor(anchors.nav.library)}>Library</Link>
              <Link href="/new">Create manually</Link>
              <Link href="/ai">Generate with AI</Link>
              <Link href="/prefs">Preferences</Link>
            </nav>
            <main className="main">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
