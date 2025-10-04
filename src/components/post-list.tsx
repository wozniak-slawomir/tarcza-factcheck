"use client";

import * as React from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IconCirclePlus, IconFilter, IconX, IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react";
import { usePosts } from "@/hooks/use-posts";
import { usePagination } from "@/hooks/use-pagination";
import { useTrends } from "@/hooks/use-trends";
import { AddPostForm } from "./add-post-form";
import { PostsTable } from "./posts-table";
import { TrendsSection } from "./trends-section";
import { PaginationControls } from "./pagination-controls";

export default function PostList() {
  const [addingPost, setAddingPost] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'fake' | 'real' | 'unknown'>('all');
  const [sortField, setSortField] = React.useState<'text' | 'status' | 'url' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const pageSize = 8;
  const { posts, loading, error, reloadPosts } = usePosts();
  const { topWords, chartData, chartConfig } = useTrends(posts);

  // Filter and sort posts
  const filteredAndSortedPosts = React.useMemo(() => {
    let filtered = posts;
    
    // Apply filter
    switch (filter) {
      case 'fake':
        filtered = posts.filter(post => post.is_fake === true);
        break;
      case 'real':
        filtered = posts.filter(post => post.is_fake === false);
        break;
      case 'unknown':
        filtered = posts.filter(post => post.is_fake === undefined);
        break;
      default:
        filtered = posts;
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'text':
          aValue = a.text.toLowerCase();
          bValue = b.text.toLowerCase();
          break;
        case 'status':
          aValue = a.is_fake === true ? 0 : a.is_fake === false ? 1 : 2;
          bValue = b.is_fake === true ? 0 : b.is_fake === false ? 1 : 2;
          break;
        case 'url':
          aValue = a.url || '';
          bValue = b.url || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [posts, filter, sortField, sortDirection]);

  const { page, setPage, pageCount, paginatedItems } = usePagination(filteredAndSortedPosts.length, pageSize);

  const paginatedPosts = paginatedItems(filteredAndSortedPosts);

  const handleAddPost = async (text: string, url: string | undefined, is_fake: boolean | undefined) => {
    try {
      setAddingPost(true);
      const res = await fetch("/api/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, url, is_fake }),
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

  const handleSort = (field: 'text' | 'status' | 'url' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'text' | 'status' | 'url' | 'createdAt') => {
    if (sortField !== field) {
      return <IconArrowsSort className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <IconArrowUp className="h-3 w-3 ml-1" /> : 
      <IconArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>
            <AddPostForm onAddPost={handleAddPost} addingPost={addingPost} />
          </CardDescription>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs"
            >
              <IconFilter className="h-3 w-3 mr-1" />
              Wszystkie
            </Button>
            <Button
              variant={filter === 'real' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('real')}
              className="text-xs text-green-600 border-green-200 hover:bg-green-50"
            >
              Prawdziwe
            </Button>
            <Button
              variant={filter === 'fake' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('fake')}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              Fałszywe
            </Button>
            <Button
              variant={filter === 'unknown' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unknown')}
              className="text-xs text-gray-600 border-gray-200 hover:bg-gray-50"
            >
              Nieznane
            </Button>
            {filter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs"
              >
                <IconX className="h-3 w-3 mr-1" />
                Wyczyść filtr
              </Button>
            )}
          </div>

          <CardTitle className="text-2xl font-semibold tabular-nums mt-5">
            {filter === 'all' ? 'Wszystkie posty' : 
             filter === 'real' ? 'Prawdziwe posty' :
             filter === 'fake' ? 'Fałszywe posty' : 'Nieznane posty'}: {filteredAndSortedPosts.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[40%] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('text')}
                >
                  <div className="flex items-center">
                    Tekst
                    {getSortIcon('text')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[20%] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[20%] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('url')}
                >
                  <div className="flex items-center">
                    URL
                    {getSortIcon('url')}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center justify-end">
                    Data dodania
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="text-right w-[50px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <PostsTable posts={paginatedPosts} loading={loading} error={error} onDeletePost={handleDeletePost} />
          </Table>
          <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} />
        </CardContent>
      </Card>
      <Card className="@container/card">
        <TrendsSection topWords={topWords} chartData={chartData} chartConfig={chartConfig} />
      </Card>
    </div>
  );
}
