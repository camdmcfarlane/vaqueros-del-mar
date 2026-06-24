// LongLineBuoyInput.jsx
// 10-buoy weight input grid for Long Line systems
// 5x2 grid, each buoy individually fillable, auto-sums to total

import React from 'react';

function calcTDC(pesoNuevo, pesoAnterior, dias, cosechadaAnterior = 0) {
  const adjNow  = pesoNuevo || 0;
  const adjPrev = (pesoAnterior || 0) - (cosechadaAnterior || 0);
  if (!adjNow || !adjPrev || adjNow <= 0 || adjPrev <= 0 || !dias || dias <= 0) return null;
  return (Math.log(adjNow / adjPrev) / dias * 100).toFixed(2);
}

export default function LongLineBuoyInput({ buoys, onBuoyChange, total, lastTotal, daysSince, lastCosechada = 0 }) {
  const filledCount = buoys.filter((b) => parseFloat(b) > 0).length;
  const numericTotal = parseFloat(total) || 0;
  const filledBuoys = buoys.filter((b) => parseFloat(b) > 0);
  const avg = filledCount > 0 ? Math.round(numericTotal / filledCount) : 0;
  const min = filledCount > 0 ? Math.min(...filledBuoys.map(Number)) : 0;
  const max = filledCount > 0 ? Math.max(...filledBuoys.map(Number)) : 0;
  const tdc = calcTDC(numericTotal || null, lastTotal, daysSince, lastCosechada);

  return (
    <div>
      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px', fontWeight: '500' }}>
        Peso por boya (g)
      </div>

      {/* 5x2 grid of buoy inputs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        marginBottom: '14px',
      }}>
        {buoys.map((w, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
              B{i + 1}
            </div>
            <input
              type="number"
              inputMode="numeric"
              value={w}
              onChange={(e) => onBuoyChange(i, e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                height: '48px',
                fontSize: '16px',
                fontWeight: '500',
                background: 'rgba(255,255,255,0.06)',
                border: `0.5px solid ${parseFloat(w) > 0 ? '#0d9488' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: '#e2e8f0',
                padding: '0',
                textAlign: 'center',
                outline: 'none',
              }}
              placeholder="0"
            />
          </div>
        ))}
      </div>

      {/* Total display */}
      <div style={{
        background: numericTotal > 0 ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.04)',
        border: `0.5px solid ${numericTotal > 0 ? 'rgba(13,148,136,0.2)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '10px',
        padding: '14px',
        textAlign: 'center',
        marginBottom: '10px',
      }}>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
          Total del sistema
        </div>
        <div style={{
          fontSize: '28px',
          fontWeight: '500',
          color: numericTotal > 0 ? '#0d9488' : '#94a3b8',
        }}>
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

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Boyas</div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#0d9488' }}>
            {filledCount}/10
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Prom.</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>{avg}g</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Min / Max</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{min} / {max}g</div>
        </div>
      </div>
    </div>
  );
}
