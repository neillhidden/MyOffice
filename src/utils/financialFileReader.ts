import { csvTable } from './financialTables';
import { ImportDraft, tableDrafts, textDrafts } from './homeDocumentImport';
export interface FinancialReadResult {
  text: string;
  sheets?: { name: string; table: string[][] }[];
  drafts?: ImportDraft[];
}
export async function readFinancialFile(
  file: File,
  mode: 'statement' | 'receipt',
  progress: (message: string) => void,
  signal: AbortSignal,
): Promise<FinancialReadResult> {
  if (file.size > 10 * 1024 * 1024)
    throw new Error('O ficheiro excede 10 MB. Divide ou reduz o documento.');
  const cancelled = () => {
    if (signal.aborted) throw new Error('Leitura cancelada.');
  };
  cancelled();
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') {
    const content = await file.text();
    cancelled();
    const table = csvTable(content);
    return { text: content, sheets: [{ name: file.name, table }] };
  }
  if (extension === 'xlsx') {
    progress('A ler o Excel…');
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    cancelled();
    const sheets = workbook.worksheets.map((sheet) => {
      if (sheet.rowCount > 5000 || sheet.columnCount > 100)
        throw new Error(
          'A folha excede 5000 linhas ou 100 colunas. Exporta apenas os movimentos necessários.',
        );
      const table: string[][] = [];
      sheet.eachRow((row) => {
        const values: string[] = [];
        for (let i = 1; i <= sheet.columnCount; i++) {
          const cell = row.getCell(i);
          const v = cell.value;
          if (v instanceof Date)
            values.push(
              `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, '0')}-${String(v.getUTCDate()).padStart(2, '0')}`,
            );
          else if (v && typeof v === 'object' && 'formula' in v)
            values.push(String(v.result ?? ''));
          else values.push(cell.text);
        }
        table.push(values);
      });
      return { name: sheet.name, table };
    });
    return {
      text: sheets[0]?.table.map((r) => r.join('\t')).join('\n') ?? '',
      sheets,
    };
  }
  let worker:
    | Awaited<ReturnType<(typeof import('tesseract.js'))['createWorker']>>
    | undefined;
  const ocr = async (image: HTMLCanvasElement | Blob) => {
    cancelled();
    if (!worker) {
      progress('A preparar a leitura da fotografia…');
      const { createWorker, OEM } = await import('tesseract.js');
      const base = new URL(
        import.meta.env.BASE_URL + 'document-reader/',
        window.location.origin,
      ).href;
      worker = await createWorker('por', OEM.LSTM_ONLY, {
        workerPath: base + 'worker.min.js',
        corePath: base,
        langPath: base,
        logger: (m) => {
          if (m.status === 'recognizing text')
            progress(`A reconhecer texto… ${Math.round(m.progress * 100)}%`);
        },
      });
      signal.addEventListener(
        'abort',
        () => {
          void worker?.terminate();
        },
        { once: true },
      );
    }
    cancelled();
    const r = await worker.recognize(image);
    cancelled();
    return r.data.text;
  };
  try {
    if (extension === 'pdf' || file.type === 'application/pdf') {
      progress('A ler o PDF…');
      const pdfjs = await import('pdfjs-dist');
      const { default: workerUrl } = await import(
        'pdfjs-dist/build/pdf.worker.min.mjs?url'
      );
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const loading = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
      });
      signal.addEventListener(
        'abort',
        () => {
          void loading.destroy();
        },
        { once: true },
      );
      const pdf = await loading.promise;
      try {
        if (pdf.numPages > 20)
          throw new Error(
            'O PDF tem mais de 20 páginas. Divide-o em ficheiros menores.',
          );
        const parts: string[] = [];
        const tables: string[][] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          cancelled();
          progress(`A ler o PDF… página ${pageNumber}/${pdf.numPages}`);
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          const items = content.items
            .filter(
              (i): i is import('pdfjs-dist/types/src/display/api').TextItem =>
                'str' in i && !!i.str.trim(),
            )
            .sort(
              (a, b) =>
                b.transform[5] - a.transform[5] ||
                a.transform[4] - b.transform[4],
            );
          const groups: (typeof items)[] = [];
          for (const item of items) {
            const last = groups[groups.length - 1];
            if (last && Math.abs(last[0].transform[5] - item.transform[5]) < 3)
              last.push(item);
            else groups.push([item]);
          }
          const lines = groups.map((group) =>
            group
              .sort((a, b) => a.transform[4] - b.transform[4])
              .map((i) => i.str)
              .join(' '),
          );
          let pageText = lines.join('\n');
          if (pageText.replace(/\s/g, '').length < 20) {
            const scale = Math.min(
              2,
              2000 / page.getViewport({ scale: 1 }).width,
            );
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            if (canvas.width * canvas.height > 12e6)
              throw new Error(
                'A página é demasiado grande para leitura. Reduz a resolução.',
              );
            await page.render({
              canvas,
              canvasContext: canvas.getContext('2d')!,
              viewport,
            }).promise;
            pageText = await ocr(canvas);
            canvas.width = canvas.height = 0;
          } else if (mode === 'statement') {
            const header = groups.find(
              (g) =>
                g.some((i) => /^data$/i.test(i.str.trim())) &&
                g.some((i) =>
                  /^(?:saldo|debito|débito|credito|crédito|valor|montante)$/i.test(
                    i.str.trim(),
                  ),
                ),
            );
            if (header) {
              const columns = header
                .slice()
                .sort((a, b) => a.transform[4] - b.transform[4]);
              tables.push(columns.map((c) => c.str));
              for (const group of groups.filter(
                (g) => g[0].transform[5] < header[0].transform[5],
              )) {
                const row = columns.map(() => [] as string[]);
                for (const item of group) {
                  let index = 0;
                  for (let j = 1; j < columns.length; j++) {
                    const boundary =
                      (columns[j - 1].transform[4] +
                        columns[j - 1].width +
                        columns[j].transform[4]) /
                      2;
                    if (item.transform[4] >= boundary) index = j;
                  }
                  row[index].push(item.str);
                }
                tables.push(row.map((c) => c.join(' ')));
              }
            }
          }
          parts.push(pageText);
          page.cleanup();
        }
        cancelled();
        const result = { text: parts.join('\n') };
        if (tables.length) {
          try {
            return { ...result, drafts: tableDrafts(tables) };
          } catch {
            return result;
          }
        }
        return result;
      } finally {
        await loading.destroy();
      }
    }
    if (
      ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      ['png', 'jpg', 'jpeg', 'webp'].includes(extension ?? '')
    ) {
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 2500 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas
        .getContext('2d')!
        .drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      const content = await ocr(canvas);
      canvas.width = canvas.height = 0;
      return { text: content };
    }
    throw new Error(
      'Escolhe PDF, CSV, Excel .xlsx ou fotografia PNG/JPEG/WebP. Para Excel antigo .xls, guarda como .xlsx.',
    );
  } catch (e) {
    if (signal.aborted) throw new Error('Leitura cancelada.');
    if (e instanceof Error && /password/i.test(e.message))
      throw new Error(
        'O PDF está protegido. Exporta uma cópia sem palavra-passe.',
      );
    throw e;
  } finally {
    await worker?.terminate();
  }
}
