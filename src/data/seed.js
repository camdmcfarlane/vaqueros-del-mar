// AquaOps — Seed data (initial readings, chart data, tasks, evaluations)

const INITIAL_READINGS = [
  { id:1, sistema:"P5-2", fecha:"2025-12-03", peso:3700, sueltos:null, cosechada:null, sembrado:800, aguas:"Turbia",       condiciones:"Saludables", salt:2.7,  ph:9.3,  salinidad:19.2, temp:26, tdc:null, notas:"", foto:null },
  { id:2, sistema:"P5-3", fecha:"2025-12-03", peso:3200, sueltos:null, cosechada:null, sembrado:750, aguas:"Claras",       condiciones:"Saludables", salt:2.6,  ph:9.2,  salinidad:19.1, temp:26, tdc:null, notas:"", foto:null },
  { id:3, sistema:"P5-4", fecha:"2025-12-06", peso:6160, sueltos:null, cosechada:null, sembrado:800, aguas:"Transparente", condiciones:"Saludables", salt:2.21, ph:9.37, salinidad:18.5, temp:26, tdc:null, notas:"", foto:null },
  { id:4, sistema:"P5-5", fecha:"2025-12-06", peso:5480, sueltos:null, cosechada:null, sembrado:750, aguas:"Transparente", condiciones:"Saludable",  salt:2.2,  ph:9.3,  salinidad:19.1, temp:26, tdc:null, notas:"", foto:null },
  { id:5, sistema:"P11",  fecha:"2025-12-03", peso:4500, sueltos:null, cosechada:null, sembrado:900, aguas:"Claras",       condiciones:"Saludables", salt:2.6,  ph:9.2,  salinidad:19.2, temp:26, tdc:null, notas:"", foto:null },
  { id:6, sistema:"P12-1",fecha:"2025-12-09", peso:3440, sueltos:null, cosechada:null, sembrado:700, aguas:"Transparente", condiciones:"Saludables", salt:2.3,  ph:9.4,  salinidad:9.1,  temp:26, tdc:null, notas:"", foto:null },
  { id:7, sistema:"P13-1",fecha:"2025-12-06", peso:3100, sueltos:null, cosechada:null, sembrado:650, aguas:"Transparente", condiciones:"Saludale",   salt:1.54, ph:9.6,  salinidad:13.3, temp:26, tdc:null, notas:"", foto:null },
  { id:8, sistema:"P1",   fecha:"2025-12-10", peso:4200, sueltos:null, cosechada:null, sembrado:800, aguas:"Claras",       condiciones:"Saludables", salt:2.5,  ph:9.1,  salinidad:18.8, temp:27, tdc:null, notas:"", foto:null },
  { id:9, sistema:"P2",   fecha:"2025-12-10", peso:3900, sueltos:null, cosechada:null, sembrado:780, aguas:"Claras",       condiciones:"Saludables", salt:2.4,  ph:9.2,  salinidad:18.9, temp:27, tdc:null, notas:"", foto:null },
  { id:10,sistema:"P14",  fecha:"2025-12-12", peso:5200, sueltos:null, cosechada:null, sembrado:900, aguas:"Transparente", condiciones:"Saludables", salt:2.8,  ph:9.0,  salinidad:20.1, temp:25, tdc:null, notas:"", foto:null },
  // Week 2
  { id:11,sistema:"P5-2", fecha:"2025-12-10", peso:4900, sueltos:null, cosechada:null, sembrado:800, aguas:"Claras",       condiciones:"Saludables", salt:2.6,  ph:9.2,  salinidad:19.5, temp:26, tdc:null, notas:"", foto:null },
  { id:12,sistema:"P5-3", fecha:"2025-12-10", peso:4400, sueltos:null, cosechada:null, sembrado:750, aguas:"Claras",       condiciones:"Saludables", salt:2.5,  ph:9.1,  salinidad:19.3, temp:26, tdc:null, notas:"", foto:null },
  { id:13,sistema:"P11",  fecha:"2025-12-10", peso:6100, sueltos:null, cosechada:null, sembrado:900, aguas:"Transparente", condiciones:"Excelente",  salt:2.7,  ph:9.3,  salinidad:19.8, temp:26, tdc:null, notas:"", foto:null },
  // Week 3
  { id:14,sistema:"P5-2", fecha:"2025-12-17", peso:6800, sueltos:null, cosechada:null, sembrado:800, aguas:"Claras",       condiciones:"Saludables", salt:2.6,  ph:9.2,  salinidad:19.6, temp:27, tdc:null, notas:"", foto:null },
  { id:15,sistema:"P11",  fecha:"2025-12-17", peso:8200, sueltos:null, cosechada:null, sembrado:900, aguas:"Claras",       condiciones:"Excelente",  salt:2.8,  ph:9.1,  salinidad:20.0, temp:27, tdc:null, notas:"", foto:null },
  { id:16,sistema:"P14",  fecha:"2025-12-17", peso:7100, sueltos:null, cosechada:null, sembrado:900, aguas:"Transparente", condiciones:"Saludables", salt:2.7,  ph:9.2,  salinidad:19.8, temp:26, tdc:null, notas:"", foto:null },
];

