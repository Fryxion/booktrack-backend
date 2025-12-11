# BookTrack Backend API

API REST para o sistema de gestão de biblioteca BookTrack, desenvolvida em Node.js com Express e SQLite.

## 📋 Requisitos

- Node.js (versão 16 ou superior)
- npm (geralmente incluído com Node.js)

## 🚀 Instalação

1. **Instalar dependências**
```bash
npm install
```

2. **Configurar variáveis de ambiente**
```bash
# Copiar ficheiro de exemplo
cp .env.example .env

# Editar o ficheiro .env e configurar as variáveis
```

3. **Inicializar base de dados**
```bash
npm run init-db
```

4. **Popular base de dados com dados de exemplo** (opcional)
```bash
npm run seed-db
```

## 💻 Executar o Servidor

### Modo de Desenvolvimento (com nodemon)
```bash
npm run dev
```

### Modo de Produção
```bash
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📚 Estrutura do Projeto

```
booktrack-backend/
├── config/
│   └── database.js          # Configuração da base de dados SQLite
├── middleware/
│   ├── auth.js              # Middleware de autenticação JWT
│   └── errorHandler.js      # Middleware de tratamento de erros
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── livros.js            # Rotas de gestão de livros
│   ├── reservas.js          # Rotas de gestão de reservas
│   └── emprestimos.js       # Rotas de gestão de empréstimos
├── scripts/
│   ├── initDatabase.js      # Script de inicialização da BD
│   └── seedDatabase.js      # Script para popular BD com dados
├── database/
│   └── booktrack.db         # Base de dados SQLite (criada automaticamente)
├── .env.example             # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
├── README.md
└── server.js                # Ficheiro principal do servidor
```

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Após o login, inclua o token no header das requisições:

```
Authorization: Bearer <seu_token_jwt>
```

## 📡 Endpoints da API

### Autenticação

#### Registar Utilizador
```http
POST /api/auth/register
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "tipo": "Aluno"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

#### Obter Dados do Utilizador Atual
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Atualizar Password
```http
PUT /api/auth/update-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "senha123",
  "newPassword": "novaSenha456"
}
```

### Livros

#### Listar Livros
```http
GET /api/livros
GET /api/livros?search=lusíadas
GET /api/livros?categoria=Romance
GET /api/livros?disponivel=true
```

#### Obter Detalhes de um Livro
```http
GET /api/livros/:id
```

#### Criar Livro (Staff apenas)
```http
POST /api/livros
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Novo Livro",
  "autor": "Autor Nome",
  "isbn": "978-1234567890",
  "publicacao": "2025",
  "categoria": "Romance",
  "descricao": "Descrição do livro",
  "quantidade_total": 3
}
```

#### Atualizar Livro (Staff apenas)
```http
PUT /api/livros/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantidade_disponivel": 2
}
```

#### Eliminar Livro (Staff apenas)
```http
DELETE /api/livros/:id
Authorization: Bearer <token>
```

#### Listar Categorias
```http
GET /api/livros/categorias/list
```

### Reservas

#### Listar Reservas
```http
GET /api/reservas
Authorization: Bearer <token>
```

#### Listar Minhas Reservas Ativas
```http
GET /api/reservas/minhas
Authorization: Bearer <token>
```

#### Obter Detalhes de uma Reserva
```http
GET /api/reservas/:id
Authorization: Bearer <token>
```

#### Criar Reserva
```http
POST /api/reservas
Authorization: Bearer <token>
Content-Type: application/json

{
  "livro_id": 1
}
```

#### Cancelar Reserva
```http
PUT /api/reservas/:id/cancelar
Authorization: Bearer <token>
```

#### Completar Reserva (Staff apenas)
```http
PUT /api/reservas/:id/completar
Authorization: Bearer <token>
```

### Empréstimos

#### Listar Empréstimos
```http
GET /api/emprestimos
Authorization: Bearer <token>
```

#### Listar Empréstimos Ativos
```http
GET /api/emprestimos/ativos
Authorization: Bearer <token>
```

#### Obter Histórico de Empréstimos
```http
GET /api/emprestimos/historico
Authorization: Bearer <token>
```

#### Obter Detalhes de um Empréstimo
```http
GET /api/emprestimos/:id
Authorization: Bearer <token>
```

#### Criar Empréstimo (Staff apenas)
```http
POST /api/emprestimos
Authorization: Bearer <token>
Content-Type: application/json

{
  "utilizador_id": 1,
  "livro_id": 2,
  "dias": 14
}
```

#### Registar Devolução (Staff apenas)
```http
PUT /api/emprestimos/:id/devolver
Authorization: Bearer <token>
```

#### Renovar Empréstimo
```http
PUT /api/emprestimos/:id/renovar
Authorization: Bearer <token>
Content-Type: application/json

{
  "dias": 14
}
```

## 👥 Tipos de Utilizadores

- **Aluno**: Pode consultar catálogo, fazer reservas e ver seu histórico
- **Professor**: Mesmas permissões que Aluno
- **Funcionário**: Pode gerir livros, empréstimos e todas as reservas
- **Admin**: Acesso total ao sistema

## 🗃️ Base de Dados

### Tabelas

- **utilizadores**: Informação dos utilizadores
- **livros**: Catálogo de livros
- **reservas**: Reservas de livros
- **emprestimos**: Empréstimos ativos e histórico

### Relações

- Um utilizador pode ter várias reservas
- Um utilizador pode ter vários empréstimos
- Um livro pode ter várias reservas
- Um livro pode ter vários empréstimos

## 🧪 Dados de Teste

Após executar `npm run seed-db`, os seguintes utilizadores estarão disponíveis:

### Professor
- Email: josesaramago@gmail.com
- Password: 123456

### Admin
- Email: admin@booktrack.pt
- Password: 123456

### Aluno
- Email: maria.silva@escola.pt
- Password: 123456

## 📝 Respostas da API

### Sucesso
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": { }
}
```

### Erro
```json
{
  "success": false,
  "message": "Descrição do erro"
}
```

### Erro de Validação
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Email inválido",
      "param": "email"
    }
  ]
}
```

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor
- `npm run dev` - Inicia o servidor em modo desenvolvimento (com nodemon)
- `npm run init-db` - Inicializa a base de dados
- `npm run seed-db` - Popula a base de dados com dados de exemplo

## 🛡️ Segurança

- Passwords encriptadas com bcrypt
- Autenticação via JWT
- Validação de dados com express-validator
- Proteção contra SQL injection
- CORS configurado

## 📄 Licença

Este projeto é apenas para fins educacionais.

## 🤝 Contribuição

Para contribuir com o projeto, por favor:

1. Faça fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para questões ou problemas, por favor abra uma issue no repositório.
