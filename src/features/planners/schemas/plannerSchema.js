import { z } from 'zod'

const requiredText = (message) => z.string().trim().min(1, message)

const sequenceSchema = z
  .object({
    startDate: requiredText('Selecciona la fecha de inicio'),
    endDate: requiredText('Selecciona la fecha de fin'),
    openingActivities: requiredText('Describe las actividades de inicio'),
    developmentActivities: requiredText('Describe las actividades de desarrollo'),
    closingActivities: requiredText('Describe las actividades de cierre'),
    resourcesMaterials: z.string().trim().optional(),
    evaluationCriteriaInstruments: z.string().trim().optional(),
    observations: z.string().trim().optional(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'La fecha final debe ser igual o posterior a la inicial',
    path: ['endDate'],
  })

export const plannerSchema = z
  .object({
    generalStartDate: requiredText('Selecciona la fecha de inicio'),
    generalEndDate: requiredText('Selecciona la fecha de fin'),
    subjectId: requiredText('Selecciona una materia'),
    groupId: requiredText('Selecciona un grado y grupo'),
    content: requiredText('Ingresa el contenido'),
    pda: requiredText('Ingresa el PDA'),
    generalProblem: z.string().trim().optional(),
    formativeFieldPurposes: z.string().trim().optional(),
    purpose: requiredText('Ingresa el propósito'),
    articulatingAxes: z.array(z.string()).default([]),
    graduationProfile: z.string().trim().optional(),
    sequences: z.array(sequenceSchema).min(1, 'Agrega al menos una secuencia didáctica'),
  })
  .refine((data) => data.generalStartDate <= data.generalEndDate, {
    message: 'La fecha final debe ser igual o posterior a la inicial',
    path: ['generalEndDate'],
  })
  .superRefine((data, context) => {
    data.sequences.forEach((sequence, index) => {
      if (sequence.startDate < data.generalStartDate || sequence.endDate > data.generalEndDate) {
        context.addIssue({
          code: 'custom',
          message: 'La secuencia debe estar dentro del rango general',
          path: ['sequences', index, 'endDate'],
        })
      }
    })
  })

export const plannerDefaultValues = {
  generalStartDate: '',
  generalEndDate: '',
  subjectId: '',
  groupId: '',
  content: '',
  pda: '',
  generalProblem: '',
  formativeFieldPurposes: '',
  purpose: '',
  articulatingAxes: [],
  graduationProfile: '',
  sequences: [
    {
      startDate: '',
      endDate: '',
      openingActivities: '',
      developmentActivities: '',
      closingActivities: '',
      resourcesMaterials: '',
      evaluationCriteriaInstruments: '',
      observations: '',
    },
  ],
}
