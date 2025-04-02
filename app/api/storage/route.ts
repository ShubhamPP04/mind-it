import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Create server-side Supabase client
    const supabase = await createClient()

    // Check if the images bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('Error checking buckets:', bucketError)
      return NextResponse.json({ error: 'Failed to check storage buckets' }, { status: 500 })
    }

    const imagesBucketExists = buckets.some(bucket => bucket.name === 'images')
    let bucketCreated = false
    
    if (!imagesBucketExists) {
      // Create the images bucket
      const { error: createBucketError } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })
      
      if (createBucketError) {
        console.error('Error creating images bucket:', createBucketError)
        return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 })
      }
      bucketCreated = true
      console.log('Successfully created images bucket')
    }

    // Run SQL to set permissions for the bucket
    const sqlQuery = `
      -- Allow authenticated users to upload files to the images bucket
      BEGIN;
      
      -- Clean up any existing policies to avoid duplicates
      DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public viewing of images" ON storage.objects;
      
      -- Create the upload policy
      CREATE POLICY "Allow authenticated uploads"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'images' AND auth.uid() = auth.uid());
      
      -- Create the viewing policy
      CREATE POLICY "Allow public viewing of images"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'images');
      
      COMMIT;
    `
    
    // Execute the SQL query to set permissions
    const { error: sqlError } = await supabase.rpc('exec_sql', { query: sqlQuery })
    
    if (sqlError) {
      console.error('Error setting bucket permissions:', sqlError)
      // Non-fatal, continue anyway
    }
    
    return NextResponse.json({ 
      success: true, 
      bucketExists: imagesBucketExists, 
      bucketCreated 
    })
  } catch (error) {
    console.error('Error in storage API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
