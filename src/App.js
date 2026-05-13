import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── REGIONS & POLYGONS ──────────────────────────────────────────────────────
const DEFAULT_REGIONS   = ["Bahía Azul","Cayo de Agua","Playa Roja","Isla de Tigre"];
const DEFAULT_TIPOS     = ["Canasta","Long Line","Sistema 75m","Linea","Comercial"];
const DEFAULT_MATERIALES= ["Tie-tie","Redes tubular","PVC","HDPE","Cuerda"];
const DEFAULT_SEMILLAS  = ["Brazil","Mixed","Bahía Azul","Yellow","Brown","Spinosum"];

// ─── SYSTEMS DATA (enriched with region, polygon, crew) ──────────────────────
const SYSTEMS_DATA = [
  // ─── EXISTING SYSTEMS — updated with calendario dates ────────────────────────
  // Fields added: tamano ("2x2m"|"2x3m"), categoria ("semillero"|"comercial"|"prueba"),
  //               fechaCosecha, fechaLimpieza
  { id:"P1",    region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"Empresa",      profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°07'34\" O 082°03'58\"", fechaInstalacion:"2025-12-29", capitan:"RV",  buceador:"HM", modulos:12, tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P2",    region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"Empresa",      profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°07'34\" O 082°03'58\"", fechaInstalacion:"2025-12-29", capitan:"RV",  buceador:"HM", modulos:12, tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P3",    region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"Empresa",      profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°07'34\" O 082°03'58\"", fechaInstalacion:"2025-12-29", capitan:"RV",  buceador:"JL", modulos:12, tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P4",    region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"Empresa",      profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°07'34\" O 082°03'58\"", fechaInstalacion:"2025-12-29", capitan:"RV",  buceador:"JL", modulos:12, tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P5-2",  region:"Cayo de Agua", poligono:1, pueblo:"Jobori",           tipo:"Long Line",  familia:"Eliazar",      profundidad:"50cm", materiales:"PVC",          semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°08'12\" O 082°04'10\"", fechaInstalacion:"2025-12-29", capitan:"RBM", buceador:"CE", modulos:8,  tamano:"2x3m", categoria:"comercial", fechaCosecha:null,         fechaLimpieza:"diaria", notas:"⚠ Sin fecha en calendario" },
  { id:"P5-3",  region:"Cayo de Agua", poligono:1, pueblo:"Jobori",           tipo:"Long Line",  familia:"Eliazar",      profundidad:"50cm", materiales:"PVC",          semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°08'12\" O 082°04'10\"", fechaInstalacion:"2025-12-29", capitan:"RBM", buceador:"CE", modulos:8,  tamano:"2x3m", categoria:"comercial", fechaCosecha:null,         fechaLimpieza:"diaria", notas:"⚠ Sin fecha en calendario" },
  { id:"P5-4",  region:"Cayo de Agua", poligono:1, pueblo:"Jobori",           tipo:"Long Line",  familia:"Eliazar",      profundidad:"50cm", materiales:"PVC",          semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°08'12\" O 082°04'10\"", fechaInstalacion:"2025-12-29", capitan:"RBM", buceador:"CE", modulos:8,  tamano:"2x3m", categoria:"comercial", fechaCosecha:null,         fechaLimpieza:"diaria", notas:"⚠ Sin fecha en calendario" },
  { id:"P5-5",  region:"Cayo de Agua", poligono:1, pueblo:"Jobori",           tipo:"Long Line",  familia:"Eliazar",      profundidad:"50cm", materiales:"PVC",          semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°08'12\" O 082°04'10\"", fechaInstalacion:"2025-12-29", capitan:"RBM", buceador:"CE", modulos:8,  tamano:"2x3m", categoria:"comercial", fechaCosecha:null,         fechaLimpieza:"diaria", notas:"⚠ Sin fecha en calendario" },
  { id:"P11",   region:"Bahía Azul",   poligono:1, pueblo:"Avispa",           tipo:"Long Line",  familia:"Nortizo",      profundidad:"40cm", materiales:"HDPE",         semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°06'55\" O 082°02'44\"", fechaInstalacion:"2025-12-03", capitan:"JV", buceador:"JL", modulos:6,  tamano:"2x3m", categoria:"comercial", fechaCosecha:null,         fechaLimpieza:"diaria", notas:"⚠ Sin fecha en calendario" },
  { id:"P12-1", region:"Bahía Azul",   poligono:2, pueblo:"Playa Verde",      tipo:"Canasta",    familia:"Empresa*",     profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°07'50\" O 082°03'20\"", fechaInstalacion:"2025-12-29", capitan:"RBC", buceador:"HM", modulos:10, tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-05-14", fechaLimpieza:"diaria", notas:"" },
  { id:"P12-2", region:"Bahía Azul",   poligono:2, pueblo:"Playa Verde",      tipo:"Canasta",    familia:"Empresa*",     profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°07'50\" O 082°03'20\"", fechaInstalacion:"2025-12-29", capitan:"RBC", buceador:"HM", modulos:10, tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-04-26", fechaLimpieza:"diaria", notas:"" },
  { id:"P13-1", region:"Playa Roja",   poligono:1, pueblo:"Tobobe",           tipo:"Canasta",    familia:"Empresa*",     profundidad:"35cm", materiales:"Tie-tie",      semillas:"Mixed",  estado:"Activo",   coordenadas:"N 09°05'30\" O 082°01'15\"", fechaInstalacion:"2025-12-29", capitan:"RBM", buceador:"CE", modulos:10, tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-05-15", fechaLimpieza:"diaria", notas:"" },
  { id:"P13-2", region:"Playa Roja",   poligono:1, pueblo:"Tobobe",           tipo:"Canasta",    familia:"Empresa*",     profundidad:"35cm", materiales:"Tie-tie",      semillas:"Mixed",  estado:"Activo",   coordenadas:"N 09°05'30\" O 082°01'15\"", fechaInstalacion:"2025-12-29", capitan:"RBM", buceador:"CE", modulos:10, tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-21", fechaLimpieza:"diaria", notas:"" },
  { id:"P14",   region:"Playa Roja",   poligono:1, pueblo:"Gallinazo",        tipo:"Canasta",    familia:"P Celestino*", profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°04'22\" O 082°00'38\"", fechaInstalacion:"2025-12-12", capitan:"RBC", buceador:"JL", modulos:8,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-04-06", fechaLimpieza:"diaria", notas:"" },
  { id:"P15-1", region:"Bahía Azul",   poligono:3, pueblo:"Ensenada",         tipo:"Canasta",    familia:"Eurelia*",     profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°09'10\" O 082°05'02\"", fechaInstalacion:"2025-12-29", capitan:"JV",  buceador:"HM", modulos:8,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-28", fechaLimpieza:"diaria", notas:"" },
  { id:"P16-1", region:"Bahía Azul",   poligono:3, pueblo:"Igle. Apostólica", tipo:"Canasta",    familia:"P Demetrio",   profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°10'05\" O 082°05'55\"", fechaInstalacion:"2025-12-29", capitan:"JV",  buceador:"HM", modulos:8,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-04-26", fechaLimpieza:"diaria", notas:"" },
  { id:"P17",   region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"Empresa",      profundidad:"30cm", materiales:"Tie-tie",      semillas:"Brazil", estado:"Activo",   coordenadas:"N 09°07'34\" O 082°03'58\"", fechaInstalacion:"2025-12-29", capitan:"RV",  buceador:"JL", modulos:12, tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },

  // ─── NEW COMMERCIAL SYSTEMS — from Calendario ────────────────────────────────
  { id:"P18",   region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P19",   region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P20",   region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P21",   region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P22",   region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P23",   region:"Cayo de Agua", poligono:2, pueblo:"Cayo de Agua",     tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-03-31", fechaLimpieza:"diaria", notas:"" },
  { id:"P12-3", region:"Bahía Azul",   poligono:2, pueblo:"Playa Verde",      tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-04-27", fechaLimpieza:"diaria", notas:"" },
  { id:"P12-4", region:"Bahía Azul",   poligono:2, pueblo:"Playa Verde",      tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-04-27", fechaLimpieza:"diaria", notas:"" },
  { id:"P12-5", region:"Bahía Azul",   poligono:2, pueblo:"Playa Verde",      tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-05-17", fechaLimpieza:"diaria", notas:"" },
  { id:"P13-3", region:"Playa Roja",   poligono:1, pueblo:"Tobobe",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-05-15", fechaLimpieza:"diaria", notas:"" },
  { id:"P16-2", region:"Bahía Azul",   poligono:3, pueblo:"Igle. Apostólica", tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-04-26", fechaLimpieza:"diaria", notas:"" },
  { id:"P16-3", region:"Bahía Azul",   poligono:3, pueblo:"Igle. Apostólica", tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-05-02", fechaLimpieza:"diaria", notas:"" },
  { id:"P72",   region:"Bahía Azul",   poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-05-14", fechaLimpieza:"diaria", notas:"" },
  { id:"P73",   region:"Bahía Azul",   poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-05-14", fechaLimpieza:"diaria", notas:"" },
  { id:"P74",   region:"Bahía Azul",   poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-05-14", fechaLimpieza:"diaria", notas:"" },
  { id:"P75",   region:"Bahía Azul",   poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:0,  tamano:"2x3m", categoria:"comercial", fechaCosecha:"2026-05-14", fechaLimpieza:"diaria", notas:"" },

  // ─── PRUEBA / SEMILLERO MODULES — 2x2m, 45-day cycle ────────────────────────
  { id:"P26-1",  region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"Redes tubular",semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-23", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-2",  region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"Redes tubular",semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-23", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-3",  region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"Redes tubular",semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-23", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-4",  region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"Redes tubular",semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-27", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-5",  region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"Redes tubular",semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-03-16", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-6",  region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"Redes tubular",semillas:"",       estado:"Retirado", coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-11", fechaLimpieza:"diaria", notas:"Retirado por alta infección de Epifitas" },
  { id:"P26-7",  region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"Redes tubular",semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-11", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-8",  region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"Redes tubular",semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-23", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-9",  region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-23", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-10", region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-23", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-11", region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-27", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-12", region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-27", fechaLimpieza:"diaria", notas:"" },
  { id:"P26-13", region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"Bahía Azul", estado:"Activo", coordenadas:"", fechaInstalacion:"", capitan:"JV",   buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-05-08", fechaLimpieza:"diaria", notas:"Origen Bahía Azul — inicia etapa 45 días" },
  { id:"P26-14", region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"Bahía Azul", estado:"Activo", coordenadas:"", fechaInstalacion:"", capitan:"JV",   buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-05-08", fechaLimpieza:"diaria", notas:"Origen Bahía Azul — inicia etapa 45 días" },
  { id:"P26-15", region:"Bahía Azul",  poligono:1, pueblo:"Avispa",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"Bahía Azul", estado:"Activo", coordenadas:"", fechaInstalacion:"", capitan:"JV",   buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-05-08", fechaLimpieza:"diaria", notas:"Origen Bahía Azul — inicia etapa 45 días" },
  { id:"P36-1",  region:"Playa Roja",  poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"RBC",    buceador:"CE",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-25", fechaLimpieza:"diaria", notas:"" },
  { id:"P36-2",  region:"Playa Roja",  poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"RBC",    buceador:"CE",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-25", fechaLimpieza:"diaria", notas:"" },
  { id:"P39-1",  region:"Playa Roja",  poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"RBC",    buceador:"CE",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-25", fechaLimpieza:"diaria", notas:"" },
  { id:"P47-1",  region:"Bahía Azul",  poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-04-26", fechaLimpieza:"diaria", notas:"" },
  { id:"P63-1",  region:"Bahía Azul",  poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-05-03", fechaLimpieza:"diaria", notas:"" },
  { id:"P64-1",  region:"Bahía Azul",  poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-05-03", fechaLimpieza:"diaria", notas:"" },
  { id:"P65-1",  region:"Bahía Azul",  poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-05-10", fechaLimpieza:"diaria", notas:"" },
  { id:"P70-1",  region:"Bahía Azul",  poligono:1, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"JV",    buceador:"",   modulos:1,  tamano:"2x2m", categoria:"semillero", fechaCosecha:"2026-05-10", fechaLimpieza:"diaria", notas:"" },

  // ─── SYSTEMS FLAGGED — no dates, needs Eduardo update ────────────────────────
  { id:"P7",    region:"",             poligono:0, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"", categoria:"", fechaCosecha:null, fechaLimpieza:null, notas:"⚠ Sin datos — Eduardo debe actualizar" },
  { id:"P9-1",  region:"",             poligono:0, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"", categoria:"", fechaCosecha:null, fechaLimpieza:null, notas:"⚠ Sin datos — Eduardo debe actualizar" },
  { id:"P24",   region:"",             poligono:0, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"", categoria:"", fechaCosecha:null, fechaLimpieza:null, notas:"⚠ Sin datos — Eduardo debe actualizar" },
  { id:"P25",   region:"",             poligono:0, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"", categoria:"", fechaCosecha:null, fechaLimpieza:null, notas:"⚠ Sin datos — Eduardo debe actualizar" },
  { id:"P27",   region:"",             poligono:0, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"", categoria:"", fechaCosecha:null, fechaLimpieza:null, notas:"⚠ Sin datos — Eduardo debe actualizar" },
  { id:"P28",   region:"",             poligono:0, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"", categoria:"", fechaCosecha:null, fechaLimpieza:null, notas:"⚠ Sin datos — Eduardo debe actualizar" },
  { id:"P29",   region:"",             poligono:0, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"", categoria:"", fechaCosecha:null, fechaLimpieza:null, notas:"⚠ Sin datos — Eduardo debe actualizar" },
  { id:"P30",   region:"",             poligono:0, pueblo:"",                 tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"", capitan:"",    buceador:"",   modulos:0,  tamano:"", categoria:"", fechaCosecha:null, fechaLimpieza:null, notas:"⚠ Sin datos — Eduardo debe actualizar" },
  // ─── NEW SYSTEMS — added from beta test ──────────────────────────────────────
  { id:"P13-4", region:"Playa Roja",   poligono:1, pueblo:"Tobobe",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"2026-04-01", capitan:"RBM", buceador:"CE", modulos:0, tamano:"2x3m", categoria:"comercial", fechaCosecha:null, fechaLimpieza:"diaria", notas:"⚠ Nuevo sistema — actualizar datos con Eduardo" },
  { id:"P13-5", region:"Playa Roja",   poligono:1, pueblo:"Tobobe",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"2026-04-01", capitan:"RBM", buceador:"CE", modulos:0, tamano:"2x3m", categoria:"comercial", fechaCosecha:null, fechaLimpieza:"diaria", notas:"⚠ Nuevo sistema — actualizar datos con Eduardo" },
  { id:"P13-6", region:"Playa Roja",   poligono:1, pueblo:"Tobobe",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"2026-04-01", capitan:"RBM", buceador:"CE", modulos:0, tamano:"2x3m", categoria:"comercial", fechaCosecha:null, fechaLimpieza:"diaria", notas:"⚠ Nuevo sistema — actualizar datos con Eduardo" },
  { id:"P13-7", region:"Playa Roja",   poligono:1, pueblo:"Tobobe",           tipo:"Canasta",    familia:"",             profundidad:"",     materiales:"",             semillas:"",       estado:"Activo",   coordenadas:"", fechaInstalacion:"2026-04-01", capitan:"RBM", buceador:"CE", modulos:0, tamano:"2x3m", categoria:"comercial", fechaCosecha:null, fechaLimpieza:"diaria", notas:"⚠ Nuevo sistema — actualizar datos con Eduardo" },
];

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
  { initials:"HM", name:"Hilario Migar",   role:"Buceador", username:"hilario_migar" },
  { initials:"JL", name:"Jairo Lorenzo",   role:"Buceador", username:"jairo_lorenzo" },
  { initials:"CE", name:"Charles Ebersole",role:"Buceador", username:"charles_ebersole" },
  { initials:"RV", name:"Rodolfo Viquez",  role:"Capitán",  username:"rodolfo_viquez" },
  { initials:"RBM",name:"Rodolfo Banard",  role:"Capitán",  username:"rodolfo_banard" },
  { initials:"RBC",name:"Romelio Bekar",   role:"Capitán",  username:"romelio_bekar" },
  { initials:"JV", name:"Joel Valdés",     role:"Capitán",   username:"joel_valdes" },
  { initials:"LA", name:"Luis A.",         role:"Colaborador",username:"luis_a" },
  { initials:"EV", name:"Eduardo Valdés",  role:"Supervisor",username:"supervisor" },
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

const TOTAL_PTS = { HM:10, JL:10, CE:13, RV:11, RBM:11, RBC:11, JV:14, EV:18, LA:13 };

// Seeded from Excel Q1 actuals — Hilario is the only one with real Resultados data
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

const T = {
  en: {
    appName:"AquaOps",
    tagline:"Seaweed Harvest Tracker",
    today:"Today's Dashboard",
    systems:"Systems",
    newEntry:"New Entry",
    login:"Sign In",
    logout:"Sign Out",
    role:"Role",
    totalWeight:"Total Weight",
    activeSystems:"Active Systems",
    alerts:"Alerts",
    avgGrowth:"Avg Growth",
    system:"System",
    village:"Village",
    type:"Type",
    family:"Family",
    status:"Status",
    active:"Active",
    retired:"Retired",
    weight:"Weight (g)",
    salt:"Salt %",
    ph:"pH",
    temp:"Temp °C",
    salinidad:"Salinity",
    water:"Water",
    conditions:"Conditions",
    date:"Date",
    notes:"Notes",
    photo:"Photo",
    save:"Save Entry",
    cancel:"Cancel",
    growth:"Growth",
    sembrado:"Planted (g)",
    detail:"View Detail",
    lastReading:"Last Reading",
    noData:"No data yet",
    syncPending:"Pending sync",
    synced:"Synced",
    alertHigh:"HIGH",
    alertLow:"LOW",
    ok:"OK",
    search:"Search systems...",
    filterAll:"All",
    filterCanasta:"Basket",
    filterLongLine:"Long Line",
    selectSystem:"Select System",
    enterWeight:"Enter weight in grams",
    enterSalt:"Salt percentage (e.g. 2.5)",
    enterPh:"pH value (e.g. 9.2)",
    enterTemp:"Temperature in °C",
    takePhoto:"Take Photo",
    weeklyGrowth:"Weekly Growth",
    totalHarvested:"Total Harvested",
    supervisor:"Supervisor",
    vaquero:"Vaquero",
    ceo:"CEO",
    consultant:"Consultant",
    bonos:"Bonuses",
    eval:"Eval",
    password:"Password",
    username:"Username",
    welcome:"Welcome back",
    depth:"Depth",
    materials:"Materials",
    seeds:"Seeds",
    coords:"Coordinates",
    purpose:"Purpose",
    history:"History",
    back:"Back",
    addSystem:"Add System",
    editSystem:"Edit System",
    deleteReading:"Delete Reading",
    confirmDelete:"Confirm delete?",
    yes:"Yes",
    no:"No",
    allSystems:"All Systems",
    quickLog:"Quick Log",
    quickLogSub:"Weight + photo only",
    fullEntry:"Full Entry",
    fullEntrySub:"All measurements",
    incomplete:"Incomplete",
    needsReview:"Needs supervisor review",
    todayChecklist:"Today's Checklist",
    logged:"Logged ✓",
    notLogged:"Not logged",
    completeEntry:"Complete Entry",
    incompleteEntries:"Incomplete Entries",
    mySystemsToday:"My Systems Today",
    tapToLog:"Tap to log",
    loggedToday:"Logged today",
    pendingReview:"Pending review",
    completeNow:"Complete Now",
    healthy:"Healthy",
    excellent:"Excellent",
    sick:"Sick",
  },
  es: {
    appName:"AquaOps",
    tagline:"Rastreador de Cosecha de Algas",
    today:"Panel de Hoy",
    systems:"Sistemas",
    newEntry:"Nueva Entrada",
    login:"Iniciar Sesión",
    logout:"Cerrar Sesión",
    role:"Rol",
    totalWeight:"Peso Total",
    activeSystems:"Sistemas Activos",
    alerts:"Alertas",
    avgGrowth:"Crecimiento Promedio",
    system:"Sistema",
    village:"Pueblo",
    type:"Tipo",
    family:"Familia",
    status:"Estado",
    active:"Activo",
    retired:"Retirado",
    weight:"Peso (g)",
    salt:"Sal %",
    ph:"pH",
    temp:"Temp °C",
    salinidad:"Salinidad",
    water:"Aguas",
    conditions:"Condiciones",
    date:"Fecha",
    notes:"Notas",
    photo:"Foto",
    save:"Guardar",
    cancel:"Cancelar",
    growth:"Crecimiento",
    sembrado:"Sembrado (g)",
    detail:"Ver Detalle",
    lastReading:"Última Lectura",
    noData:"Sin datos",
    syncPending:"Pendiente",
    synced:"Sincronizado",
    alertHigh:"ALTO",
    alertLow:"BAJO",
    ok:"OK",
    search:"Buscar sistemas...",
    filterAll:"Todos",
    filterCanasta:"Canasta",
    filterLongLine:"Long Line",
    selectSystem:"Seleccionar Sistema",
    enterWeight:"Peso en gramos",
    enterSalt:"Porcentaje de sal (ej. 2.5)",
    enterPh:"Valor de pH (ej. 9.2)",
    enterTemp:"Temperatura en °C",
    takePhoto:"Tomar Foto",
    weeklyGrowth:"Crecimiento Semanal",
    totalHarvested:"Total Cosechado",
    supervisor:"Supervisor",
    vaquero:"Vaquero",
    ceo:"CEO",
    consultant:"Consultor",
    bonos:"Bonos",
    eval:"Eval",
    password:"Contraseña",
    username:"Usuario",
    welcome:"Bienvenido",
    depth:"Profundidad",
    materials:"Materiales",
    seeds:"Semillas",
    coords:"Coordenadas",
    purpose:"Propósito",
    history:"Historial",
    back:"Atrás",
    addSystem:"Agregar Sistema",
    editSystem:"Editar Sistema",
    deleteReading:"Eliminar Lectura",
    confirmDelete:"¿Confirmar eliminación?",
    yes:"Sí",
    no:"No",
    allSystems:"Todos los Sistemas",
    clearWater:"Claras",
    cloudyWater:"Turbia",
    transparentWater:"Transparente",
    healthy:"Saludables",
    excellent:"Excelente",
    sick:"Enfermo",
    quickLog:"Registro Rápido",
    quickLogSub:"Solo peso + foto",
    fullEntry:"Entrada Completa",
    fullEntrySub:"Todas las medidas",
    incomplete:"Incompleto",
    needsReview:"Requiere revisión del supervisor",
    todayChecklist:"Lista de Hoy",
    logged:"Registrado ✓",
    notLogged:"Sin registrar",
    completeEntry:"Completar Entrada",
    incompleteEntries:"Entradas Incompletas",
    mySystemsToday:"Mis Sistemas Hoy",
    tapToLog:"Toca para registrar",
    loggedToday:"Registrado hoy",
    pendingReview:"Pendiente de revisión",
    completeNow:"Completar Ahora",
  }
};

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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getAlert(val, key) {
  if (val == null) return null;
  if (val < THRESHOLDS[key].min) return "low";
  if (val > THRESHOLDS[key].max) return "high";
  return "ok";
}

function getLatestReading(readings, systemId) {
  return readings.filter(r => r.sistema === systemId).sort((a,b) => new Date(b.fecha) - new Date(a.fecha))[0] || null;
}

function calcGrowth(readings, systemId) {
  const sys = readings.filter(r => r.sistema === systemId && r.peso).sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  if (sys.length < 2) return null;
  const first = sys[0].sembrado || sys[0].peso;
  const last = sys[sys.length-1].peso;
  return Math.round(((last - first) / first) * 100);
}

// ─── BONUS SCORING HELPERS ───────────────────────────────────────────────────
function calcTaskScore(taskLogs, initials) {
  // For each task type, sum objetivo and actual across all logs where this person participated
  let weightedSum = 0;
  let totalWeight = 0;
  TASK_TYPES.forEach(tt => {
    const relevant = taskLogs.filter(l =>
      l.taskId === tt.id &&
      (l.initials === initials || l.initials2 === initials) &&
      l.confirmed
    );
    if (relevant.length === 0) return;
    const obj = relevant.reduce((s,l) => s + (l.objetivo||0), 0);
    const act = relevant.reduce((s,l) => s + (l.actual||0), 0);
    if (obj === 0) return;
    const rate = Math.min(act / obj, 1.0);
    weightedSum += rate * tt.weight;
    totalWeight += tt.weight;
  });
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

function calcProfScore(profScores, initials, month) {
  const record = profScores.find(p => p.initials === initials && p.month === month);
  if (!record) return null;
  let total = 0;
  PROF_CATEGORIES.forEach(cat => {
    const raw = record[cat.id] || 0; // 1–5 scale
    total += (raw / 5) * cat.weight;
  });
  return total; // 0–1
}

function calcTotalScore(taskScore, profScore) {
  if (taskScore === null && profScore === null) return null;
  const t = taskScore ?? 0;
  const p = profScore ?? 0;
  return t * SCORE_WEIGHTS.tasks + p * SCORE_WEIGHTS.prof;
}

function calcBonusShare(crewScores, poolAmount) {
  // Formula: Employee Total × Score ÷ SUMPRODUCT(all Score) × Pool
  const validScores = crewScores.filter(c => c.totalScore !== null);
  const sumScores = validScores.reduce((s,c) => s + (c.totalScore||0), 0);
  if (sumScores === 0) return crewScores.map(c => ({ ...c, bonusShare: 0 }));
  return crewScores.map(c => ({
    ...c,
    bonusShare: c.totalScore !== null ? (c.totalScore / sumScores) * poolAmount : 0,
  }));
}

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
};

const CONDICION_EMOJIS = [
  { emoji:"✅", label:"Bien",       labelEn:"Good",    value:"bien"        },
  { emoji:"⚠️", label:"Regular",    labelEn:"Fair",    value:"regular"     },
  { emoji:"❌", label:"Problema",   labelEn:"Problem", value:"problema"    },
  { emoji:"🌊", label:"Agua turbia",labelEn:"Turbid",  value:"turbid"      },
  { emoji:"🌿", label:"Alga sana",  labelEn:"Healthy", value:"healthy"     },
  { emoji:"🦠", label:"Contam.",    labelEn:"Contam.", value:"contaminado" },
];

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
];

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size=20, color="currentColor" }) => {
  const icons = {
    wave:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M2 12s2-4 5-4 5 4 7 4 5-4 7-4"/><path d="M2 18s2-4 5-4 5 4 7 4 5-4 7-4" opacity=".4"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    plus:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    bell:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    camera:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    back:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    alert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    user:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    map:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    grid:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    calendar:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    star:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    location:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    sync:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    logout:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    rrhh:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    mic:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    task:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    scale: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>,
  };
  return icons[name] || null;
};

// ─── SHARED STYLE HELPERS ────────────────────────────────────────────────────
const S = {
  card:    { background:"rgba(15,23,42,.8)", border:"1px solid rgba(148,163,184,.08)", borderRadius:14, padding:14, marginBottom:10 },
  input:   { width:"100%", padding:"11px 13px", borderRadius:10, border:"1px solid rgba(148,163,184,.12)", background:"rgba(15,23,42,.8)", color:"#e2e8f0", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  label:   { fontSize:10, color:"#64748b", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 },
  btn:     (active) => ({ width:"100%", padding:15, borderRadius:12, border:"none", background:active?"linear-gradient(135deg,#0d9488,#0f766e)":"rgba(13,148,136,.12)", color:active?"#fff":"#334155", fontWeight:800, fontSize:15, cursor:active?"pointer":"not-allowed", transition:"all .2s" }),
  scoreBar:(v,color="#0d9488")=>(
    <div style={{height:5,borderRadius:3,background:"#1e293b",overflow:"hidden",marginTop:4}}>
      <div style={{height:"100%",width:`${Math.min((v||0)*100,100)}%`,background:color,borderRadius:3,transition:"width .4s"}}/>
    </div>
  ),
};

// ─── SPARKLINE ───────────────────────────────────────────────────────────────
function Sparkline({ data, color="#4ade80", height=40, width=100 }) {
  if (!data || data.length < 2) return <div style={{height,width,opacity:.3,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>–</div>;
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/range)*(height-6)-3}`).join(" ");
  const last=pts.split(" ").pop().split(",");
  return <svg width={width} height={height} style={{overflow:"visible"}}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx={last[0]} cy={last[1]} r="3" fill={color}/></svg>;
}

// ─── VOICE NOTE RECORDER ─────────────────────────────────────────────────────
function VoiceNoteButton({ voiceNote, onVoiceNote, lang }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds]     = useState(0);
  const [playing, setPlaying]     = useState(false);
  const mediaRef  = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);
  const audioRef  = useRef(null);
  const MAX = 20;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => { const url=URL.createObjectURL(new Blob(chunksRef.current,{type:"audio/webm"})); onVoiceNote(url); stream.getTracks().forEach(t=>t.stop()); };
      mr.start(); mediaRef.current = mr; setRecording(true); setSeconds(0);
      timerRef.current = setInterval(()=>setSeconds(s=>{ if(s>=MAX-1){stop();return MAX;} return s+1; }),1000);
    } catch { alert(lang==="es"?"Micrófono no disponible":"Microphone not available"); }
  };
  const stop = () => { clearInterval(timerRef.current); if(mediaRef.current?.state!=="inactive") mediaRef.current?.stop(); setRecording(false); };
  const play = () => { if(!voiceNote)return; if(audioRef.current){audioRef.current.pause();audioRef.current=null;setPlaying(false);return;} const a=new Audio(voiceNote); audioRef.current=a; setPlaying(true); a.onended=()=>{setPlaying(false);audioRef.current=null;}; a.play(); };
  const del  = () => { onVoiceNote(null); setPlaying(false); audioRef.current?.pause(); audioRef.current=null; };

  if (voiceNote) return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:"1px solid rgba(74,222,128,.25)",background:"rgba(74,222,128,.05)"}}>
      <button onClick={play} style={{width:40,height:40,borderRadius:10,border:"none",background:"rgba(74,222,128,.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {playing
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#4ade80"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="#4ade80"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
      </button>
      <span style={{flex:1,fontSize:13,fontWeight:700,color:"#4ade80"}}>{lang==="es"?"Nota grabada ✓":"Note recorded ✓"}</span>
      <button onClick={del} style={{width:32,height:32,borderRadius:8,border:"none",background:"rgba(248,113,113,.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );

  return (
    <button onPointerDown={start} onPointerUp={stop} onPointerLeave={stop}
      style={{width:"100%",padding:16,borderRadius:12,border:`2px solid ${recording?"#f87171":"rgba(13,148,136,.25)"}`,background:recording?"rgba(248,113,113,.06)":"rgba(13,148,136,.04)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <Icon name="mic" size={28} color={recording?"#f87171":"#0d9488"}/>
      {recording ? (
        <div style={{width:"100%"}}>
          <div style={{height:4,borderRadius:2,background:"rgba(248,113,113,.2)",overflow:"hidden",marginBottom:4}}>
            <div style={{height:"100%",width:`${(seconds/MAX)*100}%`,background:"#f87171",borderRadius:2,transition:"width .9s linear"}}/>
          </div>
          <span style={{fontSize:13,fontWeight:700,color:"#f87171"}}>{lang==="es"?"Grabando...":"Recording..."} {MAX-seconds}s</span>
        </div>
      ) : <span style={{fontSize:12,color:"#64748b"}}>{lang==="es"?"Mantén para grabar":"Hold to record"} · máx {MAX}s</span>}
    </button>
  );
}

// ─── CONDITION PICKER ────────────────────────────────────────────────────────
function CondicionPicker({ value, onChange, lang }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {CONDICION_EMOJIS.map(c=>(
        <button key={c.value} onClick={()=>onChange(value===c.value?"":c.value)}
          style={{padding:"10px 4px",borderRadius:12,border:`1.5px solid ${value===c.value?"#0d9488":"rgba(148,163,184,.1)"}`,background:value===c.value?"rgba(13,148,136,.12)":"rgba(255,255,255,.02)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <span style={{fontSize:24,lineHeight:1}}>{c.emoji}</span>
          <span style={{fontSize:10,fontWeight:700,color:value===c.value?"#0d9488":"#64748b"}}>{lang==="es"?c.label:c.labelEn}</span>
        </button>
      ))}
    </div>
  );
}

// ─── AUTH SHELL ───────────────────────────────────────────────────────────────
const AUTH_ISTYLE = { width:"100%", padding:"13px 14px", borderRadius:12, border:"1px solid rgba(148,163,184,.15)", background:"rgba(30,41,59,.7)", color:"#e2e8f0", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
const AUTH_LSTYLE = { fontSize:11, color:"#64748b", fontWeight:700, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.6 };

function AuthShell({ lang, setLang, children }) {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#021c1e 0%,#032d30 55%,#054040 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,pointerEvents:"none"}}>
        {[0,1,2,3].map(i=><div key={i} style={{position:"absolute",bottom:i*24,left:`${-10+i*5}%`,right:`${-10+i*5}%`,height:80,borderRadius:"60% 60% 0 0",background:`rgba(13,148,136,${0.03+i*0.015})`,transform:`scaleX(${1.1-i*0.05})`}}/>)}
      </div>
      <div style={{position:"absolute",top:16,right:16,display:"flex",gap:6,zIndex:10}}>
        {["es","en"].map(l=>(
          <button key={l} onClick={()=>setLang(l)} style={{padding:"5px 13px",borderRadius:20,border:`1px solid ${lang===l?"#0d9488":"rgba(148,163,184,.15)"}`,cursor:"pointer",fontWeight:700,fontSize:11,background:lang===l?"rgba(13,148,136,.2)":"transparent",color:lang===l?"#0d9488":"#475569"}}>
            {l==="es"?"🇵🇦 ES":"🇺🇸 EN"}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, lang, setLang }) {
  const [screen, setScreen]     = useState("home");
  const [un, setUn]             = useState("");
  const [pw, setPw]             = useState("");
  const [err, setErr]           = useState("");
  const [primerNombre, setPrimerNombre]   = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [apellido, setApellido]           = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [cedula, setCedula]     = useState("");
  const [noCedula, setNoCedula] = useState(false);
  const [regErr, setRegErr]     = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = () => {
    const u = USERS.find(u=>u.username===un && u.password===pw);
    if(u){setErr("");onLogin(u);}
    else setErr(lang==="es"?"Usuario o contraseña incorrectos":"Invalid username or password");
  };

  const handleRegister = () => {
    if(!primerNombre||!apellido||!fechaNacimiento){setRegErr(lang==="es"?"Completa los campos requeridos":"Fill in required fields");return;}
    setRegErr("");setRegSuccess(true);
  };

  const resetReg = ()=>{setPrimerNombre("");setSegundoNombre("");setApellido("");setFechaNacimiento("");setCedula("");setNoCedula(false);setRegErr("");setRegSuccess(false);};

  if(screen==="home") return (
    <AuthShell lang={lang} setLang={setLang}>
      <div style={{textAlign:"center",marginBottom:28,zIndex:1}}>
        <div style={{width:96,height:96,borderRadius:22,overflow:"hidden",background:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",boxShadow:"0 0 36px rgba(13,148,136,.45),0 0 0 1px rgba(13,148,136,.15)"}}>
          <img src="data:image/jpeg;base64,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" alt="Algas Panameñas" style={{width:86,height:86,objectFit:"contain"}}/>
        </div>
        <h1 style={{color:"#f0fdfa",fontSize:26,fontWeight:900,margin:0}}>AquaOps</h1>
        <p style={{color:"#2dd4bf",fontSize:13,margin:"6px 0 0",fontWeight:600}}>{lang==="es"?"Tus sistemas. Tu impacto.":"Your systems. Your impact."}</p>
      </div>
      <div style={{width:"100%",maxWidth:360,marginBottom:24,zIndex:1}}>
        {[["🌅",lang==="es"?"Marcar entrada":"Check in — start your shift"],["🎯",lang==="es"?"Misión del día":"Your daily mission — tasks & harvest"],["📈",lang==="es"?"Seguir el crecimiento":"Track growth — your systems, live"],["✅",lang==="es"?"Marcar salida":"Check out — close the day"]].map(([e,t],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid rgba(148,163,184,.05)"}}>
            <span style={{fontSize:18,width:28,textAlign:"center",flexShrink:0}}>{e}</span>
            <span style={{fontSize:13,color:"#cbd5e1"}}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:10,zIndex:1}}>
        <button onClick={()=>setScreen("signin")} style={{width:"100%",padding:16,borderRadius:14,border:"none",background:"linear-gradient(135deg,#0d9488,#0f766e)",color:"#fff",fontWeight:800,fontSize:16,cursor:"pointer",boxShadow:"0 0 30px rgba(13,148,136,.35)"}}>
          {lang==="es"?"Iniciar Sesión":"Sign In"}
        </button>
        <button onClick={()=>setScreen("register")} style={{width:"100%",padding:16,borderRadius:14,border:"1.5px solid rgba(13,148,136,.3)",background:"rgba(13,148,136,.05)",color:"#2dd4bf",fontWeight:800,fontSize:16,cursor:"pointer"}}>
          {lang==="es"?"Registrarse":"Register"}
        </button>
      </div>
    </AuthShell>
  );

  if(screen==="signin") return (
    <AuthShell lang={lang} setLang={setLang}>
      <div style={{width:"100%",maxWidth:360,zIndex:1}}>
        <button onClick={()=>{setScreen("home");setErr("");}} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#0d9488",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:18,padding:0}}>
          <Icon name="back" size={16} color="#0d9488"/>{lang==="es"?"Volver":"Back"}
        </button>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{width:52,height:52,borderRadius:14,overflow:"hidden",background:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",boxShadow:"0 0 20px rgba(13,148,136,.3)"}}>
            <img src="data:image/jpeg;base64,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" alt="logo" style={{width:46,height:46,objectFit:"contain"}}/>
          </div>
          <h2 style={{color:"#f1f5f9",fontSize:20,fontWeight:800,margin:0}}>{lang==="es"?"Bienvenido":"Welcome back"}</h2>
        </div>
        <div style={{background:"rgba(15,23,42,.85)",border:"1px solid rgba(148,163,184,.1)",borderRadius:18,padding:22}}>
          <div style={{marginBottom:14}}>
            <label style={AUTH_LSTYLE}>{lang==="es"?"Usuario":"Username"}</label>
            <input value={un} onChange={e=>setUn(e.target.value)} placeholder="primer_apellido" style={AUTH_ISTYLE} autoCapitalize="none" autoCorrect="off" spellCheck={false}/>
          </div>
          <div>
            <label style={AUTH_LSTYLE}>{lang==="es"?"Contraseña":"Password"}</label>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={AUTH_ISTYLE} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          {err&&<div style={{display:"flex",alignItems:"center",gap:6,color:"#f87171",fontSize:12,marginTop:10,padding:"7px 10px",borderRadius:8,background:"rgba(248,113,113,.08)"}}><Icon name="alert" size={13} color="#f87171"/>{err}</div>}
          <button onClick={handleLogin} style={{width:"100%",padding:14,borderRadius:11,border:"none",background:"linear-gradient(135deg,#0d9488,#0f766e)",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",marginTop:14}}>
            {lang==="es"?"Entrar":"Sign In"}
          </button>
          <div style={{marginTop:12,padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,.03)",border:"1px solid rgba(148,163,184,.08)"}}>
            <p style={{fontSize:10,color:"#475569",margin:"0 0 4px",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>Cuentas de prueba · All passwords: AGPanama1</p>
            <p style={{fontSize:10,color:"#334155",margin:0,lineHeight:1.6}}>
              test_vaquero · test_supervisor · test_ceo<br/>
              hilario_migar · eduardo_valdes · cameron_mcfarlane
            </p>
          </div>
        </div>
        <p style={{textAlign:"center",color:"#334155",fontSize:11,marginTop:12}}>
          {lang==="es"?"¿No tienes cuenta? ":"No account? "}
          <span onClick={()=>setScreen("register")} style={{color:"#0d9488",cursor:"pointer",fontWeight:700}}>{lang==="es"?"Regístrate":"Register"}</span>
        </p>
      </div>
    </AuthShell>
  );

  if(regSuccess) return (
    <AuthShell lang={lang} setLang={setLang}>
      <div style={{textAlign:"center",zIndex:1,padding:"0 24px"}}>
        <div style={{width:72,height:72,borderRadius:22,background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
          <Icon name="check" size={36} color="#4ade80"/>
        </div>
        <h2 style={{color:"#4ade80",fontSize:22,fontWeight:800,margin:"0 0 8px"}}>{lang==="es"?"¡Solicitud enviada!":"Request submitted!"}</h2>
        <p style={{color:"#94a3b8",fontSize:14,lineHeight:1.6,margin:"0 0 22px"}}>{lang==="es"?`Hola ${primerNombre}, Eduardo aprobará tu acceso antes del primer turno.`:`Hi ${primerNombre}, Eduardo will approve your access before your first shift.`}</p>
        <button onClick={()=>{resetReg();setScreen("signin");}} style={{padding:"12px 28px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#0d9488,#0f766e)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          {lang==="es"?"Ir a Iniciar Sesión":"Go to Sign In"}
        </button>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell lang={lang} setLang={setLang}>
      <div style={{width:"100%",maxWidth:360,zIndex:1}}>
        <button onClick={()=>{setScreen("home");setRegErr("");}} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#0d9488",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:14,padding:0}}>
          <Icon name="back" size={16} color="#0d9488"/>{lang==="es"?"Volver":"Back"}
        </button>
        <div style={{textAlign:"center",marginBottom:16}}>
          <h2 style={{color:"#f1f5f9",fontSize:20,fontWeight:800,margin:0}}>{lang==="es"?"Crear cuenta":"Create account"}</h2>
        </div>
        <div style={{background:"rgba(15,23,42,.85)",border:"1px solid rgba(148,163,184,.1)",borderRadius:18,padding:20,display:"flex",flexDirection:"column",gap:12}}>
          <div><label style={AUTH_LSTYLE}>{lang==="es"?"Primer Nombre":"First Name"} <span style={{color:"#f87171"}}>*</span></label><input value={primerNombre} onChange={e=>setPrimerNombre(e.target.value)} placeholder="ej. Carlos" style={AUTH_ISTYLE} autoCapitalize="words"/></div>
          <div><label style={AUTH_LSTYLE}>{lang==="es"?"Segundo Nombre":"Middle Name"} <span style={{color:"#475569",fontWeight:400,fontSize:9}}>(opcional)</span></label><input value={segundoNombre} onChange={e=>setSegundoNombre(e.target.value)} placeholder="ej. Antonio" style={AUTH_ISTYLE} autoCapitalize="words"/></div>
          <div><label style={AUTH_LSTYLE}>{lang==="es"?"Apellido":"Last Name"} <span style={{color:"#f87171"}}>*</span></label><input value={apellido} onChange={e=>setApellido(e.target.value)} placeholder="ej. González" style={AUTH_ISTYLE} autoCapitalize="words"/></div>
          <div><label style={AUTH_LSTYLE}>{lang==="es"?"Fecha de Nacimiento":"Date of Birth"} <span style={{color:"#f87171"}}>*</span></label><input type="date" value={fechaNacimiento} onChange={e=>setFechaNacimiento(e.target.value)} style={{...AUTH_ISTYLE,colorScheme:"dark"}}/></div>
          <div>
            <label style={AUTH_LSTYLE}>{lang==="es"?"Cédula":"Cédula"} <span style={{color:"#475569",fontWeight:400,fontSize:9}}>(opcional)</span></label>
            {noCedula
              ? <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderRadius:10,border:"1px dashed rgba(148,163,184,.15)",background:"rgba(255,255,255,.02)"}}><span style={{fontSize:12,color:"#475569"}}>{lang==="es"?"Sin cédula":"No cédula"}</span><button onClick={()=>setNoCedula(false)} style={{background:"none",border:"none",color:"#0d9488",fontSize:11,cursor:"pointer",fontWeight:700}}>{lang==="es"?"Agregar":"Add"}</button></div>
              : <><input value={cedula} onChange={e=>setCedula(e.target.value)} placeholder="8-123-4567" style={AUTH_ISTYLE} autoCorrect="off" spellCheck={false}/><button onClick={()=>{setNoCedula(true);setCedula("");}} style={{marginTop:5,background:"none",border:"none",color:"#64748b",fontSize:11,cursor:"pointer",padding:0,textDecoration:"underline dotted"}}>{lang==="es"?"No tengo cédula":"I don't have a cédula"}</button></>}
          </div>
          {regErr&&<div style={{display:"flex",alignItems:"center",gap:6,color:"#f87171",fontSize:12,padding:"7px 10px",borderRadius:8,background:"rgba(248,113,113,.08)"}}><Icon name="alert" size={13} color="#f87171"/>{regErr}</div>}
          <button onClick={handleRegister} style={{width:"100%",padding:14,borderRadius:11,border:"none",background:"linear-gradient(135deg,#0d9488,#0f766e)",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer"}}>
            {lang==="es"?"Enviar Solicitud":"Submit Request"}
          </button>
          <p style={{textAlign:"center",color:"#475569",fontSize:11,margin:0}}>{lang==="es"?"Eduardo aprobará tu acceso":"Eduardo will approve your access"}</p>
        </div>
      </div>
    </AuthShell>
  );
}

// ─── TASK LOG CARD — reusable ─────────────────────────────────────────────────
function TaskLogCard({ task, systems, lang, onComplete, canEdit }) {
  const schema = TASK_SCHEMA[task.taskType] || TASK_SCHEMA.parametros;
  const sys    = systems.find(s=>s.id===task.sistema);
  const done   = task.actual !== null || (schema.yesno && task.condicion !== null);
  const statusColor = done ? "#4ade80" : canEdit ? "#0d9488" : "#475569";

  return (
    <div style={{...S.card, borderLeft:`3px solid ${statusColor}`, cursor: canEdit ? "pointer" : "default"}}
      onClick={()=>{ if(canEdit) onComplete(task); }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:28,lineHeight:1,flexShrink:0}}>{schema.icon}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?schema.label:schema.labelEn}</div>
            {sys && <div style={{fontSize:11,color:"#64748b"}}>{sys.id} · {sys.pueblo}</div>}
            {task.sistema && !sys && <div style={{fontSize:11,color:"#64748b"}}>{task.sistema}</div>}
            {task.objetivo && !done && (
              <div style={{fontSize:11,color:"#475569"}}>
                {lang==="es"?"Objetivo":"Target"}: {task.objetivo} {lang==="es"?schema.unit:schema.unitEn}
              </div>
            )}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          {done ? (
            schema.yesno
              ? <span style={{fontSize:20}}>{task.condicion==="si"?"✅":"❌"}</span>
              : <div>
                  <div style={{fontSize:18,fontWeight:800,color:"#4ade80",fontFamily:"monospace"}}>{task.actual}</div>
                  <div style={{fontSize:10,color:"#64748b"}}>{lang==="es"?schema.unit:schema.unitEn}</div>
                </div>
          ) : (
            <span style={{fontSize:11,padding:"3px 10px",borderRadius:8,
              background: canEdit?"rgba(13,148,136,.12)":"rgba(148,163,184,.06)",
              color: canEdit?"#0d9488":"#475569",fontWeight:700}}>
              {canEdit?(lang==="es"?"Registrar →":"Log →"):(lang==="es"?"Pendiente":"Pending")}
            </span>
          )}
        </div>
      </div>

      {/* Instructions banner */}
      {task.notas && (
        <div style={{marginTop:8,padding:"6px 10px",borderRadius:8,background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.15)",display:"flex",alignItems:"flex-start",gap:6}}>
          <span style={{fontSize:13,flexShrink:0}}>📌</span>
          <span style={{fontSize:11,color:"#fbbf24",lineHeight:1.4}}>{task.notas}</span>
        </div>
      )}

      {/* Logged evidence */}
      {done && (task.foto || task.voiceNote || task.comentarioVaquero) && (
        <div style={{marginTop:8}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:task.comentarioVaquero?6:0}}>
            {task.foto && <span style={{fontSize:10,color:"#0d9488",fontWeight:700,background:"rgba(13,148,136,.1)",padding:"2px 8px",borderRadius:6}}>📷 foto</span>}
            {task.voiceNote && <span style={{fontSize:10,color:"#4ade80",fontWeight:700,background:"rgba(74,222,128,.1)",padding:"2px 8px",borderRadius:6}}>🎙 voz</span>}
          </div>
          {task.comentarioVaquero && (
            <div style={{
              padding:"8px 10px",borderRadius:9,
              background:"rgba(13,148,136,.06)",
              border:"1px solid rgba(13,148,136,.15)",
              display:"flex",alignItems:"flex-start",gap:7,
            }}>
              <span style={{fontSize:13,flexShrink:0}}>💬</span>
              <span style={{fontSize:12,color:"#2dd4bf",lineHeight:1.4,fontStyle:"italic"}}>
                "{task.comentarioVaquero}"
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
        <span style={{fontSize:10,color:"#334155"}}>{task.day}</span>
        {done && <span style={{fontSize:10,color:"#4ade80",fontWeight:600}}>✓ {lang==="es"?"Completado":"Done"}</span>}
      </div>
    </div>
  );
}

// ─── TASK DETAIL / COMPLETION SHEET ──────────────────────────────────────────
function TaskCompleteModal({ task, systems, lang, onSave, onClose }) {
  const schema = TASK_SCHEMA[task.taskType] || TASK_SCHEMA.parametros;
  const sys    = systems.find(s=>s.id===task.sistema);
  const done   = task.actual !== null || (schema.yesno && task.condicion !== null);

  const [actual,             setActual]            = useState(task.actual ?? "");
  const [condicion,          setCondicion]          = useState(task.condicion ?? "");
  const [foto,               setFoto]               = useState(task.foto ?? null);
  const [voiceNote,          setVoiceNote]          = useState(task.voiceNote ?? null);
  const [comentarioVaquero,  setComentarioVaquero]  = useState(task.comentarioVaquero ?? "");

  // For limpieza and vigilancia: completion = yes/no + optional photo
  const isConfirmType = ["limpieza","vigilancia","mantenimiento","seleccion"].includes(task.taskType);

  const canSave = schema.yesno
    ? condicion !== ""
    : isConfirmType
      ? condicion !== ""
      : String(actual).trim() !== "";

  const handleSave = () => {
    onSave({
      ...task,
      actual:            schema.yesno || isConfirmType ? (actual||null) : parseFloat(actual)||0,
      condicion:         condicion || null,
      voiceNote,
      foto: foto ? (typeof foto==="string"&&foto.startsWith("foto") ? foto : `foto_${Date.now()}.jpg`) : null,
      comentarioVaquero: comentarioVaquero.trim() || null,
      comentarioFecha:   comentarioVaquero.trim() ? new Date().toISOString() : null,
    });
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={onClose}>
      <div style={{width:"100%",maxWidth:480,background:"#0b1220",borderRadius:"22px 22px 0 0",padding:"0 0 40px",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,.5)"}}
        onClick={e=>e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{width:36,height:4,borderRadius:2,background:"rgba(148,163,184,.25)",margin:"14px auto 0"}}/>

        {/* Header */}
        <div style={{padding:"16px 20px 14px",borderBottom:"1px solid rgba(148,163,184,.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:36,lineHeight:1}}>{schema.icon}</span>
            <div style={{flex:1}}>
              <h3 style={{color:"#e2e8f0",fontSize:18,fontWeight:800,margin:0}}>{lang==="es"?schema.label:schema.labelEn}</h3>
              <p style={{color:"#64748b",fontSize:12,margin:"3px 0 0"}}>
                {sys ? `${sys.id} · ${sys.pueblo}` : task.sistema||""} {task.day&&`· ${task.day}`}
              </p>
            </div>
            {done && <span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:"rgba(74,222,128,.12)",color:"#4ade80",fontWeight:700}}>✓ {lang==="es"?"Hecho":"Done"}</span>}
          </div>
        </div>

        <div style={{padding:"16px 20px"}}>

          {/* Instructions — always shown if present */}
          {task.notas && (
            <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.2)",marginBottom:18,display:"flex",alignItems:"flex-start",gap:8}}>
              <span style={{fontSize:18,flexShrink:0}}>📌</span>
              <div>
                <div style={{fontSize:10,color:"#b45309",fontWeight:700,marginBottom:3,textTransform:"uppercase",letterSpacing:.5}}>{lang==="es"?"Instrucciones de Eduardo":"Instructions from Eduardo"}</div>
                <span style={{fontSize:13,color:"#fbbf24",lineHeight:1.5}}>{task.notas}</span>
              </div>
            </div>
          )}

          {/* Objective reminder */}
          {task.objetivo && (
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderRadius:9,background:"rgba(255,255,255,.03)",marginBottom:18}}>
              <span style={{fontSize:12,color:"#64748b"}}>{lang==="es"?"Objetivo asignado":"Assigned target"}</span>
              <span style={{fontSize:14,fontWeight:800,color:"#e2e8f0",fontFamily:"monospace"}}>{task.objetivo} {lang==="es"?schema.unit:schema.unitEn}</span>
            </div>
          )}

          {/* ── PESAR: big number pad ── */}
          {["pesos","cosecha","construir","sembrar","motor","parametros","planificacion"].includes(task.taskType) && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:.6,marginBottom:10}}>
                {lang==="es"?`¿Cuántos ${schema.unit}?`:`How many ${schema.unitEn}?`}
              </div>
              <input type="number" inputMode="numeric" value={actual}
                onChange={e=>setActual(e.target.value)}
                placeholder="0"
                style={{...S.input,fontSize:48,fontWeight:900,textAlign:"center",padding:"20px 14px",fontFamily:"monospace",color:"#0d9488",letterSpacing:-2,border:"2px solid rgba(13,148,136,.2)",borderRadius:14}}
              />
              <div style={{textAlign:"center",fontSize:12,color:"#475569",marginTop:6}}>
                {lang==="es"?schema.unit:schema.unitEn}
              </div>
            </div>
          )}

          {/* ── LIMPIEZA / VIGILANCIA: confirm done + optional photo ── */}
          {isConfirmType && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:.6,marginBottom:12}}>
                {lang==="es"?"¿Se completó la tarea?":"Was the task completed?"}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[["si","✅",lang==="es"?"Sí, completado":"Yes, done","#4ade80"],
                  ["no","❌",lang==="es"?"No, sin completar":"No, not done","#f87171"]].map(([v,e,l,c])=>(
                  <button key={v} onClick={()=>setCondicion(v)}
                    style={{padding:"20px 8px",borderRadius:14,border:`2px solid ${condicion===v?c:"rgba(148,163,184,.12)"}`,
                      background:condicion===v?`${c}15`:"rgba(255,255,255,.02)",
                      cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,transition:"all .15s"}}>
                    <span style={{fontSize:36}}>{e}</span>
                    <span style={{fontSize:12,fontWeight:700,color:condicion===v?c:"#64748b",textAlign:"center",lineHeight:1.3}}>{l}</span>
                  </button>
                ))}
              </div>
              {/* Optional photo */}
              <button onClick={()=>setFoto(foto?null:`foto_${Date.now()}.jpg`)}
                style={{width:"100%",padding:14,borderRadius:12,border:`2px dashed ${foto?"rgba(74,222,128,.4)":"rgba(13,148,136,.2)"}`,
                  background:foto?"rgba(74,222,128,.04)":"transparent",
                  color:foto?"#4ade80":"#64748b",fontWeight:600,fontSize:13,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <Icon name="camera" size={20} color={foto?"#4ade80":"#64748b"}/>
                {foto?(lang==="es"?"✓ Foto adjuntada":"✓ Photo attached"):(lang==="es"?"Adjuntar foto (opcional)":"Attach photo (optional)")}
              </button>
            </div>
          )}

          {/* ── REUBICAR / DESPLEGAR: yes/no only ── */}
          {schema.yesno && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:.6,marginBottom:12}}>
                {lang==="es"?"¿Se realizó?":"Was it done?"}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[["si","✅",lang==="es"?"Sí":"Yes","#4ade80"],
                  ["no","❌",lang==="es"?"No":"No","#f87171"]].map(([v,e,l,c])=>(
                  <button key={v} onClick={()=>setCondicion(v)}
                    style={{padding:"20px 8px",borderRadius:14,border:`2px solid ${condicion===v?c:"rgba(148,163,184,.12)"}`,
                      background:condicion===v?`${c}15`:"rgba(255,255,255,.02)",
                      cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <span style={{fontSize:36}}>{e}</span>
                    <span style={{fontSize:14,fontWeight:800,color:condicion===v?c:"#64748b"}}>{l}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── COMENTARIOS — optional field for all task types ── */}
          <div style={{marginBottom:20}}>
            <label style={{
              fontSize:11,color:"#64748b",fontWeight:700,
              textTransform:"uppercase",letterSpacing:.6,
              display:"block",marginBottom:8,
            }}>
              💬 {lang==="es"?"Comentarios del campo (opcional)":"Field comments (optional)"}
            </label>
            <textarea
              value={comentarioVaquero}
              onChange={e=>setComentarioVaquero(e.target.value)}
              rows={3}
              placeholder={lang==="es"
                ?"Ej: Encontré epifitas en el lado norte, agua turbia, canasta dañada..."
                :"E.g. Found epiphytes on north side, turbid water, damaged basket..."}
              aria-label={lang==="es"?"Comentarios del campo":"Field comments"}
              style={{
                width:"100%",padding:"11px 13px",borderRadius:12,
                border:`1px solid ${comentarioVaquero.trim()
                  ?"rgba(13,148,136,.4)":"rgba(148,163,184,.12)"}`,
                background:"rgba(15,23,42,.8)",
                color:"#e2e8f0",fontSize:13,
                outline:"none",resize:"none",
                fontFamily:"inherit",lineHeight:1.5,
                boxSizing:"border-box",
                transition:"border-color .2s",
              }}
            />
            {comentarioVaquero.trim() && (
              <div style={{
                display:"flex",alignItems:"center",gap:6,
                marginTop:6,fontSize:11,color:"#0d9488",
                fontWeight:600,
              }}>
                <span>📨</span>
                <span>{lang==="es"
                  ?"Eduardo verá este comentario en su dashboard al sincronizar"
                  :"Eduardo will see this comment on his dashboard when synced"}
                </span>
              </div>
            )}
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={!canSave}
            style={{...S.btn(canSave),fontSize:16,padding:16,borderRadius:14,
              boxShadow:canSave?"0 0 24px rgba(13,148,136,.3)":"none"}}>
            {lang==="es"?"✓ Marcar como completado":"✓ Mark as complete"}
          </button>

          <button onClick={onClose}
            style={{width:"100%",padding:12,borderRadius:12,border:"none",background:"transparent",color:"#475569",fontSize:13,cursor:"pointer",marginTop:8}}>
            {lang==="es"?"Cerrar":"Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL 1 — VAQUERO SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ANUNCIOS PANEL ───────────────────────────────────────────────────────────
function AnunciosPanel({ announcements, setAnnouncements, user, lang }) {
  const canPost = ["supervisor","ceo","consultant"].includes(user.role);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft]         = useState("");

  const handlePost = () => {
    if(!draft.trim()) return;
    setAnnouncements(prev=>[{
      id: Date.now(),
      author: user.name,
      initials: user.initials||user.name.slice(0,2).toUpperCase(),
      role: user.role,
      message: draft.trim(),
      date: new Date().toISOString().slice(0,10),
      pinned: false,
    }, ...prev]);
    setDraft("");
    setComposing(false);
  };

  const handleDelete = (id) => setAnnouncements(prev=>prev.filter(a=>a.id!==id));

  // Pinned first, then chronological
  const sorted = [...announcements].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||b.id-a.id);

  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:11,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
          📢 {lang==="es"?"Anuncios":"Announcements"}
        </span>
        {canPost && !composing && (
          <button onClick={()=>setComposing(true)}
            style={{fontSize:11,padding:"3px 10px",borderRadius:8,border:"1px solid rgba(13,148,136,.3)",
              background:"rgba(13,148,136,.06)",color:"#0d9488",fontWeight:700,cursor:"pointer"}}>
            + {lang==="es"?"Nuevo":"New"}
          </button>
        )}
      </div>

      {/* Compose box */}
      {composing && (
        <div style={{background:"rgba(13,148,136,.06)",border:"1px solid rgba(13,148,136,.2)",borderRadius:12,padding:12,marginBottom:10}}>
          <textarea
            value={draft}
            onChange={e=>setDraft(e.target.value)}
            rows={3}
            autoFocus
            placeholder={lang==="es"?"Escribe un mensaje para el equipo...":"Write a message for the team..."}
            style={{...S.input,resize:"none",marginBottom:8,fontSize:13}}
          />
          <div style={{display:"flex",gap:8}}>
            <button onClick={handlePost} disabled={!draft.trim()}
              style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",
                background:draft.trim()?"linear-gradient(135deg,#0d9488,#0f766e)":"rgba(13,148,136,.12)",
                color:draft.trim()?"#fff":"#334155",fontWeight:700,fontSize:13,cursor:draft.trim()?"pointer":"not-allowed"}}>
              {lang==="es"?"Publicar":"Post"}
            </button>
            <button onClick={()=>{setComposing(false);setDraft("");}}
              style={{padding:"9px 14px",borderRadius:9,border:"1px solid rgba(148,163,184,.15)",
                background:"transparent",color:"#64748b",fontWeight:600,fontSize:13,cursor:"pointer"}}>
              {lang==="es"?"Cancelar":"Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {sorted.length===0 ? (
        <div style={{padding:"12px 14px",borderRadius:10,background:"rgba(255,255,255,.02)",border:"1px dashed rgba(148,163,184,.1)",textAlign:"center"}}>
          <span style={{fontSize:12,color:"#334155"}}>{lang==="es"?"Sin anuncios":"No announcements"}</span>
        </div>
      ) : sorted.map(a=>(
        <div key={a.id} style={{
          padding:"11px 13px",borderRadius:11,marginBottom:6,
          background: a.pinned?"rgba(251,191,36,.06)":"rgba(255,255,255,.02)",
          border: a.pinned?"1px solid rgba(251,191,36,.2)":"1px solid rgba(148,163,184,.08)",
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:9,flex:1}}>
              {/* Avatar */}
              <div style={{width:30,height:30,borderRadius:8,flexShrink:0,
                background:a.role==="supervisor"?"rgba(13,148,136,.15)":a.role==="ceo"?"rgba(245,158,11,.15)":"rgba(167,139,250,.15)",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:10,fontWeight:800,
                  color:a.role==="supervisor"?"#0d9488":a.role==="ceo"?"#f59e0b":"#a78bfa"}}>
                  {a.initials}
                </span>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#94a3b8"}}>{a.author}</span>
                  {a.pinned&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:5,background:"rgba(251,191,36,.15)",color:"#fbbf24",fontWeight:700}}>📌 {lang==="es"?"Fijado":"Pinned"}</span>}
                  <span style={{fontSize:10,color:"#334155",marginLeft:"auto"}}>{a.date}</span>
                </div>
                <p style={{fontSize:13,color:"#e2e8f0",margin:0,lineHeight:1.5,fontStyle:"italic"}}>
                  "{a.message}"
                </p>
              </div>
            </div>
            {canPost && (
              <button onClick={()=>handleDelete(a.id)}
                style={{background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:14,padding:"0 2px",flexShrink:0,lineHeight:1}}>
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function VaqueroInicio({ assignedTasks, setAssignedTasks, systems, user, lang, announcements }) {
  const today     = new Date().toISOString().slice(0,10);
  const dayIndex  = new Date().getDay(); // 0=Sun
  const todayName = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][dayIndex];
  const days      = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

  const myTasks   = assignedTasks.filter(t=>t.assignedTo===user.initials);
  const done      = myTasks.filter(t=>t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
  const pct       = myTasks.length ? Math.round((done/myTasks.length)*100) : 0;

  const [view, setView]           = useState("daily");  // "daily" | "weekly"
  const [activeTask, setActiveTask] = useState(null);

  const handleComplete = (updatedTask) => {
    setAssignedTasks(prev=>prev.map(t=>t.id===updatedTask.id ? updatedTask : t));
    setActiveTask(null);
  };

  // Tasks for current view
  const todayTasks = myTasks.filter(t=>t.day===todayName||t.date===today);

  // Weekly grouped by day
  const byDay = {};
  days.forEach(d=>{ byDay[d]=myTasks.filter(t=>t.day===d); });

  return (
    <div style={{padding:"16px 16px 100px"}}>

      {/* Greeting + date */}
      <div style={{marginBottom:14}}>
        <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:0}}>
          {lang==="es"?`Hola, ${user.name.split(" ")[0]} 👋`:`Hey, ${user.name.split(" ")[0]} 👋`}
        </h2>
        <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>
          {new Date().toLocaleDateString(lang==="es"?"es-PA":"en-US",{weekday:"long",month:"long",day:"numeric"})}
        </p>
      </div>

      {/* Announcements */}
      <AnunciosPanel announcements={announcements} setAnnouncements={()=>{}} user={user} lang={lang}/>

      {/* Weekly progress bar */}
      <div style={{...S.card,background:"rgba(13,148,136,.07)",border:"1px solid rgba(13,148,136,.15)",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
          <div>
            <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:.6}}>{lang==="es"?"Mi semana":"My week"}</div>
            <div style={{fontSize:32,fontWeight:900,color:"#0d9488",fontFamily:"monospace",lineHeight:1}}>{pct}<span style={{fontSize:14,color:"#64748b"}}>%</span></div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{done}/{myTasks.length}</div>
            <div style={{fontSize:11,color:"#64748b"}}>{lang==="es"?"tareas":"tasks"}</div>
          </div>
        </div>
        <div style={{height:7,borderRadius:4,background:"rgba(255,255,255,.06)",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#0d9488,#2dd4bf)",borderRadius:4,transition:"width .5s ease"}}/>
        </div>
      </div>

      {/* Daily / Weekly toggle */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["daily",lang==="es"?"Hoy":"Today"],["weekly",lang==="es"?"Semana":"Week"]].map(([id,label])=>(
          <button key={id} onClick={()=>setView(id)}
            style={{flex:1,padding:"9px 0",borderRadius:10,border:`1px solid ${view===id?"#0d9488":"rgba(148,163,184,.12)"}`,
              background:view===id?"rgba(13,148,136,.12)":"transparent",
              color:view===id?"#0d9488":"#64748b",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {/* ── DAILY VIEW ── */}
      {view==="daily" && (
        <div>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:1}}>
            {todayName} — {todayTasks.length} {lang==="es"?"tareas":"tasks"}
          </div>
          {todayTasks.length===0
            ? <div style={{...S.card,textAlign:"center",padding:28}}>
                <span style={{fontSize:32}}>🌊</span>
                <p style={{color:"#475569",fontSize:13,margin:"8px 0 0"}}>{lang==="es"?"No hay tareas asignadas para hoy":"No tasks assigned for today"}</p>
              </div>
            : todayTasks.map(t=>(
                <TaskLogCard key={t.id} task={t} systems={systems} lang={lang}
                  onComplete={setActiveTask} canEdit={true}/>
              ))
          }
        </div>
      )}

      {/* ── WEEKLY VIEW ── */}
      {view==="weekly" && (
        <div>
          {days.map(d=>{
            const dayTasks = byDay[d]||[];
            if(dayTasks.length===0) return null;
            const dayDone = dayTasks.filter(t=>t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
            const isToday = d===todayName;
            return (
              <div key={d} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13,fontWeight:800,color:isToday?"#0d9488":"#94a3b8"}}>{d}</span>
                    {isToday&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:6,background:"rgba(13,148,136,.15)",color:"#0d9488",fontWeight:700}}>HOY</span>}
                  </div>
                  <span style={{fontSize:11,color:dayDone===dayTasks.length?"#4ade80":"#64748b",fontWeight:600}}>
                    {dayDone}/{dayTasks.length} ✓
                  </span>
                </div>
                {dayTasks.map(t=>(
                  <TaskLogCard key={t.id} task={t} systems={systems} lang={lang}
                    onComplete={setActiveTask}
                    canEdit={isToday || t.actual===null}/>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {activeTask && (
        <TaskCompleteModal task={activeTask} systems={systems} lang={lang}
          onSave={handleComplete} onClose={()=>setActiveTask(null)}/>
      )}
    </div>
  );
}


function VaqueroScore({ assignedTasks, weeklyIncidents, profScores, evaluations, user, lang }) {
  const [tab, setScoreTab] = useState("tareas"); // tareas | profesionalismo | equipo

  const myTasks = assignedTasks.filter(t=>t.assignedTo===user.initials);
  const done    = myTasks.filter(t=>t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
  const pct     = myTasks.length ? Math.round((done/myTasks.length)*100) : 0;

  const byType = {};
  myTasks.forEach(t=>{
    if(!byType[t.taskType]) byType[t.taskType]={total:0,done:0};
    byType[t.taskType].total++;
    if(t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)) byType[t.taskType].done++;
  });

  // Professionalism — from evaluations (latest quarter with data)
  const myEval  = evaluations[user.initials];
  const latestQ = myEval ? Object.entries(myEval.quarters).filter(([,q])=>q&&Object.keys(q.comportamientos||{}).length>0).pop() : null;
  const myComps = latestQ ? latestQ[1].comportamientos : null;

  // My incidents this week
  const latestWeek = weeklyIncidents.filter(i=>i.initials===user.initials).sort((a,b)=>b.week.localeCompare(a.week))[0];

  // Team leaderboard — task completion for all crew
  const leaderboard = CREW.filter(c=>c.role!=="Supervisor").map(c=>{
    const tasks = assignedTasks.filter(t=>t.assignedTo===c.initials);
    const d = tasks.filter(t=>t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
    const p = tasks.length ? Math.round((d/tasks.length)*100) : 0;
    const incidents = weeklyIncidents.filter(i=>i.initials===c.initials).reduce((s,i)=>s+i.tardanzas+i.ausencias,0);
    return { ...c, pct:p, done:d, total:tasks.length, incidents };
  }).sort((a,b)=>b.pct-a.pct);

  const profLabels = { mision:"Misión", resultados:"Resultados", mejora:"Mejora", planes:"Planes", equipo:"Equipo" };

  return (
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{marginBottom:14}}>
        <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:0}}>{lang==="es"?"Mi Puntaje":"My Score"}</h2>
        <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>Q3 2026</p>
      </div>

      {/* Big score card */}
      <div style={{...S.card,textAlign:"center",padding:24,background:"linear-gradient(135deg,rgba(13,148,136,.07),rgba(2,8,24,.5))",border:"1px solid rgba(13,148,136,.12)",marginBottom:12}}>
        <div style={{fontSize:68,fontWeight:900,color:"#0d9488",fontFamily:"monospace",lineHeight:1}}>{pct}</div>
        <div style={{fontSize:16,color:"#64748b",marginTop:2}}>/ 100 {lang==="es"?"tareas":"tasks"}</div>
        <div style={{height:8,borderRadius:4,background:"rgba(255,255,255,.05)",overflow:"hidden",margin:"12px 0 6px"}}>
          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${pct>=80?"#4ade80":pct>=60?"#fb923c":"#f87171"},#0d9488)`,borderRadius:4,transition:"width .6s ease"}}/>
        </div>
        <div style={{fontSize:12,color:"#64748b"}}>{done}/{myTasks.length} {lang==="es"?"tareas completadas esta semana":"tasks completed this week"}</div>
      </div>

      {/* Sub-tabs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
        {[["tareas",lang==="es"?"Tareas":"Tasks"],["profesionalismo",lang==="es"?"Profesionalismo":"Prof."],["equipo",lang==="es"?"Equipo":"Team"]].map(([id,label])=>(
          <button key={id} onClick={()=>setScoreTab(id)}
            style={{padding:"7px 0",borderRadius:9,border:`1px solid ${tab===id?"#0d9488":"rgba(148,163,184,.1)"}`,background:tab===id?"rgba(13,148,136,.12)":"transparent",color:tab===id?"#0d9488":"#64748b",fontWeight:700,fontSize:11,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {/* TAREAS tab */}
      {tab==="tareas" && Object.entries(byType).map(([type,{total,done:d}])=>{
        const schema=TASK_SCHEMA[type]||{icon:"📋",label:type,labelEn:type};
        const p=Math.round((d/total)*100);
        return (
          <div key={type} style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{schema.icon}</span>
                <span style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?schema.label:schema.labelEn}</span>
              </div>
              <span style={{fontSize:14,fontWeight:800,color:p===100?"#4ade80":p>=70?"#fb923c":"#f87171",fontFamily:"monospace"}}>{p}%</span>
            </div>
            {S.scoreBar(p/100,p===100?"#4ade80":p>=70?"#fb923c":"#f87171")}
            <div style={{fontSize:10,color:"#475569",marginTop:3}}>{d}/{total}</div>
          </div>
        );
      })}

      {/* PROFESIONALISMO tab */}
      {tab==="profesionalismo" && (
        <div>
          {/* Incidents */}
          <div style={{...S.card,borderColor: (latestWeek?.tardanzas||0)+(latestWeek?.ausencias||0)>0?"rgba(248,113,113,.2)":"rgba(74,222,128,.15)"}}>
            <div style={{fontSize:11,color:"#64748b",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.6}}>
              {lang==="es"?"Puntualidad esta semana":"Punctuality this week"}
            </div>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1,textAlign:"center",padding:"10px 0",background:"rgba(255,255,255,.03)",borderRadius:10}}>
                <div style={{fontSize:28,fontWeight:900,color:(latestWeek?.tardanzas||0)>0?"#f87171":"#4ade80",fontFamily:"monospace"}}>{latestWeek?.tardanzas||0}</div>
                <div style={{fontSize:10,color:"#64748b"}}>{lang==="es"?"tardanzas":"late arrivals"}</div>
              </div>
              <div style={{flex:1,textAlign:"center",padding:"10px 0",background:"rgba(255,255,255,.03)",borderRadius:10}}>
                <div style={{fontSize:28,fontWeight:900,color:(latestWeek?.ausencias||0)>0?"#f87171":"#4ade80",fontFamily:"monospace"}}>{latestWeek?.ausencias||0}</div>
                <div style={{fontSize:10,color:"#64748b"}}>{lang==="es"?"ausencias":"absences"}</div>
              </div>
            </div>
            {latestWeek?.notas&&<p style={{fontSize:11,color:"#94a3b8",margin:"8px 0 0",fontStyle:"italic"}}>"{latestWeek.notas}"</p>}
          </div>

          {/* Comportamientos from eval */}
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"10px 0 8px",textTransform:"uppercase",letterSpacing:.6}}>
            {lang==="es"?"Comportamientos (Q1 2026)":"Behaviors (Q1 2026)"}
          </div>
          {myComps ? COMPORTAMIENTOS_LIST.map(c=>{
            const v=myComps[c.id]??null;
            if(v===null) return null;
            const col=v>=0.9?"#4ade80":v>=0.6?"#fb923c":"#f87171";
            return (
              <div key={c.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:12,color:"#e2e8f0"}}>{c.desc}</span>
                  <span style={{fontSize:13,fontWeight:800,color:col,fontFamily:"monospace"}}>{Math.round(v*100)}%</span>
                </div>
                {S.scoreBar(v,col)}
              </div>
            );
          }) : (
            <div style={{...S.card,textAlign:"center",padding:20}}>
              <p style={{color:"#475569",fontSize:12,margin:0}}>{lang==="es"?"Evaluación de comportamientos pendiente para Q3":"Behavior evaluation pending for Q3"}</p>
            </div>
          )}
          <div style={{...S.card,borderColor:"rgba(13,148,136,.15)",marginTop:4}}>
            <p style={{color:"#64748b",fontSize:11,margin:0,lineHeight:1.5}}>
              {lang==="es"
                ?"Tu puntaje final de profesionalismo es calculado por RRHH al cierre del trimestre."
                :"Your final professionalism score is calculated by HR at quarter close."}
            </p>
          </div>
        </div>
      )}

      {/* EQUIPO tab — leaderboard, own row highlighted */}
      {tab==="equipo" && (
        <div>
          <p style={{color:"#64748b",fontSize:11,margin:"0 0 10px",lineHeight:1.4}}>
            {lang==="es"
              ?"Rendimiento semanal del equipo. Las tardanzas son visibles para promover responsabilidad grupal."
              :"Team weekly performance. Tardiness is visible to promote group accountability."}
          </p>
          {leaderboard.map((c,i)=>{
            const isMe = c.initials===user.initials;
            return (
              <div key={c.initials} style={{...S.card, borderColor:isMe?"rgba(13,148,136,.35)":"rgba(148,163,184,.08)", background:isMe?"rgba(13,148,136,.07)":"rgba(15,23,42,.8)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {/* Rank */}
                  <div style={{width:28,textAlign:"center",flexShrink:0}}>
                    <span style={{fontSize:15,fontWeight:800,color:i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#b45309":"#475569"}}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                    </span>
                  </div>
                  {/* Name */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:13,fontWeight:isMe?800:600,color:isMe?"#0d9488":"#e2e8f0"}}>{c.name.split(" ")[0]}</span>
                      {isMe&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:6,background:"rgba(13,148,136,.2)",color:"#0d9488",fontWeight:700}}>TÚ</span>}
                    </div>
                    <div style={{fontSize:10,color:"#64748b"}}>{c.role}</div>
                    {S.scoreBar(c.pct/100,c.pct===100?"#4ade80":c.pct>=70?"#fb923c":"#f87171")}
                  </div>
                  {/* Score */}
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:16,fontWeight:800,color:c.pct===100?"#4ade80":c.pct>=70?"#fb923c":"#f87171",fontFamily:"monospace"}}>{c.pct}%</div>
                    {/* Incidents badge */}
                    {c.incidents>0&&(
                      <div style={{fontSize:10,color:"#f87171",fontWeight:700,marginTop:2}}>
                        ⏰ {c.incidents} {lang==="es"?"incid.":"incident(s)"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL 2 — SUPERVISOR SCREENS
// ═══════════════════════════════════════════════════════════════════════════════


// ─── BIOMASS HELPERS ─────────────────────────────────────────────────────────
function getSystemReadings(readings, sysId) {
  return readings.filter(r=>r.sistema===sysId).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
}
function latestReading(readings, sysId) {
  const rs = getSystemReadings(readings, sysId);
  return rs[rs.length-1]||null;
}
function prevReading(readings, sysId) {
  const rs = getSystemReadings(readings, sysId);
  return rs[rs.length-2]||null;
}
function growthRate(latest, prev) {
  if(!latest||!prev||!prev.peso) return null;
  const days = Math.max(1, (new Date(latest.fecha)-new Date(prev.fecha))/(1000*60*60*24));
  return ((latest.peso - prev.peso) / prev.peso / days) * 100; // % per day
}
function daysAgo(dateStr) {
  return Math.round((new Date()-new Date(dateStr))/(1000*60*60*24));
}
function growthColor(rate) {
  if(rate===null) return "#475569";
  if(rate >= 2.5) return "#4ade80";
  if(rate >= 1.0) return "#fb923c";
  return "#f87171";
}
function growthLabel(rate, lang) {
  if(rate===null) return lang==="es"?"Sin datos":"No data";
  if(rate >= 2.5) return lang==="es"?"En objetivo":"On target";
  if(rate >= 1.0) return lang==="es"?"Crecimiento lento":"Slow growth";
  return lang==="es"?"Por debajo":"Below target";
}
// Mini sparkline SVG — inline
function MiniSparkline({ data, color="#4ade80", w=60, h=24 }) {
  if(!data||data.length<2) return <span style={{fontSize:10,color:"#334155"}}>—</span>;
  const vals = data.map(r=>r.peso);
  const mn=Math.min(...vals), mx=Math.max(...vals), rng=mx-mn||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-mn)/rng)*(h-4)-2}`).join(" ");
  return (
    <svg width={w} height={h} style={{overflow:"visible",display:"block"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2.5" fill={color}/>
    </svg>
  );
}

// ─── CHART: Promedio TDC line chart ──────────────────────────────────────────
function TDCChart({ lang, data }) {
  const chartData = data || TDC_DATA;
  const [hovered, setHovered] = useState(null);
  const W = 320, H = 120, PL = 42, PR = 8, PT = 12, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const vals = chartData.map(d => d.tdc).filter(v => v !== null);
  const minV = Math.min(...vals, -1), maxV = Math.max(...vals, 3);
  const range = maxV - minV || 1;
  const xStep = cW / Math.max(chartData.length - 1, 1);
  const yZero = PT + cH - ((0 - minV) / range) * cH;

  const toX = i => PL + i * xStep;
  const toY = v => PT + cH - ((v - minV) / range) * cH;
  const pts = chartData.map((d, i) => d.tdc !== null ? `${toX(i)},${toY(d.tdc)}` : null).filter(Boolean).join(" ");
  const ticks = [-1, 0, 1, 2, 3];

  // Derivative: week-over-week change in TDC (acceleration/deceleration)
  const getDerivative = (i) => {
    const curr = chartData[i]?.tdc;
    const prev = chartData[i-1]?.tdc;
    if (curr === null || prev === null || curr === undefined || prev === undefined) return null;
    return parseFloat((curr - prev).toFixed(3));
  };

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}
      style={{display:"block",overflow:"visible"}}
      onMouseLeave={() => setHovered(null)}>
      {/* Y gridlines + labels */}
      {ticks.map(t => {
        const y = toY(t);
        if (y < PT - 4 || y > PT + cH + 4) return null;
        return (
          <g key={t}>
            <line x1={PL} y1={y} x2={PL+cW} y2={y} stroke="rgba(148,163,184,.12)" strokeWidth="1"/>
            <text x={PL-4} y={y+4} textAnchor="end" fontSize="8" fill="#64748b">{t}%</text>
          </g>
        );
      })}
      {/* Zero line */}
      <line x1={PL} y1={yZero} x2={PL+cW} y2={yZero} stroke="rgba(148,163,184,.3)" strokeWidth="1" strokeDasharray="3,3"/>
      {/* Target line at 2.5% */}
      <line x1={PL} y1={toY(2.5)} x2={PL+cW} y2={toY(2.5)} stroke="#4ade8060" strokeWidth="1" strokeDasharray="4,3"/>
      <text x={PL+cW+2} y={toY(2.5)+3} fontSize="7" fill="#4ade80">obj</text>
      {/* Line */}
      <polyline points={pts} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Dots — interactive */}
      {chartData.map((d, i) => {
        if (d.tdc === null) return null;
        const col = d.harvest ? "#f59e0b" : d.tdc >= 2.5 ? "#4ade80" : d.tdc >= 0 ? "#0d9488" : "#f87171";
        const isHov = hovered === i;
        return (
          <g key={i} style={{cursor:"pointer"}}
            onMouseEnter={() => setHovered(i)}
            onClick={() => setHovered(hovered===i ? null : i)}>
            <circle cx={toX(i)} cy={toY(d.tdc)} r={isHov ? 6 : d.harvest ? 4 : 3}
              fill={col} stroke="#021c1e" strokeWidth="1"/>
          </g>
        );
      })}
      {/* X labels — every other one */}
      {chartData.filter((_,i) => i % 2 === 0).map((d, idx) => {
        const i = idx * 2;
        return <text key={i} x={toX(i)} y={H-4} textAnchor="middle" fontSize="7" fill="#475569">{d.label.split(" ")[0]}</text>;
      })}
      {/* Harvest annotation */}
      {chartData.map((d, i) => d.harvest ? (
        <text key={"h"+i} x={toX(i)} y={toY(d.tdc)-7} textAnchor="middle" fontSize="7" fill="#f59e0b">🌿</text>
      ) : null)}
      {/* Hover tooltip — TDC value + derivative */}
      {hovered !== null && chartData[hovered]?.tdc !== null && (() => {
        const d    = chartData[hovered];
        const deriv = getDerivative(hovered);
        const cx   = toX(hovered);
        const cy   = toY(d.tdc);
        const tipW = 108, tipH = deriv !== null ? 44 : 28;
        const tipX = Math.min(Math.max(cx - tipW/2, PL), W - PR - tipW);
        const tipY = cy - tipH - 8;
        const derivColor = deriv === null ? "#64748b" : deriv > 0 ? "#4ade80" : "#f87171";
        const derivLabel = deriv === null ? "" : `${deriv > 0 ? "▲" : deriv < 0 ? "▼" : "→"} ${deriv > 0 ? "+" : ""}${deriv.toFixed(2)}% ${lang==="es"?"vs sem. ant.":"vs last wk"}`;
        return (
          <g style={{pointerEvents:"none"}}>
            <rect x={tipX} y={tipY} width={tipW} height={tipH}
              rx="5" fill="#1e293b" stroke="rgba(148,163,184,.25)" strokeWidth="0.8"/>
            <text x={tipX+tipW/2} y={tipY+13} textAnchor="middle"
              fontSize="8" fontWeight="700" fill="#94a3b8">{d.label}</text>
            <text x={tipX+tipW/2} y={tipY+25} textAnchor="middle"
              fontSize="9" fontWeight="700"
              fill={d.tdc >= 2.5 ? "#4ade80" : d.tdc >= 0 ? "#0d9488" : "#f87171"}>
              {d.tdc !== null ? `${d.tdc >= 0 ? "+" : ""}${d.tdc.toFixed(3)}%/día` : "—"}
            </text>
            {deriv !== null && (
              <text x={tipX+tipW/2} y={tipY+38} textAnchor="middle"
                fontSize="8" fill={derivColor}>{derivLabel}</text>
            )}
          </g>
        );
      })()}
    </svg>
  );
}


// ─── CHART: % Pruebas stacked bar ─────────────────────────────────────────────
function PruebasChart({ lang, data }) {
  const chartData = data || PRUEBAS_DATA; // all weeks, no slice
  const [hovered, setHovered] = useState(null);

  // Stack order bottom→top matching Excel: R (red), A (amarillo/amber), V (verde/green), B (azul/blue)
  const LAYERS = [
    { key:"r", color:"#f87171", label:"Rojo"     },
    { key:"a", color:"#fbbf24", label:"Amarillo" },
    { key:"v", color:"#4ade80", label:"Verde"    },
    { key:"b", color:"#0d9488", label:"Azul"     },
  ];

  const W = 320, H = 160;
  const PL = 28, PR = 6, PT = 8, PB = 44; // PB: x-labels + legend row
  const cW = W - PL - PR, cH = H - PT - PB;
  const n  = chartData.length;
  const slot = cW / n;
  const barW = slot * 0.72;
  const barOff = (slot - barW) / 2;

  const toY = pct => PT + cH - (pct / 100) * cH;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}
      style={{display:"block", overflow:"visible"}}
      onMouseLeave={() => setHovered(null)}>

      {/* Y-axis gridlines + labels */}
      {[0, 25, 50, 75, 100].map(t => (
        <g key={t}>
          <line x1={PL} y1={toY(t)} x2={W - PR} y2={toY(t)}
            stroke={t === 0 ? "rgba(148,163,184,.25)" : "rgba(148,163,184,.08)"}
            strokeWidth="1"/>
          <text x={PL - 4} y={toY(t) + 3} textAnchor="end"
            fontSize="8" fill="#475569">{t}%</text>
        </g>
      ))}

      {/* Stacked bars — R bottom, B, V, A top */}
      {chartData.map((d, i) => {
        const x    = PL + i * slot + barOff;
        const isHov = hovered === i;
        let yOff = PT + cH; // start at baseline

        return (
          <g key={i} style={{cursor:"pointer"}}
            onMouseEnter={() => setHovered(i)}
            onClick={() => setHovered(hovered === i ? null : i)}>

            {LAYERS.map(({ key, color }) => {
              const pct = d[key] || 0;
              if (!pct) return null;
              const bH = (pct / 100) * cH;
              yOff -= bH;
              const y = yOff;
              return (
                <rect key={key} x={x} y={y} width={barW} height={bH}
                  fill={color} opacity={isHov ? 1 : 0.85} rx="1"/>
              );
            })}

            {/* X label — day on first line, month abbrev on second */}
            <text x={x + barW / 2} y={PT + cH + 11}
              textAnchor="middle" fontSize="7.5" fill="#475569">
              {d.label.split(" ")[0]}
            </text>
            <text x={x + barW / 2} y={PT + cH + 20}
              textAnchor="middle" fontSize="7" fill="#334155">
              {d.label.split(" ")[1] || ""}
            </text>
          </g>
        );
      })}

      {/* Hover tooltip — shows all 4 % values */}
      {hovered !== null && (() => {
        const d   = chartData[hovered];
        const cx  = PL + hovered * slot + barOff + barW / 2;
        const tipW = 88, tipH = 60, tipX = Math.min(Math.max(cx - tipW / 2, PL), W - PR - tipW);
        const tipY = PT - 4;
        return (
          <g style={{pointerEvents:"none"}}>
            <rect x={tipX} y={tipY - tipH} width={tipW} height={tipH}
              rx="6" fill="#1e293b" stroke="rgba(148,163,184,.25)" strokeWidth="0.8"/>
            <text x={tipX + tipW / 2} y={tipY - tipH + 10}
              textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8">
              {d.label}
            </text>
            {[...LAYERS].reverse().map(({ key, color, label }, li) => (
              <g key={key} transform={`translate(${tipX + 8}, ${tipY - tipH + 20 + li * 11})`}>
                <rect width="7" height="7" fill={color} opacity="0.9" rx="1" y="-6"/>
                <text x="10" y="0" fontSize="8" fill="#e2e8f0">
                  {label.split(" ")[0]}: <tspan fontWeight="700">{d[key]}%</tspan>
                </text>
              </g>
            ))}
          </g>
        );
      })()}

      {/* Legend — centered single row at bottom */}
      {(() => {
        const items = LAYERS.slice().reverse(); // A top → R bottom in legend
        const itemW = 76;
        const totalLegW = items.length * itemW;
        const startX = (W - totalLegW) / 2;
        return items.map(({ key, color, label }, i) => (
          <g key={key} transform={`translate(${startX + i * itemW}, ${H - 6})`}>
            <rect x="0" y="-8" width="8" height="8" fill={color} opacity="0.88" rx="1"/>
            <text x="11" y="0" fontSize="7.5" fill="#64748b">{label}</text>
          </g>
        ));
      })()}
    </svg>
  );
}


// ─── CHART: Biomasa Total bar chart with targets ──────────────────────────────
function BiomasaChart({ lang, readings, systems }) {
  const [hovered, setHovered] = useState(null);
  const W = 320, H = 120, PL = 8, PR = 8, PT = 18, PB = 30;
  const cW = W - PL - PR, cH = H - PT - PB;

  // Build monthly biomass from live readings
  // For each month: sum the LATEST weight reading per active system in that month
  const monthNames = ["Dic","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic26"];
  const monthTargets = { "Dic":null,"Ene":700,"Feb":null,"Mar":1400,"Abr":null,"May":null,"Jun":2800,"Sep":5600,"Dic26":11200 };

  const activeSystems = (systems||[]).filter(s=>s.estado==="Activo");

  // Calculate actual biomass per month from readings
  const data = monthNames.map(mes => {
    // Map month name to date range
    const monthMap = {"Dic":"2025-12","Ene":"2026-01","Feb":"2026-02","Mar":"2026-03","Abr":"2026-04","May":"2026-05","Jun":"2026-06","Jul":"2026-07","Ago":"2026-08","Sep":"2026-09","Oct":"2026-10","Nov":"2026-11","Dic26":"2026-12"};
    const monthKey = monthMap[mes];
    if (!monthKey) return { mes, actual:null, target:monthTargets[mes]||null };

    // For this month: find the latest peso reading per system
    const monthReadings = (readings||[]).filter(r => r.fecha && r.fecha.startsWith(monthKey) && r.peso);
    if (monthReadings.length === 0) {
      // Fall back to seed BIOMASA_DATA if no live readings
      const seed = BIOMASA_DATA.find(d=>d.mes===mes);
      return { mes, actual:seed?.actual||null, target:monthTargets[mes]||null };
    }

    // Sum latest reading per system in this month
    const bySystem = {};
    monthReadings.forEach(r => {
      if (!bySystem[r.sistema] || r.fecha > bySystem[r.sistema].fecha) {
        bySystem[r.sistema] = r;
      }
    });
    const totalKg = Object.values(bySystem).reduce((sum,r) => sum + (r.peso||0), 0) / 1000;
    return { mes, actual: Math.round(totalKg), target: monthTargets[mes]||null };
  }).filter(d => d.actual !== null || d.target !== null);

  const maxV = Math.max(...data.map(d => Math.max(d.actual||0, d.target||0)), 1400) * 1.08;
  const n = data.length;
  const barW = (cW / n) * 0.55;
  const gap  = cW / n;

  const toY = v => PT + cH - (v / maxV) * cH;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",overflow:"visible"}}>
      {/* Bars */}
      {data.map((d, i) => {
        const cx = PL + i * gap + gap / 2;
        const x  = cx - barW / 2;
        const isHov = hovered === i;
        return (
          <g key={i} style={{cursor:"pointer"}}
            onClick={() => setHovered(hovered === i ? null : i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}>
            {/* Target dashed outline */}
            {d.target && (
              <rect x={x-1} y={toY(d.target)} width={barW+2}
                height={PT + cH - toY(d.target)}
                fill="none" stroke="#f59e0b" strokeWidth="1.5"
                strokeDasharray="3,2" rx="2" opacity="0.7"/>
            )}
            {/* Actual solid bar */}
            {d.actual && (
              <rect x={x} y={toY(d.actual)} width={barW}
                height={PT + cH - toY(d.actual)}
                fill={isHov ? "#5eead4" : "#0d9488"} opacity="0.9" rx="2"/>
            )}
            {/* Tooltip on hover/tap */}
            {isHov && (d.actual || d.target) && (() => {
              const val   = d.actual || d.target;
              const isTarget = !d.actual && d.target;
              const tipY  = toY(val) - 6;
              const label = `${val.toLocaleString()} kg${isTarget ? " (obj)" : ""}`;
              const tipW  = label.length * 5.2 + 10;
              const tipX  = Math.min(Math.max(cx - tipW/2, PL), W - PR - tipW);
              return (
                <g>
                  <rect x={tipX} y={tipY - 11} width={tipW} height={13}
                    rx="4" fill="#1e293b" stroke="rgba(148,163,184,.3)" strokeWidth="0.5"/>
                  <text x={tipX + tipW/2} y={tipY} textAnchor="middle"
                    fontSize="8" fontWeight="700"
                    fill={isTarget ? "#f59e0b" : "#4ade80"}>{label}</text>
                </g>
              );
            })()}
            {/* X label */}
            <text x={cx} y={H - 14} textAnchor="middle" fontSize="8"
              fill={d.actual ? "#94a3b8" : "#475569"}>{d.mes}</text>
          </g>
        );
      })}
      {/* Centered legend */}
      {(() => {
        const legW = 130;
        const legX = (W - legW) / 2;
        return (
          <g transform={`translate(${legX}, ${H - 4})`}>
            <rect width="8" height="8" fill="#0d9488" opacity="0.9" rx="1" y="-8"/>
            <text x="11" y="-1" fontSize="8" fill="#94a3b8">{lang==="es"?"Real":"Actual"}</text>
            <rect x="55" width="8" height="8" fill="none" stroke="#f59e0b"
              strokeWidth="1.5" strokeDasharray="3,2" rx="1" y="-8"/>
            <text x="66" y="-1" fontSize="8" fill="#94a3b8">{lang==="es"?"Objetivo":"Target"}</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── BOARD CHART 1: Biomass Growth vs Sales (dual bar) ───────────────────────
function BoardBiomassVsSalesChart({ lang, data }) {
  const [hovered, setHovered] = useState(null);
  const W = 320, H = 130, PL = 8, PR = 8, PT = 14, PB = 32;
  const cW = W - PL - PR, cH = H - PT - PB;
  const chartData = data || SALES_DATA;
  const maxBio = Math.max(...data.map(d => Math.max(d.bioActual||0, d.bioProy||0))) * 1.1;
  const n = data.length;
  const slotW = cW / n;
  const barW = slotW * 0.32;

  const toY = v => PT + cH - (v / maxBio) * cH;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",overflow:"visible"}}>
      {data.map((d, i) => {
        const cx = PL + i * slotW + slotW / 2;
        const isHov = hovered === i;
        return (
          <g key={i} style={{cursor:"pointer"}}
            onClick={() => setHovered(hovered===i ? null : i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}>
            {/* Projected bar (left, dashed outline) */}
            <rect x={cx - barW - 1} y={toY(d.bioProy)} width={barW}
              height={PT + cH - toY(d.bioProy)}
              fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2" rx="2" opacity="0.8"/>
            {/* Actual bar (right, solid) */}
            {d.bioActual && (
              <rect x={cx + 1} y={toY(d.bioActual)} width={barW}
                height={PT + cH - toY(d.bioActual)}
                fill={d.bioActual >= d.bioProy ? "#4ade80" : "#0d9488"}
                opacity={isHov ? 1 : 0.85} rx="2"/>
            )}
            {/* Tooltip */}
            {isHov && (
              <g>
                <rect x={Math.min(cx - 30, W - 68)} y={PT - 12} width={66} height={24}
                  rx="4" fill="#1e293b" stroke="rgba(148,163,184,.3)" strokeWidth="0.5"/>
                <text x={Math.min(cx - 30, W - 68) + 33} y={PT - 4}
                  textAnchor="middle" fontSize="7" fill="#f59e0b">
                  {lang==="es"?"Obj:":"Tgt:"} {d.bioProy.toLocaleString()}kg
                </text>
                <text x={Math.min(cx - 30, W - 68) + 33} y={PT + 6}
                  textAnchor="middle" fontSize="7" fill={d.bioActual?"#4ade80":"#475569"}>
                  {lang==="es"?"Real:":"Act:"} {d.bioActual ? d.bioActual.toLocaleString()+"kg" : "—"}
                </text>
              </g>
            )}
            <text x={cx} y={H - 18} textAnchor="middle" fontSize="7"
              fill={d.bioActual ? "#94a3b8" : "#334155"}>{d.mes}</text>
          </g>
        );
      })}
      {/* Centered legend */}
      {(() => {
        const legW = 150; const legX = (W - legW) / 2;
        return (
          <g transform={`translate(${legX}, ${H - 4})`}>
            <rect width="8" height="8" fill="#0d9488" opacity="0.85" rx="1" y="-8"/>
            <text x="11" y="-1" fontSize="8" fill="#94a3b8">{lang==="es"?"Real":"Actual"}</text>
            <rect x="60" width="8" height="8" fill="none" stroke="#f59e0b"
              strokeWidth="1.5" strokeDasharray="3,2" rx="1" y="-8"/>
            <text x="71" y="-1" fontSize="8" fill="#94a3b8">{lang==="es"?"Proyectado":"Projected"}</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── BOARD CHART 2: Revenue Projected vs Actual (line + area) ────────────────
function BoardRevenueChart({ lang }) {
  const [hovered, setHovered] = useState(null);
  const W = 320, H = 120, PL = 8, PR = 8, PT = 14, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const data = REVENUE_CUMULATIVE;
  const maxV = Math.max(...data.map(d => d.proy)) * 1.1;
  const n = data.length;
  const toX = i => PL + (i / (n - 1)) * cW;
  const toY = v => PT + cH - (v / maxV) * cH;

  // Build projected line path
  const proyPts = data.map((d, i) => `${toX(i)},${toY(d.proy)}`).join(" ");
  // Actual line — only where we have data
  const actData = data.filter(d => d.actual !== null);
  const actPts  = actData.map((d, i) => `${toX(i)},${toY(d.actual)}`).join(" ");
  // Projected area fill
  const areaPath = `M ${toX(0)},${toY(data[0].proy)} ` +
    data.map((d,i) => `L ${toX(i)},${toY(d.proy)}`).join(" ") +
    ` L ${toX(n-1)},${PT+cH} L ${toX(0)},${PT+cH} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",overflow:"visible"}}>
      {/* Area under projected */}
      <path d={areaPath} fill="#f59e0b" opacity="0.07"/>
      {/* Projected line */}
      <polyline points={proyPts} fill="none" stroke="#f59e0b"
        strokeWidth="1.5" strokeDasharray="5,3" strokeLinecap="round"/>
      {/* Actual line (solid green) */}
      {actData.length > 1 && (
        <polyline points={actPts} fill="none" stroke="#4ade80"
          strokeWidth="2" strokeLinecap="round"/>
      )}
      {/* Dots + hover */}
      {data.map((d, i) => (
        <g key={i} style={{cursor:"pointer"}}
          onClick={() => setHovered(hovered===i ? null : i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}>
          {/* Projected dot */}
          <circle cx={toX(i)} cy={toY(d.proy)} r="3"
            fill={hovered===i ? "#f59e0b" : "#1e293b"}
            stroke="#f59e0b" strokeWidth="1.5"/>
          {/* Actual dot */}
          {d.actual !== null && (
            <circle cx={toX(i)} cy={toY(d.actual)} r="3.5"
              fill="#4ade80" stroke="#021c1e" strokeWidth="1"/>
          )}
          {/* X label */}
          <text x={toX(i)} y={H - 10} textAnchor="middle" fontSize="7"
            fill={d.actual !== null ? "#94a3b8" : "#334155"}>{d.label.split(" ")[0]}</text>
          {/* Tooltip */}
          {hovered === i && (
            <g>
              <rect x={Math.min(toX(i)-32, W-70)} y={PT-13} width={68} height={26}
                rx="4" fill="#1e293b" stroke="rgba(148,163,184,.3)" strokeWidth="0.5"/>
              <text x={Math.min(toX(i)-32, W-70)+34} y={PT-5}
                textAnchor="middle" fontSize="7" fill="#f59e0b">
                {lang==="es"?"Proy:":"Proj:"} ${d.proy.toFixed(0)}K
              </text>
              <text x={Math.min(toX(i)-32, W-70)+34} y={PT+5}
                textAnchor="middle" fontSize="7" fill="#4ade80">
                {lang==="es"?"Real:":"Act:"} {d.actual !== null ? `$${d.actual.toFixed(0)}K` : "—"}
              </text>
            </g>
          )}
        </g>
      ))}
      {/* "First sale pending" watermark */}
      <text x={W/2} y={PT + cH/2 + 4} textAnchor="middle" fontSize="9"
        fill="rgba(148,163,184,.25)" fontStyle="italic">
        {lang==="es"?"Primera venta pendiente":"First sale pending"}
      </text>
      {/* Centered legend */}
      {(() => {
        const legW = 160; const legX = (W - legW) / 2;
        return (
          <g transform={`translate(${legX}, ${H - 2})`}>
            <line x1="0" y1="-4" x2="10" y2="-4" stroke="#4ade80" strokeWidth="2"/>
            <text x="13" y="0" fontSize="8" fill="#94a3b8">{lang==="es"?"Real":"Actual"}</text>
            <line x1="60" y1="-4" x2="70" y2="-4" stroke="#f59e0b"
              strokeWidth="1.5" strokeDasharray="4,2"/>
            <text x="73" y="0" fontSize="8" fill="#94a3b8">{lang==="es"?"Proyectado":"Projected"}</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── BOARD CHART 3: Biomasa Acumulada vs Objetivo (progress gauge) ────────────
function BoardProgressChart({ lang }) {
  const [hovered, setHovered] = useState(null);
  // Key milestones: where are we vs the path to Dec 2026
  const milestones = [
    { label:"Ene 26", target:700,   actual:803  },
    { label:"Mar 26", target:1400,  actual:1390 },
    { label:"Jun 26", target:2800,  actual:null },
    { label:"Sep 26", target:5600,  actual:null },
    { label:"Dic 26", target:11200, actual:null },
  ];
  const W = 320, H = 110, PL = 46, PR = 12, PT = 10, PB = 24;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxV = 11200 * 1.05;
  const toY = v => PT + cH - (v / maxV) * cH;
  const toX = i => PL + (i / (milestones.length - 1)) * cW;

  const proyPts = milestones.map((d,i) => `${toX(i)},${toY(d.target)}`).join(" ");
  const actData = milestones.filter(d => d.actual !== null);
  const actPts  = actData.map((d,i) => `${toX(i)},${toY(d.actual)}`).join(" ");

  // Y axis ticks
  const ticks = [0, 2800, 5600, 11200];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",overflow:"visible"}}>
      {/* Y axis labels only (no gridlines) */}
      {ticks.map(t => (
        <text key={t} x={PL-4} y={toY(t)+3} textAnchor="end" fontSize="8" fill="#334155">
          {t >= 1000 ? `${t/1000}k` : t}
        </text>
      ))}
      {/* Projected area */}
      <path d={`M ${toX(0)},${toY(milestones[0].target)} ` +
        milestones.map((d,i)=>`L ${toX(i)},${toY(d.target)}`).join(" ") +
        ` L ${toX(milestones.length-1)},${PT+cH} L ${toX(0)},${PT+cH} Z`}
        fill="#f59e0b" opacity="0.06"/>
      {/* Projected line */}
      <polyline points={proyPts} fill="none" stroke="#f59e0b"
        strokeWidth="1.5" strokeDasharray="5,3"/>
      {/* Actual line */}
      {actData.length > 1 && (
        <polyline points={actPts} fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
      )}
      {/* Milestone dots */}
      {milestones.map((d, i) => (
        <g key={i} style={{cursor:"pointer"}}
          onClick={() => setHovered(hovered===i ? null : i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}>
          <circle cx={toX(i)} cy={toY(d.target)} r="3"
            fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5"/>
          {d.actual !== null && (
            <circle cx={toX(i)} cy={toY(d.actual)} r="4"
              fill={d.actual >= d.target ? "#4ade80" : "#fb923c"}
              stroke="#021c1e" strokeWidth="1"/>
          )}
          <text x={toX(i)} y={H-8} textAnchor="middle" fontSize="8"
            fill={d.actual !== null ? "#94a3b8" : "#334155"}>{d.label}</text>
          {hovered === i && (
            <g>
              <rect x={Math.min(toX(i)-34, W-75)} y={PT-12} width={72} height={26}
                rx="4" fill="#1e293b" stroke="rgba(148,163,184,.3)" strokeWidth="0.5"/>
              <text x={Math.min(toX(i)-34, W-75)+36} y={PT-3}
                textAnchor="middle" fontSize="7.5" fill="#f59e0b">
                {lang==="es"?"Obj:":"Tgt:"} {d.target.toLocaleString()}kg
              </text>
              <text x={Math.min(toX(i)-34, W-75)+36} y={PT+8}
                textAnchor="middle" fontSize="7.5"
                fill={d.actual ? (d.actual>=d.target?"#4ade80":"#fb923c") : "#475569"}>
                {lang==="es"?"Real:":"Act:"} {d.actual ? d.actual.toLocaleString()+"kg" : "—"}
              </text>
            </g>
          )}
        </g>
      ))}
      {/* On-track badge for Mar */}
      <text x={toX(1)+6} y={toY(1390)-6} fontSize="8" fill="#4ade80">✓</text>
    </svg>
  );
}

function SupervisorDashboard({ assignedTasks, systems, readings, lang, announcements, setAnnouncements, user, onNavigate, onViewPerson, chartPruebas }) {
  const [tab, setDashTab] = useState("resumen");
  const active = systems.filter(s=>s.estado==="Activo");
  const done   = assignedTasks.filter(t=>t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
  const pending = assignedTasks.filter(t=>t.actual===null&&!(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
  const HARVEST_CYCLE = 45;
  const CLEAN_CYCLE   = 22;

  // Compute per-system biomass metrics
  const systemMetrics = active.map(s=>{
    const latest = latestReading(readings, s.id);
    const prev   = prevReading(readings, s.id);
    const rate   = growthRate(latest, prev);
    const allR   = getSystemReadings(readings, s.id);
    const lastWeighed = latest ? daysAgo(latest.fecha) : null;
    const daysToHarvest = latest ? Math.max(0, HARVEST_CYCLE - daysAgo(latest.fecha)) : null;
    const daysToCleaning = latest ? Math.max(0, CLEAN_CYCLE - daysAgo(latest.fecha)) : null;
    return { ...s, latest, prev, rate, allR, lastWeighed, daysToHarvest, daysToCleaning };
  });

  const onTarget    = systemMetrics.filter(s=>s.rate!==null&&s.rate>=2.5);
  const slowGrowth  = systemMetrics.filter(s=>s.rate!==null&&s.rate>=1&&s.rate<2.5);
  const belowTarget = systemMetrics.filter(s=>s.rate!==null&&s.rate<1);
  const noData      = systemMetrics.filter(s=>s.rate===null);
  const totalBiomass = active.reduce((sum,s)=>{ const l=latestReading(readings,s.id); return sum+(l?.peso||0); },0);
  const dueHarvest  = systemMetrics.filter(s=>s.daysToHarvest!==null&&s.daysToHarvest<=7);
  const dueCleaning = systemMetrics.filter(s=>s.daysToCleaning!==null&&s.daysToCleaning<=5);

  // Crew biomass portfolio
  const buceadores = CREW.filter(c=>c.role==="Buceador");
  const crewBiomass = buceadores.map(c=>{
    const mySystems = systemMetrics.filter(s=>s.buceador===c.initials);
    const rates = mySystems.map(s=>s.rate).filter(r=>r!==null);
    const avgRate = rates.length ? rates.reduce((a,b)=>a+b,0)/rates.length : null;
    const totalKg = mySystems.reduce((sum,s)=>sum+(s.latest?.peso||0),0);
    return { ...c, mySystems, avgRate, totalKg };
  });

  const dashTabs = [
    { id:"resumen",  label:lang==="es"?"Resumen":"Summary" },
    { id:"biomasa",  label:lang==="es"?"Biomasa":"Biomass" },
    { id:"equipo",   label:lang==="es"?"Equipo":"Crew" },
    { id:"ciclos",   label:lang==="es"?"Ciclos":"Cycles" },
  ];

  return (
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{marginBottom:14}}>
        <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:0}}>{lang==="es"?"Panel General":"Dashboard"}</h2>
        <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>{new Date().toLocaleDateString(lang==="es"?"es-PA":"en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
      </div>

      {/* Tab bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
        {dashTabs.map(t=>(
          <button key={t.id} onClick={()=>setDashTab(t.id)}
            style={{padding:"8px 4px",borderRadius:10,border:`1px solid ${tab===t.id?"#0d9488":"rgba(148,163,184,.12)"}`,
              background:tab===t.id?"rgba(13,148,136,.12)":"transparent",
              color:tab===t.id?"#0d9488":"#64748b",fontWeight:700,fontSize:11,cursor:"pointer"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1: RESUMEN ═══ */}
      {tab==="resumen" && (
        <div>
          {/* Announcements */}
          <AnunciosPanel announcements={announcements} setAnnouncements={setAnnouncements} user={user} lang={lang}/>

          {/* KPI grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[
              {label:lang==="es"?"Biomasa total":"Total biomass", value:`${(totalBiomass/1000).toFixed(1)}kg`, color:"#0d9488", icon:"scale"},
              {label:lang==="es"?"Sistemas activos":"Active systems", value:active.length, color:"#4ade80", icon:"grid"},
              {label:lang==="es"?"En objetivo":"On target", value:onTarget.length, color:"#4ade80", icon:"check"},
              {label:lang==="es"?"Por debajo":"Below target", value:belowTarget.length+noData.length, color:"#f87171", icon:"alert"},
            ].map(k=>(
              <div key={k.label} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:10,color:"#64748b",fontWeight:600,marginBottom:4}}>{k.label}</div>
                    <div style={{fontSize:26,fontWeight:800,color:k.color,fontFamily:"monospace",lineHeight:1}}>{k.value}</div>
                  </div>
                  <div style={{width:32,height:32,borderRadius:9,background:`${k.color}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon name={k.icon} size={15} color={k.color}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {(dueHarvest.length>0||dueCleaning.length>0)&&(
            <div style={{...S.card,borderColor:"rgba(251,146,60,.2)",marginBottom:10}}>
              <div style={{fontSize:11,color:"#fb923c",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:.6}}>
                ⚠️ {lang==="es"?"Acción requerida":"Action required"}
              </div>
              {dueHarvest.map(s=>(
                <div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(148,163,184,.06)"}}>
                  <span style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{s.id} · {s.pueblo}</span>
                  <span style={{fontSize:11,color:"#4ade80",fontWeight:700}}>{lang==="es"?"Cosecha en":"Harvest in"} {s.daysToHarvest}d</span>
                </div>
              ))}
              {dueCleaning.map(s=>(
                <div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(148,163,184,.06)"}}>
                  <span style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{s.id} · {s.pueblo}</span>
                  <span style={{fontSize:11,color:"#fb923c",fontWeight:700}}>{lang==="es"?"Limpieza en":"Cleaning in"} {s.daysToCleaning}d</span>
                </div>
              ))}
            </div>
          )}

          {/* ── CHARTS ── */}
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"4px 0 10px",textTransform:"uppercase",letterSpacing:1}}>
            {lang==="es"?"Indicadores operacionales":"Operational indicators"}
          </div>

          {/* Chart 1: TDC */}
          <div style={{...S.card,paddingBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?"Promedio TDC":"Avg TDC"}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:9,padding:"1px 6px",borderRadius:5,background:"rgba(74,222,128,.12)",color:"#4ade80"}}>obj ≥2.5%/día</span>
                <span style={{fontSize:9,color:"#f59e0b"}}>🌿 cosecha</span>
              </div>
            </div>
            <TDCChart lang={lang}/>
          </div>

          {/* Chart 2: Pruebas */}
          <div style={{...S.card,paddingBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>
              {lang==="es"?"% Pruebas en Categorías":"% Tests by Category"}
            </div>
            <PruebasChart lang={lang} data={chartPruebas}/>
          </div>

          {/* Chart 3: Biomasa */}
          <div style={{...S.card,paddingBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?"Biomasa Total (kg)":"Total Biomass (kg)"}</div>
              <div style={{fontSize:9,color:"#64748b"}}>{lang==="es"?"Meta Dic 2026: 11,200 kg":"Target Dec 2026: 11,200 kg"}</div>
            </div>
            <BiomasaChart lang={lang} readings={readings} systems={systems}/>
          </div>

          {/* ── COMENTARIOS DEL CAMPO ─────────────────────────────────────── */}
          {(() => {
            // Task comments
            const taskComments = assignedTasks
              .filter(t => t.comentarioVaquero && t.comentarioVaquero.trim())
              .map(t => ({
                key: `task-${t.id}`,
                type: "task",
                initials: t.assignedTo,
                name: CREW.find(c=>c.initials===t.assignedTo)?.name||t.assignedTo,
                icon: TASK_SCHEMA[t.taskType]?.icon||"📋",
                label: TASK_SCHEMA[t.taskType]?.[lang==="es"?"label":"labelEn"]||t.taskType,
                sistema: t.sistema,
                comment: t.comentarioVaquero,
                fecha: t.comentarioFecha||t.date,
                day: t.day,
              }));

            // Reading comments (notas field)
            const today = new Date().toISOString().slice(0,10);
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() - 7);
            const readingComments = readings
              .filter(r => r.notas && r.notas.trim() && r.fecha >= thisWeek.toISOString().slice(0,10))
              .map(r => ({
                key: `reading-${r.id}`,
                type: "reading",
                initials: "—",
                name: lang==="es"?"Lectura de peso":"Weight reading",
                icon: "⚖️",
                label: lang==="es"?"Pesos":"Readings",
                sistema: r.sistema,
                comment: r.notas,
                fecha: r.fecha,
                day: "",
              }));

            const allComments = [...taskComments, ...readingComments]
              .sort((a,b) => (b.fecha||"").localeCompare(a.fecha||""))
              .slice(0, 12);

            if (allComments.length === 0) return null;

            return (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"4px 0 10px",textTransform:"uppercase",letterSpacing:1}}>
                  💬 {lang==="es"?"Comentarios del campo":"Field comments"}
                  <span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:10,
                    background:"rgba(13,148,136,.15)",color:"#0d9488",fontWeight:700}}>
                    {allComments.length}
                  </span>
                </div>
                {allComments.map(item=>{
                  const timeLabel = item.fecha
                    ? (item.fecha.length > 10
                        ? new Date(item.fecha).toLocaleTimeString(lang==="es"?"es-PA":"en-US",{hour:"2-digit",minute:"2-digit"})
                        : item.fecha)
                    : item.day||"";
                  return (
                    <div key={item.key} style={{
                      ...S.card,
                      borderLeft:"3px solid rgba(13,148,136,.5)",
                      background:"rgba(13,148,136,.04)",
                      padding:"10px 12px",
                      marginBottom:8,
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {item.initials !== "—" ? (
                            <div style={{width:28,height:28,borderRadius:8,
                              background:"rgba(13,148,136,.12)",
                              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <span style={{fontSize:10,fontWeight:800,color:"#0d9488"}}>{item.initials}</span>
                            </div>
                          ) : (
                            <span style={{fontSize:18,flexShrink:0}}>{item.icon}</span>
                          )}
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{item.name}</div>
                            <div style={{fontSize:10,color:"#64748b"}}>
                              {item.icon} {item.label}
                              {item.sistema&&` · ${item.sistema}`}
                            </div>
                          </div>
                        </div>
                        <span style={{fontSize:10,color:"#475569",flexShrink:0}}>{timeLabel}</span>
                      </div>
                      <div style={{
                        padding:"7px 10px",borderRadius:8,
                        background:"rgba(255,255,255,.03)",
                        border:"1px solid rgba(13,148,136,.12)",
                      }}>
                        <span style={{fontSize:12,color:"#2dd4bf",lineHeight:1.5,fontStyle:"italic"}}>
                          "{item.comment}"
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Team task status */}
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"4px 0 10px",textTransform:"uppercase",letterSpacing:1}}>
            {lang==="es"?"Estado del equipo":"Team status"}
          </div>
          {CREW.filter(c=>c.role!=="Supervisor").map(c=>{
            const mine=assignedTasks.filter(t=>t.assignedTo===c.initials);
            const d=mine.filter(t=>t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
            const p=mine.length?Math.round((d/mine.length)*100):0;
            return (
              <div key={c.initials} style={{...S.card,cursor:"pointer"}}
                onClick={()=>onViewPerson ? onViewPerson(c.initials) : setDashTab("equipo")}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:32,height:32,borderRadius:9,background:"rgba(13,148,136,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:10,fontWeight:800,color:"#0d9488"}}>{c.initials}</span>
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{c.name}</div>
                      <div style={{fontSize:10,color:"#64748b"}}>{c.role}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:800,color:p===100?"#4ade80":p>=70?"#fb923c":"#f87171",fontFamily:"monospace"}}>{p}%</div>
                    <div style={{fontSize:10,color:"#475569"}}>{d}/{mine.length}</div>
                  </div>
                </div>
                {S.scoreBar(p/100,p===100?"#4ade80":p>=70?"#fb923c":"#f87171")}
                <div style={{fontSize:9,color:"#334155",marginTop:5,textAlign:"right"}}>
                  {lang==="es"?"Ver detalle →":"View detail →"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ TAB 2: BIOMASA ═══ */}
      {tab==="biomasa" && (
        <div>
          {/* Status legend */}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {[[onTarget.length,"#4ade80",lang==="es"?"En objetivo":"On target"],[slowGrowth.length,"#fb923c",lang==="es"?"Lento":"Slow"],[belowTarget.length,"#f87171",lang==="es"?"Por debajo":"Below"],[noData.length,"#475569",lang==="es"?"Sin datos":"No data"]].map(([n,c,l])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:`${c}12`,border:`1px solid ${c}25`}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:c}}/>
                <span style={{fontSize:11,color:c,fontWeight:700}}>{n} {l}</span>
              </div>
            ))}
          </div>

          {/* System cards sorted: below-target first for attention */}
          {[...belowTarget,...slowGrowth,...onTarget,...noData].map(s=>{
            const rate = s.rate;
            const col  = growthColor(rate);
            return (
              <div key={s.id} style={{...S.card,borderLeft:`3px solid ${col}`,cursor:"pointer"}}
                onClick={()=>onNavigate && onNavigate("sistemas", s.id)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{fontSize:13,fontWeight:800,color:"#e2e8f0"}}>{s.id}</span>
                      <span style={{fontSize:11,color:"#64748b"}}>{s.pueblo}</span>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:6,background:`${col}15`,color:col,fontWeight:700}}>
                        {growthLabel(rate,lang)}
                      </span>
                    </div>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:10,color:"#475569"}}>{lang==="es"?"Último peso":"Last weight"}</div>
                        <div style={{fontSize:15,fontWeight:800,color:"#e2e8f0",fontFamily:"monospace"}}>
                          {s.latest?`${(s.latest.peso/1000).toFixed(2)}kg`:"—"}
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:"#475569"}}>{lang==="es"?"Crecimiento/día":"Growth/day"}</div>
                        <div style={{fontSize:15,fontWeight:800,color:col,fontFamily:"monospace"}}>
                          {rate!==null?`${rate>=0?"+":""}${rate.toFixed(2)}%`:"—"}
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:"#475569"}}>{lang==="es"?"Hace":"Checked"}</div>
                        <div style={{fontSize:13,fontWeight:600,color:"#94a3b8"}}>
                          {s.lastWeighed!==null?`${s.lastWeighed}d`:"—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{marginLeft:10,flexShrink:0,textAlign:"right"}}>
                    <div style={{fontSize:10,color:"#475569",marginBottom:4}}>
                      {lang==="es"?"Buceador":"Diver"}: <span style={{color:"#94a3b8",fontWeight:600}}>{s.buceador||"—"}</span>
                    </div>
                    <MiniSparkline data={s.allR} color={col} w={64} h={26}/>
                  </div>
                </div>
                {/* Days to harvest progress bar */}
                {s.daysToHarvest!==null&&(
                  <div style={{marginTop:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#475569",marginBottom:3}}>
                      <span>{lang==="es"?"Ciclo cosecha (45d)":"Harvest cycle (45d)"}</span>
                      <span style={{color:s.daysToHarvest<=7?"#4ade80":"#64748b",fontWeight:600}}>
                        {s.daysToHarvest<=0?(lang==="es"?"¡Cosechar!":"Harvest now!"):`${s.daysToHarvest}d ${lang==="es"?"restantes":"left"}`}
                      </span>
                    </div>
                    <div style={{height:4,borderRadius:2,background:"#1e293b",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(100,((HARVEST_CYCLE-(s.daysToHarvest||0))/HARVEST_CYCLE)*100)}%`,
                        background:s.daysToHarvest<=7?"#4ade80":"#0d9488",borderRadius:2}}/>
                    </div>
                  </div>
                )}
                <div style={{fontSize:9,color:"#334155",marginTop:6,textAlign:"right"}}>
                  {lang==="es"?"Ver sistema →":"View system →"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ TAB 3: EQUIPO VS BIOMASA ═══ */}
      {tab==="equipo" && (
        <div>
          <p style={{color:"#64748b",fontSize:12,margin:"0 0 14px",lineHeight:1.5}}>
            {lang==="es"
              ?"Crecimiento promedio por buceador en sus sistemas asignados. Diferencias señalan necesidad de coaching."
              :"Average growth rate per diver across their assigned systems. Gaps indicate coaching opportunities."}
          </p>

          {/* Buceadores ranked by avg growth */}
          {[...crewBiomass].sort((a,b)=>(b.avgRate||0)-(a.avgRate||0)).map((c,i)=>{
            const col = growthColor(c.avgRate);
            return (
              <div key={c.initials} style={{...S.card,marginBottom:10,cursor:"pointer"}}
                onClick={()=>onViewPerson && onViewPerson(c.initials)}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:38,height:38,borderRadius:11,background:i===0?"rgba(251,191,36,.15)":"rgba(13,148,136,.08)",
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:11,fontWeight:800,color:i===0?"#fbbf24":"#0d9488"}}>{c.initials}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{c.name}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>{c.mySystems.length} {lang==="es"?"sistemas":"systems"} · {(c.totalKg/1000).toFixed(1)}kg {lang==="es"?"total":"total"}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:18,fontWeight:800,color:col,fontFamily:"monospace"}}>
                          {c.avgRate!==null?`${c.avgRate>=0?"+":""}${c.avgRate.toFixed(2)}%`:"—"}
                        </div>
                        <div style={{fontSize:10,color:"#475569"}}>{lang==="es"?"por día":"per day"}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Per-system breakdown */}
                {c.mySystems.map(s=>{
                  const sc = growthColor(s.rate);
                  return (
                    <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"6px 10px",borderRadius:8,background:"rgba(255,255,255,.03)",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:sc,flexShrink:0}}/>
                        <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>{s.id}</span>
                        <span style={{fontSize:11,color:"#475569"}}>{s.pueblo}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <span style={{fontSize:11,color:"#64748b"}}>{s.latest?`${(s.latest.peso/1000).toFixed(2)}kg`:"—"}</span>
                        <span style={{fontSize:12,fontWeight:700,color:sc,fontFamily:"monospace",minWidth:52,textAlign:"right"}}>
                          {s.rate!==null?`${s.rate>=0?"+":""}${s.rate.toFixed(2)}%`:"—"}
                        </span>
                        <MiniSparkline data={s.allR} color={sc} w={44} h={18}/>
                      </div>
                    </div>
                  );
                })}
                {c.mySystems.length===0&&<div style={{fontSize:12,color:"#334155",padding:"6px 10px"}}>{lang==="es"?"Sin sistemas asignados":"No systems assigned"}</div>}
              </div>
            );
          })}

          {/* Capitanes section */}
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"16px 0 10px",textTransform:"uppercase",letterSpacing:1}}>
            {lang==="es"?"Capitanes — sistemas por polígono":"Captains — systems by polygon"}
          </div>
          {CREW.filter(c=>c.role==="Capitán").map(c=>{
            const mySystems = systemMetrics.filter(s=>s.capitan===c.initials);
            const rates = mySystems.map(s=>s.rate).filter(r=>r!==null);
            const avgRate = rates.length ? rates.reduce((a,b)=>a+b,0)/rates.length : null;
            const col = growthColor(avgRate);
            return (
              <div key={c.initials} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:34,height:34,borderRadius:9,background:"rgba(251,146,60,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:10,fontWeight:800,color:"#fb923c"}}>{c.initials}</span>
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{c.name}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{lang==="es"?"Capitán":"Captain"} · {mySystems.length} {lang==="es"?"sistemas":"systems"}</div>
                    </div>
                  </div>
                  <div style={{fontSize:15,fontWeight:800,color:col,fontFamily:"monospace"}}>
                    {avgRate!==null?`${avgRate>=0?"+":""}${avgRate.toFixed(2)}%`:"—"}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {mySystems.map(s=>(
                    <span key={s.id} style={{fontSize:10,padding:"2px 8px",borderRadius:6,
                      background:`${growthColor(s.rate)}12`,color:growthColor(s.rate),fontWeight:700}}>
                      {s.id} {s.rate!==null?`${s.rate>=0?"+":""}${s.rate.toFixed(1)}%`:"—"}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ TAB 4: CICLOS ═══ */}
      {tab==="ciclos" && (
        <div>
          <p style={{color:"#64748b",fontSize:12,margin:"0 0 14px",lineHeight:1.5}}>
            {lang==="es"
              ?"Ciclo cosecha: 45 días · Ciclo limpieza: 22 días. Días contados desde el último peso registrado."
              :"Harvest cycle: 45 days · Cleaning cycle: 22 days. Days counted from last recorded weight."}
          </p>

          {/* Due soon callouts */}
          {dueHarvest.length>0&&(
            <div style={{...S.card,borderColor:"rgba(74,222,128,.25)",marginBottom:10}}>
              <div style={{fontSize:11,color:"#4ade80",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:.6}}>
                🌿 {lang==="es"?"Cosecha próxima (≤7 días)":"Harvest soon (≤7 days)"}
              </div>
              {dueHarvest.map(s=><div key={s.id} style={{fontSize:13,color:"#e2e8f0",padding:"4px 0",borderBottom:"1px solid rgba(148,163,184,.06)"}}>{s.id} · {s.pueblo} — <span style={{color:"#4ade80",fontWeight:700}}>{s.daysToHarvest}d</span></div>)}
            </div>
          )}
          {dueCleaning.length>0&&(
            <div style={{...S.card,borderColor:"rgba(251,146,60,.25)",marginBottom:10}}>
              <div style={{fontSize:11,color:"#fb923c",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:.6}}>
                🧹 {lang==="es"?"Limpieza próxima (≤5 días)":"Cleaning soon (≤5 days)"}
              </div>
              {dueCleaning.map(s=><div key={s.id} style={{fontSize:13,color:"#e2e8f0",padding:"4px 0",borderBottom:"1px solid rgba(148,163,184,.06)"}}>{s.id} · {s.pueblo} — <span style={{color:"#fb923c",fontWeight:700}}>{s.daysToCleaning}d</span></div>)}
            </div>
          )}

          {/* All systems cycle status */}
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"4px 0 10px",textTransform:"uppercase",letterSpacing:1}}>
            {lang==="es"?"Todos los sistemas":"All systems"}
          </div>
          {[...systemMetrics].sort((a,b)=>(a.daysToHarvest||99)-(b.daysToHarvest||99)).map(s=>{
            const harvestPct = s.daysToHarvest!==null ? Math.min(100, ((HARVEST_CYCLE-(s.daysToHarvest||0))/HARVEST_CYCLE)*100) : 0;
            const cleanPct   = s.daysToCleaning!==null ? Math.min(100, ((CLEAN_CYCLE-(s.daysToCleaning||0))/CLEAN_CYCLE)*100) : 0;
            return (
              <div key={s.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:800,color:"#e2e8f0"}}>{s.id}</span>
                    <span style={{fontSize:11,color:"#64748b",marginLeft:8}}>{s.pueblo}</span>
                  </div>
                  <span style={{fontSize:10,color:"#475569"}}>
                    {s.lastWeighed!==null?`${lang==="es"?"pesado":"weighed"} ${s.lastWeighed}d ${lang==="es"?"atrás":"ago"}`:(lang==="es"?"sin datos":"no data")}
                  </span>
                </div>
                <div style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
                    <span style={{color:"#4ade80"}}>{lang==="es"?"Cosecha":"Harvest"} ({HARVEST_CYCLE}d)</span>
                    <span style={{color:s.daysToHarvest<=7?"#4ade80":"#64748b",fontWeight:600}}>
                      {s.daysToHarvest!==null?(s.daysToHarvest<=0?(lang==="es"?"¡Ahora!":"Now!"):`${s.daysToHarvest}d`):"—"}
                    </span>
                  </div>
                  <div style={{height:5,borderRadius:3,background:"#1e293b",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${harvestPct}%`,background:harvestPct>=90?"#4ade80":"#0d9488",borderRadius:3}}/>
                  </div>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
                    <span style={{color:"#fb923c"}}>{lang==="es"?"Limpieza":"Cleaning"} ({CLEAN_CYCLE}d)</span>
                    <span style={{color:s.daysToCleaning<=5?"#fb923c":"#64748b",fontWeight:600}}>
                      {s.daysToCleaning!==null?(s.daysToCleaning<=0?(lang==="es"?"¡Ahora!":"Now!"):`${s.daysToCleaning}d`):"—"}
                    </span>
                  </div>
                  <div style={{height:5,borderRadius:3,background:"#1e293b",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${cleanPct}%`,background:cleanPct>=90?"#fb923c":"#334155",borderRadius:3}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



function PlanSemanal({ assignedTasks, setAssignedTasks, systems, lang, user }) {
  const days = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const todayDayIndex = new Date().getDay(); // 0=Sun,1=Mon...6=Sat
  const defaultDay = todayDayIndex === 0 ? days[0] : todayDayIndex <= 6 ? days[todayDayIndex-1] : days[0];
  const [selectedDay, setDay] = useState(defaultDay);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const iStyle = S.input;
  const lStyle = S.label;
  const today = new Date().toISOString().slice(0,10);

  const emptyForm = { assignedTo:"HM", taskType:"vigilancia", sistema:"", objetivo:"", date:today, day:selectedDay, notas:"" };
  const [form, setForm] = useState(emptyForm);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  const dayTasks = assignedTasks.filter(t=>t.day===selectedDay);

  const handleSaveTask = () => {
    if(!form.assignedTo||!form.taskType) return;
    if(editTask) {
      setAssignedTasks(prev=>prev.map(t=>t.id===editTask.id?{...t,...form,objetivo:parseFloat(form.objetivo)||null}:t));
    } else {
      setAssignedTasks(prev=>[...prev,{...form,id:Date.now(),objetivo:parseFloat(form.objetivo)||null,actual:null,condicion:null,voiceNote:null,foto:null,confirmed:false,notas:form.notas||""}]);
    }
    setShowForm(false); setEditTask(null); setForm(emptyForm);
  };

  const handleDelete = (id) => setAssignedTasks(prev=>prev.filter(t=>t.id!==id));
  const handleEdit = (t) => { setEditTask(t); setForm({assignedTo:t.assignedTo,taskType:t.taskType,sistema:t.sistema||"",objetivo:t.objetivo||"",date:t.date,day:t.day}); setShowForm(true); };

  return (
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:0}}>{lang==="es"?"Plan Semanal":"Weekly Plan"}</h2>
          <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>Eduardo Valdés · {(() => {
            const now = new Date();
            const day = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
            const saturday = new Date(monday);
            saturday.setDate(monday.getDate() + 5);
            const fmt = d => d.toLocaleDateString(lang==="es"?"es-PA":"en-US",{day:"numeric",month:"short"});
            return `${lang==="es"?"Semana del":"Week of"} ${fmt(monday)} – ${fmt(saturday)}`;
          })()}</p>
        </div>
        <button onClick={()=>{setEditTask(null);setForm({...emptyForm,day:selectedDay});setShowForm(true);}} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#0d9488,#0f766e)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <Icon name="plus" size={14} color="#fff"/>{lang==="es"?"Asignar":"Assign"}
        </button>
      </div>

      {/* Day tabs */}
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:14}}>
        {days.map(d=>{
          const cnt=assignedTasks.filter(t=>t.day===d).length;
          const done=assignedTasks.filter(t=>t.day===d&&(t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null))).length;
          return (
            <button key={d} onClick={()=>setDay(d)}
              style={{flexShrink:0,padding:"6px 12px",borderRadius:20,border:`1px solid ${selectedDay===d?"#0d9488":"rgba(148,163,184,.12)"}`,background:selectedDay===d?"rgba(13,148,136,.15)":"transparent",color:selectedDay===d?"#0d9488":"#64748b",fontWeight:600,fontSize:11,cursor:"pointer",position:"relative"}}>
              {d.slice(0,3)} {cnt>0&&<span style={{fontSize:9,marginLeft:2,color:done===cnt?"#4ade80":"#fb923c"}}>({done}/{cnt})</span>}
            </button>
          );
        })}
      </div>

      {/* Tasks for day */}
      {dayTasks.length===0&&<p style={{color:"#475569",fontSize:13,textAlign:"center",padding:"24px 0"}}>{lang==="es"?"Sin tareas asignadas":"No tasks assigned"}</p>}
      {dayTasks.map(t=>{
        const schema=TASK_SCHEMA[t.taskType]||{icon:"📋",label:t.taskType};
        const sys=systems.find(s=>s.id===t.sistema);
        const done=t.actual!==null||(schema.yesno&&t.condicion!==null);
        return (
          <div key={t.id} style={{...S.card,borderLeft:`3px solid ${done?"#4ade80":"rgba(148,163,184,.2)"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:24}}>{schema.icon}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?schema.label:schema.labelEn}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{CREW.find(c=>c.initials===t.assignedTo)?.name||t.assignedTo} {sys?`· ${sys.id}`:""}</div>
                  {t.objetivo&&<div style={{fontSize:10,color:"#475569"}}>{lang==="es"?"Objetivo:":"Target:"} {t.objetivo} {schema.unit}</div>}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:done?"rgba(74,222,128,.1)":"rgba(148,163,184,.06)",color:done?"#4ade80":"#64748b",fontWeight:600}}>{done?(lang==="es"?"Hecho":"Done"):(lang==="es"?"Pendiente":"Pending")}</span>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>handleEdit(t)} style={{padding:"3px 8px",borderRadius:6,border:"none",background:"rgba(13,148,136,.1)",color:"#0d9488",fontSize:10,fontWeight:700,cursor:"pointer"}}>✏️</button>
                  <button onClick={()=>handleDelete(t.id)} style={{padding:"3px 8px",borderRadius:6,border:"none",background:"rgba(248,113,113,.1)",color:"#f87171",fontSize:10,fontWeight:700,cursor:"pointer"}}>🗑️</button>
                </div>
              </div>
            </div>
            {/* Logged data if done */}
            {done&&(
              <div style={{marginTop:8,display:"flex",gap:8,fontSize:11}}>
                {t.actual!==null&&<span style={{color:"#4ade80",fontWeight:700}}>{t.actual} {schema.unit}</span>}
                {t.condicion&&CONDICION_EMOJIS.find(c=>c.value===t.condicion)&&<span>{CONDICION_EMOJIS.find(c=>c.value===t.condicion).emoji}</span>}
                {t.voiceNote&&<button onClick={()=>{const a=new Audio(t.voiceNote);a.play();}} style={{background:"rgba(74,222,128,.1)",border:"none",color:"#4ade80",fontSize:10,borderRadius:6,padding:"1px 6px",cursor:"pointer"}}>🎙 {lang==="es"?"escuchar":"listen"}</button>}
                {t.foto&&<span style={{color:"#0d9488"}}>📷</span>}
              </div>
            )}
          </div>
        );
      })}

      {/* Assign task modal */}
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowForm(false)}>
          <div style={{width:"100%",maxWidth:480,background:"#0f1724",borderRadius:"20px 20px 0 0",padding:"20px 20px 36px",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:"rgba(148,163,184,.2)",margin:"0 auto 16px"}}/>
            <h3 style={{color:"#e2e8f0",fontSize:16,fontWeight:800,margin:"0 0 16px"}}>{editTask?(lang==="es"?"Editar Tarea":"Edit Task"):(lang==="es"?"Asignar Tarea":"Assign Task")}</h3>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={lStyle}>{lang==="es"?"Persona":"Person"}</label>
                <select value={form.assignedTo} onChange={e=>F("assignedTo",e.target.value)} style={{...iStyle,appearance:"none"}}>
                  {CREW.filter(c=>c.role!=="Supervisor").map(c=><option key={c.initials} value={c.initials}>{c.initials} – {c.name.split(" ")[0]}</option>)}
                </select>
              </div>
              <div>
                <label style={lStyle}>{lang==="es"?"Día":"Day"}</label>
                <select value={form.day} onChange={e=>F("day",e.target.value)} style={{...iStyle,appearance:"none"}}>
                  {days.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div style={{marginBottom:12}}>
              <label style={lStyle}>{lang==="es"?"Tipo de tarea":"Task type"}</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {Object.entries(TASK_SCHEMA).map(([key,schema])=>(
                  <button key={key} onClick={()=>F("taskType",key)}
                    style={{padding:"10px 4px",borderRadius:10,border:`1.5px solid ${form.taskType===key?"#0d9488":"rgba(148,163,184,.1)"}`,background:form.taskType===key?"rgba(13,148,136,.15)":"rgba(255,255,255,.02)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <span style={{fontSize:20}}>{schema.icon}</span>
                    <span style={{fontSize:9,fontWeight:700,color:form.taskType===key?"#0d9488":"#64748b",lineHeight:1.2,textAlign:"center"}}>{lang==="es"?schema.label.split(" ")[0]:schema.labelEn.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={lStyle}>{lang==="es"?"Sistema (opcional)":"System (optional)"}</label>
                <select value={form.sistema} onChange={e=>F("sistema",e.target.value)} style={{...iStyle,appearance:"none"}}>
                  <option value="">– {lang==="es"?"ninguno":"none"}</option>
                  {systems.filter(s=>s.estado==="Activo").map(s=><option key={s.id} value={s.id}>{s.id} – {s.pueblo}</option>)}
                </select>
              </div>
              <div>
                <label style={lStyle}>{lang==="es"?"Objetivo":"Target"} ({TASK_SCHEMA[form.taskType]?.[lang==="es"?"unit":"unitEn"]||""})</label>
                <input type="number" value={form.objetivo} onChange={e=>F("objetivo",e.target.value)} placeholder="0" style={iStyle}/>
              </div>
            </div>

            <div style={{marginBottom:12}}>
              <label style={lStyle}>{lang==="es"?"Instrucciones / Notas":"Instructions / Notes"}</label>
              <textarea value={form.notas||""} onChange={e=>F("notas",e.target.value)} rows={2}
                style={{...iStyle,resize:"none"}}
                placeholder={lang==="es"?"ej. Mover sistema hacia coordenadas X, revisar aceite...":"e.g. Relocate system to coordinates X, check oil..."}/>
            </div>

            <button onClick={handleSaveTask} style={{...S.btn(true),marginTop:4}}>
              {lang==="es"?"Guardar":"Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONAL DASHBOARD — unified profile for any crew member
// Reachable from: Resumen team cards, Equipo list, Biomasa buceador name,
//                 Capitán task inbox, Plan Semanal assignee name
// ═══════════════════════════════════════════════════════════════════════════════
function PersonalDashboard({ initials, onBack, assignedTasks, systems, readings,
  weeklyIncidents, timecards, setTimecards, lang, canEdit, user }) {

  const member   = CREW.find(c => c.initials === initials);
  const today    = new Date().toISOString().slice(0,10);
  const todayName= ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date().getDay()];

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const myTasks   = assignedTasks.filter(t => t.assignedTo === initials);
  const todayTasks= myTasks.filter(t => t.day === todayName || t.date === today);
  const done      = myTasks.filter(t => t.actual !== null || (TASK_SCHEMA[t.taskType]?.yesno && t.condicion !== null)).length;
  const pct       = myTasks.length ? Math.round((done/myTasks.length)*100) : 0;

  // ── Systems ────────────────────────────────────────────────────────────────
  const mySystems = systems.filter(s =>
    (s.capitan === initials || s.buceador === initials) && s.estado === "Activo"
  );

  // Per-system growth
  const sysWithRate = mySystems.map(s => {
    const sysReadings = readings.filter(r=>r.sistema===s.id).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
    const latest = sysReadings[sysReadings.length-1]||null;
    const prev   = sysReadings[sysReadings.length-2]||null;
    let rate = null;
    if (latest && prev && prev.peso) {
      const days = Math.max(1,(new Date(latest.fecha)-new Date(prev.fecha))/(1000*60*60*24));
      rate = parseFloat(((Math.log(latest.peso/prev.peso)/days)*100).toFixed(2));
    }
    return { ...s, latest, rate };
  });
  const rates     = sysWithRate.map(s=>s.rate).filter(r=>r!==null);
  const avgRate   = rates.length ? (rates.reduce((a,b)=>a+b,0)/rates.length).toFixed(2) : null;

  // ── Incidents ──────────────────────────────────────────────────────────────
  const latestInc = weeklyIncidents
    .filter(i=>i.initials===initials)
    .sort((a,b)=>b.week.localeCompare(a.week))[0];

  // ── Timecard ───────────────────────────────────────────────────────────────
  const todayCard = timecards.find(t=>t.date===today&&t.initials===initials);
  const [checkInVal,  setCheckInVal]  = useState(todayCard?.checkIn  || "");
  const [checkOutVal, setCheckOutVal] = useState(todayCard?.checkOut || "");
  const [tcSaved,     setTcSaved]     = useState(false);

  const saveTimecard = () => {
    setTimecards(prev => {
      const filtered = prev.filter(t=>!(t.date===today&&t.initials===initials));
      return [...filtered, { date:today, initials, checkIn:checkInVal, checkOut:checkOutVal }];
    });
    setTcSaved(true);
    setTimeout(()=>setTcSaved(false), 1800);
  };

  const horas = calcHoras(checkInVal, checkOutVal);

  const roleColor = { Buceador:"#0d9488", Capitán:"#fb923c", Supervisor:"#f59e0b", Colaborador:"#a78bfa" };
  const col = roleColor[member?.role] || "#64748b";
  const rateCol = avgRate===null?"#475569":parseFloat(avgRate)>=2.5?"#4ade80":parseFloat(avgRate)>=1?"#fb923c":"#f87171";

  return (
    <div style={{padding:"16px 16px 100px"}}>

      {/* Back button */}
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,
        background:"none",border:"none",color:"#0d9488",fontSize:13,fontWeight:600,
        cursor:"pointer",marginBottom:14,padding:0}}>
        <Icon name="back" size={16} color="#0d9488"/>
        {lang==="es"?"Volver":"Back"}
      </button>

      {/* Identity card */}
      <div style={{...S.card,
        background:`linear-gradient(135deg,${col}12,rgba(2,8,24,.5))`,
        border:`1px solid ${col}22`,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:52,height:52,borderRadius:14,
            background:`${col}18`,border:`1px solid ${col}30`,
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:16,fontWeight:800,color:col}}>{initials}</span>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:800,color:"#e2e8f0"}}>{member?.name}</div>
            <span style={{fontSize:11,padding:"2px 9px",borderRadius:8,
              background:`${col}18`,color:col,fontWeight:700}}>{member?.role}</span>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:26,fontWeight:900,color:"#0d9488",fontFamily:"monospace"}}>{pct}%</div>
            <div style={{fontSize:10,color:"#64748b"}}>{done}/{myTasks.length} {lang==="es"?"tareas":"tasks"}</div>
          </div>
        </div>
        {S.scoreBar(pct/100, pct===100?"#4ade80":pct>=70?"#fb923c":"#f87171")}
      </div>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[
          { label:lang==="es"?"TDC promedio":"Avg TDC", value:avgRate!==null?`${parseFloat(avgRate)>=0?"+":""}${avgRate}%`:"—", color:rateCol },
          { label:lang==="es"?"Sistemas":"Systems", value:mySystems.length, color:"#94a3b8" },
          { label:lang==="es"?"Incidencias":"Incidents", value:(latestInc?.tardanzas||0)+(latestInc?.ausencias||0), color:(latestInc?.tardanzas||0)+(latestInc?.ausencias||0)>0?"#f87171":"#4ade80" },
        ].map(k=>(
          <div key={k.label} style={S.card}>
            <div style={{fontSize:9,color:"#64748b",textTransform:"uppercase",letterSpacing:.6,marginBottom:3}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.color,fontFamily:"monospace"}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── TIMECARD ────────────────────────────────────────────────────────── */}
      <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"0 0 8px",
        textTransform:"uppercase",letterSpacing:1}}>
        ⏱ {lang==="es"?"Tarjeta de tiempo — hoy":"Timecard — today"}
      </div>
      <div style={{...S.card,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div>
            <label style={S.label}>{lang==="es"?"Entrada":"Check-in"}</label>
            <input type="time" value={checkInVal}
              onChange={e=>setCheckInVal(e.target.value)}
              disabled={!canEdit}
              style={{...S.input,colorScheme:"dark",fontSize:18,fontWeight:700,
                color:"#4ade80",fontFamily:"monospace",textAlign:"center"}}/>
          </div>
          <div>
            <label style={S.label}>{lang==="es"?"Salida":"Check-out"}</label>
            <input type="time" value={checkOutVal}
              onChange={e=>setCheckOutVal(e.target.value)}
              disabled={!canEdit}
              style={{...S.input,colorScheme:"dark",fontSize:18,fontWeight:700,
                color:"#f87171",fontFamily:"monospace",textAlign:"center"}}/>
          </div>
        </div>
        {horas && (
          <div style={{display:"flex",justifyContent:"space-between",
            padding:"8px 12px",borderRadius:9,
            background:"rgba(255,255,255,.03)",marginBottom:10}}>
            <span style={{fontSize:12,color:"#64748b"}}>
              {lang==="es"?"Horas trabajadas hoy":"Hours worked today"}
            </span>
            <span style={{fontSize:15,fontWeight:800,color:"#e2e8f0",fontFamily:"monospace"}}>
              {horas}h
            </span>
          </div>
        )}
        {canEdit && (
          <button onClick={saveTimecard}
            style={{...S.btn(checkInVal||checkOutVal),fontSize:13,padding:10}}>
            {tcSaved?"✓ Guardado":(lang==="es"?"Guardar tarjeta":"Save timecard")}
          </button>
        )}
        {!canEdit && (
          <p style={{fontSize:11,color:"#475569",margin:0,textAlign:"center"}}>
            {lang==="es"?"Solo Eduardo puede editar tarjetas de tiempo":"Only Eduardo can edit timecards"}
          </p>
        )}
      </div>

      {/* ── TODAY'S TASKS ────────────────────────────────────────────────────── */}
      <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"0 0 8px",
        textTransform:"uppercase",letterSpacing:1}}>
        {lang==="es"?"Tareas de hoy":"Today's tasks"} — {todayTasks.length}
      </div>
      {todayTasks.length===0 ? (
        <div style={{...S.card,textAlign:"center",padding:20,marginBottom:14}}>
          <p style={{color:"#475569",fontSize:12,margin:0}}>
            {lang==="es"?"Sin tareas asignadas para hoy":"No tasks assigned for today"}
          </p>
        </div>
      ) : (
        <div style={{marginBottom:14}}>
          {todayTasks.map(t=>(
            <TaskLogCard key={t.id} task={t} systems={systems} lang={lang}
              onComplete={()=>{}} canEdit={false}/>
          ))}
        </div>
      )}

      {/* ── ASSIGNED SYSTEMS ─────────────────────────────────────────────────── */}
      {sysWithRate.length > 0 && (
        <>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"0 0 8px",
            textTransform:"uppercase",letterSpacing:1}}>
            {lang==="es"?"Sistemas a cargo":"Responsible systems"} — {sysWithRate.length}
          </div>
          {sysWithRate.map(s=>{
            const rc = s.rate===null?"#475569":s.rate>=2.5?"#4ade80":s.rate>=1?"#fb923c":"#f87171";
            return (
              <div key={s.id} style={{...S.card,borderLeft:`3px solid ${rc}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:"#e2e8f0"}}>{s.id}</div>
                    <div style={{fontSize:11,color:"#64748b"}}>{s.pueblo||s.region}</div>
                    <div style={{display:"flex",gap:4,marginTop:3}}>
                      {s.categoria&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,
                        background:s.categoria==="comercial"?"rgba(13,148,136,.15)":"rgba(74,222,128,.15)",
                        color:s.categoria==="comercial"?"#0d9488":"#4ade80",fontWeight:700}}>
                        {s.categoria}</span>}
                      {s.capitan===initials&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,
                        background:"rgba(251,146,60,.15)",color:"#fb923c",fontWeight:700}}>Cap</span>}
                      {s.buceador===initials&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,
                        background:"rgba(13,148,136,.15)",color:"#0d9488",fontWeight:700}}>Buc</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:16,fontWeight:800,color:rc,fontFamily:"monospace"}}>
                      {s.rate!==null?`${s.rate>=0?"+":""}${s.rate}%`:"—"}
                    </div>
                    <div style={{fontSize:10,color:"#64748b"}}>/día</div>
                    {s.latest&&<div style={{fontSize:10,color:"#475569",marginTop:2}}>
                      {(s.latest.peso/1000).toFixed(2)}kg
                    </div>}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── INCIDENTS THIS WEEK ───────────────────────────────────────────────── */}
      {latestInc && (
        <>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"14px 0 8px",
            textTransform:"uppercase",letterSpacing:1}}>
            {lang==="es"?"Incidencias esta semana":"This week's incidents"}
          </div>
          <div style={{...S.card,
            borderColor:(latestInc.tardanzas+latestInc.ausencias)>0
              ?"rgba(248,113,113,.2)":"rgba(74,222,128,.15)"}}>
            <div style={{display:"flex",gap:10}}>
              {[
                [lang==="es"?"Tardanzas":"Late",latestInc.tardanzas],
                [lang==="es"?"Ausencias":"Absent",latestInc.ausencias],
              ].map(([l,v])=>(
                <div key={l} style={{flex:1,textAlign:"center",padding:"10px 0",
                  background:"rgba(255,255,255,.03)",borderRadius:10}}>
                  <div style={{fontSize:26,fontWeight:900,
                    color:v>0?"#f87171":"#4ade80",fontFamily:"monospace"}}>{v}</div>
                  <div style={{fontSize:10,color:"#64748b"}}>{l}</div>
                </div>
              ))}
            </div>
            {latestInc.notas&&<p style={{fontSize:11,color:"#94a3b8",
              margin:"8px 0 0",fontStyle:"italic"}}>"{latestInc.notas}"</p>}
          </div>
        </>
      )}
    </div>
  );
}


const CAPITAN_REGIONS = {
  JV:  { regions:["Bahía Azul"], color:"#0d9488", note:"Avispa · Ensenada · Igle. Apostólica · P26-x semilleros" },
  RBC: { regions:["Playa Roja"], color:"#f87171", note:"Gallinazo · P36-x · P39-x" },
  RBM: { regions:["Cayo de Agua"], color:"#4ade80", note:"Jobori · P5-x" },
  RV:  { regions:["Cayo de Agua"], color:"#4ade80", note:"Cayo de Agua · Ensenada" },
};

function CapitanTareas({ assignedTasks, setAssignedTasks, systems, user, lang, announcements }) {
  const myInitials = user.initials;
  const regionInfo = CAPITAN_REGIONS[myInitials] || { regions:[], color:"#64748b", note:"" };
  const [activeTask, setActiveTask] = useState(null);

  // Tasks assigned directly to this captain
  const myTasks = assignedTasks.filter(t => t.assignedTo === myInitials);

  // Systems this captain is responsible for
  const mySystems = systems.filter(s => s.capitan === myInitials && s.estado === "Activo");

  const days = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const todayName = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date().getDay()];

  const done    = myTasks.filter(t => t.actual !== null || (TASK_SCHEMA[t.taskType]?.yesno && t.condicion !== null)).length;
  const pending = myTasks.filter(t => t.actual === null && !(TASK_SCHEMA[t.taskType]?.yesno && t.condicion !== null)).length;
  const pct     = myTasks.length ? Math.round((done / myTasks.length) * 100) : 0;

  const handleComplete = (updatedTask) => {
    setAssignedTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setActiveTask(null);
  };

  const byDay = {};
  days.forEach(d => { byDay[d] = myTasks.filter(t => t.day === d); });

  return (
    <div style={{padding:"16px 16px 100px"}}>

      {/* Header */}
      <div style={{marginBottom:14}}>
        <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:0}}>
          {lang==="es"?"Mis Tareas":"My Tasks"}
        </h2>
        <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>
          {user.name} · Capitán
        </p>
      </div>

      {/* Announcements */}
      <AnunciosPanel announcements={announcements} setAnnouncements={()=>{}} user={user} lang={lang}/>

      {/* Region responsibility banner */}
      {regionInfo.regions.length > 0 && (
        <div style={{...S.card, borderLeft:`3px solid ${regionInfo.color}`,
          background:`${regionInfo.color}08`, marginBottom:14}}>
          <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",
            letterSpacing:.6,marginBottom:4}}>
            {lang==="es"?"Tu zona de responsabilidad":"Your region"}
          </div>
          <div style={{fontSize:15,fontWeight:800,color:regionInfo.color,marginBottom:2}}>
            {regionInfo.regions.join(" · ")}
          </div>
          <div style={{fontSize:11,color:"#64748b"}}>{regionInfo.note}</div>
          <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>
            {mySystems.length} {lang==="es"?"sistemas activos bajo tu cargo":"active systems under your charge"}
          </div>
        </div>
      )}

      {/* Weekly progress */}
      <div style={{...S.card,background:"rgba(13,148,136,.07)",border:"1px solid rgba(13,148,136,.15)",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
          <div>
            <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:.6}}>
              {lang==="es"?"Mis tareas esta semana":"My tasks this week"}
            </div>
            <div style={{fontSize:32,fontWeight:900,color:"#0d9488",fontFamily:"monospace",lineHeight:1}}>
              {pct}<span style={{fontSize:14,color:"#64748b"}}>%</span>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{done}/{myTasks.length}</div>
            <div style={{fontSize:11,color:pending>0?"#fb923c":"#4ade80"}}>
              {pending>0?`${pending} ${lang==="es"?"pendientes":"pending"}`:"✓ Todo listo"}
            </div>
          </div>
        </div>
        <div style={{height:7,borderRadius:4,background:"rgba(255,255,255,.06)",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,
            background:"linear-gradient(90deg,#0d9488,#2dd4bf)",
            borderRadius:4,transition:"width .5s ease"}}/>
        </div>
      </div>

      {/* Tasks by day */}
      {myTasks.length === 0 ? (
        <div style={{...S.card,textAlign:"center",padding:32}}>
          <span style={{fontSize:32}}>📋</span>
          <p style={{color:"#475569",fontSize:13,margin:"10px 0 0"}}>
            {lang==="es"
              ?"Eduardo no ha asignado tareas para esta semana todavía."
              :"Eduardo has not assigned tasks for this week yet."}
          </p>
        </div>
      ) : (
        days.map(d => {
          const dayTasks = byDay[d] || [];
          if (dayTasks.length === 0) return null;
          const dayDone = dayTasks.filter(t =>
            t.actual !== null || (TASK_SCHEMA[t.taskType]?.yesno && t.condicion !== null)
          ).length;
          const isToday = d === todayName;
          return (
            <div key={d} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,fontWeight:800,color:isToday?"#0d9488":"#94a3b8"}}>{d}</span>
                  {isToday && (
                    <span style={{fontSize:10,padding:"1px 7px",borderRadius:6,
                      background:"rgba(13,148,136,.15)",color:"#0d9488",fontWeight:700}}>HOY</span>
                  )}
                </div>
                <span style={{fontSize:11,color:dayDone===dayTasks.length?"#4ade80":"#64748b",fontWeight:600}}>
                  {dayDone}/{dayTasks.length} ✓
                </span>
              </div>
              {dayTasks.map(t => (
                <TaskLogCard key={t.id} task={t} systems={systems} lang={lang}
                  onComplete={setActiveTask} canEdit={true}/>
              ))}
            </div>
          );
        })
      )}

      {/* My systems summary */}
      {mySystems.length > 0 && (
        <div style={{marginTop:8}}>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"0 0 10px",
            textTransform:"uppercase",letterSpacing:1}}>
            {lang==="es"?"Mis sistemas":"My systems"}
          </div>
          {mySystems.map(s => (
            <div key={s.id} style={{...S.card,
              borderLeft:`3px solid ${regionInfo.color}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:"#e2e8f0"}}>{s.id}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{s.pueblo || s.region}</div>
                  <div style={{display:"flex",gap:4,marginTop:3}}>
                    {s.categoria && (
                      <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,
                        background:s.categoria==="comercial"?"rgba(13,148,136,.15)":"rgba(74,222,128,.15)",
                        color:s.categoria==="comercial"?"#0d9488":"#4ade80",fontWeight:700}}>
                        {s.categoria}
                      </span>
                    )}
                    {s.buceador && (
                      <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,
                        background:"rgba(148,163,184,.1)",color:"#94a3b8",fontWeight:600}}>
                        Buc: {s.buceador}
                      </span>
                    )}
                    {s.fechaCosecha && (
                      <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,
                        background:"rgba(74,222,128,.08)",color:"#4ade80"}}>
                        🌿 {s.fechaCosecha}
                      </span>
                    )}
                  </div>
                </div>
                {!s.fechaCosecha && (
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:6,
                    background:"rgba(251,191,36,.1)",color:"#fbbf24",fontWeight:700}}>
                    ⚠ fecha pendiente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTask && (
        <TaskCompleteModal task={activeTask} systems={systems} lang={lang}
          onSave={handleComplete} onClose={()=>setActiveTask(null)}/>
      )}
    </div>
  );
}

function EquipoTab({ assignedTasks, weeklyIncidents, setWeeklyIncidents, timecards, setTimecards, systems, readings, lang, user }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <PersonalDashboard
      initials={selected}
      onBack={()=>setSelected(null)}
      assignedTasks={assignedTasks}
      systems={systems}
      readings={readings}
      weeklyIncidents={weeklyIncidents}
      timecards={timecards}
      setTimecards={setTimecards}
      lang={lang}
      canEdit={["supervisor","ceo","consultant"].includes(user.role)}
      user={user}
    />;
  }

  return (
    <div style={{padding:"16px 16px 100px"}}>
      <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:"0 0 16px"}}>{lang==="es"?"Equipo":"Team"}</h2>
      {CREW.filter(c=>c.role!=="Supervisor").map((c,i)=>{
        const tasks=assignedTasks.filter(t=>t.assignedTo===c.initials);
        const done=tasks.filter(t=>t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
        const pct=tasks.length?Math.round((done/tasks.length)*100):0;
        const incidents=weeklyIncidents.filter(i=>i.initials===c.initials).reduce((s,i)=>s+i.tardanzas+i.ausencias,0);
        return (
          <div key={c.initials} style={{...S.card,cursor:"pointer"}} onClick={()=>setSelected(c.initials)}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:11,background:"rgba(13,148,136,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:800,color:"#0d9488"}}>{c.initials}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{c.name}</div>
                <div style={{fontSize:11,color:"#64748b"}}>{c.role}</div>
                {S.scoreBar(pct/100,pct===100?"#4ade80":pct>=70?"#fb923c":"#f87171")}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:15,fontWeight:800,color:pct===100?"#4ade80":pct>=70?"#fb923c":"#f87171",fontFamily:"monospace"}}>{pct}%</div>
                {incidents>0&&<div style={{fontSize:10,color:"#f87171",fontWeight:700}}>⏰{incidents}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SHARED: SISTEMAS + MAP + PROFILE ────────────────────────────────────────

// ─── ADDABLE SELECT — dropdown with "Add new…" option ────────────────────────
function AddableSelect({ value, onChange, options, onAddOption, lang, label, placeholder }) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const canAdd = ["ceo","consultant","supervisor"];

  const handleAdd = () => {
    const trimmed = newVal.trim();
    if (!trimmed) return;
    onAddOption(trimmed);
    onChange(trimmed);
    setNewVal("");
    setAdding(false);
  };

  if (adding) return (
    <div style={{display:"flex",gap:6}}>
      <input
        autoFocus
        value={newVal}
        onChange={e=>setNewVal(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter") handleAdd(); if(e.key==="Escape"){setAdding(false);setNewVal("");} }}
        placeholder={placeholder||lang==="es"?"Nombre...":"Name..."}
        style={{...S.input,flex:1}}
      />
      <button onClick={handleAdd} style={{padding:"0 12px",borderRadius:9,border:"none",background:"#0d9488",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}}>✓</button>
      <button onClick={()=>{setAdding(false);setNewVal("");}} style={{padding:"0 10px",borderRadius:9,border:"1px solid rgba(148,163,184,.15)",background:"transparent",color:"#64748b",fontSize:13,cursor:"pointer",flexShrink:0}}>✕</button>
    </div>
  );

  return (
    <select value={value} onChange={e=>{ if(e.target.value==="__add__"){setAdding(true);}else{onChange(e.target.value);}}}
      style={{...S.input,appearance:"none"}}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
      {onAddOption && <option value="__add__">＋ {lang==="es"?"Agregar nuevo...":"Add new..."}</option>}
    </select>
  );
}

function SistemasTab({ systems, setSystems, readings, setReadings, lang, user,
  regions=DEFAULT_REGIONS, setRegions=()=>{},
  tipos=DEFAULT_TIPOS, setTipos=()=>{},
  materiales=DEFAULT_MATERIALES, setMateriales=()=>{},
  semillas=DEFAULT_SEMILLAS, setSemillas=()=>{},
  onChartUpload=null }) {
  const canEdit = ["ceo","consultant","supervisor","capitan"].includes(user.role);
  const [filterRegion, setFilterRegion] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editSys, setEditSys] = useState(null);
  const [showReadingForm, setShowReadingForm]   = useState(false);
  const [readingForm, setReadingForm] = useState({
    fecha:     new Date().toISOString().slice(0,10),
    tipo:      "peso",
    peso:      "",
    sueltos:   "",
    buoys:     Array(10).fill(""),
    salt:      "",
    ph:        "",
    temp:      "",
    salinidad: "",
    notas:     "",
    foto:      false,
  });
  const [editingReadingId, setEditingReadingId] = useState(null);
  const [editReadingForm, setEditReadingForm] = useState({
    fecha:"", tipo:"peso", peso:"", sueltos:"",
    salt:"", ph:"", temp:"", salinidad:"", notas:"",
  });
  const regionColor = {"Bahía Azul":"#0d9488","Cayo de Agua":"#4ade80","Playa Roja":"#f87171","Isla de Tigre":"#fb923c"};

  // Only Eduardo, Jason, Cameron can edit existing readings
  const canEditReadings = ["ceo","consultant","supervisor"].includes(user.role);
  const canUpload = ["ceo","consultant","supervisor"].includes(user.role) && onChartUpload;

  // ── TDC Excel/CSV upload state ──────────────────────────────────────────────
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'parsing' | 'done' | 'error'
  const [uploadMsg, setUploadMsg] = useState("");
  const uploadRef = useRef(null);

  const handleTDCUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus("parsing");
    setUploadMsg("");
    try {
      // Load SheetJS from CDN if not already loaded
      if (!window.XLSX) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const XLSX = window.XLSX;
      const buf  = await file.arrayBuffer();
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      const wb = isCSV
        ? XLSX.read(buf, { type:"array" })
        : XLSX.read(buf, { type:"array", cellDates:true });

      // ── 1. Parse Pruebas Pesos → readings ──────────────────────────────────
      let newReadingsCount = 0;
      const ppSheet = wb.Sheets["Pruebas Pesos"];
      if (ppSheet) {
        const ppRows = XLSX.utils.sheet_to_json(ppSheet, { defval: null });
        // Build a Set of existing sistema+fecha keys for dedup
        const existingKeys = new Set(readings.map(r => `${r.sistema}__${r.fecha}`));
        const newReadings = [];
        const baseId = Date.now();

        ppRows.forEach((row, i) => {
          const sistema = row["q"];
          let fecha = row["Fecha"];
          if (!sistema || !fecha) return;

          // Normalize fecha to YYYY-MM-DD
          if (fecha instanceof Date) {
            fecha = fecha.toISOString().slice(0,10);
          } else if (typeof fecha === "string") {
            // Handle DD/MM/YYYY format
            const parts = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (parts) {
              fecha = `${parts[3]}-${parts[2].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
            }
          } else if (typeof fecha === "number") {
            // Excel serial number
            const d = new Date((fecha - 25569) * 86400 * 1000);
            fecha = d.toISOString().slice(0,10);
          } else return;

          const key = `${sistema}__${fecha}`;
          if (existingKeys.has(key)) return; // Skip duplicates
          existingKeys.add(key);

          newReadings.push({
            id:          baseId + i,
            sistema:     sistema,
            fecha:       fecha,
            tipo:        "peso",
            peso:        typeof row["Peso (g)"] === "number" ? row["Peso (g)"] : null,
            sueltos:     typeof row["Sueltos (g)*"] === "number" ? row["Sueltos (g)*"] : null,
            cosechada:   typeof row["Cosechada(g)"] === "number" ? row["Cosechada(g)"] : null,
            sembrado:    typeof row["Sembrado(g)"] === "number" ? row["Sembrado(g)"] : null,
            salt:        typeof row["SALT %"] === "number" ? row["SALT %"] : null,
            ph:          typeof row["pH"] === "number" ? row["pH"] : null,
            salinidad:   typeof row["Salinidad"] === "number" ? row["Salinidad"] : null,
            temp:        typeof row["°C"] === "number" ? row["°C"] : null,
            tdc:         typeof row["TDC %"] === "number" ? parseFloat((row["TDC %"] * 100).toFixed(4)) : null,
            aguas:       row["Aguas"] || "",
            condiciones: row["Condiciones"] || "",
            notas:       row["Notas"] || "",
            foto:        null,
            buoys:       null,
          });
        });

        if (newReadings.length > 0) {
          newReadingsCount = newReadings.length;
          // Merge with existing and push via syncReadings
          const merged = [...readings, ...newReadings];
          setReadings(merged);
          console.log(`[AquaOps] TDC Upload: ${newReadings.length} new readings merged`);
        }
      }

      // ── 2. Parse Resumen → chart data (TDC, Pruebas %, Biomasa) ─────────
      const ws = wb.Sheets["Resumen"];
      if (ws && onChartUpload) {
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
        const newTDC = [], newPruebas = [], newBiomasa = [];
        const seenBiomasa = {};

        for (let i = 1; i < raw.length; i++) {
          const row = raw[i];
          if (!row[0]) continue;
          let fecha = row[0];
          let fechaStr = "";
          if (fecha instanceof Date) {
            fechaStr = fecha.toLocaleDateString("es-PA", { day:"2-digit", month:"2-digit", year:"numeric" });
          } else if (typeof fecha === "string") {
            fechaStr = fecha;
          } else continue;

          const d = fecha instanceof Date ? fecha : new Date(fecha);
          const labelShort = isNaN(d) ? fechaStr :
            d.toLocaleDateString("es-PA", { day:"numeric", month:"short" });

          const tdcRaw = row[6];
          const tdc = typeof tdcRaw === "number" ? parseFloat((tdcRaw * 100).toFixed(4)) : null;
          const isHarvest = tdc === null && row[4] !== null && typeof row[4] === "number" &&
            i > 1 && typeof raw[i-1]?.[4] === "number" && row[4] < raw[i-1][4] * 0.85;
          newTDC.push({ fecha: fechaStr, tdc, label: labelShort, harvest: isHarvest });

          // Pruebas — R%=col13, A%=col14, V%=col15, B%=col16
          const r_pct = row[13], a_pct = row[14], v_pct = row[15], b_pct = row[16];
          if ([r_pct, a_pct, v_pct, b_pct].some(x => typeof x === "number" && x > 0)) {
            newPruebas.push({
              label: labelShort,
              r: Math.round((r_pct || 0) * 100),
              a: Math.round((a_pct || 0) * 100),
              v: Math.round((v_pct || 0) * 100),
              b: Math.round((b_pct || 0) * 100),
            });
          }

          const mes = row[18];
          const bioVal = row[19];
          if (mes && typeof mes === "string" && typeof bioVal === "number" && !seenBiomasa[mes]) {
            seenBiomasa[mes] = true;
            const mesMap = { December:"Dic", January:"Ene", February:"Feb", March:"Mar",
                             April:"Abr", May:"May", June:"Jun", September:"Sep" };
            newBiomasa.push({ mes: mesMap[mes] || mes, actual: Math.round(bioVal), target: null });
          }
        }

        if (newTDC.length > 0) {
          const mergedBiomasa = newBiomasa.map(b => {
            const existing = BIOMASA_DATA.find(d => d.mes === b.mes);
            return { ...b, target: existing?.target || null };
          });
          BIOMASA_DATA.forEach(d => {
            if (d.target && !mergedBiomasa.find(b => b.mes === d.mes)) {
              mergedBiomasa.push({ mes: d.mes, actual: null, target: d.target });
            }
          });
          onChartUpload({ tdc: newTDC, pruebas: newPruebas, biomasa: mergedBiomasa });
        }
      }

      const chartCount = ws ? "✓" : "–";
      setUploadMsg(lang === "es"
        ? `${newReadingsCount} lecturas importadas · Gráficos ${chartCount}`
        : `${newReadingsCount} readings imported · Charts ${chartCount}`);
      setUploadStatus("done");
    } catch (err) {
      console.error("[AquaOps] TDC Upload error:", err);
      setUploadMsg(err.message || "Error al leer el archivo");
      setUploadStatus("error");
    }
    e.target.value = "";
  };

  // Calculate TDC from two readings: TDC = (ln(p2/p1) / days) * 100
  const calcTDC = (peso1, fecha1, peso2, fecha2) => {
    if (!peso1 || !peso2 || !fecha1 || !fecha2) return null;
    const days = (new Date(fecha2) - new Date(fecha1)) / (1000 * 60 * 60 * 24);
    if (days <= 0) return null;
    return parseFloat(((Math.log(peso2 / peso1) / days) * 100).toFixed(4));
  };

  // Recalculate TDC for all readings of a system after any edit
  const recalcAllTDC = (allReadings, sistemaId) => {
    const sorted = allReadings
      .filter(r => r.sistema === sistemaId)
      .sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
    const updated = sorted.map((r, i) => {
      const prev = sorted[i-1] || null;
      const tdc = prev ? calcTDC(prev.peso, prev.fecha, r.peso, r.fecha) : null;
      return { ...r, tdc };
    });
    return allReadings.map(r => {
      const u = updated.find(x => x.id === r.id);
      return u || r;
    });
  };

  const handleAddReading = (sistemaId) => {
    const isPeso = readingForm.tipo === "peso";
    const peso   = isPeso ? parseFloat(readingForm.peso) : null;
    if (isPeso && (!peso || peso <= 0)) return;
    if (!isPeso && !readingForm.salt && !readingForm.ph && !readingForm.temp) return;

    const prevReadings = readings
      .filter(r => r.sistema === sistemaId)
      .sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    const prev = prevReadings[0] || null;
    const tdc  = (isPeso && prev?.peso)
      ? calcTDC(prev.peso, prev.fecha, peso, readingForm.fecha)
      : null;

    const newReading = {
      id:         Date.now(),
      sistema:    sistemaId,
      fecha:      readingForm.fecha,
      tipo:       readingForm.tipo,
      peso:       peso,
      sueltos:    readingForm.sueltos ? parseFloat(readingForm.sueltos) : null,
      buoys:      readingForm.buoys?.some(b=>b) ? readingForm.buoys.map(b=>parseFloat(b)||0) : null,
      tdc,
      salt:       readingForm.salt      ? parseFloat(readingForm.salt)      : null,
      ph:         readingForm.ph        ? parseFloat(readingForm.ph)        : null,
      temp:       readingForm.temp      ? parseFloat(readingForm.temp)      : null,
      salinidad:  readingForm.salinidad ? parseFloat(readingForm.salinidad) : null,
      notas:      readingForm.notas || "",
      foto:       readingForm.foto ? `foto_${Date.now()}.jpg` : null,
      cosechada:  null, sembrado: null, aguas: "", condiciones: "",
    };
    const withNew = [...readings, newReading];
    setReadings(isPeso ? recalcAllTDC(withNew, sistemaId) : withNew);
    setShowReadingForm(false);
    setReadingForm({
      fecha: new Date().toISOString().slice(0,10),
      tipo:"peso", peso:"", sueltos:"", buoys:Array(10).fill(""),
      salt:"", ph:"", temp:"", salinidad:"", notas:"", foto:false,
    });
  };

  const handleSaveEditReading = (readingId, sistemaId) => {
    const isPeso = editReadingForm.tipo === "peso";
    const peso = isPeso ? parseFloat(editReadingForm.peso) : null;
    if (isPeso && (!peso || peso <= 0)) return;
    const updated = readings.map(r =>
      r.id === readingId ? {
        ...r,
        fecha:     editReadingForm.fecha,
        tipo:      editReadingForm.tipo,
        peso:      peso,
        sueltos:   editReadingForm.sueltos   ? parseFloat(editReadingForm.sueltos)   : null,
        salt:      editReadingForm.salt      ? parseFloat(editReadingForm.salt)      : null,
        ph:        editReadingForm.ph        ? parseFloat(editReadingForm.ph)        : null,
        temp:      editReadingForm.temp      ? parseFloat(editReadingForm.temp)      : null,
        salinidad: editReadingForm.salinidad ? parseFloat(editReadingForm.salinidad) : null,
        notas:     editReadingForm.notas     || "",
      } : r
    );
    setReadings(isPeso ? recalcAllTDC(updated, sistemaId) : updated);
    setEditingReadingId(null);
  };

  const EMPTY = {id:"",region:"Bahía Azul",poligono:1,pueblo:"",tipo:"Canasta",familia:"",profundidad:"",materiales:"Tie-tie",semillas:"Brazil",estado:"Activo",coordenadas:"",fechaInstalacion:new Date().toISOString().slice(0,10),capitan:"",buceador:"",modulos:0,notas:""};
  const [form, setForm] = useState(EMPTY);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  const filtered = systems.filter(s=>filterRegion==="all"||s.region===filterRegion);
  const grouped  = {};
  filtered.forEach(s=>{
    if(!grouped[s.region]) grouped[s.region]={};
    const pk=`Polígono ${s.poligono}`;
    if(!grouped[s.region][pk]) grouped[s.region][pk]=[];
    grouped[s.region][pk].push(s);
  });

  const handleSave = ()=>{
    if(!form.id) return;
    setSystems(prev=>{ const e=prev.find(s=>s.id===form.id); return e?prev.map(s=>s.id===form.id?form:s):[...prev,form]; });
    setShowForm(false);
  };

  if(selected&&!showForm) {
    const s=systems.find(x=>x.id===selected)||{};
    const rc=regionColor[s.region]||"#0d9488";
    const lastR=readings.filter(r=>r.sistema===s.id).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha))[0];
    return (
      <div style={{padding:"16px 16px 100px"}}>
        <button onClick={()=>setSelected(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#0d9488",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:14,padding:0}}>
          <Icon name="back" size={16} color="#0d9488"/>Sistemas
        </button>
        <div style={{background:`linear-gradient(135deg,${rc}15,rgba(2,8,24,.5))`,border:`1px solid ${rc}22`,borderRadius:16,padding:18,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><h2 style={{color:"#e2e8f0",fontSize:24,fontWeight:900,margin:0}}>{s.id}</h2><p style={{color:"#94a3b8",margin:"3px 0 0",fontSize:12}}>{s.region} · Polígono {s.poligono}</p></div>
            <span style={{fontSize:10,padding:"3px 10px",borderRadius:8,background:s.estado==="Activo"?"rgba(74,222,128,.12)":"rgba(148,163,184,.08)",color:s.estado==="Activo"?"#4ade80":"#94a3b8",fontWeight:700}}>{s.estado}</span>
          </div>
        </div>
        <div style={S.card}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Tipo",s.tipo],["Módulos",s.modulos],["Familia",s.familia],["Profundidad",s.profundidad],["Materiales",s.materiales],["Semillas",s.semillas],[lang==="es"?"Instalación":"Installed",s.fechaInstalacion],["Pueblo",s.pueblo]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"7px 9px"}}>
                <div style={{fontSize:10,color:"#64748b"}}>{l}</div>
                <div style={{fontSize:12,color:"#e2e8f0",fontWeight:600,marginTop:1}}>{v||"–"}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={{fontSize:10,color:"#64748b",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:.6}}>{lang==="es"?"Equipo responsable":"Responsible crew"}</div>
          {[{role:"Supervisor",name:"Eduardo Valdés",initials:"EV",color:"#f59e0b",note:lang==="es"?"Todas las regiones":"All regions"},{role:"Capitán",name:CREW.find(c=>c.initials===s.capitan)?.name||s.capitan,initials:s.capitan,color:"#0d9488",note:`Polígono ${s.poligono}`},{role:"Buceador",name:CREW.find(c=>c.initials===s.buceador)?.name||s.buceador,initials:s.buceador,color:"#4ade80",note:lang==="es"?"Este sistema":"This system"}].map(item=>(
            <div key={item.role} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 9px",background:"rgba(255,255,255,.03)",borderRadius:9,marginBottom:6}}>
              <div style={{width:30,height:30,borderRadius:8,background:`${item.color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:9,fontWeight:800,color:item.color}}>{item.initials||"–"}</span></div>
              <div><div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{item.name||"–"}</div><div style={{fontSize:10,color:"#64748b"}}>{item.role} · {item.note}</div></div>
            </div>
          ))}
        </div>
        {/* ── Readings history ─────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:.6}}>
              {lang==="es"?"Lecturas":"Readings"}
              <span style={{marginLeft:6,color:"#334155"}}>({readings.filter(r=>r.sistema===s.id).length})</span>
            </div>
            {canEdit && (
              <button onClick={()=>setShowReadingForm(v=>!v)}
                style={{padding:"4px 10px",borderRadius:8,border:"1px solid rgba(13,148,136,.3)",background:"rgba(13,148,136,.06)",color:"#0d9488",fontWeight:700,fontSize:11,cursor:"pointer"}}>
                {showReadingForm?"✕ Cancelar":"+ Nueva Lectura"}
              </button>
            )}
          </div>

          {/* New reading form */}
          {showReadingForm && canEdit && (
            <div style={{background:"rgba(13,148,136,.06)",border:"1px solid rgba(13,148,136,.15)",borderRadius:10,padding:12,marginBottom:12}}>
              {/* Type toggle */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[["peso",lang==="es"?"⚖️ Peso":"⚖️ Weight"],["parametros",lang==="es"?"🌊 Parámetros":"🌊 Parameters"]].map(([t,label])=>(
                  <button key={t} onClick={()=>setReadingForm(p=>({...p,tipo:t}))}
                    style={{padding:"8px 0",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
                      background:readingForm.tipo===t?"rgba(13,148,136,.25)":"rgba(255,255,255,.03)",
                      color:readingForm.tipo===t?"#2dd4bf":"#64748b"}}>{label}</button>
                ))}
              </div>
              {/* Date */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Fecha":"Date"}</div>
                <input type="date" value={readingForm.fecha}
                  onChange={e=>setReadingForm(p=>({...p,fecha:e.target.value}))}
                  style={{...S.input,colorScheme:"dark",fontSize:12}}/>
              </div>
              {/* PESO mode */}
              {readingForm.tipo==="peso" && (
                <>
                  {s.tipo==="Long Line" ? (
                    <div style={{marginBottom:8}}>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:6,fontWeight:700}}>
                        {s.id} — Buoys 1–10 (g each)
                        <span style={{fontSize:9,color:"#334155",marginLeft:6,fontWeight:400}}>Total = sum of all buoys</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                        {Array.from({length:10},(_,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:10,color:"#64748b",width:48,flexShrink:0,fontFamily:"monospace"}}>Buoy {i+1}</span>
                            <input type="number" placeholder="0"
                              value={readingForm.buoys?.[i]||""}
                              onChange={e=>{
                                const buoys=[...(readingForm.buoys||Array(10).fill(""))];
                                buoys[i]=e.target.value;
                                const total=buoys.reduce((sum,v)=>sum+(parseFloat(v)||0),0);
                                setReadingForm(p=>({...p,buoys,peso:total>0?String(Math.round(total)):""}));
                              }}
                              style={{...S.input,fontSize:11,padding:"5px 8px"}}/>
                          </div>
                        ))}
                      </div>
                      {readingForm.peso&&(
                        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",
                          borderRadius:8,background:"rgba(13,148,136,.08)",marginBottom:8}}>
                          <span style={{fontSize:11,color:"#64748b"}}>Total (all buoys)</span>
                          <span style={{fontSize:14,fontWeight:800,color:"#2dd4bf",fontFamily:"monospace"}}>
                            {(parseFloat(readingForm.peso)/1000).toFixed(3)} kg
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <div>
                        <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Peso total (g)":"Total weight (g)"}</div>
                        <input type="number" placeholder="ej. 8500" value={readingForm.peso}
                          onChange={e=>setReadingForm(p=>({...p,peso:e.target.value}))}
                          style={{...S.input,fontSize:12}}/>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>
                          {lang==="es"?"Alga suelta (g)":"Free seaweed (g)"}
                          <span style={{fontSize:9,color:"#334155",marginLeft:3}}>(sueltos)</span>
                        </div>
                        <input type="number" placeholder="0" value={readingForm.sueltos}
                          onChange={e=>setReadingForm(p=>({...p,sueltos:e.target.value}))}
                          style={{...S.input,fontSize:12}}/>
                      </div>
                    </div>
                  )}
                  {readingForm.peso&&lastR?.peso&&(()=>{
                    const preview=calcTDC(lastR.peso,lastR.fecha,parseFloat(readingForm.peso),readingForm.fecha);
                    if(preview===null)return null;
                    const col=preview>=2.5?"#4ade80":preview>=0?"#0d9488":"#f87171";
                    return(
                      <div style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"6px 10px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:11,color:"#64748b"}}>TDC vs lectura anterior</span>
                        <span style={{fontSize:14,fontWeight:800,color:col,fontFamily:"monospace"}}>{preview>=0?"+":""}{preview}%/día</span>
                      </div>
                    );
                  })()}
                </>
              )}
              {/* PARAMETROS mode — sal% last */}
              {readingForm.tipo==="parametros"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  {[["ph","pH","9.2"],["temp",lang==="es"?"Temp °C":"Temp °C","27"],["salinidad",lang==="es"?"Salinidad":"Salinity","19"],["salt",lang==="es"?"Sal %":"Salt %","2.5"]].map(([key,label,ph])=>(
                    <div key={key}>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{label}</div>
                      <input type="number" step="0.1" placeholder={ph} value={readingForm[key]}
                        onChange={e=>setReadingForm(p=>({...p,[key]:e.target.value}))}
                        style={{...S.input,fontSize:12}}/>
                    </div>
                  ))}
                </div>
              )}
              {/* Photo */}
              <div style={{marginBottom:8}}>
                <button onClick={()=>setReadingForm(p=>({...p,foto:!p.foto}))}
                  style={{width:"100%",padding:"9px 12px",borderRadius:9,cursor:"pointer",
                    border:`1.5px dashed ${readingForm.foto?"rgba(13,148,136,.5)":"rgba(148,163,184,.2)"}`,
                    background:readingForm.foto?"rgba(13,148,136,.06)":"transparent",
                    color:readingForm.foto?"#2dd4bf":"#64748b",
                    fontWeight:600,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span>📷</span>
                  {readingForm.foto?(lang==="es"?"✓ Foto incluida":"✓ Photo included"):(lang==="es"?"Adjuntar foto (opcional)":"Attach photo (optional)")}
                </button>
              </div>
              {/* Comments */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>💬 {lang==="es"?"Comentarios (opcional)":"Comments (optional)"}</div>
                <input placeholder={lang==="es"?"Ej: Epifitas, agua turbia...":"E.g. Epiphytes, turbid water..."}
                  value={readingForm.notas} onChange={e=>setReadingForm(p=>({...p,notas:e.target.value}))}
                  style={{...S.input,fontSize:12,borderColor:readingForm.notas.trim()?"rgba(13,148,136,.4)":"rgba(148,163,184,.12)"}}/>
              </div>
              <button onClick={()=>handleAddReading(s.id)}
                disabled={readingForm.tipo==="peso"?!readingForm.peso:(!readingForm.ph&&!readingForm.temp&&!readingForm.salinidad&&!readingForm.salt)}
                style={{width:"100%",padding:10,borderRadius:9,border:"none",
                  background:(readingForm.tipo==="peso"?readingForm.peso:(readingForm.ph||readingForm.temp||readingForm.salinidad||readingForm.salt))?"linear-gradient(135deg,#0d9488,#0f766e)":"rgba(148,163,184,.1)",
                  color:(readingForm.tipo==="peso"?readingForm.peso:(readingForm.ph||readingForm.temp||readingForm.salinidad||readingForm.salt))?"#fff":"#475569",
                  fontWeight:700,fontSize:13,cursor:"pointer"}}>
                {lang==="es"?"Guardar Lectura":"Save Reading"}
              </button>
            </div>
          )}

          {/* Reading history — header renamed to Lecturas, grouped by date */}
          {(()=>{
            const isLongLine = s.tipo==="Long Line";
            const allSysReadings = readings.filter(r=>r.sistema===s.id)
              .sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));

            // Group by date — concatenate peso+parametros on same date
            const dateGroups = {};
            allSysReadings.forEach(r=>{
              if(!dateGroups[r.fecha]) dateGroups[r.fecha]={};
              const tipo = r.tipo||"peso";
              if(!dateGroups[r.fecha][tipo]) dateGroups[r.fecha][tipo]=[];
              dateGroups[r.fecha][tipo].push(r);
            });

            return Object.entries(dateGroups)
              .sort(([a],[b])=>b.localeCompare(a))
              .map(([fecha,tipoMap],groupIdx)=>{
                const pesoReadings   = tipoMap["peso"]       ||[];
                const paramReadings  = tipoMap["parametros"] ||[];
                const allInGroup     = [...pesoReadings,...paramReadings];

                return (
                  <div key={fecha} style={{borderBottom:"1px solid rgba(148,163,184,.06)",paddingBottom:6,marginBottom:4}}>
                    {/* Date header */}
                    <div style={{fontSize:10,color:"#64748b",fontWeight:700,padding:"4px 0 2px",textTransform:"uppercase",letterSpacing:.5}}>
                      {fecha}
                    </div>

                    {/* Peso reading(s) for this date */}
                    {pesoReadings.map((r,pi)=>{
                      const col = r.tdc===null?"#475569":r.tdc>=2.5?"#4ade80":r.tdc>=0?"#0d9488":"#f87171";
                      const isEditing = editingReadingId===r.id;
                      const dupLabel = pesoReadings.length>1?` (${pi+1})`:"";
                      const sysReadings = allSysReadings;
                      if(isEditing && canEditReadings) {
                        const editCanSave = editReadingForm.tipo==="peso"
                          ? !!editReadingForm.peso
                          : !!(editReadingForm.ph||editReadingForm.temp||editReadingForm.salinidad||editReadingForm.salt);
                        return (
                          <div key={r.id} style={{background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.25)",borderRadius:10,padding:12,marginBottom:6}}>
                            <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.6}}>
                              ✏️ {lang==="es"?"Editar lectura":"Edit reading"} — {fecha}{dupLabel}
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                              {[["peso",lang==="es"?"⚖️ Peso":"⚖️ Weight"],["parametros",lang==="es"?"🌊 Parámetros":"🌊 Parameters"]].map(([t,label])=>(
                                <button key={t} onClick={()=>setEditReadingForm(p=>({...p,tipo:t}))}
                                  style={{padding:"7px 0",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
                                    background:editReadingForm.tipo===t?"rgba(245,158,11,.25)":"rgba(255,255,255,.03)",
                                    color:editReadingForm.tipo===t?"#f59e0b":"#64748b"}}>{label}
                                </button>
                              ))}
                            </div>
                            <div style={{marginBottom:8}}>
                              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Fecha":"Date"}</div>
                              <input type="date" value={editReadingForm.fecha}
                                onChange={e=>setEditReadingForm(p=>({...p,fecha:e.target.value}))}
                                style={{...S.input,colorScheme:"dark",fontSize:12}}/>
                            </div>
                            {editReadingForm.tipo==="peso"?(
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                <div>
                                  <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Peso total (g)":"Total weight (g)"}</div>
                                  <input type="number" value={editReadingForm.peso} onChange={e=>setEditReadingForm(p=>({...p,peso:e.target.value}))} style={{...S.input,fontSize:12}}/>
                                </div>
                                <div>
                                  <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Alga suelta (g)":"Free seaweed (g)"}</div>
                                  <input type="number" placeholder="0" value={editReadingForm.sueltos} onChange={e=>setEditReadingForm(p=>({...p,sueltos:e.target.value}))} style={{...S.input,fontSize:12}}/>
                                </div>
                              </div>
                            ):(
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                {[["ph","pH","9.2"],["temp",lang==="es"?"Temp °C":"Temp °C","27"],["salinidad",lang==="es"?"Salinidad":"Salinity","19"],["salt",lang==="es"?"Sal %":"Salt %","2.5"]].map(([key,label,ph])=>(
                                  <div key={key}>
                                    <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{label}</div>
                                    <input type="number" step="0.1" placeholder={ph} value={editReadingForm[key]} onChange={e=>setEditReadingForm(p=>({...p,[key]:e.target.value}))} style={{...S.input,fontSize:12}}/>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div style={{marginBottom:10}}>
                              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>💬 {lang==="es"?"Comentarios":"Comments"}</div>
                              <input value={editReadingForm.notas} onChange={e=>setEditReadingForm(p=>({...p,notas:e.target.value}))}
                                placeholder={lang==="es"?"Observaciones...":"Observations..."} style={{...S.input,fontSize:12}}/>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                              <button onClick={()=>handleSaveEditReading(r.id,s.id)} disabled={!editCanSave}
                                style={{padding:10,borderRadius:9,border:"none",background:editCanSave?"rgba(13,148,136,.8)":"rgba(148,163,184,.1)",color:editCanSave?"#fff":"#475569",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                                {lang==="es"?"Guardar":"Save"}
                              </button>
                              <button onClick={()=>setEditingReadingId(null)}
                                style={{padding:10,borderRadius:9,border:"1px solid rgba(148,163,184,.12)",background:"transparent",color:"#64748b",fontSize:12,cursor:"pointer"}}>
                                {lang==="es"?"Cancelar":"Cancel"}
                              </button>
                            </div>
                          </div>
                        );
                      }
                      // Normal peso row
                      return (
                        <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>⚖️</span>
                              {dupLabel&&<span style={{fontSize:9,color:"#64748b"}}>{dupLabel}</span>}
                            </div>
                            {r.notas&&<div style={{fontSize:10,color:"#64748b",fontStyle:"italic"}}>"{r.notas}"</div>}
                          </div>
                          <div style={{textAlign:"right",display:"flex",alignItems:"center",gap:8}}>
                            <div>
                              <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",fontFamily:"monospace"}}>{r.peso?(r.peso/1000).toFixed(2)+" kg":"—"}</div>
                              {r.sueltos&&<div style={{fontSize:10,color:"#64748b"}}>+{(r.sueltos/1000).toFixed(2)}kg sueltos</div>}
                              {r.tdc!==null&&<div style={{fontSize:10,fontWeight:700,color:col}}>{r.tdc>=0?"+":""}{r.tdc}%/día</div>}
                            </div>
                            {canEditReadings&&(
                              <button onClick={()=>{setEditingReadingId(r.id);setEditReadingForm({fecha:r.fecha,tipo:r.tipo||"peso",peso:String(r.peso||""),sueltos:String(r.sueltos||""),salt:String(r.salt||""),ph:String(r.ph||""),temp:String(r.temp||""),salinidad:String(r.salinidad||""),notas:r.notas||""});setShowReadingForm(false);}}
                                style={{padding:"3px 8px",borderRadius:6,border:"none",background:"rgba(245,158,11,.1)",color:"#f59e0b",fontSize:10,fontWeight:700,cursor:"pointer"}}>✏️</button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Parametros reading(s) for this date — shown below peso, concatenated */}
                    {paramReadings.map((r,pi)=>{
                      const isEditing = editingReadingId===r.id;
                      const dupLabel  = paramReadings.length>1?` (${pi+1})`:"";

                      // Show full edit form for parametros too
                      if(isEditing && canEditReadings) {
                        const editCanSave = editReadingForm.tipo==="peso"
                          ? !!editReadingForm.peso
                          : !!(editReadingForm.ph||editReadingForm.temp||editReadingForm.salinidad||editReadingForm.salt);
                        return (
                          <div key={r.id} style={{background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.25)",borderRadius:10,padding:12,marginBottom:6}}>
                            <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.6}}>
                              ✏️ {lang==="es"?"Editar lectura":"Edit reading"} — 🌊 {fecha}{dupLabel}
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                              {[["peso",lang==="es"?"⚖️ Peso":"⚖️ Weight"],["parametros",lang==="es"?"🌊 Parámetros":"🌊 Parameters"]].map(([t,label])=>(
                                <button key={t} onClick={()=>setEditReadingForm(p=>({...p,tipo:t}))}
                                  style={{padding:"7px 0",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
                                    background:editReadingForm.tipo===t?"rgba(245,158,11,.25)":"rgba(255,255,255,.03)",
                                    color:editReadingForm.tipo===t?"#f59e0b":"#64748b"}}>{label}
                                </button>
                              ))}
                            </div>
                            <div style={{marginBottom:8}}>
                              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Fecha":"Date"}</div>
                              <input type="date" value={editReadingForm.fecha} onChange={e=>setEditReadingForm(p=>({...p,fecha:e.target.value}))}
                                style={{...S.input,colorScheme:"dark",fontSize:12}}/>
                            </div>
                            {editReadingForm.tipo==="peso"?(
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                <div>
                                  <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Peso total (g)":"Total weight (g)"}</div>
                                  <input type="number" value={editReadingForm.peso} onChange={e=>setEditReadingForm(p=>({...p,peso:e.target.value}))} style={{...S.input,fontSize:12}}/>
                                </div>
                                <div>
                                  <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Alga suelta (g)":"Free seaweed (g)"}</div>
                                  <input type="number" placeholder="0" value={editReadingForm.sueltos} onChange={e=>setEditReadingForm(p=>({...p,sueltos:e.target.value}))} style={{...S.input,fontSize:12}}/>
                                </div>
                              </div>
                            ):(
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                {[["ph","pH","9.2"],["temp",lang==="es"?"Temp °C":"Temp °C","27"],["salinidad",lang==="es"?"Salinidad":"Salinity","19"],["salt",lang==="es"?"Sal %":"Salt %","2.5"]].map(([key,label,ph])=>(
                                  <div key={key}>
                                    <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{label}</div>
                                    <input type="number" step="0.1" placeholder={ph} value={editReadingForm[key]} onChange={e=>setEditReadingForm(p=>({...p,[key]:e.target.value}))} style={{...S.input,fontSize:12}}/>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div style={{marginBottom:10}}>
                              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>💬 {lang==="es"?"Comentarios":"Comments"}</div>
                              <input value={editReadingForm.notas} onChange={e=>setEditReadingForm(p=>({...p,notas:e.target.value}))}
                                placeholder={lang==="es"?"Observaciones...":"Observations..."} style={{...S.input,fontSize:12}}/>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                              <button onClick={()=>handleSaveEditReading(r.id,s.id)} disabled={!editCanSave}
                                style={{padding:10,borderRadius:9,border:"none",background:editCanSave?"rgba(13,148,136,.8)":"rgba(148,163,184,.1)",color:editCanSave?"#fff":"#475569",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                                {lang==="es"?"Guardar":"Save"}
                              </button>
                              <button onClick={()=>setEditingReadingId(null)}
                                style={{padding:10,borderRadius:9,border:"1px solid rgba(148,163,184,.12)",background:"transparent",color:"#64748b",fontSize:12,cursor:"pointer"}}>
                                {lang==="es"?"Cancelar":"Cancel"}
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0 3px 10px",borderLeft:"2px solid rgba(45,212,191,.2)"}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                              {r.ph&&<span style={{fontSize:10,color:"#94a3b8"}}>pH {r.ph}</span>}
                              {r.temp&&<span style={{fontSize:10,color:"#94a3b8"}}>T {r.temp}°C</span>}
                              {r.salinidad&&<span style={{fontSize:10,color:"#94a3b8"}}>Sal {r.salinidad}</span>}
                              {r.salt&&<span style={{fontSize:10,color:"#94a3b8"}}>Sal% {r.salt}</span>}
                            </div>
                            {r.notas&&<div style={{fontSize:10,color:"#64748b",fontStyle:"italic"}}>"{r.notas}"</div>}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:9,color:"#2dd4bf"}}>🌊{dupLabel}</span>
                            {canEditReadings&&(
                              <button onClick={()=>{setEditingReadingId(r.id);setEditReadingForm({fecha:r.fecha,tipo:"parametros",peso:"",sueltos:"",salt:String(r.salt||""),ph:String(r.ph||""),temp:String(r.temp||""),salinidad:String(r.salinidad||""),notas:r.notas||""});setShowReadingForm(false);}}
                                style={{padding:"3px 8px",borderRadius:6,border:"none",background:"rgba(245,158,11,.1)",color:"#f59e0b",fontSize:10,fontWeight:700,cursor:"pointer"}}>✏️</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
          })()}

            <div style={{fontSize:12,color:"#475569",textAlign:"center",padding:"12px 0"}}>
              {lang==="es"?"Sin lecturas registradas":"No readings recorded"}
            </div>
          )}
        </div>
        {s.coordenadas&&<div style={S.card}><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>GPS</div><div style={{fontSize:12,color:"#94a3b8",fontFamily:"monospace"}}>{s.coordenadas}</div></div>}
        {canEdit&&<button onClick={()=>{setForm({...s});setShowForm(true);}} style={{width:"100%",padding:13,borderRadius:11,border:"1px solid rgba(13,148,136,.3)",background:"rgba(13,148,136,.06)",color:"#0d9488",fontWeight:700,fontSize:13,cursor:"pointer",marginTop:4}}>{lang==="es"?"✏️ Editar Sistema":"✏️ Edit System"}</button>}
      </div>
    );
  }

  if(showForm) {
    const isNew=!systems.find(s=>s.id===form.id);
    return (
      <div style={{padding:"16px 16px 100px"}}>
        <button onClick={()=>setShowForm(false)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#0d9488",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:14,padding:0}}>
          <Icon name="back" size={16} color="#0d9488"/>{lang==="es"?"Cancelar":"Cancel"}
        </button>
        <h2 style={{color:"#e2e8f0",fontSize:18,fontWeight:800,margin:"0 0 14px"}}>{isNew?(lang==="es"?"Nuevo Sistema":"New System"):(lang==="es"?"Editar":"Edit")} {form.id}</h2>
        {[
          <div style={S.card}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={S.label}>ID *</label><input value={form.id} onChange={e=>F("id",e.target.value)} placeholder="P18" style={S.input}/></div>
            <div><label style={S.label}>{lang==="es"?"Pueblo":"Village"}</label><input value={form.pueblo} onChange={e=>F("pueblo",e.target.value)} style={S.input}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={S.label}>{lang==="es"?"Región":"Region"} *</label>
              <AddableSelect value={form.region} onChange={v=>F("region",v)} options={regions}
                onAddOption={v=>setRegions(prev=>[...prev,v])} lang={lang}/>
            </div>
            <div><label style={S.label}>{lang==="es"?"Polígono #":"Polygon #"}</label><input type="number" min="1" value={form.poligono} onChange={e=>F("poligono",parseInt(e.target.value)||1)} style={S.input}/></div>
          </div>
        </div>,
          <div style={S.card}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={S.label}>Tipo</label>
              <AddableSelect value={form.tipo} onChange={v=>F("tipo",v)} options={tipos}
                onAddOption={v=>setTipos(prev=>[...prev,v])} lang={lang}/>
            </div>
            <div><label style={S.label}>{lang==="es"?"Módulos":"Modules"}</label><input type="number" value={form.modulos} onChange={e=>F("modulos",parseInt(e.target.value)||0)} style={S.input}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={S.label}>{lang==="es"?"Profundidad":"Depth"}</label><input value={form.profundidad} onChange={e=>F("profundidad",e.target.value)} placeholder="30cm" style={S.input}/></div>
            <div>
              <label style={S.label}>{lang==="es"?"Materiales":"Materials"}</label>
              <AddableSelect value={form.materiales} onChange={v=>F("materiales",v)} options={materiales}
                onAddOption={v=>setMateriales(prev=>[...prev,v])} lang={lang}/>
            </div>
          </div>
        </div>,
          <div key="crew" style={S.card}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={S.label}>Capitán</label><select value={form.capitan} onChange={e=>F("capitan",e.target.value)} style={{...S.input,appearance:"none"}}><option value="">–</option>{CREW.filter(c=>c.role==="Capitán").map(c=><option key={c.initials} value={c.initials}>{c.initials} – {c.name.split(" ")[0]}</option>)}</select></div>
              <div><label style={S.label}>Buceador</label><select value={form.buceador} onChange={e=>F("buceador",e.target.value)} style={{...S.input,appearance:"none"}}><option value="">–</option>{CREW.filter(c=>c.role==="Buceador").map(c=><option key={c.initials} value={c.initials}>{c.initials} – {c.name.split(" ")[0]}</option>)}</select></div>
            </div>
          </div>,
          <div style={S.card}>
          <div style={{marginBottom:10}}><label style={S.label}>{lang==="es"?"Familia / Propietario":"Family / Owner"}</label><input value={form.familia} onChange={e=>F("familia",e.target.value)} style={S.input}/></div>
          <div style={{marginBottom:10}}><label style={S.label}>GPS</label><input value={form.coordenadas} onChange={e=>F("coordenadas",e.target.value)} placeholder="N 09°07'34 O 082°03'58" style={S.input}/></div>
          <div style={{marginBottom:10}}><label style={S.label}>{lang==="es"?"Fecha Instalación / Siembra":"Install / Plant Date"}</label><input type="date" value={form.fechaInstalacion} onChange={e=>F("fechaInstalacion",e.target.value)} style={{...S.input,colorScheme:"dark"}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={S.label}>{lang==="es"?"Próx. Cosecha":"Next Harvest"}</label>
              <input type="date" value={form.fechaCosecha||""} onChange={e=>F("fechaCosecha",e.target.value)} style={{...S.input,colorScheme:"dark"}}/>
            </div>
            <div>
              <label style={S.label}>{lang==="es"?"Limpieza":"Cleaning"}</label>
              <input value={form.fechaLimpieza||""} onChange={e=>F("fechaLimpieza",e.target.value)} placeholder="diaria / fecha" style={S.input}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={S.label}>{lang==="es"?"Tamaño canasta":"Basket size"}</label>
              <select value={form.tamano||"2x3m"} onChange={e=>F("tamano",e.target.value)} style={{...S.input,appearance:"none"}}>
                <option value="2x2m">2x2m — Prueba</option>
                <option value="2x3m">2x3m — Tubular comercial</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={S.label}>{lang==="es"?"Categoría":"Category"}</label>
              <select value={form.categoria||"comercial"} onChange={e=>F("categoria",e.target.value)} style={{...S.input,appearance:"none"}}>
                <option value="semillero">Semillero</option>
                <option value="prueba">Prueba</option>
                <option value="comercial">Comercial</option>
              </select>
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={S.label}>{lang==="es"?"Origen Semillas":"Seed Origin"}</label>
            <AddableSelect value={form.semillas} onChange={v=>F("semillas",v)} options={semillas}
              onAddOption={v=>setSemillas(prev=>[...prev,v])} lang={lang}/>
          </div>
          <div><label style={S.label}>Estado</label><select value={form.estado} onChange={e=>F("estado",e.target.value)} style={{...S.input,appearance:"none"}}><option>Activo</option><option>Retirado</option></select></div>
        </div>,
        ]}
        <button onClick={handleSave} disabled={!form.id} style={{...S.btn(!!form.id),boxShadow:form.id?"0 0 20px rgba(13,148,136,.25)":"none"}}>
          {lang==="es"?"Guardar Sistema":"Save System"}
        </button>
      </div>
    );
  }

  return (
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:0}}>Sistemas</h2>
          <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>{systems.filter(s=>s.estado==="Activo").length} {lang==="es"?"activos":"active"} · {systems.length} total</p>
        </div>
        {canEdit&&<button onClick={()=>{setForm(EMPTY);setShowForm(true);}} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#0d9488,#0f766e)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Icon name="plus" size={14} color="#fff"/>{lang==="es"?"Nuevo":"New"}</button>}
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:12}}>
        {["all",...regions].map(r=>{ const c=r==="all"?"#94a3b8":regionColor[r]||"#94a3b8"; return <button key={r} onClick={()=>setFilterRegion(r)} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:`1px solid ${filterRegion===r?c:"rgba(148,163,184,.12)"}`,background:filterRegion===r?`${c}18`:"transparent",color:filterRegion===r?c:"#64748b",fontWeight:600,fontSize:11,cursor:"pointer"}}>{r==="all"?(lang==="es"?"Todas":"All"):r}</button>; })}
      </div>

      {/* ── TDC Excel Upload (supervisor/CEO/consultant only) ──────────────── */}
      {canUpload && (
        <div style={{...S.card, borderColor: uploadStatus==="done" ? "rgba(74,222,128,.25)" : uploadStatus==="error" ? "rgba(248,113,113,.25)" : "rgba(13,148,136,.15)", marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",marginBottom:2}}>
                📊 {lang==="es"?"Importar TDC de Semillero":"Import TDC Spreadsheet"}
              </div>
              <div style={{fontSize:10,color:"#64748b",lineHeight:1.5}}>
                {lang==="es"
                  ? "Sube TDC_de_Semillero.xlsx — importa lecturas de Pruebas Pesos y actualiza gráficos del dashboard."
                  : "Upload TDC_de_Semillero.xlsx — imports Pruebas Pesos readings and updates dashboard charts."}
              </div>
              {uploadStatus==="done" && uploadMsg && (
                <div style={{fontSize:10,color:"#4ade80",marginTop:5,fontWeight:600}}>✓ {uploadMsg}</div>
              )}
              {uploadStatus==="error" && (
                <div style={{fontSize:10,color:"#f87171",marginTop:5}}>{uploadMsg}</div>
              )}
            </div>
            <div>
              <input ref={uploadRef} type="file" accept=".xlsx,.xlsm,.xls,.csv"
                style={{display:"none"}} onChange={handleTDCUpload}/>
              <button onClick={()=>uploadRef.current?.click()}
                disabled={uploadStatus==="parsing"}
                style={{padding:"9px 14px",borderRadius:10,border:"none",
                  background: uploadStatus==="done" ? "rgba(74,222,128,.15)" : "linear-gradient(135deg,#0d9488,#0f766e)",
                  color: uploadStatus==="done" ? "#4ade80" : "#fff",
                  fontWeight:700,fontSize:12,cursor:uploadStatus==="parsing"?"wait":"pointer",
                  whiteSpace:"nowrap",flexShrink:0}}>
                {uploadStatus==="parsing" ? "⏳ Procesando..." : uploadStatus==="done" ? "✓ Importado" : lang==="es" ? "📂 Subir Excel" : "📂 Upload Excel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([region,polygons])=>(
        <div key={region} style={{marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:regionColor[region]}}/>
            <span style={{fontSize:14,fontWeight:800,color:"#e2e8f0"}}>{region}</span>
          </div>
          {Object.entries(polygons).sort().map(([pol,sysList])=>(
            <div key={pol} style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#64748b",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:.7}}>{pol} · Capitán: {sysList[0]?.capitan||"–"}</div>
              {sysList.map(s=>(
                <div key={s.id} style={{...S.card,borderLeft:`3px solid ${s.estado==="Activo"?regionColor[s.region]:"#334155"}`,cursor:"pointer"}} onClick={()=>setSelected(s.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:10,background:`${regionColor[s.region]}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:800,color:regionColor[s.region]}}>{s.id}</span></div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{s.pueblo}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>{s.tipo} · {s.modulos} {lang==="es"?"módulos":"modules"} · {s.buceador||"–"}</div>
                        <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                          {s.categoria && <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:s.categoria==="comercial"?"rgba(13,148,136,.15)":s.categoria==="semillero"?"rgba(74,222,128,.15)":"rgba(251,191,36,.15)",color:s.categoria==="comercial"?"#0d9488":s.categoria==="semillero"?"#4ade80":"#fbbf24",fontWeight:700}}>{s.categoria}</span>}
                          {s.tamano && <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(148,163,184,.1)",color:"#94a3b8",fontWeight:600}}>{s.tamano}</span>}
                          {s.fechaCosecha && <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(74,222,128,.08)",color:"#4ade80"}}>🌿 {s.fechaCosecha}</span>}
                          {!s.fechaCosecha && <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(251,191,36,.08)",color:"#fbbf24"}}>⚠ fecha pendiente</span>}
                        </div>
                      </div>
                    </div>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:s.estado==="Activo"?"rgba(74,222,128,.1)":"rgba(148,163,184,.06)",color:s.estado==="Activo"?"#4ade80":"#64748b",fontWeight:600}}>{s.estado}</span>
                  </div>
                  {s.coordenadas&&<div style={{marginTop:5,fontSize:10,color:"#475569",fontFamily:"monospace"}}>{s.coordenadas}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MapaTab({ systems, lang }) {
  const withCoords = systems.filter(s=>s.coordenadas&&s.estado==="Activo");
  const regionColor = {"Bahía Azul":"#0d9488","Cayo de Agua":"#4ade80","Playa Roja":"#f87171","Isla de Tigre":"#fb923c"};
  return (
    <div style={{padding:"16px 16px 100px"}}>
      <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:"0 0 14px"}}>Mapa</h2>
      <div style={{...S.card,textAlign:"center",padding:32,borderColor:"rgba(13,148,136,.15)"}}>
        <Icon name="map" size={40} color="#0d9488"/>
        <h3 style={{color:"#e2e8f0",fontSize:16,fontWeight:700,margin:"12px 0 6px"}}>{lang==="es"?"Mapa interactivo próximamente":"Interactive map coming soon"}</h3>
        <p style={{color:"#64748b",fontSize:12,lineHeight:1.6,margin:0}}>{lang==="es"?"Se construirá una vez confirmadas todas las coordenadas GPS.":"Will be built once all GPS coordinates are confirmed."}</p>
      </div>
      <div style={{...S.card,marginTop:4}}>
        <div style={{fontSize:11,color:"#64748b",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.6}}>{lang==="es"?"Coordenadas confirmadas":"Confirmed coordinates"} {withCoords.length}/{systems.filter(s=>s.estado==="Activo").length}</div>
        {DEFAULT_REGIONS.map(r=>{
          const total=systems.filter(s=>s.region===r&&s.estado==="Activo").length;
          const conf=systems.filter(s=>s.region===r&&s.estado==="Activo"&&s.coordenadas).length;
          return (
            <div key={r} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{r}</span>
                <span style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{conf}/{total}</span>
              </div>
              <div style={{height:5,borderRadius:3,background:"#1e293b",overflow:"hidden"}}><div style={{height:"100%",width:`${total?conf/total*100:0}%`,background:regionColor[r],borderRadius:3}}/></div>
            </div>
          );
        })}
        <p style={{color:"#475569",fontSize:11,margin:"10px 0 0"}}>{lang==="es"?"Ingresa las coordenadas faltantes en la pestaña Sistemas.":"Enter missing coordinates in the Sistemas tab."}</p>
      </div>
    </div>
  );
}

function ProfileTab({ user, lang, setLang, onLogout }) {
  const roleColors = { ceo:"#f59e0b", consultant:"#a78bfa", supervisor:"#0d9488", vaquero:"#4ade80", researcher:"#818cf8" };
  const roleLabels = { ceo:"CEO", consultant:"Consultor", supervisor:"Supervisor", vaquero:"Vaquero", researcher:"Investigador" };
  return (
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{...S.card,background:"linear-gradient(135deg,rgba(13,148,136,.08),rgba(2,8,24,.5))",border:"1px solid rgba(13,148,136,.12)",textAlign:"center",padding:24,marginBottom:14}}>
        <div style={{width:64,height:64,borderRadius:18,background:"rgba(13,148,136,.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
          <Icon name="user" size={28} color="#0d9488"/>
        </div>
        <h2 style={{color:"#e2e8f0",fontSize:18,fontWeight:800,margin:"0 0 4px"}}>{user.name}</h2>
        <span style={{fontSize:12,padding:"3px 12px",borderRadius:10,background:`${roleColors[user.role]||"#64748b"}18`,color:roleColors[user.role]||"#94a3b8",fontWeight:700}}>{roleLabels[user.role]||user.role}</span>
      </div>
      <div style={S.card}>
        <div style={{fontSize:11,color:"#64748b",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.6}}>Idioma / Language</div>
        <div style={{display:"flex",gap:10}}>
          {["es","en"].map(l=><button key={l} onClick={()=>setLang(l)} style={{flex:1,padding:11,borderRadius:10,border:`1px solid ${lang===l?"#0d9488":"rgba(148,163,184,.15)"}`,fontWeight:700,fontSize:13,cursor:"pointer",background:lang===l?"rgba(13,148,136,.15)":"transparent",color:lang===l?"#0d9488":"#64748b"}}>{l==="es"?"🇵🇦 Español":"🇺🇸 English"}</button>)}
        </div>
      </div>
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 6px #4ade80"}}/><span style={{fontSize:13,color:"#4ade80",fontWeight:600}}>{lang==="es"?"Sincronizado":"Synced"}</span></div>
      </div>
      <button onClick={onLogout} style={{width:"100%",padding:13,borderRadius:12,border:"1px solid rgba(248,113,113,.2)",background:"rgba(248,113,113,.04)",color:"#f87171",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4}}>
        <Icon name="logout" size={16} color="#f87171"/>{lang==="es"?"Cerrar Sesión":"Sign Out"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL 3 — RRHH (Bonuses + Evaluations) — Jason + Cameron only
// ═══════════════════════════════════════════════════════════════════════════════

function TDCUploader({ tdcData, pruebas, biomasa, onUpload, lang }) {
  const [status, setStatus]   = useState(null); // null | 'parsing' | 'done' | 'error'
  const [lastFile, setLastFile] = useState(null);
  const [errMsg, setErrMsg]   = useState("");
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("parsing");
    setErrMsg("");
    try {
      // Dynamically load SheetJS from CDN
      if (!window.XLSX) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const XLSX = window.XLSX;
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: "array", cellDates: true });

      // ── Parse Resumen sheet ──────────────────────────────────────────────────
      const ws = wb.Sheets["Resumen"];
      if (!ws) throw new Error("No se encontró la hoja 'Resumen'");
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

      // Header row: Fecha(0) Comercial(1) Pruebas(2) Cosecha(3) Total(4) TDC(6)
      //             B(8) V(9) A(10) R(11)  Mes(18) Biomasa(19)
      const newTDC = [], newPruebas = [], newBiomasa = [];
      const seenBiomasa = {};

      for (let i = 1; i < raw.length; i++) {
        const row = raw[i];
        if (!row[0]) continue;

        // Parse fecha
        let fecha = row[0];
        let fechaStr = "";
        if (fecha instanceof Date) {
          fechaStr = fecha.toLocaleDateString("es-PA", { day:"2-digit", month:"2-digit", year:"numeric" });
        } else if (typeof fecha === "string") {
          fechaStr = fecha;
        } else continue;

        // Short label for charts
        const d = fecha instanceof Date ? fecha : new Date(fecha);
        const labelShort = isNaN(d) ? fechaStr :
          d.toLocaleDateString("es-PA", { day:"numeric", month:"short" });

        // TDC % — stored as decimal e.g. 0.02079 → 2.08%
        const tdcRaw = row[6];
        const tdc = typeof tdcRaw === "number" ? parseFloat((tdcRaw * 100).toFixed(4)) : null;
        const isHarvest = tdc === null && row[4] !== null && typeof row[4] === "number" &&
          i > 1 && typeof raw[i-1]?.[4] === "number" && row[4] < raw[i-1][4] * 0.85;

        newTDC.push({ fecha: fechaStr, tdc, label: labelShort, harvest: isHarvest });

        // Pruebas — read from % columns directly (N=R%, O=A%, P=V%, Q=B%)
        // R=Rojo, A=Amarillo, V=Verde, B=Azul
        const r_pct = row[13], a_pct = row[14], v_pct = row[15], b_pct = row[16];
        if ([r_pct, a_pct, v_pct, b_pct].some(x => typeof x === "number" && x > 0)) {
          newPruebas.push({
            label: labelShort,
            r: Math.round((r_pct || 0) * 100),
            a: Math.round((a_pct || 0) * 100),
            v: Math.round((v_pct || 0) * 100),
            b: Math.round((b_pct || 0) * 100),
          });
        }

        // Biomasa mensual — only from rows that have a Mes value
        const mes = row[18];
        const bioVal = row[19];
        if (mes && typeof mes === "string" && typeof bioVal === "number" && !seenBiomasa[mes]) {
          seenBiomasa[mes] = true;
          const mesMap = { December:"Dic", January:"Ene", February:"Feb", March:"Mar",
                           April:"Abr", May:"May", June:"Jun", September:"Sep" };
          newBiomasa.push({ mes: mesMap[mes] || mes, actual: Math.round(bioVal), target: null });
        }
      }

      if (newTDC.length === 0) throw new Error("No se encontraron datos de TDC en la hoja Resumen");

      // Merge biomasa targets from existing BIOMASA_DATA
      const mergedBiomasa = newBiomasa.map(b => {
        const existing = BIOMASA_DATA.find(d => d.mes === b.mes);
        return { ...b, target: existing?.target || null };
      });
      // Add future target-only months not yet in actuals
      BIOMASA_DATA.forEach(d => {
        if (d.target && !mergedBiomasa.find(b => b.mes === d.mes)) {
          mergedBiomasa.push({ mes: d.mes, actual: null, target: d.target });
        }
      });

      onUpload({ tdc: newTDC, pruebas: newPruebas, biomasa: mergedBiomasa });
      setLastFile(file.name);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrMsg(err.message || "Error al leer el archivo");
      setStatus("error");
    }
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  return (
    <div style={{...S.card, borderColor: status==="done" ? "rgba(74,222,128,.25)" : status==="error" ? "rgba(248,113,113,.25)" : "rgba(13,148,136,.15)", marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",marginBottom:2}}>
            📊 {lang==="es"?"Actualizar TDC desde Excel":"Refresh TDC from Excel"}
          </div>
          <div style={{fontSize:10,color:"#64748b",lineHeight:1.5}}>
            {lang==="es"
              ? "Sube el TDC_de_Semillero.xlsx cada semana — los gráficos se actualizan al instante. El archivo no se guarda."
              : "Upload TDC_de_Semillero.xlsx weekly — charts refresh instantly. File is never stored."}
          </div>
          {status==="done" && lastFile && (
            <div style={{fontSize:10,color:"#4ade80",marginTop:5,fontWeight:600}}>
              ✓ {lastFile} · {tdcData.length} semanas cargadas
            </div>
          )}
          {status==="error" && (
            <div style={{fontSize:10,color:"#f87171",marginTop:5}}>{errMsg}</div>
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".xlsx,.xlsm,.xls"
            style={{display:"none"}} onChange={handleFile}/>
          <button onClick={()=>fileRef.current?.click()}
            disabled={status==="parsing"}
            style={{padding:"9px 14px",borderRadius:10,border:"none",
              background: status==="done" ? "rgba(74,222,128,.15)" : "linear-gradient(135deg,#0d9488,#0f766e)",
              color: status==="done" ? "#4ade80" : "#fff",
              fontWeight:700,fontSize:12,cursor:status==="parsing"?"wait":"pointer",
              whiteSpace:"nowrap",flexShrink:0}}>
            {status==="parsing" ? "⏳ Leyendo..." : status==="done" ? "✓ Actualizado" : lang==="es" ? "📂 Subir archivo" : "📂 Upload file"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CSV EXPORT UTILITY ───────────────────────────────────────────────────────
function exportCSV(rows, filename) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape  = v => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(","))
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type:"text/csv;charset=utf-8;" }); // BOM for Excel
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Build the two export datasets
function buildOpsExport(readings, systems) {
  return readings
    .slice().sort((a,b) => a.sistema.localeCompare(b.sistema) || a.fecha.localeCompare(b.fecha))
    .map(r => {
      const sys = systems.find(s => s.id === r.sistema) || {};
      return {
        Sistema:    r.sistema,
        Región:     sys.region || "",
        Capitán:    sys.capitan || "",
        Buceador:   sys.buceador || "",
        Categoría:  sys.categoria || "",
        Fecha:      r.fecha,
        "Peso (g)": r.peso,
        "Peso (kg)":(r.peso / 1000).toFixed(3),
        "TDC %/día":r.tdc !== null ? r.tdc : "",
        Notas:      r.notas || "",
        "Fecha Cosecha": sys.fechaCosecha || "",
      };
    });
}

function buildHRExport(evaluations, weeklyIncidents, profScores, assignedTasks) {
  return CREW.filter(c => c.role !== "Supervisor").map(c => {
    const ev = evaluations[c.initials];
    const q1  = ev?.quarters?.["Q1 2026"] || {};
    const inc = weeklyIncidents.filter(i => i.initials === c.initials);
    const totalTard = inc.reduce((s, i) => s + (i.tardanzas || 0), 0);
    const totalAus  = inc.reduce((s, i) => s + (i.ausencias  || 0), 0);
    const prof = profScores.find(p => p.initials === c.initials && p.month === "2026-03");
    const tasks = assignedTasks.filter(t => t.assignedTo === c.initials);
    const done  = tasks.filter(t => t.actual !== null || (TASK_SCHEMA[t.taskType]?.yesno && t.condicion !== null)).length;
    const pctTasks = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

    const comportVals = Object.values(q1.comportamientos || {});
    const avgComport  = comportVals.length
      ? (comportVals.reduce((a,b) => a+b, 0) / comportVals.length).toFixed(2) : "";
    const gallupAvg   = q1.gallup?.length
      ? (q1.gallup.reduce((a,b) => a+b, 0) / q1.gallup.length).toFixed(2) : "";

    return {
      Iniciales:           c.initials,
      Nombre:              c.name,
      Rol:                 c.role,
      "Tareas completadas (%)": pctTasks,
      Tardanzas:           totalTard,
      Ausencias:           totalAus,
      "Puntualidad (1-5)": prof?.puntualidad || "",
      "Seguridad (1-5)":   prof?.seguridad   || "",
      "Actitud (1-5)":     prof?.actitud     || "",
      "Equipo (1-5)":      prof?.equipo      || "",
      "Comportamientos Q1 (0-1)": avgComport,
      "Gallup Q1 (1-5)":   gallupAvg,
      "Fortalezas":        (q1.fortalezas || []).filter(Boolean).join(" | "),
      "Mejoras":           (q1.mejoras    || []).filter(Boolean).join(" | "),
      "Notas eval":        q1.notas || "",
    };
  });
}

function ExportButtons({ readings, systems, evaluations, weeklyIncidents, profScores, assignedTasks, lang }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      <button onClick={()=>exportCSV(buildOpsExport(readings,systems), `AquaOps_Operaciones_${new Date().toISOString().slice(0,10)}.csv`)}
        style={{padding:"10px 8px",borderRadius:10,border:"1px solid rgba(13,148,136,.3)",
          background:"rgba(13,148,136,.06)",color:"#0d9488",fontWeight:700,fontSize:11,cursor:"pointer",
          display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <span style={{fontSize:18}}>📊</span>
        <span>{lang==="es"?"Exportar Operaciones":"Export Operations"}</span>
        <span style={{fontSize:9,color:"#64748b",fontWeight:400}}>{lang==="es"?"Lecturas · TDC · Sistemas":"Readings · TDC · Systems"}</span>
      </button>
      <button onClick={()=>exportCSV(buildHRExport(evaluations,weeklyIncidents,profScores,assignedTasks), `AquaOps_RRHH_${new Date().toISOString().slice(0,10)}.csv`)}
        style={{padding:"10px 8px",borderRadius:10,border:"1px solid rgba(245,158,11,.3)",
          background:"rgba(245,158,11,.06)",color:"#f59e0b",fontWeight:700,fontSize:11,cursor:"pointer",
          display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <span style={{fontSize:18}}>👥</span>
        <span>{lang==="es"?"Exportar RRHH":"Export HR"}</span>
        <span style={{fontSize:9,color:"#64748b",fontWeight:400}}>{lang==="es"?"Evaluaciones · Incidencias · Puntaje":"Evals · Incidents · Score"}</span>
      </button>
    </div>
  );
}

function RRHHTab({ evaluations, setEvaluations, profScores, setProfScores, assignedTasks, weeklyIncidents, readings, systems, lang, user, chartTDC, chartPruebas, chartBiomasa, onChartUpload }) {
  const [view, setView] = useState("overview"); // overview | eval
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedQ, setSelectedQ] = useState(CURRENT_QUARTER);
  const [section, setSection] = useState("resumen");
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [poolAmount, setPoolAmount] = useState(3000);

  // ── TDC live data — now from App-level props ──────────────────
  const liveTDC     = chartTDC;
  const livePruebas = chartPruebas;
  const liveBiomasa = chartBiomasa;

  const handleTDCUpload = ({ tdc, pruebas, biomasa }) => {
    onChartUpload({ tdc, pruebas, biomasa });
  };


  const computeRendimiento = (initials, q) => {
    const ev=evaluations[initials]; if(!ev) return null;
    const qd=ev.quarters[q]; if(!qd) return null;
    const kpis=ROLE_KPIS[ev.rol]||[];
    let res=0;
    kpis.forEach(k=>{ const r=qd.resultados[k.id]; if(!r||!r.gol) return; res+=Math.min(r.resultado/r.gol,1.5)*k.importancia; });
    const cVals=Object.values(qd.comportamientos||{}); const c=cVals.length?cVals.reduce((a,b)=>a+b,0)/cVals.length:0;
    return res*EVAL_SPLIT.resultados+c*EVAL_SPLIT.comportamientos;
  };

  const crewScores = CREW.filter(c=>c.role!=="Supervisor").map(c=>{ const r=computeRendimiento(c.initials,"Q1 2026"); const p=TOTAL_PTS[c.initials]||10; return {...c,rendimiento:r,pts:p,weightedScore:(r||0)*p}; });
  const totalWeighted = crewScores.reduce((s,c)=>s+c.weightedScore,0)||1;
  // Proportional: each person's share = (their pts × rendimiento) / sum(all pts × rendimiento) × pool
  const withBonus = crewScores.map(c=>({...c, bono:((c.weightedScore/totalWeighted)*poolAmount).toFixed(2)}));
  const totalBono = withBonus.reduce((s,c)=>s+parseFloat(c.bono),0);

  const pct = v => v!==null&&v!==undefined?`${Math.round((v||0)*100)}%`:"–";

  if(view==="eval"&&selectedPerson) {
    const ev=evaluations[selectedPerson];
    const kpis=ROLE_KPIS[ev.rol]||[];
    const rendimiento=computeRendimiento(selectedPerson,selectedQ);

    const startEdit=()=>{ setDraft(JSON.parse(JSON.stringify(ev.quarters[selectedQ]||{resultados:{},comportamientos:{},gallup:[],fortalezas:["","",""],mejoras:["","",""],notas:""}))); };
    const saveDraft=()=>{ setEvaluations(prev=>{ const u=JSON.parse(JSON.stringify(prev)); u[selectedPerson].quarters[selectedQ]=draft; return u; }); setSaved(true); setTimeout(()=>setSaved(false),1800); };
    const updateR=(kId,field,val)=>setDraft(d=>({...d,resultados:{...d.resultados,[kId]:{...(d.resultados[kId]||{}),[field]:parseFloat(val)||0}}}));
    const updateC=(id,val)=>setDraft(d=>({...d,comportamientos:{...d.comportamientos,[id]:parseFloat(val)}}));
    const updateG=(i,val)=>setDraft(d=>{ const g=[...(d.gallup||[])]; g[i]=parseInt(val); return {...d,gallup:g}; });

    if(!draft) startEdit();

    return (
      <div style={{padding:"16px 16px 100px"}}>
        <button onClick={()=>{setView("overview");setSelectedPerson(null);setDraft(null);}} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#0d9488",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:14,padding:0}}>
          <Icon name="back" size={16} color="#0d9488"/>RRHH
        </button>
        <div style={{...S.card,background:"linear-gradient(135deg,rgba(251,191,36,.08),rgba(2,8,24,.5))",border:"1px solid rgba(251,191,36,.15)",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><h3 style={{color:"#e2e8f0",fontSize:17,fontWeight:800,margin:0}}>{ev.name}</h3><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{ev.rol} · {selectedQ}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:900,color:"#4ade80",fontFamily:"monospace"}}>{pct(rendimiento)}</div><div style={{fontSize:10,color:"#64748b"}}>Rendimiento</div></div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
          {["resumen","resultados","comportamientos","gallup"].map(s=>(
            <button key={s} onClick={()=>setSection(s)} style={{padding:"7px 0",borderRadius:9,border:`1px solid ${section===s?"#0d9488":"rgba(148,163,184,.1)"}`,background:section===s?"rgba(13,148,136,.12)":"transparent",color:section===s?"#0d9488":"#64748b",fontWeight:700,fontSize:10,cursor:"pointer",textTransform:"capitalize"}}>
              {s==="gallup"?"12Qs":s.slice(0,7)}
            </button>
          ))}
        </div>
        {saved&&<div style={{textAlign:"center",padding:"8px",borderRadius:9,background:"rgba(74,222,128,.1)",color:"#4ade80",fontWeight:700,fontSize:12,marginBottom:10}}>✓ Guardado</div>}
        {draft&&section==="resumen"&&(
          <div>
            {[{label:"Fortalezas",arr:draft.fortalezas,fn:(i,v)=>setDraft(d=>{const f=[...(d.fortalezas||[])];f[i]=v;return{...d,fortalezas:f};}),color:"#4ade80"},{label:"Acciones para mejorar",arr:draft.mejoras,fn:(i,v)=>setDraft(d=>{const m=[...(d.mejoras||[])];m[i]=v;return{...d,mejoras:m};}),color:"#fb923c"}].map(({label,arr,fn,color})=>(
              <div key={label} style={S.card}>
                <div style={{fontSize:11,fontWeight:700,color,marginBottom:8}}>{label}</div>
                {(arr||["",""]).map((v,i)=><input key={i} value={v} onChange={e=>fn(i,e.target.value)} placeholder={`${i+1}.`} style={{...S.input,marginBottom:6}}/>)}
              </div>
            ))}
            <div style={S.card}><label style={S.label}>Notas</label><textarea value={draft.notas||""} onChange={e=>setDraft(d=>({...d,notas:e.target.value}))} rows={3} style={{...S.input,resize:"none"}} placeholder="Observaciones..."/></div>
          </div>
        )}
        {draft&&section==="resultados"&&(
          <div>
            <p style={{color:"#64748b",fontSize:11,fontStyle:"italic",margin:"0 0 10px"}}>SUMPRODUCTO(% logrado × importancia) · cap 150%</p>
            {kpis.map(k=>{ const r=draft.resultados[k.id]||{gol:0,resultado:0}; const p=r.gol>0?Math.min(r.resultado/r.gol,1.5):0; const c=p>=1?"#4ade80":p>=0.7?"#fb923c":"#f87171"; return (
              <div key={k.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{k.titulo}</div><div style={{fontSize:10,color:"#64748b"}}>{k.metrico} · {Math.round(k.importancia*100)}%</div></div><div style={{fontSize:16,fontWeight:800,color:c,fontFamily:"monospace"}}>{pct(p)}</div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div><label style={S.label}>Gol</label><input type="number" value={r.gol} onChange={e=>updateR(k.id,"gol",e.target.value)} style={S.input}/></div>
                  <div><label style={S.label}>Resultado</label><input type="number" value={r.resultado} onChange={e=>updateR(k.id,"resultado",e.target.value)} style={S.input}/></div>
                </div>
                {S.scoreBar(p/1.5,c)}
              </div>
            );})}
          </div>
        )}
        {draft&&section==="comportamientos"&&(
          <div>
            <p style={{color:"#64748b",fontSize:11,fontStyle:"italic",margin:"0 0 10px"}}>0=nunca · 0.5=a veces · 0.75=frecuente · 1=siempre</p>
            {COMPORTAMIENTOS_LIST.map((c,i)=>{ const v=draft.comportamientos[c.id]??0.75; const col=v>=0.9?"#4ade80":v>=0.6?"#fb923c":"#f87171"; return (
              <div key={c.id} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,color:"#e2e8f0",flex:1,paddingRight:8}}>{i+1}. {c.desc}</span><span style={{fontSize:15,fontWeight:800,color:col,fontFamily:"monospace"}}>{v.toFixed(2)}</span></div>
                <div style={{display:"flex",gap:6}}>
                  {[0,0.5,0.75,1.0].map(val=><button key={val} onClick={()=>updateC(c.id,val)} style={{flex:1,padding:"7px 0",borderRadius:8,border:`1px solid ${v===val?"#0d9488":"rgba(148,163,184,.1)"}`,background:v===val?"rgba(13,148,136,.15)":"transparent",color:v===val?"#0d9488":"#64748b",fontWeight:700,fontSize:10,cursor:"pointer"}}>{val===0?"Nunca":val===0.5?"A veces":val===0.75?"Frec.":"Siempre"}</button>)}
                </div>
              </div>
            );})}
          </div>
        )}
        {draft&&section==="gallup"&&(
          <div>
            <p style={{color:"#64748b",fontSize:11,fontStyle:"italic",margin:"0 0 10px"}}>1=nunca · 3=a veces · 5=siempre</p>
            {GALLUP_12.map((q,i)=>{ const v=(draft.gallup||[])[i]??3; const c=v>=4?"#4ade80":v>=3?"#fb923c":"#f87171"; return (
              <div key={i} style={{...S.card,paddingBottom:10}}>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>{i+1}. {q}</div>
                <div style={{display:"flex",gap:6}}>
                  {[1,2,3,4,5].map(val=><button key={val} onClick={()=>updateG(i,val)} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1.5px solid ${v===val?c:"rgba(148,163,184,.1)"}`,background:v===val?`${c}18`:"transparent",color:v===val?c:"#64748b",fontWeight:800,fontSize:14,cursor:"pointer"}}>{val}</button>)}
                </div>
              </div>
            );})}
            <div style={{...S.card,textAlign:"center"}}><div style={{fontSize:10,color:"#64748b"}}>Promedio</div><div style={{fontSize:24,fontWeight:800,color:"#0d9488",fontFamily:"monospace"}}>{draft.gallup?.length?(draft.gallup.reduce((a,b)=>a+b,0)/draft.gallup.length).toFixed(2):"–"}</div></div>
          </div>
        )}
        <button onClick={saveDraft} style={{...S.btn(true),marginTop:8,boxShadow:"0 0 20px rgba(13,148,136,.2)"}}>{lang==="es"?"💾 Guardar Evaluación":"💾 Save Evaluation"}</button>
      </div>
    );
  }

  return (
    <div style={{padding:"16px 16px 100px"}}>
      <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:"0 0 4px"}}>RRHH</h2>
      <p style={{color:"#64748b",fontSize:12,margin:"0 0 14px"}}>{lang==="es"?"Bonos · Evaluaciones · Nivel 3 únicamente":"Bonuses · Evaluations · Level 3 only"}</p>

      {/* ── BOARD CHARTS ── */}
      <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:1}}>
        {lang==="es"?"Métricas para directorio":"Board-level metrics"}
      </div>

      <TDCUploader
        tdcData={liveTDC} pruebas={livePruebas} biomasa={liveBiomasa}
        onUpload={handleTDCUpload} lang={lang}/>

      <div style={{...S.card,paddingBottom:8,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?"Biomasa: Real vs Proyectado":"Biomass: Actual vs Projected"}</div>
          <span style={{fontSize:9,color:"#64748b"}}>kg · toca para ver valor</span>
        </div>
        <BoardBiomassVsSalesChart lang={lang} data={liveBiomasa}/>
      </div>

      <div style={{...S.card,paddingBottom:8,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?"Ingresos Acumulados":"Cumulative Revenue"}</div>
          <span style={{fontSize:9,color:"#64748b"}}>USD · $0.05/kg wet</span>
        </div>
        <BoardRevenueChart lang={lang}/>
      </div>

      <div style={{...S.card,paddingBottom:8,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?"Trayectoria a Meta Dic 2026":"Path to Dec 2026 Target"}</div>
          <span style={{fontSize:9,color:"#64748b"}}>11,200 kg</span>
        </div>
        <BoardProgressChart lang={lang}/>
        <div style={{fontSize:10,color:"#475569",marginTop:6,fontStyle:"italic",textAlign:"center"}}>
          {lang==="es"
            ?"Precios estimados · Primera venta comercial pendiente · Actualizar al cerrar primer contrato"
            :"Estimated prices · First commercial sale pending · Update when first contract closes"}
        </div>
      </div>

      {/* Operational charts — also refresh from uploaded TDC */}
      <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:1}}>
        {lang==="es"?"Indicadores operacionales":"Operational indicators"}
      </div>

      <div style={{...S.card,paddingBottom:8,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?"Promedio TDC":"Avg TDC"}</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:9,padding:"1px 6px",borderRadius:5,background:"rgba(74,222,128,.12)",color:"#4ade80"}}>obj ≥2.5%/día</span>
            <span style={{fontSize:9,color:"#f59e0b"}}>🌿 cosecha</span>
          </div>
        </div>
        <TDCChart lang={lang} data={liveTDC}/>
      </div>

      <div style={{...S.card,paddingBottom:8,marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>
          {lang==="es"?"% Pruebas en Categorías":"% Tests by Category"}
        </div>
        <PruebasChart lang={lang} data={livePruebas}/>
      </div>

      <div style={{height:1,background:"rgba(148,163,184,.08)",margin:"0 0 14px"}}/>

      {/* Quarter tabs */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {["Q1 2026","Q3 2026"].map(q=><button key={q} onClick={()=>setSelectedQ(q)} style={{flex:1,padding:"7px 0",borderRadius:10,border:`1px solid ${selectedQ===q?"#f59e0b":"rgba(148,163,184,.12)"}`,background:selectedQ===q?"rgba(245,158,11,.12)":"transparent",color:selectedQ===q?"#f59e0b":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>{q}</button>)}
      </div>

      {/* Pool */}
      <div style={S.card}>
        <label style={S.label}>{lang==="es"?"Pool trimestral ($)":"Quarterly pool ($)"}</label>
        <input type="number" value={poolAmount} onChange={e=>setPoolAmount(parseFloat(e.target.value)||0)} style={{...S.input,fontSize:22,fontWeight:800,textAlign:"center",color:"#f59e0b",fontFamily:"monospace"}}/>
      </div>

      {/* Crew scores — sorted by rendimiento, uses proportional bonus tied to pool */}
      {withBonus.sort((a,b)=>(b.rendimiento||0)-(a.rendimiento||0)).map((c,i)=>{
        const r=c.rendimiento;
        const incidents=weeklyIncidents.filter(w=>w.initials===c.initials).reduce((s,w)=>s+w.tardanzas+w.ausencias,0);
        return (
          <div key={c.initials} style={{...S.card,cursor:"pointer"}} onClick={()=>{setSelectedPerson(c.initials);setDraft(null);setSection("resumen");setView("eval");}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:36,height:36,borderRadius:10,background:i===0?"rgba(251,191,36,.15)":i===1?"rgba(148,163,184,.1)":"rgba(13,148,136,.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:12,fontWeight:800,color:i===0?"#fbbf24":i===1?"#94a3b8":"#0d9488"}}>{i===0?"🥇":i===1?"🥈":c.initials}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{c.name}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#64748b"}}>{c.role}</span>
                  {incidents>0&&<span style={{fontSize:10,color:"#f87171",fontWeight:700}}>⏰{incidents} {lang==="es"?"incid.":"incident(s)"}</span>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:800,color:"#4ade80",fontFamily:"monospace"}}>{pct(r)}</div>
                <div style={{fontSize:12,color:"#f59e0b",fontWeight:700}}>${c.bono}</div>
              </div>
            </div>
            {S.scoreBar(r||0,"#0d9488")}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
              <div style={{fontSize:10,color:"#475569"}}>Pts: {c.pts} · Peso: {((c.weightedScore/totalWeighted)*100).toFixed(1)}%</div>
              <div style={{fontSize:10,color:"#475569"}}>✏️ {lang==="es"?"Evaluar":"Evaluate"}</div>
            </div>
          </div>
        );
      })}

      {/* Pool summary — always ties to pool */}
      <div style={{...S.card,borderColor:"rgba(245,158,11,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
          <span style={{color:"#94a3b8",fontWeight:600}}>{lang==="es"?"Pool total":"Total pool"}</span>
          <span style={{color:"#f59e0b",fontFamily:"monospace",fontWeight:800}}>${poolAmount.toFixed(2)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
          <span style={{color:"#94a3b8"}}>{lang==="es"?"Total asignado":"Total assigned"}</span>
          <span style={{color:"#e2e8f0",fontFamily:"monospace"}}>${totalBono.toFixed(2)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
          <span style={{color:"#64748b"}}>Varianza</span>
          <span style={{color: Math.abs(poolAmount-totalBono)<0.01?"#4ade80":"#f87171",fontFamily:"monospace",fontWeight:700}}>${(poolAmount-totalBono).toFixed(2)}</span>
        </div>
        {Math.abs(poolAmount-totalBono)<0.01&&<div style={{fontSize:10,color:"#4ade80",marginTop:6,textAlign:"center"}}>✓ {lang==="es"?"El pool cuadra exactamente":"Pool ties exactly"}</div>}
        <p style={{fontSize:10,color:"#475569",margin:"8px 0 0",lineHeight:1.4}}>{lang==="es"?"Fórmula: (pts × rendimiento) ÷ Σ(pts × rendimiento) × pool":"Formula: (pts × rendimiento) ÷ Σ(pts × rendimiento) × pool"}</p>
      </div>

      {/* ── EXPORT SECTION ── */}
      <div style={{height:1,background:"rgba(148,163,184,.08)",margin:"14px 0"}}>
      </div>
      <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:1}}>
        {lang==="es"?"Exportar datos":"Export data"}
      </div>
      <ExportButtons
        readings={readings} systems={systems}
        evaluations={evaluations} weeklyIncidents={weeklyIncidents}
        profScores={profScores} assignedTasks={assignedTasks}
        lang={lang}/>
      <p style={{fontSize:10,color:"#475569",margin:"0 0 8px",lineHeight:1.5,textAlign:"center"}}>
        {lang==="es"
          ?"Los archivos CSV abren directamente en Excel. El reporte de operaciones requiere lecturas registradas por sistema."
          :"CSV files open directly in Excel. Operations report requires readings logged per system."}
      </p>
    </div>
  );
}

// ─── BOTTOM NAV — role-aware ──────────────────────────────────────────────────
function BottomNav({ tab, setTab, role, lang }) {
  const navConfig = {
    vaquero: [
      { id:"inicio",   icon:"task",     label: lang==="es"?"Inicio":"Home" },
      { id:"score",    icon:"star",     label: lang==="es"?"Mi Puntaje":"My Score" },
      { id:"sistemas", icon:"grid",     label: "Sistemas" },
      { id:"perfil",   icon:"user",     label: lang==="es"?"Perfil":"Profile" },
    ],
    capitan: [
      { id:"dashboard",icon:"chart",    label: "Dashboard" },
      { id:"tareas",   icon:"task",     label: lang==="es"?"Mis Tareas":"My Tasks" },
      { id:"sistemas", icon:"grid",     label: "Sistemas" },
      { id:"mapa",     icon:"map",      label: "Mapa" },
      { id:"perfil",   icon:"user",     label: lang==="es"?"Perfil":"Profile" },
    ],
    supervisor: [
      { id:"dashboard",icon:"chart",    label: "Dashboard" },
      { id:"plan",     icon:"calendar", label: lang==="es"?"Plan":"Plan" },
      { id:"sistemas", icon:"grid",     label: "Sistemas" },
      { id:"mapa",     icon:"map",      label: "Mapa" },
      { id:"equipo",   icon:"users",    label: "Equipo" },
    ],
    default: [
      { id:"dashboard",icon:"chart",    label: "Dashboard" },
      { id:"plan",     icon:"calendar", label: lang==="es"?"Plan Semanal":"Weekly Plan" },
      { id:"sistemas", icon:"grid",     label: "Sistemas" },
      { id:"rrhh",     icon:"rrhh",     label: "RRHH" },
      { id:"perfil",   icon:"user",     label: lang==="es"?"Perfil":"Profile" },
    ],
  };
  const tabs = navConfig[role] || navConfig.default;

  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(2,8,24,.96)",borderTop:"1px solid rgba(148,163,184,.07)",display:"flex",justifyContent:"space-around",padding:"8px 0 max(8px,env(safe-area-inset-bottom))",backdropFilter:"blur(20px)",zIndex:100}}>
      {tabs.map(item=>(
        <button
          key={item.id}
          onClick={()=>setTab(item.id)}
          role="tab"
          aria-selected={tab===item.id}
          aria-label={item.label}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"4px 0"}}>
          <Icon name={item.icon} size={20} color={tab===item.id?"#0d9488":"#475569"}/>
          <span style={{fontSize:9,color:tab===item.id?"#0d9488":"#475569",fontWeight:tab===item.id?700:400}}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth — persist to localStorage, role-aware auto-logout ──────────────────
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem('vdm_user')); } catch { return null; }
  })();

  const [lang, setLang]               = useState(localStorage.getItem('vdm_lang') || "es");
  const [user, setUser]               = useState(savedUser);
  const [tab, setTab]                 = useState(savedUser?.role==="vaquero" ? "inicio" : "dashboard");
  const [personalView, setPersonalView] = useState(null);
  const inactivityTimer = useRef(null);

  // Auto-logout timeouts by role (ms)
  const INACTIVITY_MS = { vaquero: 60*60*1000, supervisor: 30*60*1000, ceo: 30*60*1000, consultant: 30*60*1000 };

  const doLogout = useCallback(() => {
    localStorage.removeItem('vdm_user');
    setUser(null);
    setTab("dashboard");
    clearTimeout(inactivityTimer.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    clearTimeout(inactivityTimer.current);
    const ms = INACTIVITY_MS[user.role] || 30*60*1000;
    inactivityTimer.current = setTimeout(doLogout, ms);
  }, [user, doLogout]);

  // Start/reset timer on any user interaction
  useEffect(() => {
    if (!user) return;
    const events = ['touchstart','mousedown','keydown','scroll'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive:true }));
    resetInactivityTimer(); // start on login
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  // Persist lang preference
  useEffect(() => { localStorage.setItem('vdm_lang', lang); }, [lang]);

  const [systems,  setSystems]  = useState(() => {
    try {
      const cached = localStorage.getItem('aq_systems_cache');
      return cached ? JSON.parse(cached) : SYSTEMS_DATA;
    } catch { return SYSTEMS_DATA; }
  });
  const [readings, setReadings] = useState(() => {
    try {
      const cached = localStorage.getItem('aq_readings_cache');
      return cached ? JSON.parse(cached) : INITIAL_READINGS;
    } catch { return INITIAL_READINGS; }
  });
  const [assignedTasks, setAssignedTasks]     = useState(SEED_ASSIGNED_TASKS);
  const [evaluations, setEvaluations]         = useState(SEED_EVALUATIONS);
  const [profScores, setProfScores]           = useState(SEED_PROF_SCORES);
  const [weeklyIncidents, setWeeklyIncidents] = useState(SEED_WEEKLY_INCIDENTS);
  const [timecards, setTimecards]             = useState(SEED_TIMECARDS);
  const [announcements, setAnnouncements]     = useState(SEED_ANNOUNCEMENTS);

  // ── Chart data state — persisted to localStorage, updated by TDC upload ─────
  const [chartPruebas, setChartPruebas] = useState(() => {
    try { const c = localStorage.getItem('aq_chart_pruebas'); return c ? JSON.parse(c) : PRUEBAS_DATA; }
    catch { return PRUEBAS_DATA; }
  });
  const [chartTDC, setChartTDC] = useState(() => {
    try { const c = localStorage.getItem('aq_chart_tdc'); return c ? JSON.parse(c) : TDC_DATA; }
    catch { return TDC_DATA; }
  });
  const [chartBiomasa, setChartBiomasa] = useState(() => {
    try { const c = localStorage.getItem('aq_chart_biomasa'); return c ? JSON.parse(c) : BIOMASA_DATA; }
    catch { return BIOMASA_DATA; }
  });
  const handleChartDataUpload = ({ tdc, pruebas, biomasa }) => {
    setChartTDC(tdc);     try { localStorage.setItem('aq_chart_tdc',     JSON.stringify(tdc));     } catch {}
    setChartPruebas(pruebas); try { localStorage.setItem('aq_chart_pruebas', JSON.stringify(pruebas)); } catch {}
    setChartBiomasa(biomasa); try { localStorage.setItem('aq_chart_biomasa', JSON.stringify(biomasa)); } catch {}
  };

  // ── Editable catalog lists (Level 2+ can add new options) ───────────────────
  const [regions,    setRegions]    = useState(DEFAULT_REGIONS);
  const [tipos,      setTipos]      = useState(DEFAULT_TIPOS);
  const [materiales, setMateriales] = useState(DEFAULT_MATERIALES);
  const [semillas,   setSemillas]   = useState(DEFAULT_SEMILLAS);

  // ── Sync state ──────────────────────────────────────────────────────────────
  const [online, setOnline]     = useState(navigator.onLine);
  const [syncing, setSyncing]   = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const offlineQueue = useRef([]);  // { table, op, payload }
  const syncTimer    = useRef(null);

  // ── Supabase import — wait for client before any operations ────────────────
  const sb = useRef(null);
  const [sbReady, setSbReady] = useState(false);

  useEffect(() => {
    import('./supabase.js')
      .then(m => {
        sb.current = m.supabase;
        setSbReady(true);
        console.log('[AquaOps] Supabase client loaded ✓', !!m.supabase);
      })
      .catch(e => console.warn('[AquaOps] Supabase load FAILED:', e));
  }, []);

  // ── Online/offline detection ─────────────────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => { setOnline(true);  triggerSync(); };
    const goOffline = () => setOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── Poll for remote updates every 30s when online and sb ready ──────────────
  useEffect(() => {
    if (!online || !sbReady) return;
    const id = setInterval(() => {
      // Flush any queued offline items before pulling fresh data
      if (offlineQueue.current.length > 0) {
        triggerSync();
      } else {
        pullRemoteData();
      }
    }, 30000);
    return () => clearInterval(id);
  }, [online, user, sbReady]);

  const [initialLoading, setInitialLoading] = useState(true);

  // Pull once Supabase client is ready AND user is logged in
  useEffect(() => {
    if (!sbReady) return;
    if (user && online) {
      pullRemoteData().finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [user, sbReady]);

  // ── PULL: fetch latest data from Supabase ────────────────────────────────────
  const pullRemoteData = async () => {
    if (!sb.current || !online) return;
    setSyncing(true);
    try {
      const [tasksRes, annRes, incRes, readRes] = await Promise.all([
        sb.current.from('assigned_tasks').select('*').order('id'),
        sb.current.from('announcements').select('*').order('created_at', { ascending: false }),
        sb.current.from('weekly_incidents').select('*'),
        sb.current.from('readings').select('*').order('fecha'),
      ]);

      if (tasksRes.data?.length) {
        setAssignedTasks(tasksRes.data.map(r => ({
          id: r.id, assignedTo: r.assigned_to, day: r.day,
          taskType: r.task_type, sistema: r.sistema,
          objetivo: r.objetivo, date: r.date, actual: r.actual,
          condicion: r.condicion, voiceNote: null,
          foto: r.foto_url, confirmed: r.confirmed,
          notas: r.notas || "",
          comentarioVaquero: r.comentario_vaquero || null,
          comentarioFecha:   r.comentario_fecha   || null,
        })));
      }

      if (annRes.data?.length) {
        setAnnouncements(annRes.data.map(r => ({
          id: r.id, author: r.author, initials: r.initials,
          role: r.role, message: r.message,
          date: r.date, pinned: r.pinned,
        })));
      }

      if (incRes.data?.length) {
        setWeeklyIncidents(incRes.data.map(r => ({
          week: r.week, initials: r.initials,
          tardanzas: r.tardanzas, ausencias: r.ausencias, notas: r.notas || "",
        })));
      }

      // Merge remote readings with local — remote wins on conflict by id
      // This prevents wiping locally-entered readings not yet pushed
      if (readRes.data?.length) {
        const pulled = readRes.data.map(r => ({
          id:          r.id,
          sistema:     r.sistema,
          fecha:       r.fecha,
          tipo:        r.tipo || 'peso',
          peso:        r.peso,
          sueltos:     r.sueltos     ?? null,
          tdc:         r.tdc         ?? null,
          salt:        r.salt        ?? null,
          ph:          r.ph          ?? null,
          salinidad:   r.salinidad   ?? null,
          temp:        r.temp        ?? null,
          condiciones: r.condiciones ?? null,
          aguas:       r.aguas       ?? null,
          notas:       r.notas       || "",
          foto:        null,
          cosechada:   r.cosechada   ?? null,
          sembrado:    r.sembrado    ?? null,
          buoys:       r.buoys       ?? null,
        }));
        // Merge: keep local-only readings (id not in remote), override with remote for shared ids
        setReadings(prev => {
          const remoteIds = new Set(pulled.map(r => r.id));
          const localOnly = prev.filter(r => !remoteIds.has(r.id));
          const merged = [...pulled, ...localOnly];
          try { localStorage.setItem('aq_readings_cache', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }

      setLastSync(new Date());
    } catch (e) {
      console.warn('Pull failed:', e.message);
    } finally {
      setSyncing(false);
    }
  };

  // ── PUSH: write one item to Supabase, then refresh dashboard ────────────────
  const pushItem = async (table, op, payload) => {
    if (!sb.current || !online) {
      console.warn(`[AquaOps] pushItem queued (sb=${!!sb.current}, online=${online}):`, table, op, payload?.id);
      offlineQueue.current.push({ table, op, payload });
      setPendingCount(offlineQueue.current.length);
      return false;
    }
    try {
      console.log(`[AquaOps] pushItem → ${table}.${op}`, payload?.id);
      let error;
      if (op === 'upsert') {
        // weekly_incidents uses composite PK (week, initials) not id
        const conflictCol = table === 'weekly_incidents' ? 'week,initials' : 'id';
        ({ error } = await sb.current.from(table).upsert(payload, { onConflict: conflictCol }));
      } else if (op === 'insert') {
        ({ error } = await sb.current.from(table).insert(payload));
      } else if (op === 'delete') {
        ({ error } = await sb.current.from(table).delete().eq('id', payload.id));
      }
      if (error) throw error;
      setLastSync(new Date());
      return true;
    } catch (e) {
      console.error(`[AquaOps] Push to ${table} FAILED:`, e?.message || e?.code || e, JSON.stringify(e), 'payload:', payload);
      offlineQueue.current.push({ table, op, payload });
      setPendingCount(offlineQueue.current.length);
      return false;
    }
  };

  // ── SYNC: flush the offline queue ────────────────────────────────────────────
  const triggerSync = async () => {
    if (!sb.current || offlineQueue.current.length === 0) {
      pullRemoteData();
      return;
    }
    console.log(`[AquaOps] triggerSync: flushing ${offlineQueue.current.length} queued items`);
    setSyncing(true);
    const queue = [...offlineQueue.current];
    offlineQueue.current = [];
    setPendingCount(0);
    let failed = [];
    for (const item of queue) {
      try {
        if (item.op === 'upsert') {
          await sb.current.from(item.table).upsert(item.payload, { onConflict: 'id' });
        } else if (item.op === 'insert') {
          await sb.current.from(item.table).insert(item.payload);
        } else if (item.op === 'delete') {
          await sb.current.from(item.table).delete().eq('id', item.payload.id);
        }
      } catch {
        failed.push(item);
      }
    }
    if (failed.length) {
      offlineQueue.current = failed;
      setPendingCount(failed.length);
    }
    await pullRemoteData();
    setSyncing(false);
    setLastSync(new Date());
  };

  // ── WRAPPED SETTERS — update local state AND push to Supabase ────────────────
  const syncAssignedTasks = (updater) => {
    setAssignedTasks(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Find what changed and push it
      next.forEach(task => {
        const old = prev.find(t => t.id === task.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(task)) {
          pushItem('assigned_tasks', 'upsert', {
            id: task.id, assigned_to: task.assignedTo,
            day: task.day, task_type: task.taskType,
            sistema: task.sistema, objetivo: task.objetivo,
            date: task.date, actual: task.actual,
            condicion: task.condicion, confirmed: task.confirmed,
            notas: task.notas || "",
            updated_at: new Date().toISOString(),
          });
        }
      });
      return next;
    });
  };

  const syncAnnouncements = (updater) => {
    setAnnouncements(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Find new items
      next.forEach(ann => {
        if (!prev.find(a => a.id === ann.id)) {
          pushItem('announcements', 'upsert', {
            id: ann.id, author: ann.author,
            initials: ann.initials, role: ann.role,
            message: ann.message, date: ann.date,
            pinned: ann.pinned,
          });
        }
      });
      // Find deleted items
      prev.forEach(ann => {
        if (!next.find(a => a.id === ann.id)) {
          pushItem('announcements', 'delete', { id: ann.id });
        }
      });
      return next;
    });
  };

  const syncWeeklyIncidents = (updater) => {
    setWeeklyIncidents(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      next.forEach(inc => {
        const old = prev.find(i => i.week === inc.week && i.initials === inc.initials);
        if (!old || JSON.stringify(old) !== JSON.stringify(inc)) {
          pushItem('weekly_incidents', 'upsert', {
            week: inc.week, initials: inc.initials,
            tardanzas: inc.tardanzas, ausencias: inc.ausencias,
            notas: inc.notas || "",
          });
        }
      });
      return next;
    });
  };

  // ── syncReadings — push every new/edited reading to Supabase + localStorage ──
  // This is the critical fix: readings previously used raw setReadings
  // which meant new field readings were lost on logout/refresh
  const syncReadings = (updater) => {
    setReadings(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Find only new or changed readings — avoid pushing all 16 seed entries on every save
      const changed = next.filter(r => {
        const old = prev.find(x => x.id === r.id);
        return !old || JSON.stringify(old) !== JSON.stringify(r);
      });
      // Push outside the setState callback so it doesn't block render
      if (changed.length > 0) {
        console.log(`[AquaOps] syncReadings: ${changed.length} changed readings to push`, changed.map(r => ({id:r.id,sistema:r.sistema})));
        setTimeout(() => {
          changed.forEach(r => {
            pushItem('readings', 'upsert', {
              id:          r.id,
              sistema:     r.sistema,
              fecha:       r.fecha,
              tipo:        r.tipo        ?? "peso",
              peso:        r.peso        ?? null,
              sueltos:     r.sueltos     ?? null,
              tdc:         r.tdc         ?? null,
              salt:        r.salt        ?? null,
              ph:          r.ph          ?? null,
              temp:        r.temp        ?? null,
              salinidad:   r.salinidad   ?? null,
              condiciones: r.condiciones ?? null,
              aguas:       r.aguas       ?? null,
              notas:       r.notas       ?? "",
              foto:        r.foto        ?? null,
              cosechada:   r.cosechada   ?? null,
              sembrado:    r.sembrado    ?? null,
              buoys:       r.buoys       ?? null,
              updated_at:  new Date().toISOString(),
            });
          });
        }, 0);
      } else {
        console.log('[AquaOps] syncReadings: no changes detected');
      }
      // Persist to localStorage — survives inactivity logout
      try { localStorage.setItem('aq_readings_cache', JSON.stringify(next)); }
      catch(e) { console.warn('readings cache write failed:', e); }
      return next;
    });
  };

  // ── syncSystems — persist new systems to localStorage immediately ─────────────
  const syncSystems = (updater) => {
    setSystems(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('aq_systems_cache', JSON.stringify(next));
      } catch(e) { console.warn('systems cache write failed:', e); }
      return next;
    });
  };

  // ── SYNC INDICATOR COMPONENT ─────────────────────────────────────────────────
  const SyncDot = () => {
    if (syncing) return (
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"#fb923c",animation:"pulse 1s infinite"}}/>
        <span style={{fontSize:9,color:"#fb923c"}}>sync</span>
      </div>
    );
    if (!online) return (
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"#475569"}}/>
        {pendingCount>0&&<span style={{fontSize:9,color:"#475569"}}>{pendingCount} pendiente{pendingCount>1?"s":""}</span>}
      </div>
    );
    return (
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 6px #4ade80"}}/>
        {lastSync&&<span style={{fontSize:9,color:"#334155"}}>{lastSync.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
      </div>
    );
  };

  const isVaquero  = user?.role === "vaquero";
  const isCapitan  = user?.role === "capitan";
  const isSup      = user?.role === "supervisor";
  const isL3       = user?.role === "ceo" || user?.role === "consultant";

  const handleLogin = (u) => {
    localStorage.setItem('vdm_user', JSON.stringify(u));
    setUser(u);
    if(u.role==="vaquero") setTab("inicio");
    else if(u.role==="capitan") setTab("tareas");
    else setTab("dashboard");
  };

  if(!user) return <LoginScreen onLogin={handleLogin} lang={lang} setLang={setLang}/>;

  return (
    <div className="vdm-root" style={{minHeight:"100vh",background:"#021c1e",fontFamily:"'Nunito','Segoe UI',sans-serif",color:"#e2e8f0",maxWidth:"100%",margin:"0 auto",position:"relative"}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        :focus-visible{outline:2px solid #0d9488!important;outline-offset:2px!important;}
        :focus:not(:focus-visible){outline:none;}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;}}
        @media(min-width:600px){
          .vdm-root{max-width:600px!important;margin:0 auto!important;}
          .vdm-root nav{max-width:600px!important;left:50%!important;transform:translateX(-50%)!important;right:auto!important;}
        }
        @media(min-width:900px){
          .vdm-root{max-width:720px!important;}
          .vdm-root nav{max-width:720px!important;}
        }
      `}</style>

      {/* Top bar */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(2,8,24,.92)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(148,163,184,.06)",padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,overflow:"hidden",background:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <img src="data:image/jpeg;base64,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" alt="logo" style={{width:28,height:28,objectFit:"contain"}}/>
          </div>
          <span style={{fontWeight:800,fontSize:14,color:"#f0fdfa"}}>AquaOps</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:10,color:"#475569",background:"rgba(255,255,255,.04)",padding:"3px 8px",borderRadius:12}}>{user.name.split(" ")[0]}</span>
          <SyncDot/>
        </div>
      </div>

      {/* Offline banner */}
      {!online && (
        <div
          role="alert"
          aria-live="assertive"
          style={{background:"rgba(71,85,105,.9)",padding:"6px 16px",display:"flex",alignItems:"center",gap:8,fontSize:11,color:"#cbd5e1"}}>
          <span aria-hidden="true">📵</span>
          <span>{lang==="es"?"Sin conexión — los cambios se guardarán al reconectar":"Offline — changes will sync when reconnected"}</span>
          {pendingCount>0&&<span style={{marginLeft:"auto",color:"#fb923c",fontWeight:700}}>{pendingCount} pendiente{pendingCount>1?"s":""}</span>}
        </div>
      )}

      {/* Sync announcements — screen reader only */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}
      >
        {lastSync ? `Sincronizado a las ${lastSync.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}` : ""}
      </div>

      {/* Toast notification region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",
          zIndex:9999,display:"flex",flexDirection:"column",gap:8,
          pointerEvents:"none",width:"calc(100% - 32px)",maxWidth:400}}
        id="toast-region"
      />

      {/* Skeleton loading screen */}
      {initialLoading && (
        <div style={{padding:"16px 16px 100px"}} aria-busy="true" aria-label="Cargando...">
          {[1,2,3].map(i=>(
            <div key={i} style={{background:"rgba(15,23,42,.8)",border:"1px solid rgba(148,163,184,.08)",borderRadius:14,padding:14,marginBottom:10}}>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:11,backgroundSize:"200% 100%",
                  background:"linear-gradient(90deg,#032d30 25%,#054040 50%,#032d30 75%)",
                  animation:"shimmer 1.5s infinite"}}/>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{height:14,width:"60%",borderRadius:6,backgroundSize:"200% 100%",
                    background:"linear-gradient(90deg,#032d30 25%,#054040 50%,#032d30 75%)",
                    animation:"shimmer 1.5s infinite"}}/>
                  <div style={{height:11,width:"40%",borderRadius:6,backgroundSize:"200% 100%",
                    background:"linear-gradient(90deg,#032d30 25%,#054040 50%,#032d30 75%)",
                    animation:"shimmer 1.5s infinite"}}/>
                </div>
              </div>
              <div style={{height:5,borderRadius:3,backgroundSize:"200% 100%",
                background:"linear-gradient(90deg,#032d30 25%,#054040 50%,#032d30 75%)",
                animation:"shimmer 1.5s infinite"}}/>
            </div>
          ))}
        </div>
      )}

      {/* Screen routing */}
      {/* Personal dashboard overlay — reachable from any screen */}
      {!initialLoading && personalView && (
        <PersonalDashboard
          initials={personalView}
          onBack={()=>setPersonalView(null)}
          assignedTasks={assignedTasks}
          systems={systems}
          readings={readings}
          weeklyIncidents={weeklyIncidents}
          timecards={timecards}
          setTimecards={setTimecards}
          lang={lang}
          canEdit={["supervisor","ceo","consultant"].includes(user.role)}
          user={user}
        />
      )}
      <div role="main" aria-label="Contenido principal" style={{display: initialLoading ? "none" : "block"}}>
        {/* Level 1 — Vaquero */}
        {isVaquero && tab==="inicio"   && <VaqueroInicio assignedTasks={assignedTasks} setAssignedTasks={syncAssignedTasks} systems={systems} user={user} lang={lang} announcements={announcements}/>}
        {isVaquero && tab==="score"    && <VaqueroScore  assignedTasks={assignedTasks} weeklyIncidents={weeklyIncidents} profScores={profScores} evaluations={evaluations} user={user} lang={lang}/>}
        {isVaquero && tab==="sistemas" && <SistemasTab systems={systems} setSystems={syncSystems} readings={readings} setReadings={syncReadings} lang={lang} user={user} regions={regions} setRegions={setRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas}/>}
        {isVaquero && tab==="perfil"   && <ProfileTab    user={user} lang={lang} setLang={setLang} onLogout={doLogout}/>}

        {/* Level 1.5 — Capitán (Sistemas edit + Announcements, no evaluations/bonuses) */}
        {isCapitan && tab==="dashboard" && <SupervisorDashboard assignedTasks={assignedTasks} systems={systems} readings={readings} lang={lang} announcements={announcements} setAnnouncements={syncAnnouncements} user={user} onNavigate={(t,id)=>{setTab(t);}} onViewPerson={(initials)=>setPersonalView(initials)} chartPruebas={chartPruebas}/>}
        {isCapitan && tab==="tareas"    && <CapitanTareas assignedTasks={assignedTasks} setAssignedTasks={syncAssignedTasks} systems={systems} user={user} lang={lang} announcements={announcements}/>}
        {isCapitan && tab==="sistemas"  && <SistemasTab systems={systems} setSystems={syncSystems} readings={readings} setReadings={syncReadings} lang={lang} user={user} regions={regions} setRegions={setRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas}/>}
        {isCapitan && tab==="mapa"      && <MapaTab systems={systems} lang={lang}/>}
        {isCapitan && tab==="perfil"    && <ProfileTab user={user} lang={lang} setLang={setLang} onLogout={doLogout}/>}

        {/* Level 2 — Supervisor */}
        {isSup && tab==="dashboard" && <SupervisorDashboard assignedTasks={assignedTasks} systems={systems} readings={readings} lang={lang} announcements={announcements} setAnnouncements={syncAnnouncements} user={user} onNavigate={(t,id)=>{setTab(t);}} onViewPerson={(initials)=>setPersonalView(initials)} chartPruebas={chartPruebas}/>}
        {isSup && tab==="plan"      && <PlanSemanal assignedTasks={assignedTasks} setAssignedTasks={syncAssignedTasks} systems={systems} lang={lang} user={user}/>}
        {isSup && tab==="sistemas"  && <SistemasTab systems={systems} setSystems={syncSystems} readings={readings} setReadings={syncReadings} lang={lang} user={user} regions={regions} setRegions={setRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas} onChartUpload={handleChartDataUpload}/>}
        {isSup && tab==="mapa"      && <MapaTab      systems={systems} lang={lang}/>}
        {isSup && tab==="equipo"    && <EquipoTab    assignedTasks={assignedTasks} weeklyIncidents={weeklyIncidents} setWeeklyIncidents={syncWeeklyIncidents} timecards={timecards} setTimecards={setTimecards} systems={systems} readings={readings} lang={lang} user={user}/>}
        {isSup && tab==="perfil"    && <ProfileTab   user={user} lang={lang} setLang={setLang} onLogout={doLogout}/>}

        {/* Level 3 — CEO + Consultant */}
        {isL3 && tab==="dashboard" && <SupervisorDashboard assignedTasks={assignedTasks} systems={systems} readings={readings} lang={lang} announcements={announcements} setAnnouncements={syncAnnouncements} user={user} onNavigate={(t,id)=>{setTab(t);}} onViewPerson={(initials)=>setPersonalView(initials)} chartPruebas={chartPruebas}/>}
        {isL3 && tab==="plan"      && <PlanSemanal assignedTasks={assignedTasks} setAssignedTasks={syncAssignedTasks} systems={systems} lang={lang} user={user}/>}
        {isL3 && tab==="sistemas"  && <SistemasTab systems={systems} setSystems={syncSystems} readings={readings} setReadings={syncReadings} lang={lang} user={user} regions={regions} setRegions={setRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas} onChartUpload={handleChartDataUpload}/>}
        {isL3 && tab==="mapa"      && <MapaTab      systems={systems} lang={lang}/>}
        {isL3 && tab==="rrhh"      && <RRHHTab evaluations={evaluations} setEvaluations={setEvaluations} profScores={profScores} setProfScores={setProfScores} assignedTasks={assignedTasks} weeklyIncidents={weeklyIncidents} readings={readings} systems={systems} lang={lang} user={user} chartTDC={chartTDC} chartPruebas={chartPruebas} chartBiomasa={chartBiomasa} onChartUpload={handleChartDataUpload}/>}
        {isL3 && tab==="perfil"    && <ProfileTab   user={user} lang={lang} setLang={setLang} onLogout={doLogout}/>}
      </div>

      <BottomNav tab={tab} setTab={setTab} role={user.role} lang={lang}/>
    </div>
  );
}