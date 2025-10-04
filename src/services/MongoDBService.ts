import { MongoClient } from 'mongodb';
import { SIMILARITY_THRESHOLD } from '@/lib/constants';
import { DBService } from './DBService';
import { OpenAIService } from './OpenAIService';

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/managment';

// Database and collection names
const dbName = 'managment';
const collectionName = 'metadata';

export class MongoDBService implements DBService {
  private async getClient(): Promise<MongoClient> {
    const client = new MongoClient(uri);
    await client.connect();
    return client;
  }

  async getAllPosts(): Promise<string[]> {
    const client = await this.getClient();
    try {
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      const posts = await collection.find({}, { projection: { searchableText: 1 } }).toArray();
      return posts.map(p => p.searchableText);
    } finally {
      await client.close();
    }
  }

  async addPost(text: string): Promise<void> {
    const client = await this.getClient();
    try {
      // Generate embedding for the new post using searchableText
      const embedding = await OpenAIService.generateEmbedding(text);
      
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      
      // Create a simple post structure - you may want to modify this based on your needs
      const document = {
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''), // Use first 50 chars as title
        content: text,
        tag_id: 'general', // Default tag, you can modify this
        searchableText: text,
        embedding: embedding,
        createdAt: new Date()
      };
      
      await collection.insertOne(document);
    } finally {
      await client.close();
    }
  }

  async deletePost(id: string): Promise<void> {
    const client = await this.getClient();
    try {
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      const { ObjectId } = await import('mongodb');
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        throw new Error('Post not found');
      }
    } finally {
      await client.close();
    }
  }

  async getPostsForDisplay(): Promise<Array<{ id: string; text: string; createdAt?: string }>> {
    const client = await this.getClient();
    try {
      console.log('Fetching posts from metadata collection...');
      
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      
      // First, let's check what collections exist
      const collections = await db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
      // Try to find posts in the metadata collection
      const posts = await collection.find({}).sort({ createdAt: -1 }).toArray();
      console.log(`Found ${posts.length} posts in metadata collection`);
      
      if (posts.length === 0) {
        // If no posts found, let's try to check if there are any documents in the collection at all
        const count = await collection.countDocuments();
        console.log(`Total documents in metadata collection: ${count}`);
        
        // Let's also try to find any document to see the structure
        const anyDoc = await collection.findOne({});
        console.log('Sample document structure:', anyDoc);
      } else {
        console.log('Posts found:', posts.map(p => ({ 
          id: p._id.toString(), 
          title: p.title, 
          content: p.content,
          searchableText: p.searchableText 
        })));
      }
      
      return posts.map(p => ({
        id: p._id.toString(),
        text: p.searchableText, // Use searchableText for display
        createdAt: p.createdAt?.toISOString(),
      }));
    } finally {
      await client.close();
    }
  }

  async compareText(text: string): Promise<number> {
    const client = await this.getClient();
    try {
      // Generate embedding for the input text
      const queryEmbedding = await OpenAIService.generateEmbedding(text);
      
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      
      // Perform vector search using MongoDB aggregation pipeline
      const pipeline = [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 10
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            searchableText: 1,
            tag_id: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      
      if (results.length === 0) {
        return 0;
      }

      // Return the highest similarity score
      return results[0].score || 0;
    } finally {
      await client.close();
    }
  }

  async vectorSearch(text: string, limit: number = 10): Promise<Array<{ id: string; text: string; score: number; title?: string; content?: string; tag_id?: string }>> {
    const client = await this.getClient();
    try {
      // Generate embedding for the input text
      const queryEmbedding = await OpenAIService.generateEmbedding(text);
      
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      
      // Perform vector search using MongoDB aggregation pipeline
      const pipeline = [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: limit
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            searchableText: 1,
            tag_id: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      
      return results.map(result => ({
        id: result._id.toString(),
        text: result.searchableText, // Use searchableText for display
        title: result.title,
        content: result.content,
        tag_id: result.tag_id,
        score: result.score || 0
      }));
    } finally {
      await client.close();
    }
  }
}
