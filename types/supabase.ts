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
      chat_conversations: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          created_at: string
          conversation_id: string
          role: string
          content: string
          sources: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          conversation_id: string
          role: string
          content: string
          sources?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          conversation_id?: string
          role?: string
          content?: string
          sources?: Json | null
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