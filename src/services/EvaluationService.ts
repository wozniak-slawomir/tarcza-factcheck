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
  similarityScore?: number;
  matchType?: 'exact' | 'very-high' | 'high' | 'medium' | 'low' | 'none';
}

export interface VectorSearchResult {
  id: string;
  text: string;
  score: number;
  title?: string;
  content?: string;
  tag_id?: string;
}

// Similarity thresholds for different match types
const EXACT_MATCH_THRESHOLD = 0.98;        // 98%+ - Nearly identical content
const VERY_HIGH_SIMILARITY_THRESHOLD = 0.90; // 90-98% - Extremely similar, likely variation
const HIGH_SIMILARITY_THRESHOLD = 0.70;     // 70-90% - Highly related content
const MEDIUM_SIMILARITY_THRESHOLD = SIMILARITY_THRESHOLD; // Config threshold (default 50%)
const LOW_SIMILARITY_THRESHOLD = 0.10;      // 10-threshold% - Weak similarity

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
   * Determines the match type based on similarity score
   */
  private getMatchType(similarity: number): EvaluationResult['matchType'] {
    if (similarity >= EXACT_MATCH_THRESHOLD) return 'exact';
    if (similarity >= VERY_HIGH_SIMILARITY_THRESHOLD) return 'very-high';
    if (similarity >= HIGH_SIMILARITY_THRESHOLD) return 'high';
    if (similarity >= MEDIUM_SIMILARITY_THRESHOLD) return 'medium';
    if (similarity >= LOW_SIMILARITY_THRESHOLD) return 'low';
    return 'none';
  }

  /**
   * Handles exact or near-exact match cases (98%+ similarity)
   */
  private createExactMatchResult(similarity: number, relatedPosts: VectorSearchResult[]): EvaluationResult {
    const matchedPost = relatedPosts.length > 0 ? relatedPosts[0] : null;
    const postReference = matchedPost 
      ? `"${matchedPost.title || matchedPost.text.substring(0, 50)}..."`
      : 'an existing post';

    return {
      flagged: true,
      confidence: 0.98,
      reasoning: `This content is nearly identical (${(similarity * 100).toFixed(1)}% match) to ${postReference} in the database. This appears to be duplicate or plagiarized content.`,
      similarityScore: parseFloat(similarity.toFixed(4)),
      matchType: 'exact',
    };
  }

  /**
   * Handles very high similarity cases (90-98% similarity)
   */
  private createVeryHighSimilarityResult(similarity: number, relatedPosts: VectorSearchResult[]): EvaluationResult {
    const matchedPost = relatedPosts.length > 0 ? relatedPosts[0] : null;
    const postReference = matchedPost 
      ? `"${matchedPost.title || matchedPost.text.substring(0, 50)}..."`
      : 'existing content';

    return {
      flagged: true,
      confidence: 0.90,
      reasoning: `This content is extremely similar (${(similarity * 100).toFixed(1)}% match) to ${postReference}. It may be a slight variation or paraphrase of existing content.`,
      similarityScore: parseFloat(similarity.toFixed(4)),
      matchType: 'very-high',
    };
  }

  /**
   * Handles zero or very low similarity cases (0-10% similarity)
   */
  private createNoSimilarityResult(similarity: number): EvaluationResult {
    return {
      flagged: false,
      confidence: 0.95,
      reasoning: `This content has minimal similarity (${(similarity * 100).toFixed(1)}%) to any existing posts. It appears to be completely original or unrelated to database content.`,
      similarityScore: parseFloat(similarity.toFixed(4)),
      matchType: 'none',
    };
  }

  /**
   * Creates a low-confidence evaluation result when similarity is below threshold
   */
  private createBelowThresholdResult(similarity: number): EvaluationResult {
    const matchType = this.getMatchType(similarity);
    
    if (similarity < LOW_SIMILARITY_THRESHOLD) {
      return this.createNoSimilarityResult(similarity);
    }

    return {
      flagged: false,
      confidence: parseFloat((0.6 + similarity * 0.2).toFixed(4)),
      reasoning: `Content similarity (${(similarity * 100).toFixed(1)}%) is below the threshold of ${(MEDIUM_SIMILARITY_THRESHOLD * 100).toFixed(1)}%. No significant matches found that warrant detailed analysis.`,
      similarityScore: parseFloat(similarity.toFixed(4)),
      matchType,
    };
  }

  /**
   * Handles empty database case
   */
  private createEmptyDatabaseResult(): EvaluationResult {
    return {
      flagged: false,
      confidence: 0.0,
      reasoning: 'Unable to evaluate - no reference posts found in database. This could be the first post or the database is empty.',
      similarityScore: 0,
      matchType: 'none',
    };
  }

  /**
   * Formats related posts into a context string for the AI prompt
   */
  private formatRelatedPostsContext(posts: VectorSearchResult[]): string {
    if (posts.length === 0) {
      return 'No related posts found in the database.';
    }

    return posts
      .map((post, index) => {
        const title = post.title || 'Untitled';
        const content = post.content || post.text;
        const score = (post.score * 100).toFixed(2);
        
        // Truncate very long content
        const truncatedContent = content.length > 300 
          ? content.substring(0, 300) + '...'
          : content;

        return `${index + 1}. [${score}% match]\nTitle: ${title}\nContent: ${truncatedContent}`;
      })
      .join('\n\n');
  }

  /**
   * Generates the AI prompt for fact-checking evaluation
   */
  private generateEvaluationPrompt(
    text: string,
    similarity: number,
    relatedPostsContext: string,
    matchType: EvaluationResult['matchType']
  ): string {
    const formattedSimilarity = (similarity * 100).toFixed(2);
    
    let contextualGuidance = '';
    if (matchType === 'very-high') {
      contextualGuidance = `
NOTE: This content shows VERY HIGH similarity (${formattedSimilarity}%). Focus on:
- Whether this is a legitimate variation or potential plagiarism
- If new information or perspective is added
- Whether the high similarity indicates copy/paste behavior`;
    } else if (matchType === 'high') {
      contextualGuidance = `
NOTE: This content shows HIGH similarity (${formattedSimilarity}%). Focus on:
- Common themes or topics that explain the similarity
- Whether factual claims align with or contradict related posts
- If this adds meaningful new information`;
    } else {
      contextualGuidance = `
NOTE: This content shows MODERATE similarity (${formattedSimilarity}%). Focus on:
- Whether related posts support or contradict claims in this content
- Consistency of facts across similar content
- Potential misinformation or inconsistencies`;
    }

    return `You are a fact-checker assistant. Analyze the following post and determine if it appears to be true, accurate, or potentially misleading based on the related posts from our database.

POST TO EVALUATE:
"${text}"

SIMILARITY ANALYSIS:
- Match Type: ${matchType?.toUpperCase()}
- Similarity Score: ${formattedSimilarity}%
- Threshold: ${(MEDIUM_SIMILARITY_THRESHOLD * 100).toFixed(1)}%
${contextualGuidance}

RELATED POSTS FROM DATABASE:
${relatedPostsContext}

EVALUATION CRITERIA:
1. Factual accuracy compared to related content
2. Potential for misinformation or misleading claims
3. Originality vs. duplication/plagiarism
4. Consistency with established information in the database

Provide a JSON response with the following structure:
{
  "flagged": true | false,
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation of your assessment"
}

Guidelines for confidence scoring:
- 0.9-1.0: Very confident (clear evidence)
- 0.7-0.9: Confident (strong indicators)
- 0.5-0.7: Moderate confidence (some uncertainty)
- 0.3-0.5: Low confidence (unclear evidence)
- 0.0-0.3: Very low confidence (insufficient information)`;
  }

  /**
   * Parses the AI response and extracts the evaluation result
   */
  private parseAIResponse(
    aiResponse: string,
    similarity: number,
    matchType: EvaluationResult['matchType']
  ): EvaluationResult {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Partial<EvaluationResult>;

        if (
          typeof parsed.flagged === 'boolean' &&
          typeof parsed.confidence === 'number' &&
          typeof parsed.reasoning === 'string'
        ) {
          // Calibrate confidence based on similarity score and match type
          let calibratedConfidence = Math.max(0, Math.min(1, parsed.confidence));
          
          // Boost confidence for very high similarity matches
          if (matchType === 'very-high' && parsed.flagged) {
            calibratedConfidence = Math.max(calibratedConfidence, 0.85);
          }
          
          return {
            flagged: parsed.flagged,
            confidence: parseFloat(calibratedConfidence.toFixed(4)),
            reasoning: parsed.reasoning,
            similarityScore: parseFloat(similarity.toFixed(4)),
            matchType,
          };
        }
      }

      return this.createFallbackEvaluationResult(aiResponse, similarity, matchType);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.createFallbackEvaluationResult(aiResponse, similarity, matchType);
    }
  }

  /**
   * Creates a fallback evaluation result when AI response parsing fails
   */
  private createFallbackEvaluationResult(
    aiResponse: string,
    similarity: number,
    matchType: EvaluationResult['matchType']
  ): EvaluationResult {
    // If we have high similarity but AI parsing failed, flag it conservatively
    const shouldFlag = similarity >= HIGH_SIMILARITY_THRESHOLD;
    
    return {
      flagged: shouldFlag,
      confidence: 0.4, // Low confidence due to parsing failure
      reasoning: aiResponse || 'Unable to parse AI response. Manual review recommended.',
      similarityScore: parseFloat(similarity.toFixed(4)),
      matchType,
    };
  }

  /**
   * Performs the complete evaluation process for a given text
   */
  async evaluateText(text: string): Promise<EvaluationResult> {
    try {
      console.log('Evaluating text similarity using Qdrant...');
      const similarity = await this.dbService.compareText(text);
      const matchType = this.getMatchType(similarity);

      console.log(`Similarity: ${(similarity * 100).toFixed(2)}%, Match Type: ${matchType}`);

      // Handle edge case: Exact or near-exact match (98%+)
      if (similarity >= EXACT_MATCH_THRESHOLD) {
        console.log('Exact match detected - flagging as duplicate content');
        const relatedPosts = await this.dbService.vectorSearch(text, 3);
        return this.createExactMatchResult(similarity, relatedPosts);
      }

      // Handle edge case: Very high similarity (90-98%)
      if (similarity >= VERY_HIGH_SIMILARITY_THRESHOLD) {
        console.log('Very high similarity detected - flagging for review');
        const relatedPosts = await this.dbService.vectorSearch(text, 3);
        return this.createVeryHighSimilarityResult(similarity, relatedPosts);
      }

      // Handle edge case: Below threshold
      if (similarity <= MEDIUM_SIMILARITY_THRESHOLD) {
        console.log(
          `Similarity ${(similarity * 100).toFixed(2)}% below threshold ${(MEDIUM_SIMILARITY_THRESHOLD * 100).toFixed(1)}%`
        );
        return this.createBelowThresholdResult(similarity);
      }

      // Medium to high similarity - requires AI analysis
      console.log(
        `Similarity ${(similarity * 100).toFixed(2)}% above threshold, performing AI analysis`
      );

      const relatedPosts = await this.dbService.vectorSearch(text, 5);
      
      // Handle edge case: No related posts found despite high similarity
      if (!relatedPosts || relatedPosts.length === 0) {
        console.warn('High similarity but no related posts found - database may be empty');
        return this.createEmptyDatabaseResult();
      }

      const relatedPostsContext = this.formatRelatedPostsContext(relatedPosts);
      const prompt = this.generateEvaluationPrompt(text, similarity, relatedPostsContext, matchType);

      const aiResponse = await this.openAIService.prompt(prompt);

      return this.parseAIResponse(aiResponse, similarity, matchType);
    } catch (error) {
      console.error('Error in evaluateText:', error);
      
      // Return a safe fallback result on error
      return {
        flagged: false,
        confidence: 0.0,
        reasoning: `Evaluation failed due to an error: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review recommended.`,
        similarityScore: 0,
        matchType: 'none',
      };
    }
  }
}