# Configuração de Build e Otimizações

## Visão Geral

Este documento detalha a configuração de build do AgendarBrasil Health Hub, incluindo otimizações de performance, estratégias de bundling e ferramentas de desenvolvimento.

## Configuração do Vite

### Servidor de Desenvolvimento

```typescript
server: {
  host: "::",        // Suporte IPv4 e IPv6
  port: 8080,        // Porta fixa para evitar conflitos
}
```

### Plugins Utilizados

1. **React SWC Plugin**: Compilação rápida com SWC
2. **Lovable Tagger**: Ferramenta de desenvolvimento (apenas em dev)
3. **Bundle Visualizer**: Análise de bundle (apenas em produção)

## Estratégia de Bundling

### Chunking Manual Inteligente

- **Main Chunk**: React + código da aplicação
- **Supabase Vendor**: Cliente Supabase separado
- **UI Vendor**: Lucide React + Radix UI
- **Generic Vendor**: Outras dependências

### Otimizações de Build

- **Target**: ES2015 para compatibilidade ampla
- **Minificação**: Terser em produção
- **Sourcemaps**: Apenas em desenvolvimento
- **Pré-bundling**: Dependências críticas otimizadas

## Path Aliases

```typescript
"@/*": "./src/*"
```

## Análise de Performance

O projeto gera automaticamente `dist/stats.html` com análise detalhada do bundle incluindo tamanhos Gzip e Brotli.