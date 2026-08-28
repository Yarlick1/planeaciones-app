import { supabase } from '../../../lib/supabaseClient'

const plannerSelect = `
  *,
  didactic_sequences (*)
`

function toPlannerPayload(values) {
  return {
    subject_id: values.subjectId,
    group_id: values.groupId,
    general_start_date: values.generalStartDate,
    general_end_date: values.generalEndDate,
    content: values.content.trim(),
    pda: values.pda.trim(),
    general_problem: values.generalProblem?.trim() || null,
    formative_field_purposes: values.formativeFieldPurposes?.trim() || null,
    purpose: values.purpose.trim(),
    articulating_axes: values.articulatingAxes ?? [],
    graduation_profile: values.graduationProfile?.trim() || null,
    status: 'draft',
  }
}

function toSequencePayload(sequence, index) {
  return {
    sequence_order: index + 1,
    start_date: sequence.startDate,
    end_date: sequence.endDate,
    opening_activities: sequence.openingActivities.trim(),
    development_activities: sequence.developmentActivities.trim(),
    closing_activities: sequence.closingActivities.trim(),
    resources_materials: sequence.resourcesMaterials?.trim() || null,
    evaluation_criteria_instruments: sequence.evaluationCriteriaInstruments?.trim() || null,
    observations: sequence.observations?.trim() || null,
  }
}

export function mapPlannerToFormValues(planner) {
  const sequences = [...(planner.didactic_sequences ?? [])].sort(
    (current, next) => current.sequence_order - next.sequence_order,
  )

  return {
    generalStartDate: planner.general_start_date,
    generalEndDate: planner.general_end_date,
    subjectId: planner.subject_id ?? '',
    groupId: planner.group_id ?? '',
    content: planner.content ?? '',
    pda: planner.pda ?? '',
    generalProblem: planner.general_problem ?? '',
    formativeFieldPurposes: planner.formative_field_purposes ?? '',
    purpose: planner.purpose ?? '',
    articulatingAxes: planner.articulating_axes ?? [],
    graduationProfile: planner.graduation_profile ?? '',
    sequences: sequences.map((sequence) => ({
      startDate: sequence.start_date,
      endDate: sequence.end_date,
      openingActivities: sequence.opening_activities ?? '',
      developmentActivities: sequence.development_activities ?? '',
      closingActivities: sequence.closing_activities ?? '',
      resourcesMaterials: sequence.resources_materials ?? '',
      evaluationCriteriaInstruments: sequence.evaluation_criteria_instruments ?? '',
      observations: sequence.observations ?? '',
    })),
  }
}

export async function listPlanners(userId) {
  const { data, error } = await supabase
    .from('planners')
    .select('id, subject_name, group_label, general_start_date, general_end_date, content, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getPlannerById(id) {
  const { data, error } = await supabase.from('planners').select(plannerSelect).eq('id', id).maybeSingle()

  if (error) throw error
  return data
}

export async function createPlanner(_userId, values) {
  const { data, error } = await supabase.rpc('create_planner_with_sequences', {
    p_planner: toPlannerPayload(values),
    p_sequences: values.sequences.map(toSequencePayload),
  })

  if (error) throw error
  return data
}

export async function updatePlanner(id, _userId, values) {
  const { data, error } = await supabase.rpc('update_planner_with_sequences', {
    p_planner_id: id,
    p_planner: toPlannerPayload(values),
    p_sequences: values.sequences.map(toSequencePayload),
  })

  if (error) throw error
  return data
}

export async function deletePlanner(id) {
  const { error } = await supabase.from('planners').delete().eq('id', id)

  if (error) throw error
}
