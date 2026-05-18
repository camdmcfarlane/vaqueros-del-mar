// CapitanTareas.jsx
// Daily vigilancia queue for capitanes and director.
// Shows only the systems that do NOT yet have a reading for today.
// Tapping a card opens the same reading form used by buceadores.

import React, { useState } from 'react';
import ConditionAssessment from '../systems/ConditionAssessment';
import GrowthChart from './GrowthChart';
import { supabase } from '../lib/supabaseClient';

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

function calcTDC(pesoNuevo, pesoAnterior, dias) {
  if (!pesoNuevo || !pesoAnterior || !dias || dias <= 0) return null;
  return (Math.log(pesoNuevo / pesoAnterior) / dias * 100).toFixed(2);
}

function lastReading(readings, sysId) {
  return [...readings]
    .filter(r => r.sistema === sysId)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0] || null;
}

export default function CapitanTareas({ systems, readings, user, lang, onReadingSaved }) {
  const today = new Date().toISOString().split('T')[0];

  // Which active systems already have a reading today
  const todayDoneIds = new Set(
    (readings || []).filter(r => r.fecha === today).map(r => r.sistema)
  );

  const activeSystems = (systems || []).filter(s => s.estado === 'Activo');
  const queue = activeSystems.filter(s => !todayDoneIds.has(s.id));
  const done  = activeSystems.filter(s => todayDoneIds.has(s.id));

  // Session-level completions (so a saved reading moves card without page reload)
  const [sessionDone, setSessionDone] = useState(new Set());
  const pending = queue.filter(s => !sessionDone.has(s.id));
  const completedAll = [...done.map(s => s.id), ...sessionDone];
  const pct = activeSystems.length > 0
    ? Math.round(completedAll.length / activeSystems.length * 100)
    : 0;

  const [activeSystem, setActiveSystem] = useState(null);
  const [showChart, setShowChart]       = useState(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const [form, setForm] = useState({
    peso:'', sueltos:'', ph:'', temp:'', salinidad:'',
    condicion: null, cosechada:'', notas:'', buoys: Array(10).fill(''),
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
    setActiveSystem(sys);
    setForm({ peso:'', sueltos:'', ph:'', temp:'', salinidad:'',
      condicion: null, cosechada:'', notas:'', buoys: Array(10).fill('') });
    setError('');
  }

  async function saveReading() {
    if (!activeSystem || !form.peso || !form.condicion) return;
    setSaving(true);
    setError('');

    const last = lastReading(readings, activeSystem.id);
    const reading = {
      id: `${activeSystem.id}_${today}`,
      sistema: activeSystem.id,
      fecha: today,
      tipo: 'vigilancia',
      peso: parseFloat(form.peso),
      sueltos: parseFloat(form.sueltos) || null,
      ph: parseFloat(form.ph) || null,
      temp: parseFloat(form.temp) || null,
      salinidad: parseFloat(form.salinidad) || null,
      condiciones: form.condicion,
      cosechada: parseFloat(form.cosechada) || null,
      notas: form.notas || null,
      buoys: activeSystem.tipo === 'Long Line'
        ? form.buoys.map(b => parseFloat(b) || 0) : null,
    };

    try {
      await supabase.from('lecturas').upsert([{
        sistema: reading.sistema, fecha: reading.fecha, tipo: reading.tipo,
        peso: reading.peso, sueltos: reading.sueltos, ph: reading.ph,
        temp: reading.temp, salinidad: reading.salinidad,
        condiciones: reading.condiciones, cosechada: reading.cosechada,
        notas: reading.notas, buoys: reading.buoys,
      }], { onConflict: 'sistema,fecha' });
    } catch (_) {
      // offline — local save still proceeds
    }

    if (onReadingSaved) onReadingSaved(reading);
    setSessionDone(p => new Set([...p, activeSystem.id]));
    setShowChart({ sys: activeSystem, reading, last });
    setSaving(false);
  }

  // ── Growth chart after save ───────────────────────────────────────────────
  if (showChart) {
    const { sys, reading, last } = showChart;
    const dias = last ? daysSince(last.fecha) : null;
    const tdc = calcTDC(reading.peso, last?.peso, dias);
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

  // ── Reading form ──────────────────────────────────────────────────────────
  if (activeSystem) {
    const sys = activeSystem;
    const isLongLine = sys.tipo === 'Long Line';
    const last = lastReading(readings, sys.id);
    const dias = last ? daysSince(last.fecha) : null;
    const tdc = calcTDC(parseFloat(form.peso), last?.peso, dias);
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
          {completedAll.length}/{activeSystems.length} hoy
        </div>
      </div>
      <div style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'14px' }}>
        {new Date().toLocaleDateString('es-PA', { weekday:'long', day:'numeric', month:'long' })}
        {' · '}{user?.name}
      </div>

      {/* Progress */}
      <div style={{ height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'3px',
        marginBottom:'20px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'#0d9488',
          borderRadius:'3px', transition:'width 0.3s' }} />
      </div>

      {/* Pending systems */}
      {pending.length > 0 && (
        <div style={{ fontSize:'11px', color:'#64748b', fontWeight:'700', textTransform:'uppercase',
          letterSpacing:'.6px', marginBottom:'10px' }}>
          Pendientes — {pending.length}
        </div>
      )}

      {pending.map(sys => {
        const last = lastReading(readings, sys.id);
        const d = last ? daysSince(last.fecha) : null;
        const urgent = d !== null && d > 3;
        const catColor = CAT_COLORS[sys.categoria] || '#0d9488';

        return (
          <div key={sys.id} onClick={() => openForm(sys)}
            style={{ background:'rgba(255,255,255,0.03)',
              border:`0.5px solid ${urgent ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius:'12px', padding:'14px 16px', cursor:'pointer', marginBottom:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:catColor,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'13px', fontWeight:'700', color:'#fff', flexShrink:0 }}>
                {sys.id}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'15px', fontWeight:'600' }}>{sys.id}</span>
                  <span style={{ fontSize:'11px', padding:'1px 7px', borderRadius:'8px',
                    background:'rgba(255,255,255,0.06)', color:catColor }}>
                    {sys.categoria}
                  </span>
                </div>
                <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'2px' }}>
                  {sys.tipo} · prof. {sys.profundidad || '—'} · {sys.pueblo || sys.region}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:'14px', fontWeight:'500' }}>
                  {last?.peso ? `${last.peso.toLocaleString()}g` : '—'}
                </div>
                <div style={{ fontSize:'11px', color: urgent ? '#ef4444' : '#94a3b8' }}>
                  {d !== null ? `hace ${d}d` : 'sin datos'}
                </div>
              </div>
            </div>
            {/* Task pill */}
            <div style={{ display:'flex', gap:'6px' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:'4px',
                padding:'4px 10px', borderRadius:'8px',
                background:'rgba(13,148,136,0.15)', fontSize:'12px',
                fontWeight:'500', color:'#0d9488' }}>
                📋 Lectura
              </span>
            </div>
          </div>
        );
      })}

      {/* Already done today */}
      {(done.length > 0 || sessionDone.size > 0) && (
        <>
          <div style={{ fontSize:'11px', color:'#64748b', fontWeight:'700', textTransform:'uppercase',
            letterSpacing:'.6px', marginTop:'16px', marginBottom:'10px' }}>
            Completados hoy — {completedAll.length}
          </div>
          {activeSystems.filter(s => completedAll.includes(s.id)).map(sys => (
            <div key={sys.id}
              style={{ background:'rgba(34,197,94,0.08)', border:'0.5px solid rgba(34,197,94,0.15)',
                borderRadius:'12px', padding:'12px 16px', marginBottom:'8px', opacity:0.6,
                display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px',
                background:'rgba(34,197,94,0.25)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
                ✓
              </div>
              <div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#4ade80' }}>{sys.id}</div>
                <div style={{ fontSize:'11px', color:'#64748b' }}>
                  {sys.pueblo || sys.region} · {sys.tipo}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {pending.length === 0 && activeSystems.length > 0 && (
        <div style={{ textAlign:'center', padding:'32px 20px',
          background:'rgba(34,197,94,0.06)', border:'0.5px solid rgba(34,197,94,0.15)',
          borderRadius:'12px', marginTop:'8px' }}>
          <div style={{ fontSize:'36px', marginBottom:'12px' }}>✅</div>
          <div style={{ fontSize:'18px', fontWeight:'600', color:'#4ade80', marginBottom:'4px' }}>
            ¡Todo listo por hoy!
          </div>
          <div style={{ fontSize:'13px', color:'#64748b' }}>
            Todos los sistemas tienen lectura de hoy
          </div>
        </div>
      )}

      {activeSystems.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'#64748b' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>🌊</div>
          Sin sistemas asignados
        </div>
      )}

      <div style={{ marginTop:'20px', textAlign:'center', fontSize:'11px', color:'#475569' }}>
        📡 Funciona sin conexión — se sincroniza al conectar
      </div>
    </div>
  );
}
