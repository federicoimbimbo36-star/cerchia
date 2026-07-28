-- ============================================================================
-- CERCHIA — schema iniziale (fase 1: solo profili/account)
-- ============================================================================
-- Cosa fare con questo file:
-- 1. Vai sul tuo progetto Supabase (https://supabase.com/dashboard)
-- 2. Apri la sezione "SQL Editor" nel menu a sinistra
-- 3. Incolla tutto questo file e premi "Run"
--
-- Questo crea una tabella "profiles" collegata automaticamente a ogni
-- account creato tramite Supabase Auth, con il numero di telefono,
-- il nome visualizzato e il colore avatar scelto dall'utente.
-- ============================================================================

-- Tabella dei profili pubblici (separata dalla tabella privata auth.users
-- che gestisce Supabase internamente per password e sessioni)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text unique not null,
  display_name text not null default 'Tu',
  nickname text,
  avatar_color text not null default '#2F6FED',
  created_at timestamptz not null default now()
);

-- Row Level Security: ognuno vede tutti i profili (serve per mostrare nomi
-- e avatar dei membri di una Cerchia) ma può modificare SOLO il proprio.
alter table public.profiles enable row level security;

create policy "I profili sono visibili a tutti gli utenti autenticati"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Ognuno può modificare solo il proprio profilo"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Ognuno può creare solo il proprio profilo"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Funzione + trigger: quando qualcuno si registra tramite Supabase Auth,
-- crea automaticamente la riga corrispondente in "profiles", leggendo il
-- numero di telefono che l'app passa come metadato durante la registrazione.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone, display_name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'display_name', 'Tu'),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#2F6FED')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- Le tabelle per Cerchie, missioni e punteggi arriveranno nella fase 2,
-- quando colleghiamo anche il resto dell'app al database vero.
-- ============================================================================
