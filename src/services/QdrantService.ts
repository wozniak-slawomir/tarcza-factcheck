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

      return scrollResult.points.map(point => point.payload.searchableText || point.payload.content);
    } catch (error) {
      console.error('Error fetching posts from Qdrant:', error);
      return [];
    }
  }

  async addPost(text: string): Promise<void> {
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
          searchableText: text.toLowerCase()
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

  async getPostsForDisplay(): Promise<Array<{ id: string; text: string; createdAt?: string }>> {
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
        text: point.payload.searchableText || point.payload.content,
        createdAt: point.payload.createdAt
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
        text: point.payload.searchableText || point.payload.content,
        title: point.payload.title,
        content: point.payload.content,
        tag_id: point.payload.tag_id,
        score: point.score || 0
      }));
    } catch (error) {
      console.error('Error performing vector search in Qdrant:', error);
      return [];
    }
  }
}
