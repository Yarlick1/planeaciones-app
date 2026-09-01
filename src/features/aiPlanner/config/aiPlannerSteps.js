export const fieldSteps = [
  {
    id: 'formativeFieldPurposes',
    label: 'Finalidades del campo formativo',
    description: 'Elige finalidades existentes o pide propuestas contextualizadas a la IA.',
    mode: 'catalogOrAi',
  },
  {
    id: 'purpose',
    label: 'Propósito',
    description: 'Precisa lo que se espera lograr durante el periodo de trabajo.',
  },
  {
    id: 'articulatingAxes',
    label: 'Ejes articuladores',
    description: 'Elige ejes existentes o pide una combinación sugerida por la IA.',
    mode: 'catalogOrAi',
  },
  {
    id: 'graduationProfile',
    label: 'Perfil de egreso',
    description: 'Selecciona el rasgo del perfil de egreso que mejor se vincula con la planeación.',
    mode: 'catalogOnly',
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
  'Equidad de Género',
  'Artes y expresión artística',
  'Igualdad de género',
  'Vida Saludable',
]

export const formativeFieldPurposesCatalog = [
  'Construyan su identidad personal mediante la exploración de gustos, intereses, necesidades, posibilidades, formas de entender e interactuar en diversos contextos sociales y naturales.',
  'Conciban la sexualidad como resultado de una construcción cultural conformada por distintas maneras de pensar, representar y entender el cuerpo en su relación con la igualdad de género.',
  'Desarrollen sus potencialidades afectivas, motrices, creativas, de interacción y solución de problemas, reconociendo, valorando y respetando las de otras personas.',
  'Fortalezcan capacidades perceptivo, socio y físico-motrices, y las que deriven en el desarrollo creativo de la motricidad en relación con el cuerpo como espacio de cuidado y afecto.',
  'Reflexionen y comprendan su vida emocional y afectiva, así como la de las demás personas, como elemento constitutivo de relaciones de convivencia y potencial bienestar.',
  'Promuevan ambientes de convivencia sana y pacífica entre quienes integran la comunidad educativa, identificando aquello que trastoque sus entornos.',
  'Experimenten la importancia de cuidar, mejorar y preservar la salud, el entorno natural y social, como una responsabilidad individual y colectiva que se presenta ante una vida caracterizada por la incertidumbre.',
  'Tomen decisiones orientadas a modificar comportamientos y situaciones que violenten su integridad físico-emocional y la de otras personas.',
  'Actúen en la resolución de situaciones y problemas presentes en distintos contextos, recurriendo a saberes, capacidades y habilidades que se generan a partir del diálogo familia-escuela-comunidad.',
  'Generen sentido de comunidad y fortalezcan el de pertenencia, y ello incida en su apreciación de la diversidad de identidades para que reconozcan aspectos que comparten con otras personas al participar en la consecución de logros, la apropiación de valores y el diseño de proyectos para el beneficio colectivo.',
]

export const graduationProfilesCatalog = [
  {
    id: 'profile-1',
    text: 'Reconocen que son ciudadanas y ciudadanos que pueden ejercer su derecho a una vida digna, a decidir sobre su cuerpo, a construir su identidad personal y colectiva, así como a vivir con bienestar y buen trato, en un marco de libertades y responsabilidades con respecto a ellas mismas y ellos mismos, así como con su comunidad.',
    keywords: ['identidad', 'bienestar', 'cuerpo', 'vida digna', 'comunidad'],
  },
  {
    id: 'profile-2',
    text: 'Viven, reconocen y valoran la diversidad étnica, cultural, lingüística, sexual, política, social y de género del país como rasgos que caracterizan a la nación mexicana.',
    keywords: ['diversidad', 'cultural', 'lingüística', 'género', 'mexicana'],
  },
  {
    id: 'profile-3',
    text: 'Reconocen que mujeres y hombres son personas que gozan de los mismos derechos, con capacidad de acción, autonomía, decisión para vivir una vida digna, libre de violencia y discriminación.',
    keywords: ['derechos', 'autonomía', 'violencia', 'discriminación', 'género'],
  },
  {
    id: 'profile-4',
    text: 'Valoran sus potencialidades cognitivas, físicas y afectivas a partir de las cuales pueden mejorar sus capacidades personales y de la comunidad durante las distintas etapas de su vida.',
    keywords: ['potencialidades', 'capacidades', 'cognitivas', 'físicas', 'afectivas'],
  },
  {
    id: 'profile-5',
    text: 'Desarrollan una forma de pensar propia que emplean para analizar y hacer juicios argumentado sobre su realidad familiar, escolar, comunitaria, nacional y mundial.',
    keywords: ['pensamiento', 'analizar', 'juicios', 'argumentado', 'realidad'],
  },
  {
    id: 'profile-6',
    text: 'Se perciben a sí mismas y a sí mismos como parte de la naturaleza, conscientes del momento que viven en su ciclo de vida y la importancia de entender que el medio ambiente y su vida personal son parte de la misma trama, por lo que entienden la prioridad de relacionar el cuidado de su alimentación, su salud física, mental, sexual y reproductiva con la salud planetaria desde una visión sustentable y compatible.',
    keywords: ['naturaleza', 'medio ambiente', 'salud', 'sustentable', 'planetaria'],
  },
  {
    id: 'profile-7',
    text: 'Interpretan fenómenos, hechos y situaciones históricas, culturales, naturales y sociales a partir de temas diversos e indagan para explicarlos con base en razonamientos, modelos, datos e información con fundamentos científicos y saberes comunitarios, de tal manera que les permitan consolidar su autonomía para plantear y resolver problemas complejos considerando el contexto.',
    keywords: ['fenómenos', 'indagan', 'científicos', 'resolver problemas', 'contexto'],
  },
  {
    id: 'profile-8',
    text: 'Interactúan en procesos de diálogo con respeto y aprecio a la diversidad de capacidades, características, condiciones, necesidades, intereses y visiones al trabajar de manera cooperativa. Son capaces de aprender a su ritmo y respetar el de las demás personas, adquieren nuevas capacidades, construyen nuevas relaciones y asumen roles distintos en un proceso de constante cambio.',
    keywords: ['diálogo', 'cooperativa', 'respeto', 'diversidad', 'capacidades'],
  },
  {
    id: 'profile-9',
    text: 'Intercambian ideas, cosmovisiones y perspectivas mediante distintos lenguajes, con el fin de establecer acuerdos en los que se respeten las ideas propias y las de otras y otros. Dominan habilidades de comunicación básica tanto en su lengua materna como en otras lenguas. Aprovechan los recursos y medios de la cultura digital, de manera ética y responsable para comunicarse, así como obtener información, seleccionarla, organizarla, analizarla y evaluarla.',
    keywords: ['comunicación', 'lenguajes', 'cultura digital', 'información', 'acuerdos'],
  },
  {
    id: 'profile-10',
    text: 'Desarrollan el pensamiento crítico que les permita valorar los conocimientos y saberes de las ciencias y humanidades, reconociendo la importancia que tienen la historia y la cultura para examinar críticamente sus propias ideas y el valor de los puntos de vista de las y los demás como elementos centrales para proponer transformaciones en su comunidad desde una perspectiva solidaria.',
    keywords: ['pensamiento crítico', 'ciencias', 'humanidades', 'cultura', 'transformaciones'],
  },
]
