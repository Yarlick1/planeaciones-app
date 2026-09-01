import { describe, expect, it } from 'vitest'
import { normalizeAiSuggestions } from './aiSuggestionValidators'

describe('normalizeAiSuggestions', () => {
  it('normalizes text suggestions', () => {
    const suggestions = normalizeAiSuggestions('purpose', [
      { title: ' Proposito contextual ', value: ' Fortalecer el aprendizaje esperado. ' },
    ])

    expect(suggestions).toEqual([
      {
        title: 'Proposito contextual',
        value: 'Fortalecer el aprendizaje esperado.',
      },
    ])
  })

  it('normalizes articulating axes suggestions', () => {
    const suggestions = normalizeAiSuggestions('articulatingAxes', [
      { title: 'Ejes', value: [' Pensamiento critico ', '', 'Inclusión'] },
    ])

    expect(suggestions[0].value).toEqual(['Pensamiento critico', 'Inclusión'])
  })

  it('rejects sequence suggestions with missing fields', () => {
    expect(() =>
      normalizeAiSuggestions('didacticSequence', [
        {
          title: 'Secuencia incompleta',
          value: {
            startDate: '2026-09-01',
            endDate: '2026-09-05',
          },
        },
      ]),
    ).toThrow('openingActivities')
  })
})
