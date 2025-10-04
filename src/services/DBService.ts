import { VectorService, VectorSearchResult, PostItem } from './VectorService';
import { UrlSimilarityService } from './UrlSimilarityService';

export interface DBService {
  getAllPosts(): Promise<string[]>;
  addPost(text: string, url?: string): Promise<void>;
  deletePost(id: string): Promise<void>;
  getPostsForDisplay(): Promise<PostItem[]>;
  compareText(text: string): Promise<number>;
  vectorSearch(text: string, limit?: number): Promise<VectorSearchResult[]>;
  vectorSearch(embedding: number[], limit?: number): Promise<VectorSearchResult[]>;
  checkURL(url: string): Promise<{ similarity: number; matchedUrl?: string; warning: boolean }>;
}

class DBServiceImpl implements DBService {
  private vectorService: VectorService;
  private urlSimilarityService: UrlSimilarityService;

  constructor() {
    this.vectorService = new VectorService();
    this.urlSimilarityService = new UrlSimilarityService();
  }

  async getAllPosts(): Promise<string[]> {
    return this.vectorService.getAllPosts();
  }

  async addPost(text: string, url?: string): Promise<void> {
    return this.vectorService.addPost(text, url);
  }

  async deletePost(id: string): Promise<void> {
    return this.vectorService.deletePost(id);
  }

  async getPostsForDisplay(): Promise<PostItem[]> {
    return this.vectorService.getPostsForDisplay();
  }

  async compareText(text: string): Promise<number> {
    return this.vectorService.compareText(text);
  }

  async vectorSearch(text: string, limit?: number): Promise<VectorSearchResult[]>;
  async vectorSearch(embedding: number[], limit?: number): Promise<VectorSearchResult[]>;
  async vectorSearch(textOrEmbedding: string | number[], limit: number = 10): Promise<VectorSearchResult[]> {
    if (typeof textOrEmbedding === 'string') {
      return this.vectorService.vectorSearch(textOrEmbedding, limit);
    } else {
      return this.vectorService.vectorSearch(textOrEmbedding, limit);
    }
  }

  async checkURL(url: string): Promise<{ similarity: number; matchedUrl?: string; warning: boolean }> {
    return this.vectorService.checkURL(url, this.urlSimilarityService);
  }
}

let dbServiceInstance: DBService | null = null;

export function getDBService(): DBService {
  if (!dbServiceInstance) {
    dbServiceInstance = new DBServiceImpl();
  }
  return dbServiceInstance;
}
