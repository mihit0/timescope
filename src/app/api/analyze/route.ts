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
  const prompt = `Analyze this ${year} article and return a response in this exact JSON format:
{
  "original_summary": "3-sentence summary of the article as written in ${year}",
  "modern_summary": "Same 3-sentence summary but with 2024 updates in [brackets]",
  "timeline": [
    {"year": number, "title": "string", "update": "1-sentence description"}
  ]
}

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

  // Get the raw response text first
  const rawResponse = await response.text();
  console.log("Raw Perplexity API response:", rawResponse.slice(0, 500));

  if (!response.ok) {
    console.error("Perplexity API error:", response.status, rawResponse);
    throw new Error(`Failed to analyze with Perplexity: ${response.status}`);
  }

  // Try parsing the response
  try {
    const data = JSON.parse(rawResponse);
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("Unexpected API response structure:", data);
      throw new Error('Unexpected API response structure');
    }

    // Look for JSON content between ```json and ``` or just find a JSON object
    let jsonContent;
    const codeBlockMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1];
    } else {
      // Find the last occurrence of a JSON object in the text
      const jsonMatch = content.match(/\{[\s\S]*\}/g);
      if (jsonMatch) {
        jsonContent = jsonMatch[jsonMatch.length - 1]; // Take the last match
      }
    }

    if (jsonContent) {
      try {
        const parsed = JSON.parse(jsonContent);
        // Validate the parsed object has the required fields
        if (parsed.original_summary && parsed.modern_summary && Array.isArray(parsed.timeline)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse extracted JSON:", jsonContent);
      }
    }

    console.error("Could not find valid JSON in content:", content);
    return {
      original_summary: "Error: Could not parse API response",
      modern_summary: "Error: Could not parse API response",
      timeline: []
    };
  } catch (e) {
    console.error("Failed to parse API response:", e);
    throw new Error('Failed to parse API response');
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
