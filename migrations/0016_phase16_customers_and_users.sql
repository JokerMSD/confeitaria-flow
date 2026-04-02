-- 0016_phase16_customers_and_users.sql

-- tabeas de clientes e usuários de sistema
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name varchar(120) NOT NULL,
  last_name varchar(120) NOT NULL,
  email varchar(320) NOT NULL UNIQUE,
  phone varchar(40),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS customers_is_active_idx ON customers (is_active);
CREATE INDEX IF NOT EXISTS customers_last_name_idx ON customers (last_name);
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers (email);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(80) NOT NULL UNIQUE,
  email varchar(320) NOT NULL UNIQUE,
  full_name varchar(160) NOT NULL,
  password text NOT NULL,
  role varchar(16) NOT NULL DEFAULT 'operador',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users (is_active);

-- OBS: senha deve ser armazenada em hash; crie primeiro usuário admin via endpoint com hash gerado.

