"use client";

import { useEffect, useRef } from "react";
import { Button } from "../atoms/button";
import { IconButton } from "../atoms/icon-button";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "../atoms/icons";
import { ProgressRail } from "../molecules/progress-rail";
import { cx } from "../lib/cx";

export type StepCardLabels = {
  next: string;
  back: string;
  skip: string;
  done: string;
  counter: (current: number, total: number) => string;
};

export type StepCardProps = {
  title: string;
  body: string;
  stepNumber: number;
  totalSteps: number;
  showNext: boolean;
  /**
   * Defaults to "anything but the first step". Pass `false` when going back
   * would land nowhere — the previous step lives on a page the user has left,
   * so the button would do nothing.
   */
  showBack?: boolean;
  isLastStep: boolean;
  isSheet?: boolean;
  labels: StepCardLabels;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export function StepCard({
  title,
  body,
  stepNumber,
  totalSteps,
  showNext,
  showBack = stepNumber > 1,
  isLastStep,
  isSheet,
  labels,
  onNext,
  onBack,
  onSkip,
}: StepCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus moves to the card each step so screen readers and keyboard users
  // follow along. Deliberately not a focus trap: the user must be able to Tab
  // to the spotlit control and operate it — that is the point of the tour.
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [stepNumber]);

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="false"
      aria-live="polite"
      aria-label={title}
      tabIndex={-1}
      className={cx("cairn-card", isSheet && "cairn-card--sheet")}
    >
      <div className="cairn-card__head">
        <span className="cairn-card__count">{labels.counter(stepNumber, totalSteps)}</span>
        <IconButton aria-label={labels.skip} onClick={onSkip} style={{ marginLeft: "auto" }}>
          <CloseIcon />
        </IconButton>
      </div>

      <div>
        <h2 className="cairn-card__title">{title}</h2>
        <p className="cairn-card__body" style={{ marginTop: 6 }}>
          {body}
        </p>
      </div>

      <ProgressRail current={stepNumber} total={totalSteps} />

      <div className="cairn-card__foot">
        <button type="button" className="cairn-btn cairn-btn--quiet" onClick={onSkip}>
          {labels.skip}
        </button>

        <div className="cairn-card__actions">
          {showBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeftIcon />
              {labels.back}
            </Button>
          )}
          {showNext && (
            <Button variant="primary" onClick={onNext}>
              {isLastStep ? labels.done : labels.next}
              {!isLastStep && <ArrowRightIcon />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
