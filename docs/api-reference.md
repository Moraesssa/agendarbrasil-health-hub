# API Reference

## Overview

This document outlines the API endpoints and service methods used in the AgendarBrasil Health Hub appointment scheduling system.

## Supabase RPC Functions

### get_available_states()

Returns a list of Brazilian states that have healthcare providers available in the system.

**Returns:**
```typescript
StateInfo[] = {
  uf: string; // State abbreviation (e.g., "SP", "RJ")
}[]
```

**Usage:**
```typescript
const { data } = await supabase.rpc('get_available_states');
```

### get_available_cities(state_uf)

Returns cities within a specified state that have healthcare providers.

**Parameters:**
- `state_uf` (string): State abbreviation

**Returns:**
```typescript
CityInfo[] = {
  cidade: string; // City name
}[]
```

**Usage:**
```typescript
const { data } = await supabase.rpc('get_available_cities', { 
  state_uf: selectedState 
});
```

## AppointmentService Methods

### getSpecialties()

Retrieves all available medical specialties.

**Returns:**
```typescript
Promise<string[]>
```

**Usage:**
```typescript
const specialties = await appointmentService.getSpecialties();
```

### getDoctorsByLocationAndSpecialty(specialty, city, state)

Finds doctors matching the specified location and specialty criteria.

**Parameters:**
- `specialty` (string): Medical specialty
- `city` (string): City name
- `state` (string): State abbreviation

**Returns:**
```typescript
Promise<Medico[]>
```

**Usage:**
```typescript
const doctors = await appointmentService.getDoctorsByLocationAndSpecialty(
  selectedSpecialty, 
  selectedCity, 
  selectedState
);
```

### getAvailableSlotsByDoctor(doctorId, date)

Gets available appointment time slots for a specific doctor on a given date.

**Parameters:**
- `doctorId` (string): Doctor's unique identifier
- `date` (string): Date in YYYY-MM-DD format

**Returns:**
```typescript
Promise<LocalComHorarios[]>
```

**Usage:**
```typescript
const slots = await appointmentService.getAvailableSlotsByDoctor(
  selectedDoctor, 
  selectedDate
);
```

### scheduleAppointment(appointmentData)

Creates a new appointment record in the system.

**Parameters:**
```typescript
{
  paciente_id: string;           // Patient ID
  medico_id: string;             // Doctor ID
  data_consulta: string;         // ISO datetime string
  tipo_consulta: string;         // Consultation type/specialty
  local_id: string;              // Location ID
  local_consulta_texto: string;  // Human-readable location
}
```

**Returns:**
```typescript
Promise<void>
```

**Usage:**
```typescript
await appointmentService.scheduleAppointment({
  paciente_id: user.id,
  medico_id: selectedDoctor,
  data_consulta: appointmentDateTime,
  tipo_consulta: selectedSpecialty,
  local_id: selectedLocal.id,
  local_consulta_texto: localTexto,
});
```

## Data Types

### StateInfo
```typescript
interface StateInfo {
  uf: string; // Brazilian state abbreviation
}
```

### CityInfo
```typescript
interface CityInfo {
  cidade: string; // City name
}
```

### LocalComHorarios
```typescript
interface LocalComHorarios {
  id: string;
  nome_local: string;
  endereco: {
    logradouro: string; // Street address
    numero: string;     // Street number
  };
  // Additional location properties
}
```

### Medico
```typescript
interface Medico {
  id: string;
  // Additional doctor properties
  // (specific fields depend on implementation)
}
```

## Error Handling

All API methods should be wrapped in try-catch blocks:

```typescript
try {
  const result = await appointmentService.someMethod();
  // Handle success
} catch (error) {
  logger.error("Operation failed", "context", error);
  toast({ 
    title: "Error message", 
    variant: "destructive" 
  });
}
```

## Authentication

All API calls require user authentication. The `useAuth` hook provides the current user context:

```typescript
const { user } = useAuth();
if (!user) {
  // Handle unauthenticated state
  return;
}
```

## Rate Limiting

Consider implementing rate limiting for API calls to prevent abuse and ensure system stability.

## Caching

The system uses React Query for caching API responses. Consider implementing appropriate cache invalidation strategies for real-time data updates.

## Configuration Management

### Environment Variables

The application requires specific environment variables for Supabase integration:

**Required Variables:**
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
- `VITE_APP_ENV`: Application environment identifier (development/production)

**Configuration Validation:**
The system includes built-in validation through the `SupabaseConfigWarning` component, which automatically detects missing or incorrect configuration and provides user-friendly setup instructions.

## Testing and Debugging

### Environment Configuration Testing

The `test-env-vars.js` script validates environment variable configuration:

**Features:**
- Checks for `.env` file existence in project root
- Lists all configured environment variables from `.env` file
- Validates required environment variables for Supabase integration
- Provides clear success/failure feedback with emojis
- Uses ES modules with proper file path resolution

