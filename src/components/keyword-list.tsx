"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  IconTrendingDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCirclePlus,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  return { keywords, loading, error } as const;
}

export default function KeywordList() {
  const [page, setPage] = React.useState(0);
  const pageSize = 8;
  const { keywords, loading, error } = useKeywords();

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

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>
            <Input />
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums mt-5">Słowa kluczowe:</CardTitle>
          <CardAction>
            <Button>
              <IconCirclePlus />
              Dodaj
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Słowo</TableHead>
                <TableHead className="text-right">Data dodania</TableHead>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pageCount - 1)}
                disabled={page >= pageCount - 1}
              >
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Keywords</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">5</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Acquisition needs attention</div>
        </CardFooter>
      </Card>
    </div>
  );
}
