import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const exaApiKey = process.env.EXA_API_KEY;
    
    // Check if the Exa API key is configured
    const isConfigured = !!exaApiKey && exaApiKey.length > 0 && exaApiKey !== 'your_exa_api_key_here';
    
    return NextResponse.json({ 
      configured: isConfigured,
      message: isConfigured 
        ? 'Exa API key is configured' 
        : 'Exa API key is not configured. Please add your Exa API key to the .env.local file.'
    });
  } catch (error) {
    console.error('Error checking Exa API key:', error);
    return NextResponse.json({ 
      configured: false, 
      message: 'Error checking Exa API key configuration' 
    }, { status: 500 });
  }
}
