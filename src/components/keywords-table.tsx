"use client";

import { Input } from "@/components/ui/input";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCirclePlus,
  IconX,
} from "@tabler/icons-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import React from "react";

type KeywordItem = { id: string; keyword: string; createdAt: string | null };

function useKeywords() {
  const [keywords, setKeywords] = React.useState<KeywordItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/keywords", { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
      } catch (err) {
        if (typeof err === "object" && err !== null) {
          const name = (err as { name?: unknown }).name;
          if (name === "AbortError") return;
        }
        console.error("Failed to load keywords", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, []);

  // expose reload so caller can refresh after mutations
  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keywords");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
    } catch (err) {
      console.error("Failed to reload keywords", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return { keywords, loading, error, reload } as const;
}

export default function KeywordsTable() {
  const [page, setPage] = React.useState(0);
  const [inputValue, setInputValue] = React.useState<string>("");
  const pageSize = 8;
  const { keywords, loading, error, reload } = useKeywords();
  const [adding, setAdding] = React.useState(false);
  const [deletingIds, setDeletingIds] = React.useState<string[]>([]);

  const pageCount = Math.max(1, Math.ceil(keywords.length / pageSize));

  React.useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [pageCount, page]);

  const paginatedKeywords = keywords.slice(page * pageSize, (page + 1) * pageSize);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays <= 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    // Older than 7 days - show localized date
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const addKeyword = (keyword: string) => {
    return (async () => {
      if (!keyword || !keyword.trim()) return;
      try {
        setAdding(true);
        const res = await fetch("/api/keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: keyword.trim() }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error || `HTTP ${res.status}`);
        }
        // clear input and reload list
        setInputValue("");
        await reload();
      } catch (err) {
        console.error("Failed to add keyword", err);
        // optional: expose an error UI; for now, keep console log
      } finally {
        setAdding(false);
      }
    })();
  };
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>
          <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums mt-5">Słowa kluczowe:</CardTitle>
        <CardAction>
          <Button onClick={() => addKeyword(inputValue)} disabled={adding}>
            <IconCirclePlus />
            {adding ? "Dodawanie..." : "Dodaj"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Słowo</TableHead>
              <TableHead className="text-right">Data dodania</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : paginatedKeywords.length ? (
              paginatedKeywords.map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell className="font-medium">{kw.keyword}</TableCell>
                  <TableCell className="text-right">{kw.createdAt ? formatTimestamp(kw.createdAt) : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        // simple confirm
                        if (!confirm(`Usuń słowo kluczowe: "${kw.keyword}"?`)) return;
                        try {
                          setDeletingIds((s) => [...s, kw.id]);
                          const res = await fetch(`/api/keywords?id=${encodeURIComponent(kw.id)}`, {
                            method: "DELETE",
                          });
                          if (!res.ok) {
                            const body = await res.json().catch(() => ({}));
                            throw new Error(body?.error || `HTTP ${res.status}`);
                          }
                          await reload();
                        } catch (err) {
                          console.error("Failed to delete keyword", err);
                        } finally {
                          setDeletingIds((s) => s.filter((id) => id !== kw.id));
                        }
                      }}
                      disabled={deletingIds.includes(kw.id)}
                    >
                      <IconX />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  No keywords found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0}>
              <IconChevronsLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
              <IconChevronLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= pageCount - 1}>
              <IconChevronRight />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(pageCount - 1)} disabled={page >= pageCount - 1}>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
