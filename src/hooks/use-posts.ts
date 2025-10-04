import { useState, useEffect, useCallback } from 'react';

export interface PostItem {
  id: string;
  text: string;
  createdAt: string | null;
  flagged?: boolean;
}

export function usePosts() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await fetch("/api/text", { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setError(null);
    } catch (err) {
      if (typeof err === "object" && err !== null) {
        const name = (err as { name?: unknown }).name;
        if (name === "AbortError") return;
      }
      console.error("Failed to load posts", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    loadPosts(ac.signal);
    return () => ac.abort();
  }, [loadPosts]);

  return { posts, loading, error, reloadPosts: loadPosts } as const;
}