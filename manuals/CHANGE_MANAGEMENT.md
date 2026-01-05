# Change Management - BookTrack

**Sistema de Gestão de Alterações e Registo de Mudanças**

Versão: 1.0  
Data: Janeiro 2026

---

## Índice

1. [Introdução](#introdução)
2. [Formulário de Pedido de Alteração](#formulário-de-pedido-de-alteração)
3. [Processo de Aprovação](#processo-de-aprovação)
4. [Change Logs (Registo de Mudanças)](#change-logs)
5. [Templates](#templates)
6. [Histórico de Alterações](#histórico-de-alterações)

---

## Introdução

### Objetivo

Este documento fornece os formulários e processos para gerir alterações no sistema BookTrack, garantindo rastreabilidade, governança e controlo de qualidade.

### Âmbito

Aplica-se a:
- Alterações de código (features, bug fixes)
- Alterações de configuração
- Alterações de infraestrutura
- Atualizações de dependências
- Mudanças de base de dados

### Princípios

1. **Rastreabilidade:** Todas as alterações devem ser documentadas
2. **Aprovação:** Alterações significativas requerem aprovação
3. **Testes:** Todas as alterações devem ser testadas
4. **Reversibilidade:** Deve existir plano de rollback
5. **Comunicação:** Stakeholders devem ser informados

---

## Formulário de Pedido de Alteração

### Change Request Form (CRF)

```markdown
# CHANGE REQUEST FORM

## Informações Gerais

**CR ID:** CR-YYYY-NNNN  
**Data de Submissão:** DD/MM/YYYY  
**Solicitante:** [Nome e Email]  
**Prioridade:** [ ] Crítica  [ ] Alta  [ ] Média  [ ] Baixa

## Descrição da Alteração

**Título:**
[Título breve e descritivo]

**Descrição Detalhada:**
[Descrição completa da alteração solicitada]

**Justificação/Razão:**
[Por que esta alteração é necessária?]

**Tipo de Alteração:**
[ ] Nova Funcionalidade
[ ] Correção de Bug
[ ] Melhoria de Performance
[ ] Atualização de Segurança
[ ] Alteração de Configuração
[ ] Alteração de Infraestrutura
[ ] Outro: _______________

## Impacto

**Componentes Afetados:**
[ ] Frontend
[ ] Backend API
[ ] Base de Dados
[ ] Infraestrutura
[ ] Configuração
[ ] Documentação

**Módulos Específicos:**
[Listar módulos/ficheiros específicos]

**Utilizadores Afetados:**
[ ] Todos
[ ] Alunos
[ ] Professores
[ ] Bibliotecários
[ ] Administradores

**Estimativa de Downtime:**
[ ] Nenhum
[ ] < 5 minutos
[ ] 5-30 minutos
[ ] > 30 minutos

## Detalhes Técnicos

**Requisitos:**
- [Requisito 1]
- [Requisito 2]

**Dependências:**
- [Dependência 1]
- [Dependência 2]

**Arquivos/Tabelas Afetados:**
- [Arquivo/Tabela 1]
- [Arquivo/Tabela 2]

**Alterações na Base de Dados:**
[ ] Sim  [ ] Não

Se sim, descrever:
[Descrição das alterações de BD - migrations, novos campos, etc.]

## Planeamento

**Janela de Implementação Proposta:**
Data: ___/___/______
Horário: ___:___ - ___:___

**Ambiente:**
[ ] Desenvolvimento
[ ] Staging
[ ] Produção

**Tempo Estimado de Implementação:**
[X] horas/dias

**Recursos Necessários:**
- [Recurso 1]
- [Recurso 2]

## Testes

**Plano de Testes:**
[Descrever como a alteração será testada]

**Critérios de Aceitação:**
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

**Ambientes de Teste:**
[ ] Desenvolvimento
[ ] Staging
[ ] Produção (smoke test)

## Riscos e Rollback

**Riscos Identificados:**
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| [Risco 1] | Alta/Média/Baixa | Alto/Médio/Baixo | [Como mitigar] |

**Plano de Rollback:**
[Descrever como reverter a alteração se necessário]

**Backup Necessário:**
[ ] Sim  [ ] Não

Se sim, o quê:
[Base de dados, ficheiros de configuração, código, etc.]

## Comunicação

**Notificar Utilizadores:**
[ ] Sim  [ ] Não

**Mensagem de Notificação:**
[Texto da mensagem para utilizadores, se aplicável]

**Stakeholders a Informar:**
- [ ] Equipa de Desenvolvimento
- [ ] Equipa de Operações
- [ ] Bibliotecários
- [ ] Direção da Escola
- [ ] Utilizadores Finais

## Aprovações

**Solicitante:**
Nome: ___________________
Assinatura: ___________________
Data: ___/___/______

**Aprovador Técnico (Dev Lead):**
Nome: ___________________
Decisão: [ ] Aprovado  [ ] Rejeitado  [ ] Mais informação necessária
Comentários:
Assinatura: ___________________
Data: ___/___/______

**Aprovador de Negócio (Product Owner):**
Nome: ___________________
Decisão: [ ] Aprovado  [ ] Rejeitado  [ ] Mais informação necessária
Comentários:
Assinatura: ___________________
Data: ___/___/______

**Aprovador de Operações (DevOps Lead):**
Nome: ___________________
Decisão: [ ] Aprovado  [ ] Rejeitado  [ ] Mais informação necessária
Comentários:
Assinatura: ___________________
Data: ___/___/______

## Pós-Implementação

**Data de Implementação Efetiva:**
___/___/______  Horário: ___:___

**Resultado:**
[ ] Sucesso
[ ] Sucesso com problemas
[ ] Falha - Rollback realizado

**Problemas Encontrados:**
[Descrever quaisquer problemas]

**Lições Aprendidas:**
[O que correu bem, o que poderia melhorar]

**Verificação Pós-Implementação:**
- [ ] Testes de aceitação passaram
- [ ] Sem erros críticos nos logs
- [ ] Performance dentro dos parâmetros
- [ ] Documentação atualizada
- [ ] Utilizadores notificados (se aplicável)

**Encerramento:**
Nome: ___________________
Data: ___/___/______
```

---

## Processo de Aprovação

### Fluxo de Aprovação

```
┌─────────────────┐
│   Solicitação   │
│   (Requester)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Análise Técnica│
│   (Dev Lead)    │
└────────┬────────┘
         │
         ▼
    Aprovado?
         │
    ┌────┴────┐
    │         │
   Sim       Não
    │         │
    │    └────────► Rejeitado/
    │              Mais Info
    ▼
┌─────────────────┐
│ Análise Negócio │
│ (Product Owner) │
└────────┬────────┘
         │
         ▼
    Aprovado?
         │
    ┌────┴────┐
    │         │
   Sim       Não
    │         │
    │    └────────► Rejeitado
    ▼
┌─────────────────┐
│Análise Operações│
│  (DevOps Lead)  │
└────────┬────────┘
         │
         ▼
    Aprovado?
         │
    ┌────┴────┐
    │         │
   Sim       Não
    │         │
    │    └────────► Rejeitado
    ▼
┌─────────────────┐
│  Agendamento    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Implementação   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verificação    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Encerramento  │
└─────────────────┘
```

### Critérios de Aprovação

**Aprovação Técnica:**
- Alteração é tecnicamente viável
- Riscos técnicos identificados e mitigados
- Testes adequados definidos
- Plano de rollback existe

**Aprovação de Negócio:**
- Alinhado com objetivos do projeto
- Benefício justifica o esforço
- Timing apropriado
- Budget disponível (se aplicável)

**Aprovação de Operações:**
- Infraestrutura suporta a alteração
- Recursos disponíveis
- Janela de manutenção apropriada
- Monitorização adequada

### SLA de Aprovação

| Prioridade | Análise Técnica | Análise Negócio | Análise Ops | Total |
|------------|-----------------|-----------------|-------------|-------|
| Crítica | 2h | 4h | 2h | 8h |
| Alta | 1 dia | 2 dias | 1 dia | 4 dias |
| Média | 3 dias | 5 dias | 3 dias | 11 dias |
| Baixa | 1 semana | 2 semanas | 1 semana | 1 mês |

---

## Change Logs

### Estrutura do Change Log

Cada alteração implementada é registada no Change Log seguindo o formato:

```markdown
## [Versão] - YYYY-MM-DD

### Adicionado
- Nova funcionalidade X
- Novo endpoint Y

### Modificado
- Melhoria na performance de Z
- Atualização de dependência A para versão B

### Corrigido
- Bug no módulo X que causava Y
- Correção de validação em Z

### Removido
- Funcionalidade deprecated X
- Endpoint obsoleto Y

### Segurança
- Patch de segurança CVE-XXXX-XXXXX
- Atualização de biblioteca vulnerável
```

### Formato Detalhado

```markdown
### [CR-2026-001] Título da Alteração

**Tipo:** Feature / Bug Fix / Enhancement / Security  
**Componentes:** Frontend, Backend API  
**Impacto:** Baixo / Médio / Alto  
**Downtime:** Nenhum / 5 min  

**Descrição:**
[Descrição detalhada da alteração]

**Arquivos Alterados:**
- `src/components/Livros.jsx`
- `backend/routes/livros.js`
- `database/migrations/20260104_add_isbn.sql`

**Como Testar:**
1. [Passo 1]
2. [Passo 2]

**Rollback:**
[Instruções de rollback se necessário]

**Implementado por:** [Nome]  
**Aprovado por:** [Nome]  
**Data:** 04/01/2026
```

---

## Templates

### Template 1: Bug Fix Request

```markdown
# BUG FIX REQUEST

**Bug ID:** BUG-2026-NNNN  
**CR ID:** CR-2026-NNNN  
**Reportado por:** [Nome]  
**Data:** DD/MM/YYYY

## Descrição do Bug

**Título:** [Título do bug]

**Passos para Reproduzir:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Comportamento Esperado:**
[O que deveria acontecer]

**Comportamento Observado:**
[O que realmente acontece]

**Severidade:**
[ ] Crítica (sistema down)
[ ] Alta (funcionalidade importante não funciona)
[ ] Média (funcionalidade funciona mas com problemas)
[ ] Baixa (problema cosmético ou edge case)

**Ambiente:**
- Navegador: [Chrome/Firefox/Safari]
- Versão: [X.X.X]
- SO: [Windows/Mac/Linux]

**Screenshots/Logs:**
[Anexar screenshots ou logs relevantes]

## Análise Técnica

**Causa Raiz:**
[Descrição da causa]

**Solução Proposta:**
[Como corrigir]

**Arquivos a Alterar:**
- [Arquivo 1]
- [Arquivo 2]

**Testes:**
- [ ] Unit tests atualizados
- [ ] Teste manual realizado
- [ ] Não regride outras funcionalidades
```

### Template 2: Feature Request

```markdown
# FEATURE REQUEST

**FR ID:** FR-2026-NNNN  
**CR ID:** CR-2026-NNNN  
**Solicitado por:** [Nome/Departamento]  
**Data:** DD/MM/YYYY

## Descrição da Funcionalidade

**Título:** [Nome da feature]

**User Story:**
Como [tipo de utilizador]
Quero [fazer algo]
Para que [benefício]

**Descrição Detalhada:**
[Descrição completa da funcionalidade solicitada]

**Prioridade de Negócio:**
[ ] Must Have
[ ] Should Have
[ ] Nice to Have

**Benefícios:**
- [Benefício 1]
- [Benefício 2]

## Requisitos

**Requisitos Funcionais:**
1. [RF-1]
2. [RF-2]

**Requisitos Não-Funcionais:**
1. [RNF-1]
2. [RNF-2]

**Mockups/Wireframes:**
[Anexar ou descrever UI esperada]

## Análise de Impacto

**Complexidade Estimada:**
[ ] Baixa (1-2 dias)
[ ] Média (3-5 dias)
[ ] Alta (>1 semana)

**Dependências:**
- [Dependência 1]

**Riscos:**
- [Risco 1]
```

### Template 3: Emergency Change

```markdown
# EMERGENCY CHANGE REQUEST

**ECR ID:** ECR-2026-NNNN  
**Data/Hora:** DD/MM/YYYY HH:MM  
**Solicitante:** [Nome]

## Emergência

**Severidade:** P1 - Crítica

**Descrição do Problema:**
[Descrição do incidente que requer mudança urgente]

**Impacto Atual:**
[Quantos utilizadores afetados, que funcionalidade down, etc.]

**Alteração Proposta:**
[Descrição da alteração necessária para resolver]

**Tempo Estimado:**
[Minutos/Horas]

## Aprovação Verbal

**Aprovado por (telefone):**
- Dev Lead: [Nome] às [HH:MM]
- On-Call Manager: [Nome] às [HH:MM]

**Implementador:**
[Nome da pessoa que irá implementar]

## Pós-Implementação

**Resultado:**
[Sucesso/Falha]

**Próximos Passos:**
- [ ] Criar CR formal (post-mortem)
- [ ] Documentar no Change Log
- [ ] Atualizar runbooks
- [ ] Comunicar stakeholders
```

---

## Histórico de Alterações

### CHANGELOG.md - BookTrack v1.0

```markdown
# Change Log - BookTrack

Todas as alterações notáveis neste projeto serão documentadas neste ficheiro.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt/1.0.0/),
e este projeto adere a [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-01-04

### 🎉 Lançamento Inicial

Primeira versão de produção do sistema BookTrack.

### Adicionado

#### Gestão de Catálogo
- Sistema completo de gestão de livros
- Pesquisa avançada com filtros (título, autor, ISBN, categoria)
- Upload de capas de livros
- Categorização de livros
- Gestão de múltiplos exemplares
- **CR-2025-001:** Adicionar campo ISBN aos livros
- **CR-2025-012:** Implementar upload de imagens de capa

#### Gestão de Utilizadores
- Sistema de autenticação JWT
- 3 tipos de perfil (Aluno, Professor, Bibliotecário)
- Gestão de contas de utilizador
- Perfis personalizáveis
- Sistema de permissões baseado em roles
- **CR-2025-003:** Implementar RBAC (Role-Based Access Control)

#### Empréstimos
- Processamento de empréstimos
- Cálculo automático de prazos
  - Alunos: 15 dias
  - Professores: 30 dias
- Registo de devoluções
- Cálculo automático de multas (€0,10/dia)
- Histórico completo de empréstimos
- **CR-2025-015:** Implementar sistema de multas automático

#### Reservas
- Sistema de reservas online
- Fila de espera automática
- Notificações de disponibilidade (in-app)
- Prazo de levantamento: 48 horas
- Conversão automática reserva → empréstimo
- **CR-2025-018:** Sistema de conversão automática de reservas

#### Dashboard e Relatórios
- Dashboard com estatísticas em tempo real
- Métricas de empréstimos
- Livros mais populares
- Relatórios por período
- **CR-2025-022:** Dashboard administrativo com métricas

#### Interface
- Design responsivo (mobile-first)
- Interface moderna com Tailwind CSS
- Feedback visual em todas as ações
- Loading states
- Validações de formulários
- **CR-2025-008:** Implementar design system com Tailwind

### Modificado

- **CR-2025-024:** Otimização de queries de base de dados (+40% performance)
- **CR-2025-026:** Melhorias de UX no formulário de empréstimos
- **CR-2025-029:** Atualização React 18 → React 19

### Corrigido

- **CR-2025-030:** [BUG] Erro ao processar empréstimo com livro já emprestado
  - **Arquivos:** `backend/controllers/emprestimosController.js`
  - **Causa:** Falta de validação de disponibilidade
  - **Solução:** Adicionar verificação antes de criar empréstimo
  
- **CR-2025-031:** [BUG] Reserva não cancela quando livro é devolvido
  - **Arquivos:** `backend/controllers/reservasController.js`
  - **Causa:** Lógica de conversão não acionada
  - **Solução:** Trigger automático ao registar devolução

- **CR-2025-032:** [BUG] Token JWT expira sem refresh
  - **Arquivos:** `frontend/src/services/api.js`
  - **Causa:** Sem interceptor de refresh
  - **Solução:** Implementar auto-refresh de token

### Segurança

- **CR-2025-035:** Implementar bcrypt para hashing de passwords (10 rounds)
- **CR-2025-036:** Configurar CORS adequadamente
- **CR-2025-037:** Adicionar validação de inputs com express-validator
- **CR-2025-038:** Implementar rate limiting nas rotas de autenticação

### Dependências

**Frontend:**
- react: 19.0.0
- react-dom: 19.0.0
- react-router-dom: 7.1.1
- axios: 1.7.9
- tailwindcss: 4.0.0

**Backend:**
- express: 4.21.2
- mysql2: 3.11.5
- jsonwebtoken: 9.0.2
- bcryptjs: 2.4.3
- express-validator: 7.2.1

### Infraestrutura

- **CR-2025-040:** Configuração Nginx como proxy reverso
- **CR-2025-041:** Setup PM2 para gestão de processos
- **CR-2025-042:** Configuração de backups automáticos diários
- **CR-2025-043:** Implementar HTTPS com Let's Encrypt

### Documentação

- Manual do Utilizador completo
- Guia de Instalação
- Guia de Deployment
- Manual de Operações
- Documentação da API
- Release Notes

---

## [Unreleased] - Próximas Versões

### Planeado para v1.1.0

- **FR-2026-001:** Sistema completo de notificações por email
- **FR-2026-002:** Importação em massa de livros (CSV/Excel)
- **FR-2026-003:** Geração de códigos de barras
- **FR-2026-004:** Relatórios avançados com gráficos
- **FR-2026-005:** Sistema de recomendações

### Em Análise

- **FR-2026-010:** App móvel nativa
- **FR-2026-011:** Sistema de reviews e avaliações
- **FR-2026-012:** Integração com Google Books API
- **FR-2026-013:** Suporte multi-idioma

---

## Notas de Versão

### Versionamento Semântico

- **MAJOR.MINOR.PATCH** (X.Y.Z)
- **MAJOR:** Mudanças incompatíveis na API
- **MINOR:** Novas funcionalidades (backwards-compatible)
- **PATCH:** Bug fixes (backwards-compatible)

### Tipos de Alteração

- **Adicionado:** Novas funcionalidades
- **Modificado:** Alterações em funcionalidades existentes
- **Deprecated:** Funcionalidades que serão removidas
- **Removido:** Funcionalidades removidas
- **Corrigido:** Correções de bugs
- **Segurança:** Patches de segurança
```

### Change Log Detalhado (Exemplo de Entrada)

```markdown
## [1.0.0] - 2026-01-04

### CR-2025-030: Corrigir validação de disponibilidade em empréstimos

**Tipo:** Bug Fix  
**Severidade:** Alta  
**Componentes:** Backend API  
**Impacto:** Médio (funcionalidade principal afetada)  

**Descrição:**
Corrigido bug que permitia criar empréstimos mesmo quando o livro não estava disponível. Isso ocorria porque a verificação de disponibilidade não considerava exemplares já emprestados.

**Causa Raiz:**
A query SQL verificava apenas se `livro_id` existia, mas não validava `exemplares_disponiveis > 0`.

**Solução Implementada:**
```sql
-- Antes
SELECT * FROM livros WHERE id = ?

-- Depois
SELECT * FROM livros 
WHERE id = ? 
AND exemplares_disponiveis > 0
```

**Arquivos Alterados:**
- `backend/controllers/emprestimosController.js` (linha 45-52)
- `backend/tests/emprestimos.test.js` (adicionado teste de regressão)

**Testes:**
- [x] Teste unitário criado
- [x] Teste de integração atualizado
- [x] Teste manual em staging
- [x] Não regride outras funcionalidades

**Implementado por:** Carlos Ribeiro  
**Aprovado por:** Tiago Poiares (Dev Lead)  
**Data de Deploy:** 03/01/2026 02:30  
**Downtime:** Nenhum  

**Verificação Pós-Deploy:**
- [x] Smoke tests passaram
- [x] Logs sem erros
- [x] Performance normal (63ms média)
```

---

## Gestão de Change Logs

### Localização

```
/var/www/booktrack/
├── CHANGELOG.md (público - resumido)
└── docs/
    └── changes/
        ├── 2026/
        │   ├── 01-January/
        │   │   ├── CR-2026-001.md
        │   │   ├── CR-2026-002.md
        │   │   └── MONTHLY_SUMMARY.md
        │   └── 02-February/
        └── templates/
            ├── CR_TEMPLATE.md
            ├── BUG_TEMPLATE.md
            └── FEATURE_TEMPLATE.md
```

### Processo de Atualização

1. **Durante Desenvolvimento:**
   - Criar CR no sistema (ficheiro .md ou issue tracker)
   - Documentar alterações em draft

2. **Antes do Deploy:**
   - Atualizar CHANGELOG.md com entrada
   - Adicionar em secção `[Unreleased]`

3. **Após Deploy:**
   - Mover de `[Unreleased]` para `[X.Y.Z] - YYYY-MM-DD`
   - Marcar CR como "Deployed"
   - Arquivar CR em `/docs/changes/YYYY/MM/`

4. **Final do Mês:**
   - Criar MONTHLY_SUMMARY.md
   - Estatísticas de mudanças
   - Principais alterações
   - Métricas de qualidade

---

## Métricas e KPIs

### Métricas de Change Management

Mensalmente, devem ser calculadas:

1. **Volume de Alterações:**
   - Total de CRs submetidos
   - Total de CRs aprovados
   - Total de CRs rejeitados
   - Taxa de aprovação (%)

2. **Tempo de Processamento:**
   - Tempo médio de aprovação
   - Tempo médio de implementação
   - Tempo total (submissão → deploy)

3. **Qualidade:**
   - % de alterações com rollback
   - % de bugs introduzidos
   - Taxa de sucesso no primeiro deploy

4. **Por Tipo:**
   - Features: X
   - Bug fixes: Y
   - Security: Z
   - Infrastructure: W

### Template de Relatório Mensal

```markdown
# Change Management Report - [Mês/Ano]

## Sumário Executivo
- Total de CRs: [X]
- Taxa de Aprovação: [Y]%
- Tempo Médio de Deploy: [Z] dias

## Breakdown por Tipo
- Features: X (Y%)
- Bug Fixes: X (Y%)
- Security: X (Y%)
- Infrastructure: X (Y%)

## Top 5 Alterações Mais Impactantes
1. [CR-XXXX] - [Descrição]
2. ...

## Problemas e Rollbacks
- Total de Rollbacks: X
- Causas principais: [Lista]

## Lições Aprendidas
- [Lição 1]
- [Lição 2]

## Ações para Próximo Mês
- [Ação 1]
- [Ação 2]
```

---

**Fim do Documento de Change Management**

**Preparado por:** Equipa BookTrack  
**Última Atualização:** Janeiro 2026  
**Versão:** 1.0
