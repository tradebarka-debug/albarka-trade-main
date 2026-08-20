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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: number
          ip_address: string | null
          record_id: number | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: number
          ip_address?: string | null
          record_id?: number | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: number
          ip_address?: string | null
          record_id?: number | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          city_id: number | null
          commune_id: number | null
          country_id: number | null
          created_at: string | null
          district_id: number | null
          email: string | null
          id: number
          manager_name: string | null
          name: string
          referral_code: string | null
          status: string | null
          telephone: string | null
        }
        Insert: {
          city_id?: number | null
          commune_id?: number | null
          country_id?: number | null
          created_at?: string | null
          district_id?: number | null
          email?: string | null
          id?: number
          manager_name?: string | null
          name: string
          referral_code?: string | null
          status?: string | null
          telephone?: string | null
        }
        Update: {
          city_id?: number | null
          commune_id?: number | null
          country_id?: number | null
          created_at?: string | null
          district_id?: number | null
          email?: string | null
          id?: number
          manager_name?: string | null
          name?: string
          referral_code?: string | null
          status?: string | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agencies_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agencies_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agencies_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          age: string | null
          city: string | null
          created_at: string
          education: string | null
          email: string | null
          experience: string | null
          gender: string | null
          id: number
          message: string | null
          name: string | null
          status: string | null
          telephone: string | null
          tracking_code: string | null
        }
        Insert: {
          age?: string | null
          city?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience?: string | null
          gender?: string | null
          id?: number
          message?: string | null
          name?: string | null
          status?: string | null
          telephone?: string | null
          tracking_code?: string | null
        }
        Update: {
          age?: string | null
          city?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience?: string | null
          gender?: string | null
          id?: number
          message?: string | null
          name?: string | null
          status?: string | null
          telephone?: string | null
          tracking_code?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number
          booking_number: string | null
          booking_status: string | null
          company: string
          company_id: number | null
          created_at: string | null
          departure: string
          departure_city_id: number | null
          destination: string
          destination_city_id: number | null
          id: string
          passenger_name: string
          payment_reference: string | null
          payment_status: string | null
          phone: string
          qr_code: string | null
          seat_number: string | null
          seats: number | null
          travel_date: string
          travel_time: string | null
          updated_at: string | null
          voyage_id: number | null
        }
        Insert: {
          amount: number
          booking_number?: string | null
          booking_status?: string | null
          company: string
          company_id?: number | null
          created_at?: string | null
          departure: string
          departure_city_id?: number | null
          destination: string
          destination_city_id?: number | null
          id?: string
          passenger_name: string
          payment_reference?: string | null
          payment_status?: string | null
          phone: string
          qr_code?: string | null
          seat_number?: string | null
          seats?: number | null
          travel_date: string
          travel_time?: string | null
          updated_at?: string | null
          voyage_id?: number | null
        }
        Update: {
          amount?: number
          booking_number?: string | null
          booking_status?: string | null
          company?: string
          company_id?: number | null
          created_at?: string | null
          departure?: string
          departure_city_id?: number | null
          destination?: string
          destination_city_id?: number | null
          id?: string
          passenger_name?: string
          payment_reference?: string | null
          payment_status?: string | null
          phone?: string
          qr_code?: string | null
          seat_number?: string | null
          seats?: number | null
          travel_date?: string
          travel_time?: string | null
          updated_at?: string | null
          voyage_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_booking_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "transport_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_departure"
            columns: ["departure_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_destination"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_booking_voyage"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          area_km2: number | null
          country_id: number
          created_at: string | null
          id: number
          latitude: number | null
          longitude: number | null
          name: string
          population: number | null
          postal_code: string | null
          region_id: number | null
        }
        Insert: {
          area_km2?: number | null
          country_id: number
          created_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          name: string
          population?: number | null
          postal_code?: string | null
          region_id?: number | null
        }
        Update: {
          area_km2?: number | null
          country_id?: number
          created_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          name?: string
          population?: number | null
          postal_code?: string | null
          region_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      commercials: {
        Row: {
          agency_name: string | null
          city_id: number | null
          commune_id: number | null
          country_id: number | null
          created_at: string | null
          district_id: number | null
          employee_code: string | null
          first_name: string | null
          id: number
          last_name: string | null
          profile_id: string | null
          referral_code: string | null
          status: string | null
          telephone: string | null
        }
        Insert: {
          agency_name?: string | null
          city_id?: number | null
          commune_id?: number | null
          country_id?: number | null
          created_at?: string | null
          district_id?: number | null
          employee_code?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          profile_id?: string | null
          referral_code?: string | null
          status?: string | null
          telephone?: string | null
        }
        Update: {
          agency_name?: string | null
          city_id?: number | null
          commune_id?: number | null
          country_id?: number | null
          created_at?: string | null
          district_id?: number | null
          employee_code?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          profile_id?: string | null
          referral_code?: string | null
          status?: string | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercials_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercials_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercials_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercials_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercials_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          agency_id: number | null
          amount: number
          commercial_id: number | null
          commission_type: string | null
          created_at: string | null
          id: number
          notes: string | null
          order_total: number | null
          paid_at: string | null
          percentage: number | null
          restaurant_id: string | null
          status: string | null
          subscription_id: number | null
          wallet_processed: boolean | null
        }
        Insert: {
          agency_id?: number | null
          amount: number
          commercial_id?: number | null
          commission_type?: string | null
          created_at?: string | null
          id?: number
          notes?: string | null
          order_total?: number | null
          paid_at?: string | null
          percentage?: number | null
          restaurant_id?: string | null
          status?: string | null
          subscription_id?: number | null
          wallet_processed?: boolean | null
        }
        Update: {
          agency_id?: number | null
          amount?: number
          commercial_id?: number | null
          commission_type?: string | null
          created_at?: string | null
          id?: number
          notes?: string | null
          order_total?: number | null
          paid_at?: string | null
          percentage?: number | null
          restaurant_id?: string | null
          status?: string | null
          subscription_id?: number | null
          wallet_processed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "commercials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      communes: {
        Row: {
          area_km2: number | null
          city_id: number
          created_at: string | null
          distance_from_center_km: number | null
          id: number
          latitude: number | null
          longitude: number | null
          name: string
          population: number | null
        }
        Insert: {
          area_km2?: number | null
          city_id: number
          created_at?: string | null
          distance_from_center_km?: number | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          name: string
          population?: number | null
        }
        Update: {
          area_km2?: number | null
          city_id?: number
          created_at?: string | null
          distance_from_center_km?: number | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          name?: string
          population?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "communes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string | null
          currency: string | null
          id: number
          iso_code: string | null
          name: string
          phone_code: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: number
          iso_code?: string | null
          name: string
          phone_code?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: number
          iso_code?: string | null
          name?: string
          phone_code?: string | null
        }
        Relationships: []
      }
      courier_services: {
        Row: {
          company_id: number | null
          country_id: number | null
          created_at: string
          departure_city_id: number | null
          description: string | null
          destination_city_id: number | null
          estimated_delivery_time: string | null
          id: number
          image_url: string | null
          is_active: boolean | null
          max_weight: number | null
          name: string
          order_display: number | null
          starting_price: number | null
        }
        Insert: {
          company_id?: number | null
          country_id?: number | null
          created_at?: string
          departure_city_id?: number | null
          description?: string | null
          destination_city_id?: number | null
          estimated_delivery_time?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          max_weight?: number | null
          name: string
          order_display?: number | null
          starting_price?: number | null
        }
        Update: {
          company_id?: number | null
          country_id?: number | null
          created_at?: string
          departure_city_id?: number | null
          description?: string | null
          destination_city_id?: number | null
          estimated_delivery_time?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          max_weight?: number | null
          name?: string
          order_display?: number | null
          starting_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_services_company_fk"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "transport_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_services_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_services_departure_city_fk"
            columns: ["departure_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_services_destination_city_fk"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string | null
          delivery_fee: number | null
          delivery_time: string | null
          distance_km: number | null
          driver_id: string | null
          id: number
          order_id: string | null
          pickup_time: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          distance_km?: number | null
          driver_id?: string | null
          id?: number
          order_id?: string | null
          pickup_time?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          distance_km?: number | null
          driver_id?: string | null
          id?: number
          order_id?: string | null
          pickup_time?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          area_km2: number | null
          code: string | null
          commune_id: number
          created_at: string | null
          id: number
          latitude: number | null
          longitude: number | null
          name: string
          population: number | null
          type: string | null
        }
        Insert: {
          area_km2?: number | null
          code?: string | null
          commune_id: number
          created_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          name: string
          population?: number | null
          type?: string | null
        }
        Update: {
          area_km2?: number | null
          code?: string | null
          commune_id?: number
          created_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          name?: string
          population?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "districts_commune_id_fkey"
            columns: ["commune_id"]
            isOneToOne: false
            referencedRelation: "communes"
            referencedColumns: ["id"]
          },
        ]
      }
      fastfood_items: {
        Row: {
          category: string | null
          country_id: number | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          image_url: string | null
          is_active: boolean | null
          name: string | null
          order: number | null
          price: number | null
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          country_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string | null
          order?: number | null
          price?: number | null
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          country_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string | null
          order?: number | null
          price?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fastfood_items_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      formations: {
        Row: {
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          price: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          price?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          price?: string | null
          title?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          location: string | null
          title: string | null
          tracking_code: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          title?: string | null
          tracking_code?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          title?: string | null
          tracking_code?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          agency_id: number | null
          commercial_id: number | null
          created_at: string
          customer_name: string | null
          id: string
          items: string | null
          partner_id: string | null
          payment_method: string | null
          promo_code: string | null
          referral_code: string | null
          screenshot: string | null
          screenshot_url: string | null
          status: string | null
          telephone: string | null
          total: number | null
          transaction_ref: string | null
        }
        Insert: {
          address?: string | null
          agency_id?: number | null
          commercial_id?: number | null
          created_at?: string
          customer_name?: string | null
          id?: string
          items?: string | null
          partner_id?: string | null
          payment_method?: string | null
          promo_code?: string | null
          referral_code?: string | null
          screenshot?: string | null
          screenshot_url?: string | null
          status?: string | null
          telephone?: string | null
          total?: number | null
          transaction_ref?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: number | null
          commercial_id?: number | null
          created_at?: string
          customer_name?: string | null
          id?: string
          items?: string | null
          partner_id?: string | null
          payment_method?: string | null
          promo_code?: string | null
          referral_code?: string | null
          screenshot?: string | null
          screenshot_url?: string | null
          status?: string | null
          telephone?: string | null
          total?: number | null
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "commercials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_representants: {
        Row: {
          code_representant: string
          created_at: string | null
          email: string
          expire_le: string
          id: string
          otp: string
          utilise: boolean | null
        }
        Insert: {
          code_representant: string
          created_at?: string | null
          email: string
          expire_le: string
          id?: string
          otp: string
          utilise?: boolean | null
        }
        Update: {
          code_representant?: string
          created_at?: string | null
          email?: string
          expire_le?: string
          id?: string
          otp?: string
          utilise?: boolean | null
        }
        Relationships: []
      }
      packs: {
        Row: {
          active: boolean | null
          commission: number
          created_at: string | null
          description: string | null
          duration_days: number | null
          id: number
          name: string
          price: number
        }
        Insert: {
          active?: boolean | null
          commission: number
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          id?: number
          name: string
          price: number
        }
        Update: {
          active?: boolean | null
          commission?: number
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          id?: number
          name?: string
          price?: number
        }
        Relationships: []
      }
      partner_requests: {
        Row: {
          category: string
          created_at: string | null
          id: string
          nom_entreprise: string
          statut: string | null
          telephone: string
          ville: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          nom_entreprise: string
          statut?: string | null
          telephone: string
          ville?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          nom_entreprise?: string
          statut?: string | null
          telephone?: string
          ville?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          code: string | null
          commission: number | null
          created_at: string
          id: string
          level: string | null
          name: string | null
          referral_code: string | null
          sales: number | null
          status: string | null
        }
        Insert: {
          code?: string | null
          commission?: number | null
          created_at: string
          id?: string
          level?: string | null
          name?: string | null
          referral_code?: string | null
          sales?: number | null
          status?: string | null
        }
        Update: {
          code?: string | null
          commission?: number | null
          created_at?: string
          id?: string
          level?: string | null
          name?: string | null
          referral_code?: string | null
          sales?: number | null
          status?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: number
          paid_at: string | null
          payment_method: string | null
          status: string | null
          subscription_id: number | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: number
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: number | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: number
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: number | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category: string
          created_at: string | null
          district_id: number | null
          email: string | null
          id: number
          latitude: number | null
          longitude: number | null
          name: string
          status: string | null
          telephone: string | null
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string | null
          district_id?: number | null
          email?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          name: string
          status?: string | null
          telephone?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string | null
          district_id?: number | null
          email?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          name?: string
          status?: string | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          country_id: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          home_sort_order: number | null
          in_stock: boolean | null
          is_home_featured: boolean
          is_active: boolean | null
          name: string | null
          price: number | null
          sort_order: number | null
          stock_quantity: number | null
          supplier_id: number | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          home_sort_order?: number | null
          in_stock?: boolean | null
          is_home_featured?: boolean
          is_active?: boolean | null
          name?: string | null
          price?: number | null
          sort_order?: number | null
          stock_quantity?: number | null
          supplier_id?: number | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          home_sort_order?: number | null
          in_stock?: boolean | null
          is_home_featured?: boolean
          is_active?: boolean | null
          name?: string | null
          price?: number | null
          sort_order?: number | null
          stock_quantity?: number | null
          supplier_id?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nom: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          telephone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nom?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          telephone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          telephone?: string | null
        }
        Relationships: []
      }
      prospections: {
        Row: {
          commercial_id: string | null
          commission: number | null
          created_at: string | null
          id: number
          notes: string | null
          pack_amount: number | null
          place_id: number | null
          status: string | null
          visit_date: string | null
        }
        Insert: {
          commercial_id?: string | null
          commission?: number | null
          created_at?: string | null
          id?: number
          notes?: string | null
          pack_amount?: number | null
          place_id?: number | null
          status?: string | null
          visit_date?: string | null
        }
        Update: {
          commercial_id?: string | null
          commission?: number | null
          created_at?: string | null
          id?: number
          notes?: string | null
          pack_amount?: number | null
          place_id?: number | null
          status?: string | null
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospections_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospections_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          created_at: string
          customer_name: string | null
          id: number
          message: string | null
          product_id: string | null
          quantity: number | null
          supplier_id: number | null
          telephone: string | null
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: number
          message?: string | null
          product_id?: string | null
          quantity?: number | null
          supplier_id?: number | null
          telephone?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: number
          message?: string | null
          product_id?: string | null
          quantity?: number | null
          supplier_id?: number | null
          telephone?: string | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          country_id: number
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          country_id: number
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          country_id?: number
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      representants: {
        Row: {
          actif: boolean | null
          code: string
          code_parrain: string | null
          commission_disponible: number | null
          commission_totale: number | null
          created_at: string | null
          date_activation: string | null
          date_expiration: string | null
          email: string | null
          gains_mensuels: number | null
          gains_totaux: number | null
          id: string
          niveau: number | null
          nom: string | null
          nombre_commandes: number | null
          nombre_filleuls: number | null
          numero_piece: string | null
          objectif_commandes: number | null
          otp: string | null
          otp_expire: string | null
          pack: string | null
          parrain: string | null
          pays: string | null
          pin: string | null
          prenom: string | null
          qr_code: string | null
          statut: string | null
          telephone: string | null
          type_piece: string | null
          ville: string | null
        }
        Insert: {
          actif?: boolean | null
          code: string
          code_parrain?: string | null
          commission_disponible?: number | null
          commission_totale?: number | null
          created_at?: string | null
          date_activation?: string | null
          date_expiration?: string | null
          email?: string | null
          gains_mensuels?: number | null
          gains_totaux?: number | null
          id?: string
          niveau?: number | null
          nom?: string | null
          nombre_commandes?: number | null
          nombre_filleuls?: number | null
          numero_piece?: string | null
          objectif_commandes?: number | null
          otp?: string | null
          otp_expire?: string | null
          pack?: string | null
          parrain?: string | null
          pays?: string | null
          pin?: string | null
          prenom?: string | null
          qr_code?: string | null
          statut?: string | null
          telephone?: string | null
          type_piece?: string | null
          ville?: string | null
        }
        Update: {
          actif?: boolean | null
          code?: string
          code_parrain?: string | null
          commission_disponible?: number | null
          commission_totale?: number | null
          created_at?: string | null
          date_activation?: string | null
          date_expiration?: string | null
          email?: string | null
          gains_mensuels?: number | null
          gains_totaux?: number | null
          id?: string
          niveau?: number | null
          nom?: string | null
          nombre_commandes?: number | null
          nombre_filleuls?: number | null
          numero_piece?: string | null
          objectif_commandes?: number | null
          otp?: string | null
          otp_expire?: string | null
          pack?: string | null
          parrain?: string | null
          pays?: string | null
          pin?: string | null
          prenom?: string | null
          qr_code?: string | null
          statut?: string | null
          telephone?: string | null
          type_piece?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      restaurant_menu_items: {
        Row: {
          country: string | null
          country_id: number | null
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          is_available: boolean | null
          name: string | null
          price: number | null
          restaurant_id: string | null
          sort_order: number | null
        }
        Insert: {
          country?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          name?: string | null
          price?: number | null
          restaurant_id?: string | null
          sort_order?: number | null
        }
        Update: {
          country?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          name?: string | null
          price?: number | null
          restaurant_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menu_items_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_partners: {
        Row: {
          category: string | null
          country: string | null
          country_id: number | null
          created_at: string
          description: string | null
          hours: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          name: string | null
          slug: string | null
          sort_order: number | null
          telephone: string | null
        }
        Insert: {
          category?: string | null
          country?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          slug?: string | null
          sort_order?: number | null
          telephone?: string | null
        }
        Update: {
          category?: string | null
          country?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          slug?: string | null
          sort_order?: number | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_partners_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          active: boolean | null
          arrival_time: string | null
          available_seats: number | null
          company_id: number | null
          country_id: number | null
          created_at: string | null
          departure_city_id: number | null
          departure_time: string
          destination_city_id: number | null
          id: string
          price: number
          voyage_id: number | null
        }
        Insert: {
          active?: boolean | null
          arrival_time?: string | null
          available_seats?: number | null
          company_id?: number | null
          country_id?: number | null
          created_at?: string | null
          departure_city_id?: number | null
          departure_time: string
          destination_city_id?: number | null
          id?: string
          price: number
          voyage_id?: number | null
        }
        Update: {
          active?: boolean | null
          arrival_time?: string | null
          available_seats?: number | null
          company_id?: number | null
          country_id?: number | null
          created_at?: string | null
          departure_city_id?: number | null
          departure_time?: string
          destination_city_id?: number | null
          id?: string
          price?: number
          voyage_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_routes_voyage"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "transport_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_departure_city_id_fkey"
            columns: ["departure_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_destination_city_id_fkey"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          created_at: string
          email: string | null
          id: number
          message: string | null
          name: string | null
          service_type: string | null
          status: string | null
          telephone: string | null
          tracking_code: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
          service_type?: string | null
          status?: string | null
          telephone?: string | null
          tracking_code?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
          service_type?: string | null
          status?: string | null
          telephone?: string | null
          tracking_code?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          country_id: number | null
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          title: string | null
          tracking_code: string | null
        }
        Insert: {
          country_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          title?: string | null
          tracking_code?: string | null
        }
        Update: {
          country_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          title?: string | null
          tracking_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      spontaneous_applications: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          id: number
          profile: string | null
          status: string | null
          telephone: string | null
          tracking_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: number
          profile?: string | null
          status?: string | null
          telephone?: string | null
          tracking_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: number
          profile?: string | null
          status?: string | null
          telephone?: string | null
          tracking_number?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          agency_id: number | null
          amount: number
          commercial_id: number | null
          commission_amount: number | null
          created_at: string | null
          end_date: string | null
          id: number
          pack_id: number | null
          payment_status: string | null
          place_id: number | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          agency_id?: number | null
          amount: number
          commercial_id?: number | null
          commission_amount?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: number
          pack_id?: number | null
          payment_status?: string | null
          place_id?: number | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          agency_id?: number | null
          amount?: number
          commercial_id?: number | null
          commission_amount?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: number
          pack_id?: number | null
          payment_status?: string | null
          place_id?: number | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "commercials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_category: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      supplier_products: {
        Row: {
          category: string | null
          Country_id: number | null
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          minimum_order: string | null
          price: string | null
          product_name: string | null
          supplier_id: string | null
        }
        Insert: {
          category?: string | null
          Country_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          minimum_order?: string | null
          price?: string | null
          product_name?: string | null
          supplier_id?: string | null
        }
        Update: {
          category?: string | null
          Country_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          minimum_order?: string | null
          price?: string | null
          product_name?: string | null
          supplier_id?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          category: string | null
          city: string | null
          company_name: string | null
          country: string | null
          country_id: number | null
          created_at: string
          description: string | null
          email: string | null
          id: number
          logo: string | null
          status: string | null
          telephone: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          logo?: string | null
          status?: string | null
          telephone?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          logo?: string | null
          status?: string | null
          telephone?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_companies: {
        Row: {
          actif: boolean | null
          city_id: number | null
          code: string | null
          couleur: string | null
          country_id: number | null
          created_at: string
          description: string | null
          email: string | null
          id: number
          logo_blanc_url: string | null
          logo_url: string | null
          nom: string | null
          ordre_affichage: number | null
          pays: string | null
          "site web": string | null
          station_address: string | null
          telephone: string | null
          transport_courier: boolean | null
          transport_parcel: boolean | null
          transport_passengers: boolean | null
          transport_vip: boolean | null
          ville: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          actif?: boolean | null
          city_id?: number | null
          code?: string | null
          couleur?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          logo_blanc_url?: string | null
          logo_url?: string | null
          nom?: string | null
          ordre_affichage?: number | null
          pays?: string | null
          "site web"?: string | null
          station_address?: string | null
          telephone?: string | null
          transport_courier?: boolean | null
          transport_parcel?: boolean | null
          transport_passengers?: boolean | null
          transport_vip?: boolean | null
          ville?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          actif?: boolean | null
          city_id?: number | null
          code?: string | null
          couleur?: string | null
          country_id?: number | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          logo_blanc_url?: string | null
          logo_url?: string | null
          nom?: string | null
          ordre_affichage?: number | null
          pays?: string | null
          "site web"?: string | null
          station_address?: string | null
          telephone?: string | null
          transport_courier?: boolean | null
          transport_parcel?: boolean | null
          transport_passengers?: boolean | null
          transport_vip?: boolean | null
          ville?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      voyages: {
        Row: {
          compagnie_id: string | null
          country_id: number | null
          created_at: string
          emoji: string | null
          id: number
          logo_url: string | null
          name: string | null
        }
        Insert: {
          compagnie_id?: string | null
          country_id?: number | null
          created_at?: string
          emoji?: string | null
          id?: number
          logo_url?: string | null
          name?: string | null
        }
        Update: {
          compagnie_id?: string | null
          country_id?: number | null
          created_at?: string
          emoji?: string | null
          id?: number
          logo_url?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voyages_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          agency_id: number | null
          balance: number | null
          commercial_id: number | null
          created_at: string | null
          id: number
          is_active: boolean | null
          partner_id: string | null
          pending_balance: number | null
          total_earned: number | null
          total_withdrawn: number | null
          user_type: string
        }
        Insert: {
          agency_id?: number | null
          balance?: number | null
          commercial_id?: number | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          partner_id?: string | null
          pending_balance?: number | null
          total_earned?: number | null
          total_withdrawn?: number | null
          user_type: string
        }
        Update: {
          agency_id?: number | null
          balance?: number | null
          commercial_id?: number | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          partner_id?: string | null
          pending_balance?: number | null
          total_earned?: number | null
          total_withdrawn?: number | null
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "commercials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      withdraw_requests: {
        Row: {
          amount: number
          id: number
          payment_method: string | null
          processed_at: string | null
          requested_at: string | null
          status: string | null
          telephone: string | null
          transaction_ref: string | null
          wallet_id: number | null
        }
        Insert: {
          amount: number
          id?: number
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          telephone?: string | null
          transaction_ref?: string | null
          wallet_id?: number | null
        }
        Update: {
          amount?: number
          id?: number
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          telephone?: string | null
          transaction_ref?: string | null
          wallet_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "withdraw_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          account_number: string | null
          agency_id: number | null
          amount: number
          commercial_id: number | null
          id: number
          notes: string | null
          partner_id: string | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string | null
        }
        Insert: {
          account_number?: string | null
          agency_id?: number | null
          amount: number
          commercial_id?: number | null
          id?: number
          notes?: string | null
          partner_id?: string | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
        }
        Update: {
          account_number?: string | null
          agency_id?: number | null
          amount?: number
          commercial_id?: number | null
          id?: number
          notes?: string | null
          partner_id?: string | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_commercial_id_fkey"
            columns: ["commercial_id"]
            isOneToOne: false
            referencedRelation: "commercials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_withdrawal: {
        Args: { p_admin: string; p_withdrawal_id: number }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "admin" | "restaurant" | "alimentaire" | "livreur"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["admin", "restaurant", "alimentaire", "livreur"],
    },
  },
} as const
