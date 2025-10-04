import { QdrantClient } from '@qdrant/js-client-rest';
import { SIMILARITY_THRESHOLD, OPENAI_EMBEDDING_SIZE } from '@/lib/constants';
import { OpenAIService } from './OpenAIService';
import { OpenAIServiceInterface } from './OpenAIServiceInterface';

export interface VectorSearchResult {
  id: string;
  text: string;
  score: number;
  title?: string;
  content?: string;
  is_fake?: boolean;
  url?: string;
  createdAt?: string;
}

export interface PostItem {
  id: string;
  text: string;
  createdAt?: string;
  url?: string;
  is_fake?: boolean;
  title?: string;
}

// Qdrant configuration
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'news_articles';

export class VectorService {
  private openAIService: OpenAIServiceInterface;

  constructor(openAIService?: OpenAIServiceInterface) {
    this.openAIService = openAIService || new OpenAIService();
  }

  async ensureCollection(): Promise<void> {
    try {
      await qdrantClient.getCollection(COLLECTION_NAME);
    } catch (error) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: OPENAI_EMBEDDING_SIZE,
          distance: 'Cosine'
        }
      });
    }
  }

  async addPost(text: string, url?: string, is_fake?: boolean): Promise<void> {
    await this.ensureCollection();

    const embedding = await this.openAIService.generateEmbedding(text);
    const documentId = Math.floor(Math.random() * 1000000000);

    const document = {
      id: documentId,
      vector: embedding,
      payload: {
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        content: text,
        createdAt: new Date().toISOString(),
        url: url || null,
        is_fake: is_fake || false
      }
    };

    await qdrantClient.upsert(COLLECTION_NAME, {
      points: [document]
    });
  }

  async deletePost(id: string): Promise<void> {
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid post ID: ${id}`);
      }
      
      await qdrantClient.delete(COLLECTION_NAME, {
        points: [numericId]
      });
      
      console.log(`Successfully deleted post with ID: ${numericId}`);
    } catch (error) {
      console.error(`Error deleting post with ID ${id}:`, error);
      throw error;
    }
  }

  async getAllPosts(): Promise<string[]> {
    await this.ensureCollection();

    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 100,
      with_payload: true,
      with_vector: false
    });

    return scrollResult.points.map(point =>
      (point.payload?.content) as string
    );
  }

  async getPostsForDisplay(): Promise<PostItem[]> {
    await this.ensureCollection();

    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 100,
      with_payload: true,
      with_vector: false
    });

    return scrollResult.points.map(point => ({
      id: point.id.toString(),
      text: (point.payload?.content) as string,
      createdAt: point.payload?.createdAt as string | undefined,
      url: point.payload?.url as string | undefined,
      is_fake: point.payload?.is_fake as boolean | undefined,
      title: point.payload?.title as string | undefined
    }));
  }

  async compareText(text: string): Promise<number> {
    await this.ensureCollection();

    const queryEmbedding = await this.openAIService.generateEmbedding(text);

    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: 1,
      with_payload: true,
      with_vector: false
    });

    return searchResult.length > 0 ? searchResult[0].score || 0 : 0;
  }

  async vectorSearch(text: string, limit?: number): Promise<VectorSearchResult[]>;
  async vectorSearch(embedding: number[], limit?: number): Promise<VectorSearchResult[]>;
  async vectorSearch(textOrEmbedding: string | number[], limit: number = 10): Promise<VectorSearchResult[]> {
    await this.ensureCollection();

    const queryEmbedding = typeof textOrEmbedding === 'string' 
      ? await this.openAIService.generateEmbedding(textOrEmbedding)
      : textOrEmbedding;

    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: limit,
      with_payload: true,
      with_vector: false
    });

    return searchResult.map(point => ({
      id: point.id.toString(),
      text: (point.payload?.content) as string,
      title: point.payload?.title as string | undefined,
      content: point.payload?.content as string | undefined,
      is_fake: point.payload?.is_fake as boolean | undefined,
      url: point.payload?.url as string | undefined,
      createdAt: point.payload?.createdAt as string | undefined,
      score: point.score || 0
    }));
  }

  async checkURL(url: string, urlSimilarityService: any): Promise<{ similarity: number; matchedUrl?: string; warning: boolean }> {
    await this.ensureCollection();

    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 1000,
      with_payload: true,
      with_vector: false
    });

    let highestSimilarity = 0;
    let mostSimilarUrl: string | undefined;

    for (const point of scrollResult.points) {
      if (point.payload && point.payload.url) {
        const existingUrl = point.payload.url as string;
        const similarity = urlSimilarityService.calculateUrlSimilarity(url, existingUrl);

        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          mostSimilarUrl = existingUrl;
        }
      }
    }

    const warning = highestSimilarity >= 0.9;

    return {
      similarity: highestSimilarity,
      matchedUrl: warning ? mostSimilarUrl : undefined,
      warning
    };
  }
}