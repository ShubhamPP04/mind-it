'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  email_notifications: boolean
  dark_mode: boolean
  updated_at: string
}

interface UserContextType {
  user: User | null
  profile: Profile | null
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  loading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    getUser()

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getProfile(session.user)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      setUser(user)
      if (user) await getProfile(user)
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function getProfile(currentUser: User) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        // If profile exists but missing name/avatar, update from user metadata
        if (!data.full_name || !data.avatar_url) {
          const updates = {
            ...data,
            full_name: data.full_name || currentUser.user_metadata.full_name,
            avatar_url: data.avatar_url || currentUser.user_metadata.avatar_url,
            updated_at: new Date().toISOString(),
          }
          
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert(updates)
          
          if (!updateError) {
            setProfile(updates as Profile)
            return
          }
        }
        setProfile(data as Profile)
      } else {
        // Create a new profile if it doesn't exist
        const newProfile = {
          id: currentUser.id,
          username: null,
          full_name: currentUser.user_metadata.full_name || null,
          avatar_url: currentUser.user_metadata.avatar_url || null,
          website: null,
          email_notifications: false,
          dark_mode: false,
          updated_at: new Date().toISOString(),
        }
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
        
        if (insertError) throw insertError
        setProfile(newProfile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      if (!user) throw new Error('No user')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          updated_at: new Date().toISOString(),
          ...profile,
          ...updates,
        })

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...updates } : null)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  return (
    <UserContext.Provider value={{ user, profile, updateProfile, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 