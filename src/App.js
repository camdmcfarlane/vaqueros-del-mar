import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase as sbStatic } from './supabase';
import ProtectedRoute from './components/ProtectedRoute';
import VigilanciaQueue from './components/VigilanciaQueue';
import CapitanSistemas from './protocol/CapitanSistemas';
import CapitanTareasComponent from './protocol/CapitanTareas';
import { ReadingActionButtons, EditReading, DeleteReading } from './protocol/ReadingActions';
import { AuthContext } from './contexts/AuthContext';
import { getRedirectForRole } from './utils/roleGuard';
import NotesFeed from './components/NotesFeed';
import SystemNotes from './components/SystemNotes';
import { logActivity } from './utils/activityLog';
import ActivityFeed from './components/ActivityFeed';

// ─── DATA LAYER ──────────────────────────────────────────────────────────────
import { SYSTEMS_DATA } from "./data/systems";
import {
  DEFAULT_REGIONS, DEFAULT_TIPOS, DEFAULT_MATERIALES, DEFAULT_SEMILLAS,
  REGION_SUPERVISORS, TASK_CADENCES,
  THRESHOLDS, TASK_TYPES, PROF_CATEGORIES, SCORE_WEIGHTS,
  CREW, EVAL_SPLIT, CURRENT_QUARTER, ROLE_KPIS,
  COMPORTAMIENTOS_LIST, GALLUP_12, TOTAL_PTS,
  PRICE_PER_KG_WET, TASK_SCHEMA, CONDICION_EMOJIS,
  SYSTEMS_DATA_VERSION, READING_CADENCE_DAYS,
} from "./data/constants";
import {
  INITIAL_READINGS, TDC_DATA, PRUEBAS_DATA, BIOMASA_DATA,
  SALES_DATA, REVENUE_CUMULATIVE,
  SEED_TASK_LOGS, SEED_PROF_SCORES,
  SEED_ANNOUNCEMENTS, SEED_TIMECARDS, SEED_WEEKLY_INCIDENTS,
  SEED_EVALUATIONS, SEED_ASSIGNED_TASKS,
} from "./data/seed";
import { USERS } from "./data/users";
import { calcHoras } from "./data/helpers";
import { T } from "./data/translations";
import { S, AUTH_ISTYLE, AUTH_LSTYLE } from "./styles";
import SyncTest from "./components/SyncTest";
import { useSyncHealth, SyncHealthDot } from "./components/SyncHealth";

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


