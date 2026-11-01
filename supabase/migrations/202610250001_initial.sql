-- Apply to a disposable/test Supabase project first. All tracks are owner-only.
create extension if not exists postgis with schema extensions;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 username text unique check (username ~ '^[a-z0-9_]{3,30}$'), name text not null default '' check(length(name)<=80),
 bio text not null default '' check(length(bio)<=500), avatar_path text,
 is_private boolean not null default false, created_at timestamptz not null default now()
);
create table public.user_settings (user_id uuid primary key references public.profiles on delete cascade, units text not null default 'km' check(units in ('km','mi')), theme text not null default 'dark' check(theme in ('dark','light')), weekly_goal_km numeric not null default 20 check(weekly_goal_km>0), default_visibility text not null default 'private' check(default_visibility in ('private','followers','public')), notifications_enabled boolean not null default false);
create table public.blocks (blocker_id uuid references public.profiles on delete cascade, blocked_id uuid references public.profiles on delete cascade, primary key(blocker_id,blocked_id), check(blocker_id<>blocked_id));
create table public.follows (follower_id uuid references public.profiles on delete cascade, following_id uuid references public.profiles on delete cascade, created_at timestamptz not null default now(), primary key(follower_id,following_id), check(follower_id<>following_id));
create index follows_reverse on public.follows(following_id,follower_id);
create table public.activities (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade,
 title text not null check(length(title) between 1 and 120), description text not null default '' check(length(description)<=2000),
 sport text not null check(sport in ('running','walking','cycling','hiking')), visibility text not null default 'private' check(visibility in ('private','followers','public')),
 started_at timestamptz not null, ended_at timestamptz not null, distance_m double precision not null check(distance_m>=0 and distance_m<10000000),
 moving_seconds double precision not null check(moving_seconds>=0), active_seconds double precision not null default 0 check(active_seconds>=0), elapsed_seconds double precision not null check(elapsed_seconds>=0), elevation_m double precision check(elevation_m>=0),
 heart_rate_avg numeric check(heart_rate_avg between 20 and 250), power_avg numeric check(power_avg between 0 and 3000),
 verified boolean not null default false, created_at timestamptz not null default now(), check(ended_at>=started_at), check(moving_seconds<=elapsed_seconds), check(active_seconds<=elapsed_seconds)
);
create index activities_owner_time on public.activities(user_id,started_at desc);
create index activities_public_time on public.activities(started_at desc) where visibility='public';
create table public.activity_points (
 activity_id uuid not null references public.activities on delete cascade, seq integer not null check(seq>=0),
 latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180),
 recorded_at timestamptz not null, accuracy double precision not null check(accuracy between 0 and 35), altitude double precision, altitude_accuracy double precision,
 segment integer not null check(segment>=0), heart_rate numeric check(heart_rate between 20 and 250), power numeric check(power between 0 and 3000), primary key(activity_id,seq)
);
create table public.routes (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, title text not null check(length(title)<=120), waypoints jsonb not null check(jsonb_typeof(waypoints)='array' and jsonb_array_length(waypoints)<=2000), distance_m numeric check(distance_m>=0), created_at timestamptz not null default now());
create index routes_owner on public.routes(user_id);
create table public.activity_reactions (activity_id uuid references public.activities on delete cascade, user_id uuid references public.profiles on delete cascade, created_at timestamptz not null default now(), primary key(activity_id,user_id));
create table public.comments (id uuid primary key default gen_random_uuid(), activity_id uuid not null references public.activities on delete cascade, user_id uuid not null references public.profiles on delete cascade, body text not null check(length(body) between 1 and 500), created_at timestamptz not null default now());
create index comments_activity on public.comments(activity_id,created_at);
create table public.clubs (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles on delete cascade, name text not null check(length(name) between 1 and 80), description text not null default '' check(length(description)<=1000));
create table public.club_members (club_id uuid references public.clubs on delete cascade, user_id uuid references public.profiles on delete cascade, joined_at timestamptz not null default now(), primary key(club_id,user_id));
create table public.challenges (id uuid primary key default gen_random_uuid(), club_id uuid references public.clubs on delete cascade, title text not null check(length(title) between 1 and 120), target_m numeric not null check(target_m>0), starts_at timestamptz not null, ends_at timestamptz not null, check(ends_at>starts_at));
create table public.challenge_entries (challenge_id uuid references public.challenges on delete cascade, user_id uuid references public.profiles on delete cascade, joined_at timestamptz not null default now(), primary key(challenge_id,user_id));
create table public.segments (id uuid primary key default gen_random_uuid(), creator_id uuid references public.profiles on delete cascade, title text not null check(length(title)<=120), path extensions.geography(LineString,4326) not null, sport text not null check(sport in ('running','walking','cycling','hiking')));
create index segments_path on public.segments using gist(path);
create table public.segment_efforts (id uuid primary key default gen_random_uuid(), segment_id uuid not null references public.segments on delete cascade, activity_id uuid not null references public.activities on delete cascade, user_id uuid not null references public.profiles on delete cascade, seconds numeric not null check(seconds>0), verified boolean not null default false, unique(segment_id,activity_id));
create index segment_ranking on public.segment_efforts(segment_id,seconds) where verified;
create table public.subscriptions (user_id uuid primary key references public.profiles on delete cascade, entitlement text not null default 'premium', expires_at timestamptz, active boolean not null default false, checked_at timestamptz not null default now());
create table public.training_metrics (user_id uuid references public.profiles on delete cascade, day date not null, distance_m numeric check(distance_m>=0), moving_seconds numeric check(moving_seconds>=0), heart_rate_load numeric, primary key(user_id,day));
create table public.ai_insights (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, summary text not null, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, kind text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now());
create index notifications_owner_time on public.notifications(user_id,created_at desc);
create table public.privacy_zones (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180), radius_m integer not null check(radius_m between 100 and 5000));
create table public.reports (id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles on delete cascade, reported_id uuid not null references public.profiles on delete cascade, reason text not null check(length(reason) between 10 and 1000), created_at timestamptz not null default now());
create table public.ai_usage (user_id uuid references public.profiles on delete cascade, day date not null default current_date, requests integer not null default 0, primary key(user_id,day));

