import { Suspense } from 'react';
import PostList from '@/components/post-list';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and view all posts in the database
        </p>
      </div>
      
      <Suspense fallback={<div>Loading posts...</div>}>
        <PostList />
      </Suspense>
    </div>
  );
}