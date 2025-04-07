import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Exa Search API endpoint
const EXA_API_URL = 'https://api.exa.ai/search';
const EXA_API_KEY = process.env.EXA_API_KEY;

export async function POST(req: Request) {
  try {
    const { query, numResults = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'No search query provided' }, { status: 400 });
    }

    if (!EXA_API_KEY) {
      return NextResponse.json({ error: 'Exa API key not configured' }, { status: 500 });
    }

    // Make the request to Exa Search API
    const response = await fetch(EXA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        numResults,
        useAutoprompt: true,
        type: 'keyword',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Exa API error:', errorText);

      try {
        // Try to parse the error as JSON for more detailed logging
        const errorJson = JSON.parse(errorText);
        console.error('Exa API error details:', errorJson);
      } catch (e) {
        // If it's not valid JSON, just log the text
        console.error('Exa API error (raw):', errorText);
      }

      return NextResponse.json({
        error: 'Failed to fetch search results',
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();

    // Format the results to match our expected structure
    const results = data.results?.map((item: any) => ({
      title: item.title,
      link: item.url,
      snippet: item.text ? item.text.substring(0, 200) + '...' : 'No preview available',
      publishedDate: item.publishedDate,
      source: item.source,
    })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in Exa search:', error);

    // Provide more detailed error information
    let errorMessage = 'Failed to perform Exa search';
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}
