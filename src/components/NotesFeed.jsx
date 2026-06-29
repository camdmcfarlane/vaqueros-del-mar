import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const HIGH_ROLES = ['admin', 'consultor', 'director', 'farm_manager'];

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 120) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function snoozeKey(alert) {
  return `${alert.type}_${alert.sistema || (alert.taskType + '_' + alert.assignedTo)}`;
}

function loadSnoozes() {
  try {
    const raw = localStorage.getItem('aq_alert_snooze');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    // Prune expired entries
    const active = Object.fromEntries(Object.entries(parsed).filter(([, exp]) => exp > now));
    localStorage.setItem('aq_alert_snooze', JSON.stringify(active));
    return active;
  } catch { return {}; }
}

function snoozeUntilTomorrow(key) {
  try {
    const snoozes = loadSnoozes();
    // Midnight Panama (UTC-5) = 5am UTC next day
    const tomorrow = new Date();
    tomorrow.setUTCHours(5, 0, 0, 0);
    if (tomorrow <= Date.now()) tomorrow.setDate(tomorrow.getDate() + 1);
    snoozes[key] = tomorrow.getTime();
    localStorage.setItem('aq_alert_snooze', JSON.stringify(snoozes));
  } catch {}
}

function AlertCard({ alert, onNavigateToSystem, onSnooze, snoozed }) {
  const isLoss = alert.type === 'tdc_loss';
  const col = alert.severity === 'ceo' ? '#f87171' : alert.severity === 'farm_manager' ? '#fb923c' : '#fbbf24';
  const bg  = alert.severity === 'ceo' ? 'rgba(239,68,68,.1)' : alert.severity === 'farm_manager' ? 'rgba(249,115,22,.1)' : 'rgba(234,179,8,.08)';
  const icon = isLoss ? '📉' : '🐢';
  const title = isLoss ? 'Pérdida biomasa' : 'Crecimiento lento';
  const canSnooze = alert.severity === 'ops_mgr';

  if (snoozed) return null;

  return (
    <div style={{
      background: bg, border: `1px solid ${col}30`,
      borderLeft: `3px solid ${col}`, borderRadius: 10,
      padding: '10px 12px',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <div
          style={{ flex:1, minWidth:0, cursor: onNavigateToSystem ? 'pointer' : 'default' }}
          onClick={() => onNavigateToSystem && onNavigateToSystem(alert.sistema)}
        >
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <span style={{ fontSize:12, color:col, fontWeight:700 }}>{title}</span>
            <span style={{
              fontSize:10, fontWeight:700, color:'#0d9488',
              background:'rgba(13,148,136,.12)', borderRadius:4, padding:'1px 6px',
            }}>{alert.sistema}</span>
            {alert.capitan && (
              <span style={{
                fontSize:10, fontWeight:700, color:'#94a3b8',
                background:'rgba(148,163,184,.1)', borderRadius:4, padding:'1px 6px',
              }}>{alert.capitan}</span>
            )}
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:11, color:col, fontWeight:600 }}>
              {alert.tdc >= 0 ? '+' : ''}{alert.tdc}%/día
            </span>
            {alert.lastReadingDays != null && (
              <span style={{ fontSize:10, color:'#475569' }}>
                última lectura: hace {alert.lastReadingDays === 0 ? 'hoy' : `${alert.lastReadingDays}d`}
              </span>
            )}
            {onNavigateToSystem && (
              <span style={{ fontSize:10, color:col, opacity:.6, marginLeft:'auto' }}>Ver →</span>
            )}
          </div>
        </div>
        {canSnooze && (
          <button
            onClick={e => { e.stopPropagation(); onSnooze && onSnooze(snoozeKey(alert)); }}
            title="Ignorar hasta mañana"
            style={{
              background:'none', border:'1px solid rgba(251,191,36,.25)', borderRadius:6,
              color:'#fbbf24', fontSize:10, cursor:'pointer', padding:'3px 7px',
              flexShrink:0, opacity:.7,
            }}
          >zzz</button>
        )}
      </div>
    </div>
  );
}

const NOTES_CACHE_KEY      = 'aq_notes_cache';
const NOTES_CACHE_TS_KEY   = 'aq_notes_cache_ts';

// Refresh windows in Panama time (UTC-5): 07:00 and 18:30
const REFRESH_WINDOWS_PANAMA = [{ h: 7, m: 0 }, { h: 18, m: 30 }];

