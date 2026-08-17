const EDITION_SUFFIXES = [
  "game of the year edition",
  "goty edition",
  "goty",
  "definitive edition",
  "complete edition",
  "deluxe edition",
  "ultimate edition",
  "enhanced edition",
  "remastered",
  "remaster",
  "director's cut",
  "directors cut",
  "gold edition",
  "standard edition",
  "digital deluxe edition",
  "digital deluxe",
  "anniversary edition",
];

const TRADEMARK_CHARS = /[™®©]/g;
const PUNCTUATION = /[:\-–—_'".,!?]/g;

/**
 * Normalizes a game title so the same game listed slightly differently
 * across launchers (subtitle punctuation, edition suffixes, trademark
 * symbols) collapses to one grouping key.
 */
export function normalizeTitle(name: string): string {
  let n = name.toLowerCase().trim();
  n = n.replace(TRADEMARK_CHARS, "");
  n = n.replace(/\(.*?\)/g, " ");
  n = n.replace(PUNCTUATION, " ");
  n = n.replace(/\s+/g, " ").trim();

  for (const suffix of EDITION_SUFFIXES) {
    if (n.endsWith(suffix)) {
      n = n.slice(0, n.length - suffix.length).trim();
    }
  }

  n = n.replace(/\s+/g, " ").trim();
  return n;
}
