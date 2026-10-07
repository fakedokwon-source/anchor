-- Optional: automatically create a profile when a Supabase Auth user is created.
create or replace function public.handle_new_anchor_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, about)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_anchor on auth.users;
create trigger on_auth_user_created_anchor after insert on auth.users
for each row execute procedure public.handle_new_anchor_user();
