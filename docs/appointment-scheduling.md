# Appointment Scheduling System

## Overview

The appointment scheduling system is the core feature of AgendarBrasil Health Hub, enabling patients to book medical consultations through a streamlined multi-step process.

## Architecture

### useAppointmentScheduling Hook

The `useAppointmentScheduling` hook centralizes all appointment booking logic and state management, with built-in fallback support for development and demonstration purposes.

#### State Management

**Selection States:**
- `selectedSpecialty`: Medical specialty (string)
- `selectedState`: Brazilian state (string) 
- `selectedCity`: City within selected state (string)
- `selectedDoctor`: Doctor ID (string)
- `selectedDate`: Appointment date (string)
- `selectedTime`: Appointment time (string)
- `selectedLocal`: Selected location with available hours (LocalComHorarios)

**Data Collections:**
- `specialties`: Available medical specialties (string[])
- `states`: Available states with UF codes (StateInfo[])
- `cities`: Cities in selected state (CityInfo[])
- `doctors`: Doctors matching filters (Medico[])
- `locaisComHorarios`: Available locations with time slots (LocalComHorarios[])

**Loading States:**
- `isLoading`: General loading state for data fetching
- `isSubmitting`: Loading state during appointment submission

#### Cascading Selection Logic

The hook implements a cascading selection system where each choice affects subsequent options:

1. **State Selection** → Loads available cities
2. **City + Specialty Selection** → Loads matching doctors
3. **Doctor + Date Selection** → Loads available time slots
4. **Time Selection** → Enables appointment booking

#### Reset Functionality

The `resetSelection` function clears dependent selections when parent selections change:
- Changing state resets city, doctors, and doctor selection
- Changing city resets doctors and doctor selection  
- Changing doctor resets date selection
- Changing date resets time and location selection

## API Integration

### Supabase RPC Functions

**get_available_states()**: Returns states with available healthcare providers
**get_available_cities(state_uf)**: Returns cities in specified state with providers

### AppointmentService Methods

**getSpecialties()**: Fetches available medical specialties
**getDoctorsByLocationAndSpecialty()**: Finds doctors by location and specialty filters
**getAvailableSlotsByDoctor()**: Gets available time slots for specific doctor and date
**scheduleAppointment()**: Creates new appointment record

## Data Flow

### Initial Load
1. User authentication check
2. Parallel loading of specialties and states
3. Error handling with toast notifications

### Selection Process
1. User selects specialty
2. User selects state → Cities load automatically
3. User selects city → Doctors load based on specialty + location
4. User selects doctor and date → Available slots load
5. User selects time slot → Appointment ready for booking

### Appointment Creation
1. Validation of all required fields
2. DateTime formatting and location text generation
3. API call to schedule appointment
4. Success notification and navigation to patient dashboard
5. Error handling with descriptive messages

## Types and Interfaces

```typescript
interface StateInfo {
  uf: string;
}

interface CityInfo {
  cidade: string;
}

interface LocalComHorarios {
  id: string;
  nome_local: string;
  endereco: {
    logradouro: string;
    numero: string;
  };
}

interface Medico {
  id: string;
  // Additional doctor properties
}
```

## Error Handling

The system implements comprehensive error handling:
- Network errors during data loading
- Validation errors during appointment creation
- User-friendly error messages via toast notifications
- Graceful fallbacks for failed API calls

## Performance Optimizations

- **Lazy Loading**: Data loads only when needed based on user selections
- **Memoized Callbacks**: useCallback for expensive operations
- **Conditional Effects**: useEffect dependencies prevent unnecessary API calls
- **Loading States**: Clear feedback during async operations

## Usage Example

```typescript
const {
  models: { 
    selectedSpecialty, 
    selectedState, 
    selectedCity, 
    selectedDoctor, 
    selectedDate, 
    selectedTime,
    specialties,
    states,
    cities,
    doctors,
    locaisComHorarios
  },
  setters: {
    setSelectedSpecialty,
    setSelectedState,
    setSelectedCity,
    setSelectedDoctor,
    setSelectedDate,
    setSelectedTime,
    setSelectedLocal
  },
  state: { isLoading, isSubmitting },
  actions: { handleAgendamento, resetSelection }
} = useAppointmentScheduling();
```

## Time Slot Generation Algorithm

### Core Logic

The system uses a sophisticated time slot generation algorithm that converts working hours into available appointment slots:

#### Key Functions

**timeToMinutes(time)**: Converts HH:MM format to total minutes
```javascript
const timeToMinutes = (time) => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
};
```

**minutesToTime(minutes)**: Converts total minutes back to HH:MM format
```javascript
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};
```

