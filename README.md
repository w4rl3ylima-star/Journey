# Journey — Controle de Gastos

App web (PWA) para anotar gastos e receitas do dia a dia por **voz** ou **texto**,
com dashboard de categorias x renda, projeções dos próximos meses e metas com
sugestões automáticas de corte de gastos.

Tudo roda **no navegador do celular**, sem servidor: os dados ficam salvos
localmente no aparelho (`localStorage`).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (ex: `http://localhost:5173`) no navegador
do celular (mesma rede Wi-Fi) ou use `npm run build && npm run preview` para
testar a versão de produção.

## Instalando no celular (PWA)

O jeito mais rápido é abrir a versão publicada no GitHub Pages (veja abaixo).
Se preferir outro host (Vercel, Netlify...), gere o build com `npm run build`
e sirva a pasta `dist/` — precisa ser HTTPS para o microfone e a instalação
funcionarem.

1. Abra o link no celular:
   - **Android (Chrome)**: menu ⋮ → "Adicionar à tela inicial" / vai aparecer
     um banner de instalação automático.
   - **iPhone (Safari)**: botão de compartilhar → "Adicionar à Tela de Início".
2. O ícone abre em tela cheia, como um app nativo, e funciona offline depois
   do primeiro carregamento.

## Deploy no GitHub Pages

O repositório já tem um workflow (`.github/workflows/deploy-pages.yml`) que
builda e publica a cada push nesta branch. Para ativar (uma vez só):

1. No GitHub: **Settings → Pages → Build and deployment → Source** → escolha
   **GitHub Actions**.
2. Dê um push (ou re-rode o workflow na aba **Actions**) — em alguns minutos
   o app fica em `https://w4rl3ylima-star.github.io/Journey/`.
3. Abra esse link no celular para testar tudo, inclusive o microfone e a
   instalação na tela inicial.

## Funcionalidades

- **Entrada por voz e texto**: um único campo entende frases como *"gastei 45
  reais no mercado"*, *"paguei 120 de luz"* ou *"recebi 3000 de salário"` — o
  app extrai valor, categoria, tipo (despesa/receita) e se é recorrente
  (ex: *"netflix 39,90 assinatura mensal"`). Tudo continua editável antes de
  salvar. A voz usa a Web Speech API em pt-BR (suportada no Chrome/Android;
  em navegadores sem suporte, o campo de texto continua funcionando normalmente).
- **Dashboard**: receita, despesa e saldo do mês, gastos por categoria
  (comparados à renda) e gráfico de tendência com projeção dos próximos 3
  meses baseada na sua média recente.
- **Extrato**: lista de lançamentos por dia, com filtro por despesas/receitas.
- **Metas**: crie metas com valor alvo, acompanhe o progresso e veja em
  quantos meses chega no ritmo atual — e sugestões automáticas de corte nas
  categorias discricionárias (lazer, compras, assinaturas...) para chegar
  mais rápido.

## Stack

React + TypeScript + Vite, Tailwind CSS v4, Recharts, `vite-plugin-pwa`.
Sem backend — todo o estado vive no `localStorage` do navegador.
