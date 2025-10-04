import { SIMILARITY_THRESHOLD } from '@/lib/constants';
import { DBService } from './DBService';
import connectDB from '@/lib/db/mongodb';
import Post from '@/models/Post';

export class MongoDBService implements DBService {
  async getAllPosts(): Promise<string[]> {
    await connectDB();
    const posts = await Post.find({}, { text: 1 }).lean();
    return posts.map(p => p.text);
  }

  async addPost(text: string): Promise<void> {
    await connectDB();
    await Post.create({ text: text.trim() });
  }

  async deletePost(id: string): Promise<void> {
    await connectDB();
    const result = await Post.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Post not found');
    }
  }

  async getPostsForDisplay(): Promise<Array<{ id: string; text: string; createdAt?: string }>> {
    await connectDB();
    const posts = await Post.find({}).sort({ createdAt: -1 });
    return posts.map(p => ({
      id: (p as any)._id.toString(),
      text: p.text,
      createdAt: (p as any).createdAt?.toISOString(),
    }));
  }

  async compareText(text: string): Promise<number> {
    const existingPosts = await this.getAllPosts();
    if (existingPosts.length === 0) {
      return 0;
    }

    return SIMILARITY_THRESHOLD; // Placeholder similarity value
  }
}
