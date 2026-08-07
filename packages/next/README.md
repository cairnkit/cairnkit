# @cairnkit/next

Next.js router adapters for [Cairn](https://cairnkit.dev). App Router and Pages
Router.

```bash
npm i @cairnkit/next
```

```tsx
"use client";
import { CairnProvider } from "@cairnkit/react";
import { useAppRouterAdapter } from "@cairnkit/next";

<CairnProvider flows={flows} router={useAppRouterAdapter()}>{children}</CairnProvider>
```

Pages Router: `usePagesRouterAdapter()`.

Full documentation: **[cairnkit.dev](https://cairnkit.dev)**

MIT
