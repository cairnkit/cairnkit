import type { anchors } from "../walkthrough/anchors";

declare module "@cairnkit/core" {
  interface CairnRegister {
    anchors: typeof anchors;
    flowIds: "tour-of-this-page" | "playground";
    actions: "demo:close-settings" | "demo:open-settings";
  }
}
