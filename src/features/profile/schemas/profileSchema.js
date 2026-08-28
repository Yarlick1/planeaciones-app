import { z } from 'zod'

const listItemSchema = z.object({
  value: z.string().trim().min(1, 'Este campo es obligatorio'),
})

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, 'Ingresa el nombre completo'),
  institution: z.string().trim().min(3, 'Ingresa la institución educativa'),
  subjects: z.array(listItemSchema).min(1, 'Agrega al menos una materia'),
  groups: z.array(listItemSchema).min(1, 'Agrega al menos un grado y grupo'),
})
