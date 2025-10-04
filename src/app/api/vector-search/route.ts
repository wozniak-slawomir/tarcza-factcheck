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

    console.log('API: Performing vector search using Qdrant...');
    const dbService = getDBService();
    const results = await dbService.vectorSearch(text, limit);

    return NextResponse.json({ 
      success: true,
      query: text,
      results: results.map(result => ({
        ...result,
        score: parseFloat(result.score.toFixed(4)) // Return as float with 4 decimal places
      })),
      count: results.length,
      searchType: 'qdrant'
    });
  } catch (error) {
    console.error('Error in /api/vector-search with Qdrant:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
