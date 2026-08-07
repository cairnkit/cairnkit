# @cairnkit/react

Headless React bindings for [Cairn](https://cairnkit.dev). No styling, no
router assumptions — bring your own components, or add
[`@cairnkit/ui`](https://www.npmjs.com/package/@cairnkit/ui) for the prebuilt
overlay.

```bash
npm i @cairnkit/react
```

```tsx
"use client";
import { CairnProvider } from "@cairnkit/react";

<CairnProvider flows={flows} router={adapter} onEvent={(e) => analytics.capture(e.name, e.props)}>
  {children}
</CairnProvider>
```

Then drive your own UI from the controller:

```tsx
const { step, rect, stepIndex, showNext, advance, back, skip } = useTour();
```

## Router adapters

Everything route-aware goes through a ten-line adapter, so Cairn is not tied to
any framework:

```ts
type RouterAdapter = {
  usePathname(): string;
  navigate(href: string): void;
};
```

Next.js adapters ship in
[`@cairnkit/next`](https://www.npmjs.com/package/@cairnkit/next).

Full documentation: **[cairnkit.dev](https://cairnkit.dev)**

MIT
