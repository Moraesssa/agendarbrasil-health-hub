# Development Scripts

⚠️ **AVISO: Estes arquivos são apenas para desenvolvimento e debug**

Esta pasta contém scripts de desenvolvimento, debug e teste que **NÃO devem ser usados em produção**.

## Conteúdo

### Scripts de Debug (`debug-*.js`)
- Scripts para testar conectividade com Supabase
- Validação de funções RPC
- Diagnóstico de problemas de banco de dados
- **USO:** Apenas em ambiente de desenvolvimento

### Scripts de Teste (`test-*.js/.html/.sql`)
- Testes manuais de funcionalidades
- Validação de integrações
- Testes de UX e acessibilidade
- **USO:** Para validação durante desenvolvimento

### Scripts de Validação (`testar-*.js`)
- Testes específicos de cidades e estados
- Validação de dados
- **USO:** Para verificar dados de desenvolvimento

## ⚠️ Segurança

- **Nunca** execute estes scripts em produção
- **Nunca** inclua esta pasta em builds de produção
- Scripts podem conter dados sensíveis para debug
- Use apenas em ambiente de desenvolvimento local

## Uso

```bash
# Executar da raiz do projeto
node development-scripts/debug-supabase.js
node development-scripts/test-connections.js
```

---
**Última atualização:** Agosto 2025
**Status:** Organização para produção