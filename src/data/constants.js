// AquaOps — Constants & configuration
// Extracted from App.js for maintainability

// ─── REGIONS & POLYGONS ──────────────────────────────────────────────────────
const DEFAULT_REGIONS   = ["Bahía Azul","Cayo de Agua","Playa Roja","Tobobe","Playa Verde","Isla Tiburón"];
const DEFAULT_TIPOS     = ["Canasta","Long Line","Sistema 75m","Linea","Comercial"];
const DEFAULT_MATERIALES= ["Tie-tie","Redes tubular","PVC","HDPE","Cuerda"];
const DEFAULT_SEMILLAS  = ["Brazil","Mixed","Bahía Azul","Yellow","Brown","Spinosum"];

// ─── REGION → SUPERVISOR MAPPING ────────────────────────────────────────────
// One supervisor per region. null = unassigned (new region)
const REGION_SUPERVISORS = {
  "Tobobe":       { initials: "AD", name: "Adomis" },
  "Playa Verde":  { initials: "VA", name: "Valerio" },
  "Bahía Azul":   { initials: "BA", name: "Barnal" },
  "Playa Roja":   { initials: "CE", name: "Charlie" },
  "Cayo de Agua": { initials: "RV", name: "Viquez" },
};

// ─── TASK CADENCES (days) ───────────────────────────────────────────────────
// Vigilancia includes: readings, weights, parameters, algae condition check
const TASK_CADENCES = {
  vigilancia: 1,    // Every day — readings, weights, parameters, condition
  limpieza:   3,    // Every 3 days
  siembra:    30,   // Every 30 days
  cosecha:    45,   // Every 45 days (may be sooner for disease protocol)
};

const THRESHOLDS = {
  salt:  { min:1.5, max:3.5 },
  ph:    { min:8.5, max:9.8 },
  temp:  { min:22,  max:30  },
  salinidad: { min:15, max:25 },
};

// ─── TASK TYPES — weighted by frequency (higher freq = lower individual weight) ─
// Total task weight sums to 1.0; professionalism is applied separately
const TASK_TYPES = [
  { id:"vigilancia",  label:"Vigilancia",        labelEn:"Monitoring",        unit:"sitios",   unitEn:"sites",    freq:5, weight:0.28 }, // daily
  { id:"pesos",       label:"Pesos/Parámetros",  labelEn:"Readings",          unit:"lecturas", unitEn:"readings", freq:5, weight:0.22 }, // daily
  { id:"limpieza",    label:"Limpieza",           labelEn:"Cleaning",          unit:"sistemas", unitEn:"systems",  freq:2, weight:0.18 }, // 2-3x/week
  { id:"construir",   label:"Construir/Desplegar",labelEn:"Build/Deploy",      unit:"canastas", unitEn:"baskets",  freq:1, weight:0.14 }, // weekly
  { id:"motor",       label:"Mant. Motor/Bote",   labelEn:"Boat Maintenance",  unit:"horas",    unitEn:"hours",    freq:1, weight:0.10 }, // weekly
  { id:"sembrar",     label:"Sembrar/Cosechar",   labelEn:"Plant/Harvest",     unit:"kg",       unitEn:"kg",       freq:1, weight:0.08 }, // event-based
];

// ─── PROFESSIONALISM CATEGORIES ─────────────────────────────────────────────
const PROF_CATEGORIES = [
  { id:"puntualidad",  label:"Puntualidad/Asistencia", labelEn:"Punctuality",      weight:0.25 },
  { id:"seguridad",    label:"Seguridad",               labelEn:"Safety compliance",weight:0.25 },
  { id:"actitud",      label:"Actitud/Cooperación",     labelEn:"Attitude",         weight:0.25 },
  { id:"equipo",       label:"Cuidado del Equipo",      labelEn:"Equipment care",   weight:0.25 },
];

// Score split
const SCORE_WEIGHTS = { tasks: 0.40, prof: 0.60 };

