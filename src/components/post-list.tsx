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
  IconTrash,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "./ui/textarea";

type PostItem = { id: string; text: string; createdAt: string | null };

function usePosts() {
  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadPosts = React.useCallback(async (signal?: AbortSignal) => {
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

  React.useEffect(() => {
    const ac = new AbortController();
    loadPosts(ac.signal);
    return () => ac.abort();
  }, [loadPosts]);

  return { posts, loading, error, reloadPosts: loadPosts } as const;
}

export default function PostList() {
  const [page, setPage] = React.useState(0);
  const [newText, setNewText] = React.useState("");
  const [addingPost, setAddingPost] = React.useState(false);
  const pageSize = 8;
  const { posts, loading, error, reloadPosts } = usePosts();

  const pageCount = Math.max(1, Math.ceil(posts.length / pageSize));

  React.useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [pageCount, page]);

  const paginatedPosts = posts.slice(page * pageSize, (page + 1) * pageSize);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 10) return "teraz";
    if (diffSec < 60) return `${diffSec} sekund temu`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minut${diffMin === 1 ? "ę" : ""} temu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} godzin${diffHour === 1 ? "ę" : ""} temu`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays <= 7) return `${diffDays} dni temu`;

    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleAddPost = async () => {
    if (!newText.trim()) return;

    try {
      setAddingPost(true);
      const res = await fetch("/api/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      });

      if (!res.ok) throw new Error("Failed to add post");

      setNewText("");
      await reloadPosts();
    } catch (err) {
      console.error("Error adding post:", err);
      alert("Nie udało się dodać posta");
    } finally {
      setAddingPost(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten post?")) return;

    try {
      const res = await fetch(`/api/text?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete post");

      await reloadPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Nie udało się usunąć posta");
    }
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>
            <form action="submit" className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Textarea
                  placeholder="Wprowadź tekst posta..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddPost();
                    }
                  }}
                  maxLength={1500}
                  className="min-h-[80px] max-h-40 pr-10"
                />
                <div className="pointer-events-none absolute right-2 bottom-2 text-xs">
                  <span className={newText.length >= 1500 ? "text-destructive" : "text-muted-foreground"}>
                    {newText.length}
                  </span>
                  <span className="text-muted-foreground">/1500</span>
                </div>
              </div>
              <Button onClick={handleAddPost} disabled={addingPost || !newText.trim()}>
                <IconCirclePlus />
                Dodaj
              </Button>
            </form>
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums mt-5">Posty w bazie:</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Tekst</TableHead>
                <TableHead className="text-right">Data dodania</TableHead>
                <TableHead className="text-right w-[50px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Ładowanie...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : paginatedPosts.length ? (
                paginatedPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-xs truncate">{post.text}</TableCell>
                    <TableCell className="text-right">
                      {post.createdAt ? formatTimestamp(post.createdAt) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id)}>
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Brak postów w bazie.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Strona {page + 1} z {pageCount}
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
          <CardDescription>Nowe posty</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{posts.length}</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              Łącznie
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Wszystkie posty w bazie danych</div>
          <div className="text-muted-foreground">System porównywania tekstów</div>
        </CardFooter>
      </Card>
    </div>
  );
}
