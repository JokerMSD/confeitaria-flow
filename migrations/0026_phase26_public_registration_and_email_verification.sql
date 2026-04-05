ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  purpose varchar(32) NOT NULL DEFAULT 'signup',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx
  ON email_verification_tokens (user_id);

CREATE INDEX IF NOT EXISTS email_verification_tokens_expires_at_idx
  ON email_verification_tokens (expires_at);

CREATE TABLE IF NOT EXISTS checkout_account_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  email varchar(320) NOT NULL,
  full_name varchar(160) NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  password_hash text NOT NULL,
  processed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checkout_account_requests_email_idx
  ON checkout_account_requests (email);

CREATE INDEX IF NOT EXISTS checkout_account_requests_processed_at_idx
  ON checkout_account_requests (processed_at);
