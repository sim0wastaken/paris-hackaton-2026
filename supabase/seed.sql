-- Repeatable Motive demo data for provider-free development.

insert into public.projects (
  id,
  name,
  brand_url,
  status,
  extra_context,
  demo_slug,
  metadata
) values (
  '00000000-0000-0000-0000-000000000001',
  'AtlasDesk',
  'https://atlasdesk.example',
  'creative_ready',
  'AtlasDesk helps revenue teams turn Gmail conversations into CRM-ready follow-up workflows before deals go cold.',
  'motive-demo',
  '{"is_seeded_demo": true, "category": "B2B SaaS", "icp": "founder-led and revenue teams with inbox-driven sales"}'::jsonb
);

insert into public.sources (
  id,
  project_id,
  type,
  name,
  uri,
  raw_text,
  extracted_text,
  status,
  provider,
  provider_request_json,
  provider_response_json,
  metadata
) values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'url',
    'AtlasDesk homepage',
    'https://atlasdesk.example',
    null,
    'AtlasDesk brings CRM-grade follow-up into Gmail. Launch your team before Friday, import spreadsheet notes, and keep every buyer thread tied to the right next step.',
    'processed',
    'seed',
    '{"url": "https://atlasdesk.example"}'::jsonb,
    '{"title": "AtlasDesk - Gmail CRM follow-up", "status": "seeded"}'::jsonb,
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'markdown',
    'Founder interview notes',
    null,
    'Customers ask if AtlasDesk can migrate spreadsheet follow-up into Gmail without interrupting HubSpot sync. Pricing clarity and security proof are repeated blockers.',
    'Customers ask if AtlasDesk can migrate spreadsheet follow-up into Gmail without interrupting HubSpot sync. Pricing clarity and security proof are repeated blockers.',
    'processed',
    'manual',
    '{}'::jsonb,
    '{"status": "seeded"}'::jsonb,
    '{"is_seeded_demo": true}'::jsonb
  );

insert into public.extraction_runs (
  id,
  project_id,
  phase,
  status,
  model,
  provider,
  prompt_version,
  input_json,
  output_json,
  started_at,
  completed_at,
  duration_ms,
  attempt,
  metadata
) values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'source_recap',
    'succeeded',
    'gpt-5-mini',
    'openai',
    '2026-05-16',
    '{"source_ids": ["10000000-0000-0000-0000-000000000001", "10000000-0000-0000-0000-000000000002"]}'::jsonb,
    '{"recap": "AtlasDesk sells Gmail-native CRM follow-up for teams that need fast setup, spreadsheet migration, and buyer-thread discipline."}'::jsonb,
    '2026-05-16T08:00:00Z',
    '2026-05-16T08:00:05Z',
    5000,
    0,
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'feature_map',
    'succeeded',
    'gpt-5-mini',
    'openai',
    '2026-05-16',
    '{"recap_run_id": "20000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"feature_count": 10}'::jsonb,
    '2026-05-16T08:00:06Z',
    '2026-05-16T08:00:12Z',
    6000,
    0,
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'conversation_map',
    'succeeded',
    'gpt-5-mini',
    'openai',
    '2026-05-16',
    '{"feature_run_id": "20000000-0000-0000-0000-000000000002"}'::jsonb,
    '{"conversation_count": 6}'::jsonb,
    '2026-05-16T08:00:13Z',
    '2026-05-16T08:00:19Z',
    6000,
    0,
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'intent_classification',
    'succeeded',
    'gpt-5-mini',
    'openai',
    '2026-05-16',
    '{"conversation_run_id": "20000000-0000-0000-0000-000000000003"}'::jsonb,
    '{"labels": ["vendor_evaluation", "urgency_timeline", "pricing_check", "security_review"]}'::jsonb,
    '2026-05-16T08:00:20Z',
    '2026-05-16T08:00:26Z',
    6000,
    0,
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'landing_gaps',
    'succeeded',
    'gpt-5-mini',
    'openai',
    '2026-05-16',
    '{"conversation_run_id": "20000000-0000-0000-0000-000000000004"}'::jsonb,
    '{"gap_count": 4}'::jsonb,
    '2026-05-16T08:00:27Z',
    '2026-05-16T08:00:34Z',
    7000,
    0,
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'ad_groups',
    'succeeded',
    'gpt-5-mini',
    'openai',
    '2026-05-16',
    '{"features": 10, "conversations": 6, "landing_gaps": 4}'::jsonb,
    '{"campaigns": 1, "ad_groups": 3}'::jsonb,
    '2026-05-16T08:00:35Z',
    '2026-05-16T08:00:42Z',
    7000,
    0,
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'creative_text',
    'succeeded',
    'gpt-5-mini',
    'openai',
    '2026-05-16',
    '{"approved_ad_groups": 3}'::jsonb,
    '{"creative_variants": 6}'::jsonb,
    '2026-05-16T08:01:00Z',
    '2026-05-16T08:01:11Z',
    11000,
    0,
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'monitoring_synthesis',
    'succeeded',
    'gpt-5-mini',
    'openai',
    '2026-05-16',
    '{"deployment_id": "90000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"snapshots": 6, "basis": "seeded simulated demo"}'::jsonb,
    '2026-05-16T08:02:00Z',
    '2026-05-16T08:02:08Z',
    8000,
    0,
    '{"is_seeded_demo": true}'::jsonb
  );

