/**
 * Development-only warnings, without depending on `process`.
 *
 * `core` targets browsers and has no Node types, so reading `process.env`
 * directly would either break the build or force @types/node onto consumers.
 * Bundlers still replace the expression, so the warning is dropped in
 * production builds exactly as it would be otherwise.
 */
function isDevelopment(): boolean {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env;
  return env?.NODE_ENV !== "production";
}

export function devWarn(message: string): void {
  if (isDevelopment()) console.warn(`[cairn] ${message}`);
}
