# Components Documentation

## Overview

This document provides detailed information about the custom components used in the AgendarBrasil Health Hub application.

## System Components

### SupabaseConfigWarning

A critical system component that provides user-friendly feedback when database configuration is missing or incorrect.

#### Purpose
- Alerts developers and users when Supabase environment variables are not properly configured
- Provides clear, actionable instructions for resolving configuration issues
- Prevents confusion when the application cannot connect to the database

#### Props
```typescript
interface SupabaseConfigWarningProps {
  show: boolean; // Controls component visibility based on database connection status
}
```

#### Features
- **Conditional Rendering**: Only displays when `show` prop is `true`
- **Destructive Alert Styling**: Uses red/warning colors for high visibility
- **Multilingual Support**: All text content is in Portuguese for Brazilian users
- **Step-by-step Instructions**: Provides numbered list of configuration steps
- **Reference Documentation**: Points users to `.env.example` file for proper format

#### Usage Example
```tsx
import { SupabaseConfigWarning } from '@/components/SupabaseConfigWarning';

function App() {
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  
  // Check database connection status
  useEffect(() => {
    checkDatabaseConnection().then(setIsDatabaseConnected);
  }, []);

  return (
    <div>
      <SupabaseConfigWarning show={!isDatabaseConnected} />
      {/* Rest of application */}
    </div>
  );
}
```

#### Dependencies
- `@/components/ui/alert` - Base Alert components from shadcn/ui
- `lucide-react` - AlertTriangle icon for visual emphasis
- `React` - Core React functionality

#### Configuration Instructions Provided
1. Configure Supabase environment variables in `.env` file
2. Set `VITE_SUPABASE_URL` with project URL
3. Set `VITE_SUPABASE_ANON_KEY` with public key
4. Restart development server
5. Reference `.env.example` for proper format

#### Styling
- Uses `Alert` component with `variant="destructive"` for error styling
- Includes `mb-6` margin for proper spacing
- Uses `AlertTriangle` icon with `h-4 w-4` sizing
- Structured content with ordered list for clear instructions
- Code formatting for environment variable names

#### Integration Points
This component is typically used in:
- Application root components
- Dashboard layouts
- Any component that requires database connectivity
- Development environment setup flows

## UI Foundation Components

The application uses shadcn/ui components as the foundation for consistent styling and behavior:

### Alert Components
- `Alert`: Base alert container with variant support
- `AlertTitle`: Styled title for alert messages
- `AlertDescription`: Content area for detailed alert information

### Common Variants
- `default`: Standard informational alerts
- `destructive`: Error and warning alerts (used by SupabaseConfigWarning)

## Best Practices

### Component Development
1. **Conditional Rendering**: Use props to control component visibility
2. **Clear Props Interface**: Define TypeScript interfaces for all props
3. **Accessibility**: Include appropriate ARIA labels and semantic HTML
4. **Internationalization**: Consider language support for user-facing text
5. **Error Boundaries**: Implement proper error handling for critical components

### Configuration Components
1. **Clear Instructions**: Provide step-by-step guidance for setup issues
2. **Reference Documentation**: Link to example files and documentation
3. **Visual Hierarchy**: Use appropriate styling to convey urgency
4. **Actionable Content**: Focus on what users need to do to resolve issues

### Integration Guidelines
1. **Environment Detection**: Check configuration status before rendering warnings
2. **Development vs Production**: Consider different behavior for different environments
3. **Performance**: Avoid unnecessary re-renders with proper dependency management
4. **User Experience**: Provide clear feedback without overwhelming the interface