import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { BaseUser, OnboardingStatus } from '@/types/user';
import { mockDataService, MockPatient } from '@/services/mockDataService';

// Simular um usuário Supabase baseado no paciente mock
const createMockUser = (patient: MockPatient): User => ({
  id: patient.id,
  aud: 'authenticated',
  role: 'authenticated',
  email: patient.email,
  email_confirmed_at: new Date().toISOString(),
  phone: patient.telefone,
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    full_name: patient.display_name,
    cpf: patient.cpf,
    telefone: patient.telefone,
    cidade: patient.cidade,
    estado: patient.estado,
    endereco: patient.endereco,
    data_nascimento: patient.data_nascimento,
    sexo: patient.sexo
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

// Simular uma sessão Supabase
const createMockSession = (user: User): Session => ({
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user
});

// Converter paciente mock para BaseUser
const createBaseUser = (patient: MockPatient): BaseUser => ({
  uid: patient.id,
  email: patient.email,
  displayName: patient.display_name,
  photoURL: '', // Mocks não têm foto por padrão
  userType: 'paciente', // Todos os mocks são pacientes
  onboardingCompleted: true, // Mocks já estão "onboarded"
  createdAt: new Date(),
  lastLogin: new Date(),
  isActive: true,
  preferences: {
    notifications: true,
    theme: 'light',
    language: 'pt-BR',
  }
});

export const useMockAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  // Inicializar mock auth se os mocks estiverem habilitados
  useEffect(() => {
    if (mockDataService.isEnabled()) {
      const currentPatient = mockDataService.getCurrentPatient();
      
      if (currentPatient) {
        console.log('🎭 Mock Auth: Carregando paciente', currentPatient.display_name);
        
        const mockUser = createMockUser(currentPatient);
        const mockSession = createMockSession(mockUser);
        const mockUserData = createBaseUser(currentPatient);
        
        setUser(mockUser);
        setSession(mockSession);
        setUserData(mockUserData);
        setOnboardingStatus(null);
        
        console.log('🎭 Mock Auth: Usuário mock carregado', {
          id: mockUser.id,
          name: mockUserData.displayName,
          city: currentPatient.cidade,
          state: currentPatient.estado
        });
      }
    }
    
    setLoading(false);
  }, []);

  // Função para trocar de paciente mock
  const switchPatient = (patientIndex: number) => {
    if (!mockDataService.isEnabled()) {
      console.warn('🎭 Mock Auth: Mocks não estão habilitados');
      return;
    }

    mockDataService.setCurrentPatient(patientIndex);
    const newPatient = mockDataService.getCurrentPatient();
    
    if (newPatient) {
      const mockUser = createMockUser(newPatient);
      const mockSession = createMockSession(mockUser);
      const mockUserData = createBaseUser(newPatient);
      
      setUser(mockUser);
      setSession(mockSession);
      setUserData(mockUserData);
      
      console.log('🎭 Mock Auth: Usuário alterado para', newPatient.display_name);
    }
  };

  // Função para próximo paciente
  const nextPatient = () => {
    if (!mockDataService.isEnabled()) return;
    
    const nextMockPatient = mockDataService.getNextPatient();
    const mockUser = createMockUser(nextMockPatient);
    const mockSession = createMockSession(mockUser);
    const mockUserData = createBaseUser(nextMockPatient);
    
    setUser(mockUser);
    setSession(mockSession);
    setUserData(mockUserData);
    
    console.log('🎭 Mock Auth: Próximo paciente carregado', nextMockPatient.display_name);
  };

  // Simular logout
  const mockSignOut = () => {
    setUser(null);
    setSession(null);
    setUserData(null);
    setOnboardingStatus(null);
    console.log('🎭 Mock Auth: Usuário deslogado');
  };

  // Simular login com paciente específico
  const mockSignIn = (patientId?: string) => {
    const patient = patientId 
      ? mockDataService.getPatientById(patientId) 
      : mockDataService.getCurrentPatient();
    
    if (patient) {
      const mockUser = createMockUser(patient);
      const mockSession = createMockSession(mockUser);
      const mockUserData = createBaseUser(patient);
      
      setUser(mockUser);
      setSession(mockSession);
      setUserData(mockUserData);
      setOnboardingStatus(null);
      
      console.log('🎭 Mock Auth: Login simulado para', patient.display_name);
    }
  };

  return {
    // Estados padrão do auth
    user,
    session,
    userData,
    loading,
    onboardingStatus,
    setUserData,
    setOnboardingStatus,
    
    // Funções específicas do mock
    switchPatient,
    nextPatient,
    mockSignOut,
    mockSignIn,
    
    // Informações do paciente atual
    currentPatient: user ? mockDataService.getPatientById(user.id) : null,
    
    // Status dos mocks
    isMockEnabled: mockDataService.isEnabled()
  };
};