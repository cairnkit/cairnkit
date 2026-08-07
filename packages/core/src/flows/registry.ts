import { devWarn } from "../internal/dev";
import type { TourFlow } from "./types";

export type FlowRegistry = Record<string, TourFlow>;

export function createFlowRegistry(flows: TourFlow[]): FlowRegistry {
  const registry: FlowRegistry = {};

  for (const flow of flows) {
    if (registry[flow.id]) {
      devWarn(`duplicate flow id "${flow.id}" — the later one wins.`);
    }
    registry[flow.id] = flow;
  }

  return registry;
}

export function getFlow(registry: FlowRegistry, id: string | null | undefined): TourFlow | null {
  if (!id) return null;
  return registry[id] ?? null;
}
