import { HomeDocument } from '../types/home';
import { createId } from './ids';
export async function fileDocument(
  file: File,
  title: string,
): Promise<HomeDocument> {
  if (
    !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) ||
    file.size > 1024 * 1024
  )
    throw new Error(
      'O comprovativo para arquivo deve ser PDF/PNG/JPEG até 1 MB.',
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  let raw = '';
  for (let i = 0; i < bytes.length; i += 8192)
    raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return {
    id: createId('read-document'),
    title,
    fileName: file.name,
    mime: file.type as HomeDocument['mime'],
    size: file.size,
    content: btoa(raw),
    uploadedAt: new Date().toISOString(),
    kind: 'receipt',
  };
}
