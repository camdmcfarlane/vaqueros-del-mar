import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const CAN_REPLY_ROLES = ['admin', 'consultor', 'director', 'farm_manager'];

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 120) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function Avatar({ initials }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'rgba(13,148,136,.2)', border: '1px solid rgba(13,148,136,.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: 9, color: '#2dd4bf', fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

function NoteRow({ note, canReply, onReply, replyOpen }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <Avatar initials={note.author_initials} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 2 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{note.author_name}</span>
          <span style={{ fontSize: 10, color: '#475569' }}>{timeAgo(note.created_at)}</span>
        </div>
        <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {note.message}
        </div>
        {canReply && (
          <button onClick={onReply}
            style={{ background: 'none', border: 'none', color: replyOpen ? '#0d9488' : '#64748b', fontSize: 10, cursor: 'pointer', padding: '3px 0', marginTop: 1 }}>
            {replyOpen ? 'Cancelar' : 'Responder'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SystemNotes({ sistemaId, region, userInitials, userName, userRole, canPost }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const canReply = CAN_REPLY_ROLES.includes(userRole);

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from('system_notes')
      .select('*')
      .eq('sistema', sistemaId)
      .order('created_at', { ascending: true });
    setNotes(data || []);
    setLoading(false);
  }, [sistemaId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function postNote(message, parentId = null) {
    if (!message.trim() || posting) return;
    setPosting(true);
    await supabase.from('system_notes').insert({
      sistema: sistemaId,
      region: region || null,
      author_initials: userInitials,
      author_name: userName,
      message: message.trim(),
      parent_id: parentId || null,
    });
    await fetchNotes();
    setPosting(false);
    if (parentId) { setReplyTo(null); setReplyDraft(''); }
    else setDraft('');
  }

  const topLevel = notes.filter(n => !n.parent_id);
  const getReplies = (pid) => notes.filter(n => n.parent_id === pid);

  const inputStyle = {
    flex: 1, background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(148,163,184,.2)', borderRadius: 8,
    padding: '7px 10px', color: '#e2e8f0', fontSize: 13,
    outline: 'none',
  };
  const sendStyle = (disabled) => ({
    padding: '7px 14px', borderRadius: 8, border: 'none',
    background: '#0d9488', color: '#fff', fontSize: 14, fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
  });

  return (
    <div id="sec-notas">
      {/* Header row with collapse toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : 12 }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6 }}>
          Notas · {notes.length}
        </div>
        <button onClick={() => setCollapsed(c => !c)}
          style={{ background: 'none', border: '1px solid rgba(148,163,184,.15)', borderRadius: 4, color: '#64748b', fontSize: 10, cursor: 'pointer', padding: '2px 8px' }}>
          {collapsed ? '▼ Ver' : '▲ Ocultar'}
        </button>
      </div>

      {!collapsed && (
        <>
          {loading ? (
            <div style={{ color: '#475569', fontSize: 12, padding: '6px 0' }}>Cargando...</div>
          ) : topLevel.length === 0 ? (
            <div style={{ color: '#475569', fontSize: 12, padding: '6px 0', fontStyle: 'italic' }}>
              Sin notas aún.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topLevel.map(note => (
                <div key={note.id}>
                  <NoteRow
                    note={note}
                    canReply={canReply}
                    onReply={() => setReplyTo(replyTo === note.id ? null : note.id)}
                    replyOpen={replyTo === note.id}
                  />
                  {/* Indented replies */}
                  {getReplies(note.id).map(r => (
                    <div key={r.id} style={{ marginLeft: 36, marginTop: 8, paddingLeft: 10, borderLeft: '2px solid rgba(13,148,136,.25)' }}>
                      <NoteRow note={r} canReply={false} />
                    </div>
                  ))}
                  {/* Reply input */}
                  {canReply && replyTo === note.id && (
                    <div style={{ marginLeft: 36, marginTop: 8, display: 'flex', gap: 6 }}>
                      <input
                        value={replyDraft}
                        onChange={e => setReplyDraft(e.target.value)}
                        placeholder="Responder..."
                        style={inputStyle}
                        onKeyDown={e => e.key === 'Enter' && postNote(replyDraft, note.id)}
                        autoFocus
                      />
                      <button
                        onClick={() => postNote(replyDraft, note.id)}
                        disabled={posting || !replyDraft.trim()}
                        style={sendStyle(posting || !replyDraft.trim())}
                      >→</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {canPost && (
            <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Agregar nota..."
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && postNote(draft)}
              />
              <button
                onClick={() => postNote(draft)}
                disabled={posting || !draft.trim()}
                style={sendStyle(posting || !draft.trim())}
              >→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
