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
      ai_credit_transactions: {
        Row: {
          balance_after: number | null;
          created_at: string;
          created_by: string | null;
          credit_balance_id: string | null;
          delta: number;
          id: string;
          kind:
            | "purchase"
            | "usage"
            | "refund"
            | "manual_adjustment"
            | "expiration";
          note: string | null;
          source: string | null;
          tenant_id: string;
        };
        Insert: {
          balance_after?: number | null;
          created_at?: string;
          created_by?: string | null;
          credit_balance_id?: string | null;
          delta: number;
          id?: string;
          kind:
            | "purchase"
            | "usage"
            | "refund"
            | "manual_adjustment"
            | "expiration";
          note?: string | null;
          source?: string | null;
          tenant_id: string;
        };
        Update: {
          balance_after?: number | null;
          created_at?: string;
          created_by?: string | null;
          credit_balance_id?: string | null;
          delta?: number;
          id?: string;
          kind?:
            | "purchase"
            | "usage"
            | "refund"
            | "manual_adjustment"
            | "expiration";
          note?: string | null;
          source?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_credit_transactions_credit_balance_id_fkey";
            columns: ["credit_balance_id"];
            referencedRelation: "ai_credits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_credit_transactions_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_credits: {
        Row: {
          balance: number;
          created_at: string;
          id: string;
          last_refilled_at: string | null;
          lifetime_purchased: number;
          lifetime_used: number;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          balance?: number;
          created_at?: string;
          id?: string;
          last_refilled_at?: string | null;
          lifetime_purchased?: number;
          lifetime_used?: number;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          id?: string;
          last_refilled_at?: string | null;
          lifetime_purchased?: number;
          lifetime_used?: number;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_credits_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          action: "INSERT" | "UPDATE" | "DELETE";
          changed_by: string | null;
          created_at: string;
          id: string;
          ip_address: string | null;
          new_data: Json | null;
          old_data: Json | null;
          record_id: string;
          table_name: string;
          tenant_id: string;
          user_agent: string | null;
        };
        Insert: {
          action: "INSERT" | "UPDATE" | "DELETE";
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id: string;
          table_name: string;
          tenant_id: string;
          user_agent?: string | null;
        };
        Update: {
          action?: "INSERT" | "UPDATE" | "DELETE";
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string;
          table_name?: string;
          tenant_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      departments: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_archived: boolean;
          manager_id: string | null;
          name: string;
          org_id: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          manager_id?: string | null;
          name: string;
          org_id: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          manager_id?: string | null;
          name?: string;
          org_id?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departments_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "departments_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      organizations: {
        Row: {
          address: Json;
          contact: Json;
          cost_center: string | null;
          created_at: string;
          id: string;
          is_archived: boolean;
          name: string;
          organization_number: string | null;
          slug: string | null;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          address?: Json;
          contact?: Json;
          cost_center?: string | null;
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          name: string;
          organization_number?: string | null;
          slug?: string | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          address?: Json;
          contact?: Json;
          cost_center?: string | null;
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          name?: string;
          organization_number?: string | null;
          slug?: string | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      sub_departments: {
        Row: {
          created_at: string;
          dept_id: string;
          description: string | null;
          id: string;
          is_archived: boolean;
          manager_id: string | null;
          name: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dept_id: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          manager_id?: string | null;
          name: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dept_id?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          manager_id?: string | null;
          name?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sub_departments_dept_id_fkey";
            columns: ["dept_id"];
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sub_departments_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      tenant_members: {
        Row: {
          created_at: string;
          dept_id: string | null;
          id: string;
          is_active: boolean;
          module_roles: Json;
          org_id: string | null;
          role: "owner" | "admin" | "member" | "viewer";
          sub_department_id: string | null;
          tenant_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dept_id?: string | null;
          id?: string;
          is_active?: boolean;
          module_roles?: Json;
          org_id?: string | null;
          role?: "owner" | "admin" | "member" | "viewer";
          sub_department_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dept_id?: string | null;
          id?: string;
          is_active?: boolean;
          module_roles?: Json;
          org_id?: string | null;
          role?: "owner" | "admin" | "member" | "viewer";
          sub_department_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_members_dept_id_fkey";
            columns: ["dept_id"];
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_members_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_members_sub_department_id_fkey";
            columns: ["sub_department_id"];
            referencedRelation: "sub_departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_members_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      tenants: {
        Row: {
          billing_email: string | null;
          billing_method: "stripe" | "ehf";
          created_at: string;
          current_period_end: string | null;
          display_name: string | null;
          fiscal_year_start_month: number;
          id: string;
          legal_name: string | null;
          locale: string;
          logo_url: string | null;
          metadata: Json;
          name: string;
          organization_number: string | null;
          peppol_address: string | null;
          phone: string | null;
          plan: "free" | "starter" | "professional" | "enterprise";
          plan_status: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
          primary_color: string | null;
          slug: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          timezone: string;
          trial_ends_at: string | null;
          updated_at: string;
          website: string | null;
          working_hours: Json;
        };
        Insert: {
          billing_email?: string | null;
          billing_method?: "stripe" | "ehf";
          created_at?: string;
          current_period_end?: string | null;
          display_name?: string | null;
          fiscal_year_start_month?: number;
          id?: string;
          legal_name?: string | null;
          locale?: string;
          logo_url?: string | null;
          metadata?: Json;
          name: string;
          organization_number?: string | null;
          peppol_address?: string | null;
          phone?: string | null;
          plan?: "free" | "starter" | "professional" | "enterprise";
          plan_status?: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
          primary_color?: string | null;
          slug: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          timezone?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
          website?: string | null;
          working_hours?: Json;
        };
        Update: {
          billing_email?: string | null;
          billing_method?: "stripe" | "ehf";
          created_at?: string;
          current_period_end?: string | null;
          display_name?: string | null;
          fiscal_year_start_month?: number;
          id?: string;
          legal_name?: string | null;
          locale?: string;
          logo_url?: string | null;
          metadata?: Json;
          name?: string;
          organization_number?: string | null;
          peppol_address?: string | null;
          phone?: string | null;
          plan?: "free" | "starter" | "professional" | "enterprise";
          plan_status?: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
          primary_color?: string | null;
          slug?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          timezone?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
          website?: string | null;
          working_hours?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_current_tenant_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["tenant_role"];
      };
    };
    Enums: {
      billing_method: "stripe" | "ehf";
      credit_transaction_kind:
        | "purchase"
        | "usage"
        | "refund"
        | "manual_adjustment"
        | "expiration";
      plan_status: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
      tenant_plan: "free" | "starter" | "professional" | "enterprise";
      tenant_role: "owner" | "admin" | "member" | "viewer";
    };
    CompositeTypes: Record<string, never>;
  };
};
