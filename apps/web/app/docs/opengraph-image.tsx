import { OG_SIZE, ogImage } from "@/lib/og";

export const runtime = "edge";
export const alt = "cairnkit documentation";
export const size = OG_SIZE;
export const contentType = "image/png";

/**
 * Covers every page under /docs.
 *
 * Per-page titles would mean one of these files per segment, and the sidebar
 * already tells you where you are — a link preview only has to say which
 * product and which part of it.
 */
export default function OpengraphImage() {
  return ogImage({
    eyebrow: "Documentation",
    title: "Anchors, flows, and the check that keeps them honest.",
    accent: "the check",
  });
}
