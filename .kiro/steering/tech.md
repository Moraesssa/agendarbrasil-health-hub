# Technology Stack

## Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **UI Library**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state, React Context for app state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest for unit tests, Cypress for E2E testing

## Backend
- **Runtime**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage for documents and images
- **Edge Functions**: Supabase Functions for serverless operations

## External Integrations
- **Payments**: Stripe for payment processing
- **Video Calls**: WebRTC implementation (ready for Twilio/Vonage integration)
- **Digital Signatures**: ICP-Brasil compliant signing service integration
- **Notifications**: Email and SMS notifications

## Development Tools
- **Package Manager**: npm (with pnpm-lock.yaml for alternative)
- **Linting**: ESLint with TypeScript rules
- **Code Quality**: Prettier for formatting
- **Bundle Analysis**: Rollup visualizer for production builds

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Run tests
npm run test:unit
npm run test:e2e

# Linting and validation
npm run lint
npm run validate
```

### Production
```bash
# Production build with security checks
npm run build:production

# Validate production readiness
npm run validate:production

# Security audit
npm run security:audit
```

### Database
```bash
# Supabase local development
npx supabase start
npx supabase db reset
npx supabase functions serve
```

## Environment Configuration
- Use `.env` files for environment variables
- Separate configurations for development, staging, and production
- All sensitive data must be stored in environment variables, never in code