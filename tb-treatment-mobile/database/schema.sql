-- TB Treatment Monitoring System Database Schema
-- Run this in Supabase SQL Editor to create the complete database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'nurse', 'doctor', 'pharmacist', 'patient', 'pmo')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Patients table
CREATE TABLE public.patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  tb01_registration_number TEXT UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  diagnosis_date DATE NOT NULL,
  treatment_start_date DATE NOT NULL,
  treatment_regimen TEXT NOT NULL,
  registration_status TEXT NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'active', 'completed', 'transferred', 'lost_to_follow_up')),
  assigned_nurse_id UUID REFERENCES public.users(id) NOT NULL,
  assigned_doctor_id UUID REFERENCES public.users(id) NOT NULL,
  assigned_pmo_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Prescriptions table
CREATE TABLE public.prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.users(id) NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  instructions TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Adherence logs table
CREATE TABLE public.adherence_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  adherence_date DATE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  photo_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  verified_by_pmo BOOLEAN DEFAULT FALSE NOT NULL,
  pmo_id UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(prescription_id, adherence_date)
);

-- Inventory table
CREATE TABLE public.inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medication_name TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER NOT NULL DEFAULT 10,
  maximum_stock_level INTEGER NOT NULL DEFAULT 1000,
  unit TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  batch_number TEXT NOT NULL,
  supplier TEXT NOT NULL,
  storage_location TEXT NOT NULL,
  last_restocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Dispensing records table
CREATE TABLE public.dispensing_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  pharmacist_id UUID REFERENCES public.users(id) NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  quantity_dispensed INTEGER NOT NULL,
  unit TEXT NOT NULL,
  dispensed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  next_refill_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Side effects table
CREATE TABLE public.side_effects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  symptom_description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN DEFAULT FALSE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  triage_status TEXT NOT NULL DEFAULT 'pending' CHECK (triage_status IN ('pending', 'reviewed', 'escalated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('medication_reminder', 'stock_alert', 'side_effect_alert', 'appointment_reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_assigned_nurse_id ON public.patients(assigned_nurse_id);
CREATE INDEX idx_patients_assigned_doctor_id ON public.patients(assigned_doctor_id);
CREATE INDEX idx_patients_assigned_pmo_id ON public.patients(assigned_pmo_id);
CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX idx_adherence_logs_patient_id ON public.adherence_logs(patient_id);
CREATE INDEX idx_adherence_logs_prescription_id ON public.adherence_logs(prescription_id);
CREATE INDEX idx_adherence_logs_pmo_id ON public.adherence_logs(pmo_id);
CREATE INDEX idx_adherence_logs_date ON public.adherence_logs(adherence_date);
CREATE INDEX idx_dispensing_records_patient_id ON public.dispensing_records(patient_id);
CREATE INDEX idx_dispensing_records_pharmacist_id ON public.dispensing_records(pharmacist_id);
CREATE INDEX idx_side_effects_patient_id ON public.side_effects(patient_id);
CREATE INDEX idx_side_effects_severity ON public.side_effects(severity);
CREATE INDEX idx_side_effects_triage_status ON public.side_effects(triage_status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adherence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users table RLS policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can update all users" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Patients table RLS policies
CREATE POLICY "Nurses can view assigned patients" ON public.patients FOR SELECT USING (
  assigned_nurse_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'doctor'))
);
CREATE POLICY "Doctors can view assigned patients" ON public.patients FOR SELECT USING (
  assigned_doctor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'nurse'))
);
CREATE POLICY "PMOs can view assigned patients" ON public.patients FOR SELECT USING (
  assigned_pmo_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin'))
);
CREATE POLICY "Patients can view own profile" ON public.patients FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "Admin can view all patients" ON public.patients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Nurses can insert patients" ON public.patients FOR INSERT WITH CHECK (
  assigned_nurse_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can update all patients" ON public.patients FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Prescriptions table RLS policies
CREATE POLICY "Doctors can manage prescriptions" ON public.prescriptions FOR ALL USING (
  doctor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'nurse'))
);
CREATE POLICY "Patients can view own prescriptions" ON public.prescriptions FOR SELECT USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Pharmacists can view prescriptions" ON public.prescriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('pharmacist', 'admin'))
);

-- Adherence logs table RLS policies
CREATE POLICY "Patients can manage own adherence" ON public.adherence_logs FOR ALL USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "PMOs can view patient adherence" ON public.adherence_logs FOR SELECT USING (
  pmo_id = auth.uid() OR
  assigned_pmo_id IN (SELECT id FROM public.patients WHERE id = patient_id) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'nurse', 'doctor'))
);
CREATE POLICY "PMOs can update adherence verification" ON public.adherence_logs FOR UPDATE USING (
  pmo_id = auth.uid() OR
  assigned_pmo_id IN (SELECT id FROM public.patients WHERE id = patient_id)
);

-- Inventory table RLS policies
CREATE POLICY "Pharmacists can manage inventory" ON public.inventory FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('pharmacist', 'admin'))
);
CREATE POLICY "Healthcare workers can view inventory" ON public.inventory FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('nurse', 'doctor', 'pharmacist', 'admin'))
);

-- Dispensing records table RLS policies
CREATE POLICY "Pharmacists can manage dispensing" ON public.dispensing_records FOR ALL USING (
  pharmacist_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Patients can view own dispensing records" ON public.dispensing_records FOR SELECT USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Healthcare workers can view dispensing records" ON public.dispensing_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('nurse', 'doctor', 'pharmacist', 'admin'))
);

-- Side effects table RLS policies
CREATE POLICY "Patients can manage side effects" ON public.side_effects FOR ALL USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Healthcare workers can view side effects" ON public.side_effects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('nurse', 'doctor', 'pharmacist', 'pmo', 'admin'))
);

-- Notifications table RLS policies
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_adherence_logs_updated_at BEFORE UPDATE ON public.adherence_logs FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_dispensing_records_updated_at BEFORE UPDATE ON public.dispensing_records FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_side_effects_updated_at BEFORE UPDATE ON public.side_effects FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'First'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Last'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '000-000-0000')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();