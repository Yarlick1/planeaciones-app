export const fieldSteps = [
  {
    id: 'generalProblem',
    label: 'Problemática general',
    description: 'Define el problema o situación contextual que detonará el aprendizaje.',
  },
  {
    id: 'formativeFieldPurposes',
    label: 'Finalidades del campo formativo',
    description: 'Relaciona el contenido con las finalidades formativas esperadas.',
  },
  {
    id: 'purpose',
    label: 'Propósito',
    description: 'Precisa lo que se espera lograr durante el periodo de trabajo.',
  },
  {
    id: 'articulatingAxes',
    label: 'Ejes articuladores',
    description: 'Selecciona los ejes que dan sentido transversal a la planeación.',
  },
  {
    id: 'graduationProfile',
    label: 'Perfil de egreso',
    description: 'Vincula la planeación con rasgos del perfil de egreso.',
  },
]

export const sequenceStep = {
  id: 'didacticSequence',
  label: 'Secuencia didáctica',
  description: 'Propón una secuencia con inicio, desarrollo, cierre, recursos y evaluación.',
}

export const allWizardSteps = [...fieldSteps, sequenceStep]

export const availableAxes = [
  'Inclusión',
  'Pensamiento crítico',
  'Interculturalidad crítica',
  'Igualdad de género',
  'Vida saludable',
  'Apropiación de las culturas',
  'Artes y experiencias estéticas',
]
