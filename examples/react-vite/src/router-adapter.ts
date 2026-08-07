import { useLocation, useNavigate } from "react-router-dom";
import type { RouterAdapter } from "@cairnkit/react";

/**
 * react-router adapter — the whole surface Cairn needs from a router.
 *
 * Ten lines. That this exists, and that nothing else in the app changes, is
 * the proof that the engine is not a Next.js library.
 */
export function useReactRouterAdapter(): RouterAdapter {
  const navigate = useNavigate();

  return {
    usePathname: () => useLocation().pathname,
    navigate: (href) => navigate(href),
  };
}
