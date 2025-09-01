BEGIN;

-- Extensions (before using gen_random_uuid or CITEXT)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Drop in dependency order
DROP TABLE IF EXISTS public.employee_worked_time CASCADE;
DROP TABLE IF EXISTS public.tips_pool CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.positions CASCADE;

-- === Master data ===
CREATE TABLE public.positions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(50) NOT NULL UNIQUE,
  -- store as percent 0..100 (adjust if you prefer fraction 0..1)
  tips_rate    NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (tips_rate BETWEEN 0 AND 100)
);

CREATE TABLE public.employees (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name        VARCHAR(50) NOT NULL,
  last_name         VARCHAR(50),
  salary            NUMERIC(12,2) CHECK (salary IS NULL OR salary >= 0),
  daily_rate        NUMERIC(12,2) CHECK (daily_rate IS NULL OR daily_rate >= 0),
  position_id       UUID REFERENCES public.positions(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Operational data ===
CREATE TABLE public.tips_pool (
  tips_date   DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  tips_total  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tips_total >= 0),
  closed      BOOLEAN NOT NULL DEFAULT FALSE
);
/*
 Note: Do NOT reference employee_worked_time(worked_date) with a FK.
 A date-only FK is weak and prevents recording a pool for a day before
 any shift rows exist. If you need per-employee allocations, model a
 tips_allocation table keyed by (tips_date, employee_id).
*/

CREATE TABLE public.employee_worked_time (
  worked_date  DATE NOT NULL,
  employee_id  UUID NOT NULL REFERENCES public.employees(id)
                 ON UPDATE CASCADE ON DELETE CASCADE,
  hours        NUMERIC(5,2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
  PRIMARY KEY (worked_date, employee_id)
);

-- Helpful indexes
CREATE INDEX ON public.employee_worked_time (worked_date);
CREATE INDEX ON public.employees (position_id);

-- === (Unchanged) RBAC tables for auth ===
-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               CITEXT NOT NULL UNIQUE,
  password_hash       TEXT   NOT NULL,
  email_verified_at   TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_count  INT     NOT NULL DEFAULT 0,
  lockout_until       TIMESTAMPTZ,
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        CITEXT NOT NULL UNIQUE,
  description TEXT
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         CITEXT NOT NULL UNIQUE,
  description TEXT
);

-- Role ↔ Permission
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id       UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User ↔ Role
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

COMMIT;
