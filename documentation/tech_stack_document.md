# Tech Stack Document for tb-treatment-monitor-app

This document explains the technology choices made for the **TB Treatment Monitoring System** starter template in simple, everyday language. It clarifies each technology’s role and how it helps build a secure, scalable, and user-friendly Progressive Web App (PWA).

## Frontend Technologies

- **React with TypeScript**  
  A popular framework for building interactive user interfaces. TypeScript adds type safety, helping catch errors early—vital for healthcare apps where data accuracy matters.

- **Vite**  
  A fast build tool and development server. It speeds up page reloads and makes development snappy so developers can build features quickly.

- **shadcn/ui (Radix UI + Tailwind CSS)**  
  A ready-to-use component library paired with Tailwind’s utility-first CSS. It provides buttons, forms, tables, dialogs, and more—ensuring a consistent look and feel across dashboards and forms without writing custom CSS from scratch.

- **Tailwind CSS**  
  A utility-first styling tool. It allows developers to style elements directly in their HTML/JSX, making it easy to maintain and adjust the design as the application grows.

- **TanStack Query**  
  Manages data fetching, caching, and background updates. It ensures patient lists, adherence logs, and inventory data load efficiently, with built-in loading indicators and error handling.

- **React Hook Form + Zod**  
  Streamlines building and validating forms (patient registration, prescriptions, side-effect reports). Zod provides schema-based checks so only correct data reaches the backend.

- **Framer Motion**  
  Adds animations and smooth transitions for a polished user experience (e.g., modal dialogs, page transitions).

- **Lucide React**  
  A lightweight icon set for clear, consistent icons throughout the app (buttons, alerts, navigation).

## Backend Technologies

- **Supabase Auth**  
  Handles user sign-up, sign-in, password resets, and role-based accounts (Admin, Nurse, Doctor, etc.). Custom claims let us enforce specific access rights for each user type.

- **Supabase PostgreSQL Database**  
  Stores all application data: patient records, treatment plans, adherence logs, pharmacy inventory, user roles, and more.

- **Supabase Storage**  
  Manages secure file uploads and storage for daily photo proofs. Files are stored in protected buckets, and only authorized users can access them.

- **Supabase Realtime**  
  Pushes real-time updates to the client (e.g., notify a PMO immediately when a patient submits their daily proof).

- **Supabase Edge Functions**  
  Serverless functions for background tasks and complex workflows—such as sending email notifications or triaging side-effect reports—without managing your own server.

## Infrastructure and Deployment

- **Version Control with Git and GitHub**  
  Tracks code changes, facilitates code reviews, and enables collaboration across the development team.

- **Continuous Integration/Continuous Deployment (CI/CD)**  
  Automated pipelines (e.g., GitHub Actions) that run tests, build the app, and deploy updates whenever code is merged—ensuring reliability and fast delivery.

- **Hosting on Vercel or Netlify**  
  Modern platforms optimized for Vite, offering global content delivery, automatic SSL, and easy rollbacks. They seamlessly integrate with GitHub for instant deployments.

- **Environment Configuration**  
  Sensitive keys (Supabase API keys, third-party secrets) are stored in environment variables—never committed to version control—to protect credentials.

- **PWA Setup with vite-plugin-pwa**  
  Configures service workers and manifest files so users can install the app on mobile devices, work offline, and enjoy fast load times even on slow networks.

## Third-Party Integrations

- **SendGrid (or similar email service)**  
  Used via Supabase Edge Functions to send appointment reminders, side-effect alerts, and other email notifications.

- **Vite Plugin PWA**  
  Transforms the app into a Progressive Web App, enabling offline capabilities, home screen installation, and push notifications (if needed).

- **(Optional) Analytics Tools**  
  You can integrate services like Google Analytics, Plausible, or Fathom to monitor user engagement and system usage—helping improve the app over time.

## Security and Performance Considerations

- **Authentication & Role-Based Access Control**  
  - Supabase Auth with custom claims differentiates Admins, Nurses, Doctors, Pharmacists, Patients, and PMOs.  
  - Frontend `useAuth` hook ensures UI elements and routes are only accessible to permitted roles.

- **Row Level Security (RLS)**  
  Database-level rules that let each user see only the data they’re allowed to access (e.g., a Doctor sees only their patients).

- **Secure File Uploads**  
  Direct browser-to-storage uploads with pre-signed URLs and policy-protected buckets; file paths are recorded in the database.

- **Data Validation**  
  Zod schemas enforce strict input rules on every form—preventing invalid or malicious data from reaching the database.

- **HTTPS Everywhere**  
  All network traffic is encrypted. Hosting platforms (Vercel/Netlify) provide SSL by default.

- **Performance Optimizations**  
  - Vite’s fast builds and Hot Module Replacement for quick development cycles.  
  - TanStack Query caching reduces redundant network requests.  
  - Utility-first CSS (Tailwind) and component libraries keep bundle sizes small.  
  - Code splitting and lazy loading ensure users download only what they need.

## Conclusion and Overall Tech Stack Summary

This tech stack was chosen to build a **fast, reliable, and secure** TB Treatment Monitoring System with clear benefits:

- A **modern frontend** (React + Vite + Tailwind + shadcn/ui) that delivers rich, responsive interfaces across desktops and mobiles.
- A **serverless backend** (Supabase) that handles authentication, database storage, real-time updates, file storage, and edge functions—removing the overhead of managing servers.
- **Robust security** through Supabase Auth, Row Level Security, schema-based validation, and encrypted traffic.
- **Scalable infrastructure** with GitHub CI/CD and hosting on Vercel/Netlify, ensuring smooth deployments and global performance.
- **Extensibility** via third-party integrations (email, PWA capabilities, analytics) to support future growth and new features.

Together, these technologies provide a solid foundation for rapidly building and iterating on the TB Treatment Monitoring System, ensuring it meets the needs of all user roles while maintaining high security, performance, and accessibility standards.