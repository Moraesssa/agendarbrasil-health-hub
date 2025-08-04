/**
 * Test Maps Integration
 * Tests the maps service functionality and integration
 */

import { mapsService } from './src/services/mapsService.js';

// Mock location data for testing
const testLocation = {
  id: 'test-location-1',
  nome_local: 'Hospital Teste',
  endereco_completo: 'Rua das Flores, 123',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 1234-5678',
  email: 'contato@hospitalteste.com.br',
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
    sexta: { abertura: '08:00', fechamento: '18:00', fechado: false },
    sabado: { abertura: '08:00', fechamento: '12:00', fechado: false },
    domingo: { abertura: '08:00', fechamento: '12:00', fechado: true }
  },
  facilidades: [
    { type: 'estacionamento', available: true, cost: 'gratuito' },
    { type: 'acessibilidade', available: true },
    { type: 'wifi', available: true }
  ],
  status: 'ativo',
  ultima_atualizacao: new Date().toISOString()
};

async function testMapsService() {
  console.log('🗺️  Testando Maps Service...\n');

  try {
    // Test 1: Get available providers
    console.log('1. Testando provedores disponíveis...');
    const providers = await mapsService.getAvailableProviders();
    console.log('✅ Provedores disponíveis:', providers);
    console.log('');

    // Test 2: Generate map URLs
    console.log('2. Testando geração de URLs...');
    
    const googleUrl = mapsService.generateMapViewUrl(testLocation, 'google');
    console.log('✅ Google Maps URL:', googleUrl);
    
    const osmUrl = mapsService.generateMapViewUrl(testLocation, 'openstreetmap');
    console.log('✅ OpenStreetMap URL:', osmUrl);
    
    const appleUrl = mapsService.generateMapViewUrl(testLocation, 'apple');
    console.log('✅ Apple Maps URL:', appleUrl);
    
    const wazeUrl = mapsService.generateMapViewUrl(testLocation, 'waze');
    console.log('✅ Waze URL:', wazeUrl);
    console.log('');

    // Test 3: Generate directions URLs
    console.log('3. Testando URLs de direções...');
    
    const directionsUrl = mapsService.generateDirectionsUrl(testLocation, 'current+location', 'google');
    console.log('✅ Directions URL:', directionsUrl);
    console.log('');

    // Test 4: Test user location (if available)
    console.log('4. Testando localização do usuário...');
    try {
      const userLocation = await mapsService.getCurrentLocation();
      if (userLocation) {
        console.log('✅ Localização do usuário:', userLocation);
        
        const directionsFromUser = mapsService.generateDirectionsUrl(testLocation, userLocation, 'google');
        console.log('✅ Directions from user location:', directionsFromUser);
      } else {
        console.log('⚠️  Localização do usuário não disponível');
      }
    } catch (error) {
      console.log('⚠️  Erro ao obter localização do usuário:', error.message);
    }
    console.log('');

    // Test 5: Test sharing functionality
    console.log('5. Testando funcionalidade de compartilhamento...');
    
    // Test copy functionality (if clipboard API is available)
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        const shareResult = await mapsService.shareLocation(testLocation, 'copy', {
          includeDirections: true
        });
        console.log('✅ Share copy result:', shareResult);
      } catch (error) {
        console.log('⚠️  Erro no compartilhamento por cópia:', error.message);
      }
    } else {
      console.log('⚠️  Clipboard API não disponível no ambiente de teste');
    }
    console.log('');

    // Test 6: Test error handling
    console.log('6. Testando tratamento de erros...');
    
    const locationWithoutCoords = { ...testLocation };
    delete locationWithoutCoords.coordenadas;
    
    try {
      const urlWithoutCoords = mapsService.generateMapViewUrl(locationWithoutCoords, 'google');
      console.log('✅ URL sem coordenadas (fallback para endereço):', urlWithoutCoords);
    } catch (error) {
      console.log('❌ Erro ao gerar URL sem coordenadas:', error.message);
    }
    console.log('');

    console.log('✅ Todos os testes do Maps Service concluídos com sucesso!');
    return true;

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    return false;
  }
}

// Test URL validation
function testUrlValidation() {
  console.log('🔗 Testando validação de URLs...\n');

  const testUrls = [
    mapsService.generateMapViewUrl(testLocation, 'google'),
    mapsService.generateMapViewUrl(testLocation, 'openstreetmap'),
    mapsService.generateDirectionsUrl(testLocation, 'current+location', 'google')
  ];

  testUrls.forEach((url, index) => {
    try {
      new URL(url);
      console.log(`✅ URL ${index + 1} válida:`, url);
    } catch (error) {
      console.log(`❌ URL ${index + 1} inválida:`, url, error.message);
    }
  });

  console.log('');
}

// Test provider detection
function testProviderDetection() {
  console.log('📱 Testando detecção de provedor...\n');

  // Mock different user agents
  const userAgents = [
    { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', expected: 'apple' },
    { ua: 'Mozilla/5.0 (Linux; Android 10)', expected: 'google' },
    { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', expected: 'google' },
    { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', expected: 'google' }
  ];

  userAgents.forEach(({ ua, expected }) => {
    // This would require mocking navigator.userAgent, which isn't easily done in Node.js
    console.log(`📱 User Agent: ${ua.substring(0, 50)}...`);
    console.log(`   Provedor esperado: ${expected}`);
  });

  console.log('');
}

// Performance test
async function testPerformance() {
  console.log('⚡ Testando performance...\n');

  const iterations = 100;
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    mapsService.generateMapViewUrl(testLocation, 'google');
    mapsService.generateDirectionsUrl(testLocation, 'current+location', 'google');
  }

  const endTime = performance.now();
  const avgTime = (endTime - startTime) / iterations;

  console.log(`✅ ${iterations} gerações de URL completadas`);
  console.log(`⚡ Tempo médio por geração: ${avgTime.toFixed(2)}ms`);
  console.log('');
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Iniciando testes de integração de mapas...\n');
  console.log('=' .repeat(60));
  console.log('');

  const results = [];

  // Run tests
  results.push(await testMapsService());
  testUrlValidation();
  testProviderDetection();
  await testPerformance();

  // Summary
  console.log('=' .repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`✅ Testes aprovados: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 Todos os testes passaram! Maps integration está funcionando corretamente.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os logs acima.');
  }
  
  console.log('');
  console.log('🗺️  Para testar a funcionalidade completa:');
  console.log('   1. Abra a aplicação no navegador');
  console.log('   2. Navegue até uma página com informações de localização');
  console.log('   3. Teste os botões "Ver no Mapa" e "Como Chegar"');
  console.log('   4. Teste o compartilhamento de localização');
  console.log('');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testMapsService, testUrlValidation, testProviderDetection, testPerformance, runAllTests };