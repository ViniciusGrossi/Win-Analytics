<p align="center">

  <h1 align="center">🎯 Win Analytics</h1>
  <p align="center">Plataforma premium de gestão e análise de apostas esportivas</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/Supabase-BaaS-3ECF8E?logo=supabase" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa" />
</p>

---

## 📖 Sobre

**Win Analytics** é uma Progressive Web App (PWA) para gestão profissional de apostas esportivas. A plataforma permite registrar apostas, gerenciar bancas em múltiplas casas de apostas, acompanhar resultados em tempo real e analisar performance com métricas avançadas — incluindo um assistente de IA integrado.

---

## ✨ Funcionalidades

### 📊 Dashboard
- KPIs em tempo real: Total Apostado, Lucro, ROI, Taxa de Acerto, Total de Apostas e Pendentes
- Gráfico de evolução de lucro ao longo do tempo
- Gráfico de distribuição de resultados (Ganhou/Perdeu/Cancelado/Cashout/Pendente)
- Filtros por período (date range) com persistência

### 📝 Gestão de Apostas
- CRUD completo de apostas com suporte a:
  - Categoria, tipo de aposta, casa de apostas, odd, bônus e **turbo** (multiplicador de lucro)
  - Partida, torneio e detalhes do mercado
- Filtros avançados: status, casa, período, categoria e torneio
- Estatísticas rápidas das apostas filtradas
- Tabela interativa com edição inline

### ✅ Resolução de Resultados
- Interface dedicada para confirmar resultados de apostas pendentes
- Cálculo automático de lucro/prejuízo com lógica de:
  - **Ganhou**: `(valor_apostado × (odd - 1) + bônus × (odd - 1)) × (1 + turbo)`
  - **Perdeu**: `-valor_apostado`
  - **Cashout**: `cashoutValue - valor_apostado`
  - **Cancelado**: devolução do valor apostado
- Atualização automática do saldo da casa de apostas

### 📈 Análises Avançadas (9 abas)
| Aba | Descrição |
|-----|-----------|
| **Dashboard** | Equity curve, lucro mensal, valores apostados, distribuição por tipo |
| **Performance** | Métricas de desempenho e exposição por casa |
| **Casas** | Performance comparativa entre casas de apostas |
| **Categorias** | Análise por categoria de aposta |
| **Odds** | Distribuição e performance por faixa de odds |
| **Risco** | Métricas de risco avançadas (drawdown, volatilidade, Sharpe ratio) |
| **Temporal** | Análise por dia da semana e mês |
| **Padrões** | Identificação de padrões de apostas e sequências |
| **Turbo** | Métricas específicas do multiplicador turbo |

### 💰 Gestão de Banca
- Gerenciamento de múltiplas casas de apostas (bookies)
- Saldo total, maior casa e última atualização
- **Unidades de aposta** calculadas automaticamente
- **Metas diárias/mensais** e limite de perda
- Histórico de transações (depósito, saque, recarga, transferência, bônus, ajuste)
- Criação de novas casas de apostas com saldo inicial

### 🤖 Assistente IA (Beta)
- Chat com inteligência artificial (Supabase Edge Function)
- Análise de performance baseada em dados reais
- Sugestões contextuais organizadas por categoria (Análise, Estratégia, Performance)
- Renderização de Markdown com suporte a GFM

### ⚙️ Configurações
- Perfil do usuário (email, ID)
- Tema claro/escuro (persistido via `next-themes`)
- Notificações push e email marketing
- Alteração de senha com validação Zod
- 2FA (em breve)

