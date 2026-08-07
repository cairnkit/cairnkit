"use client";

import { useEffect, useState } from "react";

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"], dialog[open]';

/**
 * Where the overlay should be portaled for a given target.
 *
 * Anchors are not always on the page. A step can point at a control inside a
 * modal, a popover, or a command palette — all of which render in their own
 * portal and bring three problems with them:
 *
 *   1. Stacking. A dialog at z-index 9999 would paint over a scrim below it.
 *   2. `inert` / `aria-hidden`. Dialog libraries mark everything outside the
 *      dialog as inert, which would make our buttons unclickable.
 *   3. Focus traps. A trap inside the dialog cannot reach a sibling portal, so
 *      Tab would never land on Next.
 *
 * Mounting *inside* the dialog when the target lives there fixes all three at
 * once. Everywhere else we mount on document.body.
 *
 * The container is keyed to the **host**, not the target: consecutive steps
 * usually share a host, and recreating the portal for each one would remount
 * the card, cancelling its transition and losing focus every step.
 */
export function useOverlayContainer(target: HTMLElement | null): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const next = target?.closest<HTMLElement>(DIALOG_SELECTOR) ?? document.body;
    setHost((current) => (current === next ? current : next));
  }, [target]);

  useEffect(() => {
    if (!host) return;

    const node = document.createElement("div");
    node.setAttribute("data-cairn-overlay", "");
    host.appendChild(node);
    setContainer(node);

    // Some dialog libraries mark siblings inert *after* mount. If we end up on
    // body while a dialog is open, defend our own node so it stays operable.
    const observer = new MutationObserver(() => {
      if (node.hasAttribute("inert")) node.removeAttribute("inert");
      if (node.getAttribute("aria-hidden") === "true") node.removeAttribute("aria-hidden");
    });
    observer.observe(node, { attributes: true, attributeFilter: ["inert", "aria-hidden"] });

    return () => {
      observer.disconnect();
      node.remove();
      setContainer(null);
    };
  }, [host]);

  return container;
}
