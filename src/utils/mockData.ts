// Dados mock para demonstração quando Supabase não está configurado

export const mockSpecialties = [
  "Cardiologia",
  "Dermatologia", 
  "Endocrinologia",
  "Ginecologia",
  "Neurologia",
  "Oftalmologia",
  "Ortopedia",
  "Pediatria",
  "Psiquiatria",
  "Urologia"
];

export const mockStates = [
  { uf: "SP" },
  { uf: "RJ" },
  { uf: "MG" },
  { uf: "RS" },
  { uf: "PR" },
  { uf: "SC" },
  { uf: "BA" },
  { uf: "GO" },
  { uf: "PE" },
  { uf: "CE" }
];

export const mockCities = {
  "SP": [
    { cidade: "São Paulo" },
    { cidade: "Campinas" },
    { cidade: "Santos" },
    { cidade: "Ribeirão Preto" },
    { cidade: "Sorocaba" }
  ],
  "RJ": [
    { cidade: "Rio de Janeiro" },
    { cidade: "Niterói" },
    { cidade: "Petrópolis" },
    { cidade: "Nova Friburgo" },
    { cidade: "Campos dos Goytacazes" }
  ]
};

export const mockDoctors = [
  {
    id: "mock-doctor-1",
    display_name: "Dr. João Silva"
  },
  {
    id: "mock-doctor-2", 
    display_name: "Dra. Maria Santos"
  },
  {
    id: "mock-doctor-3",
    display_name: "Dr. Pedro Oliveira"
  }
];

export const mockTimeSlots = [
  { time: "08:00", available: true },
  { time: "08:30", available: true },
  { time: "09:00", available: false },
  { time: "09:30", available: true },
  { time: "10:00", available: true },
  { time: "10:30", available: false },
  { time: "11:00", available: true },
  { time: "11:30", available: true },
  { time: "14:00", available: true },
  { time: "14:30", available: true },
  { time: "15:00", available: false },
  { time: "15:30", available: true },
  { time: "16:00", available: true },
  { time: "16:30", available: true },
  { time: "17:00", available: true },
  { time: "17:30", available: false }
];

export const mockLocaisComHorarios = [
  {
    id: "mock-local-1",
    nome_local: "Clínica Central",
    endereco: {
      logradouro: "Rua das Flores",
      numero: "123",
      bairro: "Centro",
      cidade: "São Paulo",
      uf: "SP"
    },
    horarios_disponiveis: mockTimeSlots
  },
  {
    id: "mock-local-2",
    nome_local: "Clínica Norte",
    endereco: {
      logradouro: "Av. Paulista",
      numero: "456",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP"
    },
    horarios_disponiveis: [
      { time: "08:00", available: true },
      { time: "08:30", available: true },
      { time: "09:00", available: true },
      { time: "09:30", available: true },
      { time: "10:00", available: true },
      { time: "10:30", available: true },
      { time: "11:00", available: true },
      { time: "11:30", available: true },
      { time: "14:00", available: true },
      { time: "14:30", available: true },
      { time: "15:00", available: true },
      { time: "15:30", available: true },
      { time: "16:00", available: true },
      { time: "16:30", available: true },
      { time: "17:00", available: true },
      { time: "17:30", available: true }
    ]
  }
];

// Função para gerar horários mock baseados na configuração padrão
export const generateMockTimeSlots = () => {
  const slots = [];
  
  // Manhã: 08:00 às 12:00
  for (let hour = 8; hour < 12; hour++) {
    slots.push({ time: `${hour.toString().padStart(2, '0')}:00`, available: true });
    slots.push({ time: `${hour.toString().padStart(2, '0')}:30`, available: true });
  }
  
  // Tarde: 13:00 às 18:00
  for (let hour = 13; hour < 18; hour++) {
    slots.push({ time: `${hour.toString().padStart(2, '0')}:00`, available: true });
    slots.push({ time: `${hour.toString().padStart(2, '0')}:30`, available: true });
  }
  
  return slots;
};