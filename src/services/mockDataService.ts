import { generateTimeSlots, getDayName, TimeSlot } from '@/utils/timeSlotUtils';

// Interface LocalComHorarios local
export interface LocalComHorarios {
  id: string;
  nome_local: string;
  endereco: any;
  horarios_disponiveis: TimeSlot[];
}

// Interface para pacientes mock
export interface MockPatient {
  id: string;
  display_name: string;
  email: string;
  cpf: string;
  telefone: string;
  cidade: string;
  estado: string;
  endereco: string;
  data_nascimento: string;
  sexo: 'masculino' | 'feminino';
  convenio?: string;
}

// Interface para médicos mock (baseado nos dados existentes)
export interface MockDoctor {
  id: string;
  display_name: string;
  especialidades: string[];
  crm: string;
  telefone: string;
  cidade: string;
  estado: string;
  configuracoes: {
    duracaoConsulta: number;
    horarioAtendimento: Record<string, any[]>;
  };
  locais_atendimento: {
    id: string;
    nome_local: string;
    endereco: any;
    ativo: boolean;
  }[];
}

const MOCK_DOCTORS: MockDoctor[] = [
  {
    id: 'doc-001',
    display_name: 'Dr. João Silva',
    especialidades: ['Cardiologia', 'Clínica Geral'],
    crm: '12345-SP',
    telefone: '(11) 98765-4321',
    cidade: 'São Paulo',
    estado: 'SP',
    configuracoes: {
      duracaoConsulta: 30,
      horarioAtendimento: {
        seg: [{ local_id: 'local-001', inicio: '08:00', fim: '12:00' }, { local_id: 'local-001', inicio: '14:00', fim: '18:00' }],
        qua: [{ local_id: 'local-001', inicio: '08:00', fim: '12:00' }],
        sex: [{ local_id: 'local-002', inicio: '10:00', fim: '19:00', inicioAlmoco: '13:00', fimAlmoco: '14:00' }]
      }
    },
    locais_atendimento: [
      { id: 'local-001', nome_local: 'Clínica Central SP', endereco: { rua: 'Rua Augusta, 1000' }, ativo: true },
      { id: 'local-002', nome_local: 'Consultório Itaim', endereco: { rua: 'Rua Itaim Bibi, 800' }, ativo: true }
    ]
  },
  {
    id: 'doc-002',
    display_name: 'Dra. Maria Santos',
    especialidades: ['Dermatologia'],
    crm: '54321-RJ',
    telefone: '(21) 91234-5678',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    configuracoes: {
      duracaoConsulta: 20,
      horarioAtendimento: {
        ter: [{ local_id: 'local-003', inicio: '09:00', fim: '17:00', inicioAlmoco: '12:00', fimAlmoco: '13:00' }],
        qui: [{ local_id: 'local-003', inicio: '09:00', fim: '17:00', inicioAlmoco: '12:00', fimAlmoco: '13:00' }]
      }
    },
    locais_atendimento: [
      { id: 'local-003', nome_local: 'Dermaclinica RJ', endereco: { rua: 'Rua Copacabana, 300' }, ativo: true }
    ]
  },
  {
    id: 'doc-003',
    display_name: 'Dr. Pedro Oliveira',
    especialidades: ['Pediatria', 'Clínica Geral'],
    crm: '67890-MG',
    telefone: '(31) 95555-4444',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    configuracoes: {
      duracaoConsulta: 40,
      horarioAtendimento: {
        seg: [{ local_id: 'local-004', inicio: '08:00', fim: '16:00' }],
        ter: [{ local_id: 'local-004', inicio: '08:00', fim: '16:00' }],
        qua: [{ local_id: 'local-004', inicio: '08:00', fim: '16:00' }],
        qui: [{ local_id: 'local-004', inicio: '08:00', fim: '16:00' }],
        sex: [{ local_id: 'local-004', inicio: '08:00', fim: '12:00' }]
      }
    },
    locais_atendimento: [
      { id: 'local-004', nome_local: 'Pediatria BH Kids', endereco: { rua: 'Av. Afonso Pena, 1500' }, ativo: true }
    ]
  }
];

