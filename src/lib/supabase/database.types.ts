export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usernames_private: {
        Row: {
          user_id: string;
          normalized_username: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          normalized_username: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          normalized_username?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_rooms: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_members: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          role: 'owner' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          updated_at: string;
          edited_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      invitations: {
        Row: {
          id: string;
          room_id: string;
          invited_email: string;
          token_hash: string;
          expires_at: string;
          accepted_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          invited_email: string;
          token_hash: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          invited_email?: string;
          token_hash?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      auth_rate_limits: {
        Row: {
          id: string;
          identifier: string;
          attempt_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          identifier: string;
          attempt_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          identifier?: string;
          attempt_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_username_availability: {
        Args: {
          check_username: string;
        };
        Returns: boolean;
      };
      ensure_private_chat_room: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_default_room_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      initialize_chat_room: {
        Args: {
          room_name?: string;
        };
        Returns: Json;
      };
      create_room_invitation: {
        Args: {
          p_room_id: string;
          p_invited_email: string;
          p_token_hash: string;
          p_duration_days?: number;
        };
        Returns: Json;
      };
      redeem_invitation: {
        Args: {
          p_token_hash: string;
        };
        Returns: Json;
      };
      is_room_member: {
        Args: {
          check_user_id: string;
          check_room_id: string;
        };
        Returns: boolean;
      };
      is_room_owner: {
        Args: {
          check_user_id: string;
          check_room_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
