export type PropRow = {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description: string;
};

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="doc-table">
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
                {row.required && <span className="doc-req">required</span>}
              </td>
              <td>
                <code className="doc-type">{row.type}</code>
              </td>
              <td>{row.default ? <code>{row.default}</code> : <span className="doc-dash">—</span>}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
