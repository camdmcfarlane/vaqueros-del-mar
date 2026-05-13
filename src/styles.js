// AquaOps — Shared style constants
import React from 'react';

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

const AUTH_ISTYLE = { width:"100%", padding:"13px 14px", borderRadius:12, border:"1px solid rgba(148,163,184,.15)", background:"rgba(30,41,59,.7)", color:"#e2e8f0", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
const AUTH_LSTYLE = { fontSize:11, color:"#64748b", fontWeight:700, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.6 };

export { S, AUTH_ISTYLE, AUTH_LSTYLE };
