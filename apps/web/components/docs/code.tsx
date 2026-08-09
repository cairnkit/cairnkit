import { Snippet } from "@/components/ui/snippet";

/**
 * Docs code blocks.
 *
 * Delegates to the shared snippet so docs and the playground cannot diverge.
 * This div used to carry no CSS at all, which is why a long line pushed the
 * whole page sideways on a phone.
 */
export function Code({ file, children }: { file?: string; children: string }) {
  return <Snippet code={children} file={file} max={520} />;
}
