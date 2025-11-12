# Project Requirements Document: TB Treatment Monitoring System

## 1. Project Overview

The TB Treatment Monitoring System is a Progressive Web App (PWA) designed to streamline and secure the treatment workflow for tuberculosis (TB) patients. It provides tailored dashboards for Admins, Nurses, Doctors, Pharmacists, Patients, and Program Management Officers (PMOs). The app simplifies data entry (like patient registration and prescriptions), tracks daily medication adherence with photo proof, and manages pharmacy stock—all in one unified, mobile-friendly interface.

This system is being built to replace manual, paper-based processes and fragmented digital tools in public health settings. By offering real-time updates, role-based security, and built-in notifications, the key objectives are to: 1) improve patient adherence rates, 2) reduce data errors, 3) accelerate clinical decision-making, and 4) ensure full data privacy through strict access control. Success will be measured by adoption rates, reduction in missed doses, and positive user feedback from healthcare workers.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1)
- Role-based dashboards for Admin, Nurse, Doctor, Pharmacist, Patient, and PMO
- Patient registration workflow (TB.01 form) with type-safe validation
- Digital prescription creation, review, and approval interface
- Pharmacy stock management and real-time inventory adjustments
- Daily adherence logging with photo/selfie proof upload
- Real-time in-app notifications for key events (e.g., missing dose, side-effect alerts)
- Secure authentication and role-based access control using Supabase Auth and Row Level Security (RLS)
- PWA configuration with offline caching for basic screens
- Declarative data fetching and caching via TanStack Query
- Schema-driven form handling with React Hook Form and Zod

### Out-of-Scope (Later Phases)
- SMS or voice call reminders
- Advanced analytics and reporting beyond basic inventory and adherence logs
- Multi-language (i18n) support
- Full offline-first sync (beyond PWA cache)
- Native mobile apps (iOS/Android)
- Third-party EHR integrations
- Bulk data import/export tools

## 3. User Flow

A new user arrives at the web app and is prompted to sign up or log in via email/password (Supabase Auth). After authentication, the user is redirected to their role-specific dashboard. For example, a Nurse sees a “Patient Registration” button and a list of existing patients, while a Pharmacist sees current stock levels and pending prescription orders. Each dashboard uses a left-side navigation menu for module access (Patients, Prescriptions, Adherence, Inventory, Settings).

When a Nurse registers a patient, they fill out a form built with React Hook Form and Zod validation. Upon submission, the data is stored in Supabase Postgres and the patient record appears in the Doctor’s and PMO’s views in real time. Patients log in to submit daily photo proof of medication intake, triggering an in-app notification to the PMO. All users can log out or switch modules via the sidebar, and the PWA shell ensures essential pages remain available offline once loaded.

## 4. Core Features

- **Authentication & RBAC**: Email/password login, custom claims for roles, Supabase RLS enforcement
- **Role-Based Dashboards**: Distinct views and navigation per Admin, Nurse, Doctor, Pharmacist, Patient, PMO
- **Patient Registration (TB.01)**: Multi-field form with type-safe Zod schemas and React Hook Form
- **Digital Prescription Workflow**: Doctors create/edit prescriptions; Pharmacists approve and dispense
- **Pharmacy Inventory Management**: Real-time stock display, low-stock alerts, manual and automatic adjustments
- **Daily Adherence Logging**: File upload (photo/selfie), timestamp, secure storage in Supabase Storage
- **Real-Time Notifications**: In-app alerts via Supabase Realtime; email triggers via Edge Functions
- **PWA Capabilities**: Service worker for offline caching, installable on mobile devices
- **Data Fetching & Caching**: TanStack Query for background fetching, caching, and auto-refetch
- **Form Handling & Validation**: Declarative forms with React Hook Form + Zod; error messages and inline validation

## 5. Tech Stack & Tools

- Frontend: React + TypeScript, Vite bundler
- UI Library: shadcn/ui (Radix UI + Tailwind CSS)
- Data Fetching: TanStack Query
- Form Management: React Hook Form, Zod for schema validation
- Animations: Framer Motion
- Icons: Lucide React
- Backend-as-a-Service: Supabase (Auth, PostgreSQL, Storage, Realtime, Edge Functions)
- PWA: vite-plugin-pwa for service worker and manifest
- Code Quality: Prettier, ESLint, TypeScript
- IDE/Editor: VS Code with GitHub Codespaces / Cursor AI plugin for code suggestions

## 6. Non-Functional Requirements

- **Performance**: <200ms API response; initial PWA load under 1s on 3G
- **Security**: HTTPS-only; Supabase RLS for all sensitive tables; JWT-based auth
- **Compliance**: GDPR-compatible data privacy; OWASP Top 10 protection
- **Usability**: WCAG 2.1 AA accessibility; responsive design on mobile and desktop
- **Scalability**: Support 1,000 concurrent users; database indexing for large patient lists

## 7. Constraints & Assumptions

- Supabase services are available and configured with proper API keys
- Environment variables provided for Supabase URL and anon key
- Users have reliable (though possibly intermittent) internet access
- Roles (Admin, Nurse, Doctor, etc.) are predefined and managed via Supabase Auth
- Service worker caching is limited to static assets and recently visited routes

## 8. Known Issues & Potential Pitfalls

- Supabase rate limits: mitigate by batching requests and using TanStack Query cache
- Large file uploads on mobile: enforce size limits, compress images client-side
- RLS policy complexity: define clear, testable policies per table and role
- PWA offline edge cases: limit offline UI to read-only dashboards; block write operations until back online
- Data conflicts: implement optimistic updates and conflict handling in TanStack Query
- Time zone handling: store timestamps in UTC; convert on client side based on user locale

---

This document serves as the single source of truth for all future technical specifications, designs, and implementation guidelines. It contains clear, unambiguous requirements to guide AI-driven code generation and human review alike.