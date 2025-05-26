'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!res.ok) throw new Error('Failed to fetch analysis');

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">🕰️ Timescope</h1>
      <div className="space-y-2">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste article URL..."
          className="w-full p-2 border rounded"
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {result && (
        <div className="space-y-4 border-t pt-4">
          <section>
            <h2 className="text-xl font-semibold">📌 Original Summary</h2>
            <p>{result.original_summary}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">📅 Modern Summary</h2>
            <p>{result.modern_summary}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">🧾 Timeline</h2>
            <ul className="list-disc pl-5">
              {result.timeline?.map((event: any, idx: number) => (
                <li key={idx}>
                  <strong>{event.year}</strong>: <em>{event.title}</em> — {event.description}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
