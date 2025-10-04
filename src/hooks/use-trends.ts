import { useMemo } from 'react';
import { topWordsFromPosts } from '@/lib/text-utils';
import type { ChartConfig } from '@/components/ui/chart';
import { PostItem } from './use-posts';

interface WordCount {
  word: string;
  count: number;
}

export function useTrends(posts: PostItem[]) {
  const unflaggedPosts = useMemo(() => {
    return posts.filter((p) => !p.flagged);
  }, [posts]);

  const topWords = useMemo(() => {
    const texts: string[] = unflaggedPosts.map((p) => p.text || '');
    return topWordsFromPosts(texts, 3, ['i', 'oraz', 'jak', 'czy', 'etc']);
  }, [unflaggedPosts]);

  const chartData = useMemo(() => {
    if (!topWords || topWords.length === 0) return undefined;

    const sanitize = (s: string) => s.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();

    const items: Array<{ browser: string; visitors: number; fill: string }> = [];

    let othersCount = 0;

    topWords.forEach((t: WordCount, i: number) => {
      if (i < 3) {
        const key = sanitize(t.word);
        items.push({ browser: key, visitors: t.count, fill: `var(--color-${key})` });
      } else {
        othersCount += t.count;
      }
    });

    if (othersCount > 0) {
      items.push({ browser: 'inne', visitors: othersCount, fill: 'var(--color-muted)' });
    }

    return items;
  }, [topWords]);

  const chartConfig = useMemo(() => {
    const base: ChartConfig = {
      visitors: { label: 'Wystąpienia' },
    };

    if (!topWords || topWords.length === 0) return base;

    const sanitize = (s: string) => s.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();

    topWords.forEach((t: WordCount, i: number) => {
      const key = sanitize(t.word);
      const color = i === 0 ? 'var(--color-primary)' : i === 1 ? '#fc6970' : '#fd9ba0';
      base[key] = { label: t.word, color } as ChartConfig[string];
    });

    if (topWords.length > 3) {
      base['inne'] = { label: 'Inne', color: 'var(--color-muted-foreground)' } as ChartConfig[string];
    }

    return base;
  }, [topWords]);

  return { topWords, chartData, chartConfig };
}