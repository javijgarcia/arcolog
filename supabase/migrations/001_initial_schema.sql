-- ============================================================
-- ArcoLog — Esquema de base de datos v1
-- Ejecutar en Supabase SQL Editor o con supabase db push
-- ============================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  avatar_url  text,
  bow_type    text check (bow_type in ('recurvo', 'compuesto', 'longbow', 'otro')),
  club_name   text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger: crea perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLA: training_sessions (sesiones de entrenamiento)
-- ============================================================
create table if not exists public.training_sessions (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  session_date    date not null default current_date,
  total_arrows    int not null check (total_arrows > 0),
  distance_meters int not null check (distance_meters > 0),
  target_type     text check (target_type in ('diana_papel', 'diana_3d', 'campo', 'sala', 'otro')),
  objective       text,                          -- e.g. "Trabajar postura", "Fuerza"
  feeling_score   smallint check (feeling_score between 1 and 5),
  weather         text check (weather in ('soleado', 'nublado', 'lluvia', 'viento', 'interior')),
  notes           text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

alter table public.training_sessions enable row level security;

create policy "Users CRUD own training sessions"
  on public.training_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- TABLA: session_ends (tandas de una sesión)
-- ============================================================
create table if not exists public.session_ends (
  id          uuid default uuid_generate_v4() primary key,
  session_id  uuid references public.training_sessions(id) on delete cascade not null,
  end_number  smallint not null,              -- Número de tanda
  arrows      smallint not null default 6,   -- Flechas por tanda
  score       smallint not null check (score >= 0),
  notes       text,
  created_at  timestamptz default now() not null
);

alter table public.session_ends enable row level security;

create policy "Users CRUD own session ends"
  on public.session_ends for all
  using (
    auth.uid() = (
      select user_id from public.training_sessions where id = session_id
    )
  )
  with check (
    auth.uid() = (
      select user_id from public.training_sessions where id = session_id
    )
  );

-- ============================================================
-- TABLA: competition_scores (resultados de competición)
-- ============================================================
create table if not exists public.competition_scores (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references public.profiles(id) on delete cascade not null,
  competition_date    date not null,
  competition_name    text not null,
  category            text,                  -- e.g. "Recurvo Senior Masculino"
  distance_meters     int check (distance_meters > 0),
  round_type          text,                  -- e.g. "FITA 70m", "WA 1440"
  total_score         int not null check (total_score >= 0),
  x_count             smallint default 0,
  tens_count          smallint default 0,
  ranking_position    smallint,
  notes               text,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

alter table public.competition_scores enable row level security;

create policy "Users CRUD own competition scores"
  on public.competition_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- ÍNDICES para rendimiento
-- ============================================================
create index if not exists idx_training_sessions_user_date
  on public.training_sessions(user_id, session_date desc);

create index if not exists idx_competition_scores_user_date
  on public.competition_scores(user_id, competition_date desc);

create index if not exists idx_session_ends_session
  on public.session_ends(session_id, end_number);

-- ============================================================
-- VISTA: stats por usuario (útil para dashboard)
-- ============================================================
create or replace view public.user_stats as
select
  p.id as user_id,
  count(distinct ts.id)    as total_sessions,
  coalesce(sum(ts.total_arrows), 0) as total_arrows,
  count(distinct cs.id)    as total_competitions,
  max(cs.total_score)      as personal_best,
  round(avg(ts.feeling_score), 1) as avg_feeling
from public.profiles p
left join public.training_sessions ts on ts.user_id = p.id
left join public.competition_scores cs on cs.user_id = p.id
group by p.id;

-- RLS en vista
alter view public.user_stats owner to authenticated;
