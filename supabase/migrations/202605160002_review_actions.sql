-- Atomic HITL review actions for Spec 05.

create or replace function public.review_entity_action(
  p_project_id uuid,
  p_entity_type public.review_entity_type,
  p_entity_id uuid,
  p_action public.review_action,
  p_patch jsonb default '{}'::jsonb,
  p_comment text default null,
  p_expected_updated_at timestamptz default null,
  p_reviewer_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  before_row jsonb;
  after_row jsonb;
  review_row jsonb;
  review_status_value public.review_status;
  patch jsonb := coalesce(p_patch, '{}'::jsonb);
  invalid_keys text[];
begin
  if jsonb_typeof(patch) is distinct from 'object' then
    raise exception 'invalid_review_patch: patch must be a JSON object';
  end if;

  if p_entity_type not in ('extraction_run', 'brand_feature', 'conversation', 'landing_gap', 'ad_group') then
    raise exception 'invalid_review_patch: unsupported entity type %', p_entity_type;
  end if;

  if p_action in ('approve', 'reject') and patch <> '{}'::jsonb then
    raise exception 'invalid_review_patch: % actions cannot include patch fields', p_action;
  end if;

  if p_action in ('edit', 'enrich') and patch = '{}'::jsonb then
    raise exception 'invalid_review_patch: % actions require patch fields', p_action;
  end if;

  review_status_value := case p_action
    when 'approve' then 'approved'::public.review_status
    when 'reject' then 'rejected'::public.review_status
    when 'edit' then 'edited'::public.review_status
    else 'enriched'::public.review_status
  end;

  case p_entity_type
    when 'extraction_run' then
      select array_agg(key) into invalid_keys
      from jsonb_object_keys(patch) as patch_key(key)
      where key <> all(array['output_json', 'metadata']);
      if invalid_keys is not null then
        raise exception 'invalid_review_patch: unsupported extraction_run fields %', invalid_keys;
      end if;

      select to_jsonb(er.*) into before_row
      from public.extraction_runs er
      where er.id = p_entity_id and er.project_id = p_project_id
      for update;
      if before_row is null then
        raise exception 'review_entity_not_found';
      end if;
      if p_expected_updated_at is not null and (before_row->>'updated_at')::timestamptz <> p_expected_updated_at then
        raise exception 'review_conflict';
      end if;

      if patch = '{}'::jsonb then
        after_row := before_row;
      else
        update public.extraction_runs
        set
          output_json = case when patch ? 'output_json' then patch->'output_json' else output_json end,
          metadata = case when patch ? 'metadata' then metadata || (patch->'metadata') else metadata end
        where id = p_entity_id and project_id = p_project_id
        returning to_jsonb(extraction_runs.*) into after_row;
      end if;

    when 'brand_feature' then
      select array_agg(key) into invalid_keys
      from jsonb_object_keys(patch) as patch_key(key)
      where key <> all(array['type', 'title', 'description', 'evidence', 'source_refs', 'metadata']);
      if invalid_keys is not null then
        raise exception 'invalid_review_patch: unsupported brand_feature fields %', invalid_keys;
      end if;

      select to_jsonb(bf.*) into before_row
      from public.brand_features bf
      where bf.id = p_entity_id and bf.project_id = p_project_id
      for update;
      if before_row is null then
        raise exception 'review_entity_not_found';
      end if;
      if p_expected_updated_at is not null and (before_row->>'updated_at')::timestamptz <> p_expected_updated_at then
        raise exception 'review_conflict';
      end if;

      update public.brand_features
      set
        type = case when patch ? 'type' then (patch->>'type')::public.feature_type else type end,
        title = case when patch ? 'title' then patch->>'title' else title end,
        description = case when patch ? 'description' then patch->>'description' else description end,
        evidence = case when patch ? 'evidence' then patch->>'evidence' else evidence end,
        source_refs = case when patch ? 'source_refs' then patch->'source_refs' else source_refs end,
        metadata = case when patch ? 'metadata' then metadata || (patch->'metadata') else metadata end,
        review_status = review_status_value
      where id = p_entity_id and project_id = p_project_id
      returning to_jsonb(brand_features.*) into after_row;

    when 'conversation' then
      select array_agg(key) into invalid_keys
      from jsonb_object_keys(patch) as patch_key(key)
      where key <> all(array['text', 'stage', 'intent_type', 'buyer_role', 'constraints_json', 'source_refs', 'metadata']);
      if invalid_keys is not null then
        raise exception 'invalid_review_patch: unsupported conversation fields %', invalid_keys;
      end if;

      select to_jsonb(c.*) into before_row
      from public.conversations c
      where c.id = p_entity_id and c.project_id = p_project_id
      for update;
      if before_row is null then
        raise exception 'review_entity_not_found';
      end if;
      if p_expected_updated_at is not null and (before_row->>'updated_at')::timestamptz <> p_expected_updated_at then
        raise exception 'review_conflict';
      end if;

      update public.conversations
      set
        text = case when patch ? 'text' then patch->>'text' else text end,
        stage = case when patch ? 'stage' then patch->>'stage' else stage end,
        intent_type = case when patch ? 'intent_type' then patch->>'intent_type' else intent_type end,
        buyer_role = case when patch ? 'buyer_role' then patch->>'buyer_role' else buyer_role end,
        constraints_json = case when patch ? 'constraints_json' then patch->'constraints_json' else constraints_json end,
        source_refs = case when patch ? 'source_refs' then patch->'source_refs' else source_refs end,
        metadata = case when patch ? 'metadata' then metadata || (patch->'metadata') else metadata end,
        review_status = review_status_value
      where id = p_entity_id and project_id = p_project_id
      returning to_jsonb(conversations.*) into after_row;

    when 'landing_gap' then
      select array_agg(key) into invalid_keys
      from jsonb_object_keys(patch) as patch_key(key)
      where key <> all(array['gap_type', 'description', 'suggested_fix', 'severity', 'source_refs', 'metadata']);
      if invalid_keys is not null then
        raise exception 'invalid_review_patch: unsupported landing_gap fields %', invalid_keys;
      end if;

      select to_jsonb(lg.*) into before_row
      from public.landing_gaps lg
      where lg.id = p_entity_id and lg.project_id = p_project_id
      for update;
      if before_row is null then
        raise exception 'review_entity_not_found';
      end if;
      if p_expected_updated_at is not null and (before_row->>'updated_at')::timestamptz <> p_expected_updated_at then
        raise exception 'review_conflict';
      end if;

      update public.landing_gaps
      set
        gap_type = case when patch ? 'gap_type' then patch->>'gap_type' else gap_type end,
        description = case when patch ? 'description' then patch->>'description' else description end,
        suggested_fix = case when patch ? 'suggested_fix' then patch->>'suggested_fix' else suggested_fix end,
        severity = case when patch ? 'severity' then (patch->>'severity')::smallint else severity end,
        source_refs = case when patch ? 'source_refs' then patch->'source_refs' else source_refs end,
        metadata = case when patch ? 'metadata' then metadata || (patch->'metadata') else metadata end,
        review_status = review_status_value
      where id = p_entity_id and project_id = p_project_id
      returning to_jsonb(landing_gaps.*) into after_row;

    when 'ad_group' then
      select array_agg(key) into invalid_keys
      from jsonb_object_keys(patch) as patch_key(key)
      where key <> all(array[
        'name',
        'rationale',
        'context_hints',
        'target_stage',
        'target_intent',
        'conversation_ids',
        'feature_ids',
        'landing_gap_ids',
        'product_feed_item_ids',
        'metadata'
      ]);
      if invalid_keys is not null then
        raise exception 'invalid_review_patch: unsupported ad_group fields %', invalid_keys;
      end if;

      select to_jsonb(ag.*) into before_row
      from public.ad_groups ag
      where ag.id = p_entity_id and ag.project_id = p_project_id
      for update;
      if before_row is null then
        raise exception 'review_entity_not_found';
      end if;
      if p_expected_updated_at is not null and (before_row->>'updated_at')::timestamptz <> p_expected_updated_at then
        raise exception 'review_conflict';
      end if;

      update public.ad_groups
      set
        name = case when patch ? 'name' then patch->>'name' else name end,
        rationale = case when patch ? 'rationale' then patch->>'rationale' else rationale end,
        context_hints = case when patch ? 'context_hints' then patch->'context_hints' else context_hints end,
        target_stage = case when patch ? 'target_stage' then patch->>'target_stage' else target_stage end,
        target_intent = case when patch ? 'target_intent' then patch->>'target_intent' else target_intent end,
        conversation_ids = case when patch ? 'conversation_ids' then array(select jsonb_array_elements_text(patch->'conversation_ids')::uuid) else conversation_ids end,
        feature_ids = case when patch ? 'feature_ids' then array(select jsonb_array_elements_text(patch->'feature_ids')::uuid) else feature_ids end,
        landing_gap_ids = case when patch ? 'landing_gap_ids' then array(select jsonb_array_elements_text(patch->'landing_gap_ids')::uuid) else landing_gap_ids end,
        product_feed_item_ids = case when patch ? 'product_feed_item_ids' then array(select jsonb_array_elements_text(patch->'product_feed_item_ids')::uuid) else product_feed_item_ids end,
        metadata = case when patch ? 'metadata' then metadata || (patch->'metadata') else metadata end,
        status = case
          when p_action = 'approve' then 'approved'::public.ad_group_status
          when p_action = 'reject' then 'rejected'::public.ad_group_status
          else status
        end,
        review_status = review_status_value
      where id = p_entity_id and project_id = p_project_id
      returning to_jsonb(ad_groups.*) into after_row;
  end case;

  insert into public.human_reviews (
    project_id,
    reviewer_user_id,
    entity_type,
    entity_id,
    action,
    before_json,
    after_json,
    comment,
    metadata
  ) values (
    p_project_id,
    p_reviewer_user_id,
    p_entity_type,
    p_entity_id,
    p_action,
    before_row,
    after_row,
    p_comment,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning to_jsonb(human_reviews.*) into review_row;

  return jsonb_build_object(
    'entity_type', p_entity_type,
    'entity', after_row,
    'human_review', review_row
  );
end;
$$;

grant execute on function public.review_entity_action(
  uuid,
  public.review_entity_type,
  uuid,
  public.review_action,
  jsonb,
  text,
  timestamptz,
  uuid,
  jsonb
) to anon, authenticated, service_role;
