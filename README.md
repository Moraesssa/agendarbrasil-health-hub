# AgendarBrasil Health Hub

A comprehensive healthcare appointment scheduling platform built with modern web technologies.

## Project Overview

AgendarBrasil Health Hub is a full-featured healthcare management system that enables patients to schedule appointments with healthcare providers across Brazil. The platform provides a seamless experience for finding doctors, selecting appointment times, and managing healthcare consultations.

## Key Features

### Appointment Scheduling System
- **Multi-step appointment booking**: Specialty → Location → Doctor → Date/Time selection
- **Real-time availability**: Dynamic loading of available time slots
- **Location-based search**: Find doctors by state and city
- **Specialty filtering**: Browse healthcare providers by medical specialty
- **Integrated scheduling**: Direct integration with Supabase backend

### Core Functionality
- User authentication and authorization
- Patient dashboard and appointment management
- Doctor and location management
- Real-time data synchronization
- Responsive design for all devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js (recommended: install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or yarn package manager

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd agendarbrasil-health-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

1. Copy the environment example file:
   ```sh
   cp .env.example .env
   ```

2. Configure your Supabase credentials in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_ENV=development
   ```

3. Verify your environment configuration:
   ```sh
   node test-env-vars.js
   ```
   This script will check if your `.env` file exists and validate that all required environment variables are properly configured.

### Configuration Warnings

The application includes built-in configuration validation to help developers identify setup issues:

- **SupabaseConfigWarning Component**: Displays a prominent warning when Supabase environment variables are missing or incorrectly configured
- **Real-time Validation**: Automatically detects database connection issues and provides clear setup instructions
- **User-friendly Guidance**: Shows step-by-step instructions for configuring required environment variables
- **Development Helper**: References the `.env.example` file for proper configuration format

## Architecture

### Appointment Scheduling Hook (`useAppointmentScheduling`)

The core appointment scheduling functionality is managed by a custom React hook that provides:

**State Management:**
- Selection states for specialty, location, doctor, date, and time
- Loading and submission states
- Data collections for specialties, states, cities, doctors, and available slots

**Key Features:**
- Cascading selection logic (state → city → doctor → availability)
- Automatic data loading based on user selections
- Error handling with toast notifications
- Navigation integration after successful booking

**API Integration:**
- Supabase RPC calls for location data
- AppointmentService integration for doctor and slot management
- Real-time availability checking

### Services Architecture

The application uses a service-oriented architecture with dedicated services for:
- `appointmentService`: Core appointment management
- `authService`: User authentication
- `locationService`: Geographic data management
- `medicalService`: Healthcare provider data
- `specialtyService`: Medical specialty management

## Development

### Available Scripts

```sh
# Development server
npm run dev

# Production build
npm run build

# Development build
npm run build:dev

# Clean build (removes cache)
npm run build:clean

# Clean development (removes cache)
npm run dev:clean

# Linting
npm run lint

# Preview production build
npm run preview
```

### Testing and Debugging Tools

The project includes several debugging and testing utilities:

#### Environment Configuration Testing
- **`test-env-vars.js`**: Environment variables validation script
  - Checks if `.env` file exists in the project root
  - Lists all configured environment variables from `.env`
  - Validates required environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV`)
  - Provides clear feedback on missing configuration
  - Uses ES modules with proper file path resolution

```sh
# Run environment configuration check
node test-env-vars.js
```

#### Time Slot Generation Testing
- **`test-horarios-debug.js`**: Standalone script to test appointment time slot generation logic
  - Tests the core time slot generation algorithm
  - Validates working hours configuration
  - Simulates different days of the week scenarios
  - Useful for debugging scheduling issues

```sh
# Run time slot generation test
node test-horarios-debug.js
```

#### Doctor Configuration Debugging
- **`debug-doctor-config.js`**: Comprehensive doctor configuration analysis tool
  - Uses hardcoded Supabase credentials for direct database access
  - Analyzes doctor profiles, specialties, and working hours
  - Tests location-based doctor search functionality
  - Validates appointment scheduling configurations
  - Provides detailed output for troubleshooting doctor setup issues

```sh
# Run doctor configuration debug
node debug-doctor-config.js
```

**⚠️ Security Note**: This script contains hardcoded database credentials and should only be used in development environments. Ensure credentials are removed before committing to version control.

#### Other Testing Scripts
- **`test-auth.html`**: Authentication testing interface
- **`test-backend-functions.sql`**: Backend function testing queries
- **`test-webhook-accessibility.js`**: Webhook endpoint testing
- **`debug-horarios.js`**: Advanced scheduling debugging
- **`debug-supabase.js`**: Supabase connection debugging
- **`debug-doctor-config.js`**: Doctor configuration debugging with hardcoded credentials
- **`debug-locations.js`**: Location data and doctor search functionality debugging

```sh
# Run doctor configuration debug
node debug-doctor-config.js

# Run location debugging
node debug-locations.js
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components (Alert, Button, etc.)
│   ├── health/         # Healthcare-specific components
│   ├── integrations/   # Integration-related components
│   └── SupabaseConfigWarning.tsx  # Database configuration warning
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── pages/              # Route components
├── services/           # Business logic and API calls
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Components

#### SupabaseConfigWarning
A critical system component that provides user-friendly feedback when database configuration is missing or incorrect.

**Features:**
- Conditional rendering based on database connection status
- Clear, actionable error messages in Portuguese
- Step-by-step configuration instructions
- References to `.env.example` for proper setup format
- Uses destructive Alert variant for high visibility

**Usage:**
```tsx
<SupabaseConfigWarning show={!isDatabaseConnected} />
```

**Dependencies:**
- `@/components/ui/alert` (Alert, AlertDescription, AlertTitle)
- `lucide-react` (AlertTriangle icon)

## Deployment

### Lovable Platform
Simply open [Lovable](https://lovable.dev/projects/08eaeedb-5121-451b-bb36-da1564551706) and click on Share → Publish.

### Custom Domain
To connect a custom domain, navigate to Project > Settings > Domains and click Connect Domain.
Read more: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Security Considerations

### Debug Scripts with Hardcoded Credentials

⚠️ **Important Security Notice**: Some debug scripts in this project contain hardcoded database credentials for development purposes:

- `debug-doctor-config.js` - Contains hardcoded Supabase URL and service key
- Other debug scripts may also contain sensitive credentials

**Security Best Practices:**
1. **Development Only**: These scripts should only be used in development environments
2. **Credential Management**: Remove or replace hardcoded credentials before committing to version control
3. **Environment Variables**: Consider migrating debug scripts to use environment variables instead
4. **Access Control**: Ensure these scripts are not deployed to production environments
5. **Regular Audits**: Regularly review debug scripts for exposed credentials

**Recommended Actions:**
- Use `.env` files for sensitive configuration
- Implement credential rotation policies
- Add debug scripts to `.gitignore` if they contain sensitive data
- Use service accounts with minimal required permissions

## Contributing

### Development Workflow
1. **Lovable**: Visit the [Lovable Project](https://lovable.dev/projects/08eaeedb-5121-451b-bb36-da1564551706) for AI-assisted development
2. **Local IDE**: Clone and develop locally, push changes to sync with Lovable
3. **GitHub**: Edit files directly in the GitHub interface
4. **Codespaces**: Use GitHub Codespaces for cloud-based development

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for consistent styling
- React Hook Form for form management
- Zod for runtime validation
