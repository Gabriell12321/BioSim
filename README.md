# CompBioSim — Computational Biology Simulation Platform

Plataforma web para simulação numérica de modelos matemáticos em biologia computacional, abrangendo dinâmica de populações, epidemiologia matemática, cinética enzimática e genética de populações. Desenvolvido como ferramenta de apoio ao estudo e visualização interativa de sistemas dinâmicos biológicos.

## Descrição Técnica

O projeto implementa resolução numérica de sistemas de equações diferenciais ordinárias (EDOs) que modelam fenômenos biológicos fundamentais, com renderização em tempo real de séries temporais e diagramas de fase via Chart.js.

### Módulo 1 — Dinâmica Predador-Presa (Lotka-Volterra)

Resolução do sistema acoplado de EDOs de Lotka-Volterra por método de Runge-Kutta de 4ª ordem (RK4) com passo fixo `dt = 0.02`. O sistema modela interações interespecíficas tróficas com quatro parâmetros cinéticos (α, β, δ, γ):

```
dx/dt = αx − βxy
dy/dt = δxy − γy
```

Produz gráfico de séries temporais x(t), y(t) e diagrama de fase no espaço (x, y) com identificação de órbitas periódicas e pontos de equilíbrio não-triviais (x* = γ/δ, y* = α/β). Downsampling por fator 50 para otimização de renderização.

### Módulo 2 — Modelos Compartimentais Epidemiológicos (SIR / SEIR)

Implementação dos modelos compartimentais de Kermack-McKendrick com integração por Euler explícito (`dt = 0.1`). Suporta dois regimes:

- **SIR** — sistema de 3 EDOs com taxa de transmissão β e taxa de recuperação γ
- **SEIR** — extensão com compartimento Exposto (E) e taxa de incubação σ

```
dS/dt = −βSI/N
dI/dt = βSI/N − γI     (SIR)
dE/dt = βSI/N − σE     (SEIR)
```

Inclui análise de sensibilidade paramétrica do número básico de reprodução R₀ = β/γ, cálculo de limiar de imunidade de rebanho (p_c = 1 − 1/R₀), identificação de pico epidêmico e taxa de ataque final.

### Módulo 3 — Cinética Enzimática e Redes Metabólicas

Simulação de fluxo metabólico baseada em cinética de Michaelis-Menten com integração por Euler (`dt = 0.01`). Quatro topologias de rede:

| Topologia | Estrutura | Enzimas |
|-----------|-----------|---------|
| Glicólise simplificada | Glicose → G6P → F6P → FBP → Piruvato | 4 (Vmax/Km heterogêneos) |
| Linear | A → B → C → D | 3 (parâmetros uniformes) |
| Ramificada | A → B ⇒ C₁/C₂ → D₁/D₂ | 5 (partição de fluxo) |
| Feedback negativo | A → B → C → D ⟲ E₁ | 3 + inibição alostérica (Ki) |

```
v = Vmax · [S] / (Km + [S])                        (padrão)
v = Vmax · [S] / (Km · (1 + [I]/Ki) + [S])         (inibição competitiva)
```

Gera gráficos de concentração [metabolito](t) e fluxo enzimático v(t) com downsampling adaptativo.

### Módulo 4 — Genética de Populações e Evolução

Simulação de dinâmica evolutiva em populações diploides com locus bialélico (A/a). Cinco cenários implementados:

1. **Seleção direcional** — iteração determinística com fitness genotípicos (w₁₁, w₁₂, w₂₂) e cálculo de fitness médio w̄
2. **Vantagem do heterozigoto** — polimorfismo balanceado com equilíbrio estável em p* = (w₁₂ − w₂₂)/(2w₁₂ − w₁₁ − w₂₂)
3. **Deriva genética** — amostragem estocástica via aproximação gaussiana (Box-Muller) com variância binomial p(1−p)/2N
4. **Mutação-seleção** — equilíbrio entre introdução de alelos por mutação (taxa μ) e remoção por seleção purificadora
5. **Multi-populações** — divergência entre N populações isoladas com tamanhos populacionais variáveis (simulação de especiação alopátrica)

Projeção de frequências genotípicas via Hardy-Weinberg (p², 2pq, q²) para cada geração.

## Arquitetura

```
compbiosim/
├── index.html              # SPA com navegação por tabs/sub-tabs
├── css/
│   └── style.css           # Layout responsivo, breakpoint 700px
└── js/
    ├── app.js              # Roteamento de tabs, event binding, presets
    ├── lotka-volterra.js   # Módulo LV (IIFE, RK4)
    ├── epidemiological.js  # Módulo SIR/SEIR (IIFE, Euler)
    ├── metabolic.js        # Módulo metabólico (IIFE, Euler, MM)
    └── evolution.js        # Módulo evolução (IIFE, estocástico)
```

Cada módulo de simulação é encapsulado em IIFE (Immediately Invoked Function Expression) que expõe apenas o método `init()` ao escopo global. A comunicação entre módulos é feita exclusivamente via DOM.

## Stack Técnica

| Componente | Tecnologia |
|------------|-----------|
| Frontend | HTML5, CSS3, JavaScript ES5/ES6 |
| Visualização | Chart.js 4.4.0 (CDN) |
| Integração numérica | RK4 (Lotka-Volterra), Euler explícito (SIR/SEIR, metabólico) |
| Geração de números aleatórios | Box-Muller transform (deriva genética) |
| Arquitetura | SPA client-side, módulos IIFE, zero dependências server-side |

## Execução

```bash
# Sem build step — abrir diretamente no navegador
open index.html
```

Requer conexão com internet para carregamento do Chart.js via CDN. Sem dependências locais, sem Node.js, sem bundler.
