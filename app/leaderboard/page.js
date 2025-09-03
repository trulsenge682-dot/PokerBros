"use client";

import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("pb_players") || "[]");
      const s = JSON.parse(localStorage.getItem("pb_sessions") || "[]");
      setPlayers(Array.isArray(p) ? p : []);
      setSessions(Array.isArray(s) ? s : []);
    } catch {
      setPlayers([]);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    if (players.length === 0) {
      setRows([]);
      return;
    }
    const totals = players.map((pl) => {
      const total = sessions.reduce((sum, sess) => {
        const e = (sess.entries || []).find((x) => x.playerId === pl.id);
        return sum + (e ? Number(e.amount) || 0 : 0);
      }, 0);
      return { id: pl.id, name: pl.name, color: pl.color, total };
    });
    totals.sort((a, b) => b.total - a.total);
    setRows(totals);
    try {
      localStorage.setItem("pb_leaderboard_cache", JSON.stringify(totals));
    } catch {}
  }, [players, sessions]);

  function nameColor(name, fallback) {
    if (fallback) return fallback;
    let h = 0;
    const s = String(name);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return `hsl(${h}, 70%, 65%)`;
  }

  function fmt(n) {
    const v = Number(n) || 0;
    const fixed = Math.abs(v % 1) < 1e-9 ? String(Math.trunc(v)) : v.toFixed(2);
    return v > 0 ? `+${fixed}` : v < 0 ? `-${fixed.replace("-", "")}` : "0";
    }

  return (
    <div style={{ padding: "12px" }}>
      <h1 style={{ fontSize: "20px", margin: "0 0 12px 0", textAlign: "center" }}>Leaderboard</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }}>
        <thead style={{ position: "sticky", top: 0, backgroundColor: "#111" }}>
          <tr>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #333", width: "48px" }}>#</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #333" }}>Player</th>
            <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #333", width: "120px" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((pl, idx) => (
            <tr key={pl.id} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "8px" }}>{idx + 1}</td>
              <td style={{ padding: "8px", color: nameColor(pl.name, pl.color), fontWeight: 600 }}>
                {pl.name}
              </td>
              <td style={{ padding: "8px", textAlign: "right", color: pl.total >= 0 ? "#0f0" : "#f33" }}>
                {fmt(pl.total)}
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ padding: "12px", color: "#aaa" }}>Ingen spillere.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
