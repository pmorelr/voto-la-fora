
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"alerts": {
                  Row: {
                    "confirm_token_hash": string,"confirmed_at": string | null,"created_at": string,"email": string,"id": string,"ip_hash": string | null,"kind": Database["public"]['Enums']["alert_kind"],"last_sent_at": string | null,"origin_hint": string | null,"origin_lat": number | null,"origin_lon": number | null,"origin_place": string | null,"unsubscribe_token": string,"voting_city_id": string
                  }
                  Insert: {
                    "confirm_token_hash": string,"confirmed_at"?: string | null,"created_at"?: string,"email": string,"id"?: string,"ip_hash"?: string | null,"kind"?: Database["public"]['Enums']["alert_kind"],"last_sent_at"?: string | null,"origin_hint"?: string | null,"origin_lat"?: number | null,"origin_lon"?: number | null,"origin_place"?: string | null,"unsubscribe_token": string,"voting_city_id": string
                  }
                  Update: {
                    "confirm_token_hash"?: string,"confirmed_at"?: string | null,"created_at"?: string,"email"?: string,"id"?: string,"ip_hash"?: string | null,"kind"?: Database["public"]['Enums']["alert_kind"],"last_sent_at"?: string | null,"origin_hint"?: string | null,"origin_lat"?: number | null,"origin_lon"?: number | null,"origin_place"?: string | null,"unsubscribe_token"?: string,"voting_city_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alerts_voting_city_id_fkey"
      columns: ["voting_city_id"]
isOneToOne: false
      referencedRelation: "voting_cities"
      referencedColumns: ["id"]
    }
                  ]
                },"countries": {
                  Row: {
                    "code": string,"name": string,"timezone": string
                  }
                  Insert: {
                    "code": string,"name": string,"timezone": string
                  }
                  Update: {
                    "code"?: string,"name"?: string,"timezone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"geocode_cache": {
                  Row: {
                    "created_at": string,"lat": number | null,"lon": number | null,"name": string | null,"query": string
                  }
                  Insert: {
                    "created_at"?: string,"lat"?: number | null,"lon"?: number | null,"name"?: string | null,"query": string
                  }
                  Update: {
                    "created_at"?: string,"lat"?: number | null,"lon"?: number | null,"name"?: string | null,"query"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "banned_at": string | null,"consented_at": string,"created_at": string,"first_name": string,"id": string
                  }
                  Insert: {
                    "banned_at"?: string | null,"consented_at": string,"created_at"?: string,"first_name": string,"id": string
                  }
                  Update: {
                    "banned_at"?: string | null,"consented_at"?: string,"created_at"?: string,"first_name"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"id": string,"ip_hash": string | null,"reason": string,"reporter_id": string | null,"resolved_at": string | null,"target_id": string,"target_kind": Database["public"]['Enums']["listing_kind"]
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"ip_hash"?: string | null,"reason": string,"reporter_id"?: string | null,"resolved_at"?: string | null,"target_id": string,"target_kind": Database["public"]['Enums']["listing_kind"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"ip_hash"?: string | null,"reason"?: string,"reporter_id"?: string | null,"resolved_at"?: string | null,"target_id"?: string,"target_kind"?: Database["public"]['Enums']["listing_kind"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"ride_requests": {
                  Row: {
                    "cancel_token_hash": string,"created_at": string,"decided_at": string | null,"email": string | null,"expires_at": string,"first_name": string,"flagged": boolean,"id": string,"ip_hash": string | null,"is_woman": boolean,"message": string,"people": number,"reminded_at": string | null,"ride_id": string,"status": Database["public"]['Enums']["request_status"],"whatsapp": string
                  }
                  Insert: {
                    "cancel_token_hash": string,"created_at"?: string,"decided_at"?: string | null,"email"?: string | null,"expires_at"?: string,"first_name": string,"flagged"?: boolean,"id"?: string,"ip_hash"?: string | null,"is_woman"?: boolean,"message": string,"people": number,"reminded_at"?: string | null,"ride_id": string,"status"?: Database["public"]['Enums']["request_status"],"whatsapp": string
                  }
                  Update: {
                    "cancel_token_hash"?: string,"created_at"?: string,"decided_at"?: string | null,"email"?: string | null,"expires_at"?: string,"first_name"?: string,"flagged"?: boolean,"id"?: string,"ip_hash"?: string | null,"is_woman"?: boolean,"message"?: string,"people"?: number,"reminded_at"?: string | null,"ride_id"?: string,"status"?: Database["public"]['Enums']["request_status"],"whatsapp"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ride_requests_ride_id_fkey"
      columns: ["ride_id"]
isOneToOne: false
      referencedRelation: "rides"
      referencedColumns: ["id"]
    }
                  ]
                },"rides": {
                  Row: {
                    "created_at": string,"depart_at": string,"driver_id": string,"id": string,"meeting_hint": string | null,"notes": string | null,"origin_city": string,"origin_lat": number | null,"origin_lon": number | null,"return_at": string | null,"reviewed_at": string | null,"seats_taken": number,"seats_total": number,"status": Database["public"]['Enums']["listing_status"],"updated_at": string,"vehicle": Database["public"]['Enums']["vehicle"],"voting_city_id": string,"women_only": boolean
                  }
                  Insert: {
                    "created_at"?: string,"depart_at": string,"driver_id": string,"id"?: string,"meeting_hint"?: string | null,"notes"?: string | null,"origin_city": string,"origin_lat"?: number | null,"origin_lon"?: number | null,"return_at"?: string | null,"reviewed_at"?: string | null,"seats_taken"?: number,"seats_total": number,"status"?: Database["public"]['Enums']["listing_status"],"updated_at"?: string,"vehicle"?: Database["public"]['Enums']["vehicle"],"voting_city_id": string,"women_only"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"depart_at"?: string,"driver_id"?: string,"id"?: string,"meeting_hint"?: string | null,"notes"?: string | null,"origin_city"?: string,"origin_lat"?: number | null,"origin_lon"?: number | null,"return_at"?: string | null,"reviewed_at"?: string | null,"seats_taken"?: number,"seats_total"?: number,"status"?: Database["public"]['Enums']["listing_status"],"updated_at"?: string,"vehicle"?: Database["public"]['Enums']["vehicle"],"voting_city_id"?: string,"women_only"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "rides_driver_id_fkey"
      columns: ["driver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rides_voting_city_id_fkey"
      columns: ["voting_city_id"]
isOneToOne: false
      referencedRelation: "voting_cities"
      referencedColumns: ["id"]
    }
                  ]
                },"stay_requests": {
                  Row: {
                    "cancel_token_hash": string,"created_at": string,"decided_at": string | null,"email": string | null,"expires_at": string,"first_name": string,"flagged": boolean,"id": string,"ip_hash": string | null,"is_woman": boolean,"message": string,"nights": (string)[],"people": number,"reminded_at": string | null,"status": Database["public"]['Enums']["request_status"],"stay_id": string,"whatsapp": string
                  }
                  Insert: {
                    "cancel_token_hash": string,"created_at"?: string,"decided_at"?: string | null,"email"?: string | null,"expires_at"?: string,"first_name": string,"flagged"?: boolean,"id"?: string,"ip_hash"?: string | null,"is_woman"?: boolean,"message": string,"nights": (string)[],"people": number,"reminded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"stay_id": string,"whatsapp": string
                  }
                  Update: {
                    "cancel_token_hash"?: string,"created_at"?: string,"decided_at"?: string | null,"email"?: string | null,"expires_at"?: string,"first_name"?: string,"flagged"?: boolean,"id"?: string,"ip_hash"?: string | null,"is_woman"?: boolean,"message"?: string,"nights"?: (string)[],"people"?: number,"reminded_at"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"stay_id"?: string,"whatsapp"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stay_requests_stay_id_fkey"
      columns: ["stay_id"]
isOneToOne: false
      referencedRelation: "stays"
      referencedColumns: ["id"]
    }
                  ]
                },"stays": {
                  Row: {
                    "area_hint": string,"capacity": number,"created_at": string,"host_id": string,"id": string,"kind": Database["public"]['Enums']["stay_kind"],"nights": (string)[],"reviewed_at": string | null,"rules": string | null,"status": Database["public"]['Enums']["listing_status"],"updated_at": string,"voting_city_id": string,"women_only": boolean
                  }
                  Insert: {
                    "area_hint": string,"capacity": number,"created_at"?: string,"host_id": string,"id"?: string,"kind": Database["public"]['Enums']["stay_kind"],"nights": (string)[],"reviewed_at"?: string | null,"rules"?: string | null,"status"?: Database["public"]['Enums']["listing_status"],"updated_at"?: string,"voting_city_id": string,"women_only"?: boolean
                  }
                  Update: {
                    "area_hint"?: string,"capacity"?: number,"created_at"?: string,"host_id"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["stay_kind"],"nights"?: (string)[],"reviewed_at"?: string | null,"rules"?: string | null,"status"?: Database["public"]['Enums']["listing_status"],"updated_at"?: string,"voting_city_id"?: string,"women_only"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "stays_host_id_fkey"
      columns: ["host_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stays_voting_city_id_fkey"
      columns: ["voting_city_id"]
isOneToOne: false
      referencedRelation: "voting_cities"
      referencedColumns: ["id"]
    }
                  ]
                },"stories": {
                  Row: {
                    "body": string,"city": string | null,"consented_at": string,"created_at": string,"first_name": string | null,"id": string,"invite_hash": string,"reviewed_at": string | null,"status": string,"updated_at": string
                  }
                  Insert: {
                    "body": string,"city"?: string | null,"consented_at": string,"created_at"?: string,"first_name"?: string | null,"id"?: string,"invite_hash": string,"reviewed_at"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"city"?: string | null,"consented_at"?: string,"created_at"?: string,"first_name"?: string | null,"id"?: string,"invite_hash"?: string,"reviewed_at"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"voting_cities": {
                  Row: {
                    "abstention_pct": number | null,"address": string | null,"country_code": string,"created_at": string,"has_section": boolean,"hours": string | null,"id": string,"lat": number | null,"lon": number | null,"name": string,"notes": string | null,"parent_id": string | null,"place_voters": number | null,"slug": string,"sort_order": number,"timezone": string,"tse_code": string,"turnout": number,"venue_name": string | null,"voters": number
                  }
                  Insert: {
                    "abstention_pct"?: number | null,"address"?: string | null,"country_code": string,"created_at"?: string,"has_section"?: boolean,"hours"?: string | null,"id"?: string,"lat"?: number | null,"lon"?: number | null,"name": string,"notes"?: string | null,"parent_id"?: string | null,"place_voters"?: number | null,"slug": string,"sort_order"?: number,"timezone": string,"tse_code": string,"turnout"?: number,"venue_name"?: string | null,"voters"?: number
                  }
                  Update: {
                    "abstention_pct"?: number | null,"address"?: string | null,"country_code"?: string,"created_at"?: string,"has_section"?: boolean,"hours"?: string | null,"id"?: string,"lat"?: number | null,"lon"?: number | null,"name"?: string,"notes"?: string | null,"parent_id"?: string | null,"place_voters"?: number | null,"slug"?: string,"sort_order"?: number,"timezone"?: string,"tse_code"?: string,"turnout"?: number,"venue_name"?: string | null,"voters"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "voting_cities_country_code_fkey"
      columns: ["country_code"]
isOneToOne: false
      referencedRelation: "countries"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "voting_cities_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "voting_cities"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_ban":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"admin_clear_text":
{ Args: { "p_id": string,"p_kind": Database["public"]['Enums']["listing_kind"] }; Returns: undefined
                           },
"admin_close_reports":
{ Args: { "p_id": string,"p_kind": Database["public"]['Enums']["listing_kind"] }; Returns: number
                           },
"admin_queue":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_reports":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_resolve_report":
{ Args: { "p_id": string }; Returns: undefined
                           },
"admin_review":
{ Args: { "p_approve": boolean,"p_id": string,"p_kind": Database["public"]['Enums']["listing_kind"] }; Returns: Json
                           },
"admin_review_story":
{ Args: { "p_id": string,"p_status": string }; Returns: undefined
                           },
"admin_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_stories":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"alerts_digest":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"cancel_request_by_token":
{ Args: { "p_token": string }; Returns: Json
                           },
"city_listings":
{ Args: { "p_slug": string }; Returns: Json
                           },
"confirm_alert":
{ Args: { "p_token": string }; Returns: Json
                           },
"countries_overview":
{ Args: Record<PropertyKey, never>; Returns: {
              "abstention_pct": number,"cities": number,"code": string,"lat": number,"lon": number,"name": string,"open_rides": number,"open_stays": number,"voters": number
            }[]
                           },
"country_overview":
{ Args: { "p_country": string }; Returns: {
              "abstention_pct": number,"lat": number,"lon": number,"name": string,"open_rides": number,"open_seats": number,"open_stays": number,"slug": string,"venue_name": string,"voters": number
            }[]
                           },
"create_alert":
{ Args: { "p_city_slug": string,"p_email": string,"p_ip_hash": string,"p_kind": Database["public"]['Enums']["alert_kind"],"p_origin_hint": string }; Returns: Json
                           },
"create_request":
{ Args: { "p_email": string,"p_first_name": string,"p_ip_hash": string,"p_is_woman": boolean,"p_kind": Database["public"]['Enums']["listing_kind"],"p_listing_id": string,"p_message": string,"p_nights": (string)[],"p_people": number,"p_whatsapp": string }; Returns: Json
                           },
"create_ride":
{ Args: { "p_city_slug": string,"p_depart_at": string,"p_meeting_hint": string,"p_notes": string,"p_origin_city": string,"p_origin_lat": number,"p_origin_lon": number,"p_return_at": string,"p_seats_total": number,"p_vehicle": Database["public"]['Enums']["vehicle"],"p_women_only": boolean }; Returns: string
                           },
"create_stay":
{ Args: { "p_area_hint": string,"p_capacity": number,"p_city_slug": string,"p_kind": Database["public"]['Enums']["stay_kind"],"p_nights": (string)[],"p_rules": string,"p_women_only": boolean }; Returns: string
                           },
"decide_request":
{ Args: { "p_accept": boolean,"p_kind": Database["public"]['Enums']["listing_kind"],"p_request_id": string }; Returns: Json
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"expire_stale_requests":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"flag_request":
{ Args: { "p_kind": Database["public"]['Enums']["listing_kind"],"p_request_id": string }; Returns: undefined
                           },
"mark_alerts_sent":
{ Args: { "p_ids": (string)[] }; Returns: undefined
                           },
"mark_campaign_sent":
{ Args: { "p_campaign": string,"p_emails": (string)[],"p_role": string }; Returns: undefined
                           },
"my_dashboard":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"pending_reminders":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"public_stories":
{ Args: Record<PropertyKey, never>; Returns: {
              "body": string,"city": string,"first_name": string,"id": string
            }[]
                           },
"purge_stale_data":
{ Args: { "p_now"?: string }; Returns: Json
                           },
"report_listing":
{ Args: { "p_id": string,"p_ip_hash": string,"p_kind": Database["public"]['Enums']["listing_kind"],"p_reason": string,"p_reporter": string }; Returns: undefined
                           },
"ride_demand":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"save_profile":
{ Args: { "p_consent": boolean,"p_first_name": string }; Returns: undefined
                           },
"set_listing_status":
{ Args: { "p_id": string,"p_kind": Database["public"]['Enums']["listing_kind"],"p_status": Database["public"]['Enums']["listing_status"] }; Returns: Json
                           },
"site_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "cities": number,"countries": number,"offerers": number,"people": number,"requesters": number,"requests": number,"rides": number,"stays": number
            }[]
                           },
"story_audience_count":
{ Args: { "p_campaign": string }; Returns: number
                           },
"story_get":
{ Args: { "p_token": string }; Returns: Json
                           },
"story_invites_create":
{ Args: { "p_campaign": string }; Returns: Json
                           },
"story_submit":
{ Args: { "p_body": string,"p_city": string,"p_first_name": string,"p_token": string }; Returns: undefined
                           },
"trip_tips_recipients":
{ Args: { "p_campaign": string }; Returns: Json
                           },
"unsubscribe_alert":
{ Args: { "p_token": string }; Returns: boolean
                           },
"update_ride":
{ Args: { "p_depart_at": string,"p_id": string,"p_meeting_hint": string,"p_notes": string,"p_origin_city": string,"p_origin_lat": number,"p_origin_lon": number,"p_return_at": string,"p_seats_total": number,"p_vehicle": Database["public"]['Enums']["vehicle"],"p_women_only": boolean }; Returns: undefined
                           },
"update_stay":
{ Args: { "p_area_hint": string,"p_capacity": number,"p_id": string,"p_kind": Database["public"]['Enums']["stay_kind"],"p_nights": (string)[],"p_rules": string,"p_women_only": boolean }; Returns: undefined
                           }
          }
          Enums: {
            "alert_kind": "ride"|"stay"|"both","listing_kind": "ride"|"stay","listing_status": "open"|"full"|"paused"|"cancelled"|"removed","request_status": "pending"|"confirmed"|"declined"|"cancelled"|"expired","stay_kind": "room"|"couch"|"mattress","vehicle": "car"|"van"|"train"|"bus"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "alert_kind": ["ride", "stay", "both"],"listing_kind": ["ride", "stay"],"listing_status": ["open", "full", "paused", "cancelled", "removed"],"request_status": ["pending", "confirmed", "declined", "cancelled", "expired"],"stay_kind": ["room", "couch", "mattress"],"vehicle": ["car", "van", "train", "bus"]
          }
        }
} as const
