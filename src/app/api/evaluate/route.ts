import { NextRequest, NextResponse } from 'next/server';
import { getDBService } from '@/services/DBService';
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

    const dbService = getDBService();
    const similarity = await dbService.compareText(text);
    
    const flagged = similarity > SIMILARITY_THRESHOLD;

    return NextResponse.json({ 
      flagged,
      similarity
    });
  } catch (error) {
    console.error('Error in /api/evaluate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
