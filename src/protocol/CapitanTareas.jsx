// CapitanTareas.jsx
// Daily vigilancia queue for capitanes and director.
// Shows only the systems that do NOT yet have a reading for today.
// Tapping a card opens the same reading form used by buceadores.

import React, { useState } from 'react';
import ConditionAssessment from '../systems/ConditionAssessment';
import GrowthChart from './GrowthChart';
import { READING_CADENCE_DAYS } from '../data/constants';

// Panama is UTC-5 year-round (no DST). Before 4am Panama time, stamp readings as yesterday.
function getEffectiveDate() {
  const panamaNow = new Date(Date.now() - 5 * 60 * 60 * 1000); // shift to UTC-5
  if (panamaNow.getUTCHours() < 4) panamaNow.setUTCDate(panamaNow.getUTCDate() - 1);
  return panamaNow.toISOString().slice(0, 10);
}

const CAT_COLORS = {
  comercial: '#0d9488',
  prueba:    '#8b5cf6',
  semillero: '#f59e0b',
};

const s = {
  page: { background:'#020818', minHeight:'100vh', padding:'16px 16px 100px',
    fontFamily:'system-ui,-apple-system,sans-serif', color:'#e2e8f0' },
  section: { background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.08)',
    borderRadius:'12px', padding:'16px', marginBottom:'14px' },
  inputLarge: { width:'100%', boxSizing:'border-box', height:'56px', fontSize:'22px',
    fontWeight:'500', background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.08)',
    borderRadius:'8px', color:'#e2e8f0', padding:'0 16px', textAlign:'center', outline:'none' },
  inputSmall: { width:'100%', boxSizing:'border-box', height:'52px', fontSize:'18px',
    background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.08)',
    borderRadius:'8px', color:'#e2e8f0', padding:'0 8px', textAlign:'center', outline:'none' },
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.round((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 864e5);
}

function calcTDC(pesoNuevo, pesoAnterior, dias, cosechadaAnterior = 0, sembradoNuevo = 0) {
  const adjNow  = (pesoNuevo  || 0) - (sembradoNuevo    || 0);
  const adjPrev = (pesoAnterior || 0) - (cosechadaAnterior || 0);
  if (!adjNow || !adjPrev || adjNow <= 0 || adjPrev <= 0 || !dias || dias <= 0) return null;
  return (Math.log(adjNow / adjPrev) / dias * 100).toFixed(2);
}

function lastReading(readings, sysId) {
  return [...readings]
    .filter(r => r.sistema === sysId)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0] || null;
}

