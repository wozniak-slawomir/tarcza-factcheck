"use client";

import * as React from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { IconCirclePlus } from "@tabler/icons-react";
import { usePosts } from "@/hooks/use-posts";
import { usePagination } from "@/hooks/use-pagination";
import { useTrends } from "@/hooks/use-trends";
import { AddPostForm } from "./add-post-form";
import { PostsTable } from "./posts-table";
import { TrendsSection } from "./trends-section";
import { PaginationControls } from "./pagination-controls";

export default function PostList() {
  const [addingPost, setAddingPost] = React.useState(false);
  const pageSize = 8;
  const { posts, loading, error, reloadPosts } = usePosts();
  const { trends, chartData, chartConfig } = useTrends(posts, { windowMinutes: 60, topN: 8, minRecentOccurrences: 1 });
  const { page, setPage, pageCount, paginatedItems } = usePagination(posts.length, pageSize);

  const paginatedPosts = paginatedItems(posts);

  const handleAddPost = async (text: string, url: string | undefined) => {
    try {
      setAddingPost(true);
      const res = await fetch("/api/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, url }),
      });
      if (!res.ok) throw new Error("Failed to add post");

      await reloadPosts();
    } catch (err) {
      console.error("Error adding post:", err);
      alert("Nie udało się dodać posta");
    } finally {
      setAddingPost(false);
    }
  };

  const handleDeletePost = async (id: string) => {
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
            <AddPostForm onAddPost={handleAddPost} addingPost={addingPost} />
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums mt-5">Wszystkie posty: {posts.length}</CardTitle>
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
            <PostsTable posts={paginatedPosts} loading={loading} error={error} onDeletePost={handleDeletePost} />
          </Table>
          <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} />
        </CardContent>
      </Card>
      <Card className="@container/card">
        <TrendsSection trends={trends} chartData={chartData} chartConfig={chartConfig} />
      </Card>
    </div>
  );
}
