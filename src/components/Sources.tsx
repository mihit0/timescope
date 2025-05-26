interface Source {
  id: number;
  title: string;
  url: string;
  publisher: string;
  year: number;
}

interface SourcesProps {
  sources: Source[];
}

export function Sources({ sources }: SourcesProps) {
  if (!sources?.length) return null;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">Sources</h3>
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="text-sm">
            <a 
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              [{source.id}] {source.title}
            </a>
            <span className="text-slate-600">
              {' '}— {source.publisher}, {source.year}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 