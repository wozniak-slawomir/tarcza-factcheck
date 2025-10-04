import { getDBService } from './DBService';
import { OpenAIServiceInterface } from './OpenAIServiceInterface';
import { SIMILARITY_THRESHOLD } from '@/lib/constants';

export interface EvaluationRequest {
  text: string;
}

export interface EvaluationResult {
  flagged: boolean;
  similarity: number;
  confidence: number;
  reasoning: string;
  relatedPostsCount?: number;
  relatedPosts?: VectorSearchResult[];
}

export interface VectorSearchResult {
  id: string;
  text: string;
  score: number;
  title?: string;
  content?: string;
  tag_id?: string;
}

export class EvaluationService {
  private dbService = getDBService();
  private openAIService: OpenAIServiceInterface;
  private embeddingCache = new Map<string, number[]>();

  constructor(openAIService: OpenAIServiceInterface) {
    this.openAIService = openAIService;
  }

  /**
   * Validates the incoming request body
   */
  validateRequestBody(body: unknown): string | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const { text } = body as Partial<EvaluationRequest>;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return null;
    }

    return text.trim();
  }

  /**
   * Gets embedding for text with caching to avoid duplicate API calls
   */
  private async getCachedEmbedding(text: string): Promise<number[]> {
    const textHash = text.trim().toLowerCase();
    
    if (this.embeddingCache.has(textHash)) {
      console.log('Using cached embedding for text');
      const cached = this.embeddingCache.get(textHash);
      if (cached) return cached;
    }

    console.log('Generating new embedding for text');
    const embedding = await this.openAIService.generateEmbedding(text);
    this.embeddingCache.set(textHash, embedding);
    
    // Limit cache size to prevent memory issues
    if (this.embeddingCache.size > 100) {
      const firstKey = this.embeddingCache.keys().next().value;
      if (firstKey) this.embeddingCache.delete(firstKey);
    }
    
    return embedding;
  }

  /**
   * Creates a low-confidence evaluation result when similarity is below threshold
   */
  private createBelowThresholdResult(similarity: number): EvaluationResult {
    return {
      flagged: false,
      similarity: parseFloat(similarity.toFixed(4)),
      confidence: parseFloat(similarity.toFixed(4)),
      reasoning: 'Podobieństwo treści jest poniżej progu, nie znaleziono istotnych dopasowań w bazie danych',
      relatedPostsCount: 0,
      relatedPosts: [],
    };
  }

  /**
   * Creates a high-confidence flagged result for exact duplicates (100% similarity)
   */
  private createExactDuplicateResult(similarity: number, relatedPosts: VectorSearchResult[]): EvaluationResult {
    return {
      flagged: true,
      similarity: parseFloat(similarity.toFixed(4)),
      confidence: 1.0, // Maximum confidence for exact duplicates
      reasoning: 'Treść jest w 100% identyczna z istniejącym postem w bazie danych - prawdopodobnie duplikat lub spam',
      relatedPostsCount: relatedPosts.length,
      relatedPosts: relatedPosts,
    };
  }

  /**
   * Formats related posts into a context string for the AI prompt
   * Optimized to avoid unnecessary string operations
   */
  private formatRelatedPostsContext(posts: VectorSearchResult[]): string {
    if (posts.length === 0) {
      return 'No related posts found.';
    }

    // Pre-allocate array for better performance
    const formattedPosts = new Array(posts.length);
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const title = post.title || 'N/A';
      const content = post.content || post.text;
      const score = post.score.toFixed(4);

      formattedPosts[i] = `${i + 1}. (Similarity: ${score})\nTitle: ${title}\nContent: ${content}`;
    }

    return formattedPosts.join('\n\n');
  }

  /**
   * Generates the AI prompt for fact-checking evaluation
   */
  private generateEvaluationPrompt(
    text: string,
    similarity: number,
    relatedPostsContext: string
  ): string {
    const formattedSimilarity = similarity.toFixed(4);

    return `You are a fact-checker assistant. Analyze the following post and determine if it appears to be true, accurate, or potentially misleading based on the related posts from our database.

POST TO EVALUATE:
"${text}"

SIMILARITY SCORE: ${formattedSimilarity} (threshold: ${SIMILARITY_THRESHOLD})

RELATED POSTS FROM DATABASE:
${relatedPostsContext}

Please analyze:
1. Is this post likely to be true based on the related content?
2. Does it contain any potentially misleading or false information?
3. What is your confidence level in this assessment?

Provide a JSON response with the following structure. IMPORTANT: The "reasoning" field MUST be in Polish:
{
  "flagged": true | false,
  "confidence": 0.0-1.0,
  "reasoning": "krótkie wyjaśnienie po polsku"
}`;
  }

  /**
   * Parses the AI response and extracts the evaluation result
   */
  private parseAIResponse(aiResponse: string, similarity: number, relatedPosts: VectorSearchResult[]): EvaluationResult {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Partial<EvaluationResult>;

        if (
          typeof parsed.flagged === 'boolean' &&
          typeof parsed.confidence === 'number' &&
          typeof parsed.reasoning === 'string'
        ) {
          return {
            flagged: parsed.flagged,
            similarity: parseFloat(similarity.toFixed(4)),
            confidence: Math.max(0, Math.min(1, parsed.confidence)),
            reasoning: parsed.reasoning,
            relatedPostsCount: relatedPosts.length,
            relatedPosts: relatedPosts,
          };
        }
      }

      return this.createFallbackEvaluationResult(aiResponse, similarity);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.createFallbackEvaluationResult(aiResponse, similarity);
    }
  }

  /**
   * Creates a fallback evaluation result when AI response parsing fails
   */
  private createFallbackEvaluationResult(aiResponse: string, similarity: number = 0.5): EvaluationResult {
    return {
      flagged: false,
      similarity: parseFloat(similarity.toFixed(4)),
      confidence: 0.5,
      reasoning: aiResponse || 'Nie można przetworzyć odpowiedzi AI',
      relatedPostsCount: 0,
      relatedPosts: [],
    };
  }

  /**
   * Optimized method that gets both similarity and related posts in one operation
   * This avoids duplicate embedding generation and database calls
   */
  private async getSimilarityAndRelatedPosts(text: string): Promise<{ similarity: number; relatedPosts: VectorSearchResult[] }> {
    const embedding = await this.getCachedEmbedding(text);
    
    // Get both similarity (top match) and related posts in one search using cached embedding
    const searchResult = await this.dbService.vectorSearch(embedding, 5);
    
    const similarity = searchResult.length > 0 ? searchResult[0].score || 0 : 0;
    
    return { similarity, relatedPosts: searchResult };
  }

  /**
   * Performs the complete evaluation process for a given text
   */
  async evaluateText(text: string): Promise<EvaluationResult> {
    console.log('Evaluating text similarity using Qdrant...');
    
    // Get both similarity and related posts in one optimized operation
    const { similarity, relatedPosts } = await this.getSimilarityAndRelatedPosts(text);

    // Early return for exact duplicates (100% similarity) - skip AI analysis
    if (similarity >= 0.9999) {
      console.log(
        `Similarity ${similarity.toFixed(4)} is 100% - exact duplicate detected, skipping AI analysis`
      );
      return this.createExactDuplicateResult(similarity, relatedPosts);
    }

    // Early return for low similarity - skip expensive AI analysis
    if (similarity <= SIMILARITY_THRESHOLD) {
      console.log(
        `Similarity ${similarity.toFixed(4)} below threshold ${SIMILARITY_THRESHOLD}, skipping AI analysis`
      );
      return this.createBelowThresholdResult(similarity);
    }

    // Only perform expensive AI analysis for moderate similarity scores
    console.log(
      `Similarity ${similarity.toFixed(4)} above threshold ${SIMILARITY_THRESHOLD}, performing AI analysis`
    );

    const relatedPostsContext = this.formatRelatedPostsContext(relatedPosts);
    const prompt = this.generateEvaluationPrompt(text, similarity, relatedPostsContext);

    const aiResponse = await this.openAIService.prompt(prompt);

    return this.parseAIResponse(aiResponse, similarity, relatedPosts);
  }
}