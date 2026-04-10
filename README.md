# BioSim

Simulador interativo de modelos clássicos da biologia computacional. Feito pra estudo de ecologia, epidemiologia, bioquímica e genética de populações.

## O que tem

- **Predador-Presa (Lotka-Volterra)** — dinâmica cíclica entre duas espécies, integração numérica por RK4, diagrama de fase
- **Epidemiologia (SIR / SEIR)** — modelos compartimentais, curva epidêmica, análise de R₀ e imunidade de rebanho
- **Metabolismo (Michaelis-Menten)** — cinética enzimática, glicólise simplificada, vias lineares, ramificadas e com feedback
- **Evolução** — seleção direcional, vantagem do heterozigoto, deriva genética, mutação-seleção, multi-populações

Cada módulo tem uma aba de teoria com as equações e explicações, e uma aba de simulação com controles interativos e gráficos.

## Como usar

Abrir `index.html` no navegador. Não precisa instalar nada.

Os gráficos usam [Chart.js](https://www.chartjs.org/) via CDN.

## Estrutura

```
index.html
css/style.css
js/app.js
js/lotka-volterra.js
js/epidemiological.js
js/metabolic.js
js/evolution.js
```

## Tecnologias

- HTML, CSS, JavaScript
- Chart.js 4.4.0
