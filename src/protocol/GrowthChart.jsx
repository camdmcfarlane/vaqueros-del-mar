// GrowthChart.jsx
// Post-save confirmation screen with TDC growth chart for the system
// Shows summary metrics + SVG line chart of recent readings

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function calcTDC(pesoNuevo, pesoAnterior, dias, cosechadaAnterior = 0, sembradoNuevo = 0, sueltosNuevo = 0, sueltosAnterior = 0) {
  const adjNow  = (pesoNuevo  || 0) + (sueltosNuevo    || 0) - (sembradoNuevo    || 0);
  const adjPrev = (pesoAnterior || 0) + (sueltosAnterior || 0) - (cosechadaAnterior || 0);
  if (!adjNow || !adjPrev || adjNow <= 0 || adjPrev <= 0 || !dias || dias <= 0) return null;
  return (Math.log(adjNow / adjPrev) / dias * 100).toFixed(2);
}

const COND_COLORS = {
  saludable: '#22c55e',
  epifitas: '#f59e0b',
  'ice-ice': '#ef4444',
  decoloracion: '#a78bfa',
};

export default function GrowthChart({ system, latestPeso, condicion, onNext, completedCount, totalCount }) {
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    loadReadings();
  }, [system.id]);

  async function loadReadings() {
    const { data } = await supabase
      .from('lecturas')
      .select('fecha, peso, sueltos, cosechada, sembrado')
      .eq('sistema', system.id)
      .not('peso', 'is', null)
      .order('fecha', { ascending: true })
      .limit(10);

    const pts = (data || []).map((r) => ({
      date: new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-PA', { month: 'short', day: 'numeric' }),
      peso: r.peso,
      sueltos: r.sueltos || 0,
      cosechada: r.cosechada || 0,
      sembrado: r.sembrado || 0,
    }));

    // Add the just-saved reading
    pts.push({
      date: new Date().toLocaleDateString('es-PA', { month: 'short', day: 'numeric' }),
      peso: latestPeso,
      sueltos: 0,
      cosechada: 0,
      sembrado: 0,
    });

    setReadings(pts);
  }

  // Calculate TDC from last two points
  const prevReading = readings.length >= 2 ? readings[readings.length - 2] : null;
  const tdc = prevReading
    ? calcTDC(
        latestPeso,
        prevReading.peso,
        Math.max(1, Math.round((Date.now() - new Date(system.lastDate + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))),
        prevReading.cosechada,
        0,
        0,
        prevReading.sueltos
      )
    : null;

  // SVG chart
  const W = 360, H = 160;
  let chartSvg = null;
  if (readings.length >= 2) {
    const pesos = readings.map((r) => r.peso);
    const maxP = Math.max(...pesos) * 1.1;
    const minP = Math.min(...pesos) * 0.9;
    const range = maxP - minP || 1;

    const points = readings.map((r, i) => ({
      x: 30 + i * (W - 60) / (readings.length - 1),
      y: H - 20 - ((r.peso - minP) / range) * (H - 40),
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaD = `${pathD} L${points[points.length - 1].x},${H - 20} L${points[0].x},${H - 20} Z`;

    chartSvg = (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <path d={areaD} fill="rgba(13,148,136,0.15)" />
        <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 5 : 4}
              fill={i === points.length - 1 ? '#fff' : '#0d9488'}
              stroke="#0d9488"
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={H - 4}
              fill="#94a3b8"
              fontSize="9"
              textAnchor="middle"
              fontFamily="system-ui"
            >
              {readings[i].date}
            </text>
            <text
              x={p.x}
              y={p.y - 10}
              fill="#e2e8f0"
              fontSize="10"
              textAnchor="middle"
              fontWeight="500"
              fontFamily="system-ui"
            >
              {readings[i].peso.toLocaleString()}g
            </text>
          </g>
        ))}
      </svg>
    );
  }

  return (
    <div>
      {/* Success header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 10px',
          fontSize: '26px',
        }}>
          ✓
        </div>
        <div style={{ fontSize: '18px', fontWeight: '500', color: '#e2e8f0' }}>
          Lectura guardada — {system.id}
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
          {condicion === 'saludable' ? 'Condición saludable' : `Protocolo ${condicion} registrado`}
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Peso', value: `${latestPeso.toLocaleString()}g`, color: '#0d9488' },
          { label: 'Crecimiento', value: tdc ? `${tdc}%/día` : '—', color: tdc && parseFloat(tdc) > 0 ? '#22c55e' : '#ef4444' },
          { label: 'Condición', value: condicion || '—', color: COND_COLORS[condicion] || '#94a3b8' },
        ].map((m) => (
          <div key={m.label} style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{m.label}</div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '16px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '10px' }}>
          Historial de crecimiento
        </div>
        {chartSvg || (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
            Se necesitan al menos 2 lecturas para mostrar el gráfico
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        style={{
          width: '100%',
          height: '56px',
          borderRadius: '12px',
          border: 'none',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          background: '#0d9488',
          color: '#fff',
        }}
      >
        {completedCount < totalCount ? 'Siguiente sistema →' : 'Volver al turno'}
      </button>
    </div>
  );
}
