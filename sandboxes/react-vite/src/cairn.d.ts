import type { anchors } from "./walkthrough/anchors";

/**
 * Registering the app's anchors and flow ids narrows Cairn's whole API to
 * these literals — a typo in a flow file or a launcher now fails to compile.
 */
declare module "@cairnkit/core" {
  interface CairnRegister {
    anchors: typeof anchors;
    flowIds: "invite-candidate" | "write-question";
    events: "invite:sent" | "question:saved";
  }
}
