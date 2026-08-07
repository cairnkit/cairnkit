import { describe, expect, it } from "vitest";
import { decideForRoute } from "../engine/lifecycle";
import { resolveResumeStep } from "../flows/resume";

const LIB = "/questions";
const FORM = "/questions/new";
const AI = "/questions/ai";

const flow = {
  resumeAt: [{ pathname: FORM, stepIndex: 6 }],
  pauseRoutes: [] as string[],
  handoffRoutes: [{ pathname: AI, flowId: "ai-guide" }],
};

describe("resolveResumeStep", () => {
  it("catches up when the user navigates ahead of the guide", () => {
    expect(resolveResumeStep(flow, FORM, 3)).toBe(6);
  });

  it("never rewinds someone already past the resume point", () => {
    expect(resolveResumeStep(flow, FORM, 6)).toBeNull();
    expect(resolveResumeStep(flow, FORM, 9)).toBeNull();
  });

  it("ignores routes with no resume point", () => {
    expect(resolveResumeStep(flow, LIB, 3)).toBeNull();
  });

  it("is inert without resumeAt", () => {
    expect(resolveResumeStep({}, FORM, 0)).toBeNull();
  });
});

describe("decideForRoute", () => {
  it("hands off before anything else", () => {
    expect(decideForRoute(flow, AI, 0)).toEqual({ kind: "handoff", flowId: "ai-guide" });
  });

  it("pauses on a route nobody covers", () => {
    expect(decideForRoute({ ...flow, pauseRoutes: [LIB] }, LIB, 2)).toEqual({ kind: "pause" });
  });

  it("resumes forward on a covered route", () => {
    expect(decideForRoute(flow, FORM, 3)).toEqual({ kind: "resume", stepIndex: 6 });
  });

  it("does nothing on an ordinary route", () => {
    expect(decideForRoute(flow, LIB, 2)).toEqual({ kind: "none" });
  });

  it("prefers handoff when a route is listed as both", () => {
    const conflicted = { ...flow, pauseRoutes: [AI] };
    expect(decideForRoute(conflicted, AI, 0).kind).toBe("handoff");
  });
});
