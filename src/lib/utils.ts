import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Return top N words from an array of texts, excluding stop words.
export function topWordsFromPosts(
  posts: string[],
  topN = 3,
  extraStopWords: string[] = [],
): Array<{ word: string; count: number }> {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  // basic stopwords in Polish and English - extend as needed
  const defaultStops = [
    "i",
    "oraz",
    "jak",
    "czy",
    "a",
    "w",
    "z",
    "na",
    "do",
    "to",
    "the",
    "and",
    "or",
    "of",
    "in",
    "is",
    "it",
    "that",
    "this",
    "for",
    "fake",
    "news",
  ];

  const stopSet = new Set(
    defaultStops.concat(extraStopWords).map((s) => s.toLowerCase()),
  );

  const counts = new Map<string, number>();

  for (const text of posts) {
    if (!text) continue;
    // normalize: lowercase, remove punctuation (keep letters and numbers and spaces)
    const normalized = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized) continue;

    const words = normalized.split(" ");
    for (const w of words) {
      if (!w) continue;
      if (w.length < 2) continue; // skip single-letter tokens
      if (stopSet.has(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }

  const sorted = Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));

  return sorted.slice(0, topN);
}

// Filter posts by a provided predicate (e.g. flagged) and return top words
export function topWordsFromFlaggedPosts<T extends Record<string, unknown>>(
  items: T[],
  isFlagged: (item: T) => boolean = (item) => Boolean(item.flagged),
  topN = 3,
  extraStopWords: string[] = [],
): Array<{ word: string; count: number }> {
  if (!Array.isArray(items) || items.length === 0) return [];
  const flaggedTexts = items.filter(isFlagged).map((it) =>
    String(it.text || "")
  );
  return topWordsFromPosts(flaggedTexts, topN, extraStopWords);
}
