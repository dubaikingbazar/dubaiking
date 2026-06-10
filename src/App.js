import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function randomNum() { return Math.floor(Math.random() * 100) + 1; }
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

function generateChartData() {
  const rows = [];
  const now = new Date();
  for (let y = 2016; y <= now.getFullYear(); y++) {
    const endMonth = y === now.getFullYear() ? now.getMonth() + 1 : 12;
    for (let m = 1; m <= endMonth; m++) {
      const endDay = (y === now.getFullYear() && m === now.getMonth() + 1)
        ? now.getDate() : daysInMonth(y, m);
      for (let d = 1; d <= endDay; d++) {
        rows.push({ year: y, month: MONTHS[m - 1], day: d, result1: randomNum() });
      }
    }
  }
  return rows;
}

const G = {
  bg: "#080808", bg2: "#0d0d0d", bg3: "#1a1710",
  gold: "#c9a84c", gold2: "#f0d080", gold3: "#8a6820",
  red: "#c0392b", text: "#e8dfc0", muted: "#6a6040",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Libre+Baskerville:wght@400;700&family=IM+Fell+English:ital@0;1&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; }
  .pf { font-family: 'Playfair Display', serif; }
  .lb { font-family: 'Libre Baskerville', serif; }
  .im { font-family: 'IM Fell English', serif; font-style: italic; }
  .gold-grad {
    background: linear-gradient(180deg, #f0d080 0%, #c9a84c 50%, #8a6820 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .gold-line { width: 80px; height: 1px; margin: 0 auto;
    background: linear-gradient(90deg, transparent, #c9a84c, transparent); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #8a6820; border-radius: 3px; }
  .chart-row:hover td { background: #1a1a10 !important; }
  input, select { outline: none; }
  .admin-input {
    background: #111; border: 1px solid #8a6820; color: #e8dfc0;
    padding: 10px 14px; border-radius: 2px; font-family: 'Libre Baskerville', serif;
    font-size: 0.9rem; width: 100%; transition: border-color 0.2s;
  }
  .admin-input:focus { border-color: #c9a84c; }
  .btn-gold {
    background: linear-gradient(135deg, #f0d080, #c9a84c, #8a6820);
    color: #000; border: none; padding: 11px 28px;
    font-family: 'Playfair Display', serif; font-weight: 700;
    font-size: 0.85rem; letter-spacing: 0.1em; cursor: pointer;
    border-radius: 2px; transition: opacity 0.2s;
  }
  .btn-gold:hover { opacity: 0.85; }
  .btn-red {
    background: linear-gradient(135deg, #8b0000, #c0392b);
    color: #fff; border: none; padding: 8px 18px;
    font-family: 'Playfair Display', serif; font-weight: 700;
    font-size: 0.75rem; letter-spacing: 0.1em; cursor: pointer;
    border-radius: 2px; transition: opacity 0.2s;
  }
  .btn-red:hover { opacity: 0.8; }
`;

// ── ADMIN PAGE ──────────────────────────────────────
function AdminPage() {
  const [adminR1, setAdminR1] = useState("");
  const [currentResult, setCurrentResult] = useState("--");
  const [saved, setSaved] = useState(false);
  const [chart, setChart] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [editVals, setEditVals] = useState({ result1: "" });
  const [loggedIn, setLoggedIn] = useState(false);
  const [pass, setPass] = useState("");
  const [passErr, setPassErr] = useState("");
  const [loading, setLoading] = useState(false);
  const ROWS_PER_PAGE = 50;

  useEffect(() => {
    if (loggedIn) loadAdminData();
  }, [loggedIn]);

  async function loadAdminData() {
    setLoading(true);
    const { data: rData } = await supabase.from("results").select("*").eq("key", "today").single();
    if (rData) setCurrentResult(rData.value);
    const { data } = await supabase.from("chart").select("*")
      .order("year", { ascending: false })
      .order("day", { ascending: false })
      .range(0, ROWS_PER_PAGE - 1);
    if (data) setChart(data);
    setLoading(false);
  }

  function handleLogin() {
    if (pass === "admin123") { setLoggedIn(true); setPassErr(""); }
    else setPassErr("Galat password! Dobara try karein.");
  }

  async function saveResult() {
    if (!adminR1) return;
    await supabase.from("results").upsert({ key: "today", value: adminR1 });
    setCurrentResult(adminR1);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setAdminR1("");
  }

  async function saveChartEdit(rowId) {
    await supabase.from("chart").update({ result1: Number(editVals.result1) }).eq("id", rowId);
    setChart(chart.map(r => r.id === rowId ? { ...r, result1: Number(editVals.result1) } : r));
    setEditIdx(null);
  }

  if (!loggedIn) return (
    <div style={{ background: G.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      <div style={{ background: G.bg2, border: `1px solid ${G.gold3}`, borderRadius: 4, padding: 36, width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div className="pf gold-grad" style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.15em", marginBottom: 6 }}>ADMIN LOGIN</div>
        <div className="lb" style={{ color: G.muted, fontSize: "0.7rem", letterSpacing: "0.2em", marginBottom: 24 }}>► SECURE ACCESS ◄</div>
        <input className="admin-input" type="password" placeholder="Password daalo..."
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ marginBottom: 12 }} />
        {passErr && <div className="lb" style={{ color: G.red, fontSize: "0.8rem", marginBottom: 10 }}>{passErr}</div>}
        <button className="btn-gold" style={{ width: "100%" }} onClick={handleLogin}>LOGIN</button>
        <a href="/" className="lb" style={{ display: "block", marginTop: 14, color: G.muted, fontSize: "0.75rem", textDecoration: "none" }}>← Wapas Jao</a>
      </div>
    </div>
  );

  return (
    <div style={{ background: G.bg, minHeight: "100vh", color: G.text }}>
      <style>{css}</style>
      <div style={{ background: G.bg2, borderBottom: `1px solid ${G.gold3}`, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="pf gold-grad" style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "0.15em" }}>◆ ADMIN PANEL</div>
        <button className="btn-red" onClick={() => setLoggedIn(false)}>Logout</button>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ background: G.bg2, border: `1px solid ${G.gold3}`, borderRadius: 4, padding: 24, marginBottom: 20 }}>
          <div className="pf" style={{ color: G.gold, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 4 }}>◆ Live Result Update</div>
          <div className="lb" style={{ color: G.muted, fontSize: "0.72rem", letterSpacing: "0.15em", marginBottom: 20 }}>
            Current: <span style={{ color: G.gold }}>{currentResult}</span>
          </div>
          <input className="admin-input" type="number" min="1" max="100" placeholder="Naya number daalo..."
            value={adminR1} onChange={e => setAdminR1(e.target.value)}
            style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="btn-gold" onClick={saveResult}>💾 Save & Publish</button>
            {saved && <span className="lb" style={{ color: "#4caf50", fontSize: "0.8rem" }}>✓ Result update ho gaya!</span>}
          </div>
        </div>
        <div style={{ background: G.bg2, border: `1px solid ${G.gold3}`, borderRadius: 4, padding: 24 }}>
          <div className="pf" style={{ color: G.gold, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 16 }}>◆ Chart Edit</div>
          {loading ? <div style={{ color: G.muted, textAlign: "center", padding: 20 }}>Loading...</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${G.gold3}` }}>
                    {["Year","Month","Day","Dubai King","Action"].map(h => (
                      <th key={h} className="pf" style={{ color: G.gold, padding: "10px 8px", textAlign: "left", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.72rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.map((row) => {
                    const isEdit = editIdx === row.id;
                    return (
                      <tr key={row.id} className="chart-row" style={{ borderBottom: "1px solid #1a1a10" }}>
                        <td className="lb" style={{ padding: "9px 8px", color: G.muted }}>{row.year}</td>
                        <td className="lb" style={{ padding: "9px 8px", color: G.text }}>{row.month}</td>
                        <td className="lb" style={{ padding: "9px 8px", color: G.text }}>{row.day}</td>
                        <td style={{ padding: "9px 8px" }}>
                          {isEdit
                            ? <input className="admin-input" type="number" min="1" max="100" value={editVals.result1}
                                onChange={e => setEditVals(v => ({ ...v, result1: e.target.value }))}
                                style={{ width: 70, padding: "4px 8px" }} />
                            : <span className="pf" style={{ color: G.gold, fontWeight: 700 }}>{row.result1}</span>}
                        </td>
                        <td style={{ padding: "9px 8px" }}>
                          {isEdit
                            ? <div style={{ display: "flex", gap: 6 }}>
                                <button className="btn-gold" style={{ padding: "5px 12px", fontSize: "0.7rem" }} onClick={() => saveChartEdit(row.id)}>✓</button>
                                <button className="btn-red" style={{ padding: "5px 10px", fontSize: "0.7rem" }} onClick={() => setEditIdx(null)}>✕</button>
                              </div>
                            : <button className="btn-red" style={{ padding: "5px 12px", fontSize: "0.7rem" }}
                                onClick={() => { setEditIdx(row.id); setEditVals({ result1: String(row.result1) }); }}>Edit</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN WEBSITE ────────────────────────────────────
function MainPage() {
  const [result1, setResult1] = useState("--");
  const [chart, setChart] = useState([]);
  const [chartPage, setChartPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const ROWS_PER_PAGE = 50;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: rData } = await supabase.from("results").select("*").eq("key", "today").single();
      if (rData) setResult1(rData.value);
      const { count } = await supabase.from("chart").select("*", { count: "exact", head: true });
      setTotalRows(count || 0);
      if (!count || count === 0) {
        const rows = generateChartData();
        for (let i = 0; i < rows.length; i += 500) {
          await supabase.from("chart").insert(rows.slice(i, i + 500));
        }
        setTotalRows(rows.length);
      }
      await loadChartPage(1);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadChartPage(p) {
    const from = (p - 1) * ROWS_PER_PAGE;
    const to = from + ROWS_PER_PAGE - 1;
    const { data } = await supabase.from("chart").select("*")
      .order("year", { ascending: false })
      .order("day", { ascending: false })
      .range(from, to);
    if (data) setChart(data);
    setChartPage(p);
  }

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);

  return (
    <div style={{ background: G.bg, minHeight: "100vh", color: G.text }}>
      <style>{css}</style>
      <nav style={{ background: G.bg2, borderBottom: `1px solid ${G.gold3}`, display: "flex", gap: 8, padding: "14px 16px", flexWrap: "wrap" }}>
        {["HOME","CHART","CONTACT"].map(l => (
          <a key={l} href="#" className="pf" style={{ background: `linear-gradient(135deg,${G.gold2},${G.gold},${G.gold3})`, color: "#000", padding: "9px 18px", borderRadius: 2, textDecoration: "none", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.18em" }}>{l}</a>
        ))}
      </nav>
      <div style={{ background: `linear-gradient(160deg,#1a1408,${G.bg2} 40%,#1a1408)`, borderBottom: `2px solid ${G.gold3}`, padding: "36px 16px 28px", textAlign: "center" }}>
        <div className="pf gold-grad" style={{ fontSize: "clamp(1.4rem,5.5vw,2.6rem)", fontWeight: 900, letterSpacing: "0.08em", lineHeight: 1.25 }}>
          Dubai King Result &amp; Chart 2026
        </div>
        <div className="pf" style={{ color: G.muted, fontSize: "0.7rem", letterSpacing: "0.3em", marginTop: 8 }}>◆ Premium Result Platform ◆</div>
      </div>
      <div className="pf" style={{ textAlign: "center", padding: "14px", fontSize: "0.95rem", color: G.gold, borderBottom: "1px solid #1e1c14", background: G.bg2 }}>
        {dateStr} | {timeStr}
      </div>
      <div style={{ textAlign: "center", padding: "30px 16px", borderBottom: "1px solid #1e1c14", background: G.bg2 }}>
        <div className="pf" style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "0.15em", color: G.red }}>DUBAI KING</div>
        <div className="gold-line" style={{ margin: "8px auto" }} />
        <div className="pf gold-grad" style={{ fontSize: "6rem", fontWeight: 900, lineHeight: 1, margin: "8px 0" }}>
          {loading ? "..." : result1}
        </div>
        <div className="gold-line" style={{ margin: "8px auto" }} />
      </div>
      <div className="im" style={{ margin: 16, border: `1px solid ${G.gold3}`, borderRadius: 4, padding: 16, textAlign: "center", fontSize: "0.95rem", color: G.gold, background: G.bg2 }}>
        Har roz ka result yahan update hota hai — Dubai King Official Platform
      </div>
      <div style={{ textAlign: "center", background: `linear-gradient(160deg,#1a1408,${G.bg2})`, borderTop: `1px solid ${G.gold3}`, borderBottom: `1px solid ${G.gold3}`, padding: 14, marginTop: 8 }}>
        <span className="pf" style={{ color: G.gold, fontSize: "0.85rem", letterSpacing: "0.25em" }}>◆ 2016 se Aaj Tak — Dubai King Chart ◆</span>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: G.gold }}>
          <div className="pf" style={{ fontSize: "1.2rem" }}>Loading...</div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", padding: "0 8px 8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${G.gold3}` }}>
                  {["Year","Month","Day","Dubai King"].map(h => (
                    <th key={h} className="pf" style={{ color: G.gold, padding: "12px 10px", textAlign: "center", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.72rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.map((row, i) => (
                  <tr key={row.id} className="chart-row" style={{ borderBottom: "1px solid #1a1a10", background: i % 2 === 0 ? G.bg2 : G.bg }}>
                    <td className="lb" style={{ padding: "10px", textAlign: "center", color: G.muted }}>{row.year}</td>
                    <td className="pf" style={{ padding: "10px", textAlign: "center", color: G.text }}>{row.month}</td>
                    <td className="pf" style={{ padding: "10px", textAlign: "center", color: G.text }}>{row.day}</td>
                    <td className="pf" style={{ padding: "10px", textAlign: "center", color: G.gold, fontWeight: 700, fontSize: "1rem" }}>{row.result1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 8px", flexWrap: "wrap" }}>
              {chartPage > 1 && <button className="btn-gold" style={{ padding: "8px 18px", fontSize: "0.75rem" }} onClick={() => loadChartPage(chartPage - 1)}>← Pehle</button>}
              <span className="lb" style={{ color: G.muted, padding: "8px 12px", fontSize: "0.8rem" }}>Page {chartPage} / {totalPages}</span>
              {chartPage < totalPages && <button className="btn-gold" style={{ padding: "8px 18px", fontSize: "0.75rem" }} onClick={() => loadChartPage(chartPage + 1)}>Aage →</button>}
            </div>
          )}
        </>
      )}
      <footer style={{ textAlign: "center", padding: 20, color: G.muted, fontSize: "0.75rem", letterSpacing: "0.15em", borderTop: "1px solid #1a1710", fontFamily: "'Playfair Display',serif" }}>
        © 2026 Dubai King Result Chart — All Rights Reserved
      </footer>
    </div>
  );
}

// ── ROUTER ──────────────────────────────────────────
export default function App() {
  const path = window.location.pathname;
  if (path === "/admin" || path === "/admin/") return <AdminPage />;
  return <MainPage />;
}