// ─── TDC HISTORICAL DATA ─────────────────────────────────────────────────────
const TDC_DATA = [
  { fecha:"29/12/2025", tdc:0.00,  label:"29 Dic" },
  { fecha:"05/01/2026", tdc:-0.18, label:"5 Ene" },
  { fecha:"12/01/2026", tdc:-0.58, label:"12 Ene" },
  { fecha:"19/01/2026", tdc:0.07,  label:"19 Ene" },
  { fecha:"26/01/2026", tdc:2.08,  label:"26 Ene" },
  { fecha:"02/02/2026", tdc:1.99,  label:"2 Feb" },
  { fecha:"09/02/2026", tdc:1.12,  label:"9 Feb" },
  { fecha:"16/02/2026", tdc:2.55,  label:"16 Feb" },
  { fecha:"23/02/2026", tdc:2.26,  label:"23 Feb" },
  { fecha:"02/03/2026", tdc:0.67,  label:"2 Mar" },
  { fecha:"09/03/2026", tdc:1.58,  label:"9 Mar" },
  { fecha:"16/03/2026", tdc:0.00,  label:"16 Mar", harvest:true },
];

// % Pruebas en Categorías
// R = Rojo (red), A = Amarillo (yellow/amber), V = Verde (green), B = Azul/Blue (blue)
// Stack order bottom→top: R, A, V, B — matching Eduardo's Excel chart
// Source: R%/A%/V%/B% columns (N/O/P/Q) from Resumen sheet
const PRUEBAS_DATA = [
  { label:"12 Ene", r:55, a:32, v:9,  b:5  },
  { label:"19 Ene", r:8,  a:19, v:49, b:24 },
  { label:"26 Ene", r:11, a:54, v:11, b:25 },
  { label:"2 Feb",  r:38, a:34, v:17, b:10 },
  { label:"9 Feb",  r:15, a:31, v:42, b:12 },
  { label:"16 Feb", r:0,  a:23, v:50, b:27 },
  { label:"23 Feb", r:16, a:72, v:12, b:0  },
  { label:"2 Mar",  r:26, a:52, v:19, b:3  },
  { label:"9 Mar",  r:10, a:63, v:17, b:10 },
  { label:"16 Mar", r:4,  a:44, v:20, b:32 },
];

// Biomasa total (kg) — actuals + targets
const BIOMASA_DATA = [
  { mes:"Dic",   actual:730,  target:null },
  { mes:"Ene",   actual:803,  target:700  },
  { mes:"Feb",   actual:1326, target:null },
  { mes:"Mar",   actual:1390, target:1400 },
  { mes:"Abr",   actual:null, target:null },
  { mes:"May",   actual:null, target:null },
  { mes:"Jun",   actual:null, target:2800 },
  { mes:"Sep",   actual:null, target:5600 },
  { mes:"Dic26", actual:null, target:11200 },
];

// ─── BOARD-LEVEL SALES DATA ───────────────────────────────────────────────────
// Assumptions: wet-to-dry ratio 8:1 · price $400/dry ton (blended carrageenan market)
// Actuals: placeholder $0 until first commercial sale confirmed
// Projections derived from Business_Model_2026.xlsx biomass targets
// Price per kg wet: $0.05 (=$400/dry ton ÷ 8 wet:dry ratio)
const PRICE_PER_KG_WET = 0.05; // USD

