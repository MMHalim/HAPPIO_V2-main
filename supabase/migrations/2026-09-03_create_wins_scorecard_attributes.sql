create table if not exists public.wins_scorecard_attributes (
    id bigint primary key,
    attribute text not null unique,
    description text not null,
    score numeric(5,2) not null check (score >= 0 and score <= 100)
);

insert into public.wins_scorecard_attributes (id, attribute, description, score)
values
    (1, 'Engagement And Discovery', E'1. Personalizes the interaction using the customer''s name, mirrors energy appropriately, and maintains an empathetic, non-defensive tone.\n2. Asks open-ended probe questions to uncover the customer''s true core concern or primary driver (e.g., budget limits, frustration, underutilized features).\n3. Paraphrases the customer''s situation back to them before pitching, confirming full understanding and building trust.', 15),
    (2, 'Value Positioning', E'1. Connects features directly to pain points discovered earlier.\n2. Translates product specifications into clear customer benefits\n3. Speaks authoritatively as a trusted advisor without relying on rigid scripts.\n4. Recommends the specific, most appropriate product feature, plan, or save option tailored to the opportunity spotted.', 30),
    (3, 'Objection Handling & Risistance', E'1. Isolates root concerns (cost, timing, trust, feature gaps).\n2. Employs consultative negotiation and tiered options rather than jumping straight to deep discounts.\n3. Maintains a calm, empathetic, and non-defensive tone when facing friction.', 15),
    (4, 'Win Skills', E'1. Identifies verbal or situational buying signals during the conversation (e.g., questions about pricing, timing, or agreement cues).\n2. Explicitly asks for the agreement, save, or sale using clear, confident closing language.\n3. Secures the right resolution, sets clear expectations, and fully completes the transaction during the live interaction so the customer does not change their mind.\n4. Establishing trust by showing genuine care for their needs and long-term outcome.', 30),
    (5, 'Process & Compliance', E'1. Follows required verification, policy, and cancellation workflow procedures.\n2. Accurately updates CRM notes and rest of documentations (Cardd submission, Retool ...)', 10)
on conflict (id) do update
set
    attribute = excluded.attribute,
    description = excluded.description,
    score = excluded.score;

grant select on public.wins_scorecard_attributes to anon, authenticated;

alter table public.wins_scorecard_attributes enable row level security;

drop policy if exists "wins_scorecard_attributes_select" on public.wins_scorecard_attributes;

create policy "wins_scorecard_attributes_select"
on public.wins_scorecard_attributes
for select
to anon, authenticated
using (true);
