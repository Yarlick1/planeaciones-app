import { describe, expect, it } from 'vitest'
import { buildPlannerFileName, formatAxes, formatText, sortSequences } from './exportFormatters'

describe('exportFormatters', () => {
  it('sorts didactic sequences by sequence_order', () => {
    const result = sortSequences({
      didactic_sequences: [
        { id: 'b', sequence_order: 2 },
        { id: 'a', sequence_order: 1 },
      ],
    })

    expect(result.map((sequence) => sequence.id)).toEqual(['a', 'b'])
  })

  it('builds a safe file name from planner metadata', () => {
    const fileName = buildPlannerFileName(
      {
        subject_name: 'Formación Cívica y Ética',
        group_label: '3°C',
        general_start_date: '2026-09-01',
      },
      'pdf',
    )

    expect(fileName).toBe('planeacion-formacion-civica-y-etica-3-c-2026-09-01.pdf')
  })

  it('normalizes empty text and axes', () => {
    expect(formatText('   ')).toBe('No especificado')
    expect(formatAxes([])).toBe('No especificado')
    expect(formatAxes(['Inclusión', 'Pensamiento crítico'])).toBe('Inclusión, Pensamiento crítico')
  })
})
