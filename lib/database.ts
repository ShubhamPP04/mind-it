import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Database types
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']

// Table types
export type Space = Tables['spaces']['Row']
export type SpaceInsert = Tables['spaces']['Insert']
export type SpaceUpdate = Tables['spaces']['Update']

export type Note = Tables['notes']['Row']
export type NoteInsert = Tables['notes']['Insert']
export type NoteUpdate = Tables['notes']['Update'] 