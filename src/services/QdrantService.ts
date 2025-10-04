import { QdrantClient } from '@qdrant/js-client-rest';
import { SIMILARITY_THRESHOLD, OPENAI_EMBEDDING_SIZE } from '@/lib/constants';
import { DBService } from './DBService';
import { OpenAIService } from './OpenAIService';

// Qdrant configuration
const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'news_articles';

export class QdrantService implements DBService {
  // Helper method to normalize URLs for comparison
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const normalized = `${urlObj.hostname.toLowerCase()}${urlObj.pathname.toLowerCase()}`.replace(/\/+$/, '');
      return normalized;
    } catch (error) {
      // Fallback to simple normalization if URL parsing fails
      return url.toLowerCase().replace(/\/+$/, '');
    }
  }

  // Levenshtein distance algorithm for string similarity
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1, // substitution
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1      // insertion
          );
        }
      }
    }

    return dp[m][n];
  }

  // Calculate similarity score between two URLs
  private calculateUrlSimilarity(url1: string, url2: string): number {
    const normalized1 = this.normalizeUrl(url1);
    const normalized2 = this.normalizeUrl(url2);

    if (normalized1 === normalized2) {
      return 1.0;
    }

    const distance = this.calculateLevenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const similarity = 1 - (distance / maxLength);

    return similarity;
  }

  async getAllPosts(): Promise<string[]> {
    try {
      // Check if collection exists
      try {
        await qdrantClient.getCollection(COLLECTION_NAME);
      } catch (error) {
        console.log('Collection does not exist');
        return [];
      }

      const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 100,
        with_payload: true,
        with_vector: false
      });

      return scrollResult.points.map(point => 
        (point.payload?.searchableText || point.payload?.content) as string
      );
    } catch (error) {
      console.error('Error fetching posts from Qdrant:', error);
      return [];
    }
  }

  async addPost(text: string, url?: string): Promise<void> {
    try {
      // Check if collection exists, create if not
      try {
        await qdrantClient.getCollection(COLLECTION_NAME);
        console.log('Collection exists');
      } catch (error) {
        console.log('Creating collection...');
        await qdrantClient.createCollection(COLLECTION_NAME, {
          vectors: {
            size: OPENAI_EMBEDDING_SIZE, // OpenAI embedding size
            distance: 'Cosine'
          }
        });
        console.log('Collection created');
      }

      // Generate embedding for the new post
      const embedding = await OpenAIService.generateEmbedding(text);
      
      // Generate unique ID as integer
      const documentId = Math.floor(Math.random() * 1000000000);

      const document = {
        id: documentId,
        vector: embedding,
        payload: {
          title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          content: text,
          tag_id: 'general',
          createdAt: new Date().toISOString(),
          searchableText: text.toLowerCase(),
          url: url || null
        }
      };

      await qdrantClient.upsert(COLLECTION_NAME, {
        points: [document]
      });

      console.log('Document inserted with ID:', documentId);
    } catch (error) {
      console.error('Error adding post to Qdrant:', error);
      throw error;
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      await qdrantClient.delete(COLLECTION_NAME, {
        points: [id]
      });
      console.log('Document deleted with ID:', id);
    } catch (error) {
      console.error('Error deleting post from Qdrant:', error);
      throw new Error('Post not found');
    }
  }

  async getPostsForDisplay(): Promise<Array<{ id: string; text: string; createdAt?: string; url?: string }>> {
    try {
      console.log('Fetching posts from Qdrant collection...');
      
      // Check if collection exists
      try {
        await qdrantClient.getCollection(COLLECTION_NAME);
      } catch (error) {
        console.log('Collection does not exist');
        return [];
      }

      const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 100,
        with_payload: true,
        with_vector: false
      });

      const posts = scrollResult.points.map(point => ({
        id: point.id.toString(),
        text: (point.payload?.searchableText || point.payload?.content) as string,
        createdAt: point.payload?.createdAt as string | undefined,
        url: point.payload?.url as string | undefined
      }));

      console.log(`Found ${posts.length} posts in Qdrant collection`);
      
      return posts;
    } catch (error) {
      console.error('Error fetching posts from Qdrant:', error);
      return [];
    }
  }

  async compareText(text: string): Promise<number> {
    try {
      // Check if collection exists
      try {
        await qdrantClient.getCollection(COLLECTION_NAME);
      } catch (error) {
        console.log('Collection does not exist');
        return 0;
      }

      // Generate embedding for the input text
      const queryEmbedding = await OpenAIService.generateEmbedding(text);
      
      // Perform vector search
      const searchResult = await qdrantClient.search(COLLECTION_NAME, {
        vector: queryEmbedding,
        limit: 1,
        with_payload: true,
        with_vector: false
      });

      if (searchResult.length === 0) {
        return 0;
      }

      // Return the highest similarity score
      return searchResult[0].score || 0;
    } catch (error) {
      console.error('Error comparing text in Qdrant:', error);
      return 0;
    }
  }

  async vectorSearch(text: string, limit: number = 10): Promise<Array<{ id: string; text: string; score: number; title?: string; content?: string; tag_id?: string }>> {
    try {
      // Check if collection exists
      try {
        await qdrantClient.getCollection(COLLECTION_NAME);
      } catch (error) {
        console.log('Collection does not exist');
        return [];
      }

      // Generate embedding for the input text
      const queryEmbedding = await OpenAIService.generateEmbedding(text);
      
      // Perform vector search
      const searchResult = await qdrantClient.search(COLLECTION_NAME, {
        vector: queryEmbedding,
        limit: limit,
        with_payload: true,
        with_vector: false
      });

      return searchResult.map(point => ({
        id: point.id.toString(),
        text: (point.payload?.searchableText || point.payload?.content) as string,
        title: point.payload?.title as string | undefined,
        content: point.payload?.content as string | undefined,
        tag_id: point.payload?.tag_id as string | undefined,
        score: point.score || 0
      }));
    } catch (error) {
      console.error('Error performing vector search in Qdrant:', error);
      return [];
    }
  }

  async checkURL(url: string): Promise<{ similarity: number; matchedUrl?: string; warning: boolean }> {
    try {
      console.log('Checking URL similarity in Qdrant...');
      
      // Check if collection exists
      try {
        await qdrantClient.getCollection(COLLECTION_NAME);
      } catch (error) {
        console.log('Collection does not exist');
        return { similarity: 0, warning: false };
      }

      // Fetch all documents with URLs
      const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 1000,
        with_payload: true,
        with_vector: false
      });

      let highestSimilarity = 0;
      let mostSimilarUrl: string | undefined;

      // Compare with all URLs in the database
      for (const point of scrollResult.points) {
        if (point.payload && point.payload.url) {
          const existingUrl = point.payload.url as string;
          const similarity = this.calculateUrlSimilarity(url, existingUrl);

          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            mostSimilarUrl = existingUrl;
          }
        }
      }

      const warning = highestSimilarity >= 0.9;

      console.log(`Highest URL similarity: ${(highestSimilarity * 100).toFixed(2)}%`);
      if (warning && mostSimilarUrl) {
        console.log(`Matched URL: ${mostSimilarUrl}`);
      }

      return {
        similarity: highestSimilarity,
        matchedUrl: warning ? mostSimilarUrl : undefined,
        warning
      };
    } catch (error) {
      console.error('Error checking URL in Qdrant:', error);
      throw error;
    }
  }
}
