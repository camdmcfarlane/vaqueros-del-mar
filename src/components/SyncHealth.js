// AquaOps — Sync Health Monitor
// Continuous doctests that verify Supabase connectivity and data integrity
// Immediate toast notification on failure

import { useState, useEffect, useRef, useCallback } from "react";

// Health states:
//   "healthy"   — all tests pass, last check < 60s
//   "degraded"  — some tests failing or latency >10s
//   "down"      — Supabase unreachable
//   "offline"   — device has no network
//   "loading"   — initial check in progress

function useSyncHealth(sbClient, sbReady, online, addToast) {
  const [health, setHealth] = useState({ status: "loading", lastCheck: null, details: {} });
  const lastNotified = useRef(null);

  const runDoctests = useCallback(async () => {
    if (!sbClient || !sbReady) {
      setHealth({ status: online ? "loading" : "offline", lastCheck: new Date(), details: { reason: "Supabase not ready" } });
      return;
    }
    if (!online) {
      setHealth({ status: "offline", lastCheck: new Date(), details: {} });
      return;
    }

    const results = {};
    const start = Date.now();

    // Test 1: lecturas table reachable + count
    try {
      const { count, error } = await sbClient
        .from("lecturas")
        .select("*", { count: "exact", head: true });
      results.readings = error
        ? { ok: false, error: error.message, code: error.code }
        : { ok: true, count };
    } catch (e) {
      results.readings = { ok: false, error: e.message };
    }

    // Test 2: sistemas table reachable
    try {
      const { count, error } = await sbClient
        .from("sistemas")
        .select("*", { count: "exact", head: true });
      results.systems = error
        ? { ok: false, error: error.message, code: error.code }
        : { ok: true, count };
    } catch (e) {
      results.systems = { ok: false, error: e.message };
    }

    // Test 3: write round-trip — upsert a heartbeat row, read it back, verify
    try {
      const ts = new Date().toISOString();
      const testId = "health_check";
      const { error: writeErr } = await sbClient.from("sync_health").upsert({
        id: testId, checked_at: ts, device: navigator.userAgent.slice(0, 50),
      }, { onConflict: "id" });
      if (writeErr) {
        results.write = { ok: false, error: writeErr.message, code: writeErr.code };
      } else {
        // Read it back to verify round-trip
        const { data: readBack, error: readErr } = await sbClient
          .from("sync_health").select("checked_at").eq("id", testId).single();
        if (readErr) {
          results.write = { ok: false, error: "write ok, read-back failed: " + readErr.message };
        } else if (readBack?.checked_at === ts) {
          results.write = { ok: true, roundtrip: true };
        } else {
          results.write = { ok: true, roundtrip: false, note: "timestamp mismatch" };
        }
      }
    } catch (e) {
      // sync_health table may not exist — degrade gracefully
      results.write = { ok: false, error: e.message };
    }

    const latency = Date.now() - start;
    results.latency = latency;

    // Determine overall status
    const readOk = results.readings?.ok;
    const sysOk = results.systems?.ok;
    const writeOk = results.write?.ok;
    let status = "healthy";
    if (!readOk && !sysOk) status = "down";
    else if (!readOk || !sysOk || !writeOk) status = "degraded";
    if (latency > 10000) status = "degraded";

    // Notify on status change
    if (status !== "healthy" && lastNotified.current !== status) {
      const fails = [];
      if (!results.readings?.ok) fails.push("readings: " + (results.readings?.error || "failed"));
      if (!results.systems?.ok) fails.push("systems: " + (results.systems?.error || "failed"));
      if (!results.write?.ok) fails.push("write: " + (results.write?.error || "failed"));
      if (status === "down") {
        addToast("\uD83D\uDD34 Supabase no responde \u2014 " + fails.join("; "), "warning");
      } else {
        addToast("\uD83D\uDFE1 Sync degradado \u2014 " + fails.join("; ") + " (" + latency + "ms)", "warning");
      }
      lastNotified.current = status;
    }
    if (status === "healthy" && lastNotified.current && lastNotified.current !== "healthy") {
      addToast("\uD83D\uDFE2 Supabase reconectado", "success");
      lastNotified.current = "healthy";
    }

    setHealth({ status, lastCheck: new Date(), details: results });
  }, [sbClient, sbReady, online, addToast]);

  useEffect(() => {
    if (!sbReady) return;
    const t1 = setTimeout(runDoctests, 3000);
    const iv = setInterval(runDoctests, 30000);
    return () => { clearTimeout(t1); clearInterval(iv); };
  }, [sbReady, online, runDoctests]);

  return health;
}

