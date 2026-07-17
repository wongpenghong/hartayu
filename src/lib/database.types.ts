export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          archived_at: string | null;
          household_id: string;
          id: string;
          name: string;
          primary_member_id: string | null;
        };
        Insert: {
          archived_at?: string | null;
          household_id: string;
          id?: string;
          name: string;
          primary_member_id?: string | null;
        };
        Update: {
          archived_at?: string | null;
          household_id?: string;
          id?: string;
          name?: string;
          primary_member_id?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          household_id: string;
          id: string;
          is_starter: boolean;
          kind: "expense" | "income";
          name: string;
        };
        Insert: {
          household_id: string;
          id?: string;
          is_starter?: boolean;
          kind: "expense" | "income";
          name: string;
        };
        Update: {
          household_id?: string;
          id?: string;
          is_starter?: boolean;
          kind?: "expense" | "income";
          name?: string;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          account_id: string;
          amount_yen: number;
          category_id: string;
          created_at: string;
          entry_date: string;
          household_id: string;
          id: string;
          kind: "expense" | "income";
          member_id: string;
          note: string | null;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          amount_yen: number;
          category_id: string;
          created_at?: string;
          entry_date: string;
          household_id: string;
          id?: string;
          kind: "expense" | "income";
          member_id: string;
          note?: string | null;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          amount_yen?: number;
          category_id?: string;
          created_at?: string;
          entry_date?: string;
          household_id?: string;
          id?: string;
          kind?: "expense" | "income";
          member_id?: string;
          note?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_invites: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          expires_at: string;
          household_id: string;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          expires_at: string;
          household_id: string;
          token?: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          expires_at?: string;
          household_id?: string;
          token?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          household_id: string;
          joined_at: string;
          role: "member" | "owner";
          user_id: string;
        };
        Insert: {
          household_id: string;
          joined_at?: string;
          role: "member" | "owner";
          user_id: string;
        };
        Update: {
          household_id?: string;
          joined_at?: string;
          role?: "member" | "owner";
          user_id?: string;
        };
        Relationships: [];
      };
      households: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      bootstrap_owner_household: {
        Args: { household_name?: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Household = Database["public"]["Tables"]["households"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
