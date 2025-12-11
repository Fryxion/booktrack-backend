# 📦 Guia de Instalação - BookTrack Backend (MariaDB)

Este guia contém instruções detalhadas para instalar e configurar o backend do BookTrack com **MariaDB**.

---

## 📋 Pré-requisitos

### 1️⃣ Node.js
- **Versão mínima:** Node.js 16.x ou superior
- **Download:** https://nodejs.org/

### 2️⃣ MariaDB
- **Versão recomendada:** MariaDB 10.5 ou superior
- **Download:** https://mariadb.org/download/

---

## 🔧 Instalação do MariaDB

### Windows

1. **Descarregar o instalador:**
   - Aceda a https://mariadb.org/download/
   - Escolha a versão mais recente para Windows
   - Execute o instalador MSI

2. **Durante a instalação:**
   - Defina uma password para o utilizador `root`
   - **IMPORTANTE:** Guarde bem esta password!
   - Deixe as outras opções por defeito
   - Marque a opção "Enable access from remote machines" se necessário

3. **Verificar instalação:**
   ```cmd
   mysql --version
   ```

### Linux (Ubuntu/Debian)

```bash
# Atualizar repositórios
sudo apt update

# Instalar MariaDB
sudo apt install mariadb-server mariadb-client

# Iniciar serviço
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Configurar segurança
sudo mysql_secure_installation
```

---

## 🚀 Instalação do Backend

### 1️⃣ Clonar/Descarregar o Projeto

```bash
cd booktrack-backend
```

### 2️⃣ Instalar Dependências

```bash
npm install
```

Dependências instaladas:
- `express` - Framework web
- `mysql2` - Driver MariaDB/MySQL
- `cors` - Gestão de CORS
- `dotenv` - Variáveis de ambiente
- `bcryptjs` - Encriptação de passwords
- `jsonwebtoken` - Autenticação JWT
- `express-validator` - Validação de dados

### 3️⃣ Configurar MariaDB

**Aceder ao MariaDB:**
```bash
mysql -u root -p
```
(Introduza a password definida durante a instalação)

**Criar utilizador para a aplicação (opcional mas recomendado):**
```sql
-- Criar utilizador
CREATE USER 'booktrack_user'@'localhost' IDENTIFIED BY 'booktrack_password_123';

-- Dar permissões
GRANT ALL PRIVILEGES ON booktrack.* TO 'booktrack_user'@'localhost';

-- Aplicar alterações
FLUSH PRIVILEGES;

-- Sair
EXIT;
```

### 4️⃣ Configurar Variáveis de Ambiente

**Copiar ficheiro de exemplo:**
```bash
cp .env.example .env
```

**Editar o ficheiro `.env`:**

```env
# Configuração do Servidor
PORT=5000
NODE_ENV=development

# Configuração JWT
JWT_SECRET=booktrack_secret_key_change_this_in_production_2025
JWT_EXPIRE=7d

# Configuração da Base de Dados MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_PASSWORD_AQUI
DB_NAME=booktrack
```

⚠️ **IMPORTANTE:** Substitua `SUA_PASSWORD_AQUI` pela password correta!

Se criou um utilizador dedicado:
```env
DB_USER=booktrack_user
DB_PASSWORD=booktrack_password_123
```

### 5️⃣ Inicializar Base de Dados

**Criar todas as tabelas:**
```bash
npm run init-db
```

Este comando irá:
- ✅ Criar a base de dados `booktrack`
- ✅ Criar todas as tabelas necessárias
- ✅ Configurar índices e chaves estrangeiras

### 6️⃣ Popular com Dados de Teste

```bash
npm run seed-db
```

Este comando adiciona:
- 👥 4 utilizadores de teste
- 📚 5 livros portugueses
- 📖 2 empréstimos ativos
- 📋 2 reservas pendentes
- 🔔 2 notificações

### 7️⃣ Iniciar o Servidor

**Modo desenvolvimento (com reinício automático):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

O servidor estará disponível em: **http://localhost:5000**

---

## 👤 Contas de Teste

Todos os utilizadores têm a password: **`123456`**

### Professor
- **Email:** josesaramago@gmail.com
- **Tipo:** professor

### Aluno 1
- **Email:** maria.silva@aluno.pt
- **Tipo:** aluno

### Aluno 2
- **Email:** joao.costa@aluno.pt
- **Tipo:** aluno

### Bibliotecária
- **Email:** ana.bib@biblioteca.pt
- **Tipo:** bibliotecario
- **Permissões:** Gestão completa do sistema

---

## 📚 Estrutura da Base de Dados

### Tabelas Criadas

