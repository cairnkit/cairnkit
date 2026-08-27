# @cairnkit/react

[![npm](https://img.shields.io/npm/v/@cairnkit%2Freact?label=npm&color=4f46e5)](https://www.npmjs.com/package/@cairnkit/react) [![license](https://img.shields.io/npm/l/@cairnkit%2Freact?color=4f46e5)](https://github.com/cairnkit/cairnkit/blob/main/LICENSE) ![min+gzip](https://img.shields.io/badge/min%2Bgzip-2.9%20kb-4f46e5)

![A three-step tour running, spotlight moving between elements](https://raw.githubusercontent.com/cairnkit/cairnkit/main/brand/readme/tour.gif)

Headless React bindings for [cairnkit](https://cairnkit.dev). No styling, no
router assumptions — bring your own components, or add
[`@cairnkit/ui`](https://www.npmjs.com/package/@cairnkit/ui) for the prebuilt
overlay.

```bash
npm i @cairnkit/core @cairnkit/react
```

```tsx
"use client";
import { CairnProvider } from "@cairnkit/react";

<CairnProvider flows={flows} router={adapter} onEvent={(e) => analytics.capture(e.name, e.props)}>
  {children}
</CairnProvider>;
```

Then drive your own UI from the controller:

```tsx
const { step, rect, stepIndex, showNext, advance, back, skip } = useTour();
```

## Router adapters

Everything route-aware goes through a ten-line adapter, so cairnkit is not tied to
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
