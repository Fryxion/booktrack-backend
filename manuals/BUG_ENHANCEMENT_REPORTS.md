# Bug & Enhancement Reports - BookTrack

**Relatório de Problemas e Melhorias Pós-Lançamento**

Versão: 1.0.0  
Período: Janeiro 2026  
Data do Relatório: 04 de Janeiro de 2026

---

## Índice

1. [Bugs Identificados](#bugs-identificados)
2. [Bugs Corrigidos](#bugs-corrigidos)
3. [Melhorias Sugeridas](#melhorias-sugeridas)
4. [Melhorias Implementadas](#melhorias-implementadas)
5. [Status e Priorização](#status-e-priorização)
6. [Métricas de Qualidade](#métricas-de-qualidade)
7. [Templates](#templates)

---

### Resumo Geral

| Métrica | Valor |
|---------|-------|
| **Total de Bugs Reportados** | 0 |
| **Bugs Críticos (P1)** | 0 |
| **Bugs Altos (P2)** | 0 |
| **Bugs Médios (P3)** | 0 |
| **Bugs Baixos (P4)** | 0 |
| **Bugs Corrigidos** | 0 |
| **Taxa de Resolução** | N/A |
| **Melhorias Sugeridas** | 5 |
| **Melhorias Implementadas** | 0 |

### Highlights

✅ **Pontos Positivos:**
- Lançamento sem bugs críticos
- Sistema estável nas primeiras 24h
- Todas as funcionalidades principais operacionais
- Feedback inicial dos utilizadores positivo

⚠️ **Áreas de Atenção:**
- Sistema de notificações por email pendente (conhecido)
- Monitorizar performance nas primeiras semanas
- Aguardar feedback de utilizadores para identificar edge cases
- Imagens de cada livro do catálogo (conhecido)

🔜 **Próximos Passos:**
- Continuar monitorização
- Implementar melhorias sugeridas

---

## Bugs Identificados

### Bugs Ativos (Em Investigação/Correção)

*Atualmente não há bugs ativos reportados.*

### Template de Registo de Bug

Quando bugs forem identificados, usar o seguinte formato:

```markdown
### BUG-2026-001: [Título do Bug]

**Status:** 🔴 Aberto / 🟡 Em Progresso / 🟢 Corrigido / ⚫ Fechado  
**Prioridade:** P1 (Crítico) / P2 (Alto) / P3 (Médio) / P4 (Baixo)  
**Severidade:** Bloqueante / Crítica / Moderada / Menor / Trivial  
**Componente:** Frontend / Backend / Database / Infraestrutura  
**Versão Afetada:** 1.0.0  
**Reportado por:** [Nome]  
**Data:** DD/MM/YYYY  

**Descrição:**
[Descrição clara e concisa do problema]

**Passos para Reproduzir:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Comportamento Esperado:**
[O que deveria acontecer]

**Comportamento Observado:**
[O que realmente acontece]

**Ambiente:**
- SO: [Windows/Mac/Linux]
- Navegador: [Chrome/Firefox/Safari] Versão: [X.X]
- Dispositivo: [Desktop/Mobile/Tablet]

**Screenshots/Logs:**
[Anexar evidências]

**Impacto:**
- Utilizadores Afetados: [Todos/Específicos]
- Funcionalidade Afetada: [Qual]
- Workaround Disponível: [Sim/Não] - [Descrever se sim]

**Análise Técnica:**
- Causa Raiz: [Descrição após investigação]
- Arquivos Afetados: [Lista de arquivos]
- Solução Proposta: [Como corrigir]

**Atribuído a:** [Nome do desenvolvedor]  
**Data Estimada de Correção:** DD/MM/YYYY  
**CR Relacionado:** CR-2026-XXX  
```

---

## Bugs Corrigidos

### Bugs Corrigidos Durante o Desenvolvimento (Pré-Lançamento)

Estes bugs foram identificados e corrigidos durante os Sprints A, B e C, antes do lançamento da v1.0.0:

#### BUG-2025-001: Erro ao processar empréstimo com livro indisponível

**Status:** 🟢 Corrigido  
**Prioridade:** P2 (Alto)  
**Severidade:** Crítica  
**Componente:** Backend API  
**Versão Afetada:** 0.9.0 (pré-release)  
**Corrigido em:** 1.0.0  
**Data de Correção:** 12/12/2025  

**Descrição:**
Sistema permitia criar empréstimos mesmo quando não havia exemplares disponíveis.

**Causa Raiz:**
Query SQL não validava disponibilidade real de exemplares.

**Solução Implementada:**
- Adicionada validação de `exemplares_disponiveis > 0`
- Implementado lock otimista para evitar race conditions
- Adicionados testes de regressão

**Testes:**
- ✅ Unit tests passaram
- ✅ Integration tests passaram
- ✅ Teste manual confirmado

**Implementado por:** Tiago Poiares  

---

#### BUG-2025-002: Reserva não converte automaticamente para empréstimo

**Status:** 🟢 Corrigido  
**Prioridade:** P3 (Médio)  
**Severidade:** Moderada  
**Componente:** Backend API  
**Versão Afetada:** 0.9.0 (pré-release)  
**Corrigido em:** 1.0.0  
**Data de Correção:** 08/12/2026  

**Descrição:**
Quando livro era devolvido, reserva não era automaticamente convertida em empréstimo.

**Causa Raiz:**
Falta de trigger ou lógica de conversão automática após devolução.

**Solução Implementada:**
- Implementada função `convertReservaToEmprestimo()`
- Chamada automática ao processar devolução
- Notificação ao utilizador (in-app)

**Testes:**
- ✅ Fluxo completo testado (reserva → devolução → conversão)

**Implementado por:** Daniel Ferreira  
**Revisado por:** Tiago Poiares  

---

#### BUG-2025-003: Token JWT expira sem refresh automático

**Status:** 🟢 Corrigido  
**Prioridade:** P2 (Alto)  
**Severidade:** Moderada  
**Componente:** Frontend  
**Versão Afetada:** 0.9.0 (pré-release)  
**Corrigido em:** 1.0.0  
**Data de Correção:** 15/12/2025  

**Descrição:**
Após 24h de uso contínuo, utilizadores eram desconectados abruptamente sem aviso.

**Causa Raiz:**
Token JWT expirava mas não havia mecanismo de refresh.

**Solução Implementada:**
- Implementado interceptor Axios para refresh automático
- Token renova 5 minutos antes de expirar
- Logout graceful se refresh falhar

**Arquivos Alterados:**
- `frontend/src/services/api.js`

**Testes:**
- ✅ Teste de expiração de token
- ✅ Teste de refresh automático
- ✅ Teste de logout em caso de falha

**Implementado por:** Tiago Poiares  
**Revisado por:** Carlos Ribeiro  

---

### Estatísticas de Bugs Pré-Lançamento

**Sprint A:** 0 bugs  
**Sprint B:** 0 bugs  
**Sprint C:** 3 bugs (todos corrigidos)

**Taxa de Regressão:** 0% (nenhum bug voltou)  

---

## Melhorias Sugeridas

### Melhorias Pendentes de Implementação

#### ENH-2026-001: Sistema completo de notificações por email

**Status:** 📋 Planeado para v1.1.0  
**Prioridade:** Alta  
**Tipo:** Nova Funcionalidade  
**Sugerido por:** Bibliotecários / Equipa de Produto  
**Data:** 04/01/2026  

**Descrição:**
Implementar sistema completo de notificações por email para complementar notificações in-app.

**Justificação:**
- Utilizadores podem não verificar notificações in-app
- Email garante que recebem avisos importantes (prazos, multas)
- Reduz trabalho manual de bibliotecários

**Requisitos:**
1. Integração com serviço SMTP
2. Templates de email profissionais
3. Configuração de preferências de utilizador
4. Tipos de notificação:
   - Reserva disponível para levantamento
   - Lembrete de devolução (3 dias antes)
   - Aviso de atraso
   - Multa aplicada
   - Confirmação de empréstimo

**Estimativa de Esforço:** 5-8 dias  
**Complexidade:** Média  
**Dependências:** Configuração SMTP, templates HTML  

---

#### ENH-2026-002: Importação em massa de livros via CSV/Excel

**Status:** 📋 Planeado para v1.1.0  
**Prioridade:** Alta  
**Tipo:** Melhoria  
**Sugerido por:** Bibliotecários  
**Data:** 04/01/2026  

**Descrição:**
Permitir importação de múltiplos livros de uma vez através de arquivo CSV ou Excel.

**Justificação:**
- Adicionar livros um a um é demorado
- Bibliotecas têm catálogos em Excel/CSV
- Facilita migração de sistemas antigos

**Requisitos:**
1. Upload de ficheiro CSV/XLSX
2. Validação de dados antes de importar
3. Preview de dados a importar
4. Relatório de importação (sucessos/falhas)
5. Rollback em caso de erro
6. Template de CSV disponível para download

**Campos Esperados:**
- Título, Autor, ISBN, Editora, Ano, Categoria, Exemplares, Sinopse

**Estimativa de Esforço:** 3-5 dias  
**Complexidade:** Média  
**Dependências:** Biblioteca de parsing (Papa Parse / XLSX)  

---

#### ENH-2026-003: Geração de códigos de barras

**Status:** 📋 Planeado para v1.1.0  
**Prioridade:** Média  
**Tipo:** Nova Funcionalidade  
**Sugerido por:** Bibliotecários  
**Data:** 04/01/2026  

**Descrição:**
Gerar códigos de barras para livros e cartões de utilizador para facilitar check-in/check-out.

**Justificação:**
- Agiliza processo de empréstimo/devolução
- Reduz erros de digitação
- Profissionaliza o serviço

**Requisitos:**
1. Geração de código de barras baseado em ISBN ou ID interno
2. Impressão de etiquetas
3. Scanner de código de barras (via câmera ou leitor USB)
4. Formulário de empréstimo com input de barcode

**Estimativa de Esforço:** 5-7 dias  
**Complexidade:** Média-Alta  
**Dependências:** Biblioteca de barcode (JsBarcode), integração com scanner  

---

#### ENH-2026-004: Relatórios avançados com gráficos

**Status:** 📋 Em Análise  
**Prioridade:** Média  
**Tipo:** Melhoria  
**Sugerido por:** Direção / Bibliotecários  
**Data:** 04/01/2026  

**Descrição:**
Expandir sistema de relatórios com visualizações gráficas interativas.

**Justificação:**
- Facilita análise de tendências
- Apresentações para direção
- Identificar padrões de uso

**Tipos de Gráficos:**
1. Empréstimos ao longo do tempo (line chart)
2. Livros por categoria (pie chart)
3. Top 10 livros (bar chart)
4. Utilizadores mais ativos (leaderboard)
5. Taxa de ocupação da biblioteca (gauge)

**Estimativa de Esforço:** 4-6 dias  
**Complexidade:** Média  
**Dependências:** Biblioteca de charts (Chart.js / Recharts)  

---

#### ENH-2026-005: Sistema de recomendações

**Status:** 📋 Em Análise  
**Prioridade:** Baixa  
**Tipo:** Nova Funcionalidade  
**Sugerido por:** Professores / Alunos  
**Data:** 04/01/2026  

**Descrição:**
Recomendar livros baseado em histórico de leituras e preferências.

**Justificação:**
- Incentiva descoberta de novos livros
- Melhora experiência de utilizador
- Aumenta circulação de acervo

**Abordagens Possíveis:**
1. Collaborative filtering (baseado em utilizadores similares)
2. Content-based (baseado em categorias/autores lidos)
3. Híbrido

**Requisitos:**
1. "Livros Recomendados para Ti" no dashboard
2. Algoritmo de recomendação
3. Feedback de utilizador (gostei/não gostei)

**Estimativa de Esforço:** 10-15 dias  
**Complexidade:** Alta  
**Dependências:** Dados suficientes de empréstimos, algoritmo ML (opcional)  

---

### Melhorias Menores Sugeridas

| ID | Descrição | Prioridade | Esforço |
|----|-----------|------------|---------|
| ENH-2026-010 | Adicionar campo "Localização na Estante" | Baixa | 1 dia |
| ENH-2026-011 | Permitir pesquisa por número de utilizador | Baixa | 0.5 dia |
| ENH-2026-012 | Dark mode | Baixa | 2-3 dias |
| ENH-2026-013 | Exportar relatórios em PDF | Média | 2 dias |
| ENH-2026-014 | Adicionar campo "Condição do Livro" | Baixa | 1 dia |
| ENH-2026-015 | Integração com Google Books API | Média | 5 dias |
| ENH-2026-016 | Permitir múltiplas fotos de capa | Baixa | 2 dias |
| ENH-2026-017 | Sistema de tags/keywords para livros | Baixa | 3 dias |
| ENH-2026-018 | Wishlist de livros para comprar | Baixa | 3 dias |
| ENH-2026-019 | Reviews e avaliações de livros | Média | 7 dias |
| ENH-2026-020 | Adicionar imagens nos livros | Média | 2 dias |

---

## Melhorias Implementadas

*Ainda não há melhorias implementadas pós-lançamento v1.0.0*

### Template de Registo de Melhoria Implementada

```markdown
### ENH-2026-XXX: [Título da Melhoria]

**Status:** ✅ Implementado  
**Versão:** X.X.X  
**Data de Implementação:** DD/MM/YYYY  
**Implementado por:** [Nome]  

**Descrição:**
[Descrição da melhoria]

**Antes:**
[Como funcionava antes]

**Depois:**
[Como funciona agora]

**Impacto:**
- Melhoria de performance: [X]%
- Satisfação de utilizador: [Feedback]
- Métricas relevantes: [Dados]

**Arquivos Alterados:**
- [Lista de arquivos]

**Testes:**
- ✅ [Teste 1]
- ✅ [Teste 2]
```

---

## Status e Priorização

### Matriz de Priorização

```
        │ Impacto Alto      │ Impacto Médio     │ Impacto Baixo
────────┼───────────────────┼───────────────────┼──────────────────
Esforço │                   │                   │
Baixo   │ ⭐⭐⭐⭐⭐       │ ⭐⭐⭐⭐         │ ⭐⭐⭐
        │ Fazer ASAP!       │ Fazer em breve    │ Nice to have
        │ ENH-2026-011      │ ENH-2026-013      │ ENH-2026-010
────────┼───────────────────┼───────────────────┼──────────────────
Esforço │                   │                   │
Médio   │ ⭐⭐⭐⭐         │ ⭐⭐⭐           │ ⭐⭐
        │ Planejar         │ Considerar        │ Talvez um dia
        │ ENH-2026-001      │ ENH-2026-003      │ ENH-2026-012
        │ ENH-2026-002      │ ENH-2026-004      │ ENH-2026-014
────────┼───────────────────┼───────────────────┼──────────────────
Esforço │                   │                   │
Alto    │ ⭐⭐⭐           │ ⭐⭐             │ ⭐
        │ Avaliar ROI      │ Provavelmente não │ Não fazer
        │ ENH-2026-019      │ ENH-2026-005      │ -
```

### Roadmap de Implementação

**v1.1.0 (Q1 2026 - Março):**
- ✅ ENH-2026-001: Notificações por email
- ✅ ENH-2026-002: Importação em massa
- ✅ ENH-2026-003: Códigos de barras
- ✅ ENH-2026-004: Relatórios com gráficos
- ✅ ENH-2026-013: Export PDF

**v1.2.0 (Q2 2026 - Junho):**
- ✅ ENH-2026-015: Google Books API
- ✅ ENH-2026-019: Reviews e avaliações
- ✅ ENH-2026-011: Pesquisa por número de utilizador
- ⚠️ ENH-2026-005: Sistema de recomendações (se viável)

**v2.0.0 (Q3 2026 - Setembro):**
- App móvel nativa
- Multi-biblioteca
- API pública
- Funcionalidades avançadas

**Backlog:**
- ENH-2026-012: Dark mode
- ENH-2026-010: Localização na estante
- ENH-2026-014: Condição do livro
- ENH-2026-016: Múltiplas fotos
- ENH-2026-017: Tags/keywords
- ENH-2026-018: Wishlist

---

## Métricas de Qualidade

### KPIs de Qualidade (v1.0.0)

| Métrica | Valor | Target | Status |
|---------|-------|--------|--------|
| Bugs Críticos em Produção | 0 | 0 | ✅ |
| Bugs em Produção (Total) | 0 | < 5 | ✅ |
| Taxa de Resolução de Bugs | N/A | > 80% | - |
| Tempo Médio de Resolução | N/A | < 48h | - |
| Cobertura de Testes | 78% | > 70% | ✅ |
| Bugs por 1000 linhas de código | 0 | < 1 | ✅ |
| Taxa de Regressão | 0% | < 5% | ✅ |
| Satisfação de Utilizador | Aguardando | > 4.0/5.0 | ⏳ |

### Tendências (Primeiras 24h)

📊 **Estabilidade:**
- Uptime: 100%
- Crashes: 0
- Erros 5xx: 0

📊 **Performance:**
- Tempo de resposta médio: 67ms
- Tempo de resposta p95: 143ms
- Database queries: 32ms (média)

📊 **Uso:**
- Utilizadores ativos: [A monitorizar]
- Empréstimos processados: [A monitorizar]
- Reservas criadas: [A monitorizar]

---

## Templates

### Template de Bug Report (Para Utilizadores)

```markdown
# Reportar um Problema

**Obrigado por ajudar a melhorar o BookTrack!**

## Informações Básicas
- **Seu nome:** ___________________
- **Email:** ___________________
- **Tipo de utilizador:** [ ] Aluno  [ ] Professor  [ ] Bibliotecário
- **Data/Hora do problema:** ___/___/______ às __:__

## Descrição do Problema
[Descreva o que aconteceu]

## O que estava a fazer?
1. [Primeiro passo]
2. [Segundo passo]
3. [Quando viu o erro]

## O que esperava que acontecesse?
[Descrição]

## Screenshot
[Se possível, anexe uma captura de ecrã]

## Navegador/Dispositivo
- [ ] Chrome  [ ] Firefox  [ ] Safari  [ ] Outro: ___
- [ ] Computador  [ ] Tablet  [ ] Telemóvel

**Enviar para:** bugs.booktrack@escola.pt
```

### Template de Enhancement Suggestion (Para Utilizadores)

```markdown
# Sugerir uma Melhoria

**Obrigado pela sua sugestão!**

## Informações Básicas
- **Seu nome:** ___________________
- **Email:** ___________________
- **Tipo de utilizador:** [ ] Aluno  [ ] Professor  [ ] Bibliotecário
- **Data:** ___/___/______

## Sua Sugestão
[Descreva a melhoria que gostaria de ver]

## Por que seria útil?
[Explique o benefício]

## Como funciona atualmente?
[Descreva como é agora]

## Como gostaria que funcionasse?
[Descreva sua visão]

## Prioridade (na sua opinião)
[ ] Muito importante
[ ] Importante
[ ] Seria bom ter
[ ] Só uma ideia

**Enviar para:** sugestoes.booktrack@escola.pt
```

---

## Processo de Gestão de Bugs e Melhorias

### Fluxo de Bug

```
┌──────────────┐
│ Bug Reportado│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Triagem     │ (Verificar duplicados, severidade)
└──────┬───────┘
       │
       ▼
  ┌────┴─────┐
  │          │
 Bug      Não é Bug
  │          │
  │     (Fechar/Documentar)
  ▼
┌──────────────┐
│ Priorização  │ (P1/P2/P3/P4)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Atribuição  │ (Desenvolvedor)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Correção   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Testes    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Deploy    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Verificação  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Fechado    │
└──────────────┘
```

### Fluxo de Enhancement

```
┌──────────────────┐
│ Sugestão Recebida│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Análise Inicial  │ (Viabilidade, Alinhamento)
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
Aprovado   Rejeitado
    │         │
    │    (Documentar razão)
    ▼
┌──────────────────┐
│  Especificação   │ (Requisitos detalhados)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Priorização     │ (Roadmap)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Backlog/Sprint   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Implementação    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     Release      │
└──────────────────┘
```

---

## Contactos

**Reportar Bugs:**
- Email: bugs.booktrack@escola.pt

**Sugerir Melhorias:**
- Email: sugestoes.booktrack@escola.pt

**Equipa de Qualidade:**
- QA Lead: [Nome] - qa@escola.pt
- Dev Lead: Tiago Poiares - dev@escola.pt
- Product Owner: [Nome] - product@escola.pt

---

## Próximos Passos

### Semana 1-2 (Pós-Lançamento)
- [ ] Monitorizar bugs em produção
- [ ] Recolher feedback inicial de utilizadores
- [ ] Priorizar correções urgentes (se necessário)

### Semana 3-4
- [ ] Compilar lista final de melhorias para v1.1.0
- [ ] Iniciar planeamento de Sprint D
- [ ] Atualizar roadmap baseado em feedback

### Mês 2
- [ ] Implementar melhorias prioritárias
- [ ] Preparar release v1.1.0
- [ ] Atualizar documentação

---

**Fim do Relatório de Bugs & Melhorias**

**Preparado por:** Equipa BookTrack  
**Última Atualização:** 04 de Janeiro de 2026  
**Próximo Relatório:** 04 de Fevereiro de 2026  
**Versão:** 1.0
