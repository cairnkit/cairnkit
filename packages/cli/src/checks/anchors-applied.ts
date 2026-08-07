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
      // The element was deleted, so there is no location for the bug itself.
      // Point at the step that just broke instead — that is what needs a
      // decision, and it is the file the author has to open either way.
      detail: unapplied.flatMap((id) => {
        const users = [...ctx.flowAnchors.entries()]
          .filter(([, anchors]) => anchors.includes(id))
          .map(([flowId]) => flowId);

        if (users.length === 0) {
          return [{ text: id, at: ctx.declaredAt.get(id) }];
        }

        return users.map((flowId) => ({
          text: `${id}  (breaks "${flowId}")`,
          at: ctx.stepAt.get(`${flowId}::${id}`) ?? ctx.declaredAt.get(id),
        }));
      }),
      hint: "Spread {...anchor(...)} on the element, or remove the anchor and the step pointing at it.",
    },
  ];
};