create function public.create_profile() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id) values(new.id); insert into public.user_settings(user_id) values(new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
create function public.is_blocked(other uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.blocks where (blocker_id=auth.uid() and blocked_id=other) or (blocked_id=auth.uid() and blocker_id=other)) $$;
create function public.can_view_activity(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.activities a join public.profiles p on p.id=a.user_id where a.id=target and (a.user_id=auth.uid() or (not public.is_blocked(a.user_id) and ((a.visibility='public' and not p.is_private) or (a.visibility in ('public','followers') and exists(select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=a.user_id))))))
$$;
-- Enable RLS on every table, including server-only usage and subscription tables.
do $$ declare t text; begin foreach t in array array['profiles','user_settings','blocks','follows','activities','activity_points','routes','activity_reactions','comments','clubs','club_members','challenges','challenge_entries','segments','segment_efforts','subscriptions','training_metrics','ai_insights','notifications','privacy_zones','reports','ai_usage'] loop execute format('alter table public.%I enable row level security', t); end loop; end $$;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or (not is_private and not public.is_blocked(id)));
create policy profiles_edit on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy settings_owner on public.user_settings for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy blocks_owner on public.blocks for all to authenticated using(blocker_id=auth.uid()) with check(blocker_id=auth.uid());
create policy follows_read on public.follows for select to authenticated using(follower_id=auth.uid() or following_id=auth.uid());
create policy follows_insert on public.follows for insert to authenticated with check(follower_id=auth.uid() and not public.is_blocked(following_id) and exists(select 1 from public.profiles where id=following_id and not is_private));
create policy follows_delete on public.follows for delete to authenticated using(follower_id=auth.uid());
create policy activities_read on public.activities for select to authenticated using(public.can_view_activity(id));
-- Activity writes go through save_workout; cannot self-assert verified status.
create policy activities_delete on public.activities for delete to authenticated using(user_id=auth.uid());
create policy points_owner on public.activity_points for select to authenticated using(exists(select 1 from public.activities a where a.id=activity_id and a.user_id=auth.uid()));
create policy routes_owner on public.routes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy reactions_read on public.activity_reactions for select to authenticated using(public.can_view_activity(activity_id) and not public.is_blocked(user_id));
create policy reactions_insert on public.activity_reactions for insert to authenticated with check(user_id=auth.uid() and public.can_view_activity(activity_id));
create policy reactions_delete on public.activity_reactions for delete to authenticated using(user_id=auth.uid());
create policy comments_read on public.comments for select to authenticated using(public.can_view_activity(activity_id) and not public.is_blocked(user_id));
create policy comments_insert on public.comments for insert to authenticated with check(user_id=auth.uid() and public.can_view_activity(activity_id));
create policy comments_delete on public.comments for delete to authenticated using(user_id=auth.uid());
create policy clubs_read on public.clubs for select to authenticated using(not public.is_blocked(owner_id));
create policy clubs_owner on public.clubs for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy members_read on public.club_members for select to authenticated using(user_id=auth.uid());
create policy members_insert on public.club_members for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.clubs where id=club_id));
create policy members_delete on public.club_members for delete to authenticated using(user_id=auth.uid());
create policy challenges_read on public.challenges for select to authenticated using(club_id is null or exists(select 1 from public.club_members cm where cm.club_id=challenges.club_id and cm.user_id=auth.uid()));
create policy entries_read on public.challenge_entries for select to authenticated using(user_id=auth.uid());
create policy entries_insert on public.challenge_entries for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.challenges c where c.id=challenge_id and c.ends_at>now()));
create policy entries_delete on public.challenge_entries for delete to authenticated using(user_id=auth.uid());
-- Segment geometry/efforts remain private until a reviewed redaction and ranking API exists.
create policy segments_owner on public.segments for all to authenticated using(creator_id=auth.uid()) with check(creator_id=auth.uid());
create policy efforts_owner on public.segment_efforts for select to authenticated using(user_id=auth.uid());
create policy subscriptions_read on public.subscriptions for select to authenticated using(user_id=auth.uid());
create policy metrics_read on public.training_metrics for select to authenticated using(user_id=auth.uid());
create policy insights_read on public.ai_insights for select to authenticated using(user_id=auth.uid());
create policy notifications_read on public.notifications for select to authenticated using(user_id=auth.uid());
create policy zones_owner on public.privacy_zones for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy reports_insert on public.reports for insert to authenticated with check(reporter_id=auth.uid());
create policy reports_read on public.reports for select to authenticated using(reporter_id=auth.uid());

