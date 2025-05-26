import { NextResponse } from 'next/server';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const EXTRACTOR_URL = 'http://localhost:8000/extract';

async function extractArticle(url: string): Promise<{ text: string; year: number }> {
  const response = await fetch(EXTRACTOR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    throw new Error('Failed to extract article');
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return {
    text: data.text,
    year: data.date // the FastAPI endpoint returns 'date' as the year
  };
}

async function analyzeWithPerplexity(text: string, year: number) {
  const prompt = `Analyze this ${year} article and output JSON with:
1. original_summary: 3-sentence summary
2. modern_summary: Same but with 2024 updates in [brackets]
3. timeline: 3 key events (year, title, 1-sentence update)

Article: ${text}`;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "sonar-reasoning",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Perplexity API error:", response.status, errorBody);
    throw new Error('Failed to analyze with Perplexity');
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: 'Perplexity API key is not configured' },
        { status: 500 }
      );
    }

    const { text, year } = await extractArticle(url);
    const analysis = await analyzeWithPerplexity(text, year);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze article' },
      { status: 500 }
    );
  }
}
