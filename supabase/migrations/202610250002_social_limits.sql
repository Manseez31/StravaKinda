-- Atomic write limits; no client access to the counters.
create table public.social_rate_limits (
 actor_id uuid not null references public.profiles on delete cascade,
 bucket text not null, window_start timestamptz not null, requests integer not null check(requests>0),
 primary key(actor_id,bucket,window_start)
);
alter table public.social_rate_limits enable row level security;
create function public.limit_social_write() returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid := (to_jsonb(new)->>TG_ARGV[0])::uuid; maximum integer := TG_ARGV[1]::integer; slot timestamptz := date_trunc(TG_ARGV[2],now()); n integer;
begin
 insert into public.social_rate_limits(actor_id,bucket,window_start,requests) values(actor,TG_TABLE_NAME,slot,1)
 on conflict(actor_id,bucket,window_start) do update set requests=social_rate_limits.requests+1 where social_rate_limits.requests<maximum returning requests into n;
 if n is null then raise exception 'Too many requests. Please try again later.' using errcode='P0001'; end if;
 return new;
end $$;
revoke all on function public.limit_social_write() from public,anon,authenticated;
create trigger comments_limit before insert on public.comments for each row execute function public.limit_social_write('user_id','20','minute');
create trigger kudos_limit before insert on public.activity_reactions for each row execute function public.limit_social_write('user_id','60','minute');
create trigger follows_limit before insert on public.follows for each row execute function public.limit_social_write('follower_id','30','minute');
create trigger reports_limit before insert on public.reports for each row execute function public.limit_social_write('reporter_id','5','day');
-- Schedule service-role retention cleanup before public deployment; do not grow counters forever.
