import type { RegisteredAction } from "../register";

/** Something a step needs the app to do — usually close a modal it opened. */
export type TourAction = () => void | Promise<void>;

export type ActionRegistry = {
  /** Publishes an action. Returns the function that withdraws it. */
  register(name: string, fn: TourAction): () => void;
  /** Runs an action, awaiting it. Resolves even if nothing is published. */
  run(name: RegisteredAction): Promise<void>;
  /** Whether anything is currently publishing this name. */
  has(name: RegisteredAction): boolean;
};

/**
 * Connects module-level step data to component state.
 *
 * Steps live in a flow file as plain data, so `onExit` cannot close over the
 * setter that closes a modal — the setter is several components away. Mounted
 * components publish named actions here, and steps call them by name.
 *
 * One registry per provider rather than one per module. A module-level map
 * would be shared across requests during server rendering and would collide
 * between two providers on one page.
 */
export function createActionRegistry(): ActionRegistry {
  const actions = new Map<string, TourAction>();

  return {
    register(name, fn) {
      actions.set(name, fn);

      return () => {
        // Guard against clobbering a newer registration when two components
        // publishing the same name briefly overlap during a transition.
        if (actions.get(name) === fn) actions.delete(name);
      };
    },

    async run(name) {
      const fn = actions.get(name);

      if (!fn) {
        // Almost always a typo or a component that never mounted. Warning
        // rather than throwing keeps the tour moving, but staying silent
        // would hide the exact failure this library exists to surface.
        console.warn(
          `[cairn] No action named "${name}" is registered. ` +
            `Call useTourAction("${name}", fn) in a mounted component. Skipping.`,
        );
        return;
      }

      await fn();
    },

    has: (name) => actions.has(name),
  };
}
