export function Code({ file, children }: { file?: string; children: string }) {
  return (
    <div className="doc-code">
      {file && <div className="doc-code__file">{file}</div>}
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}
