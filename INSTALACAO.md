# 🚀 Guia de Instalação Rápida - BookTrack Backend

Este guia irá ajudá-lo a configurar e executar o backend do BookTrack em poucos minutos.

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado:
- **Node.js** (versão 16 ou superior) - [Download aqui](https://nodejs.org/)

## 📦 Passo 1: Instalar Dependências

Abra o terminal na pasta `booktrack-backend` e execute:

```bash
npm install
```

Este comando irá instalar todas as dependências necessárias:
- Express (servidor web)
- SQLite3 (base de dados)
- bcryptjs (encriptação de passwords)
- jsonwebtoken (autenticação)
- E outras bibliotecas auxiliares

⏱️ **Tempo estimado**: 1-2 minutos

## ⚙️ Passo 2: Configurar Variáveis de Ambiente

1. Copie o ficheiro de exemplo:
```bash
cp .env.example .env
```

2. **(Opcional)** Edite o ficheiro `.env` se desejar alterar:
   - Porta do servidor (padrão: 5000)
   - Chave secreta JWT (importante em produção!)

**Nota**: Para testes locais, os valores padrão já funcionam perfeitamente!

## 🗄️ Passo 3: Criar e Popular a Base de Dados

### 3.1 Inicializar a Base de Dados

```bash
npm run init-db
```

Este comando irá:
- ✅ Criar o diretório `database`
- ✅ Criar o ficheiro `booktrack.db`
- ✅ Criar todas as tabelas necessárias
- ✅ Criar índices para melhor performance

### 3.2 Popular com Dados de Exemplo

```bash
npm run seed-db
```

Este comando irá adicionar:
- 👥 4 utilizadores de teste
- 📚 8 livros portugueses clássicos
- 📋 2 reservas de exemplo
- 📖 2 empréstimos no histórico

**Credenciais de teste criadas:**
- 👨‍🏫 **Professor**: josesaramago@gmail.com / 123456
- 👨‍💼 **Admin**: admin@booktrack.pt / 123456
- 👨‍🎓 **Aluno**: maria.silva@escola.pt / 123456

## 🎯 Passo 4: Iniciar o Servidor

### Modo Desenvolvimento (com auto-restart)
```bash
npm run dev
```

### Modo Normal
```bash
npm start
```

Você deverá ver algo como:

```
╔══════════════════════════════════════════╗
║                                          ║
║     🚀 BookTrack API Server              ║
║                                          ║
╚══════════════════════════════════════════╝

📍 Servidor a correr em: http://localhost:5000
🌐 Modo: development
📚 API disponível em: http://localhost:5000/api

✨ Pronto para receber pedidos!
```

## 🧪 Passo 5: Testar a API

### Opção 1: Navegador
Abra o navegador e acesse:
```
http://localhost:5000/api
```

Você deverá ver uma resposta JSON com informações da API.

### Opção 2: cURL (Terminal)

**Teste básico:**
```bash
curl http://localhost:5000/api
```

**Login de teste:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"josesaramago@gmail.com","password":"123456"}'
```

**Listar livros:**
```bash
curl http://localhost:5000/api/livros
```

### Opção 3: Postman / Insomnia
Importe as seguintes requisições:

1. **Login**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "josesaramago@gmail.com",
       "password": "123456"
     }
     ```

2. **Listar Livros**
   - Method: GET
   - URL: `http://localhost:5000/api/livros`

## 📋 Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor |
| `npm run dev` | Inicia em modo desenvolvimento |
| `npm run init-db` | Reinicializa a base de dados (APAGA dados existentes!) |
| `npm run seed-db` | Adiciona dados de exemplo |

## 🔍 Verificar se Tudo Está a Funcionar

✅ **Checklist:**
- [ ] Servidor iniciado sem erros
- [ ] Acesso a `http://localhost:5000/api` retorna JSON
- [ ] Login com credenciais de teste funciona
- [ ] Listar livros retorna 8 livros

## ⚠️ Resolução de Problemas

### Erro: "Cannot find module"
**Solução**: Execute novamente `npm install`

### Erro: "Port 5000 already in use"
**Solução**: 
1. Edite o ficheiro `.env`
2. Altere `PORT=5000` para `PORT=5001` (ou outra porta livre)
3. Reinicie o servidor

### Erro: "ENOENT: no such file or directory"
**Solução**: Certifique-se de estar na pasta correta:
```bash
cd booktrack-backend
```

### Base de dados corrompida
**Solução**: Reinicialize a base de dados:
```bash
npm run init-db
npm run seed-db
```

## 🎉 Próximos Passos

Agora que o backend está funcionando:

1. ✅ Teste os diferentes endpoints (ver README.md completo)
2. 🔗 Configure o frontend React para conectar à API
3. 📝 Explore a documentação completa no README.md
4. 🛠️ Comece a desenvolver suas próprias features!

## 📚 Documentação Completa

Para informações detalhadas sobre:
- Todos os endpoints disponíveis
- Estrutura da base de dados
- Tipos de utilizadores e permissões
- Exemplos de requisições

Consulte o **README.md** completo na raiz do projeto.

## 💡 Dicas

- Use `npm run dev` durante o desenvolvimento para o servidor reiniciar automaticamente
- Mantenha o terminal aberto para ver os logs das requisições
- Use Postman ou Insomnia para testar a API de forma mais fácil
- Consulte os logs do servidor se algo não funcionar como esperado

## 🆘 Precisa de Ajuda?

Se encontrar algum problema:
1. Verifique os logs do servidor no terminal
2. Consulte a seção de "Resolução de Problemas" acima
3. Revise o README.md completo
4. Verifique se todas as dependências foram instaladas

---

**Boa sorte com o desenvolvimento! 🚀📚**
