-- profiles-trigger.sql
--
-- Crea automaticamente un registro en public.profiles cuando se inserta un
-- usuario en auth.users. Idempotente: se puede correr varias veces.
--
-- NOTA: el mismo trigger ya esta incluido en schema.sql. Este archivo se
-- mantiene como copia standalone para poder re-aplicarlo sin re-correr todo
-- el esquema (por ejemplo, si el trigger se elimino accidentalmente desde la
-- UI de Supabase).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1),
      'Aldeano'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
