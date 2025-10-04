import { NextRequest, NextResponse } from 'next/server';
import { getDBService } from '@/services/DBService';

export async function GET() {
  try {
    const dbService = getDBService();
    const keywords = await dbService.getKeywordsForDisplay();
    
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required and must be a string' },
        { status: 400 }
      );
    }

    const dbService = getDBService();
    await dbService.addKeyword(keyword);

    return NextResponse.json(
      { message: 'Keyword added successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating keyword:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Keyword already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      );
    }

    const dbService = getDBService();
    await dbService.deleteKeyword(id);

    return NextResponse.json({
      message: 'Keyword deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { error: 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}