### 🔐 Autenticação
- Login e cadastro via Supabase Auth (email + senha)
- Rotas protegidas com `ProtectedRoute`
- Persistência de sessão com auto-refresh de token

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────┐
│              Frontend (PWA)             │
│  Vite + React 18 + TypeScript + Tailwind│
│  shadcn/ui · Framer Motion · Recharts  │
├───────────┬─────────────┬───────────────┤
│  Zustand  │  React Query │  React Router│
│  (Store)  │  (Cache)     │  (Routing)   │
├───────────┴─────────────┴───────────────┤
│            Services Layer               │
│  apostas · bookies · transactions · goals│
├─────────────────────────────────────────┤
│         Supabase (Backend)              │
│  Auth · PostgreSQL · Edge Functions     │
│  ai-assistant · ai-insights             │
└─────────────────────────────────────────┘
```

### Estrutura de Diretórios

```
Win-Analytics/
├── src/
│   ├── components/        # Componentes React organizados por domínio
│   │   ├── analysis/      # Tabs e componentes de análise
│   │   ├── apostas/       # Tabela, filtros, formulário de apostas
│   │   ├── banca/         # BookieCard, GoalsManager, BettingUnits
│   │   ├── dashboard/     # KPICard, LucroChart, DistributionChart
│   │   ├── layout/        # AppSidebar, MainLayout, Topbar
│   │   ├── resultados/    # ResultadoCard, ResultadosKPIs
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom hooks (useAuth, useAnalysisMetrics, etc.)
│   ├── integrations/      # Supabase client + tipos gerados
│   ├── lib/               # Utilitários (utils.ts, constants.ts)
│   ├── pages/             # 9 páginas (Dashboard, Apostas, Banca, etc.)
│   ├── services/          # Camada de dados (apostas, bookies, transactions, goals)
│   ├── store/             # Zustand store (useFilterStore)
│   └── types/             # TypeScript type definitions
├── supabase/
│   ├── functions/         # Edge Functions (ai-assistant, ai-insights)
│   └── migrations/        # 11 migrações SQL
└── public/                # Assets estáticos e ícone PWA
```

---

## 🛠 Tech Stack

| Camada        | Tecnologias                                        |
|---------------|---------------------------------------------------|
| **Frontend**  | React 18, TypeScript 5.8, Vite 5.4                |
| **Styling**   | Tailwind CSS 3.4, shadcn/ui, Framer Motion        |
| **Estado**    | Zustand (persist), TanStack React Query            |
| **Gráficos**  | Recharts 3.3                                       |
| **Roteamento**| React Router DOM 6.30                              |
| **Backend**   | Supabase (Auth, PostgreSQL, Edge Functions)        |
| **Forms**     | React Hook Form + Zod                              |
| **PWA**       | vite-plugin-pwa, Workbox (NetworkFirst caching)    |
| **Deploy**    | Vercel                                              |
| **Linting**   | ESLint 9 + typescript-eslint                       |

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** ≥ 18
- **npm** ou **bun**
- Conta no [Supabase](https://supabase.com/) (projeto já configurado)

### Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd Win-Analytics

# Instalar dependências
npm install
# ou
bun install
```

### Variáveis de Ambiente (opcional)

O projeto possui valores padrão embarcados, mas pode ser configurado via `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anonima
```

### Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:8080`.

### Build para Produção

```bash
npm run build
npm run preview
```

---

## 📊 Modelo de Dados

### Tabela `aposta`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `int` | PK auto-incremento |
| `user_id` | `uuid` | FK para auth.users |
| `categoria` | `text` | Categoria da aposta (ex: Futebol) |
| `tipo_aposta` | `text` | Tipo (Simples, Múltipla, etc.) |
| `casa_de_apostas` | `text` | Nome da casa (Bet365, etc.) |
| `valor_apostado` | `numeric` | Valor apostado em R$ |
| `odd` | `numeric` | Odd decimal |
| `bonus` | `numeric` | Valor de bônus aplicado |
| `turbo` | `numeric` | Multiplicador de lucro (%) |
| `resultado` | `text` | Ganhou/Perdeu/Cancelado/Cashout/Pendente |
| `valor_final` | `numeric` | Lucro ou prejuízo calculado |
| `partida` | `text` | Descrição da partida |
| `torneio` | `text` | Nome do torneio |
| `data` | `date` | Data da aposta |

### Tabela `bookies`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `int` | PK |
| `user_id` | `uuid` | FK para auth.users |
| `name` | `text` | Nome da casa de apostas |
| `balance` | `numeric` | Saldo atual |
| `last_deposit` | `timestamp` | Último depósito |
| `last_withdraw` | `timestamp` | Último saque |
| `last_update` | `timestamp` | Última atualização |

### Tabela `transactions`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `int` | PK |
| `user_id` | `uuid` | FK para auth.users |
| `bookie_id` | `int` | FK para bookies |
| `amount` | `numeric` | Valor da transação |
| `type` | `text` | deposit/withdraw/recarga/saque/transferencia/bonus/ajuste/outros_esportes |
| `description` | `text` | Descrição |

### Tabela `goals`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `int` | PK |
| `user_id` | `uuid` | FK para auth.users |
| `daily_goal` | `numeric` | Meta diária (R$) |
| `monthly_goal` | `numeric` | Meta mensal (R$) |
| `loss_limit` | `numeric` | Limite de perda (R$) |

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Projeto privado. Todos os direitos reservados.
