import { NextResponse } from 'next/server';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const EXTRACTOR_URL = process.env.EXTRACTOR_URL || 'http://localhost:8000/extract';

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
  "original_summary": "5-sentence summary from ${year} without any context of events occuring after ${year}",
  "modern_summary": "8-sentence summary with 2024 updates in [brackets]. Include source citations like [1] after EVERY major fact or figure. Cite everything with correct and relevant sources. Should be relevant ONLY to the article. Focus and emphasize on new things that have occured after ${year} regarding the topic discussed in the original summary. Focus on the topic within the context of 2024. Emphasize how the outlook of the topic in 2024 is different from the outlook in ${year}. Emphasize how the topic has evolved over the years.",
  "publication_date": "${year}",
  "timeline": [
    {
      "year": 2021,
      "title": "Example Event",
      "update": "4-5 sentence description with source citations like [1][2] for key facts. Find RELEVANT and HIGHLY SUPPORTING sources for all claims, and include them as instructed. Choose sources from where you get the claims you mention. "
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

Provide a minimum of **five academically rigorous sources** that are:
- Highly relevant to the article's topic and evolution.
- Peer-reviewed articles, reports by respected institutions, or reputable news sources.
- Each citation must support a specific claim in the timeline or modern summary.
- Match each citation number [n] exactly with a source in the source list.

Do NOT invent or fabricate any source. Only use **real, verifiable URLs** and correct publisher details. Use recent sources (preferably 2022-2024) for the modern summary and timeline. Discard outdated or tangential references.

Ensure that:
1. The largest source ID used in citations ([n]) equals the number of sources.
2. Every major claim in the modern summary has at least one citation.
3. Each source is cited at least once.

The JSON must be **clean, syntactically correct**, and include only the object. No markdown.

Ensure that all sources are relevant to the article. Try to include atleast two sources which are pretty recent to 2024.
For the modern_summary and timeline updates, cite sources using [n] where n is the source ID. Place citations immediately after the fact or figure they support. Each major claim should have a citation.

Include 7-8 timeline events with citations, ensuring at least 4 different years are represented. Start with key events from ${year}, then show how the story evolved across different years up to 2024. Mix major developments (like death tolls, reconstruction milestones) with other interesting updates (scientific findings, social impacts, policy changes). include ANYTHING MAJOR which is highly RELEVANT to the content in the original and modern summaries. Each event should include relevant citations. Citations should be highly relevant to the original and modern summaries. 
IMPORTANT:
- Do not omit the "sources" field. Ensure there are AT LEAST 5 distinct, high-quality sources with valid URLs.
- Sources MUST be hyper-relevant to the claims in the summaries and timeline. Do NOT invent or generalize sources.
- If you cite something like [4] in the modern_summary or timeline, you MUST include a matching entry with "id": 4 in the sources array.
- Double-check that every [n] has a corresponding entry in the sources array, and vice versa.
- Prefer .gov, .edu, research institutions, or major news publications with actual coverage of the topic.

Example of a good source:
{
  "id": 3,
  "title": "UN Climate Report 2023",
  "url": "https://www.un.org/en/climate-change/reports",
  "publisher": "United Nations",
  "year": 2023
}

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
      max_tokens: 1550,
      temperature: 0.5,
      random_seed: Date.now()  // Ensures unique responses
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
      // Fix truncated JSON by ensuring proper closure
      const lastCompleteSourceIdx = content.lastIndexOf('"publisher"');
      if (lastCompleteSourceIdx !== -1) {
        // Find the last complete source object
        const lastCompleteObjectEnd = content.lastIndexOf('},', lastCompleteSourceIdx);
        if (lastCompleteObjectEnd !== -1) {
          // Reconstruct the JSON with proper closure
          content = content.slice(0, lastCompleteObjectEnd + 1) + ']\n}';
        }
      }
      
      const parsed = JSON.parse(content) as AnalysisResult;
      
      // Validates the structure and ensures sources array exists
      if (!parsed.original_summary || !parsed.modern_summary || !Array.isArray(parsed.timeline)) {
        throw new Error('Invalid JSON structure');
      }
      
      // Ensure sources is always an array, even if truncated
      if (!Array.isArray(parsed.sources)) {
        parsed.sources = [];
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

    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="TimeScope Private Access"',
        },
      });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (
      username !== process.env.AUTH_USERNAME ||
      password !== process.env.AUTH_PASSWORD
    ) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="TimeScope Private Access"',
        },
      });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
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