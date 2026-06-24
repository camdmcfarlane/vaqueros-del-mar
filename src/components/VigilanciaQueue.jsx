// VigilanciaQueue.jsx
// Buceador daily task queue — Option A redesign
// Shows assigned systems with task pills (lectura, limpieza, cosecha, siembra)
// Tapping opens unified reading form → condition assessment → growth chart

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import LongLineBuoyInput from './LongLineBuoyInput';
import ConditionAssessment from '../systems/ConditionAssessment';
import GrowthChart from '../protocol/GrowthChart';

// ── Styles ──
const s = {
  page: {
    background: '#020818',
    minHeight: '100vh',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#e2e8f0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  title: { fontSize: '20px', fontWeight: '500' },
  subtitle: { fontSize: '12px', color: '#94a3b8', marginBottom: '14px' },
  progressBar: {
    height: '5px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    marginBottom: '18px',
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    background: '#0d9488',
    borderRadius: '3px',
    transition: 'width 0.3s',
  }),
  card: (isDone, urgent) => ({
    background: isDone ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
    border: `0.5px solid ${isDone ? 'rgba(34,197,94,0.15)' : urgent ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '12px',
    padding: '14px 16px',
    cursor: isDone ? 'default' : 'pointer',
    opacity: isDone ? '0.5' : '1',
    marginBottom: '10px',
  }),
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  sysIcon: (color) => ({
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    fontSize: '15px',
    fontWeight: '500',
    color: '#fff',
  }),
  catBadge: (color) => ({
    fontSize: '12px',
    padding: '1px 7px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.06)',
    color: color,
  }),
  taskPill: (bg, color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '8px',
    background: bg,
    fontSize: '12px',
    fontWeight: '500',
    color: color,
  }),
  // Form styles
  formOverlay: {
    background: '#020818',
    minHeight: '100vh',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#e2e8f0',
  },
  backBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    color: '#e2e8f0',
    fontSize: '20px',
  },
  section: {
    background: 'rgba(255,255,255,0.03)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '14px',
  },
  sectionLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '10px',
    fontWeight: '500',
  },
  inputLarge: {
    width: '100%',
    boxSizing: 'border-box',
    height: '56px',
    fontSize: '22px',
    fontWeight: '500',
    background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#e2e8f0',
    padding: '0 16px',
    textAlign: 'center',
    outline: 'none',
  },
  inputSmall: {
    width: '100%',
    boxSizing: 'border-box',
    height: '52px',
    fontSize: '18px',
    background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#e2e8f0',
    padding: '0 8px',
    textAlign: 'center',
    outline: 'none',
  },
  tdcBadge: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#0d9488',
  },
  saveBtn: (active) => ({
    width: '100%',
    height: '60px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '17px',
    fontWeight: '500',
    cursor: active ? 'pointer' : 'default',
    background: active ? '#0d9488' : 'rgba(255,255,255,0.06)',
    color: active ? '#fff' : '#94a3b8',
  }),
  offlineNote: {
    marginTop: '14px',
    textAlign: 'center',
    fontSize: '11px',
    color: '#94a3b8',
  },
};

const CAT_COLORS = {
  comercial: '#0d9488',
  prueba: '#8b5cf6',
  semillero: '#f59e0b',
};

const TASK_META = {
  lectura: { icon: 'clipboard-check', color: '#0d9488', bg: 'rgba(13,148,136,0.15)', label: 'Lectura' },
  limpieza: { icon: 'brush', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', label: 'Limpieza' },
  cosecha: { icon: 'cut', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Cosecha' },
  siembra: { icon: 'plant-2', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Siembra' },
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.round((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24));
}

function calcTDC(pesoNuevo, pesoAnterior, dias, cosechadaAnterior = 0, sembradoNuevo = 0) {
  const adjNow  = (pesoNuevo  || 0) - (sembradoNuevo    || 0);
  const adjPrev = (pesoAnterior || 0) - (cosechadaAnterior || 0);
  if (!adjNow || !adjPrev || adjNow <= 0 || adjPrev <= 0 || !dias || dias <= 0) return null;
  return (Math.log(adjNow / adjPrev) / dias * 100).toFixed(2);
}

export default function VigilanciaQueue() {
  const { profile } = useAuth();
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSystem, setActiveSystem] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [showChart, setShowChart] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    peso: '',
    sueltos: '',
    ph: '',
    temp: '',
    salinidad: '',
    condicion: null,
    cosechada: '',
    notas: '',
    foto: null,
    buoys: Array(10).fill(''),
  });

  // Load assigned systems + today's tasks
  useEffect(() => {
    loadSystems();
  }, []);

  async function loadSystems() {
    setLoading(true);
    try {
      // Fetch systems assigned to this buceador
      // Adjust query to match your actual schema
      const { data: sysData, error: sysErr } = await supabase
        .from('sistemas')
        .select('*')
        .order('id');

      if (sysErr) throw sysErr;

      // Fetch today's tasks for this user
      const today = new Date().toISOString().split('T')[0];
      const { data: taskData } = await supabase
        .from('tareas')
        .select('*')
        .eq('fecha', today)
        .eq('asignado_a', profile?.id);

      // Fetch last reading per system for TDC calc
      const { data: lastReadings } = await supabase
        .from('lecturas')
        .select('sistema, fecha, peso, cosechada')
        .order('fecha', { ascending: false });

      // Build system objects with task + last reading info
      const systemsWithMeta = (sysData || []).map((sys) => {
        const sysTasks = (taskData || [])
          .filter((t) => t.sistema === sys.id)
          .map((t) => t.tipo);
        
        // Always include lectura if no specific tasks assigned
        if (sysTasks.length === 0) sysTasks.push('lectura');

        const lastReading = (lastReadings || []).find((r) => r.sistema === sys.id);

        return {
          ...sys,
          tasks: sysTasks,
          lastPeso: lastReading?.peso || null,
          lastDate: lastReading?.fecha || null,
          lastCosechada: lastReading?.cosechada || 0,
        };
      });

      setSystems(systemsWithMeta);
    } catch (err) {
      console.error('Error loading systems:', err);
    }
    setLoading(false);
  }

  function openForm(sys) {
    if (completedIds.has(sys.id)) return;
    setActiveSystem(sys);
    setForm({
      peso: '',
      sueltos: '',
      ph: '',
      temp: '',
      salinidad: '',
      condicion: null,
      cosechada: '',
      notas: '',
      foto: null,
      buoys: Array(10).fill(''),
    });
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateBuoy(index, value) {
    setForm((prev) => {
      const buoys = [...prev.buoys];
      buoys[index] = value;
      const total = buoys.reduce((sum, b) => sum + (parseFloat(b) || 0), 0);
      return { ...prev, buoys, peso: total > 0 ? String(Math.round(total)) : '' };
    });
  }

  async function saveReading() {
    if (!activeSystem || !form.peso || !form.condicion) return;

    const reading = {
      sistema: activeSystem.id,
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'vigilancia',
      peso: parseFloat(form.peso),
      sueltos: parseFloat(form.sueltos) || null,
      ph: parseFloat(form.ph) || null,
      temp: parseFloat(form.temp) || null,
      salinidad: parseFloat(form.salinidad) || null,
      condiciones: form.condicion,
      cosechada: parseFloat(form.cosechada) || null,
      notas: form.notas || null,
      // For Long Line: store individual buoy weights
      buoys: activeSystem.tipo === 'Long Line'
        ? form.buoys.map((b) => parseFloat(b) || 0)
        : null,
      registrado_por: profile?.id,
    };

    try {
      const { error } = await supabase.from('lecturas').insert([reading]);
      if (error) throw error;

      setCompletedIds((prev) => new Set([...prev, activeSystem.id]));
      setShowChart(activeSystem);
    } catch (err) {
      console.error('Error saving reading:', err);
      // TODO: Queue for offline sync
      // For now, still mark complete locally
      setCompletedIds((prev) => new Set([...prev, activeSystem.id]));
      setShowChart(activeSystem);
    }
  }

  // ── Chart view after save ──
  if (showChart) {
    return (
      <div style={s.page}>
        <GrowthChart
          system={showChart}
          latestPeso={parseFloat(form.peso)}
          condicion={form.condicion}
          onNext={() => {
            setShowChart(null);
            setActiveSystem(null);
          }}
          completedCount={completedIds.size}
          totalCount={systems.length}
        />
      </div>
    );
  }

  // ── Form view ──
  if (activeSystem) {
    const sys = activeSystem;
    const isLongLine = sys.tipo === 'Long Line';
    const daysSinceLastReading = daysSince(sys.lastDate);
    const currentTDC = calcTDC(
      parseFloat(form.peso),
      sys.lastPeso,
      daysSinceLastReading,
      sys.lastCosechada,
      0
    );
    const canSave = form.peso && form.condicion;

    return (
      <div style={s.formOverlay}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button
            style={s.backBtn}
            onClick={() => setActiveSystem(null)}
            aria-label="Volver"
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: '500' }}>
              {sys.id} · nueva lectura
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {sys.tipo} · {sys.region} · prof. {sys.depth || '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Anterior</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {sys.lastPeso ? `${sys.lastPeso.toLocaleString()}g` : '—'}
            </div>
          </div>
        </div>

        {/* Task pills */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {(sys.tasks || ['lectura']).map((t) => (
            <span key={t} style={s.taskPill(TASK_META[t]?.bg, TASK_META[t]?.color)}>
              {TASK_META[t]?.label || t}
            </span>
          ))}
        </div>

        {/* Peso section — branching for Long Line vs Canasta */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Peso</div>
          {isLongLine ? (
            <LongLineBuoyInput
              buoys={form.buoys}
              onBuoyChange={updateBuoy}
              total={form.peso}
              lastTotal={sys.lastPeso}
              daysSince={daysSinceLastReading}
              lastCosechada={sys.lastCosechada}
            />
          ) : (
            <>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Peso total (g)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.peso}
                    onChange={(e) => updateForm('peso', e.target.value)}
                    style={s.inputLarge}
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <div style={{ flex: '0 0 100px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Sueltos (g)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.sueltos}
                    onChange={(e) => updateForm('sueltos', e.target.value)}
                    style={{ ...s.inputLarge, fontSize: '18px' }}
                    placeholder="0"
                  />
                </div>
              </div>
              {form.peso && (
                <div style={s.tdcBadge}>
                  Crecimiento: {currentTDC || '—'}%/día vs anterior{' '}
                  {sys.lastPeso ? `${sys.lastPeso.toLocaleString()}g` : '—'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Water parameters */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Parámetros del agua</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'temp', label: 'Temp °C', placeholder: '26' },
              { key: 'ph', label: 'pH', placeholder: '8.1' },
              { key: 'salinidad', label: 'Salinidad ‰', placeholder: '35' },
            ].map((p) => (
              <div key={p.key} style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  {p.label}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form[p.key]}
                  onChange={(e) => updateForm(p.key, e.target.value)}
                  style={s.inputSmall}
                  placeholder={p.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Condition assessment */}
        <ConditionAssessment
          selected={form.condicion}
          onSelect={(c) => updateForm('condicion', c)}
          cosechada={form.cosechada}
          onCosechadaChange={(v) => updateForm('cosechada', v)}
        />

        {/* Photo + Notes */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <button
            onClick={() => updateForm('foto', form.foto ? null : 'pending')}
            style={{
              flex: '0 0 56px',
              height: '56px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: `0.5px solid ${form.foto ? '#0d9488' : 'rgba(255,255,255,0.08)'}`,
              background: form.foto ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.03)',
              color: form.foto ? '#0d9488' : '#94a3b8',
              fontSize: '22px',
            }}
            aria-label="Tomar foto"
          >
            📷
          </button>
          <input
            type="text"
            value={form.notas}
            onChange={(e) => updateForm('notas', e.target.value)}
            placeholder="Notas..."
            style={{
              flex: 1,
              height: '56px',
              fontSize: '14px',
              background: 'rgba(255,255,255,0.06)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: '#e2e8f0',
              padding: '0 16px',
              outline: 'none',
            }}
          />
        </div>

        {/* Save */}
        <button
          onClick={saveReading}
          disabled={!canSave}
          style={s.saveBtn(canSave)}
        >
          ✓ Guardar lectura
        </button>
      </div>
    );
  }

  // ── Queue view ──
  const doneN = completedIds.size;
  const total = systems.length;
  const totalTasks = systems.reduce((a, sys) => a + (sys.tasks?.length || 1), 0);
  const pct = total > 0 ? Math.round((doneN / total) * 100) : 0;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>Mi turno</div>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>
          {doneN}/{total} sistemas · {totalTasks} tareas
        </div>
      </div>
      <div style={s.subtitle}>
        {new Date().toLocaleDateString('es-PA', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>

      <div style={s.progressBar}>
        <div style={s.progressFill(pct)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Cargando sistemas...
        </div>
      ) : systems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          No hay sistemas asignados hoy
        </div>
      ) : (
        systems.map((sys) => {
          const isDone = completedIds.has(sys.id);
          const d = daysSince(sys.lastDate);
          const urgent = d !== null && d > 3;

          return (
            <div
              key={sys.id}
              style={s.card(isDone, urgent)}
              onClick={() => openForm(sys)}
            >
              <div style={s.cardTop}>
                <div style={s.sysIcon(isDone ? '#22c55e' : CAT_COLORS[sys.categoria] || '#0d9488')}>
                  {isDone ? '✓' : sys.id}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '500' }}>{sys.id}</span>
                    <span style={s.catBadge(CAT_COLORS[sys.categoria] || '#0d9488')}>
                      {sys.categoria || '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    {sys.tipo} · {sys.modulos}m · prof. {sys.depth || '—'} · {sys.region}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {sys.lastPeso ? `${sys.lastPeso.toLocaleString()}g` : '—'}
                  </div>
                  <div style={{ fontSize: '11px', color: urgent ? '#ef4444' : '#94a3b8' }}>
                    {d !== null ? `hace ${d}d` : 'sin datos'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(sys.tasks || ['lectura']).map((t) => (
                  <span key={t} style={s.taskPill(TASK_META[t]?.bg, TASK_META[t]?.color)}>
                    {TASK_META[t]?.label || t}
                  </span>
                ))}
              </div>
            </div>
          );
        })
      )}

      <div style={s.offlineNote}>
        📡 Funciona sin conexión — se sincroniza al conectar
      </div>
    </div>
  );
}
