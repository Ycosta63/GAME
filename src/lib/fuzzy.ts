function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

// Unicode "combining diacritical marks" block (U+0300-U+036F), built
// from numeric code points so no literal combining glyph sits in the
// source file itself.
const COMBINING_DIACRITICS = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g"
);

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim();
}

/**
 * Typo-tolerant title search: exact substring match first (fast path,
 * covers most searches), then falls back to edit-distance against the
 * whole title and each of its words so small typos ("elde ring") still
 * find "Elden Ring". The threshold scales with query length so short
 * queries ("gta") stay strict instead of matching half the library.
 */
export function fuzzyMatch(title: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const t = normalize(title);
  if (t.includes(q)) return true;

  const threshold = q.length <= 3 ? 1 : q.length <= 6 ? 2 : 3;
  if (levenshtein(t, q) <= threshold) return true;
  return t.split(/\s+/).some((word) => levenshtein(word, q) <= threshold);
}
