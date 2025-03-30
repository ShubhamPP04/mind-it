export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      spaces: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          color: string
          icon: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          color: string
          icon: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
        }
      }
      notes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          space_id: string | null
          title: string
          content: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          space_id?: string | null
          title: string
          content: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          space_id?: string | null
          title?: string
          content?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 