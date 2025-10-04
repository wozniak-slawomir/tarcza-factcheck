import { MongoDBService } from './MongoDBService';

export interface DBService {
  getAllPosts(): Promise<string[]>;
  addPost(text: string): Promise<void>;
  deletePost(id: string): Promise<void>;
  getPostsForDisplay(): Promise<Array<{ id: string; text: string; createdAt?: string }>>;
  compareText(text: string): Promise<number>;
  vectorSearch(text: string, limit?: number): Promise<Array<{ id: string; text: string; score: number; title?: string; content?: string; tag_id?: string }>>;
}

let dbServiceInstance: DBService | null = null;

export function getDBService(): DBService {
  if (!dbServiceInstance) {
    dbServiceInstance = new MongoDBService();
  }
  return dbServiceInstance;
}