**getDayName(date)**: Maps JavaScript day index to Portuguese day names
```javascript
const getDayName = (date) => {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[date.getUTCDay()];
};
```

#### Slot Generation Process

1. **Day Validation**: Checks if the selected date has configured working hours
2. **Block Processing**: Iterates through each active working hours block
3. **Slot Creation**: Generates appointment slots based on consultation duration
4. **Availability Check**: Filters out already booked time slots

#### Configuration Structure

```javascript
const workingHoursConfig = {
  duracaoConsulta: 30, // minutes
  horarioAtendimento: {
    segunda: [
      { inicio: '08:00', fim: '12:00', ativo: true },
      { inicio: '14:00', fim: '18:00', ativo: true }
    ],
    terca: [
      { inicio: '08:00', fim: '12:00', ativo: true },
      { inicio: '14:00', fim: '18:00', ativo: true }
    ]
    // ... other days
  }
};
```

### Testing and Debugging

The `test-horarios-debug.js` script provides comprehensive testing for the time slot generation:

- **Test Scenarios**: Different days of the week
- **Edge Cases**: Days without configuration
- **Output Validation**: Verifies correct slot count and timing
- **Debug Information**: Detailed logging of the generation process

```sh
# Run the time slot generation test
node test-horarios-debug.js
```

### Doctor Configuration Analysis

The `debug-doctor-config.js` script provides comprehensive debugging capabilities for doctor configurations:

**Key Features:**
- **Direct Database Access**: Uses hardcoded Supabase credentials for development debugging
- **Profile Analysis**: Examines doctor profiles, display names, and user IDs
- **Specialty Validation**: Checks assigned medical specialties for each doctor
- **Location Verification**: Analyzes active service locations and their configurations
- **Working Hours Review**: Detailed examination of appointment scheduling configurations
- **Search Function Testing**: Validates location-based doctor search functionality

**Security Warning**: This script contains hardcoded database credentials and should only be used in development environments. Ensure credentials are removed before committing to version control.

**Usage:**
```sh
# Run comprehensive doctor configuration analysis
node debug-doctor-config.js
```

**Output Information:**
- Doctor profile details with display names and IDs
- Associated medical specialties
- Active service locations count
- Working hours configuration by day of week
- Active time blocks with lunch break handling
- Location-based search functionality testing results

## Enhanced Time Slot Display

### TimeSlotButton Component

O sistema de agendamento agora inclui um componente avançado `TimeSlotButton` que oferece uma experiência visual aprimorada para seleção de horários.

#### Funcionalidades de Localização

**Integração com Informações de Estabelecimento:**
- Badges coloridos para identificação rápida de localizações
- Sistema de cores consistente baseado em hash do ID da localização
- Tooltips informativos com nome do estabelecimento
- Suporte a filtragem visual por localização

**Estados Visuais Aprimorados:**
- Indicadores claros de disponibilidade, seleção e filtragem
- Transições suaves e efeitos de hover responsivos
- Feedback visual imediato para interações do usuário
- Acessibilidade completa com ARIA labels descritivos

#### Implementação no Fluxo de Agendamento

```typescript
// Exemplo de integração com o hook de agendamento
const {
  models: { selectedTime, locaisComHorarios },
  setters: { setSelectedTime, setSelectedLocal }
} = useAppointmentScheduling();

// Renderização de horários com informações de localização
{locaisComHorarios.map(local => 
  local.horarios.map(horario => (
    <TimeSlotButton
      key={`${local.id}-${horario}`}
      time={horario}
      available={true}
      selected={selectedTime === horario}
      onClick={() => {
        setSelectedTime(horario);
        setSelectedLocal(local);
      }}
      locationId={local.id}
      locationName={local.nome_local}
      showLocationBadge={true}
    />
  ))
)}
```

#### Benefícios para a Experiência do Usuário

1. **Identificação Visual Rápida**: Cores consistentes permitem identificação imediata de estabelecimentos
2. **Informações Contextuais**: Tooltips fornecem detalhes adicionais sem poluir a interface
3. **Feedback Imediato**: Estados visuais claros para todas as interações
4. **Acessibilidade Aprimorada**: Suporte completo a tecnologias assistivas
5. **Filtragem Intuitiva**: Estados visuais para horários filtrados por localização

## Future Enhancements

- Appointment rescheduling functionality
- Recurring appointment support
- Multi-language support for specialties
- Advanced filtering options
- Calendar integration
- SMS/Email notifications
- Holiday and break time handling
- Dynamic consultation duration per specialty
- Location-based appointment preferences
- Real-time availability updates
- Enhanced location comparison features