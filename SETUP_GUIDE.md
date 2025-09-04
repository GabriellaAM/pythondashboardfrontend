# 🚀 Guia de Configuração Rápida

Este guia te levará do zero ao funcionamento completo da plataforma em poucos passos.

## ⚡ Configuração Expressa (15 minutos)

### 1. Preparação do Ambiente
```bash
# Clone o projeto
git clone <url-do-repositorio>
cd viz-canvas-io

# Instale dependências do frontend
npm install
```

### 2. Configuração do Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em "New Project"
3. Escolha um nome e senha para o banco
4. Aguarde a criação do projeto (1-2 minutos)
5. Vá em "SQL Editor" e execute este script:

```sql
-- Copie e cole o conteúdo completo do arquivo backend/database/migrations.sql
```

6. Vá em "Settings" → "API" e copie:
   - Project URL
   - anon/public key
   - service_role key (usado para operações administrativas)

### 3. Configure o Backend
```bash
cd backend

# Crie ambiente virtual Python
python -m venv venv

# Ative o ambiente (Windows)
venv\Scripts\activate

# Instale dependências
pip install -r requirements.txt

# Configure variáveis de ambiente
cp .env.example .env
```

Edite `backend/.env` com suas credenciais do Supabase:
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SECRET_KEY=minha-chave-super-secreta-aqui
```

### 4. Configure o Frontend
```bash
# Volte para a pasta raiz
cd ..

# Configure variáveis de ambiente
cp .env.example .env
```

Edite `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 5. Execute a Aplicação
**Terminal 1 (Backend):**
```bash
cd backend
python main.py
```




### 6. Acesse a Aplicação
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

## 🔧 Configuração Detalhada

### Configuração de Email (Opcional)
Para receber notificações de tarefas automatizadas:

1. **Gmail**: Ative 2FA e crie senha de app
   - Acesse: Google Account → Security → App Passwords
   - Crie uma senha específica para a aplicação

2. **Configure no `.env`**:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu@email.com
SMTP_PASSWORD=sua-senha-de-app
```

### Banco de Dados Local (Alternativa)
Se preferir PostgreSQL local ao invés do Supabase:

```bash
# Instale PostgreSQL
# Crie um banco chamado 'viz_platform'
# Configure no .env:
DATABASE_URL=postgresql://usuario:senha@localhost:5432/viz_platform
```

## 🧪 Teste Rápido

### 1. Crie uma Conta
1. Acesse http://localhost:5173
2. Clique em "Sign up"
3. Preencha os dados e crie sua conta

### 2. Teste um Gráfico
1. Clique em "Add Chart"
2. Deixe o código Python padrão
3. Clique em "Execute" para testar
4. Clique em "Save Chart"

### 3. Teste Execução de Código
Experimente este código Python:
```python
import pandas as pd
import numpy as np

# Criar dados de vendas fictícias
data = pd.DataFrame({
    'month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    'sales': [3000, 3500, 3200, 4100, 4500, 4200],
    'profit': [450, 525, 480, 615, 675, 630]
})

# Retornar para visualização
result = data.to_dict('records')
```

## ❗ Problemas Comuns

### Backend não inicia
```bash
# Verifique se o Python está ativado
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Reinstale dependências
pip install -r requirements.txt

# Verifique as variáveis de ambiente
cat .env  # Linux/Mac
type .env  # Windows
```

### Frontend não carrega
```bash
# Limpe cache do npm
npm cache clean --force
npm install

# Verifique se o arquivo .env existe
ls -la .env  # Linux/Mac
dir .env  # Windows
```

### Erro de Conexão com Supabase
1. Verifique se as URLs e keys estão corretas
2. Teste a conexão diretamente no Supabase Dashboard
3. Certifique-se de que o RLS está configurado corretamente

### Erro de Execução Python
- Verifique se todas as bibliotecas estão instaladas
- O código deve retornar uma variável chamada `result`
- Evite imports não permitidos (os, sys, subprocess, etc.)

## 📝 Próximos Passos

Após a configuração básica:

1. **Explore os Exemplos**: Teste diferentes tipos de gráficos
2. **Configure Automação**: Crie tarefas agendadas
3. **Personalize Dashboards**: Organize seus componentes
4. **Configure Notificações**: Adicione alertas por email
5. **Compartilhe Dashboards**: Gere links públicos

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no terminal
2. Consulte a documentação completa no README.md
3. Teste cada componente isoladamente
4. Abra uma issue no repositório

---

**✅ Configuração Completa!**

Sua plataforma de análise de dados está pronta para uso. Explore todas as funcionalidades e comece a criar seus dashboards personalizados!