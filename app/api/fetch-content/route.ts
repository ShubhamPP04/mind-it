export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(JSON.stringify({ error: 'No URL provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // For now, return empty content
    return new Response(JSON.stringify({
      title: url,
      content: ''
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching content:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch content' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 