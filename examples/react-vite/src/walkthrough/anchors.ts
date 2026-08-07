import { defineAnchors } from "@cairnkit/core";

export const anchors = defineAnchors({
  nav: { pipeline: "nav.pipeline", questions: "nav.questions" },
  pipeline: { stats: "pipeline.stats", table: "pipeline.table", inviteCta: "pipeline.invite-cta" },
  invite: { email: "invite.email", role: "invite.role", send: "invite.send" },
  questions: { tabs: "questions.tabs", newCta: "questions.new-cta", list: "questions.list" },
  compose: { title: "compose.title", prompt: "compose.prompt", save: "compose.save" },
});
