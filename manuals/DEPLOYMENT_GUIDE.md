# Guia de Deployment - BookTrack

**Versão:** 1.0  
**Data:** Janeiro 2026  
**Projeto:** Sistema de Gestão de Biblioteca Escolar (Frontend + Backend Completo)

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Arquitetura de Deployment](#arquitetura-de-deployment)
4. [Ambientes](#ambientes)
5. [Configuração Inicial](#configuração-inicial)
6. [Processo de Deploy](#processo-de-deploy)
7. [Estratégias de Implantação](#estratégias-de-implantação)
8. [Scripts de Deployment](#scripts-de-deployment)
9. [Pipeline CI/CD](#pipeline-cicd)
10. [Monitorização e Logs](#monitorização-e-logs)
11. [Rollback](#rollback)
12. [Troubleshooting](#troubleshooting)
13. [Checklist de Deploy](#checklist-de-deploy)

---

## Visão Geral

O BookTrack é composto por duas aplicações principais:
- **Frontend:** Aplicação React (SPA - Single Page Application)
- **Backend:** API REST em Node.js/Express com base de dados MySQL

Este guia fornece instruções detalhadas para realizar o deployment completo do sistema em diferentes ambientes.

### Componentes do Sistema

```
┌─────────────────┐
│   Utilizador    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Frontend React │ ← Servidor Web (Nginx/Apache)
│   (Port 80/443) │
└────────┬────────┘
         │ API Calls
         ▼
┌─────────────────┐
│  Backend API    │ ← Node.js/Express
│   (Port 5000)   │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│  MySQL Database │
│   (Port 3306)   │
└─────────────────┘
```

---

## Pré-requisitos

### Requisitos de Software

#### Para Desenvolvimento/Staging

| Componente | Versão Mínima | Versão Recomendada |
|------------|---------------|--------------------|
| Node.js    | 16.x          | 18.x ou superior   |
| npm        | 8.x           | 9.x ou superior    |
| MySQL      | 5.7           | 8.0 ou superior    |
| Git        | 2.30+         | Última versão      |

#### Para Produção

| Componente      | Versão Mínima | Descrição                  |
|-----------------|---------------|----------------------------|
| Node.js         | 18.x LTS      | Runtime do backend         |
| PM2             | 5.x           | Gestor de processos        |
| Nginx           | 1.18+         | Servidor web/proxy reverso |
| MySQL           | 8.0+          | Base de dados              |
| SSL Certificate | -             | Para HTTPS (Let's Encrypt) |

### Requisitos de Hardware (Produção)

**Mínimo:**
- CPU: 2 cores
- RAM: 4GB
- Disco: 20GB SSD
- Largura de banda: 100Mbps

**Recomendado:**
- CPU: 4 cores
- RAM: 8GB
- Disco: 50GB SSD
- Largura de banda: 1Gbps

### Acesso Necessário

- [ ] Acesso SSH ao servidor
- [ ] Credenciais de base de dados
- [ ] Domínio configurado (DNS)
- [ ] Certificado SSL (ou acesso para gerar via Let's Encrypt)
- [ ] Acesso ao repositório Git
- [ ] Variáveis de ambiente configuradas

---

## Arquitetura de Deployment

### Estrutura de Diretórios no Servidor

```
/var/www/booktrack/
├── frontend/
│   ├── build/              # Build de produção React
│   ├── .env.production     # Variáveis de ambiente
│   └── nginx.conf          # Configuração Nginx
│
├── backend/
│   ├── src/                # Código fonte
│   ├── node_modules/       # Dependências
│   ├── .env.production     # Variáveis de ambiente
│   ├── ecosystem.config.js # Configuração PM2
│   └── logs/               # Logs da aplicação
│
├── database/
│   ├── migrations/         # Migrações SQL
│   ├── seeds/              # Dados iniciais
│   └── backups/            # Backups da BD
│
└── scripts/
    ├── deploy.sh           # Script principal de deploy
    ├── backup.sh           # Script de backup
    └── rollback.sh         # Script de rollback
```

---

## Ambientes

### Ambiente de Desenvolvimento (Local)

**Configuração:**
```bash
# Frontend
PORT=3000
REACT_APP_API_URL=http://localhost:5000

# Backend
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=booktrack_dev
JWT_SECRET=dev_secret_key_change_in_production
```

**Como executar:**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (novo terminal)
cd frontend
npm install
npm start
```

### Ambiente de Staging

**Propósito:** Testes finais antes de produção

**Configuração:**
```bash
# Frontend
REACT_APP_API_URL=https://staging-api.booktrack.pt

# Backend
PORT=5000
NODE_ENV=staging
DB_HOST=staging-db.internal
DB_NAME=booktrack_staging
# ... outras variáveis
```

**URL:** `https://staging.booktrack.pt`

### Ambiente de Produção

**Configuração:**
```bash
# Frontend
REACT_APP_API_URL=https://api.booktrack.pt

# Backend
PORT=5000
NODE_ENV=production
DB_HOST=prod-db.internal
DB_NAME=booktrack_production
# ... outras variáveis
```

**URL:** `https://booktrack.pt`

---

## Configuração Inicial

### 1. Preparação do Servidor

#### 1.1 Atualizar Sistema

```bash
# Ubuntu/Debian
sudo apt update
sudo apt upgrade -y

# Instalar utilitários essenciais
sudo apt install -y git curl wget build-essential
```

#### 1.2 Instalar Node.js

```bash
# Instalar via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v18.x.x
npm --version   # Deve mostrar 9.x.x ou superior
```

#### 1.3 Instalar MySQL

```bash
# Instalar MySQL Server
sudo apt install -y mysql-server

# Configurar MySQL
sudo mysql_secure_installation

# Criar base de dados e utilizador
sudo mysql -u root -p
```

```sql
-- No prompt MySQL
CREATE DATABASE booktrack_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'booktrack_user'@'localhost' IDENTIFIED BY 'PASSWORD_SEGURA_AQUI';

GRANT ALL PRIVILEGES ON booktrack_production.* TO 'booktrack_user'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

#### 1.4 Instalar PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar PM2 para iniciar no boot
pm2 startup systemd
# Executar o comando que PM2 sugere

# Salvar configuração
pm2 save
```

#### 1.5 Instalar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar e ativar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### 2. Clonar Repositório

```bash
# Criar diretório para aplicação
sudo mkdir -p /var/www/booktrack
sudo chown -R $USER:$USER /var/www/booktrack

# Clonar repositório
cd /var/www/booktrack
git clone https://github.com/YOUR_USERNAME/booktrack.git .

# Criar branches se necessário
git checkout -b production origin/main
```

### 3. Configurar Variáveis de Ambiente

#### 3.1 Backend

```bash
# Criar ficheiro .env para backend
cd /var/www/booktrack/backend
nano .env.production
```

```bash
# === SERVIDOR ===
PORT=5000
NODE_ENV=production

# === BASE DE DADOS ===
DB_HOST=localhost
DB_PORT=3306
DB_USER=booktrack_user
DB_PASSWORD=PASSWORD_SEGURA_AQUI
DB_NAME=booktrack_production

# === AUTENTICAÇÃO ===
JWT_SECRET=GERAR_STRING_ALEATORIA_SEGURA_256_BITS
JWT_EXPIRES_IN=24h

# === CORS ===
CORS_ORIGIN=https://booktrack.pt

# === LOGS ===
LOG_LEVEL=info
LOG_FILE=/var/www/booktrack/backend/logs/app.log
```

**Gerar JWT Secret:**
```bash
# Gerar string aleatória segura
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 3.2 Frontend

```bash
# Criar ficheiro .env para frontend
cd /var/www/booktrack
nano .env.production
```

```bash
REACT_APP_API_URL=https://api.booktrack.pt
REACT_APP_ENV=production
```

### 4. Instalar Dependências

```bash
# Backend
cd /var/www/booktrack/backend
npm ci --production

# Frontend
cd /var/www/booktrack
npm ci
```

### 5. Executar Migrações de Base de Dados

```bash
cd /var/www/booktrack/database

# Executar migrações
mysql -u booktrack_user -p booktrack_production < migrations/001_create_tables.sql
mysql -u booktrack_user -p booktrack_production < migrations/002_add_indexes.sql

# Opcional: Dados iniciais (seed)
mysql -u booktrack_user -p booktrack_production < seeds/001_initial_data.sql
```

### 6. Configurar Nginx

#### 6.1 Criar Configuração do Site

```bash
# Criar ficheiro de configuração
sudo nano /etc/nginx/sites-available/booktrack
```

```nginx
# /etc/nginx/sites-available/booktrack
# Configuração Nginx para BookTrack

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name booktrack.pt www.booktrack.pt;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

# Servidor HTTPS - Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name booktrack.pt www.booktrack.pt;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/booktrack.pt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/booktrack.pt/privkey.pem;
    
    # Configuração SSL Moderna (Mozilla SSL Configuration Generator)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Root do Frontend (build React)
    root /var/www/booktrack/frontend/build;
    index index.html;

    # Logs
    access_log /var/log/nginx/booktrack-access.log;
    error_log /var/log/nginx/booktrack-error.log;

    # Segurança Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Cache para assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router - todas as rotas vão para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}

# Servidor HTTPS - API Backend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.booktrack.pt;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/booktrack.pt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/booktrack.pt/privkey.pem;
    
    # Configuração SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Logs
    access_log /var/log/nginx/booktrack-api-access.log;
    error_log /var/log/nginx/booktrack-api-error.log;

    # Proxy para Backend Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # Headers necessários
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

#### 6.2 Ativar Site e Testar

```bash
# Criar symlink para sites-enabled
sudo ln -s /etc/nginx/sites-available/booktrack /etc/nginx/sites-enabled/

# Remover site default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se OK, recarregar Nginx
sudo systemctl reload nginx
```

### 7. Configurar PM2

#### 7.1 Criar Ficheiro de Configuração PM2

```bash
# Criar ecosystem.config.js
cd /var/www/booktrack/backend
nano ecosystem.config.js
```

```javascript
// ecosystem.config.js
// Configuração PM2 para BookTrack API

module.exports = {
  apps: [{
    // Informações básicas
    name: 'booktrack-api',
    script: './src/server.js',
    
    // Instâncias
    instances: 2,  // Número de instâncias (cluster mode)
    exec_mode: 'cluster',  // ou 'fork' para uma única instância
    
    // Ambiente
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Auto-restart
    watch: false,  // Não usar em produção
    max_memory_restart: '500M',  // Reinicia se exceder 500MB
    
    // Logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/www/booktrack/backend/logs/error.log',
    out_file: '/var/www/booktrack/backend/logs/output.log',
    merge_logs: true,
    
    // Gestão de erros
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Reload graceful
    listen_timeout: 10000,
    kill_timeout: 5000,
    
    // Variáveis adicionais
    instance_var: 'INSTANCE_ID',
    
    // Cron restart (opcional - reinicia todos os dias às 4h)
    cron_restart: '0 4 * * *',
    
    // Configurações de cluster
    wait_ready: true,
    shutdown_with_message: true
  }]
};
```

#### 7.2 Iniciar Aplicação com PM2

```bash
# Iniciar em modo produção
cd /var/www/booktrack/backend
pm2 start ecosystem.config.js --env production

# Salvar configuração para auto-start
pm2 save

# Verificar status
pm2 status
pm2 logs booktrack-api --lines 50
```

### 8. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado (método manual primeiro)
sudo certbot certonly --nginx -d booktrack.pt -d www.booktrack.pt -d api.booktrack.pt

# Seguir instruções interativas
# Email: seu-email@exemplo.com
# Aceitar termos de serviço
# Verificar domínios

# Testar renovação automática
sudo certbot renew --dry-run

# Certificados ficam em:
# /etc/letsencrypt/live/booktrack.pt/fullchain.pem
# /etc/letsencrypt/live/booktrack.pt/privkey.pem

# Configurar renovação automática (já está configurado por padrão)
sudo systemctl status certbot.timer
```

---

## Configuração de Segurança

### 1. Configurar Firewall (UFW)

```bash
# Instalar UFW (se não estiver instalado)
sudo apt install -y ufw

# Configurar regras básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (IMPORTANTE: fazer antes de ativar!)
sudo ufw allow 22/tcp
# Ou específico: sudo ufw allow from SUA_IP_FIXA to any port 22

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar regras
sudo ufw show added

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status verbose
```

### 2. Configurar Fail2Ban (Proteção contra Brute Force)

```bash
# Instalar Fail2Ban
sudo apt install -y fail2ban

# Criar configuração local
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

Adicionar/modificar:
```ini
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

```bash
# Reiniciar Fail2Ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Verificar status
sudo fail2ban-client status
```

### 3. Hardening MySQL

```bash
# Conectar ao MySQL
sudo mysql -u root -p
```

```sql
-- Remover utilizadores anónimos
DELETE FROM mysql.user WHERE User='';

-- Remover base de dados de teste
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Permitir apenas conexões locais para utilizador booktrack
UPDATE mysql.user SET Host='localhost' WHERE User='booktrack_user';

-- Aplicar mudanças
FLUSH PRIVILEGES;

-- Verificar utilizadores
SELECT User, Host FROM mysql.user;
```

Configurar `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
# Bind apenas a localhost (não expor externamente)
bind-address = 127.0.0.1

# Desativar LOAD DATA LOCAL
local-infile = 0

# Log de queries lentas
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

```bash
# Reiniciar MySQL
sudo systemctl restart mysql
```

### 4. Variáveis de Ambiente Seguras

```bash
# Proteger ficheiro .env
cd /var/www/booktrack/backend
chmod 600 .env.production
chown $USER:$USER .env.production

# Nunca commitar .env para Git
echo ".env*" >> .gitignore
```

### 5. Rate Limiting no Backend

Adicionar ao backend (`src/middleware/rateLimiter.js`):
```javascript
const rateLimit = require('express-rate-limit');

// Rate limiter geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiados pedidos, tente novamente mais tarde.'
});

// Rate limiter para login (mais restritivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Apenas 5 tentativas de login
  message: 'Demasiadas tentativas de login. Bloqueado por 15 minutos.'
});

module.exports = { generalLimiter, loginLimiter };
```

---

## Tuning de Performance

### 1. Otimização MySQL

Editar `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Configurações de performance para 4GB RAM

# Buffer Pool (50-70% da RAM disponível para MySQL)
innodb_buffer_pool_size = 2G
innodb_buffer_pool_instances = 2

# Log Buffer
innodb_log_file_size = 256M
innodb_log_buffer_size = 16M
innodb_flush_log_at_trx_commit = 2

# Thread e Conexões
max_connections = 200
thread_cache_size = 50

# Query Cache (desativado no MySQL 8.0+)
# query_cache_type = 1
# query_cache_size = 128M

# Tabelas temporárias
tmp_table_size = 64M
max_heap_table_size = 64M

# Ordenação
sort_buffer_size = 2M
read_buffer_size = 1M
read_rnd_buffer_size = 2M

# Timeouts
wait_timeout = 600
interactive_timeout = 600
```

```bash
# Reiniciar MySQL
sudo systemctl restart mysql
```

### 2. Otimização Node.js/PM2

```javascript
// ecosystem.config.js - configuração otimizada

module.exports = {
  apps: [{
    name: 'booktrack-api',
    script: './src/server.js',
    
    // Cluster mode - usar todos os CPUs
    instances: 'max',  // Automaticamente detecta CPUs
    exec_mode: 'cluster',
    
    // Gestão de memória
    max_memory_restart: '400M',
    
    // Node.js optimizations
    node_args: [
      '--max-old-space-size=512',  // 512MB heap
      '--optimize-for-size'         // Otimizar memória
    ],
    
    // Restart inteligente
    min_uptime: '30s',
    max_restarts: 5,
    autorestart: true,
    
    // Graceful reload
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true
  }]
};
```

### 3. Otimização Nginx

Editar `/etc/nginx/nginx.conf`:

```nginx
user www-data;
worker_processes auto;  # Usa todos os CPUs
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

events {
    worker_connections 4096;  # Aumentar conexões por worker
    use epoll;  # Linux otimizado
    multi_accept on;
}

http {
    # Básico
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;  # Esconder versão Nginx

    # Buffer sizes
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 10M;  # Upload máximo
    large_client_header_buffers 2 1k;

    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;
    gzip_disable "msie6";

    # Cache de ficheiros abertos
    open_file_cache max=10000 inactive=30s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Include sites
    include /etc/nginx/mime.types;
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

---

## Disaster Recovery Plan

### 1. Estratégia de Backup

#### Backups Automáticos Diários

Criar script `/var/www/booktrack/scripts/daily-backup.sh`:

```bash
#!/bin/bash
# Backup diário automático

BACKUP_DIR="/var/www/booktrack/database/backups"
DATE=$(date +%Y%m%d)
RETENTION_DAYS=30

# Backup da Base de Dados
echo "Iniciando backup da base de dados..."
mysqldump -u booktrack_user -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  booktrack_production | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"

# Backup dos ficheiros da aplicação
echo "Backup dos ficheiros..."
tar -czf "$BACKUP_DIR/app-$DATE.tar.gz" \
  /var/www/booktrack/backend/src \
  /var/www/booktrack/backend/.env.production \
  /var/www/booktrack/frontend/build

# Backup da configuração Nginx
echo "Backup da configuração Nginx..."
tar -czf "$BACKUP_DIR/nginx-$DATE.tar.gz" /etc/nginx/sites-available/

# Limpar backups antigos
echo "Limpando backups antigos..."
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup concluído: $DATE"
```

#### Configurar Cron

```bash
# Tornar script executável
chmod +x /var/www/booktrack/scripts/daily-backup.sh

# Adicionar ao cron
crontab -e
```

Adicionar:
```cron
# Backup diário às 2h da manhã
0 2 * * * /var/www/booktrack/scripts/daily-backup.sh >> /var/www/booktrack/logs/backup.log 2>&1

# Reiniciar PM2 semanalmente (Domingo às 3h)
0 3 * * 0 /usr/local/bin/pm2 restart all
```

### 2. Backup Offsite (Recomendado)

```bash
# Usar rsync para servidor remoto
rsync -avz --delete \
  /var/www/booktrack/database/backups/ \
  user@backup-server:/backups/booktrack/

# Ou AWS S3
aws s3 sync /var/www/booktrack/database/backups/ \
  s3://booktrack-backups/
```

### 3. Procedimento de Recuperação Completa

```bash
# 1. Restaurar Base de Dados
gunzip < backup-YYYYMMDD.sql.gz | \
  mysql -u booktrack_user -p booktrack_production

# 2. Restaurar Aplicação
cd /var/www/booktrack
tar -xzf backups/app-YYYYMMDD.tar.gz -C /

# 3. Restaurar Nginx
tar -xzf backups/nginx-YYYYMMDD.tar.gz -C /

# 4. Reiniciar serviços
pm2 restart all
sudo systemctl restart nginx

# 5. Verificar
curl https://api.booktrack.pt/health
curl https://booktrack.pt
```

---

## Manutenção Regular

### Checklist Semanal

```bash
# 1. Verificar espaço em disco
df -h

# 2. Verificar uso de memória
free -h

# 3. Verificar logs por erros
sudo tail -100 /var/log/nginx/error.log
pm2 logs --err --lines 100

# 4. Verificar status dos serviços
sudo systemctl status nginx
sudo systemctl status mysql
pm2 status

# 5. Verificar backups
ls -lh /var/www/booktrack/database/backups/

# 6. Atualizar certificados SSL (automático, mas verificar)
sudo certbot certificates
```

### Checklist Mensal

```bash
# 1. Atualizar sistema
sudo apt update
sudo apt upgrade -y

# 2. Atualizar dependências Node.js (verificar breaking changes)
cd /var/www/booktrack/backend
npm outdated

# 3. Otimizar base de dados
mysql -u booktrack_user -p booktrack_production << EOF
OPTIMIZE TABLE utilizadores;
OPTIMIZE TABLE livros;
OPTIMIZE TABLE emprestimos;
OPTIMIZE TABLE reservas;
EOF

# 4. Limpar logs antigos
sudo find /var/log/nginx/ -name "*.log.*" -mtime +30 -delete

# 5. Verificar métricas de performance
pm2 describe booktrack-api
```

### Rotação de Logs

Criar `/etc/logrotate.d/booktrack`:

```
/var/www/booktrack/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Processo de Deploy

### Deploy Manual (Passo a Passo)

#### Passo 1: Preparação

```bash
# 1. Fazer backup da base de dados
cd /var/www/booktrack/scripts
./backup.sh

# 2. Atualizar código do repositório
cd /var/www/booktrack
git fetch origin
git checkout production
git pull origin production

# 3. Verificar mudanças
git log --oneline -5
```

#### Passo 2: Backend

```bash
cd /var/www/booktrack/backend

# 1. Instalar/atualizar dependências
npm ci --production

# 2. Executar migrações (se houver)
# Verificar em /var/www/booktrack/database/migrations/

# 3. Reiniciar aplicação com PM2
pm2 restart booktrack-api
# ou se for primeira vez:
# pm2 start ecosystem.config.js --env production

# 4. Verificar status
pm2 status
pm2 logs booktrack-api --lines 50
```

#### Passo 3: Frontend

```bash
cd /var/www/booktrack

# 1. Instalar dependências
npm ci

# 2. Build de produção
npm run build

# 3. Mover build para diretório do Nginx
sudo rm -rf /var/www/booktrack/frontend/build
sudo cp -r build /var/www/booktrack/frontend/

# 4. Ajustar permissões
sudo chown -R www-data:www-data /var/www/booktrack/frontend/build

# 5. Recarregar Nginx
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx
```

#### Passo 4: Verificação

```bash
# 1. Verificar status dos serviços
sudo systemctl status nginx
pm2 status

# 2. Verificar logs
pm2 logs booktrack-api --lines 100
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 3. Testar endpoints
curl https://api.booktrack.pt/health
curl https://booktrack.pt

# 4. Verificar base de dados
mysql -u booktrack_user -p -e "SELECT COUNT(*) FROM booktrack_production.utilizadores;"
```

#### Passo 5: Smoke Tests

```bash
# Testes básicos de funcionamento
# 1. Login deve funcionar
# 2. Catálogo deve carregar
# 3. Reserva deve processar
# 4. Admin panel deve estar acessível (bibliotecário)
```

---

## Estratégias de Implantação

### 1. Blue-Green Deployment

**Descrição:** Dois ambientes idênticos (Blue e Green). Deploy em um enquanto o outro serve tráfego.

**Vantagens:**
- Rollback instantâneo
- Zero downtime
- Teste completo antes de switch

**Implementação:**

```bash
# Estrutura
/var/www/booktrack-blue/   # Versão atual
/var/www/booktrack-green/  # Nova versão

# Nginx upstream
upstream booktrack_backend {
    server 127.0.0.1:5000;  # Blue
    # server 127.0.0.1:5001;  # Green (comentado)
}

# Para fazer switch:
# 1. Deploy em Green (porta 5001)
# 2. Testar Green
# 3. Alterar Nginx para apontar para Green
# 4. Recarregar Nginx
# 5. Blue fica como backup para rollback
```

### 2. Rolling Deployment

**Descrição:** Atualização gradual de instâncias.

**Vantagens:**
- Recursos limitados
- Monitorização progressiva
- Impacto reduzido em caso de erro

**Implementação:**

```bash
# Com PM2 Cluster Mode
pm2 start ecosystem.config.js --instances 4

# Reload gradual (um processo de cada vez)
pm2 reload booktrack-api --update-env
```

### 3. Canary Deployment

**Descrição:** Nova versão recebe pequena % de tráfego inicialmente.

**Vantagens:**
- Risco mínimo
- Teste com utilizadores reais
- Métricas comparativas

**Implementação (Nginx):**

```nginx
# 90% para versão antiga, 10% para nova
upstream backend_stable {
    server 127.0.0.1:5000 weight=90;
}

upstream backend_canary {
    server 127.0.0.1:5001 weight=10;
}

upstream backend_mixed {
    server 127.0.0.1:5000 weight=90;
    server 127.0.0.1:5001 weight=10;
}
```

### 4. Recreate Deployment (Atual)

**Descrição:** Para aplicação antiga, deploy da nova, reinicia.

**Vantagens:**
- Simples
- Sem complexidade
- Adequado para aplicações pequenas

**Desvantagens:**
- Downtime (alguns segundos)
- Sem teste prévio em produção

---

## Scripts de Deployment

### Script Principal: deploy.sh

```bash
#!/bin/bash
# deploy.sh - Script principal de deployment do BookTrack

set -e  # Sair em caso de erro

# ============================================
# CONFIGURAÇÃO
# ============================================
PROJECT_DIR="/var/www/booktrack"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"
BACKUP_DIR="$PROJECT_DIR/database/backups"
LOG_FILE="$PROJECT_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# FUNÇÕES
# ============================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# ============================================
# PRÉ-DEPLOY
# ============================================

log "=========================================="
log "Iniciando Deploy do BookTrack"
log "=========================================="

# Verificar se está em root
if [ "$EUID" -eq 0 ]; then 
    error "Não executar este script como root!"
fi

# Verificar conexão com repositório
log "Verificando conexão com repositório..."
cd "$PROJECT_DIR"
git fetch origin || error "Falha ao conectar com repositório Git"

# Backup da base de dados
log "Criando backup da base de dados..."
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p "$BACKUP_DIR"
mysqldump -u booktrack_user -p$DB_PASSWORD booktrack_production > "$BACKUP_FILE"
log "Backup criado: $BACKUP_FILE"

# ============================================
# DEPLOY BACKEND
# ============================================

log "=========================================="
log "Deploy do Backend"
log "=========================================="

cd "$BACKEND_DIR"

# Atualizar código
log "Atualizando código do backend..."
git pull origin production || error "Falha ao atualizar código"

# Instalar dependências
log "Instalando dependências do backend..."
npm ci --production || error "Falha ao instalar dependências"

# Executar migrações (se existirem novas)
log "Verificando migrações..."
# Adicionar lógica de migrações aqui se necessário

# Reiniciar aplicação
log "Reiniciando aplicação backend..."
pm2 restart booktrack-api || error "Falha ao reiniciar backend"

# Aguardar backend ficar online
log "Aguardando backend inicializar..."
sleep 5

# Verificar saúde do backend
log "Verificando saúde do backend..."
curl -f http://localhost:5000/health || error "Backend não respondeu ao health check"

log "Backend deployado com sucesso!"

# ============================================
# DEPLOY FRONTEND
# ============================================

log "=========================================="
log "Deploy do Frontend"
log "=========================================="

cd "$FRONTEND_DIR"

# Atualizar código
log "Atualizando código do frontend..."
git pull origin production || error "Falha ao atualizar código"

# Instalar dependências
log "Instalando dependências do frontend..."
npm ci || error "Falha ao instalar dependências"

# Build
log "Criando build de produção..."
npm run build || error "Falha ao criar build"

# Mover build
log "Movendo build para diretório do Nginx..."
sudo rm -rf /var/www/booktrack/frontend/build
sudo cp -r build /var/www/booktrack/frontend/
sudo chown -R www-data:www-data /var/www/booktrack/frontend/build

# Testar configuração Nginx
log "Testando configuração Nginx..."
sudo nginx -t || error "Configuração Nginx inválida"

# Recarregar Nginx
log "Recarregando Nginx..."
sudo systemctl reload nginx || error "Falha ao recarregar Nginx"

log "Frontend deployado com sucesso!"

# ============================================
# PÓS-DEPLOY
# ============================================

log "=========================================="
log "Verificações Pós-Deploy"
log "=========================================="

# Verificar status dos serviços
log "Status dos serviços:"
sudo systemctl status nginx --no-pager | grep "Active:" | tee -a "$LOG_FILE"
pm2 status | tee -a "$LOG_FILE"

# Smoke tests
log "Executando smoke tests..."
curl -f https://booktrack.pt || warning "Frontend não acessível"
curl -f https://api.booktrack.pt/health || warning "Backend não acessível"

# Salvar informações do deploy
log "Salvando informações do deploy..."
cat > "$PROJECT_DIR/LAST_DEPLOY.txt" << EOF
Data: $(date)
Branch: production
Commit: $(git rev-parse HEAD)
Commit Message: $(git log -1 --pretty=%B)
Deploy Log: $LOG_FILE
Backup BD: $BACKUP_FILE
EOF

log "=========================================="
log "Deploy concluído com sucesso!"
log "=========================================="
log "Log completo: $LOG_FILE"
log "Backup BD: $BACKUP_FILE"
```

### Script de Backup: backup.sh

```bash
#!/bin/bash
# backup.sh - Backup da base de dados

BACKUP_DIR="/var/www/booktrack/database/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"
RETENTION_DAYS=30

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

# Fazer backup
echo "Criando backup..."
mysqldump -u booktrack_user -p$DB_PASSWORD booktrack_production > "$BACKUP_FILE"

# Comprimir
gzip "$BACKUP_FILE"
echo "Backup criado: $BACKUP_FILE.gz"

# Limpar backups antigos
echo "Limpando backups antigos (>$RETENTION_DAYS dias)..."
find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup concluído!"
```

### Script de Rollback: rollback.sh

```bash
#!/bin/bash
# rollback.sh - Rollback para versão anterior

set -e

PROJECT_DIR="/var/www/booktrack"
LOG_FILE="$PROJECT_DIR/logs/rollback-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[ERROR] $1" | tee -a "$LOG_FILE"
    exit 1
}

log "=========================================="
log "Iniciando Rollback do BookTrack"
log "=========================================="

# Listar últimos commits
log "Últimos 5 commits:"
cd "$PROJECT_DIR"
git log --oneline -5

# Pedir confirmação
read -p "Digite o hash do commit para rollback: " COMMIT_HASH

if [ -z "$COMMIT_HASH" ]; then
    error "Hash do commit é obrigatório"
fi

# Backend Rollback
log "Rollback do backend..."
cd "$PROJECT_DIR/backend"
git checkout "$COMMIT_HASH" || error "Falha ao fazer checkout"
npm ci --production
pm2 restart booktrack-api

# Frontend Rollback
log "Rollback do frontend..."
cd "$PROJECT_DIR"
git checkout "$COMMIT_HASH" || error "Falha ao fazer checkout"
npm ci
npm run build
sudo rm -rf /var/www/booktrack/frontend/build
sudo cp -r build /var/www/booktrack/frontend/
sudo chown -R www-data:www-data /var/www/booktrack/frontend/build
sudo systemctl reload nginx

log "Rollback concluído!"
log "Versão atual: $(git rev-parse HEAD)"
```

---

## Pipeline CI/CD

### GitHub Actions (Recomendado)

Criar ficheiro: `.github/workflows/deploy.yml`

```yaml
name: Deploy BookTrack

on:
  push:
    branches:
      - production

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build frontend
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/booktrack
            ./scripts/deploy.sh
      
      - name: Notify success
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deploy concluído com sucesso!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      
      - name: Notify failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deploy falhou!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Secrets Necessários no GitHub

Configurar em: Repository → Settings → Secrets and variables → Actions

```
SERVER_HOST=seu-servidor.pt
SERVER_USER=deploy_user
SSH_PRIVATE_KEY=<chave SSH privada>
API_URL=https://api.booktrack.pt
DB_PASSWORD=<password da BD>
SLACK_WEBHOOK=<webhook do Slack (opcional)>
```

---

## Monitorização e Logs

### Logs do Backend (PM2)

```bash
# Ver logs em tempo real
pm2 logs booktrack-api

# Últimas 100 linhas
pm2 logs booktrack-api --lines 100

# Apenas erros
pm2 logs booktrack-api --err

# Logs salvos em:
~/.pm2/logs/booktrack-api-out.log
~/.pm2/logs/booktrack-api-error.log
```

### Logs do Nginx

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Logs específicos do BookTrack (se configurado)
sudo tail -f /var/log/nginx/booktrack-access.log
sudo tail -f /var/log/nginx/booktrack-error.log
```

### Logs do Sistema

```bash
# MySQL logs
sudo tail -f /var/log/mysql/error.log

# System logs
sudo journalctl -u nginx -f
sudo journalctl -u mysql -f
```

### Monitorização com PM2

```bash
# Dashboard interativo
pm2 monit

# Informações do sistema
pm2 status
pm2 info booktrack-api

# Estatísticas
pm2 describe booktrack-api
```

### Configurar PM2 Plus (Opcional)

PM2 Plus oferece monitorização avançada:

```bash
# Registar em pm2.io
pm2 register

# Linkar aplicação
pm2 link <secret_key> <public_key>

# Monitorização disponível em:
# https://app.pm2.io
```

---

## Rollback

### Rollback Rápido (Via Git)

```bash
# Ver histórico
cd /var/www/booktrack
git log --oneline -10

# Rollback para commit específico
git checkout <commit_hash>

# Ou voltar 1 commit
git checkout HEAD~1

# Executar script de rollback
./scripts/rollback.sh
```

### Rollback da Base de Dados

```bash
# Listar backups disponíveis
ls -lh /var/www/booktrack/database/backups/

# Restaurar backup
gunzip < backup-YYYYMMDD-HHMMSS.sql.gz | \
  mysql -u booktrack_user -p booktrack_production

# Ou sem descomprimir:
mysql -u booktrack_user -p booktrack_production < backup.sql
```

### Rollback Completo (Procedimento)

1. **Notificar utilizadores** (se possível)
   ```bash
   # Colocar página de manutenção
   sudo mv /var/www/booktrack/frontend/build/index.html \
          /var/www/booktrack/frontend/build/index.html.bak
   sudo cp maintenance.html /var/www/booktrack/frontend/build/index.html
   ```

2. **Restaurar base de dados**
   ```bash
   # Backup preventivo da BD atual
   mysqldump -u booktrack_user -p booktrack_production > \
     rollback-before-$(date +%Y%m%d-%H%M%S).sql
   
   # Restaurar backup anterior
   mysql -u booktrack_user -p booktrack_production < \
     database/backups/backup-YYYYMMDD-HHMMSS.sql
   ```

3. **Rollback do código**
   ```bash
   cd /var/www/booktrack
   
   # Backend
   cd backend
   git checkout <commit_hash_anterior>
   npm ci --production
   pm2 restart booktrack-api
   
   # Frontend
   cd ..
   git checkout <commit_hash_anterior>
   npm ci
   npm run build
   sudo cp -r build /var/www/booktrack/frontend/
   sudo systemctl reload nginx
   ```

4. **Verificar funcionalidade**
   ```bash
   # Testar endpoints
   curl https://api.booktrack.pt/health
   curl https://booktrack.pt
   
   # Verificar logs
   pm2 logs --lines 50
   ```

5. **Remover página de manutenção**
   ```bash
   sudo mv /var/www/booktrack/frontend/build/index.html.bak \
          /var/www/booktrack/frontend/build/index.html
   ```

### Tempo de Rollback Esperado

- **Rollback apenas código:** 2-5 minutos
- **Rollback com BD:** 10-30 minutos (depende do tamanho)
- **Rollback completo:** 15-45 minutos

---

## Troubleshooting

### Problema: Backend não inicia

**Sintomas:**
```
pm2 status → status "errored"
```

**Diagnóstico:**
```bash
# Ver logs de erro
pm2 logs booktrack-api --err --lines 100

# Tentar iniciar manualmente
cd /var/www/booktrack/backend
node src/server.js
```

**Soluções comuns:**
- Verificar variáveis de ambiente (.env.production)
- Verificar conexão com MySQL
- Verificar portas em uso: `sudo lsof -i :5000`
- Verificar permissões de ficheiros
- Reinstalar dependências: `npm ci --production`

### Problema: Frontend mostra página em branco

**Sintomas:**
- Página carrega mas fica em branco
- Console mostra erros 404

**Diagnóstico:**
```bash
# Verificar se build existe
ls -la /var/www/booktrack/frontend/build/

# Verificar configuração Nginx
sudo nginx -t

# Ver logs Nginx
sudo tail -f /var/log/nginx/error.log
```

**Soluções comuns:**
- Verificar REACT_APP_API_URL no build
- Rebuild: `npm run build`
- Verificar permissões: `sudo chown -R www-data:www-data frontend/build/`
- Limpar cache do browser (Ctrl+Shift+Del)

### Problema: Erro de CORS

**Sintomas:**
```
Access to fetch at 'https://api.booktrack.pt' from origin 
'https://booktrack.pt' has been blocked by CORS policy
```

**Soluções:**
```javascript
// backend/src/server.js
// Verificar configuração CORS
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://booktrack.pt',
  credentials: true
}));
```

### Problema: Base de dados desconecta

**Sintomas:**
```
Error: Connection lost: The server closed the connection.
```

**Soluções:**
```javascript
// backend/src/config/database.js
// Adicionar reconnect
const pool = mysql.createPool({
  // ... outras configs
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```

### Problema: SSL/HTTPS não funciona

**Diagnóstico:**
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew --dry-run
```

**Soluções:**
- Renovar certificado Let's Encrypt: `sudo certbot renew`
- Verificar configuração Nginx SSL
- Verificar firewall: `sudo ufw status`
- Verificar DNS do domínio

---

## Checklist de Deploy

### Pré-Deploy

- [ ] Backup da base de dados criado
- [ ] Código testado em staging
- [ ] Variáveis de ambiente verificadas
- [ ] Migrações de BD prontas (se necessário)
- [ ] Equipa notificada sobre deploy
- [ ] Janela de manutenção agendada (se necessário)
- [ ] Rollback plan preparado

### Durante Deploy

- [ ] Código atualizado do repositório
- [ ] Dependências instaladas/atualizadas
- [ ] Migrações de BD executadas
- [ ] Build do frontend criado
- [ ] Serviços reiniciados
- [ ] Configurações Nginx recarregadas

### Pós-Deploy

- [ ] Health checks passaram
- [ ] Logs verificados (sem erros críticos)
- [ ] Smoke tests executados
  - [ ] Login funciona
  - [ ] Catálogo carrega
  - [ ] Reserva processa
  - [ ] Admin panel acessível
- [ ] Performance verificada (tempos de resposta)
- [ ] Monitorização ativa
- [ ] Documentação atualizada
- [ ] Equipa notificada sobre conclusão

### Monitorização Pós-Deploy (Primeiras 24h)

- [ ] Verificar logs a cada 2h
- [ ] Monitorizar CPU/RAM/Disco
- [ ] Verificar erros reportados por utilizadores
- [ ] Confirmar backups automáticos funcionam
- [ ] Verificar métricas de performance

---

## Contactos de Emergência

### Equipa de Deploy

| Papel | Nome | Contacto | Disponibilidade |
|-------|------|----------|-----------------|
| DevOps Lead | [Nome] | [Email/Telefone] | 24/7 |
| Backend Dev | [Nome] | [Email] | Horário comercial |
| Frontend Dev | [Nome] | [Email] | Horário comercial |
| DBA | [Nome] | [Email/Telefone] | On-call |

### Fornecedores

| Serviço | Contacto | Suporte |
|---------|----------|---------|
| Hosting | [Provedor] | [Link/Telefone] |
| DNS | [Provedor] | [Link] |
| SSL | Let's Encrypt | [Documentação](https://letsencrypt.org) |

---

## Recursos Adicionais

### Documentação Oficial

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

### Tutoriais Úteis

- [Deploy Node.js com PM2](https://pm2.keymetrics.io/docs/usage/deployment/)
- [Configurar Nginx para React](https://www.digitalocean.com/community/tutorials/how-to-deploy-a-react-application-with-nginx-on-ubuntu-20-04)
- [Let's Encrypt com Nginx](https://certbot.eff.org/instructions)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

## Notas de Versão

### v1.0 - Janeiro 2026
- Primeira versão do guia de deployment
- Suporte para deploy manual
- Scripts de backup e rollback
- Pipeline CI/CD com GitHub Actions
- Documentação completa de troubleshooting

---

**Última Atualização:** Janeiro 2026  
**Próxima Revisão:** Julho 2026  
**Mantido por:** Equipa BookTrack DevOps
