-- Parenting / Employee Quiz Builder — database schema
-- Run once against your database:
--   psql "YOUR_DATABASE_URL" -f schema.sql
-- Matches lib/db/schema.ts

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  topic text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Mixed',
  language text NOT NULL DEFAULT 'English',
  question_count integer NOT NULL DEFAULT 10,
  questions jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attempts (
  id serial PRIMARY KEY,
  quiz_id integer NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  taker_name text NOT NULL,
  score integer NOT NULL,
  total integer NOT NULL,
  answers jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attempts_quiz_id_idx ON attempts(quiz_id);
