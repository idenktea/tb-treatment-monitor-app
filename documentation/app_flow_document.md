# App Flow Document for TB Treatment Monitoring System

## Onboarding and Sign-In/Sign-Up

A new user first arrives at the application through a public landing page accessible in any web browser. This page briefly introduces the TB Treatment Monitoring System and presents options to sign in or sign up. When the user selects sign up, they are directed to an account creation page where they enter their email and choose a secure password. The form validates in real time to ensure the email format is correct and the password meets the minimum security requirements. After submission, the system sends an email confirmation link. Once the user clicks the link, they return to the app and complete a brief profile setup, including their name and role if they are a patient. For roles such as Nurse, Doctor, Pharmacist, PMO, or Admin, the initial account creation is typically managed by an existing administrator who assigns these roles from the user management panel.

On the sign-in page, returning users enter their registered email and password. If the credentials match an existing account, they are authenticated and redirected to their personalized dashboard. If a user forgets their password, they can click a link labeled "Forgot Password" which takes them to a recovery page requesting their email. They receive a one-time recovery link by email that allows them to set a new password. After successful recovery, they are prompted to sign in with the new password. Users can sign out at any time using a button in the header, which safely ends the session and returns them to the landing page.

## Main Dashboard or Home Page

After signing in, the user lands on a dashboard tailored to their role. A persistent sidebar on the left contains the application logo at the top and a list of main sections below, each reflecting the features available for that user type. At the top of the screen, a header displays the user’s name, role, and a user avatar. Notifications for new alerts appear as a bell icon in the header.

For Doctors, the main dashboard shows a summary of their patient list, any pending prescription requests, and recent adherence reports. Nurses see a list of patients awaiting registration or follow-up, along with quick links to open the TB.01 registration form. Pharmacists view current inventory levels and active dispensing requests. Patients see a daily adherence prompt with an option to upload a photo proof. PMOs have a snapshot of all patients under their supervision, highlighting those with missing or flagged adherence logs. Admins see user statistics, pending role requests, and have access to the user management section.

From this main dashboard, users navigate between modules by clicking items in the sidebar or links in the content area. The application responds instantly, loading new pages without a full reload, ensuring a smooth, app-like experience.

## Detailed Feature Flows and Page Transitions

When a Nurse clicks the patient registration entry on their dashboard, they are taken to the TB.01 form page. This page presents form fields for patient demographics, medical history, and treatment plan details. As the Nurse fills each field, real-time validation confirms data formats and required entries. Upon submitting the form, the system saves the new patient record and redirects the Nurse back to a refreshed patient list, where the newly added patient appears at the top.

A Doctor selects a specific patient from their list to view detailed records. This patient detail page shows basic profile information at the top, followed by a section for creating digital prescriptions. The Doctor clicks an "Add Prescription" button, opens a modal with fields for medication name, dosage, and duration, and then submits the form. The prescription is saved to the patient’s record and the Doctor returns to the detail page where the new prescription appears in the history table.

A Pharmacist accesses the dispensing module by selecting the inventory link in the sidebar. On the inventory page, a table lists all drug stock items along with quantities. The Pharmacist clicks a pending prescription request, which opens a dispensing form that displays prescription details and required quantities. After confirming stock availability, the Pharmacist clicks the "Dispense" button. The system deducts the quantity from the inventory, logs the dispensing event in the patient’s prescription history, and returns the Pharmacist to the updated inventory table.

Patients navigate to their adherence page by clicking a daily reminder card on their dashboard. This page shows the prompt to submit a photo or selfie. The Patient clicks "Upload Proof," selects an image from their device, and confirms submission. The app displays an upload progress indicator. When the upload completes, the system timestamps the entry and stores the file securely. The Patient sees a confirmation message and can then sign out or return to the dashboard.

PMOs go to a verification page by clicking an adherence monitoring link in their sidebar. This page groups adherence entries by date and flags any missing or inconsistent submissions. The PMO reviews each entry, optionally adds notes or follow-up tasks, and marks them as verified. After finishing a session, the PMO navigates back to the dashboard or moves on to pending side-effect reports via the notifications icon.

Admins open the user management page from the sidebar. A table lists all user accounts with their roles and statuses. The Admin can search, filter, or sort this list. To add a new user, the Admin clicks "Invite User," enters an email, assigns a role, and sends an invitation. The invited user receives an email link to complete the sign-up flow. Admins can also deactivate or update existing user roles. After any change, the table refreshes in place.

Throughout these flows, the app uses client-side routing so navigation between pages is swift and without full page reloads, maintaining the PWA experience.

## Settings and Account Management

Every user can access their personal settings by clicking their avatar in the header and choosing "Profile Settings." This page displays editable fields for name, contact email, and password. Users type changes and click "Save" to update their information. A confirmation toast appears once updates succeed. On the same settings page, users can opt into or out of notification preferences such as daily reminders, email alerts for side-effect reports, or SMS updates if enabled by the system.

There is no billing or subscription flow in this application since access is role-based and managed by the organization. Once profile updates are complete, users can navigate back to the main dashboard by clicking a persistent breadcrumb or the app logo.

## Error States and Alternate Paths

If a user mistypes their email or password during login, the system displays an inline error message under the input fields explaining that the credentials are invalid. During sign-up, if the email is already registered or the password is too weak, a clear error note appears near the relevant field. Should a password recovery link expire or be used twice, the recovery page informs the user and provides an option to request a new link.

While filling any form, if the network connection fails, the app shows a banner at the top indicating that changes could not be saved. The user may retry by clicking a "Retry" button or continue working offline if supported by the service worker, with changes queued until connectivity returns. If a user attempts to navigate to a page they are not authorized for, such as a patient trying to access the admin panel, they see an access denied screen explaining they need higher privileges and offering a link back to their dashboard.

When file uploads for adherence proof exceed allowed size or are in the wrong format, the upload form promptly rejects the file and explains the acceptable file types and size limits.

## Conclusion and Overall App Journey

In the TB Treatment Monitoring System, a user begins by creating an account or receiving an invitation from an administrator. After confirming their email, they sign in and are greeted by a role-specific dashboard that guides them to their core tasks. Nurses register new patients, Doctors write prescriptions, Pharmacists dispense medication, Patients submit daily treatment proof, PMOs verify adherence, and Admins manage user accounts.

Each journey flows smoothly from one page to the next thanks to instant client-side routing and clear validation feedback. Users manage their personal settings at any time and receive helpful error messages whenever something goes wrong. At every step, the design prioritizes speed, accessibility, and security, ensuring that healthcare providers and patients alike can complete their key tasks quickly and reliably.

Overall, the application supports a complete loop from sign-up to everyday workflows, enabling the TB care team to track treatment, manage inventory, and maintain patient engagement in a unified, user-friendly environment.