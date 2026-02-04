export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcement_comments: {
        Row: {
          announcement_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_pinned: boolean
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          title?: string
        }
        Relationships: []
      }
      auto_followup_logs: {
        Row: {
          created_at: string
          email_from: string
          email_to: string
          error_message: string | null
          followup_type: string
          id: string
          lead_id: string | null
          lead_name: string | null
          status: string
          template_name: string | null
        }
        Insert: {
          created_at?: string
          email_from: string
          email_to: string
          error_message?: string | null
          followup_type: string
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          status: string
          template_name?: string | null
        }
        Update: {
          created_at?: string
          email_from?: string
          email_to?: string
          error_message?: string | null
          followup_type?: string
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          status?: string
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_followup_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          client_id: string | null
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          lead_id: string | null
          start_date: string
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          lead_id?: string | null
          start_date: string
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          lead_id?: string | null
          start_date?: string
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_metrics: {
        Row: {
          bookings: number | null
          campaign_id: string
          clicks: number | null
          conversions: number | null
          created_at: string
          id: string
          impressions: number | null
          messages: number | null
          period_end: string
          period_start: string
          reach: number | null
          spend: number | null
        }
        Insert: {
          bookings?: number | null
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          id?: string
          impressions?: number | null
          messages?: number | null
          period_end: string
          period_start: string
          reach?: number | null
          spend?: number | null
        }
        Update: {
          bookings?: number | null
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          id?: string
          impressions?: number | null
          messages?: number | null
          period_end?: string
          period_start?: string
          reach?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          client_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          objective: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          objective?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          objective?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_app_activity: {
        Row: {
          client_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          subscription_code: string | null
          user_email: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          subscription_code?: string | null
          user_email?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          subscription_code?: string | null
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_app_activity_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_app_content: {
        Row: {
          content: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean
          order_index: number
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_app_documents: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          file_size: number | null
          file_url: string
          id: string
          storage_path: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          storage_path?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          storage_path?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_app_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_app_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_app_notifications: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_sent: boolean
          link_id: string | null
          link_type: string | null
          message: string
          notification_type: string
          sent_at: string | null
          title: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_sent?: boolean
          link_id?: string | null
          link_type?: string | null
          message: string
          notification_type?: string
          sent_at?: string | null
          title: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_sent?: boolean
          link_id?: string | null
          link_type?: string | null
          message?: string
          notification_type?: string
          sent_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_app_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_visibility_settings: {
        Row: {
          client_id: string
          created_at: string
          id: string
          show_campaigns: boolean
          show_documents: boolean
          show_guardian: boolean
          updated_at: string
          visible_document_types: string[] | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          show_campaigns?: boolean
          show_documents?: boolean
          show_guardian?: boolean
          updated_at?: string
          visible_document_types?: string[] | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          show_campaigns?: boolean
          show_documents?: boolean
          show_guardian?: boolean
          updated_at?: string
          visible_document_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "client_visibility_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assigned_to: string | null
          business_manager_url: string | null
          city: string | null
          contract_amount: number | null
          contract_duration_months: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          created_by: string | null
          email: string | null
          facebook_page: string | null
          id: string
          industry: string | null
          instagram: string | null
          lead_id: string | null
          monthly_budget: number | null
          notes: string | null
          owner_name: string | null
          phone: string | null
          salon_name: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          business_manager_url?: string | null
          city?: string | null
          contract_amount?: number | null
          contract_duration_months?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          facebook_page?: string | null
          id?: string
          industry?: string | null
          instagram?: string | null
          lead_id?: string | null
          monthly_budget?: number | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          salon_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          business_manager_url?: string | null
          city?: string | null
          contract_amount?: number | null
          contract_duration_months?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          facebook_page?: string | null
          id?: string
          industry?: string | null
          instagram?: string | null
          lead_id?: string | null
          monthly_budget?: number | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          salon_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          data: Json
          id: string
          lead_id: string | null
          subtitle: string | null
          thumbnail: string | null
          title: string
          type: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          data: Json
          id?: string
          lead_id?: string | null
          subtitle?: string | null
          thumbnail?: string | null
          title: string
          type: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          lead_id?: string | null
          subtitle?: string | null
          thumbnail?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          subject: string
          template_name: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          subject: string
          template_name: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          subject?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_interactions: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          new_value: string | null
          old_value: string | null
          title: string
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          new_value?: string | null
          old_value?: string | null
          title: string
          type: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          new_value?: string | null
          old_value?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          cold_email_date: string | null
          cold_email_sent: boolean | null
          created_at: string
          created_by: string | null
          email: string | null
          email_follow_up_1_date: string | null
          email_follow_up_1_sent: boolean | null
          email_follow_up_2_date: string | null
          email_follow_up_2_sent: boolean | null
          email_from: string | null
          email_template: string | null
          facebook_page: string | null
          follow_up_count: number | null
          id: string
          industry: string | null
          instagram: string | null
          last_contact_date: string | null
          last_follow_up_date: string | null
          next_follow_up_date: string | null
          notes: string | null
          owner_name: string | null
          phone: string | null
          priority: string | null
          response: string | null
          response_date: string | null
          salon_name: string
          sms_follow_up_date: string | null
          sms_follow_up_sent: boolean | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          cold_email_date?: string | null
          cold_email_sent?: boolean | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          email_follow_up_1_date?: string | null
          email_follow_up_1_sent?: boolean | null
          email_follow_up_2_date?: string | null
          email_follow_up_2_sent?: boolean | null
          email_from?: string | null
          email_template?: string | null
          facebook_page?: string | null
          follow_up_count?: number | null
          id?: string
          industry?: string | null
          instagram?: string | null
          last_contact_date?: string | null
          last_follow_up_date?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          priority?: string | null
          response?: string | null
          response_date?: string | null
          salon_name: string
          sms_follow_up_date?: string | null
          sms_follow_up_sent?: boolean | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          cold_email_date?: string | null
          cold_email_sent?: boolean | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          email_follow_up_1_date?: string | null
          email_follow_up_1_sent?: boolean | null
          email_follow_up_2_date?: string | null
          email_follow_up_2_sent?: boolean | null
          email_from?: string | null
          email_template?: string | null
          facebook_page?: string | null
          follow_up_count?: number | null
          id?: string
          industry?: string | null
          instagram?: string | null
          last_contact_date?: string | null
          last_follow_up_date?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          priority?: string | null
          response?: string | null
          response_date?: string | null
          salon_name?: string
          sms_follow_up_date?: string | null
          sms_follow_up_sent?: boolean | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reports: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          month: number
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data: Json
          id?: string
          month: number
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          month?: number
          year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          created_by: string | null
          document_id: string | null
          due_date: string
          id: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          due_date: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_final_invoices: {
        Row: {
          advance_amount: number
          advance_invoice_id: string
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          expected_date: string | null
          final_invoice_id: string | null
          id: string
          notes: string | null
          remaining_amount: number
          status: string
          total_amount: number
        }
        Insert: {
          advance_amount: number
          advance_invoice_id: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          final_invoice_id?: string | null
          id?: string
          notes?: string | null
          remaining_amount: number
          status?: string
          total_amount: number
        }
        Update: {
          advance_amount?: number
          advance_invoice_id?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          final_invoice_id?: string | null
          id?: string
          notes?: string | null
          remaining_amount?: number
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "pending_final_invoices_advance_invoice_id_fkey"
            columns: ["advance_invoice_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_final_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_final_invoices_final_invoice_id_fkey"
            columns: ["final_invoice_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_seen_at: string | null
          phone: string | null
          position: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          template_name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          template_name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_media_posts: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          file_url: string
          format: string
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url: string
          format: string
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string
          format?: string
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_codes: {
        Row: {
          client_id: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          updated_at: string
          used_at: string | null
          used_by_email: string | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          client_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          used_at?: string | null
          used_by_email?: string | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          client_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          used_at?: string | null
          used_by_email?: string | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_agency_task: boolean
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_agency_task?: boolean
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_agency_task?: boolean
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          reference_id: string | null
          reference_type: string | null
          reply_to_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          reply_to_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          reply_to_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          custom_role_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      zoho_credentials: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          email_account: string
          id: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string
          email_account: string
          id?: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          email_account?: string
          id?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_subscription_code: { Args: never; Returns: string }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_szef: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_permission:
        | "leads_view"
        | "leads_create"
        | "leads_edit"
        | "leads_delete"
        | "clients_view"
        | "clients_create"
        | "clients_edit"
        | "clients_delete"
        | "campaigns_view"
        | "campaigns_create"
        | "campaigns_edit"
        | "campaigns_delete"
        | "documents_view"
        | "documents_create"
        | "documents_edit"
        | "documents_delete"
        | "tasks_view"
        | "tasks_create"
        | "tasks_edit"
        | "tasks_delete"
        | "reports_generate"
        | "invoices_generate"
        | "contracts_generate"
        | "presentations_generate"
        | "team_manage"
        | "roles_manage"
        | "calendar_view"
        | "calendar_manage"
        | "templates_manage"
      app_role: "szef" | "pracownik"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: [
        "leads_view",
        "leads_create",
        "leads_edit",
        "leads_delete",
        "clients_view",
        "clients_create",
        "clients_edit",
        "clients_delete",
        "campaigns_view",
        "campaigns_create",
        "campaigns_edit",
        "campaigns_delete",
        "documents_view",
        "documents_create",
        "documents_edit",
        "documents_delete",
        "tasks_view",
        "tasks_create",
        "tasks_edit",
        "tasks_delete",
        "reports_generate",
        "invoices_generate",
        "contracts_generate",
        "presentations_generate",
        "team_manage",
        "roles_manage",
        "calendar_view",
        "calendar_manage",
        "templates_manage",
      ],
      app_role: ["szef", "pracownik"],
    },
  },
} as const
