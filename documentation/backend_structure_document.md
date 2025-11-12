# Backend Structure Document

## 1. Backend Architecture

This project uses a **serverless, client-heavy architecture** powered by Supabase. The frontend (a Progressive Web App) communicates directly with backend services, minimizing custom server maintenance.

Key design patterns and frameworks:
- Serverless Functions (Supabase Edge Functions) for custom business logic and notifications.
- Client-server separation: the PWA handles most UI logic; backend focuses on data and workflows.
- Event-driven workflows: real-time notifications and background processing.

How this architecture supports core goals:
- **Scalability:** Supabase automatically scales the database, storage, and functions based on demand. Edge Functions run close to users for low-latency responses.
- **Maintainability:** Business logic is encapsulated in independent functions and database policies. The service layer is thin, relying on Supabase’s managed services.
- **Performance:** Direct client-to-database connections reduce middle‐man latency. Real-time features (Supabase Realtime) push updates instantly.

## 2. Database Management

We use a managed PostgreSQL instance provided by Supabase.

• Database type: Relational (SQL)  
• System: Supabase PostgreSQL  
• Real-time layer: Supabase Realtime (built on PostgreSQL’s replication stream)  
• File storage: Supabase Storage (for photo/selfie proofs)  

Data handling practices:
- **Row-Level Security (RLS):** Fine-grained access control so users only see their permitted rows.
- **Backups & Point-in-Time Recovery:** Supabase provides daily backups and PITR for disaster recovery.
- **Schema migrations:** Managed via SQL migration files or a tool like `sqitch` or `Knex` if preferred.
- **Indexes & Constraints:** Enforce data integrity and speed up queries.

## 3. Database Schema

### Human-readable schema overview

Entities and their relationships:
- **Users:** All system accounts with roles (Admin, Nurse, Doctor, Pharmacist, Patient, PMO).
- **Roles:** Defines permissions and dashboards per user type.
- **Patients:** TB patients’ demographic and medical info.
- **Treatment Plans & Prescriptions:** Doctors assign regimens; each prescription is tied to a patient.
- **Adherence Logs:** Daily photo/selfie submissions by patients, with status and review fields.
- **Pharmacy Inventory:** Tracks medication stock, reorder levels, and adjustments.
- **Side-Effect Reports:** Patients report adverse events; triaged by serverless functions.

### SQL schema (PostgreSQL)

```sql
-- Users and Roles
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL  -- e.g., Admin, Nurse, Doctor, Pharmacist, Patient, PMO
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  role_id INT NOT NULL REFERENCES roles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  registration_date DATE DEFAULT now()
);

-- Prescriptions
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adherence Logs
CREATE TABLE adherence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  photo_url TEXT NOT NULL,
  proof_type TEXT,        -- e.g., "selfie", "bottle"
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending',  -- e.g., pending, verified, flagged
  reviewed_by UUID REFERENCES users(id),
  review_date TIMESTAMP WITH TIME ZONE
);

-- Pharmacy Inventory
CREATE TABLE pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit TEXT NOT NULL,      -- e.g., "tablet", "bottle"
  reorder_level INT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Side-Effect Reports
CREATE TABLE side_effect_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  description TEXT NOT NULL,
  severity TEXT NOT NULL,  -- e.g., mild, moderate, severe
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  triage_status TEXT DEFAULT 'untriaged',
  action_taken_by UUID REFERENCES users(id),
  action_date TIMESTAMP WITH TIME ZONE
);

-- Indexes for common lookups
CREATE INDEX ON prescriptions(patient_id);
CREATE INDEX ON adherence_logs(patient_id);
CREATE INDEX ON side_effect_reports(patient_id);
```  

## 4. API Design and Endpoints

We rely on Supabase’s auto-generated REST and Realtime endpoints plus custom Edge Functions for complex workflows.

RESTful endpoints (via Supabase):
- `POST /auth/v1/signup` & `POST /auth/v1/token`  → User sign-up and login
- `GET /rest/v1/patients`  → List patients (RLS applies)
- `GET /rest/v1/patients/{id}`  → Fetch single patient record
- `POST /rest/v1/patients`  → Create patient record
- `GET /rest/v1/prescriptions` → Fetch prescriptions by patient or doctor
- `POST /rest/v1/prescriptions` → Create a new prescription
- `GET /rest/v1/adherence_logs` → List adherence submissions
- `POST /rest/v1/adherence_logs` → Submit a new adherence proof
- `GET /rest/v1/pharmacy_inventory` → View inventory
- `PATCH /rest/v1/pharmacy_inventory/{id}` → Adjust stock quantities
- `GET /rest/v1/side_effect_reports` → List side-effect reports
- `POST /rest/v1/side_effect_reports` → Submit side-effect event

Custom Edge Function endpoints:
- `POST /functions/v1/notify-pmo`  → Trigger in-app/email notifications when a new adherence log arrives
- `POST /functions/v1/triage-side-effect`  → Analyze severity and send alerts or emails

## 5. Hosting Solutions

- **Supabase Cloud** hosts the PostgreSQL database, authentication service, storage buckets, realtime streams, and Edge Functions.
- **Global distribution:** Supabase runs on major cloud providers (AWS/GCP), serving data from the nearest region.
- **Cost-effectiveness:** Pay-as-you-go model lets you start small and grow without upfront server costs.

## 6. Infrastructure Components

- **Load Balancing:** Handled by Supabase’s managed infrastructure, automatically distributing traffic across multiple nodes.
- **Caching:** Supabase CDN for storage files and built-in query caching layers on read-heavy endpoints.
- **CDN (Content Delivery Network):** Supabase Storage assets are served via a global CDN for fast access to photo proofs.
- **Serverless Edge Functions:** Quick, regionally distributed functions for business logic and notifications.
- **Backups & Recovery:** Automated daily backups with point-in-time restore capabilities.

## 7. Security Measures

- **Authentication:** Supabase Auth issues JWT tokens. Supports email/password, OAuth providers, and custom claims for roles.
- **Authorization:** Row-Level Security policies ensure users only access permitted rows (e.g., a doctor sees only their patients).
- **Encryption:** TLS everywhere in transit; data at rest is encrypted by Supabase.
- **Input Validation:** Zod schemas in Edge Functions and Supabase policies guard against malformed data.
- **Network Security:** Supabase endpoints are served over HTTPS, with CORS policies to restrict origins.

## 8. Monitoring and Maintenance

- **Supabase Dashboard:** Real-time metrics for database performance, query slowdowns, and function execution logs.
- **Alerts:** Configure threshold-based alerts (e.g., high CPU, error rates) via Supabase or integrate with external tools (Datadog, PagerDuty).
- **Logging:** All Edge Function executions are logged; database logs are available for audit and debugging.
- **Maintenance Practices:**  
  • Regular schema reviews and indexing improvements  
  • Periodic RLS policy audits  
  • Dependency updates for Edge Functions  
  • Scheduled performance tuning based on slow query reports

## 9. Conclusion and Overall Backend Summary

The backend for the TB Treatment Monitoring System is built on Supabase’s managed, serverless services to ensure a scalable, secure, and cost-effective foundation. PostgreSQL provides reliable relational storage, while authentication, storage, realtime updates, and edge functions cover all core needs without managing servers. Row-Level Security and JWT-based authentication protect sensitive health data. Automated backups, global distribution, and built-in monitoring guarantee high availability and quick recovery. This architecture aligns perfectly with the project’s goals: rapid development, strong data integrity, real-time collaboration, and a seamless user experience across roles.