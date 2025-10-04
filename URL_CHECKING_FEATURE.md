# URL Checking Feature Documentation

## Overview
This feature adds URL tracking to fake news entries and provides an endpoint to check URL similarity against the database.

## Changes Made

### 1. Database Schema Updates
- Added `url` field to the metadata collection
- URL is stored alongside text content for each fake news entry

### 2. Service Layer Updates

#### DBService Interface (`src/services/DBService.ts`)
- Updated `addPost()` method signature to accept optional `url` parameter
- Added `checkURL()` method for URL similarity checking
- Updated `getPostsForDisplay()` return type to include URL field

#### MongoDBService (`src/services/MongoDBService.ts`)
- Implemented `addPost()` to save URLs with posts
- Implemented `checkURL()` method with URL similarity algorithm
- Added URL normalization logic (removes trailing slashes, normalizes hostname)
- Implemented Levenshtein distance algorithm for string similarity comparison
- Returns warning flag when similarity exceeds 90%

### 3. API Endpoints

#### POST `/api/text` (Updated)
**Request Body:**
```json
{
  "text": "fake news content",
  "url": "https://example.com/article" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post added successfully",
  "url": "https://example.com/article"
}
```

#### POST `/api/checkURL` (New)
**Request Body:**
```json
{
  "url": "https://example.com/article"
}
```

**Response (No Warning):**
```json
{
  "success": true,
  "similarity": 0.45,
  "similarityPercentage": "45.00%",
  "warning": false,
  "message": "URL check completed successfully."
}
```

**Response (Warning - >90% similarity):**
```json
{
  "success": true,
  "similarity": 0.95,
  "similarityPercentage": "95.00%",
  "matchedUrl": "https://example.com/similar-article",
  "warning": true,
  "message": "Warning: This URL has 95.00% similarity with an existing URL in our database."
}
```

## URL Similarity Algorithm

The system uses a combination of:

1. **URL Normalization:**
   - Extracts hostname and pathname from URL
   - Converts to lowercase
   - Removes trailing slashes
   - Falls back to simple string comparison if URL parsing fails

2. **Levenshtein Distance:**
   - Calculates edit distance between normalized URLs
   - Converts distance to similarity percentage
   - Returns 1.0 (100%) for exact matches

3. **Similarity Score:**
   - Formula: `1 - (distance / maxLength)`
   - Returns value between 0.0 and 1.0
   - Warning threshold: 0.9 (90%)

## Usage Examples

### Adding a Post with URL
```javascript
const response = await fetch('/api/text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'This is fake news content',
    url: 'https://fakenews.com/article-123'
  })
});
```

### Checking URL Similarity
```javascript
const response = await fetch('/api/checkURL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://fakenews.com/article-124'
  })
});

const result = await response.json();
if (result.warning) {
  console.warn(`Similar URL found: ${result.matchedUrl}`);
  console.warn(`Similarity: ${result.similarityPercentage}`);
}
```

### Retrieving Posts with URLs
```javascript
const response = await fetch('/api/text');
const { posts } = await response.json();

posts.forEach(post => {
  console.log(`Text: ${post.text}`);
  console.log(`URL: ${post.url || 'No URL'}`);
});
```

## Technical Details

- **Collection:** Uses existing `metadata` collection in `managment` database
- **URL Field:** Nullable string field (null if no URL provided)
- **Query Performance:** Uses projection to fetch only URL field when checking similarity
- **Normalization:** Handles malformed URLs gracefully with fallback logic

## Future Enhancements

Consider implementing:
- URL embedding-based similarity for semantic comparison
- Domain-level blacklisting
- URL pattern matching (regex-based)
- Historical tracking of URL changes
- Batch URL checking endpoint
