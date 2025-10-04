import { NextRequest, NextResponse } from 'next/server';
import { getDBService } from '@/services/DBService';

export async function GET() {
  try {
    console.log('API: Fetching posts...');
    const dbService = getDBService();
    const posts = await dbService.getPostsForDisplay();
    console.log(`API: Returning ${posts.length} posts`);
    
    return NextResponse.json({ 
      success: true,
      count: posts.length,
      posts: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch posts' 
      },
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
        { 
          success: false,
          error: 'Text is required and must be a string' 
        },
        { status: 400 }
      );
    }

    console.log('API: Adding new post...');
    const dbService = getDBService();
    await dbService.addPost(text);
    console.log('API: Post added successfully');

    return NextResponse.json(
      { 
        success: true,
        message: 'Post added successfully' 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error processing text:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process text' 
      },
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
        { 
          success: false,
          error: 'Post ID is required' 
        },
        { status: 400 }
      );
    }

    console.log('API: Deleting post with ID:', id);
    const dbService = getDBService();
    await dbService.deletePost(id);
    console.log('API: Post deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete post' 
      },
      { status: 500 }
    );
  }
}