export default function CapitanTareas({ systems, readings, user, lang, onReadingSaved, assignedTasks = [], setAssignedTasks, pendingCount = 0, cadenceDays = READING_CADENCE_DAYS }) {
  const today = getEffectiveDate(); // 4am Panama cutoff — before 4am counts as yesterday

  // Last peso reading date per system (ignore null-peso entries)
  const lastPesoDate = {};
  (readings || []).filter(r => r.peso).forEach(r => {
    if (!lastPesoDate[r.sistema] || r.fecha > lastPesoDate[r.sistema])
      lastPesoDate[r.sistema] = r.fecha;
  });

  // A system is due if it has no peso reading OR its last one was ≥ cadenceDays ago
  function isDue(sysId) {
    const last = lastPesoDate[sysId];
    if (!last) return true;
    const diff = Math.round((new Date(today + 'T12:00:00') - new Date(last + 'T12:00:00')) / 864e5);
    return diff >= cadenceDays;
  }

  const activeSystems = (systems || []).filter(s => s.estado === 'Activo');
  const queue = activeSystems.filter(s => isDue(s.id));
  const done  = activeSystems.filter(s => !isDue(s.id));

  // Session-level completions (so a saved reading moves card without page reload)
  const [sessionDone, setSessionDone] = useState(new Set());
  const pending = queue.filter(s => !sessionDone.has(s.id));
  const completedAll = [...done.map(s => s.id), ...sessionDone];
  const pct = activeSystems.length > 0
    ? Math.round((activeSystems.length - pending.length) / activeSystems.length * 100)
    : 0;

  // Long Line systems with the same ID prefix (e.g. P80-1…P80-10) where ≥3 are pending → batch card
  const batchGroups = (() => {
    const byPrefix = {};
    (queue || []).filter(s => s.tipo === 'Long Line').forEach(s => {
      const pfx = s.id.replace(/-\d+$/, '');
      if (pfx !== s.id) { if (!byPrefix[pfx]) byPrefix[pfx] = []; byPrefix[pfx].push(s); }
    });
    return Object.entries(byPrefix).filter(([, g]) => g.length >= 3).map(([prefix, systems]) => ({ prefix, systems }));
  })();
  const batchGroupSysIds = new Set(batchGroups.flatMap(g => g.systems.map(s => s.id)));

  const [activeSystem, setActiveSystem]           = useState(null);
  const [showChart, setShowChart]                 = useState(null);
  const [saving, setSaving]                       = useState(false);
  const [error, setError]                         = useState('');
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [showHistory, setShowHistory]             = useState(false);
  const [queueFilter, setQueueFilter]             = useState('todos'); // 'todos'|'pendientes'|'alertas'
  const [viewChartSys, setViewChartSys]           = useState(null);   // system to browse chart inline
  const [declineComment, setDeclineComment]       = useState('');     // mandatory comment when TDC < 0
  const [pendingReadingOnDecline, setPendingReadingOnDecline] = useState(null); // reading awaiting comment
  const [showFormChart, setShowFormChart]         = useState(false);  // expand chart inside reading form
  const [dippingModal, setDippingModal]           = useState(null);   // task open in dipping form
  const [dippingForm, setDippingForm]             = useState({ concentration:'', notes:'', done:true });
  const [autoFillSource, setAutoFillSource]       = useState(null);   // sibling system that params were copied from
  const [activeBatch, setActiveBatch]             = useState(null);   // { prefix, systems[] } for LL batch form
  const [batchForm, setBatchForm]                 = useState({ weights:{}, ph:'', temp:'', salinidad:'', condicion:null, notas:'' });
  const [batchSaving, setBatchSaving]             = useState(false);

  const today2 = new Date().toISOString().split('T')[0];

  const markDone = (task, extra = {}) => {
    if (setAssignedTasks) setAssignedTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, confirmed: true, actual: today2, ...extra } : t
    ));
  };
  const undoTask = (task) => {
    if (setAssignedTasks) setAssignedTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, confirmed: false, actual: null } : t
    ));
  };

  const [form, setForm] = useState({
    peso:'', sueltos:'', ph:'', temp:'', salinidad:'',
    condicion: null, cosechada:'', sembrado:'', notas:'', buoys: Array(10).fill(''),
  });

  function updateForm(key, val) { setForm(p => ({ ...p, [key]: val })); }
  function updateBuoy(i, val) {
    setForm(p => {
      const buoys = [...p.buoys]; buoys[i] = val;
      const total = buoys.reduce((s, b) => s + (parseFloat(b) || 0), 0);
      return { ...p, buoys, peso: total > 0 ? String(Math.round(total)) : '' };
    });
  }

  function openForm(sys) {
    // Auto-fill water params from the most recent reading of any sibling system (same prefix group)
    const prefix = sys.id.replace(/-\d+$/, '');
    let autoParams = { ph:'', temp:'', salinidad:'' };
    let fillSource = null;
    if (prefix !== sys.id) {
      const sibR = [...(readings || [])]
        .filter(r => r.sistema !== sys.id && r.sistema.startsWith(prefix + '-') && (r.ph || r.temp || r.salinidad))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
      if (sibR) {
        autoParams = {
          ph:        sibR.ph        ? String(sibR.ph)        : '',
          temp:      sibR.temp      ? String(sibR.temp)      : '',
          salinidad: sibR.salinidad ? String(sibR.salinidad) : '',
        };
        fillSource = sibR.sistema;
      }
    }
    setActiveSystem(sys);
    setAutoFillSource(fillSource);
    setForm({ peso:'', sueltos:'', ...autoParams,
      condicion: null, cosechada:'', sembrado:'', notas:'', buoys: Array(10).fill('') });
    setError('');
    setShowFormChart(false);
  }

  function commitReading(reading, last) {
    if (setAssignedTasks) {
      setAssignedTasks(prev => prev.map(t =>
        t.sistema === reading.sistema && t.date === today && !t.confirmed
          ? { ...t, confirmed: true, confirmedAt: new Date().toISOString(), confirmedBy: user?.initials }
          : t
      ));
    }
    if (onReadingSaved) onReadingSaved(reading);
    setSessionDone(p => new Set([...p, reading.sistema]));
    setShowChart({ sys: activeSystem, reading, last });
    setPendingReadingOnDecline(null);
    setDeclineComment('');
    setSaving(false);
  }

  function saveBatchReading() {
    if (!activeBatch || !batchForm.condicion) return;
    if (activeBatch.systems.some(s => !batchForm.weights[s.id])) return;
    setBatchSaving(true);
    activeBatch.systems.forEach(sys => {
      const reading = {
        id: `${sys.id}_${today}_${user?.initials || 'anon'}`,
        sistema: sys.id, fecha: today, tipo: 'peso',
        peso: parseFloat(batchForm.weights[sys.id]),
        sueltos: null,
        ph: parseFloat(batchForm.ph) || null,
        temp: parseFloat(batchForm.temp) || null,
        salinidad: parseFloat(batchForm.salinidad) || null,
        condiciones: batchForm.condicion,
        cosechada: null, sembrado: null,
        notas: batchForm.notas || null, buoys: null,
        logged_by: user?.initials || null,
      };
      if (onReadingSaved) onReadingSaved(reading);
      setSessionDone(p => new Set([...p, sys.id]));
      if (setAssignedTasks) {
        setAssignedTasks(prev => prev.map(t =>
          t.sistema === sys.id && t.date === today && !t.confirmed
            ? { ...t, confirmed: true, confirmedBy: user?.initials } : t
        ));
      }
    });
    setActiveBatch(null);
    setBatchForm({ weights:{}, ph:'', temp:'', salinidad:'', condicion:null, notas:'' });
    setBatchSaving(false);
  }

  function saveReading() {
    if (!activeSystem || !form.peso || !form.condicion) return;
    setSaving(true);
    setError('');

    const last = lastReading(readings, activeSystem.id);
    const tdc = calcTDC(parseFloat(form.peso), last?.peso, last ? daysSince(last.fecha) : null, last?.cosechada, parseFloat(form.sembrado) || 0);
    const reading = {
      id: `${activeSystem.id}_${today}_${user?.initials || 'anon'}`,
      sistema: activeSystem.id,
      fecha: today,
      tipo: 'peso',
      peso: parseFloat(form.peso),
      sueltos: parseFloat(form.sueltos) || null,
      ph: parseFloat(form.ph) || null,
      temp: parseFloat(form.temp) || null,
      salinidad: parseFloat(form.salinidad) || null,
      condiciones: form.condicion,
      cosechada: parseFloat(form.cosechada) || null,
      sembrado: parseFloat(form.sembrado) || null,
      notas: form.notas || null,
      buoys: activeSystem.tipo === 'Long Line'
        ? form.buoys.map(b => parseFloat(b) || 0) : null,
      logged_by: user?.initials || null,
    };

    // Intercept: if growth declined, require explanation before committing
    if (tdc !== null && parseFloat(tdc) < 0) {
      setPendingReadingOnDecline({ reading, last });
      setSaving(false);
      return;
    }

    commitReading(reading, last);
  }

  // ── Growth chart after save ───────────────────────────────────────────────
  if (showChart) {
    const { sys, reading, last } = showChart;
    const dias = last ? daysSince(last.fecha) : null;
    const tdc = calcTDC(reading.peso, last?.peso, dias, last?.cosechada, reading.sembrado || 0);
    const isBetter = tdc !== null && parseFloat(tdc) > 0;

    return (
      <div style={s.page}>
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>
            {reading.condicion === 'saludable' ? '🌿' :
             reading.condicion === 'ice-ice' ? '🧊' :
             reading.condicion === 'epifitas' ? '🌾' : '💧'}
          </div>
          <div style={{ fontSize:'24px', fontWeight:'700', color:'#e2e8f0', marginBottom:'8px' }}>
            {sys.id} — guardado ✓
          </div>
          <div style={{ fontSize:'16px', color:'#94a3b8', marginBottom:'24px' }}>
            {reading.peso.toLocaleString()}g · {reading.condicion}
          </div>
          {tdc !== null && (
            <div style={{
              display:'inline-block', padding:'10px 20px', borderRadius:'12px',
              background: isBetter ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: isBetter ? '#22c55e' : '#ef4444',
              fontSize:'18px', fontWeight:'700', marginBottom:'24px',
            }}>
              {isBetter ? '↑' : '↓'} {Math.abs(tdc)}%/día
            </div>
          )}
          <div style={{ fontSize:'13px', color:'#64748b', marginBottom:'32px' }}>
            {completedAll.length}/{activeSystems.length} sistemas completados hoy
          </div>
          <button
            onClick={() => { setShowChart(null); setActiveSystem(null); }}
            style={{ width:'100%', maxWidth:'300px', height:'56px', borderRadius:'12px',
              border:'none', background:'#0d9488', color:'#fff', fontSize:'16px',
              fontWeight:'600', cursor:'pointer' }}
          >
            {pending.length > 0 ? `Siguiente sistema (${pending.length} restantes)` : '✓ Todo listo'}
          </button>
        </div>
      </div>
    );
  }

  // ── Mandatory comment when growth declined ───────────────────────────────
  if (pendingReadingOnDecline) {
    const { reading, last } = pendingReadingOnDecline;
    const tdc = calcTDC(reading.peso, last?.peso, last ? daysSince(last.fecha) : null, last?.cosechada, reading.sembrado || 0);
    return (
      <div style={s.page}>
        <div style={{ padding:'32px 20px' }}>
          <div style={{ textAlign:'center', marginBottom:'24px' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📉</div>
            <div style={{ fontSize:'20px', fontWeight:'700', color:'#e2e8f0', marginBottom:'6px' }}>
              El crecimiento bajó
            </div>
            <div style={{ display:'inline-block', padding:'8px 18px', borderRadius:'10px',
              background:'rgba(239,68,68,0.15)', color:'#ef4444', fontSize:'16px', fontWeight:'700' }}>
              ↓ {Math.abs(tdc)}%/día · {reading.sistema}
            </div>
          </div>
          <div style={{ fontSize:'14px', color:'#94a3b8', marginBottom:'8px', fontWeight:'600' }}>
            ¿Cuál es la causa? <span style={{ color:'#ef4444' }}>*</span>
          </div>
          <textarea
            autoFocus
            value={declineComment}
            onChange={e => setDeclineComment(e.target.value)}
            placeholder="Ej: cambio de temperatura, condición de agua turbia, epífitas visibles..."
            style={{ width:'100%', boxSizing:'border-box', minHeight:'100px', fontSize:'15px',
              background:'rgba(255,255,255,.06)', border:`0.5px solid ${declineComment.trim().length>10?'#0d9488':'rgba(239,68,68,.4)'}`,
              borderRadius:'10px', color:'#e2e8f0', padding:'12px', outline:'none', resize:'vertical', fontFamily:'inherit' }}
          />
          <div style={{ fontSize:'11px', color:'#64748b', marginTop:'4px', marginBottom:'20px' }}>
            Mínimo 10 caracteres — esta nota queda registrada en la lectura
          </div>
          <button
            disabled={declineComment.trim().length < 10}
            onClick={() => {
              const r = { ...pendingReadingOnDecline.reading, notas: declineComment.trim() };
              commitReading(r, pendingReadingOnDecline.last);
              setActiveSystem(null);
            }}
            style={{ width:'100%', height:'52px', borderRadius:'12px', border:'none',
              background: declineComment.trim().length >= 10 ? '#0d9488' : 'rgba(255,255,255,.08)',
              color: declineComment.trim().length >= 10 ? '#fff' : '#475569',
              fontSize:'16px', fontWeight:'600', cursor: declineComment.trim().length >= 10 ? 'pointer' : 'default' }}>
            Confirmar y guardar
          </button>
          <button onClick={() => { setPendingReadingOnDecline(null); setDeclineComment(''); setSaving(false); }}
            style={{ width:'100%', height:'44px', borderRadius:'12px', border:'none',
              background:'transparent', color:'#64748b', fontSize:'14px', cursor:'pointer', marginTop:'8px' }}>
            ← Volver y corregir
          </button>
        </div>
      </div>
    );
  }

  // ── Inline historical chart for a system ─────────────────────────────────
  if (viewChartSys) {
    const sysR = (readings || [])
      .filter(r => r.sistema === viewChartSys.id && r.tipo === 'peso' && r.peso)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(-12);
    const W = 340, H = 120, pad = 20;
    let svg = null;
    if (sysR.length >= 2) {
      const weights = sysR.map(r => r.peso);
      const minW = Math.min(...weights), maxW = Math.max(...weights);
      const toX = i => pad + i * (W - pad*2) / (sysR.length - 1);
      const toY = w => H - pad - ((w - minW) / (maxW - minW || 1)) * (H - pad*2);
      const pts = sysR.map((r, i) => `${toX(i)},${toY(r.peso)}`).join(' ');
      svg = (
        <svg width={W} height={H} style={{ overflow:'visible', marginTop:8 }}>
          <polyline points={pts} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinejoin="round"/>
          {sysR.map((r, i) => (
            <circle key={i} cx={toX(i)} cy={toY(r.peso)} r={3} fill="#0d9488"/>
          ))}
          {sysR.map((r, i) => i % Math.max(1, Math.floor(sysR.length/4)) === 0 && (
            <text key={`l${i}`} x={toX(i)} y={H-2} textAnchor="middle" fontSize={9} fill="#475569">
              {r.fecha.slice(5)}
            </text>
          ))}
        </svg>
      );
    }
    const latest = sysR[sysR.length-1];
    const prev   = sysR[sysR.length-2];
    const tdc    = latest && prev ? calcTDC(latest.peso, prev.peso, daysSince(prev.fecha), prev.cosechada, latest.sembrado) : null;
    return (
      <div style={s.page}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={() => setViewChartSys(null)}
            style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,.06)', border:'none', color:'#e2e8f0', fontSize:20, cursor:'pointer' }}>←</button>
          <div>
            <div style={{ fontSize:18, fontWeight:700 }}>{viewChartSys.id}</div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>{viewChartSys.pueblo || viewChartSys.region} · {viewChartSys.tipo}</div>
          </div>
        </div>
        <div style={s.section}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#94a3b8' }}>Historial de peso — últimas {sysR.length} lecturas</span>
            {tdc !== null && <span style={{ fontSize:13, fontWeight:700, color: parseFloat(tdc)>=0?'#22c55e':'#ef4444' }}>
              {parseFloat(tdc)>=0?'↑':'↓'} {Math.abs(tdc)}%/día
            </span>}
          </div>
          {svg || <div style={{ fontSize:12, color:'#475569', padding:'12px 0' }}>Sin suficientes datos</div>}
          {latest && <div style={{ fontSize:13, color:'#94a3b8', marginTop:8 }}>
            Última: <strong style={{color:'#e2e8f0'}}>{latest.peso.toLocaleString()}g</strong> · {latest.fecha}
            {latest.logged_by && <span style={{color:'#64748b'}}> · por {latest.logged_by}</span>}
          </div>}
        </div>
        <div style={s.section}>
          <div style={{ fontSize:11, color:'#64748b', fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Todas las lecturas</div>
          {[...sysR].reverse().map(r => (
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'7px 0', borderBottom:'0.5px solid rgba(255,255,255,.04)' }}>
              <span style={{ fontSize:13, color:'#94a3b8' }}>{r.fecha}</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{r.peso.toLocaleString()}g</span>
              <span style={{ fontSize:11, color:'#475569' }}>{r.logged_by || '—'}</span>
              {r.condiciones && <span style={{ fontSize:11, color:'#64748b' }}>{r.condiciones}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Batch reading form (Long Line family ≥3 systems) ─────────────────────
  if (activeBatch) {
    const { prefix, systems } = activeBatch;
    const canSaveBatch = batchForm.condicion && systems.every(s => batchForm.weights[s.id]);
    return (
      <div style={s.page}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <button onClick={() => setActiveBatch(null)}
            style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,.06)',
              border:'none', color:'#e2e8f0', fontSize:20, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          <div>
            <div style={{ fontSize:18, fontWeight:600 }}>Grupo {prefix}</div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>{systems.length} líneas · Long Line</div>
          </div>
        </div>

        <div style={s.section}>
          <div style={{ fontSize:14, color:'#94a3b8', marginBottom:10, fontWeight:500 }}>Peso por línea (g)</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
            {systems.map(sys => {
              const last = lastReading(readings, sys.id);
              return (
                <div key={sys.id}>
                  <div style={{ fontSize:11, color:'#94a3b8', marginBottom:3,
                    display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:600 }}>{sys.id}</span>
                    {last?.peso && <span style={{ color:'#475569' }}>ant: {last.peso.toLocaleString()}g</span>}
                  </div>
                  <input
                    type="number" inputMode="numeric"
                    value={batchForm.weights[sys.id] || ''}
                    onChange={e => setBatchForm(p => ({ ...p, weights: { ...p.weights, [sys.id]: e.target.value } }))}
                    style={{ ...s.inputSmall, border:`0.5px solid ${batchForm.weights[sys.id] ? '#0d9488' : 'rgba(255,255,255,.08)'}` }}
                    placeholder="0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div style={s.section}>
          <div style={{ fontSize:14, color:'#94a3b8', marginBottom:10, fontWeight:500 }}>
            Parámetros del agua <span style={{ fontSize:11, color:'#475569', fontWeight:400 }}>(compartidos)</span>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {[
              { key:'temp',      label:'Temp °C',    placeholder:'26' },
              { key:'ph',        label:'pH',          placeholder:'8.1' },
              { key:'salinidad', label:'Salinidad ‰', placeholder:'35' },
            ].map(p => (
              <div key={p.key} style={{ flex:1 }}>
                <label style={{ fontSize:11, color:'#94a3b8', display:'block', marginBottom:4 }}>{p.label}</label>
                <input type="number" inputMode="decimal" step="0.1"
                  value={batchForm[p.key]}
                  onChange={e => setBatchForm(pr => ({ ...pr, [p.key]: e.target.value }))}
                  style={s.inputSmall} placeholder={p.placeholder} />
              </div>
            ))}
          </div>
        </div>

        <ConditionAssessment
          selected={batchForm.condicion}
          onSelect={c => setBatchForm(p => ({ ...p, condicion: c }))}
          cosechada=""
          onCosechadaChange={() => {}}
        />

        <div style={{ marginBottom:14 }}>
          <input type="text" value={batchForm.notas}
            onChange={e => setBatchForm(p => ({ ...p, notas: e.target.value }))}
            placeholder="Notas (opcional)..."
            style={{ width:'100%', boxSizing:'border-box', height:52, fontSize:14,
              background:'rgba(255,255,255,.06)', border:'0.5px solid rgba(255,255,255,.08)',
              borderRadius:10, color:'#e2e8f0', padding:'0 16px', outline:'none' }} />
        </div>

        <button onClick={saveBatchReading} disabled={!canSaveBatch || batchSaving}
          style={{ width:'100%', height:60, borderRadius:12, border:'none',
            fontSize:17, fontWeight:600, cursor: canSaveBatch && !batchSaving ? 'pointer' : 'default',
            background: canSaveBatch && !batchSaving ? '#0d9488' : 'rgba(255,255,255,.06)',
            color: canSaveBatch && !batchSaving ? '#fff' : '#94a3b8' }}>
          {batchSaving ? 'Guardando...' : `✓ Guardar ${systems.length} lecturas`}
        </button>
      </div>
    );
  }

  // ── Reading form ──────────────────────────────────────────────────────────
  if (activeSystem) {
    const sys = activeSystem;
    const isLongLine = sys.tipo === 'Long Line';
    const last = lastReading(readings, sys.id);
    const dias = last ? daysSince(last.fecha) : null;
    const tdc = calcTDC(parseFloat(form.peso), last?.peso, dias, last?.cosechada, parseFloat(form.sembrado) || 0);
    const canSave = form.peso && form.condicion && !saving;

    return (
      <div style={s.page}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
          <button onClick={() => setActiveSystem(null)} aria-label="Volver"
            style={{ width:'44px', height:'44px', borderRadius:'50%', background:'rgba(255,255,255,0.06)',
              border:'none', color:'#e2e8f0', fontSize:'20px', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            ←
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'18px', fontWeight:'600' }}>{sys.id} · nueva lectura</div>
            <div style={{ fontSize:'12px', color:'#94a3b8' }}>
              {sys.tipo} · {sys.region} · prof. {sys.profundidad || '—'}
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:'11px', color:'#94a3b8' }}>Anterior</div>
            <div style={{ fontSize:'16px', fontWeight:'500' }}>
              {last?.peso ? `${last.peso.toLocaleString()}g` : '—'}
            </div>
          </div>
        </div>

        {/* Growth history — collapsible, matches system detail TDC display */}
        {(() => {
          const sysR = (readings || [])
            .filter(r => r.sistema === sys.id && r.tipo === 'peso' && r.peso)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .slice(-12);
          if (!sysR.length) return null;
          const latest = sysR[sysR.length - 1];
          const prev   = sysR[sysR.length - 2];
          const tdc    = latest && prev ? calcTDC(latest.peso, prev.peso, daysSince(prev.fecha), prev.cosechada, latest.sembrado) : null;
          const tdcColor = tdc === null ? '#94a3b8'
            : parseFloat(tdc) >= 2.5 ? '#4ade80'
            : parseFloat(tdc) >= 0   ? '#0d9488'
            : '#f87171';
          return (
            <div style={{ ...s.section, marginBottom:'14px' }}>
              <div onClick={() => setShowFormChart(o => !o)}
                style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
                <span style={{ fontSize:'12px', fontWeight:'700', color:'#94a3b8' }}>📈 Crecimiento</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {tdc !== null && (
                    <span style={{ fontSize:'13px', fontWeight:'800', color: tdcColor }}>
                      {parseFloat(tdc) >= 0 ? '+' : ''}{tdc}%/día
                    </span>
                  )}
                  <span style={{ fontSize:'10px', color:'#475569' }}>{showFormChart ? '▼' : '▶'} {sysR.length} pt{sysR.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {showFormChart && (
                <>
                  {sysR.length >= 2 && (() => {
                    const W = 300, H = 120, PL = 44, PR = 8, PT = 8, PB = 24;
                    const cW = W - PL - PR, cH = H - PT - PB;
                    const weights = sysR.map(r => r.peso);
                    const minW = Math.min(...weights), maxW = Math.max(...weights);
                    const pad5 = (maxW - minW) * 0.08 || maxW * 0.05;
                    const yMin = minW - pad5, yMax = maxW + pad5, yRng = yMax - yMin || 1;
                    const toX = i => PL + (i / (sysR.length - 1)) * cW;
                    const toY = w => PT + cH - ((w - yMin) / yRng) * cH;
                    const pts = sysR.map((r, i) => `${toX(i)},${toY(r.peso)}`).join(' ');
                    // Y ticks: ~4 nice round values
                    const rawStep = (yMax - yMin) / 3;
                    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
                    const step = Math.ceil(rawStep / mag) * mag;
                    const tickStart = Math.ceil(yMin / step) * step;
                    const yTicks = [];
                    for (let t = tickStart; t <= yMax; t += step) yTicks.push(t);
                    // X: show every point if ≤6, else every other
                    const skipX = sysR.length > 6 ? 2 : 1;
                    const catColor = (tdc) => tdc === null ? '#0d9488'
                      : parseFloat(tdc) >= 6 ? '#3b82f6'
                      : parseFloat(tdc) >= 3 ? '#4ade80'
                      : parseFloat(tdc) >= 0 ? '#f59e0b'
                      : '#f87171';
                    return (
                      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 8, overflow: 'visible' }}>
                        {/* Y gridlines + labels */}
                        {yTicks.map(t => {
                          const y = toY(t);
                          if (y < PT - 4 || y > PT + cH + 4) return null;
                          const lbl = t >= 1000 ? `${(t/1000).toFixed(t%1000===0?0:1)}k` : String(t);
                          return (
                            <g key={t}>
                              <line x1={PL} y1={y} x2={PL + cW} y2={y} stroke="rgba(148,163,184,.1)" strokeWidth="1"/>
                              <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#475569">{lbl}</text>
                            </g>
                          );
                        })}
                        {/* Line */}
                        <polyline points={pts} fill="none" stroke="#0d9488" strokeWidth="2"
                          strokeLinejoin="round" strokeLinecap="round"/>
                        {/* Dots — colored by TDC category */}
                        {sysR.map((r, i) => {
                          const dotTdc = i > 0 ? calcTDC(r.peso, sysR[i-1].peso, daysSince(sysR[i-1].fecha), sysR[i-1].cosechada, r.sembrado) : null;
                          return (
                            <circle key={i} cx={toX(i)} cy={toY(r.peso)}
                              r={i === sysR.length - 1 ? 4.5 : 3}
                              fill={catColor(dotTdc)} stroke="rgba(2,8,24,.6)" strokeWidth="1"/>
                          );
                        })}
                        {/* X axis labels */}
                        {sysR.map((r, i) => {
                          if (i % skipX !== 0) return null;
                          return (
                            <text key={i} x={toX(i)} y={H - 4}
                              textAnchor={i === 0 ? 'start' : i === sysR.length - 1 ? 'end' : 'middle'}
                              fontSize="8" fill="#475569">
                              {r.fecha.slice(5)}
                            </text>
                          );
                        })}
                      </svg>
                    );
                  })()}
                  <div style={{ marginTop:8, fontSize:'12px', color:'#94a3b8' }}>
                    Último: <strong style={{ color:'#e2e8f0' }}>{latest.peso.toLocaleString()}g</strong>
                    <span style={{ color:'#64748b' }}> · {latest.fecha}{latest.logged_by ? ` · ${latest.logged_by}` : ''}</span>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Peso */}
        <div style={s.section}>
          <div style={{ fontSize:'14px', color:'#94a3b8', marginBottom:'10px', fontWeight:'500' }}>
            Peso
          </div>
          {isLongLine ? (
            /* Long Line: buoy-by-buoy grid */
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px', marginBottom:'10px' }}>
                {form.buoys.map((w, i) => (
                  <div key={i} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'10px', color:'#94a3b8', marginBottom:'3px' }}>B{i+1}</div>
                    <input
                      type="number" inputMode="numeric" value={w}
                      onChange={e => updateBuoy(i, e.target.value)}
                      style={{ ...s.inputSmall, height:'44px', fontSize:'16px',
                        border:`0.5px solid ${w ? '#0d9488' : 'rgba(255,255,255,0.08)'}` }}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              {form.peso && (
                <div style={{ textAlign:'center', fontSize:'20px', fontWeight:'700', color:'#0d9488' }}>
                  Total: {parseInt(form.peso).toLocaleString()}g
                </div>
              )}
            </>
          ) : (
            <div style={{ display:'flex', gap:'12px' }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:'12px', color:'#94a3b8', display:'block', marginBottom:'4px' }}>
                  Peso total (g)
                </label>
                <input type="number" inputMode="numeric" value={form.peso}
                  onChange={e => updateForm('peso', e.target.value)}
                  style={s.inputLarge} placeholder="0" autoFocus />
              </div>
              <div style={{ flex:'0 0 90px' }}>
                <label style={{ fontSize:'12px', color:'#94a3b8', display:'block', marginBottom:'4px' }}>
                  Sueltos (g)
                </label>
                <input type="number" inputMode="numeric" value={form.sueltos}
                  onChange={e => updateForm('sueltos', e.target.value)}
                  style={{ ...s.inputLarge, fontSize:'16px' }} placeholder="0" />
              </div>
            </div>
          )}
          {form.peso && tdc !== null && (
            <div style={{ marginTop:'8px', fontSize:'13px',
              color: parseFloat(tdc) > 0 ? '#22c55e' : '#ef4444' }}>
              {parseFloat(tdc) > 0 ? '↑' : '↓'} {Math.abs(tdc)}%/día vs anterior
            </div>
          )}
        </div>

        {/* Parámetros */}
        <div style={s.section}>
          <div style={{ fontSize:'14px', color:'#94a3b8', marginBottom:'10px', fontWeight:'500' }}>
            Parámetros del agua
            {autoFillSource && (
              <span style={{ fontSize:10, color:'#0d9488', marginLeft:8, fontWeight:400 }}>
                ↩ copiado de {autoFillSource}
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            {[
              { key:'temp',     label:'Temp °C',   placeholder:'26' },
              { key:'ph',       label:'pH',         placeholder:'8.1' },
              { key:'salinidad',label:'Salinidad ‰',placeholder:'35' },
            ].map(p => (
              <div key={p.key} style={{ flex:1 }}>
                <label style={{ fontSize:'11px', color:'#94a3b8', display:'block', marginBottom:'4px' }}>
                  {p.label}
                </label>
                <input type="number" inputMode="decimal" step="0.1"
                  value={form[p.key]} onChange={e => updateForm(p.key, e.target.value)}
                  style={s.inputSmall} placeholder={p.placeholder} />
              </div>
            ))}
          </div>
        </div>

        {/* Cosecha / Siembra */}
        <div style={s.section}>
          <div style={{ fontSize:'14px', color:'#94a3b8', marginBottom:'10px', fontWeight:'500' }}>
            Cosecha / Siembra <span style={{ fontSize:'11px', color:'#475569' }}>(opcional — afecta TDC)</span>
          </div>
          <div style={{ display:'flex', gap:'12px' }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'11px', color:'#94a3b8', display:'block', marginBottom:'4px' }}>
                Cosechado (g) — removido
              </label>
              <input type="number" inputMode="numeric" value={form.cosechada}
                onChange={e => updateForm('cosechada', e.target.value)}
                style={{ ...s.inputSmall, border:`0.5px solid ${form.cosechada ? 'rgba(251,146,60,.5)' : 'rgba(255,255,255,0.08)'}` }}
                placeholder="0" />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'11px', color:'#94a3b8', display:'block', marginBottom:'4px' }}>
                Sembrado (g) — agregado
              </label>
              <input type="number" inputMode="numeric" value={form.sembrado}
                onChange={e => updateForm('sembrado', e.target.value)}
                style={{ ...s.inputSmall, border:`0.5px solid ${form.sembrado ? 'rgba(74,222,128,.5)' : 'rgba(255,255,255,0.08)'}` }}
                placeholder="0" />
            </div>
          </div>
        </div>

        {/* Condición */}
        <ConditionAssessment
          selected={form.condicion}
          onSelect={c => updateForm('condicion', c)}
          cosechada={form.cosechada}
          onCosechadaChange={v => updateForm('cosechada', v)}
        />

        {/* Notas */}
        <div style={{ marginBottom:'14px' }}>
          <input type="text" value={form.notas} onChange={e => updateForm('notas', e.target.value)}
            placeholder="Notas (opcional)..."
            style={{ width:'100%', boxSizing:'border-box', height:'52px', fontSize:'14px',
              background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.08)',
              borderRadius:'10px', color:'#e2e8f0', padding:'0 16px', outline:'none' }} />
        </div>

        {error && (
          <div style={{ marginBottom:'12px', padding:'10px', borderRadius:'8px',
            background:'rgba(239,68,68,0.1)', color:'#f87171', fontSize:'13px' }}>
            {error}
          </div>
        )}

        {/* Save */}
        <button onClick={saveReading} disabled={!canSave}
          style={{ width:'100%', height:'60px', borderRadius:'12px', border:'none',
            fontSize:'17px', fontWeight:'600', cursor: canSave ? 'pointer' : 'default',
            background: canSave ? '#0d9488' : 'rgba(255,255,255,0.06)',
            color: canSave ? '#fff' : '#94a3b8' }}>
          {saving ? 'Guardando...' : '✓ Guardar lectura'}
        </button>
      </div>
    );
  }

  // ── Queue view ────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
        <div style={{ fontSize:'20px', fontWeight:'500' }}>Mis lecturas</div>
        <div style={{ fontSize:'13px', color:'#94a3b8' }}>
          {activeSystems.length - pending.length}/{activeSystems.length} · cada {cadenceDays}d
        </div>
      </div>
      <div style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'14px' }}>
        {new Date(today + 'T12:00:00').toLocaleDateString('es-PA', { weekday:'long', day:'numeric', month:'long' })}
        {' · '}{user?.name}
      </div>

      {/* Progress */}
      <div style={{ height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'3px',
        marginBottom:'20px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'#0d9488',
          borderRadius:'3px', transition:'width 0.3s' }} />
      </div>

      {/* Assigned tasks from plan */}
      {(() => {
        const activeSysIds = new Set((systems || []).map(s => s.id));
        // null sistema = task not tied to a specific system (e.g. parámetros region-wide) — always include
        const myTasks = (assignedTasks || []).filter(t =>
          t.assignedTo === user?.initials && (t.sistema == null || activeSysIds.has(t.sistema))
        );
        if (!myTasks.length) return null;
        const overdue  = myTasks.filter(t => t.date < today2 && !t.confirmed);
        const todayT   = myTasks.filter(t => t.date === today2 && !t.confirmed);
        const upcoming = myTasks.filter(t => t.date > today2 && !t.confirmed);
        const archived = myTasks.filter(t => t.confirmed);
        const TIPO_LABELS = { vigilancia:'Vigilancia', limpieza:'Limpieza', siembra:'Siembra', cosecha:'Cosecha', pesos:'Pesos', dipping:'Dipping AMPEP', parametros:'Parámetros' };
        const TIPO_COLORS = { vigilancia:'#0d9488', limpieza:'#8b5cf6', siembra:'#f59e0b', cosecha:'#4ade80', pesos:'#38bdf8', dipping:'#a855f7', parametros:'#0ea5e9' };

        const TaskRow = ({ t, highlight }) => {
          const isDipping = t.taskType === 'dipping';
          return (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px',
              background: highlight==='overdue' ? 'rgba(248,113,113,.06)' : highlight==='today' ? 'rgba(13,148,136,.06)' : 'rgba(255,255,255,.02)',
              border: `0.5px solid ${highlight==='overdue' ? 'rgba(248,113,113,.25)' : highlight==='today' ? 'rgba(13,148,136,.2)' : 'rgba(255,255,255,.06)'}`,
              borderRadius:'10px', marginBottom:'6px' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background: TIPO_COLORS[t.taskType] || '#64748b' }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#e2e8f0' }}>
                  {t.sistema ? `${t.sistema} — ` : ''}{TIPO_LABELS[t.taskType] || t.taskType}
                </div>
                <div style={{ fontSize:'11px', color: highlight==='overdue' ? '#f87171' : '#64748b' }}>
                  {highlight==='overdue' ? `⚠ PENDIENTE — vencida ${t.date}` : t.date}
                  {t.objetivo ? ` · ${t.objetivo}%` : ''}
                  {t.supportCrew?.length > 0 ? ` · +${t.supportCrew.join(',')}` : ''}
                </div>
                {t.notas ? <div style={{ fontSize:'10px', color:'#475569', fontStyle:'italic', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.notas}</div> : null}
              </div>
              <button
                onClick={() => {
                  if (isDipping) {
                    setDippingForm({ concentration: t.objetivo ? String(t.objetivo) : '', notes:'', done:true });
                    setDippingModal(t);
                  } else {
                    markDone(t);
                  }
                }}
                style={{ fontSize:'11px', padding:'4px 10px', borderRadius:'7px', border:'none',
                  background: isDipping ? '#a855f7' : '#0d9488',
                  color:'#fff', fontWeight:'700', cursor:'pointer', flexShrink:0 }}>
                {isDipping ? '🧪' : '✓'}
              </button>
            </div>
          );
        };

        return (
          <div style={{ marginBottom:'18px' }}>
            <div style={{ fontSize:'11px', color:'#64748b', fontWeight:'700', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:'8px' }}>
              Tareas asignadas {overdue.length > 0 && <span style={{color:'#f87171'}}>· {overdue.length} pendiente{overdue.length>1?'s':''}</span>}
            </div>
            {overdue.map(t => <TaskRow key={t.id} t={t} highlight="overdue"/>)}
            {todayT.map(t => <TaskRow key={t.id} t={t} highlight="today"/>)}
            {upcoming.map(t => <TaskRow key={t.id} t={t} highlight="upcoming"/>)}
            {archived.length > 0 && (
              <>
                <button onClick={() => setShowArchivedTasks(o=>!o)} style={{ display:'flex', alignItems:'center', gap:6, width:'100%', background:'rgba(74,222,128,.04)', border:'0.5px solid rgba(74,222,128,.12)', borderRadius:8, padding:'7px 12px', cursor:'pointer', color:'#4ade80', fontWeight:700, fontSize:11, marginTop:4 }}>
                  <span style={{flex:1, textAlign:'left'}}>✓ Completadas ({archived.length})</span>
                  <span>{showArchivedTasks ? '▲' : '▼'}</span>
                </button>
                {showArchivedTasks && archived.map(t => (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px',
                    background:'rgba(74,222,128,.03)', border:'0.5px solid rgba(74,222,128,.08)',
                    borderRadius:'10px', marginTop:'4px' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:'#4ade80' }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'12px', fontWeight:'600', color:'#94a3b8' }}>
                        {t.sistema ? `${t.sistema} — ` : ''}{TIPO_LABELS[t.taskType] || t.taskType}
                        {t.taskType === 'dipping' && t.actual ? <span style={{color:'#a855f7', marginLeft:6}}>{t.actual}%</span> : null}
                      </div>
                      <div style={{ fontSize:'10px', color:'#475569' }}>{t.date} · completada</div>
                    </div>
                    <button onClick={() => undoTask(t)}
                      style={{ fontSize:'10px', padding:'3px 8px', borderRadius:6, border:'0.5px solid rgba(148,163,184,.2)',
                        background:'transparent', color:'#64748b', cursor:'pointer', flexShrink:0 }}>
                      ↩
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })()}

      {/* Dipping modal */}
      {dippingModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:300,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setDippingModal(null)}>
          <div style={{ width:'100%', maxWidth:480, background:'#0f1724',
            borderRadius:'20px 20px 0 0', padding:'20px 20px 40px', maxHeight:'85vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:36, height:4, borderRadius:2, background:'rgba(148,163,184,.2)', margin:'0 auto 16px' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <span style={{ fontSize:24 }}>🧪</span>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0' }}>Dipping AMPEP</div>
                <div style={{ fontSize:12, color:'#64748b' }}>
                  {dippingModal.sistema || 'Sin sistema'}{dippingModal.supportCrew?.length > 0 ? ` · +${dippingModal.supportCrew.join(', ')}` : ''}
                </div>
              </div>
            </div>

            {/* Resultado */}
            <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600, marginBottom:8 }}>Resultado</div>
            <div style={{ display:'flex', gap:10, marginBottom:18 }}>
              {[{ val:true, label:'✓ Completado', bg:'rgba(13,148,136,.15)', border:'#0d9488', color:'#2dd4bf' },
                { val:false, label:'✗ No completado', bg:'rgba(239,68,68,.12)', border:'#ef4444', color:'#f87171' }]
                .map(opt => (
                <button key={String(opt.val)} onClick={() => setDippingForm(p => ({ ...p, done: opt.val }))}
                  style={{ flex:1, padding:'12px 8px', borderRadius:10,
                    border: `${dippingForm.done === opt.val ? '2px' : '0.5px'} solid ${dippingForm.done === opt.val ? opt.border : 'rgba(148,163,184,.15)'}`,
                    background: dippingForm.done === opt.val ? opt.bg : 'rgba(255,255,255,.02)',
                    color: dippingForm.done === opt.val ? opt.color : '#475569',
                    fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Concentración */}
            <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600, marginBottom:6 }}>
              Concentración AMPEP (%) <span style={{ color:'#ef4444' }}>*</span>
              {dippingModal.objetivo && <span style={{ color:'#64748b', fontWeight:400, marginLeft:6 }}>objetivo: {dippingModal.objetivo}%</span>}
            </div>
            <input
              type="number" inputMode="decimal" step="0.1"
              value={dippingForm.concentration}
              onChange={e => setDippingForm(p => ({ ...p, concentration: e.target.value }))}
              placeholder={dippingModal.objetivo ? String(dippingModal.objetivo) : 'ej. 1.5'}
              style={{ width:'100%', boxSizing:'border-box', height:'52px', fontSize:'20px', fontWeight:600,
                background:'rgba(255,255,255,.06)', border:`0.5px solid ${dippingForm.concentration ? '#a855f7' : 'rgba(239,68,68,.4)'}`,
                borderRadius:10, color:'#e2e8f0', padding:'0 16px', textAlign:'center', outline:'none', marginBottom:14 }}
            />

            {/* Notas */}
            <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600, marginBottom:6 }}>
              Observaciones <span style={{ color:'#475569', fontWeight:400 }}>(opcional)</span>
            </div>
            <textarea
              value={dippingForm.notes}
              onChange={e => setDippingForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Condición del alga antes/después, tiempo de inmersión, observaciones..."
              style={{ width:'100%', boxSizing:'border-box', minHeight:80, fontSize:14,
                background:'rgba(255,255,255,.06)', border:'0.5px solid rgba(148,163,184,.12)',
                borderRadius:10, color:'#e2e8f0', padding:12, outline:'none', resize:'vertical',
                fontFamily:'inherit', marginBottom:16 }}
            />

            <button
              disabled={!dippingForm.concentration}
              onClick={() => {
                markDone(dippingModal, {
                  actual: dippingForm.concentration,
                  notas: dippingForm.notes || dippingModal.notas || '',
                  dippingDone: dippingForm.done,
                });
                setDippingModal(null);
              }}
              style={{ width:'100%', height:52, borderRadius:12, border:'none', fontSize:16, fontWeight:700,
                cursor: dippingForm.concentration ? 'pointer' : 'default',
                background: dippingForm.concentration ? '#a855f7' : 'rgba(255,255,255,.06)',
                color: dippingForm.concentration ? '#fff' : '#475569' }}>
              Guardar dipping
            </button>
            <button onClick={() => setDippingModal(null)}
              style={{ width:'100%', height:40, marginTop:8, borderRadius:12, border:'none',
                background:'transparent', color:'#475569', fontSize:14, cursor:'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        {[
          { id:'todos',      label:`Todos (${activeSystems.length})` },
          { id:'pendientes', label:`Pendientes (${pending.length})` },
          { id:'alertas',    label:`Alertas (${activeSystems.filter(s=>{ const d=lastReading(readings,s.id); return !d||daysSince(d.fecha)>3||['ice-ice','contaminado','problema'].includes(d.condiciones); }).length})` },
        ].map(f => (
          <button key={f.id} onClick={() => setQueueFilter(f.id)}
            style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${queueFilter===f.id?'#0d9488':'rgba(148,163,184,.12)'}`,
              background: queueFilter===f.id?'rgba(13,148,136,.15)':'transparent',
              color: queueFilter===f.id?'#0d9488':'#64748b', fontWeight:600, fontSize:11, cursor:'pointer' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Pending systems */}
      {(() => {
        // Alertas = any active system with bad condition OR no reading in >3 days
        const alertSysIds = new Set(activeSystems.filter(s => {
          const last = lastReading(readings, s.id);
          return !last || daysSince(last.fecha) > 3 || ['ice-ice','contaminado','problema'].includes(last.condiciones);
        }).map(s => s.id));
        const visible = queueFilter === 'pendientes' ? pending
          : queueFilter === 'alertas' ? activeSystems.filter(s => alertSysIds.has(s.id))
          : activeSystems.filter(s => !sessionDone.has(s.id));

        return (
          <>
            {/* Batch group cards for Long Line families */}
            {batchGroups.map(({ prefix, systems }) => {
              const pendingSystems = systems.filter(s => !sessionDone.has(s.id));
              if (!pendingSystems.length) return null;
              return (
                <div key={prefix}
                  onClick={() => setActiveBatch({ prefix, systems: pendingSystems })}
                  style={{ borderRadius:12, marginBottom:10, cursor:'pointer',
                    background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(56,189,248,.2)',
                    padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:42, height:42, borderRadius:10, background:'#0c4a6e',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:13, fontWeight:700, color:'#38bdf8', flexShrink:0 }}>
                      {prefix}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:600, color:'#e2e8f0' }}>
                        Grupo {prefix}
                        <span style={{ fontSize:11, marginLeft:8, padding:'1px 7px', borderRadius:8,
                          background:'rgba(56,189,248,.12)', color:'#38bdf8' }}>
                          {pendingSystems.length} líneas
                        </span>
                      </div>
                      <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>
                        Long Line · un formulario · {pendingSystems.length} lecturas
                      </div>
                    </div>
                    <span style={{ fontSize:18, color:'#38bdf8' }}>→</span>
                  </div>
                </div>
              );
            })}

            {/* Individual system cards — exclude systems already in a batch group */}
            {visible.filter(sys => !batchGroupSysIds.has(sys.id)).map(sys => {
          const last = lastReading(readings, sys.id);
          const d = last ? daysSince(last.fecha) : null;
          const isAlert = alertSysIds.has(sys.id);
          const isDone = completedAll.includes(sys.id);
          const catColor = CAT_COLORS[sys.categoria] || '#0d9488';

          if (isDone) return (
            <div key={sys.id}
              style={{ background: isAlert ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.08)',
                border: `0.5px solid ${isAlert ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)'}`,
                borderRadius:'12px', padding:'12px 16px', marginBottom:'8px',
                display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:36, height:36, borderRadius:10,
                background: isAlert ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                {isAlert ? '⚠' : '✓'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, color: isAlert ? '#f87171' : '#4ade80' }}>{sys.id}</div>
                <div style={{ fontSize:11, color:'#64748b' }}>
                  {sys.pueblo || sys.region} · {sys.tipo}
                  {last?.condiciones && last.condiciones !== 'saludable' && (
                    <span style={{ marginLeft:6, color:'#ef4444' }}>{last.condiciones}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setViewChartSys(sys)}
                style={{ padding:'5px 12px', borderRadius:8, border:'0.5px solid rgba(13,148,136,.3)',
                  background:'rgba(13,148,136,.1)', color:'#0d9488', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
                📊 Ver
              </button>
            </div>
          );

          return (
            <div key={sys.id} style={{ borderRadius:'12px', marginBottom:'10px', overflow:'hidden' }}>
              <div onClick={() => openForm(sys)}
                style={{ background:'rgba(255,255,255,0.03)',
                  border:`0.5px solid ${isAlert ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius:'12px', padding:'14px 16px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:catColor,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {sys.id}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:15, fontWeight:600 }}>{sys.id}</span>
                      {isAlert && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'rgba(239,68,68,.15)', color:'#ef4444', fontWeight:700 }}>⚠ Alerta</span>}
                      {sys.categoria && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:8, background:'rgba(255,255,255,.06)', color:catColor }}>{sys.categoria}</span>}
                    </div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>
                      {sys.tipo} · prof. {sys.profundidad || '—'} · {sys.pueblo || sys.region}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:500 }}>{last?.peso ? `${last.peso.toLocaleString()}g` : '—'}</div>
                    <div style={{ fontSize:11, color: d !== null && d >= cadenceDays ? '#f59e0b' : '#94a3b8' }}>
                      {d !== null ? `hace ${d}d` : 'sin datos'}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4,
                    padding:'4px 10px', borderRadius:8, background:'rgba(13,148,136,0.15)', fontSize:12, fontWeight:500, color:'#0d9488' }}>
                    📋 Lectura
                  </span>
                  <button onClick={e => { e.stopPropagation(); setViewChartSys(sys); }}
                    style={{ padding:'4px 10px', borderRadius:8, border:'0.5px solid rgba(13,148,136,.2)',
                      background:'transparent', color:'#0d9488', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    📊 Historial
                  </button>
                </div>
              </div>
            </div>
          );
        })}
          </>
        );
      })()}

      {pending.length === 0 && activeSystems.length > 0 && (
        <div style={{ textAlign:'center', padding:'32px 20px',
          background:'rgba(34,197,94,0.06)', border:'0.5px solid rgba(34,197,94,0.15)',
          borderRadius:'12px', marginTop:'8px' }}>
          <div style={{ fontSize:'36px', marginBottom:'12px' }}>✅</div>
          <div style={{ fontSize:'18px', fontWeight:'600', color:'#4ade80', marginBottom:'4px' }}>
            ¡Todo al día!
          </div>
          <div style={{ fontSize:'13px', color:'#64748b' }}>
            Todos los sistemas con lectura en los últimos {cadenceDays} días
          </div>
        </div>
      )}

      {activeSystems.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'#64748b' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>🌊</div>
          Sin sistemas asignados
        </div>
      )}

      {/* ── Mi historial ────────────────────────────────────────────────── */}
      {(() => {
        const thirtyAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
        const myHistory = (readings || [])
          .filter(r => r.logged_by === user?.initials && r.fecha >= thirtyAgo && r.fecha <= today && r.tipo === 'peso')
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        if (!myHistory.length) return null;
        return (
          <div style={{ marginTop:'24px' }}>
            <button onClick={() => setShowHistory(o=>!o)} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:10, padding:'10px 14px', cursor:'pointer', color:'#94a3b8', fontWeight:700, fontSize:12 }}>
              <span style={{flex:1, textAlign:'left'}}>📊 Mi historial — últimos 30 días ({myHistory.length} lecturas)</span>
              <span>{showHistory ? '▲' : '▼'}</span>
            </button>
            {showHistory && (
              <div style={{ marginTop:8 }}>
                {myHistory.map(r => {
                  const sys = (systems || []).find(s => s.id === r.sistema);
                  return (
                    <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(255,255,255,.02)', border:'0.5px solid rgba(255,255,255,.05)', borderRadius:10, marginBottom:5 }}>
                      <div style={{ width:34, height:34, borderRadius:8, background:'rgba(13,148,136,.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:10, fontWeight:800, color:'#0d9488' }}>{r.sistema}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:'600', color:'#e2e8f0' }}>{r.peso?.toLocaleString()}g {r.sueltos ? <span style={{color:'#64748b',fontWeight:400}}>· {r.sueltos}g sueltos</span> : ''}</div>
                        <div style={{ fontSize:'11px', color:'#64748b' }}>{r.fecha} · {sys?.pueblo || sys?.region || r.sistema}</div>
                      </div>
                      {r.condiciones && <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,.05)', color:'#94a3b8' }}>{r.condiciones}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Sync indicator ───────────────────────────────────────────────── */}
      <div style={{ marginTop:'20px', textAlign:'center', fontSize:'11px', color: pendingCount > 0 ? '#fb923c' : '#475569' }}>
        {pendingCount > 0
          ? `⏳ ${pendingCount} lectura${pendingCount>1?'s':''} pendiente${pendingCount>1?'s':''} de sincronizar`
          : '📡 Funciona sin conexión — se sincroniza al conectar'}
      </div>
    </div>
  );
}
