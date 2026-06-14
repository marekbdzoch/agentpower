-- Target PostgreSQL schema for replacing the local JSON store.
-- The MVP currently persists the same entities in data/agentpower-db.json.

create table projects (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  idea text not null,
  status text not null,
  autonomy_level integer not null check (autonomy_level between 0 and 5),
  budget_cents integer not null,
  license text not null,
  target_users text not null,
  stack_preference text not null,
  requirements text not null,
  github_repo_id text not null,
  github_full_name text not null,
  github_url text not null,
  created_at timestamptz not null default now()
);

create table project_brains (
  project_id uuid primary key references projects(id) on delete cascade,
  mission text not null,
  users jsonb not null,
  non_goals jsonb not null,
  stack jsonb not null,
  roadmap jsonb not null,
  autonomy_rules jsonb not null,
  security_policy jsonb not null,
  documents jsonb not null,
  version integer not null,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  github_issue_number integer not null,
  title text not null,
  body text not null,
  source text not null,
  priority integer not null,
  risk_level text not null,
  status text not null,
  budget_cap_cents integer not null,
  created_at timestamptz not null default now()
);

create table agent_runs (
  id uuid primary key,
  task_id uuid not null references tasks(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  agent_type text not null,
  status text not null,
  summary text not null,
  cost_cents integer not null,
  started_at timestamptz not null,
  finished_at timestamptz
);

create table pull_requests (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  number integer not null,
  title text not null,
  branch text not null,
  status text not null,
  ci_state text not null,
  review_state text not null,
  risk_level text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table review_reports (
  id uuid primary key,
  pull_request_id uuid not null references pull_requests(id) on delete cascade,
  summary text not null,
  findings jsonb not null,
  risk_flags jsonb not null,
  decision text not null,
  created_at timestamptz not null default now()
);

create table donations (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  payment_gateway_id uuid,
  payment_provider text not null,
  external_reference text not null,
  amount_cents integer not null,
  currency text not null,
  target_type text not null,
  target_id text,
  contributor_name text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table payment_gateways (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  provider text not null,
  mode text not null,
  display_name text not null,
  status text not null,
  publishable_key_masked text,
  secret_key_masked text,
  secret_key_fingerprint text,
  webhook_secret_masked text,
  checkout_session_mode text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table treasury_ledger (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  entry_type text not null,
  amount_cents integer not null,
  currency text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table compute_contributions (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  contributor_name text not null,
  type text not null,
  status text not null,
  limits text not null,
  created_at timestamptz not null default now()
);

create table model_providers (
  id uuid primary key,
  project_id uuid not null references projects(id) on delete cascade,
  provider text not null,
  display_name text not null,
  status text not null,
  api_key_masked text,
  api_key_fingerprint text,
  base_url text,
  primary_model text not null,
  fallback_model text,
  cost_per_power_day_cents integer not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table power_pricing (
  project_id uuid primary key references projects(id) on delete cascade,
  currency text not null,
  unit_name text not null,
  included_agent_runs integer not null,
  base_cost_cents integer not null,
  platform_margin_percent numeric not null,
  owner_margin_percent numeric not null,
  minimum_price_cents integer not null,
  price_per_day_cents integer not null,
  updated_at timestamptz not null default now()
);
