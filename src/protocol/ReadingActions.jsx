// ReadingActions.jsx
// Edit and delete controls for readings and systems
// Only visible to admin, consultor, and director roles
// Used inside system detail view or reading history panels

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { PERMISSIONS } from '../utils/roleGuard';

const styles = {
  actionBar: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  btn: (color, bg) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    background: bg,
    color: color,
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
  }),
  editModal: {
    background: 'rgba(255,255,255,0.03)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '10px',
  },
  fieldRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  },
  field: {
    flex: 1,
    minWidth: '80px',
  },
  label: {
    fontSize: '11px',
    color: '#94a3b8',
    display: 'block',
    marginBottom: '3px',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    height: '40px',
    fontSize: '14px',
    background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    color: '#e2e8f0',
    padding: '0 10px',
    outline: 'none',
  },
  saveRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '12px',
  },
  confirmOverlay: {
    padding: '12px',
    background: 'rgba(239,68,68,0.15)',
    border: '0.5px solid rgba(239,68,68,0.3)',
    borderRadius: '8px',
    marginTop: '10px',
  },
};

// ── Edit Reading ──
export function EditReading({ reading, sistema, onSaved, onCancel }) {
  const { profile } = useAuth();
  const role = profile?.role || 'vaquero';
  const isComercial = ['Comercial', 'Sistema 75m'].includes(sistema?.tipo);
  const initModules = Array.isArray(reading.module_weights) && reading.module_weights.length === 15
    ? reading.module_weights.map(v => v != null ? String(v) : '')
    : Array(15).fill('');
  const [form, setForm] = useState({
    peso: reading.peso || '',
    sueltos: reading.sueltos || '',
    ph: reading.ph || '',
    temp: reading.temp || '',
    salinidad: reading.salinidad || '',
    condiciones: reading.condiciones || '',
    cosechada: reading.cosechada || '',
    notas: reading.notas || '',
    moduleWeights: initModules,
  });
  const [saving, setSaving] = useState(false);

  if (!PERMISSIONS.canEditReadings(role)) return null;

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const updates = {
        peso: parseFloat(form.peso) || null,
        sueltos: parseFloat(form.sueltos) || null,
        ph: parseFloat(form.ph) || null,
        temp: parseFloat(form.temp) || null,
        salinidad: parseFloat(form.salinidad) || null,
        condiciones: form.condiciones || null,
        cosechada: parseFloat(form.cosechada) || null,
        notas: form.notas || null,
        module_weights: isComercial ? form.moduleWeights.map(v => parseFloat(v) || null) : reading.module_weights || null,
        editado_por: profile?.id,
        editado_en: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('lecturas')
        .update(updates)
        .eq('id', reading.id);

      if (error) throw error;
      onSaved?.();
    } catch (err) {
      console.error('Error updating reading:', err);
    }
    setSaving(false);
  }

  return (
    <div style={styles.editModal}>
      <div style={{ fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '12px' }}>
        Editar lectura — {reading.sistema} ({reading.fecha})
      </div>

      {isComercial && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginBottom: 6 }}>
            Módulos M1–M15 (g) <span style={{ fontWeight: 400, color: '#475569' }}>— mín. 4 para calcular</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
            {Array.from({length: 15}, (_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: '#64748b', width: 28, flexShrink: 0, fontFamily: 'monospace' }}>M{i+1}</span>
                <input type="number" inputMode="numeric" placeholder="0"
                  value={form.moduleWeights[i] || ''}
                  onChange={e => {
                    const mw = [...form.moduleWeights];
                    mw[i] = e.target.value;
                    const filled = mw.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
                    const biomass = filled.length >= 4 ? Math.round((filled.reduce((a,b)=>a+b,0)/filled.length)*15) : 0;
                    update('moduleWeights', mw);
                    if (biomass > 0) update('peso', String(biomass));
                  }}
                  style={{ ...styles.input, fontSize: 11, padding: '4px 6px' }}/>
              </div>
            ))}
          </div>
          {form.peso && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(13,148,136,.08)', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>Biomasa estimada</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#2dd4bf', fontFamily: 'monospace' }}>{(parseFloat(form.peso)/1000).toFixed(2)} kg</span>
            </div>
          )}
        </div>
      )}
      <div style={styles.fieldRow}>
        {[
          { key: 'peso', label: 'Peso (g)' },
          { key: 'sueltos', label: 'Sueltos (g)' },
          { key: 'temp', label: 'Temp °C' },
          { key: 'ph', label: 'pH' },
          { key: 'salinidad', label: 'Sal ‰' },
        ].map((f) => (
          <div key={f.key} style={styles.field}>
            <label style={styles.label}>{f.label}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={form[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              style={styles.input}
            />
          </div>
        ))}
      </div>

      <div style={styles.fieldRow}>
        <div style={{ ...styles.field, minWidth: '120px' }}>
          <label style={styles.label}>Condición</label>
          <select
            value={form.condiciones}
            onChange={(e) => update('condiciones', e.target.value)}
            style={{ ...styles.input, padding: '0 6px' }}
          >
            <option value="">—</option>
            <option value="saludable">Saludable</option>
            <option value="epifitas">Epifitas</option>
            <option value="ice-ice">Ice-ice</option>
            <option value="decoloracion">Decoloración</option>
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Cosechada (g)</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.cosechada}
            onChange={(e) => update('cosechada', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={styles.label}>Notas</label>
        <input
          type="text"
          value={form.notas}
          onChange={(e) => update('notas', e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.saveRow}>
        <button
          onClick={onCancel}
          style={styles.btn('#94a3b8', 'rgba(255,255,255,0.06)')}
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          style={styles.btn('#fff', '#0d9488')}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

// ── Delete Reading ──
export function DeleteReading({ reading, onDeleted, onCancel }) {
  const { profile } = useAuth();
  const role = profile?.role || 'vaquero';
  const [deleting, setDeleting] = useState(false);

  if (!PERMISSIONS.canDeleteReadings(role)) return null;

  async function confirmDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('lecturas')
        .delete()
        .eq('id', reading.id);

      if (error) throw error;
      onDeleted?.();
    } catch (err) {
      console.error('Error deleting reading:', err);
    }
    setDeleting(false);
  }

  return (
    <div style={styles.confirmOverlay}>
      <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500', marginBottom: '8px' }}>
        ¿Eliminar lectura de {reading.sistema} ({reading.fecha})?
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
        Esta acción no se puede deshacer. Se eliminarán los datos de peso, parámetros y condición.
      </div>
      <div style={styles.saveRow}>
        <button onClick={onCancel} style={styles.btn('#94a3b8', 'rgba(255,255,255,0.06)')}>
          Cancelar
        </button>
        <button onClick={confirmDelete} disabled={deleting} style={styles.btn('#fff', '#ef4444')}>
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  );
}

// ── Delete System ──
export function DeleteSystem({ system, onDeleted, onCancel }) {
  const { profile } = useAuth();
  const role = profile?.role || 'vaquero';
  const [deleting, setDeleting] = useState(false);

  if (!PERMISSIONS.canDeleteSystems(role)) return null;

  async function confirmDelete() {
    setDeleting(true);
    try {
      // Delete all readings for this system first
      await supabase
        .from('lecturas')
        .delete()
        .eq('sistema', system.id);

      // Then delete the system
      const { error } = await supabase
        .from('sistemas')
        .delete()
        .eq('id', system.id);

      if (error) throw error;
      onDeleted?.();
    } catch (err) {
      console.error('Error deleting system:', err);
    }
    setDeleting(false);
  }

  return (
    <div style={styles.confirmOverlay}>
      <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500', marginBottom: '8px' }}>
        ¿Eliminar sistema {system.id}?
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
        Se eliminarán el sistema y todas sus lecturas ({system.tipo} · {system.region}).
        Esta acción no se puede deshacer.
      </div>
      <div style={styles.saveRow}>
        <button onClick={onCancel} style={styles.btn('#94a3b8', 'rgba(255,255,255,0.06)')}>
          Cancelar
        </button>
        <button onClick={confirmDelete} disabled={deleting} style={styles.btn('#fff', '#ef4444')}>
          {deleting ? 'Eliminando...' : 'Eliminar sistema'}
        </button>
      </div>
    </div>
  );
}

// ── Convenience: action buttons row for a reading ──
export function ReadingActionButtons({ reading, onEdit, onDelete }) {
  const { profile } = useAuth();
  const role = profile?.role || 'vaquero';
  const canEdit = PERMISSIONS.canEditReadings(role);
  const canDelete = PERMISSIONS.canDeleteReadings(role);

  if (!canEdit && !canDelete) return null;

  return (
    <div style={styles.actionBar}>
      {canEdit && (
        <button onClick={() => onEdit(reading)} style={styles.btn('#0d9488', 'rgba(13,148,136,0.15)')}>
          ✏ Editar
        </button>
      )}
      {canDelete && (
        <button onClick={() => onDelete(reading)} style={styles.btn('#ef4444', 'rgba(239,68,68,0.15)')}>
          🗑 Eliminar
        </button>
      )}
    </div>
  );
}
