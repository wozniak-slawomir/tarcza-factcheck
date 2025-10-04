"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IconTrash, IconExternalLink } from "@tabler/icons-react";
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
          <TableCell colSpan={5} className="h-24 text-center">
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
          <TableCell colSpan={5} className="h-24 text-center text-destructive">
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
          <TableCell colSpan={5} className="h-24 text-center">
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
              <HoverCardTrigger className="cursor-pointer hover:underline">
                {post.text}
              </HoverCardTrigger>
              <HoverCardContent side="top" align="start" className="max-w-lg">
                <div className="space-y-2">
                  <p className="font-medium">{post.title || 'Untitled'}</p>
                  <p className="text-sm">{post.text}</p>
                  {post.url && (
                    <div className="pt-2 border-t">
                      <a 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                      >
                        {post.url}
                      </a>
                    </div>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          </TableCell>
          <TableCell>
            {post.is_fake === true ? (
              <Badge variant="destructive" className="text-xs">
                FAKE
              </Badge>
            ) : post.is_fake === false ? (
              <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700 text-white">
                REAL
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                UNKNOWN
              </Badge>
            )}
          </TableCell>
          <TableCell className="max-w-xs">
            {post.url ? (
              <div className="flex items-center gap-2">
                <a 
                  href={post.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate text-sm underline"
                  title={post.url}
                >
                  {post.url.length > 30 ? `${post.url.substring(0, 30)}...` : post.url}
                </a>
                <IconExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">Brak URL</span>
            )}
          </TableCell>
          <TableCell className="text-right">
            {post.createdAt ? formatTimestamp(post.createdAt) : "-"}
          </TableCell>
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
