# 🎯 WagerArt - Plataforma Profissional de Gestão de Apostas Esportivas

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 📊 Sobre o Projeto

**WagerArt** é uma plataforma completa e profissional para gestão, análise e otimização de apostas esportivas. Desenvolvida com as tecnologias mais modernas do mercado, oferece uma experiência visual premium com funcionalidades robustas de análise estatística, controle de banca e insights em tempo real.

### 🌟 Diferenciais

- **Interface Premium**: Design moderno com glassmorphism, animações suaves e dark mode
- **Análises Avançadas**: 9 abas especializadas com mais de 50 métricas diferentes
- **Gestão Completa**: Controle total do ciclo de apostas do registro ao resultado
- **Insights em Tempo Real**: KPIs dinâmicos e gráficos interativos
- **Otimização de Performance**: Identifica padrões, sweet spots e oportunidades de melhoria
- **Controle de Bankroll**: Gestão profissional de saldo por casa de apostas

---

## ✨ Funcionalidades Principais

### 🏠 Dashboard

Dashboard intuitivo com visão geral consolidada de todas as operações:

- **KPIs Principais**:
  - Total Apostado
  - Lucro/Prejuízo (com variação percentual)
  - ROI (Return on Investment)
  - Taxa de Acerto
  - Yield
  - Total de Apostas

- **Gráficos Dinâmicos**:
  - Evolução do Retorno Acumulado (equity curve)
  - Lucro Mensal (bar chart)
  - Distribuição de Valores Apostados
  - Lucratividade por Tipo de Aposta
  
- **Cards Informativos**:
  - Atividade (total apostas, apostas/dia, dias ativos)
  - Odds (média, mais alta, mais baixa)
  - Sequências (maior streak de vitórias/derrotas, atual)

### 📝 Gestão de Apostas

Sistema completo de CRUD para apostas com interface intuitiva:

**Criar Nova Aposta**:
- Seleção de categoria (Futebol, Tênis, Basquete, E-Sports, etc.)
- Tipo de aposta (Simples, Múltipla, Sistema)
- Casa de apostas
- Valor da aposta (com validação de saldo)
- Odd (inicial e final)
- Mercado (1X2, Over/Under, Handicap, etc.)
- Opções especiais:
  - ⚡ Turbo (25%, 50%, 75%, 100%)
  - 🎁 Bônus (aposta sem risco de saldo)
- Preview automático do retorno potencial
- Detalhes adicionais (partida, torneio, descrição)

**Filtros Avançados**:
- Por período (data inicial e final)
- Por casa de apostas
- Por tipo de aposta
- Por resultado (Ganhou, Perdeu, Cashout, Cancelado, Pendente)
- Por mercado
- Por faixa de odd (mínima e máxima)

**Tabela Interativa**:
- Ordenação por qualquer coluna
- Paginação customizável
- Ações rápidas (editar, excluir)
- Badges coloridos por status
- Indicadores visuais (turbo ⚡, bônus 🎁)

### ✅ Resultados

Interface dedicada para conciliação rápida de apostas pendentes:

- **Lista de Pendentes**: Visualização clara de todas apostas aguardando resultado
- **Ações Rápidas**:
  - ✅ Marcar como Ganhou
  - ❌ Marcar como Perdeu
  - 💰 Registrar Cashout (com valor)
  - ⭕ Marcar como Cancelado
  
- **Preview de Impacto**: Visualização prévia do impacto no saldo antes de confirmar
- **Histórico Completo**: Registro de todas as operações realizadas
- **Atualização em Tempo Real**: Sincronização automática com o backend

### 📊 Análises Avançadas

Sistema de análises com **9 abas especializadas** oferecendo mais de **50 métricas diferentes**:

#### 1. **Dashboard Tab**
- Visão geral consolidada
- Principais KPIs e gráficos
- Insights automáticos gerados por IA

#### 2. **Performance Tab**
**Métricas Básicas**:
- Yield (rentabilidade média por aposta)
- Consistência ROI (% de meses lucrativos)
- Strike Rate (taxa de acerto em odds altas >2.0)
- Apostas/Mês (volume médio mensal)
- Correlação Stake vs Retorno

**Métricas Avançadas** (Ratios Financeiros):
- **Sharpe Ratio**: Retorno ajustado ao risco
- **Sortino Ratio**: Retorno ajustado ao risco negativo
- **Calmar Ratio**: Retorno anualizado vs drawdown máximo
- **Win/Loss Ratio**: Proporção vitórias/derrotas

**Análise Temporal**:
- Melhor Mês (ROI)
- Pior Mês (ROI)
- ROI Mês Atual

