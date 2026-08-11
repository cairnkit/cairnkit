import { ImageResponse } from "next/og";
import { MARK_DATA_URI } from "./mark";

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#0b0d11";
const MUTED = "#6b7280";
const ACCENT = "#4f46e5";
const CANVAS = "#ffffff";

/**
 * One card, three pages.
 *
 * Deliberately the same composition as the film's end card — white ground,
 * near-black ink, indigo used once — so a link preview and the video read as
 * the same product rather than two attempts at one.
 *
 * No web font is fetched. Satori would need the file at render time, and a
 * social image that depends on a network call is one that silently renders
 * blank the day that call fails.
 */
export function ogImage({
  eyebrow,
  title,
  accent,
}: {
  /** Small label above the headline. Omitted on the home page. */
  eyebrow?: string;
  title: string;
  /** The one phrase in indigo. Must appear in `title`, or nothing is emphasised. */
  accent?: string;
}) {
  /**
   * One span per word, not one per coloured run.
   *
   * Satori lays these out as flex items, so a run like "Tours that " loses its
   * trailing space and ", not your users." can start a line on the comma.
   * Splitting to words and spacing them with a margin gives normal-looking
   * text that wraps at the places a reader expects.
   */
  const start = accent ? title.indexOf(accent) : -1;
  const end = start >= 0 ? start + accent!.length : -1;

  let cursor = 0;
  const words = title.split(" ").map((word) => {
    const at = cursor;
    cursor += word.length + 1;

    // The accent rarely lands on a word boundary — "…your build," puts the
    // comma inside the phrase. Cut each word at the exact offsets so trailing
    // punctuation stays ink.
    const from = Math.min(Math.max(start - at, 0), word.length);
    const to = Math.min(Math.max(end - at, 0), word.length);

    return {
      key: `${word}-${at}`,
      parts:
        start < 0 || from >= to
          ? [{ text: word, accented: false }]
          : [
              { text: word.slice(0, from), accented: false },
              { text: word.slice(from, to), accented: true },
              { text: word.slice(to), accented: false },
            ].filter((part) => part.text.length > 0),
    };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px 84px",
          background: CANVAS,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, color: INK }}>
          {/* The brand mark itself, not a redrawing of it. Cropped to the
              artwork, so its height can simply match the wordmark's. */}
          <img src={MARK_DATA_URI} width={53} height={50} alt="" />
          <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em" }}>cairnkit</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 600,
                color: ACCENT,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              {eyebrow}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 66,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.12,
              color: INK,
            }}
          >
            {words.map(({ key, parts }) => (
              // One wrap unit per word, coloured runs inside it — so a line
              // never breaks mid-word and punctuation keeps its own colour.
              <div key={key} style={{ display: "flex", marginRight: 16 }}>
                {parts.map((part, index) => (
                  <span key={`${key}-${index}`} style={{ color: part.accented ? ACCENT : INK }}>
                    {part.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 25,
            color: MUTED,
          }}
        >
          <span>React · Next.js · zero dependencies</span>
          <span style={{ color: INK, fontWeight: 600 }}>cairnkit.dev</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
