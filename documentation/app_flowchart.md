flowchart TD
    Start[Start] --> Auth[User Authentication]
    Auth --> RoleCheck{Determine User Role}
    RoleCheck -->|Admin| AdminDashboard[Admin Dashboard]
    RoleCheck -->|Nurse| NurseDashboard[Nurse Dashboard]
    RoleCheck -->|Doctor| DoctorDashboard[Doctor Dashboard]
    RoleCheck -->|Pharmacist| PharmacistDashboard[Pharmacist Dashboard]
    RoleCheck -->|Patient| PatientDashboard[Patient Dashboard]
    RoleCheck -->|PMO| PMODashboard[PMO Dashboard]

    NurseDashboard --> Registration[Patient Registration Form]
    DoctorDashboard --> Prescription[Digital Prescription Workflow]
    PharmacistDashboard --> Inventory[Stock Management Interface]
    PharmacistDashboard --> Dispense[Dispensing Workflow]
    PatientDashboard --> Adherence[Daily Adherence Submission]
    PMODashboard --> Verification[Adherence Verification]
    PMODashboard --> Alerts[Real Time Alerts]

    Prescription --> StockUpdate[Update Inventory]
    StockUpdate --> Inventory

    Adherence --> PhotoUpload[Upload Photo Proof]
    PhotoUpload --> Storage[Save to Protected Storage]
    PhotoUpload --> NotifyPMO[Trigger Notification]

    NotifyPMO --> Alerts

    AdminDashboard --> UserManagement[User Management Interface]
    UserManagement --> RoleAssignment[Assign Roles and Permissions]

    subgraph Infrastructure
        DataFetch[TanStack Query Data Fetch]
        FormValid[React Hook Form Zod Validation]
        PWA[PWA Service Worker]
        EdgeFns[Supabase Edge Functions]
    end

    DataFetch --> Registration
    DataFetch --> Prescription
    DataFetch --> Inventory
    DataFetch --> Adherence
    FormValid --> Registration
    FormValid --> Prescription
    EdgeFns --> NotifyPMO
    EdgeFns --> StockUpdate