import { buildPlannerFileName, formatAxes, formatText, sortSequences } from './exportFormatters'

export async function exportPlannerToWord({ planner, profile }) {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx')
  const sequences = sortSequences(planner)

  const document = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Planeación Didáctica', bold: true })],
          }),
          new Paragraph({ text: '' }),
          buildInfoTable(
            [
              ['Docente', formatText(profile?.full_name)],
              ['Institución', formatText(profile?.institution)],
              ['Materia', formatText(planner.subject_name)],
              ['Grado y grupo', formatText(planner.group_label)],
              ['Periodo', `${formatText(planner.general_start_date)} a ${formatText(planner.general_end_date)}`],
            ],
            { Paragraph, Table, TableCell, TableRow, TextRun, WidthType },
          ),
          sectionTitle('Datos generales', { Paragraph, TextRun }),
          buildInfoTable(
            [
              ['Contenido', formatText(planner.content)],
              ['PDA', formatText(planner.pda)],
              ['Problemática general', formatText(planner.general_problem)],
              ['Finalidades del campo formativo', formatText(planner.formative_field_purposes)],
              ['Propósito', formatText(planner.purpose)],
              ['Ejes articuladores', formatAxes(planner.articulating_axes)],
              ['Perfil de egreso', formatText(planner.graduation_profile)],
            ],
            { Paragraph, Table, TableCell, TableRow, TextRun, WidthType },
          ),
          sectionTitle('Secuencia didáctica', { Paragraph, TextRun }),
          ...sequences.flatMap((sequence, index) => [
            new Paragraph({
              spacing: { before: 220, after: 80 },
              children: [new TextRun({ text: `Secuencia ${index + 1}`, bold: true })],
            }),
            buildInfoTable(
              [
                ['Periodo', `${formatText(sequence.start_date)} a ${formatText(sequence.end_date)}`],
                ['Inicio', formatText(sequence.opening_activities)],
                ['Desarrollo', formatText(sequence.development_activities)],
                ['Cierre', formatText(sequence.closing_activities)],
                ['Recursos y materiales', formatText(sequence.resources_materials)],
                ['Evaluación', formatText(sequence.evaluation_criteria_instruments)],
                ['Observaciones', formatText(sequence.observations)],
              ],
              { Paragraph, Table, TableCell, TableRow, TextRun, WidthType },
            ),
          ]),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(document)
  downloadBlob(blob, buildPlannerFileName(planner, 'docx'))

  function sectionTitle(text) {
    return new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [new TextRun({ text, bold: true, size: 28 })],
    })
  }

  function buildInfoTable(rows) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 28, type: WidthType.PERCENTAGE },
                shading: { fill: 'E7F4EE' },
                borders: tableBorders(BorderStyle),
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
              }),
              new TableCell({
                width: { size: 72, type: WidthType.PERCENTAGE },
                borders: tableBorders(BorderStyle),
                children: textToParagraphs(value),
              }),
            ],
          }),
      ),
    })
  }

  function textToParagraphs(value) {
    return formatText(value)
      .split('\n')
      .map((line) => new Paragraph({ children: [new TextRun(line)] }))
  }
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function tableBorders(BorderStyle) {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  }
}
