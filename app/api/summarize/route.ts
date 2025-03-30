export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content) {
      return new Response(JSON.stringify({ error: 'No content provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // For now, return empty summary
    return new Response(JSON.stringify({
      summary: ''
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error generating summary:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate summary' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 