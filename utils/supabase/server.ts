import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = cookies()
  const hasRememberMe = cookieStore.has('supabase-remember-me')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // For remember me, extend cookie expiration
          if (hasRememberMe && name === 'sb-auth-token') {
            options.maxAge = 30 * 24 * 60 * 60 // 30 days
          }
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
} 