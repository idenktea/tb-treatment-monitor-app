import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types for our TB Treatment Monitoring System
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'nurse' | 'doctor' | 'pharmacist' | 'patient' | 'pmo';
          first_name: string;
          last_name: string;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: 'admin' | 'nurse' | 'doctor' | 'pharmacist' | 'patient' | 'pmo';
          first_name: string;
          last_name: string;
          phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'nurse' | 'doctor' | 'pharmacist' | 'patient' | 'pmo';
          first_name?: string;
          last_name?: string;
          phone?: string;
          updated_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          user_id: string;
          tb01_registration_number: string;
          date_of_birth: string;
          gender: 'male' | 'female' | 'other';
          address: string;
          city: string;
          province: string;
          postal_code: string;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          diagnosis_date: string;
          treatment_start_date: string;
          treatment regimen: string;
          registration_status: 'pending' | 'active' | 'completed' | 'transferred' | 'lost_to_follow_up';
          assigned_nurse_id: string;
          assigned_doctor_id: string;
          assigned_pmo_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tb01_registration_number: string;
          date_of_birth: string;
          gender: 'male' | 'female' | 'other';
          address: string;
          city: string;
          province: string;
          postal_code: string;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          diagnosis_date: string;
          treatment_start_date: string;
          treatment regimen: string;
          registration_status?: 'pending' | 'active' | 'completed' | 'transferred' | 'lost_to_follow_up';
          assigned_nurse_id: string;
          assigned_doctor_id: string;
          assigned_pmo_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tb01_registration_number?: string;
          date_of_birth?: string;
          gender?: 'male' | 'female' | 'other';
          address?: string;
          city?: string;
          province?: string;
          postal_code?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          diagnosis_date?: string;
          treatment_start_date?: string;
          treatment regimen?: string;
          registration_status?: 'pending' | 'active' | 'completed' | 'transferred' | 'lost_to_follow_up';
          assigned_nurse_id?: string;
          assigned_doctor_id?: string;
          assigned_pmo_id?: string;
          updated_at?: string;
        };
      };
      prescriptions: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          medication_name: string;
          dosage: string;
          frequency: string;
          duration_days: number;
          start_date: string;
          end_date: string;
          instructions: string;
          status: 'active' | 'completed' | 'paused' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          medication_name: string;
          dosage: string;
          frequency: string;
          duration_days: number;
          start_date: string;
          end_date: string;
          instructions: string;
          status?: 'active' | 'completed' | 'paused' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          medication_name?: string;
          dosage?: string;
          frequency?: string;
          duration_days?: number;
          start_date?: string;
          end_date?: string;
          instructions?: string;
          status?: 'active' | 'completed' | 'paused' | 'cancelled';
          updated_at?: string;
        };
      };
      adherence_logs: {
        Row: {
          id: string;
          patient_id: string;
          prescription_id: string;
          adherence_date: string;
          taken_at: string;
          photo_url: string;
          selfie_url: string;
          verified_by_pmo: boolean;
          pmo_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          prescription_id: string;
          adherence_date: string;
          taken_at: string;
          photo_url: string;
          selfie_url: string;
          verified_by_pmo?: boolean;
          pmo_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          prescription_id?: string;
          adherence_date?: string;
          taken_at?: string;
          photo_url?: string;
          selfie_url?: string;
          verified_by_pmo?: boolean;
          pmo_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          medication_name: string;
          current_stock: number;
          minimum_stock_level: number;
          maximum_stock_level: number;
          unit: string;
          expiry_date: string;
          batch_number: string;
          supplier: string;
          storage_location: string;
          last_restocked_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          medication_name: string;
          current_stock: number;
          minimum_stock_level: number;
          maximum_stock_level: number;
          unit: string;
          expiry_date: string;
          batch_number: string;
          supplier: string;
          storage_location: string;
          last_restocked_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          medication_name?: string;
          current_stock?: number;
          minimum_stock_level?: number;
          maximum_stock_level?: number;
          unit?: string;
          expiry_date?: string;
          batch_number?: string;
          supplier?: string;
          storage_location?: string;
          last_restocked_at?: string;
          updated_at?: string;
        };
      };
      dispensing_records: {
        Row: {
          id: string;
          patient_id: string;
          pharmacist_id: string;
          prescription_id: string;
          medication_name: string;
          quantity_dispensed: number;
          unit: string;
          dispensed_at: string;
          next_refill_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          pharmacist_id: string;
          prescription_id: string;
          medication_name: string;
          quantity_dispensed: number;
          unit: string;
          dispensed_at: string;
          next_refill_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          pharmacist_id?: string;
          prescription_id?: string;
          medication_name?: string;
          quantity_dispensed?: number;
          unit?: string;
          dispensed_at?: string;
          next_refill_date?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      side_effects: {
        Row: {
          id: string;
          patient_id: string;
          prescription_id: string;
          symptom_description: string;
          severity: 'mild' | 'moderate' | 'severe';
          reported_at: string;
          resolved: boolean;
          resolved_at: string | null;
          notes: string | null;
          triage_status: 'pending' | 'reviewed' | 'escalated';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          prescription_id: string;
          symptom_description: string;
          severity: 'mild' | 'moderate' | 'severe';
          reported_at: string;
          resolved?: boolean;
          resolved_at?: string | null;
          notes?: string | null;
          triage_status?: 'pending' | 'reviewed' | 'escalated';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          prescription_id?: string;
          symptom_description?: string;
          severity?: 'mild' | 'moderate' | 'severe';
          reported_at?: string;
          resolved?: boolean;
          resolved_at?: string | null;
          notes?: string | null;
          triage_status?: 'pending' | 'reviewed' | 'escalated';
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'medication_reminder' | 'stock_alert' | 'side_effect_alert' | 'appointment_reminder' | 'system';
          title: string;
          message: string;
          data: Record<string, any> | null;
          read: boolean;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'medication_reminder' | 'stock_alert' | 'side_effect_alert' | 'appointment_reminder' | 'system';
          title: string;
          message: string;
          data?: Record<string, any> | null;
          read?: boolean;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'medication_reminder' | 'stock_alert' | 'side_effect_alert' | 'appointment_reminder' | 'system';
          title?: string;
          message?: string;
          data?: Record<string, any> | null;
          read?: boolean;
          read_at?: string | null;
        };
      };
    };
  };
};