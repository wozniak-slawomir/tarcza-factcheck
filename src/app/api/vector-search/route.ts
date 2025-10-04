import { NextRequest, NextResponse } from 'next/server';
import { getDBService } from '@/services/DBService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, limit = 10 } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    const dbService = getDBService();
    const results = await dbService.vectorSearch(text, limit);

    return NextResponse.json({ 
      results: results.map(result => ({
        ...result,
        score: parseFloat(result.score.toFixed(4)) // Return as float with 4 decimal places
      }))
    });
  } catch (error) {
    console.error('Error in /api/vector-search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