**Required Environment Variables:**
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous/public key  
- `VITE_APP_ENV`: Application environment identifier

**Usage:**
```sh
# Run environment configuration validation
node test-env-vars.js
```

**Sample Output:**
```
🔍 Verificando configuração do ambiente...
📁 Arquivo .env existe: true
📋 Variáveis encontradas no .env:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_APP_ENV

🔍 Variáveis de ambiente do processo:
  VITE_SUPABASE_URL: ✅ Configurada
  VITE_SUPABASE_ANON_KEY: ✅ Configurada
  VITE_APP_ENV: ✅ Configurada

✅ Verificação concluída!
```

### Time Slot Generation Testing

The `test-horarios-debug.js` script provides standalone testing for the appointment scheduling algorithm:

**generateTimeSlots(config, selectedDate, existingAppointments)**

Tests the core time slot generation functionality with configurable parameters.

**Parameters:**
- `config` (object): Working hours configuration with consultation duration
- `selectedDate` (Date): Target date for slot generation
- `existingAppointments` (array): Optional array of existing bookings to exclude

**Returns:**
```typescript
TimeSlot[] = {
  time: string;      // HH:MM format
  available: boolean; // Availability status
}[]
```

**Test Configuration Example:**
```javascript
const testConfig = {
  duracaoConsulta: 30,
  horarioAtendimento: {
    segunda: [
      { inicio: '08:00', fim: '12:00', ativo: true },
      { inicio: '14:00', fim: '18:00', ativo: true }
    ]
  }
};
```

**Usage:**
```sh
# Run time slot generation test
node test-horarios-debug.js
```

The test script validates:
- Correct slot generation for configured days
- Proper handling of days without configuration
- Accurate time calculations and formatting
- Consultation duration adherence

### Doctor Configuration Debugging

The `debug-doctor-config.js` script provides comprehensive analysis of doctor configurations in the system:

**Features:**
- Direct database access using hardcoded Supabase credentials
- Analysis of doctor profiles, specialties, and working hours
- Validation of location-based doctor search functionality
- Testing of appointment scheduling configurations
- Detailed output for troubleshooting doctor setup issues

**Security Considerations:**
- Contains hardcoded database credentials for development use only
- Should not be used in production environments
- Credentials should be removed before committing to version control

**Usage:**
```sh
# Run doctor configuration debug
node debug-doctor-config.js
```

**Output Analysis:**
The script provides detailed information about:
- Doctor profiles with display names and IDs
- Associated medical specialties
- Active service locations
- Working hours configuration by day of week
- Active time blocks with lunch break handling
- Location-based search functionality testing

### Location Data Debugging

The `debug-locations.js` script provides specialized debugging for location data and doctor search functionality:

**Features:**
- Direct database access using hardcoded Supabase credentials
- Comprehensive analysis of `locais_atendimento` table data
- Validation of doctor-location relationships
- Testing of `get_doctors_by_location_and_specialty` RPC function
- Geographic data verification (cities, states)
- Address data structure analysis

**Key Functionality:**
- **Location Inventory**: Lists all service locations with associated doctor information
- **Geographic Analysis**: Identifies unique city/state combinations in the system
- **Search Function Testing**: Tests the core location-based doctor search with real data
- **Data Relationship Validation**: Verifies connections between doctors, locations, and specialties
- **Address Structure Review**: Analyzes address data format and completeness

**Security Considerations:**
- Contains hardcoded database credentials for development use only
- Should not be used in production environments
- Credentials should be removed before committing to version control

**Usage:**
```sh
# Run location data debugging
node debug-locations.js
```

**Output Analysis:**
The script provides detailed information about:
- Complete inventory of service locations (`locais_atendimento`)
- Doctor names and specialties for each location
- Location status (active/inactive)
- Address data structure and completeness
- Unique geographic locations (city/state combinations)
- Real-world testing of `get_doctors_by_location_and_specialty` function
- Search result validation with actual data

**Sample Output Structure:**
```
🔍 Verificando localizações dos médicos...

✅ Encontrados X locais de atendimento

🏥 Local: [Nome do Local]
   Médico: [Nome do Médico]
   Especialidades: [Lista de Especialidades]
   Ativo: Sim/Não
   Endereço: [Estrutura JSON do endereço]

📍 Localizações únicas encontradas:
   - Cidade, UF
   - ...

🔍 Testando função get_doctors_by_location_and_specialty...
✅ Resultado: X médico(s) encontrado(s)
   - [Nome do Médico] (ID: [ID])
```

**Use Cases:**
- Debugging location-based search issues
- Validating geographic data integrity
- Testing doctor-location relationships
- Verifying address data structure
- Troubleshooting search function performance