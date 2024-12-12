export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blog_analytics: {
        Row: {
          blog_id: string | null
          created_at: string
          daily_visitor: number | null
          date: string | null
          id: string
        }
        Insert: {
          blog_id?: string | null
          created_at?: string
          daily_visitor?: number | null
          date?: string | null
          id?: string
        }
        Update: {
          blog_id?: string | null
          created_at?: string
          daily_visitor?: number | null
          date?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_analytics_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          created_at: string
          id: string
          naver_id: string
          owner_profile_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          naver_id: string
          owner_profile_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          naver_id?: string
          owner_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blogs_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_analytics: {
        Row: {
          created_at: string
          date: string | null
          id: string
          keyword_id: string | null
          montly_search: number | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          keyword_id?: string | null
          montly_search?: number | null
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          keyword_id?: string | null
          montly_search?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_analytics_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_tags: {
        Row: {
          created_at: string
          id: string
          name: string | null
          project_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          project_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_tracker_results: {
        Row: {
          blog_id: string | null
          created_at: string
          date: string | null
          id: string
          keyword_tracker: string | null
          post_url: string | null
          rank_in_smart_block: number | null
          smart_block: string | null
        }
        Insert: {
          blog_id?: string | null
          created_at?: string
          date?: string | null
          id?: string
          keyword_tracker?: string | null
          post_url?: string | null
          rank_in_smart_block?: number | null
          smart_block?: string | null
        }
        Update: {
          blog_id?: string | null
          created_at?: string
          date?: string | null
          id?: string
          keyword_tracker?: string | null
          post_url?: string | null
          rank_in_smart_block?: number | null
          smart_block?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_tracker_results_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_tracker_results_keyword_tracker_fkey"
            columns: ["keyword_tracker"]
            isOneToOne: false
            referencedRelation: "keyword_trackers"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_trackers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          keyword_id: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["keyword_tracker_status"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          keyword_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["keyword_tracker_status"]
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          keyword_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["keyword_tracker_status"]
        }
        Relationships: [
          {
            foreignKeyName: "keyword_trackers_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_trackers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      memos: {
        Row: {
          content: string | null
          created_at: string
          date: string
          id: string
          project_id: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          project_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          project_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          profile_image_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_image_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_image_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_profile_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_profile_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_profile_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_blogs: {
        Row: {
          active: boolean
          blog_id: string | null
          created_at: string
          id: string
          project_id: string | null
        }
        Insert: {
          active?: boolean
          blog_id?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
        }
        Update: {
          active?: boolean
          blog_id?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blogs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_blogs_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      report_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          project_id: string | null
          received_profile_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          received_profile_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          received_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_messages_received_profile_id_fkey"
            columns: ["received_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      serp_results: {
        Row: {
          created_at: string
          data: Json | null
          date: string | null
          id: string
          keyword_id: string | null
          raw_data: string | null
          smart_blocks: string[] | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          date?: string | null
          id?: string
          keyword_id?: string | null
          raw_data?: string | null
          smart_blocks?: string[] | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          date?: string | null
          id?: string
          keyword_id?: string | null
          raw_data?: string | null
          smart_blocks?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "serp_results_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      keyword_tracker_status: "WAITING" | "PROGRESSING" | "COMPLETED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
