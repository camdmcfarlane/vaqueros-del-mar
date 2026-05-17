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

function enrichSystems(rawSystems, readingsData) {
  const today = new Date().toISOString().split('T')[0];
  return rawSystems.map((sys) => {
    const sysReadings = (readingsData || [])
      .filter((r) => r.sistema === sys.id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const latest = sysReadings[0] || null;
    const todayReading = sysReadings.find((r) => r.fecha === today);

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

    return {
      ...sys,
      depth: sys.profundidad || sys.depth || '—',
      lastPeso: latest?.peso || null,
      lastDate: latest?.fecha || null,
      condicion: latest?.condiciones || 'saludable',
      tdc: tdc ? parseFloat(tdc) : null,
      pendiente: !todayReading,
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (propSystems !== undefined) {
      setSystems(enrichSystems(propSystems, propReadings || []));
      setLoading(false);
    } else {
      loadFromSupabase();
    }
  }, []); // intentionally run once on mount; parent re-mounts on tab switch

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
        .slice(0, 10);
      setDetailReadings(filtered);
    } else {
      supabase
        .from('lecturas')
        .select('*')
        .eq('sistema', sys.id)
        .order('fecha', { ascending: false })
        .limit(10)
        .then(({ data }) => setDetailReadings(data || []));
    }
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (detail) {
    const condMeta = COND_META[detail.condicion] || COND_META.saludable;
    const isAlert = detail.condicion !== 'saludable';

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
  const pending = systems.filter((s) => s.pendiente).length;
  const alerts = systems.filter((s) => s.condicion !== 'saludable').length;

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

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', padding: '10px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Sistemas</div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: '#0d9488' }}>{systems.length}</div>
        </div>
        <div style={{
          flex: 1,
          background: pending ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
          border: `0.5px solid ${pending ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
          borderRadius: '10px', padding: '10px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: pending ? '#f59e0b' : '#22c55e' }}>Pendientes hoy</div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: pending ? '#f59e0b' : '#22c55e' }}>{pending}</div>
        </div>
        <div style={{
          flex: 1,
          background: alerts ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          border: `0.5px solid ${alerts ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
          borderRadius: '10px', padding: '10px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: alerts ? '#ef4444' : '#22c55e' }}>Alertas</div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: alerts ? '#ef4444' : '#22c55e' }}>{alerts}</div>
        </div>
      </div>

      {/* System cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Cargando...</div>
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
        systems.map((sys) => {
          const condMeta = COND_META[sys.condicion] || COND_META.saludable;
          const isAlert = sys.condicion !== 'saludable';
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