// ─── CREW — from Trabajo Semanal ─────────────────────────────────────────────
const CREW = [
  { initials:"RBC",name:"Romelio Bekar",   role:"Lead",     username:"romelio_bekar" },
  { initials:"CE", name:"Charles Ebersole",role:"Lead",     username:"charles_ebersole" },
  { initials:"LA", name:"Luis Alvarado",   role:"Lead",     username:"luis_alvarado" },
  { initials:"RV", name:"Rodolfo Viquez",  role:"Lead",     username:"rodolfo_viquez" },
  { initials:"RBM",name:"Rodolfo Banard",  role:"Lead",     username:"rodolfo_banard" },
  { initials:"HM", name:"Hilario Migar",   role:"Support",  username:"hilario_migar" },
  { initials:"JL", name:"Jairo Lorenzo",   role:"Support",  username:"jairo_lorenzo" },
  { initials:"YL", name:"Yeison Lorenzo",  role:"Support",  username:"yeison_lorenzo" },
  { initials:"HC", name:"Henry Crump",     role:"Pasante",  username:"henry_crump" },
  { initials:"CK", name:"Caleb Kim",       role:"Pasante",  username:"caleb_kim" },
  { initials:"KG", name:"Kaiden Griffin",  role:"Pasante",  username:"kaiden_griffin" },
  { initials:"JV", name:"Joel Valdés",     role:"Lead",     username:"joel_valdes" },
  { initials:"EV", name:"Eduardo Valdés",  role:"Lead",     username:"eduardo_valdes" },
];


// ─── EVALUATION SYSTEM ───────────────────────────────────────────────────────
const EVAL_SPLIT = { resultados: 0.70, comportamientos: 0.30 };
const CURRENT_QUARTER = "Q3 2026";

const ROLE_KPIS = {
  "Buceador": [
    { id:"cosecha",    titulo:"Siembra y cosecha",        metrico:"kg cosechados vs. objetivo",     importancia:0.40 },
    { id:"limpieza",   titulo:"Limpieza y mantenimiento", metrico:"% ciclos completados a tiempo",  importancia:0.25 },
    { id:"vigilancia", titulo:"Vigilancia y salinidad",   metrico:"# sitios registrados / objetivo",importancia:0.20 },
    { id:"etica",      titulo:"Ética y asistencia",       metrico:"# incidencias (meta: 0)",        importancia:0.15 },
  ],
  "Capitán": [
    { id:"cosecha",    titulo:"Siembra y cosecha",        metrico:"kg cosechados vs. objetivo",     importancia:0.35 },
    { id:"bitacora",   titulo:"Operación de embarcación", metrico:"% viajes con bitácora completa", importancia:0.25 },
    { id:"vigilancia", titulo:"Vigilancia y salinidad",   metrico:"# sitios registrados / objetivo",importancia:0.25 },
    { id:"etica",      titulo:"Ética y asistencia",       metrico:"# incidencias (meta: 0)",        importancia:0.15 },
  ],
  "Asistente supervisor": [
    { id:"cosecha",    titulo:"Siembra y cosecha",        metrico:"kg cosechados vs. objetivo",     importancia:0.40 },
    { id:"construir",  titulo:"Construcción de sistemas", metrico:"# canastas construidas",         importancia:0.25 },
    { id:"mant",       titulo:"Mantenimiento",            metrico:"% tareas completadas a tiempo",  importancia:0.20 },
    { id:"etica",      titulo:"Ética y asistencia",       metrico:"# incidencias (meta: 0)",        importancia:0.15 },
  ],
  "Supervisor proceso": [
    { id:"cosecha",    titulo:"Siembra y cosecha",        metrico:"kg cosechados vs. objetivo",     importancia:0.40 },
    { id:"metricas",   titulo:"Métricas diarias",         metrico:"% datos TDC registrados vs. plan",importancia:0.25 },
    { id:"planb",      titulo:"Planes de respaldo",       metrico:"# semanas con plan B documentado",importancia:0.20 },
    { id:"etica",      titulo:"Ética y asistencia",       metrico:"# incidencias (meta: 0)",        importancia:0.15 },
  ],
  "Director operaciones": [
    { id:"supervision",titulo:"Supervisión general",      metrico:"% visitas completadas",          importancia:0.35 },
    { id:"plan",       titulo:"Plan de labor semanal",    metrico:"# semanas entregadas a tiempo",  importancia:0.30 },
    { id:"reportes",   titulo:"Métricas y reportes",      metrico:"% reportes en tiempo",           importancia:0.20 },
    { id:"liderazgo",  titulo:"Ética y liderazgo",        metrico:"Evaluación 360",                 importancia:0.15 },
  ],
  "Colaborador": [
    { id:"tareas",     titulo:"Tareas asignadas",         metrico:"% tareas completadas vs. plan",  importancia:0.40 },
    { id:"reporte",    titulo:"Reporte en tiempo",        metrico:"# reportes en tiempo / semana",  importancia:0.25 },
    { id:"mant",       titulo:"Mantenimiento",            metrico:"% tareas completadas a tiempo",  importancia:0.20 },
    { id:"etica",      titulo:"Ética y asistencia",       metrico:"# incidencias (meta: 0)",        importancia:0.15 },
  ],
};

