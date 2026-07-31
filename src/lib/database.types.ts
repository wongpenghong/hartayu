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
          emoji: string | null;
          household_id: string;
          id: string;
          name: string;
          primary_member_id: string | null;
        };
        Insert: {
          archived_at?: string | null;
          emoji?: string | null;
          household_id: string;
          id?: string;
          name: string;
          primary_member_id?: string | null;
        };
        Update: {
          archived_at?: string | null;
          emoji?: string | null;
          household_id?: string;
          id?: string;
          name?: string;
          primary_member_id?: string | null;
        };
        Relationships: [];
      };
      asset_classes: {
        Row: {
          household_id: string;
          id: string;
          is_starter: boolean;
          name: string;
        };
        Insert: {
          household_id: string;
          id?: string;
          is_starter?: boolean;
          name: string;
        };
        Update: {
          household_id?: string;
          id?: string;
          is_starter?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      bills: {
        Row: {
          amount_yen: number | null;
          category_id: string;
          created_at: string;
          default_attributed_member_id: string | null;
          default_pocket_id: string | null;
          due_day: number;
          household_id: string;
          id: string;
          is_active: boolean;
          last_paid_period: string | null;
          name: string;
        };
        Insert: {
          amount_yen?: number | null;
          category_id: string;
          created_at?: string;
          default_attributed_member_id?: string | null;
          default_pocket_id?: string | null;
          due_day: number;
          household_id: string;
          id?: string;
          is_active?: boolean;
          last_paid_period?: string | null;
          name: string;
        };
        Update: {
          amount_yen?: number | null;
          category_id?: string;
          created_at?: string;
          default_attributed_member_id?: string | null;
          default_pocket_id?: string | null;
          due_day?: number;
          household_id?: string;
          id?: string;
          is_active?: boolean;
          last_paid_period?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          emoji: string | null;
          household_id: string;
          id: string;
          is_starter: boolean;
          kind: "expense" | "income";
          monthly_limit_yen: number | null;
          name: string;
        };
        Insert: {
          emoji?: string | null;
          household_id: string;
          id?: string;
          is_starter?: boolean;
          kind: "expense" | "income";
          monthly_limit_yen?: number | null;
          name: string;
        };
        Update: {
          emoji?: string | null;
          household_id?: string;
          id?: string;
          is_starter?: boolean;
          kind?: "expense" | "income";
          monthly_limit_yen?: number | null;
          name?: string;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          account_id: string;
          amount_yen: number;
          bill_id: string | null;
          category_id: string | null;
          created_at: string;
          entry_date: string;
          foreign_amount_idr: number | null;
          household_id: string;
          id: string;
          kind: "expense" | "income" | "transfer";
          member_id: string;
          attributed_member_id: string | null;
          note: string | null;
          to_account_id: string | null;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          amount_yen: number;
          attributed_member_id?: string | null;
          bill_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          entry_date: string;
          foreign_amount_idr?: number | null;
          household_id: string;
          id?: string;
          kind: "expense" | "income" | "transfer";
          member_id: string;
          note?: string | null;
          to_account_id?: string | null;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          amount_yen?: number;
          attributed_member_id?: string | null;
          bill_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          entry_date?: string;
          foreign_amount_idr?: number | null;
          household_id?: string;
          id?: string;
          kind?: "expense" | "income" | "transfer";
          member_id?: string;
          note?: string | null;
          to_account_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      goal_contributions: {
        Row: {
          amount_yen: number;
          contribution_date: string;
          created_at: string;
          goal_id: string;
          household_id: string;
          id: string;
          member_id: string;
          attributed_member_id: string | null;
          note: string | null;
        };
        Insert: {
          amount_yen: number;
          contribution_date: string;
          created_at?: string;
          goal_id: string;
          household_id: string;
          id?: string;
          member_id: string;
          note?: string | null;
        };
        Update: {
          amount_yen?: number;
          contribution_date?: string;
          created_at?: string;
          goal_id?: string;
          household_id?: string;
          id?: string;
          member_id?: string;
          note?: string | null;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          created_at: string;
          emoji: string | null;
          household_id: string;
          id: string;
          linked_account_id: string | null;
          name: string;
          target_amount_yen: number;
          target_date: string | null;
        };
        Insert: {
          created_at?: string;
          emoji?: string | null;
          household_id: string;
          id?: string;
          linked_account_id?: string | null;
          name: string;
          target_amount_yen: number;
          target_date?: string | null;
        };
        Update: {
          created_at?: string;
          emoji?: string | null;
          household_id?: string;
          id?: string;
          linked_account_id?: string | null;
          name?: string;
          target_amount_yen?: number;
          target_date?: string | null;
        };
        Relationships: [];
      };
      holding_snapshots: {
        Row: {
          carried_forward: boolean;
          holding_id: string;
          id: string;
          session_id: string;
          total_value_yen: number | null;
          unit_price_yen: number | null;
        };
        Insert: {
          carried_forward?: boolean;
          holding_id: string;
          id?: string;
          session_id: string;
          total_value_yen?: number | null;
          unit_price_yen?: number | null;
        };
        Update: {
          carried_forward?: boolean;
          holding_id?: string;
          id?: string;
          session_id?: string;
          total_value_yen?: number | null;
          unit_price_yen?: number | null;
        };
        Relationships: [];
      };
      holdings: {
        Row: {
          asset_class_id: string;
          cost_basis_yen: number | null;
          created_at: string;
          household_id: string;
          id: string;
          name: string;
          quantity: number | null;
        };
        Insert: {
          asset_class_id: string;
          cost_basis_yen?: number | null;
          created_at?: string;
          household_id: string;
          id?: string;
          name: string;
          quantity?: number | null;
        };
        Update: {
          asset_class_id?: string;
          cost_basis_yen?: number | null;
          created_at?: string;
          household_id?: string;
          id?: string;
          name?: string;
          quantity?: number | null;
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
      snapshot_sessions: {
        Row: {
          as_of_date: string;
          created_at: string;
          household_id: string;
          id: string;
        };
        Insert: {
          as_of_date: string;
          created_at?: string;
          household_id: string;
          id?: string;
        };
        Update: {
          as_of_date?: string;
          created_at?: string;
          household_id?: string;
          id?: string;
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
      list_household_members: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          username: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Household = Database["public"]["Tables"]["households"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
