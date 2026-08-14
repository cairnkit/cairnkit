import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { themeScript } from "@/components/theme-toggle";
import { site } from "./site";
import "@cairnkit/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author }],
  keywords: [
    "product tour", "onboarding", "walkthrough", "user onboarding", "guided tour",
    "spotlight", "coachmark", "react", "nextjs", "typescript", "developer tools",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.tagline },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
};

/**
 * The profiles that prove this is the same thing as the code.
 *
 * `sameAs` is how a search engine collapses several URLs onto one entity, and
 * it is the cheapest fix available for a name collision. "Cairn" is a common
 * enough word that summaries have confused this project with unrelated products
 * sharing the name; those products do not share this repository or this npm
 * scope, so listing both here is evidence rather than assertion.
 *
 * The GitHub organisation as well as the repository, deliberately: the org is
 * the durable identity, and it stays correct if the repository is ever renamed
 * or moved.
 */
const SAME_AS = [site.repo, "https://github.com/cairnkit", site.npm];

/**
 * Two schemas rather than one: SoftwareApplication describes the product for
 * general search, SoftwareSourceCode describes the repository for code search.
 * Google treats them differently and both are cheap.
 */
function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: site.name,
        description: site.description,
        url: site.url,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@type": "Person", name: site.author },
        sameAs: SAME_AS,
      },
      {
        "@type": "SoftwareSourceCode",
        name: site.name,
        description: site.description,
        codeRepository: site.repo,
        programmingLanguage: "TypeScript",
        license: "https://opensource.org/licenses/MIT",
        sameAs: SAME_AS,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme script below stamps data-theme on <html> before React
    // hydrates, so the server markup and the live DOM legitimately differ.
    // suppressHydrationWarning applies to this element's attributes only —
    // one level deep — which is exactly the scope of that mutation.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Before paint, so a dark-mode visitor never sees a white flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <StructuredData />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
