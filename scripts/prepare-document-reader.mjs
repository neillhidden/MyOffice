import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const target = path.join(root, 'public/document-reader');
await mkdir(target, { recursive: true });
for (const kind of ['lstm', 'simd-lstm', 'relaxedsimd-lstm'])
  for (const extension of ['wasm.js', 'wasm'])
    await copyFile(
      path.join(
        root,
        'node_modules/tesseract.js-core',
        `tesseract-core-${kind}.${extension}`,
      ),
      path.join(target, `tesseract-core-${kind}.${extension}`),
    );
await copyFile(
  path.join(root, 'node_modules/tesseract.js/dist/worker.min.js'),
  path.join(target, 'worker.min.js'),
);
await copyFile(
  path.join(
    root,
    'node_modules/@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz',
  ),
  path.join(target, 'por.traineddata.gz'),
);
console.log(
  'Leitor local PDF/OCR preparado; nenhum documento é enviado a terceiros.',
);
