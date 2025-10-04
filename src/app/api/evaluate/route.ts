import { NextRequest, NextResponse } from 'next/server';
import { getDBService } from '@/services/DBService';
import { OpenAIService } from '@/services/OpenAIService';
import { SIMILARITY_THRESHOLD } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('API: Evaluating text similarity using Qdrant...');
    const dbService = getDBService();
    const similarity = await dbService.compareText(text);
    
    // If similarity is below threshold, skip expensive AI analysis
    if (similarity <= SIMILARITY_THRESHOLD) {
      console.log(`Similarity ${similarity.toFixed(4)} below threshold ${SIMILARITY_THRESHOLD}, skipping AI analysis`);
      return NextResponse.json({ 
        flagged: false,
        similarity: parseFloat(similarity.toFixed(4)),
        relatedPostsCount: 0,
        evaluation: {
          verdict: 'true',
          confidence: 1.0 - similarity, // Higher confidence for lower similarity
          reasoning: 'Content similarity is below threshold, no significant matches found in database',
          recommendation: 'approve'
        },
      });
    }

    // Only perform expensive AI analysis when similarity threshold is met
    console.log(`Similarity ${similarity.toFixed(4)} above threshold ${SIMILARITY_THRESHOLD}, performing AI analysis`);
    const relatedPosts = await dbService.vectorSearch(text, 5);
    
    const relatedPostsContext = relatedPosts.map((post, index) => 
      `${index + 1}. (Similarity: ${post.score.toFixed(4)})\nTitle: ${post.title || 'N/A'}\nContent: ${post.content || post.text}`
    ).join('\n\n');

    const prompt = `You are a fact-checker assistant. Analyze the following post and determine if it appears to be true, accurate, or potentially misleading based on the related posts from our database.

POST TO EVALUATE:
"${text}"

SIMILARITY SCORE: ${similarity.toFixed(4)} (threshold: ${SIMILARITY_THRESHOLD})

RELATED POSTS FROM DATABASE:
${relatedPostsContext || 'No related posts found.'}

Please analyze:
1. Is this post likely to be true based on the related content?
2. Does it contain any potentially misleading or false information?
3. What is your confidence level in this assessment?

Provide a JSON response with the following structure:
{
  "flagged": true | false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
}`;

    const aiResponse = await OpenAIService.prompt(prompt);

    let evaluation;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        evaluation = {
          flagged: false,
          confidence: 0.5,
          reasoning: aiResponse,
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      evaluation = {
        flagged: false,
        confidence: 0.5,
        reasoning: aiResponse,
      };
    }

    return NextResponse.json({
      ...evaluation
    });
  } catch (error) {
    console.error('Error in /api/evaluate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
