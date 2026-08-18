import { describe, expect, it } from "vitest";
import { matchRoute } from "../flows/match-route";
import { decideForRoute } from "../engine/lifecycle";

describe("matchRoute", () => {
  it("matches a plain route exactly, as it always did", () => {
    expect(matchRoute("/settings", "/settings")).toBe(true);
    expect(matchRoute("/settings", "/settings/team")).toBe(false);
    expect(matchRoute("/settings", "/setting")).toBe(false);
    expect(matchRoute("/", "/")).toBe(true);
  });

  it("matches one segment per :param", () => {
    expect(matchRoute("/projects/:slug", "/projects/acme")).toBe(true);
    expect(matchRoute("/projects/:slug", "/projects/acme-2")).toBe(true);
    expect(matchRoute("/orgs/:org/projects/:slug", "/orgs/a/projects/b")).toBe(true);
  });

  it("refuses to let :param swallow a deeper route", () => {
    /*
     * The reason `:param` is one segment. A flow pausing on the project screen
     * must not also pause on everything beneath it, or it goes dormant on a
     * page where a different guide was supposed to take over.
     */
    expect(matchRoute("/projects/:slug", "/projects/acme/settings")).toBe(false);
    expect(matchRoute("/projects/:slug", "/projects")).toBe(false);
  });

  it("matches the rest with a trailing star, but never nothing", () => {
    expect(matchRoute("/docs/*", "/docs/install")).toBe(true);
    expect(matchRoute("/docs/*", "/docs/install/next")).toBe(true);
    // `/docs/*` describing `/docs` itself would make the wildcard mean "or
    // nothing", and a flow would pause on the index it launched from.
    expect(matchRoute("/docs/*", "/docs")).toBe(false);
  });

  it("treats a trailing slash as the same route", () => {
    expect(matchRoute("/settings/", "/settings/")).toBe(true);
    expect(matchRoute("/projects/:slug", "/projects/acme/")).toBe(true);
  });
});

const flow = {
  pauseRoutes: ["/projects/:slug", "/settings"],
  handoffRoutes: [{ pathname: "/ai/:mode", flowId: "other" }],
  resumeAt: [{ pathname: "/projects/:slug/keys", stepIndex: 3 }],
};

describe("decideForRoute with patterns", () => {
  it("pauses on a dynamic detail route", () => {
    // The case this whole change exists for: clicking a row in the projects
    // list used to run the tour on into a page with none of its anchors.
    expect(decideForRoute(flow, "/projects/acme", 4)).toEqual({ kind: "pause" });
  });

  it("still returns none for a route nothing covers", () => {
    expect(decideForRoute(flow, "/team", 4)).toEqual({ kind: "none" });
  });

  it("hands off before it pauses", () => {
    expect(decideForRoute(flow, "/ai/compose", 0)).toEqual({ kind: "handoff", flowId: "other" });
  });

  it("resumes forward on a pattern", () => {
    expect(decideForRoute(flow, "/projects/acme/keys", 1)).toEqual({ kind: "resume", stepIndex: 3 });
    // Never backwards, pattern or not.
    expect(decideForRoute(flow, "/projects/acme/keys", 5)).toEqual({ kind: "none" });
  });
});
