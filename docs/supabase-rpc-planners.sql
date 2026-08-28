-- =========================================================
-- PlaneaDoc - RPC transaccional para planeaciones
-- =========================================================

create or replace function public.create_planner_with_sequences(
  p_planner jsonb,
  p_sequences jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_planner_id uuid;
  v_subject_id uuid := nullif(p_planner ->> 'subject_id', '')::uuid;
  v_group_id uuid := nullif(p_planner ->> 'group_id', '')::uuid;
  v_subject_name text;
  v_group_label text;
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  if jsonb_array_length(coalesce(p_sequences, '[]'::jsonb)) = 0 then
    raise exception 'La planeación requiere al menos una secuencia didáctica';
  end if;

  select name
  into v_subject_name
  from public.teacher_subjects
  where id = v_subject_id
    and user_id = v_user_id;

  if v_subject_name is null then
    raise exception 'La materia seleccionada no existe o no pertenece al usuario';
  end if;

  select label
  into v_group_label
  from public.teacher_groups
  where id = v_group_id
    and user_id = v_user_id;

  if v_group_label is null then
    raise exception 'El grado/grupo seleccionado no existe o no pertenece al usuario';
  end if;

  insert into public.planners (
    user_id,
    subject_id,
    group_id,
    subject_name,
    group_label,
    general_start_date,
    general_end_date,
    content,
    pda,
    general_problem,
    formative_field_purposes,
    purpose,
    articulating_axes,
    graduation_profile,
    status
  )
  values (
    v_user_id,
    v_subject_id,
    v_group_id,
    v_subject_name,
    v_group_label,
    (p_planner ->> 'general_start_date')::date,
    (p_planner ->> 'general_end_date')::date,
    p_planner ->> 'content',
    p_planner ->> 'pda',
    nullif(p_planner ->> 'general_problem', ''),
    nullif(p_planner ->> 'formative_field_purposes', ''),
    p_planner ->> 'purpose',
    coalesce(
      array(select jsonb_array_elements_text(coalesce(p_planner -> 'articulating_axes', '[]'::jsonb))),
      '{}'::text[]
    ),
    nullif(p_planner ->> 'graduation_profile', ''),
    coalesce(nullif(p_planner ->> 'status', ''), 'draft')
  )
  returning id into v_planner_id;

  insert into public.didactic_sequences (
    planner_id,
    sequence_order,
    start_date,
    end_date,
    opening_activities,
    development_activities,
    closing_activities,
    resources_materials,
    evaluation_criteria_instruments,
    observations
  )
  select
    v_planner_id,
    sequence_order,
    start_date,
    end_date,
    opening_activities,
    development_activities,
    closing_activities,
    nullif(resources_materials, ''),
    nullif(evaluation_criteria_instruments, ''),
    nullif(observations, '')
  from jsonb_to_recordset(p_sequences) as sequence_rows (
    sequence_order integer,
    start_date date,
    end_date date,
    opening_activities text,
    development_activities text,
    closing_activities text,
    resources_materials text,
    evaluation_criteria_instruments text,
    observations text
  );

  return v_planner_id;
end;
$$;

create or replace function public.update_planner_with_sequences(
  p_planner_id uuid,
  p_planner jsonb,
  p_sequences jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_subject_id uuid := nullif(p_planner ->> 'subject_id', '')::uuid;
  v_group_id uuid := nullif(p_planner ->> 'group_id', '')::uuid;
  v_subject_name text;
  v_group_label text;
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  if not exists (
    select 1
    from public.planners
    where id = p_planner_id
      and user_id = v_user_id
  ) then
    raise exception 'La planeación no existe o no pertenece al usuario';
  end if;

  if jsonb_array_length(coalesce(p_sequences, '[]'::jsonb)) = 0 then
    raise exception 'La planeación requiere al menos una secuencia didáctica';
  end if;

  select name
  into v_subject_name
  from public.teacher_subjects
  where id = v_subject_id
    and user_id = v_user_id;

  if v_subject_name is null then
    raise exception 'La materia seleccionada no existe o no pertenece al usuario';
  end if;

  select label
  into v_group_label
  from public.teacher_groups
  where id = v_group_id
    and user_id = v_user_id;

  if v_group_label is null then
    raise exception 'El grado/grupo seleccionado no existe o no pertenece al usuario';
  end if;

  update public.planners
  set
    subject_id = v_subject_id,
    group_id = v_group_id,
    subject_name = v_subject_name,
    group_label = v_group_label,
    general_start_date = (p_planner ->> 'general_start_date')::date,
    general_end_date = (p_planner ->> 'general_end_date')::date,
    content = p_planner ->> 'content',
    pda = p_planner ->> 'pda',
    general_problem = nullif(p_planner ->> 'general_problem', ''),
    formative_field_purposes = nullif(p_planner ->> 'formative_field_purposes', ''),
    purpose = p_planner ->> 'purpose',
    articulating_axes = coalesce(
      array(select jsonb_array_elements_text(coalesce(p_planner -> 'articulating_axes', '[]'::jsonb))),
      '{}'::text[]
    ),
    graduation_profile = nullif(p_planner ->> 'graduation_profile', ''),
    status = coalesce(nullif(p_planner ->> 'status', ''), status)
  where id = p_planner_id
    and user_id = v_user_id;

  delete from public.didactic_sequences
  where planner_id = p_planner_id;

  insert into public.didactic_sequences (
    planner_id,
    sequence_order,
    start_date,
    end_date,
    opening_activities,
    development_activities,
    closing_activities,
    resources_materials,
    evaluation_criteria_instruments,
    observations
  )
  select
    p_planner_id,
    sequence_order,
    start_date,
    end_date,
    opening_activities,
    development_activities,
    closing_activities,
    nullif(resources_materials, ''),
    nullif(evaluation_criteria_instruments, ''),
    nullif(observations, '')
  from jsonb_to_recordset(p_sequences) as sequence_rows (
    sequence_order integer,
    start_date date,
    end_date date,
    opening_activities text,
    development_activities text,
    closing_activities text,
    resources_materials text,
    evaluation_criteria_instruments text,
    observations text
  );

  return p_planner_id;
end;
$$;

grant execute on function public.create_planner_with_sequences(jsonb, jsonb) to authenticated;
grant execute on function public.update_planner_with_sequences(uuid, jsonb, jsonb) to authenticated;
