"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconTrash } from "@tabler/icons-react";
import { PostItem } from "@/hooks/use-posts";
import { formatTimestamp } from "@/lib/date-utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";

interface PostsTableProps {
  posts: PostItem[];
  loading: boolean;
  error: string | null;
  onDeletePost: (id: string) => Promise<void>;
}

export function PostsTable({ posts, loading, error, onDeletePost }: PostsTableProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten post?")) return;

    try {
      await onDeletePost(id);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Nie udało się usunąć posta");
    }
  };

  if (loading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            Ładowanie...
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (error) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center text-destructive">
            {error}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (posts.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            Brak postów w bazie.
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {posts.map((post) => (
        <TableRow key={post.id}>
          <TableCell className="font-medium max-w-xs truncate">
            <HoverCard>
              <HoverCardTrigger>{post.text}</HoverCardTrigger>
              <HoverCardContent side="top" align="start" className="max-w-lg">
                {post.text || "-"}
              </HoverCardContent>
            </HoverCard>
          </TableCell>
          <TableCell className="text-right">{post.createdAt ? formatTimestamp(post.createdAt) : "-"}</TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
              <IconTrash className="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