// ─── AUTH SHELL ───────────────────────────────────────────────────────────────

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
  const [logging, setLogging]   = useState(false);
  const [primerNombre, setPrimerNombre]   = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [apellido, setApellido]           = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [cedula, setCedula]     = useState("");
  const [noCedula, setNoCedula] = useState(false);
  const [regErr, setRegErr]     = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async () => {
    setLogging(true); setErr("");
    const unNorm = un.trim().toLowerCase();
    // Static accounts first — works offline
    const staticU = USERS.find(u=>u.username===unNorm && u.password===pw);
    if(staticU){ setLogging(false); onLogin(staticU); return; }
    // Dynamic accounts — Supabase usuarios table
    try {
      const { data } = await sbStatic.from('usuarios').select('*').eq('username',unNorm).eq('active',true).maybeSingle();
      if(data && data.password_plain===pw){
        const u={ username:data.username, password:data.password_plain, role:data.role, name:data.name, initials:data.initials, assignedSystems:null };
        setLogging(false); onLogin(u); return;
      }
    } catch {}
    setLogging(false);
    setErr(lang==="es"?"Usuario o contraseña incorrectos":"Invalid username or password");
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
          <button onClick={handleLogin} disabled={logging} style={{width:"100%",padding:14,borderRadius:11,border:"none",background:"linear-gradient(135deg,#0d9488,#0f766e)",color:"#fff",fontWeight:800,fontSize:15,cursor:logging?"default":"pointer",marginTop:14,opacity:logging?0.7:1}}>
            {logging?(lang==="es"?"Verificando...":"Checking..."):(lang==="es"?"Entrar":"Sign In")}
          </button>
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
  return readings.filter(r=>r.sistema===sysId && r.tipo==='peso' && r.peso).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
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

// ─── ALERT THRESHOLDS ────────────────────────────────────────────────────────
function computeAlerts(assignedTasks, readings, systems) {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0,10);
  const archiveCutoff = new Date(today); archiveCutoff.setDate(archiveCutoff.getDate() - 7);
  const archiveCutoffStr = archiveCutoff.toISOString().slice(0,10);
  // Routine high-frequency tasks excluded from late alerts (weather-dependent, always recurring)
  const ROUTINE_TASK_TYPES = new Set(['vigilancia','limpieza']);
  const result = [];
  for (const t of (assignedTasks||[])) {
    if (!t.date || t.date >= todayStr) continue;
    if (t.date < archiveCutoffStr) continue; // older than 7 days → weather/circumstance, ignore
    if (ROUTINE_TASK_TYPES.has(t.taskType)) continue; // routine recurring work, not alerted
    const isDone = t.actual !== null || (TASK_SCHEMA[t.taskType]?.yesno && t.condicion !== null);
    if (isDone) continue;
    const daysLate = Math.round((today - new Date(t.date+'T00:00:00')) / 86400000);
    const severity = daysLate >= 3 ? 'ceo' : daysLate >= 2 ? 'farm_manager' : 'ops_mgr';
    result.push({ type:'task_late', severity, daysLate, assignedTo:t.assignedTo, taskType:t.taskType, sistema:t.sistema });
  }
  const activeSysIds = new Set((systems||[]).filter(s=>s.estado==='Activo').map(s=>s.id));
  const bySys = {};
  for (const r of (readings||[])) {
    if (r.tipo !== 'peso' || !r.peso || !activeSysIds.has(r.sistema)) continue;
    if (!bySys[r.sistema]) bySys[r.sistema] = [];
    bySys[r.sistema].push(r);
  }
  for (const [sysId, sysR] of Object.entries(bySys)) {
    sysR.sort((a,b) => a.fecha.localeCompare(b.fecha));
    if (sysR.length < 2) continue;
    const curr = sysR[sysR.length-1], prev = sysR[sysR.length-2];
    if (!curr.peso || !prev.peso || curr.peso<=0 || prev.peso<=0) continue;
    const days = Math.max(1, (new Date(curr.fecha)-new Date(prev.fecha))/86400000);
    const adj1 = (prev.peso||0) + (prev.sueltos||0) - (prev.cosechada||0);
    const adj2 = (curr.peso||0) + (curr.sueltos||0);
    if (adj1 <= 0 || adj2 <= 0) continue;
    const tdc = (Math.log(adj2/adj1)/days)*100;
    if (tdc < 3) {
      const severity = tdc < 0 ? 'ceo' : tdc < 1 ? 'farm_manager' : 'ops_mgr';
      const sys = (systems||[]).find(s => s.id === sysId);
      const daysSinceReading = Math.round((new Date() - new Date(curr.fecha+'T12:00:00')) / 86400000);
      result.push({ type:tdc<0?'tdc_loss':'tdc_slow', severity, sistema:sysId, tdc:parseFloat(tdc.toFixed(2)), capitan:sys?.capitan||null, lastReadingDays:daysSinceReading });
    }
  }
  return result;
}
const ROLE_ALERT_LEVEL = { vaquero:0, capitan:0, supervisor:1, director:2, farm_manager:2, consultor:3, admin:3 };
const SEV_LEVEL = { ops_mgr:1, farm_manager:2, ceo:3 };
function alertsForRole(alerts, role) {
  const lvl = ROLE_ALERT_LEVEL[role]||0;
  return (alerts||[]).filter(a => SEV_LEVEL[a.severity]<=lvl && lvl>=1);
}
function AlertBanner({ alerts, onOpenBell }) {
  const ceo = alerts.filter(a=>a.severity==='ceo');
  const fm  = alerts.filter(a=>a.severity==='farm_manager');
  const om  = alerts.filter(a=>a.severity==='ops_mgr');
  const highest = ceo.length ? 'ceo' : fm.length ? 'farm_manager' : om.length ? 'ops_mgr' : null;
  if (!highest) return null;
  const bg  = highest==='ceo' ? 'rgba(239,68,68,.12)' : highest==='farm_manager' ? 'rgba(249,115,22,.12)' : 'rgba(234,179,8,.1)';
  const col = highest==='ceo' ? '#f87171' : highest==='farm_manager' ? '#fb923c' : '#fbbf24';
  const icon = highest==='ceo' ? '🚨' : highest==='farm_manager' ? '⚠️' : '⏰';
  const lossCount = alerts.filter(a=>a.type==='tdc_loss').length;
  const slowCount = alerts.filter(a=>a.type==='tdc_slow').length;
  const lateCount = alerts.filter(a=>a.type==='task_late').length;
  const parts = [];
  if (lossCount) parts.push(`${lossCount} pérdida${lossCount>1?'s':''}`);
  if (slowCount) parts.push(`${slowCount} lenta${slowCount>1?'s':''}`);
  if (lateCount) parts.push(`${lateCount} tarea${lateCount>1?'s':''} vencida${lateCount>1?'s':''}`);
  return (
    <div onClick={onOpenBell} style={{ background:bg, borderBottom:`1px solid ${col}30`, padding:'7px 16px', display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
      <span style={{fontSize:14}}>{icon}</span>
      <span style={{fontSize:12, color:col, fontWeight:700, flex:1}}>{parts.join(' · ')}</span>
      <span style={{fontSize:10, color:col, opacity:.7}}>Ver →</span>
    </div>
  );
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
  const W = 320, H = 126, PL = 42, PR = 8, PT = 12, PB = 34;
  const cW = W - PL - PR, cH = H - PT - PB;
  const vals = chartData.map(d => d.tdc).filter(v => v !== null);
  const minV = Math.min(...vals, -0.5), maxV = Math.max(...vals, 2.5);
  const range = maxV - minV || 1;
  const xStep = cW / Math.max(chartData.length - 1, 1);
  const yZero = PT + cH - ((0 - minV) / range) * cH;

  const toX = i => PL + i * xStep;
  const toY = v => PT + cH - ((v - minV) / range) * cH;
  const pts = chartData.map((d, i) => d.tdc !== null ? `${toX(i)},${toY(d.tdc)}` : null).filter(Boolean).join(" ");
  // Dynamic ticks — 4-5 evenly spaced values covering the actual data range
  const _rawStep = range / 4;
  const _niceStep = [0.5, 1, 2, 3, 5].find(s => s >= _rawStep) || Math.ceil(_rawStep);
  const _tickStart = Math.ceil(minV / _niceStep) * _niceStep;
  const ticks = [];
  for (let t = _tickStart; t <= maxV + _niceStep * 0.5; t = parseFloat((t + _niceStep).toFixed(2))) ticks.push(t);

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
      {/* X labels — every other one, two-line (day + month) */}
      {chartData.filter((_,i) => i % 2 === 0).map((d, idx) => {
        const i = idx * 2;
        const parts = d.label.split(" ");
        return (
          <g key={i}>
            <text x={toX(i)} y={H-16} textAnchor="middle" fontSize="7" fill="#475569">{parts[0]}</text>
            <text x={toX(i)} y={H-7}  textAnchor="middle" fontSize="7" fill="#334155">{parts[1]||""}</text>
          </g>
        );
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

// Returns true for any system that is a dummy/test entry (exclude from all charts)
function isTestSystem(s) {
  if (!s) return false;
  const testFields = [s.id, s.tipo, s.familia, s.semillas, s.pueblo, s.categoria, s.capitan, s.buceador];
  return testFields.some(v => v && String(v).toLowerCase() === 'test');
}

// Returns true for "prueba" category systems (individual research plots, IDs often start with "Pi")
function isPruebaSystem(s) {
  if (!s) return false;
  const cat = (s.categoria || '').toLowerCase();
  const tipo = (s.tipo || '').toLowerCase();
  const id = (s.id || '');
  return cat === 'prueba' || tipo === 'prueba' || /^pi\d/i.test(id);
}

function buildLiveTDCData(readings, systems) {
  // Formula: (1 + (curr_total - (prev_total - prev_harvest)) / (prev_total - prev_harvest))^(1/7) - 1
  // Matches the TDC Oro spreadsheet — aggregates all active systems weekly, deducts prior-week harvest

  const activeSysIds = new Set(
    (systems||[]).filter(s => s.estado === "Activo" && !isTestSystem(s)).map(s => s.id)
  );
  const pesoR = (readings||[]).filter(r => activeSysIds.has(r.sistema) && r.tipo === 'peso' && r.peso);
  if (!pesoR.length) return null;

  const mondayOf = (fecha) => {
    const d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  };

  // For each week, build: total biomass (latest per-system reading that week) + harvest deducted that week
  const weekData = {};
  for (const r of pesoR) {
    const wk = mondayOf(r.fecha);
    if (!weekData[wk]) weekData[wk] = { bySys: {}, harvest: 0 };
    // Keep latest reading per system per week
    const prev = weekData[wk].bySys[r.sistema];
    if (!prev || new Date(r.fecha) > new Date(prev.fecha)) {
      weekData[wk].bySys[r.sistema] = r;
    }
    // Accumulate harvest removed this week (cosechada field on peso readings)
    if (r.cosechada) weekData[wk].harvest += parseFloat(r.cosechada) || 0;
  }

  // Collapse to weekly totals
  const weeks = Object.keys(weekData).sort();
  if (weeks.length < 2) return null;

  const weekTotals = {};
  for (const wk of weeks) {
    weekTotals[wk] = {
      total: Object.values(weekData[wk].bySys).reduce((s, r) => s + (r.peso || 0), 0),
      harvest: weekData[wk].harvest,
    };
  }

  // Build TDC series
  const result = [];
  for (let i = 1; i < weeks.length; i++) {
    const curr = weekTotals[weeks[i]];
    const prev = weekTotals[weeks[i - 1]];
    const adjustedPrev = prev.total - prev.harvest;
    if (adjustedPrev <= 0) continue;
    const growthRatio = (curr.total - adjustedPrev) / adjustedPrev;
    const tdc = (Math.pow(1 + growthRatio, 1 / 7) - 1) * 100;
    const d = new Date(weeks[i] + 'T12:00:00');
    const label = d.toLocaleDateString('es-PA', { month: 'short', day: 'numeric' });
    result.push({ label, tdc: parseFloat(tdc.toFixed(3)), harvest: curr.harvest > 0 });
  }

  return result.length ? result.slice(-12) : null;
}

function buildLivePruebas(readings, systems) {
  // For each week, count how many prueba systems fall in each TDC category (B/V/A/R)
  // "prueba" = categoria==='prueba', OR tipo==='prueba', OR ID starting with "Pi" (e.g. Pi3-7)
  const pruebaSysIds = new Set(
    (systems||[])
      .filter(s => s.estado === 'Activo' && isPruebaSystem(s) && !isTestSystem(s))
      .map(s => s.id)
  );
  if (!pruebaSysIds.size) return null;

  const pesoR = (readings||[]).filter(r => pruebaSysIds.has(r.sistema) && r.tipo === 'peso' && r.peso);
  if (!pesoR.length) return null;

  const mondayOf = (fecha) => {
    const d = new Date(fecha + 'T12:00:00');
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  };

  // Group readings per system, ascending
  const bySys = {};
  for (const r of pesoR) {
    if (!bySys[r.sistema]) bySys[r.sistema] = [];
    bySys[r.sistema].push(r);
  }
  for (const id of Object.keys(bySys)) {
    bySys[id].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  const allWeeks = [...new Set(pesoR.map(r => mondayOf(r.fecha)))].sort();
  if (allWeeks.length < 2) return null;

  const result = [];
  for (let wi = 1; wi < allWeeks.length; wi++) {
    const wk = allWeeks[wi];
    const prevWk = allWeeks[wi - 1];
    let b = 0, v = 0, a = 0, r = 0;

    for (const sysReadings of Object.values(bySys)) {
      // Latest reading at or before this week / previous week
      const currR = [...sysReadings].reverse().find(rd => mondayOf(rd.fecha) <= wk);
      const prevR = [...sysReadings].reverse().find(rd => mondayOf(rd.fecha) <= prevWk);
      if (!currR || !prevR || currR.id === prevR.id) continue;
      const days = Math.max(1, (new Date(currR.fecha) - new Date(prevR.fecha)) / 864e5);
      const tdc = (Math.log(currR.peso / prevR.peso) / days) * 100;
      if (tdc >= 6) b++;
      else if (tdc >= 3) v++;
      else if (tdc >= 0) a++;
      else r++;
    }

    const total = b + v + a + r;
    if (!total) continue;

    const d = new Date(wk + 'T12:00:00');
    const label = d.toLocaleDateString('es-PA', { month: 'short', day: 'numeric' });
    result.push({
      label,
      b: Math.round((b / total) * 100),
      v: Math.round((v / total) * 100),
      a: Math.round((a / total) * 100),
      r: Math.round((r / total) * 100),
    });
  }

  return result.length ? result.slice(-12) : null;
}

function SupervisorDashboard({ assignedTasks, systems, readings, lang, announcements, setAnnouncements, user, onNavigate, onViewPerson, chartPruebas, regions=[], setRegions=()=>{} }) {
  const [tab, setDashTab] = useState("resumen");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionEditMode,  setRegionEditMode]  = useState(false);
  const [regionEditDraft, setRegionEditDraft] = useState("");
  const [regionNewDraft,  setRegionNewDraft]  = useState("");
  const active = systems.filter(s=>s.estado==="Activo");
  const done   = assignedTasks.filter(t=>t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
  const pending = assignedTasks.filter(t=>t.actual===null&&!(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null)).length;
  const HARVEST_CYCLE = 45;  // Cosecha cada 45 días
  const SEED_CYCLE    = 30;  // Siembra cada 30 días
  const CLEAN_CYCLE   = 3;   // Limpieza cada 3 días

  // Live TDC time-series — falls back to seed if no readings
  const liveTDCData = buildLiveTDCData(readings, systems);
  // Live pruebas category breakdown — falls back to chartPruebas prop (manual upload) if no live data
  const livePruebasData = buildLivePruebas(readings, systems);

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

  const isConsultor = user?.role === "consultor";
  const dashTabs = [
    { id:"resumen",   label:lang==="es"?"Resumen":"Summary" },
    { id:"biomasa",   label:lang==="es"?"Biomasa":"Biomass" },
    { id:"equipo",    label:lang==="es"?"Equipo":"Crew" },
    { id:"regiones",  label:lang==="es"?"Regiones":"Regions" },
    ...(isConsultor ? [{ id:"ops", label:"Ops" }] : []),
  ];

  return (
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{marginBottom:14}}>
        <h2 style={{color:"#e2e8f0",fontSize:22,fontWeight:800,margin:0}}>{lang==="es"?"Panel General":"Dashboard"}</h2>
        <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>{new Date().toLocaleDateString(lang==="es"?"es-PA":"en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
      </div>

      {/* Tab bar */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${dashTabs.length},1fr)`,gap:5,marginBottom:16}}>
        {dashTabs.map(t=>(
          <button key={t.id} onClick={()=>setDashTab(t.id)}
            style={{padding:"7px 2px",borderRadius:10,border:`1px solid ${tab===t.id?"#0d9488":"rgba(148,163,184,.12)"}`,
              background:tab===t.id?"rgba(13,148,136,.12)":"transparent",
              color:tab===t.id?"#0d9488":"#64748b",fontWeight:700,fontSize:10,cursor:"pointer"}}>
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
              <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?"Crecimiento":"Growth Rate"}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:9,padding:"1px 6px",borderRadius:5,background:"rgba(74,222,128,.12)",color:"#4ade80"}}>obj ≥2.5%/día</span>
                <span style={{fontSize:9,color:"#f59e0b"}}>🌿 cosecha</span>
              </div>
            </div>
            <TDCChart lang={lang} data={liveTDCData||undefined}/>
          </div>

          {/* Chart 2: Pruebas */}
          <div style={{...S.card,paddingBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>
              {lang==="es"?"% Pruebas en Categorías":"% Tests by Category"}
            </div>
            <PruebasChart lang={lang} data={livePruebasData || chartPruebas}/>
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
                onClick={()=>onNavigate && onNavigate("sistema", s.id)}>
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
                      <span>{lang==="es"?"Cosecha (45d)":"Harvest (45d)"}</span>
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

      {/* ═══ TAB 3: EQUIPO ═══ */}
      {tab==="equipo" && (
        <div>
          {/* Team task status */}
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:1}}>
            {lang==="es"?"Estado del equipo":"Team status"}
          </div>
          {CREW.filter(c=>c.role!=="Supervisor").map(c=>{
            const isDirector = c.initials==="EV";
            if(isDirector){
              const teamTasks=assignedTasks.filter(t=>t.assignedTo!=="EV");
              const teamDoneAdj=teamTasks.filter(t=>{
                if(t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null))return true;
                if(t.taskType==="pesos"||t.taskType==="parametros")return readings.some(r=>r.logged_by===t.assignedTo&&r.fecha>=t.date);
                return false;
              }).length;
              const total=teamTasks.length;
              const p=total?Math.round((teamDoneAdj/total)*100):0;
              return(
                <div key={c.initials} style={{...S.card,cursor:"pointer",borderColor:"rgba(13,148,136,.2)",marginBottom:8}}
                  onClick={()=>onViewPerson?onViewPerson(c.initials):null}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <div style={{width:32,height:32,borderRadius:9,background:"rgba(13,148,136,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:10,fontWeight:800,color:"#0d9488"}}>{c.initials}</span>
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{c.name}</div>
                        <div style={{fontSize:10,color:"#0d9488",fontWeight:600}}>{lang==="es"?"Director · equipo completo":"Director · full team"}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:15,fontWeight:800,color:p===100?"#4ade80":p>=70?"#fb923c":"#f87171",fontFamily:"monospace"}}>{p}%</div>
                      <div style={{fontSize:10,color:"#475569"}}>{teamDoneAdj}/{total}</div>
                    </div>
                  </div>
                  {S.scoreBar(p/100,p===100?"#4ade80":p>=70?"#fb923c":"#f87171")}
                </div>
              );
            }
            const mine=assignedTasks.filter(t=>t.assignedTo===c.initials);
            const d=mine.filter(t=>{
              if(t.actual!==null||(TASK_SCHEMA[t.taskType]?.yesno&&t.condicion!==null))return true;
              if(t.taskType==="pesos"||t.taskType==="parametros")return readings.some(r=>r.logged_by===c.initials&&r.fecha>=t.date);
              return false;
            }).length;
            const p=mine.length?Math.round((d/mine.length)*100):0;
            return(
              <div key={c.initials} style={{...S.card,cursor:"pointer",marginBottom:8}}
                onClick={()=>onViewPerson?onViewPerson(c.initials):null}>
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
              </div>
            );
          })}

          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"16px 0 10px",textTransform:"uppercase",letterSpacing:1}}>
            {lang==="es"?"Crecimiento por buceador":"Growth by diver"}
          </div>
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
            const mySystems = systemMetrics.filter(s=>getCapitan(s)===c.initials);
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

      {/* ═══ TAB 4: REGIONES ═══ */}
      {tab==="regiones" && (()=>{
        const ago30 = new Date(Date.now()-30*24*60*60*1000).toISOString().slice(0,10);

        const regionStats = [...new Set(systems.map(s=>s.region).filter(Boolean))].map(rName=>{
          const rSysAll    = systems.filter(s=>s.region===rName);
          const rSysActive = systemMetrics.filter(s=>s.region===rName);
          const totalBiomass = rSysActive.reduce((sum,s)=>sum+(s.latest?.peso||0),0);
          const rates = rSysActive.map(s=>s.rate).filter(r=>r!==null);
          const avgTDC = rates.length ? rates.reduce((a,b)=>a+b,0)/rates.length : null;
          const sysIds = new Set(rSysAll.map(s=>s.id));
          const harvested30d = readings.filter(r=>sysIds.has(r.sistema)&&r.fecha>=ago30&&(r.cosechada_infectada||r.cosechada)).reduce((sum,r)=>sum+(r.cosechada_infectada||r.cosechada||0),0);
          const seeded30d    = readings.filter(r=>sysIds.has(r.sistema)&&r.fecha>=ago30&&r.sembrado).reduce((sum,r)=>sum+(r.sembrado||0),0);
          const projection30d = rSysActive.reduce((sum,s)=>{
            if(!s.latest?.peso) return sum;
            return sum+(s.rate!==null ? s.latest.peso*Math.exp((s.rate/100)*30) : s.latest.peso);
          },0);
          const harvestDays = rSysActive.map(s=>s.daysToHarvest).filter(d=>d!==null);
          const nextHarvest = harvestDays.length ? Math.min(...harvestDays) : null;
          const capEntry = Object.entries(CAPITAN_REGIONS).find(([,cfg])=>cfg.regions&&cfg.regions.some(r=>r.toLowerCase()===rName.toLowerCase()));
          const capitan = capEntry?.[0]||null;
          const onTargetCount = rSysActive.filter(s=>s.rate!==null&&s.rate>=2.5).length;
          const seedYieldRatio = seeded30d>0&&harvested30d>0 ? (harvested30d/seeded30d) : null;
          const paramR = readings.filter(r=>sysIds.has(r.sistema)&&r.tipo==="parametros"&&r.fecha>=ago30);
          const phVals=paramR.map(r=>r.ph).filter(Boolean);
          const tempVals=paramR.map(r=>r.temp).filter(Boolean);
          const salVals=paramR.map(r=>r.salinidad).filter(Boolean);
          const trendColor = avgTDC===null?"#475569":avgTDC>=2.5?"#4ade80":avgTDC>=1?"#fb923c":"#f87171";
          const trendArrow = avgTDC===null?"—":avgTDC>=2.5?"▲":avgTDC>=1?"→":"▼";
          return { name:rName, systems:rSysAll, activeSystems:rSysActive, totalBiomass, avgTDC, harvested30d, seeded30d, projection30d, nextHarvest, capitan, onTargetCount, seedYieldRatio, trendColor, trendArrow,
            avgPh:phVals.length?(phVals.reduce((a,b)=>a+b,0)/phVals.length).toFixed(1):null,
            avgTemp:tempVals.length?(tempVals.reduce((a,b)=>a+b,0)/tempVals.length).toFixed(1):null,
            avgSal:salVals.length?(salVals.reduce((a,b)=>a+b,0)/salVals.length).toFixed(0):null,
          };
        }).sort((a,b)=>(b.avgTDC||(-999))-(a.avgTDC||(-999)));

        const farmBiomass  = regionStats.reduce((s,r)=>s+r.totalBiomass,0);
        const farmRates    = regionStats.map(r=>r.avgTDC).filter(r=>r!==null);
        const farmAvgTDC   = farmRates.length ? farmRates.reduce((a,b)=>a+b,0)/farmRates.length : null;
        const farmProj30d  = regionStats.reduce((s,r)=>s+r.projection30d,0);
        const maxBiomass   = Math.max(...regionStats.map(r=>r.totalBiomass),1);

        return (
          <div>
            {/* Farm-wide header */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:18}}>
              {[
                {label:lang==="es"?"Biomasa total":"Total biomass", value:`${(farmBiomass/1000).toFixed(1)}kg`, color:"#0d9488"},
                {label:"TDC promedio", value:farmAvgTDC!==null?`${farmAvgTDC>=0?"+":""}${farmAvgTDC.toFixed(2)}%`:"—", color:farmAvgTDC===null?"#475569":farmAvgTDC>=2.5?"#4ade80":farmAvgTDC>=1?"#fb923c":"#f87171"},
                {label:lang==="es"?"Proyección 30d":"Proj. 30d", value:`~${(farmProj30d/1000).toFixed(1)}kg`, color:"#a855f7"},
              ].map(k=>(
                <div key={k.label} style={{...S.card,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#64748b",marginBottom:4,lineHeight:1.2}}>{k.label}</div>
                  <div style={{fontSize:16,fontWeight:800,color:k.color,fontFamily:"monospace"}}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Ranked list */}
            {regionStats.map((r,i)=>{
              const barPct = maxBiomass>0 ? Math.round((r.totalBiomass/maxBiomass)*100) : 0;
              return (
                <div key={r.name} style={{...S.card,marginBottom:8,cursor:"pointer"}}
                  onClick={()=>setSelectedRegion(selectedRegion===r.name?null:r.name)}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:14,fontWeight:900,color:"#334155",width:22,textAlign:"center",flexShrink:0}}>#{i+1}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        <span style={{fontSize:13,fontWeight:800,color:"#e2e8f0"}}>{r.name}</span>
                        {r.capitan&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:6,background:"rgba(251,146,60,.12)",color:"#fb923c",fontWeight:700}}>{r.capitan}</span>}
                        <span style={{fontSize:9,color:"#475569",marginLeft:"auto"}}>{r.activeSystems.length}/{r.systems.length} activos</span>
                      </div>
                      <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,.06)",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${barPct}%`,background:r.trendColor,borderRadius:3}}/>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,minWidth:60}}>
                      <div style={{fontSize:15,fontWeight:800,color:r.trendColor,fontFamily:"monospace"}}>
                        {r.avgTDC!==null?`${r.avgTDC>=0?"+":""}${r.avgTDC.toFixed(2)}%`:"—"}
                      </div>
                      <div style={{fontSize:10,color:"#64748b"}}>{(r.totalBiomass/1000).toFixed(1)}kg</div>
                    </div>
                    <div style={{fontSize:16,color:r.trendColor,flexShrink:0,width:18,textAlign:"center"}}>{r.trendArrow}</div>
                  </div>
                </div>
              );
            })}

            {/* Add region */}
            <div style={{display:"flex",gap:6,marginTop:12}}>
              <input value={regionNewDraft} onChange={e=>setRegionNewDraft(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&regionNewDraft.trim()){setRegions(p=>[...new Set([...p,regionNewDraft.trim()])]);setRegionNewDraft(""); try{sbStatic.from('regions').upsert([{name:regionNewDraft.trim()}],{onConflict:'name'})}catch{}}}}
                placeholder={lang==="es"?"Nueva región…":"New region…"}
                style={{...S.input,flex:1,fontSize:12,padding:"6px 10px"}}/>
              <button disabled={!regionNewDraft.trim()}
                onClick={()=>{if(!regionNewDraft.trim())return;setRegions(p=>[...new Set([...p,regionNewDraft.trim()])]);setRegionNewDraft("");try{sbStatic.from('regions').upsert([{name:regionNewDraft.trim()}],{onConflict:'name'})}catch{}}}
                style={{padding:"6px 14px",borderRadius:9,border:"none",background:regionNewDraft.trim()?"linear-gradient(135deg,#0d9488,#0f766e)":"rgba(13,148,136,.1)",color:regionNewDraft.trim()?"#fff":"#334155",fontWeight:700,fontSize:12,cursor:regionNewDraft.trim()?"pointer":"not-allowed"}}>
                +
              </button>
            </div>
          </div>
        );
      })()}

      {/* Region detail bottom sheet */}
      {selectedRegion && (()=>{
        const ago30 = new Date(Date.now()-30*24*60*60*1000).toISOString().slice(0,10);
        const rSysAll    = systems.filter(s=>s.region===selectedRegion);
        const rSysActive = systemMetrics.filter(s=>s.region===selectedRegion);
        const totalBiomass = rSysActive.reduce((sum,s)=>sum+(s.latest?.peso||0),0);
        const rates = rSysActive.map(s=>s.rate).filter(r=>r!==null);
        const avgTDC = rates.length ? rates.reduce((a,b)=>a+b,0)/rates.length : null;
        const sysIds = new Set(rSysAll.map(s=>s.id));
        const harvested30d = readings.filter(r=>sysIds.has(r.sistema)&&r.fecha>=ago30&&(r.cosechada_infectada||r.cosechada)).reduce((sum,r)=>sum+(r.cosechada_infectada||r.cosechada||0),0);
        const seeded30d    = readings.filter(r=>sysIds.has(r.sistema)&&r.fecha>=ago30&&r.sembrado).reduce((sum,r)=>sum+(r.sembrado||0),0);
        const projection30d = rSysActive.reduce((sum,s)=>sum+(s.latest?.peso?(s.rate!==null?s.latest.peso*Math.exp((s.rate/100)*30):s.latest.peso):0),0);
        const harvestDays = rSysActive.map(s=>s.daysToHarvest).filter(d=>d!==null);
        const nextHarvest = harvestDays.length ? Math.min(...harvestDays) : null;
        const onTargetCount = rSysActive.filter(s=>s.rate!==null&&s.rate>=2.5).length;
        const seedYieldRatio = seeded30d>0&&harvested30d>0 ? (harvested30d/seeded30d) : null;
        const paramR = readings.filter(r=>sysIds.has(r.sistema)&&r.tipo==="parametros"&&r.fecha>=ago30);
        const phVals=paramR.map(r=>r.ph).filter(Boolean);
        const tempVals=paramR.map(r=>r.temp).filter(Boolean);
        const salVals=paramR.map(r=>r.salinidad).filter(Boolean);
        const avgPh=phVals.length?(phVals.reduce((a,b)=>a+b,0)/phVals.length).toFixed(1):null;
        const avgTemp=tempVals.length?(tempVals.reduce((a,b)=>a+b,0)/tempVals.length).toFixed(1):null;
        const avgSal=salVals.length?(salVals.reduce((a,b)=>a+b,0)/salVals.length).toFixed(0):null;
        const trendColor = avgTDC===null?"#475569":avgTDC>=2.5?"#4ade80":avgTDC>=1?"#fb923c":"#f87171";
        const canEdit = ["admin","consultor","director"].includes(user?.role);

        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
            onClick={()=>{setSelectedRegion(null);setRegionEditMode(false);}}>
            <div style={{width:"100%",maxWidth:520,background:"#0f1724",borderRadius:"20px 20px 0 0",padding:"20px 20px 48px",maxHeight:"88vh",overflowY:"auto"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{width:36,height:4,borderRadius:2,background:"rgba(148,163,184,.2)",margin:"0 auto 16px"}}/>

              {/* Header */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                {regionEditMode ? (
                  <>
                    <input autoFocus value={regionEditDraft} onChange={e=>setRegionEditDraft(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&regionEditDraft.trim()){const old=selectedRegion;setRegions(p=>p.map(r=>r===old?regionEditDraft.trim():r));try{sbStatic.from('regions').upsert([{name:regionEditDraft.trim()}],{onConflict:'name'});sbStatic.from('regions').delete().eq('name',old);}catch{}setSelectedRegion(regionEditDraft.trim());setRegionEditMode(false);}}}
                      style={{...S.input,flex:1,fontSize:18,fontWeight:800,padding:"6px 10px"}}/>
                    <button onClick={()=>{const old=selectedRegion;if(!regionEditDraft.trim())return;setRegions(p=>p.map(r=>r===old?regionEditDraft.trim():r));try{sbStatic.from('regions').upsert([{name:regionEditDraft.trim()}],{onConflict:'name'});sbStatic.from('regions').delete().eq('name',old);}catch{}setSelectedRegion(regionEditDraft.trim());setRegionEditMode(false);}}
                      style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#0d9488",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>✓</button>
                    <button onClick={()=>setRegionEditMode(false)}
                      style={{padding:"6px 10px",borderRadius:8,border:"none",background:"rgba(255,255,255,.06)",color:"#94a3b8",fontWeight:700,fontSize:13,cursor:"pointer"}}>✕</button>
                  </>
                ) : (
                  <>
                    <div style={{flex:1}}>
                      <div style={{fontSize:20,fontWeight:800,color:"#e2e8f0"}}>{selectedRegion}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{rSysActive.length}/{rSysAll.length} sistemas activos</div>
                    </div>
                    {canEdit&&<button onClick={()=>{setRegionEditDraft(selectedRegion);setRegionEditMode(true);}}
                      style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(148,163,184,.12)",background:"transparent",color:"#94a3b8",fontSize:12,cursor:"pointer"}}>✏️</button>}
                    {canEdit&&<button onClick={()=>{if(!window.confirm(lang==="es"?`¿Eliminar "${selectedRegion}"?`:`Delete "${selectedRegion}"?`))return;setRegions(p=>p.filter(r=>r!==selectedRegion));try{sbStatic.from('regions').delete().eq('name',selectedRegion);}catch{}setSelectedRegion(null);}}
                      style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(239,68,68,.2)",background:"rgba(239,68,68,.06)",color:"#f87171",fontSize:12,cursor:"pointer"}}>🗑</button>}
                  </>
                )}
              </div>

              {/* 2×2 metric grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[
                  {label:lang==="es"?"Biomasa actual":"Current biomass", value:`${(totalBiomass/1000).toFixed(2)} kg`, color:"#0d9488"},
                  {label:"TDC promedio", value:avgTDC!==null?`${avgTDC>=0?"+":""}${avgTDC.toFixed(2)}%/d`:"Sin datos", color:trendColor},
                  {label:lang==="es"?"Cosechado (30d)":"Harvested (30d)", value:harvested30d>0?`${(harvested30d/1000).toFixed(2)} kg`:"—", color:"#4ade80"},
                  {label:lang==="es"?"Proyección 30d":"Projection 30d", value:`~${(projection30d/1000).toFixed(1)} kg`, color:"#a855f7"},
                ].map(m=>(
                  <div key={m.label} style={{background:"rgba(255,255,255,.03)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(148,163,184,.07)"}}>
                    <div style={{fontSize:10,color:"#64748b",marginBottom:6}}>{m.label}</div>
                    <div style={{fontSize:18,fontWeight:800,color:m.color,fontFamily:"monospace"}}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Secondary metrics */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                {[
                  {label:lang==="es"?"En objetivo":"On target", value:`${onTargetCount}/${rSysActive.length}`, color:"#4ade80"},
                  nextHarvest!==null&&{label:lang==="es"?"Prox. cosecha":"Next harvest", value:`${nextHarvest}d`, color:nextHarvest<=7?"#4ade80":"#64748b"},
                  seedYieldRatio&&{label:lang==="es"?"Rendimiento semilla":"Seed yield", value:`${seedYieldRatio.toFixed(1)}x`, color:"#f59e0b"},
                  seeded30d>0&&{label:lang==="es"?"Sembrado (30d)":"Seeded (30d)", value:`${(seeded30d/1000).toFixed(1)}kg`, color:"#64748b"},
                ].filter(Boolean).map(m=>(
                  <div key={m.label} style={{padding:"5px 10px",borderRadius:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(148,163,184,.08)"}}>
                    <span style={{fontSize:10,color:"#64748b"}}>{m.label}: </span>
                    <span style={{fontSize:11,fontWeight:700,color:m.color}}>{m.value}</span>
                  </div>
                ))}
                {(avgPh||avgTemp||avgSal)&&(
                  <div style={{padding:"5px 10px",borderRadius:8,background:"rgba(14,165,233,.06)",border:"1px solid rgba(14,165,233,.12)"}}>
                    <span style={{fontSize:10,color:"#64748b"}}>Agua (30d): </span>
                    {avgPh&&<span style={{fontSize:11,color:"#0ea5e9",fontWeight:700}}>pH {avgPh} </span>}
                    {avgTemp&&<span style={{fontSize:11,color:"#0ea5e9",fontWeight:700}}>{avgTemp}° </span>}
                    {avgSal&&<span style={{fontSize:11,color:"#0ea5e9",fontWeight:700}}>{avgSal}‰</span>}
                  </div>
                )}
              </div>

              {/* Systems list */}
              <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>
                {lang==="es"?"Sistemas":"Systems"}
              </div>
              {[...rSysActive].sort((a,b)=>(b.rate||(-999))-(a.rate||(-999))).map(s=>{
                const col = growthColor(s.rate);
                return (
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid rgba(148,163,184,.06)",cursor:"pointer"}}
                    onClick={()=>{setSelectedRegion(null);onNavigate&&onNavigate("sistema",s.id);}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:col,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{s.id}</span>
                      <span style={{fontSize:11,color:"#475569",marginLeft:6}}>{s.pueblo}</span>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:12,fontWeight:700,color:col,fontFamily:"monospace"}}>
                        {s.rate!==null?`${s.rate>=0?"+":""}${s.rate.toFixed(2)}%`:"—"}
                      </div>
                      <div style={{fontSize:9,color:"#475569"}}>{s.latest?`${(s.latest.peso/1000).toFixed(2)}kg`:"sin datos"}</div>
                    </div>
                    <MiniSparkline data={s.allR} color={col} w={44} h={18}/>
                  </div>
                );
              })}
              {rSysAll.filter(s=>s.estado!=="Activo").map(s=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",opacity:.4}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"#334155",flexShrink:0}}/>
                  <span style={{fontSize:12,color:"#475569"}}>{s.id}</span>
                  <span style={{fontSize:10,color:"#334155",marginLeft:4}}>inactivo</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ═══ TAB 5: OPS MONITOR ═══ */}
      {tab==="ops" && (()=>{
        const today2 = new Date().toISOString().slice(0,10);
        const todayTasks = assignedTasks.filter(t=>t.date===today2);
        const workers = [...new Set(todayTasks.map(t=>t.assignedTo))].sort();
        const totalConfirmed = todayTasks.filter(t=>t.confirmed).length;

        // Last reading submitted per worker (proxy for last-active)
        const lastReadingByWorker = {};
        readings.forEach(r=>{
          if(r.logged_by){
            const prev = lastReadingByWorker[r.logged_by];
            if(!prev || r.fecha > prev.fecha) lastReadingByWorker[r.logged_by] = r;
          }
        });

        return (
          <div>
            {/* ── Task board header ── */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:800,color:"#e2e8f0"}}>
                {lang==="es"?"Tablero de tareas":"Task Board"} · <span style={{color:"#64748b",fontWeight:400}}>{today2}</span>
              </div>
              <div style={{fontSize:12,fontWeight:700,
                color:totalConfirmed===todayTasks.length&&todayTasks.length>0?"#4ade80":"#fb923c",
                background:totalConfirmed===todayTasks.length&&todayTasks.length>0?"rgba(74,222,128,.12)":"rgba(251,146,60,.12)",
                border:`1px solid ${totalConfirmed===todayTasks.length&&todayTasks.length>0?"rgba(74,222,128,.2)":"rgba(251,146,60,.2)"}`,
                borderRadius:20,padding:"3px 10px"}}>
                {totalConfirmed}/{todayTasks.length} ✓
              </div>
            </div>

            {todayTasks.length===0 ? (
              <div style={{...S.card,color:"#64748b",fontSize:13,textAlign:"center",padding:20}}>
                {lang==="es"?"No hay tareas asignadas para hoy":"No tasks assigned for today"}
              </div>
            ) : workers.map(initials=>{
              const wTasks = todayTasks.filter(t=>t.assignedTo===initials);
              const wDone  = wTasks.filter(t=>t.confirmed).length;
              const crewMember = CREW.find(c=>c.initials===initials);
              const lastR = lastReadingByWorker[initials];
              const lastRDays = lastR ? Math.round((Date.now()-new Date(lastR.fecha+"T12:00:00").getTime())/86400000) : null;
              const syncColor = lastRDays===null?"#475569":lastRDays===0?"#4ade80":lastRDays<=1?"#facc15":"#ef4444";
              const syncLabel = lastRDays===null
                ?(lang==="es"?"sin registros":"no readings")
                :lastRDays===0
                  ?(lang==="es"?"✓ activo hoy":"✓ active today")
                  :`${lang==="es"?"último registro":"last reading"}: ${lastRDays}d`;

              return (
                <div key={initials} style={{...S.card,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(13,148,136,.15)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:11,fontWeight:800,color:"#2dd4bf",flexShrink:0}}>
                        {initials}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{crewMember?.name||initials}</div>
                        <div style={{fontSize:10,color:syncColor}}>{syncLabel}</div>
                      </div>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,
                      color:wDone===wTasks.length?"#4ade80":"#fb923c",
                      background:wDone===wTasks.length?"rgba(74,222,128,.1)":"rgba(251,146,60,.1)",
                      borderRadius:16,padding:"3px 10px"}}>
                      {wDone}/{wTasks.length}
                    </div>
                  </div>
                  {wTasks.map(t=>{
                    const schema = TASK_SCHEMA[t.taskType]||{icon:"📋",label:t.taskType};
                    return (
                      <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",
                        borderTop:"1px solid rgba(148,163,184,.07)"}}>
                        <span style={{fontSize:14}}>{schema.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>{t.sistema||"—"}</span>
                          <span style={{fontSize:11,color:"#475569",marginLeft:6}}>{lang==="es"?schema.label:schema.labelEn||schema.label}</span>
                        </div>
                        <div style={{fontSize:13,fontWeight:700,
                          color:t.confirmed?"#4ade80":"#fb923c"}}>
                          {t.confirmed?"✓":"⟳"}
                        </div>
                        {t.actual!=null&&<div style={{fontSize:10,color:"#64748b",marginLeft:4}}>{t.actual}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* ── Readings feed ── */}
            <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,margin:"20px 0 8px",textTransform:"uppercase",letterSpacing:1}}>
              {lang==="es"?"Últimas lecturas":"Recent readings"}
            </div>
            {[...readings]
              .sort((a,b)=>b.fecha.localeCompare(a.fecha)||0)
              .slice(0,25)
              .map(r=>{
                const isPeso = r.tipo==="peso";
                const isParam = r.tipo==="parametros";
                const icon = isParam?"📊":((r.cosechada_infectada||r.cosechada)&&r.peso===0)?"🌿":"⚖️";
                const val  = isParam
                  ?[r.ph&&`pH ${r.ph}`,r.temp&&`${r.temp}°`,r.salinidad&&`${r.salinidad}‰`].filter(Boolean).join(" · ")
                  :r.peso!=null?`${r.peso}g`:"—";
                return (
                  <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",
                    borderBottom:"1px solid rgba(148,163,184,.05)",cursor:"pointer"}}
                    onClick={()=>onNavigate&&onNavigate("sistema",r.sistema)}>
                    <span style={{fontSize:14,flexShrink:0}}>{icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{r.sistema}</span>
                      <span style={{fontSize:11,color:"#475569",marginLeft:6}}>{val}</span>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:10,color:"#64748b"}}>{r.fecha}</div>
                      {r.logged_by&&<div style={{fontSize:9,color:"#475569"}}>{r.logged_by}</div>}
                    </div>
                  </div>
                );
              })
            }
          </div>
        );
      })()}
    </div>
  );
}



function PlanSemanal({ assignedTasks, setAssignedTasks, systems, lang, user }) {
  const days = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const todayDayIndex = new Date().getDay(); // 0=Sun,1=Mon...6=Sat
  const defaultDay = todayDayIndex === 0 ? "Domingo" : days[todayDayIndex - 1];
  const [selectedDay, setDay] = useState(defaultDay);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const canManageTasks = ["admin","consultor","director","farm_manager"].includes(user?.role);
  const iStyle = S.input;
  const lStyle = S.label;
  const today = new Date().toISOString().slice(0,10);

  const emptyForm = { assignedTo:"LA", taskType:"vigilancia", sistema:"", region:"", objetivo:"", date:today, day:selectedDay, notas:"", supportCrew:[] };
  const [form, setForm] = useState(emptyForm);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  const [extraCrew, setExtraCrew] = useState(() => { try { return JSON.parse(localStorage.getItem('aq_extra_crew')||'[]'); } catch { return []; } });
  const [addingCrewFor, setAddingCrewFor] = useState(false);
  const [newCrewForm, setNewCrewForm] = useState({ name:'', initials:'', role:'Buceador' });
  const [newCrewSaving, setNewCrewSaving] = useState(false);
  const allCrewPlan = [...CREW, ...extraCrew.filter(ec=>!CREW.find(c=>c.initials===ec.initials))];

  async function saveNewCrewPlan() {
    if (!newCrewForm.name || !newCrewForm.initials) return;
    setNewCrewSaving(true);
    try {
      const username = newCrewForm.name.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
      const inits = newCrewForm.initials.toUpperCase();
      await sbStatic.from('usuarios').insert([{
        username, password_plain: '1234', role: 'vaquero',
        name: newCrewForm.name, initials: inits,
        created_by: user?.initials, active: true,
      }]);
      const newMember = { initials: inits, name: newCrewForm.name, role: newCrewForm.role, username };
      const updated = [...extraCrew, newMember];
      setExtraCrew(updated);
      try { localStorage.setItem('aq_extra_crew', JSON.stringify(updated)); } catch {}
      F("assignedTo", inits);
      setAddingCrewFor(false);
      setNewCrewForm({ name:'', initials:'', role:'Buceador' });
    } catch(e) { console.error('saveNewCrewPlan failed', e); }
    setNewCrewSaving(false);
  }

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
  const handleEdit = (t) => { setEditTask(t); setForm({assignedTo:t.assignedTo,taskType:t.taskType,sistema:t.sistema||"",region:t.region||"",objetivo:t.objetivo||"",date:t.date,day:t.day,notas:t.notas||"",supportCrew:t.supportCrew||[]}); setShowForm(true); };

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
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const fmt = d => d.toLocaleDateString(lang==="es"?"es-PA":"en-US",{day:"numeric",month:"short"});
            return `${lang==="es"?"Semana del":"Week of"} ${fmt(monday)} – ${fmt(sunday)}`;
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
          <div key={t.id} onClick={()=>setDetailTask(t)} style={{...S.card,borderLeft:`3px solid ${done?"#4ade80":"rgba(148,163,184,.2)"}`,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:24}}>{schema.icon}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?schema.label:schema.labelEn}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{CREW.find(c=>c.initials===t.assignedTo)?.name||t.assignedTo} {sys?`· ${sys.id}`:""}</div>
                  {t.supportCrew?.length>0&&<div style={{fontSize:10,color:"#475569"}}>+ {t.supportCrew.join(", ")}</div>}
                  {t.objetivo&&<div style={{fontSize:10,color:"#475569"}}>{lang==="es"?"Objetivo:":"Target:"} {t.objetivo} {schema.unit}</div>}
                  {t.notas&&<div style={{fontSize:10,color:"#475569",fontStyle:"italic",marginTop:2}}>{t.notas}</div>}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:done?"rgba(74,222,128,.1)":"rgba(148,163,184,.06)",color:done?"#4ade80":"#64748b",fontWeight:600}}>{done?(lang==="es"?"Hecho":"Done"):(lang==="es"?"Pendiente":"Pending")}</span>
                {canManageTasks&&<div style={{display:"flex",gap:6}}>
                  <button onClick={e=>{e.stopPropagation();handleEdit(t);}} style={{padding:"3px 8px",borderRadius:6,border:"none",background:"rgba(13,148,136,.1)",color:"#0d9488",fontSize:10,fontWeight:700,cursor:"pointer"}}>✏️</button>
                  <button onClick={e=>{e.stopPropagation();handleDelete(t.id);}} style={{padding:"3px 8px",borderRadius:6,border:"none",background:"rgba(248,113,113,.1)",color:"#f87171",fontSize:10,fontWeight:700,cursor:"pointer"}}>🗑️</button>
                </div>}
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

      {/* Task detail modal */}
      {detailTask&&(()=>{
        const dt=detailTask;
        const dschema=TASK_SCHEMA[dt.taskType]||{icon:"📋",label:dt.taskType,labelEn:dt.taskType,unit:"",unitEn:""};
        const dsys=systems.find(s=>s.id===dt.sistema);
        const ddone=dt.actual!==null||(dschema.yesno&&dt.condicion!==null);
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setDetailTask(null)}>
            <div style={{width:"100%",maxWidth:480,background:"#0f1724",borderRadius:"22px 22px 0 0",padding:"0 0 40px",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
              <div style={{width:36,height:4,borderRadius:2,background:"rgba(148,163,184,.25)",margin:"14px auto 0"}}/>
              <div style={{padding:"16px 20px 14px",borderBottom:"1px solid rgba(148,163,184,.08)"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:36}}>{dschema.icon}</span>
                  <div style={{flex:1}}>
                    <h3 style={{margin:0,fontSize:17,fontWeight:800,color:"#e2e8f0"}}>{lang==="es"?dschema.label:dschema.labelEn}</h3>
                    <div style={{fontSize:12,color:"#64748b",marginTop:3}}>
                      {CREW.find(c=>c.initials===dt.assignedTo)?.name||dt.assignedTo}
                      {dsys&&` · ${dsys.id}`}
                      {dt.date&&` · ${dt.date}`}
                    </div>
                  </div>
                  <span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:ddone?"rgba(74,222,128,.12)":"rgba(148,163,184,.06)",color:ddone?"#4ade80":"#64748b",fontWeight:700}}>
                    {ddone?(lang==="es"?"✓ Hecho":"✓ Done"):(lang==="es"?"Pendiente":"Pending")}
                  </span>
                </div>
              </div>
              <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>
                {dt.notas&&(
                  <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.2)"}}>
                    <div style={{fontSize:10,color:"#b45309",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>📌 Instrucciones</div>
                    <div style={{fontSize:13,color:"#fbbf24"}}>{dt.notas}</div>
                  </div>
                )}
                {dt.objetivo&&(
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderRadius:9,background:"rgba(255,255,255,.03)"}}>
                    <span style={{fontSize:12,color:"#64748b"}}>{lang==="es"?"Objetivo":"Target"}</span>
                    <span style={{fontSize:14,fontWeight:800,color:"#e2e8f0",fontFamily:"monospace"}}>{dt.objetivo} {lang==="es"?dschema.unit:dschema.unitEn}</span>
                  </div>
                )}
                {dt.supportCrew?.length>0&&(
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderRadius:9,background:"rgba(255,255,255,.03)"}}>
                    <span style={{fontSize:12,color:"#64748b"}}>{lang==="es"?"Apoyo":"Support"}</span>
                    <span style={{fontSize:13,color:"#94a3b8"}}>{dt.supportCrew.join(", ")}</span>
                  </div>
                )}
                {dt.region&&(
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderRadius:9,background:"rgba(255,255,255,.03)"}}>
                    <span style={{fontSize:12,color:"#64748b"}}>{lang==="es"?"Región":"Region"}</span>
                    <span style={{fontSize:13,color:"#94a3b8"}}>{dt.region}</span>
                  </div>
                )}
                {ddone&&(
                  <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.15)"}}>
                    <div style={{fontSize:10,color:"#4ade80",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{lang==="es"?"Registrado":"Logged"}</div>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      {dt.actual!==null&&<span style={{fontSize:18,fontWeight:800,color:"#4ade80",fontFamily:"monospace"}}>{dt.actual} {lang==="es"?dschema.unit:dschema.unitEn}</span>}
                      {dt.condicion&&CONDICION_EMOJIS.find(c=>c.value===dt.condicion)&&<span style={{fontSize:22}}>{CONDICION_EMOJIS.find(c=>c.value===dt.condicion).emoji}</span>}
                      {dt.foto&&<span style={{fontSize:12,color:"#0d9488"}}>📷</span>}
                    </div>
                    {dt.comentarioVaquero&&<div style={{fontSize:12,color:"#2dd4bf",fontStyle:"italic",marginTop:6}}>"{dt.comentarioVaquero}"</div>}
                  </div>
                )}
                {canManageTasks&&(
                  <div style={{display:"flex",gap:10,marginTop:4}}>
                    <button onClick={()=>{setDetailTask(null);handleEdit(dt);}} style={{flex:1,padding:13,borderRadius:11,border:"1px solid rgba(13,148,136,.3)",background:"rgba(13,148,136,.06)",color:"#0d9488",fontWeight:700,fontSize:13,cursor:"pointer"}}>✏️ {lang==="es"?"Editar":"Edit"}</button>
                    <button onClick={()=>{setDetailTask(null);handleDelete(dt.id);}} style={{padding:13,borderRadius:11,border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.06)",color:"#f87171",fontWeight:700,fontSize:13,cursor:"pointer"}}>🗑️</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Assign task modal */}
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowForm(false)}>
          <div style={{width:"100%",maxWidth:480,background:"#0f1724",borderRadius:"20px 20px 0 0",padding:"20px 20px 36px",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:"rgba(148,163,184,.2)",margin:"0 auto 16px"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{color:"#e2e8f0",fontSize:16,fontWeight:800,margin:0}}>{editTask?(lang==="es"?"Editar Tarea":"Edit Task"):(lang==="es"?"Asignar Tarea":"Assign Task")}</h3>
              <button onClick={()=>{setShowForm(false);setEditTask(null);setForm({...emptyForm,day:selectedDay});setAddingCrewFor(false);}} style={{background:"none",border:"none",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",padding:"4px 8px",borderRadius:6}}>✕ {lang==="es"?"Cancelar":"Cancel"}</button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={lStyle}>{lang==="es"?"Persona":"Person"}</label>
                <select value={addingCrewFor?'__new__':form.assignedTo}
                  onChange={e=>{if(e.target.value==='__new__'){setAddingCrewFor(true);setNewCrewForm({name:'',initials:'',role:'Buceador'});}else{F("assignedTo",e.target.value);setAddingCrewFor(false);}}}
                  style={{...iStyle,appearance:"none"}}>
                  {allCrewPlan.map(c=><option key={c.initials} value={c.initials}>{c.initials} – {c.name.split(" ")[0]}</option>)}
                  <option value="__new__">+ Nuevo</option>
                </select>
                {addingCrewFor && (
                  <div style={{marginTop:8,background:"rgba(139,92,246,.06)",border:"1px solid rgba(139,92,246,.2)",borderRadius:8,padding:10}}>
                    <div style={{fontSize:10,color:"#a78bfa",fontWeight:700,marginBottom:8}}>{lang==="es"?"Nuevo integrante":"New hire"}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 70px",gap:6,marginBottom:6}}>
                      <input placeholder={lang==="es"?"Nombre completo":"Full name"} value={newCrewForm.name} onChange={e=>setNewCrewForm(p=>({...p,name:e.target.value}))} style={{...iStyle,fontSize:11}}/>
                      <input placeholder="Iniciales" maxLength={4} value={newCrewForm.initials} onChange={e=>setNewCrewForm(p=>({...p,initials:e.target.value.toUpperCase()}))} style={{...iStyle,fontSize:11}}/>
                    </div>
                    <select value={newCrewForm.role} onChange={e=>setNewCrewForm(p=>({...p,role:e.target.value}))} style={{...iStyle,appearance:"none",fontSize:11,marginBottom:6}}>
                      <option value="Buceador">Buceador</option>
                      <option value="Capitán">Capitán</option>
                    </select>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={saveNewCrewPlan} disabled={!newCrewForm.name||!newCrewForm.initials||newCrewSaving}
                        style={{fontSize:10,padding:"3px 10px",borderRadius:6,border:"none",background:"#8b5cf6",color:"#fff",fontWeight:700,cursor:"pointer",opacity:(!newCrewForm.name||!newCrewForm.initials||newCrewSaving)?.5:1}}>
                        {newCrewSaving?(lang==="es"?"Guardando…":"Saving…"):(lang==="es"?"Guardar":"Save")}
                      </button>
                      <button onClick={()=>{setAddingCrewFor(false);setNewCrewForm({name:'',initials:'',role:'Buceador'});}} style={{fontSize:10,padding:"3px 8px",borderRadius:6,border:"1px solid rgba(100,116,139,.3)",background:"none",color:"#64748b",cursor:"pointer"}}>{lang==="es"?"Cancelar":"Cancel"}</button>
                    </div>
                  </div>
                )}
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

            {/* Region + System filters */}
            {(() => {
              const activeSystems = systems.filter(s => s.estado === "Activo");
              const activeRegions = [...new Set(activeSystems.map(s => s.region))].sort();
              const filteredSystems = form.region ? activeSystems.filter(s => s.region === form.region) : activeSystems;
              return (
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div>
                      <label style={lStyle}>{lang==="es"?"Región (opcional)":"Region (optional)"}</label>
                      <select value={form.region} onChange={e=>{F("region",e.target.value);F("sistema","");}} style={{...iStyle,appearance:"none"}}>
                        <option value="">– {lang==="es"?"todas":"all"}</option>
                        {activeRegions.map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lStyle}>{lang==="es"?"Sistema (opcional)":"System (optional)"}</label>
                      <select value={form.sistema} onChange={e=>F("sistema",e.target.value)} style={{...iStyle,appearance:"none"}}>
                        <option value="">– {lang==="es"?"ninguno":"none"}</option>
                        {filteredSystems.map(s=><option key={s.id} value={s.id}>{s.id} – {s.pueblo}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={lStyle}>{lang==="es"?"Objetivo":"Target"} ({TASK_SCHEMA[form.taskType]?.[lang==="es"?"unit":"unitEn"]||""})</label>
                    <input type="number" value={form.objetivo} onChange={e=>F("objetivo",e.target.value)} placeholder="0" style={iStyle}/>
                  </div>
                </>
              );
            })()}

            <div style={{marginBottom:12}}>
              <label style={lStyle}>{lang==="es"?"Instrucciones / Notas":"Instructions / Notes"}</label>
              <textarea value={form.notas||""} onChange={e=>F("notas",e.target.value)} rows={2}
                style={{...iStyle,resize:"none"}}
                placeholder={lang==="es"?"ej. Mover sistema hacia coordenadas X, revisar aceite...":"e.g. Relocate system to coordinates X, check oil..."}/>
            </div>

            <div style={{marginBottom:12}}>
              <label style={lStyle}>{lang==="es"?"Equipo de apoyo":"Support crew"}</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {CREW.filter(c=>c.initials!==form.assignedTo&&c.role!=="Supervisor").map(c=>{
                  const sel=(form.supportCrew||[]).includes(c.initials);
                  return (
                    <button key={c.initials} onClick={()=>{
                      const crew=form.supportCrew||[];
                      F("supportCrew",sel?crew.filter(x=>x!==c.initials):[...crew,c.initials]);
                    }} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${sel?"#0d9488":"rgba(148,163,184,.15)"}`,
                      background:sel?"rgba(13,148,136,.15)":"transparent",
                      color:sel?"#0d9488":"#64748b",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                      {c.initials}
                    </button>
                  );
                })}
              </div>
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
  weeklyIncidents, timecards, setTimecards, lang, canEdit, user, navigateTo=()=>{}, crew=CREW }) {

  const member   = crew.find(c => c.initials === initials);
  const today    = new Date().toISOString().slice(0,10);
  const todayName= ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date().getDay()];

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const [taskFilter, setTaskFilter] = useState('week');

  // Current week Mon–Sat dates
  const weekDates = (() => {
    const d = new Date(); const day = d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7));
    return Array.from({ length: 6 }, (_, i) => {
      const x = new Date(mon); x.setDate(mon.getDate() + i);
      return x.toISOString().slice(0, 10);
    });
  })();
  const weekDayNames = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

  const leadTasks    = assignedTasks.filter(t => t.assignedTo === initials);
  const supportTasks = assignedTasks.filter(t =>
    t.assignedTo !== initials && (t.supportCrew || []).includes(initials)
  );
  const allMyTasks = [
    ...leadTasks.map(t => ({ ...t, _role: 'lead' })),
    ...supportTasks.map(t => ({ ...t, _role: 'apoyo' })),
  ];

  const filteredTasks = (taskFilter === 'week'
    ? allMyTasks.filter(t => weekDates.includes(t.date))
    : allMyTasks
  ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const done = leadTasks.filter(t => t.actual !== null || (TASK_SCHEMA[t.taskType]?.yesno && t.condicion !== null)).length;
  const pct  = leadTasks.length ? Math.round((done/leadTasks.length)*100) : 0;

  // ── Systems ────────────────────────────────────────────────────────────────
  // Include systems where this person is buceador/capitan OR appeared as support_crew on a task
  const supportSystemIds = new Set(
    assignedTasks
      .filter(t => (t.supportCrew || []).includes(initials))
      .map(t => t.sistema)
      .filter(Boolean)
  );
  const mySystems = systems.filter(s =>
    (getCapitan(s) === initials || hasBuceador(s, initials) || supportSystemIds.has(s.id)) && s.estado === "Activo"
  );

  // Per-system growth
  const sysWithRate = mySystems.map(s => {
    const sysReadings = readings.filter(r=>r.sistema===s.id && r.peso).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
    const latest = sysReadings[sysReadings.length-1]||null;
    const prev   = sysReadings[sysReadings.length-2]||null;
    let rate = null;
    if (latest && prev) {
      const days = Math.max(1,(new Date(latest.fecha+'T12:00:00')-new Date(prev.fecha+'T12:00:00'))/(1000*60*60*24));
      const adjNow  = (latest.peso||0) + (latest.sueltos||0);
      const adjPrev = (prev.peso||0) + (prev.sueltos||0) - (prev.cosechada||0);
      if (adjNow > 0 && adjPrev > 0) {
        rate = parseFloat(((Math.log(adjNow/adjPrev)/days)*100).toFixed(2));
      }
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
            <div style={{fontSize:10,color:"#64748b"}}>{done}/{leadTasks.length} {lang==="es"?"tareas":"tasks"}</div>
          </div>
        </div>
        {S.scoreBar(pct/100, pct===100?"#4ade80":pct>=70?"#fb923c":"#f87171")}
      </div>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[
          { label:lang==="es"?"Crecimiento":"Growth Rate", value:avgRate!==null?`${parseFloat(avgRate)>=0?"+":""}${avgRate}%`:"—", color:rateCol },
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

      {/* ── TASKS ───────────────────────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,
          textTransform:"uppercase",letterSpacing:1}}>
          {lang==="es"?"Tareas":"Tasks"} — {filteredTasks.length}
        </div>
        <div style={{display:"flex",gap:4}}>
          {['week','all'].map(f=>(
            <button key={f} onClick={()=>setTaskFilter(f)}
              style={{fontSize:11,padding:"3px 10px",borderRadius:8,border:"none",cursor:"pointer",
                fontWeight:700,
                background:taskFilter===f?"#0d9488":"rgba(255,255,255,0.06)",
                color:taskFilter===f?"#fff":"#64748b"}}>
              {f==='week'?(lang==="es"?"Esta semana":"This week"):(lang==="es"?"Todas":"All")}
            </button>
          ))}
        </div>
      </div>
      {filteredTasks.length===0 ? (
        <div style={{...S.card,textAlign:"center",padding:20,marginBottom:14}}>
          <p style={{color:"#475569",fontSize:12,margin:0}}>
            {lang==="es"?"Sin tareas esta semana":"No tasks this week"}
          </p>
        </div>
      ) : (
        <div style={{marginBottom:14}}>
          {filteredTasks.map(t=>(
            <div key={t.id+t._role} style={{position:"relative"}}>
              <TaskLogCard task={t} systems={systems} lang={lang}
                onComplete={()=>{}} canEdit={false}/>
              <span style={{position:"absolute",top:10,right:10,
                fontSize:9,padding:"2px 7px",borderRadius:6,fontWeight:700,
                background:t._role==='lead'?"rgba(13,148,136,0.2)":"rgba(251,146,60,0.2)",
                color:t._role==='lead'?"#0d9488":"#fb923c"}}>
                {t._role==='lead'?"Lead":"Apoyo"}
              </span>
            </div>
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
              <div key={s.id} style={{...S.card,borderLeft:`3px solid ${rc}`,cursor:"pointer"}}
                onClick={()=>{ onBack(); navigateTo("sistema", s.id); }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:"#e2e8f0"}}>{s.id}</div>
                    <div style={{fontSize:11,color:"#64748b"}}>{s.pueblo||s.region}</div>
                    <div style={{display:"flex",gap:4,marginTop:3}}>
                      {s.categoria&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,
                        background:s.categoria==="comercial"?"rgba(13,148,136,.15)":"rgba(74,222,128,.15)",
                        color:s.categoria==="comercial"?"#0d9488":"#4ade80",fontWeight:700}}>
                        {s.categoria}</span>}
                      {getCapitan(s)===initials&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,
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
  RBC: { regions:["Bahía Azul","Playa Verde"],  color:"#0d9488", note:"Bahía Azul · Playa Verde (Polígonos 3-5)" },
  CE:  { regions:["Playa Roja","Tobobe","Isla Tiburón"], color:"#f87171", note:"Tobobe · Playa Roja · Isla Tiburón" },
  LA:  { regions:["Cayo de Agua"],              color:"#4ade80", note:"Cayo de Agua" },
  JV:  { regions:["Isla Tigre"],                color:"#64748b", note:"Isla Tigre" },
};

// Derive captain initials from a system's region — single source of truth
function getCapitan(system) {
  if (system.capitan) return system.capitan;
  for (const [initials, info] of Object.entries(CAPITAN_REGIONS)) {
    if (info.regions.some(r => r.toLowerCase() === (system.region||'').toLowerCase())) return initials;
  }
  return '';
}
function getBuceadores(sys) {
  if (!sys?.buceador) return [];
  return sys.buceador.split(',').map(s => s.trim()).filter(Boolean);
}
function hasBuceador(sys, initials) {
  return getBuceadores(sys).includes(initials);
}

function EquipoTab({ assignedTasks, weeklyIncidents, setWeeklyIncidents, timecards, setTimecards, systems, readings, lang, user, navigateTo=()=>{}, selectedPerson=null, setSelectedPerson=()=>{} }) {

  const canManage = ["admin","consultor","director","farm_manager","supervisor"].includes(user?.role);

  // Dynamic users from Supabase usuarios table
  const [dynamicUsers, setDynamicUsers]   = useState([]);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [addSaving, setAddSaving]         = useState(false);
  const [addError, setAddError]           = useState('');
  const [addForm, setAddForm]             = useState({ name:'', initials:'', username:'', password:'1234', role:'vaquero' });
  const [taskFilter, setTaskFilter]       = useState('week');
  const [promotingId, setPromotingId]     = useState(null); // initials of person being promoted
  const [promoteRole, setPromoteRole]     = useState('');

  useEffect(() => { loadDynamicUsers(); }, []);

  async function loadDynamicUsers() {
    try {
      const { data } = await sbStatic.from('usuarios').select('*').eq('active', true).order('created_at');
      setDynamicUsers(data || []);
    } catch {}
  }

  function autoFill(name) {
    const clean = s => s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
    const words = name.trim().split(/\s+/);
    const first = words[0] || '';
    const last  = words[1] || '';
    const initials = ((first[0]||'') + (last[0]||'')).toUpperCase();
    const username = last ? `${clean(first)}_${clean(last)}` : clean(first);
    setAddForm(p=>({ ...p, name, initials, username }));
  }

  async function createUser() {
    const { name, initials, username, password, role } = addForm;
    if (!name||!initials||!username||!password) { setAddError('Todos los campos son requeridos'); return; }
    setAddSaving(true); setAddError('');
    try {
      const { error } = await sbStatic.from('usuarios').insert([{
        username, password_plain: password, role,
        name, initials: initials.toUpperCase(),
        created_by: user?.initials, active: true,
      }]);
      if (error) throw error;
      // Sync to localStorage so SistemasTab assignment dropdowns see them immediately
      try {
        const ec = JSON.parse(localStorage.getItem('aq_extra_crew')||'[]');
        if (!ec.find(c=>c.initials===initials.toUpperCase())) {
          ec.push({ initials:initials.toUpperCase(), name, role: role==='capitan'?'Capitán':'Buceador', username });
          localStorage.setItem('aq_extra_crew', JSON.stringify(ec));
        }
      } catch {}
      await loadDynamicUsers();
      setAddForm({ name:'', initials:'', username:'', password:'1234', role:'vaquero' });
      setShowAddForm(false);
    } catch(e) { setAddError(e.message||'Error al crear usuario'); }
    setAddSaving(false);
  }

  async function promoteUser(initials, newRole) {
    try {
      await sbStatic.from('usuarios').update({ role: newRole }).eq('initials', initials);
      setDynamicUsers(prev => prev.map(u => u.initials===initials ? {...u, role:newRole} : u));
      setPromotingId(null);
    } catch {}
  }

  // Merge static CREW + dynamic users (dedupe by initials)
  const staticInits = new Set(CREW.map(c=>c.initials));
  const allCrew = [...CREW, ...dynamicUsers.filter(u=>!staticInits.has(u.initials))];

  const ROLE_BADGE = { admin:'rgba(245,158,11,.15)', consultor:'rgba(139,92,246,.15)', director:'rgba(13,148,136,.15)', farm_manager:'rgba(20,184,166,.15)', supervisor:'rgba(20,184,166,.15)', capitan:'rgba(74,222,128,.15)', vaquero:'rgba(148,163,184,.1)' };
  const ROLE_COLOR = { admin:'#f59e0b', consultor:'#a78bfa', director:'#0d9488', farm_manager:'#14b8a6', supervisor:'#14b8a6', capitan:'#4ade80', vaquero:'#94a3b8' };
  const ROLE_LABEL = { admin:'Admin', consultor:'Consultor', director:'Director', farm_manager:'Farm Manager', supervisor:'Supervisor', capitan:'Capitán', vaquero:'Vaquero' };

  const person = selectedPerson
    ? (CREW.find(c=>c.initials===selectedPerson) || dynamicUsers.find(u=>u.initials===selectedPerson) || null)
    : null;
  const personDynamic = selectedPerson ? dynamicUsers.find(u=>u.initials===selectedPerson) : null;

  if (person) {
    const supportSysIds = new Set(
      assignedTasks.filter(t=>(t.supportCrew||[]).includes(person.initials)).map(t=>t.sistema).filter(Boolean)
    );
    const mySystems = systems.filter(s =>
      (getCapitan(s) === person.initials || hasBuceador(s, person.initials) || supportSysIds.has(s.id)) && s.estado === "Activo"
    );
    const sysWithRate = mySystems.map(s => {
      // Credit only readings logged by this person — coverage/absence tracked here
      const sysR = readings.filter(r=>r.sistema===s.id && r.tipo==="peso" && r.peso && (r.logged_by===person.initials||!r.logged_by)).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
      const allSysR = readings.filter(r=>r.sistema===s.id && r.tipo==="peso" && r.peso).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
      const latest = sysR[sysR.length-1]||null;
      const prev = sysR[sysR.length-2]||null;
      const daysMissed = allSysR.filter(r=>r.logged_by && r.logged_by!==person.initials).length;
      let rate = null;
      if (latest && prev && prev.peso) {
        const days = Math.max(1,(new Date(latest.fecha)-new Date(prev.fecha))/(1000*60*60*24));
        rate = parseFloat(((Math.log(latest.peso/prev.peso)/days)*100).toFixed(2));
      }
      return { ...s, latest, rate, daysMissed };
    });
    const rates = sysWithRate.map(s=>s.rate).filter(r=>r!==null);
    const avgRate = rates.length ? (rates.reduce((a,b)=>a+b,0)/rates.length).toFixed(2) : null;
    const rateCol = avgRate===null?"#475569":parseFloat(avgRate)>=2.5?"#4ade80":parseFloat(avgRate)>=0?"#0d9488":"#f87171";
    const totalBio = sysWithRate.reduce((sum,s) => sum + (s.latest?.peso||0), 0);

    return (
      <div style={{padding:"16px 16px 100px"}}>
        <button onClick={()=>setSelectedPerson(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#0d9488",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:14,padding:0}}>
          ← {lang==="es"?"Equipo":"Team"}
        </button>
        <div style={{...S.card,background:"linear-gradient(135deg,rgba(13,148,136,.08),rgba(2,8,24,.5))",textAlign:"center",padding:20,marginBottom:12}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(13,148,136,.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}><span style={{fontSize:16,fontWeight:800,color:"#0d9488"}}>{person.initials}</span></div>
          <h2 style={{color:"#e2e8f0",fontSize:17,fontWeight:800,margin:"0 0 2px"}}>{person.name}</h2>
          <span style={{fontSize:11,color:"#64748b"}}>{person.role}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          <div style={S.card}><div style={{fontSize:9,color:"#64748b"}}>Sistemas</div><div style={{fontSize:18,fontWeight:800,color:"#e2e8f0"}}>{mySystems.length}</div></div>
          <div style={S.card}><div style={{fontSize:9,color:"#64748b"}}>Crecimiento</div><div style={{fontSize:18,fontWeight:800,color:rateCol,fontFamily:"monospace"}}>{avgRate ? `${parseFloat(avgRate)>=0?"+":""}${avgRate}%` : "—"}</div></div>
          <div style={S.card}><div style={{fontSize:9,color:"#64748b"}}>Biomasa</div><div style={{fontSize:18,fontWeight:800,color:"#e2e8f0"}}>{(totalBio/1000).toFixed(1)}kg</div></div>
        </div>
        {/* Role & Access card — only for dynamic users when canManage */}
        {canManage && personDynamic && (
          <div style={{...S.card,marginBottom:12}}>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Rol y acceso</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700,background:ROLE_BADGE[personDynamic.role]||ROLE_BADGE.vaquero,color:ROLE_COLOR[personDynamic.role]||ROLE_COLOR.vaquero}}>
                {ROLE_LABEL[personDynamic.role]||personDynamic.role}
              </span>
              {promotingId===personDynamic.initials ? (
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {['vaquero','capitan','director','farm_manager','supervisor'].filter(r=>r!==personDynamic.role).map(r=>(
                    <button key={r} onClick={()=>promoteUser(personDynamic.initials, r)}
                      style={{padding:"4px 12px",borderRadius:20,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",background:ROLE_BADGE[r],color:ROLE_COLOR[r]}}>
                      → {ROLE_LABEL[r]}
                    </button>
                  ))}
                  <button onClick={()=>setPromotingId(null)} style={{padding:"4px 10px",borderRadius:20,border:"1px solid rgba(100,116,139,.3)",background:"none",color:"#64748b",fontSize:11,cursor:"pointer"}}>Cancelar</button>
                </div>
              ) : (
                <button onClick={()=>setPromotingId(personDynamic.initials)}
                  style={{padding:"4px 12px",borderRadius:20,border:"1px solid rgba(13,148,136,.4)",background:"none",color:"#0d9488",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  Cambiar rol
                </button>
              )}
            </div>
            <div style={{marginTop:8,fontSize:11,color:"#475569"}}>Usuario: <span style={{fontFamily:"monospace",color:"#94a3b8"}}>{personDynamic.username}</span></div>
          </div>
        )}
        {sysWithRate.length > 0 && (
          <>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:1}}>
              {lang==="es"?"Sistemas a cargo":"Responsible systems"} — {sysWithRate.length}
            </div>
            {sysWithRate.map(s=>{
              const rc = s.rate===null?"#475569":s.rate>=2.5?"#4ade80":s.rate>=1?"#fb923c":"#f87171";
              return (
                <div key={s.id} style={{...S.card,borderLeft:`3px solid ${rc}`,cursor:"pointer"}}
                  onClick={()=>navigateTo("sistema", s.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:800,color:"#e2e8f0"}}>{s.id}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{s.region} · {s.tipo}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:16,fontWeight:800,color:rc,fontFamily:"monospace"}}>
                        {s.rate!==null?`${s.rate>=0?"+":""}${s.rate}%`:"—"}
                      </div>
                      <div style={{fontSize:10,color:"#64748b"}}>/día</div>
                      {s.latest&&<div style={{fontSize:10,color:"#475569",marginTop:2}}>{(s.latest.peso/1000).toFixed(2)}kg</div>}
                      {s.daysMissed>0&&<div style={{fontSize:9,color:"#f87171",marginTop:2}}>{s.daysMissed} {lang==="es"?"día(s) sin crédito":"day(s) no credit"}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── Tasks ─────────────────────────────────────────────────────────── */}
        {(()=>{
          const weekDayNames = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
          const d = new Date(); const day = d.getDay();
          const mon = new Date(d); mon.setDate(d.getDate()-((day+6)%7));
          const weekDates = Array.from({length:6},(_,i)=>{ const x=new Date(mon); x.setDate(mon.getDate()+i); return x.toISOString().slice(0,10); });
          const leadTasks    = assignedTasks.filter(t=>t.assignedTo===person.initials);
          const supportTasks = assignedTasks.filter(t=>t.assignedTo!==person.initials&&(t.supportCrew||[]).includes(person.initials));
          const allTasks = [...leadTasks.map(t=>({...t,_role:'lead'})),...supportTasks.map(t=>({...t,_role:'apoyo'}))];
          if (!allTasks.length) return null;
          const filtered = (taskFilter==='week'
            ? allTasks.filter(t=>weekDates.includes(t.date))
            : allTasks
          ).sort((a,b) => (b.date||'').localeCompare(a.date||''));
          return (
            <div style={{marginTop:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
                  Tareas — {filtered.length}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {['week','all'].map(f=>(
                    <button key={f} onClick={()=>setTaskFilter(f)}
                      style={{fontSize:11,padding:"3px 10px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,
                        background:taskFilter===f?"#0d9488":"rgba(255,255,255,0.06)",
                        color:taskFilter===f?"#fff":"#64748b"}}>
                      {f==='week'?"Esta semana":"Todas"}
                    </button>
                  ))}
                </div>
              </div>
              {filtered.length===0 && (
                <div style={{...S.card,textAlign:"center",padding:16,color:"#475569",fontSize:12}}>
                  Sin tareas esta semana
                </div>
              )}
              {filtered.map(t=>{
                const schema = TASK_SCHEMA[t.taskType]||{icon:"📋",label:t.taskType};
                const isDone = t.actual!==null||(schema.yesno&&t.condicion!==null);
                return (
                  <div key={t.id+t._role} style={{...S.card,marginBottom:6,borderLeft:`3px solid ${isDone?"#4ade80":t._role==='lead'?"#0d9488":"#fb923c"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                        <span style={{fontSize:18,flexShrink:0}}>{schema.icon}</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?schema.label:schema.labelEn||schema.label}</div>
                          <div style={{fontSize:11,color:"#64748b"}}>{t.date||t.day||""}{t.sistema?` · ${t.sistema}`:""}</div>
                          {t.objetivo&&<div style={{fontSize:10,color:"#475569"}}>Objetivo: {t.objetivo} {schema.unit}</div>}
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                        <span style={{fontSize:9,padding:"2px 7px",borderRadius:6,fontWeight:700,
                          background:isDone?"rgba(74,222,128,.15)":"rgba(148,163,184,.08)",
                          color:isDone?"#4ade80":"#64748b"}}>
                          {isDone?"✓ Hecho":"Pendiente"}
                        </span>
                        <span style={{fontSize:9,padding:"1px 5px",borderRadius:5,fontWeight:700,
                          background:t._role==='lead'?"rgba(13,148,136,0.15)":"rgba(251,146,60,0.15)",
                          color:t._role==='lead'?"#0d9488":"#fb923c"}}>
                          {t._role==='lead'?"Lead":"Apoyo"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  }

  // Team list view
  return (
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={{color:"#e2e8f0",fontSize:16,fontWeight:800,margin:0}}>{lang==="es"?"Equipo":"Team"} <span style={{color:"#475569",fontWeight:400,fontSize:13}}>({allCrew.length})</span></h2>
        {canManage && (
          <button onClick={()=>{ setShowAddForm(f=>!f); setAddError(''); setAddForm({name:'',initials:'',username:'',password:'1234',role:'vaquero'}); }}
            style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:"1px solid rgba(13,148,136,.5)",background:"rgba(13,148,136,.08)",color:"#0d9488",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            <Icon name="plus" size={13}/> Nuevo
          </button>
        )}
      </div>

      {/* Add user form */}
      {showAddForm && canManage && (
        <div style={{...S.card,marginBottom:14,border:"1px solid rgba(13,148,136,.3)",background:"rgba(13,148,136,.04)"}}>
          <div style={{fontSize:11,color:"#0d9488",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Nuevo trabajador</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <input
              placeholder="Nombre completo"
              value={addForm.name}
              onChange={e=>autoFill(e.target.value)}
              style={{...AUTH_ISTYLE,fontSize:13,padding:"8px 12px"}}
            />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <input
                placeholder="Iniciales (ej: RV)"
                value={addForm.initials}
                maxLength={4}
                onChange={e=>setAddForm(p=>({...p,initials:e.target.value.toUpperCase()}))}
                style={{...AUTH_ISTYLE,fontSize:13,padding:"8px 12px",fontFamily:"monospace"}}
              />
              <input
                placeholder="Usuario"
                value={addForm.username}
                onChange={e=>setAddForm(p=>({...p,username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')}))}
                style={{...AUTH_ISTYLE,fontSize:13,padding:"8px 12px",fontFamily:"monospace"}}
              />
            </div>
            <input
              placeholder="Contraseña inicial"
              type="text"
              value={addForm.password}
              onChange={e=>setAddForm(p=>({...p,password:e.target.value}))}
              style={{...AUTH_ISTYLE,fontSize:13,padding:"8px 12px"}}
            />
            <select
              value={addForm.role}
              onChange={e=>setAddForm(p=>({...p,role:e.target.value}))}
              style={{...AUTH_ISTYLE,fontSize:13,padding:"8px 12px",cursor:"pointer",width:"100%"}}>
              <option value="vaquero">Buceador</option>
              <option value="capitan">Capitán</option>
              <option value="director">Director</option>
              <option value="supervisor">Supervisor</option>
            </select>
            {addError && <div style={{fontSize:11,color:"#f87171"}}>{addError}</div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={createUser} disabled={addSaving}
                style={{flex:1,padding:"9px",borderRadius:12,border:"none",background:"#0d9488",color:"#fff",fontSize:13,fontWeight:700,cursor:addSaving?"wait":"pointer",opacity:addSaving?.6:1}}>
                {addSaving?"Guardando…":"Crear cuenta"}
              </button>
              <button onClick={()=>setShowAddForm(false)}
                style={{padding:"9px 14px",borderRadius:12,border:"1px solid rgba(100,116,139,.3)",background:"none",color:"#64748b",fontSize:13,cursor:"pointer"}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {allCrew.map(c=>{
        const isDynamic = !staticInits.has(c.initials);
        const dynUser = dynamicUsers.find(u=>u.initials===c.initials);
        const roleKey = dynUser?.role || (c.role==='Capitán'?'capitan':c.role==='Supervisor'?'director':null);
        const mySys = systems.filter(s=>(getCapitan(s)===c.initials||hasBuceador(s,c.initials))&&s.estado==="Activo");
        const sysR = mySys.flatMap(s => {
          const rs = readings.filter(r=>r.sistema===s.id && r.tipo==="peso" && r.peso).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
          const lat = rs[rs.length-1], prev = rs[rs.length-2];
          if (lat && prev && prev.peso) {
            const days = Math.max(1,(new Date(lat.fecha)-new Date(prev.fecha))/(1000*60*60*24));
            return [parseFloat(((Math.log(lat.peso/prev.peso)/days)*100).toFixed(2))];
          }
          return [];
        });
        const avgRate = sysR.length ? (sysR.reduce((a,b)=>a+b,0)/sysR.length).toFixed(2) : null;
        const rc = avgRate===null?"#475569":parseFloat(avgRate)>=2.5?"#4ade80":parseFloat(avgRate)>=0?"#0d9488":"#f87171";
        const regions = [...new Set(mySys.map(s=>s.region))];
        return (
          <div key={c.initials} style={{...S.card,cursor:"pointer",borderLeft:`3px solid ${rc}`}}
            onClick={()=>setSelectedPerson(c.initials)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:10,background:`${rc}15`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,fontWeight:800,color:rc}}>{c.initials}</span></div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{c.name}</span>
                    {roleKey && <span style={{fontSize:9,padding:"1px 6px",borderRadius:10,background:ROLE_BADGE[roleKey]||ROLE_BADGE.vaquero,color:ROLE_COLOR[roleKey]||ROLE_COLOR.vaquero,fontWeight:700}}>{ROLE_LABEL[roleKey]||roleKey}</span>}
                    {isDynamic && <span style={{fontSize:9,padding:"1px 6px",borderRadius:10,background:"rgba(139,92,246,.12)",color:"#a78bfa",fontWeight:600}}>nuevo</span>}
                  </div>
                  <div style={{fontSize:10,color:"#64748b"}}>{mySys.length} sistemas · {regions.join(", ") || "–"}</div>
                  {mySys.length > 0 && <div style={{fontSize:9,color:"#475569",marginTop:2}}>{mySys.map(s=>s.id).slice(0,5).join(", ")}{mySys.length>5?"...":""}</div>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:800,color:rc,fontFamily:"monospace"}}>{avgRate ? `${parseFloat(avgRate)>=0?"+":""}${avgRate}%` : "—"}</div>
                <span style={{fontSize:10,color:"#475569"}}>→</span>
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
  retiredRegions=[],
  tipos=DEFAULT_TIPOS, setTipos=()=>{},
  materiales=DEFAULT_MATERIALES, setMateriales=()=>{},
  semillas=DEFAULT_SEMILLAS, setSemillas=()=>{},
  onChartUpload=null, addToast=()=>{}, deepLinkSystem=null, setDeepLinkSystem=()=>{}, navigateTo=()=>{} }) {
  const canAddSystem        = ["admin","consultor","director","capitan"].includes(user.role);
  const canEditSystemDetails = ["admin","consultor","director","farm_manager","supervisor"].includes(user.role);
  const [filterRegion, setFilterRegion] = useState("all");
  const [sysSearch, setSysSearch]     = useState("");
  const [sysSort, setSysSort]         = useState("region"); // region | biomass | tdc | name
  const [sysSortDir, setSysSortDir]   = useState("desc");
  const [selected, setSelected] = useState(null);

  // Deep link: if App passes a system ID, auto-select it
  useEffect(() => {
    if (deepLinkSystem && systems.some(s => s.id === deepLinkSystem)) {
      setSelected(deepLinkSystem);
      setDeepLinkSystem(null);
    }
  }, [deepLinkSystem, systems, setDeepLinkSystem]);

  const [showForm, setShowForm] = useState(false);
  const [editSys, setEditSys] = useState(null);
  const [archivedOpen, setArchivedOpen]         = useState(false);
  const [retiredOpen,  setRetiredOpen]          = useState(false);
  const [showReadingForm, setShowReadingForm]   = useState(false);
  const [showGrowthChart, setShowGrowthChart]   = useState(null); // sistemaId or null
  const [editingTeam, setEditingTeam]           = useState(null); // sistemaId or null
  const [teamForm, setTeamForm]                 = useState({capitan:'', buceadores:[]});
  const [extraCrew, setExtraCrew]               = useState(() => { try { return JSON.parse(localStorage.getItem('aq_extra_crew')||'[]'); } catch { return []; } });
  const [addingHire, setAddingHire]             = useState(false);
  const [hireForm, setHireForm]                 = useState({name:'', initials:'', role:'Buceador'});
  const [addingCrewFor, setAddingCrewFor]       = useState(null); // 'capitan' | 'buceador' | null
  const [newCrewForm, setNewCrewForm]           = useState({ name:'', initials:'', role:'Buceador' });
  const [newCrewSaving, setNewCrewSaving]       = useState(false);
  const [readingForm, setReadingForm] = useState({
    fecha:          new Date().toISOString().slice(0,10),
    tipo:           "peso",
    peso:           "",
    sueltos:        "",
    buoys:          Array(15).fill(""),
    module_weights: Array(15).fill(""),
    salt:           "",
    ph:             "",
    temp:           "",
    salinidad:      "",
    notas:          "",
    foto:           null,
    cosechada:      "",
    sembrado:       "",
    aguas:          "",
    condiciones:    "",
  });
  const [editingReadingId, setEditingReadingId] = useState(null);
  const [editReadingForm, setEditReadingForm] = useState({
    fecha:"", tipo:"peso", peso:"", sueltos:"", buoys:Array(15).fill(""),
    salt:"", ph:"", temp:"", salinidad:"", notas:"",
    cosechada:"", aguas:"", condiciones:"", foto:null,
  });
  const regionColor = {"Bahía Azul":"#0d9488","Cayo de Agua":"#4ade80","Playa Roja":"#f87171","Isla de Tigre":"#fb923c"};

  const canEditReadings = ["admin","consultor","director","farm_manager","supervisor","capitan"].includes(user.role);
  const canUpload = ["admin","consultor","director"].includes(user.role) && onChartUpload;
  const [editingViaModal, setEditingViaModal] = useState(null);
  const [deletingViaModal, setDeletingViaModal] = useState(null);

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

  // TDC = (ln(adjNow / adjPrev) / days) * 100 — adjusted for harvest and seeding
  // r1 = previous reading, r2 = current reading (or their individual components)
  const calcTDC = (peso1, fecha1, peso2, fecha2, cosechada1 = 0, sembrado2 = 0, sueltos1 = 0, sueltos2 = 0) => {
    const adj1 = (peso1 || 0) + (sueltos1 || 0) - (cosechada1 || 0);
    const adj2 = (peso2 || 0) + (sueltos2 || 0) - (sembrado2  || 0);
    if (!adj1 || !adj2 || adj1 <= 0 || adj2 <= 0 || !fecha1 || !fecha2) return null;
    const days = (new Date(fecha2) - new Date(fecha1)) / (1000 * 60 * 60 * 24);
    if (days <= 0) return null;
    return parseFloat(((Math.log(adj2 / adj1) / days) * 100).toFixed(4));
  };

  // Recalculate TDC for all readings of a system after any edit
  const recalcAllTDC = (allReadings, sistemaId) => {
    const sorted = allReadings
      .filter(r => r.sistema === sistemaId)
      .sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
    const updated = sorted.map((r, i) => {
      const prev = sorted[i-1] || null;
      const tdc = prev ? calcTDC(prev.peso, prev.fecha, r.peso, r.fecha, prev.cosechada, r.sembrado, prev.sueltos || 0, r.sueltos || 0) : null;
      return { ...r, tdc };
    });
    return allReadings.map(r => {
      const u = updated.find(x => x.id === r.id);
      return u || r;
    });
  };

  const handleAddReading = (sistemaId) => {
    const isPeso = readingForm.tipo === "peso";
    const thisSystem = systems.find(s => s.id === sistemaId);
    const isComercial = ["Comercial","Sistema 75m"].includes(thisSystem?.tipo);
    // For commercial systems, compute peso from module weights
    let peso = isPeso ? parseFloat(readingForm.peso) : null;
    let moduleWeightsOut = null;
    if (isPeso && isComercial) {
      const filled = (readingForm.module_weights || []).map((v,i) => ({ i, v: parseFloat(v) })).filter(x => !isNaN(x.v) && x.v > 0);
      if (filled.length < 4) return; // require minimum 4
      const avg = filled.reduce((s,x) => s + x.v, 0) / filled.length;
      peso = Math.round(avg * 15);
      moduleWeightsOut = readingForm.module_weights.map(v => parseFloat(v) || null);
    }
    if (isPeso && (!peso || peso <= 0)) return;
    if (!isPeso && !readingForm.salt && !readingForm.ph && !readingForm.temp) return;

    // ── Duplicate detection: same sistema + fecha + tipo ──
    const dup = readings.find(r =>
      r.sistema === sistemaId &&
      r.fecha === readingForm.fecha &&
      (r.tipo || "peso") === readingForm.tipo
    );
    if (dup) {
      addToast(
        `⚠ ${sistemaId} ya tiene una lectura ${readingForm.tipo} para ${readingForm.fecha}${dup.updated_by ? ` (por ${dup.updated_by})` : ""}. Se guardó como nueva entrada.`,
        "warning"
      );
    }

    const prevReadings = readings
      .filter(r => r.sistema === sistemaId)
      .sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    const prev = prevReadings[0] || null;
    const tdc  = (isPeso && prev?.peso)
      ? calcTDC(prev.peso, prev.fecha, peso, readingForm.fecha, prev.cosechada, readingForm.cosechada ? parseFloat(readingForm.cosechada) : 0, prev.sueltos || 0, readingForm.sueltos ? parseFloat(readingForm.sueltos) : 0)
      : null;

    const newReading = {
      id:         `${sistemaId}_${readingForm.fecha}_${user?.initials||'CM'}`,
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
      foto:       (readingForm.foto && readingForm.foto !== true) ? readingForm.foto : null,
      cosechada:  readingForm.cosechada ? parseFloat(readingForm.cosechada) : null,
      sembrado:   readingForm.sembrado  ? parseFloat(readingForm.sembrado)  : null,
      aguas:          readingForm.aguas       || "",
      condiciones:    readingForm.condiciones || "",
      logged_by:      user?.initials || null,
      module_weights: moduleWeightsOut,
    };
    // Activity log
    if (isPeso) {
      const cosechada = newReading.cosechada || 0;
      const pesoKg  = peso ? (peso/1000).toFixed(2) : null;
      const prevKg  = prev?.peso ? (prev.peso/1000).toFixed(2) : null;
      logActivity({
        actor:    user?.initials,
        action:   cosechada > 0 ? 'harvest' : 'reading_added',
        sistema:  sistemaId,
        field:    'peso',
        oldValue: prevKg,
        newValue: pesoKg,
        note: cosechada > 0
          ? `${sistemaId} cosecha: ${(cosechada/1000).toFixed(2)}kg removidos · nuevo peso: ${pesoKg}kg`
          : `${sistemaId} lectura: ${pesoKg}kg${prevKg ? ` (ant: ${prevKg}kg)` : ''}`,
      });
      if (newReading.sembrado > 0) {
        logActivity({ actor: user?.initials, action: 'seeding', sistema: sistemaId, field: 'sembrado', newValue: (newReading.sembrado/1000).toFixed(2), note: `${sistemaId} siembra: ${(newReading.sembrado/1000).toFixed(2)}kg agregados` });
      }
    }
    const withNew = [...readings, newReading];
    setReadings(isPeso ? recalcAllTDC(withNew, sistemaId) : withNew);
    setShowReadingForm(false);
    setShowGrowthChart(sistemaId); // Auto-show growth chart after save
    setReadingForm({
      fecha: new Date().toISOString().slice(0,10),
      tipo:"peso", peso:"", sueltos:"", buoys:Array(15).fill(""), module_weights:Array(15).fill(""),
      salt:"", ph:"", temp:"", salinidad:"", notas:"", foto:null,
      cosechada:"", sembrado:"", aguas:"", condiciones:"",
    });
  };

  const handleSaveEditReading = (readingId, sistemaId) => {
    const isPeso = editReadingForm.tipo === "peso";
    const peso = isPeso ? parseFloat(editReadingForm.peso) : null;
    if (isPeso && (!peso || peso <= 0)) return;
    const updated = readings.map(r =>
      r.id === readingId ? {
        ...r,
        fecha:       editReadingForm.fecha,
        tipo:        editReadingForm.tipo,
        peso:        peso,
        sueltos:     editReadingForm.sueltos   ? parseFloat(editReadingForm.sueltos)   : null,
        buoys:       editReadingForm.buoys?.some(b=>b) ? editReadingForm.buoys.map(b=>parseFloat(b)||0) : r.buoys,
        salt:        editReadingForm.salt      ? parseFloat(editReadingForm.salt)      : null,
        ph:          editReadingForm.ph        ? parseFloat(editReadingForm.ph)        : null,
        temp:        editReadingForm.temp      ? parseFloat(editReadingForm.temp)      : null,
        salinidad:   editReadingForm.salinidad ? parseFloat(editReadingForm.salinidad) : null,
        cosechada:   editReadingForm.cosechada ? parseFloat(editReadingForm.cosechada) : null,
        aguas:       editReadingForm.aguas     || "",
        condiciones: editReadingForm.condiciones || "",
        notas:       editReadingForm.notas     || "",
        foto:        editReadingForm.foto      || r.foto || null,
      } : r
    );
    // Activity log for edit
    if (isPeso) {
      const orig = readings.find(r => r.id === readingId);
      if (orig && orig.peso !== peso) {
        logActivity({
          actor:    user?.initials,
          action:   'reading_edited',
          sistema:  sistemaId,
          field:    'peso',
          oldValue: orig.peso != null ? (orig.peso/1000).toFixed(2) : null,
          newValue: (peso/1000).toFixed(2),
          note: `${sistemaId} peso corregido: ${orig.peso != null ? (orig.peso/1000).toFixed(2) : '?'}kg → ${(peso/1000).toFixed(2)}kg (${orig.fecha})`,
        });
      }
    }
    setReadings(isPeso ? recalcAllTDC(updated, sistemaId) : updated);
    setEditingReadingId(null);
  };

  const EMPTY = {id:"",region:"Bahía Azul",poligono:1,pueblo:"",tipo:"Canasta",familia:"",profundidad:"",materiales:"Tie-tie",semillas:"Brazil",estado:"Activo",coordenadas:"",fechaInstalacion:new Date().toISOString().slice(0,10),capitan:"",buceador:"",modulos:0,notas:""};
  const [form, setForm] = useState(EMPTY);
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));

  async function saveNewCrew() {
    if (!newCrewForm.name || !newCrewForm.initials) return;
    setNewCrewSaving(true);
    try {
      const username = newCrewForm.name.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
      const inits = newCrewForm.initials.toUpperCase();
      await sbStatic.from('usuarios').insert([{
        username, password_plain: '1234', role: 'vaquero',
        name: newCrewForm.name, initials: inits,
        created_by: user?.initials, active: true,
      }]);
      const newMember = { initials: inits, name: newCrewForm.name, role: newCrewForm.role, username };
      const updated = [...extraCrew, newMember];
      setExtraCrew(updated);
      try { localStorage.setItem('aq_extra_crew', JSON.stringify(updated)); } catch {}
      F(addingCrewFor, inits);
      setAddingCrewFor(null);
      setNewCrewForm({ name:'', initials:'', role:'Buceador' });
    } catch(e) { console.error('saveNewCrew failed', e); }
    setNewCrewSaving(false);
  }

  const filtered         = systems.filter(s=>(filterRegion==="all"||s.region===filterRegion));
  const activeFiltered   = filtered.filter(s=>s.estado==="Activo").filter(s=>!sysSearch||(s.id+s.pueblo+s.region+s.capitan).toLowerCase().includes(sysSearch.toLowerCase()));
  const retiredFiltered  = filtered.filter(s=>s.estado==="Retirado");
  const archivedFiltered = filtered.filter(s=>s.estado==="Archivado");

  // Augment active systems with latest biomass + TDC for sorting
  const activeSorted = activeFiltered.map(s=>{
    const lr = latestReading(readings, s.id);
    const pr = prevReading(readings, s.id);
    let tdc = null;
    if (lr?.peso && pr?.peso) {
      const adj1 = (pr.peso||0)+(pr.sueltos||0)-(pr.cosechada||0);
      const adj2 = (lr.peso||0)+(lr.sueltos||0);
      const days = Math.max(1,(new Date(lr.fecha)-new Date(pr.fecha))/86400000);
      if (adj1>0&&adj2>0) tdc = parseFloat(((Math.log(adj2/adj1)/days)*100).toFixed(2));
    }
    return {...s, _biomass: lr?.peso||0, _tdc: tdc};
  }).sort((a,b)=>{
    const dir = sysSortDir==='asc' ? 1 : -1;
    if (sysSort==='biomass') return dir*(a._biomass - b._biomass);
    if (sysSort==='tdc') return dir*((a._tdc??-999) - (b._tdc??-999));
    if (sysSort==='name') return dir*(a.id.localeCompare(b.id));
    // 'region' default — group by region/polygon as before
    return 0;
  });

  const useFlat = sysSort !== 'region';
  const grouped  = {};
  (useFlat ? activeSorted : activeFiltered).forEach(s=>{
    if(!grouped[s.region]) grouped[s.region]={};
    const pk=`Polígono ${s.poligono}`;
    if(!grouped[s.region][pk]) grouped[s.region][pk]=[];
    grouped[s.region][pk].push(s);
  });

  const handleSave = ()=>{
    if(!form.id) return;
    const existing = systems.find(s=>s.id===form.id);
    const isNew = !existing;
    if (isNew && systems.some(s => s.id === form.id)) {
      // Shouldn't reach here since isNew checks find() — but safety check
      addToast(`⚠ Sistema ${form.id} ya existe — se actualizó.`, "warning");
    }
    setSystems(prev=>{ const e=prev.find(s=>s.id===form.id); return e?prev.map(s=>s.id===form.id?form:s):[...prev,form]; });
    if (isNew) addToast(`✓ Sistema ${form.id} creado`, "success");
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
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:.6}}>{lang==="es"?"Equipo responsable":"Responsible crew"}</div>
            {canEditReadings && (
              editingTeam===s.id
                ? <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{
                      const newBuceador = teamForm.buceadores.join(',') || null;
                      setSystems(prev=>prev.map(x=>x.id===s.id?{...x,capitan:teamForm.capitan||null,buceador:newBuceador}:x));
                      setEditingTeam(null); setAddingHire(false);
                    }} style={{fontSize:10,padding:"2px 8px",borderRadius:6,border:"none",background:"#0d9488",color:"#fff",fontWeight:700,cursor:"pointer"}}>
                      {lang==="es"?"Guardar":"Save"}
                    </button>
                    <button onClick={()=>{setEditingTeam(null);setAddingHire(false);}} style={{fontSize:10,padding:"2px 8px",borderRadius:6,border:"1px solid rgba(148,163,184,.2)",background:"transparent",color:"#64748b",cursor:"pointer"}}>
                      {lang==="es"?"Cancelar":"Cancel"}
                    </button>
                  </div>
                : <button onClick={()=>{setTeamForm({capitan:s.capitan||'',buceadores:getBuceadores(s)});setEditingTeam(s.id);setAddingHire(false);}}
                    style={{fontSize:10,padding:"2px 8px",borderRadius:6,border:"1px solid rgba(148,163,184,.15)",background:"rgba(255,255,255,.04)",color:"#94a3b8",cursor:"pointer"}}>
                    ✏️ {lang==="es"?"Asignar":"Assign"}
                  </button>
            )}
          </div>
          {editingTeam===s.id ? (
            <div>
              {/* Capitán */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Capitán</div>
                <select value={teamForm.capitan} onChange={e=>setTeamForm(p=>({...p,capitan:e.target.value}))}
                  style={{...S.input,appearance:"none",fontSize:12}}>
                  <option value="">— {lang==="es"?"Regional por defecto":"Regional default"} —</option>
                  {[...CREW, ...extraCrew].filter(c=>c.role==="Capitán").map(c=>(
                    <option key={c.initials} value={c.initials}>{c.initials} – {c.name}</option>
                  ))}
                </select>
              </div>
              {/* Buceadores — multi-select checkboxes */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:10,color:"#64748b",marginBottom:6}}>Buceadores</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {[...CREW, ...extraCrew].filter(c=>c.role==="Buceador").map(c=>{
                    const checked = teamForm.buceadores.includes(c.initials);
                    return (
                      <label key={c.initials} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:7,background:checked?"rgba(13,148,136,.1)":"rgba(255,255,255,.02)",cursor:"pointer",fontSize:12,color:checked?"#0d9488":"#94a3b8"}}>
                        <input type="checkbox" checked={checked} onChange={()=>setTeamForm(p=>({
                          ...p,
                          buceadores: checked ? p.buceadores.filter(x=>x!==c.initials) : [...p.buceadores, c.initials]
                        }))} style={{accentColor:"#0d9488"}}/>
                        <span style={{fontWeight:700,minWidth:32}}>{c.initials}</span>
                        <span>{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Add new hire — admin/consultor/director */}
              {["admin","consultor","director"].includes(user?.role) && (
                addingHire ? (
                  <div style={{background:"rgba(139,92,246,.06)",border:"1px solid rgba(139,92,246,.2)",borderRadius:8,padding:10,marginTop:6}}>
                    <div style={{fontSize:10,color:"#a78bfa",fontWeight:700,marginBottom:8}}>{lang==="es"?"Nuevo integrante":"New hire"}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:6,marginBottom:6}}>
                      <input placeholder={lang==="es"?"Nombre completo":"Full name"} value={hireForm.name} onChange={e=>setHireForm(p=>({...p,name:e.target.value}))} style={{...S.input,fontSize:12}}/>
                      <input placeholder="Iniciales" maxLength={4} value={hireForm.initials} onChange={e=>setHireForm(p=>({...p,initials:e.target.value.toUpperCase()}))} style={{...S.input,fontSize:12}}/>
                    </div>
                    <select value={hireForm.role} onChange={e=>setHireForm(p=>({...p,role:e.target.value}))} style={{...S.input,appearance:"none",fontSize:12,marginBottom:6}}>
                      <option value="Buceador">Buceador</option>
                      <option value="Capitán">Capitán</option>
                    </select>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{
                        if(!hireForm.name||!hireForm.initials) return;
                        const newMember = {initials:hireForm.initials,name:hireForm.name,role:hireForm.role,username:hireForm.name.toLowerCase().replace(/\s+/g,'_')};
                        const updated = [...extraCrew, newMember];
                        setExtraCrew(updated);
                        try { localStorage.setItem('aq_extra_crew', JSON.stringify(updated)); } catch {}
                        if(hireForm.role==="Buceador") setTeamForm(p=>({...p,buceadores:[...p.buceadores,hireForm.initials]}));
                        setHireForm({name:'',initials:'',role:'Buceador'});
                        setAddingHire(false);
                      }} style={{fontSize:10,padding:"3px 10px",borderRadius:6,border:"none",background:"#8b5cf6",color:"#fff",fontWeight:700,cursor:"pointer"}}>
                        {lang==="es"?"Agregar":"Add"}
                      </button>
                      <button onClick={()=>setAddingHire(false)} style={{fontSize:10,padding:"3px 10px",borderRadius:6,border:"1px solid rgba(148,163,184,.2)",background:"transparent",color:"#64748b",cursor:"pointer"}}>
                        {lang==="es"?"Cancelar":"Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={()=>setAddingHire(true)} style={{fontSize:10,padding:"4px 10px",borderRadius:6,border:"1px dashed rgba(139,92,246,.4)",background:"transparent",color:"#a78bfa",cursor:"pointer",marginTop:4}}>
                    + {lang==="es"?"Agregar nuevo integrante":"Add new hire"}
                  </button>
                )
              )}
            </div>
          ) : (()=>{
            const allCrew = [...CREW, ...extraCrew];
            const cap = getCapitan(s);
            const bucs = getBuceadores(s);
            const team = [
              ...(cap ? [{role:"Capitán", name:allCrew.find(c=>c.initials===cap)?.name||cap, initials:cap, color:"#0d9488", note:`Polígono ${s.poligono}`}] : []),
              ...bucs.map(b=>({role:"Buceador", name:allCrew.find(c=>c.initials===b)?.name||b, initials:b, color:"#4ade80", note:lang==="es"?"Este sistema":"This system"})),
            ];
            return team.map(item=>(
              <div key={item.role} onClick={()=>item.initials && item.initials!=="–" && navigateTo("persona", item.initials)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"7px 9px",background:"rgba(255,255,255,.03)",borderRadius:9,marginBottom:6,cursor:item.initials&&item.initials!=="–"?"pointer":"default"}}>
                <div style={{width:30,height:30,borderRadius:8,background:`${item.color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:9,fontWeight:800,color:item.color}}>{item.initials||"–"}</span></div>
                <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{item.name||"–"}</div><div style={{fontSize:10,color:"#64748b"}}>{item.role} · {item.note}</div></div>
                {item.initials && item.initials!=="–" && <span style={{fontSize:10,color:"#475569"}}>→</span>}
              </div>
            ));
          })()}
        </div>
        {/* ── Inline Growth Chart (Crecimiento) ─────────────────────────── */}
        {(()=>{
          const sysReadings = readings.filter(r=>r.sistema===s.id && r.tipo==="peso" && r.peso).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
          if(sysReadings.length < 2) return null;
          const isOpen = showGrowthChart === s.id;
          const data = sysReadings.map(r=>({fecha:r.fecha, peso:r.peso, tdc:r.tdc}));
          const vals = data.map(d=>d.peso);
          const min = Math.min(...vals)*0.9, max = Math.max(...vals)*1.1;
          const W=300, H=120, pad=30;
          const toX = i => pad + (i/(data.length-1))*(W-pad*2);
          const toY = v => H - pad - ((v-min)/(max-min||1))*(H-pad*2);
          const pts = data.map((d,i)=>`${toX(i)},${toY(d.peso)}`).join(" ");
          const latest = data[data.length-1];
          const latestTDC = latest.tdc;
          return (
            <div style={{...S.card, borderColor: isOpen ? "rgba(13,148,136,.2)" : "rgba(148,163,184,.06)", marginBottom:10}}>
              <div onClick={()=>setShowGrowthChart(isOpen?null:s.id)}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#e2e8f0"}}>
                  📈 {lang==="es"?"Crecimiento":"Growth"}
                  {latestTDC !== null && latestTDC !== undefined && (
                    <span style={{marginLeft:8,fontSize:12,fontWeight:800,fontFamily:"monospace",
                      color: latestTDC >= 2.5 ? "#4ade80" : latestTDC >= 0 ? "#0d9488" : "#f87171"}}>
                      {latestTDC >= 0 ? "+" : ""}{(typeof latestTDC === 'number' ? latestTDC : 0).toFixed(2)}%/día
                    </span>
                  )}
                </div>
                <span style={{fontSize:10,color:"#64748b"}}>{isOpen?"▼":"▶"} {data.length} pts</span>
              </div>
              {isOpen && (
                <div style={{marginTop:10}}>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:H}}>
                    <polyline points={pts} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinejoin="round"/>
                    {data.map((d,i)=>(
                      <g key={i}>
                        <circle cx={toX(i)} cy={toY(d.peso)} r={i===data.length-1?5:2.5}
                          fill={d.tdc>=2.5?"#4ade80":d.tdc>=0?"#0d9488":"#f87171"} stroke="none"/>
                        {i===data.length-1 && (
                          <text x={toX(i)} y={toY(d.peso)-10} textAnchor="middle" fontSize="9" fontWeight="700"
                            fill="#e2e8f0">{(d.peso/1000).toFixed(1)}kg</text>
                        )}
                      </g>
                    ))}
                    {/* X axis labels */}
                    {data.filter((_,i)=>i===0||i===data.length-1).map((d,i)=>(
                      <text key={i} x={i===0?pad:W-pad} y={H-5} textAnchor={i===0?"start":"end"}
                        fontSize="8" fill="#475569">{d.fecha.slice(5)}</text>
                    ))}
                  </svg>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Readings history ─────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:.6}}>
              {lang==="es"?"Lecturas":"Readings"}
              <span style={{marginLeft:6,color:"#334155"}}>({readings.filter(r=>r.sistema===s.id).length})</span>
            </div>
            {canEditReadings && (
              <button onClick={()=>setShowReadingForm(v=>!v)}
                style={{padding:"4px 10px",borderRadius:8,border:"1px solid rgba(13,148,136,.3)",background:"rgba(13,148,136,.06)",color:"#0d9488",fontWeight:700,fontSize:11,cursor:"pointer"}}>
                {showReadingForm?"✕ Cancelar":"+ Nueva Lectura"}
              </button>
            )}
          </div>

          {/* New reading form */}
          {showReadingForm && canEditReadings && (
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
                  {["Comercial","Sistema 75m"].includes(s.tipo) ? (
                    <div style={{marginBottom:8}}>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:6,fontWeight:700}}>
                        {s.id} — Módulos 1–15 (g) · <span style={{color:"#fbbf24"}}>mínimo 4</span>
                        <span style={{fontSize:9,color:"#334155",marginLeft:6,fontWeight:400}}>Biomasa = promedio × 15</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                        {Array.from({length:15},(_,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:10,color:"#64748b",width:28,flexShrink:0,fontFamily:"monospace"}}>M{i+1}</span>
                            <input type="number" placeholder="—"
                              value={readingForm.module_weights?.[i]||""}
                              onChange={e=>{
                                const mw=[...(readingForm.module_weights||Array(15).fill(""))];
                                mw[i]=e.target.value;
                                const filled=mw.map(v=>parseFloat(v)).filter(v=>!isNaN(v)&&v>0);
                                const avg=filled.length?filled.reduce((s,v)=>s+v,0)/filled.length:0;
                                const biomass=filled.length>=4?Math.round(avg*15):0;
                                setReadingForm(p=>({...p,module_weights:mw,peso:biomass>0?String(biomass):""}));
                              }}
                              style={{...S.input,fontSize:11,padding:"5px 8px"}}/>
                          </div>
                        ))}
                      </div>
                      {(()=>{
                        const filled=(readingForm.module_weights||[]).map(v=>parseFloat(v)).filter(v=>!isNaN(v)&&v>0);
                        const avg=filled.length?filled.reduce((s,v)=>s+v,0)/filled.length:0;
                        const biomass=filled.length>=4?Math.round(avg*15):0;
                        return filled.length>0&&(
                          <div style={{borderRadius:8,padding:"6px 10px",marginBottom:8,background:"rgba(13,148,136,.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:11,color:"#64748b"}}>{filled.length} módulo{filled.length!==1?"s":""} pesado{filled.length!==1?"s":""}{filled.length<4&&<span style={{color:"#f87171",marginLeft:4}}>· faltan {4-filled.length}</span>}</span>
                            {biomass>0&&<span style={{fontSize:14,fontWeight:800,color:"#2dd4bf",fontFamily:"monospace"}}>{(biomass/1000).toFixed(2)} kg biomasa</span>}
                          </div>
                        );
                      })()}
                    </div>
                  ) : s.tipo==="Long Line" ? (
                    <div style={{marginBottom:8}}>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:6,fontWeight:700}}>
                        {s.id} — B1–B{s.modulos||15} (g)
                        <span style={{fontSize:9,color:"#334155",marginLeft:6,fontWeight:400}}>Total = sum</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                        {Array.from({length:s.modulos||15},(_,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:10,color:"#64748b",width:28,flexShrink:0,fontFamily:"monospace"}}>B{i+1}</span>
                            <input type="number" placeholder="0"
                              value={readingForm.buoys?.[i]||""}
                              onChange={e=>{
                                const buoys=[...(readingForm.buoys||Array(15).fill(""))];
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
                    const preview=calcTDC(lastR.peso,lastR.fecha,parseFloat(readingForm.peso),readingForm.fecha,lastR.cosechada,readingForm.cosechada?parseFloat(readingForm.cosechada):0,lastR.sueltos||0,readingForm.sueltos?parseFloat(readingForm.sueltos):0);
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
              {/* Harvest + conditions (peso mode) */}
              {readingForm.tipo==="peso"&&(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <div>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Cosechada (g)":"Harvested (g)"}</div>
                      <input type="number" placeholder="0" value={readingForm.cosechada||""}
                        onChange={e=>setReadingForm(p=>({...p,cosechada:e.target.value}))}
                        style={{...S.input,fontSize:12,borderColor:readingForm.cosechada?"rgba(74,222,128,.4)":"rgba(148,163,184,.12)"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Condiciones":"Conditions"}</div>
                      <select value={readingForm.condiciones||""} onChange={e=>setReadingForm(p=>({...p,condiciones:e.target.value}))}
                        style={{...S.input,fontSize:12,appearance:"none"}}>
                        <option value="">–</option>
                        <option value="Saludables">Saludables</option>
                        <option value="Epifitas">Epifitas</option>
                        <option value="Ice-ice">Ice-ice</option>
                        <option value="Decoloración">Decoloración</option>
                        <option value="Excelente">Excelente</option>
                      </select>
                    </div>
                  </div>
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Aguas":"Water clarity"}</div>
                    <select value={readingForm.aguas||""} onChange={e=>setReadingForm(p=>({...p,aguas:e.target.value}))}
                      style={{...S.input,fontSize:12,appearance:"none"}}>
                      <option value="">–</option>
                      <option value="Claras">Claras</option>
                      <option value="Transparente">Transparente</option>
                      <option value="Turbia">Turbia</option>
                    </select>
                  </div>
                </>
              )}
              {/* Photo capture — real camera on mobile, file picker on desktop */}
              <div style={{marginBottom:8}}>
                <input type="file" accept="image/*" capture="environment" id="new-reading-foto" style={{display:"none"}}
                  onChange={e=>{
                    const file=e.target.files?.[0];
                    if(file){
                      const reader=new FileReader();
                      reader.onload=ev=>setReadingForm(p=>({...p,foto:ev.target.result}));
                      reader.readAsDataURL(file);
                    }
                  }}/>
                <button onClick={()=>document.getElementById('new-reading-foto')?.click()}
                  style={{width:"100%",padding:"9px 12px",borderRadius:9,cursor:"pointer",
                    border:`1.5px dashed ${readingForm.foto&&readingForm.foto!==true?"rgba(74,222,128,.5)":"rgba(148,163,184,.2)"}`,
                    background:readingForm.foto&&readingForm.foto!==true?"rgba(74,222,128,.06)":"transparent",
                    color:readingForm.foto&&readingForm.foto!==true?"#4ade80":"#64748b",
                    fontWeight:600,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span>📷</span>
                  {readingForm.foto&&readingForm.foto!==true?(lang==="es"?"✓ Foto capturada":"✓ Photo captured"):(lang==="es"?"Tomar foto / elegir imagen":"Take photo / choose image")}
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
                        const isLongLine = s.tipo==="Long Line";
                        const buoyCount = s.modulos || 15;
                        return (
                          <div key={r.id} style={{background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.25)",borderRadius:10,padding:12,marginBottom:6}}>
                            <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.6}}>
                              ✏️ {lang==="es"?"Editar lectura":"Edit reading"} — {fecha}{dupLabel}
                            </div>
                            {/* Type toggle */}
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                              {[["peso",lang==="es"?"⚖️ Peso":"⚖️ Weight"],["parametros",lang==="es"?"🌊 Parámetros":"🌊 Parameters"]].map(([t,label])=>(
                                <button key={t} onClick={()=>setEditReadingForm(p=>({...p,tipo:t}))}
                                  style={{padding:"7px 0",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
                                    background:editReadingForm.tipo===t?"rgba(245,158,11,.25)":"rgba(255,255,255,.03)",
                                    color:editReadingForm.tipo===t?"#f59e0b":"#64748b"}}>{label}
                                </button>
                              ))}
                            </div>
                            {/* Date */}
                            <div style={{marginBottom:8}}>
                              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Fecha":"Date"}</div>
                              <input type="date" value={editReadingForm.fecha}
                                onChange={e=>setEditReadingForm(p=>({...p,fecha:e.target.value}))}
                                style={{...S.input,colorScheme:"dark",fontSize:12}}/>
                            </div>
                            {/* PESO mode */}
                            {editReadingForm.tipo==="peso"?(
                              <>
                                {["Comercial","Sistema 75m"].includes(s.tipo) ? (
                                  <div style={{marginBottom:8}}>
                                    <div style={{fontSize:10,color:"#64748b",fontWeight:700,marginBottom:6}}>
                                      Módulos M1–M15 (g) <span style={{fontWeight:400,color:"#334155"}}>— mín. 4 para calcular</span>
                                    </div>
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:8}}>
                                      {Array.from({length:15},(_,i)=>(
                                        <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                                          <span style={{fontSize:10,color:"#64748b",width:28,flexShrink:0,fontFamily:"monospace"}}>M{i+1}</span>
                                          <input type="number" placeholder="0"
                                            value={editReadingForm.module_weights?.[i]||""}
                                            onChange={e=>{
                                              const mw=[...(editReadingForm.module_weights||Array(15).fill(""))];
                                              mw[i]=e.target.value;
                                              const filled=mw.map(v=>parseFloat(v)).filter(v=>!isNaN(v)&&v>0);
                                              const biomass=filled.length>=4?Math.round((filled.reduce((a,b)=>a+b,0)/filled.length)*15):0;
                                              setEditReadingForm(p=>({...p,module_weights:mw,peso:biomass>0?String(biomass):p.peso}));
                                            }}
                                            style={{...S.input,fontSize:11,padding:"5px 8px"}}/>
                                        </div>
                                      ))}
                                    </div>
                                    {editReadingForm.peso&&(
                                      <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:8,background:"rgba(13,148,136,.08)",marginBottom:8}}>
                                        <span style={{fontSize:11,color:"#64748b"}}>Biomasa estimada</span>
                                        <span style={{fontSize:13,fontWeight:800,color:"#2dd4bf",fontFamily:"monospace"}}>{(parseFloat(editReadingForm.peso)/1000).toFixed(2)} kg</span>
                                      </div>
                                    )}
                                  </div>
                                ) : isLongLine ? (
                                  <div style={{marginBottom:8}}>
                                    <div style={{fontSize:10,color:"#64748b",marginBottom:6,fontWeight:700}}>
                                      {s.id} — Buoys 1–{buoyCount} (g)
                                      <span style={{fontSize:9,color:"#334155",marginLeft:6,fontWeight:400}}>Total = sum</span>
                                    </div>
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                                      {Array.from({length:buoyCount},(_,i)=>(
                                        <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                                          <span style={{fontSize:10,color:"#64748b",width:48,flexShrink:0,fontFamily:"monospace"}}>B{i+1}</span>
                                          <input type="number" placeholder="0"
                                            value={editReadingForm.buoys?.[i]||""}
                                            onChange={e=>{
                                              const buoys=[...(editReadingForm.buoys||Array(buoyCount).fill(""))];
                                              buoys[i]=e.target.value;
                                              const total=buoys.reduce((sum,v)=>sum+(parseFloat(v)||0),0);
                                              setEditReadingForm(p=>({...p,buoys,peso:total>0?String(Math.round(total)):""}));
                                            }}
                                            style={{...S.input,fontSize:11,padding:"5px 8px"}}/>
                                        </div>
                                      ))}
                                    </div>
                                    {editReadingForm.peso&&(
                                      <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:8,background:"rgba(245,158,11,.08)",marginBottom:8}}>
                                        <span style={{fontSize:11,color:"#64748b"}}>Total</span>
                                        <span style={{fontSize:14,fontWeight:800,color:"#f59e0b",fontFamily:"monospace"}}>{(parseFloat(editReadingForm.peso)/1000).toFixed(3)} kg</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
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
                                )}
                                {/* Harvest field — disease protocol */}
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                  <div>
                                    <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Cosechada (g)":"Harvested (g)"}</div>
                                    <input type="number" placeholder="0" value={editReadingForm.cosechada}
                                      onChange={e=>setEditReadingForm(p=>({...p,cosechada:e.target.value}))}
                                      style={{...S.input,fontSize:12,borderColor:editReadingForm.cosechada?"rgba(74,222,128,.4)":"rgba(148,163,184,.12)"}}/>
                                  </div>
                                  <div>
                                    <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Condiciones":"Conditions"}</div>
                                    <select value={editReadingForm.condiciones} onChange={e=>setEditReadingForm(p=>({...p,condiciones:e.target.value}))}
                                      style={{...S.input,fontSize:12,appearance:"none"}}>
                                      <option value="">–</option>
                                      <option value="Saludables">Saludables</option>
                                      <option value="Epifitas">Epifitas</option>
                                      <option value="Ice-ice">Ice-ice</option>
                                      <option value="Decoloración">Decoloración</option>
                                      <option value="Excelente">Excelente</option>
                                    </select>
                                  </div>
                                </div>
                                <div style={{marginBottom:8}}>
                                  <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Aguas":"Water clarity"}</div>
                                  <select value={editReadingForm.aguas} onChange={e=>setEditReadingForm(p=>({...p,aguas:e.target.value}))}
                                    style={{...S.input,fontSize:12,appearance:"none"}}>
                                    <option value="">–</option>
                                    <option value="Claras">Claras</option>
                                    <option value="Transparente">Transparente</option>
                                    <option value="Turbia">Turbia</option>
                                  </select>
                                </div>
                              </>
                            ):(
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                {[["ph","pH","9.2"],["temp","°C","27"],["salinidad",lang==="es"?"Salinidad":"Salinity","19"],["salt","Sal %","2.5"]].map(([key,label,ph])=>(
                                  <div key={key}>
                                    <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{label}</div>
                                    <input type="number" step="0.1" placeholder={ph} value={editReadingForm[key]} onChange={e=>setEditReadingForm(p=>({...p,[key]:e.target.value}))} style={{...S.input,fontSize:12}}/>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Photo capture */}
                            <div style={{marginBottom:8}}>
                              <input type="file" accept="image/*" capture="environment" id={`edit-foto-${r.id}`} style={{display:"none"}}
                                onChange={e=>{
                                  const file=e.target.files?.[0];
                                  if(file){
                                    const reader=new FileReader();
                                    reader.onload=ev=>setEditReadingForm(p=>({...p,foto:ev.target.result}));
                                    reader.readAsDataURL(file);
                                  }
                                }}/>
                              <button onClick={()=>document.getElementById(`edit-foto-${r.id}`)?.click()}
                                style={{width:"100%",padding:"8px 12px",borderRadius:9,cursor:"pointer",
                                  border:`1.5px dashed ${editReadingForm.foto?"rgba(74,222,128,.5)":"rgba(148,163,184,.2)"}`,
                                  background:editReadingForm.foto?"rgba(74,222,128,.06)":"transparent",
                                  color:editReadingForm.foto?"#4ade80":"#64748b",fontWeight:600,fontSize:11}}>
                                📷 {editReadingForm.foto?(lang==="es"?"✓ Foto capturada":"✓ Photo captured"):(lang==="es"?"Tomar foto":"Take photo")}
                              </button>
                            </div>
                            {/* Comments */}
                            <div style={{marginBottom:10}}>
                              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>💬 {lang==="es"?"Notas":"Notes"}</div>
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
                      const isCoverage = r.logged_by && !hasBuceador(s, r.logged_by) && r.logged_by !== getCapitan(s);
                      return (
                        <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>⚖️</span>
                              {dupLabel&&<span style={{fontSize:9,color:"#64748b"}}>{dupLabel}</span>}
                              {r.logged_by&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,
                                background:isCoverage?"rgba(245,158,11,.15)":"rgba(13,148,136,.1)",
                                color:isCoverage?"#f59e0b":"#0d9488",fontWeight:700}}>
                                {isCoverage?(lang==="es"?"Cubrió: ":"Covered: "):""}{r.logged_by}
                              </span>}
                            </div>
                            {r.notas&&<div style={{fontSize:10,color:"#64748b",fontStyle:"italic"}}>"{r.notas}"</div>}
                          </div>
                          <div style={{textAlign:"right",display:"flex",alignItems:"center",gap:8}}>
                            <div>
                              <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",fontFamily:"monospace"}}>{r.peso?(r.peso/1000).toFixed(2)+" kg":"—"}</div>
                              {r.sueltos&&<div style={{fontSize:10,color:"#64748b"}}>+{(r.sueltos/1000).toFixed(2)}kg sueltos</div>}
                              {r.tdc!==null&&<div style={{fontSize:10,fontWeight:700,color:col}}>{r.tdc>=0?"+":""}{r.tdc}%/día</div>}
                            </div>
                            <ReadingActionButtons
                              reading={r}
                              onEdit={(reading) => setEditingViaModal(reading)}
                              onDelete={(reading) => setDeletingViaModal(reading)}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Parametros reading(s) for this date — shown below peso, concatenated */}
                    {paramReadings.map((r,pi)=>{
                      const isEditing = editingReadingId===r.id;
                      const dupLabel  = paramReadings.length>1?` (${pi+1})`:"";

                      // Parametros edit — same unified form as peso (buoys, harvest, photo)
                      if(isEditing && canEditReadings) {
                        const editCanSave = editReadingForm.tipo==="peso"
                          ? !!editReadingForm.peso
                          : !!(editReadingForm.ph||editReadingForm.temp||editReadingForm.salinidad||editReadingForm.salt);
                        const isLongLine = s.tipo==="Long Line";
                        const buoyCount = s.modulos || 15;
                        return (
                          <div key={r.id} style={{background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.25)",borderRadius:10,padding:12,marginBottom:6}}>
                            <div style={{fontSize:10,color:"#f59e0b",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.6}}>
                              ✏️ {lang==="es"?"Editar lectura":"Edit reading"} — 🌊 {fecha}{dupLabel}
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                              {[["peso","⚖️ Peso"],["parametros","🌊 Parámetros"]].map(([t,label])=>(
                                <button key={t} onClick={()=>setEditReadingForm(p=>({...p,tipo:t}))}
                                  style={{padding:"7px 0",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
                                    background:editReadingForm.tipo===t?"rgba(245,158,11,.25)":"rgba(255,255,255,.03)",
                                    color:editReadingForm.tipo===t?"#f59e0b":"#64748b"}}>{label}</button>
                              ))}
                            </div>
                            <div style={{marginBottom:8}}>
                              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Fecha</div>
                              <input type="date" value={editReadingForm.fecha} onChange={e=>setEditReadingForm(p=>({...p,fecha:e.target.value}))} style={{...S.input,colorScheme:"dark",fontSize:12}}/>
                            </div>
                            {editReadingForm.tipo==="peso"?(
                              <>
                                {isLongLine ? (
                                  <div style={{marginBottom:8}}>
                                    <div style={{fontSize:10,color:"#64748b",marginBottom:6,fontWeight:700}}>{s.id} — B1–B{buoyCount} (g)</div>
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                                      {Array.from({length:buoyCount},(_,i)=>(
                                        <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                                          <span style={{fontSize:10,color:"#64748b",width:28,flexShrink:0,fontFamily:"monospace"}}>B{i+1}</span>
                                          <input type="number" placeholder="0" value={editReadingForm.buoys?.[i]||""}
                                            onChange={e=>{const buoys=[...(editReadingForm.buoys||Array(buoyCount).fill(""))];buoys[i]=e.target.value;const total=buoys.reduce((sum,v)=>sum+(parseFloat(v)||0),0);setEditReadingForm(p=>({...p,buoys,peso:total>0?String(Math.round(total)):""}));}}
                                            style={{...S.input,fontSize:11,padding:"5px 8px"}}/>
                                        </div>
                                      ))}
                                    </div>
                                    {editReadingForm.peso&&<div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:8,background:"rgba(245,158,11,.08)",marginBottom:8}}><span style={{fontSize:11,color:"#64748b"}}>Total</span><span style={{fontSize:14,fontWeight:800,color:"#f59e0b",fontFamily:"monospace"}}>{(parseFloat(editReadingForm.peso)/1000).toFixed(3)} kg</span></div>}
                                  </div>
                                ) : (
                                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                    <div><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Peso total (g)</div>
                                      <input type="number" value={editReadingForm.peso} onChange={e=>setEditReadingForm(p=>({...p,peso:e.target.value}))} style={{...S.input,fontSize:12}}/></div>
                                    <div><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Alga suelta (g)</div>
                                      <input type="number" placeholder="0" value={editReadingForm.sueltos} onChange={e=>setEditReadingForm(p=>({...p,sueltos:e.target.value}))} style={{...S.input,fontSize:12}}/></div>
                                  </div>
                                )}
                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                  <div><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Cosechada (g)</div>
                                    <input type="number" placeholder="0" value={editReadingForm.cosechada} onChange={e=>setEditReadingForm(p=>({...p,cosechada:e.target.value}))} style={{...S.input,fontSize:12,borderColor:editReadingForm.cosechada?"rgba(74,222,128,.4)":"rgba(148,163,184,.12)"}}/></div>
                                  <div><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Condiciones</div>
                                    <select value={editReadingForm.condiciones} onChange={e=>setEditReadingForm(p=>({...p,condiciones:e.target.value}))} style={{...S.input,fontSize:12,appearance:"none"}}><option value="">–</option><option value="Saludables">Saludables</option><option value="Epifitas">Epifitas</option><option value="Ice-ice">Ice-ice</option><option value="Decoloración">Decoloración</option><option value="Excelente">Excelente</option></select></div>
                                </div>
                                <div style={{marginBottom:8}}><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Aguas</div>
                                  <select value={editReadingForm.aguas} onChange={e=>setEditReadingForm(p=>({...p,aguas:e.target.value}))} style={{...S.input,fontSize:12,appearance:"none"}}><option value="">–</option><option value="Claras">Claras</option><option value="Transparente">Transparente</option><option value="Turbia">Turbia</option></select></div>
                              </>
                            ):(
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                                {[["ph","pH","9.2"],["temp","°C","27"],["salinidad","Salinidad","19"],["salt","Sal %","2.5"]].map(([key,label,ph])=>(
                                  <div key={key}><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{label}</div>
                                    <input type="number" step="0.1" placeholder={ph} value={editReadingForm[key]} onChange={e=>setEditReadingForm(p=>({...p,[key]:e.target.value}))} style={{...S.input,fontSize:12}}/></div>
                                ))}
                              </div>
                            )}
                            <div style={{marginBottom:8}}>
                              <input type="file" accept="image/*" capture="environment" id={`edit-param-foto-${r.id}`} style={{display:"none"}}
                                onChange={e=>{const file=e.target.files?.[0];if(file){const reader=new FileReader();reader.onload=ev=>setEditReadingForm(p=>({...p,foto:ev.target.result}));reader.readAsDataURL(file);}}}/>
                              <button onClick={()=>document.getElementById(`edit-param-foto-${r.id}`)?.click()}
                                style={{width:"100%",padding:"8px 12px",borderRadius:9,cursor:"pointer",border:`1.5px dashed ${editReadingForm.foto?"rgba(74,222,128,.5)":"rgba(148,163,184,.2)"}`,background:editReadingForm.foto?"rgba(74,222,128,.06)":"transparent",color:editReadingForm.foto?"#4ade80":"#64748b",fontWeight:600,fontSize:11}}>
                                📷 {editReadingForm.foto?"✓ Foto capturada":"Tomar foto"}
                              </button>
                            </div>
                            <div style={{marginBottom:10}}>
                              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>💬 Notas</div>
                              <input value={editReadingForm.notas} onChange={e=>setEditReadingForm(p=>({...p,notas:e.target.value}))} placeholder="Observaciones..." style={{...S.input,fontSize:12}}/>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                              <button onClick={()=>handleSaveEditReading(r.id,s.id)} disabled={!editCanSave}
                                style={{padding:10,borderRadius:9,border:"none",background:editCanSave?"rgba(13,148,136,.8)":"rgba(148,163,184,.1)",color:editCanSave?"#fff":"#475569",fontWeight:700,fontSize:12,cursor:"pointer"}}>Guardar</button>
                              <button onClick={()=>setEditingReadingId(null)}
                                style={{padding:10,borderRadius:9,border:"1px solid rgba(148,163,184,.12)",background:"transparent",color:"#64748b",fontSize:12,cursor:"pointer"}}>Cancelar</button>
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
                              <button onClick={()=>{setEditingReadingId(r.id);setEditReadingForm({fecha:r.fecha,tipo:"parametros",peso:"",sueltos:"",buoys:Array(15).fill(""),salt:String(r.salt||""),ph:String(r.ph||""),temp:String(r.temp||""),salinidad:String(r.salinidad||""),notas:r.notas||"",cosechada:"",aguas:r.aguas||"",condiciones:r.condiciones||"",foto:r.foto||null});setShowReadingForm(false);}}
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
        {editingViaModal && (
          <EditReading
            reading={editingViaModal}
            sistema={s}
            onSaved={() => { setReadings(prev => prev.map(x => x.id === editingViaModal.id ? { ...x, ...editingViaModal } : x)); setEditingViaModal(null); }}
            onCancel={() => setEditingViaModal(null)}
          />
        )}
        {deletingViaModal && (
          <DeleteReading
            reading={deletingViaModal}
            onDeleted={() => { setReadings(prev => prev.filter(x => x.id !== deletingViaModal.id)); setDeletingViaModal(null); }}
            onCancel={() => setDeletingViaModal(null)}
          />
        )}
        <div style={S.card}>
          <SystemNotes sistemaId={s.id} region={s.region} userInitials={user?.initials} userName={user?.name} userRole={user?.role} canPost={user?.role !== "vaquero"}/>
        </div>
        {s.coordenadas&&<div style={S.card}><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>GPS</div><div style={{fontSize:12,color:"#94a3b8",fontFamily:"monospace"}}>{s.coordenadas}</div></div>}
        {canEditSystemDetails&&(
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button onClick={()=>{setForm({...s});setShowForm(true);}} style={{flex:1,padding:13,borderRadius:11,border:"1px solid rgba(13,148,136,.3)",background:"rgba(13,148,136,.06)",color:"#0d9488",fontWeight:700,fontSize:13,cursor:"pointer"}}>{lang==="es"?"✏️ Editar Sistema":"✏️ Edit System"}</button>
            {canEditReadings&&<button onClick={()=>{if(window.confirm(lang==="es"?`¿Archivar ${s.id}? El sistema quedará inactivo y desaparecerá de las vistas de capitanes.`:`Archive ${s.id}? The system will become inactive and disappear from captains' views.`)){setSystems(prev=>prev.map(x=>x.id===s.id?{...x,estado:"Archivado"}:x));logActivity({actor:user?.initials,action:'system_archived',sistema:s.id,note:`Sistema ${s.id} archivado (${s.tipo} · ${s.region})`});setSelected(null);}}} style={{padding:13,borderRadius:11,border:"1px solid rgba(248,113,113,.3)",background:"rgba(248,113,113,.06)",color:"#f87171",fontWeight:700,fontSize:13,cursor:"pointer"}}>🗑️</button>}
          </div>
        )}
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
            <div><label style={S.label}>{lang==="es"?"Polígono #":"Polygon #"}</label><select value={form.poligono} onChange={e=>F("poligono",parseInt(e.target.value))} style={{...S.input,appearance:"none"}}>{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
          </div>
        </div>,
          <div style={S.card}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={S.label}>Tipo</label>
              <AddableSelect value={form.tipo} onChange={v=>F("tipo",v)} options={tipos}
                onAddOption={v=>setTipos(prev=>[...prev,v])} lang={lang}/>
            </div>
            <div><label style={S.label}>{lang==="es"?"Módulos":"Modules"}</label><select value={form.modulos} onChange={e=>F("modulos",parseInt(e.target.value))} style={{...S.input,appearance:"none"}}>{Array.from({length:16},(_,i)=><option key={i} value={i}>{i}</option>)}</select></div>
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
              <div>
                <label style={S.label}>Capitán</label>
                <select value={addingCrewFor==='capitan'?'__new__':form.capitan}
                  onChange={e=>{if(e.target.value==='__new__'){setAddingCrewFor('capitan');setNewCrewForm({name:'',initials:'',role:'Capitán'});}else{F("capitan",e.target.value);setAddingCrewFor(null);}}}
                  style={{...S.input,appearance:"none"}}>
                  <option value="">–</option>
                  {[...CREW,...extraCrew].map(c=><option key={c.initials} value={c.initials}>{c.initials} – {c.name.split(" ")[0]}</option>)}
                  <option value="__new__">+ Nuevo</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Buceador</label>
                <select value={addingCrewFor==='buceador'?'__new__':form.buceador}
                  onChange={e=>{if(e.target.value==='__new__'){setAddingCrewFor('buceador');setNewCrewForm({name:'',initials:'',role:'Buceador'});}else{F("buceador",e.target.value);setAddingCrewFor(null);}}}
                  style={{...S.input,appearance:"none"}}>
                  <option value="">–</option>
                  {[...CREW,...extraCrew].map(c=><option key={c.initials} value={c.initials}>{c.initials} – {c.name.split(" ")[0]}</option>)}
                  <option value="__new__">+ Nuevo</option>
                </select>
              </div>
            </div>
            {addingCrewFor && (
              <div style={{marginTop:10,background:"rgba(139,92,246,.06)",border:"1px solid rgba(139,92,246,.2)",borderRadius:8,padding:10}}>
                <div style={{fontSize:10,color:"#a78bfa",fontWeight:700,marginBottom:8}}>{lang==="es"?"Nuevo integrante":"New hire"}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:6,marginBottom:6}}>
                  <input placeholder={lang==="es"?"Nombre completo":"Full name"} value={newCrewForm.name} onChange={e=>setNewCrewForm(p=>({...p,name:e.target.value}))} style={{...S.input,fontSize:12}}/>
                  <input placeholder="Iniciales" maxLength={4} value={newCrewForm.initials} onChange={e=>setNewCrewForm(p=>({...p,initials:e.target.value.toUpperCase()}))} style={{...S.input,fontSize:12}}/>
                </div>
                <select value={newCrewForm.role} onChange={e=>setNewCrewForm(p=>({...p,role:e.target.value}))} style={{...S.input,appearance:"none",fontSize:12,marginBottom:6}}>
                  <option value="Buceador">Buceador</option>
                  <option value="Capitán">Capitán</option>
                </select>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={saveNewCrew} disabled={!newCrewForm.name||!newCrewForm.initials||newCrewSaving}
                    style={{fontSize:10,padding:"3px 10px",borderRadius:6,border:"none",background:"#8b5cf6",color:"#fff",fontWeight:700,cursor:"pointer",opacity:(!newCrewForm.name||!newCrewForm.initials||newCrewSaving)?.5:1}}>
                    {newCrewSaving?(lang==="es"?"Guardando…":"Saving…"):(lang==="es"?"Guardar":"Save")}
                  </button>
                  <button onClick={()=>{setAddingCrewFor(null);setNewCrewForm({name:'',initials:'',role:'Buceador'});}} style={{fontSize:10,padding:"3px 8px",borderRadius:6,border:"1px solid rgba(100,116,139,.3)",background:"none",color:"#64748b",cursor:"pointer"}}>{lang==="es"?"Cancelar":"Cancel"}</button>
                </div>
              </div>
            )}
          </div>,
          <div style={S.card}>
          <div style={{marginBottom:10}}><label style={S.label}>{lang==="es"?"Familia / Propietario":"Family / Owner"}</label><input value={form.familia} onChange={e=>F("familia",e.target.value)} style={S.input}/></div>
          <div style={{marginBottom:10}}><label style={S.label}>GPS</label><input value={form.coordenadas} onChange={e=>F("coordenadas",e.target.value)} placeholder="N 09°07'34 O 082°03'58" style={S.input}/></div>
          <div style={{marginBottom:10}}><label style={S.label}>{lang==="es"?"Fecha Instalación / Siembra":"Install / Plant Date"}</label><input type="date" value={form.fechaInstalacion} onChange={e=>F("fechaInstalacion",e.target.value)} style={{...S.input,colorScheme:"dark"}}/></div>
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
          <div><label style={S.label}>Estado</label><select value={form.estado} onChange={e=>F("estado",e.target.value)} style={{...S.input,appearance:"none"}}><option>Activo</option><option>Retirado</option><option>Archivado</option></select></div>
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
          <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>{systems.filter(s=>s.estado==="Activo").length} {lang==="es"?"activos":"active"} · {archivedFiltered.length>0?`${archivedFiltered.length} archivados · `:""}{systems.length} total</p>
        </div>
        {canAddSystem&&<button onClick={()=>{setForm(EMPTY);setShowForm(true);}} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#0d9488,#0f766e)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Icon name="plus" size={14} color="#fff"/>{lang==="es"?"Nuevo":"New"}</button>}
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:12}}>
        {["all",...regions].map(r=>{ const c=r==="all"?"#94a3b8":regionColor[r]||"#94a3b8"; return <button key={r} onClick={()=>setFilterRegion(r)} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:`1px solid ${filterRegion===r?c:"rgba(148,163,184,.12)"}`,background:filterRegion===r?`${c}18`:"transparent",color:filterRegion===r?c:"#64748b",fontWeight:600,fontSize:11,cursor:"pointer"}}>{r==="all"?(lang==="es"?"Todas":"All"):r}</button>; })}
        {retiredRegions.map(r=><button key={`retired-${r}`} onClick={()=>setFilterRegion(r)} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:`1px solid ${filterRegion===r?"rgba(148,163,184,.35)":"rgba(148,163,184,.08)"}`,background:filterRegion===r?"rgba(148,163,184,.1)":"transparent",color:"#475569",fontWeight:600,fontSize:11,cursor:"pointer",textDecoration:"line-through",opacity:.65}}>{r}</button>)}
      </div>

      {/* ── Search + Sort bar ─────────────────────────────────────────────── */}
      <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
        <input
          value={sysSearch} onChange={e=>setSysSearch(e.target.value)}
          placeholder={lang==="es"?"Buscar sistema, lugar, capitán…":"Search system, site, captain…"}
          style={{...S.input,flex:1,fontSize:12,padding:"7px 12px"}}/>
        <select value={sysSort} onChange={e=>{setSysSort(e.target.value);if(e.target.value!=='region'&&sysSortDir==='asc')setSysSortDir('desc');}}
          style={{...S.input,appearance:"none",fontSize:11,padding:"7px 10px",flexShrink:0,width:"auto"}}>
          <option value="region">{lang==="es"?"Región":"Region"}</option>
          <option value="biomass">{lang==="es"?"Biomasa":"Biomass"}</option>
          <option value="tdc">TDC</option>
          <option value="name">{lang==="es"?"Nombre":"Name"}</option>
        </select>
        <button onClick={()=>setSysSortDir(d=>d==='desc'?'asc':'desc')}
          title={sysSortDir==='desc'?"Ascendente":"Descendente"}
          style={{padding:"7px 10px",borderRadius:9,border:"1px solid rgba(148,163,184,.15)",background:"rgba(255,255,255,.04)",color:"#94a3b8",fontSize:13,cursor:"pointer",flexShrink:0}}>
          {sysSortDir==='desc'?"↓":"↑"}
        </button>
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

      {useFlat ? (
        <div style={{marginBottom:18}}>
          {activeSorted.map(s=>{
            const rc = s._tdc===null?"#475569":s._tdc>=2.5?"#4ade80":s._tdc>=0?"#fb923c":"#f87171";
            return (
              <div key={s.id} style={{...S.card,borderLeft:`3px solid ${regionColor[s.region]||"#334155"}`,cursor:"pointer"}} onClick={()=>setSelected(s.id)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${regionColor[s.region]||"#334155"}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:800,color:regionColor[s.region]||"#94a3b8"}}>{s.id}</span></div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{s.pueblo}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{s.region} · {s.capitan||"–"}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:rc,fontFamily:"monospace"}}>{s._tdc!==null?`${s._tdc>=0?"+":""}${s._tdc}%`:"—"}</div>
                    {s._biomass>0&&<div style={{fontSize:10,color:"#64748b"}}>{(s._biomass/1000).toFixed(2)}kg</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        Object.entries(grouped).map(([region,polygons])=>(
          <div key={region} style={{marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:regionColor[region]}}/>
              <span style={{fontSize:14,fontWeight:800,color:"#e2e8f0"}}>{region}</span>
            </div>
            {Object.entries(polygons).sort().map(([pol,sysList])=>(
              <div key={pol} style={{marginBottom:10}}>
                <div style={{fontSize:10,color:"#64748b",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:.7}}>{pol} · Capitán: {sysList[0]?.capitan||"–"}</div>
                {sysList.map(s=>(
                  <div key={s.id} style={{...S.card,borderLeft:`3px solid ${regionColor[s.region]||"#334155"}`,cursor:"pointer"}} onClick={()=>setSelected(s.id)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:10,background:`${regionColor[s.region]}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:800,color:regionColor[s.region]}}>{s.id}</span></div>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{s.pueblo}</div>
                          <div style={{fontSize:11,color:"#64748b"}}>{s.tipo} · {s.modulos} {lang==="es"?"módulos":"modules"} · {s.buceador||"–"}</div>
                        </div>
                      </div>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:"rgba(74,222,128,.1)",color:"#4ade80",fontWeight:600}}>{s.estado}</span>
                    </div>
                    {s.coordenadas&&<div style={{marginTop:5,fontSize:10,color:"#475569",fontFamily:"monospace"}}>{s.coordenadas}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))
      )}

      {/* ── Retired systems — collapsible ──────────────────────────────────── */}
      {retiredFiltered.length > 0 && (
        <div style={{marginTop:8}}>
          <button onClick={()=>setRetiredOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"rgba(148,163,184,.06)",border:"0.5px solid rgba(148,163,184,.12)",borderRadius:10,padding:"10px 14px",cursor:"pointer",color:"#64748b",fontWeight:700,fontSize:12}}>
            <span style={{flex:1,textAlign:"left"}}>🗂 {lang==="es"?"Retirados":"Retired"} ({retiredFiltered.length})</span>
            <span>{retiredOpen?"▲":"▼"}</span>
          </button>
          {retiredOpen && retiredFiltered.map(s=>(
            <div key={s.id} style={{...S.card,borderLeft:"3px solid #334155",cursor:"pointer",opacity:0.6,marginTop:6}} onClick={()=>setSelected(s.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"rgba(148,163,184,.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:800,color:"#64748b"}}>{s.id}</span></div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#94a3b8"}}>{s.pueblo||s.id}</div>
                    <div style={{fontSize:11,color:"#475569"}}>{s.tipo} · {s.region} · {s.capitan||"–"}</div>
                  </div>
                </div>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:"rgba(148,163,184,.08)",color:"#475569",fontWeight:600}}>Retirado</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Archived systems — collapsible ─────────────────────────────────── */}
      {archivedFiltered.length > 0 && (
        <div style={{marginTop:8}}>
          <button onClick={()=>setArchivedOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"rgba(148,163,184,.06)",border:"0.5px solid rgba(148,163,184,.12)",borderRadius:10,padding:"10px 14px",cursor:"pointer",color:"#64748b",fontWeight:700,fontSize:12}}>
            <span style={{flex:1,textAlign:"left"}}>📦 {lang==="es"?"Archivados":"Archived"} ({archivedFiltered.length})</span>
            <span>{archivedOpen?"▲":"▼"}</span>
          </button>
          {archivedOpen && archivedFiltered.map(s=>(
            <div key={s.id} style={{...S.card,borderLeft:"3px solid #334155",cursor:"pointer",opacity:0.7,marginTop:6}} onClick={()=>setSelected(s.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"rgba(148,163,184,.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:800,color:"#64748b"}}>{s.id}</span></div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#94a3b8"}}>{s.pueblo}</div>
                    <div style={{fontSize:11,color:"#475569"}}>{s.tipo} · {s.region}</div>
                  </div>
                </div>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,background:"rgba(148,163,184,.08)",color:"#475569",fontWeight:600}}>Archivado</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function CatalogManager({ lang, regions, setRegions, retiredRegions=[], setRetiredRegions=()=>{}, tipos, setTipos, materiales, setMateriales, semillas, setSemillas, canSeeRetired=false }) {
  const [drafts, setDrafts] = useState({ regions:"", tipos:"", materiales:"", semillas:"" });
  const [retiredOpen, setRetiredOpen] = useState(false);
  const D = (k,v) => setDrafts(p=>({...p,[k]:v}));

  const addItem = async (key, setList) => {
    const val = drafts[key].trim();
    if (!val) return;
    setList(prev => prev.includes(val) ? prev : [...prev, val]);
    D(key, "");
    if (key === "regions") {
      try { await sbStatic.from('regions').upsert([{ name: val, active: true }], { onConflict: 'name' }); } catch(e) { console.warn('region upsert failed', e); }
    }
  };

  const removeItem = async (key, setList, item) => {
    const confirmMsg = lang==="es" ? `¿Eliminar "${item}"?` : `Remove "${item}"?`;
    if (!window.confirm(confirmMsg)) return;
    setList(prev => prev.filter(v => v !== item));
    if (key === "regions") {
      try { await sbStatic.from('regions').delete().eq('name', item); } catch(e) { console.warn('region delete failed', e); }
    }
  };

  const retireRegion = async (name) => {
    setRegions(prev => prev.filter(r => r !== name));
    setRetiredRegions(prev => prev.includes(name) ? prev : [...prev, name]);
    try { await sbStatic.from('regions').upsert([{ name, active: false }], { onConflict: 'name' }); } catch(e) { console.warn('region retire failed', e); }
  };

  const restoreRegion = async (name) => {
    setRetiredRegions(prev => prev.filter(r => r !== name));
    setRegions(prev => prev.includes(name) ? prev : [...prev, name].sort());
    try { await sbStatic.from('regions').upsert([{ name, active: true }], { onConflict: 'name' }); } catch(e) { console.warn('region restore failed', e); }
  };

  const cats = [
    { key:"regions",    label:lang==="es"?"Sitios / Regiones":"Sites / Regions", list:regions,    setList:setRegions    },
    { key:"semillas",   label:lang==="es"?"Tipos de Semilla":"Seed Types",        list:semillas,   setList:setSemillas   },
    { key:"tipos",      label:lang==="es"?"Tipos de Sistema":"System Types",      list:tipos,      setList:setTipos      },
    { key:"materiales", label:lang==="es"?"Materiales":"Materials",               list:materiales, setList:setMateriales },
  ];

  return (
    <div style={S.card}>
      <div style={{fontSize:11,color:"#64748b",fontWeight:700,marginBottom:14,textTransform:"uppercase",letterSpacing:.6}}>
        ⚙️ {lang==="es"?"Catálogo":"Catalog"}
      </div>
      {cats.map(cat => (
        <div key={cat.key} style={{marginBottom:16}}>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,marginBottom:8}}>{cat.label}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
            {cat.list.map(item => (
              <div key={item} style={{display:"flex",alignItems:"center",gap:4,
                padding:"4px 10px",borderRadius:20,
                background:"rgba(13,148,136,.08)",border:"1px solid rgba(13,148,136,.2)"}}>
                <span style={{fontSize:12,color:"#94a3b8"}}>{item}</span>
                {cat.key === "regions"
                  ? <button onClick={() => retireRegion(item)}
                      title="Retirar región"
                      style={{width:14,height:14,borderRadius:"50%",border:"none",
                        background:"rgba(251,146,60,.25)",color:"#fb923c",
                        fontSize:9,lineHeight:1,cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>↓</button>
                  : <button onClick={() => removeItem(cat.key, cat.setList, item)}
                      style={{width:14,height:14,borderRadius:"50%",border:"none",
                        background:"rgba(239,68,68,.25)",color:"#f87171",
                        fontSize:9,lineHeight:1,cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>✕</button>
                }
              </div>
            ))}
          </div>
          {/* Retired regions — visible to admin/consultor only */}
          {cat.key === "regions" && canSeeRetired && retiredRegions.length > 0 && (
            <div style={{marginBottom:8}}>
              <button onClick={()=>setRetiredOpen(o=>!o)}
                style={{display:"flex",alignItems:"center",gap:6,width:"100%",
                  background:"rgba(148,163,184,.04)",border:"0.5px solid rgba(148,163,184,.12)",
                  borderRadius:8,padding:"5px 10px",cursor:"pointer",
                  color:"#64748b",fontWeight:700,fontSize:11,marginBottom:4}}>
                <span style={{flex:1,textAlign:"left"}}>🗂 Retiradas ({retiredRegions.length})</span>
                <span>{retiredOpen?"▲":"▼"}</span>
              </button>
              {retiredOpen && (
                <div style={{display:"flex",flexWrap:"wrap",gap:6,paddingLeft:4}}>
                  {retiredRegions.map(name => (
                    <div key={name} style={{display:"flex",alignItems:"center",gap:4,
                      padding:"4px 10px",borderRadius:20,opacity:0.6,
                      background:"rgba(148,163,184,.06)",border:"1px solid rgba(148,163,184,.15)"}}>
                      <span style={{fontSize:12,color:"#64748b"}}>{name}</span>
                      <button onClick={() => restoreRegion(name)}
                        title="Restaurar región"
                        style={{width:14,height:14,borderRadius:"50%",border:"none",
                          background:"rgba(74,222,128,.2)",color:"#4ade80",
                          fontSize:9,lineHeight:1,cursor:"pointer",
                          display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>↑</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:6}}>
            <input
              value={drafts[cat.key]}
              onChange={e=>D(cat.key,e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") addItem(cat.key, cat.setList); }}
              placeholder={lang==="es"?`Nuevo ${cat.label.split("/")[0].trim().toLowerCase()}…`:`New ${cat.label.split("/")[0].trim().toLowerCase()}…`}
              style={{...S.input,flex:1,fontSize:12,padding:"6px 10px"}}
            />
            <button onClick={()=>addItem(cat.key, cat.setList)}
              disabled={!drafts[cat.key].trim()}
              style={{padding:"6px 14px",borderRadius:9,border:"none",
                background:drafts[cat.key].trim()?"linear-gradient(135deg,#0d9488,#0f766e)":"rgba(13,148,136,.1)",
                color:drafts[cat.key].trim()?"#fff":"#334155",fontWeight:700,fontSize:12,cursor:drafts[cat.key].trim()?"pointer":"not-allowed"}}>
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ user, lang, setLang, onLogout,
  regions=DEFAULT_REGIONS, setRegions=()=>{},
  retiredRegions=[], setRetiredRegions=()=>{},
  tipos=DEFAULT_TIPOS,   setTipos=()=>{},
  materiales=DEFAULT_MATERIALES, setMateriales=()=>{},
  semillas=DEFAULT_SEMILLAS,     setSemillas=()=>{},
}) {
  const [showSyncTest, setShowSyncTest] = useState(false);
  const roleColors = { ceo:"#f59e0b", consultant:"#a78bfa", supervisor:"#0d9488", vaquero:"#4ade80", researcher:"#818cf8" };
  const roleLabels = { ceo:"CEO", consultant:"Consultor", supervisor:"Supervisor", vaquero:"Vaquero", researcher:"Investigador" };
  const canTest = ["ceo","consultant","supervisor"].includes(user.role);
  const canExport = ["admin","consultor","director"].includes(user.role);
  const canManageCatalog = ["admin","consultor","director"].includes(user.role);

  const today = new Date().toISOString().slice(0,10);
  const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10);
  const [exportFrom, setExportFrom] = useState(thirtyDaysAgo);
  const [exportTo,   setExportTo]   = useState(today);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError,   setExportError]   = useState("");

  async function handleExport() {
    setExportLoading(true);
    setExportError("");
    try {
      const { data, error } = await sbStatic
        .from('lecturas')
        .select('sistema,fecha,tipo,peso,sueltos,ph,temp,salinidad,condiciones,notas,cosechada,sembrado,logged_by')
        .gte('fecha', exportFrom)
        .lte('fecha', exportTo)
        .order('fecha')
        .order('sistema');
      if (error) throw error;
      if (!data?.length) { setExportError(lang==="es"?"Sin datos en ese rango.":"No data in that range."); setExportLoading(false); return; }

      // Load SheetJS if not already loaded
      if (!window.XLSX) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const XLSX = window.XLSX;

      const headers = ['Sistema','Fecha','Tipo','Peso (g)','Sueltos (g)','pH','Temp (°C)','Salinidad (PSU)','Condiciones','Notas','Cosechada (g)','Sembrado (g)','Registrado por'];
      const numCols = new Set([3,4,5,6,7,10,11]); // 0-indexed columns that are numeric

      const rows = data.map(r => [
        r.sistema ?? '', r.fecha ?? '', r.tipo ?? '',
        r.peso ?? null, r.sueltos ?? null,
        r.ph ?? null, r.temp ?? null, r.salinidad ?? null,
        r.condiciones ?? '', r.notas ?? '',
        r.cosechada ?? null, r.sembrado ?? null,
        r.logged_by ?? '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Apply comma number format to numeric cells
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let r = 1; r <= range.e.r; r++) {
        numCols.forEach(c => {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (ws[addr] && ws[addr].t === 'n') ws[addr].z = '#,##0.00';
        });
      }

      // Column widths
      ws['!cols'] = [
        {wch:10},{wch:12},{wch:12},{wch:11},{wch:11},
        {wch:8},{wch:11},{wch:14},{wch:14},{wch:32},
        {wch:13},{wch:13},{wch:15},
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lecturas');
      XLSX.writeFile(wb, `lecturas_${exportFrom}_${exportTo}.xlsx`);
    } catch(e) { setExportError(e.message||"Error"); }
    setExportLoading(false);
  }

  if (showSyncTest) return (
    <div style={{padding:"0 0 100px"}}>
      <button onClick={()=>setShowSyncTest(false)}
        style={{padding:"10px 16px",fontSize:12,fontWeight:700,color:"#64748b",background:"transparent",border:"none",cursor:"pointer"}}>
        ← {lang==="es"?"Volver al perfil":"Back to profile"}
      </button>
      <SyncTest lang={lang}/>
    </div>
  );

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
      {canTest && (
        <button onClick={()=>setShowSyncTest(true)}
          style={{width:"100%",padding:13,borderRadius:12,border:"1px solid rgba(13,148,136,.15)",background:"rgba(13,148,136,.04)",color:"#0d9488",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}>
          🔬 {lang==="es"?"Test de sincronización":"Sync Test"}
        </button>
      )}
      {canExport && (
        <div style={S.card}>
          <div style={{fontSize:11,color:"#64748b",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.6}}>
            📥 {lang==="es"?"Exportar Lecturas":"Export Readings"}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div>
              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Desde":"From"}</div>
              <input type="date" value={exportFrom} onChange={e=>setExportFrom(e.target.value)}
                style={{...S.input,colorScheme:"dark",fontSize:12}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{lang==="es"?"Hasta":"To"}</div>
              <input type="date" value={exportTo} onChange={e=>setExportTo(e.target.value)}
                style={{...S.input,colorScheme:"dark",fontSize:12}}/>
            </div>
          </div>
          {exportError && <div style={{fontSize:11,color:"#f87171",marginBottom:8}}>{exportError}</div>}
          <button onClick={handleExport} disabled={exportLoading||!exportFrom||!exportTo}
            style={{width:"100%",padding:11,borderRadius:10,border:"1px solid rgba(13,148,136,.3)",background:exportLoading?"rgba(13,148,136,.04)":"rgba(13,148,136,.1)",color:"#0d9488",fontWeight:700,fontSize:13,cursor:exportLoading?"wait":"pointer",opacity:(!exportFrom||!exportTo)?.5:1}}>
            {exportLoading?(lang==="es"?"Descargando…":"Downloading…"):(lang==="es"?"⬇ Descargar Excel":"⬇ Download Excel")}
          </button>
          <div style={{fontSize:10,color:"#475569",marginTop:6}}>
            {lang==="es"?"Incluye: sistema, fecha, tipo, peso, parámetros, cosecha/siembra, registrado por":"Includes: system, date, type, weight, parameters, harvest/seed, logged by"}
          </div>
        </div>
      )}
      {canManageCatalog && (
        <CatalogManager
          lang={lang}
          regions={regions} setRegions={setRegions}
          retiredRegions={retiredRegions} setRetiredRegions={setRetiredRegions}
          tipos={tipos} setTipos={setTipos}
          materiales={materiales} setMateriales={setMateriales}
          semillas={semillas} setSemillas={setSemillas}
          canSeeRetired={["admin","consultor"].includes(user.role)}
        />
      )}
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
        "Crecimiento %/día":r.tdc !== null ? r.tdc : "",
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
          <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>{lang==="es"?"Crecimiento":"Growth Rate"}</div>
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

// ─── DEVICE DETECTION ────────────────────────────────────────────────────────
function useDeviceType() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const isIPad = /iPad/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIPad || width >= 768) return 'tablet';
  return 'mobile';
}

// ─── BOTTOM NAV — role-aware ──────────────────────────────────────────────────
function BottomNav({ tab, setTab, role, lang, unreadNotes = 0 }) {
  const deviceType = useDeviceType();
  const bellTab = { id:"notas", icon:"bell", label:"Notas", badge: unreadNotes };
  const navConfig = {
    vaquero: [
      { id:"vigilancia",icon:"wave",    label: "Vigilancia" },
      { id:"inicio",   icon:"task",     label: lang==="es"?"Inicio":"Home" },
      { id:"score",    icon:"star",     label: lang==="es"?"Mi Puntaje":"My Score" },
      { id:"sistemas", icon:"grid",     label: "Sistemas" },
      { id:"perfil",   icon:"user",     label: lang==="es"?"Perfil":"Profile" },
      bellTab,
    ],
    capitan: [
      { id:"tareas",   icon:"task",     label: "Tareas" },
      { id:"sistemas", icon:"grid",     label: "Sistemas" },
      { id:"equipo",   icon:"users",    label: "Equipo" },
      { id:"perfil",   icon:"user",     label: lang==="es"?"Perfil":"Profile" },
      bellTab,
    ],
    supervisor: [
      { id:"tareas",   icon:"task",     label: "Tareas" },
      { id:"dashboard",icon:"chart",    label: "Dashboard" },
      { id:"plan",     icon:"calendar", label: "Plan" },
      { id:"sistemas", icon:"grid",     label: "Sistemas" },
      { id:"equipo",   icon:"users",    label: "Equipo" },
      { id:"perfil",   icon:"user",     label: lang==="es"?"Perfil":"Profile" },
      bellTab,
    ],
    director: [
      { id:"tareas",   icon:"task",     label: "Tareas" },
      { id:"dashboard",icon:"chart",    label: "Dashboard" },
      { id:"plan",     icon:"calendar", label: "Plan" },
      { id:"sistemas", icon:"grid",     label: "Sistemas" },
      { id:"equipo",   icon:"users",    label: "Equipo" },
      { id:"perfil",   icon:"user",     label: lang==="es"?"Perfil":"Profile" },
      bellTab,
    ],
    default: [
      { id:"dashboard",icon:"chart",    label: "Dashboard" },
      { id:"plan",     icon:"calendar", label: "Plan" },
      { id:"sistemas", icon:"grid",     label: "Sistemas" },
      { id:"equipo",   icon:"users",    label: "Equipo" },
      { id:"perfil",   icon:"user",     label: lang==="es"?"Perfil":"Profile" },
      bellTab,
    ],
  };
  const tabs = navConfig[role] || navConfig.default;
  const isTablet = deviceType === 'tablet';

  // ── Tablet: left sidebar ──────────────────────────────────────────────────
  if (isTablet) {
    return (
      <nav style={{position:"fixed",left:0,top:0,bottom:0,width:82,
        background:"rgba(2,8,24,.98)",borderRight:"1px solid rgba(148,163,184,.08)",
        display:"flex",flexDirection:"column",alignItems:"stretch",
        paddingTop:32,paddingBottom:16,gap:2,
        backdropFilter:"blur(20px)",zIndex:100,overflowY:"auto"}}>
        {/* Logo mark */}
        <div style={{textAlign:"center",marginBottom:20,paddingBottom:16,borderBottom:"1px solid rgba(148,163,184,.07)"}}>
          <span style={{fontSize:20}}>🌊</span>
        </div>
        {tabs.map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id)}
            role="tab" aria-selected={tab===item.id} aria-label={item.label}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,
              padding:"13px 4px",background:"none",border:"none",cursor:"pointer",
              borderLeft:`3px solid ${tab===item.id?"#0d9488":"transparent"}`,
              background:tab===item.id?"rgba(13,148,136,.08)":"transparent",
              transition:"all .15s"}}>
            <Icon name={item.icon} size={26} color={tab===item.id?"#0d9488":"#475569"}/>
            <span style={{fontSize:10,color:tab===item.id?"#0d9488":"#64748b",
              fontWeight:tab===item.id?700:400,textAlign:"center",lineHeight:1.2,
              maxWidth:72,wordBreak:"break-word"}}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    );
  }

  // ── Mobile: bottom nav ────────────────────────────────────────────────────
  return (
    <nav className="vdm-bottom-nav" style={{position:"fixed",bottom:0,left:0,right:0,
      background:"rgba(2,8,24,.96)",borderTop:"1px solid rgba(148,163,184,.07)",
      display:"flex",justifyContent:"space-around",
      padding:"6px 0 max(10px,env(safe-area-inset-bottom))",
      backdropFilter:"blur(20px)",zIndex:100}}>
      {tabs.map(item=>(
        <button key={item.id} onClick={()=>setTab(item.id)}
          role="tab" aria-selected={tab===item.id} aria-label={item.label}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
            gap:4,background:"none",border:"none",cursor:"pointer",padding:"6px 0",
            minWidth:44,minHeight:44,position:"relative"}}>
          <Icon name={item.icon} size={24} color={tab===item.id?"#0d9488":"#475569"}/>
          {item.badge>0&&<span style={{position:"absolute",top:2,right:"calc(50% - 18px)",background:"#f87171",color:"#fff",fontSize:8,fontWeight:800,borderRadius:8,padding:"1px 4px",lineHeight:1.4}}>{item.badge}</span>}
          <span style={{fontSize:10,color:tab===item.id?"#0d9488":"#475569",
            fontWeight:tab===item.id?700:400}}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth — persist to localStorage, role-aware auto-logout ──────────────────
  const savedUser = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('vdm_user'));
      if (!u) return null;
      const legacyRoles = { ceo: 'admin', consultant: 'consultor', supervisor: 'director' };
      if (legacyRoles[u.role]) u.role = legacyRoles[u.role];
      return u;
    } catch { return null; }
  })();

  const deviceType = useDeviceType();
  const isTablet   = deviceType === 'tablet';

  const [lang, setLang]               = useState(localStorage.getItem('vdm_lang') || "es");
  const [user, setUser]               = useState(savedUser);
  const [tab, setTab]                 = useState(
    savedUser?.role === "vaquero" ? "vigilancia" :
    savedUser?.role === "capitan" ? "tareas" :
    savedUser?.role === "director" ? "tareas" :
    "dashboard"
  );
  const [personalView, setPersonalView] = useState(null);
  const [deepLinkSystem, setDeepLinkSystem] = useState(null); // system ID to auto-select in SistemasTab
  const [unreadNotes, setUnreadNotes] = useState(0);
  const [notesSubView, setNotesSubView] = useState('notas'); // 'notas' | 'actividad'

  // ── Unified navigation — person ↔ tasks ↔ systems ─────────────────────────
  const navigateTo = useCallback((target, id) => {
    if (target === "sistema") {
      setDeepLinkSystem(id);
      setTab("sistemas");
      setPersonalView(null);
    } else if (target === "persona") {
      setPersonalView(id);
      setTab("equipo");
    } else if (target === "tareas" || target === "plan") {
      setTab("plan");
      setPersonalView(null);
    } else if (target === "dashboard") {
      if (["admin","consultor","director"].includes(user?.role)) setTab("dashboard");
    } else {
      setTab(target);
    }
  }, [user]);
  const inactivityTimer = useRef(null);

  // Auto-logout timeouts by role (ms)
  const INACTIVITY_MS = { vaquero: 24*60*60*1000, supervisor: 24*60*60*1000, ceo: 24*60*60*1000, consultant: 24*60*60*1000 };

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
      if (cached) return JSON.parse(cached);
      return SYSTEMS_DATA;
    } catch { return SYSTEMS_DATA; }
  });
  const [readings, setReadings] = useState(() => {
    try {
      const cached = localStorage.getItem('aq_readings_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [assignedTasks, setAssignedTasks]     = useState(SEED_ASSIGNED_TASKS);
  const alerts        = useMemo(() => computeAlerts(assignedTasks, readings, systems), [assignedTasks, readings, systems]);
  const visibleAlerts = useMemo(() => alertsForRole(alerts, user?.role), [alerts, user?.role]);
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
  const [regions,        setRegions]        = useState(() => {
    try { const c = localStorage.getItem('aq_cat_regions');         return c ? JSON.parse(c) : DEFAULT_REGIONS; }    catch { return DEFAULT_REGIONS; }
  });
  const [retiredRegions, setRetiredRegions] = useState(() => {
    try { const c = localStorage.getItem('aq_cat_retired_regions'); return c ? JSON.parse(c) : []; }               catch { return []; }
  });
  const [tipos,      setTipos]      = useState(() => {
    try { const c = localStorage.getItem('aq_cat_tipos');      return c ? JSON.parse(c) : DEFAULT_TIPOS; }      catch { return DEFAULT_TIPOS; }
  });
  const [materiales, setMateriales] = useState(() => {
    try { const c = localStorage.getItem('aq_cat_materiales'); return c ? JSON.parse(c) : DEFAULT_MATERIALES; } catch { return DEFAULT_MATERIALES; }
  });
  const [semillas,   setSemillas]   = useState(() => {
    try { const c = localStorage.getItem('aq_cat_semillas');   return c ? JSON.parse(c) : DEFAULT_SEMILLAS; }   catch { return DEFAULT_SEMILLAS; }
  });
  // Persist catalogs whenever they change
  useEffect(() => { try { localStorage.setItem('aq_cat_regions',         JSON.stringify(regions));        } catch {} }, [regions]);
  useEffect(() => { try { localStorage.setItem('aq_cat_retired_regions', JSON.stringify(retiredRegions)); } catch {} }, [retiredRegions]);
  useEffect(() => { try { localStorage.setItem('aq_cat_tipos',           JSON.stringify(tipos));          } catch {} }, [tipos]);
  useEffect(() => { try { localStorage.setItem('aq_cat_materiales',      JSON.stringify(materiales));     } catch {} }, [materiales]);
  useEffect(() => { try { localStorage.setItem('aq_cat_semillas',        JSON.stringify(semillas));       } catch {} }, [semillas]);

  // ── Sync state ──────────────────────────────────────────────────────────────
  const [online, setOnline]     = useState(navigator.onLine);
  const [syncing, setSyncing]   = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const offlineQueue     = useRef((() => {
    try { return JSON.parse(localStorage.getItem('aq_offline_queue') || '[]'); } catch { return []; }
  })());  // persisted across app restarts
  const syncInProgress   = useRef(false); // guard against concurrent triggerSync calls
  const syncTimer        = useRef(null);
  const pendingReadingIds = useRef(new Set(
    (() => { try { return JSON.parse(localStorage.getItem('aq_pending_ids') || '[]'); } catch { return []; } })()
  ));

  // ── Toast notifications (sync awareness) ──────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type="info") => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-4), { id, msg, type }]); // keep max 5
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

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

  // ── Sync health doctests — continuous monitoring ───────────────────────────
  const syncHealth = useSyncHealth(sb.current, sbReady, online, addToast);

  // ── Sync new regions to Supabase — push any not yet in DB ─────────────────
  const knownRemoteRegions = useRef(new Set());
  useEffect(() => {
    if (!sb.current || !sbReady || !online) return;
    regions.forEach(name => {
      if (!knownRemoteRegions.current.has(name)) {
        sb.current.from('regions').upsert(
          { name, supervisor: null, active: true },
          { onConflict: 'name', ignoreDuplicates: true }
        ).then(({ error }) => {
          if (error) {
            console.warn(`[AquaOps] region push failed for "${name}":`, error.message);
          } else {
            knownRemoteRegions.current.add(name);
            console.log(`[AquaOps] region synced: ${name}`);
          }
        });
      }
    });
  }, [regions, sbReady, online]);

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
      if (offlineQueue.current.length > 0) {
        triggerSync();
      } else {
        pullRemoteData();
      }
    }, 30000);
    return () => clearInterval(id);
  }, [online, user, sbReady]);


  const [initialLoading, setInitialLoading] = useState(true);

  // ── TABLE HEALTH CHECK — runs once on mount, logs missing/broken tables ──────
  useEffect(() => {
    const TABLES = [
      { name: 'lecturas',         critical: true  },
      { name: 'sistemas',         critical: true  },
      { name: 'assigned_tasks',   critical: true  },
      { name: 'usuarios',         critical: true  },
      { name: 'announcements',    critical: false },
      { name: 'weekly_incidents', critical: false },
      { name: 'regions',          critical: false },
      { name: 'sync_health',      critical: false },
    ];
    (async () => {
      console.group('[AquaOps] Supabase table health check');
      let allOk = true;
      for (const t of TABLES) {
        const { error } = await sbStatic.from(t.name).select('id').limit(1);
        if (error) {
          allOk = false;
          const tag = t.critical ? '🔴 MISSING' : '🟡 WARN';
          console.warn(`${tag} ${t.name}: ${error.message}`);
        } else {
          console.log(`✅ ${t.name}`);
        }
      }
      if (allOk) console.log('All tables reachable.');
      console.groupEnd();
    })();
  }, []);

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
        sb.current.from('lecturas').select('*').gte('fecha', (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0,10); })()).order('fecha'),
      ]);
      // Systems table — query separately so failures don't break other pulls
      let sysRes = { data: null, error: null };
      try {
        sysRes = await sb.current.from('sistemas').select('*').order('id');
        if (sysRes.error) {
          console.warn('[AquaOps] systems pull error:', sysRes.error.message, sysRes.error.code);
        } else {
          console.log(`[AquaOps] systems pulled: ${sysRes.data?.length || 0} rows`);
        }
      } catch (e) {
        console.warn('[AquaOps] systems pull exception:', e);
      }

      // Regions table — pull and merge with local
      let regRes = { data: null, error: null };
      try {
        regRes = await sb.current.from('regions').select('*').order('name');
        if (regRes.error) {
          console.warn('[AquaOps] regions pull error:', regRes.error.message);
        } else if (regRes.data?.length) {
          const activeRegions  = regRes.data.filter(r => r.active !== false).map(r => r.name);
          const retiredNames   = regRes.data.filter(r => r.active === false).map(r => r.name);
          setRegions(() => {
            try { localStorage.setItem('aq_cat_regions', JSON.stringify(activeRegions)); } catch {}
            return activeRegions;
          });
          setRetiredRegions(() => {
            try { localStorage.setItem('aq_cat_retired_regions', JSON.stringify(retiredNames)); } catch {}
            return retiredNames;
          });
          console.log(`[AquaOps] regions pulled: ${activeRegions.length} active, ${retiredNames.length} retired`);
        }
      } catch (e) {
        console.warn('[AquaOps] regions pull exception:', e);
      }

      if (tasksRes.data?.length) {
        setAssignedTasks(prev => {
          const localById = Object.fromEntries(prev.map(t => [t.id, t]));
          const remoteIds = new Set(tasksRes.data.map(r => r.id));
          const fromRemote = tasksRes.data.map(r => {
            const local = localById[r.id];
            return {
              id: r.id, assignedTo: r.assigned_to, day: r.day,
              taskType: r.task_type, sistema: r.sistema, region: r.region || "",
              objetivo: r.objetivo, date: r.date, actual: r.actual,
              condicion: r.condicion, voiceNote: null,
              foto: r.foto_url,
              // Local confirmed wins — prevents pull from un-confirming a task mid-flight
              confirmed: local?.confirmed || r.confirmed,
              notas: r.notas || "",
              supportCrew: r.support_crew ? r.support_crew.split(',').map(s => s.trim()).filter(Boolean) : [],
              comentarioVaquero: r.comentario_vaquero || null,
              comentarioFecha:   r.comentario_fecha   || null,
            };
          });
          // Keep local-only tasks (seed tasks not yet pushed to Supabase) and push them now
          const localOnly = prev.filter(t => !remoteIds.has(t.id));
          localOnly.forEach(t => {
            pushItem('assigned_tasks', 'upsert', {
              id: t.id, assigned_to: t.assignedTo,
              day: t.day, task_type: t.taskType,
              sistema: t.sistema || null, objetivo: t.objetivo || null,
              date: t.date, actual: t.actual || null,
              condicion: t.condicion || null, confirmed: t.confirmed || false,
              notas: t.notas || "",
              support_crew: Array.isArray(t.supportCrew) ? t.supportCrew.join(',') : (t.supportCrew || null),
              updated_at: new Date().toISOString(),
            });
          });
          return [...fromRemote, ...localOnly];
        });
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

      // Replace local readings with Supabase data — Supabase is authoritative.
      // Locally-queued (offline) items are preserved by id so they survive the pull.
      if (readRes.data?.length) {
        const pulled = readRes.data.map(r => ({
          id:          r.id,
          sistema:     r.sistema,
          fecha:       r.fecha,
          tipo:        r.tipo || 'vigilancia',
          peso:        r.peso,
          sueltos:     r.sueltos     ?? null,
          tdc:         null,
          salt:        null,
          ph:          r.ph          ?? null,
          salinidad:   r.salinidad   ?? null,
          temp:        r.temp        ?? null,
          condiciones: r.condiciones ?? null,
          aguas:       null,
          notas:       r.notas       || "",
          foto:        null,
          cosechada:   r.cosechada   ?? null,
          sembrado:    r.sembrado    ?? null,
          buoys:       r.buoys       ?? null,
          logged_by:   r.logged_by   ?? null,
          updated_by:  null,
          updated_at:  r.editado_en  ?? null,
        }));
        setReadings(localReadings => {
          const remoteIds = new Set(pulled.map(r => r.id));
          // Clear pending IDs that Supabase now confirms
          for (const id of pendingReadingIds.current) {
            if (remoteIds.has(id)) pendingReadingIds.current.delete(id);
          }
          // Offline-queued reads not yet in Supabase
          const queued = (offlineQueue.current || [])
            .filter(item => item.table === 'lecturas' && item.op !== 'delete' && item.payload?.id && !remoteIds.has(item.payload.id))
            .map(item => item.payload);
          // Pending local reads not yet confirmed by Supabase (survives the pull)
          const pending = localReadings.filter(r => pendingReadingIds.current.has(r.id) && !remoteIds.has(r.id));

          // Recovery: re-queue any pending readings that fell out of the offline queue
          // (happens when triggerSync consumed items without checking Supabase error responses)
          // Skip recovery while a sync is in progress to avoid feedback loops
          const alreadyQueued = new Set((offlineQueue.current || []).map(i => i.payload?.id));
          for (const r of pending) {
            if (!alreadyQueued.has(r.id) && !syncInProgress.current) {
              console.warn('[AquaOps] re-queuing orphaned reading:', r.id);
              offlineQueue.current.push({ table: 'lecturas', op: 'upsert', payload: {
                id: r.id, sistema: r.sistema, fecha: r.fecha,
                tipo: r.tipo ?? 'peso', peso: r.peso ?? null,
                sueltos: r.sueltos ?? null, ph: r.ph ?? null,
                temp: r.temp ?? null, salinidad: r.salinidad ?? null,
                condiciones: r.condiciones ?? null, notas: r.notas ?? '',
                cosechada: r.cosechada ?? null, sembrado: r.sembrado ?? null,
                buoys: r.buoys ?? null, logged_by: r.logged_by ?? null,
              }});
            }
          }
          if (offlineQueue.current.length > 0) {
            setPendingCount(offlineQueue.current.length);
            persistQueue();
          }

          const next = [...pulled, ...queued, ...pending];
          try { localStorage.setItem('aq_readings_cache', JSON.stringify(next)); } catch {}
          return next;
        });
      }

      // Merge remote systems with local — remote wins on conflict by id
      if (sysRes.data?.length) {
        const pulledSys = sysRes.data.map(r => ({
          id:                r.id,
          region:            r.region            || "",
          poligono:          r.poligono          ?? 1,
          pueblo:            r.pueblo            || "",
          tipo:              r.tipo              || "",
          familia:           r.familia           || "",
          profundidad:       r.profundidad       || "",
          materiales:        r.materiales        || "",
          semillas:          r.semillas          || "",
          estado:            r.estado            || "Activo",
          coordenadas:       r.coordenadas       || "",
          fechaInstalacion:  r.fecha_instalacion || "",
          capitan:           r.capitan           || "",
          buceador:          r.buceador          || "",
          modulos:           r.modulos           ?? 0,
          tamano:            r.tamano            || "",
          categoria:         r.categoria         || "",
          fechaCosecha:      r.fecha_cosecha     || null,
          fechaLimpieza:     r.fecha_limpieza    || "",
          notas:             r.notas             || "",
          updated_by:        r.updated_by        ?? null,
        }));
        setSystems(() => {
          const remoteIds = new Set(pulledSys.map(s => s.id));
          const queued = (offlineQueue.current || [])
            .filter(item => item.table === 'sistemas' && item.op !== 'delete' && item.payload?.id && !remoteIds.has(item.payload.id))
            .map(item => item.payload);
          const next = [...pulledSys, ...queued];
          try { localStorage.setItem('aq_systems_cache', JSON.stringify(next)); } catch {}
          return next;
        });
      }

      setLastSync(new Date());

      // Count unread notes since last bell visit
      try {
        const lastRead = localStorage.getItem(`notes_last_read_${user?.initials}`) || '1970-01-01';
        const { count } = await sb.current.from('system_notes').select('id', { count: 'exact', head: true }).gt('created_at', lastRead);
        if (count > 0) setUnreadNotes(count);
      } catch {}
    } catch (e) {
      console.warn('Pull failed:', e.message);
    } finally {
      setSyncing(false);
    }
  };

  const persistQueue = () => {
    try { localStorage.setItem('aq_offline_queue', JSON.stringify(offlineQueue.current)); } catch {}
    try { localStorage.setItem('aq_pending_ids', JSON.stringify([...pendingReadingIds.current])); } catch {}
  };

  // ── PUSH: write one item to Supabase, then refresh dashboard ────────────────
  const pushItem = async (table, op, payload) => {
    if (!sb.current || !online) {
      console.warn(`[AquaOps] pushItem queued (sb=${!!sb.current}, online=${online}):`, table, op, payload?.id);
      offlineQueue.current.push({ table, op, payload });
      setPendingCount(offlineQueue.current.length);
      persistQueue();
      return false;
    }
    try {
      console.log(`[AquaOps] pushItem → ${table}.${op}`, payload?.id);
      let error;
      if (op === 'upsert') {
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
      persistQueue();
      return false;
    }
  };

  // ── SYNC: flush the offline queue ────────────────────────────────────────────
  const triggerSync = async () => {
    if (syncInProgress.current) return; // prevent concurrent runs
    if (!sb.current || offlineQueue.current.length === 0) {
      pullRemoteData();
      return;
    }
    syncInProgress.current = true;
    console.log(`[AquaOps] triggerSync: flushing ${offlineQueue.current.length} queued items`);
    setSyncing(true);
    const queue = [...offlineQueue.current];
    offlineQueue.current = [];
    setPendingCount(0);
    persistQueue();
    let failed = [];
    for (const item of queue) {
      try {
        let res;
        if (item.op === 'upsert') {
          res = await sb.current.from(item.table).upsert(item.payload, { onConflict: 'id' });
        } else if (item.op === 'insert') {
          res = await sb.current.from(item.table).insert(item.payload);
        } else if (item.op === 'delete') {
          res = await sb.current.from(item.table).delete().eq('id', item.payload.id);
        }
        // Supabase never throws — must explicitly check the error response
        if (res?.error) {
          console.error('[AquaOps] triggerSync item failed:', res.error.message, 'payload id:', item.payload?.id);
          failed.push(item);
        }
      } catch (e) {
        console.error('[AquaOps] triggerSync exception:', e?.message);
        failed.push(item);
      }
    }
    if (failed.length) {
      offlineQueue.current = failed;
      setPendingCount(failed.length);
      persistQueue();
    }
    await pullRemoteData();
    setSyncing(false);
    setLastSync(new Date());
    syncInProgress.current = false;
  };

  // ── WRAPPED SETTERS — update local state AND push to Supabase ────────────────
  const syncAssignedTasks = (updater) => {
    setAssignedTasks(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Push upserts for new or changed tasks
      next.forEach(task => {
        const old = prev.find(t => t.id === task.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(task)) {
          pushItem('assigned_tasks', 'upsert', {
            id: task.id, assigned_to: task.assignedTo,
            day: task.day, task_type: task.taskType,
            sistema: task.sistema || null, region: task.region || null, objetivo: task.objetivo,
            date: task.date, actual: task.actual,
            condicion: task.condicion, confirmed: task.confirmed,
            confirmed_by: task.confirmedBy || null,
            confirmed_at: task.confirmedAt || null,
            notas: task.notas || "",
            support_crew: Array.isArray(task.supportCrew) ? task.supportCrew.join(',') : (task.supportCrew || null),
            updated_at: new Date().toISOString(),
          });
        }
      });
      // Push deletes for tasks removed from state
      prev.forEach(task => {
        if (!next.find(t => t.id === task.id)) {
          pushItem('assigned_tasks', 'delete', { id: task.id });
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

  // ── syncReadings — push every new/edited/deleted reading to Supabase + localStorage ──
  const syncReadings = (updater) => {
    setReadings(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Find only new or changed readings
      const changed = next.filter(r => {
        const old = prev.find(x => x.id === r.id);
        return !old || JSON.stringify(old) !== JSON.stringify(r);
      });
      // Find deleted readings (in prev but not in next)
      const deleted = prev.filter(r => !next.find(x => x.id === r.id));
      // Push outside the setState callback so it doesn't block render
      if (changed.length > 0 || deleted.length > 0) {
        console.log(`[AquaOps] syncReadings: ${changed.length} changed, ${deleted.length} deleted`);
        setTimeout(() => {
          changed.forEach(r => {
            pushItem('lecturas', 'upsert', {
              id:          r.id,
              sistema:     r.sistema,
              fecha:       r.fecha,
              tipo:        r.tipo        ?? "vigilancia",
              peso:        r.peso        ?? null,
              sueltos:     r.sueltos     ?? null,
              ph:          r.ph          ?? null,
              temp:        r.temp        ?? null,
              salinidad:   r.salinidad   ?? null,
              condiciones: r.condiciones ?? null,
              notas:       r.notas       ?? "",
              cosechada:   r.cosechada   ?? null,
              sembrado:    r.sembrado    ?? null,
              buoys:          r.buoys          ?? null,
              logged_by:      r.logged_by      ?? null,
              module_weights: r.module_weights  ?? null,
            });
          });
          deleted.forEach(r => {
            pushItem('lecturas', 'delete', { id: r.id });
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

  // ── handleReadingSaved — called from CapitanTareas after saving a reading ──
  const handleReadingSaved = (reading) => {
    pendingReadingIds.current.add(reading.id);
    persistQueue();
    syncReadings(prev => {
      const filtered = prev.filter(r => !(r.sistema === reading.sistema && r.fecha === reading.fecha && r.logged_by === reading.logged_by));
      return [...filtered, reading];
    });
  };

  // ── syncSystems — persist to localStorage AND push changes to Supabase ──────
  const syncSystems = (updater) => {
    setSystems(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Detect new or changed systems
      const changed = next.filter(s => {
        const old = prev.find(x => x.id === s.id);
        return !old || JSON.stringify(old) !== JSON.stringify(s);
      });
      // NOTE: deletes are intentionally NOT pushed to Supabase here.
      // Supabase is the authoritative source; systems added via Supabase or the
      // app UI survive version bumps. Use the app's delete button (ReadingActions)
      // for deliberate system removal — that pushes the delete directly.
      if (changed.length > 0) {
        console.log(`[AquaOps] syncSystems: ${changed.length} changed`);
        setTimeout(async () => {
          changed.forEach(s => {
            pushItem('sistemas', 'upsert', {
              id:                s.id,
              region:            s.region            || null,
              poligono:          s.poligono           ?? 1,
              pueblo:            s.pueblo             || null,
              tipo:              s.tipo               || null,
              familia:           s.familia            || null,
              profundidad:       s.profundidad        || null,
              materiales:        s.materiales         || null,
              semillas:          s.semillas           || null,
              estado:            s.estado             || 'Activo',
              coordenadas:       s.coordenadas        || null,
              fecha_instalacion: s.fechaInstalacion   || null,
              capitan:           s.capitan            || null,
              buceador:          s.buceador           || null,
              modulos:           s.modulos            ?? 0,
              tamano:            s.tamano             || null,
              categoria:         s.categoria          || null,
              fecha_cosecha:     s.fechaCosecha       || null,
              fecha_limpieza:    s.fechaLimpieza      || null,
              notas:             s.notas              || "",
            });
          });
        }, 0);
      }
      try { localStorage.setItem('aq_systems_cache', JSON.stringify(next)); }
      catch(e) { console.warn('systems cache write failed:', e); }
      return next;
    });
  };

  // ── SYNC INDICATOR COMPONENT ─────────────────────────────────────────────────
  const SyncDot = () => (
    <SyncHealthDot
      health={syncHealth}
      syncing={syncing}
      online={online}
      pendingCount={pendingCount}
      lastSync={lastSync}
      onSync={triggerSync}
    />
  );

  const isVaquero  = user?.role === "vaquero";
  const isCapitan  = user?.role === "capitan";
  const isSup      = user?.role === "director" || user?.role === "supervisor";
  const isL3       = user?.role === "admin" || user?.role === "consultor";

  // admin/consultor see all systems including retired regions; all other roles see only non-retired
  const visibleSystems = isL3
    ? systems
    : systems.filter(s => s.estado !== 'Retirado' && !retiredRegions.includes(s.region));

  const handleLogin = (u) => {
    localStorage.setItem('vdm_user', JSON.stringify(u));
    setUser(u);
    const redirect = getRedirectForRole(u.role);
    if (redirect === '/vigilancia') setTab('vigilancia');
    else if (redirect === '/sistemas') setTab('sistemas');
    else setTab('dashboard');
  };

  if(!user) return <LoginScreen onLogin={handleLogin} lang={lang} setLang={setLang}/>;

  return (
    <AuthContext.Provider value={{ user, profile: user }}>
    <div className="vdm-root" style={{minHeight:"100vh",background:"#021c1e",fontFamily:"'Nunito','Segoe UI',sans-serif",color:"#e2e8f0",maxWidth:"100%",margin:"0 auto",position:"relative",marginLeft:isTablet?82:0}}>
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
          .vdm-root .vdm-bottom-nav{max-width:600px!important;width:100%!important;left:50%!important;transform:translateX(-50%)!important;right:auto!important;}
        }
        @media(min-width:900px){
          .vdm-root{max-width:720px!important;}
          .vdm-root .vdm-bottom-nav{max-width:720px!important;width:100%!important;}
        }
      `}</style>

      {/* Top bar */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(2,8,24,.92)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(148,163,184,.06)",padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div onClick={()=>setTab(user.role==="vaquero"?"inicio":user.role==="capitan"?"tareas":(user.role==="director"||user.role==="supervisor")?"tareas":"dashboard")} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
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

      {/* ── Toast notifications ──────────────────────────────────────── */}
      {toasts.length > 0 && (
        <div style={{position:"fixed",top:56,left:16,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
          {toasts.map(t => (
            <div key={t.id} style={{
              padding:"10px 14px",borderRadius:10,
              background: t.type==="warning" ? "rgba(251,146,60,.15)" : t.type==="success" ? "rgba(74,222,128,.12)" : "rgba(13,148,136,.12)",
              border: `1px solid ${t.type==="warning" ? "rgba(251,146,60,.3)" : t.type==="success" ? "rgba(74,222,128,.25)" : "rgba(13,148,136,.2)"}`,
              backdropFilter:"blur(12px)",
              color: t.type==="warning" ? "#fb923c" : t.type==="success" ? "#4ade80" : "#2dd4bf",
              fontSize:12,fontWeight:600,lineHeight:1.5,
              animation:"fadeIn .3s ease-out",pointerEvents:"auto",
            }}>
              {t.msg}
            </div>
          ))}
        </div>
      )}

      {/* Screen routing */}
      <div role="main" aria-label="Contenido principal" style={{display: initialLoading ? "none" : "block"}}>
        {/* Systems scoped to the logged-in user's responsibility */}
        {(() => {
          const mySystems = user?.role === 'vaquero'
            ? systems.filter(s => hasBuceador(s, user.initials) && s.estado === "Activo")
            : user?.role === 'capitan'
              ? (() => {
                  const myRegions = CAPITAN_REGIONS[user.initials]?.regions || [];
                  return myRegions.length > 0
                    ? systems.filter(s => myRegions.some(r => s.region === r) && s.estado === "Activo")
                    : systems.filter(s => s.capitan === user.initials && s.estado === "Activo");
                })()
              : systems;
          const visibleAlerts = alertsForRole(alerts, user?.role);
          return (<>
        {/* Alert banner — supervisor+ */}
        {visibleAlerts.length > 0 && <AlertBanner alerts={visibleAlerts} onOpenBell={()=>setTab("notas")}/>}
        {/* Level 1 — Vaquero */}
        {isVaquero && tab==="vigilancia"&& <ProtectedRoute path="/vigilancia"><VigilanciaQueue /></ProtectedRoute>}
        {isVaquero && tab==="inicio"   && <VaqueroInicio assignedTasks={assignedTasks} setAssignedTasks={syncAssignedTasks} systems={mySystems} user={user} lang={lang} announcements={announcements}/>}
        {isVaquero && tab==="score"    && <VaqueroScore  assignedTasks={assignedTasks} weeklyIncidents={weeklyIncidents} profScores={profScores} evaluations={evaluations} user={user} lang={lang}/>}
        {isVaquero && tab==="sistemas" && <ProtectedRoute path="/sistemas"><SistemasTab systems={mySystems} setSystems={syncSystems} readings={readings} setReadings={syncReadings} lang={lang} user={user} regions={regions} setRegions={setRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas} addToast={addToast} deepLinkSystem={deepLinkSystem} setDeepLinkSystem={setDeepLinkSystem} navigateTo={navigateTo}/></ProtectedRoute>}
        {isVaquero && tab==="perfil"   && <ProfileTab    user={user} lang={lang} setLang={setLang} onLogout={doLogout}/>}
        {isVaquero && tab==="notas"    && <NotesFeed user={user} userSystems={mySystems.map(s=>s.id)} alerts={visibleAlerts} onNavigateToSystem={id=>{setDeepLinkSystem(id);setTab("sistemas");}} onNavigateToPlan={()=>setTab("plan")}/>}

        {/* Level 1.5 — Capitán */}
        {isCapitan && tab==="tareas"    && (()=>{
          const myRegions = CAPITAN_REGIONS[user?.initials]?.regions || [];
          const capSystems = myRegions.length > 0
            ? systems.filter(s => myRegions.some(r => s.region === r) && s.estado === "Activo")
            : systems.filter(s => s.capitan === user.initials && s.estado === "Activo");
          return <CapitanTareasComponent systems={capSystems} readings={readings} user={user} lang={lang} onReadingSaved={handleReadingSaved} assignedTasks={assignedTasks} setAssignedTasks={syncAssignedTasks} pendingCount={pendingCount} cadenceDays={READING_CADENCE_DAYS}/>;
        })()}
        {isCapitan && tab==="sistemas"  && <ProtectedRoute path="/sistemas"><SistemasTab systems={mySystems} setSystems={syncSystems} readings={readings} setReadings={syncReadings} lang={lang} user={user} regions={regions} setRegions={setRegions} retiredRegions={retiredRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas} addToast={addToast} deepLinkSystem={deepLinkSystem} setDeepLinkSystem={setDeepLinkSystem} navigateTo={navigateTo}/></ProtectedRoute>}
        {isCapitan && tab==="equipo"    && <EquipoTab    assignedTasks={assignedTasks} weeklyIncidents={weeklyIncidents} setWeeklyIncidents={syncWeeklyIncidents} timecards={timecards} setTimecards={setTimecards} systems={systems} readings={readings} lang={lang} user={user} navigateTo={navigateTo} selectedPerson={personalView} setSelectedPerson={setPersonalView}/>}
        {isCapitan && tab==="perfil"    && <ProfileTab user={user} lang={lang} setLang={setLang} onLogout={doLogout}/>}
        {isCapitan && tab==="notas"     && <NotesFeed user={user} userSystems={mySystems.map(s=>s.id)} alerts={visibleAlerts} onNavigateToSystem={id=>{setDeepLinkSystem(id);setTab("sistemas");}} onNavigateToPlan={()=>setTab("plan")}/>}
          </>);
        })()}

        {/* Level 2 — Director */}
        {isSup && tab==="tareas" && (()=>{
          const myRegions = CAPITAN_REGIONS[user?.initials]?.regions || [];
          const supSystems = myRegions.length > 0
            ? systems.filter(s => myRegions.some(r => s.region === r) && s.estado === "Activo")
            : systems.filter(s => s.estado === "Activo");
          return <CapitanTareasComponent systems={supSystems} readings={readings} user={user} lang={lang} onReadingSaved={handleReadingSaved} assignedTasks={assignedTasks} setAssignedTasks={syncAssignedTasks} pendingCount={pendingCount} cadenceDays={READING_CADENCE_DAYS}/>;
        })()}
        {isSup && tab==="dashboard" && <ProtectedRoute path="/dashboard"><SupervisorDashboard assignedTasks={assignedTasks} systems={visibleSystems} readings={readings} lang={lang} announcements={announcements} setAnnouncements={syncAnnouncements} user={user} onNavigate={navigateTo} onViewPerson={(initials)=>navigateTo("persona", initials)} chartPruebas={chartPruebas} regions={regions} setRegions={setRegions}/></ProtectedRoute>}
        {isSup && tab==="plan"      && <PlanSemanal assignedTasks={assignedTasks} setAssignedTasks={syncAssignedTasks} systems={visibleSystems} lang={lang} user={user}/>}
        {isSup && tab==="sistemas"  && <ProtectedRoute path="/sistemas"><SistemasTab systems={visibleSystems} setSystems={syncSystems} readings={readings} setReadings={syncReadings} lang={lang} user={user} regions={regions} setRegions={setRegions} retiredRegions={retiredRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas} addToast={addToast} deepLinkSystem={deepLinkSystem} setDeepLinkSystem={setDeepLinkSystem} navigateTo={navigateTo} onChartUpload={handleChartDataUpload}/></ProtectedRoute>}
        {isSup && tab==="equipo"    && <EquipoTab    assignedTasks={assignedTasks} weeklyIncidents={weeklyIncidents} setWeeklyIncidents={syncWeeklyIncidents} timecards={timecards} setTimecards={setTimecards} systems={visibleSystems} readings={readings} lang={lang} user={user} navigateTo={navigateTo} selectedPerson={personalView} setSelectedPerson={setPersonalView}/>}
        {isSup && tab==="perfil"    && <ProfileTab   user={user} lang={lang} setLang={setLang} onLogout={doLogout} regions={regions} setRegions={setRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas}/>}
        {isSup && tab==="notas"     && <div>{["admin","consultor","director","farm_manager"].includes(user.role)&&<div style={{display:"flex",gap:0,margin:"12px 16px 0",background:"rgba(255,255,255,.04)",borderRadius:10,padding:3}}>{[["notas","Notas"],["actividad","Actividad"]].map(([v,l])=><button key={v} onClick={()=>setNotesSubView(v)} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",background:notesSubView===v?"rgba(13,148,136,.18)":"transparent",color:notesSubView===v?"#2dd4bf":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>{l}</button>)}</div>}{notesSubView==="actividad"&&["admin","consultor","director","farm_manager"].includes(user.role)?<ActivityFeed user={user}/>:<NotesFeed user={user} alerts={visibleAlerts} onNavigateToSystem={id=>{setDeepLinkSystem(id);setTab("sistemas");}} onNavigateToPlan={()=>setTab("plan")}/>}</div>}

        {/* Level 3 — Admin + Consultor */}
        {isL3 && tab==="dashboard" && <ProtectedRoute path="/dashboard"><SupervisorDashboard assignedTasks={assignedTasks} systems={systems} readings={readings} lang={lang} announcements={announcements} setAnnouncements={syncAnnouncements} user={user} onNavigate={navigateTo} onViewPerson={(initials)=>navigateTo("persona", initials)} chartPruebas={chartPruebas} regions={regions} setRegions={setRegions}/></ProtectedRoute>}
        {isL3 && tab==="plan"      && <PlanSemanal assignedTasks={assignedTasks} setAssignedTasks={syncAssignedTasks} systems={systems} lang={lang} user={user}/>}
        {isL3 && tab==="sistemas"  && <ProtectedRoute path="/sistemas"><SistemasTab systems={systems} setSystems={syncSystems} readings={readings} setReadings={syncReadings} lang={lang} user={user} regions={regions} setRegions={setRegions} retiredRegions={retiredRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas} addToast={addToast} deepLinkSystem={deepLinkSystem} setDeepLinkSystem={setDeepLinkSystem} navigateTo={navigateTo} onChartUpload={handleChartDataUpload}/></ProtectedRoute>}
        {isL3 && tab==="equipo"    && <EquipoTab    assignedTasks={assignedTasks} weeklyIncidents={weeklyIncidents} setWeeklyIncidents={syncWeeklyIncidents} timecards={timecards} setTimecards={setTimecards} systems={systems} readings={readings} lang={lang} user={user} navigateTo={navigateTo} selectedPerson={personalView} setSelectedPerson={setPersonalView}/>}
        {isL3 && tab==="rrhh"      && <RRHHTab evaluations={evaluations} setEvaluations={setEvaluations} profScores={profScores} setProfScores={setProfScores} assignedTasks={assignedTasks} weeklyIncidents={weeklyIncidents} readings={readings} systems={systems} lang={lang} user={user} chartTDC={chartTDC} chartPruebas={chartPruebas} chartBiomasa={chartBiomasa} onChartUpload={handleChartDataUpload}/>}
        {isL3 && tab==="perfil"    && <ProfileTab   user={user} lang={lang} setLang={setLang} onLogout={doLogout} regions={regions} setRegions={setRegions} retiredRegions={retiredRegions} setRetiredRegions={setRetiredRegions} tipos={tipos} setTipos={setTipos} materiales={materiales} setMateriales={setMateriales} semillas={semillas} setSemillas={setSemillas}/>}
        {isL3 && tab==="notas"     && <div>{["admin","consultor","director","farm_manager"].includes(user.role)&&<div style={{display:"flex",gap:0,margin:"12px 16px 0",background:"rgba(255,255,255,.04)",borderRadius:10,padding:3}}>{[["notas","Notas"],["actividad","Actividad"]].map(([v,l])=><button key={v} onClick={()=>setNotesSubView(v)} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",background:notesSubView===v?"rgba(13,148,136,.18)":"transparent",color:notesSubView===v?"#2dd4bf":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>{l}</button>)}</div>}{notesSubView==="actividad"&&["admin","consultor","director","farm_manager"].includes(user.role)?<ActivityFeed user={user}/>:<NotesFeed user={user} alerts={visibleAlerts} onNavigateToSystem={id=>{setDeepLinkSystem(id);setTab("sistemas");}} onNavigateToPlan={()=>setTab("plan")}/>}</div>}
      </div>

      <BottomNav tab={tab} setTab={(t)=>{ if(t==="notas") setUnreadNotes(0); setTab(t); }} role={user.role} lang={lang} unreadNotes={unreadNotes}/>
    </div>
    </AuthContext.Provider>
  );
}