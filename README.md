# Pendências

App pessoal para controlar tarefas que você executa e tarefas que você acompanha (delegadas a terceiros). Funciona no navegador e instala no celular como aplicativo (PWA). Sincroniza automaticamente entre todos os seus dispositivos.

Totalmente gratuito: usa o plano free do Supabase (banco + login) e do Vercel (hospedagem). Sem cartão de crédito, sem limite prático para um único usuário.

## O que você precisa

Uma conta no GitHub (gratuita), uma conta no Supabase (gratuita) e uma conta no Vercel (gratuita). Se já tiver alguma, melhor. Nenhuma pede cartão.

O passo a passo abaixo leva cerca de 15 minutos no total. Faça uma vez só.

## Passo 1 — Criar o projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (pode logar com GitHub).
2. Clique em **New project**. Nome qualquer (ex.: `pendencias`). Anote a senha do banco em algum lugar seguro — você não vai precisar dela no app, mas é bom guardar.
3. Escolha uma região próxima do Brasil (São Paulo ou East US).
4. Espere 1-2 minutos até o projeto ficar pronto.

## Passo 2 — Criar as tabelas (rodar o SQL)

1. No Supabase, menu lateral → **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo e cole no editor.
3. Clique em **Run** (ou Ctrl+Enter). Deve aparecer "Success. No rows returned".

## Passo 3 — Criar seu usuário

1. Menu lateral → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Digite seu e-mail e uma senha forte (essa é a senha que você vai usar para entrar no app).
3. Marque **Auto Confirm User** para pular a confirmação por e-mail.
4. Clique em **Create user**.

## Passo 4 — Copiar as chaves do Supabase

1. Menu lateral → **Project Settings** (ícone de engrenagem) → **API**.
2. Copie dois valores em um bloco de notas temporário:
   - **Project URL** (algo como `https://abcdxyz.supabase.co`)
   - **anon public** (chave longa começando com `eyJ...`)

## Passo 5 — Subir o código no GitHub

1. Instale o Git (se ainda não tem): https://git-scm.com/downloads
2. Crie um repositório novo e privado no GitHub: https://github.com/new (marque **Private**).
3. Abra o terminal na pasta `pendencias-app` e rode:

```bash
git init
git add .
git commit -m "primeira versão"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

(Se preferir, use o GitHub Desktop — interface gráfica, mesmo resultado.)

## Passo 6 — Publicar no Vercel

1. Acesse https://vercel.com e crie conta com seu GitHub.
2. **Add New…** → **Project** → selecione o repositório que acabou de criar.
3. Em **Framework Preset**, o Vercel vai detectar "Vite" automaticamente.
4. Expanda **Environment Variables** e adicione três variáveis (copie dos passos anteriores):

| Nome                      | Valor                                   |
| ------------------------- | --------------------------------------- |
| `VITE_SUPABASE_URL`       | Project URL do Supabase                 |
| `VITE_SUPABASE_ANON_KEY`  | anon public key do Supabase             |
| `VITE_APP_EMAIL`          | O e-mail que você criou no Passo 3      |

5. Clique em **Deploy**. Em 1-2 minutos sua URL vai estar pronta (algo como `pendencias-abc.vercel.app`).

## Passo 7 — Instalar no celular

**iPhone / Safari:**
1. Abra a URL do Vercel no Safari.
2. Botão de compartilhar (quadradinho com seta para cima).
3. Role até **Adicionar à Tela de Início**.
4. O ícone aparece na tela inicial como se fosse um app nativo.

**Android / Chrome:**
1. Abra a URL no Chrome.
2. Menu (três pontos) → **Instalar aplicativo** (ou **Adicionar à tela inicial**).

Pronto. Faça login com a senha, e está tudo sincronizado.

## Rodar localmente (opcional, para desenvolvimento)

```bash
cp .env.example .env
# edite .env e preencha as três variáveis
npm install
npm run dev
```

Acesse http://localhost:5173.

## Como o app funciona

**Tela principal (Ativas):** mostra três blocos:

- **Atrasados** — prazo vencido, em vermelho no topo.
- **Minhas tarefas** — responsável = "eu", ordenadas por prazo.
- **Acompanhando** — responsável ≠ "eu", ordenadas pela mais parada. Se ficar 2+ dias sem movimento aparece "sem movimento há N dias", acima de 7 dias fica em vermelho.

**Criar tarefa:** botão `+` no topo direito. Campos: título, responsável (autocomplete de nomes já usados), cliente (opcional), prazo (opcional), notas.

**Delegar:** edite a tarefa e troque o responsável. O contador de "sem movimento" reinicia automaticamente e uma linha de log é adicionada nas notas.

**Finalizar:** bolinha ao lado do título, ou botão "Finalizar" na edição. Some do dashboard e vai para o Histórico.

**Histórico:** aba no topo. Tudo que foi finalizado, com busca por título/responsável/cliente/notas. Pode reabrir qualquer tarefa.

## Esqueci a senha

No Supabase → **Authentication** → **Users** → clique no seu usuário → **Send password recovery** (precisa ter configurado e-mail no Supabase) ou simplesmente edite a senha direto pelo painel.

## Custos

Zero. Supabase free: 500 MB de banco (milhares de tarefas), chamadas ilimitadas. Vercel free: 100 GB de banda por mês (impossível atingir num app pessoal). Nenhum dos dois pede cartão.

Detalhe: o Supabase pausa projetos sem atividade por 1 semana. Como você vai usar diariamente, nunca acontece na prática. Se acontecer, é um clique no painel para religar.