function loadCachedNotes() {
  try {
    const raw = localStorage.getItem(NOTES_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function lastRefreshWindow() {
  // Returns the UTC ms timestamp of the most recent refresh window that has passed
  const nowUtc = Date.now();
  const panamaOffset = -5 * 60 * 60 * 1000;
  const panamaNow = new Date(nowUtc + panamaOffset);
  const todayBase = Date.UTC(panamaNow.getUTCFullYear(), panamaNow.getUTCMonth(), panamaNow.getUTCDate());

  let latest = 0;
  for (const { h, m } of REFRESH_WINDOWS_PANAMA) {
    const windowUtc = todayBase + (h * 60 + m) * 60000 - panamaOffset;
    if (windowUtc <= nowUtc && windowUtc > latest) latest = windowUtc;
  }
  return latest; // 0 = no window has passed yet today
}

function needsRefresh() {
  try {
    const ts = parseInt(localStorage.getItem(NOTES_CACHE_TS_KEY) || '0', 10);
    const window = lastRefreshWindow();
    if (!window) return !loadCachedNotes(); // before 7am — only fetch if no cache at all
    return ts < window; // cache predates the last refresh window
  } catch { return true; }
}

export default function NotesFeed({ user, userSystems = [], alerts = [], onNavigateToSystem, onNavigateToPlan }) {
  const cached = loadCachedNotes();
  const [notes, setNotes]       = useState(cached || []);
  const [loading, setLoading]   = useState(!cached); // no flash if cache exists
  const [snoozes, setSnoozes]   = useState(() => loadSnoozes());

  const isHighRole = HIGH_ROLES.includes(user?.role);
  const userSystemsKey = userSystems.join(',');

  const fetchNotes = useCallback(async ({ force = false } = {}) => {
    // Only fetch at 7am and 6:30pm Panama unless forced
    if (!force && !needsRefresh()) return;
    setLoading(prev => (loadCachedNotes() ? false : true)); // no spinner if cache available
    let q = supabase
      .from('system_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    if (!isHighRole && userSystems.length > 0) {
      q = q.in('sistema', userSystems);
    }

    const { data } = await q;
    if (data) {
      setNotes(data);
      try {
        localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(NOTES_CACHE_TS_KEY, String(Date.now()));
      } catch {}
    }
    setLoading(false);

    if (user?.initials) {
      localStorage.setItem(`notes_last_read_${user.initials}`, new Date().toISOString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHighRole, userSystemsKey, user?.initials]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSnooze = (key) => {
    snoozeUntilTomorrow(key);
    setSnoozes(loadSnoozes());
  };

  const biomassAlerts = alerts.filter(a => a.type === 'tdc_loss' || a.type === 'tdc_slow');
  const taskAlerts    = alerts.filter(a => a.type === 'task_late');
  const visibleBiomass = biomassAlerts.filter(a => !snoozes[snoozeKey(a)]);
  const hasAlerts = visibleBiomass.length > 0 || taskAlerts.length > 0;

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#e2e8f0', flex: 1 }}>Notas y Alertas</h2>
        <button
          onClick={() => fetchNotes({ force: true })}
          title="Actualizar notas"
          style={{ background: 'none', border: 'none', color: '#475569', fontSize: 16, cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }}>
          ↻
        </button>
      </div>

      {/* Alert section */}
      {hasAlerts && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:.6, marginBottom:8 }}>
            Alertas activas · {visibleBiomass.length + taskAlerts.length}
          </div>

          {/* Biomass alerts — full cards */}
          {visibleBiomass.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom: taskAlerts.length ? 12 : 0 }}>
              {biomassAlerts.map((a, i) => (
                <AlertCard
                  key={i} alert={a}
                  onNavigateToSystem={onNavigateToSystem}
                  onSnooze={handleSnooze}
                  snoozed={!!snoozes[snoozeKey(a)]}
                />
              ))}
            </div>
          )}

          {/* Task alerts — compact tabbed rows, tap goes to plan */}
          {taskAlerts.length > 0 && (
            <div style={{
              borderLeft:'2px solid rgba(251,191,36,.3)', paddingLeft:10, marginLeft:4,
              display:'flex', flexDirection:'column', gap:4,
            }}>
              <div style={{ fontSize:10, color:'#fbbf24', fontWeight:700, marginBottom:2 }}>
                ⏰ Tareas vencidas · {taskAlerts.length}
              </div>
              {taskAlerts.map((a, i) => (
                <div
                  key={i}
                  onClick={() => onNavigateToPlan && onNavigateToPlan()}
                  style={{ display:'flex', gap:6, alignItems:'baseline', cursor: onNavigateToPlan ? 'pointer' : 'default' }}
                >
                  <span style={{
                    fontSize:10, fontWeight:700,
                    color: a.severity==='ceo' ? '#f87171' : a.severity==='farm_manager' ? '#fb923c' : '#fbbf24',
                  }}>{a.daysLate}d</span>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>
                    {a.taskType}{a.sistema ? ` · ${a.sistema}` : ''}{a.assignedTo ? ` · ${a.assignedTo}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ height:1, background:'rgba(148,163,184,.1)', margin:'12px 0 4px' }}/>
        </div>
      )}

      {/* Notes */}
      {loading ? (
        <div style={{ padding: 24, color: '#64748b', fontSize: 13, textAlign: 'center' }}>Cargando notas...</div>
      ) : notes.length === 0 ? (
        <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginTop: hasAlerts ? 8 : 40, fontStyle: 'italic' }}>
          Sin notas en tus sistemas.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => onNavigateToSystem && onNavigateToSystem(note.sistema)}
              style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(148,163,184,.1)',
                borderRadius: 12, padding: '12px 14px',
                cursor: onNavigateToSystem ? 'pointer' : 'default',
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{
                    fontSize:10, fontWeight:700, color:'#2dd4bf',
                    background:'rgba(13,148,136,.12)', borderRadius:4, padding:'2px 7px',
                  }}>{note.sistema}</span>
                  {note.region && <span style={{ fontSize:10, color:'#64748b' }}>{note.region}</span>}
                  {note.parent_id && <span style={{ fontSize:9, color:'#475569', fontStyle:'italic' }}>↩ respuesta</span>}
                </div>
                <span style={{ fontSize:10, color:'#475569' }}>{timeAgo(note.created_at)}</span>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <div style={{
                  width:26, height:26, borderRadius:'50%',
                  background:'rgba(13,148,136,.18)', border:'1px solid rgba(13,148,136,.25)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, fontSize:9, color:'#2dd4bf', fontWeight:700,
                }}>
                  {note.author_initials}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, marginBottom:2 }}>{note.author_name}</div>
                  <div style={{ fontSize:13, color:'#e2e8f0', lineHeight:1.4 }}>{note.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
