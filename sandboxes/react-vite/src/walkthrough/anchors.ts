import { defineAnchors } from "@cairnkit/core";

export const anchors = defineAnchors({
  nav: { pipeline: "nav.pipeline", questions: "nav.questions", settings: "nav.settings" },
  pipeline: { stats: "pipeline.stats", table: "pipeline.table", inviteCta: "pipeline.invite-cta" },
  invite: { email: "invite.email", role: "invite.role", send: "invite.send" },
  questions: { tabs: "questions.tabs", newCta: "questions.new-cta", list: "questions.list" },
  compose: { title: "compose.title", prompt: "compose.prompt", save: "compose.save" },

  /**
   * Two guides behind one URL, told apart only by a tab.
   *
   * `tabs` is deliberately shared by both guides: it sits outside the panels
   * and never unmounts, which is precisely why anchor presence cannot tell
   * cairnkit which of the two is being looked at. Scope is what does.
   */
  settings: {
    tabs: "settings.tabs",
    membersList: "settings.members-list",
    membersInvite: "settings.members-invite",
    sharingLink: "settings.sharing-link",
    sharingExpiry: "settings.sharing-expiry",
    /** Unmounted and remounted on demand, to show a re-mount is survivable. */
    fragile: "settings.fragile",
  },
});
