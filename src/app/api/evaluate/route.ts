import { NextRequest, NextResponse } from 'next/server';
import { getDBService } from '@/services/DBService';
import { OpenAIService } from '@/services/OpenAIService';
import { SIMILARITY_THRESHOLD } from '@/lib/constants';

/**
 * Configuration constants for the evaluation process
 */
const EVALUATION_CONFIG = {
  VECTOR_SEARCH_LIMIT: 5,
  DEFAULT_CONFIDENCE: 0.5,
  DECIMAL_PRECISION: 4,
} as const;

/**
 * Type definitions for the evaluation process
 */
interface EvaluationRequest {
  text: string;
}

interface EvaluationResult {
  flagged: boolean;
  confidence: number;
  reasoning: string;
}

interface VectorSearchResult {
  id: string;
  text: string;
  score: number;
  title?: string;
  content?: string;
  tag_id?: string;
}

/**
 * Validates the incoming request body
 * @param body - The request body to validate
 * @returns The validated text or null if invalid
 */
function validateRequestBody(body: unknown): string | null {
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
 * @param similarity - The similarity score
 * @returns An evaluation result indicating no significant matches
 */
function createBelowThresholdResult(similarity: number): EvaluationResult {
  return {
    flagged: false,
    confidence: parseFloat(similarity.toFixed(EVALUATION_CONFIG.DECIMAL_PRECISION)),
    reasoning: 'Content similarity is below threshold, no significant matches found in database',
  };
}

/**
 * Formats related posts into a context string for the AI prompt
 * @param posts - Array of related posts from vector search
 * @returns Formatted string containing post information
 */
function formatRelatedPostsContext(posts: VectorSearchResult[]): string {
  if (posts.length === 0) {
    return 'No related posts found.';
  }

  return posts
    .map((post, index) => {
      const title = post.title || 'N/A';
      const content = post.content || post.text;
      const score = post.score.toFixed(EVALUATION_CONFIG.DECIMAL_PRECISION);
      
      return `${index + 1}. (Similarity: ${score})\nTitle: ${title}\nContent: ${content}`;
    })
    .join('\n\n');
}

/**
 * Generates the AI prompt for fact-checking evaluation
 * @param text - The text to evaluate
 * @param similarity - The similarity score
 * @param relatedPostsContext - Formatted related posts context
 * @returns The complete prompt string
 */
function generateEvaluationPrompt(
  text: string,
  similarity: number,
  relatedPostsContext: string
): string {
  const formattedSimilarity = similarity.toFixed(EVALUATION_CONFIG.DECIMAL_PRECISION);
  
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
 * @param aiResponse - The raw AI response string
 * @returns Parsed evaluation result or a fallback result
 */
function parseAIResponse(aiResponse: string): EvaluationResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<EvaluationResult>;
      
      // Validate the parsed result has required fields
      if (
        typeof parsed.flagged === 'boolean' &&
        typeof parsed.confidence === 'number' &&
        typeof parsed.reasoning === 'string'
      ) {
        return {
          flagged: parsed.flagged,
          confidence: Math.max(0, Math.min(1, parsed.confidence)), // Clamp between 0 and 1
          reasoning: parsed.reasoning,
        };
      }
    }
    
    // Fallback if JSON parsing fails or validation fails
    return createFallbackEvaluationResult(aiResponse);
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return createFallbackEvaluationResult(aiResponse);
  }
}

/**
 * Creates a fallback evaluation result when AI response parsing fails
 * @param aiResponse - The raw AI response
 * @returns A safe fallback evaluation result
 */
function createFallbackEvaluationResult(aiResponse: string): EvaluationResult {
  return {
    flagged: false,
    confidence: EVALUATION_CONFIG.DEFAULT_CONFIDENCE,
    reasoning: aiResponse || 'Unable to parse AI response',
  };
}

/**
 * Performs the complete evaluation process for a given text
 * @param text - The text to evaluate
 * @returns The evaluation result
 */
async function evaluateText(text: string): Promise<EvaluationResult> {
  const dbService = getDBService();
  
  console.log('Evaluating text similarity using Qdrant...');
  const similarity = await dbService.compareText(text);
  
  if (similarity <= SIMILARITY_THRESHOLD) {
    console.log(
      `Similarity ${similarity.toFixed(EVALUATION_CONFIG.DECIMAL_PRECISION)} ` +
      `below threshold ${SIMILARITY_THRESHOLD}, skipping AI analysis`
    );
    return createBelowThresholdResult(similarity);
  }

  console.log(
    `Similarity ${similarity.toFixed(EVALUATION_CONFIG.DECIMAL_PRECISION)} ` +
    `above threshold ${SIMILARITY_THRESHOLD}, performing AI analysis`
  );
  
  const relatedPosts = await dbService.vectorSearch(
    text,
    EVALUATION_CONFIG.VECTOR_SEARCH_LIMIT
  );
  
  const relatedPostsContext = formatRelatedPostsContext(relatedPosts);
  const prompt = generateEvaluationPrompt(text, similarity, relatedPostsContext);
  
  const aiResponse = await OpenAIService.prompt(prompt);
  
  return parseAIResponse(aiResponse);
}

/**
 * POST endpoint for evaluating text content
 * Checks text similarity against database and performs AI-based fact-checking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = validateRequestBody(body);

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const evaluation = await evaluateText(text);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error in /api/evaluate:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
