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

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; font-family: 'Libre Baskerville', serif; }
  .pf { font-family: 'Playfair Display', serif; }
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
  .btn-gold {
    background: linear-gradient(135deg, #f0d080, #c9a84c, #8a6820);
    color: #000; border: none; padding: 11px 28px;
    font-family: 'Playfair Display', serif; font-weight: 700;
    font-size: 0.85rem; letter-spacing: 0.1em; cursor: pointer;
    border-radius: 2px; transition: opacity 0.2s;
  }
  .btn-gold:hover { opacity: 0.85; }
`;

export default function App() {
  const [result1, setResult1] = useState("--");
  const [chart, setChart] = useState([]);
  const [chartPage, setChartPage] = useState(1);
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
      const { data: rData } = await supabase.from("results").select("*").eq("id", 1).single();
      if (rData) setResult1(rData.result1);
      const { count } = await supabase.from("chart").select("*", { count: "exact", head: true });
      if (!count || count === 0) {
        const rows = generateChartData();
        const batchSize = 500;
        for (let i = 0; i < rows.length; i += batchSize) {
          await supabase.from("chart").insert(rows.slice(i, i + batchSize));
        }
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
      .order("month", { ascending: false })
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

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e8dfc0" }}>
      <style>{css}</style>
      <nav style={{ background: "#0d0d0d", borderBottom: "1px solid #8a6820", display: "flex", gap: 8, padding: "14px 16px", flexWrap: "wrap" }}>
        {["HOME","CHART","CONTACT"].map(l => (
          <a key={l} href="#" className="pf" style={{ background: "linear-gradient(135deg,#f0d080,#c9a84c,#8a6820)", color: "#000", padding: "9px 18px", borderRadius: 2, textDecoration: "none", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.18em" }}>{l}</a>
        ))}
      </nav>
      <div style={{ background: "linear-gradient(160deg,#1a1408,#0d0d0d 40%,#1a1408)", borderBottom: "2px solid #8a6820", padding: "36px 16px 28px", textAlign: "center" }}>
        <div className="pf gold-grad" style={{ fontSize: "clamp(1.4rem,5.5vw,2.6rem)", fontWeight: 900, letterSpacing: "0.08em", lineHeight: 1.25 }}>
          Dubai King Result & Chart 2026
        </div>
        <div className="pf" style={{ color: "#6a6040", fontSize: "0.7rem", letterSpacing: "0.3em", marginTop: 8 }}>◆ Premium Result Platform ◆</div>
      </div>
      <div className="pf" style={{ textAlign: "center", padding: "14px", fontSize: "0.95rem", color: "#c9a84c", borderBottom: "1px solid #1e1c14", background: "#0d0d0d" }}>
        {dateStr} | {timeStr}
      </div>
      <div style={{ textAlign: "center", padding: "30px 16px", borderBottom: "1px solid #1e1c14", background: "#0d0d0d" }}>
        <div className="pf" style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "0.15em", color: "#c0392b" }}>DUBAI KING</div>
        <div className="gold-line" style={{ margin: "8px auto" }} />
        <div className="pf gold-grad" style={{ fontSize: "6rem", fontWeight: 900, lineHeight: 1, margin: "8px 0" }}>
          {loading ? "..." : result1}
        </div>
        <div className="gold-line" style={{ margin: "8px auto" }} />
      </div>
      <div className="im" style={{ margin: 16, border: "1px solid #8a6820", borderRadius: 4, padding: 16, textAlign: "center", fontSize: "0.95rem", color: "#c9a84c", background: "#0d0d0d" }}>
        Har roz ka result yahan update hota hai — Dubai King Official Platform
      </div>
      <div style={{ textAlign: "center", background: "linear-gradient(160deg,#1a1408,#0d0d0d)", borderTop: "1px solid #8a6820", borderBottom: "1px solid #8a6820", padding: 14, marginTop: 8 }}>
        <span className="pf" style={{ color: "#c9a84c", fontSize: "0.85rem", letterSpacing: "0.25em" }}>◆ 2016 se Aaj Tak — Dubai King Chart ◆</span>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#c9a84c" }}>
          <div className="pf" style={{ fontSize: "1.2rem" }}>Loading...</div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", padding: "0 8px 8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #8a6820" }}>
                  {["Year","Month","Day","Dubai King"].map(h => (
                    <th key={h} className="pf" st
