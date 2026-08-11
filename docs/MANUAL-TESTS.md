# Manual test script

Everything below is covered by automated tests, but these are the cases worth
walking by hand before a release — they are the ones where "the assertion
passed" and "it feels right" can disagree.

```bash
pnpm build
pnpm --filter @cairnkit/example-react-vite dev    # http://localhost:4200
pnpm --filter @cairnkit/example-next-app dev          # http://localhost:3000
```

The Vite example boots in a couple of seconds and carries the fullest set of
cases. The Next example exists to prove the same behaviour under App Router —
`@cairnkit/next` supplies only a pathname and a navigate, so none of this is
router work, but the claim is worth checking rather than asserting.

---

## 1. Two guides behind one URL

**Where:** `/settings` in the Vite example, `/prefs` in the Next one.

| #   | Do this                                          | Expect                                                                                                                           |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Click **Guide: members**, press Next once        | Card on "Everyone With Access"                                                                                                   |
| 1.2 | Click the **Sharing** tab                        | Card disappears within a moment. Not after a four-second pause, and no "we lost the step" notice — this is dormancy, not failure |
| 1.3 | Look at the bottom-right                         | Launcher is back, reading **Guide: sharing**                                                                                     |
| 1.4 | Click the **Members** tab again                  | Card returns **on "Everyone With Access"** — the step it left, not step 1                                                        |
| 1.5 | Switch to Sharing, then click **Guide: sharing** | Sharing guide starts. The members guide is discarded, which is correct: the user chose                                           |

The subtle one is 1.2. Both guides open on the tab strip, which never unmounts,
so the anchor the members guide is pointing at is _still on screen_ after the
switch. Nothing in the DOM says anything is wrong. Without `scope` the guide
keeps running and describes the panel you are no longer looking at.

## 2. An element that re-mounts

**Where:** `/settings` → Members tab → step 3 ("A Card That Can Vanish").

| #   | Do this                                        | Expect                                               |
| --- | ---------------------------------------------- | ---------------------------------------------------- |
| 2.1 | Reach step 3, then click **Re-mount the card** | Nothing visible happens. Spotlight stays on the card |
| 2.2 | Click it several times quickly                 | Still nothing. The guide does not flicker or end     |

React destroyed and rebuilt that node. A tour that treats "left the DOM" as
"gone" would end here, and this is ordinary React — a changed key, a reordered
list, a parent re-render.

## 3. An element that leaves for good

| #   | Do this                                          | Expect                                                                       |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| 3.1 | On step 3, click **Remove the card**             | Guide ends in well under a second, with a notice explaining why              |
| 3.2 | Count while doing it                             | It should feel immediate. Four seconds of a frozen card is the old behaviour |
| 3.3 | Click **Bring the card back**, restart the guide | Runs normally again                                                          |

## 4. Crossing a route

**Where:** `/questions` in the Vite example.

| #   | Do this                                     | Expect                                                                |
| --- | ------------------------------------------- | --------------------------------------------------------------------- |
| 4.1 | Click **Guide: write-question**, Next twice | Card on "Write A New One", pointing at the button                     |
| 4.2 | Click **New Question**                      | URL becomes `/questions/new`, and the guide continues on "Name It"    |
| 4.3 | Look at the card's buttons                  | No **Back**. The previous step is on the page you just left           |
| 4.4 | Use the browser Back button                 | Card goes, but no "we lost the step" — the guide is dormant, not over |
| 4.5 | Click **New Question** again                | Card returns on "Name It", the step it was holding                    |

The guide never navigates on its own. Step 4.2 works because the _user_ clicked
the control the step was pointing at, and the next step is anchored on the page
they land on.

4.3 is honesty rather than a missing feature. Going back would land on a step
anchored to a page you have left, so the button either stalls or — with a
`resumeAt` for this route — is undone the instant you press it. A step whose
`onEnter` can restore its own surroundings keeps its Back button.

4.4 is the distinction the runtime now draws: an anchor missing **on the page
the step lives on** is a broken app and ends the tour; missing because you
walked off that page is an ordinary move, and the guide waits.

## 5. The launcher and the overlay together

| #   | Do this                                        | Expect                                                      |
| --- | ---------------------------------------------- | ----------------------------------------------------------- |
| 5.1 | Open the console on `/settings`, start a guide | Exactly one `step_viewed` per step — not two                |
| 5.2 | While a guide is on screen                     | No launcher anywhere. It would float over its own spotlight |
| 5.3 | While a guide is dormant (case 1.2)            | Launcher visible, offering the _other_ guide only           |

5.1 is a regression check. The launcher used to call `useTour()`, which put a
second driver on the page beside the overlay's and ran every `onEnter` twice.

## 6. Nothing was dismissed that the user did not dismiss

| #   | Do this                                                    | Expect                               |
| --- | ---------------------------------------------------------- | ------------------------------------ |
| 6.1 | Trigger case 3.1, then run `localStorage.getItem("cairn")` | `dismissedFlows` is empty            |
| 6.2 | Start a guide, press **Skip tour**, check again            | `dismissedFlows` now names that flow |

Skipping is a decision. An anchor disappearing is the app moving, and it should
not leave a verdict in persisted state that the user never gave.

---

## Automated equivalents

| Case | Covered by                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | `packages/react/src/__tests__/placement.test.tsx`, `examples/react-vite/tests/placement.spec.ts` |
| 2, 3 | `packages/react/src/__tests__/anchor-detach.test.tsx`, and the Playwright spec above             |
| 4    | `examples/react-vite/tests/placement.spec.ts`                                                    |
| 5    | `packages/ui/src/__tests__/tour-launcher.test.tsx`                                               |
| 6    | `packages/react/src/__tests__/placement.test.tsx`                                                |

```bash
pnpm test                                              # unit
pnpm --filter @cairnkit/example-react-vite exec playwright test   # browser
```
