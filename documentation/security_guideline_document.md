# TB Treatment Monitoring System: Security Guidelines

This document provides comprehensive security guidelines tailored to the `tb-treatment-monitor-app` (TB Treatment Monitoring System). It aligns with Security by Design, Least Privilege, Defense in Depth, and other best practices to ensure a robust, secure, and privacy-preserving application.

---

## 1. Core Security Principles

- **Security by Design**: Integrate security considerations from architecture through deployment. Treat security as a foundational requirement, not an afterthought.
- **Least Privilege**: Grant users, services, and components only the minimum permissions necessary.
- **Defense in Depth**: Layer multiple security controls (network, application, data) so compromise of one does not collapse the entire system.
- **Fail Securely**: Ensure errors do not leak sensitive data or leave gaps. Fail closed on authorization checks.
- **Secure Defaults**: Use the most restrictive configuration by default. Require explicit enablement for any weak or permissive setting.

---

## 2. Authentication & Access Control

### 2.1. Supabase Auth & JWT
- Enforce **strong password policies** (minimum length, complexity, rotation) on user sign–up. Leverage Supabase’s built-in rules and customize if needed.  
- Supabase uses **bcrypt** to hash passwords with unique salts—do not override with weaker algorithms.  
- Validate JWTs on every API call:
  - Reject tokens with `alg: none`.  
  - Verify signatures (HS256 or RS256).  
  - Enforce `exp` (expiration) and `nbf` (not before) claims.  
- Store access tokens in **Secure**, **HttpOnly**, **SameSite=Strict** cookies to mitigate XSS; avoid localStorage for tokens.

### 2.2. Role-Based Access Control (RBAC) & Row-Level Security (RLS)
- Define distinct roles: Admin, Nurse, Doctor, Pharmacist, Patient, PMO.  
- Enable **Supabase Row-Level Security** on every sensitive table (e.g., `patients`, `prescriptions`, `adherence_logs`, `inventory`).  
- Grant privileges via RLS policies so users see only their permitted records:
  - Doctors can only SELECT/UPDATE patients assigned to them.  
  - Patients can only read their own records.  
  - Pharmacists can manage inventory but not read patient medical history.  
- Enforce server-side authorization on Edge Functions and REST endpoints.

### 2.3. Session Management & MFA
- Configure session timeouts (idle and absolute).  
- Implement explicit logout to clear tokens and revoke refresh tokens.  
- Protect against session fixation by regenerating session IDs on login.  
- Offer **Multi-Factor Authentication** (TOTP or SMS) for elevated roles (Admins, Doctors).

---

## 3. Input Handling & Processing

### 3.1. Server-Side Validation & Sanitization
- Use **Zod** schemas for all forms (React Hook Form). Strictly enforce types and length limits.  
- Validate every API payload in Edge Functions before processing.  
- Deny unexpected or extra fields in JSON objects (strict mode).

### 3.2. Prevent Injection Attacks
- Always use Supabase client parameterized methods (no string concatenation) to prevent SQL injection.  
- For any custom queries, use prepared statements or the query builder interface.  
- Sanitize filenames to prevent path traversal in file uploads.

### 3.3. Mitigate XSS & Template Injection
- Context-aware encoding of user data in the UI via JSX (React escapes by default).  
- Implement a strong **Content Security Policy (CSP)** forbidding inline scripts/styles and restricting script sources.  
- If rendering rich text, sanitize HTML with a reputable library (e.g., `dompurify`).

### 3.4. Secure File Uploads (Photo Proof)
- Restrict accepted file types (e.g., JPEG, PNG) and enforce maximum size limits.  
- Use a **private** Supabase Storage bucket with **bucket-level policies** limiting access to the owning user.  
- Generate unpredictable, UUID-based filenames.  
- Optionally integrate a serverless virus/malware scanning step in Edge Functions before finalizing upload.

---

## 4. Data Protection & Privacy

### 4.1. Encryption
- Enforce **TLS 1.2+** for all client–server communication (API, WebSocket).  
- Confirm Supabase database and storage are encrypted at rest (PostgreSQL AES-256).  
- Use TLS-encrypted connections (`?sslmode=require`) in Edge Functions.

### 4.2. Secrets Management
- Do **not** hardcode API keys or secrets.  
- Store Supabase credentials, third-party API keys, and database URLs in environment variables or a secrets vault (e.g., AWS Secrets Manager, Vault).  
- Restrict CI/CD system variables to authorized personnel.

