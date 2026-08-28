import { describe, expect, it } from 'vitest'
import { plannerDefaultValues, plannerSchema } from './plannerSchema'

function validPlanner(overrides = {}) {
  return {
    ...plannerDefaultValues,
    generalStartDate: '2026-09-01',
    generalEndDate: '2026-09-15',
    subjectId: 'subject-id',
    groupId: 'group-id',
    content: 'Números naturales',
    pda: 'Resuelve problemas con números naturales',
    purpose: 'Fortalecer el razonamiento matemático',
    sequences: [
      {
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        openingActivities: 'Recuperar saberes previos',
        developmentActivities: 'Resolver problemas en equipos',
        closingActivities: 'Socializar procedimientos',
        resourcesMaterials: '',
        evaluationCriteriaInstruments: '',
        observations: '',
      },
    ],
    ...overrides,
  }
}

describe('plannerSchema', () => {
  it('accepts a valid planner with one didactic sequence', () => {
    const result = plannerSchema.safeParse(validPlanner())

    expect(result.success).toBe(true)
  })

  it('rejects a general date range where end date is before start date', () => {
    const result = plannerSchema.safeParse(
      validPlanner({
        generalStartDate: '2026-09-15',
        generalEndDate: '2026-09-01',
      }),
    )

    expect(result.success).toBe(false)
    expect(result.error.issues.some((issue) => issue.path.includes('generalEndDate'))).toBe(true)
  })

  it('rejects sequences outside the general date range', () => {
    const result = plannerSchema.safeParse(
      validPlanner({
        sequences: [
          {
            ...validPlanner().sequences[0],
            startDate: '2026-08-29',
            endDate: '2026-09-03',
          },
        ],
      }),
    )

    expect(result.success).toBe(false)
    expect(result.error.issues.some((issue) => issue.message === 'La secuencia debe estar dentro del rango general')).toBe(
      true,
    )
  })
})
