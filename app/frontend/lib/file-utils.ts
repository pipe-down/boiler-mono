export type ValidateOptions = {
  maxEachMB?: number;
  maxCount?: number;
  allowExt?: string[];
};

const DEFAULT_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'hwp', 'docx', 'zip'];

export function validateAndDedupeFiles(
  incoming: File[],
  prev: File[] = [],
  opts: ValidateOptions = {},
) {
  const allowExt = opts.allowExt || DEFAULT_EXT;
  const maxEach = (opts.maxEachMB ?? 10) * 1024 * 1024;
  const maxCount = opts.maxCount ?? 10;
  const filtered = incoming.filter((f) => {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    const okExt = allowExt.includes(ext);
    const okSize = f.size <= maxEach;
    return okExt && okSize;
  });
  const combined = [...prev, ...filtered];
  const seen = new Set<string>();
  const unique = combined.filter((f) => {
    const key = `${f.name}_${f.size}_${(f as any).lastModified}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.slice(0, maxCount);
}
