import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ACTION_META = {
  reading_added:  { icon: '📊', color: '#0d9488', label: 'Lectura' },
  reading_edited: { icon: '✏️',  color: '#f59e0b', label: 'Corrección' },
  harvest:        { icon: '🌿', color: '#4ade80', label: 'Cosecha' },
  seeding:        { icon: '🌱', color: '#38bdf8', label: 'Siembra' },
  system_archived:{ icon: '🗃️', color: '#f87171', label: 'Archivado' },
  task_completed: { icon: '✓',  color: '#94a3b8', label: 'Tarea' },
};

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 120)   return 'ahora';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(ts).toLocaleDateString('es-PA', { month: 'short', day: 'numeric' });
}

export default function ActivityFeed({ user }) {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all'); // all | reading_added | harvest | reading_edited

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) setEvents(data);
      setLoading(false);
    }
    load();
  }, []);

  const filters = [
    { id: 'all',            label: 'Todo' },
    { id: 'reading_added',  label: 'Lecturas' },
    { id: 'harvest',        label: 'Cosechas' },
    { id: 'reading_edited', label: 'Correcciones' },
    { id: 'system_archived',label: 'Archivados' },
  ];

  const visible = filter === 'all' ? events : events.filter(e => e.action === filter);

  // Group by date
  const byDate = {};
  visible.forEach(e => {
    const date = e.created_at.slice(0, 10);
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(e);
  });

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>📋</span>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#e2e8f0', flex: 1 }}>
          Actividad de la finca
        </h2>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${filter === f.id ? '#0d9488' : 'rgba(148,163,184,.15)'}`,
              background: filter === f.id ? 'rgba(13,148,136,.15)' : 'transparent',
              color: filter === f.id ? '#0d9488' : '#64748b',
              fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: 24 }}>Cargando...</div>}

      {!loading && visible.length === 0 && (
        <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 40, fontStyle: 'italic' }}>
          Sin actividad registrada aún.
        </div>
      )}

      {Object.entries(byDate).map(([date, evts]) => {
        const label = (() => {
          const today = new Date().toISOString().slice(0, 10);
          const yest  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (date === today) return 'Hoy';
          if (date === yest)  return 'Ayer';
          return new Date(date + 'T12:00:00').toLocaleDateString('es-PA', { weekday: 'short', day: 'numeric', month: 'short' });
        })();

        return (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: .6, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              {label}
              <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,.1)' }} />
              <span style={{ color: '#334155' }}>{evts.length} evento{evts.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {evts.map(e => {
                const meta = ACTION_META[e.action] || { icon: '•', color: '#64748b', label: e.action };
                const isDelta = e.action === 'reading_edited';
                return (
                  <div key={e.id} style={{ background: 'rgba(255,255,255,.03)',
                    border: `1px solid ${isDelta ? 'rgba(245,158,11,.2)' : 'rgba(148,163,184,.08)'}`,
                    borderLeft: `3px solid ${meta.color}`,
                    borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.3 }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.4 }}>
                          {e.note || `${e.sistema} · ${meta.label}`}
                        </div>
                        {isDelta && e.old_value && e.new_value && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'monospace' }}>{e.old_value}kg</span>
                            <span style={{ fontSize: 10, color: '#475569' }}>→</span>
                            <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'monospace' }}>{e.new_value}kg</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                          {e.sistema && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#2dd4bf',
                              background: 'rgba(13,148,136,.12)', borderRadius: 4, padding: '1px 6px' }}>
                              {e.sistema}
                            </span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b',
                            background: 'rgba(148,163,184,.1)', borderRadius: 4, padding: '1px 6px' }}>
                            {e.actor}
                          </span>
                          <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>
                            {timeAgo(e.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
