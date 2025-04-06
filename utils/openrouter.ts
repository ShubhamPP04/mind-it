import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { StreamingTextResponse } from 'ai';

if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
  throw new Error("Missing OpenRouter API Key");
}

const openrouter = createOpenRouter({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'Mind-It Notes',
  }
});

// Helper function to parse conversation history from the prompt
function parseConversationHistory(prompt: string) {
  const messages = [];

  // Extract the conversation history section
  const historyMatch = prompt.match(/Conversation history:\n([\s\S]*?)\n\n(User's latest question:|Based on the following)/i);

  if (historyMatch && historyMatch[1]) {
    const historyText = historyMatch[1];

    // Split by double newlines to get each message
    const messageTexts = historyText.split('\n\n');

    // Parse each message
    for (const messageText of messageTexts) {
      if (messageText.startsWith('User: ')) {
        messages.push({
          role: 'user',
          content: messageText.replace('User: ', '')
        });
      } else if (messageText.startsWith('Assistant: ')) {
        messages.push({
          role: 'assistant',
          content: messageText.replace('Assistant: ', '')
        });
      }
    }
  }

  // Extract the latest question
  const questionMatch = prompt.match(/User's latest question: ([\s\S]*?)$/i);
  if (questionMatch && questionMatch[1]) {
    messages.push({
      role: 'user',
      content: questionMatch[1]
    });
  }

  return messages;
}

export async function generateOpenRouterContent(modelName: string, prompt: string, webSearchEnabled: boolean = false) {
  try {
    // If web search is enabled, append ':online' to the model name to use OpenRouter's web search
    const model = webSearchEnabled ? `${modelName}:online` : modelName;
    
    const systemPrompt = `You are a helpful AI assistant with access to the user's saved content (notes, websites, and documents). When answering questions, use the provided content as context and cite your sources.

If the input contains saved content (indicated by [NOTE], [WEBSITE], or [DOCUMENT] tags), use that information to provide a more accurate and contextual response. Always reference the sources you used in your response.

If no saved content is provided or if the question can't be answered using the saved content alone, provide a general response based on your knowledge.

Guidelines:
- Start each key point on a new line
- Use double line breaks between paragraphs
- Format 2-3 important points as bold using **bold text**
- Keep paragraphs short and focused
- Use your own words while accurately representing the source material
- When citing sources, mention them naturally in your response${webSearchEnabled ? '\n- For web search results, cite the source with markdown links using the website domain name (e.g., [example.com](https://example.com))' : ''}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Mind-It Notes'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          // Parse conversation history if present
          ...(prompt.includes('Conversation history:')
            ? parseConversationHistory(prompt)
            : [{ role: 'user', content: prompt }])
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