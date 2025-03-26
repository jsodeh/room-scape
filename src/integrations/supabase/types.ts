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
      area_cities: {
        Row: {
          area_id: string
          city_id: string
          created_at: string
          id: string
        }
        Insert: {
          area_id: string
          city_id: string
          created_at?: string
          id?: string
        }
        Update: {
          area_id?: string
          city_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_cities_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_of_business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      areas_of_business: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          location_point: unknown | null
          name: string
          primary_city_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          location_point?: unknown | null
          name: string
          primary_city_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          location_point?: unknown | null
          name?: string
          primary_city_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_of_business_primary_city_id_fkey"
            columns: ["primary_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_threads: {
        Row: {
          created_at: string | null
          id: string
          thread_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          thread_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          thread_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assistants: {
        Row: {
          assistant_id: string
          created_at: string | null
          id: string
          model: string
          name: string
          updated_at: string | null
        }
        Insert: {
          assistant_id: string
          created_at?: string | null
          id?: string
          model: string
          name: string
          updated_at?: string | null
        }
        Update: {
          assistant_id?: string
          created_at?: string | null
          id?: string
          model?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          assistant_response: string
          audio_url: string | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          is_voice: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assistant_response: string
          audio_url?: string | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_voice?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assistant_response?: string
          audio_url?: string | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_voice?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          created_at: string | null
          id: string
          last_message: string | null
          summary: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          areas_of_operation: string[] | null
          country: string
          created_at: string | null
          id: string
          name: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          areas_of_operation?: string[] | null
          country: string
          created_at?: string | null
          id?: string
          name: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_of_operation?: string[] | null
          country?: string
          created_at?: string | null
          id?: string
          name?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      furniture_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string
          embedding: string | null
          id: string
          image_url: string
          keywords: string[] | null
          name: string
          price: number
          search_vector: unknown | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          embedding?: string | null
          id?: string
          image_url: string
          keywords?: string[] | null
          name: string
          price: number
          search_vector?: unknown | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          embedding?: string | null
          id?: string
          image_url?: string
          keywords?: string[] | null
          name?: string
          price?: number
          search_vector?: unknown | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_feedback: {
        Row: {
          comments: string | null
          created_at: string | null
          id: string
          project_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          rating: number
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "staging_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      staging_projects: {
        Row: {
          created_at: string
          error_message: string | null
          furniture_ids: string[]
          has_feedback: boolean | null
          id: string
          instructions: string | null
          original_images: string[]
          staged_images: string[]
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          furniture_ids?: string[]
          has_feedback?: boolean | null
          id?: string
          instructions?: string | null
          original_images?: string[]
          staged_images?: string[]
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          furniture_ids?: string[]
          has_feedback?: boolean | null
          id?: string
          instructions?: string | null
          original_images?: string[]
          staged_images?: string[]
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      thread_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          thread_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          thread_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thread_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_areas: {
        Row: {
          active_status: boolean | null
          area_id: string
          created_at: string | null
          id: string
          stall_number: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          active_status?: boolean | null
          area_id: string
          created_at?: string | null
          id?: string
          stall_number?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          active_status?: boolean | null
          area_id?: string
          created_at?: string | null
          id?: string
          stall_number?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_areas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_of_business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_areas_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_business_areas: {
        Row: {
          area_id: string
          created_at: string
          id: string
          vendor_id: string
        }
        Insert: {
          area_id: string
          created_at?: string
          id?: string
          vendor_id: string
        }
        Update: {
          area_id?: string
          created_at?: string
          id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_business_areas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_of_business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_business_areas_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_locations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          location: unknown | null
          name: string
          phone_number: string | null
          product_names: string[] | null
          type: Database["public"]["Enums"]["vendor_type"] | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          location?: unknown | null
          name: string
          phone_number?: string | null
          product_names?: string[] | null
          type?: Database["public"]["Enums"]["vendor_type"] | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          location?: unknown | null
          name?: string
          phone_number?: string | null
          product_names?: string[] | null
          type?: Database["public"]["Enums"]["vendor_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      vendor_products: {
        Row: {
          created_at: string | null
          id: string
          in_stock: boolean | null
          last_checked: string | null
          price: number | null
          product_id: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          in_stock?: boolean | null
          last_checked?: string | null
          price?: number | null
          product_id: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          in_stock?: boolean | null
          last_checked?: string | null
          price?: number | null
          product_id?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          business_hours: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          products_specialty: string[] | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          business_hours?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          products_specialty?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          business_hours?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          products_specialty?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_products: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          name: string
          description: string
          price: number
          category: string
          image_url: string
          similarity: number
        }[]
      }
      search_products: {
        Args: {
          search_query: string
          category_filter?: string
          price_min?: number
          price_max?: number
        }
        Returns: {
          id: string
          name: string
          description: string
          price: number
          image_url: string
          category: string
          created_at: string
          updated_at: string
          relevance: number
        }[]
      }
      search_products_by_keywords: {
        Args: {
          search_terms: string[]
        }
        Returns: {
          id: string
          name: string
          description: string
          price: number
          category: string
          image_url: string
          relevance: number
        }[]
      }
      search_products_by_text: {
        Args: {
          search_query: string
          limit_val?: number
        }
        Returns: {
          id: string
          name: string
          description: string
          price: number
          image_url: string
          category: string
          relevance: number
        }[]
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      vendor_type:
        | "Groceries"
        | "Pharmacy"
        | "Frozen Foods"
        | "Supermarket"
        | "Foodstuff"
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
