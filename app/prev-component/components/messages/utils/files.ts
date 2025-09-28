export function extractUrls(text: string): string[] {
  const regex = new RegExp('https?:\\/\\/[^\\s]+', 'g');
  const urls = [] as string[];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) urls.push(m[0]);
  return urls;
}

export function basenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const base = u.pathname.split('/').filter(Boolean).pop() || 'download';
    return decodeURIComponent(base);
  } catch {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1] || 'download');
  }
}

export function isImageUrl(url: string): boolean {
  const re = new RegExp('\\.(png|jpe?g|gif|webp|svg|bmp|tiff?)(?:$|\\?)', 'i');
  return re.test(url);
}

export function getExtension(name: string): string {
  const re = new RegExp('\\.([a-z0-9]+)(?:$|\\?)', 'i');
  const m = re.exec(name);
  return (m?.[1] || '').toLowerCase();
}

export function safeUrl(s: string) {
  try {
    const u = new URL(s);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch {}
  return '';
}

export function parseFileMessage(text: string): { url: string; name: string } | null {
  const urls = extractUrls(text).map(safeUrl).filter(Boolean);
  if (urls.length !== 1) return null;
  const url = urls[0] as string;
  if (isImageUrl(url)) return null;
  const before = text.split(url)[0]?.trim();
  const nameRaw = before && !before.startsWith('http') ? before : basenameFromUrl(url);
  const name = nameRaw.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').slice(0, 120);
  return { url, name };
}
