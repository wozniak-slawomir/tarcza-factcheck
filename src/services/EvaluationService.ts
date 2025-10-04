import { getDBService } from './DBService';
import { OpenAIServiceInterface } from './OpenAIServiceInterface';
import { SIMILARITY_THRESHOLD } from '@/lib/constants';

export interface EvaluationRequest {
  text: string;
}

export interface EvaluationResult {
  flagged: boolean;
  confidence: number;
  reasoning: string;
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
   * Creates a low-confidence evaluation result when similarity is below threshold
   */
  private createBelowThresholdResult(similarity: number): EvaluationResult {
    return {
      flagged: false,
      confidence: parseFloat(similarity.toFixed(4)),
      reasoning: 'Content similarity is below threshold, no significant matches found in database',
    };
  }

  /**
   * Formats related posts into a context string for the AI prompt
   */
  private formatRelatedPostsContext(posts: VectorSearchResult[]): string {
    if (posts.length === 0) {
      return 'No related posts found.';
    }

    return posts
      .map((post, index) => {
        const title = post.title || 'N/A';
        const content = post.content || post.text;
        const score = post.score.toFixed(4);

        return `${index + 1}. (Similarity: ${score})\nTitle: ${title}\nContent: ${content}`;
      })
      .join('\n\n');
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

Provide a JSON response with the following structure:
{
  "flagged": true | false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;
  }

  /**
   * Parses the AI response and extracts the evaluation result
   */
  private parseAIResponse(aiResponse: string): EvaluationResult {
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
            confidence: Math.max(0, Math.min(1, parsed.confidence)),
            reasoning: parsed.reasoning,
          };
        }
      }

      return this.createFallbackEvaluationResult(aiResponse);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.createFallbackEvaluationResult(aiResponse);
    }
  }

  /**
   * Creates a fallback evaluation result when AI response parsing fails
   */
  private createFallbackEvaluationResult(aiResponse: string): EvaluationResult {
    return {
      flagged: false,
      confidence: 0.5,
      reasoning: aiResponse || 'Unable to parse AI response',
    };
  }

  /**
   * Performs the complete evaluation process for a given text
   */
  async evaluateText(text: string): Promise<EvaluationResult> {
    console.log('Evaluating text similarity using Qdrant...');
    const similarity = await this.dbService.compareText(text);

    if (similarity <= SIMILARITY_THRESHOLD) {
      console.log(
        `Similarity ${similarity.toFixed(4)} below threshold ${SIMILARITY_THRESHOLD}, skipping AI analysis`
      );
      return this.createBelowThresholdResult(similarity);
    }

    console.log(
      `Similarity ${similarity.toFixed(4)} above threshold ${SIMILARITY_THRESHOLD}, performing AI analysis`
    );

    const relatedPosts = await this.dbService.vectorSearch(text, 5);
    const relatedPostsContext = this.formatRelatedPostsContext(relatedPosts);
    const prompt = this.generateEvaluationPrompt(text, similarity, relatedPostsContext);

    const aiResponse = await this.openAIService.prompt(prompt);

    return this.parseAIResponse(aiResponse);
  }
}