const COMPORTAMIENTOS_LIST = [
  { id:"mision",     desc:"Sirve a una misión más grande que tú" },
  { id:"resultados", desc:"Produce resultados sólidos (tiempo, calidad)" },
  { id:"mejora",     desc:"Mejora continuamente — eficiencia" },
  { id:"planes",     desc:"Hace planes de respaldo para el éxito" },
  { id:"equipo",     desc:"Es un compañero de equipo con integridad" },
];

const GALLUP_12 = [
  "¿Sé lo que se espera de mí en el trabajo?",
  "¿Tengo los materiales y el equipo que necesito para hacer bien mi trabajo?",
  "En el trabajo, ¿tengo la oportunidad de hacer lo que mejor hago todos los días?",
  "En los últimos 7 días, ¿he recibido reconocimiento o elogio por hacer un buen trabajo?",
  "¿Mi supervisor o alguien en el trabajo parece preocuparse por mí como persona?",
  "¿Hay alguien en el trabajo que aliente mi desarrollo?",
  "En el trabajo, ¿mis opiniones parecen contar?",
  "¿La misión de mi empresa me hace sentir que mi trabajo es importante?",
  "¿Mis compañeros de trabajo están comprometidos con hacer un trabajo de calidad?",
  "¿Tengo un mejor amigo en el trabajo?",
  "En los últimos 6 meses, ¿alguien me ha hablado de mi progreso?",
  "Este último año, ¿he tenido oportunidades para aprender y crecer?",
];


const TOTAL_PTS = { HM:10, JL:10, CE:13, RV:11, RBM:11, RBC:11, JV:14, EV:18, LA:13 };


// ─── BOARD-LEVEL SALES DATA ───────────────────────────────────────────────────
// Assumptions: wet-to-dry ratio 8:1 · price $400/dry ton (blended carrageenan market)
// Actuals: placeholder $0 until first commercial sale confirmed
// Projections derived from Business_Model_2026.xlsx biomass targets
// Price per kg wet: $0.05 (=$400/dry ton ÷ 8 wet:dry ratio)
const PRICE_PER_KG_WET = 0.05; // USD

