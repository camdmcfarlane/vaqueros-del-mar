// ConditionAssessment.jsx
// 2x2 grid of condition buttons with immediate protocol trigger for ice-ice / epifitas

import React from 'react';

const CONDITIONS = [
  { id: 'saludable', label: 'Saludable', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  { id: 'epifitas', label: 'Epifitas', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { id: 'ice-ice', label: 'Ice-ice', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { id: 'decoloracion', label: 'Decoloración', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
];

export default function ConditionAssessment({ selected, onSelect, cosechada, onCosechadaChange }) {
  const needsProtocol = selected === 'epifitas' || selected === 'ice-ice';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '14px',
    }}>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px', fontWeight: '500' }}>
        Condición del alga
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
      }}>
        {CONDITIONS.map((c) => {
          const isSelected = selected === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                height: '64px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                border: `${isSelected ? '2px' : '0.5px'} solid ${isSelected ? c.color : 'rgba(255,255,255,0.08)'}`,
                background: isSelected ? c.bg : 'rgba(255,255,255,0.04)',
                color: isSelected ? c.color : '#94a3b8',
                transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Protocol trigger for disease conditions */}
      {needsProtocol && (
        <div style={{
          marginTop: '14px',
          padding: '14px',
          background: 'rgba(239,68,68,0.15)',
          border: '0.5px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
        }}>
          <div style={{
            fontSize: '13px',
            color: '#ef4444',
            fontWeight: '500',
            marginBottom: '8px',
          }}>
            ⚠ Protocolo: registre peso cosechado/removido
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={cosechada}
            onChange={(e) => onCosechadaChange(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: '52px',
              fontSize: '18px',
              background: 'rgba(0,0,0,0.3)',
              border: '0.5px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              color: '#e2e8f0',
              padding: '0 16px',
              textAlign: 'center',
              outline: 'none',
            }}
            placeholder="Peso removido (g)"
          />
        </div>
      )}
    </div>
  );
}
