import { NextRequest, NextResponse } from 'next/server';
import { getDBService } from '@/services/DBService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'URL is required and must be a string' 
        },
        { status: 400 }
      );
    }

    console.log('API: Checking URL similarity...');
    const dbService = getDBService();
    const result = await dbService.checkURL(url);
    
    console.log(`API: URL check completed - Similarity: ${(result.similarity * 100).toFixed(2)}%`);

    return NextResponse.json({
      similarity: result.similarity,
      similarityPercentage: `${(result.similarity * 100).toFixed(2)}%`,
      matchedUrl: result.matchedUrl,
      status: result.status,
      message: result.warning 
        ? `Warning: This URL has ${(result.similarity * 100).toFixed(2)}% similarity with an existing URL in our database.`
        : 'URL check completed successfully.'
    });
  } catch (error: any) {
    console.error('Error checking URL:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check URL' 
      },
      { status: 500 }
    );
  }
}