// 40 pacientes distribuídos geograficamente conforme planejado
const MOCK_PATIENTS: MockPatient[] = [
  // São Paulo (12 pacientes)
  { id: 'pat-001', display_name: 'Ana Silva Santos', email: 'ana.silva@email.com', cpf: '123.456.789-01', telefone: '(11) 99001-1234', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua Augusta, 1000', data_nascimento: '1985-03-15', sexo: 'feminino' },
  { id: 'pat-002', display_name: 'Carlos Eduardo Oliveira', email: 'carlos.oliveira@email.com', cpf: '234.567.890-12', telefone: '(11) 99002-2345', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Paulista, 2000', data_nascimento: '1978-07-22', sexo: 'masculino' },
  { id: 'pat-003', display_name: 'Mariana Costa Lima', email: 'mariana.lima@email.com', cpf: '345.678.901-23', telefone: '(11) 99003-3456', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua Oscar Freire, 300', data_nascimento: '1992-11-08', sexo: 'feminino' },
  { id: 'pat-004', display_name: 'João Pedro Ferreira', email: 'joao.ferreira@email.com', cpf: '456.789.012-34', telefone: '(11) 99004-4567', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua da Consolação, 500', data_nascimento: '1990-01-30', sexo: 'masculino' },
  { id: 'pat-005', display_name: 'Beatriz Almeida Souza', email: 'beatriz.souza@email.com', cpf: '567.890.123-45', telefone: '(11) 99005-5678', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Faria Lima, 1500', data_nascimento: '1988-09-12', sexo: 'feminino' },
  { id: 'pat-006', display_name: 'Rafael Santos Pereira', email: 'rafael.pereira@email.com', cpf: '678.901.234-56', telefone: '(11) 99006-6789', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua Itaim Bibi, 800', data_nascimento: '1983-05-20', sexo: 'masculino' },
  { id: 'pat-007', display_name: 'Camila Rodrigues Silva', email: 'camila.silva@email.com', cpf: '789.012.345-67', telefone: '(11) 99007-7890', cidade: 'São Paulo', estado: 'SP', endereco: 'Av. Rebouças, 1200', data_nascimento: '1995-12-03', sexo: 'feminino' },
  { id: 'pat-008', display_name: 'Felipe Nascimento Costa', email: 'felipe.costa@email.com', cpf: '890.123.456-78', telefone: '(11) 99008-8901', cidade: 'São Paulo', estado: 'SP', endereco: 'Rua Pamplona, 600', data_nascimento: '1987-04-18', sexo: 'masculino' },
  { id: 'pat-009', display_name: 'Isabella Martins Rocha', email: 'isabella.rocha@email.com', cpf: '901.234.567-89', telefone: '(19) 99009-9012', cidade: 'Campinas', estado: 'SP', endereco: 'Av. das Amoreiras, 400', data_nascimento: '1991-08-25', sexo: 'feminino' },
  { id: 'pat-010', display_name: 'Gabriel Torres Mendes', email: 'gabriel.mendes@email.com', cpf: '012.345.678-90', telefone: '(19) 99010-0123', cidade: 'Campinas', estado: 'SP', endereco: 'Rua Barão de Jaguara, 700', data_nascimento: '1986-02-14', sexo: 'masculino' },
  { id: 'pat-011', display_name: 'Larissa Barbosa Santos', email: 'larissa.santos@email.com', cpf: '123.456.789-02', telefone: '(13) 99011-1234', cidade: 'Santos', estado: 'SP', endereco: 'Av. Ana Costa, 200', data_nascimento: '1989-10-07', sexo: 'feminino' },
  { id: 'pat-012', display_name: 'Bruno Cavalcanti Lima', email: 'bruno.lima@email.com', cpf: '234.567.890-13', telefone: '(13) 99012-2345', cidade: 'Santos', estado: 'SP', endereco: 'Rua do Comércio, 150', data_nascimento: '1984-06-11', sexo: 'masculino' },

  // Rio de Janeiro (6 pacientes)
  { id: 'pat-013', display_name: 'Fernanda Carvalho Alves', email: 'fernanda.alves@email.com', cpf: '345.678.901-24', telefone: '(21) 99013-3456', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Rua Copacabana, 300', data_nascimento: '1993-03-28', sexo: 'feminino' },
  { id: 'pat-014', display_name: 'Thiago Moreira Silva', email: 'thiago.silva@email.com', cpf: '456.789.012-35', telefone: '(21) 99014-4567', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Av. Atlântica, 1000', data_nascimento: '1980-11-15', sexo: 'masculino' },
  { id: 'pat-015', display_name: 'Juliana Ribeiro Costa', email: 'juliana.costa@email.com', cpf: '567.890.123-46', telefone: '(21) 99015-5678', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Rua Visconde de Pirajá, 500', data_nascimento: '1987-09-02', sexo: 'feminino' },
  { id: 'pat-016', display_name: 'André Luiz Campos', email: 'andre.campos@email.com', cpf: '678.901.234-57', telefone: '(21) 99016-6789', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Av. Nossa Senhora de Copacabana, 800', data_nascimento: '1982-12-19', sexo: 'masculino' },
  { id: 'pat-017', display_name: 'Patricia Gomes Fernandes', email: 'patricia.fernandes@email.com', cpf: '789.012.345-68', telefone: '(21) 99017-7890', cidade: 'Niterói', estado: 'RJ', endereco: 'Rua Cel. Moreira César, 200', data_nascimento: '1990-07-06', sexo: 'feminino' },
  { id: 'pat-018', display_name: 'Leonardo Dias Santos', email: 'leonardo.santos@email.com', cpf: '890.123.456-79', telefone: '(21) 99018-8901', cidade: 'Niterói', estado: 'RJ', endereco: 'Av. Ernani do Amaral Peixoto, 400', data_nascimento: '1985-04-23', sexo: 'masculino' },

  // Minas Gerais (4 pacientes)
  { id: 'pat-019', display_name: 'Renata Cardoso Oliveira', email: 'renata.oliveira@email.com', cpf: '901.234.567-80', telefone: '(31) 99019-9012', cidade: 'Belo Horizonte', estado: 'MG', endereco: 'Av. Afonso Pena, 1500', data_nascimento: '1988-01-17', sexo: 'feminino' },
  { id: 'pat-020', display_name: 'Marcelo Augusto Reis', email: 'marcelo.reis@email.com', cpf: '012.345.678-91', telefone: '(31) 99020-0123', cidade: 'Belo Horizonte', estado: 'MG', endereco: 'Rua da Bahia, 800', data_nascimento: '1981-08-10', sexo: 'masculino' },
  { id: 'pat-021', display_name: 'Aline Monteiro Silva', email: 'aline.silva@email.com', cpf: '123.456.789-03', telefone: '(31) 99021-1234', cidade: 'Belo Horizonte', estado: 'MG', endereco: 'Av. Bias Fortes, 600', data_nascimento: '1994-05-29', sexo: 'feminino' },
  { id: 'pat-022', display_name: 'Ricardo Nunes Costa', email: 'ricardo.costa@email.com', cpf: '234.567.890-14', telefone: '(34) 99022-2345', cidade: 'Uberlândia', estado: 'MG', endereco: 'Av. João Naves de Ávila, 300', data_nascimento: '1983-10-14', sexo: 'masculino' },

  // Paraná (4 pacientes)
  { id: 'pat-023', display_name: 'Vanessa Lopes Martins', email: 'vanessa.martins@email.com', cpf: '345.678.901-25', telefone: '(41) 99023-3456', cidade: 'Curitiba', estado: 'PR', endereco: 'Rua XV de Novembro, 700', data_nascimento: '1986-12-08', sexo: 'feminino' },
  { id: 'pat-024', display_name: 'Daniel Henrique Souza', email: 'daniel.souza@email.com', cpf: '456.789.012-36', telefone: '(41) 99024-4567', cidade: 'Curitiba', estado: 'PR', endereco: 'Av. Batel, 1200', data_nascimento: '1989-03-21', sexo: 'masculino' },
  { id: 'pat-025', display_name: 'Carolina Freitas Lima', email: 'carolina.lima@email.com', cpf: '567.890.123-47', telefone: '(41) 99025-5678', cidade: 'Curitiba', estado: 'PR', endereco: 'Rua Marechal Deodoro, 500', data_nascimento: '1992-07-13', sexo: 'feminino' },
  { id: 'pat-026', display_name: 'Rodrigo Almeida Castro', email: 'rodrigo.castro@email.com', cpf: '678.901.234-58', telefone: '(43) 99026-6789', cidade: 'Londrina', estado: 'PR', endereco: 'Av. Higienópolis, 800', data_nascimento: '1984-11-26', sexo: 'masculino' },

  // Rio Grande do Sul (4 pacientes)
  { id: 'pat-027', display_name: 'Priscila Santos Rocha', email: 'priscila.rocha@email.com', cpf: '789.012.345-69', telefone: '(51) 99027-7890', cidade: 'Porto Alegre', estado: 'RS', endereco: 'Rua dos Andradas, 900', data_nascimento: '1987-06-05', sexo: 'feminino' },
  { id: 'pat-028', display_name: 'Gustavo Pereira Silva', email: 'gustavo.silva@email.com', cpf: '890.123.456-70', telefone: '(51) 99028-8901', cidade: 'Porto Alegre', estado: 'RS', endereco: 'Av. Borges de Medeiros, 1100', data_nascimento: '1981-02-18', sexo: 'masculino' },
  { id: 'pat-029', display_name: 'Tatiana Rodrigues Costa', email: 'tatiana.costa@email.com', cpf: '901.234.567-81', telefone: '(51) 99029-9012', cidade: 'Porto Alegre', estado: 'RS', endereco: 'Rua Padre Chagas, 400', data_nascimento: '1990-09-30', sexo: 'feminino' },
  { id: 'pat-030', display_name: 'Fabio Machado Santos', email: 'fabio.santos@email.com', cpf: '012.345.678-92', telefone: '(54) 99030-0123', cidade: 'Caxias do Sul', estado: 'RS', endereco: 'Rua Sinimbu, 300', data_nascimento: '1985-12-22', sexo: 'masculino' },

  // Santa Catarina (3 pacientes)
  { id: 'pat-031', display_name: 'Luciana Vieira Alves', email: 'luciana.alves@email.com', cpf: '123.456.789-04', telefone: '(48) 99031-1234', cidade: 'Florianópolis', estado: 'SC', endereco: 'Av. Beira Mar Norte, 500', data_nascimento: '1988-04-16', sexo: 'feminino' },
  { id: 'pat-032', display_name: 'Eduardo Silva Mendes', email: 'eduardo.mendes@email.com', cpf: '234.567.890-15', telefone: '(48) 99032-2345', cidade: 'Florianópolis', estado: 'SC', endereco: 'Rua Felipe Schmidt, 200', data_nascimento: '1983-08-09', sexo: 'masculino' },
  { id: 'pat-033', display_name: 'Roberta Cardoso Lima', email: 'roberta.lima@email.com', cpf: '345.678.901-26', telefone: '(47) 99033-3456', cidade: 'Joinville', estado: 'SC', endereco: 'Rua Príncipe Joinville, 700', data_nascimento: '1991-01-24', sexo: 'feminino' },

  // Bahia (3 pacientes)
  { id: 'pat-034', display_name: 'Marcos Antonio Ferreira', email: 'marcos.ferreira@email.com', cpf: '456.789.012-37', telefone: '(71) 99034-4567', cidade: 'Salvador', estado: 'BA', endereco: 'Rua Chile, 300', data_nascimento: '1986-10-07', sexo: 'masculino' },
  { id: 'pat-035', display_name: 'Amanda Souza Oliveira', email: 'amanda.oliveira@email.com', cpf: '567.890.123-48', telefone: '(71) 99035-5678', cidade: 'Salvador', estado: 'BA', endereco: 'Av. Tancredo Neves, 1500', data_nascimento: '1989-05-12', sexo: 'feminino' },
  { id: 'pat-036', display_name: 'Paulo Roberto Santos', email: 'paulo.santos@email.com', cpf: '678.901.234-59', telefone: '(75) 99036-6789', cidade: 'Feira de Santana', estado: 'BA', endereco: 'Rua Senhor do Bonfim, 400', data_nascimento: '1982-11-28', sexo: 'masculino' },

  // Pernambuco (2 pacientes)
  { id: 'pat-037', display_name: 'Simone Castro Rocha', email: 'simone.rocha@email.com', cpf: '789.012.345-60', telefone: '(81) 99037-7890', cidade: 'Recife', estado: 'PE', endereco: 'Rua da Aurora, 600', data_nascimento: '1987-07-04', sexo: 'feminino' },
  { id: 'pat-038', display_name: 'Renato Gomes Silva', email: 'renato.silva@email.com', cpf: '890.123.456-71', telefone: '(81) 99038-8901', cidade: 'Olinda', estado: 'PE', endereco: 'Rua do Amparo, 200', data_nascimento: '1984-03-17', sexo: 'masculino' },

  // Goiás (2 pacientes)
  { id: 'pat-039', display_name: 'Cristiane Morais Lima', email: 'cristiane.lima@email.com', cpf: '901.234.567-82', telefone: '(62) 99039-9012', cidade: 'Goiânia', estado: 'GO', endereco: 'Av. T-4, 800', data_nascimento: '1990-08-31', sexo: 'feminino' },
  { id: 'pat-040', display_name: 'Alexandre Costa Pereira', email: 'alexandre.pereira@email.com', cpf: '012.345.678-93', telefone: '(62) 99040-0123', cidade: 'Goiânia', estado: 'GO', endereco: 'Rua T-25, 500', data_nascimento: '1985-01-19', sexo: 'masculino' }
];

// Configurações do sistema mock
interface MockConfig {
  enabled: boolean;
  currentPatientIndex: number;
  autoAuth: boolean;
}

class MockDataService {
  private config: MockConfig = {
    enabled: true,
    currentPatientIndex: 0,
    autoAuth: false
  };

  // Ativar sistema de mocks
  enableMocks(autoAuth: boolean = true) {
    this.config.enabled = true;
    this.config.autoAuth = autoAuth;
    console.log('🎭 Sistema de mocks ativado', { autoAuth });
  }

  // Desativar sistema de mocks
  disableMocks() {
    this.config.enabled = false;
    console.log('🎭 Sistema de mocks desativado');
  }

  // Verificar se mocks estão ativos
  isEnabled(): boolean {
    return this.config.enabled;
  }

  // Obter paciente atual ou específico
  getCurrentPatient(): MockPatient | null {
    if (!this.config.enabled) return null;
    return MOCK_PATIENTS[this.config.currentPatientIndex] || MOCK_PATIENTS[0];
  }

  // Mudar paciente atual
  setCurrentPatient(index: number) {
    if (index >= 0 && index < MOCK_PATIENTS.length) {
      this.config.currentPatientIndex = index;
      console.log('🎭 Paciente alterado para:', MOCK_PATIENTS[index].display_name);
    }
  }

  // Obter próximo paciente
  getNextPatient(): MockPatient {
    this.config.currentPatientIndex = (this.config.currentPatientIndex + 1) % MOCK_PATIENTS.length;
    return MOCK_PATIENTS[this.config.currentPatientIndex];
  }

  // Obter paciente por ID
  getPatientById(id: string): MockPatient | null {
    return MOCK_PATIENTS.find(p => p.id === id) || null;
  }

  // Obter todos os pacientes
  getAllPatients(): MockPatient[] {
    return [...MOCK_PATIENTS];
  }

  // Obter pacientes por cidade/estado
  getPatientsByLocation(city?: string, state?: string): MockPatient[] {
    return MOCK_PATIENTS.filter(p => {
      if (city && state) return p.cidade === city && p.estado === state;
      if (state) return p.estado === state;
      if (city) return p.cidade === city;
      return true;
    });
  }

  // Mock das especialidades
  async getSpecialties(): Promise<string[]> {
    if (!this.config.enabled) throw new Error('Mocks not enabled');
    
    return [
      'Cardiologia', 'Clínica Geral', 'Dermatologia', 'Endocrinologia',
      'Gastroenterologia', 'Ginecologia', 'Neurologia', 'Oftalmologia',
      'Ortopedia', 'Otorrinolaringologia', 'Pediatria', 'Pneumologia',
      'Psiquiatria', 'Urologia'
    ];
  }

  // Mock dos estados
  async getStates(): Promise<string[]> {
    if (!this.config.enabled) throw new Error('Mocks not enabled');
    
    return ['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'BA', 'PE', 'GO'];
  }

  // Mock das cidades por estado
  async getCitiesByState(state: string): Promise<string[]> {
    if (!this.config.enabled) throw new Error('Mocks not enabled');
    
    const cityMap: Record<string, string[]> = {
      'SP': ['São Paulo', 'Campinas', 'Santos'],
      'RJ': ['Rio de Janeiro', 'Niterói'],
      'MG': ['Belo Horizonte', 'Uberlândia'],
      'PR': ['Curitiba', 'Londrina'],
      'RS': ['Porto Alegre', 'Caxias do Sul'],
      'SC': ['Florianópolis', 'Joinville'],
      'BA': ['Salvador', 'Feira de Santana'],
      'PE': ['Recife', 'Olinda'],
      'GO': ['Goiânia']
    };
    
    return cityMap[state] || [];
  }

  // Mock dos médicos, agora usando a lista MOCK_DOCTORS
  async getDoctorsByLocationAndSpecialty(specialty: string, city: string, state: string): Promise<any[]> {
    if (!this.config.enabled) throw new Error('Mocks not enabled');
    
    return MOCK_DOCTORS.filter(doctor =>
      doctor.cidade === city &&
      doctor.estado === state &&
      doctor.especialidades.includes(specialty)
    ).map(d => ({ id: d.id, display_name: d.display_name }));
  }

  // Mock dos horários disponíveis, agora dinâmico e realista
  async getAvailableSlotsByDoctor(doctorId: string, date: string): Promise<LocalComHorarios[]> {
    if (!this.config.enabled) throw new Error('Mocks not enabled');

    const doctor = MOCK_DOCTORS.find(d => d.id === doctorId);
    if (!doctor) return [];

    const dayOfWeek = getDayName(new Date(date + 'T00:00:00'));
    const scheduleForDay = doctor.configuracoes.horarioAtendimento[dayOfWeek];
    if (!scheduleForDay) return [];

    const locaisComHorarios: LocalComHorarios[] = [];

    for (const local of doctor.locais_atendimento) {
      const workingHoursForLocal = {
        [dayOfWeek]: scheduleForDay.filter(s => s.local_id === local.id)
      };

      if (workingHoursForLocal[dayOfWeek].length > 0) {
        const slots = generateTimeSlots(
          {
            duracaoConsulta: doctor.configuracoes.duracaoConsulta,
            horarioAtendimento: workingHoursForLocal
          },
          new Date(date + 'T00:00:00'),
          [] // Assumindo nenhum agendamento existente no mock para simplicidade
        );

        if (slots.length > 0) {
          locaisComHorarios.push({
            id: local.id,
            nome_local: local.nome_local,
            endereco: local.endereco,
            horarios_disponiveis: slots
          });
        }
      }
    }
    
    return locaisComHorarios;
  }

  // Mock do agendamento
  async scheduleAppointment(appointmentData: any): Promise<{ success: boolean }> {
    if (!this.config.enabled) throw new Error('Mocks not enabled');
    
    console.log('🎭 Mock: Agendamento simulado', appointmentData);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  }

  // Obter estatísticas dos dados mock
  getStatistics() {
    const stats = {
      totalPatients: MOCK_PATIENTS.length,
      byState: {} as Record<string, number>,
      byCity: {} as Record<string, number>,
      byGender: { masculino: 0, feminino: 0 }
    };
    
    MOCK_PATIENTS.forEach(patient => {
      // Por estado
      stats.byState[patient.estado] = (stats.byState[patient.estado] || 0) + 1;
      
      // Por cidade
      const cityKey = `${patient.cidade} (${patient.estado})`;
      stats.byCity[cityKey] = (stats.byCity[cityKey] || 0) + 1;
      
      // Por gênero
      stats.byGender[patient.sexo]++;
    });
    
    return stats;
  }
}

// Instância singleton
export const mockDataService = new MockDataService();

// Funções auxiliares para desenvolvimento
export const MockUtils = {
  // Ativar mocks rapidamente
  enable: (autoAuth = true) => mockDataService.enableMocks(autoAuth),
  
  // Desativar mocks
  disable: () => mockDataService.disableMocks(),
  
  // Obter paciente aleatório
  getRandomPatient: (): MockPatient => {
    const randomIndex = Math.floor(Math.random() * MOCK_PATIENTS.length);
    return MOCK_PATIENTS[randomIndex];
  },
  
  // Obter pacientes de uma cidade específica
  getPatientsFromCity: (city: string, state: string): MockPatient[] => {
    return MOCK_PATIENTS.filter(p => p.cidade === city && p.estado === state);
  },
  
  // Listar todas as cidades disponíveis
  getAllCities: (): Array<{city: string, state: string, count: number}> => {
    const cityMap = new Map<string, number>();
    
    MOCK_PATIENTS.forEach(p => {
      const key = `${p.cidade}-${p.estado}`;
      cityMap.set(key, (cityMap.get(key) || 0) + 1);
    });
    
    return Array.from(cityMap.entries()).map(([key, count]) => {
      const [city, state] = key.split('-');
      return { city, state, count };
    }).sort((a, b) => b.count - a.count);
  }
};

// Exportar dados para uso em testes
export const MockData = {
  patients: MOCK_PATIENTS,
  totalPatients: MOCK_PATIENTS.length
};