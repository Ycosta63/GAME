import { normalizeTitle } from "./match";

export interface Classic {
  title: string;
  /** Steam appid — reuses the same public CDN pattern as owned Steam games
   * (no API call, no key needed) for cover art and the store link. */
  appid: number;
  reason: string;
}

/**
 * Small, hand-picked list of widely acclaimed games, deliberately NOT
 * sourced from a "trending" API — there isn't a reliable public one for
 * "what's buzzing in gaming right now" (see conversation). This list is
 * static and reviewed by hand instead: it won't break, go stale in a
 * embarrassing way, or depend on an undocumented endpoint. Update it
 * occasionally by hand rather than trying to automate it.
 */
export const CLASSICS: Classic[] = [
  { title: "Half-Life 2", appid: 220, reason: "La référence FPS narratif qui a redéfini le genre en 2004." },
  { title: "Portal 2", appid: 620, reason: "Puzzle-game culte, écriture et co-op souvent cités comme un sommet du jeu vidéo." },
  { title: "The Witcher 3: Wild Hunt", appid: 292030, reason: "Le RPG en monde ouvert que la plupart des autres essaient d'imiter depuis." },
  { title: "Dark Souls: Remastered", appid: 570940, reason: "A créé tout un sous-genre (le \"souls-like\") à lui seul." },
  { title: "Hollow Knight", appid: 367520, reason: "Metroidvania indé quasi unanimement salué, une référence du genre." },
  { title: "Celeste", appid: 504230, reason: "Plateformer exigeant réputé pour son level design et son écriture sur la santé mentale." },
  { title: "Hades", appid: 1145360, reason: "Roguelike qui a converti énormément de joueurs peu habitués au genre." },
  { title: "Stardew Valley", appid: 413150, reason: "Fait quasiment seul par un développeur, référence du jeu de simulation/vie." },
  { title: "Undertale", appid: 391540, reason: "RPG indé culte, connu pour son ton et ses choix moraux marquants." },
  { title: "Disco Elysium", appid: 632470, reason: "RPG uniquement écrit et dialogué, souvent cité comme un sommet narratif du médium." },
  { title: "Baldur's Gate 3", appid: 1086940, reason: "RPG récent déjà considéré comme une référence du genre." },
  { title: "BioShock", appid: 7670, reason: "FPS narratif culte, connu pour son twist et sa direction artistique." },
  { title: "The Elder Scrolls V: Skyrim", appid: 72850, reason: "Monde ouvert culte, encore massivement joué plus de dix ans après sa sortie." },
  { title: "Terraria", appid: 105600, reason: "Sandbox 2D avec une longévité et une communauté impressionnantes." },
  { title: "Return of the Obra Dinn", appid: 653530, reason: "Jeu d'enquête à la direction artistique unique, très salué pour son game design." },
  { title: "Outer Wilds", appid: 753640, reason: "Exploration spatiale/mystère souvent citée parmi les meilleures découvertes de la dernière décennie." },
  { title: "Slay the Spire", appid: 646570, reason: "A popularisé le deckbuilder-roguelike, copié par de nombreux jeux depuis." },
  { title: "The Stanley Parable", appid: 221910, reason: "Expérience narrative culte sur le choix et la linéarité dans le jeu vidéo." },
  { title: "Papers, Please", appid: 239030, reason: "Jeu indé culte sur la bureaucratie et les dilemmes moraux." },
  { title: "NieR:Automata", appid: 524220, reason: "Action-RPG japonais acclamé pour son écriture et ses multiples fins." },
  { title: "Sekiro: Shadows Die Twice", appid: 814380, reason: "Considéré par beaucoup comme le sommet du combat en jeu d'action." },
];

/** Classics not already present in the given library titles (same
 * normalized-title matching used for cross-launcher duplicate detection),
 * capped to `limit` and shuffled deterministically per day so the section
 * doesn't show the exact same fixed order forever. */
export function missingClassics(
  ownedTitles: string[],
  limit = 8
): Classic[] {
  const owned = new Set(ownedTitles.map(normalizeTitle));
  const missing = CLASSICS.filter((c) => !owned.has(normalizeTitle(c.title)));

  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const rotated = [
    ...missing.slice(dayIndex % missing.length),
    ...missing.slice(0, dayIndex % missing.length),
  ];
  return rotated.slice(0, limit);
}
