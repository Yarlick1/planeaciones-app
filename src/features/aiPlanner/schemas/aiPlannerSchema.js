import { z } from 'zod'

export const aiPlannerInitialSchema = z
  .object({
    generalStartDate: z.string().min(1, 'Selecciona la fecha de inicio'),
    generalEndDate: z.string().min(1, 'Selecciona la fecha de fin'),
    subjectId: z.string().min(1, 'Selecciona una materia'),
    groupId: z.string().min(1, 'Selecciona un grado y grupo'),
    content: z.string().trim().min(1, 'Ingresa el contenido'),
    pda: z.string().trim().min(1, 'Ingresa el PDA'),
    generalProblem: z.string().trim().min(1, 'Ingresa la problemática general'),
  })
  .refine((data) => data.generalStartDate <= data.generalEndDate, {
    message: 'La fecha final debe ser igual o posterior a la inicial',
    path: ['generalEndDate'],
  })
