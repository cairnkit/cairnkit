# @cairnkit/ui

[![npm](https://img.shields.io/npm/v/@cairnkit%2Fui?label=npm&color=4f46e5)](https://www.npmjs.com/package/@cairnkit/ui) [![license](https://img.shields.io/npm/l/@cairnkit%2Fui?color=4f46e5)](https://github.com/cairnkit/cairnkit/blob/main/LICENSE) ![min+gzip](https://img.shields.io/badge/min%2Bgzip-5.5%20kb-4f46e5)

![The prebuilt overlay: spotlight ring, step card, and progress across three steps](https://raw.githubusercontent.com/cairnkit/cairnkit/main/brand/readme/tour.gif)

The prebuilt [cairnkit](https://cairnkit.dev) overlay: spotlight, tooltip step
card, and a positionable launcher. Plain CSS, light and dark from the start.

```bash
npm i @cairnkit/core @cairnkit/react @cairnkit/ui
```

```tsx
import { CairnOverlay, TourLauncher } from "@cairnkit/ui";
import "@cairnkit/ui/styles.css";

<CairnOverlay />
<TourLauncher flowId="invite-candidate" position="bottom-left" />
```

## Brand it in one line

```css
:root {
  --cairn-accent: #f75c03;
  --cairn-accent-rgb: 247 92 3;
}
```

Typography inherits from your app deliberately — an overlay should not look
like a widget bolted onto your product.

## Works inside modals

When a step points at a control inside a dialog, the overlay portals **into
that dialog** rather than onto `body`, so it inherits the stacking context,
stays interactive when the rest of the page is marked `inert`, and remains
reachable inside a focus trap.

Full documentation: **[cairnkit.dev](https://cairnkit.dev)**

MIT
