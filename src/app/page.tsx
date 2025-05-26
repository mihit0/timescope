'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DiffViewer } from '@/components/DiffViewer';
import { Timeline } from '@/components/Timeline';
import { Sources } from '@/components/Sources';
import { Card } from '@/components/ui/card';

interface Source {
  id: number;
  title: string;
  url: string;
  publisher: string;
  year: number;
}

interface AnalysisResult {
  original_summary: string;
  modern_summary: string;
  timeline: Array<{
    year: number;
    title: string;
    update: string;
  }>;
  sources?: Source[];
  publication_date?: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze article');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-8">TimeScope</h1>
      <Card className="p-6 mb-8">
        <div className="flex gap-4">
          <Input
            type="url"
            placeholder="Enter article URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleAnalyze}
            disabled={loading || !url}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
        
        {error && (
          <p className="text-red-500 mt-4">{error}</p>
        )}
      </Card>

      {result && (
        <div className="space-y-8">
          {result.publication_date && (
            <p className="text-sm text-muted-foreground">
              Originally published: {result.publication_date}
            </p>
          )}
          <DiffViewer
            originalSummary={result.original_summary}
            modernSummary={result.modern_summary}
          />
          <Timeline events={result.timeline} />
          {result.sources && <Sources sources={result.sources} />}
        </div>
      )}
    </main>
  );
}