create function public.save_workout(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare activity_uuid uuid := (payload->>'id')::uuid; current_user_id uuid := auth.uid(); point jsonb; previous jsonb; idx integer:=0; dt double precision; d double precision; limit_speed double precision;
begin
 if current_user_id is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(payload->'points') <> 'array' or jsonb_array_length(payload->'points')>50000 then raise exception 'Invalid track size'; end if;
 if (payload->>'ended_at')::timestamptz>now()+interval '5 minutes' or (payload->>'started_at')::timestamptz>now()+interval '5 minutes' then raise exception 'Future activity'; end if;
 limit_speed:=case payload->>'sport' when 'cycling' then 35 when 'running' then 12 when 'walking' then 4 when 'hiking' then 5 else 0 end;
 -- Row-level ownership check is also enforced by the conflict clause under concurrency.
 insert into public.activities(id,user_id,title,description,sport,visibility,started_at,ended_at,distance_m,moving_seconds,active_seconds,elapsed_seconds,elevation_m)
 values(activity_uuid,current_user_id,payload->>'title',payload->>'description',payload->>'sport',payload->>'visibility',(payload->>'started_at')::timestamptz,(payload->>'ended_at')::timestamptz,(payload->>'distance_m')::double precision,(payload->>'moving_seconds')::double precision,(payload->>'active_seconds')::double precision,(payload->>'elapsed_seconds')::double precision,(payload->>'elevation_m')::double precision)
 on conflict(id) do update set title=excluded.title,description=excluded.description,sport=excluded.sport,visibility=excluded.visibility,verified=false where activities.user_id=current_user_id;
 if not found then raise exception 'Activity owner mismatch'; end if;
 delete from public.activity_points where activity_id=activity_uuid;
 for point in select value from jsonb_array_elements(payload->'points') loop
  if previous is not null then
   dt:=((point->>'timestamp')::double precision-(previous->>'timestamp')::double precision)/1000;
   if dt<=0 then raise exception 'Track timestamps must increase'; end if;
   if point->>'segment'=previous->>'segment' then
    d:=extensions.st_distance(extensions.st_setsrid(extensions.st_makepoint((point->>'longitude')::double precision,(point->>'latitude')::double precision),4326)::extensions.geography,extensions.st_setsrid(extensions.st_makepoint((previous->>'longitude')::double precision,(previous->>'latitude')::double precision),4326)::extensions.geography);
    if d/dt>limit_speed*1.05 then raise exception 'Unrealistic GPS jump'; end if;
   end if;
  end if;
  if to_timestamp((point->>'timestamp')::double precision/1000) not between (payload->>'started_at')::timestamptz and (payload->>'ended_at')::timestamptz then raise exception 'Point outside activity'; end if;
  insert into public.activity_points(activity_id,seq,latitude,longitude,recorded_at,accuracy,altitude,altitude_accuracy,segment) values(activity_uuid,idx,(point->>'latitude')::double precision,(point->>'longitude')::double precision,to_timestamp((point->>'timestamp')::double precision/1000),(point->>'accuracy')::double precision,(point->>'altitude')::double precision,(point->>'altitudeAccuracy')::double precision,(point->>'segment')::integer);
  previous:=point; idx:=idx+1;
 end loop;
 return activity_uuid;
end $$;
-- Atomic usage reservation. Only server service role may call it.
create function public.reserve_ai_request(target uuid) returns boolean language plpgsql security definer set search_path='' as $$ declare n integer; begin
 insert into public.ai_usage(user_id,day,requests) values(target,current_date,1) on conflict(user_id,day) do update set requests=ai_usage.requests+1 where ai_usage.requests<10 returning requests into n;
 return n is not null;
end $$;
revoke all on function public.reserve_ai_request(uuid) from public,anon,authenticated;
grant execute on function public.reserve_ai_request(uuid) to service_role;
revoke all on function public.save_workout(jsonb),public.can_view_activity(uuid),public.is_blocked(uuid),public.create_profile() from public,anon;
grant execute on function public.save_workout(jsonb),public.can_view_activity(uuid),public.is_blocked(uuid) to authenticated;
-- No public avatar bucket: owner-scoped assets until a reviewed public avatar workflow exists.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy avatar_owner on storage.objects for all to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
