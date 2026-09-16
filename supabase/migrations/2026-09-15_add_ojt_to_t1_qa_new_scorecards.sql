begin;

alter table public."T1_QA_New_Scorecards"
  add column if not exists "OJT" text;

update public."T1_QA_New_Scorecards"
set "OJT" = coalesce(nullif(trim("OJT"), ''), 'No')
where "OJT" is null or trim("OJT") = '';

alter table public."T1_QA_New_Scorecards"
  alter column "OJT" set default 'No';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 't1_qa_new_scorecards_ojt_check'
  ) then
    alter table public."T1_QA_New_Scorecards"
      add constraint t1_qa_new_scorecards_ojt_check
      check ("OJT" in ('Yes', 'No'));
  end if;
end $$;

alter table public."T1_QA_New_Scorecards"
  alter column "OJT" set not null;

commit;
