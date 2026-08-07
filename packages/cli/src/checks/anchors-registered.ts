import type { Check } from "./types";

/** A `data-cairn` literal outside the registry cannot be referenced type-safely. */
export const anchorsRegistered: Check = (ctx) => {
  const unknown = [...ctx.literals].filter((id) => !ctx.registered.has(id));
  if (unknown.length === 0) return [];

  return [
    {
      rule: "anchors-registered",
      message: `${unknown.length} data-cairn value(s) are not in the registry`,
      detail: unknown.map((id) => ({ text: id, at: ctx.literalAt.get(id) })),
      hint: "Add them to defineAnchors() so flows can reference them without a magic string.",
    },
  ];
};
