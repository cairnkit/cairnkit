import type { TourFlow } from "./types";

/** Identity helper — exists so flow files get inference and a stable import. */
export function defineFlow(flow: TourFlow): TourFlow {
  return flow;
}