**Otimização**:
- Odd Ótima (faixa com melhor ROI)
- Volume Ideal (valor mensal recomendado)
- ROI Projetado (na odd ótima)

**Eficiência**:
- Precisão
- Recall
- F1-Score

#### 3. **Casas Tab** 🏢
**Filtros Inteligentes**:
- Todas as casas
- Casas com 5+ apostas
- Casas com 10+ apostas

**Top 3 Casas**:
- Ranking visual (#1, #2, #3)
- Avaliação por estrelas (⭐)
- ROI, Taxa de Acerto, Lucro, Volume

**Tabela Comparativa**:
- Casa de Apostas
- Total de Apostas
- Taxa de Acerto
- ROI
- Lucro Total
- Odd Média
- Avaliação (5 estrelas)

**Gráficos**:
- Performance por Casa (lucro/prejuízo)
- ROI por Casa (horizontal bar)
- Volume vs Performance (scatter plot)

**Melhores Mercados por Casa**:
- Identificação do mercado mais lucrativo em cada casa

#### 4. **Categorias Tab** 🏆
**KPIs**:
- Categoria Mais Lucrativa
- Melhor Taxa de Acerto
- Melhor ROI
- Categorias Ativas

**Tabela Detalhada**:
- Categoria
- Total de Apostas
- Taxa de Acerto
- ROI
- Lucro
- Odd Média
- Tendência (📈 Excelente / → Estável / 📉 Baixo)

**Top 5 Categorias**:
- Cards detalhados com todas as métricas
- Ranking visual (#1-#5)

**Gráficos**:
- Performance por Categoria (bar + line chart combinado)
- Distribuição de Apostas (pie chart)

#### 5. **Odds Tab** 🎯
**Métricas de Value Betting**:
- Value Bets (% de apostas com ROI > 10%)
- Acerto em Odds Baixas (1.0-1.5)
- Acerto em Odds Altas (>3.0)
- Odd Média Vencedora

**Sweet Spot Analysis**:
- Faixa de odds ideal
- ROI da faixa
- Taxa de acerto da faixa

**Análise por Faixa**:
- 1.00-1.50
- 1.51-2.00
- 2.01-3.00
- 3.00+
- Taxa de acerto e ROI para cada faixa

**Gráficos**:
- Odd vs Performance (composed chart)
- Eficiência por Faixa (progress bars)

**Timing Insight**:
- Recomendações sobre timing de apostas

#### 6. **Risco Tab** 🛡️
**Métricas Principais**:
- Max Drawdown (maior queda do pico)
- Volatilidade (desvio padrão dos resultados)
- Score de Risco (0-100, menor é melhor)
- Kelly % (% recomendado da banca por aposta)

**Métricas Avançadas**:
- **Ulcer Index**: Intensidade de drawdown ao longo do tempo
- **MAR Ratio**: Retorno vs maior drawdown
- **Value at Risk (95%)**: Perda máxima esperada em 95% dos casos
- **Expected Shortfall**: Perda média quando excede o VaR
- **Recovery Time**: Tempo médio para recuperar de drawdowns
- **Risk-Adjusted Return**: Retorno ajustado ao risco

**Gráfico de Drawdown**:
- Visualização temporal das quedas

#### 7. **Temporal Tab** 📅
**Métricas Temporais**:
- Melhor Dia da Semana
- Melhor Horário (se disponível)
- Melhor Mês
- Dias Consecutivos (streak atual)

**Heatmap Mensal**:
- Performance (ROI) por mês/ano
- Visualização com cores (verde = lucro, vermelho = prejuízo)
- Legenda interativa

**Gráficos**:
- Performance por Dia da Semana
- Evolução Mensal

#### 8. **Padrões Tab** 🧩
**Indicadores**:
- Consistência (estabilidade da taxa de acerto)
- Momentum (tendência atual vs histórico)
- Ciclo Dominante (frequência de apostas)
- Direção (tendência ascendente/descendente/lateral)

**Análise por Categoria/Torneio**:
- Padrões identificados em cada categoria
- Filtro para categorias com 10+ apostas
- Métricas: apostas, taxa, ROI, lucro

**Análise de Bônus**:
- Apostas com Bônus
- ROI com Bônus
- Taxa de Acerto com Bônus
- Lucro de Bônus

#### 9. **Turbo Tab** ⚡
**Comparativo Turbo vs Normal**:
- Total com Turbo
- ROI Turbo
- Impacto do Turbo (diferença de ROI)

**Análise Detalhada**:
- Taxa de Acerto (com turbo vs sem turbo)
- ROI (com turbo vs sem turbo)
- Volume apostado
- Lucro médio

**Performance por Nível de Turbo**:
- Breakdown por porcentagem (25%, 50%, 75%, 100%)
- Métricas específicas para cada nível

### 💰 Gestão de Banca

Controle profissional de saldo por casa de apostas:

**Visão Consolidada**:
- Saldo total em todas as casas
- Lista de todas as casas ativas
- Saldo individual por casa
- Última atualização

**Transações**:
- Depósitos
- Saques
- Histórico completo

**Regras de Negócio**:
- Débito automático ao criar aposta
- Crédito automático ao ganhar
- Devolução ao cancelar
- Cashout manual

---

## 🛠️ Tecnologias Utilizadas

### Frontend Core
- **React 18**: Biblioteca principal para UI
- **TypeScript**: Tipagem estática e segurança
- **Vite**: Build tool moderna e rápida

### Estilização
- **Tailwind CSS**: Framework CSS utility-first
- **shadcn/ui**: Componentes baseados em Radix UI
- **Framer Motion**: Animações fluidas e profissionais
- **Lucide React**: Ícones modernos

### Visualização de Dados
- **Recharts**: Gráficos interativos e responsivos
- **TanStack Table**: Tabelas avançadas com ordenação/filtro/paginação

### Formulários e Validação
- **react-hook-form**: Gerenciamento de formulários performático
- **zod**: Validação de schemas TypeScript-first

### Backend e Database
- **Supabase**: BaaS (Backend as a Service)
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security (RLS)

### Gerenciamento de Estado
- **Zustand**: State management leve e simples
- **TanStack Query**: Cache e sincronização de dados

### Utilitários
- **dayjs**: Manipulação de datas
- **clsx / tailwind-merge**: Utilitários para className

---

## 🗄️ Arquitetura e Estrutura de Dados

### Banco de Dados (Supabase)

#### Tabela: `aposta`
```sql
CREATE TABLE aposta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  tipo_aposta TEXT NOT NULL,
  casa_de_apostas TEXT NOT NULL,
  valor_apostado DECIMAL(10,2) NOT NULL,
  odd_inicial DECIMAL(5,2) NOT NULL,
  odd_final DECIMAL(5,2),
  valor_final DECIMAL(10,2),
  bonus BOOLEAN DEFAULT FALSE,
  turbo INTEGER DEFAULT 0,
  resultado TEXT DEFAULT 'Pendente',
  mercado TEXT,
  detalhes TEXT,
  partida TEXT,
  torneio TEXT,
  data DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Campos**:
- `categoria`: Futebol, Tênis, Basquete, E-Sports, etc.
- `tipo_aposta`: Simples, Múltipla, Sistema
- `casa_de_apostas`: Nome da bookmaker
- `valor_apostado`: Valor da stake
- `odd_inicial`: Odd no momento da aposta
- `odd_final`: Odd final (pode mudar)
- `valor_final`: Retorno após resultado
- `bonus`: TRUE se aposta com bônus (sem risco de saldo)
- `turbo`: 0, 25, 50, 75 ou 100
- `resultado`: Pendente, Ganhou, Perdeu, Cashout, Cancelado
- `mercado`: 1X2, Over/Under, Handicap, etc.

#### Tabela: `bookies`
```sql
CREATE TABLE bookies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  last_deposit DECIMAL(10,2),
  last_withdraw DECIMAL(10,2),
  last_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Estrutura de Pastas

```
wager-art/
├── src/
│   ├── components/
│   │   ├── analysis/          # Componentes de análise
│   │   │   ├── tabs/          # Abas especializadas
│   │   │   │   ├── CasasTab.tsx
│   │   │   │   ├── CategoriasTab.tsx
│   │   │   │   ├── DashboardTab.tsx
│   │   │   │   ├── OddsTab.tsx
│   │   │   │   ├── PadroesTab.tsx
│   │   │   │   ├── PerformanceTab.tsx
│   │   │   │   ├── RiscoTab.tsx
│   │   │   │   ├── TemporalTab.tsx
│   │   │   │   └── TurboTab.tsx
│   │   │   ├── AnalysisFilters.tsx
│   │   │   └── InfoTooltip.tsx
│   │   ├── apostas/           # Gestão de apostas
│   │   │   ├── ApostasFilters.tsx
│   │   │   ├── ApostasTable.tsx
│   │   │   ├── CreateApostaDialog.tsx
│   │   │   └── EditApostaDialog.tsx
│   │   ├── banca/             # Gestão de banca
│   │   │   ├── BookieCard.tsx
│   │   │   └── TransactionDialog.tsx
│   │   ├── dashboard/         # Dashboard
│   │   │   └── KPICard.tsx
│   │   ├── resultados/        # Resultados
│   │   │   └── ResultadoCard.tsx
│   │   └── ui/                # Componentes base (shadcn)
│   ├── hooks/                 # Custom Hooks
│   │   ├── useAnalysisMetrics.ts
│   │   ├── useChartData.ts
│   │   ├── useApostas.ts
│   │   └── useBookies.ts
│   ├── lib/                   # Utilitários
│   │   ├── constants.ts       # Constantes (cores, configs)
│   │   ├── supabase.ts        # Cliente Supabase
│   │   └── utils.ts           # Funções auxiliares
│   ├── pages/                 # Páginas principais
│   │   ├── Home.tsx
│   │   ├── Apostas.tsx
│   │   ├── Resultados.tsx
│   │   ├── Analises.tsx
│   │   └── Banca.tsx
│   ├── types/                 # TypeScript types
│   │   └── betting.ts
│   ├── App.tsx
│   └── main.tsx
├── analises.html              # Arquivo de referência
├── analises.js                # Arquivo de referência
└── README.md
```

---

## 🚀 Como Usar

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/ViniciusGrossi/wager-art.git
cd wager-art

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env na raiz do projeto
cp .env.example .env

# 4. Adicione suas credenciais do Supabase no .env:
# VITE_SUPABASE_URL=sua_url_do_projeto
# VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# 5. Inicie o servidor de desenvolvimento
npm run dev

# 6. Acesse no navegador
# http://localhost:5173
```

### Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute os scripts SQL para criar as tabelas:

```sql
-- Criar tabela de apostas
CREATE TABLE aposta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  tipo_aposta TEXT NOT NULL,
  casa_de_apostas TEXT NOT NULL,
  valor_apostado DECIMAL(10,2) NOT NULL,
  odd_inicial DECIMAL(5,2) NOT NULL,
  odd_final DECIMAL(5,2),
  valor_final DECIMAL(10,2),
  bonus BOOLEAN DEFAULT FALSE,
  turbo INTEGER DEFAULT 0,
  resultado TEXT DEFAULT 'Pendente',
  mercado TEXT,
  detalhes TEXT,
  partida TEXT,
  torneio TEXT,
  data DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de casas de apostas
CREATE TABLE bookies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  last_deposit DECIMAL(10,2),
  last_withdraw DECIMAL(10,2),
  last_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE aposta ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookies ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (ajuste conforme necessidade)
CREATE POLICY "Enable all for authenticated users" ON aposta
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON bookies
  FOR ALL USING (auth.role() = 'authenticated');
```

3. Copie a URL e a Anon Key do projeto
4. Cole no arquivo `.env`

### Build para Produção

```bash
# Gerar build otimizado
npm run build

# Preview do build
npm run preview
```

---

## 📖 Guia de Uso

### 1. Primeira Configuração

1. **Adicionar Casas de Apostas**:
   - Vá para "Gestão de Banca"
   - Clique em "Nova Casa"
   - Adicione nome e saldo inicial

2. **Registrar Primeira Aposta**:
   - Vá para "Apostas"
   - Clique em "Nova Aposta"
   - Preencha os dados
   - Confirme

### 2. Fluxo de Trabalho Recomendado

```
1. Registrar Aposta → 2. Aguardar Resultado → 3. Conciliar → 4. Analisar
```

**Registrar Aposta** (Apostas):
- Preencha todos os campos
- Ative turbo se aplicável
- Marque como bônus se for uma freebet
- Clique em "Registrar"

**Aguardar Resultado**:
- Aposta fica com status "Pendente"
- Aparece na aba "Resultados"

**Conciliar** (Resultados):
- Marque o resultado (Ganhou/Perdeu/Cashout/Cancelado)
- Preview automático do impacto
- Confirme a operação

**Analisar** (Análises):
- Navegue pelas 9 abas de análise
- Identifique padrões e oportunidades
- Otimize sua estratégia

### 3. Dicas de Uso

✅ **Use filtros** para análises específicas
✅ **Aproveite os tooltips** (ícone ℹ️) para entender cada métrica
✅ **Monitore o Sweet Spot** de odds
✅ **Acompanhe o drawdown** para gestão de risco
✅ **Identifique padrões** temporais e de categoria
✅ **Use turbo** em apostas de alta confiança
✅ **Registre bônus** corretamente para análises precisas

---

## 🎨 Design System

### Paleta de Cores

```css
--primary: #22c55e (Verde Esmeralda)
--destructive: #ef4444 (Vermelho)
--success: #10b981 (Verde Sucesso)
--warning: #f59e0b (Amarelo)
--muted: #6b7280 (Cinza)
--chart-1: #6366f1 (Índigo)
--chart-2: #8b5cf6 (Roxo)
--chart-3: #06b6d4 (Ciano)
--chart-4: #f43f5e (Rosa)
--chart-5: #f97316 (Laranja)
```

### Componentes Principais

- **Cards**: Glass effect com hover lift
- **Badges**: Coloridos por status (verde/vermelho/amarelo/azul)
- **Botões**: Primary (verde), Secondary (cinza), Destructive (vermelho)
- **Inputs**: Border suave com focus ring
- **Tables**: Hover row, ordenação visual
- **Charts**: Gradientes suaves, tooltips informativos
- **Skeletons**: Loading gracioso
- **Toasts**: Feedback instantâneo

---

## 🔒 Regras de Negócio Detalhadas

### Nova Aposta

1. **Validação de Saldo**:
   - Apostas normais: Verifica saldo disponível na casa
   - Apostas com bônus: Não valida saldo (é uma freebet)

2. **Débito**:
   - Apostas normais: Debita `valor_apostado` do saldo da casa
   - Apostas com bônus: Não debita

3. **Status Inicial**: "Pendente"

### Resultado: Ganhou ✅

- **Aposta Normal**:
  - Credita: `valor_apostado * odd_final`
  - Saldo += stake + lucro
  
- **Aposta Bônus**:
  - Credita: `(odd_final - 1) * valor_apostado`
  - Saldo += apenas o lucro (não recupera stake)

### Resultado: Perdeu ❌

- **Aposta Normal**:
  - Nenhuma ação (stake já foi debitado)
  
- **Aposta Bônus**:
  - Nenhuma ação (não houve débito)

### Resultado: Cancelado ⭕

- **Aposta Normal**:
  - Devolve: `valor_apostado`
  - Saldo += stake
  
- **Aposta Bônus**:
  - Nenhuma ação

### Resultado: Cashout 💰

- **Aposta Normal**:
  - Credita: `valor_do_cashout`
  - Saldo += valor do cashout
  
- **Aposta Bônus**:
  - Credita: `valor_do_cashout`

---

## 📊 Métricas e Cálculos

### Métricas Básicas

```typescript
ROI = (Lucro Total / Total Apostado) * 100
Taxa de Acerto = (Apostas Ganhas / Total de Apostas) * 100
Yield = ROI (sinônimo)
Lucro = Valor Final - Valor Apostado
```

### Métricas Avançadas

```typescript
// Sharpe Ratio
Sharpe = (Retorno Médio - Risk Free Rate) / Desvio Padrão

// Sortino Ratio
Sortino = (Retorno Médio - MAR) / Downside Deviation

// Calmar Ratio
Calmar = Retorno Anualizado / Max Drawdown Absoluto

// Kelly Criterion
Kelly % = (p * b - q) / b
// onde p = probabilidade de ganhar, q = 1-p, b = decimal odds - 1

// Value at Risk (95%)
VaR = Percentil 5 das perdas

// Expected Shortfall
ES = Média das perdas que excedem o VaR
```

### Padrões e Tendências

```typescript
// Consistência
Consistência = 100 - Desvio Padrão das Taxas Mensais

// Momentum
Momentum = (Taxa Últimas 10 - Taxa Anteriores) comparativo

// Sweet Spot
Sweet Spot = Faixa de Odds com melhor combinação ROI + Taxa
```

---

## 🎯 Roadmap Futuro

### Em Desenvolvimento
- [ ] Sistema de notificações push
- [ ] Exportação para CSV/Excel
- [ ] Modo claro (light mode)
- [ ] Suporte a múltiplas moedas
- [ ] Sistema de metas e limites
- [ ] Integração com APIs de odds

### Planejado
- [ ] App mobile (React Native)
- [ ] Comunidade e comparações
- [ ] IA para recomendações
- [ ] Automação de registro de apostas
- [ ] Dashboard customizável
- [ ] Relatórios PDF

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🔗 Links Úteis

- **Projeto Lovable**: https://lovable.dev/projects/c7b54679-24fd-43c0-8496-aa5e2aa7fcfa
- **Documentação Supabase**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **Recharts**: https://recharts.org/
- **Framer Motion**: https://www.framer.com/motion/
- **TanStack Table**: https://tanstack.com/table

---

## 👨‍💻 Autor

**Vinícius Grossi**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ViniciusGrossi)

---

## 📞 Suporte

Para suporte, abra uma [issue](https://github.com/ViniciusGrossi/wager-art/issues) no GitHub.

---

**Desenvolvido com ❤️ e muito ☕**
