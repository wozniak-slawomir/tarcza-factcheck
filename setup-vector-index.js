// MongoDB Vector Search Index Setup Script
// Run this in MongoDB Atlas or MongoDB Compass

// 1. First, create the vector search index in MongoDB Atlas
// Go to your MongoDB Atlas cluster -> Search -> Create Index

// 2. Use this configuration for the vector search index:
db.metadata.createSearchIndex({
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
});

// 3. Alternative: If you want to create it via MongoDB shell/compass:
// Use the Atlas UI instead:
// - Go to your cluster
// - Click "Search" tab
// - Click "Create Index"
// - Select "Vector Search" type
// - Use the configuration above

console.log("Vector search index configuration ready!");
console.log("Please create the index using MongoDB Atlas UI or MongoDB Compass");
