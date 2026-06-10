import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const ADMIN_PASS = "admin123";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function randomNum() { return Math.floor(Math.random() * 100) + 1; }

function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

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
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; font-family: 'Libre Baskerville', serif; }
  .pf { font-family: 'Playfair Display', serif; }
  .lb { font-family: 'Libre Baskerville', serif; }
  .im { font-family: 'IM Fell English', serif; font-style: italic; }
  .gold-grad {
    background: linear-gradient(180deg, ${G.gold2} 0%, ${G.gold} 50%, ${G.gold3} 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .gold-line { width: 80px; height: 1px; margin: 0 auto;
    background: linear-gradient(90deg, transparent, ${G.gold}, transparent); }
  .pulse { animation: pulse 1.4s infinite; }
  @keyframes pulse {
    0%,100%{ opacity:1; box-shadow: 0 0 8px rgba(192,57,43,0.6); }
    50%{ opacity:0.5; box-shadow: none; }
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: ${G.gold3}; border-radius: 3px; }
  .chart-row:hover td { background: #1a1a10 !important; }
  .admin-input {
    background: #111; border: 1px solid ${G.gold3}; color: ${G.text};
    padding: 10px 14px; border-radius: 2px;
    font-family: 'Libre Baskerville', serif; font-size: 0.9rem; width: 100%;
    transition: border-color 0.2s; outline: none;
  }
  .admin-input:focus { border-color: ${G.gold}; }
  .btn-gold {
    background: linear-gradient(135deg, ${G.gold2}, ${G.gold}, ${G.gold3});
    color: #000; border: none; padding: 11px 28px;
    font-family: 'Playfair Display', serif; font-weight: 700;
    font-size: 0.85rem; letter-spacing: 0.1em; cursor: pointer;
    border-radius: 2px; transition: opacity 0.2s;
  }
  .btn-gold:hover { opacity: 0.85; }
  .btn-red {
    background: linear-gradient(135deg, #8b0000, ${G.red});
    color: #fff; border: none; padding: 8px 18px;
    font-family: 'Playfair Display', serif; font-weight: 700;
    font-size: 0.75rem; letter-spacing: 0.1em; cursor: pointer;
    border-radius: 2px; transition: opacity 0.2s;
  }
  .btn-red:hover { opacity: 0.8; }
`;

export default function App() {
  const [page, setPage] = useState("main");
  const [result1, setResult1] = useState("--");
  const [chart, setChart] = useState([]);
  const [chartPage, setChartPage] = useState(1);
  const [now, setNow] = useState(new Date());
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [adminR1, setAdminR1] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const initialized = useRef(false);

  const ROWS_PER_PAGE = 50;

  // Load data from Supabase
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load current result
      const { data: rData } = await supabase.from("results").select("*").eq("id", 1).single();
      if (rData) setResult1(rData.result1);

      // Load chart
      const { data: cData, count } = await supabase.from("chart").select("*", { count: "exact" }).order("id", { ascending: false }).limit(1);
      if (!count || count === 0) {
        // Generate and insert chart data in batches
        const rows = generateChartData();
        const batchSize = 500;
        for (let i = 0; i < rows.length; i += batchSize) {
          await supabase.from("chart").insert(rows.slice(i, i + batchSize));
        }
      }
      // Load first page
      await loadChartPage(1);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function loadChartPage(p) {
    const from = (p - 1) * ROWS_PER_PAGE;
    const to = from + ROWS_PER_PAGE - 1;
    const { data } = await supabase.from("chart").select("*").order("year", { ascending: false }).order("month", { ascending: false }).order("day", { ascending: false }).range(from, to);
    if (data) setChart(data);
    setChartPage(p);
  }

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  async function saveResult() {
    const val = adminR1.trim();
    if (!val) return;
    await supabase.from("results").upsert({ id: 1, result1: val, updated_at: new Date().toISOString() });
    setResult1(val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setAdminR1("");
  }

  async function saveChartEdit(id) {
    await supabase.from("chart").update({ result1: Number(editVal) }).eq("id", id);
    setChart(chart.map(r => r.id === id ? { ...r, result1: Number(editVal) } : r));
    setEditIdx(null);
  }

  function handleLogin() {
    if (loginPass === ADMIN_PASS) { setPage("admin"); setLoginErr(""); setLoginPass(""); }
    else setLoginErr("Galat password! Dobara try karein.");
  }

  // ── LOGIN ──
  if (page === "login") return (
    <div style={{ background: G.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{css}</style>
      <div style={{ background: G.bg2, border: `1px solid ${G.gold3}`, borderRadius: 4, padding: "36px 28px", width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div className="pf gold-grad" style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: 6 }}>Admin Login</div>
        <div className="pf" style={{ color: G.muted, fontSize: "0.75rem", letterSpacing: "0.2em", marginBottom: 24 }}>◆ SECURE ACCESS ◆</div>
        <input className="admin-input" type="password" placeholder="Password dalein..."
          value={loginPass} onChange={e => setLoginPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ marginBottom: 10 }} />
        {loginErr && <div style={{ color: G.red, fontSize: "0.8rem", marginBottom: 10 }}>{loginErr}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 6 }}>
          <button className="btn-gold" onClick={handleLogin}>Login ▶</button>
          <button className="btn-red" onClick={() => setPage("main")}>Wapas</button>
        </div>
      </div>
    </div>
  );

  // ── ADMIN ──
  if (page === "admin") return (
    <div style={{ background: G.bg, minHeight: "100vh", color: G.text }}>
      <style>{css}</style>
      <div style={{ background: G.bg2, borderBottom: `1px solid ${G.gold3}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div className="pf gold-grad" style={{ fontSize: "1.3rem", fontWeight: 900 }}>⚙ Admin Panel</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-gold" onClick={() => setPage("main")}>🌐 Website</button>
          <button className="btn-red" onClick={() => setPage("main")}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* Result Update */}
        <div style={{ background: G.bg2, border: `1px solid ${G.gold3}`, borderRadius: 4, padding: 24, marginBottom: 20 }}>
          <div className="pf" style={{ color: G.gold, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 4 }}>◆ Live Result Update</div>
          <div style={{ color: G.muted, fontSize: "0.72rem", letterSpacing: "0.15em", marginBottom: 20 }}>Current Result: <strong style={{ color: G.gold2 }}>{result1}</strong></div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: G.muted, fontSize: "0.7rem", letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>NAYA RESULT DALEIN (1-100)</label>
            <input className="admin-input" type="number" min="1" max="100" placeholder="Number dalein..."
              value={adminR1} onChange={e => setAdminR1(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveResult()} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="btn-gold" onClick={saveResult}>💾 Save & Publish</button>
            {saved && <span style={{ color: "#4caf50", fontSize: "0.8rem" }}>✓ Result update ho gaya!</span>}
          </div>
        </div>

        {/* Chart Edit */}
        <div style={{ background: G.bg2, border: `1px solid ${G.gold3}`, borderRadius: 4, padding: 24 }}>
          <div className="pf" style={{ color: G.gold, fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>◆ Chart Edit</div>
          <div style={{ color: G.muted, fontSize: "0.72rem", letterSpacing: "0.15em", marginBottom: 16 }}>2016 se aaj tak ke numbers change karein</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${G.gold3}` }}>
                  {["Year", "Month", "Day", "Dubai King", "Action"].map(h => (
                    <th key={h} className="pf" style={{ color: G.gold, padding: "10px 8px", textAlign: "left", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.1em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.map((row) => (
                  <tr key={row.id} className="chart-row" style={{ borderBottom: `1px solid #1a1a10` }}>
                    <td style={{ padding: "9px 8px", color: G.muted }}>{row.year}</td>
                    <td style={{ padding: "9px 8px", color: G.text }}>{row.month}</td>
                    <td style={{ padding: "9px 8px", color: G.text }}>{row.day}</td>
                    <td style={{ padding: "9px 8px" }}>
                      {editIdx === row.id
                        ? <input className="admin-input" type="number" min="1" max="100" value={editVal}
                            onChange={e => setEditVal(e.target.value)} style={{ width: 70, padding: "4px 8px" }} />
                        : <span className="pf" style={{ color: G.gold, fontWeight: 700 }}>{row.result1}</span>}
                    </td>
                    <td style={{ padding: "9px 8px" }}>
                      {editIdx === row.id
                        ? <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn-gold" style={{ padding: "5px 12px", fontSize: "0.7rem" }} onClick={() => saveChartEdit(row.id)}>✓</button>
                            <button className="btn-red" style={{ padding: "5px 10px", fontSize: "0.7rem" }} onClick={() => setEditIdx(null)}>✕</button>
                          </div>
                        : <button className="btn-red" style={{ padding: "5px 12px", fontSize: "0.7rem" }}
                            onClick={() => { setEditIdx(row.id); setEditVal(row.result1); }}>Edit</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {chartPage > 1 && <button className="btn-gold" style={{ padding: "6px 16px" }} onClick={() => loadChartPage(chartPage - 1)}>◀ Prev</button>}
            <span style={{ color: G.muted, padding: "6px 10px", fontSize: "0.8rem" }}>Page {chartPage}</span>
            <button className="btn-gold" style={{ padding: "6px 16px" }} onClick={() => loadChartPage(chartPage + 1)}>Next ▶</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── MAIN WEBSITE ──
  return (
    <div style={{ background: G.bg, minHeight: "100vh", color: G.text }}>
      <style>{css}</style>

      {/* Nav */}
      <nav style={{ background: G.bg2, borderBottom: `1px solid ${G.gold3}`, display: "flex", gap: 8, padding: "14px 16px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["HOME", "CHART", "CONTACT"].map(l => (
            <a key={l} href="#" className="pf" style={{ background: `linear-gradient(135deg,${G.gold2},${G.gold},${G.gold3})`, color: "#000", padding: "9px 18px", borderRadius: 2, textDecoration: "none", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.18em" }}>{l}</a>
          ))}
        </div>
        <button onClick={() => setPage("login")} className="pf"
          style={{ background: "transparent", border: `1px solid ${G.gold3}`, color: G.gold, padding: "8px 18px", borderRadius: 2, cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.18em", fontWeight: 700 }}>
          ⚙ ADMIN
        </button>
      </nav>

      {/* Banner */}
      <div style={{ background: `linear-gradient(160deg,#1a1408,${G.bg2} 40%,#1a1408)`, borderBottom: `2px solid ${G.gold3}`, padding: "36px 16px 28px", textAlign: "center" }}>
        <div className="pf gold-grad" style={{ fontSize: "clamp(1.4rem,5.5vw,2.6rem)", fontWeight: 900, letterSpacing: "0.08em", lineHeight: 1.25 }}>
          Dubai King Result &amp; Chart 2026
        </div>
        <div className="pf" style={{ color: G.muted, fontSize: "0.7rem", letterSpacing: "0.3em", marginTop: 8 }}>◆ &nbsp; Premium Result Platform &nbsp; ◆</div>
      </div>

      {/* DateTime */}
      <div className="pf" style={{ textAlign: "center", padding: "14px", fontSize: "0.95rem", letterSpacing: "0.08em", color: G.gold, borderBottom: `1px solid #1e1c14`, background: G.bg2 }}>
        {dateStr} &nbsp;|&nbsp; {timeStr}
      </div>

      {/* Result */}
      <div style={{ textAlign: "center", padding: "30px 16px", borderBottom: `1px solid #1e1c14`, background: G.bg2 }}>
        <div className="pf" style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "0.15em", color: G.red, textShadow: "0 0 20px rgba(192,57,43,0.4)" }}>DUBAI KING</div>
        <div className="gold-line" style={{ margin: "8px auto" }} />
        <div className="pf gold-grad" style={{ fontSize: "6rem", fontWeight: 900, lineHeight: 1, margin: "8px 0", filter: "drop-shadow(0 0 18px rgba(201,168,76,0.35))" }}>
          {loading ? "..." : result1}
        </div>
        <div className="gold-line" style={{ margin: "8px auto" }} />
      </div>

      {/* Notice */}
      <div className="im" style={{ margin: 16, border: `1px solid ${G.gold3}`, borderRadius: 4, padding: 16, textAlign: "center", fontSize: "0.95rem", color: G.gold, background: G.bg2 }}>
        ❝ Har roz ka result yahan update hota hai — Dubai King Official Platform ❞
      </div>

      {/* Chart */}
      <div style={{ textAlign: "center", background: `linear-gradient(160deg,#1a1408,${G.bg2})`, borderTop: `1px solid ${G.gold3}`, borderBottom: `1px solid ${G.gold3}`, padding: 14, marginTop: 8 }}>
        <span className="pf" style={{ color: G.gold, fontSize: "0.85rem", letterSpacing: "0.25em" }}>◆ &nbsp; 2016 se Aaj Tak — Dubai King Chart &nbsp; ◆</span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: G.gold }}>
          <div className="pf" style={{ fontSize: "1.2rem" }}>Loading chart...</div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", padding: "0 8px 8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", minWidth: 320 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${G.gold3}` }}>
                  {["Year", "Month", "Day", "Dubai King"].map(h => (
                    <th key={h} className="pf" style={{ color: G.gold, padding: "12px 10px", textAlign: "center", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.72rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.map((row, i) => (
                  <tr key={row.id} className="chart-row" style={{ borderBottom: `1px solid #1a1a10`, background: i % 2 === 0 ? G.bg2 : G.bg }}>
                    <td style={{ padding: "10px", textAlign: "center", color: G.muted }}>{row.year}</td>
                    <td className="pf" style={{ padding: "10px", textAlign: "center", color: G.text }}>{row.month}</td>
                    <td className="pf" style={{ padding: "10px", textAlign: "center", color: G.text }}>{row.day}</td>
                    <td className="pf" style={{ padding: "10px", textAlign: "center", color: G.gold, fontWeight: 700, fontSize: "1rem" }}>{row.result1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ display: "flex", gap: 8, padding: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            {chartPage > 1 && <button className="btn-gold" style={{ padding: "8px 20px" }} onClick={() => loadChartPage(chartPage - 1)}>◀ Pehle</button>}
            <span className="pf" style={{ color: G.muted, padding: "8px 12px", fontSize: "0.8rem" }}>Page {chartPage}</span>
            <button className="btn-gold" style={{ padding: "8px 20px" }} onClick={() => loadChartPage(chartPage + 1)}>Aage ▶</button>
          </div>
        </>
      )}

      <footer style={{ textAlign: "center", padding: 20, color: G.muted, fontSize: "0.75rem", letterSpacing: "0.15em", borderTop: `1px solid #1a1710`, fontFamily: "'Playfair Display',serif" }}>
        © 2026 &nbsp;<span style={{ color: G.gold3 }}>Dubai King Result</span>&nbsp; — All Rights Reserved
      </footer>
    </div>
  );
}