// Status dot with expandable detail panel
function SyncHealthDot({ health, syncing, online, pendingCount, lastSync }) {
  const [expanded, setExpanded] = useState(false);
  const colors = { healthy:"#4ade80", degraded:"#fb923c", down:"#f87171", offline:"#475569", loading:"#64748b" };
  const color = syncing ? "#fb923c" : (colors[health.status] || "#475569");

  return (
    <div style={{position:"relative"}}>
      <div onClick={()=>setExpanded(!expanded)}
        style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",padding:"2px 4px",borderRadius:6}}>
        <div style={{
          width:7, height:7, borderRadius:"50%", background:color,
          boxShadow: health.status==="healthy" && !syncing ? "0 0 6px "+color : "none",
          animation: syncing ? "pulse 1s infinite" : "none",
        }}/>
        {syncing && <span style={{fontSize:9,color,fontWeight:600}}>sync</span>}
        {!syncing && health.status==="down" && <span style={{fontSize:9,color:"#f87171",fontWeight:700}}>\u2717</span>}
        {!syncing && health.status==="degraded" && <span style={{fontSize:9,color:"#fb923c",fontWeight:700}}>\u26A0</span>}
        {!syncing && health.status==="offline" && <span style={{fontSize:9,color:"#475569"}}>offline</span>}
        {!syncing && health.status==="healthy" && lastSync && <span style={{fontSize:9,color:"#334155"}}>{lastSync.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
        {pendingCount > 0 && <span style={{fontSize:9,color:"#fb923c",fontWeight:700}}>({pendingCount})</span>}
      </div>
      {expanded && (
        <div style={{position:"absolute",top:24,right:0,width:220,background:"rgba(2,8,24,.96)",border:"1px solid rgba(148,163,184,.12)",borderRadius:10,padding:10,zIndex:999,backdropFilter:"blur(12px)"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>Sync Health</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:color}}/>
            <span style={{fontSize:11,color,fontWeight:700,textTransform:"capitalize"}}>{health.status}</span>
          </div>
          {health.details && (
            <div style={{fontSize:9,color:"#64748b",lineHeight:1.8}}>
              {health.details.readings && <div>lecturas: <span style={{color:health.details.readings.ok?"#4ade80":"#f87171"}}>{health.details.readings.ok?`\u2713 ${health.details.readings.count?.toLocaleString()} rows`:health.details.readings.error}</span></div>}
              {health.details.systems && <div>sistemas: <span style={{color:health.details.systems.ok?"#4ade80":"#f87171"}}>{health.details.systems.ok?`\u2713 ${health.details.systems.count?.toLocaleString()} rows`:health.details.systems.error}</span></div>}
              {health.details.write && <div>write: <span style={{color:health.details.write.ok?"#4ade80":"#f87171"}}>{health.details.write.ok?(health.details.write.roundtrip?"\u2713 round-trip":"\u2713 write only"):health.details.write.error}</span></div>}
              {health.details.latency !== undefined && <div>latency: <span style={{color:health.details.latency<2000?"#4ade80":health.details.latency<5000?"#fb923c":"#f87171"}}>{health.details.latency}ms</span></div>}
              {health.lastCheck && <div>checked: {health.lastCheck.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>}
              {pendingCount > 0 && <div style={{color:"#fb923c",fontWeight:600}}>{pendingCount} pending</div>}
            </div>
          )}
          <div onClick={()=>setExpanded(false)} style={{fontSize:9,color:"#475569",marginTop:6,cursor:"pointer",textAlign:"center"}}>tap to close</div>
        </div>
      )}
    </div>
  );
}

export { useSyncHealth, SyncHealthDot };
