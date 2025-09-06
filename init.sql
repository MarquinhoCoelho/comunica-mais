-- Criação da extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Objetivos
CREATE TABLE IF NOT EXISTS objetivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text
);

-- Tabela de Métodos
CREATE TABLE IF NOT EXISTS metodos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  idDoObjetivo uuid NOT NULL REFERENCES objetivos(id) ON DELETE CASCADE,
  descricao text,
  prompt text,
  criteriosAvaliativos text,
  createdAt timestamp with time zone DEFAULT now()
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  sobre text,
  senha text NOT NULL,
  dataNascimento date,
  telefone text,
  perfil text
);
