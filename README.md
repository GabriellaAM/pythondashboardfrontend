# Plataforma de Análise de Dados e Visualização Dinâmica

Uma plataforma web completa para criação de dashboards dinâmicos e personalizáveis, com execução segura de código Python para processamento de dados e automação de tarefas.

## 🚀 Funcionalidades

### ✅ Implementadas

#### 🔐 Sistema de Autenticação
- **Login/Cadastro**: Sistema completo de autenticação de usuários
- **Controle de Sessão**: JWT tokens para sessões seguras
- **Proteção de Rotas**: Páginas protegidas por autenticação

#### 📊 Gerenciamento de Dashboards
- **CRUD Completo**: Criar, visualizar, editar e excluir dashboards
- **Compartilhamento**: Links públicos e privados para dashboards
- **Controle de Permissões**: Sistema de permissões granular

#### 🎨 Criação de Componentes
- **Modal de Gráficos**: Editor com código Python e seleção de tipos de gráfico
- **Modal de Tabelas**: Interface estilo Excel para edição de dados
- **Tipos Suportados**: Line, Bar, Pie, Area charts e tabelas customizáveis
- **Gerenciamento**: Renomear, editar, duplicar e excluir componentes

#### 🐍 Executor de Código Python
- **Ambiente Seguro**: Execução isolada sem Docker (usando subprocess)
- **Bibliotecas Pré-instaladas**: pandas, numpy, requests, plotly, scikit-learn
- **Validação de Segurança**: Sistema de whitelist/blacklist para imports e funções
- **Logging**: Histórico de execuções com resultados e erros

#### ⏰ Sistema de Automação
- **Agendamento**: Tarefas programadas (hourly, daily, weekly, monthly)
- **Notificações**: Alertas por email para falhas ou sucessos
- **Execução Manual**: Trigger imediato de tarefas agendadas
- **Monitoramento**: Dashboard de tarefas ativas

#### 🗄️ Banco de Dados (Supabase)
- **Tabelas**: users, dashboards, components, scheduled_tasks, execution_logs
- **RLS (Row Level Security)**: Políticas de segurança automáticas
- **Migrações**: Scripts SQL completos para setup

#### 🎯 Backend API (FastAPI)
- **RESTful**: Endpoints organizados por módulos
- **Documentação**: Swagger UI automática
- **Validação**: Pydantic models para dados
- **CORS**: Configurado para desenvolvimento

#### 🖥️ Frontend (React + Vite)
- **UI Moderna**: ShadCN/UI components
- **Estado Global**: Context API para autenticação
- **Routing**: React Router com proteção de rotas
- **TypeScript**: Tipagem completa

## 📁 Estrutura do Projeto

```
viz-canvas-io/
├── backend/                    # API Backend (FastAPI)
│   ├── main.py                # Aplicação principal
│   ├── requirements.txt       # Dependências Python
│   ├── .env.example          # Variáveis de ambiente
│   │
│   ├── api/                   # Endpoints da API
│   │   ├── auth.py           # Autenticação
│   │   ├── dashboards.py     # Gerenciamento de dashboards
│   │   ├── components.py     # Componentes (gráficos/tabelas)
│   │   ├── executor.py       # Execução de código Python
│   │   └── automation.py     # Sistema de automação
│   │
│   └── database/             # Configuração do banco
│       ├── connection.py     # Conexão Supabase
│       ├── models.py         # Modelos Pydantic
│       └── migrations.sql    # Scripts de migração
│
├── src/                      # Frontend (React)
│   ├── components/           # Componentes React
│   │   ├── ui/              # ShadCN components
│   │   ├── AppSidebar.tsx   # Menu lateral
│   │   ├── ChartModal.tsx   # Modal de gráficos
│   │   ├── TableModal.tsx   # Modal de tabelas
│   │   └── Layout.tsx       # Layout principal
│   │
│   ├── contexts/            # Context API
│   │   └── AuthContext.tsx  # Contexto de autenticação
│   │
│   ├── lib/                 # Utilitários
│   │   └── api.ts          # Cliente API
│   │
│   ├── pages/              # Páginas da aplicação
│   │   ├── Dashboard.tsx   # Página principal
│   │   ├── Login.tsx       # Página de login
│   │   ├── Register.tsx    # Página de cadastro
│   │   ├── Analytics.tsx   # Análises
│   │   ├── DataSources.tsx # Fontes de dados
│   │   └── Settings.tsx    # Configurações
│   │
│   └── App.tsx             # Componente raiz
│
├── .env.example            # Variáveis do frontend
├── package.json            # Dependências Node.js
├── vite.config.ts         # Configuração Vite
└── README.md              # Esta documentação
```

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- **Node.js** 18+ com npm
- **Python** 3.9+
- **Conta Supabase** (para banco de dados)
- **Conta Gmail** (para envio de emails)

