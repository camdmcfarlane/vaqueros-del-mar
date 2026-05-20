// CapitanSistemas.jsx
// Capitán (L2) systems view — shows only systems assigned to this capitán.
// Accepts `systems` and `readings` props from App.js (pre-filtered mySystems).
// Falls back to a direct Supabase query if props are not provided.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const CAT_COLORS = {
  comercial: '#0d9488',
  prueba: '#8b5cf6',
  semillero: '#f59e0b',
};

const COND_META = {
  saludable:    { color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  epifitas:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  'ice-ice':    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  decoloracion: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.round((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 864e5);
}

function enrichSystems(rawSystems, readingsData) {
  const today = new Date().toISOString().split('T')[0];
  return rawSystems.map((sys) => {
    const sysReadings = (readingsData || [])
      .filter((r) => r.sistema === sys.id && r.tipo === 'peso' && r.peso)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const latest = sysReadings[0] || null;
    const todayReading = sysReadings.find((r) => r.fecha === today);
    const d = daysSince(latest?.fecha);

    let tdc = null;
    if (sysReadings.length >= 2) {
      const r1 = sysReadings[0];
      const r2 = sysReadings[1];
      const dias = Math.round(
        (new Date(r1.fecha).getTime() - new Date(r2.fecha).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dias > 0 && r1.peso && r2.peso) {
        tdc = (Math.log(r1.peso / r2.peso) / dias * 100).toFixed(1);
      }
    }

    const condicion = latest?.condiciones || 'saludable';
    const isAlert = condicion !== 'saludable' || !latest || d > 3;

    return {
      ...sys,
      depth: sys.profundidad || sys.depth || '—',
      lastPeso: latest?.peso || null,
      lastDate: latest?.fecha || null,
      condicion,
      tdc: tdc ? parseFloat(tdc) : null,
      pendiente: !todayReading,
      isAlert,
      buceador: sys.buceador || '—',
    };
  });
}

export default function CapitanSistemas({ userInitials, systems: propSystems, readings: propReadings }) {
  const { profile } = useAuth();
  const myInitials = userInitials || profile?.initials || profile?.id;

  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailReadings, setDetailReadings] = useState([]);
  const [filter, setFilter] = useState('todos'); // 'todos' | 'pendientes' | 'alertas'

  useEffect(() => {
    if (propSystems !== undefined) {
      setSystems(enrichSystems(propSystems, propReadings || []));
      setLoading(false);
    } else {
      loadFromSupabase();
    }
  }, [propSystems, propReadings]); // re-enrich when parent pulls fresh Supabase data

  async function loadFromSupabase() {
    setLoading(true);
    try {
      let sysQuery = supabase.from('sistemas').select('*').order('id');
      if (myInitials) sysQuery = sysQuery.eq('capitan', myInitials);
      const { data: sysData } = await sysQuery;

      const { data: readingsData } = await supabase
        .from('lecturas')
        .select('sistema, fecha, peso, condiciones')
        .order('fecha', { ascending: false });

      setSystems(enrichSystems(sysData || [], readingsData || []));
    } catch (err) {
      console.error('Error loading capitán systems:', err);
    }
    setLoading(false);
  }

  function openDetail(sys) {
    setDetail(sys);
    if (propReadings) {
      const filtered = propReadings
        .filter((r) => r.sistema === sys.id)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 25);
      setDetailReadings(filtered);
    } else {
      supabase
        .from('lecturas')
        .select('*')
        .eq('sistema', sys.id)
        .order('fecha', { ascending: false })
        .limit(25)
        .then(({ data }) => setDetailReadings(data || []));
    }
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (detail) {
    const condMeta = COND_META[detail.condicion] || COND_META.saludable;
    const isAlert = detail.isAlert;

    return (
      <div style={{
        background: '#020818',
        minHeight: '100vh',
        padding: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e2e8f0',
        paddingBottom: '80px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => setDetail(null)}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: '#e2e8f0', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Volver"
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: '500' }}>{detail.id} — {detail.tipo}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {detail.categoria} · {detail.region} · prof. {detail.depth}
            </div>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: '8px', background: condMeta.bg,
            fontSize: '12px', fontWeight: '500', color: condMeta.color,
          }}>
            {detail.condicion}
          </div>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { l: 'Peso actual',      v: detail.lastPeso ? `${detail.lastPeso.toLocaleString()}g` : '—', c: '#0d9488' },
            { l: 'Crecimiento',      v: detail.tdc !== null ? `${detail.tdc}%/d` : '—', c: detail.tdc > 0 ? '#22c55e' : '#ef4444' },
            { l: 'Último registro',  v: detail.lastDate ? detail.lastDate.slice(5) : '—', c: '#94a3b8' },
          ].map((m) => (
            <div key={m.l} style={{
              flex: 1, background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', padding: '10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{m.l}</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* System details */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', padding: '12px', marginBottom: '14px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px' }}>
            Detalles del sistema
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { l: 'Pueblo',      v: detail.pueblo },
              { l: 'Región',      v: detail.region },
              { l: 'Tipo',        v: detail.tipo },
              { l: 'Profundidad', v: detail.profundidad || detail.depth },
              { l: 'Materiales',  v: detail.materiales },
              { l: 'Semillas',    v: detail.semillas },
              { l: 'Módulos',     v: detail.modulos || null },
              { l: 'Tamaño',      v: detail.tamano },
              { l: 'Familia',     v: detail.familia },
              { l: 'Instalado',   v: detail.fechaInstalacion },
            ].filter(f => f.v).map(f => (
              <div key={f.l}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>{f.l}</div>
                <div style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '2px' }}>{f.v}</div>
              </div>
            ))}
          </div>
          {detail.coordenadas && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }}>Coordenadas</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{detail.coordenadas}</div>
            </div>
          )}
          {detail.notas && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.06)',
              fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
              {detail.notas}
            </div>
          )}
        </div>

        {/* Buceador assignment */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', padding: '12px', marginBottom: '14px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Buceador asignado
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(13,148,136,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '500', color: '#0d9488',
            }}>
              {detail.buceador !== '—' ? detail.buceador : '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{detail.buceador}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {detail.pendiente ? 'Lectura pendiente hoy' : 'Lectura completada hoy'}
              </div>
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: detail.pendiente ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }}>
              {detail.pendiente ? '⏱' : '✓'}
            </div>
          </div>
        </div>

        {/* Crecimiento histórico — TDC bars + weight line overlay */}
        {(() => {
          const pesoR = detailReadings
            .filter(r => r.tipo === 'peso' && r.peso)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
          if (pesoR.length < 2) return null;

          const n = pesoR.length;
          // TDC per interval: index i maps to change FROM pesoR[i] TO pesoR[i+1]
          const tdcSeries = [];
          for (let i = 1; i < n; i++) {
            const curr = pesoR[i], prev = pesoR[i - 1];
            const days = Math.max(1, (new Date(curr.fecha) - new Date(prev.fecha)) / 864e5);
            tdcSeries.push((Math.log(curr.peso / prev.peso) / days) * 100);
          }

          const W = 320, H = 134, PL = 36, PR = 40, PT = 10, PB = 22;
          const cW = W - PL - PR, cH = H - PT - PB;

          // X: evenly spaced by reading index
          const toX = j => PL + (n > 1 ? (j / (n - 1)) * cW : cW / 2);

          // Left axis — TDC %
          const minT = Math.min(...tdcSeries, -1), maxT = Math.max(...tdcSeries, 7);
          const rngT = maxT - minT || 1;
          const toTdcY = v => PT + cH - ((v - minT) / rngT) * cH;
          const yZero  = toTdcY(0);
          const barW   = Math.max(4, Math.min(16, (cW / n) * 0.55));
          const catCol = t => t >= 6 ? '#3b82f6' : t >= 3 ? '#4ade80' : t >= 0 ? '#f59e0b' : '#f87171';
          const yTicks = [-2, 0, 3, 6].filter(t => t >= minT - 0.5 && t <= maxT + 0.5);

          // Right axis — peso
          const pesoVals = pesoR.map(r => r.peso);
          const rawMin = Math.min(...pesoVals), rawMax = Math.max(...pesoVals);
          const pad = (rawMax - rawMin) * 0.18 || rawMax * 0.1;
          const pMin = rawMin - pad, pMax = rawMax + pad;
          const toPY  = v => PT + cH - ((v - pMin) / (pMax - pMin || 1)) * cH;
          const useKg = rawMax >= 1000;
          const fmtP  = v => useKg ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}g`;
          const wLine = pesoR.map((r, j) => `${toX(j)},${toPY(r.peso)}`).join(' ');

          const skipX = n > 8 ? 2 : 1;

          return (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', padding: '12px', marginBottom: '14px',
            }}>
              {/* Title + legend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#e2e8f0' }}>Crecimiento histórico</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {[['#3b82f6','>6%'],['#4ade80','3-6%'],['#f59e0b','0-3%'],['#f87171','<0%']].map(([c,r])=>(
                    <div key={r} style={{ display:'flex', alignItems:'center', gap:2 }}>
                      <div style={{ width:6, height:6, borderRadius:1, background:c }}/>
                      <span style={{ fontSize:7.5, color:'#64748b' }}>{r}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                    <div style={{ width:12, height:1.5, background:'rgba(255,255,255,.55)', borderRadius:1 }}/>
                    <span style={{ fontSize:7.5, color:'#64748b' }}>peso</span>
                  </div>
                </div>
              </div>

              <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
                {/* Left gridlines + TDC labels */}
                {yTicks.map(t => {
                  const y = toTdcY(t);
                  if (y < PT - 4 || y > PT + cH + 4) return null;
                  return (
                    <g key={t}>
                      <line x1={PL} y1={y} x2={PL + cW} y2={y}
                        stroke={t === 0 ? 'rgba(148,163,184,.28)' : 'rgba(148,163,184,.1)'}
                        strokeWidth="1" strokeDasharray={t !== 0 ? '3,3' : ''}/>
                      <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#475569">{t}%</text>
                    </g>
                  );
                })}
                {/* Objective line 3% */}
                <line x1={PL} y1={toTdcY(3)} x2={PL + cW} y2={toTdcY(3)}
                  stroke="rgba(74,222,128,.25)" strokeWidth="1" strokeDasharray="4,3"/>

                {/* TDC bars — at reading index i+1 (the destination of each interval) */}
                {tdcSeries.map((tdc, i) => {
                  const col  = catCol(tdc);
                  const isPos = tdc >= 0;
                  const bH   = Math.max(Math.abs(toTdcY(tdc) - yZero), 2);
                  return (
                    <rect key={i}
                      x={toX(i + 1) - barW / 2} y={isPos ? toTdcY(tdc) : yZero}
                      width={barW} height={bH}
                      fill={col} rx="2" opacity=".72"/>
                  );
                })}

                {/* Weight line */}
                <polyline points={wLine}
                  fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>

                {/* Weight dots */}
                {pesoR.map((r, j) => (
                  <circle key={j} cx={toX(j)} cy={toPY(r.peso)} r="2.5"
                    fill="#fff" stroke="#020818" strokeWidth="1"/>
                ))}

                {/* Right axis — peso labels (min / mid / max) */}
                {[rawMin, (rawMin + rawMax) / 2, rawMax].map((v, i) => {
                  const y = toPY(v);
                  if (y < PT - 2 || y > PT + cH + 2) return null;
                  return (
                    <text key={i} x={PL + cW + 5} y={y + 3}
                      textAnchor="start" fontSize="7.5" fill="#475569">
                      {fmtP(v)}
                    </text>
                  );
                })}

                {/* X date labels */}
                {pesoR.map((r, j) => {
                  if (j % skipX !== 0 && j !== n - 1) return null;
                  return (
                    <text key={j} x={toX(j)} y={H - 5}
                      textAnchor={j === 0 ? 'start' : j === n - 1 ? 'end' : 'middle'}
                      fontSize="7" fill="#475569">
                      {r.fecha.slice(5)}
                    </text>
                  );
                })}
              </svg>
            </div>
          );
        })()}

        {/* Reading history */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', padding: '12px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px' }}>
            Historial reciente
          </div>
          {detailReadings.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#94a3b8', padding: '10px', textAlign: 'center' }}>
              Sin lecturas registradas
            </div>
          ) : (
            detailReadings.map((r, i) => {
              const rc = COND_META[r.condiciones] || COND_META.saludable;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 0',
                  borderBottom: i < detailReadings.length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', width: '60px' }}>
                    {r.fecha ? new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PA', { month: 'short', day: 'numeric' }) : '—'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>
                    {r.peso ? `${r.peso.toLocaleString()}g` : '—'}
                  </div>
                  {r.temp && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{r.temp}°C</div>}
                  {r.ph && <div style={{ fontSize: '12px', color: '#94a3b8' }}>pH {r.ph}</div>}
                  <div style={{ fontSize: '12px', color: rc.color }}>
                    {r.condiciones || 'saludable'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Alert for disease */}
        {isAlert && (
          <div style={{
            marginTop: '14px', padding: '12px',
            background: condMeta.bg,
            border: `0.5px solid ${condMeta.color}33`,
            borderRadius: '10px',
          }}>
            <div style={{ fontSize: '13px', color: condMeta.color, fontWeight: '500', marginBottom: '4px' }}>
              ⚠ Acción requerida: {detail.condicion === 'ice-ice' ? 'cosecha inmediata' : 'limpieza programada'}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Verifique y asigne tarea al buceador si no existe.
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  const pendingN = systems.filter((s) => s.pendiente).length;
  const alertsN  = systems.filter((s) => s.isAlert).length;
  const visible  = filter === 'pendientes' ? systems.filter(s => s.pendiente)
    : filter === 'alertas' ? systems.filter(s => s.isAlert)
    : systems;

  return (
    <div style={{
      background: '#020818',
      minHeight: '100vh',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e2e8f0',
      paddingBottom: '80px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '500' }}>Mis sistemas</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Capitán · {profile?.name || profile?.nombre || myInitials || '—'}
          </div>
        </div>
      </div>

      {/* Summary cards — tappable as filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div onClick={() => setFilter('todos')} style={{
          flex: 1, background: filter==='todos' ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.03)',
          border: `0.5px solid ${filter==='todos' ? '#0d9488' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer',
        }}>
          <div style={{ fontSize: '11px', color: filter==='todos' ? '#0d9488' : '#94a3b8' }}>Todos</div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: filter==='todos' ? '#0d9488' : '#e2e8f0' }}>{systems.length}</div>
        </div>
        <div onClick={() => setFilter('pendientes')} style={{
          flex: 1,
          background: filter==='pendientes' ? 'rgba(245,158,11,0.2)' : pendingN ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
          border: `0.5px solid ${filter==='pendientes' ? '#f59e0b' : pendingN ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
          borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer',
        }}>
          <div style={{ fontSize: '11px', color: pendingN ? '#f59e0b' : '#22c55e' }}>Pendientes hoy</div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: pendingN ? '#f59e0b' : '#22c55e' }}>{pendingN}</div>
        </div>
        <div onClick={() => setFilter('alertas')} style={{
          flex: 1,
          background: filter==='alertas' ? 'rgba(239,68,68,0.2)' : alertsN ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
          border: `0.5px solid ${filter==='alertas' ? '#ef4444' : alertsN ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
          borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer',
        }}>
          <div style={{ fontSize: '11px', color: alertsN ? '#ef4444' : '#22c55e' }}>⚠ Alertas</div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: alertsN ? '#ef4444' : '#22c55e' }}>{alertsN}</div>
        </div>
      </div>

      {/* Active filter label */}
      {filter !== 'todos' && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <span style={{ fontSize:11, color:'#64748b' }}>
            Mostrando: <strong style={{ color: filter==='alertas'?'#ef4444':'#f59e0b' }}>{visible.length} sistema{visible.length!==1?'s':''}</strong>
          </span>
          <button onClick={() => setFilter('todos')} style={{ fontSize:10, padding:'2px 8px', borderRadius:6, border:'0.5px solid rgba(148,163,184,.2)', background:'transparent', color:'#64748b', cursor:'pointer' }}>
            × Limpiar
          </button>
        </div>
      )}

      {/* System cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Cargando...</div>
      ) : visible.length === 0 && filter !== 'todos' ? (
        <div style={{ textAlign:'center', padding:'32px 20px', background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.08)', borderRadius:12, color:'#64748b' }}>
          <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
          <div style={{ fontSize:13, fontWeight:600 }}>{filter==='alertas' ? 'Sin alertas activas' : 'Todo al día'}</div>
        </div>
      ) : systems.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', color: '#94a3b8',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌊</div>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Sin sistemas asignados</div>
          <div style={{ fontSize: '12px' }}>Contacta al administrador para asignarte sistemas.</div>
        </div>
      ) : (
        visible.map((sys) => {
          const condMeta = COND_META[sys.condicion] || COND_META.saludable;
          const isAlert = sys.isAlert;
          return (
            <div
              key={sys.id}
              onClick={() => openDetail(sys)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `0.5px solid ${isAlert ? condMeta.color + '33' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px', padding: '14px', cursor: 'pointer', marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: CAT_COLORS[sys.categoria] || '#0d9488',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0,
                }}>
                  {sys.id}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: '500' }}>{sys.id}</span>
                    <span style={{
                      fontSize: '11px', padding: '1px 6px', borderRadius: '6px',
                      background: 'rgba(255,255,255,0.06)',
                      color: CAT_COLORS[sys.categoria] || '#0d9488',
                    }}>
                      {sys.categoria || '—'}
                    </span>
                    {sys.pendiente && (
                      <span style={{
                        fontSize: '11px', padding: '1px 6px', borderRadius: '6px',
                        background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                      }}>
                        pendiente
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    {sys.tipo} · prof. {sys.depth} · {sys.region}
                  </div>
                </div>
                <span style={{ fontSize: '18px', color: '#94a3b8' }}>›</span>
              </div>

              {/* Bottom row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                paddingTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.04)',
                fontSize: '12px',
              }}>
                <span style={{ color: '#94a3b8' }}>👤 {sys.buceador}</span>
                <span style={{ color: '#94a3b8' }}>
                  {sys.lastPeso ? `${sys.lastPeso.toLocaleString()}g` : '—'}
                </span>
                {sys.tdc !== null && (
                  <span style={{ fontWeight: '500', color: sys.tdc > 0 ? '#22c55e' : '#ef4444' }}>
                    {sys.tdc > 0 ? '↑' : '↓'}{sys.tdc}%/d
                  </span>
                )}
                <span style={{ marginLeft: 'auto', color: condMeta.color }}>
                  {sys.condicion}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
