'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const name = formData.get('name') as string

  const data = {
    email,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        name: name,
      },
    },
  }

  const { error: signUpError, data: { user } } = await supabase.auth.signUp(data)

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (user) {
    // Create a profile for the user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          name: name,
          email: email,
          updated_at: new Date().toISOString(),
        }
      ])

    if (profileError) {
      console.error('Error creating profile:', profileError)
    }

    // Create a default space for the user
    const { error: spaceError } = await supabase
      .from('spaces')
      .insert([
        {
          name: 'My Space',
          icon: 'home',
          user_id: user.id,
          color: '#3B82F6', // Default blue color
          created_at: new Date().toISOString(),
        }
      ])

    if (spaceError) {
      console.error('Error creating default space:', spaceError)
    }
  }

  // Store email in a cookie for the verify-email page
  const cookieStore = await cookies()
  cookieStore.set('signUpEmail', email)
  
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
} 