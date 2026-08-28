import { buildPlannerFileName, formatAxes, formatText, sortSequences } from './exportFormatters'

export async function exportPlannerToPdf({ planner, profile }) {
  const { default: html2pdf } = await import('html2pdf.js')
  const container = document.createElement('div')
  container.innerHTML = buildPlannerHtml({ planner, profile })
  container.style.position = 'absolute'
  container.style.left = '0'
  container.style.top = '0'
  container.style.width = '794px'
  container.style.background = '#ffffff'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '-1'
  document.body.appendChild(container)

  try {
    await waitForPaint()

    await html2pdf()
      .set({
        margin: 10,
        filename: buildPlannerFileName(planner, 'pdf'),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          backgroundColor: '#ffffff',
          scale: 2,
          scrollX: 0,
          scrollY: 0,
          useCORS: true,
          windowWidth: 794,
        },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(container.firstElementChild)
      .save()
  } finally {
    document.body.removeChild(container)
  }
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })
}

function buildPlannerHtml({ planner, profile }) {
  const sequences = sortSequences(planner)

  return `
    <article style="font-family: Arial, sans-serif; color: #1c1917; padding: 24px; font-size: 12px;">
      <style>
        h1 { text-align: center; font-size: 22px; margin: 0 0 18px; }
        h2 { font-size: 15px; margin: 20px 0 8px; color: #065f46; }
        h3 { font-size: 13px; margin: 16px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 7px; vertical-align: top; line-height: 1.45; }
        th { width: 28%; background: #e7f4ee; text-align: left; }
        .sequence { page-break-inside: avoid; }
      </style>

      <h1>Planeación Didáctica</h1>

      ${infoTable([
        ['Docente', formatText(profile?.full_name)],
        ['Institución', formatText(profile?.institution)],
        ['Materia', formatText(planner.subject_name)],
        ['Grado y grupo', formatText(planner.group_label)],
        ['Periodo', `${formatText(planner.general_start_date)} a ${formatText(planner.general_end_date)}`],
      ])}

      <h2>Datos generales</h2>
      ${infoTable([
        ['Contenido', formatText(planner.content)],
        ['PDA', formatText(planner.pda)],
        ['Problemática general', formatText(planner.general_problem)],
        ['Finalidades del campo formativo', formatText(planner.formative_field_purposes)],
        ['Propósito', formatText(planner.purpose)],
        ['Ejes articuladores', formatAxes(planner.articulating_axes)],
        ['Perfil de egreso', formatText(planner.graduation_profile)],
      ])}

      <h2>Secuencia didáctica</h2>
      ${sequences
        .map(
          (sequence, index) => `
            <section class="sequence">
              <h3>Secuencia ${index + 1}</h3>
              ${infoTable([
                ['Periodo', `${formatText(sequence.start_date)} a ${formatText(sequence.end_date)}`],
                ['Inicio', formatText(sequence.opening_activities)],
                ['Desarrollo', formatText(sequence.development_activities)],
                ['Cierre', formatText(sequence.closing_activities)],
                ['Recursos y materiales', formatText(sequence.resources_materials)],
                ['Evaluación', formatText(sequence.evaluation_criteria_instruments)],
                ['Observaciones', formatText(sequence.observations)],
              ])}
            </section>
          `,
        )
        .join('')}
    </article>
  `
}

function infoTable(rows) {
  return `
    <table>
      <tbody>
        ${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
      </tbody>
    </table>
  `
}

function escapeHtml(value) {
  return formatText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br />')
}
