"use client";

import { useEffect, useState } from "react";
import type { CairnNotice } from "@cairnkit/react";
import { IconButton } from "../atoms/icon-button";
import { CloseIcon } from "../atoms/icons";

export type NoticeLabels = Partial<Record<CairnNotice["reason"], string>>;

const DEFAULTS: Required<NoticeLabels> = {
  "anchor-missing": "The guide couldn't find its next step on this screen, so it's ended.",
  paused: "Guide paused while you look around. It picks up where you left off.",
  handoff: "Switching you to the guide for this screen.",
};

export type CairnNoticeBarProps = {
  notice: CairnNotice | null;
  labels?: NoticeLabels;
  /** How long it stays up. Default 5s. */
  durationMs?: number;
  onDismiss?: () => void;
};

/**
 * A one-line explanation when a tour ends or pauses.
 *
 * Ending in silence reads as a bug: the user clicked something reasonable and
 * the guide simply vanished. A sentence costs nothing and turns a apparent
 * fault into an understood outcome.
 */
export function CairnNoticeBar({ notice, labels, durationMs = 5000, onDismiss }: CairnNoticeBarProps) {
  const [shown, setShown] = useState<CairnNotice | null>(null);

  useEffect(() => {
    if (!notice) return;
    setShown(notice);

    const timer = window.setTimeout(() => {
      setShown(null);
      onDismiss?.();
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [notice, durationMs, onDismiss]);

  if (!shown) return null;

  return (
    <div className="cairn-notice" role="status" aria-live="polite">
      <span>{labels?.[shown.reason] ?? DEFAULTS[shown.reason]}</span>
      <IconButton
        aria-label="Dismiss"
        onClick={() => {
          setShown(null);
          onDismiss?.();
        }}
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
}
