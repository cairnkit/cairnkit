import { OG_SIZE, ogImage } from "@/lib/og";

export const runtime = "edge";
export const alt = "cairnkit playground";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return ogImage({
    eyebrow: "Playground",
    title: "A real tour against a real UI, in your browser.",
    accent: "real UI",
  });
}
