// Deterministic, muted gradients for games with no cover art (older Steam
// titles without library capsule art, some PSN entries). Same title always
// gets the same gradient, so the shelf stays visually stable between loads.
const GRADIENTS: [string, string][] = [
  ["#3a2712", "#1b1917"], // amber
  ["#16302c", "#1b1917"], // teal
  ["#2c1a2e", "#1b1917"], // plum
  ["#1a2038", "#1b1917"], // indigo
  ["#1a2e1e", "#1b1917"], // forest
  ["#33201a", "#1b1917"], // terracotta
  ["#20242c", "#1b1917"], // slate
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function placeholderGradient(seed: string): string {
  const [from, to] = GRADIENTS[hashString(seed) % GRADIENTS.length];
  return `linear-gradient(155deg, ${from}, ${to})`;
}
