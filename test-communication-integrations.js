/**
 * Test script for communication integrations
 * Tests phone calls, WhatsApp, email, SMS, and system sharing
 */

import { CommunicationService } from './src/services/communicationService.js';

// Mock location data for testing
const mockLocation = {
  id: 'loc-001',
  nome_local: 'Clínica São Paulo',
  endereco_completo: 'Rua das Flores, 123',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '11987654321',
  whatsapp: '11987654321',
  email: 'contato@clinicasp.com.br',
  website: 'https://clinicasp.com.br',
  coordenadas: {
    lat: -23.5505,
    lng: -46.6333,
    precisao: 'exata'
  },
  horario_funcionamento: {
    segunda: { abertura: '08:00', fechamento: '18:00', fechado: false },
    terca: { abertura: '08:00', fechamento: '18:00', fechado: false },
    quarta: { abertura: '08:00', fechamento: '18:00', fechado: false },
    quinta: { abertura: '08:00', fechamento: '18:00', fechado: false },
    sexta: { abertura: '08:00', fechamento: '17:00', fechado: false },
    sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
    domingo: { abertura: '00:00', fechamento: '00:00', fechado: true }
  },
  facilidades: [
    { type: 'estacionamento', available: true, cost: 'gratuito' },
    { type: 'acessibilidade', available: true },
    { type: 'wifi', available: true },
    { type: 'ar_condicionado', available: true }
  ],
  status: 'ativo',
  ultima_atualizacao: new Date().toISOString(),
  verificado_em: new Date().toISOString(),
  fonte_dados: 'manual',
  instrucoes_acesso: 'Entrada principal pela Rua das Flores. Estacionamento nos fundos.',
  observacoes_especiais: 'Favor chegar 15 minutos antes da consulta.'
};

const mockShareData = {
  location: mockLocation,
  appointmentDate: '15/01/2025',
  appointmentTime: '14:30',
  doctorName: 'João Silva',
  specialty: 'Cardiologia',
  patientName: 'Maria Santos',
  additionalNotes: 'Trazer exames anteriores'
};

async function testCommunicationIntegrations() {
  console.log('🧪 Testando Integrações de Comunicação\n');
  console.log('=' .repeat(50));

  // Test 1: Phone Call
  console.log('\n📞 Teste 1: Chamada Telefônica');
  console.log('-'.repeat(30));
  
  try {
    const phoneResult = await CommunicationService.makePhoneCall(mockLocation.telefone);
    console.log('✅ Resultado:', phoneResult);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Test 2: WhatsApp Chat
  console.log('\n💬 Teste 2: Chat WhatsApp');
  console.log('-'.repeat(30));
  
  try {
    const whatsappChatResult = await CommunicationService.openWhatsAppChat(
      mockLocation.whatsapp, 
      'Olá! Gostaria de confirmar minha consulta.'
    );
    console.log('✅ Resultado:', whatsappChatResult);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Test 3: WhatsApp Sharing
  console.log('\n📱 Teste 3: Compartilhamento WhatsApp');
  console.log('-'.repeat(30));
  
  try {
    const whatsappShareResult = await CommunicationService.shareViaWhatsApp(mockShareData, {
      format: 'detailed',
      includeDirections: true,
      includeOperatingHours: true,
      includeFacilities: true
    });
    console.log('✅ Resultado:', whatsappShareResult);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Test 4: Email Sharing
  console.log('\n📧 Teste 4: Compartilhamento Email');
  console.log('-'.repeat(30));
  
  try {
    const emailResult = await CommunicationService.shareViaEmail(mockShareData, {
      includeDirections: true,
      includeOperatingHours: true,
      includeFacilities: true
    });
    console.log('✅ Resultado:', emailResult);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Test 5: SMS Sharing
  console.log('\n📱 Teste 5: Compartilhamento SMS');
  console.log('-'.repeat(30));
  
  try {
    const smsResult = await CommunicationService.shareViaSMS(mockShareData, {
      format: 'simple',
      includeDirections: false
    });
    console.log('✅ Resultado:', smsResult);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Test 6: System Sharing
  console.log('\n🔗 Teste 6: Compartilhamento do Sistema');
  console.log('-'.repeat(30));
  
  try {
    const systemResult = await CommunicationService.shareViaSystem(mockShareData, {
      includeDirections: true
    });
    console.log('✅ Resultado:', systemResult);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Test 7: Custom Messages
  console.log('\n✉️ Teste 7: Mensagens Personalizadas');
  console.log('-'.repeat(30));
  
  const contexts = ['reminder', 'invitation', 'directions', 'emergency'];
  
  for (const context of contexts) {
    try {
      const customMessage = CommunicationService.createCustomMessage(mockShareData, context);
      console.log(`✅ Mensagem ${context}:`);
      console.log(customMessage.substring(0, 100) + '...\n');
    } catch (error) {
      console.log(`❌ Erro ao criar mensagem ${context}:`, error.message);
    }
  }

  // Test 8: Utility Functions
  console.log('\n🔧 Teste 8: Funções Utilitárias');
  console.log('-'.repeat(30));
  
  console.log('📞 Formatação de telefone:', CommunicationService.formatPhoneNumber('11987654321'));
  console.log('📱 Suporte a chamadas:', CommunicationService.canMakePhoneCalls());
  console.log('💬 Suporte a SMS:', CommunicationService.canSendSMS());
  console.log('🔗 Suporte a compartilhamento nativo:', CommunicationService.supportsNativeSharing());
  console.log('📋 Suporte a clipboard:', CommunicationService.supportsClipboard());
  console.log('🌐 Suporte a compartilhamento de URL:', CommunicationService.supportsUrlSharing());

  // Test 9: Operating Hours Formatting
  console.log('\n🕒 Teste 9: Formatação de Horários');
  console.log('-'.repeat(30));
  
  const formattedHours = CommunicationService.formatOperatingHours(mockLocation.horario_funcionamento);
  console.log('✅ Horários formatados:');
  console.log(formattedHours);

  const formattedHoursText = CommunicationService.formatOperatingHoursText(mockLocation.horario_funcionamento);
  console.log('✅ Horários formatados (texto):');
  console.log(formattedHoursText);

  // Test 10: Facility Information
  console.log('\n✨ Teste 10: Informações de Facilidades');
  console.log('-'.repeat(30));
  
  mockLocation.facilidades.forEach(facility => {
    const icon = CommunicationService.getFacilityIcon(facility.type);
    const name = CommunicationService.getFacilityName(facility.type);
    console.log(`${icon} ${name} - ${facility.available ? 'Disponível' : 'Indisponível'}`);
  });

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Testes de Comunicação Concluídos!');
  console.log('='.repeat(50));
}

// Execute tests if running directly
if (typeof window === 'undefined') {
  testCommunicationIntegrations().catch(console.error);
}

export { testCommunicationIntegrations, mockLocation, mockShareData };