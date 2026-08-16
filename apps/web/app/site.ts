export const site = {
  name: "cairnkit",
  url: "https://cairnkit.dev",
  tagline: "In-app product tours that fail your build, not your users.",
  description:
    "Open-source product tours for React. Tours are typed data in your repo, and `cairnkit check` fails CI when one points at UI that no longer exists.",
  repo: "https://github.com/cairnkit/cairnkit",
  npm: "https://www.npmjs.com/package/@cairnkit/react",
  /**
   * The hosted companion, and the only paid thing cairnkit has.
   *
   * This site had no link to it at all, in either direction — cloud linked back
   * here from its header, hero and footer, and nothing here pointed forward. So
   * the property with the npm traffic and the docs SEO sent nobody to the one
   * page collecting addresses, and the waitlist could only be found by people
   * who already knew it existed.
   */
  cloud: "https://cloud.cairnkit.dev",
  email: "hello@cairnkit.dev",
  author: "theartisticprogrammer",
  authorUrl: "https://github.com/NjohPrince",
} as const;
