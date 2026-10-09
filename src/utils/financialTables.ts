export function csvTable(content: string): string[][] {
  if (content.length > 2e6) throw new Error('O CSV excede 2 MB.');
  const first = content.replace(/^\ufeff/, '').split(/\r?\n/)[0];
  const delimiter = first.includes(';')
    ? ';'
    : first.includes('\t')
      ? '\t'
      : ',';
  const result: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '"') {
      if (quoted && content[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && content[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim())) result.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('Aspas incompletas no CSV.');
  row.push(cell);
  if (row.some((c) => c.trim())) result.push(row);
  return result.map((r, i) =>
    i === 0 ? r.map((c) => c.replace(/^\ufeff/, '')) : r,
  );
}