const SALES_DATA = [
  // { mes, biomasaActual(kg), biomasaTarget(kg), revenueActual(USD), revenueTarget(USD) }
  { mes:"Dic",   bioActual:730,   bioProy:730,   revActual:null, revProy:36.5,   label:"Dic 25" },
  { mes:"Ene",   bioActual:803,   bioProy:700,   revActual:null, revProy:35.0,   label:"Ene 26" },
  { mes:"Feb",   bioActual:1326,  bioProy:1050,  revActual:null, revProy:52.5,   label:"Feb 26" },
  { mes:"Mar",   bioActual:1390,  bioProy:1400,  revActual:null, revProy:70.0,   label:"Mar 26" },
  { mes:"Abr",   bioActual:null,  bioProy:1900,  revActual:null, revProy:95.0,   label:"Abr 26" },
  { mes:"May",   bioActual:null,  bioProy:2400,  revActual:null, revProy:120.0,  label:"May 26" },
  { mes:"Jun",   bioActual:null,  bioProy:2800,  revActual:null, revProy:140.0,  label:"Jun 26" },
  { mes:"Sep",   bioActual:null,  bioProy:5600,  revActual:null, revProy:280.0,  label:"Sep 26" },
  { mes:"Dic",   bioActual:null,  bioProy:11200, revActual:null, revProy:560.0,  label:"Dic 26" },
];

// Cumulative revenue: actual vs projected (for the S-curve chart)
const REVENUE_CUMULATIVE = [
  { label:"Dic 25", actual:0,    proy:36.5  },
  { label:"Ene 26", actual:0,    proy:71.5  },
  { label:"Feb 26", actual:0,    proy:124.0 },
  { label:"Mar 26", actual:0,    proy:194.0 },
  { label:"Abr 26", actual:null, proy:289.0 },
  { label:"May 26", actual:null, proy:409.0 },
  { label:"Jun 26", actual:null, proy:549.0 },
  { label:"Sep 26", actual:null, proy:829.0 },
  { label:"Dic 26", actual:null, proy:1389.0 },
];

