import { useMemo } from "react";
import type { ChartConfig } from "@/components/ui/chart";
import { PostItem } from "./use-posts";

/**
 * Recent-only trending words (Twitter/X style lightweight version)
 * - Only considers posts within a sliding time window (default 60 minutes)
 * - Counts unique word occurrences per post to avoid one post dominating
 * - Ranks by a momentum score = recentOccurrences / ageMinutes (fresh & frequent rises)
 * - Provides enriched metadata so future per-trend actions / drill-down are easy
 */
export interface RecentTrendWord {
  word: string;
  recentOccurrences: number; // number of (post,word) pairs inside window (dedup per post)
  postIds: string[]; // sample post ids (unique) containing the word in window
  firstSeen: Date; // first time within window (could be same as last if single occurrence)
  lastSeen: Date; // last time within window
  ageMinutes: number; // minutes since firstSeen
  momentum: number; // recentOccurrences / (ageMinutes + 1)
  normalizedMomentum: number; // 0-100 scaled relative to current batch
  ratePerMinute: number; // occurrences per minute since firstSeen (burst rate)
}

export interface UseRecentTrendsOptions {
  windowMinutes?: number; // recency window size
  topN?: number; // max number of trends to return
  minRecentOccurrences?: number; // filter noise (defaults to 1)
  extraStopWords?: string[]; // additional stop words
}

const BASE_STOP_WORDS = new Set([
  "i",
  "oraz",
  "jak",
  "czy",
  "a",
  "w",
  "z",
  "na",
  "do",
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
  "to",
  "się",
  "jest",
  "co",
  "tak",
  "ale",
  "tylko",
  "też",
  "być",
  "był",
  "była",
  "było",
  "on",
  "ona",
  "oni",
  "one",
  "jego",
  "jej",
  "ich",
  "ten",
  "ta",
  "to",
  "ci",
  "te",
  "jakiś",
  "jakaś",
  "jakieś",
  "który",
  "która",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/["'`.,!?()\[\]{}:;<>/=+*_#%\-]+/g, " ") // basic punctuation cleanup
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

export function useTrends(
  posts: PostItem[],
  opts: UseRecentTrendsOptions = {},
) {
  const {
    windowMinutes = 60,
    topN = 10,
    minRecentOccurrences = 1,
    extraStopWords = [],
  } = opts;

  const stopWords = useMemo(() => {
    return new Set<string>([
      ...BASE_STOP_WORDS,
      ...extraStopWords.map((s) => s.toLowerCase()),
    ]);
  }, [extraStopWords]);

  const trends = useMemo<RecentTrendWord[]>(() => {
    if (!posts.length) return [];
    const now = Date.now();
    const windowMs = windowMinutes * 60_000;
    const threshold = now - windowMs;

    interface Accum {
      recentOccurrences: number;
      firstSeen: number;
      lastSeen: number;
      postIds: Set<string>;
    }
    const map = new Map<string, Accum>();

    for (const p of posts) {
      if (p.flagged) continue; // ignore flagged posts for cleanliness
      if (!p.text) continue;
      const ts = p.createdAt ? Date.parse(p.createdAt) : now;
      if (Number.isNaN(ts) || ts < threshold) continue; // completely ignore outside the window

      const words = tokenize(p.text);
      const seenInPost = new Set<string>();
      for (const w of words) {
        if (stopWords.has(w)) continue;
        if (seenInPost.has(w)) continue; // de-duplicate within a single post
        seenInPost.add(w);

        const acc = map.get(w) || {
          recentOccurrences: 0,
          firstSeen: ts,
          lastSeen: ts,
          postIds: new Set<string>(),
        };
        acc.recentOccurrences += 1;
        acc.firstSeen = Math.min(acc.firstSeen, ts);
        acc.lastSeen = Math.max(acc.lastSeen, ts);
        acc.postIds.add(p.id);
        map.set(w, acc);
      }
    }

    const items: Omit<RecentTrendWord, "normalizedMomentum">[] = [];
    for (const [word, acc] of map) {
      if (acc.recentOccurrences < minRecentOccurrences) continue;
      const ageMinutes = (now - acc.firstSeen) / 60_000; // age inside window
      const momentum = acc.recentOccurrences / (ageMinutes + 1); // fresh bursts surface to top
      const ratePerMinute = acc.recentOccurrences / (ageMinutes + 1 / 60); // avoid zero division
      items.push({
        word,
        recentOccurrences: acc.recentOccurrences,
        postIds: Array.from(acc.postIds).slice(0, 10),
        firstSeen: new Date(acc.firstSeen),
        lastSeen: new Date(acc.lastSeen),
        ageMinutes,
        momentum,
        ratePerMinute,
      });
    }

    items.sort((a, b) => {
      // Primary: momentum, Secondary: recent occurrences, tertiary: newer lastSeen
      if (b.momentum !== a.momentum) return b.momentum - a.momentum;
      if (b.recentOccurrences !== a.recentOccurrences) {
        return b.recentOccurrences - a.recentOccurrences;
      }
      return b.lastSeen.getTime() - a.lastSeen.getTime();
    });

    const maxMomentum = items.length
      ? Math.max(...items.map((i) => i.momentum))
      : 1;
    const withScale: RecentTrendWord[] = items.slice(0, topN).map((i) => ({
      ...i,
      normalizedMomentum: Math.min(
        100,
        (i.momentum / (maxMomentum || 1)) * 100,
      ),
    }));

    return withScale;
  }, [posts, windowMinutes, topN, minRecentOccurrences, stopWords]);

  // Chart: top 5 recent trends (show occurrences only inside window)
  const chartData = useMemo(() => {
    if (!trends.length) return undefined;
    return trends.slice(0, 5).map((t, i) => ({
      browser: t.word.replace(/[^a-z0-9_-]/gi, "-").toLowerCase(),
      visitors: t.recentOccurrences,
      fill: `var(--color-${i})`,
    }));
  }, [trends]);

  const chartConfig = useMemo(() => {
    const base: ChartConfig = {
      visitors: { label: "Wystąpienia (ostatnia godzina)" },
    };
    trends.slice(0, 5).forEach((t, i) => {
      const key = t.word.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
      const palette = [
        "var(--color-primary)",
        "#fc6970",
        "#fd9ba0",
        "#7dd3fc",
        "#c084fc",
      ];
      base[key] = {
        label: t.word,
        color: palette[i % palette.length],
      } as ChartConfig[string];
    });
    return base;
  }, [trends]);

  return { trends, chartData, chartConfig } as const;
}