// ─── TASK SCHEMA — per-task input definition ─────────────────────────────────
const TASK_SCHEMA = {
  pesos:       { icon:"⚖️",  label:"Pesos",           labelEn:"Weigh",          unit:"g",        unitEn:"g",       inputType:"number",  needsCondition:false, needsPhoto:false, needsVoice:false, yesno:false },
  cosecha:     { icon:"🌿",  label:"Cosechar",         labelEn:"Harvest",        unit:"kg",       unitEn:"kg",      inputType:"number",  needsCondition:false, needsPhoto:false, needsVoice:false, yesno:false },
  sembrar:     { icon:"🌱",  label:"Sembrar",          labelEn:"Seed",           unit:"canastas", unitEn:"baskets", inputType:"number",  needsCondition:false, needsPhoto:false, needsVoice:false, yesno:false },
  vigilancia:  { icon:"👁️",  label:"Vigilancia",       labelEn:"Monitor",        unit:"sitios",   unitEn:"sites",   inputType:"number",  needsCondition:true,  needsPhoto:false, needsVoice:true,  yesno:false },
  limpieza:    { icon:"🧹",  label:"Limpieza",         labelEn:"Clean",          unit:"sistemas", unitEn:"systems", inputType:"number",  needsCondition:true,  needsPhoto:true,  needsVoice:false, yesno:false },
  construir:   { icon:"🔨",  label:"Construir canastas",labelEn:"Build baskets", unit:"canastas", unitEn:"baskets", inputType:"number",  needsCondition:false, needsPhoto:false, needsVoice:false, yesno:false },
  motor:       { icon:"⚙️",  label:"Mant. Motor",      labelEn:"Motor maint.",   unit:"horas",    unitEn:"hours",   inputType:"number",  needsCondition:false, needsPhoto:false, needsVoice:false, yesno:false },
  reubicar:    { icon:"📍",  label:"Reubicar",         labelEn:"Relocate",       unit:"",         unitEn:"",        inputType:"yesno",   needsCondition:false, needsPhoto:false, needsVoice:false, yesno:true  },
  desplegar:   { icon:"🚀",  label:"Desplegar",        labelEn:"Deploy",         unit:"",         unitEn:"",        inputType:"yesno",   needsCondition:false, needsPhoto:false, needsVoice:false, yesno:true  },
  parametros:  { icon:"📊",  label:"Parámetros",       labelEn:"Parameters",     unit:"lecturas", unitEn:"readings",inputType:"number",  needsCondition:false, needsPhoto:false, needsVoice:false, yesno:false },
  planificacion:{ icon:"📋", label:"Planificación",    labelEn:"Planning",       unit:"horas",    unitEn:"hours",   inputType:"number",  needsCondition:false, needsPhoto:false, needsVoice:false, yesno:false },
  seleccion:   { icon:"🔍",  label:"Selec. Semilla",   labelEn:"Seed select.",   unit:"canastas", unitEn:"baskets", inputType:"number",  needsCondition:true,  needsPhoto:false, needsVoice:true,  yesno:false },
  mantenimiento:{ icon:"🛠️", label:"Mantenimiento",   labelEn:"Maintenance",    unit:"sistemas", unitEn:"systems", inputType:"number",  needsCondition:true,  needsPhoto:false, needsVoice:false, yesno:false },
  dipping:      { icon:"🧪",  label:"Dipping AMPEP",  labelEn:"AMPEP Dipping",  unit:"%",        unitEn:"%",       inputType:"number",  needsCondition:false, needsPhoto:false, needsVoice:false, yesno:false, needsNotes:true },
};

const CONDICION_EMOJIS = [
  { emoji:"✅", label:"Bien",       labelEn:"Good",    value:"bien"        },
  { emoji:"⚠️", label:"Regular",    labelEn:"Fair",    value:"regular"     },
  { emoji:"❌", label:"Problema",   labelEn:"Problem", value:"problema"    },
  { emoji:"🌊", label:"Agua turbia",labelEn:"Turbid",  value:"turbid"      },
  { emoji:"🌿", label:"Alga sana",  labelEn:"Healthy", value:"healthy"     },
  { emoji:"🦠", label:"Contam.",    labelEn:"Contam.", value:"contaminado" },
];


// Bump this string whenever systems.js changes — forces all devices to reload from bundle
const SYSTEMS_DATA_VERSION = '2026-05-19-b';

// How many days between required peso readings. Change this one number to adjust the cadence.
const READING_CADENCE_DAYS = 2;

export {
  DEFAULT_REGIONS, DEFAULT_TIPOS, DEFAULT_MATERIALES, DEFAULT_SEMILLAS,
  REGION_SUPERVISORS, TASK_CADENCES,
  THRESHOLDS, TASK_TYPES, PROF_CATEGORIES, SCORE_WEIGHTS,
  CREW, EVAL_SPLIT, CURRENT_QUARTER, ROLE_KPIS,
  COMPORTAMIENTOS_LIST, GALLUP_12, TOTAL_PTS,
  PRICE_PER_KG_WET, TASK_SCHEMA, CONDICION_EMOJIS,
  SYSTEMS_DATA_VERSION, READING_CADENCE_DAYS,
};
