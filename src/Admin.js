import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const ADMIN_PASS = "admin123";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getISTTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function shouldAutoReset() {
  const ist = getISTTime();
  const h = ist.getHours();
  return h >= 5 && h < 6;
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [result1, setResult1] = useState("--");
  const [result2, setResult2] = useState("WAIT");
  const [adminR1, setAdminR1] = useState("");
  const [adminR2, setAdminR2] = useState("");
  const [saved1, setSaved1] = useState(false);
  const [saved2, setSaved2] = useState(false);
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
        const month = yesterday.getMonth() + 1;
        const year = yesterday.getFullYear();
        await supabase.from("chart")
          .update({ result1: rData.result1 })
          .eq("year", year).eq("month", month).eq("day", day);
        await supabase.from("results").upsert({ 
          id: 1, 
          result1: rData.result2 || "--", 
          result2: "WAIT",
          updated_at: new Date().toISOString() 
        });
        setResult1(rData.result2 || "--");
        setResult2("WAIT");
        setAutoReset(true);
        setTimeout(() => setAutoReset(false), 5000);
        await loadChartPage(1);
      }
    } catch(e) { console.error(e); }
  }

  async function loadData() {
    try {
      const { data: rData } = await supabase.from("results").select("*").eq("id", 1).single();
      if (rData) { setResult1(rData.result1); setResult2(rData.result2 || "WAIT"); }
      await loadChartPage(1);
    } catch(e) { console.error(e); }
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

  async function saveResult1() {
    const val = adminR1.trim();
    if (!val) return;
    await supabase.from("results").upsert({ id: 1, result1: val, updated_at: new Date().toISOString() });
    setResult1(val);
    setSaved1(true);
    setTimeout(() => setSaved1(false), 2500);
    setAdminR1("");
  }

  async function saveResult2() {
    const val = adminR2.trim();
    if (!val) return;
    await supabase.from("results").upsert({ id: 1, result2: val, updated_at: new Date().toISOString() });
    setResult2(val);
    setSaved2(true);
    setTimeout(() => setSaved2(false), 2500);
    setAdminR2("");
  }

  async function saveChartEdit(id) {
    await supabase.from("chart").update({ result1: editVal }).eq("id", id);
    setChart(chart.map(r => r.id === id ? { ...r, result1: editVal } : r));
    setEditIdx(null);
  }

  function handleLogin() {
    if (loginPass === ADMIN_PASS) { setLoggedIn(true); setLoginErr(""); }
    else setLoginErr("Galat password!");
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    .cin{font-family:'Cinzel',serif}
    .gold-grad{background:linear-gradient(180deg,#f5e070,#c9a84c,#8a6820);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .admin-input{background:#111;border:1px solid #8a6820;color:#e8dfc0;padding:10px 14px;border-radius:2px;font-family:'Cinzel',serif;font-size:0.85rem;width:100%;outline:none;transition:border-color 0.2s}
    .admin-input:focus{border-color:#c9a84c}
    .btn-gold{background:linear-gradient(135deg,#f5e070,#c9a84c,#8a6820);color:#000;border:none;padding:10px 24px;font-family:'Cinzel',serif;font-weight:700;font-size:0.75rem;letter-spacing:0.1em;cursor:pointer;border-radius:2px}
    .btn-red{background:linear-gradient(135deg,#8b0000,#c0392b);color:#fff;border:none;padding:8px 16px;font-family:'Cinzel',serif;font-weight:700;font-size:0.7rem;cursor:pointer;border-radius:2px}
    .chart-row:hover td{background:#1a1a10!important}
  `;

  if (!loggedIn) return (
    <div style={{background:"#070707",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{css}</style>
      <div style={{background:"#0d0d0d",border:"1px solid #8a6820",borderRadius:4,padding:"36px 28px",width:"100%",maxWidth:380,textAlign:"center"}}>
        <div className="cin gold-grad" style={{fontSize:"1.8rem",fontWeight:900,marginBottom:6}}>ADMIN LOGIN</div>
        <div className="cin" style={{color:"#6a6040",fontSize:"0.65rem",letterSpacing:"0.3em",marginBottom:24}}>◆ DUBAI KING ◆</div>
        <input className="admin-input" type="password" placeholder="Password dalein..."
          value={loginPass} onChange={e => setLoginPass(e.target.value)}
          onKeyDown={e => e.key==="Enter" && handleLogin()} style={{marginBottom:10}} />
        {loginErr && <div style={{color:"#c0392b",fontSize:"0.8rem",marginBottom:10}}>{loginErr}</div>}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:6}}>
          <button className="btn-gold" onClick={handleLogin}>LOGIN ▶</button>
          <button className="btn-red" onClick={() => window.location.href="/"}>WAPAS</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{background:"#070707",minHeight:"100vh",color:"#e8dfc0"}}>
      <style>{css}</style>
      <div style={{background:"linear-gradient(90deg,#8a6820,#f5e070,#c9a84c,#f5e070,#8a6820)",height:3}} />
      
      <div style={{background:"#0a0a0a",borderBottom:"1px solid #2a2010",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div className="cin gold-grad" style={{fontSize:"1.1rem",fontWeight:900,letterSpacing:"0.1em"}}>⚙ ADMIN PANEL — DUBAI KING</div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn-gold" onClick={() => window.location.href="/"}>🌐 WEBSITE</button>
          <button className="btn-red" onClick={() => setLoggedIn(false)}>LOGOUT</button>
        </div>
      </div>

      {autoReset && (
        <div style={{background:"#1a3a1a",border:"1px solid #4caf50",margin:16,padding:12,borderRadius:4,textAlign:"center",color:"#4caf50",fontSize:"0.8rem"}}>
          ✓ Auto reset ho gaya — result chart mein save ho gaya!
        </div>
      )}

      <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>
        
        {/* Result 1 - Previous */}
        <div style={{background:"#0d0d0d",border:"1px solid #8a6820",borderRadius:4,padding:24,marginBottom:16}}>
          <div className="cin" style={{color:"#c9a84c",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.15em",marginBottom:4}}>◆ PREVIOUS RESULT (Aaj Ka)</div>
          <div style={{color:"#6a6040",fontSize:"0.72rem",marginBottom:16}}>Current: <strong style={{color:"#f5e070"}}>{result1}</strong></div>
          <div style={{marginBottom:12}}>
            <label className="cin" style={{color:"#6a6040",fontSize:"0.65rem",letterSpacing:"0.15em",display:"block",marginBottom:6}}>NUMBER DALEIN (1-100)</label>
            <input className="admin-input" type="number" min="1" max="100" placeholder="Number dalein..."
              value={adminR1} onChange={e => setAdminR1(e.target.value)}
              onKeyDown={e => e.key==="Enter" && saveResult1()} />
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button className="btn-gold" onClick={saveResult1}>💾 SAVE & PUBLISH</button>
            {saved1 && <span style={{color:"#4caf50",fontSize:"0.8rem"}}>✓ Live ho gaya!</span>}
          </div>
        </div>

        {/* Result 2 - Next */}
        <div style={{background:"#0d0d0d",border:"1px solid #8a6820",borderRadius:4,padding:24,marginBottom:20}}>
          <div className="cin" style={{color:"#c9a84c",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.15em",marginBottom:4}}>◆ NEXT RESULT (Agle Din Ka)</div>
          <div style={{color:"#6a6040",fontSize:"0.72rem",marginBottom:16}}>Current: <strong style={{color:"#f5e070"}}>{result2}</strong></div>
          <div style={{marginBottom:12}}>
            <label className="cin" style={{color:"#6a6040",fontSize:"0.65rem",letterSpacing:"0.15em",display:"block",marginBottom:6}}>NUMBER DALEIN (1-100)</label>
            <input className="admin-input" type="number" min="1" max="100" placeholder="Number dalein..."
              value={adminR2} onChange={e => setAdminR2(e.target.value)}
              onKeyDown={e => e.key==="Enter" && saveResult2()} />
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button className="btn-gold" onClick={saveResult2}>💾 SAVE & PUBLISH</button>
            {saved2 && <span style={{color:"#4caf50",fontSize:"0.8rem"}}>✓ Live ho gaya!</span>}
          </div>
        </div>

        {/* Chart Edit */}
        <div style={{background:"#0d0d0d",border:"1px solid #8a6820",borderRadius:4,padding:24}}>
          <div className="cin" style={{color:"#c9a84c",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.15em",marginBottom:16}}>◆ CHART EDIT</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.82rem"}}>
              <thead>
                <tr style={{borderBottom:"1px solid #8a6820"}}>
                  {["Year","Month","Day","Result","Action"].map(h => (
                    <th key={h} className="cin" style={{color:"#c9a84c",padding:"10px 8px",textAlign:"left",fontWeight:700,fontSize:"0.65rem",letterSpacing:"0.1em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.map((row) => (
                  <tr key={row.id} className="chart-row" style={{borderBottom:"1px solid #1a1a10"}}>
                    <td style={{padding:"9px 8px",color:"#6a6040"}}>{row.year}</td>
                    <td style={{padding:"9px 8px",color:"#e8dfc0"}}>{MONTHS[row.month-1]?.substring(0,3)}</td>
                    <td style={{padding:"9px 8px",color:"#e8dfc0"}}>{String(row.day).padStart(2,"0")}</td>
                    <td style={{padding:"9px 8px"}}>
                      {editIdx === row.id
                        ? <input className="admin-input" type="text" value={editVal}
                            onChange={e => setEditVal(e.target.value)} style={{width:80,padding:"4px 8px"}} />
                        : <span className="cin" style={{color:"#c9a84c",fontWeight:700}}>{row.result1}</span>}
                    </td>
                    <td style={{padding:"9px 8px"}}>
                      {editIdx === row.id
                        ? <div style={{display:"flex",gap:6}}>
                            <button className="btn-gold" style={{padding:"5px 10px",fontSize:"0.65rem"}} onClick={() => saveChartEdit(row.id)}>✓</button>
                            <button className="btn-red" style={{padding:"5px 8px",fontSize:"0.65rem"}} onClick={() => setEditIdx(null)}>✕</button>
                          </div>
                        : <button className="btn-red" style={{padding:"5px 10px",fontSize:"0.65rem"}}
                            onClick={() => { setEditIdx(row.id); setEditVal(row.result1); }}>Edit</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"center"}}>
            {chartPage > 1 && <button className="btn-gold" style={{padding:"6px 16px"}} onClick={() => loadChartPage(chartPage-1)}>◀ Prev</button>}
            <span className="cin" style={{color:"#6a6040",padding:"6px 10px",fontSize:"0.7rem"}}>Page {chartPage}</span>
            <button className="btn-gold" style={{padding:"6px 16px"}} onClick={() => loadChartPage(chartPage+1)}>Next ▶</button>
          </div>
        </div>
      </div>

      <div style={{background:"linear-gradient(90deg,#8a6820,#f5e070,#c9a84c,#f5e070,#8a6820)",height:3,marginTop:40}} />
    </div>
  );
}
