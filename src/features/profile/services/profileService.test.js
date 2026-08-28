import { describe, expect, it } from 'vitest'
import { isTeacherProfileComplete } from './profileService'

describe('isTeacherProfileComplete', () => {
  it('returns true when profile, subjects and groups are present', () => {
    expect(
      isTeacherProfileComplete({
        profile: { full_name: 'María López', institution: 'Escuela Primaria Benito Juárez' },
        subjects: [{ id: '1', name: 'Español' }],
        groups: [{ id: '1', label: '1°A' }],
      }),
    ).toBe(true)
  })

  it('returns false when a required profile piece is missing', () => {
    expect(
      isTeacherProfileComplete({
        profile: { full_name: 'María López', institution: '' },
        subjects: [{ id: '1', name: 'Español' }],
        groups: [{ id: '1', label: '1°A' }],
      }),
    ).toBe(false)
  })
})