insert into public.brand_features (
  id,
  project_id,
  extraction_run_id,
  type,
  title,
  description,
  evidence,
  source_refs,
  confidence,
  review_status,
  metadata
) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'feature', 'Gmail-native workspace', 'Sales follow-up is managed directly inside Gmail instead of a separate CRM tab.', 'CRM-grade follow-up into Gmail', '["10000000-0000-0000-0000-000000000001"]'::jsonb, 0.930, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'value_prop', 'Live before Friday', 'Fast setup message for urgent teams that need a working workflow this week.', 'Launch your team before Friday', '["10000000-0000-0000-0000-000000000001"]'::jsonb, 0.920, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'usp', 'Spreadsheet migration', 'AtlasDesk can move spreadsheet notes into a more durable Gmail follow-up workflow.', 'import spreadsheet notes', '["10000000-0000-0000-0000-000000000001"]'::jsonb, 0.880, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'use_case', 'Founder-led sales', 'Small teams can assign next steps without requiring an admin-heavy CRM rollout.', 'founder-led teams with inbox-driven sales', '["10000000-0000-0000-0000-000000000002"]'::jsonb, 0.850, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'proof_point', 'HubSpot sync mention', 'Buyers repeatedly ask whether Gmail follow-up can coexist with HubSpot sync.', 'without interrupting HubSpot sync', '["10000000-0000-0000-0000-000000000002"]'::jsonb, 0.810, 'edited', '{"is_seeded_demo": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'objection', 'Pricing clarity', 'Pricing uncertainty appears as a repeated blocker for ready-to-buy teams.', 'Pricing clarity ... repeated blockers', '["10000000-0000-0000-0000-000000000002"]'::jsonb, 0.900, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'objection', 'Security proof', 'Security proof is needed before security-minded buyers can approve.', 'security proof are repeated blockers', '["10000000-0000-0000-0000-000000000002"]'::jsonb, 0.870, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'feature', 'Buyer thread discipline', 'Every buyer thread can be tied to a next step for follow-up accountability.', 'buyer thread tied to the right next step', '["10000000-0000-0000-0000-000000000001"]'::jsonb, 0.910, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'proof_point', 'Inbox-first positioning', 'The strongest differentiator is reducing tab switching for revenue teams.', 'inside Gmail', '["10000000-0000-0000-0000-000000000001"]'::jsonb, 0.830, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'value_prop', 'Recover cold deals', 'The system reduces missed follow-up by keeping next steps attached to Gmail threads.', 'before deals go cold', '["10000000-0000-0000-0000-000000000002"]'::jsonb, 0.860, 'approved', '{"is_seeded_demo": true}'::jsonb);

