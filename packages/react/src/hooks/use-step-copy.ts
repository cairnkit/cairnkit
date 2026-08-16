"use client";

import type { TourFlow, TourStep } from "@cairnkit/core";
import { useCairn } from "../provider/cairn-context";

/**
 * Resolves a step's copy.
 *
 * Inline `title`/`body` by default; `titleKey`/`bodyKey` go through the host's
 * `translate`. That is what keeps cairnkit out of the i18n-library business —
 * next-intl, react-i18next or a plain lookup all work, and tenant-specific
 * vocabulary keeps whatever behaviour the host already has.
 */
export function useStepCopy(flow: TourFlow | null, step: TourStep | null) {
  const { translate } = useCairn();

  if (!flow || !step) return { title: "", body: "" };

  const resolve = (literal: string | undefined, key: string | undefined) => {
    if (literal) return literal;
    if (key && translate) return translate(key);
    return key ?? "";
  };

  return {
    title: resolve(step.title, step.titleKey),
    body: resolve(step.body, step.bodyKey),
  };
}
