import type { DigestRow, Night } from '../digest/types.js';

const RETRY_FLAG = 3;

// A row is flagged when it retried 3 or more times or its last line failed. The class carries
// the colour; the " !" text carries the meaning for anyone reading without colour.
function flagged(row: DigestRow): boolean {
  return row.retries >= RETRY_FLAG || row.lastStatus === 'fail';
}

function orDash(value: string | null): string {
  return value ?? '—';
}

export function DigestPage({ digest }: { digest: Night }) {
  return (
    <>
      <h1>digest · {digest.night}</h1>
      {digest.badLines > 0 ? <p class="warn">bad lines: {digest.badLines}</p> : null}
      {digest.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {digest.rows.map((row) => {
              const warn = flagged(row);
              return (
                <tr class={warn ? 'warn' : undefined}>
                  <td>
                    {row.job}
                    {warn ? ' !' : null}
                  </td>
                  <td>{orDash(row.owner)}</td>
                  <td>{row.runs}</td>
                  <td>
                    {row.retries}
                    {row.retries >= RETRY_FLAG ? ' !' : null}
                  </td>
                  <td>
                    {row.lastStatus}
                    {row.lastStatus === 'fail' ? ' !' : null}
                  </td>
                  <td>{orDash(row.lastError)}</td>
                  <td>{row.first}</td>
                  <td>{row.last}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
