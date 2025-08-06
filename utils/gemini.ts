import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing Gemini API Key");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
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
- Provide comprehensive, well-structured responses with proper formatting
- Use **bold text** for important terms, headings, and key concepts
- Start each new paragraph on a separate line with proper line breaks
- Use double line breaks between paragraphs for better readability
- Write thorough explanations with supporting details and examples
- Include relevant background information and context
- Aim for at least 4-6 well-formatted paragraphs for substantive topics
- Keep paragraphs well-developed but focused
- Use your own words while accurately representing the source material
- When citing sources, mention them naturally in your response
- Format your response with markdown-style formatting (bold, line breaks)

${prompt}`;
    } else {
      // For simple prompts without history
      formattedPrompt = `You are a helpful AI assistant with access to the user's saved content (notes, websites, and documents). When answering questions, use the provided content as context and cite your sources.

If the input contains saved content (indicated by [NOTE], [WEBSITE], or [DOCUMENT] tags), use that information to provide a more accurate and contextual response. Always reference the sources you used in your response.

If no saved content is provided or if the question can't be answered using the saved content alone, provide a general response based on your knowledge.

Guidelines:
- Provide comprehensive, well-structured responses with proper formatting
- Use **bold text** for important terms, headings, and key concepts
- Start each new paragraph on a separate line with proper line breaks
- Use double line breaks between paragraphs for better readability
- Write thorough explanations with supporting details and examples
- Include relevant background information and context
- Aim for at least 4-6 well-formatted paragraphs for substantive topics
- Keep paragraphs well-developed but focused
- Use your own words while accurately representing the source material
- When citing sources, mention them naturally in your response
- Format your response with markdown-style formatting (bold, line breaks)

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
      // Ensure proper line breaks between sentences that end paragraphs
      .replace(/([.!?])\s*\n(?!\n)/g, '$1\n\n')
      // Preserve bold formatting with **text**
      // Ensure paragraphs are properly separated (max 2 newlines)
      .replace(/\n{3,}/g, '\n\n')
      // Clean up any trailing whitespace
      .replace(/[ \t]+$/gm, '')
      // Ensure there's always a double line break after periods that should end paragraphs
      .replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');

    return response;

  } catch (error: any) {
    console.error('Error generating content:', error);
    if (error?.message?.includes('Candidate was blocked') || error?.message?.includes('RECITATION')) {
      return "I'll help you rephrase that. Please try:\n1. Breaking down your request into smaller parts\n2. Asking for analysis rather than direct information\n3. Using more general terms";
    }
    throw error;
  }
}