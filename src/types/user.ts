export type UserType = 'paciente' | 'medico';

export interface UserPreferences {
  notifications: boolean;
  theme: 'light' | 'dark';
  language: 'pt-BR';
}

export interface BaseUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  userType: UserType;
  onboardingCompleted: boolean;
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
  preferences: UserPreferences;
  // Doctor specific fields
  especialidades?: string[];
}

export interface OnboardingStatus {
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  canProceed: boolean;
  errors: string[];
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Medico {
  userId: string;
  crm: string;
  especialidades: string[];
  registroEspecialista: string;
  telefone: string;
  whatsapp: string;
  endereco: Endereco;
  dadosProfissionais: {
    nomeCompleto: string;
    cpf: string;
    dataNascimento: Date;
    formacao: string;
    instituicao: string;
    anoFormacao: number;
  };
  configuracoes: {
    duracaoConsulta: number;
    valorConsulta: number;
    aceitaConvenio: boolean;
    conveniosAceitos: string[];
    horarioAtendimento: {
      [key: string]: { inicio: string; fim: string; ativo: boolean };
    };
  };
  verificacao: {
    crmVerificado: boolean;
    documentosEnviados: boolean;
    aprovado: boolean;
    dataAprovacao?: Date;
  };
}

export interface Paciente {
  userId: string;
  dadosPessoais: {
    nomeCompleto: string;
    cpf: string;
    rg: string;
    dataNascimento: Date;
    genero: 'masculino' | 'feminino' | 'outro';
    estadoCivil: string;
    profissao: string;
  };
  contato: {
    telefone: string;
    whatsapp: string;
    telefoneEmergencia: string;
    contatoEmergencia: string;
  };
  endereco: Endereco;
  dadosMedicos: {
    tipoSanguineo: string;
    alergias: string[];
    medicamentosUso: string[];
    condicoesCronicas: string[];
    cirurgiasAnteriores: string[];
    historicoFamiliar: string[];
  };
  convenio: {
    temConvenio: boolean;
    nomeConvenio: string;
    numeroCartao: string;
    validade?: Date;
    tipoPlano: string;
  };
}