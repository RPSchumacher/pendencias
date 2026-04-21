# Painel de Controle Pessoal

App pessoal para controlar tarefas que você executa e tarefas que você acompanha (delegadas a terceiros). Funciona no navegador e instala no celular como aplicativo (PWA). Sincroniza automaticamente entre todos os seus dispositivos.

Totalmente gratuito: usa o plano free do Supabase (banco + login) e do GitHub Pages (hospedagem). Sem cartão de crédito.

## O que você precisa

Uma conta no GitHub (gratuita) e uma conta no Supabase (gratuita). Nenhuma pede cartão.

O passo a passo abaixo leva cerca de 10 minutos no total. Faça uma vez só.

## Passo 1 — Criar o projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (pode logar com GitHub).
2. Clique em **New project**. Nome qualquer (ex.: `pendencias`). Anote a senha do banco em algum lugar seguro.
3. Escolha uma região próxima do Brasil (São Paulo ou East US).
4. Espere 1-2 minutos até o projeto ficar pronto.

## Passo 2 — Criar as tabelas (rodar o SQL)

1. No Supabase, menu lateral → **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo e cole no editor.
3. Clique em **Run** (ou Ctrl+Enter). Deve aparecer "Success. No rows returned".

## Passo 3 — Habilitar cadastro por e-mail

1. Menu lateral → **Authentication** → **Providers** → **Email**.
2. Garanta que **Enable Email provider** está ligado.
3. **Confirm email** ligado (recomendado): o Supabase envia um link de confirmação a cada cadastro. Mais seguro.
4. Salve.

Cada pessoa que for usar o app vai criar a própria conta pela tela de login — não precisa criar usuários manualmente no dashboard.

## Passo 4 — Copiar as chaves do Supabase

1. Menu lateral → **Project Settings** (ícone de engrenagem) → **API**.
2. Copie dois valores em um bloco de notas temporário:
   - **Project URL** (algo como `https://abcdxyz.supabase.co`)
   - **anon public** (chave longa começando com `eyJ...`)

## Passo 5 — Subir o código no GitHub

1. Instale o Git (se ainda não tem): https://git-scm.com/downloads
2. Crie um repositório no GitHub: https://github.com/new.
3. Abra o terminal na pasta do projeto e rode:

```bash
git init
git add .
git commit -m "primeira versão"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

## Passo 6 — Configurar os Secrets e ativar o GitHub Pages

1. No repositório → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Crie dois:

| Nome                      | Valor                                   |
| ------------------------- | --------------------------------------- |
| `VITE_SUPABASE_URL`       | Project URL do Supabase                 |
| `VITE_SUPABASE_ANON_KEY`  | anon public key do Supabase             |

2. **Settings** → **Pages** → em **Source** selecione **GitHub Actions**.
3. Ajuste o `base` no `vite.config.ts` para o nome do seu repositório (ex.: se o repo é `pendencias`, deixe `base: '/pendencias/'`).
4. Faça um push qualquer (ou vá em **Actions** → **Deploy to GitHub Pages** → **Run workflow**). Em ~1 minuto a URL fica pronta em `https://SEU_USUARIO.github.io/NOME_DO_REPO/`.

## Passo 7 — Criar sua conta

1. Acesse a URL do seu app.
2. Na tela de login, clique em **Criar conta**.
3. Digite e-mail e senha (mínimo 6 caracteres).
4. Abra o e-mail de confirmação e clique no link.
5. Volte ao app e entre com e-mail + senha.

## Passo 8 — Instalar no celular

**iPhone / Safari:**
1. Abra a URL no Safari.
2. Botão de compartilhar → **Adicionar à Tela de Início**.

**Android / Chrome:**
1. Abra a URL no Chrome.
2. Menu (três pontos) → **Instalar aplicativo**.

Pronto. Faça login uma vez e a sessão fica persistida.

## Rodar localmente (opcional, para desenvolvimento)

```bash
cp .env.example .env
# edite .env e preencha as duas variáveis
npm install
npm run dev
```

Acesse http://localhost:5173.

## Como o app funciona

**Tela principal (Ativas):** mostra até quatro blocos:

- **Atrasados** — prazo vencido, em vermelho no topo. Aparece mesmo que a tarefa também se encaixe em outra categoria.
- **Acompanhamento de entrega de trabalho** — tarefas marcadas com a flag "entrega de trabalho", ordenadas pela mais parada.
- **Minhas tarefas** — responsável = "eu", ordenadas por prazo.
- **Acompanhando** — responsável ≠ "eu", ordenadas pela mais parada. Se ficar 2+ dias sem movimento aparece "sem movimento há N dias", acima de 7 dias fica em vermelho.

**Flag Urgente:** marque qualquer tarefa como urgente para ganhar destaque visual (borda rosa + badge).

**Filtros globais:** busca por texto e filtro por responsável no topo do dashboard.

**Criar tarefa:** botão `+` no topo direito. Campos: título, responsável (autocomplete), cliente (opcional), prazo (opcional), notas, flag urgente, flag entrega de trabalho.

**Delegar:** edite a tarefa e troque o responsável. O contador de "sem movimento" reinicia e uma linha de log é adicionada nas notas.

**Finalizar:** bolinha ao lado do título, ou botão "Finalizar" na edição. Some do dashboard e vai para o Histórico.

**Histórico:** aba no topo. Tudo que foi finalizado, com busca e possibilidade de reabrir.

## Vários usuários

O app suporta vários usuários no mesmo deploy. Cada um cria a própria conta pelo botão "Criar conta", e as tarefas de cada pessoa ficam isoladas automaticamente pelo Row Level Security do Supabase (ninguém enxerga as tarefas de ninguém).

Se quiser deixar o cadastro fechado depois que todo mundo já se inscreveu, vá no Supabase → Authentication → Providers → Email e desligue **Enable Signup**.

## Esqueci a senha

No Supabase → **Authentication** → **Users** → clique no seu usuário → **Send password recovery** (exige SMTP configurado) ou edite a senha direto pelo painel.

## Custos

Zero. Supabase free: 500 MB de banco (milhares de tarefas), chamadas ilimitadas. GitHub Pages: gratuito para repositórios públicos e para contas Pro em privados.

Detalhe: o Supabase pausa projetos sem atividade por 1 semana. Uso diário → nunca acontece na prática.
