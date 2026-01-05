# Plano de Manutenção - BookTrack

**Sistema de Gestão de Biblioteca Escolar**

Versão: 1.0  
Data: Janeiro 2026  
Público-alvo: Equipas de IT e Administração

---

## Índice

1. [Introdução](#introdução)
2. [Objetivos da Manutenção](#objetivos-da-manutenção)
3. [Tipos de Manutenção](#tipos-de-manutenção)
4. [Cronograma de Manutenção](#cronograma-de-manutenção)
5. [Procedimentos de Manutenção](#procedimentos-de-manutenção)
6. [Gestão de Patches e Updates](#gestão-de-patches-e-updates)
7. [Backups e Recuperação](#backups-e-recuperação)
8. [Monitorização e Alertas](#monitorização-e-alertas)
9. [Manutenção da Base de Dados](#manutenção-da-base-de-dados)
10. [Gestão de Logs](#gestão-de-logs)
11. [Testes Pós-Manutenção](#testes-pós-manutenção)
12. [Responsabilidades](#responsabilidades)

---

## Introdução

### Objetivo do Documento

Este documento define a política e os cronogramas para as atividades de manutenção periódica do sistema BookTrack, garantindo a sua operação contínua, performance otimizada e segurança.

### Âmbito

O plano cobre:
- Manutenção preventiva programada
- Aplicação de patches de segurança
- Atualizações de dependências
- Otimizações de base de dados
- Gestão de backups
- Monitorização contínua
- Procedimentos de upgrade

### Política de Manutenção

**Princípios:**
1. **Prevenção:** Manutenção proativa para evitar problemas
2. **Mínima Interrupção:** Janelas de manutenção fora do horário de pico
3. **Testes Rigorosos:** Validação completa pós-manutenção
4. **Documentação:** Registo detalhado de todas as alterações
5. **Reversibilidade:** Planos de rollback sempre disponíveis

---

## Objetivos da Manutenção

### Objetivos Principais

1. **Disponibilidade**
   - Manter uptime de 99.5% ou superior
   - Minimizar tempo de inatividade não planeado
   - Resposta rápida a incidentes

2. **Performance**
   - Manter tempos de resposta < 200ms (95th percentile)
   - Otimizar queries de base de dados
   - Gerir crescimento de dados

3. **Segurança**
   - Aplicar patches de segurança em tempo útil
   - Manter dependências atualizadas
   - Realizar auditorias de segurança

4. **Integridade de Dados**
   - Backups diários verificados
   - Testes de recuperação mensais
   - Validação de consistência de dados

5. **Compliance**
   - Manter logs de auditoria
   - Cumprir regulamentações de proteção de dados
   - Documentar todas as mudanças

---

## Tipos de Manutenção

### 1. Manutenção Preventiva

**Objetivo:** Prevenir falhas antes que ocorram

**Atividades:**
- Verificação de saúde do sistema
- Limpeza de logs e ficheiros temporários
- Otimização de base de dados
- Verificação de backups
- Atualização de certificados SSL
- Análise de performance

**Frequência:** Diária, Semanal, Mensal (conforme cronograma)

### 2. Manutenção Corretiva

**Objetivo:** Corrigir problemas identificados

**Atividades:**
- Correção de bugs
- Resolução de erros reportados
- Ajustes de configuração
- Otimizações pontuais

**Frequência:** Conforme necessário (on-demand)

### 3. Manutenção Adaptativa

**Objetivo:** Adaptar o sistema a mudanças

**Atividades:**
- Atualizações de dependências
- Adaptações a novos requisitos
- Migração de versões
- Ajustes de infraestrutura

**Frequência:** Mensal / Trimestral

### 4. Manutenção Perfectiva

**Objetivo:** Melhorar o sistema

**Atividades:**
- Otimizações de performance
- Melhorias de UX/UI
- Refatoração de código
- Adição de features menores

**Frequência:** Trimestral / Por release

---

## Cronograma de Manutenção

### Janelas de Manutenção

**Janela Principal:**
- **Dia:** Domingo
- **Horário:** 02:00 - 04:00 (2 horas)
- **Tipo:** Manutenção programada semanal

**Janela de Emergência:**
- **Disponibilidade:** 24/7
- **Ativação:** Apenas para incidentes críticos (P1)

### Calendário Anual de Manutenção

#### Manutenção Diária (Automatizada)

| Horário | Atividade | Duração |
|---------|-----------|---------|
| 02:00 | Backup automático da base de dados | 15-30 min |
| 02:30 | Rotação de logs | 5 min |
| 03:00 | Verificação de integridade de backups | 10 min |
| 03:15 | Limpeza de ficheiros temporários | 5 min |

#### Manutenção Semanal (Domingos, 02:00-04:00)

**Semana 1 do mês:**
- Otimização de base de dados (OPTIMIZE, ANALYZE)
- Atualização de estatísticas
- Verificação de índices
- Limpeza de logs antigos (>14 dias)
- Reinício graceful de serviços
- Verificação de certificados SSL

**Semana 2 do mês:**
- Análise de performance
- Identificação de queries lentas
- Revisão de logs de erro
- Verificação de espaço em disco
- Teste de backups (restore parcial)

**Semana 3 do mês:**
- Atualização de patches de segurança (se disponíveis)
- Revisão de dependências npm
- Verificação de vulnerabilidades (npm audit)
- Atualização de sistema operativo (apenas segurança)

**Semana 4 do mês:**
- Manutenção preventiva geral
- Limpeza de dados temporários
- Arquivamento de logs
- Verificação de backups remotos
- Relatório mensal de manutenção

#### Manutenção Mensal (Primeiro Domingo, 02:00-04:00)

- **Teste de Disaster Recovery** (restore completo em ambiente de teste)
- **Análise de Crescimento de Dados**
- **Revisão de Performance Metrics**
- **Atualização de Dependências** (minor versions)
- **Auditoria de Segurança**
- **Renovação de Certificados** (se necessário)
- **Relatório de Capacidade**

#### Manutenção Trimestral (Primeiro Domingo de Jan/Abr/Jul/Out)

- **Atualização Major de Dependências** (se aplicável)
- **Revisão Completa de Segurança**
- **Teste de Stress/Load Testing**
- **Otimização de Infraestrutura**
- **Revisão de Políticas de Backup**
- **Auditoria de Logs de Acesso**
- **Planeamento de Capacidade**

#### Manutenção Anual (Janeiro)

- **Upgrade Major do Sistema** (se planeado)
- **Migração de Dados** (se necessário)
- **Revisão Completa de Infraestrutura**
- **Teste Completo de Disaster Recovery**
- **Renovação de Certificados SSL**
- **Revisão e Atualização de Documentação**
- **Formação de Equipa**

---

## Procedimentos de Manutenção

### Procedimento Padrão de Manutenção

#### Pré-Manutenção

**Checklist:**
```
[ ] Notificação aos utilizadores (48h antes, se downtime esperado)
[ ] Backup completo da base de dados
[ ] Backup de ficheiros de configuração
[ ] Verificação de espaço em disco disponível
[ ] Preparação de plano de rollback
[ ] Revisão da documentação de mudanças
[ ] Preparação de ambiente de teste
[ ] Equipa de standby identificada
```

**Script de Pré-Manutenção:**
```bash
#!/bin/bash
# pre-maintenance.sh

echo "=== Pré-Manutenção BookTrack ==="
echo "Data: $(date)"

# 1. Criar backup completo
echo "1. Criando backup..."
/var/www/booktrack/scripts/backup.sh

# 2. Verificar espaço em disco
echo "2. Verificando espaço..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "   ⚠️  AVISO: Disco com ${DISK_USAGE}% de uso!"
fi

# 3. Verificar serviços
echo "3. Verificando serviços..."
systemctl is-active nginx && echo "   ✓ Nginx OK" || echo "   ✗ Nginx DOWN"
systemctl is-active mysql && echo "   ✓ MySQL OK" || echo "   ✗ MySQL DOWN"
pm2 describe booktrack-api >/dev/null && echo "   ✓ API OK" || echo "   ✗ API DOWN"

# 4. Salvar estado atual
echo "4. Salvando estado..."
pm2 save
pm2 list > /var/www/booktrack/maintenance/pre-maintenance-pm2.log
mysql -u booktrack_user -p$DB_PASSWORD -e "SHOW PROCESSLIST;" > /var/www/booktrack/maintenance/pre-maintenance-mysql.log

echo "=== Pré-Manutenção Concluída ==="
```

#### Durante a Manutenção

**Práticas Recomendadas:**
1. Seguir a ordem de tarefas planeada
2. Documentar cada passo realizado
3. Verificar logs continuamente
4. Testar cada mudança antes de prosseguir
5. Manter comunicação com equipa

**Logs de Manutenção:**
```bash
# Exemplo de log estruturado
echo "[$(date '+%Y-%m-%d %H:%M:%S')] INÍCIO: Otimização de BD" >> /var/log/booktrack/maintenance.log
# ... executar tarefa ...
echo "[$(date '+%Y-%m-%d %H:%M:%S')] FIM: Otimização de BD - STATUS: OK" >> /var/log/booktrack/maintenance.log
```

#### Pós-Manutenção

**Checklist:**
```
[ ] Verificar todos os serviços estão a correr
[ ] Executar smoke tests
[ ] Verificar logs por erros
[ ] Testar funcionalidades críticas
[ ] Confirmar conectividade de base de dados
[ ] Verificar performance (tempos de resposta)
[ ] Atualizar documentação de mudanças
[ ] Notificar conclusão aos utilizadores
[ ] Arquivar logs de manutenção
[ ] Atualizar registo de manutenção
```

**Script de Pós-Manutenção:**
```bash
#!/bin/bash
# post-maintenance.sh

echo "=== Pós-Manutenção BookTrack ==="
echo "Data: $(date)"

# 1. Verificar serviços
echo "1. Verificando serviços..."
systemctl is-active nginx && echo "   ✓ Nginx OK" || echo "   ✗ Nginx FALHOU"
systemctl is-active mysql && echo "   ✓ MySQL OK" || echo "   ✗ MySQL FALHOU"
pm2 describe booktrack-api >/dev/null && echo "   ✓ API OK" || echo "   ✗ API FALHOU"

# 2. Smoke tests
echo "2. Executando smoke tests..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✓ Frontend respondendo"
else
    echo "   ✗ Frontend falhou (HTTP $HTTP_CODE)"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✓ API respondendo"
else
    echo "   ✗ API falhou (HTTP $HTTP_CODE)"
fi

# 3. Verificar logs por erros
echo "3. Verificando logs..."
ERROR_COUNT=$(pm2 logs booktrack-api --nostream --lines 100 --err | grep -i error | wc -l)
echo "   Erros encontrados: $ERROR_COUNT"

# 4. Testar database
echo "4. Testando base de dados..."
mysql -u booktrack_user -p$DB_PASSWORD -e "SELECT COUNT(*) FROM utilizadores;" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ Database OK"
else
    echo "   ✗ Database FALHOU"
fi

echo "=== Pós-Manutenção Concluída ==="
```

---

## Gestão de Patches e Updates

### Política de Patches

**Prioridades:**

| Severidade | SLA | Janela |
|------------|-----|--------|
| Crítica (CVE 9.0-10.0) | 24h | Emergência |
| Alta (CVE 7.0-8.9) | 7 dias | Próxima janela |
| Média (CVE 4.0-6.9) | 30 dias | Mensal |
| Baixa (CVE 0.0-3.9) | 90 dias | Trimestral |

### Processo de Atualização

#### 1. Identificação
```bash
# Verificar atualizações disponíveis
cd /var/www/booktrack/backend
npm outdated

# Verificar vulnerabilidades
npm audit

# Verificar updates do sistema
sudo apt update
sudo apt list --upgradable
```

#### 2. Avaliação
- Ler changelogs
- Verificar breaking changes
- Avaliar impacto
- Determinar prioridade

#### 3. Teste em Staging
```bash
# Em ambiente de staging
git checkout staging
npm update <package>
npm test
# Testar manualmente funcionalidades críticas
```

#### 4. Deployment em Produção
```bash
# Seguir procedimento de deployment
# (Ver DEPLOYMENT_GUIDE.md)
```

#### 5. Verificação
- Executar smoke tests
- Verificar logs
- Monitorizar performance

### Atualizações de Dependências

**Frontend (package.json):**
```bash
# Verificar updates
cd /var/www/booktrack/frontend
npm outdated

# Atualizar dependencies patch/minor
npm update

# Atualizar major versions (cuidado!)
npm install react@latest --save
```

**Backend (package.json):**
```bash
cd /var/www/booktrack/backend
npm outdated
npm update
npm audit fix
```

**Sistema Operativo:**
```bash
# Apenas atualizações de segurança (semanal)
sudo apt update
sudo apt upgrade -y --security-only

# Atualizações completas (mensal, em janela de manutenção)
sudo apt update
sudo apt upgrade -y
```

---

## Backups e Recuperação

### Política de Backups

**Frequência:**
- **Diários:** Full backup às 02:00
- **Semanais:** Backup completo arquivado (Domingos)
- **Mensais:** Backup off-site (primeiro Domingo)

**Retenção:**
- Diários: 14 dias
- Semanais: 8 semanas
- Mensais: 12 meses
- Anuais: 5 anos

### Script de Backup Automático

```bash
#!/bin/bash
# /var/www/booktrack/scripts/backup.sh

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/var/www/booktrack/database/backups"
DB_NAME="booktrack_production"
DB_USER="booktrack_user"

echo "=== Backup BookTrack - $DATE ==="

# 1. Backup da Base de Dados
echo "1. Backup da base de dados..."
mysqldump -u $DB_USER -p$DB_PASSWORD \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# 2. Backup de Ficheiros de Configuração
echo "2. Backup de configurações..."
tar -czf "$BACKUP_DIR/config_backup_$DATE.tar.gz" \
    /var/www/booktrack/backend/.env \
    /etc/nginx/sites-available/booktrack \
    /var/www/booktrack/backend/ecosystem.config.js

# 3. Backup de Uploads
echo "3. Backup de uploads..."
tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" \
    /var/www/booktrack/backend/uploads/

# 4. Verificar integridade
echo "4. Verificando integridade..."
gunzip -t "$BACKUP_DIR/db_backup_$DATE.sql.gz"
if [ $? -eq 0 ]; then
    echo "   ✓ Backup íntegro"
else
    echo "   ✗ Backup corrompido!"
    exit 1
fi

# 5. Limpar backups antigos (>14 dias)
echo "5. Limpando backups antigos..."
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +14 -delete
find $BACKUP_DIR -name "config_backup_*.tar.gz" -mtime +14 -delete

echo "=== Backup Concluído - $DATE ==="
```

### Procedimento de Restore

```bash
#!/bin/bash
# restore.sh

# ATENÇÃO: Este processo sobrescreve dados!
# Apenas executar após confirmação

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore.sh <ficheiro_backup.sql.gz>"
    exit 1
fi

echo "⚠️  AVISO: Isto irá sobrescrever a base de dados atual!"
read -p "Continuar? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelado."
    exit 0
fi

# 1. Parar aplicação
echo "1. Parando aplicação..."
pm2 stop booktrack-api

# 2. Criar backup de segurança
echo "2. Criando backup de segurança..."
mysqldump -u booktrack_user -p$DB_PASSWORD booktrack_production | \
    gzip > "/var/www/booktrack/database/backups/pre_restore_$(date +%Y%m%d-%H%M%S).sql.gz"

# 3. Restaurar backup
echo "3. Restaurando backup..."
gunzip < "$BACKUP_FILE" | mysql -u booktrack_user -p$DB_PASSWORD booktrack_production

# 4. Verificar restore
echo "4. Verificando restore..."
ROW_COUNT=$(mysql -u booktrack_user -p$DB_PASSWORD -se "SELECT COUNT(*) FROM booktrack_production.utilizadores;")
echo "   Utilizadores na BD: $ROW_COUNT"

# 5. Reiniciar aplicação
echo "5. Reiniciando aplicação..."
pm2 start booktrack-api

echo "=== Restore Concluído ==="
```

### Testes de Restore (Mensal)

**Procedimento:**
1. Selecionar backup recente
2. Restaurar em ambiente de teste
3. Verificar integridade de dados
4. Testar funcionalidades críticas
5. Documentar resultados

```bash
# teste-restore.sh
# Executar em ambiente de teste/staging
LATEST_BACKUP=$(ls -t /path/to/backups/db_backup_*.sql.gz | head -1)
gunzip < "$LATEST_BACKUP" | mysql -u test_user -p test_database
# ... testes ...
```

---

## Monitorização e Alertas

### Métricas Monitorizadas

**Sistema:**
- CPU usage (threshold: 80%)
- Memory usage (threshold: 85%)
- Disk usage (threshold: 80%)
- Network traffic

**Aplicação:**
- API response times
- Error rates
- Request throughput
- PM2 process status

**Base de Dados:**
- Connection pool usage
- Query performance
- Slow queries (>1s)
- Deadlocks

### Configuração de Alertas

**Alertas Críticos (P1) - Resposta Imediata:**
- Serviço down (Nginx, MySQL, API)
- Disco >95% cheio
- Error rate >5%
- Database unreachable

**Alertas Altos (P2) - Resposta em 1h:**
- CPU >90% por 5 minutos
- Memory >90% por 5 minutos
- Disco >85% cheio
- Slow queries aumentando

**Alertas Médios (P3) - Resposta em 24h:**
- Performance degradada (>200ms p95)
- Backup failed
- Certificate expiring (<30 days)

### Script de Monitorização

```bash
#!/bin/bash
# health-monitor.sh

ALERT_EMAIL="admin@escola.pt"
LOG_FILE="/var/log/booktrack/health-monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
    log "ALERT: $1"
    echo "$1" | mail -s "BookTrack Alert: $1" "$ALERT_EMAIL"
}

# Verificar CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    alert "CPU usage high: ${CPU_USAGE}%"
fi

# Verificar Memória
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
if (( $(echo "$MEM_USAGE > 85" | bc -l) )); then
    alert "Memory usage high: ${MEM_USAGE}%"
fi

# Verificar Disco
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    alert "Disk usage high: ${DISK_USAGE}%"
fi

# Verificar Serviços
systemctl is-active nginx >/dev/null || alert "Nginx is DOWN"
systemctl is-active mysql >/dev/null || alert "MySQL is DOWN"
pm2 describe booktrack-api >/dev/null 2>&1 || alert "API is DOWN"

log "Health check completed"
```

**Cron Job (executar a cada 5 minutos):**
```bash
crontab -e
# Adicionar:
*/5 * * * * /var/www/booktrack/scripts/health-monitor.sh
```

---

## Manutenção da Base de Dados

### Otimização Semanal

```bash
#!/bin/bash
# db-optimize.sh

echo "=== Otimização de Base de Dados ==="
echo "Data: $(date)"

mysql -u booktrack_user -p$DB_PASSWORD booktrack_production << EOF

-- 1. Otimizar tabelas
OPTIMIZE TABLE utilizadores;
OPTIMIZE TABLE livros;
OPTIMIZE TABLE emprestimos;
OPTIMIZE TABLE reservas;

-- 2. Analisar tabelas (atualizar estatísticas)
ANALYZE TABLE utilizadores;
ANALYZE TABLE livros;
ANALYZE TABLE emprestimos;
ANALYZE TABLE reservas;

-- 3. Verificar integridade
CHECK TABLE utilizadores;
CHECK TABLE livros;
CHECK TABLE emprestimos;
CHECK TABLE reservas;

-- 4. Ver tamanho das tabelas
SELECT 
    table_name AS 'Tabela',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Tamanho (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'booktrack_production'
ORDER BY (data_length + index_length) DESC;

EOF

echo "=== Otimização Concluída ==="
```

### Limpeza de Dados Antigos

```sql
-- Executar mensalmente
-- limpar-dados-antigos.sql

-- 1. Arquivar empréstimos antigos (>2 anos)
INSERT INTO emprestimos_arquivo 
SELECT * FROM emprestimos 
WHERE data_emprestimo < DATE_SUB(NOW(), INTERVAL 2 YEAR);

DELETE FROM emprestimos 
WHERE data_emprestimo < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- 2. Limpar reservas canceladas antigas (>6 meses)
DELETE FROM reservas 
WHERE status = 'cancelada' 
AND data_reserva < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- 3. Limpar logs de auditoria antigos (>1 ano)
DELETE FROM audit_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### Monitorização de Performance

```sql
-- queries-lentas.sql
-- Identificar queries lentas

-- 1. Ativar slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1; -- 1 segundo

-- 2. Ver queries lentas recentes
SELECT 
    query_time,
    lock_time,
    rows_examined,
    sql_text
FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 10;

-- 3. Ver estatísticas de tabelas
SELECT 
    table_name,
    table_rows,
    avg_row_length,
    (data_length + index_length) / 1024 / 1024 AS 'Size_MB'
FROM information_schema.tables
WHERE table_schema = 'booktrack_production'
ORDER BY table_rows DESC;
```

---

## Gestão de Logs

### Política de Retenção

| Tipo de Log | Retenção | Localização |
|-------------|----------|-------------|
| Aplicação (info) | 30 dias | /var/www/booktrack/backend/logs/ |
| Aplicação (error) | 90 dias | /var/www/booktrack/backend/logs/ |
| Nginx access | 30 dias | /var/log/nginx/ |
| Nginx error | 90 dias | /var/log/nginx/ |
| MySQL error | 90 dias | /var/log/mysql/ |
| MySQL slow query | 30 dias | /var/log/mysql/ |
| Audit logs | 1 ano | Base de dados |
| Manutenção | 1 ano | /var/log/booktrack/ |

### Rotação de Logs

**/etc/logrotate.d/booktrack:**
```
/var/www/booktrack/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0640 booktrack booktrack
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/www/booktrack/backend/logs/error.log {
    daily
    rotate 90
    compress
    delaycompress
    notifempty
    create 0640 booktrack booktrack
}
```

### Limpeza Manual de Logs

```bash
#!/bin/bash
# cleanup-logs.sh

echo "=== Limpeza de Logs ==="

# Logs de aplicação (>30 dias)
find /var/www/booktrack/backend/logs -name "*.log.*" -mtime +30 -delete

# Logs do PM2 (flush)
pm2 flush

# Logs do sistema (>14 dias)
sudo find /var/log -name "*.log.*" -mtime +14 -delete

# Logs arquivados comprimidos (>90 dias)
find /var/www/booktrack/logs/archive -name "*.gz" -mtime +90 -delete

echo "=== Limpeza Concluída ==="
```

---

## Testes Pós-Manutenção

### Smoke Tests

```bash
#!/bin/bash
# smoke-tests.sh

echo "=== Smoke Tests BookTrack ==="

PASS=0
FAIL=0

test() {
    if [ $2 -eq 0 ]; then
        echo "✓ $1"
        ((PASS++))
    else
        echo "✗ $1"
        ((FAIL++))
    fi
}

# 1. Frontend
curl -s http://localhost/ > /dev/null
test "Frontend responde" $?

# 2. API Health
curl -s http://localhost:5000/health > /dev/null
test "API health check" $?

# 3. API Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -n "$TOKEN" ]; then
    echo "✓ API login"
    ((PASS++))
else
    echo "✗ API login"
    ((FAIL++))
fi

# 4. Database connectivity
mysql -u booktrack_user -p$DB_PASSWORD -e "SELECT 1;" > /dev/null 2>&1
test "Database connection" $?

# 5. Listar livros
curl -s -X GET http://localhost:5000/api/livros \
    -H "Authorization: Bearer $TOKEN" > /dev/null
test "API livros endpoint" $?

echo ""
echo "Resultados: $PASS passou, $FAIL falhou"

if [ $FAIL -eq 0 ]; then
    echo "✓ Todos os testes passaram"
    exit 0
else
    echo "✗ Alguns testes falharam"
    exit 1
fi
```

### Testes de Integração

```javascript
// integration-tests.js
// Executar com: node integration-tests.js

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token;

async function runTests() {
    console.log('=== Integration Tests ===\n');
    
    try {
        // 1. Login
        console.log('1. Teste de Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        token = loginRes.data.token;
        console.log('   ✓ Login OK\n');
        
        // 2. Listar livros
        console.log('2. Teste de Listar Livros...');
        const livrosRes = await axios.get(`${API_URL}/livros`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✓ ${livrosRes.data.length} livros encontrados\n`);
        
        // 3. Ver perfil
        console.log('3. Teste de Ver Perfil...');
        const perfilRes = await axios.get(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   ✓ Perfil: ${perfilRes.data.nome}\n`);
        
        console.log('=== Todos os testes passaram ===');
        process.exit(0);
        
    } catch (error) {
        console.error('✗ Teste falhou:', error.message);
        process.exit(1);
    }
}

runTests();
```

### Testes de Performance

```bash
#!/bin/bash
# performance-test.sh

echo "=== Performance Test ==="

# Usando Apache Bench
# Instalar: sudo apt install apache2-utils

# Teste de carga leve
ab -n 100 -c 10 http://localhost:5000/health

# Análise de tempo de resposta
echo ""
echo "Tempo de resposta da API:"
time curl -s http://localhost:5000/health > /dev/null

echo "=== Performance Test Concluído ==="
```

---

## Responsabilidades

### Matriz de Responsabilidades

| Atividade | Responsável | Backup | Frequência |
|-----------|-------------|--------|------------|
| Backups diários | Sistema automático | Sysadmin | Diário |
| Verificação de backups | Sysadmin | DevOps | Diário |
| Manutenção semanal | Sysadmin | - | Semanal |
| Patches de segurança | Sysadmin | DevOps | Conforme necessário |
| Otimização BD | DBA / Sysadmin | DevOps | Semanal |
| Monitorização | Sysadmin | Equipa Suporte | Contínuo |
| Testes de restore | DBA | Sysadmin | Mensal |
| Atualizações de dependências | DevOps | Backend Dev | Mensal |
| Relatórios de manutenção | Sysadmin | - | Mensal |
| Disaster recovery test | DevOps Lead | Sysadmin | Trimestral |
| Planeamento de capacidade | DevOps Lead | - | Trimestral |
| Revisão de segurança | Security | DevOps | Trimestral |
| Upgrade major | DevOps Lead | Toda equipa | Anual |

### Contactos da Equipa

| Papel | Nome | Email | Telefone |
|-------|------|-------|----------|
| Sysadmin Principal | [Nome] | sysadmin@escola.pt | [Telefone] |
| DevOps Lead | [Nome] | devops@escola.pt | [Telefone] |
| DBA | [Nome] | dba@escola.pt | [Telefone] |
| On-Call | Rotativo | oncall@escola.pt | [Telefone] |

### Escalamento

**Nível 1:** Sysadmin (rotina e problemas conhecidos)  
**Nível 2:** DevOps (problemas complexos, mudanças de arquitetura)  
**Nível 3:** Desenvolvimento (bugs de código, features)

---

## Registo de Manutenção

### Template de Relatório Mensal

```markdown
# Relatório de Manutenção - [Mês/Ano]

## Sumário
- Janelas de manutenção: [X]
- Tempo total de downtime: [X horas]
- Incidentes: [X]
- Patches aplicados: [X]

## Atividades Realizadas
1. [Atividade 1]
2. [Atividade 2]

## Métricas
- Uptime: [X]%
- Performance média: [X]ms
- Crescimento de dados: [X]GB

## Problemas Encontrados
- [Problema 1 e resolução]

## Ações Futuras
- [Ação 1]

## Anexos
- Logs de manutenção
- Screenshots de métricas
```

### Localização de Registos

- Relatórios mensais: `/var/www/booktrack/docs/maintenance/reports/`
- Logs de manutenção: `/var/log/booktrack/maintenance.log`
- Change logs: `/var/www/booktrack/docs/maintenance/changes/`

---

## Anexos

### A. Checklist de Emergência

```
INCIDENTE CRÍTICO (P1) - SISTEMA DOWN
======================================
[ ] 1. Verificar se é downtime planeado
[ ] 2. Notificar equipa de on-call
[ ] 3. Verificar status de todos os serviços
[ ] 4. Verificar logs de erro
[ ] 5. Tentar restart de serviços
[ ] 6. Se persistir, iniciar rollback
[ ] 7. Documentar incidente
[ ] 8. Notificar utilizadores
[ ] 9. Post-mortem após resolução
```

### B. Comandos Úteis de Manutenção

```bash
# Ver status geral
booktrack-status  # (script criado no Operations Manual)

# Restart completo
pm2 restart booktrack-api
sudo systemctl reload nginx

# Ver logs em tempo real
pm2 logs booktrack-api --lines 100

# Backup manual
/var/www/booktrack/scripts/backup.sh

# Verificar disco
df -h /var/www/booktrack

# Ver processos
pm2 monit

# MySQL status
mysqladmin -u booktrack_user -p status

# Otimizar BD
mysql -u booktrack_user -p < /var/www/booktrack/scripts/optimize-db.sql
```

### C. Recursos Adicionais

- [Operations Manual](OPERATIONS_MANUAL.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Disaster Recovery Plan](DISASTER_RECOVERY.md)

---

**Fim do Plano de Manutenção**

**Preparado por:** Equipa BookTrack  
**Última Atualização:** Janeiro 2026  
**Próxima Revisão:** Julho 2026  
**Versão:** 1.0
