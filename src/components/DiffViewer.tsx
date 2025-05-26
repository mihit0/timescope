import React from 'react';
import { Card, CardContent } from './ui/card';

interface DiffViewerProps {
  originalSummary: string;
  modernSummary: string;
}

export function DiffViewer({ originalSummary, modernSummary }: DiffViewerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Original Summary</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{originalSummary}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Modern Summary (2024)</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{modernSummary}</p>
        </CardContent>
      </Card>
    </div>
  );
}