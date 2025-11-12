# TB Treatment Monitoring Mobile App

A comprehensive mobile application for tuberculosis treatment monitoring using Expo React Native and Supabase backend.

## Features

### Core Functionality
- **Role-Based Access Control**: Admin, Nurse, Doctor, Pharmacist, Patient, PMO roles
- **Patient Daily Adherence**: Photo + selfie proof with automatic PMO notification
- **Smart Workflows**: Registration → Email verification → Prescribe → Request → Dispense → Track
- **Real-time Notifications**: Email alerts for reminders, stock, and side effects

### Role-Specific Features

#### Admin
- User and master data management
- System configuration
- Reporting and analytics

#### Nurse
- Patient registration (TB.01 form)
- Drug requests
- Patient scheduling
- Reporting (TB.03)

#### Doctor
- Digital prescribing
- Treatment validation
- Patient monitoring

#### Pharmacist
- Stock management
- Medication dispensing
- Inventory tracking

#### Patient
- Daily medication logging with photo proof
- Symptom reporting
- Treatment progress tracking
- Stock monitoring

#### PMO (Treatment Supervisor)
- Adherence verification
- Patient monitoring
- Side effect reporting
- Progress tracking

## Tech Stack

- **Frontend**: Expo React Native with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: React Query for data fetching and caching
- **Navigation**: Expo Router (file-based routing)
- **Forms**: React Hook Form with Zod validation
- **Camera**: Expo Camera for photo verification
- **Notifications**: Expo Notifications for push notifications

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Expo CLI: `npm install -g @expo/cli`
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tb-treatment-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials:
     ```env
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```

4. **Database Setup**
   - Run the SQL script in `database/schema.sql` in your Supabase SQL Editor
   - This creates all tables, RLS policies, and triggers

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on device/simulator**
   - Use Expo Go app on mobile devices
   - Or run on simulator: `npm run android` or `npm run ios`

## Project Structure

```
tb-treatment-mobile/
├── app/                          # Expo Router pages
│   ├── auth/                    # Authentication screens
│   ├── (tabs)/                  # Main tab navigation
│   └── _layout.tsx             # Root layout with providers
├── components/                  # Reusable UI components
├── contexts/                   # React contexts (AuthContext)
├── lib/                        # Utilities and configurations
│   └── supabase.ts            # Supabase client and types
├── providers/                  # App providers (QueryProvider)
├── database/                   # Database schema and migrations
│   └── schema.sql             # Complete database setup
└── constants/                  # App constants
```

## Database Schema

The app uses a comprehensive PostgreSQL schema with the following main tables:

- **users**: User profiles and role information
- **patients**: TB patient registration and treatment data
- **prescriptions**: Digital prescription records
- **adherence_logs**: Daily medication adherence with photo proof
- **inventory**: Pharmacy stock management
- **dispensing_records**: Medication dispensing history
- **side_effects**: Patient-reported symptoms and triage
- **notifications**: System notifications and alerts

All tables include Row Level Security (RLS) policies for role-based access control.

## Authentication Flow

1. **Registration**: Users select their role during signup
2. **Email Verification**: Required for account activation
3. **Role-Based Navigation**: Users are routed to appropriate dashboards
4. **Secure Sessions**: JWT-based authentication with refresh tokens

## Camera Integration

- Uses Expo Camera for medication adherence photos
- Supports both photo and selfie capture
- Secure upload to Supabase Storage
- Offline queuing for poor connectivity areas

## Notification System

- **Medication Reminders**: Daily reminders for patients
- **Stock Alerts**: Low inventory notifications for pharmacists
- **Side Effect Alerts**: Automatic escalation for severe symptoms
- **Workflow Notifications**: Status updates throughout treatment pipeline

## Security Features

- **Row Level Security**: Database-level access control
- **Role-Based Permissions**: Granular access by user role
- **Secure File Upload**: Protected media storage
- **Input Validation**: Comprehensive form validation
- **HTTPS Enforcement**: Secure communication

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Conventional commits for version control

### Testing
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for critical workflows

### Performance
- Image compression for camera uploads
- Lazy loading for large datasets
- Efficient state management with React Query

## Deployment

### Build for Production
```bash
# Build for production
npm run build

# Generate APK for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Environment Variables for Production
Set the following in your production environment:
- `EXPO_PUBLIC_SUPABASE_URL`: Production Supabase URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Production Supabase anon key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For technical support or questions, please open an issue in the repository or contact the development team.

## Roadmap

### Phase 2 Features
- SMS/voice reminders
- Advanced analytics dashboard
- Multi-language support
- Offline-first synchronization
- Third-party EHR integrations

### Future Enhancements
- Machine learning for adherence prediction
- Video consultation integration
- Advanced reporting capabilities
- Multi-facility support
