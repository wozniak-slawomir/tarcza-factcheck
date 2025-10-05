'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface UrlEvaluation {
  similarity: number;
  similarityPercentage: string;
  matchedUrl?: string;
  status: 'fake' | 'true' | 'no_data' | 'unsure';
  message: string;
}

export default function TestUrlPage() {
  const [testUrl, setTestUrl] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<UrlEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!testUrl.trim()) {
      setError('Please enter a URL to evaluate');
      return;
    }

    // Basic URL validation
    try {
      new URL(testUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkURL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: testUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate URL');
      }

      const data = await response.json();
      setEvaluationResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'bg-red-500';
    if (similarity >= 0.7) return 'bg-orange-500';
    if (similarity >= 0.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSimilarityText = (similarity: number) => {
    if (similarity >= 0.9) return 'Very High';
    if (similarity >= 0.7) return 'High';
    if (similarity >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test URL Verification</h1>
        <p className="text-muted-foreground">
          Test URL similarity against existing URLs in the database and check if they are associated with fake or true news.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>URL Input</CardTitle>
          <CardDescription>
            Enter a URL to check its similarity with existing URLs in the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleEvaluate} 
              disabled={isLoading || !testUrl.trim()}
            >
              {isLoading ? 'Evaluating...' : 'Evaluate URL'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {evaluationResult && (
        <Card>
          <CardHeader>
            <CardTitle>URL Evaluation Results</CardTitle>
            <CardDescription>
              Analysis of URL similarity and news status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Display */}
            <div className="flex items-center gap-4">
              <span className="font-medium">News Status:</span>
              <Badge 
                variant={getStatusVariant(evaluationResult.status)}
                className={getStatusClassName(evaluationResult.status)}
              >
                {getStatusText(evaluationResult.status)}
              </Badge>
            </div>

            <Separator />

            {/* Similarity Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Similarity Score:</span>
                <div className="flex items-center gap-2">
                  <Badge className={`${getSimilarityColor(evaluationResult.similarity)} text-white`}>
                    {evaluationResult.similarityPercentage}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({getSimilarityText(evaluationResult.similarity)})
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getSimilarityColor(evaluationResult.similarity)}`}
                  style={{ width: `${evaluationResult.similarity * 100}%` }}
                />
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                {evaluationResult.matchedUrl && (
                  <div>
                    <span className="font-medium">Matched URL:</span>
                    <div className="text-sm text-muted-foreground break-all">
                      {evaluationResult.matchedUrl}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Message */}
            <div className="space-y-2">
              <span className="font-medium">Message:</span>
              <div className="text-sm text-muted-foreground">
                {evaluationResult.message}
              </div>
            </div>

            {/* Status Explanation */}
            <div className="space-y-2">
              <span className="font-medium">Status Explanation:</span>
              <div className="text-sm text-muted-foreground">
                {evaluationResult.status === 'fake' && 'This URL is highly similar to a URL associated with fake news.'}
                {evaluationResult.status === 'true' && 'This URL is highly similar to a URL associated with true news.'}
                {evaluationResult.status === 'unsure' && 'This URL has moderate similarity to existing URLs, or the matched URL has unclear fake/true status.'}
                {evaluationResult.status === 'no_data' && 'This URL has low similarity to existing URLs in the database.'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