1. **utilizadores** - Utilizadores do sistema
2. **livros** - Catálogo de livros
3. **emprestimos** - Gestão de empréstimos
4. **reservas** - Gestão de reservas
5. **notificacoes** - Sistema de notificações
6. **relatorios** - Relatórios do sistema
7. **catalogo** - Registo de utilização

### Diagrama de Relações

```
utilizadores (1) -----> (N) emprestimos
utilizadores (1) -----> (N) reservas
utilizadores (1) -----> (N) notificacoes
livros (1) -----------> (N) emprestimos
livros (1) -----------> (N) reservas
```

---

## 🧪 Testar a API

### 1. Verificar se o servidor está a funcionar

```bash
curl http://localhost:5000/api/livros
```

### 2. Fazer login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"josesaramago@gmail.com","password":"123456"}'
```

### 3. Usar Postman ou Insomnia

Importe os endpoints disponíveis em `README.md`

---

## 🔍 Verificar Base de Dados

**Aceder ao MariaDB:**
```bash
mysql -u root -p booktrack
```

**Comandos úteis:**
```sql
-- Ver todas as tabelas
SHOW TABLES;

-- Ver estrutura de uma tabela
DESCRIBE utilizadores;

-- Contar registos
SELECT COUNT(*) FROM livros;

-- Ver livros disponíveis
SELECT titulo, autor, copias_disponiveis FROM livros;

-- Ver empréstimos ativos
SELECT e.*, u.nome, l.titulo 
FROM emprestimos e
JOIN utilizadores u ON e.id_utilizador = u.id_utilizador
JOIN livros l ON e.id_livro = l.id_livro
WHERE e.estado = 'ativo';
```

---

## 🛠️ Resolução de Problemas

### ❌ Erro: "Access denied for user"

**Problema:** Password incorreta ou utilizador sem permissões

**Solução:**
```bash
# Reiniciar serviço MariaDB
sudo systemctl restart mariadb  # Linux
brew services restart mariadb   # macOS
net stop MariaDB                # Windows (cmd como admin)
net start MariaDB               # Windows (cmd como admin)

# Ou redefina a password do root
```

### ❌ Erro: "Cannot connect to MySQL"

**Verificar se o serviço está a correr:**
```bash
# Linux
sudo systemctl status mariadb

# macOS
brew services list

# Windows
sc query MariaDB
```

### ❌ Erro: "ER_DBACCESS_DENIED_ERROR"

**Problema:** Utilizador sem permissões na base de dados

**Solução:**
```sql
GRANT ALL PRIVILEGES ON booktrack.* TO 'seu_usuario'@'localhost';
FLUSH PRIVILEGES;
```

### ❌ Erro: "Port 5000 already in use"

**Mudar a porta no `.env`:**
```env
PORT=5001
```

### ❌ Erro durante "npm install"

```bash
# Limpar cache do npm
npm cache clean --force

# Apagar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 🔄 Reiniciar Base de Dados

Se precisar de limpar tudo e recomeçar:

```bash
# 1. Reinicializar (apaga e recria)
npm run init-db

# 2. Popular novamente
npm run seed-db
```

Ou manualmente no MariaDB:
```sql
DROP DATABASE IF EXISTS booktrack;
```

Depois execute `npm run init-db` novamente.

---

## 📊 Gestão do MariaDB

### Fazer Backup

```bash
mysqldump -u root -p booktrack > backup_booktrack.sql
```

### Restaurar Backup

```bash
mysql -u root -p booktrack < backup_booktrack.sql
```

### Ver Utilizadores

```sql
SELECT User, Host FROM mysql.user;
```

### Ver Bases de Dados

```sql
SHOW DATABASES;
```

---

## 🌐 Preparar para Produção

1. **Alterar JWT_SECRET** no `.env` para uma chave segura
2. **Criar utilizador dedicado** para a aplicação (não usar root)
3. **Configurar firewall** para proteger a porta 3306
4. **Ativar SSL/TLS** para conexões à base de dados
5. **Fazer backups regulares**
6. **Usar variáveis de ambiente** seguras (nunca commit .env)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor
2. Verifique os logs do MariaDB
3. Consulte a documentação oficial do MariaDB

---

## ✅ Checklist Final

- [ ] MariaDB instalado e a correr
- [ ] Base de dados `booktrack` criada
- [ ] Ficheiro `.env` configurado corretamente
- [ ] Dependências instaladas (`npm install`)
- [ ] Tabelas criadas (`npm run init-db`)
- [ ] Dados de teste inseridos (`npm run seed-db`)
- [ ] Servidor a correr (`npm run dev`)
- [ ] API a responder (`curl http://localhost:5000/api/livros`)

🎉 **Parabéns! O backend está pronto para usar!**
