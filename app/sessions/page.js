"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

function SessionsPageInner() {
  // dato
  const [date, setDate] = useState("");
  useEffect(() => {
    const d = new Date();
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    setDate(iso);
  }, []);

  // data
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);

  // steg: 1 spillere, 2 buy-in, 3 detaljer
  const [step, setStep] = useState(1);
  const [baseBuyIn, setBaseBuyIn] = useState(100);

  // valg og felter
  // Ekstra er beløp i kroner
  const [selected, setSelected] = useState({}); // {playerId: true}
  const [rows, setRows] = useState([]);         // [{playerId,name,hasExtra,extraAmount,cashOut}]
  const [error, setError] = useState("");

  // load
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("pb_players") || "[]");
      const s = JSON.parse(localStorage.getItem("pb_sessions") || "[]");
      setPlayers(Array.isArray(p) ? p : []);
      setSessions(Array.isArray(s) ? s : []);

      const prefs = JSON.parse(localStorage.getItem("pb_user_prefs") || "{}");
      if (typeof prefs.baseBuyIn === "number") setBaseBuyIn(prefs.baseBuyIn);

      const sel = {};
      (Array.isArray(p) ? p : []).forEach(pl => { sel[pl.id] = false; });
      setSelected(sel);

      setRows((Array.isArray(p) ? p : []).map(pl => ({
        playerId: pl.id,
        name: pl.name,
        hasExtra: false,
        extraAmount: "",
        cashOut: ""
      })));
    } catch {}
  }, []);

  // helpers
  const toNumber = (v) => {
    if (v === "" || v === null || v === undefined) return NaN;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  };

  const chosenIds = useMemo(
    () => Object.keys(selected).filter(id => selected[id]),
    [selected]
  );

  // beregning
  const computed = useMemo(() => {
    const perPlayer = rows
      .filter(r => selected[r.playerId])
      .map(r => {
        const extra = r.hasExtra ? Math.max(0, toNumber(r.extraAmount) || 0) : 0; // kroner
        const invested = (Number(baseBuyIn) || 0) + extra; // kroner
        const cashOut = toNumber(r.cashOut);
        const amount = Number.isFinite(cashOut) ? cashOut - invested : NaN;
        return { ...r, extra, invested, cashOut, amount };
      });
    const sum = perPlayer.reduce((a, r) => a + (Number.isFinite(r.amount) ? r.amount : 0), 0);
    return { perPlayer, sum, count: perPlayer.length };
  }, [rows, selected, baseBuyIn]);

  const pot = useMemo(() => {
    const count = chosenIds.length;
    const extras = rows
      .filter(r => selected[r.playerId] && r.hasExtra)
      .reduce((a, r) => a + (toNumber(r.extraAmount) || 0), 0);
    return (Number(baseBuyIn) || 0) * count + extras;
  }, [rows, selected, chosenIds.length, baseBuyIn]);

  function toggleSelect(id) { setSelected(prev => ({ ...prev, [id]: !prev[id] })); }
  function updateRow(id, patch) { setRows(prev => prev.map(r => (r.playerId === id ? { ...r, ...patch } : r))); }

  // steg
  function nextFromStep1() {
    setError("");
    if (chosenIds.length < 2) { setError("Velg minst to spillere."); return; }
    setStep(2);
  }
  function nextFromStep2() {
    setError("");
    const n = Number(baseBuyIn);
    if (!Number.isFinite(n) || n <= 0) { setError("Ugyldig buy-in."); return; }
    setStep(3);
  }

  // nullstill felter i steg 3
  function resetCurrent() {
    setRows(prev => prev.map(r => selected[r.playerId]
      ? { ...r, hasExtra: false, extraAmount: "", cashOut: "" }
      : r
    ));
    setError("");
  }

  // lagre
  function saveSession(e) {
    e.preventDefault();
    setError("");

    if (computed.count < 2) { setError("Velg minst to spillere."); return; }
    for (const r of computed.perPlayer) {
      if (!Number.isFinite(r.cashOut)) { setError(`Ugyldig cash out for ${r.name}.`); return; }
    }
    if (Math.round(computed.sum * 100) !== 0) { setError("Sum er ikke null."); return; }

    const entries = computed.perPlayer.map(r => ({
      playerId: r.playerId,
      amount: Number(r.amount.toFixed(2))
    }));

    const newSession = { id: Date.now(), date, entries };
    const next = [newSession, ...sessions];
    setSessions(next);
    try {
      localStorage.setItem("pb_sessions", JSON.stringify(next));
      const prefs = JSON.parse(localStorage.getItem("pb_user_prefs") || "{}");
      localStorage.setItem("pb_user_prefs", JSON.stringify({ ...prefs, baseBuyIn: Number(baseBuyIn) }));
    } catch {
      setSessions(sessions);
      setError("Lagring feilet.");
      return;
    }

    // reset skjema
    setStep(1);
    const sel = {};
    players.forEach(pl => { sel[pl.id] = false; });
    setSelected(sel);
    setRows(players.map(pl => ({ playerId: pl.id, name: pl.name, hasExtra: false, extraAmount: "", cashOut: "" })));
  }

  // format
  function fmt(n) {
    if (!Number.isFinite(n)) return "-";
    const v = Math.round(n * 100) / 100;
    const sign = v > 0 ? "+" : v < 0 ? "-" : "";
    const abs = Math.abs(v);
    const useDec = Math.abs(v % 1) >= 1e-9;
    const absStr = new Intl.NumberFormat("no-NO", { minimumFractionDigits: useDec ? 2 : 0, maximumFractionDigits: 2 }).format(abs);
    return sign + absStr;
  }

  // UI farger og base-styles
  const color = {
    bg: "#0b0f14",
    text: "#e5e7eb",
    dim: "#9aa4b2",
    panel: "#0f141b",
    muted: "#121923",
    border: "rgba(255,255,255,0.08)",
    accent: "#7c3aed",
    good: "#10b981",
    bad: "#f43f5e"
  };

  const card  = { background: color.panel, border: `1px solid ${color.border}`, borderRadius: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" };
  // Viktig mot iOS zoom: fontSize >= 16px
  const inputBase = { border: `1px solid ${color.border}`, borderRadius: "12px", background: color.muted, color: color.text, padding: "12px 14px", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: "16px", lineHeight: "22px" };
  const btnP  = { padding: "14px 18px", borderRadius: "14px", border: `1px solid ${color.accent}`, background: color.accent, color: "#0a0615", fontWeight: 800, cursor: "pointer", fontSize: "16px" };
  const btnS  = { padding: "12px 16px", borderRadius: "12px", border: `1px solid ${color.border}`, background: color.muted, color: color.text, fontWeight: 600, cursor: "pointer", fontSize: "16px" };

  // Rader: wrap for å unngå horisontal scroll på mobil
  const rowWrap = {
    padding: "10px 0",
    borderBottom: "1px solid #1a2431",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px"
  };

  return (
    <div style={{ padding: "16px", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial' }}>
      <h1 style={{ fontSize: "24px", margin: "0 0 12px 0", letterSpacing: "0.4px" }}>Sessions</h1>

      <form onSubmit={saveSession} style={{ ...card, padding: "14px", marginBottom: "16px" }}>
        {/* topplinje */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
          <div style={{ color: color.dim, minWidth: "56px" }}>Date</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputBase, width: "180px" }} />
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${color.border}`, background: color.muted, color: color.text, fontWeight: 700 }}>Buy-in {fmt(Number(baseBuyIn) || 0)}</div>
            <div style={{ padding: "8px 12px", borderRadius: "999px", background: "#1b1130", border: `1px solid ${color.accent}`, color: color.text, fontWeight: 700 }}>Potten {fmt(pot)}</div>
          </div>
        </div>

        {/* stegviser */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {["Spillere", "Buy-in", "Detaljer"].map((t, i) => (
            <div key={t} style={{
              flex: 1, textAlign: "center", padding: "8px",
              border: `1px solid ${color.border}`, borderRadius: "10px",
              background: step === i + 1 ? "#121826" : color.muted,
              color: step === i + 1 ? color.text : color.dim,
              fontWeight: 700
            }}>{t}</div>
          ))}
        </div>

        {/* steg 1 */}
        {step === 1 && (
          <div>
            <div style={{ padding: 0, marginBottom: "8px", color: color.dim }}>Hvem spilte</div>
            <div style={{ maxHeight: "46vh", overflowY: "auto", overflowX: "hidden", borderTop: `1px solid ${color.border}` }}>
              {players.map(pl => (
                <div key={pl.id} style={rowWrap}>
                  <input type="checkbox" checked={!!selected[pl.id]} onChange={() => toggleSelect(pl.id)} style={{ width: "18px", height: "18px" }} />
                  <div style={{ flex: "1 1 140px", fontWeight: 700, color: pl.color || color.text, minWidth: 0 }}>{pl.name}</div>
                </div>
              ))}
            </div>
            {error ? <div style={{ color: "#f66", marginTop: "8px" }}>{error}</div> : null}
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button type="button" onClick={nextFromStep1} style={{ ...btnP, flex: 1 }}>Neste</button>
            </div>
          </div>
        )}

        {/* steg 2 */}
        {step === 2 && (
          <div>
            <div style={{ padding: 0, marginBottom: "8px", color: color.dim }}>Felles buy-in</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ color: color.dim, minWidth: "64px" }}>Beløp</div>
              <input type="number" step="1" min="1" value={baseBuyIn} onChange={(e) => setBaseBuyIn(Number(e.target.value || 0))} style={{ ...inputBase, width: "180px", textAlign: "right" }} />
            </div>
            {error ? <div style={{ color: "#f66", marginTop: "8px" }}>{error}</div> : null}
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button type="button" onClick={() => setStep(1)} style={{ ...btnS, flex: 1 }}>Tilbake</button>
              <button type="button" onClick={nextFromStep2} style={{ ...btnP, flex: 1 }}>Neste</button>
            </div>
          </div>
        )}

        {/* steg 3 */}
        {step === 3 && (
          <div>
            <div style={{ padding: 0, marginBottom: "8px", color: color.dim }}>Ekstra og cash out</div>
            <div style={{ maxHeight: "46vh", overflowY: "auto", overflowX: "hidden", borderTop: `1px solid ${color.border}` }}>
              {rows.filter(r => selected[r.playerId]).map(r => {
                const extra = r.hasExtra ? Math.max(0, toNumber(r.extraAmount) || 0) : 0;
                const invested = (Number(baseBuyIn) || 0) + extra;
                const cashOut = toNumber(r.cashOut);
                const amount = Number.isFinite(cashOut) ? cashOut - invested : NaN;
                return (
                  <div key={r.playerId} style={rowWrap}>
                    {/* linje 1 */}
                    <div style={{ flex: "1 1 160px", fontWeight: 700, minWidth: 0 }}>{r.name}</div>

                    {/* linje 2 kontroller */}
                    <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="checkbox"
                        checked={r.hasExtra}
                        onChange={(e) => updateRow(r.playerId, { hasExtra: e.target.checked, extraAmount: e.target.checked ? r.extraAmount : "" })}
                        style={{ width: "16px", height: "16px" }}
                      />
                      <span style={{ fontSize: "12px", color: color.dim }}>Ekstra</span>
                    </label>

                    {r.hasExtra ? (
                      <>
                        <div style={{ fontSize: "12px", color: color.dim }}>Beløp</div>
                        <input
                          inputMode="decimal"
                          type="number"
                          step="0.01"
                          min="0"
                          value={r.extraAmount}
                          onChange={(e) => updateRow(r.playerId, { extraAmount: e.target.value })}
                          style={{ ...inputBase, width: "110px", textAlign: "right" }}
                        />
                      </>
                    ) : null}

                    <div style={{ fontSize: "12px", color: color.dim }}>Cash out</div>
                    <input
                      inputMode="decimal"
                      type="number"
                      step="0.01"
                      value={r.cashOut}
                      onChange={(e) => updateRow(r.playerId, { cashOut: e.target.value })}
                      style={{ ...inputBase, width: "120px", textAlign: "right" }}
                    />

                    <div style={{ flex: "0 0 100px", textAlign: "right", color: Number(amount) >= 0 ? color.good : color.bad, fontVariantNumeric: "tabular-nums" }}>
                      {fmt(amount)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${color.border}`, background: color.muted, color: color.dim }}>Deltakere {computed.count}</div>
              <div style={{ padding: "8px 12px", borderRadius: "999px", background: "#1b1130", border: `1px solid ${color.accent}` }}>Potten {fmt(pot)}</div>
              <div style={{ padding: "8px 12px", borderRadius: "999px", border: `1px solid ${color.border}`, color: Math.round(computed.sum * 100) === 0 ? color.text : color.bad }}>Sum {fmt(computed.sum)}</div>
              <div style={{ flex: 1 }} />
              <button type="button" onClick={resetCurrent} style={btnS}>Nullstill</button>
            </div>

            {error ? <div style={{ color: "#f66", marginTop: "8px" }}>{error}</div> : null}

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button type="button" onClick={() => setStep(2)} style={{ ...btnS, flex: 1 }}>Tilbake</button>
              <button type="submit" style={{ ...btnP, flex: 1 }}>Save session</button>
            </div>

            <div style={{ marginTop: "8px", fontSize: "12px", color: color.dim }}>
              Resultat = Cash out − (Buy-in + Ekstra). Sum skal bli 0.
            </div>
          </div>
        )}
      </form>

      <h2 style={{ fontSize: "16px", margin: "0 0 8px 0" }}>History</h2>
      <div>
        {sessions.length === 0 ? (
          <div style={{ color: color.dim }}>Ingen økter.</div>
        ) : (
          sessions.map(s => (
            <div key={s.id} style={{ ...card, marginBottom: "10px" }}>
              <div style={{ padding: "10px", borderBottom: "1px solid #1a2431", display: "flex", justifyContent: "space-between" }}>
                <div>{s.date}</div>
                <div style={{ fontSize: "12px", color: color.dim }}>#{s.id}</div>
              </div>
              <div style={{ padding: "8px 10px" }}>
                {s.entries.map((e, i) => {
                  const pl = players.find(p => p.id === e.playerId);
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < s.entries.length - 1 ? "1px solid #1a2431" : "none", fontVariantNumeric: "tabular-nums" }}>
                      <div>{pl ? pl.name : e.playerId}</div>
                      <div style={{ color: e.amount >= 0 ? color.good : color.bad }}>{fmt(e.amount)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// kun klient
export default dynamic(() => Promise.resolve(SessionsPageInner), { ssr: false });
