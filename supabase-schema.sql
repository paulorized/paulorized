create extension if not exists pgcrypto;

create table if not exists public.product_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  brand text not null default '',
  product_type text not null default '',
  weight text not null default '',
  strain_type text not null default '',
  strain_name text not null default '',
  strain_bio text not null default '',
  thc_percent numeric null,
  cbd_percent numeric null,
  extraction_confidence numeric null,
  extracted_data_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  strain_name text not null,
  strain_type text null,
  added_at timestamptz not null default timezone('utc', now()),
  unique (user_id, strain_name)
);
