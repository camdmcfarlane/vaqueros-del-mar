// AquaOps — Cross-device sync test
// Opens a live view of Supabase data to verify multi-device sync
// Import this in App.js and render from Profile tab

import React, { useState, useEffect, useRef } from "react";

function SyncTest({ lang = "es" }) {
  const [sb, setSb] = useState(null);
  const [status, setStatus] = useState("loading");
  const [systemsCount, setSystemsCount] = useState(null);
  const [readingsCount, setReadingsCount] = useState(null);
  const [latestSystems, setLatestSystems] = useState([]);
  const [latestReadings, setLatestReadings] = useState([]);
  const [log, setLog] = useState([]);
  const [polling, setPolling] = useState(false);

  const timer = useRef(null);

  const addLog = (msg) => {
    const ts = new Date().toLocaleTimeString("es-PA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setLog((prev) => [`[${ts}] ${msg}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    import("../supabase.js")
      .then((m) => {
        setSb(m.supabase);
        setStatus("connected");
        addLog("✓ Supabase conectado");
      })
      .catch((e) => {
        setStatus("error");
        addLog("✗ Supabase falló: " + e.message);
      });

    return () => clearInterval(timer.current);
  }, []);

  const fetchData = async () => {
    if (!sb) return;

    try {
      const [sysRes, readRes] = await Promise.all([
        sb
          .from("systems")
          .select("id, region, tipo, updated_by, updated_at")
          .order("updated_at", { ascending: false })
          .limit(10),

        sb
          .from("readings")
          .select(
            "id, sistema, fecha, tipo, peso, updated_by, updated_at"
          )
          .order("updated_at", { ascending: false })
          .limit(10),
      ]);

      const [sysCountRes, readCountRes] = await Promise.all([
        sb.from("systems").select("id", {
          count: "exact",
          head: true,
        }),

        sb.from("readings").select("id", {
          count: "exact",
          head: true,
        }),
      ]);

      if (sysRes.error) throw sysRes.error;
      if (readRes.error) throw readRes.error;

      const newSysCount =
        sysCountRes.count ?? sysRes.data?.length ?? 0;

      const newReadCount =
        readCountRes.count ?? readRes.data?.length ?? 0;

      if (
        systemsCount !== null &&
        newSysCount !== systemsCount
      ) {
        addLog(
          `⚡ Sistemas: ${systemsCount} → ${newSysCount}`
        );
      }

      if (
        readingsCount !== null &&
        newReadCount !== readingsCount
      ) {
        addLog(
          `⚡ Lecturas: ${readingsCount} → ${newReadCount}`
        );
      }

      setSystemsCount(newSysCount);
      setReadingsCount(newReadCount);
      setLatestSystems(sysRes.data || []);
      setLatestReadings(readRes.data || []);

      addLog(
        `📡 Pull: ${newSysCount} sistemas, ${newReadCount} lecturas`
      );
    } catch (e) {
      addLog(
        "✗ Error: " +
          (e.message || e.code || JSON.stringify(e))
      );
    }
  };

  const togglePolling = () => {
    if (polling) {
      clearInterval(timer.current);
      setPolling(false);
      addLog("⏹ Polling detenido");
    } else {
      fetchData();
      timer.current = setInterval(fetchData, 5000);
      setPolling(true);
      addLog("▶ Polling cada 5s");
    }
  };

  const S = {
    card: {
      background: "rgba(255,255,255,.03)",
      border: "1px solid rgba(148,163,184,.08)",
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },

    badge: (color) => ({
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 6,
      background: `${color}18`,
      color,
      fontSize: 10,
      fontWeight: 700,
    }),
  };

  const ago = (ts) => {
    if (!ts) return "–";

    const secs = Math.floor(
      (Date.now() - new Date(ts).getTime()) / 1000
    );

    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m`;

    return `${Math.floor(secs / 3600)}h`;
  };

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: "#e2e8f0",
          marginBottom: 4,
        }}
      >
        🔬 Sync Test — Multi-device
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          marginBottom: 16,
        }}
      >
        Abre esta página en laptop + tablet + teléfono.
        Crea un sistema o lectura en un dispositivo —
        debe aparecer aquí en los otros.
      </div>

      <div
        style={{
          ...S.card,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={S.badge(
              status === "connected"
                ? "#4ade80"
                : "#f87171"
            )}
          >
            {status === "connected"
              ? "✓ Conectado"
              : status === "loading"
              ? "⏳ Cargando..."
              : "✗ Error"}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={fetchData}
            disabled={!sb}
          >
            📡 Fetch ahora
          </button>

          <button
            onClick={togglePolling}
            disabled={!sb}
          >
            {polling
              ? "⏹ Parar"
              : "▶ Auto-poll 5s"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SyncTest;