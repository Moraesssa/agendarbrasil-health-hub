# Project Structure

## Root Level Organization

```
├── src/                    # Main React application source
├── backend/               # Express.js API server
├── database/              # SQL schema and migrations
├── supabase/             # Supabase configuration and functions
├── development-scripts/   # Development and debugging utilities
├── cypress/              # E2E test specifications
├── docs/                 # Project documentation
└── public/               # Static assets
```

## Frontend Structure (`src/`)

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   └── [feature]/       # Feature-specific components
├── pages/               # Route components
│   ├── [UserType]/      # User-specific pages (Medico, Paciente)
│   └── shared/          # Shared pages
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── services/            # API service functions
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── lib/                 # Third-party library configurations
└── styles/              # Global styles and Tailwind config
```

## Backend Structure (`backend/`)

```
backend/
├── src/
│   ├── routes/          # Express route definitions
│   ├── controllers/     # Route handlers
│   ├── middlewares/     # Express middlewares
│   ├── services/        # Business logic
│   └── config/          # Configuration files
├── package.json
└── server.js           # Entry point
```

## Database Structure (`database/`)

```
database/
├── schema.sql          # Main database schema
├── migrations/         # Database migration files
└── [feature]_*.sql     # Feature-specific SQL files
```

## Supabase Structure (`supabase/`)

```
supabase/
├── functions/          # Edge functions
├── migrations/         # Auto-generated migrations
└── config.toml        # Supabase configuration
```

## Naming Conventions

### Files and Directories
- **Components**: PascalCase (`UserProfile.tsx`)
- **Pages**: PascalCase (`DashboardMedico.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Directories**: kebab-case or camelCase consistently

### Code Conventions
- **React Components**: PascalCase with descriptive names
- **Functions**: camelCase with verb-noun pattern (`getUserProfile`)
- **Variables**: camelCase (`currentUser`, `appointmentList`)
- **Types/Interfaces**: PascalCase with descriptive suffixes (`UserProfile`, `AppointmentData`)

## Import Organization
1. React and external libraries
2. Internal components and utilities
3. Types and interfaces
4. Relative imports

## File Responsibilities

### Components
- Single responsibility principle
- Reusable and composable
- Props interface clearly defined
- Error boundaries where appropriate

### Pages
- Route-level components
- Data fetching and state management
- Layout composition
- User role-specific logic

### Services
- API communication
- Data transformation
- Error handling
- Authentication logic

### Utils
- Pure functions
- No side effects
- Well-tested utilities
- Type-safe implementations

## Development Scripts Location
All development, debugging, and testing scripts are organized in `development-scripts/` directory to keep the root clean while maintaining easy access for development workflows.