insert into public.conversations (
  id,
  project_id,
  extraction_run_id,
  text,
  stage,
  intent_type,
  buyer_role,
  constraints_json,
  source_refs,
  confidence,
  review_status,
  metadata
) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Can we get the Gmail workflow live before Friday for five reps?', 'vendor_evaluation', 'urgency_timeline', 'founder', '{"constraints":[{"type":"timeline","value":"before Friday"},{"type":"team_size","value":"five reps"}]}'::jsonb, '["10000000-0000-0000-0000-000000000001"]'::jsonb, 0.950, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'We have a spreadsheet full of follow-up notes. Can AtlasDesk import it without breaking HubSpot sync?', 'solution_compare', 'migration_risk', 'revenue_lead', '{"constraints":[{"type":"migration_object","value":"spreadsheet follow-up notes"},{"type":"integration","value":"HubSpot"}]}'::jsonb, '["10000000-0000-0000-0000-000000000002"]'::jsonb, 0.920, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Do you have proof that teams actually recover deals after moving follow-up into Gmail?', 'vendor_evaluation', 'proof_request', 'marketing_lead', '{"constraints":[{"type":"approval_process","value":"proof before rollout"}]}'::jsonb, '["10000000-0000-0000-0000-000000000002"]'::jsonb, 0.900, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'What does it cost for a small team, and is there a minimum contract?', 'pricing_check', 'budget_validation', 'finance', '{"constraints":[{"type":"budget","value":"small team pricing"},{"type":"approval_process","value":"minimum contract"}]}'::jsonb, '["10000000-0000-0000-0000-000000000002"]'::jsonb, 0.870, 'pending', '{"is_seeded_demo": true}'::jsonb),
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Security needs to know how Gmail permissions are handled before we approve.', 'security_review', 'trust_check', 'security', '{"constraints":[{"type":"compliance","value":"Gmail permissions review"}]}'::jsonb, '["10000000-0000-0000-0000-000000000002"]'::jsonb, 0.890, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'We are ready to buy if setup is clear and reps do not need to leave Gmail.', 'ready_to_buy', 'workflow_pain', 'operations', '{"constraints":[{"type":"technical","value":"no context switching"},{"type":"timeline","value":"clear setup path"}]}'::jsonb, '["10000000-0000-0000-0000-000000000001"]'::jsonb, 0.910, 'approved', '{"is_seeded_demo": true}'::jsonb);

insert into public.landing_gaps (
  id,
  project_id,
  extraction_run_id,
  conversation_id,
  gap_type,
  description,
  suggested_fix,
  severity,
  source_refs,
  review_status,
  metadata
) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', 'proof', 'The page claims better follow-up but does not show recovery proof or quantified outcomes.', 'Add a compact proof block with recovered-deal examples and quantified follow-up lift.', 4, '["10000000-0000-0000-0000-000000000002"]'::jsonb, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000004', 'pricing_clarity', 'Pricing and minimum contract details are unclear for small teams.', 'Add a small-team pricing FAQ with a visible minimum-contract answer.', 5, '["10000000-0000-0000-0000-000000000002"]'::jsonb, 'pending', '{"is_seeded_demo": true}'::jsonb),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', 'integration_depth', 'HubSpot coexistence appears important but is not explained on the page.', 'Show a HubSpot sync diagram and migration checklist.', 4, '["10000000-0000-0000-0000-000000000002"]'::jsonb, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', 'security', 'Gmail permission and data handling assurances are missing.', 'Add a security note covering OAuth scopes, retention, and admin controls.', 5, '["10000000-0000-0000-0000-000000000002"]'::jsonb, 'approved', '{"is_seeded_demo": true}'::jsonb);

insert into public.campaigns (
  id,
  project_id,
  extraction_run_id,
  name,
  objective,
  status,
  start_date,
  end_date,
  lifetime_spend_limit_micros,
  countries,
  custom_instruction,
  rationale,
  review_status,
  metadata
) values (
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000006',
  'AtlasDesk - Gmail follow-up',
  'Clicks',
  'approved',
  '2026-05-16',
  '2026-06-15',
  5000000,
  array['US']::text[],
  'Bias generation toward Gmail setup speed, spreadsheet migration safety, proof-seeking buyers, and pricing clarity.',
  'Campaign groups buyers by the strongest constraints surfaced during extraction.',
  'approved',
  '{"is_seeded_demo": true}'::jsonb
);

insert into public.product_feeds (
  id,
  project_id,
  name,
  source_type,
  format,
  status,
  item_count,
  metadata
) values (
  '61000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'AtlasDesk demo plan feed',
  'manual',
  'jsonl',
  'processed',
  2,
  '{"is_seeded_demo": true, "note": "Product-feed path exists even though primary demo is B2B SaaS."}'::jsonb
);

