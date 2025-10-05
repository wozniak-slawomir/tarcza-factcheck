'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';


interface Evaluation {
  similarity: number;
  confidence: number;
  reasoning: string;
  relatedPostsCount?: number;
  relatedPosts?: Array<{ id: string; text: string; score: number; title?: string; content?: string; is_fake?: boolean; url?: string; createdAt?: string }>;
  status: 'fake' | 'true' | 'no_data' | 'unsure';
  evaluation?: {
    verdict: string;
    reasoning: string;
    recommendation: string;
  };
}

interface RelatedPost {
  id: string;
  title?: string;
  text: string;
  score: number;
}

export default function TestPostPage() {
  const [testText, setTestText] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const toggleExpandedPost = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
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

  const getStatusVariant = (status: 'fake' | 'true' | 'no_data' | 'unsure') => {
    switch (status) {
      case 'fake':
        return 'destructive' as const;
      case 'true':
        return 'default' as const;
      case 'unsure':
        return 'secondary' as const;
      case 'no_data':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getStatusClassName = (status: 'fake' | 'true' | 'no_data' | 'unsure') => {
    switch (status) {
      case 'fake':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'true':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'unsure':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'no_data':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getStatusText = (status: 'fake' | 'true' | 'no_data' | 'unsure') => {
    switch (status) {
      case 'fake':
        return 'FAKE NEWS';
      case 'true':
        return 'TRUE NEWS';
      case 'unsure':
        return 'UNSURE';
      case 'no_data':
        return 'NO DATA';
      default:
        return 'UNKNOWN';
    }
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
                
                <div className="flex items-center gap-4">
                  <span className="font-medium">Confidence:</span>
                  <Badge 
                    className={`${getScoreColor(evaluationResult.confidence)} text-white`}
                  >
                    {(evaluationResult.confidence * 100).toFixed(2)}%
                  </Badge>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-medium">News Status:</span>
                  <Badge 
                    variant={getStatusVariant(evaluationResult.status)}
                    className={getStatusClassName(evaluationResult.status)}
                  >
                    {getStatusText(evaluationResult.status)}
                  </Badge>
                </div>
                
                {evaluationResult.relatedPostsCount !== undefined && (
                  <div className="flex items-center gap-4">
                    <span className="font-medium">Related Posts:</span>
                    <Badge variant="outline">
                      {evaluationResult.relatedPostsCount} found
                    </Badge>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">AI Reasoning:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {evaluationResult.evaluation?.reasoning || evaluationResult.reasoning}
                  </p>
                </div>

                {evaluationResult.relatedPostsCount && evaluationResult.relatedPostsCount > 0 && evaluationResult.relatedPosts && (
                  <div>
                    <h4 className="font-medium mb-2">Matching Posts Used for Analysis:</h4>
                    <div className="space-y-2">
                      {evaluationResult.relatedPosts.map((result, index) => (
                        <div key={result.id} className="border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                                <Badge 
                                  className={`${getScoreColor(result.score)} text-white text-xs`}
                                >
                                  {(result.score * 100).toFixed(1)}%
                                </Badge>
                                {result.is_fake !== undefined && (
                                  <Badge 
                                    variant={result.is_fake ? "destructive" : "default"} 
                                    className="text-xs"
                                  >
                                    {result.is_fake ? "FAKE" : "REAL"}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm">
                                {expandedPosts.has(result.id) ? (
                                  <div>
                                    <p className="font-medium text-foreground mb-1">
                                      {result.title || 'Untitled'}
                                    </p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                      {result.content || result.text}
                                    </p>
                                    {result.url && (
                                      <div className="mt-2">
                                        <a 
                                          href={result.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                                        >
                                          {result.url}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground truncate">
                                    {result.title || result.content || result.text}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpandedPost(result.id)}
                              className="shrink-0 h-6 px-2 text-xs"
                            >
                              {expandedPosts.has(result.id) ? 'Show Less' : 'Show More'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
