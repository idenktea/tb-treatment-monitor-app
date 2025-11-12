# tb-treatment-monitor-app Frontend Guidelines Document

This document outlines the frontend setup, design principles, and technologies used in the TB Treatment Monitoring System. It’s written in clear, everyday language so anyone—technical or not—can understand how the frontend is structured and why.

---

## 1. Frontend Architecture

### Overview
We use a **client-heavy Progressive Web App (PWA)** approach with a serverless backend (Supabase). On the client, everything runs in the browser, giving us fast interactions, offline support, and a mobile-friendly experience.

### Main Frameworks & Libraries
- **React + TypeScript**: Our core UI library, offering component-based structure and type safety.
- **Vite**: Lightning-fast build tool that speeds up development and production builds.
- **shadcn/ui** (Radix UI + Tailwind CSS): A ready-made, accessible component library we extend for all buttons, forms, tables, and dialogs.
- **TanStack Query**: Manages server-state, caching, and background updates for patient data, inventory, and logs.
- **React Hook Form + Zod**: Provides declarative forms with built-in type-safe validation.
- **Framer Motion**: Adds smooth animations and transitions.
- **Lucide React**: Supplies a lightweight, consistent icon set.

### Scalability, Maintainability & Performance
- **Component-Driven Development**: We build reusable UI components, so new features just plug into the existing library.
- **Utility-First CSS (Tailwind)**: Keeps styles consistent and small, reducing CSS bloat.
- **TypeScript Everywhere**: Reduces runtime errors and documents intent.
- **Serverless Edge Functions**: Offload complex workflows (notifications, triage) to the backend, keeping the client lean.
- **PWA Setup**: Caching assets and API responses for offline use and improved load times.

---

## 2. Design Principles

We follow three core design principles to ensure a user-friendly, accessible, and consistent experience:

1. **Usability**: Interfaces are intuitive—users can complete tasks with minimal clicks.
2. **Accessibility**: Built-in ARIA roles, keyboard navigation, and color contrast checks to meet WCAG standards.
3. **Responsiveness**: Layouts adapt to desktop, tablet, and mobile screens seamlessly.

**How These Apply**
- **Forms** use clear labels, inline error messages, and focus management.
- **Dashboards** present data in sortable, paginated tables with clear action buttons.
- **Navigation** stays visible on desktop and collapses into a bottom tab bar or hamburger menu on mobile.

---

## 3. Styling and Theming

### Approach & Methodology
- We use **Tailwind CSS** with a utility-first method for quick, consistent styling.
- We follow the **BEM-like naming** for any custom CSS, but most styles come from Tailwind classes.

### Theme Style
- **Overall Style**: Modern and flat design with subtle shadows and rounded corners.
- **Component Style**: Based on `shadcn/ui` defaults, which combine minimal flat design with accessibility best practices.

### Color Palette
- **Primary**: #1E3A8A (Indigo 800)
- **Secondary**: #10B981 (Emerald 500)
- **Accent**: #3B82F6 (Blue 500)
- **Background**: #F9FAFB (Gray 50)
- **Surface/Card**: #FFFFFF
- **Text Primary**: #111827 (Gray 900)
- **Text Secondary**: #6B7280 (Gray 500)
- **Error**: #EF4444 (Red 500)
- **Success**: #22C55E (Green 500)

### Font
- **Primary Font**: Inter, with system-ui and sans-serif fallbacks.
- Loaded via a `<link>` in `index.html` or imported in Tailwind config.

---

## 4. Component Structure

### Organization
```
src/
 ├─ components/       # Shared, non-feature-specific pieces
 │   └─ ui/           # shadcn/ui components (Button, Input, Table, etc.)
 ├─ features/         # Feature-based modules (auth, patients, adherence, pharmacy)
 │   ├─ auth/         # Login, signup, password reset
 │   ├─ patients/     # Registration form, patient list, detail views
 │   ├─ adherence/    # Daily submission form, PMO verification
 │   └─ pharmacy/     # Stock management, dispensing workflows
 ├─ hooks/            # Custom React hooks (useAuth, usePatientData)
 ├─ lib/              # Utilities and Supabase client setup
 └─ pages/ or routes/ # Application routes and page components
```

### Reusability & Maintainability
- Each component does one thing (single responsibility).
- UI components live in `components/ui`, so changes propagate everywhere.
- Feature folders encapsulate related logic, making it easy to onboard new developers.

---

## 5. State Management

### Server-State
- **TanStack Query**: Central to fetching, caching, and updating data (patients, logs, inventory).
- Queries live in feature hooks (`usePatientList`, `useAdherenceLogs`), abstracting data logic from components.

### Client-State
- **React Context / Custom Hooks**: Minimal local state (e.g., theme toggles, modal open/close).
- **useAuth Hook**: Exposes current user info and role for conditional rendering and route protection.

---

## 6. Routing and Navigation

- **Library**: `react-router-dom` manages routing.
- **Protected Routes**: Wrap route components with an auth check—only allowed roles can view certain pages.
- **Navigation Structure**:
  - **Sidebar / Topbar** on desktop lists main sections (Dashboard, Patients, Pharmacy, Reports).
  - **Bottom Tab Bar / Hamburger Menu** on mobile for quick switching.
- Route definitions reside in `src/routes/` or `src/pages/`, grouped by feature.

---

## 7. Performance Optimization

- **Code Splitting**: Route-based lazy loading of pages and heavy components.
- **Lazy Loading**: Images, charts, and tables load as the user scrolls or navigates.
- **Asset Optimization**: Vite automatically minifies CSS/JS; images are compressed.
- **PWA Caching**: Service worker caches assets and API responses for offline support.
- **Bundle Analysis**: Regularly run a bundle analyzer to identify and trim large dependencies.

---

## 8. Testing and Quality Assurance

### Testing Strategy
- **Unit Tests**: Vitest + React Testing Library for components and hooks.
- **Integration Tests**: Test critical flows, like patient registration form validation and submission.
- **End-to-End Tests**: Playwright or Cypress to simulate key user journeys (login, data entry, dashboard view).

### Tools & Frameworks
- **Vitest**: Fast, Vite-native test runner.
- **ESLint & Prettier**: Enforce code style and catch errors.
- **MSW (Mock Service Worker)**: Mock Supabase API calls for reliable tests.

---

## 9. Conclusion and Overall Frontend Summary

This frontend guideline lays out a clear, scalable, and maintainable approach for the TB Treatment Monitoring System. By combining React + TypeScript, Vite, a modern UI library (`shadcn/ui`), and robust data tools (TanStack Query, React Hook Form, Zod), we ensure:

- **High Developer Velocity**: Ready-made components and rapid build times.
- **Excellent UX**: Accessible, responsive, and consistent design.
- **Strong Performance**: PWA offline support, lazy loading, and code splitting.
- **Secure Data Handling**: Supabase Auth with Role-Based Access Control, Row Level Security.
- **Testable & Maintainable Code**: Modular structure, type safety, and automated testing.

With these guidelines, anyone joining the project can understand how the frontend is built, why each technology was chosen, and how to extend or maintain it without confusion.

---

_End of Document_
