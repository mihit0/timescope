import { NextRequest, NextResponse } from 'next/server';

const extractArticle = async (url: string) => {
  const res = await fetch('http://localhost:8000/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) throw new Error('Failed to extract article');
  return await res.json(); // Expected: { text: string, date?: number }
};

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    // Step 1: Call your Python extractor to get article text and date
    const article = await extractArticle(url);

    // Step 2: Build prompt with real extracted article data
    const prompt = `
Analyze this ${article.date ?? 'unknown'} article and output JSON with:  
1. original_summary: 3-sentence summary  
2. modern_summary: Same but with 2024 updates in [brackets]  
3. timeline: 3 key events (year, title, 1-sentence update)  

Article: ${article.text}
    `.trim();

    // Step 3: Call Perplexity Sonar API with prompt
    const sonarRes = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "sonar-pro-search",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!sonarRes.ok) {
      const errorText = await sonarRes.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    // Step 4: Return Perplexity API JSON response to frontend
    const result = await sonarRes.json();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
