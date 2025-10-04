import { NextRequest, NextResponse } from 'next/server';
import { EvaluationService } from '@/services/EvaluationService';
import { OpenAIService } from '@/services/OpenAIService';

const evaluationService = new EvaluationService(new OpenAIService());

/**
 * POST endpoint for evaluating text content
 * Checks text similarity against database and performs AI-based fact-checking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = evaluationService.validateRequestBody(body);

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const evaluation = await evaluationService.evaluateText(text);

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
