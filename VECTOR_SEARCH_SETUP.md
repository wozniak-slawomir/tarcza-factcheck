# Vector Search Setup Instructions

## MongoDB Vector Search Configuration

The application now uses MongoDB Vector Search with OpenAI embeddings for similarity detection. Follow these steps to set up the vector search index:

### 1. Create Vector Search Index in MongoDB Atlas

1. Go to your MongoDB Atlas cluster
2. Click on the "Search" tab
3. Click "Create Index"
4. Select "Vector Search" as the index type
5. Use the following configuration:

```javascript
{
  "name": "vector_index",
  "type": "vectorSearch", 
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 1536,
        "similarity": "cosine"
      }
    ]
  }
}
```

### 2. Environment Variables

Make sure your `.env.local` file includes:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://root:y19kqiMeu78d5CQL@social-content-flagging.v0qq5im.mongodb.net/?retryWrites=true&w=majority&appName=social-content-flagging

# Database and Collection Names
MONGODB_DB_NAME=managment
MONGODB_COLLECTION_NAME=metadata

# Admin API Keys
ADMIN_API_KEY_PUBLIC=pporyyjm
ADMIN_API_KEY_PRIVATE=f3ff6c99-7cb0-48bb-86f5-e3ed6cab3928

# OpenAI API Key (add your actual key here)
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Features Added

- **Vector Search**: Uses OpenAI's `text-embedding-3-small` model (1536 dimensions)
- **Similarity Detection**: Cosine similarity with configurable threshold
- **Test Page**: `/test-post` for testing post matching
- **API Endpoints**:
  - `POST /api/evaluate` - Returns similarity score and flagging decision
  - `POST /api/vector-search` - Returns similar posts with scores

### 4. Usage

1. **Add Posts**: Posts are automatically embedded when added via `/api/text`
2. **Test Similarity**: Use `/test-post` page to test text similarity
3. **API Integration**: Use `/api/evaluate` for programmatic similarity checking

### 5. Similarity Threshold

The similarity threshold is set to `0.5` (50%) in `src/lib/constants.ts`. Adjust this value based on your requirements.

### 6. Performance Notes

- Vector search uses `numCandidates: 100` and `limit: 10` for optimal performance
- Embeddings are generated using OpenAI's efficient `text-embedding-3-small` model
- Results are cached in MongoDB for faster subsequent queries
