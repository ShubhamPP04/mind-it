import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { StreamingTextResponse } from 'ai';

if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
  throw new Error("Missing OpenRouter API Key");
}

const openrouter = createOpenRouter({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'http://localhost:3000', // Your site URL
    'X-Title': 'Mind-It Notes', // Your site name
  }
});

export async function generateOpenRouterContent(modelName: string, prompt: string) {
  try {
    const systemPrompt = `You are a helpful note-taking assistant. Create a brief, original response based on the user's input. Format your response with proper line breaks between paragraphs (use double line breaks) and make key points bold.

Requirements:
- Start each key point on a new line
- Use double line breaks between paragraphs
- Format 2-3 important points as bold using **bold text**
- Make the response original and unique
- Keep paragraphs short and focused
- Use your own words and analysis`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Mind-It Notes'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;

  } catch (error: any) {
    console.error('Error generating content:', error);
    if (error?.message?.includes('Candidate was blocked') || error?.message?.includes('RECITATION')) {
      return "I'll help you rephrase that. Please try:\n1. Breaking down your request into smaller parts\n2. Asking for analysis rather than direct information\n3. Using more general terms";
    }
    throw error;
  }
} 