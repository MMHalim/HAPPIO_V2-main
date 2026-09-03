create table if not exists public.wins_scorecard_submissions (
    id bigint generated always as identity primary key,
    created_at timestamptz not null default now(),
    conversation_id text not null unique,
    agent_name text not null,
    taker_name text,
    url text,
    channel text,
    sme_answer text,
    sme_name text,
    sme_following_process text,
    monitoring_type text,
    interaction_related_to text,
    final_score text not null,
    agent_email text not null,
    certification text,
    calibration text,
    ticket_status text,
    sales text,
    sales_comments text,
    retained_yes_no text,
    comments_sme_related text,
    result_status text not null check (result_status in ('PASS', 'FAIL')),
    engagement_and_discovery text,
    engagement_and_discovery_comment text,
    value_positioning text,
    value_positioning_comment text,
    objection_handling_risistance text,
    objection_handling_risistance_comment text,
    win_skills text,
    win_skills_comment text,
    process_compliance text,
    process_compliance_comment text
);

alter table public.wins_scorecard_submissions
    add column if not exists engagement_and_discovery text,
    add column if not exists engagement_and_discovery_comment text,
    add column if not exists value_positioning text,
    add column if not exists value_positioning_comment text,
    add column if not exists objection_handling_risistance text,
    add column if not exists objection_handling_risistance_comment text,
    add column if not exists win_skills text,
    add column if not exists win_skills_comment text,
    add column if not exists process_compliance text,
    add column if not exists process_compliance_comment text;

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'wins_scorecard_submissions'
          and column_name = 'attributes_results'
    ) then
        execute $migrate$
            update public.wins_scorecard_submissions
            set
                engagement_and_discovery = coalesce(engagement_and_discovery, attributes_results #>> '{0,answer}'),
                engagement_and_discovery_comment = coalesce(engagement_and_discovery_comment, attributes_results #>> '{0,comment}'),
                value_positioning = coalesce(value_positioning, attributes_results #>> '{1,answer}'),
                value_positioning_comment = coalesce(value_positioning_comment, attributes_results #>> '{1,comment}'),
                objection_handling_risistance = coalesce(objection_handling_risistance, attributes_results #>> '{2,answer}'),
                objection_handling_risistance_comment = coalesce(objection_handling_risistance_comment, attributes_results #>> '{2,comment}'),
                win_skills = coalesce(win_skills, attributes_results #>> '{3,answer}'),
                win_skills_comment = coalesce(win_skills_comment, attributes_results #>> '{3,comment}'),
                process_compliance = coalesce(process_compliance, attributes_results #>> '{4,answer}'),
                process_compliance_comment = coalesce(process_compliance_comment, attributes_results #>> '{4,comment}')
        $migrate$;
    end if;
end $$;

alter table public.wins_scorecard_submissions
    drop column if exists attributes_results;

create index if not exists wins_scorecard_submissions_created_at_idx
    on public.wins_scorecard_submissions (created_at desc);

create index if not exists wins_scorecard_submissions_agent_name_idx
    on public.wins_scorecard_submissions (agent_name);

create index if not exists wins_scorecard_submissions_result_status_idx
    on public.wins_scorecard_submissions (result_status);

grant select, insert, update on public.wins_scorecard_submissions to anon, authenticated;
grant usage, select on sequence public.wins_scorecard_submissions_id_seq to anon, authenticated;

alter table public.wins_scorecard_submissions enable row level security;

drop policy if exists "wins_scorecard_submissions_select" on public.wins_scorecard_submissions;
drop policy if exists "wins_scorecard_submissions_insert" on public.wins_scorecard_submissions;
drop policy if exists "wins_scorecard_submissions_update" on public.wins_scorecard_submissions;

create policy "wins_scorecard_submissions_select"
on public.wins_scorecard_submissions
for select
to anon, authenticated
using (true);

create policy "wins_scorecard_submissions_insert"
on public.wins_scorecard_submissions
for insert
to anon, authenticated
with check (true);

create policy "wins_scorecard_submissions_update"
on public.wins_scorecard_submissions
for update
to anon, authenticated
using (true)
with check (true);