### 4.3. Logging & Information Leakage
- Avoid logging PII (names, medical records).  
- Mask sensitive data in logs or use redaction filters.  
- Configure Edge Functions and serverless logs to omit stack traces in production.

---

## 5. API & Service Security

### 5.1. HTTP & CORS
- Enforce HTTPS on all endpoints; redirect HTTP → HTTPS.  
- Restrict CORS to trusted origins (e.g., `https://app.tb-treatment.org`).  
- Use strict CORS headers (`Access-Control-Allow-Origin`, `Allow-Methods`, `Allow-Credentials`).

### 5.2. Rate Limiting & Throttling
- Implement request throttling at the edge (using a CDN or Edge Function) to mitigate brute-force and DoS attacks.  
- Consider user- or IP-based rate limits (e.g., 100 requests/minute).

### 5.3. API Design
- Adhere to RESTful conventions: appropriate verbs, resource-oriented URLs, and versioning (e.g., `/v1/patients`).  
- Return minimal data—never expose more fields than needed. 
- Use consistent error codes and messages; avoid revealing internal stack traces or SQL errors.

---

## 6. Web Application Security Hygiene

### 6.1. Security Headers
- **Content-Security-Policy**: Disallow inline scripts/styles; restrict script/style sources.  
- **Strict-Transport-Security**: `max-age=63072000; includeSubDomains; preload`  
- **X-Content-Type-Options**: `nosniff`  
- **X-Frame-Options**: `DENY`  
- **Referrer-Policy**: `no-referrer-when-downgrade`

### 6.2. CSRF Protection
- If using cookies for auth, embed anti-CSRF tokens in forms or use the **Double Submit Cookie** pattern.  
- Verify token on every state-changing request (POST/PUT/DELETE).

### 6.3. Secure Cookies
- Set `HttpOnly`, `Secure`, and `SameSite=Strict` on all session cookies.  
- Limit cookie scope (`Domain`, `Path`) to only relevant subdomains and routes.

### 6.4. Subresource Integrity (SRI)
- For any CDN-loaded scripts or styles, include integrity hashes (`<script integrity=...>`).

---

## 7. Infrastructure & Configuration Management

- **Harden Supabase**: Disable default public RLS policies; remove unused extensions.  
- **Change Default Credentials**: Immediately rotate any auto-generated or default admin passwords.  
- **Port Management**: Only expose necessary ports (HTTPS: 443).  
- **Patching & Updates**: Keep all dependencies (OS, Docker images, libraries) up to date.  
- **File Permissions**: Ensure source code, configuration files, and build artifacts have least-privilege filesystem permissions.

---

## 8. Dependency Management

- Use lockfiles (`package-lock.json`) to lock dependency versions.  
- Regularly scan for known vulnerabilities with SCA tools (e.g., `npm audit`, GitHub Dependabot).  
- Remove unused or unmaintained packages to reduce the attack surface.

---

## 9. Progressive Web App (PWA) Security

- **Service Worker Scope**: Restrict to `/` or specific routes.  
- **Cache Validation**: Use stale-while-revalidate policies; avoid caching user data or tokens.  
- **HTTPS Only**: Service workers only register on secure origins.  
- **Manifest Security**: Validate `manifest.webmanifest` content and limit navigable scope.

---

## 10. DevOps & CI/CD Security

- **Secret Storage**: Store CI/CD secrets in encrypted vaults; do not commit `.env` files.  
- **Pipeline Hardening**: Limit who can modify pipeline definitions; enforce code reviews on CI changes.  
- **Static Analysis**: Integrate ESLint, Prettier, and security linters (e.g., `eslint-plugin-security`).  
- **Automated Testing**: Require passing unit/integration/security tests (SAST) before merge.  
- **Infrastructure as Code (IaC)**: Scan IaC templates (Terraform/CloudFormation) for misconfigurations.

---

## 11. Monitoring, Logging & Incident Response

- Centralize application and audit logs in a secure, append-only system (e.g., ELK, Splunk).  
- Instrument real-­time alerts for anomalous behaviors (e.g., multiple failed logins, rate-limit breaches).  
- Define an incident response plan: triage, communicate, contain, eradicate, recover, post-mortem.

---

## Conclusion
By following these guidelines, the TB Treatment Monitoring System will achieve a strong security posture across application, data, and infrastructure layers. Regularly review and update controls as the threat landscape and application evolve.

*Always assume an adversary will probe every component. Proactive, layered defenses and rigorous validation are your best safeguards.*
