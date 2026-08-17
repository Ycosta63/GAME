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

// Roman numerals commonly used in game titles (checked longest-first so
// "III" isn't partially matched by "II"). Single-letter roman numerals
// (I, V, X) are deliberately excluded: they're too often stylistic
// branding (e.g. "Mega Man X", "Anno") rather than a sequel number, and
// converting them risks merging two genuinely different games.
const ROMAN_TO_DIGIT: [string, string][] = [
  ["xviii", "18"], ["xvii", "17"], ["xvi", "16"], ["xv", "15"], ["xiv", "14"],
  ["xiii", "13"], ["xii", "12"], ["xi", "11"], ["ix", "9"],
  ["viii", "8"], ["vii", "7"], ["vi", "6"], ["iv", "4"], ["iii", "3"], ["ii", "2"],
];

function romanToDigits(n: string): string {
  return n.replace(/\b([ivx]+)\b/g, (word) => {
    for (const [roman, digit] of ROMAN_TO_DIGIT) {
      if (word === roman) return digit;
    }
    return word;
  });
}

/**
 * Normalizes a game title so the same game listed slightly differently
 * across launchers (subtitle punctuation, edition suffixes, trademark
 * symbols, roman vs. arabic numerals) collapses to one grouping key.
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

  n = romanToDigits(n);
  n = n.replace(/\s+/g, " ").trim();
  return n;
}
