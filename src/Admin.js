import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const ADMIN_PASS = "admin123";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getISTTime() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function shouldAutoReset() {
  const ist = getISTTime();
  const h = ist.getHours();
  return h >= 5 && h < 6;
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; font-family: 'Libre Baskerville', serif; }
  .pf { font-family: 'Playfair Display', serif; }
  .gold-grad {
    background: linear-gradient(180deg, #f0d080 0%, #c9a84c 50%, #8a6820 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .admin-input {
    background: #111; border: 1px solid #8a6820; color: #e8dfc0;
    padding: 10px 14px; border-radius: 2px;
    font-family: 'Libre Baskerville', serif; font-size: 0.9rem; width: 100%;
    transition: border-color 0.2s; outline: none;
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
  .chart-row:hover td { background: #1a1a10 !important; }
`;

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [result1, setResult1] = useState("--");
  const [adminR1, setAdminR1] = useState("");
  const [saved, setSaved] = useState(false);
  const [chart, setChart] = useState([]);
  const [chartPage, setChartPage] = useState(1);
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [autoReset, setAutoReset] = useState(false);
  const initialized = useRef(false);
  const resetDone = useRef(false);
  const ROWS_PER_PAGE = 50;

  useEffect(() => {
    if (!loggedIn) return;
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, [loggedIn]);

  // Auto reset at 5 AM IST
  useEffect(() => {
    if (!loggedIn) return;
    const t = setInterval(async () => {
      if (shouldAutoReset() && !resetDone.current) {
        resetDone.current = true;
        await autoResetResult();
      } else if (!shouldAutoReset()) {
        resetDone.current = false;
      }
    }, 60000);
    return () => clearInterval(t);
  }, [loggedIn]);

  async function autoResetResult() {
    try {
      const { data: rData } = await supabase.from("results").select("*").eq("id", 1).single();
      if (rData && rData.result1 !== "--") {
        const ist = getISTTime();
        const yesterday = new Date(ist);
        yesterday.setDate(yesterday.getDate() - 1);
        const day = yesterday.getDate();
        const month = MONTHS[yesterday.getMonth()];
        const year = yesterday.getFullYear();
        await supabase.from("chart")
          .update({ result1: Number(rData.result1) })
          .eq("year", year).eq("month", month).eq("day", day);
        await supabase.from("results").upsert({ id: 1, result1: "--", updated_at: new Date().toISOString() });
        setResult1("--");
        setAutoReset(true);
        setTimeout(() => setAutoReset(false), 5000);
        await loadChartPage(1);
      }
    } catch (e) { console.error(e); }
  }

  async function loadData() {
    try {
      const { data: rData } = await supabase.from("results").select("*").eq("id", 1).single();
      if (rData) setResult1(rData.result1);
      await loadChartPage(1);
    } catch (e) { console.error(e); }
  }

  async function loadChartPage(p) {
    const from = (p - 1) * ROWS_PER_PAGE;
    const to = from + ROWS_PER_PAGE - 1;
    const { data } = await supabase.from("chart").select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("day", { ascending: false })
      .range(from, to);
    if (data) setChart(data);
    setChartPage(p);
  }

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
    if (loginPass === ADMIN_PASS) { setLoggedIn(true); setLoginErr(""); }
    else setLoginErr("Galat password!");
  }

  if (!loggedIn) return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{css}</style>
      <div style={{ background: "#0d0d0d", border: "1px solid #8a6820", borderRadius: 4, padding: "36px 28px", width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div className="pf gold-grad" style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: 6 }}>Admin Login</div>
        <div className="pf" style={{ color: "#6a6040", fontSize: "0.75rem", letterSpacing: "0.2em", marginBottom: 24 }}>◆ SECURE ACCESS ◆</div>
        <input className="admin-input" type="password" placeholder="Password dalein..."
          value={loginPass} onChange={e => setLoginPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ marginBottom: 10 }} />
        {loginErr && <div style={{ color: "#c0392b", fontSize: "0.8rem", marginBottom: 10 }}>{loginErr}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 6 }}>
          <button className="btn-gold" onClick={handleLogin}>Login ▶</button>
          <button className="btn-red" onClick={() => window.location.href = "/"}>Wapas</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e8dfc0" }}>
      <style>{css}</style>
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #8a6820", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div className="pf gold-grad" style={{ fontSize: "1.3rem", fontWeight: 900 }}>⚙ Admin Panel — Dubai King</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-gold" onClick={() => window.location.href = "/"}>🌐 Website</button>
          <button className="btn-red" onClick={() => setLoggedIn(false)}>Logout</button>
        </div>
      </div>

      {autoReset && (
        <div style={{ background: "#1a3a1a", border: "1px solid #4caf50", margin: 16, padding: 12, borderRadius: 4, textAlign: "center", color: "#4caf50", fontSize: "0.85rem" }}>
          ✓ 5 AM auto-reset ho gaya — result chart mein save ho gaya!
        </div>
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ background: "#0d0d0d", border: "1px solid #8a6820", borderRadius: 4, padding: 24, marginBottom: 20 }}>
          <div className="pf" style={{ color: "#c9a84c", fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>◆ Live Result Update</div>
          <div style={{ color: "#6a6040", fontSize: "0.72rem", marginBottom: 20 }}>
            Current: <strong style={{ color: "#f0d080" }}>{result1}</strong>
            <span style={{ marginLeft: 16, color: "#6a6040" }}>— 5:00 AM IST pe auto chart mein save hoga</span>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#6a6040", fontSize: "0.7rem", letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>AAJ KA RESULT DALEIN (1-100)</label>
            <input className="admin-input" type="number" min="1" max="100" placeholder="Number dalein..."
              value={adminR1} onChange={e => setAdminR1(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveResult()} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="btn-gold" onClick={saveResult}>💾 Save & Publish</button>
            {saved && <span style={{ color: "#4caf50", fontSize: "0.8rem" }}>✓ Result live ho gaya!</span>}
          </div>
        </div>

        <div style={{ background: "#0d0d0d", border: "1px solid #8a6820", borderRadius: 4, padding: 24 }}>
          <div className="pf" style={{ color: "#c9a84c", fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>◆ Chart Edit</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #8a6820" }}>
                  {["Year","Month","Day","Dubai King","Action"].map(h => (
                    <th key={h} className="pf" style={{ color: "#c9a84c", padding: "10px 8px", textAlign: "left", fontWeight: 700, fontSize: "0.72rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.map((row) => (
                  <tr key={row.id} className="chart-row" style={{ borderBottom: "1px solid #1a1a10" }}>
                    <td style={{ padding: "9px 8px", color: "#6a6040" }}>{row.year}</td>
                    <td style={{ padding: "9px 8px", color: "#e8dfc0" }}>{row.month}</td>
                    <td style={{ padding: "9px 8px", color: "#e8dfc0" }}>{row.day}</td>
                    <td style={{ padding: "9px 8px" }}>
                      {editIdx === row.id
                        ? <input className="admin-input" type="number" min="1" max="100" value={editVal}
                            onChange={e => setEditVal(e.target.value)} style={{ width: 70, padding: "4px 8px" }} />
                        : <span className="pf" style={{ color: "#c9a84c", fontWeight: 700 }}>{row.result1}</span>}
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
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
            {chartPage > 1 && <button className="btn-gold" style={{ padding: "6px 16px" }} onClick={() => loadChartPage(chartPage - 1)}>◀ Prev</button>}
            <span style={{ color: "#6a6040", padding: "6px 10px", fontSize: "0.8rem" }}>Page {chartPage}</span>
            <button className="btn-gold" style={{ padding: "6px 16px" }} onClick={() => loadChartPage(chartPage + 1)}>Next ▶</button>
          </div>
        </div>
      </div>
    </div>
  );
}
