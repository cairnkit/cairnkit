import { defineFlow } from "@cairnkit/core";
import { anchors } from "./anchors";

export const PIPELINE = "/";
export const QUESTIONS = "/questions";
export const COMPOSE = "/questions/new";
export const SETTINGS = "/settings";

/** Ends inside a modal — the case most tour tools get wrong. */
export const inviteFlow = defineFlow({
  id: "invite-candidate",
  version: 1,
  entryRoute: PIPELINE,
  steps: [
    { anchor: anchors.pipeline.stats, title: "Your Pipeline At A Glance", body: "Live counts across every stage, updated as candidates move." },
    { anchor: anchors.pipeline.table, title: "Everyone In Flight", body: "Each row is a candidate and the stage they're sitting in." },
    { anchor: anchors.pipeline.inviteCta, title: "Invite Someone New", body: "Click Invite Candidate — the next steps happen inside the dialog.", advanceOn: { type: "click" } },
    { anchor: anchors.invite.email, title: "Who Are You Inviting?", body: "They'll get a link to start whenever suits them." },
    { anchor: anchors.invite.role, title: "Pick The Role", body: "This decides which question set they're asked." },
    { anchor: anchors.invite.send, title: "Send It", body: "Nothing is sent until you click. Close the dialog if you'd rather not." },
  ],
});

/** Crosses a route boundary, and resumes if the user clicks ahead. */
export const questionsFlow = defineFlow({
  id: "write-question",
  version: 1,
  entryRoute: QUESTIONS,
  resumeAt: [{ pathname: COMPOSE, stepIndex: 3 }],
  steps: [
    { anchor: anchors.nav.questions, title: "Your Question Library", body: "Everything you ask candidates lives here." },
    { anchor: anchors.questions.tabs, title: "Filter By Status", body: "Drafts stay private until you publish them." },
    { anchor: anchors.questions.newCta, title: "Write A New One", body: "Click New Question to open the composer.", advanceOn: { type: "route", pathname: COMPOSE } },
    { anchor: anchors.compose.title, title: "Name It", body: "An internal label. Candidates never see this." },
    { anchor: anchors.compose.prompt, title: "Write The Question", body: "This is the exact wording shown during the interview." },
    { anchor: anchors.compose.save, title: "Save To Library", body: "It becomes available to every role from here." },
  ],
});

/**
 * Two guides on one URL, separated by `scope` rather than by route.
 *
 * Switching tabs on the Settings page never changes the pathname, so nothing
 * the router can see tells these apart. Both even open on the same anchor —
 * the tab strip, which belongs to neither panel and never unmounts. Without a
 * scope the members guide would keep running while you read the sharing tab,
 * confidently describing a screen you are not looking at.
 */
export const membersFlow = defineFlow({
  id: "settings-members",
  version: 1,
  entryRoute: SETTINGS,
  scope: "members",
  steps: [
    {
      anchor: anchors.settings.tabs,
      title: "Two Sides To Settings",
      body: "Who is on the team, and how outsiders get in. Switch tabs while this is running and the guide steps aside for the other one.",
    },
    {
      anchor: anchors.settings.membersList,
      title: "Everyone With Access",
      body: "Roles decide what each person is allowed to change.",
    },
    {
      anchor: anchors.settings.fragile,
      title: "A Card That Can Vanish",
      body: "Use the two buttons under it. Re-mount and the guide holds on; remove it for good and the guide gives up promptly instead of hanging.",
    },
    {
      anchor: anchors.settings.membersInvite,
      title: "Add A Teammate",
      body: "They get an email invitation. Nothing is sent until you confirm.",
    },
  ],
});

export const sharingFlow = defineFlow({
  id: "settings-sharing",
  version: 1,
  entryRoute: SETTINGS,
  scope: "sharing",
  steps: [
    {
      anchor: anchors.settings.tabs,
      title: "Sharing Lives Here",
      body: "One link, anyone who has it — no named recipient.",
    },
    {
      anchor: anchors.settings.sharingLink,
      title: "The Link Itself",
      body: "Paste it into a job post or an email. The same URL works for everyone.",
    },
    {
      anchor: anchors.settings.sharingExpiry,
      title: "Give It An End Date",
      body: "After this the link stops letting new people in.",
    },
  ],
});

export const flows = [inviteFlow, questionsFlow, membersFlow, sharingFlow];
