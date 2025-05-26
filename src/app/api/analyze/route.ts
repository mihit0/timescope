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

interface AnalysisResult {
  original_summary: string;
  modern_summary: string;
  publication_date?: string;
  timeline: Array<{
    year: number;
    title: string;
    update: string;
  }>;
  sources: Array<{
    id: number;
    title: string;
    url: string;
    publisher: string;
    year: number;
  }>;
}

async function analyzeWithPerplexity(text: string, year: number) {
  const systemPrompt = "You are analyzing a specific news article. Focus only on the article provided and ignore any previous context.";
  const userPrompt = `Output ONLY a JSON object in this exact format, with no other text or markdown. Analyze this specific article from ${year}:
{
  "original_summary": "3-sentence summary from ${year}",
  "modern_summary": "3-sentence summary with 2024 updates in [brackets]. Include source citations like [1] after each major fact or figure.",
  "publication_date": "${year}",
  "timeline": [
    {
      "year": 2021,
      "title": "Example Event",
      "update": "One sentence description with source citation [1] for key facts"
    }
  ],
  "sources": [
    {
      "id": 1,
      "title": "Source Title",
      "url": "Source URL",
      "publisher": "Publisher Name",
      "year": 2024
    }
  ]
}

For the modern_summary and timeline updates, cite sources using [n] where n is the source ID. Place citations immediately after the fact or figure they support. Each major claim should have a citation.

Include 6-7 timeline events with citations, ensuring at least 4 different years are represented. Start with key events from ${year}, then show how the story evolved across different years up to 2024. Mix major developments (like death tolls, reconstruction milestones) with other interesting updates (scientific findings, social impacts, policy changes). Each event should include relevant citations.

Article text: ${text}`;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      random_seed: Date.now()  // Ensure unique responses
    })
  });

  const rawResponse = await response.text();
  console.log("Raw Perplexity API response:", rawResponse);

  if (!response.ok) {
    console.error("Perplexity API error:", response.status, rawResponse);
    throw new Error(`Failed to analyze with Perplexity: ${response.status}`);
  }

  try {
    const data = JSON.parse(rawResponse);
    let content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      console.error("Unexpected API response structure:", data);
      throw new Error('Unexpected API response structure');
    }

    console.log("Model content:", content);
    
    // Extract JSON from the content by finding the first { and last }
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      throw new Error('No JSON object found in response');
    }

    // Extract just the JSON part
    content = content.slice(startIdx, endIdx + 1);
    
    // Remove any markdown code block markers
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    try {
      // Try to fix truncated JSON by ensuring proper closure of arrays and objects
      if (!content.endsWith('}')) {
        // Find the last complete source object
        const lastCompleteSourceIdx = content.lastIndexOf('    }');
        if (lastCompleteSourceIdx !== -1) {
          content = content.slice(0, lastCompleteSourceIdx + 5) + ']\n}';
        }
      }
      
      const parsed = JSON.parse(content) as AnalysisResult;
      
      // Validate the structure
      if (!parsed.original_summary || !parsed.modern_summary || !Array.isArray(parsed.timeline) || !Array.isArray(parsed.sources)) {
        throw new Error('Invalid JSON structure');
      }
      
      return parsed;
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      throw e;
    }
  } catch (e) {
    const error = e as Error;
    console.error("Failed to parse API response:", error.message);
    return {
      original_summary: "Error: Could not parse API response",
      modern_summary: "Error: Could not parse API response",
      timeline: [],
      sources: []
    } as AnalysisResult;
  }
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

    console.log('Extracting article from URL:', url);
    const { text, year } = await extractArticle(url);
    console.log('Article extracted, year:', year, 'text length:', text.length);

    console.log('Analyzing with Perplexity...');
    const analysis = await analyzeWithPerplexity(text, year);
    console.log('Analysis complete, publication date:', analysis.publication_date);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze article' },
      { status: 500 }
    );
  }
}