// ─── SEED TASK LOGS (week of Mar 9 2026) ────────────────────────────────────
const SEED_TASK_LOGS = [
  // Lunes
  { id:1,  date:"2026-03-09", day:"Lunes",    taskId:"vigilancia",  initials:"RBC", initials2:"JL",  objetivo:2, actual:2,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:2,  date:"2026-03-09", day:"Lunes",    taskId:"pesos",       initials:"RBC", initials2:"JL",  objetivo:4, actual:4,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:3,  date:"2026-03-09", day:"Lunes",    taskId:"construir",   initials:"LA",  initials2:"CE",  objetivo:5, actual:3,  confirmed:true,  notas:"Faltaron materiales", comentarioVaquero:null, comentarioFecha:null },
  // Martes
  { id:4,  date:"2026-03-10", day:"Martes",   taskId:"vigilancia",  initials:"RBC", initials2:"JL",  objetivo:3, actual:3,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:5,  date:"2026-03-10", day:"Martes",   taskId:"limpieza",    initials:"RBC", initials2:"JL",  objetivo:4, actual:4,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:6,  date:"2026-03-10", day:"Martes",   taskId:"motor",       initials:"RBM", initials2:null,  objetivo:2, actual:2,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  // Miércoles
  { id:7,  date:"2026-03-11", day:"Miércoles",taskId:"vigilancia",  initials:"RBC", initials2:"JL",  objetivo:3, actual:2,  confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:8,  date:"2026-03-11", day:"Miércoles",taskId:"limpieza",    initials:"CE",  initials2:"HM",  objetivo:3, actual:3,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:9,  date:"2026-03-11", day:"Miércoles",taskId:"pesos",       initials:"LA",  initials2:null,  objetivo:5, actual:5,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  // Jueves
  { id:10, date:"2026-03-12", day:"Jueves",   taskId:"vigilancia",  initials:"RBC", initials2:"JL",  objetivo:3, actual:3,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:11, date:"2026-03-12", day:"Jueves",   taskId:"construir",   initials:"JV",  initials2:"RBM", objetivo:6, actual:6,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:12, date:"2026-03-12", day:"Jueves",   taskId:"limpieza",    initials:"LA",  initials2:"CE",  objetivo:4, actual:3,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  // Viernes
  { id:13, date:"2026-03-13", day:"Viernes",  taskId:"vigilancia",  initials:"RBC", initials2:"JL",  objetivo:3, actual:3,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:14, date:"2026-03-13", day:"Viernes",  taskId:"pesos",       initials:"RBC", initials2:"JL",  objetivo:4, actual:4,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:15, date:"2026-03-13", day:"Viernes",  taskId:"limpieza",    initials:"LA",  initials2:"CE",  objetivo:4, actual:4,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
  // Sábado
  { id:16, date:"2026-03-14", day:"Sábado",   taskId:"sembrar",     initials:"RBM", initials2:"JV",  objetivo:20, actual:18, confirmed:true, notas:"Playa roja", comentarioVaquero:null, comentarioFecha:null },
  { id:17, date:"2026-03-14", day:"Sábado",   taskId:"vigilancia",  initials:"RBC", initials2:"JL",  objetivo:3, actual:3,  confirmed:true,  notas:"", comentarioVaquero:null, comentarioFecha:null },
];

// ─── SEED PROFESSIONALISM SCORES (monthly, scored by Eduardo) ───────────────
const SEED_PROF_SCORES = [
  { month:"2026-03", initials:"HM",  puntualidad:4, seguridad:5, actitud:4, equipo:4 },
  { month:"2026-03", initials:"JL",  puntualidad:5, seguridad:5, actitud:5, equipo:5 },
  { month:"2026-03", initials:"CE",  puntualidad:4, seguridad:4, actitud:5, equipo:4 },
  { month:"2026-03", initials:"RV",  puntualidad:3, seguridad:5, actitud:3, equipo:4 },
  { month:"2026-03", initials:"RBM", puntualidad:5, seguridad:5, actitud:4, equipo:5 },
  { month:"2026-03", initials:"RBC", puntualidad:4, seguridad:5, actitud:5, equipo:4 },
  { month:"2026-03", initials:"JV",  puntualidad:4, seguridad:4, actitud:4, equipo:3 },
  { month:"2026-03", initials:"LA",  puntualidad:3, seguridad:4, actitud:4, equipo:4 },
];

// ─── WEEKLY INCIDENTS (attendance/tardiness — logged by Eduardo each week) ───
// Each entry: { week, initials, tardanzas, ausencias, notas }
// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
const SEED_ANNOUNCEMENTS = [
  { id:1, author:"Eduardo Valdés", initials:"EV", role:"supervisor",
    message:"No dejes para mañana lo que puedas hacer hoy.",
    date:"2026-03-20", pinned:true },
];

// ─── TIMECARD DATA — daily check-in/check-out per employee ───────────────────
// Each entry: { date, initials, checkIn, checkOut, horasTrabajadas }
const SEED_TIMECARDS = [
  { date:"2026-03-09", initials:"HM",  checkIn:"06:15", checkOut:"16:30" },
  { date:"2026-03-09", initials:"JL",  checkIn:"06:55", checkOut:"16:30" },
  { date:"2026-03-09", initials:"CE",  checkIn:"06:10", checkOut:"16:30" },
  { date:"2026-03-09", initials:"RV",  checkIn:"06:00", checkOut:"17:00" },
  { date:"2026-03-09", initials:"RBM", checkIn:"06:05", checkOut:"17:00" },
  { date:"2026-03-09", initials:"RBC", checkIn:"06:00", checkOut:"17:00" },
  { date:"2026-03-09", initials:"JV",  checkIn:"06:00", checkOut:"17:00" },
  { date:"2026-03-09", initials:"LA",  checkIn:"07:10", checkOut:"16:30" },
];

function calcHoras(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const [h1,m1] = checkIn.split(":").map(Number);
  const [h2,m2] = checkOut.split(":").map(Number);
  const mins = (h2*60+m2) - (h1*60+m1);
  if (mins <= 0) return null;
  return (mins/60).toFixed(1);
}

const SEED_WEEKLY_INCIDENTS = [
  { week:"2026-W09", initials:"HM",  tardanzas:0, ausencias:0, notas:"" },
  { week:"2026-W09", initials:"JL",  tardanzas:1, ausencias:0, notas:"Llegó 40 min tarde el lunes" },
  { week:"2026-W09", initials:"CE",  tardanzas:0, ausencias:0, notas:"" },
  { week:"2026-W09", initials:"RV",  tardanzas:0, ausencias:0, notas:"" },
  { week:"2026-W09", initials:"RBM", tardanzas:0, ausencias:0, notas:"" },
  { week:"2026-W09", initials:"RBC", tardanzas:2, ausencias:0, notas:"Tardanzas lunes y miércoles" },
  { week:"2026-W09", initials:"JV",  tardanzas:0, ausencias:0, notas:"" },
  { week:"2026-W09", initials:"LA",  tardanzas:1, ausencias:1, notas:"Ausencia jueves sin aviso" },
];


const SEED_EVALUATIONS = {
  "HM":  { name:"Hilario Migar",   rol:"Buceador",
    quarters:{ "Q1 2026":{ resultados:{cosecha:{gol:100,resultado:60},limpieza:{gol:1,resultado:0},vigilancia:{gol:10,resultado:10},etica:{gol:90,resultado:90}}, comportamientos:{mision:1.0,resultados:0.6,mejora:0.75,planes:0.5,equipo:1.0}, gallup:[5,4,4,4,4,1,2,5,4,3,2,5], fortalezas:["","",""], mejoras:["","",""], notas:"" },
    "Q3 2026":{ resultados:{}, comportamientos:{}, gallup:[], fortalezas:["","",""], mejoras:["","",""], notas:"" } } },
  "JL":  { name:"Jairo Lorenzo",   rol:"Buceador",
    quarters:{ "Q1 2026":{ resultados:{cosecha:{gol:0,resultado:0},limpieza:{gol:0,resultado:0},vigilancia:{gol:0,resultado:0},etica:{gol:0,resultado:0}}, comportamientos:{mision:0.75,resultados:0.75,mejora:0.75,planes:0.75,equipo:0.75}, gallup:[4,4,4,4,4,4,4,4,4,4,4,4], fortalezas:["","",""], mejoras:["","",""], notas:"" },
    "Q3 2026":{ resultados:{}, comportamientos:{}, gallup:[], fortalezas:["","",""], mejoras:["","",""], notas:"" } } },
  "CE":  { name:"Charles Ebersole",rol:"Buceador",
    quarters:{ "Q1 2026":{ resultados:{cosecha:{gol:0,resultado:0},limpieza:{gol:0,resultado:0},vigilancia:{gol:0,resultado:0},etica:{gol:0,resultado:0}}, comportamientos:{mision:0.75,resultados:0.75,mejora:0.75,planes:0.75,equipo:0.75}, gallup:[4,4,4,4,4,4,4,4,4,4,4,4], fortalezas:["","",""], mejoras:["","",""], notas:"" },
    "Q3 2026":{ resultados:{}, comportamientos:{}, gallup:[], fortalezas:["","",""], mejoras:["","",""], notas:"" } } },
  "RV":  { name:"Rodolfo Viquez",  rol:"Asistente supervisor",
    quarters:{ "Q1 2026":{ resultados:{cosecha:{gol:0,resultado:0},construir:{gol:0,resultado:0},mant:{gol:0,resultado:0},etica:{gol:0,resultado:0}}, comportamientos:{mision:0.75,resultados:0.75,mejora:0.75,planes:0.75,equipo:0.75}, gallup:[4,4,4,4,4,4,4,4,4,4,4,4], fortalezas:["","",""], mejoras:["","",""], notas:"" },
    "Q3 2026":{ resultados:{}, comportamientos:{}, gallup:[], fortalezas:["","",""], mejoras:["","",""], notas:"" } } },
  "RBM": { name:"Rodolfo Banard",  rol:"Capitán",
    quarters:{ "Q1 2026":{ resultados:{cosecha:{gol:0,resultado:0},bitacora:{gol:0,resultado:0},vigilancia:{gol:0,resultado:0},etica:{gol:0,resultado:0}}, comportamientos:{mision:0.75,resultados:0.75,mejora:0.75,planes:0.75,equipo:0.75}, gallup:[4,4,4,4,4,4,4,4,4,4,4,4], fortalezas:["","",""], mejoras:["","",""], notas:"" },
    "Q3 2026":{ resultados:{}, comportamientos:{}, gallup:[], fortalezas:["","",""], mejoras:["","",""], notas:"" } } },
  "RBC": { name:"Romelio Bekar",   rol:"Capitán",
    quarters:{ "Q1 2026":{ resultados:{cosecha:{gol:0,resultado:0},bitacora:{gol:0,resultado:0},vigilancia:{gol:0,resultado:0},etica:{gol:0,resultado:0}}, comportamientos:{mision:0.75,resultados:0.75,mejora:0.75,planes:0.75,equipo:0.75}, gallup:[4,4,4,4,4,4,4,4,4,4,4,4], fortalezas:["","",""], mejoras:["","",""], notas:"" },
    "Q3 2026":{ resultados:{}, comportamientos:{}, gallup:[], fortalezas:["","",""], mejoras:["","",""], notas:"" } } },
  "JV":  { name:"Joel Valdés",     rol:"Supervisor proceso",
    quarters:{ "Q1 2026":{ resultados:{cosecha:{gol:0,resultado:0},metricas:{gol:0,resultado:0},planb:{gol:0,resultado:0},etica:{gol:0,resultado:0}}, comportamientos:{mision:0.75,resultados:0.75,mejora:0.75,planes:0.75,equipo:0.75}, gallup:[4,4,4,4,4,4,4,4,4,4,4,4], fortalezas:["","",""], mejoras:["","",""], notas:"" },
    "Q3 2026":{ resultados:{}, comportamientos:{}, gallup:[], fortalezas:["","",""], mejoras:["","",""], notas:"" } } },
  "EV":  { name:"Eduardo Valdés",  rol:"Director operaciones",
    quarters:{ "Q1 2026":{ resultados:{supervision:{gol:0,resultado:0},plan:{gol:0,resultado:0},reportes:{gol:0,resultado:0},liderazgo:{gol:0,resultado:0}}, comportamientos:{mision:0.75,resultados:0.75,mejora:0.75,planes:0.75,equipo:0.75}, gallup:[4,4,4,4,4,4,4,4,4,4,4,4], fortalezas:["","",""], mejoras:["","",""], notas:"" },
    "Q3 2026":{ resultados:{}, comportamientos:{}, gallup:[], fortalezas:["","",""], mejoras:["","",""], notas:"" } } },
  "LA":  { name:"Luis Alvarado",   rol:"Colaborador",
    quarters:{ "Q1 2026":{ resultados:{tareas:{gol:0,resultado:0},reporte:{gol:0,resultado:0},mant:{gol:0,resultado:0},etica:{gol:0,resultado:0}}, comportamientos:{mision:0.75,resultados:0.75,mejora:0.75,planes:0.75,equipo:0.75}, gallup:[4,4,4,4,4,4,4,4,4,4,4,4], fortalezas:["","",""], mejoras:["","",""], notas:"" },
    "Q3 2026":{ resultados:{}, comportamientos:{}, gallup:[], fortalezas:["","",""], mejoras:["","",""], notas:"" } } },
};

// Seed task assignments for this week (Eduardo creates these via Plan Semanal)
const SEED_ASSIGNED_TASKS = [
  // HM
  { id:101, assignedTo:"HM", day:"Lunes",    taskType:"vigilancia",  sistema:"P11",   objetivo:3, date:"2026-03-09", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:102, assignedTo:"HM", day:"Miércoles",taskType:"limpieza",    sistema:"P12-1", objetivo:3, date:"2026-03-11", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:103, assignedTo:"HM", day:"Viernes",  taskType:"pesos",       sistema:"P12-2", objetivo:null, date:"2026-03-13", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:104, assignedTo:"JL", day:"Lunes",    taskType:"vigilancia",  sistema:"P11",   objetivo:3, date:"2026-03-09", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:105, assignedTo:"JL", day:"Martes",   taskType:"limpieza",    sistema:"P13-1", objetivo:4, date:"2026-03-10", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:106, assignedTo:"JL", day:"Jueves",   taskType:"cosecha",     sistema:"P14",   objetivo:50, date:"2026-03-12", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:107, assignedTo:"CE", day:"Lunes",    taskType:"reubicar",    sistema:"P5-2",  objetivo:null, date:"2026-03-09", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Mover hacia Polígono 3 — coordinar con RBC antes de salir", comentarioVaquero:null, comentarioFecha:null },
  { id:108, assignedTo:"CE", day:"Martes",   taskType:"limpieza",    sistema:"P5-3",  objetivo:3, date:"2026-03-10", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:109, assignedTo:"CE", day:"Miércoles",taskType:"construir",   sistema:null,    objetivo:5, date:"2026-03-11", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Usar materiales del taller — confirmar con Eduardo", comentarioVaquero:null, comentarioFecha:null },
  { id:110, assignedTo:"RV", day:"Martes",   taskType:"parametros",  sistema:"P1",    objetivo:4, date:"2026-03-10", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:111, assignedTo:"RV", day:"Jueves",   taskType:"construir",   sistema:null,    objetivo:6, date:"2026-03-12", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:112, assignedTo:"RV", day:"Sábado",   taskType:"planificacion",sistema:null,   objetivo:2, date:"2026-03-14", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:113, assignedTo:"RBM",day:"Lunes",    taskType:"motor",       sistema:null,    objetivo:20, date:"2026-03-09", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Revisar aceite — último cambio hace 3 semanas", comentarioVaquero:null, comentarioFecha:null },
  { id:114, assignedTo:"RBM",day:"Miércoles",taskType:"sembrar",     sistema:"P5-4",  objetivo:10, date:"2026-03-11", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:115, assignedTo:"RBC",day:"Lunes",    taskType:"vigilancia",  sistema:"P11",   objetivo:3, date:"2026-03-09", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:116, assignedTo:"RBC",day:"Jueves",   taskType:"mantenimiento",sistema:"P13-2",objetivo:2, date:"2026-03-12", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:117, assignedTo:"JV", day:"Martes",   taskType:"seleccion",   sistema:null,    objetivo:5, date:"2026-03-10", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Priorizar semilla de Bahía Azul para los nuevos sistemas", comentarioVaquero:null, comentarioFecha:null },
  { id:118, assignedTo:"JV", day:"Sábado",   taskType:"planificacion",sistema:null,   objetivo:2, date:"2026-03-14", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:119, assignedTo:"LA", day:"Martes",   taskType:"limpieza",    sistema:"P5-5",  objetivo:4, date:"2026-03-10", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:120, assignedTo:"LA", day:"Miércoles",taskType:"parametros",  sistema:"P1",    objetivo:5, date:"2026-03-11", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"", comentarioVaquero:null, comentarioFecha:null },
  { id:121, assignedTo:"LA", day:"Viernes",  taskType:"desplegar",   sistema:"P17",   objetivo:null, date:"2026-03-13", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Desplegar en coordenadas N 09°07'34 O 082°03'58", comentarioVaquero:null, comentarioFecha:null },
  // ── 2026-05-20 (Martes) ── Eduardo's plan ──────────────────────────────────
  { id:201, assignedTo:"CE", day:"Martes", taskType:"parametros",  sistema:null,    objetivo:null, date:"2026-05-20", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Tobobe y Playa Roja — parámetros del agua en todos los sitios", comentarioVaquero:null, comentarioFecha:null, supportCrew:["HM","YL"] },
  { id:202, assignedTo:"LA", day:"Martes", taskType:"parametros",  sistema:null,    objetivo:null, date:"2026-05-20", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Cayo de Agua — parámetros del agua", comentarioVaquero:null, comentarioFecha:null, supportCrew:[] },
  { id:203, assignedTo:"CE", day:"Martes", taskType:"cosecha",     sistema:null,    objetivo:null, date:"2026-05-20", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Tobobe — cosecha de semillas sueltas", comentarioVaquero:null, comentarioFecha:null, supportCrew:["HM","YL"] },
  { id:204, assignedTo:"CE", day:"Martes", taskType:"sembrar",     sistema:null,    objetivo:null, date:"2026-05-20", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Playa Roja — siembra de semillas. Anotar cantidad sembrada en notas.", comentarioVaquero:null, comentarioFecha:null, supportCrew:["HM","YL"] },
  { id:205, assignedTo:"CE", day:"Martes", taskType:"dipping",     sistema:"P26-4", objetivo:null, date:"2026-05-20", actual:null, condicion:null, voiceNote:null, foto:null, confirmed:false, notas:"Dipping en AMPEP — especificar concentración (%) y observaciones de la prueba de crecimiento", comentarioVaquero:null, comentarioFecha:null, supportCrew:["HM","YL"] },
];

export {
  INITIAL_READINGS, TDC_DATA, PRUEBAS_DATA, BIOMASA_DATA,
  SALES_DATA, REVENUE_CUMULATIVE,
  SEED_TASK_LOGS, SEED_PROF_SCORES,
  SEED_ANNOUNCEMENTS, SEED_TIMECARDS, SEED_WEEKLY_INCIDENTS,
  SEED_EVALUATIONS, SEED_ASSIGNED_TASKS,
};
