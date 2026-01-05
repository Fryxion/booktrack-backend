# Manual de Instalação - BookTrack

**Sistema de Gestão de Biblioteca Escolar**

Versão: 1.0  
Data: Janeiro 2026  
Autor: Equipa BookTrack

---

## Índice

1. [Introdução](#introdução)
2. [Requisitos do Sistema](#requisitos-do-sistema)
3. [Preparação do Ambiente](#preparação-do-ambiente)
4. [Instalação do Backend](#instalação-do-backend)
5. [Instalação do Frontend](#instalação-do-frontend)
6. [Configuração da Base de Dados](#configuração-da-base-de-dados)
7. [Configuração do Servidor Web](#configuração-do-servidor-web)
8. [Verificação da Instalação](#verificação-da-instalação)
9. [Troubleshooting](#troubleshooting)
10. [Próximos Passos](#próximos-passos)

---

## Introdução

### Objetivo

Este manual fornece instruções detalhadas para a instalação inicial do sistema BookTrack em ambientes de produção, staging ou desenvolvimento. Destina-se a administradores de sistemas e equipas de infraestrutura.

### Âmbito

O manual cobre:
- Instalação de todas as dependências necessárias
- Configuração inicial do sistema
- Verificação da instalação
- Resolução de problemas comuns

### Arquitetura do Sistema

```
┌─────────────────┐
│   Utilizador    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Nginx   │ (Servidor Web / Proxy Reverso)
    └────┬─────┘
         │
    ┌────▼──────────────────────┐
    │                           │
┌───▼────┐              ┌───────▼───────┐
│ React  │              │   Node.js     │
│ (SPA)  │              │   Express API │
└────────┘              └───────┬───────┘
                                │
                        ┌───────▼───────┐
                        │     MySQL     │
                        │  (Base Dados) │
                        └───────────────┘
```

---

## Requisitos do Sistema

### Hardware Mínimo

**Ambiente de Produção:**
- CPU: 2 cores (2.0 GHz ou superior)
- RAM: 4 GB
- Disco: 20 GB SSD
- Rede: 100 Mbps

**Ambiente de Desenvolvimento:**
- CPU: 2 cores
- RAM: 2 GB
- Disco: 10 GB
- Rede: 10 Mbps

### Software

**Sistema Operativo:**
- Ubuntu 20.04 LTS ou superior (recomendado)
- Debian 11 ou superior
- CentOS 8 / Rocky Linux 8
- Windows Server 2019+ (com adaptações)

**Dependências Principais:**
- Node.js 18.x ou superior
- MySQL 8.0 ou superior
- Nginx 1.18 ou superior
- PM2 (gestor de processos)
- Git 2.x

**Ferramentas Adicionais:**
- npm 8.x ou superior
- certbot (para SSL em produção)

### Permissões Necessárias

- Acesso root ou sudo no servidor
- Permissões para instalar pacotes do sistema
- Acesso à porta 80 (HTTP) e 443 (HTTPS)
- Acesso à porta 3306 (MySQL) localmente
- Acesso à porta 5000 (API) localmente

### Conectividade

- Acesso à Internet para download de dependências
- DNS configurado (para produção)
- Firewall configurado corretamente

---

## Preparação do Ambiente

### Passo 1: Atualizar o Sistema

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/Rocky Linux
sudo yum update -y
```

### Passo 2: Instalar Ferramentas Básicas

```bash
# Ubuntu/Debian
sudo apt install -y curl wget git build-essential software-properties-common

# CentOS/Rocky Linux
sudo yum install -y curl wget git gcc-c++ make
```

### Passo 3: Criar Utilizador de Sistema

```bash
# Criar utilizador dedicado (recomendado para produção)
sudo useradd -m -s /bin/bash booktrack
sudo usermod -aG sudo booktrack  # Dar permissões sudo se necessário

# Configurar diretório de trabalho
sudo mkdir -p /var/www/booktrack
sudo chown -R booktrack:booktrack /var/www/booktrack

# Mudar para o utilizador
sudo su - booktrack
cd /var/www/booktrack
```

### Passo 4: Instalar Node.js

```bash
# Método 1: NodeSource (recomendado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Método 2: NVM (para desenvolvimento)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verificar instalação
node --version  # Deve mostrar v18.x.x
npm --version   # Deve mostrar 8.x.x ou superior
```

### Passo 5: Instalar MySQL

```bash
# Ubuntu/Debian
sudo apt install -y mysql-server mysql-client

# Iniciar serviço
sudo systemctl start mysql
sudo systemctl enable mysql

# Verificar status
sudo systemctl status mysql

# Executar script de segurança
sudo mysql_secure_installation
```

**Configuração do mysql_secure_installation:**
```
- Set root password? [Y/n]: Y
  - Inserir password segura
- Remove anonymous users? [Y/n]: Y
- Disallow root login remotely? [Y/n]: Y
- Remove test database? [Y/n]: Y
- Reload privilege tables? [Y/n]: Y
```

### Passo 6: Instalar Nginx

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# Iniciar e ativar
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx

# Testar instalação
curl http://localhost
# Deve retornar a página padrão do Nginx
```

### Passo 7: Instalar PM2

```bash
# Instalar globalmente
sudo npm install -g pm2

# Verificar instalação
pm2 --version

# Configurar auto-start no boot
pm2 startup systemd
# Executar o comando que o PM2 mostrar
```

---

## Instalação do Backend

### Passo 1: Clonar Repositório

```bash
cd /var/www/booktrack

# Clonar do Git
git clone https://github.com/seu-usuario/booktrack.git .

# Ou fazer upload manual dos ficheiros
# scp -r booktrack/ user@servidor:/var/www/booktrack/

# Verificar estrutura
ls -la
# Deve mostrar: backend/, frontend/, README.md, etc.
```

### Passo 2: Instalar Dependências do Backend

```bash
cd /var/www/booktrack/backend

# Instalar dependências
npm install

# Verificar instalação
npm list --depth=0
```

**Dependências Principais Esperadas:**
```
express@^4.18.0
mysql2@^3.0.0
dotenv@^16.0.0
bcryptjs@^2.4.3
jsonwebtoken@^9.0.0
cors@^2.8.5
express-validator@^7.0.0
multer@^1.4.5
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Criar ficheiro .env
cd /var/www/booktrack/backend
cp .env.example .env
nano .env
```

**Configuração do .env:**
```env
# Ambiente
NODE_ENV=production

# Servidor
PORT=5000
HOST=0.0.0.0

# Base de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=booktrack_user
DB_PASSWORD=SuaPasswordSegura123!
DB_NAME=booktrack_production

# JWT (gerar secret seguro)
JWT_SECRET=SuaChaveSecretaMuitoSegura123!@#
JWT_EXPIRES_IN=24h

# Upload de Ficheiros
UPLOAD_PATH=/var/www/booktrack/backend/uploads
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN=https://booktrack.pt

# Email (configurar se necessário)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@exemplo.com
SMTP_PASSWORD=sua-password-app

# Logs
LOG_LEVEL=info
LOG_FILE=/var/www/booktrack/backend/logs/app.log
```

**Gerar JWT_SECRET seguro:**
```bash
# Gerar string aleatória
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Passo 4: Criar Estrutura de Diretórios

```bash
cd /var/www/booktrack/backend

# Criar diretórios necessários
mkdir -p logs uploads temp

# Configurar permissões
chmod 755 logs uploads temp
chmod 600 .env

# Verificar
ls -la
```

### Passo 5: Validar Instalação do Backend

```bash
# Testar se o servidor inicia
cd /var/www/booktrack/backend
node src/server.js

# Deve mostrar:
# "Server running on port 5000"
# "Database connected successfully"

# Parar com Ctrl+C
```

---

## Instalação do Frontend

### Passo 1: Instalar Dependências do Frontend

```bash
cd /var/www/booktrack/frontend

# Instalar dependências
npm install

# Verificar instalação
npm list --depth=0
```

**Dependências Principais Esperadas:**
```
react@^18.2.0
react-dom@^18.2.0
react-router-dom@^6.8.0
axios@^1.3.0
```

### Passo 2: Configurar Variáveis de Ambiente

```bash
cd /var/www/booktrack/frontend
nano .env.production
```

**Configuração do .env.production:**
```env
# API Endpoint
REACT_APP_API_URL=https://api.booktrack.pt

# Opcional: Google Analytics, etc.
# REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

### Passo 3: Build de Produção

```bash
cd /var/www/booktrack/frontend

# Criar build otimizado
npm run build

# Verificar se o build foi criado
ls -la build/
# Deve mostrar: index.html, static/, manifest.json, etc.

# Verificar tamanho do build
du -sh build/
# Tamanho esperado: 2-5 MB
```

### Passo 4: Mover Build para Diretório de Produção

```bash
# Criar diretório se não existir
sudo mkdir -p /var/www/booktrack/frontend/build

# Copiar build (se necessário)
# Os ficheiros já estão em /var/www/booktrack/frontend/build/

# Configurar permissões
sudo chown -R www-data:www-data /var/www/booktrack/frontend/build
sudo chmod -R 755 /var/www/booktrack/frontend/build
```

---

## Configuração da Base de Dados

### Passo 1: Criar Base de Dados e Utilizador

```bash
# Conectar ao MySQL como root
sudo mysql -u root -p
```

```sql
-- Criar base de dados
CREATE DATABASE booktrack_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar utilizador
CREATE USER 'booktrack_user'@'localhost' IDENTIFIED BY 'SuaPasswordSegura123!';

-- Conceder permissões
GRANT ALL PRIVILEGES ON booktrack_production.* TO 'booktrack_user'@'localhost';

-- Aplicar alterações
FLUSH PRIVILEGES;

-- Verificar
SELECT User, Host FROM mysql.user WHERE User = 'booktrack_user';
SHOW DATABASES LIKE 'booktrack%';

-- Sair
EXIT;
```

### Passo 2: Testar Conexão

```bash
# Testar login com o novo utilizador
mysql -u booktrack_user -p
# Inserir password: SuaPasswordSegura123!

# No MySQL:
USE booktrack_production;
EXIT;
```

### Passo 3: Criar Schema da Base de Dados

```bash
cd /var/www/booktrack/backend

# Método 1: Executar ficheiro SQL
mysql -u booktrack_user -p booktrack_production < database/schema.sql

# Método 2: Executar múltiplos ficheiros (se separados)
for file in database/migrations/*.sql; do
  echo "Executando $file..."
  mysql -u booktrack_user -p booktrack_production < "$file"
done
```

**Verificar tabelas criadas:**
```bash
mysql -u booktrack_user -p booktrack_production -e "SHOW TABLES;"
```

**Tabelas esperadas:**
```
+--------------------------------+
| Tables_in_booktrack_production |
+--------------------------------+
| utilizadores                   |
| livros                         |
| emprestimos                    |
| reservas                       |
| categorias                     |
| autores                        |
| editoras                       |
| multas                         |
| configuracoes                  |
+--------------------------------+
```

### Passo 4: Executar Seeds (Dados Iniciais)

```bash
cd /var/www/booktrack/backend

# Inserir dados iniciais
mysql -u booktrack_user -p booktrack_production < database/seeds/001_initial_data.sql

# Verificar dados inseridos
mysql -u booktrack_user -p booktrack_production << EOF
SELECT COUNT(*) as total_livros FROM livros;
SELECT COUNT(*) as total_utilizadores FROM utilizadores;
SELECT username, tipo_utilizador FROM utilizadores;
EOF
```

### Passo 5: Criar Utilizador Administrador Padrão

```bash
# Conectar à base de dados
mysql -u booktrack_user -p booktrack_production
```

```sql
-- Criar administrador (password: Admin123!)
-- Nota: A password deve ser hashed pela aplicação em produção
INSERT INTO utilizadores (
  username, 
  email, 
  password, 
  nome_completo, 
  tipo_utilizador, 
  ativo
) VALUES (
  'admin',
  'admin@booktrack.pt',
  '$2a$10$XxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxXXXXX', -- Hash bcrypt
  'Administrador do Sistema',
  'bibliotecario',
  1
);

-- Verificar
SELECT id, username, email, tipo_utilizador FROM utilizadores WHERE username = 'admin';

EXIT;
```

**Alternativa: Criar admin via script:**
```bash
cd /var/www/booktrack/backend
node scripts/create-admin.js
```

---

## Configuração do Servidor Web

### Passo 1: Criar Configuração Nginx

```bash
# Criar ficheiro de configuração
sudo nano /etc/nginx/sites-available/booktrack
```

**Configuração Básica (HTTP apenas - desenvolvimento):**
```nginx
# /etc/nginx/sites-available/booktrack

server {
    listen 80;
    server_name localhost;

    # Frontend (React build)
    location / {
        root /var/www/booktrack/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Configuração Produção (HTTPS):**
```nginx
# /etc/nginx/sites-available/booktrack

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name booktrack.pt www.booktrack.pt;
    return 301 https://$server_name$request_uri;
}

# Frontend HTTPS
server {
    listen 443 ssl http2;
    server_name booktrack.pt www.booktrack.pt;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/booktrack.pt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/booktrack.pt/privkey.pem;
    
    # Configuração SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    root /var/www/booktrack/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API Backend HTTPS
server {
    listen 443 ssl http2;
    server_name api.booktrack.pt;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/booktrack.pt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/booktrack.pt/privkey.pem;
    
    # Configuração SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy para Backend
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Passo 2: Ativar Configuração

```bash
# Criar symlink para sites-enabled
sudo ln -s /etc/nginx/sites-available/booktrack /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Deve mostrar:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Recarregar Nginx
sudo systemctl reload nginx
```

### Passo 3: Configurar SSL (Produção)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado (método interativo)
sudo certbot --nginx -d booktrack.pt -d www.booktrack.pt -d api.booktrack.pt

# Seguir instruções:
# - Email: seu-email@exemplo.com
# - Aceitar termos: Y
# - Partilhar email: N (opcional)

# Verificar certificados
sudo certbot certificates

# Testar renovação automática
sudo certbot renew --dry-run
```

### Passo 4: Iniciar Backend com PM2

```bash
cd /var/www/booktrack/backend

# Iniciar aplicação
pm2 start src/server.js --name booktrack-api

# Ou com ecosystem.config.js (se existir)
pm2 start ecosystem.config.js --env production

# Salvar configuração para auto-start
pm2 save
pm2 startup

# Verificar status
pm2 status
pm2 logs booktrack-api --lines 20
```

---

## Verificação da Instalação

### Passo 1: Verificar Serviços

```bash
# Verificar MySQL
sudo systemctl status mysql | grep Active
# Esperado: Active: active (running)

# Verificar Nginx
sudo systemctl status nginx | grep Active
# Esperado: Active: active (running)

# Verificar PM2
pm2 status
# Esperado: booktrack-api | online | 0 | 0s | 0 | online
```

### Passo 2: Testar Backend API

```bash
# Testar health check
curl http://localhost:5000/health
# Esperado: {"status":"ok","timestamp":"..."}

# Testar rota de teste (se existir)
curl http://localhost:5000/api/test
# Esperado: {"message":"API is working"}

# Testar login (deve falhar sem credenciais)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}'
# Esperado: {"error":"..."}
```

### Passo 3: Testar Frontend

```bash
# Testar se ficheiros estão acessíveis
curl http://localhost/
# Deve retornar HTML da aplicação React

# Verificar assets
curl -I http://localhost/static/css/main.xxxxxx.css
# Esperado: HTTP/1.1 200 OK
```

### Passo 4: Testar Integração Completa

**Via Browser:**
1. Aceder a `http://seu-servidor/` ou `https://booktrack.pt/`
2. Deve carregar a página de Login
3. Tentar login com credenciais de administrador
4. Verificar se redireciona para dashboard

**Via cURL (Fluxo de Login):**
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

echo "Token: $TOKEN"

# 2. Testar rota protegida
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
# Esperado: JSON com dados do utilizador

# 3. Listar livros
curl -X GET http://localhost:5000/api/livros \
  -H "Authorization: Bearer $TOKEN"
# Esperado: JSON com lista de livros
```

### Passo 5: Verificar Logs

```bash
# Logs do Backend
pm2 logs booktrack-api --lines 50

# Logs do Nginx
sudo tail -50 /var/log/nginx/access.log
sudo tail -50 /var/log/nginx/error.log

# Logs do MySQL
sudo tail -50 /var/log/mysql/error.log

# Verificar erros
pm2 logs booktrack-api --err --lines 20
```

### Passo 6: Checklist Final

```bash
# Executar script de verificação
cd /var/www/booktrack

# Criar script de verificação
cat > verify-installation.sh << 'EOF'
#!/bin/bash
echo "=== Verificação da Instalação BookTrack ==="

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK]${NC} $1"
  else
    echo -e "${RED}[FAIL]${NC} $1"
  fi
}

# 1. Verificar serviços
systemctl is-active --quiet mysql
check "MySQL está a correr"

systemctl is-active --quiet nginx
check "Nginx está a correr"

pm2 describe booktrack-api > /dev/null 2>&1
check "PM2 booktrack-api está a correr"

# 2. Verificar conectividade
curl -s http://localhost:5000/health > /dev/null
check "Backend API responde"

curl -s http://localhost/ > /dev/null
check "Frontend responde"

# 3. Verificar base de dados
mysql -u booktrack_user -p"$DB_PASSWORD" -e "USE booktrack_production; SELECT 1;" > /dev/null 2>&1
check "Conexão à base de dados"

# 4. Verificar ficheiros
[ -f /var/www/booktrack/backend/.env ]
check "Ficheiro .env existe"

[ -d /var/www/booktrack/frontend/build ]
check "Build do frontend existe"

echo "=== Verificação Concluída ==="
EOF

chmod +x verify-installation.sh
./verify-installation.sh
```

**Resultado Esperado:**
```
=== Verificação da Instalação BookTrack ===
[OK] MySQL está a correr
[OK] Nginx está a correr
[OK] PM2 booktrack-api está a correr
[OK] Backend API responde
[OK] Frontend responde
[OK] Conexão à base de dados
[OK] Ficheiro .env existe
[OK] Build do frontend existe
=== Verificação Concluída ===
```

---

## Troubleshooting

### Problema 1: Backend não inicia

**Sintomas:**
```
pm2 status
# booktrack-api | errored
```

**Diagnóstico:**
```bash
# Ver logs de erro
pm2 logs booktrack-api --err --lines 50

# Tentar iniciar manualmente
cd /var/www/booktrack/backend
node src/server.js
```

**Soluções Comuns:**

1. **Erro: Cannot find module**
   ```bash
   cd /var/www/booktrack/backend
   rm -rf node_modules package-lock.json
   npm install
   pm2 restart booktrack-api
   ```

2. **Erro: Port 5000 already in use**
   ```bash
   # Encontrar processo
   sudo lsof -i :5000
   # Parar processo
   kill -9 PID
   # Ou mudar porta no .env
   ```

3. **Erro: Cannot connect to database**
   ```bash
   # Verificar MySQL
   sudo systemctl status mysql
   
   # Testar conexão
   mysql -u booktrack_user -p
   
   # Verificar .env
   cat /var/www/booktrack/backend/.env | grep DB_
   ```

### Problema 2: Frontend mostra página em branco

**Diagnóstico:**
```bash
# Verificar logs do browser (F12 > Console)
# Verificar se build existe
ls -la /var/www/booktrack/frontend/build/

# Verificar Nginx
sudo nginx -t
sudo tail -50 /var/log/nginx/error.log
```

**Soluções:**

1. **Build não existe ou está incompleto**
   ```bash
   cd /var/www/booktrack/frontend
   rm -rf build/
   npm run build
   sudo systemctl reload nginx
   ```

2. **Erro 404 nas rotas**
   ```bash
   # Verificar configuração Nginx try_files
   sudo nano /etc/nginx/sites-available/booktrack
   # Deve ter: try_files $uri $uri/ /index.html;
   sudo systemctl reload nginx
   ```

### Problema 3: Erro CORS

**Sintomas:**
- Console do browser mostra: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solução:**
```bash
# Verificar CORS_ORIGIN no .env
cd /var/www/booktrack/backend
nano .env
# Adicionar:
# CORS_ORIGIN=https://booktrack.pt

# Reiniciar backend
pm2 restart booktrack-api
```

### Problema 4: SSL/HTTPS não funciona

**Diagnóstico:**
```bash
# Verificar certificados
sudo certbot certificates

# Testar HTTPS
curl -I https://booktrack.pt
```

**Soluções:**

1. **Certificado expirado**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

2. **Certificado não existe**
   ```bash
   sudo certbot --nginx -d booktrack.pt -d www.booktrack.pt
   ```

### Problema 5: Base de dados não conecta

**Diagnóstico:**
```bash
# Verificar serviço
sudo systemctl status mysql

# Testar conexão
mysql -u booktrack_user -p -h localhost

# Verificar logs
sudo tail -50 /var/log/mysql/error.log
```

**Soluções:**

1. **MySQL não está a correr**
   ```bash
   sudo systemctl start mysql
   sudo systemctl enable mysql
   ```

2. **Credenciais incorretas**
   ```bash
   sudo mysql -u root -p
   # Reset password
   ALTER USER 'booktrack_user'@'localhost' IDENTIFIED BY 'NovaPassword123!';
   FLUSH PRIVILEGES;
   EXIT;
   
   # Atualizar .env
   nano /var/www/booktrack/backend/.env
   ```

### Problema 6: Permissões de ficheiros

**Sintomas:**
- Erro: EACCES: permission denied

**Solução:**
```bash
# Corrigir permissões do backend
cd /var/www/booktrack/backend
sudo chown -R $USER:$USER .
chmod 600 .env
chmod 755 logs uploads

# Corrigir permissões do frontend
cd /var/www/booktrack/frontend
sudo chown -R www-data:www-data build/
sudo chmod -R 755 build/
```

### Problema 7: Out of Memory

**Sintomas:**
- PM2 mostra restarts frequentes
- Logs: "JavaScript heap out of memory"

**Solução:**
```bash
# Aumentar heap do Node.js
pm2 delete booktrack-api
pm2 start src/server.js \
  --name booktrack-api \
  --node-args="--max-old-space-size=512"
pm2 save

# Ou no ecosystem.config.js:
# node_args: '--max-old-space-size=512'
```

### Comandos Úteis de Diagnóstico

```bash
# Ver uso de recursos
htop
df -h  # Espaço em disco
free -h  # Memória

# Ver processos Node.js
ps aux | grep node

# Ver portas em uso
sudo netstat -tulpn | grep LISTEN

# Verificar conectividade
ping -c 4 google.com
curl -I http://localhost

# Logs em tempo real
pm2 logs booktrack-api --lines 100 --raw
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/mysql/error.log
```

---

**Fim do Manual de Instalação**
