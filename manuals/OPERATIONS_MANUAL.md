# Manual de Operações - BookTrack

**Sistema de Gestão de Biblioteca Escolar**

Versão: 1.0  
Data: Janeiro 2026  
Público-alvo: Equipas de Suporte e IT/Administração

---

## Índice

1. [Introdução](#introdução)
2. [Visão Geral do Sistema](#visão-geral-do-sistema)
3. [Monitorização Contínua](#monitorização-contínua)
4. [Gestão de Backups](#gestão-de-backups)
5. [Gestão de Recursos](#gestão-de-recursos)
6. [Procedimentos de Incidentes](#procedimentos-de-incidentes)
7. [Manutenção Preventiva](#manutenção-preventiva)
8. [Troubleshooting Operacional](#troubleshooting-operacional)
9. [Procedimentos de Escalamento](#procedimentos-de-escalamento)
10. [Contactos e Responsabilidades](#contactos-e-responsabilidades)

---

## Introdução

### Objetivo

Este manual fornece procedimentos operacionais para equipas de suporte e administração do sistema BookTrack, cobrindo monitorização, manutenção, gestão de incidentes e resolução de problemas.

### Público-Alvo

- Administradores de Sistemas
- Equipas de Suporte IT (Level 1, 2 e 3)
- Equipas de Operações
- On-call Engineers

### Âmbito

Este documento cobre:
- Monitorização diária do sistema
- Gestão de backups e recuperação
- Resposta a incidentes
- Manutenção preventiva
- Gestão de recursos (CPU, memória, disco)
- Procedimentos de escalamento

---

## Visão Geral do Sistema

### Arquitetura de Componentes

```
┌─────────────────────────────────────────┐
│         Camada de Apresentação          │
│  (React SPA - /var/www/booktrack/frontend/build) │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Camada de Proxy/Web             │
│  (Nginx - /etc/nginx/sites-enabled/)    │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│       Camada de Aplicação (API)         │
│  (Node.js/Express - PM2 booktrack-api)  │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│       Camada de Dados                   │
│  (MySQL 8.0 - booktrack_production)     │
└─────────────────────────────────────────┘
```

### Componentes Críticos

| Componente | Localização | Porta | Criticidade |
|------------|-------------|-------|-------------|
| Frontend (Nginx) | /var/www/booktrack/frontend/build | 80, 443 | Alta |
| Backend API (PM2) | /var/www/booktrack/backend | 5000 | Crítica |
| Base de Dados (MySQL) | /var/lib/mysql | 3306 | Crítica |
| SSL (Certbot) | /etc/letsencrypt | - | Alta |

### Horário de Operação

- **Produção:** 24/7 (disponibilidade contínua)
- **Janela de Manutenção:** Domingos, 02:00-04:00 (2h)
- **Backups:** Diariamente às 02:00
- **Monitorizações:** Contínua (24/7)

### SLA (Service Level Agreement)

- **Disponibilidade:** 99.5% (uptime mensal)
- **Tempo de Resposta:** < 200ms (percentil 95)
- **RTO (Recovery Time Objective):** 2 horas
- **RPO (Recovery Point Objective):** 24 horas

---

## Monitorização Contínua

### 1. Dashboard de Monitorização

#### Acesso Rápido ao Estado do Sistema

```bash
# Script de verificação rápida
cat > /usr/local/bin/booktrack-status << 'EOF'
#!/bin/bash
echo "========================================"
echo "   BookTrack - Status do Sistema"
echo "========================================"
echo ""

# Serviços
echo "SERVIÇOS:"
systemctl is-active nginx && echo "  ✓ Nginx: Running" || echo "  ✗ Nginx: Stopped"
systemctl is-active mysql && echo "  ✓ MySQL: Running" || echo "  ✗ MySQL: Stopped"
pm2 describe booktrack-api &>/dev/null && echo "  ✓ API: Running" || echo "  ✗ API: Stopped"
echo ""

# Recursos
echo "RECURSOS:"
echo "  CPU: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')"
echo "  RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "  Disco: $(df -h / | awk 'NR==2 {print $5 " usado"}')"
echo ""

# Conectividade
echo "CONECTIVIDADE:"
curl -s -o /dev/null -w "  Frontend: HTTP %{http_code}\n" http://localhost/
curl -s -o /dev/null -w "  API: HTTP %{http_code}\n" http://localhost:5000/health
echo ""

# Logs recentes
echo "ERROS RECENTES (últimas 24h):"
echo "  API: $(pm2 logs booktrack-api --nostream --lines 1000 --err | grep -i error | wc -l) erros"
echo "  Nginx: $(sudo grep -i error /var/log/nginx/error.log | grep "$(date +%d/%b/%Y)" | wc -l) erros"
echo ""

echo "========================================"
EOF

chmod +x /usr/local/bin/booktrack-status

# Executar
booktrack-status
```

### 2. Monitorização de Serviços

#### Verificação de Serviços Core

```bash
# Nginx
sudo systemctl status nginx
curl -I http://localhost

# MySQL
sudo systemctl status mysql
mysqladmin -u booktrack_user -p ping
mysqladmin -u booktrack_user -p status

# Backend API
pm2 status
pm2 describe booktrack-api
curl http://localhost:5000/health
```

#### Monitorização com PM2

```bash
# Status detalhado
pm2 status
pm2 monit  # Interface interativa

# Informações da aplicação
pm2 show booktrack-api

# Logs em tempo real
pm2 logs booktrack-api
pm2 logs booktrack-api --err  # Apenas erros
pm2 logs booktrack-api --lines 100  # Últimas 100 linhas

# Métricas
pm2 describe booktrack-api | grep -A 10 "Metadata"
```

### 3. Monitorização de Logs

#### Localização dos Logs

```bash
# Backend API
/var/www/booktrack/backend/logs/app.log
/var/www/booktrack/backend/logs/error.log
~/.pm2/logs/booktrack-api-out.log
~/.pm2/logs/booktrack-api-error.log

# Nginx
/var/log/nginx/access.log
/var/log/nginx/error.log
/var/log/nginx/booktrack-access.log
/var/log/nginx/booktrack-error.log

# MySQL
/var/log/mysql/error.log
/var/log/mysql/slow-query.log

# Sistema
/var/log/syslog
/var/log/auth.log
```

#### Análise de Logs em Tempo Real

```bash
# API - Erros em tempo real
pm2 logs booktrack-api --err --timestamp

# Nginx - Monitorizar acessos
sudo tail -f /var/log/nginx/booktrack-access.log

# Nginx - Monitorizar erros
sudo tail -f /var/log/nginx/booktrack-error.log

# MySQL - Queries lentas
sudo tail -f /var/log/mysql/slow-query.log

# Múltiplos logs simultaneamente
multitail \
  /var/log/nginx/booktrack-error.log \
  ~/.pm2/logs/booktrack-api-error.log
```

#### Procurar Erros Específicos

```bash
# Erros nas últimas 24 horas
sudo grep "$(date +%d/%b/%Y)" /var/log/nginx/error.log | grep -i error

# Erros críticos no backend
pm2 logs booktrack-api --lines 1000 --nostream | grep -i "error\|exception\|fatal"

# Erros de base de dados
sudo grep -i "error" /var/log/mysql/error.log | tail -50

# Requests com 5xx
sudo grep " 5[0-9][0-9] " /var/log/nginx/booktrack-access.log | tail -20

# Tentativas de login falhadas
pm2 logs booktrack-api --lines 1000 --nostream | grep "login failed"
```

### 4. Monitorização de Performance

#### Métricas de Sistema

```bash
# CPU e Memória
htop

# Uso por processo
top -bn1 | head -20

# Memória detalhada
free -h
vmstat 1 10

# Disco
df -h
iostat -x 1 10

# Rede
iftop  # Tráfego em tempo real
netstat -tunlp  # Portas abertas
```

#### Métricas da Aplicação

```bash
# Node.js - Uso de memória
pm2 describe booktrack-api | grep memory

# Node.js - Tempo de uptime
pm2 describe booktrack-api | grep uptime

# Node.js - Restarts
pm2 describe booktrack-api | grep restart

# MySQL - Processos ativos
mysql -u booktrack_user -p -e "SHOW PROCESSLIST;"

# MySQL - Status
mysql -u booktrack_user -p -e "SHOW STATUS LIKE '%thread%';"
mysql -u booktrack_user -p -e "SHOW STATUS LIKE '%connection%';"

# Nginx - Conexões ativas
sudo nginx -V 2>&1 | grep -o with-http_stub_status_module
curl http://localhost/nginx_status  # Se configurado
```

#### Métricas de Performance da API

```bash
# Testar tempo de resposta
time curl -X GET http://localhost:5000/api/livros \
  -H "Authorization: Bearer TOKEN"

# Benchmark simples
ab -n 100 -c 10 http://localhost:5000/health

# Análise de requests lentos
pm2 logs booktrack-api --lines 1000 --nostream | grep "slow query"
```

### 5. Alertas e Notificações

#### Script de Verificação Automática

```bash
# Criar script de health check
cat > /usr/local/bin/booktrack-healthcheck << 'EOF'
#!/bin/bash

ALERT_EMAIL="admin@escola.pt"
LOG_FILE="/var/log/booktrack-healthcheck.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
    log "ALERT: $1"
    echo "$1" | mail -s "BookTrack Alert: $1" "$ALERT_EMAIL"
}

# Verificar Nginx
if ! systemctl is-active --quiet nginx; then
    alert "Nginx está parado!"
    sudo systemctl start nginx
fi

# Verificar MySQL
if ! systemctl is-active --quiet mysql; then
    alert "MySQL está parado!"
    sudo systemctl start mysql
fi

# Verificar API
if ! pm2 describe booktrack-api &>/dev/null; then
    alert "API está parada!"
    cd /var/www/booktrack/backend && pm2 start ecosystem.config.js
fi

# Verificar conectividade API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$HTTP_CODE" != "200" ]; then
    alert "API não responde (HTTP $HTTP_CODE)"
fi

# Verificar espaço em disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    alert "Espaço em disco crítico: ${DISK_USAGE}%"
fi

# Verificar memória
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -gt 90 ]; then
    alert "Memória crítica: ${MEM_USAGE}%"
fi

log "Health check concluído: OK"
EOF

chmod +x /usr/local/bin/booktrack-healthcheck

# Configurar cron (executar a cada 5 minutos)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/booktrack-healthcheck") | crontab -
```

### 6. Métricas de Negócio

#### Queries Úteis para Monitorização

```sql
-- Utilizadores ativos hoje
SELECT COUNT(DISTINCT utilizador_id) as users_hoje
FROM logs_acesso
WHERE DATE(data_acesso) = CURDATE();

-- Empréstimos realizados hoje
SELECT COUNT(*) as emprestimos_hoje
FROM emprestimos
WHERE DATE(data_emprestimo) = CURDATE();

-- Livros disponíveis vs emprestados
SELECT 
    COUNT(*) as total_livros,
    SUM(CASE WHEN disponivel = 1 THEN 1 ELSE 0 END) as disponiveis,
    SUM(CASE WHEN disponivel = 0 THEN 1 ELSE 0 END) as emprestados
FROM livros;

-- Empréstimos em atraso
SELECT COUNT(*) as atrasos
FROM emprestimos
WHERE data_devolucao_prevista < CURDATE()
AND devolvido = 0;

-- Top 5 livros mais requisitados
SELECT l.titulo, COUNT(*) as total_emprestimos
FROM emprestimos e
JOIN livros l ON e.livro_id = l.id
WHERE e.data_emprestimo >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY l.id
ORDER BY total_emprestimos DESC
LIMIT 5;
```

---

## Gestão de Backups

### 1. Estratégia de Backup

#### Tipos de Backup

| Tipo | Frequência | Retenção | Localização |
|------|------------|----------|-------------|
| Base de Dados | Diário (02:00) | 30 dias | /var/www/booktrack/database/backups |
| Ficheiros da Aplicação | Semanal (Domingo 02:00) | 4 semanas | /var/www/booktrack/database/backups |
| Configurações do Sistema | Mensal | 6 meses | /var/www/booktrack/database/backups |
| Offsite (remoto) | Diário | 90 dias | Servidor externo/S3 |

### 2. Backup da Base de Dados

#### Script de Backup Automático

```bash
# Script principal de backup
cat > /var/www/booktrack/scripts/backup-database.sh << 'EOF'
#!/bin/bash

# Configurações
BACKUP_DIR="/var/www/booktrack/database/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="booktrack_production"
DB_USER="booktrack_user"
DB_PASS="SuaPasswordAqui"
RETENTION_DAYS=30

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

# Nome do ficheiro
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Log
LOG_FILE="/var/www/booktrack/logs/backup.log"
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Iniciando backup da base de dados..."

# Realizar backup
mysqldump -u "$DB_USER" -p"$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verificar sucesso
if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup concluído com sucesso: $BACKUP_FILE (Tamanho: $SIZE)"
else
    log "ERRO: Backup falhou!"
    exit 1
fi

# Limpar backups antigos
log "Limpando backups com mais de $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
log "Limpeza concluída"

# Verificar integridade do backup
log "Verificando integridade do backup..."
gunzip -t "$BACKUP_FILE"
if [ $? -eq 0 ]; then
    log "Verificação de integridade: OK"
else
    log "ERRO: Backup corrompido!"
    exit 1
fi

log "Processo de backup concluído"
EOF

chmod +x /var/www/booktrack/scripts/backup-database.sh
```

#### Backup Manual

```bash
# Backup completo
mysqldump -u booktrack_user -p \
  --single-transaction \
  --routines \
  --triggers \
  booktrack_production > backup_manual_$(date +%Y%m%d).sql

# Backup comprimido
mysqldump -u booktrack_user -p \
  --single-transaction \
  booktrack_production | gzip > backup_manual_$(date +%Y%m%d).sql.gz

# Backup de tabela específica
mysqldump -u booktrack_user -p \
  booktrack_production livros > backup_livros_$(date +%Y%m%d).sql
```

### 3. Backup de Ficheiros

```bash
# Script de backup de ficheiros
cat > /var/www/booktrack/scripts/backup-files.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/www/booktrack/database/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/www/booktrack/logs/backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Iniciando backup de ficheiros..."

# Backup do código da aplicação
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
  --exclude='node_modules' \
  --exclude='build' \
  -C /var/www/booktrack \
  backend/src \
  backend/.env.production \
  backend/package.json \
  frontend/src \
  frontend/public

# Backup de uploads
if [ -d "/var/www/booktrack/backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" \
      -C /var/www/booktrack/backend uploads/
fi

# Backup de configurações Nginx
tar -czf "$BACKUP_DIR/nginx_backup_$DATE.tar.gz" \
  /etc/nginx/sites-available/booktrack

log "Backup de ficheiros concluído"
EOF

chmod +x /var/www/booktrack/scripts/backup-files.sh
```

### 4. Restauro de Backups

#### Restaurar Base de Dados

```bash
# Listar backups disponíveis
ls -lh /var/www/booktrack/database/backups/db_backup_*.sql.gz

# Restaurar backup específico
gunzip < /var/www/booktrack/database/backups/db_backup_20260104_020000.sql.gz | \
  mysql -u booktrack_user -p booktrack_production

# Restaurar com confirmação
read -p "Tem certeza que deseja restaurar? (yes/no): " confirm
if [ "$confirm" = "yes" ]; then
    gunzip < /caminho/do/backup.sql.gz | mysql -u booktrack_user -p booktrack_production
    echo "Restauro concluído"
fi
```

#### Restaurar Ficheiros

```bash
# Restaurar código da aplicação
tar -xzf /var/www/booktrack/database/backups/app_backup_20260104_020000.tar.gz -C /

# Restaurar uploads
tar -xzf /var/www/booktrack/database/backups/uploads_backup_20260104_020000.tar.gz \
  -C /var/www/booktrack/backend/

# Restaurar configuração Nginx
tar -xzf /var/www/booktrack/database/backups/nginx_backup_20260104_020000.tar.gz -C /
sudo systemctl reload nginx
```

### 5. Verificação de Backups

```bash
# Script de verificação de backups
cat > /usr/local/bin/verify-backups << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/www/booktrack/database/backups"

echo "Verificação de Backups - $(date)"
echo "=================================="

# Verificar backup do dia
TODAY=$(date +%Y%m%d)
DB_BACKUP=$(find "$BACKUP_DIR" -name "db_backup_${TODAY}_*.sql.gz" | head -1)

if [ -n "$DB_BACKUP" ]; then
    echo "✓ Backup DB encontrado: $(basename $DB_BACKUP)"
    SIZE=$(du -h "$DB_BACKUP" | cut -f1)
    echo "  Tamanho: $SIZE"
    
    # Testar integridade
    if gunzip -t "$DB_BACKUP" 2>/dev/null; then
        echo "  Integridade: OK"
    else
        echo "  Integridade: FALHOU!"
    fi
else
    echo "✗ Backup DB de hoje NÃO encontrado!"
fi

# Listar backups disponíveis
echo ""
echo "Backups disponíveis (últimos 7 dias):"
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime -7 -exec ls -lh {} \; | \
  awk '{print "  " $9 " - " $5}'

echo ""
echo "Espaço usado por backups: $(du -sh $BACKUP_DIR | cut -f1)"
EOF

chmod +x /usr/local/bin/verify-backups
```

### 6. Backup Offsite

```bash
# Configurar rsync para servidor remoto
cat > /var/www/booktrack/scripts/backup-offsite.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/www/booktrack/database/backups"
REMOTE_USER="backup"
REMOTE_HOST="backup.escola.pt"
REMOTE_DIR="/backups/booktrack"

# Sincronizar para servidor remoto
rsync -avz --delete \
  -e "ssh -i /home/booktrack/.ssh/backup_key" \
  "$BACKUP_DIR/" \
  "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

# Ou para AWS S3
# aws s3 sync "$BACKUP_DIR/" s3://escola-backups/booktrack/ --delete
EOF

chmod +x /var/www/booktrack/scripts/backup-offsite.sh
```

### 7. Automatização com Cron

```bash
# Configurar backups automáticos
crontab -e
```

Adicionar:
```cron
# Backup diário da base de dados (02:00)
0 2 * * * /var/www/booktrack/scripts/backup-database.sh

# Backup semanal de ficheiros (Domingo 02:30)
30 2 * * 0 /var/www/booktrack/scripts/backup-files.sh

# Backup offsite (03:00)
0 3 * * * /var/www/booktrack/scripts/backup-offsite.sh

# Verificação de backups (09:00)
0 9 * * * /usr/local/bin/verify-backups | mail -s "BookTrack Backup Report" admin@escola.pt
```

---

## Gestão de Recursos

### 1. Monitorização de CPU

```bash
# Ver uso atual de CPU
top -bn1 | grep "Cpu(s)"

# Top processos por CPU
ps aux --sort=-%cpu | head -10

# Uso de CPU por serviço
systemctl status nginx | grep CPU
systemctl status mysql | grep CPU
pm2 describe booktrack-api | grep cpu

# Histórico (se sar instalado)
sar -u 1 10  # CPU usage cada 1 segundo, 10 vezes
```

#### Alertas de CPU Alta

```bash
# Script de alerta
cat > /usr/local/bin/check-cpu << 'EOF'
#!/bin/bash

CPU_THRESHOLD=80
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' | cut -d. -f1)

if [ "$CPU_USAGE" -gt "$CPU_THRESHOLD" ]; then
    echo "CPU alta detectada: ${CPU_USAGE}%"
    echo "Top processos:"
    ps aux --sort=-%cpu | head -5
    # Enviar alerta
    echo "CPU: ${CPU_USAGE}%" | mail -s "BookTrack: CPU Alta" admin@escola.pt
fi
EOF

chmod +x /usr/local/bin/check-cpu
```

### 2. Monitorização de Memória

```bash
# Ver uso de memória
free -h

# Detalhes de uso
vmstat 1 5

# Processos que mais consomem memória
ps aux --sort=-%mem | head -10

# Memória por serviço
systemctl status mysql | grep Memory
pm2 describe booktrack-api | grep memory
```

#### Limpeza de Cache

```bash
# Limpar cache do sistema (se necessário)
sync
echo 3 | sudo tee /proc/sys/vm/drop_caches

# Verificar melhoria
free -h
```

#### Reiniciar Serviço com Alto Consumo

```bash
# Se Node.js estiver a consumir muita memória
pm2 restart booktrack-api

# Verificar
pm2 describe booktrack-api | grep memory
```

### 3. Monitorização de Disco

```bash
# Espaço em disco
df -h

# Uso por diretório
du -sh /var/www/booktrack/*
du -sh /var/log/*
du -sh /var/lib/mysql/*

# Ficheiros grandes
find /var/www/booktrack -type f -size +100M -exec ls -lh {} \;

# Inodes (importante!)
df -i
```

#### Limpeza de Disco

```bash
# Limpar logs antigos
sudo find /var/log -name "*.log.*" -mtime +30 -delete
sudo find /var/log -name "*.gz" -mtime +30 -delete

# Limpar PM2 logs
pm2 flush

# Limpar cache npm
npm cache clean --force

# Limpar backups antigos (mais de 30 dias)
find /var/www/booktrack/database/backups -name "*.sql.gz" -mtime +30 -delete

# Limpar uploads temporários
find /var/www/booktrack/backend/temp -type f -mtime +7 -delete

# APT cleanup
sudo apt autoremove -y
sudo apt clean
```

### 4. Monitorização de Rede

```bash
# Conexões ativas
netstat -an | grep ESTABLISHED | wc -l

# Conexões por serviço
sudo netstat -tulpn | grep nginx
sudo netstat -tulpn | grep mysql
sudo netstat -tulpn | grep node

# Tráfego de rede
iftop -i eth0

# Bandwidth
vnstat -l  # Real-time
vnstat -d  # Diário
```

### 5. Gestão de Processos

```bash
# Listar processos BookTrack
ps aux | grep -E 'nginx|mysql|node'

# Matar processo travado
sudo kill -9 PID

# Reiniciar serviços
sudo systemctl restart nginx
sudo systemctl restart mysql
pm2 restart booktrack-api

# Reiniciar tudo (em ordem)
pm2 stop all
sudo systemctl restart mysql
sleep 5
pm2 start all
sudo systemctl reload nginx
```

### 6. Otimização de Performance

#### MySQL Tuning

```bash
# Verificar variáveis MySQL
mysql -u booktrack_user -p -e "SHOW VARIABLES LIKE '%buffer%';"
mysql -u booktrack_user -p -e "SHOW STATUS LIKE '%connection%';"

# Otimizar tabelas
mysql -u booktrack_user -p booktrack_production << EOF
OPTIMIZE TABLE utilizadores;
OPTIMIZE TABLE livros;
OPTIMIZE TABLE emprestimos;
OPTIMIZE TABLE reservas;
EOF

# Analisar queries lentas
sudo mysqldumpslow /var/log/mysql/slow-query.log | head -20
```

#### Node.js/PM2 Tuning

```bash
# Ajustar número de instâncias (cluster mode)
pm2 scale booktrack-api 4  # 4 instâncias

# Ajustar memória máxima
pm2 delete booktrack-api
pm2 start ecosystem.config.js --env production --node-args="--max-old-space-size=512"
pm2 save

# Recarregar sem downtime
pm2 reload booktrack-api
```

---

## Procedimentos de Incidentes

### 1. Classificação de Incidentes

| Severidade | Descrição | Tempo de Resposta | Exemplo |
|------------|-----------|-------------------|---------|
| **P1 - Crítico** | Sistema completamente indisponível | Imediato (< 15 min) | Site down, DB inacessível |
| **P2 - Alto** | Funcionalidade principal afetada | < 1 hora | Login falha, empréstimos não funcionam |
| **P3 - Médio** | Funcionalidade secundária afetada | < 4 horas | Pesquisa lenta, relatórios com erro |
| **P4 - Baixo** | Problema menor ou cosmético | < 24 horas | Texto errado, formatação |

### 2. Procedimento de Resposta a Incidentes

#### Passo 1: Deteção e Alerta

```bash
# Verificar alerta recebido
# - Email de monitoring
# - Alerta de utilizador
# - Dashboard de monitorização

# Confirmar incidente
booktrack-status
curl -I https://booktrack.pt
curl http://localhost:5000/health
```

#### Passo 2: Avaliação Inicial

```bash
# Determinar severidade
# - Site acessível? (Sim/Não)
# - API responde? (Sim/Não)
# - Base de dados conecta? (Sim/Não)
# - Quantos utilizadores afetados? (Todos/Alguns/Poucos)

# Registar incidente
echo "[$(date)] INCIDENTE: Site indisponível - Severidade: P1" >> /var/log/booktrack-incidents.log
```

#### Passo 3: Contenção e Diagnóstico

```bash
# Ver logs recentes
pm2 logs booktrack-api --err --lines 100
sudo tail -100 /var/log/nginx/error.log
sudo tail -100 /var/log/mysql/error.log

# Verificar recursos
df -h  # Disco cheio?
free -h  # Sem memória?
top  # CPU a 100%?

# Verificar serviços
sudo systemctl status nginx mysql
pm2 status
```

#### Passo 4: Resolução

Ver secção [Troubleshooting Operacional](#troubleshooting-operacional) para procedimentos específicos.

#### Passo 5: Comunicação

```bash
# Notificar stakeholders
echo "Sistema em manutenção. Tempo estimado: 30 min" | mail -s "BookTrack: Manutenção" utilizadores@escola.pt
```

#### Passo 6: Documentação

```bash
# Registar resolução
cat >> /var/log/booktrack-incidents.log << EOF
[$(date)] INCIDENTE RESOLVIDO
- Causa: Disco cheio (logs antigos)
- Ação: Limpeza de logs
- Duração: 25 minutos
- Responsável: João Silva
EOF
```

### 3. Incidentes Comuns e Resoluções

#### Incidente 1: Site Completamente Down

**Sintomas:**
- Site não carrega (timeout ou 502/503)
- Utilizadores não conseguem aceder

**Diagnóstico:**
```bash
# 1. Verificar Nginx
sudo systemctl status nginx
curl -I http://localhost

# 2. Verificar Backend
pm2 status
curl http://localhost:5000/health

# 3. Ver logs
sudo tail -50 /var/log/nginx/error.log
pm2 logs booktrack-api --err --lines 50
```

**Resolução:**
```bash
# Se Nginx parado
sudo systemctl start nginx

# Se Backend parado
cd /var/www/booktrack/backend
pm2 restart booktrack-api

# Se nada funciona - Restart completo
pm2 stop all
sudo systemctl restart mysql
sleep 10
pm2 start all
sudo systemctl restart nginx

# Verificar
curl https://booktrack.pt
```

**Tempo Esperado:** 5-10 minutos  
**Severidade:** P1 - Crítico

#### Incidente 2: Base de Dados Inacessível

**Sintomas:**
- Erro: "Cannot connect to database"
- API retorna 500
- Logs mostram "ECONNREFUSED"

**Diagnóstico:**
```bash
sudo systemctl status mysql
mysql -u booktrack_user -p -e "SELECT 1;"
```

**Resolução:**
```bash
# Iniciar MySQL
sudo systemctl start mysql

# Se não iniciar - verificar logs
sudo tail -100 /var/log/mysql/error.log

# Problema comum: disco cheio
df -h
# Se disco cheio, limpar logs
sudo find /var/log -name "*.log.*" -mtime +7 -delete

# Reiniciar MySQL
sudo systemctl restart mysql

# Reiniciar backend
pm2 restart booktrack-api
```

**Tempo Esperado:** 10-15 minutos  
**Severidade:** P1 - Crítico

#### Incidente 3: Performance Degradada

**Sintomas:**
- Site lento (> 5 segundos para carregar)
- Timeouts ocasionais
- Utilizadores reportam lentidão

**Diagnóstico:**
```bash
# Verificar recursos
top
free -h
df -h

# Verificar queries MySQL
mysql -u booktrack_user -p -e "SHOW PROCESSLIST;"

# Ver queries lentas
sudo tail -50 /var/log/mysql/slow-query.log
```

**Resolução:**
```bash
# Se CPU alta
ps aux --sort=-%cpu | head -5
# Identificar processo problemático

# Se memória cheia
free -h
pm2 restart booktrack-api  # Liberta memória

# Se MySQL lento
mysql -u booktrack_user -p booktrack_production << EOF
KILL query_id;  # Matar query travada
OPTIMIZE TABLE livros;
EOF

# Reiniciar serviços se necessário
pm2 reload booktrack-api
```

**Tempo Esperado:** 15-30 minutos  
**Severidade:** P2 - Alto

#### Incidente 4: SSL Certificado Expirado

**Sintomas:**
- Browser mostra "Certificado inválido"
- HTTPS não funciona

**Diagnóstico:**
```bash
sudo certbot certificates
openssl s_client -connect booktrack.pt:443 -servername booktrack.pt
```

**Resolução:**
```bash
# Renovar certificado
sudo certbot renew
sudo systemctl reload nginx

# Se falhar
sudo certbot certonly --nginx -d booktrack.pt -d www.booktrack.pt --force-renewal
sudo systemctl reload nginx
```

**Tempo Esperado:** 10 minutos  
**Severidade:** P1 - Crítico

#### Incidente 5: Utilizadores Não Conseguem Fazer Login

**Sintomas:**
- Erro ao tentar login
- Credenciais corretas mas falha

**Diagnóstico:**
```bash
# Ver logs de login
pm2 logs booktrack-api --lines 200 | grep -i "login\|auth"

# Testar manualmente
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'
```

**Resolução:**
```bash
# Se erro de JWT
# Verificar JWT_SECRET no .env
cat /var/www/booktrack/backend/.env | grep JWT

# Se erro de base de dados
mysql -u booktrack_user -p booktrack_production -e "SELECT * FROM utilizadores LIMIT 1;"

# Reiniciar backend
pm2 restart booktrack-api
```

**Tempo Esperado:** 15-20 minutos  
**Severidade:** P2 - Alto

---

## Manutenção Preventiva

### 1. Checklist Diária

```bash
#!/bin/bash
# Script: daily-checks.sh

echo "=== Checklist Diária BookTrack ==="
echo "Data: $(date)"
echo ""

# 1. Status dos serviços
echo "1. Serviços:"
systemctl is-active nginx && echo "   ✓ Nginx" || echo "   ✗ Nginx"
systemctl is-active mysql && echo "   ✓ MySQL" || echo "   ✗ MySQL"
pm2 describe booktrack-api &>/dev/null && echo "   ✓ API" || echo "   ✗ API"

# 2. Recursos
echo ""
echo "2. Recursos:"
echo "   CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print 100-$8"%"}')"
echo "   RAM: $(free -h | awk '/^Mem:/ {print $3"/"$2}')"
echo "   Disco: $(df -h / | awk 'NR==2 {print $5}')"

# 3. Erros recentes
echo ""
echo "3. Erros (últimas 24h):"
NGINX_ERRORS=$(sudo grep "$(date +%d/%b/%Y)" /var/log/nginx/error.log | wc -l)
echo "   Nginx: $NGINX_ERRORS erros"

# 4. Backup verificado
echo ""
echo "4. Backup:"
LAST_BACKUP=$(find /var/www/booktrack/database/backups -name "db_backup_*.sql.gz" -mtime -1 | wc -l)
if [ "$LAST_BACKUP" -gt 0 ]; then
    echo "   ✓ Backup de hoje existe"
else
    echo "   ✗ Backup de hoje NÃO encontrado!"
fi

# 5. Certificado SSL
echo ""
echo "5. SSL:"
SSL_DAYS=$(sudo certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | awk '{print $3}')
echo "   Expira em: $SSL_DAYS"

echo ""
echo "==================================="
```

Configurar para executar diariamente:
```bash
chmod +x /var/www/booktrack/scripts/daily-checks.sh

# Adicionar ao cron (executar às 08:00 e enviar por email)
crontab -e
# Adicionar:
0 8 * * * /var/www/booktrack/scripts/daily-checks.sh | mail -s "BookTrack: Daily Report" admin@escola.pt
```

### 2. Checklist Semanal

**Domingo, durante janela de manutenção (02:00-04:00):**

```bash
#!/bin/bash
# Script: weekly-maintenance.sh

echo "=== Manutenção Semanal BookTrack ==="

# 1. Atualizar sistema (apenas pacotes de segurança)
echo "1. Atualizações de segurança..."
sudo apt update
sudo apt upgrade -y --security-only

# 2. Otimizar base de dados
echo "2. Otimizando base de dados..."
mysql -u booktrack_user -p"$DB_PASSWORD" booktrack_production << EOF
OPTIMIZE TABLE utilizadores;
OPTIMIZE TABLE livros;
OPTIMIZE TABLE emprestimos;
OPTIMIZE TABLE reservas;
ANALYZE TABLE utilizadores;
ANALYZE TABLE livros;
EOF

# 3. Limpar logs antigos
echo "3. Limpando logs antigos..."
sudo find /var/log -name "*.log.*" -mtime +14 -delete
pm2 flush

# 4. Verificar integridade dos backups
echo "4. Verificando backups..."
LATEST_BACKUP=$(find /var/www/booktrack/database/backups -name "db_backup_*.sql.gz" | sort | tail -1)
gunzip -t "$LATEST_BACKUP" && echo "   ✓ Backup íntegro" || echo "   ✗ Backup corrompido!"

# 5. Reiniciar serviços (graceful)
echo "5. Reiniciando serviços..."
pm2 reload booktrack-api
sudo systemctl reload nginx

# 6. Verificar uso de disco
echo "6. Uso de disco:"
df -h /

echo "=== Manutenção Concluída ==="
```

### 3. Checklist Mensal

**Primeira Domingo do mês:**

1. **Atualizar dependências Node.js:**
```bash
cd /var/www/booktrack/backend
npm outdated
# Avaliar atualizações críticas
# npm update
```

2. **Renovar certificado SSL (automático, mas verificar):**
```bash
sudo certbot renew --dry-run
```

3. **Análise de performance:**
```bash
# Queries mais lentas do mês
sudo mysqldumpslow -s t -t 10 /var/log/mysql/slow-query.log

# Endpoints mais chamados
sudo awk '{print $7}' /var/log/nginx/booktrack-access.log | sort | uniq -c | sort -rn | head -10
```

4. **Verificar espaço para crescimento:**
```bash
# Previsão de crescimento de disco
echo "Crescimento últimos 30 dias:"
du -sh /var/lib/mysql
du -sh /var/www/booktrack/backend/uploads
```

5. **Teste de disaster recovery:**
```bash
# Testar restauro de backup em ambiente de teste
# (uma vez por mês)
```

### 4. Rotação de Logs

Configurar `/etc/logrotate.d/booktrack`:
```
/var/www/booktrack/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 booktrack booktrack
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Troubleshooting Operacional

### Problema 1: Alto Uso de CPU

**Diagnóstico:**
```bash
# Identificar processo
top -bn1 | head -20
ps aux --sort=-%cpu | head -10

# Se for Node.js
pm2 monit
pm2 describe booktrack-api | grep cpu
```

**Resolução:**
```bash
# Verificar se há query pesada rodando
mysql -u booktrack_user -p -e "SHOW PROCESSLIST;"

# Reiniciar aplicação
pm2 restart booktrack-api

# Se persistir - reduzir instâncias
pm2 scale booktrack-api 2
```

### Problema 2: Memória Esgotada

**Diagnóstico:**
```bash
free -h
ps aux --sort=-%mem | head -10
```

**Resolução:**
```bash
# Reiniciar aplicação (liberta memória)
pm2 restart booktrack-api

# Limpar cache se necessário
sync; echo 3 | sudo tee /proc/sys/vm/drop_caches

# Ajustar limite de memória
pm2 delete booktrack-api
pm2 start ecosystem.config.js --env production
```

### Problema 3: Disco Cheio

**Diagnóstico:**
```bash
df -h
du -sh /var/* | sort -h
du -sh /var/www/booktrack/* | sort -h
```

**Resolução:**
```bash
# Limpar logs
sudo find /var/log -name "*.log.*" -mtime +7 -delete
pm2 flush

# Limpar backups antigos
find /var/www/booktrack/database/backups -mtime +30 -delete

# Limpar cache APT
sudo apt clean

# Se MySQL muito grande
sudo du -sh /var/lib/mysql/*
# Avaliar purge de logs binários
```

### Problema 4: Muitas Conexões MySQL

**Diagnóstico:**
```bash
mysql -u booktrack_user -p -e "SHOW STATUS LIKE '%connection%';"
mysql -u booktrack_user -p -e "SHOW PROCESSLIST;"
```

**Resolução:**
```bash
# Matar conexões idle antigas
mysql -u booktrack_user -p << EOF
SELECT CONCAT('KILL ', id, ';')
FROM INFORMATION_SCHEMA.PROCESSLIST
WHERE TIME > 300 AND COMMAND = 'Sleep';
EOF

# Reiniciar backend (recria connection pool)
pm2 restart booktrack-api
```

### Problema 5: Logs Não Aparecem

**Diagnóstico:**
```bash
# Verificar permissões
ls -la /var/www/booktrack/backend/logs/
ls -la ~/.pm2/logs/

# Verificar rotação
cat /etc/logrotate.d/booktrack
```

**Resolução:**
```bash
# Recriar diretórios se necessário
mkdir -p /var/www/booktrack/backend/logs
chown booktrack:booktrack /var/www/booktrack/backend/logs

# Recarregar logs PM2
pm2 reloadLogs
```

---

## Procedimentos de Escalamento

### Nível 1: Suporte Inicial

**Responsabilidades:**
- Monitorização básica
- Resposta a alertas
- Troubleshooting simples
- Restart de serviços

**Quando Escalar para Nível 2:**
- Incidente P1 não resolvido em 15 minutos
- Incidente P2 não resolvido em 1 hora
- Incidente recorrente
- Problema desconhecido

### Nível 2: Administrador de Sistemas

**Responsabilidades:**
- Análise detalhada de logs
- Troubleshooting avançado
- Alterações de configuração
- Otimização de performance

**Quando Escalar para Nível 3:**
- Problema de código da aplicação
- Bug confirmado
- Necessidade de alteração no código
- Problema de arquitetura

### Nível 3: Desenvolvimento

**Responsabilidades:**
- Análise de código
- Fix de bugs
- Mudanças na aplicação
- Releases de hotfix

### Escalamento Urgente

**Contatos de Emergência:**
```
Level 1 (On-call): +351 XXX XXX XXX
Level 2 (Sysadmin): +351 YYY YYY YYY
Level 3 (Dev Lead): +351 ZZZ ZZZ ZZZ

Email de Emergência: oncall@escola.pt
Slack: #booktrack-incidents
```

---

## Contactos e Responsabilidades

### Equipa de Operações

| Função | Nome | Contacto | Horário |
|--------|------|----------|---------|
| Administrador Principal | João Silva | joao.silva@escola.pt | 09:00-18:00 |
| Administrador Backup | Maria Santos | maria.santos@escola.pt | 09:00-18:00 |
| On-Call (Noite/Fim-semana) | Rotativo | oncall@escola.pt | 24/7 |

### Contactos Externos

| Serviço | Contacto | Notas |
|---------|----------|-------|
| Hosting Provider | support@provider.com | SLA: 2h resposta |
| DNS Provider | dns@provider.com | - |
| SSL/Certbot | - | Automático |

### Documentação

- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Installation Manual:** `INSTALLATION_MANUAL.md`
- **Operations Manual:** Este documento
- **Runbook:** `/docs/runbook.md`

---

**Fim do Manual de Operações**

Última Atualização: Janeiro 2026  
Próxima Revisão: Julho 2026
