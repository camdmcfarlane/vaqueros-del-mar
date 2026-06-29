// AquaOps — Daily Digest Edge Function
// Sends CEO-level alerts to cameron + jason at 6am Panama (11:00 UTC)
// Triggers: negative TDC per system, tasks 3+ days overdue
//
// Deploy: Supabase Dashboard → Edge Functions → New function → paste this file
// Secrets needed: RESEND_API_KEY (set in Dashboard → Edge Functions → Secrets)
//
// Cron setup (run in Supabase SQL editor after deploying):
//   SELECT cron.schedule(
//     'aquaops-daily-digest',
//     '0 11 * * *',
//     $$SELECT net.http_post(
//       url := 'https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/daily-digest',
//       headers := '{"Authorization":"Bearer <YOUR-ANON-KEY>","Content-Type":"application/json"}',
//       body := '{}'
//     )$$
//   );
// Extensions required: pg_cron, pg_net (enable in Dashboard → Database → Extensions)

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY         = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL           = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const RECIPIENTS = [
  'cameron.mcfarlane@algaspanamenas.com',
  'jason.heckathorn@algaspanamenas.com',
]
const FROM_ADDRESS = 'AquaOps <alertas@algaspanamenas.com>'

serve(async (_req) => {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Panama = UTC-5, no DST
    const nowUTC = new Date()
    const panamaNow = new Date(nowUTC.getTime() - 5 * 60 * 60 * 1000)
    const todayStr  = panamaNow.toISOString().slice(0, 10)

    // Tasks 3+ days overdue (incomplete)
    const cutoff = new Date(panamaNow)
    cutoff.setDate(cutoff.getDate() - 3)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    const { data: rawTasks } = await sb
      .from('assigned_tasks')
      .select('id, task_type, sistema, assigned_to, date, actual, condicion')
      .lt('date', cutoffStr)
      .is('actual', null)
      .is('condicion', null)

    const lateTasks = (rawTasks || []).map(t => ({
      ...t,
      daysLate: Math.round((panamaNow.getTime() - new Date(t.date + 'T12:00:00').getTime()) / 86400000),
    }))

    // Active systems
    const { data: systems } = await sb
      .from('sistemas')
      .select('id, pueblo, region')
      .eq('estado', 'Activo')

    const activeSysIds = (systems || []).map((s: any) => s.id)

    // Latest peso readings per active system (2 per system for TDC)
    const negativeTDCSystems: { sistema: string, pueblo: string, tdc: number }[] = []

    if (activeSysIds.length > 0) {
      const { data: readings } = await sb
        .from('lecturas')
        .select('sistema, fecha, peso')
        .in('sistema', activeSysIds)
        .eq('tipo', 'peso')
        .not('peso', 'is', null)
        .order('fecha', { ascending: false })

      // Group by system, keep 2 most recent
      const bySys: Record<string, any[]> = {}
      for (const r of (readings || [])) {
        if (!bySys[r.sistema]) bySys[r.sistema] = []
        if (bySys[r.sistema].length < 2) bySys[r.sistema].push(r)
      }

      for (const [sysId, rArr] of Object.entries(bySys)) {
        if (rArr.length < 2) continue
        const [curr, prev] = rArr
        if (!curr.peso || !prev.peso || curr.peso <= 0 || prev.peso <= 0) continue
        const days = Math.max(1, (new Date(curr.fecha).getTime() - new Date(prev.fecha).getTime()) / 86400000)
        const tdc  = (Math.log(curr.peso / prev.peso) / days) * 100
        if (tdc < 0) {
          const sys = (systems || []).find((s: any) => s.id === sysId)
          negativeTDCSystems.push({
            sistema: sysId,
            pueblo:  sys?.pueblo || '',
            tdc:     parseFloat(tdc.toFixed(2)),
          })
        }
      }
    }

    if (lateTasks.length === 0 && negativeTDCSystems.length === 0) {
      return new Response(JSON.stringify({ sent: false, reason: 'nothing to report' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build HTML email
    let html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b;background:#f8fafc;padding:24px;border-radius:12px">`
    html += `<div style="background:#0f172a;border-radius:8px;padding:16px 20px;margin-bottom:20px">`
    html += `<h2 style="margin:0;color:#e2e8f0;font-size:18px">📊 AquaOps — Resumen Diario</h2>`
    html += `<p style="margin:4px 0 0;color:#64748b;font-size:13px">${todayStr} · 6:00 AM Panamá</p>`
    html += `</div>`

    if (negativeTDCSystems.length > 0) {
      html += `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin-bottom:16px">`
      html += `<h3 style="margin:0 0 10px;color:#dc2626;font-size:15px">🚨 Pérdida de Biomasa (TDC Negativo)</h3>`
      html += `<table style="width:100%;border-collapse:collapse;font-size:13px">`
      html += `<tr style="border-bottom:1px solid #fca5a5"><th style="text-align:left;padding:6px 8px;color:#7f1d1d">Sistema</th><th style="text-align:left;padding:6px 8px;color:#7f1d1d">Lugar</th><th style="text-align:right;padding:6px 8px;color:#7f1d1d">TDC/día</th></tr>`
      for (const s of negativeTDCSystems) {
        html += `<tr><td style="padding:6px 8px">${s.sistema}</td><td style="padding:6px 8px;color:#64748b">${s.pueblo}</td><td style="padding:6px 8px;color:#dc2626;font-weight:700;text-align:right">${s.tdc}%</td></tr>`
      }
      html += `</table></div>`
    }

    if (lateTasks.length > 0) {
      html += `<div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:16px;margin-bottom:16px">`
      html += `<h3 style="margin:0 0 10px;color:#ea580c;font-size:15px">⏰ Tareas Vencidas (+3 días)</h3>`
      html += `<table style="width:100%;border-collapse:collapse;font-size:13px">`
      html += `<tr style="border-bottom:1px solid #fdba74"><th style="text-align:left;padding:6px 8px;color:#7c2d12">Tipo</th><th style="text-align:left;padding:6px 8px;color:#7c2d12">Sistema</th><th style="text-align:left;padding:6px 8px;color:#7c2d12">Asignado</th><th style="text-align:right;padding:6px 8px;color:#7c2d12">Días</th></tr>`
      for (const t of lateTasks.slice(0, 25)) {
        html += `<tr><td style="padding:6px 8px">${t.task_type || ''}</td><td style="padding:6px 8px;color:#64748b">${t.sistema || '—'}</td><td style="padding:6px 8px">${t.assigned_to || ''}</td><td style="padding:6px 8px;color:#ea580c;font-weight:700;text-align:right">${t.daysLate}d</td></tr>`
      }
      html += `</table></div>`
    }

    html += `<p style="font-size:11px;color:#94a3b8;margin-top:20px;text-align:center">Algas Panameñas · AquaOps · Este correo se envía automáticamente a las 6am.</p>`
    html += `</div>`

    const subject = [
      'AquaOps',
      negativeTDCSystems.length > 0 ? `🚨 ${negativeTDCSystems.length} pérdida${negativeTDCSystems.length > 1 ? 's' : ''}` : null,
      lateTasks.length > 0 ? `⏰ ${lateTasks.length} tarea${lateTasks.length > 1 ? 's' : ''} vencida${lateTasks.length > 1 ? 's' : ''}` : null,
      `· ${todayStr}`,
    ].filter(Boolean).join(' ')

    // Send to each recipient
    const sendResults = await Promise.all(RECIPIENTS.map(to =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
      }).then(r => r.json())
    ))

    return new Response(JSON.stringify({
      sent: true,
      recipients: RECIPIENTS.length,
      lateTasks: lateTasks.length,
      negativeTDC: negativeTDCSystems.length,
      resend: sendResults,
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
