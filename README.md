# Parenting Quiz Generator

An internal tool for The Parentinc that generates AI-powered, multiple-choice parenting/child-development quizzes, shares them with a code, and tracks who took each quiz and how they scored.

> 🤖 For the AI prompts, model, and structured-output details, see **[AI_USAGE.md](./AI_USAGE.md)**.

## Features

- **AI quiz generation** — type any topic and get a ready-to-take quiz with explanations (powered by Google Gemini via the Vercel AI SDK).
- **Creator accounts** — sign up / log in with email + password; each quiz belongs to its creator.
- **Shareable codes** — every quiz gets a unique short code (e.g. `AB3K7Q`) and a public share link.
- **No-login taking** — anyone with the code takes the quiz at `/take` by entering their name; scores are graded on the server.
- **Score history** — each quiz shows its list of attempts (taker name, score, date).
- **Export / Import** — download a quiz as JSON (or copy JSON/plain text), and import a JSON file back into your library with a fresh code.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Turbopack) + React 19
- [Vercel AI SDK](https://sdk.vercel.ai/) with `@ai-sdk/google` (Google Gemini)
- [PostgreSQL](https://www.postgresql.org/) via [Drizzle ORM](https://orm.drizzle.team/) (`node-postgres`)
- Tailwind CSS v4 + Base UI components
- Auth: scrypt password hashing + HMAC-signed httpOnly session cookies (no external auth dependency)

## Prerequisites

| Requirement | Version / Notes |
| --- | --- |
| **Node.js** | 20+ (developed on Node 25) |
| **pnpm** | 10+ — the project uses a `pnpm-lock.yaml` |
| **PostgreSQL** | 14+ (developed on 16). A running server you can connect to. |
| **Google AI Studio API key** | Get one at <https://aistudio.google.com/app/apikey>. Used for quiz generation. |

> The app reads all secrets from `.env.local` (git-ignored). Nothing is hard-coded.

## Environment variables

Create a `.env.local` file in the project root:

```bash
# Google AI Studio key — used by @ai-sdk/google for quiz generation
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-studio-key

# Postgres connection string for the quiz database
DATABASE_URL=postgresql://USER@localhost:5432/quiz_generator

# Secret used to sign session cookies — generate a random 32+ byte hex string
SESSION_SECRET=replace-with-a-long-random-string
```

Generate a strong `SESSION_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create the database

```bash
createdb quiz_generator
```

(or `CREATE DATABASE quiz_generator;` from `psql`)

### 3. Create the tables

The project doesn't ship migration files yet, so create the schema once using the included [`schema.sql`](./schema.sql) (it matches `lib/db/schema.ts`):

```bash
psql -d quiz_generator -f schema.sql
```

For a hosted database, point it at the remote connection string instead:

```bash
psql "YOUR_HOSTED_DATABASE_URL" -f schema.sql
```

### 4. Set your environment variables

Fill in `.env.local` as described above, making sure `DATABASE_URL` points at the `quiz_generator` database.

## Running the project

### Development

```bash
pnpm dev
```

Open <http://localhost:3000>. You'll be redirected to **/login** — sign up to create your first quiz.

### Production build

```bash
pnpm build
pnpm start
```

### Type-checking

```bash
npx tsc --noEmit
```

## Deploying to Vercel

The app runs on Vercel natively. The only extra requirement is a **hosted Postgres database** (local Postgres isn't reachable from Vercel).

1. **Create a hosted Postgres database** with [Neon](https://neon.tech) (recommended), [Supabase](https://supabase.com), or Vercel Postgres. Copy its connection string (use the **pooled** one if offered — better for serverless).
2. **Create the tables** on that database:
   ```bash
   psql "YOUR_HOSTED_DATABASE_URL" -f schema.sql
   ```
3. **Import the repo** at <https://vercel.com/new> (Continue with GitHub → select this repo). Vercel auto-detects Next.js and pnpm.
4. **Add Environment Variables** in the import screen (or Project → Settings → Environment Variables):
   | Name | Value |
   | --- | --- |
   | `GOOGLE_GENERATIVE_AI_API_KEY` | your Google AI Studio key |
   | `DATABASE_URL` | your hosted Postgres connection string |
   | `SESSION_SECRET` | a long random string (see command above) |
5. **Deploy.** You'll get a `*.vercel.app` URL. Share links (`/take/<code>`) automatically use your deployed domain.

Pushing to `main` afterwards triggers an automatic redeploy.

### Via the Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production
vercel --prod
```

## How to use

1. **Sign up / log in** at `/login`.
2. **Create a quiz** — enter a topic, pick the question count, difficulty, and language, then generate. (You can also **import** a previously exported JSON quiz.)
3. **Share the code** shown on the success screen, or copy the share link.
4. **Takers** go to `/take`, enter the code and their name, and complete the quiz — no account needed.
5. **Track results** in the **History** tab: each quiz lists every attempt with its score.
6. **Export** any quiz as JSON/text from History or the results screen.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Authenticated | Create quizzes, view history & attempts |
| `/login` | Public | Sign up / log in |
| `/take` | Public | Enter a quiz code + name |
| `/take/[code]` | Public | Take the quiz and record a score |

## Project structure

```
app/
  actions/        # server actions: auth.ts, quiz.ts
  login/          # login & signup page
  take/           # public taker flow (code entry + [code] page)
  page.tsx        # authenticated home
components/        # UI components (quiz-app, quiz-runner, take-quiz, etc.)
lib/
  auth.ts         # password hashing + session cookies
  db/             # Drizzle schema & client
  quiz-types.ts   # shared types
  export.ts       # JSON/text export helpers
```

## Notes

- Quiz content is AI-generated for learning and reflects general pediatric guidance (WHO, AAP, IDAI). It is not medical advice.
- Scoring is computed on the server when an attempt is submitted, so client tampering can't change recorded scores.
