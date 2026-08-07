import { useRouter } from "next/router";
import type { RouterAdapter } from "@cairnkit/react";

/** Pages Router adapter. `router.pathname` is the route pattern, so use asPath. */
export function usePagesRouterAdapter(): RouterAdapter {
  const router = useRouter();

  return {
    usePathname: () => router.asPath.split("?")[0] ?? "/",
    navigate: (href) => {
      void router.push(href);
    },
  };
}
