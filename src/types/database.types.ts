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
          daily_visitor: number
          date: string
          id: string
        }
        Insert: {
          blog_id?: string | null
          created_at?: string
          daily_visitor?: number
          date?: string
          id?: string
        }
        Update: {
          blog_id?: string | null
          created_at?: string
          daily_visitor?: number
          date?: string
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
          blog_slug: string
          created_at: string
          id: string
          is_influencer: boolean | null
          name: string | null
          owner_profile_id: string | null
        }
        Insert: {
          blog_slug: string
          created_at?: string
          id?: string
          is_influencer?: boolean | null
          name?: string | null
          owner_profile_id?: string | null
        }
        Update: {
          blog_slug?: string
          created_at?: string
          id?: string
          is_influencer?: boolean | null
          name?: string | null
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
          daily_issue_volume: number
          daily_mobile_search_volume: number
          daily_pc_search_volume: number
          daily_search_volume: number
          date: string | null
          honey_index: number | null
          id: string
          keyword_id: string | null
          montly_issue_volume: number | null
          montly_mobile_search_volume: number
          montly_pc_search_volume: number
          montly_search_volume: number
        }
        Insert: {
          created_at?: string
          daily_issue_volume?: number
          daily_mobile_search_volume?: number
          daily_pc_search_volume?: number
          daily_search_volume?: number
          date?: string | null
          honey_index?: number | null
          id?: string
          keyword_id?: string | null
          montly_issue_volume?: number | null
          montly_mobile_search_volume?: number
          montly_pc_search_volume?: number
          montly_search_volume?: number
        }
        Update: {
          created_at?: string
          daily_issue_volume?: number
          daily_mobile_search_volume?: number
          daily_pc_search_volume?: number
          daily_search_volume?: number
          date?: string | null
          honey_index?: number | null
          id?: string
          keyword_id?: string | null
          montly_issue_volume?: number | null
          montly_mobile_search_volume?: number
          montly_pc_search_volume?: number
          montly_search_volume?: number
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
      keyword_categories: {
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
          date: string
          id: string
          keyword_tracker: string
          post_url: string | null
          rank_in_smart_block: number | null
          smart_block_name: string | null
        }
        Insert: {
          blog_id?: string | null
          created_at?: string
          date: string
          id?: string
          keyword_tracker?: string
          post_url?: string | null
          rank_in_smart_block?: number | null
          smart_block_name?: string | null
        }
        Update: {
          blog_id?: string | null
          created_at?: string
          date?: string
          id?: string
          keyword_tracker?: string
          post_url?: string | null
          rank_in_smart_block?: number | null
          smart_block_name?: string | null
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
          category_id: string | null
          created_at: string
          id: string
          keyword_id: string
          project_id: string | null
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          keyword_id: string
          project_id?: string | null
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          keyword_id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_trackers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "keyword_categories"
            referencedColumns: ["id"]
          },
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
      message_targets: {
        Row: {
          active: boolean
          created_at: string
          id: string
          phone_number: string | null
          profile_id: string | null
          project_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          phone_number?: string | null
          profile_id?: string | null
          project_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          phone_number?: string | null
          profile_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_targets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_targets_project_id_fkey"
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
          phone_number: string | null
          profile_image_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number?: string | null
          profile_image_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string | null
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
          blog_id: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          active?: boolean
          blog_id: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          active?: boolean
          blog_id?: string
          created_at?: string
          id?: string
          project_id?: string
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
      serp_results: {
        Row: {
          basic_block_datas: Json[] | null
          created_at: string
          date: string | null
          id: string
          keyword_id: string | null
          popular_topic_datas: Json[] | null
          popular_topics: string[] | null
          smart_block_datas: Json | null
          smart_blocks: string[] | null
        }
        Insert: {
          basic_block_datas?: Json[] | null
          created_at?: string
          date?: string | null
          id?: string
          keyword_id?: string | null
          popular_topic_datas?: Json[] | null
          popular_topics?: string[] | null
          smart_block_datas?: Json | null
          smart_blocks?: string[] | null
        }
        Update: {
          basic_block_datas?: Json[] | null
          created_at?: string
          date?: string | null
          id?: string
          keyword_id?: string | null
          popular_topic_datas?: Json[] | null
          popular_topics?: string[] | null
          smart_block_datas?: Json | null
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