insert into public.product_feed_items (
  id,
  project_id,
  product_feed_id,
  item_id,
  title,
  description,
  link,
  image_link,
  availability,
  price,
  brand,
  google_product_category,
  product_type,
  condition,
  raw_json,
  review_status,
  metadata
) values
  ('62000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'atlasdesk-starter', 'AtlasDesk Starter', 'Gmail-native follow-up for small revenue teams.', 'https://atlasdesk.example/pricing', 'https://atlasdesk.example/assets/starter.jpg', 'in_stock', '49 USD', 'AtlasDesk', 'Software > Business Software', 'CRM software', 'new', '{"sku":"atlasdesk-starter"}'::jsonb, 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('62000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'atlasdesk-growth', 'AtlasDesk Growth', 'Advanced follow-up controls for growing sales teams.', 'https://atlasdesk.example/pricing', 'https://atlasdesk.example/assets/growth.jpg', 'in_stock', '149 USD', 'AtlasDesk', 'Software > Business Software', 'CRM software', 'new', '{"sku":"atlasdesk-growth"}'::jsonb, 'pending', '{"is_seeded_demo": true}'::jsonb);

insert into public.ad_groups (
  id,
  project_id,
  campaign_id,
  extraction_run_id,
  name,
  rationale,
  context_hints,
  billing_event_type,
  max_bid_micros,
  target_stage,
  target_intent,
  conversation_ids,
  feature_ids,
  landing_gap_ids,
  product_feed_item_ids,
  status,
  review_status,
  metadata
) values
  (
    '70000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000006',
    'Friday setup urgency',
    'Targets buyers who need the Gmail workflow live before an immediate deadline.',
    '["Gmail CRM setup by Friday", "five-rep revenue team", "fast onboarding"]'::jsonb,
    'click',
    3000000,
    'vendor_evaluation',
    'urgency_timeline',
    array['40000000-0000-0000-0000-000000000001'::uuid, '40000000-0000-0000-0000-000000000006'::uuid],
    array['30000000-0000-0000-0000-000000000002'::uuid, '30000000-0000-0000-0000-000000000008'::uuid],
    array[]::uuid[],
    array['62000000-0000-0000-0000-000000000001'::uuid],
    'approved',
    'approved',
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000006',
    'Migration without sync risk',
    'Targets teams moving spreadsheet follow-up into Gmail while protecting HubSpot sync.',
    '["spreadsheet CRM migration", "HubSpot sync safety", "Gmail workflow continuity"]'::jsonb,
    'click',
    3200000,
    'solution_compare',
    'migration_risk',
    array['40000000-0000-0000-0000-000000000002'::uuid],
    array['30000000-0000-0000-0000-000000000003'::uuid, '30000000-0000-0000-0000-000000000005'::uuid],
    array['50000000-0000-0000-0000-000000000003'::uuid],
    array['62000000-0000-0000-0000-000000000002'::uuid],
    'approved',
    'approved',
    '{"is_seeded_demo": true}'::jsonb
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000006',
    'Proof and pricing confidence',
    'Targets proof-seeking and pricing-check conversations with sharper landing-page expectations.',
    '["proof before rollout", "small team pricing", "security approval for Gmail"]'::jsonb,
    'click',
    2800000,
    'pricing_check',
    'proof_request',
    array['40000000-0000-0000-0000-000000000003'::uuid, '40000000-0000-0000-0000-000000000004'::uuid, '40000000-0000-0000-0000-000000000005'::uuid],
    array['30000000-0000-0000-0000-000000000006'::uuid, '30000000-0000-0000-0000-000000000007'::uuid],
    array['50000000-0000-0000-0000-000000000001'::uuid, '50000000-0000-0000-0000-000000000002'::uuid, '50000000-0000-0000-0000-000000000004'::uuid],
    array[]::uuid[],
    'approved',
    'approved',
    '{"is_seeded_demo": true}'::jsonb
  );

insert into public.creative_variants (
  id,
  project_id,
  ad_group_id,
  extraction_run_id,
  title,
  description,
  creative_angle,
  asset_type,
  asset_prompt,
  asset_url,
  asset_generation_status,
  asset_width,
  asset_height,
  asset_mime_type,
  target_url,
  provider,
  provider_request_json,
  provider_response_json,
  openai_validation_json,
  status,
  review_status,
  metadata
) values
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'Live by Friday', 'Launch Gmail follow-up for five reps before the week ends.', 'specific_timeline', 'image', 'Square image of a Gmail inbox turning messages into checked follow-up tasks, modern SaaS style.', 'https://atlasdesk.example/demo/live-by-friday.jpg', 'ready', 1024, 1024, 'image/jpeg', 'https://atlasdesk.example/gmail-setup', 'openai', '{"ad_group_id":"70000000-0000-0000-0000-000000000001"}'::jsonb, '{"title":"Live by Friday"}'::jsonb, '{"exportable":true,"title_max_50":true,"body_max_100":true}'::jsonb, 'approved', 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', 'Gmail CRM fast', 'Give reps a CRM-grade inbox workflow without a long rollout.', 'generic_value_prop', 'none', 'Prompt skipped in demo mode.', null, 'skipped', null, null, null, 'https://atlasdesk.example/gmail-setup', 'openai', '{"ad_group_id":"70000000-0000-0000-0000-000000000001"}'::jsonb, '{"title":"Gmail CRM fast"}'::jsonb, '{"exportable":false,"reason":"missing image asset"}'::jsonb, 'draft', 'pending', '{"is_seeded_demo": true}'::jsonb),
  ('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007', 'Move notes safely', 'Import spreadsheet follow-up while keeping HubSpot sync intact.', 'migration_setup', 'image', 'Square image of spreadsheet rows flowing into Gmail labels with a HubSpot sync checkmark.', 'https://atlasdesk.example/demo/move-notes-safely.jpg', 'ready', 1024, 1024, 'image/jpeg', 'https://atlasdesk.example/migration', 'openai', '{"ad_group_id":"70000000-0000-0000-0000-000000000002"}'::jsonb, '{"title":"Move notes safely"}'::jsonb, '{"exportable":true,"title_max_50":true,"body_max_100":true}'::jsonb, 'approved', 'approved', '{"is_seeded_demo": true}'::jsonb),
  ('80000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007', 'No sync surprises', 'Plan the spreadsheet move before reps lose track of active buyers.', 'migration_setup', 'none', 'Prompt skipped in demo mode.', null, 'skipped', null, null, null, 'https://atlasdesk.example/migration', 'openai', '{"ad_group_id":"70000000-0000-0000-0000-000000000002"}'::jsonb, '{"title":"No sync surprises"}'::jsonb, '{"exportable":false,"reason":"missing image asset"}'::jsonb, 'draft', 'pending', '{"is_seeded_demo": true}'::jsonb),
  ('80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000007', 'Proof for Gmail', 'Show security and recovery proof before pricing questions stall.', 'proof_heavy', 'image', 'Square proof dashboard with recovered deals, security badge, and Gmail thread cards.', 'https://atlasdesk.example/demo/proof-for-gmail.jpg', 'ready', 1024, 1024, 'image/jpeg', 'https://atlasdesk.example/proof', 'openai', '{"ad_group_id":"70000000-0000-0000-0000-000000000003"}'::jsonb, '{"title":"Proof for Gmail"}'::jsonb, '{"exportable":true,"title_max_50":true,"body_max_100":true}'::jsonb, 'approved', 'edited', '{"is_seeded_demo": true}'::jsonb),
  ('80000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000007', 'Small team price', 'Answer budget blockers with a simple path for small sales teams.', 'pricing_clarity', 'none', 'Prompt skipped in demo mode.', null, 'skipped', null, null, null, 'https://atlasdesk.example/pricing', 'openai', '{"ad_group_id":"70000000-0000-0000-0000-000000000003"}'::jsonb, '{"title":"Small team price"}'::jsonb, '{"exportable":false,"reason":"missing image asset"}'::jsonb, 'draft', 'pending', '{"is_seeded_demo": true}'::jsonb);

insert into public.human_reviews (
  id,
  project_id,
  entity_type,
  entity_id,
  action,
  before_json,
  after_json,
  comment,
  metadata
) values
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'brand_feature', '30000000-0000-0000-0000-000000000005', 'edit', '{"title":"HubSpot mention"}'::jsonb, '{"title":"HubSpot sync mention"}'::jsonb, 'Clarified that the evidence is about sync coexistence, not generic integration.', '{"is_seeded_demo": true}'::jsonb),
  ('81000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'conversation', '40000000-0000-0000-0000-000000000001', 'approve', '{}'::jsonb, '{"review_status":"approved"}'::jsonb, 'Strong demo urgency conversation.', '{"is_seeded_demo": true}'::jsonb),
  ('81000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'landing_gap', '50000000-0000-0000-0000-000000000002', 'enrich', '{"suggested_fix":"Add pricing details."}'::jsonb, '{"suggested_fix":"Add a small-team pricing FAQ with a visible minimum-contract answer."}'::jsonb, 'Make the pricing fix actionable.', '{"is_seeded_demo": true}'::jsonb),
  ('81000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'ad_group', '70000000-0000-0000-0000-000000000001', 'approve', '{}'::jsonb, '{"review_status":"approved"}'::jsonb, 'Best first demo ad group.', '{"is_seeded_demo": true}'::jsonb),
  ('81000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'creative_variant', '80000000-0000-0000-0000-000000000005', 'edit', '{"description":"Show proof before questions stall."}'::jsonb, '{"description":"Show security and recovery proof before pricing questions stall."}'::jsonb, 'Added security angle for approval audience.', '{"is_seeded_demo": true}'::jsonb),
  ('81000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'creative_variant', '80000000-0000-0000-0000-000000000002', 'reject', '{"status":"draft"}'::jsonb, '{"status":"rejected","reason":"too generic"}'::jsonb, 'Generic value proposition underperformed against specific timeline copy.', '{"is_seeded_demo": true}'::jsonb);

insert into public.deployments (
  id,
  project_id,
  status,
  deployed_at,
  payload_json,
  metadata
) values (
  '90000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'fake_deployed',
  '2026-05-16T08:02:00Z',
  '{
    "simulated_for_hackathon": true,
    "campaign": {
      "name": "AtlasDesk - Gmail follow-up",
      "objective": "Clicks",
      "start_date": "2026-05-16",
      "end_date": "2026-06-15",
      "budget": {"lifetime_spend_limit_micros": 5000000},
      "targeting": {"locations": {"countries": ["US"]}},
      "custom_instruction": "Bias generation toward Gmail setup speed and proof-seeking buyers."
    },
    "ad_groups": [
      {"name": "Friday setup urgency", "context_hints": ["Gmail CRM setup by Friday", "five-rep revenue team"], "bidding_config": {"billing_event_type": "click", "max_bid_micros": 3000000}},
      {"name": "Migration without sync risk", "context_hints": ["spreadsheet CRM migration", "HubSpot sync safety"], "bidding_config": {"billing_event_type": "click", "max_bid_micros": 3200000}},
      {"name": "Proof and pricing confidence", "context_hints": ["proof before rollout", "small team pricing"], "bidding_config": {"billing_event_type": "click", "max_bid_micros": 2800000}}
    ],
    "ads": [
      {"ad_group_name": "Friday setup urgency", "type": "chat_card", "title": "Live by Friday", "body": "Launch Gmail follow-up for five reps before the week ends.", "target_url": "https://atlasdesk.example/gmail-setup", "image_url_for_bulk_upload": "https://atlasdesk.example/demo/live-by-friday.jpg", "status": "paused"},
      {"ad_group_name": "Migration without sync risk", "type": "chat_card", "title": "Move notes safely", "body": "Import spreadsheet follow-up while keeping HubSpot sync intact.", "target_url": "https://atlasdesk.example/migration", "image_url_for_bulk_upload": "https://atlasdesk.example/demo/move-notes-safely.jpg", "status": "paused"},
      {"ad_group_name": "Proof and pricing confidence", "type": "chat_card", "title": "Proof for Gmail", "body": "Show security and recovery proof before pricing questions stall.", "target_url": "https://atlasdesk.example/proof", "image_url_for_bulk_upload": "https://atlasdesk.example/demo/proof-for-gmail.jpg", "status": "paused"}
    ]
  }'::jsonb,
  '{"is_seeded_demo": true}'::jsonb
);

insert into public.performance_snapshots (
  id,
  project_id,
  deployment_id,
  ad_group_id,
  creative_variant_id,
  conversation_id,
  snapshot_kind,
  period_start,
  period_end,
  impressions,
  clicks,
  ctr,
  conversions,
  cvr,
  spend,
  quality_score,
  insight,
  recommended_action,
  metric_basis_json,
  confidence,
  notes,
  provider_request_json,
  provider_response_json,
  metadata
) values
  ('91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'simulated', '2026-05-16T00:00:00Z', '2026-05-23T00:00:00Z', 4200, 315, 0.0750, 54, 0.1714, 840.00, 91, 'Specific timeline copy is the strongest hook because it mirrors the before-Friday constraint.', 'Scale the Friday setup ad group and keep the five-rep setup detail in the first line.', '{"drivers":["specific timeline","team-size constraint","Gmail context"],"simulated_for_hackathon":true}'::jsonb, 'high', 'Specific, constraint-aware copy outperforms generic copy.', '{"phase":"monitoring_synthesis"}'::jsonb, '{"quality_score":91}'::jsonb, '{"is_seeded_demo": true}'::jsonb),
  ('91000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006', 'simulated', '2026-05-16T00:00:00Z', '2026-05-23T00:00:00Z', 3900, 176, 0.0451, 19, 0.1080, 610.00, 58, 'Generic Gmail CRM copy attracts weaker intent than the deadline-specific variant.', 'Reject or rewrite this variant around the Friday setup constraint.', '{"drivers":["generic value prop","missing constraint"],"simulated_for_hackathon":true}'::jsonb, 'medium', 'Specific copy beats generic copy.', '{"phase":"monitoring_synthesis"}'::jsonb, '{"quality_score":58}'::jsonb, '{"is_seeded_demo": true}'::jsonb),
  ('91000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'simulated', '2026-05-16T00:00:00Z', '2026-05-23T00:00:00Z', 3600, 246, 0.0683, 31, 0.1260, 765.00, 82, 'Migration-safe copy performs well because it names spreadsheet import and HubSpot sync risk.', 'Add the HubSpot sync diagram to the landing page before increasing budget.', '{"drivers":["migration risk","HubSpot integration","landing gap unresolved"],"simulated_for_hackathon":true}'::jsonb, 'high', 'High CTR, CVR held back by integration-depth landing gap.', '{"phase":"monitoring_synthesis"}'::jsonb, '{"quality_score":82}'::jsonb, '{"is_seeded_demo": true}'::jsonb),
  ('91000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'simulated', '2026-05-16T00:00:00Z', '2026-05-23T00:00:00Z', 3100, 142, 0.0458, 15, 0.1056, 480.00, 55, 'The softer migration variant lacks enough specificity to reassure HubSpot-sensitive buyers.', 'Rewrite with the exact spreadsheet import and HubSpot continuity promise.', '{"drivers":["soft wording","missing proof"],"simulated_for_hackathon":true}'::jsonb, 'medium', 'Migration-specific creative needs concrete integration proof.', '{"phase":"monitoring_synthesis"}'::jsonb, '{"quality_score":55}'::jsonb, '{"is_seeded_demo": true}'::jsonb),
  ('91000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', 'simulated', '2026-05-16T00:00:00Z', '2026-05-23T00:00:00Z', 3300, 231, 0.0700, 24, 0.1039, 720.00, 76, 'Proof-heavy copy wins clicks from skeptical buyers, but conversion is capped by the missing proof block.', 'Ship the recovery proof section before scaling proof-seeking traffic.', '{"drivers":["proof request","landing proof gap","security angle"],"simulated_for_hackathon":true}'::jsonb, 'high', 'Landing-gap-aligned creative can earn CTR while CVR lags.', '{"phase":"monitoring_synthesis"}'::jsonb, '{"quality_score":76}'::jsonb, '{"is_seeded_demo": true}'::jsonb),
  ('91000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000004', 'simulated', '2026-05-16T00:00:00Z', '2026-05-23T00:00:00Z', 3000, 156, 0.0520, 11, 0.0705, 510.00, 48, 'Pricing-check conversations underperform because the page still lacks clear small-team pricing.', 'Do not scale pricing traffic until the pricing FAQ and minimum-contract answer are live.', '{"drivers":["pricing clarity gap","budget validation"],"simulated_for_hackathon":true}'::jsonb, 'high', 'Pricing-check audiences punish missing pricing clarity.', '{"phase":"monitoring_synthesis"}'::jsonb, '{"quality_score":48}'::jsonb, '{"is_seeded_demo": true}'::jsonb);
