import { NextRequest, NextResponse } from 'next/server';
import { getDBService } from '@/services/DBService';

export async function GET() {
  try {
    const dbService = getDBService();
    const posts = await dbService.getPostsForDisplay();
    
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

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
    await dbService.addPost(text);

    return NextResponse.json(
      { message: 'Post added successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error processing text:', error);
    
    return NextResponse.json(
      { error: 'Failed to process text' },
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
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const dbService = getDBService();
    await dbService.deletePost(id);

    return NextResponse.json({
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
