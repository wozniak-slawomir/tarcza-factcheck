'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SearchResult {
  id: string;
  text: string;
  score: number;
  title?: string;
  content?: string;
  tag_id?: string;
}

interface Evaluation {
  verdict: 'true' | 'false' | 'uncertain';
  confidence: number;
  reasoning: string;
  recommendation: 'approve' | 'review' | 'reject';
}

interface RelatedPost {
  id: string;
  title?: string;
  text: string;
  score: number;
}

interface EvaluationResult {
  flagged: boolean;
  similarity: number;
  relatedPostsCount: number;
  evaluation: Evaluation;
  relatedPosts: RelatedPost[];
}

export default function TestPostPage() {
  const [testText, setTestText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVectorSearch = async () => {
    if (!testText.trim()) {
      setError('Please enter some text to search');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vector-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testText, limit: 10 }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform vector search');
      }

      const data = await response.json();
      setSearchResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!testText.trim()) {
      setError('Please enter some text to evaluate');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testText }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate text');
      }

      const data = await response.json();
      setEvaluationResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-500';
    if (score >= 0.6) return 'bg-orange-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getScoreText = (score: number) => {
    if (score >= 0.8) return 'Very High';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Post Matching</h1>
        <p className="text-muted-foreground">
          Test how similar your text is to existing posts using Qdrant Vector Search with OpenAI embeddings.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Test Text</CardTitle>
            <CardDescription>
              Enter text to test against the database using vector similarity search
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-text">Text to Test</Label>
              <Input
                id="test-text"
                placeholder="Enter your text here..."
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleVectorSearch} 
                disabled={isLoading || !testText.trim()}
                variant="outline"
              >
                {isLoading ? 'Searching...' : 'Vector Search'}
              </Button>
              <Button 
                onClick={handleEvaluate} 
                disabled={isLoading || !testText.trim()}
              >
                {isLoading ? 'Evaluating...' : 'Evaluate Similarity'}
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {evaluationResult && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Result</CardTitle>
              <CardDescription>
                AI-powered evaluation and similarity analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-[1000px]">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Similarity Score:</span>
                  <Badge 
                    className={`${getScoreColor(evaluationResult.similarity)} text-white`}
                  >
                    {(evaluationResult.similarity * 100).toFixed(2)}%
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">AI Reasoning:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {evaluationResult.evaluation.reasoning}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vector Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Similar Posts Found</CardTitle>
              <CardDescription>
                Posts with highest similarity scores to your input text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div key={result.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm text-muted-foreground">
                            Result #{index + 1}
                          </p>
                          {result.tag_id && (
                            <Badge variant="outline" className="text-xs">
                              {result.tag_id}
                            </Badge>
                          )}
                        </div>
                        {result.title && (
                          <h4 className="font-medium text-sm mb-1">{result.title}</h4>
                        )}
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {result.content || result.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Searchable text: {result.text}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          className={`${getScoreColor(result.score)} text-white`}
                        >
                          {(result.score * 100).toFixed(2)}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getScoreText(result.score)}
                        </span>
                      </div>
                    </div>
                    {index < searchResults.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
