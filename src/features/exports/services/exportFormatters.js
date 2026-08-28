export function sortSequences(planner) {
  return [...(planner.didactic_sequences ?? [])].sort(
    (current, next) => current.sequence_order - next.sequence_order,
  )
}

export function buildPlannerFileName(planner, extension) {
  const subject = slugify(planner.subject_name || 'planeacion')
  const group = slugify(planner.group_label || 'grupo')
  const startDate = planner.general_start_date || 'sin-fecha'

  return `planeacion-${subject}-${group}-${startDate}.${extension}`
}

export function formatText(value) {
  return value?.toString().trim() || 'No especificado'
}

export function formatAxes(axes) {
  return axes?.length ? axes.join(', ') : 'No especificado'
}

function slugify(value) {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}
