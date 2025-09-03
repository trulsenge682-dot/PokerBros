"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

function HomePageInner() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const [players, setPlayers] = useState([]);
  const [sessionsLocal, setSessionsLocal] = useState([]);
  const [sessionsSeed, setSessionsSeed] = useState([]);

  // mobil-sveip
  const scrollerRef = useRef(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setMounted(true);
    // lokalt
    try {
      const p = JSON.parse(localStorage.getItem("pb_players") || "[]");
      const s = JSON.parse(localStorage.getItem("pb_sessions") || "[]");
      setPlayers(Array.isArray(p) ? p : []);
      setSessionsLocal(Array.isArray(s) ? s : []);
    } catch {}

    // seed sessions (felles)
    (async () => {
      try {
        const res = await fetch("/seed_sessions.json", { cache: "force-cache" });
        if (res.ok) setSessionsSeed(await res.json());
      } catch {}
    })();

    // seed players hvis tomt lokalt
    (async () => {
      try {
        const current = JSON.parse(localStorage.getItem("pb_players") || "[]");
        if (!Array.isArray(current) || current.length === 0) {
          const res = await fetch("/seed_players.json", { cache: "force-cache" });
          if (res.ok) {
            const arr = await res.json();
            setPlayers(arr);
            localStorage.setItem("pb_players", JSON.stringify(arr));
          }
        }
      } catch {}
    })();
  }, []);

  // desktop vs mobil
  useEffect(() => {
    function apply() { setIsDesktop(window.innerWidth >= 1000); }
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // slå sammen seed + lokal
  const sessions = useMemo(() => [...sessionsSeed, ...sessionsLocal], [sessionsSeed, sessionsLocal]);

  // leaderboard
  const leaderboard = useMemo(() => {
    const totals = {};
    sessions.forEach(sess => {
      sess.entries.forEach(e => { totals[e.playerId] = (totals[e.playerId] || 0) + e.amount; });
    });
    // navneoppslag fra players
    return Object.keys(totals).map(id => {
      const p = players.find(x => x.id === id);
      return { id, name: p ? p.name : id, color: p?.color, total: totals[id] || 0 };
    }).sort((a, b) => b.total - a.total);
  }, [players, sessions]);

  // styles
  const C = { panel: "#0f141b", border: "rgba(255,255,255,0.08)", text: "#e5e7eb", dim: "#9aa4b2", good: "#10b981", bad: "#f43f5e", accent: "#7c3aed" };
  const card = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: "14px", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" };
  const row = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${C.border}`, fontVariantNumeric: "tabular-nums" };
  const pageStyle = { minWidth: "100%", scrollSnapAlign: "start", padding: "12px 14px", boxSizing: "border-box" };

  function SessionsList() {
    return (
      <div style={{ ...card }}>
        <div style={{ ...row, fontWeight: 700, color: C.dim }}>
          <div>Dato</div>
          <div>Sum</div>
        </div>
        <div style={{ maxHeight: "100%", overflow: "auto" }}>
          {sessions.length === 0 ? (
            <div style={{ padding: "12px", color: C.dim }}>Ingen økter.</div>
          ) : (
            sessions.slice(0, 50).map(s => {
              const total = s.entries.reduce((a, e) => a + e.amount, 0);
              return (
                <div key={s.id} style={{ ...row, borderBottom: "none" }}>
                  <div>{s.date}</div>
                  <div style={{ color: Math.abs(total) < 0.005 ? C.dim : C.bad }}>
                    {new Intl.NumberFormat("no-NO", { maximumFractionDigits: 2 }).format(total)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  function LeaderboardTable() {
    return (
      <div style={{ ...card }}>
        <div style={{ ...row, fontWeight: 700, color: C.dim }}>
          <div style={{ width: "28px" }}>#</div>
          <div style={{ flex: 1 }}>Spiller</div>
          <div style={{ width: "120px", textAlign: "right" }}>Total</div>
        </div>
        <div style={{ maxHeight: "100%", overflow: "auto" }}>
          {leaderboard.length === 0 ? (
            <div style={{ padding: "12px", color: C.dim }}>Ingen data.</div>
          ) : (
            leaderboard.map((p, i) => (
              <div key={p.id} style={{ ...row, borderBottom: "none" }}>
                <div style={{ width: "28px", color: C.dim }}>{i + 1}</div>
                <div style={{ flex: 1, fontWeight: 700, color: p.color || C.text }}>{p.name}</div>
                <div style={{ width: "120px", textAlign: "right", color: p.total >= 0 ? C.good : C.bad }}>
                  {new Intl.NumberFormat("no-NO", { maximumFractionDigits: 2 }).format(p.total)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // mobil-sveip
  function onScroll() {
    const el = scrollerRef.current; if (!el) return;
    const w = el.clientWidth || 1; const p = Math.round(el.scrollLeft / w) + 1;
    if (p !== page) setPage(p);
  }
  function go(n) {
    const el = scrollerRef.current; if (!el) return;
    const w = el.clientWidth; el.scrollTo({ left: w * (n - 1), behavior: "smooth" });
  }

  if (!mounted) return null;

  // desktop
  const isDesktopNow = isDesktop;

  if (isDesktopNow) {
    return (
      <div style={{ padding: "14px", height: "calc(100dvh - 96px)", boxSizing: "border-box",
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial' }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "14px", height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <h2 style={{ margin: "0 0 10px 2px", fontSize: "18px" }}>Sessions</h2>
            <div style={{ flex: 1, minHeight: 0 }}><SessionsList /></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <h2 style={{ margin: "0 0 10px 2px", fontSize: "18px" }}>Leaderboard</h2>
            <div style={{ flex: 1, minHeight: 0 }}><LeaderboardTable /></div>
          </div>
        </div>
      </div>
    );
  }

  // mobil
  return (
    <div
      style={{
        paddingTop: "8px",
        paddingBottom: `calc(8px + env(safe-area-inset-bottom))`,
        height: "calc(100dvh - 96px)",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial'
      }}
    >
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none"
        }}
      >
        <section style={pageStyle}>
          <h2 style={{ margin: "0 0 10px 2px", fontSize: "18px" }}>Sessions</h2>
          <SessionsList />
        </section>
        <section style={pageStyle}>
          <h2 style={{ margin: "0 0 10px 2px", fontSize: "18px" }}>Leaderboard</h2>
          <LeaderboardTable />
        </section>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: "58px", display: "flex", justifyContent: "center", gap: "6px" }}>
        {[1, 2].map(n => (
          <div
            key={n}
            onClick={() => go(n)}
            style={{
              width: n === page ? 22 : 8,
              height: 8,
              borderRadius: 999,
              background: n === page ? C.accent : "rgba(255,255,255,0.2)",
              cursor: "pointer",
              transition: "width .18s"
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(HomePageInner), { ssr: false });
