"use client";

import type { ButtonHTMLAttributes } from "react";
import { cx } from "../lib/cx";

export type ButtonVariant = "primary" | "ghost" | "quiet";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "ghost", className, ...props }: ButtonProps) {
  return <button type="button" className={cx("cairn-btn", `cairn-btn--${variant}`, className)} {...props} />;
}
