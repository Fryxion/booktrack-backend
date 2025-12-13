# Manual Técnico - BookTrack
## Guia de Instalação e Configuração

---

## 📋 Índice

1. [Requisitos do Sistema](#1-requisitos-do-sistema)
2. [Instalação do Frontend](#2-instalação-do-frontend)
3. [Instalação do Backend](#3-instalação-do-backend)
4. [Configuração da Base de Dados](#4-configuração-da-base-de-dados)
5. [Configuração das Variáveis de Ambiente](#5-configuração-das-variáveis-de-ambiente)
6. [Arranque da Aplicação](#6-arranque-da-aplicação)
7. [Verificação da Instalação](#7-verificação-da-instalação)
8. [Padrões de Código](#8-padrões-de-código)
9. [Resolução de Problemas](#9-resolução-de-problemas)

---

## 1. Requisitos do Sistema

### Software Necessário

| Software | Versão Mínima | Descrição |
|----------|---------------|-----------|
| **Node.js** | 18.x | Runtime JavaScript |
| **npm** | 9.x | Gestor de pacotes (incluído com Node.js) |
| **MariaDB** ou **MySQL** | 10.x / 8.x | Sistema de gestão de base de dados |
| **Git** | 2.x | Controlo de versões |

### Hardware Recomendado

- **RAM:** 4GB mínimo, 8GB recomendado
- **Espaço em Disco:** 2GB livres
- **Processador:** Dual-core ou superior

### Sistemas Operativos Suportados

- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+, Debian 10+)

---

## 2. Instalação do Frontend

### 2.1. Verificar Pré-requisitos

```bash
# Verificar versão do Node.js
node --version

# Verificar versão do npm
npm --version
```

**Resultado esperado:**
```
v18.x.x ou superior
9.x.x ou superior
```

### 2.2. Descarregar o Projeto

```bash
# Clonar repositório
git clone https://github.com/Fryxion/booktrack

# Navegar para o diretório frontend
cd booktrack/
```

### 2.3. Instalar Dependências do Frontend

```bash
# Instalar todas as dependências
npm install
```

### 2.4. Estrutura de Dependências do Frontend

As principais dependências instaladas são:

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "jwt-decode": "^4.x"
  },
  "devDependencies": {
    "tailwindcss": "^3.x",
    "http-proxy-middleware": "^2.x"
  }
}
```

---

## 3. Instalação do Backend

```bash
# Clonar repositório
git clone https://github.com/Fryxion/booktrack-backend

# Navegar para o diretório frontend
cd booktrack/
```

### 3.1. Instalar Dependências do Backend

```bash
# Instalar todas as dependências
npm install
```

### 3.3. Estrutura de Dependências do Backend

As principais dependências instaladas são:

```json
{
  "dependencies": {
    "express": "^4.x",
    "mysql2": "^3.x",
    "jsonwebtoken": "^9.x",
    "bcrypt": "^5.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "express-validator": "^7.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

---

## 4. Configuração da Base de Dados

### 4.1. Instalação do MariaDB

#### Windows

1. Descarregar instalador de: https://mariadb.org/download/
2. Executar instalador
3. Definir password do utilizador **root**
4. Completar instalação

#### Linux (Ubuntu/Debian)

```bash
# Atualizar repositórios
sudo apt update

# Instalar MariaDB
sudo apt install mariadb-server mariadb-client

# Iniciar serviço
sudo systemctl start mysql
sudo systemctl enable mysql

# Configuração segura
sudo mysql_secure_installation
```

#### macOS

```bash
# Instalar via Homebrew
brew install mariadb

# Iniciar serviço
brew services start mariadb

# Configuração segura
mysql_secure_installation
```

### 4.2. Criar Base de Dados

```bash
# Aceder ao MySQL/MariaDB
mysql -u root -p

# Será solicitada a password definida na instalação
```

Executar os seguintes comandos SQL:

```sql
-- Criar base de dados
CREATE DATABASE booktrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar utilizador para a aplicação
CREATE USER 'booktrack_user'@'localhost' IDENTIFIED BY 'password_segura_aqui';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON booktrack.* TO 'booktrack_user'@'localhost';

-- Aplicar alterações
FLUSH PRIVILEGES;

-- Sair
EXIT;
```

### 4.3. Executar Script de Schema

```bash
# A partir da raiz do projeto
mysql -u root -p booktrack < database/script.sql
```

**Nota:** Este comando importa todas as tabelas e dados iniciais.

### 4.4. Verificar Instalação da BD

```bash
# Aceder novamente ao MySQL
mysql -u root -p

# Selecionar base de dados
USE booktrack;

# Listar tabelas
SHOW TABLES;
```

**Resultado esperado:**
```
+---------------------+
| Tables_in_booktrack |
+---------------------+
| catalogo            |
| emprestimos         |
| livros              |
| notificacoes        |
| relatorios          |
| reservas            |
| utilizadores        |
+---------------------+
7 rows in set (0.00 sec)
```

---

## 5. Configuração das Variáveis de Ambiente

### 5.1. Configurar Frontend

Criar ficheiro `.env` no diretório `frontend/`:

```env
# URL do Backend API
REACT_APP_API_URL=http://localhost:5000/api

# Porta do Frontend
PORT=3000

# Ambiente
NODE_ENV=development
```

### 5.2. Configurar Backend

Criar ficheiro `.env` no diretório `backend/`:

```env
# Configuração do Servidor
PORT=5000
NODE_ENV=development

# Configuração da Base de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=booktrack_user
DB_PASSWORD=password_segura_aqui
DB_NAME=booktrack

# Configuração JWT
JWT_SECRET=seu_segredo_jwt_super_seguro_minimo_32_caracteres_aqui
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 5.3. Gerar JWT Secret Seguro

```bash
# Windows (PowerShell)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))

# Linux/macOS
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copiar o resultado e colar em `JWT_SECRET`**

---

## 6. Arranque da Aplicação

### 6.1. Iniciar Backend

```bash
# Navegar para o diretório backend
cd backend

# Iniciar em modo desenvolvimento
npm run dev
```

**Resultado esperado:**
```
[nodemon] starting `node server.js`
✅ Conectado à base de dados
🚀 Servidor a correr na porta 5000
```

### 6.2. Iniciar Frontend (Nova Janela de Terminal)

```bash
# Navegar para o diretório frontend
cd frontend

# Iniciar aplicação React
npm start
```

**Resultado esperado:**
```
Compiled successfully!

You can now view booktrack-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

**Nota:** O browser abrirá automaticamente em `http://localhost:3000`

---

## 7. Verificação da Instalação

### 7.1. Testar Backend API

Abrir browser ou Postman e testar endpoint:

```
GET http://localhost:5000/api/livros
```

**Resposta esperada:**
```json
[
  {
    "id_livro": 1,
    "titulo": "O Principezinho",
    "autor": "Antoine de Saint-Exupéry",
    "isbn": "978-0156012195",
    "categoria": "Ficção",
    "copias_disponiveis": 3,
    "total_copias": 5
  }
]
```

### 7.2. Testar Frontend

1. Abrir `http://localhost:3000`
2. Verificar se a página inicial carrega
3. Navegar para **Catálogo**
4. Verificar se os livros são exibidos

### 7.3. Testar Autenticação

1. Clicar em **Login**
2. Usar credenciais de teste:
   - **Email:** `admin@booktrack.pt`
   - **Password:** `admin123`
3. Verificar se o login é bem-sucedido

### 7.4. Verificar Proxy Frontend → Backend

No frontend, abrir **DevTools** (F12) → **Network**:
- Fazer um pedido (ex: ver catálogo)
- Verificar se os requests aparecem como `/api/livros`
- Status deve ser **200 OK**

---

## 8. Padrões de Código

### 8.1. Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Componentes React** | PascalCase | `BookCard.jsx`, `LoginForm.jsx` |
| **Funções** | camelCase | `getUserById()`, `handleSubmit()` |
| **Variáveis** | camelCase | `isAuthenticated`, `userData` |
| **Constantes** | UPPER_SNAKE_CASE | `API_URL`, `JWT_SECRET` |
| **Ficheiros CSS** | kebab-case | `navbar-styles.css` |
| **Rotas API** | kebab-case | `/api/auth/login`, `/api/livros` |

### 8.2. Estrutura de Ficheiros

#### Frontend - Componente React

```jsx
// Imports
import React, { useState } from 'react';

// Componente
const BookCard = ({ book }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    // Lógica
  };

  return (
    <div className="card">
      {/* JSX */}
    </div>
  );
};

// Export
export default BookCard;
```

#### Backend - Controller

```javascript
// Imports
const db = require('../config/database');

// Controller
const bookController = {
  getAll: async (req, res) => {
    try {
      const [livros] = await db.query('SELECT * FROM livros');
      res.json(livros);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao obter livros' });
    }
  },
};

// Export
module.exports = bookController;
```

### 8.3. Padrões de API REST

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| **GET** | `/api/livros` | Listar todos os livros |
| **GET** | `/api/livros/:id` | Obter livro específico |
| **POST** | `/api/livros` | Criar novo livro |
| **PUT** | `/api/livros/:id` | Atualizar livro |
| **DELETE** | `/api/livros/:id` | Deletar livro |

### 8.4. Tratamento de Erros

#### Frontend

```jsx
try {
  const response = await bookService.getAll();
  setBooks(response);
} catch (error) {
  console.error('Erro ao carregar livros:', error);
  setError('Não foi possível carregar os livros');
}
```

#### Backend

```javascript
try {
  const [result] = await db.query('SELECT * FROM livros');
  res.json(result);
} catch (error) {
  console.error('Erro na BD:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
}
```

## 9. Resolução de Problemas

### 9.1. Erro: "Port 3000 is already in use"

**Problema:** Porta 3000 já está ocupada

**Solução:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

Ou alterar porta no `.env`:
```env
PORT=3001
```

### 9.2. Erro: "ECONNREFUSED" ao conectar ao Backend

**Problema:** Backend não está a correr

**Solução:**
1. Verificar se backend está iniciado: `npm run dev` no diretório `backend/`
2. Verificar porta no `.env` do backend
3. Verificar firewall

### 9.3. Erro: "Access denied for user"

**Problema:** Credenciais da BD incorretas

**Solução:**
1. Verificar `.env` do backend
2. Confirmar password do utilizador MySQL:
```sql
ALTER USER 'booktrack_user'@'localhost' IDENTIFIED BY 'nova_password';
FLUSH PRIVILEGES;
```

### 9.4. Erro: "Cannot find module"

**Problema:** Dependências não instaladas

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### 9.5. Erro: "Invalid token" ou "Token expired"

**Problema:** Token JWT inválido

**Solução:**
1. Fazer logout e login novamente
2. Verificar se `JWT_SECRET` no backend está correto
3. Limpar localStorage no browser:
```javascript
localStorage.clear();
```

### 9.6. Erro: CORS

**Problema:** Backend bloqueia pedidos do frontend

**Solução:**

Verificar configuração CORS no `backend/server.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### 9.7. Página em Branco no Frontend

**Solução:**
1. Abrir DevTools (F12) → Console
2. Verificar erros JavaScript
3. Verificar se backend está a responder
4. Limpar cache do browser: Ctrl+Shift+R

### 9.8. Livros não aparecem no Catálogo

**Solução:**
1. Verificar se existem livros na BD:
```sql
SELECT * FROM livros;
```

2. Verificar endpoint no browser:
```
http://localhost:5000/api/livros
```

3. Verificar logs do backend no terminal

---

## 📝 Checklist de Instalação

- [ ] Node.js 18.x+ instalado
- [ ] npm 9.x+ instalado
- [ ] MariaDB/MySQL 10.x/8.x instalado
- [ ] Repositório clonado
- [ ] Dependências frontend instaladas (`npm install`)
- [ ] Dependências backend instaladas (`npm install`)
- [ ] Base de dados `booktrack` criada
- [ ] Utilizador MySQL criado
- [ ] Schema SQL importado
- [ ] Ficheiro `.env` do frontend configurado
- [ ] Ficheiro `.env` do backend configurado
- [ ] JWT Secret gerado
- [ ] Backend iniciado (porta 5000)
- [ ] Frontend iniciado (porta 3000)
- [ ] Testes de verificação concluídos com sucesso

---

## 📞 Contacto e Suporte

**Equipa de Desenvolvimento:**
- Tiago Poiares
- Carlos Ribeiro
- Daniel Ferreira

**Repositórios:** https://github.com/Fryxion/booktrack & https://github.com/Fryxion/booktrack-backend

---

## 📚 Recursos Adicionais

- **Documentação React:** https://react.dev/
- **Documentação Node.js:** https://nodejs.org/docs/
- **Documentação Express:** https://expressjs.com/
- **Documentação MariaDB:** https://mariadb.org/documentation/
- **Documentação Tailwind CSS:** https://tailwindcss.com/docs

---

**Versão do Manual:** 2.0  
**Última Atualização:** Dezembro 2024