"use client";

import type { ButtonHTMLAttributes } from "react";
import { cx } from "../lib/cx";

/** Visually 28px, but with a 44px hit area via ::after — see overlay.css. */
export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cx("cairn-iconbtn", className)} {...props} />;
}
