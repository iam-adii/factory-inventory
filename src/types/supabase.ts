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
      materials: {
        Row: {
          id: number
          name: string
          category: string
          current_stock: number
          unit: string
          last_updated: string
          threshold: number
          bill_number: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          category: string
          current_stock: number
          unit: string
          last_updated?: string
          threshold: number
          bill_number?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          category?: string
          current_stock?: number
          unit?: string
          last_updated?: string
          threshold?: number
          bill_number?: string | null
          created_at?: string
        }
      }
      batches: {
        Row: {
          id: number
          batch_number: string
          product: string
          date: string
          status: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          batch_number: string
          product: string
          date: string
          status: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          batch_number?: string
          product?: string
          date?: string
          status?: string
          description?: string | null
          created_at?: string
        }
      }
      batch_materials: {
        Row: {
          id: number
          batch_id: number
          material_id: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: number
          batch_id: number
          material_id: number
          quantity: number
          created_at?: string
        }
        Update: {
          id?: number
          batch_id?: number
          material_id?: number
          quantity?: number
          created_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: number
          material_id: number
          quantity: number
          date: string
          username: string
          batch_id: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          material_id: number
          quantity: number
          date: string
          username: string
          batch_id?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          material_id?: number
          quantity?: number
          date?: string
          username?: string
          batch_id?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          key: string
          value: Json
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          key: string
          value: Json
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          key?: string
          value?: Json
          user_id?: string | null
          created_at?: string
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