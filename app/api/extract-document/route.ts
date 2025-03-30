import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const generateAISummary = formData.get('generateAISummary') === 'true'

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle text files directly
    if (file.type === 'text/plain') {
      const text = await file.text()
      const content = text.slice(0, 2000) // Limit content length

      return new Response(JSON.stringify({
        title: file.name,
        content: content
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // For now, return empty content for other file types
    return new Response(JSON.stringify({
      title: file.name,
      content: ''
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in extract-document:', error)
    return new Response(JSON.stringify({ error: 'Failed to process document' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 