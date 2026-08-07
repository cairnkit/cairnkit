import type { Check } from "./types";

/**
 * Every registered anchor must be spread onto a real element.
 *
 * This is the check that makes the whole product work: delete the button and
 * the build fails, rather than a user discovering it later.
 */
export const anchorsApplied: Check = (ctx) => {
  const unapplied = [...ctx.registered].filter((id) => !ctx.applied.has(id));
  if (unapplied.length === 0) return [];

  return [
    {
      rule: "anchors-applied",
      message: `${unapplied.length} anchor(s) are registered but never applied to an element`,
      detail: unapplied.map((id) => {
        const users = [...ctx.flowAnchors.entries()]
          .filter(([, anchors]) => anchors.includes(id))
          .map(([flowId]) => flowId);
        return users.length ? `${id}  (used by ${users.join(", ")})` : id;
      }),
      hint: "Spread {...anchor(...)} on the element, or remove the anchor and the step pointing at it.",
    },
  ];
};