### 1. Configuração do Frontend

```bash
# Clone o repositório
git clone <url-do-repo>
cd viz-canvas-io

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Configuração do Backend

```bash
# Entre na pasta do backend
cd backend

# Crie um ambiente virtual Python
python -m venv venv

# Ative o ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instale dependências
pip install -r requirements.txt

# Configure variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `backend/.env`:
```env
# Database Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_supabase_anon_key
SUPABASE_SERVICE_KEY=sua_supabase_service_key
DATABASE_URL=postgresql://username:password@localhost:5432/viz_platform

# JWT Configuration
SECRET_KEY=uma_chave_super_secreta_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. No SQL Editor, execute o script `backend/database/migrations.sql`
3. Configure RLS (Row Level Security) se necessário
4. Copie as credenciais para o arquivo `.env`

### 4. Configuração de Email (Gmail)

1. Ative a autenticação de 2 fatores na sua conta Google
2. Crie uma "Senha de app" em: Google Account → Security → App Passwords
3. Use essa senha no arquivo `.env` (não a senha principal)

## 🚀 Executando a Aplicação

### Backend (Terminal 1)
```bash
cd backend
python main.py
# ou
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Terminal 2)
```bash
npm run dev
```

### Acessos
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

## 🔒 Segurança

### Execução de Código Python
- **Ambiente Isolado**: Subprocess com timeout configura
- **Validação**: Whitelist de imports e funções permitidas
- **Restrições**: Blacklist de operações perigosas
- **Timeout**: Execução limitada a 30 segundos
- **Memória**: Limite configurável de uso de RAM

### Módulos Restritos
❌ **Proibidos**: os, sys, subprocess, socket, urllib, pickle, eval, exec, open, file

✅ **Permitidos**: pandas, numpy, requests, plotly, scikit-learn, matplotlib, seaborn

### Banco de Dados
- **RLS Habilitado**: Row Level Security ativado
- **Políticas**: Usuários só acessam seus próprios dados
- **Autenticação**: JWT tokens com expiração
- **Criptografia**: Senhas hasheadas com bcrypt

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Cadastro de usuário
- `GET /api/auth/me` - Dados do usuário atual

### Dashboards
- `GET /api/dashboards/` - Listar dashboards do usuário
- `POST /api/dashboards/` - Criar dashboard
- `PUT /api/dashboards/{id}` - Atualizar dashboard
- `DELETE /api/dashboards/{id}` - Deletar dashboard
- `POST /api/dashboards/{id}/share` - Criar link de compartilhamento

### Componentes
- `GET /api/components/dashboard/{id}` - Componentes do dashboard
- `POST /api/components/` - Criar componente
- `PUT /api/components/{id}` - Atualizar componente
- `DELETE /api/components/{id}` - Deletar componente

### Execução de Código
- `POST /api/executor/run` - Executar código Python
- `GET /api/executor/logs/{component_id}` - Logs de execução

### Automação
- `GET /api/automation/tasks` - Listar tarefas agendadas
- `POST /api/automation/tasks` - Criar tarefa agendada
- `PUT /api/automation/tasks/{id}` - Atualizar tarefa
- `DELETE /api/automation/tasks/{id}` - Deletar tarefa
- `POST /api/automation/tasks/{id}/run` - Executar tarefa manualmente

## 🧪 Testes

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
npm run test
```

## 📝 Exemplo de Código Python

```python
import pandas as pd
import numpy as np

# Gerar dados de exemplo
dates = pd.date_range('2024-01-01', periods=12, freq='M')
values = np.random.randint(1000, 5000, 12)

# Criar DataFrame
data = pd.DataFrame({
    'month': [d.strftime('%b %Y') for d in dates],
    'revenue': values,
    'growth': np.random.uniform(-10, 20, 12)
})

# Retornar dados para visualização
result = data.to_dict('records')
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique os logs do backend e frontend
2. Confirme as variáveis de ambiente
3. Teste a conexão com o Supabase
4. Abra uma issue no repositório

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] Integração com APIs externas (REST/GraphQL)
- [ ] Sistema de templates de dashboard
- [ ] Colaboração em tempo real
- [ ] Versionamento de componentes
- [ ] Marketplace de componentes
- [ ] Integração com Jupyter Notebooks
- [ ] Exportação de dashboards (PDF/PNG)
- [ ] Temas customizáveis
- [ ] Mobile responsivo
- [ ] Sistema de plugins

---

**🎉 Plataforma Completa Implementada!**

Todas as funcionalidades principais foram desenvolvidas e estão prontas para uso. A plataforma oferece uma solução robusta para análise de dados, visualização dinâmica e automação de tarefas, com foco em segurança e usabilidade.