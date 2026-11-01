-- Run with supabase test db against a disposable local instance. Transaction rolls back fixtures.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000001','owner@example.test'),('00000000-0000-4000-8000-000000000002','viewer@example.test');
insert into public.activities(id,user_id,title,sport,visibility,started_at,ended_at,distance_m,moving_seconds,elapsed_seconds) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Private run','running','private',now(),now(),0,0,0),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Public run','running','public',now(),now(),0,0,0),
 ('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','Followers run','running','followers',now(),now(),0,0,0);
insert into public.activity_points(activity_id,seq,latitude,longitude,recorded_at,accuracy,segment) select id,0,27.7,85.3,now(),5,0 from public.activities;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.activities),1,'Unrelated viewer sees only public summary');
select is((select count(*)::integer from public.activity_points),0,'Public activity never reveals raw GPS');
select throws_ok($$insert into public.subscriptions(user_id,active) values('00000000-0000-4000-8000-000000000002',true)$$,'42501',null,'Cannot self-grant premium');
select throws_ok($$insert into public.comments(activity_id,user_id,body) values('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Cannot see this')$$,'42501',null,'Cannot comment on hidden activity');
insert into public.follows(follower_id,following_id) values('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001');
select is((select count(*)::integer from public.activities),2,'Follower sees public and follower summaries');
select is((select count(*)::integer from public.activity_points),0,'Follower still sees no raw GPS');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select is((select count(*)::integer from public.activities),3,'Owner sees all summaries');
select is((select count(*)::integer from public.activity_points),3,'Owner sees all own GPS points');
insert into public.blocks(blocker_id,blocked_id) values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.activities),0,'Block overrides public/follower visibility');
select is((select count(*)::integer from public.privacy_zones),0,'Other athlete privacy zones hidden');
select throws_ok($$select public.reserve_ai_request('00000000-0000-4000-8000-000000000002')$$,'42501',null,'Client cannot bypass coach quota');
reset role;
set local role anon;
select is((select count(*)::integer from public.activities),0,'Anonymous users see no activities');
select * from finish();
rollback;
