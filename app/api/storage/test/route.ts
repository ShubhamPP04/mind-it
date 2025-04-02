import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if the images bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('Error checking buckets:', bucketError)
      return NextResponse.json({ error: 'Failed to check storage buckets' }, { status: 500 })
    }

    // Get the test image from the request (should be a base64 string)
    const { imageBase64 } = await request.json()
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(imageBase64.split(',')[1], 'base64')
    
    // Create a file path
    const fileName = `test-${Date.now()}.jpg`
    const filePath = `test/${fileName}`
    
    // Upload to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)
    
    return NextResponse.json({ 
      success: true,
      message: 'Image uploaded successfully',
      url: publicUrl
    })
  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 