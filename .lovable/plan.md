

## Revisão Completa de Rotas e Páginas 404

### Problemas Encontrados

1. **Rota inexistente → 404 real**: `/telemedicina` é referenciada em `PerfilMedico.tsx` (link "Teleconsulta") mas não existe no router nem como arquivo de página.

2. **4 arquivos legacy mortos** (não têm rota, mas ocupam espaço e confundem):
   - `AgendaMedicoIntegrada.tsx` → retorna `null`
   - `AgendaPaciente.tsx` → "Página em manutenção"
   - `DashboardMedico.tsx` → "Página em manutenção"
   - `GerenciarLocais.tsx` → "Página em manutenção"

3. **2 páginas "em desenvolvimento"** (roteadas mas sem conteúdo funcional):
   - `DashboardMedicoV2.tsx` → placeholder
   - `GerenciarLocaisV2.tsx` → placeholder

4. **NotFound.tsx** está em inglês e sem design consistente com o app.

---

### Plano de Implementação

#### 1. Redesenhar `NotFound.tsx`
Reescrever com design profissional usando shadcn/ui, em português, com:
- Ilustração/ícone grande
- Mensagem amigável em PT-BR
- Botão "Voltar ao Início" estilizado
- Link contextual baseado no tipo de usuário (se logado)
- Consistente com o design system da plataforma

#### 2. Criar página `/telemedicina` (Coming Soon)
Criar `src/pages/Telemedicina.tsx` com uma página "Em Breve" profissional:
- Header com ícone de vídeo
- Descrição das funcionalidades futuras (videochamada, sala de espera virtual, compartilhamento de tela)
- Botão para voltar ao perfil
- Registrar a rota em `App.tsx`

#### 3. Melhorar páginas placeholder existentes
Atualizar `DashboardMedicoV2.tsx` e `GerenciarLocaisV2.tsx` para exibir "Em Breve" com design profissional em vez de texto genérico, incluindo:
- Descrição do que a funcionalidade fará
- Botão de navegação de volta

#### 4. Deletar 4 arquivos legacy
Remover os stubs que não têm rota e não servem propósito:
- `AgendaMedicoIntegrada.tsx`
- `AgendaPaciente.tsx`
- `DashboardMedico.tsx`
- `GerenciarLocais.tsx`

#### 5. Criar componente reutilizável `ComingSoonPage`
Para padronizar páginas "em breve", criar `src/components/ComingSoonPage.tsx` que aceita props: `title`, `description`, `icon`, `backPath`, `features[]`. Usar em Telemedicina, DashboardMedicoV2 e GerenciarLocaisV2.

---

### Resumo de Alterações

| Arquivo | Ação |
|---------|------|
| `src/pages/NotFound.tsx` | Redesenhar (PT-BR, shadcn/ui) |
| `src/components/ComingSoonPage.tsx` | Criar componente reutilizável |
| `src/pages/Telemedicina.tsx` | Criar (Coming Soon) |
| `src/App.tsx` | Adicionar rota `/telemedicina` |
| `src/pages/DashboardMedicoV2.tsx` | Atualizar com ComingSoonPage |
| `src/pages/GerenciarLocaisV2.tsx` | Atualizar com ComingSoonPage |
| `src/pages/AgendaMedicoIntegrada.tsx` | Deletar |
| `src/pages/AgendaPaciente.tsx` | Deletar |
| `src/pages/DashboardMedico.tsx` | Deletar |
| `src/pages/GerenciarLocais.tsx` | Deletar |

