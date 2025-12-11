# 🔗 Guia de Integração Frontend-Backend BookTrack

Este documento explica como conectar o frontend React ao backend Node.js.

## 📋 Visão Geral

- **Frontend**: React (Create React App) - Porta 3000
- **Backend**: Node.js + Express - Porta 5000
- **Comunicação**: REST API com autenticação JWT

## 🚀 Passo 1: Configurar Proxy no Frontend

Para evitar problemas de CORS durante o desenvolvimento, adicione proxy no `package.json` do frontend:

```json
{
  "name": "booktrack",
  "version": "0.1.0",
  "proxy": "http://localhost:5000",
  ...
}
```

## 📦 Passo 2: Instalar Axios no Frontend

Axios facilita requisições HTTP. Instale no diretório do frontend:

```bash
cd booktrack
npm install axios
```

## 🔧 Passo 3: Criar Serviço de API

Crie o ficheiro `src/services/api.js`:

```javascript
import axios from 'axios';

// Configuração base do Axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  getMe: () => 
    api.get('/auth/me'),
  
  updatePassword: (currentPassword, newPassword) => 
    api.put('/auth/update-password', { currentPassword, newPassword })
};

// ============ LIVROS ============
export const livrosAPI = {
  getAll: (params = {}) => 
    api.get('/livros', { params }),
  
  getById: (id) => 
    api.get(`/livros/${id}`),
  
  create: (livroData) => 
    api.post('/livros', livroData),
  
  update: (id, livroData) => 
    api.put(`/livros/${id}`, livroData),
  
  delete: (id) => 
    api.delete(`/livros/${id}`),
  
  getCategorias: () => 
    api.get('/livros/categorias/list')
};

// ============ RESERVAS ============
export const reservasAPI = {
  getAll: () => 
    api.get('/reservas'),
  
  getMinhas: () => 
    api.get('/reservas/minhas'),
  
  getById: (id) => 
    api.get(`/reservas/${id}`),
  
  create: (livroId) => 
    api.post('/reservas', { livro_id: livroId }),
  
  cancelar: (id) => 
    api.put(`/reservas/${id}/cancelar`),
  
  completar: (id) => 
    api.put(`/reservas/${id}/completar`)
};

// ============ EMPRÉSTIMOS ============
export const emprestimosAPI = {
  getAll: () => 
    api.get('/emprestimos'),
  
  getAtivos: () => 
    api.get('/emprestimos/ativos'),
  
  getHistorico: () => 
    api.get('/emprestimos/historico'),
  
  getById: (id) => 
    api.get(`/emprestimos/${id}`),
  
  create: (emprestimoData) => 
    api.post('/emprestimos', emprestimoData),
  
  devolver: (id) => 
    api.put(`/emprestimos/${id}/devolver`),
  
  renovar: (id, dias) => 
    api.put(`/emprestimos/${id}/renovar`, { dias })
};

export default api;
```

## 🔐 Passo 4: Criar Context de Autenticação

Crie `src/contexts/AuthContext.js`:

```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token salvo
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao registar' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

## 📝 Passo 5: Atualizar App.js

Modifique `src/App.js` para usar o backend:

```javascript
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { livrosAPI, reservasAPI, emprestimosAPI } from './services/api';

const BookTrackApp = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('login');
  const [livros, setLivros] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar livros
  useEffect(() => {
    if (isAuthenticated) {
      carregarLivros();
    }
  }, [isAuthenticated]);

  const carregarLivros = async () => {
    try {
      setLoading(true);
      const response = await livrosAPI.getAll();
      setLivros(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    if (result.success) {
      setCurrentPage('inicio');
    } else {
      alert(result.message);
    }
  };

  const handleReservar = async (livroId) => {
    try {
      const response = await reservasAPI.create(livroId);
      alert(response.data.message);
      carregarLivros(); // Atualizar lista
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao criar reserva');
    }
  };

  // ... resto do componente
};

function App() {
  return (
    <AuthProvider>
      <BookTrackApp />
    </AuthProvider>
  );
}

export default App;
```

## 🎯 Passo 6: Exemplo de Uso

### Login
```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  const result = await login(email, password);
  
  if (result.success) {
    console.log('Login efetuado!', user);
    navigate('/catalogo');
  } else {
    setError(result.message);
  }
};
```

### Listar Livros com Pesquisa
```javascript
const [livros, setLivros] = useState([]);
const [searchQuery, setSearchQuery] = useState('');

const carregarLivros = async () => {
  try {
    const response = await livrosAPI.getAll({ 
      search: searchQuery,
      disponivel: true 
    });
    setLivros(response.data.data);
  } catch (error) {
    console.error('Erro:', error);
  }
};

useEffect(() => {
  carregarLivros();
}, [searchQuery]);
```

### Criar Reserva
```javascript
const handleReservar = async (livroId) => {
  try {
    const response = await reservasAPI.create(livroId);
    alert(response.data.message);
    
    // Recarregar lista de livros
    await carregarLivros();
  } catch (error) {
    alert(error.response?.data?.message || 'Erro ao reservar');
  }
};
```

### Listar Reservas do Utilizador
```javascript
const [reservas, setReservas] = useState([]);

const carregarReservas = async () => {
  try {
    const response = await reservasAPI.getMinhas();
    setReservas(response.data.data);
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

### Cancelar Reserva
```javascript
const handleCancelar = async (reservaId) => {
  if (window.confirm('Tem certeza que deseja cancelar?')) {
    try {
      await reservasAPI.cancelar(reservaId);
      alert('Reserva cancelada!');
      carregarReservas();
    } catch (error) {
      alert('Erro ao cancelar reserva');
    }
  }
};
```

## ⚙️ Passo 7: Variáveis de Ambiente

Crie `.env` na raiz do frontend:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Para produção:
```env
REACT_APP_API_URL=https://sua-api.com/api
```

## 🚀 Executar Ambos os Servidores

### Terminal 1 - Backend
```bash
cd booktrack-backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd booktrack
npm start
```

## 🔍 Testar a Integração

1. ✅ Inicie o backend (porta 5000)
2. ✅ Inicie o frontend (porta 3000)
3. ✅ Abra http://localhost:3000
4. ✅ Faça login com: josesaramago@gmail.com / 123456
5. ✅ Navegue pelo catálogo
6. ✅ Crie uma reserva
7. ✅ Verifique suas reservas no perfil

## 🐛 Resolução de Problemas

### Erro CORS
Se encontrar erros de CORS:
1. Certifique-se que `proxy` está no package.json do frontend
2. Reinicie o servidor frontend
3. Verifique se o backend tem `cors()` habilitado

### Token Expirado
O token JWT expira em 7 dias. Para renovar:
- Faça logout e login novamente
- Ou implemente refresh token

### Erro 401
- Verifique se o token está sendo enviado
- Verifique se o utilizador ainda existe na BD
- Tente fazer login novamente

## 📚 Próximos Passos

1. ✅ Implementar tratamento de erros global
2. ✅ Adicionar loading states
3. ✅ Implementar paginação
4. ✅ Adicionar notificações toast
5. ✅ Implementar refresh token
6. ✅ Adicionar testes

## 💡 Dicas de Boas Práticas

- Sempre trate erros com try-catch
- Use estados de loading para melhor UX
- Implemente feedback visual para ações
- Valide dados no frontend antes de enviar
- Use constantes para URLs e mensagens
- Implemente logout automático em 401
- Salve o mínimo necessário no localStorage

---

**Boa integração! 🚀**
