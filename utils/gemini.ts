import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing Gemini API Key");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});

export async function generateNoteContent(prompt: string): Promise<string> {
  try {
    // Check if the prompt contains conversation history
    const hasConversationHistory = prompt.includes('Conversation history:');

    let formattedPrompt;

    if (hasConversationHistory) {
      // For prompts with conversation history, we'll use a different format
      formattedPrompt = `You are a helpful AI assistant with access to the user's saved content (notes, websites, and documents). When answering questions, use the provided content as context and cite your sources.

If the input contains saved content (indicated by [NOTE], [WEBSITE], or [DOCUMENT] tags), use that information to provide a more accurate and contextual response. Always reference the sources you used in your response.

If no saved content is provided or if the question can't be answered using the saved content alone, provide a general response based on your knowledge.

Guidelines:
- Start each key point on a new line
- Use double line breaks between paragraphs
- Format 2-3 important points as bold using **bold text**
- Keep paragraphs short and focused
- Use your own words while accurately representing the source material
- When citing sources, mention them naturally in your response

${prompt}`;
    } else {
      // For simple prompts without history
      formattedPrompt = `You are a helpful AI assistant with access to the user's saved content (notes, websites, and documents). When answering questions, use the provided content as context and cite your sources.

If the input contains saved content (indicated by [NOTE], [WEBSITE], or [DOCUMENT] tags), use that information to provide a more accurate and contextual response. Always reference the sources you used in your response.

If no saved content is provided or if the question can't be answered using the saved content alone, provide a general response based on your knowledge.

Guidelines:
- Start each key point on a new line
- Use double line breaks between paragraphs
- Format 2-3 important points as bold using **bold text**
- Keep paragraphs short and focused
- Use your own words while accurately representing the source material
- When citing sources, mention them naturally in your response

Input: ${prompt}`;
    }

    const result = await model.generateContent(formattedPrompt);

    if (!result.response.text) {
      throw new Error("Empty response from Gemini");
    }

    let response = result.response.text();

    // Clean up the response while preserving formatting
    response = response
      .replace(/^(AI:|Assistant:|Response:|Note:|Requirements?:|Context:|Input:|Guidelines?:)/gim, '')
      .trim()
      // Ensure proper line breaks (convert single newlines to double newlines)
      .replace(/([.!?])\s*\n(?!\n)/g, '$1\n\n')
      // Ensure proper bold formatting
      .replace(/\*\*([^*\n]+)\*\*/g, '**$1**')
      // Remove any extra spaces before bold markers
      .replace(/\s+\*\*/g, ' **')
      // Ensure paragraphs are properly separated
      .replace(/\n{3,}/g, '\n\n');

    // Add line break before each bold item
    response = response.replace(/([^\n])\s*(\*\*[^*]+\*\*)/g, '$1\n\n$2');

    return response;

  } catch (error: any) {
    console.error('Error generating content:', error);
    if (error?.message?.includes('Candidate was blocked') || error?.message?.includes('RECITATION')) {
      return "I'll help you rephrase that. Please try:\n1. Breaking down your request into smaller parts\n2. Asking for analysis rather than direct information\n3. Using more general terms";
    }
    throw error;
  }
}