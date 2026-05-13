// AquaOps — User accounts
// TODO: Move to Supabase auth when ready

const USERS = [
  // ── Level 3 — CEO / Consultant ──────────────────────────────────────────────
  { username:"jason_heckathorn", password:"AGPanama1", role:"ceo",        name:"Jason Heckathorn", initials:"JH",  assignedSystems: null },
  { username:"cameron_mcfarlane",password:"AGPanama1", role:"consultant",  name:"Cameron McFarlane",initials:"CM",  assignedSystems: null },

  // ── Level 2 — Supervisor ─────────────────────────────────────────────────────
  { username:"eduardo_valdes",   password:"AGPanama1", role:"supervisor",  name:"Eduardo Valdés",   initials:"EV",  assignedSystems: null },
  { username:"supervisor",       password:"AGPanama1", role:"supervisor",  name:"Supervisor (test)",initials:"EV",  assignedSystems: null }, // audit account

  // ── Level 1 — Vaqueros (real crew) ───────────────────────────────────────────
  { username:"hilario_migar",    password:"1234", role:"vaquero",     name:"Hilario Migar",    initials:"HM",  assignedSystems: null },
  { username:"jairo_lorenzo",    password:"1234", role:"vaquero",     name:"Jairo Lorenzo",    initials:"JL",  assignedSystems: null },
  { username:"charles_ebersole", password:"1234", role:"vaquero",     name:"Charles Ebersole", initials:"CE",  assignedSystems: null },
  { username:"rodolfo_viquez",   password:"1234", role:"capitan",     name:"Rodolfo Viquez",   initials:"RV",  assignedSystems: null },
  { username:"rodolfo_banard",   password:"1234", role:"vaquero",     name:"Rodolfo Banard",   initials:"RBM", assignedSystems: null },
  { username:"romelio_bekar",    password:"1234", role:"vaquero",     name:"Romelio Bekar",    initials:"RBC", assignedSystems: null },
  { username:"joel_valdes",      password:"1234", role:"capitan",     name:"Joel Valdés",      initials:"JV",  assignedSystems: null },
  { username:"luis_alvarado",    password:"1234", role:"vaquero",     name:"Luis Alvarado",    initials:"LA",  assignedSystems: null },

  // ── Audit / test accounts ─────────────────────────────────────────────────────
  { username:"test_vaquero",     password:"1234", role:"vaquero",     name:"Test Vaquero",     initials:"HM",  assignedSystems: null }, // sees HM's tasks
  { username:"test_supervisor",  password:"AGPanama1", role:"supervisor",  name:"Test Supervisor",  initials:"EV",  assignedSystems: null }, // sees supervisor view
  { username:"test_ceo",         password:"AGPanama1", role:"ceo",         name:"Test CEO",         initials:"JH",  assignedSystems: null }, // sees full L3 view
];

export { USERS };
