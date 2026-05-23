-- Server-side rate limit for place_messages.
-- Espejo del limite que aplica el cliente en services/messages.ts:
--   * Maximo 5 mensajes por usuario por ventana de 60 segundos.
--   * No se acepta el mismo cuerpo dos veces seguidas (anti repeticion).
-- Codigos de error usan prefijos legibles para que el cliente los traduzca.

create or replace function public.enforce_place_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
  last_body text;
begin
  select count(*)
    into recent_count
  from public.place_messages
  where user_id = new.user_id
    and created_at > now() - interval '1 minute';

  if recent_count >= 5 then
    raise exception 'rate_limit_exceeded: maximo 5 mensajes por minuto'
      using errcode = 'check_violation';
  end if;

  select body
    into last_body
  from public.place_messages
  where user_id = new.user_id
  order by created_at desc
  limit 1;

  if last_body is not null
     and lower(btrim(regexp_replace(last_body, '\s+', ' ', 'g')))
       = lower(btrim(regexp_replace(new.body, '\s+', ' ', 'g'))) then
    raise exception 'duplicate_message: no repitas el mismo mensaje seguido'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists place_messages_rate_limit on public.place_messages;
create trigger place_messages_rate_limit
before insert on public.place_messages
for each row execute function public.enforce_place_message_rate_limit();

create index if not exists place_messages_user_created_idx
  on public.place_messages(user_id, created_at desc);
