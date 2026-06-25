// CanastaTieInput.jsx
// Up to 6 individual tie weights for Canasta / Redes tubulares
// Auto-sums to total peso; only the sum is saved to Supabase

import React from 'react';

function calcTDC(pesoNuevo, pesoAnterior, dias, cosechadaAnterior = 0, sueltosNuevo = 0, sueltosAnterior = 0) {
  const adjNow  = (pesoNuevo  || 0) + (sueltosNuevo  || 0);
  const adjPrev = (pesoAnterior || 0) + (sueltosAnterior || 0) - (cosechadaAnterior || 0);
  if (!adjNow || !adjPrev || adjNow <= 0 || adjPrev <= 0 || !dias || dias <= 0) return null;
  return (Math.log(adjNow / adjPrev) / dias * 100).toFixed(2);
}

export default function CanastaTieInput({ ties, onTieChange, total, lastTotal, daysSince, lastCosechada = 0, lastSueltos = 0 }) {
  const filledCount  = ties.filter((t) => parseFloat(t) > 0).length;
  const numericTotal = parseFloat(total) || 0;
  const tdc = calcTDC(numericTotal || null, lastTotal, daysSince, lastCosechada, 0, lastSueltos);

  return (
    <div>
      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px', fontWeight: '500' }}>
        Peso por amarre (g)
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        marginBottom: '14px',
      }}>
        {ties.map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.06)',
            border: `0.5px solid ${parseFloat(w) > 0 ? '#0d9488' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px', padding: '6px 10px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', minWidth: '18px' }}>{i + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              value={w}
              onChange={(e) => onTieChange(i, e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: '17px',
                fontWeight: '500',
                color: '#e2e8f0',
                outline: 'none',
                minWidth: 0,
                textAlign: 'right',
              }}
              placeholder="0"
            />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>g</span>
          </div>
        ))}
      </div>

      <div style={{
        background: numericTotal > 0 ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.04)',
        border: `0.5px solid ${numericTotal > 0 ? 'rgba(13,148,136,0.2)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '10px',
        padding: '14px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
          Total del sistema
        </div>
        <div style={{ fontSize: '28px', fontWeight: '500', color: numericTotal > 0 ? '#0d9488' : '#94a3b8' }}>
          {numericTotal.toLocaleString()}g
        </div>
        {lastTotal && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Anterior: {lastTotal.toLocaleString()}g
          </div>
        )}
        {numericTotal > 0 && tdc && (
          <div style={{
            marginTop: '8px',
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '8px',
            background: parseFloat(tdc) > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            fontSize: '13px',
            fontWeight: '500',
            color: parseFloat(tdc) > 0 ? '#22c55e' : '#ef4444',
          }}>
            Crecimiento: {tdc}%/día
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '11px', color: '#475569' }}>
          {filledCount} / {ties.length} amarres con peso
        </span>
      </div>
    </div>
  );
}
