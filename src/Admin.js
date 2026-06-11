import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const ADMIN_PASS = "admin123";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getISTTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function calcJodi(open, close) {
  if (!open || open === "XXX") return "XX";
  const openDigit = open.split("").reduce((a, b) => a + parseInt(b), 0) % 10;
  if (!close || close === "XXX") return openDigit + "X";
  const closeDigit = close.split("").reduce((a, b) => a + parseInt(b), 0) % 10;
  return `${openDigit}${closeDigit}`;
}

function formatResult(open, close) {
  const o = open || "XXX";
  const c = close || "XXX";
  return `${o}-${calcJodi(o,c)}-${c}`;
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");

  // Dubai King
  const [result1, setResult1] = useState("--");
  const [result2, setResult2] = useState("WAIT");
  const [adminR1, setAdminR1] = useState("");
  const [adminR2, setAdminR2] = useState("");
  const [saved1, setSaved1] = useState(false);
  const [saved2, setSaved2] = useState(false);

  // Aashapura
  const [aOpen, setAOpen] = useState("XXX");
  const [aClose, setAClose] = useState("XXX");
  const [adminAOpen, setAdminAOpen] = useState("");
  const [adminAClose, setAdminAClose] = useState("");
  const [savedAOpen, setSavedAOpen] = useState(false);
  const [savedAClose, setSavedAClose] = useState(false);

  const [autoReset, setAutoReset] = useState(false);
  const initialized = useRef(false);
  const resetDone = useRef(false);

  useEffect(() => {
    if (!loggedIn) return;
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, [loggedIn]);

  // Auto reset at 12 AM
  useEffect(() => {
    if (!loggedIn) return;
    const t = setInterval(async () => {
      const ist = getISTTime();
      const h = ist.getHours();
      const m = ist.getMinutes();
      if (h === 0 && m === 0 && !resetDone.current) {
        resetDone.current = true;
        await autoResetAll();
      } else if (h !== 0) {
        resetDone.current = false;
      }
    }, 30000);
    return () => clearInterval(t);
  }, [loggedIn]);

  async function autoResetAll() {
    try {
      // Dubai King reset
      const { data: rData } = await supabase.from("results").select("*").eq("id", 1).single();
      if (rData && rData.result2 && rData.result2 !== "WAIT") {
        await supabase.from("results").upsert({ 
          id: 1, 
          result1: rData.result2, 
          result2: "WAIT",
          updated_at: new Date().toISOString() 
        });
        setResult1(rData.result2);
        setResult2("WAIT");
      }

      // Aashapura reset
      await supabase.from("aashapura_results").upsert({ 
        id: 1, 
        open_digits: "XXX", 
        close_digits: "XXX",
        updated_at: new Date().toISOString() 
      });
      setAOpen("XXX");
      setAClose("XXX");

      setAutoReset(true);
      setTimeout(() => setAutoReset(false), 5000);
    } catch(e) { console.error(e); }
  }

  async function loadData() {
    try {
      const { data: rData } = await supabase.from("results").select("*").eq("id", 1).single();
      if (rData) { setResult1(rData.result1); setResult2(rData.result2 || "WAIT"); }
      const { data: aData } = await supabase.from("aashapura_results").select("*").eq("id", 1).single();
      if (aData) { setAOpen(aData.open_digits || "XXX"); setAClose(aData.close_digits || "XXX"); }
    } catch(e) { console.error(e); }
  }

  async function saveResult1() {
    const val = adminR1.trim();
    if (!val) return;
    const ist = getISTTime();
    const day = ist.getDate();
    const month = ist.getMonth() + 1;
    const year = ist.getFullYear();
    // Save to results table
    await supabase.from("results").upsert({ id: 1, result1: val, updated_at: new Date().toISOString() });
    // Save to chart
    await supabase.from("chart").upsert({ year, month, day, result1: val }, { onConflict: "year,month,day" });
    setResult1(val); setSaved1(true); setTimeout(() => setSaved1(false), 2500); setAdminR1("");
  }

  async function saveResult2() {
    const val = adminR2.trim();
    if (!val) return;
    const ist = getISTTime();
    const day = ist.getDate();
    const month = ist.getMonth() + 1;
    const year = ist.getFullYear();
    // Save to results table
    await supabase.from("results").upsert({ id: 1, result2: val, updated_at: new Date().toISOString() });
    // Save to chart
    await supabase.from("chart").upsert({ year, month, day, result1: val }, { onConflict: "year,month,day" });
    setResult2(val); setSaved2(true); setTimeout(() => setSaved2(false), 2500); setAdminR2("");
  }

  async function saveAOpen() {
    const val = adminAOpen.trim();
    if (!val || val.length !== 3) return;
    await supabase.from("aashapura_results").upsert({ id: 1, open_digits: val, updated_at: new Date().toISOString() });
    setAOpen(val); setSavedAOpen(true); setTimeout(() => setSavedAOpen(false), 2500); setAdminAOpen("");
  }

  async function saveAClose() {
    const val = adminAClose.trim();
    if (!val || val.length !== 3) return;
    const ist = getISTTime();
    const day = ist.getDate();
    const month = ist.getMonth() + 1;
    const year = ist.getFullYear();
    // Save to aashapura_results
    await supabase.from("aashapura_results").upsert({ id: 1, close_digits: val, updated_at: new Date().toISOString() });
    // Save to aashapura chart
    const currentOpen = aOpen !== "XXX" ? aOpen : adminAOpen;
    await supabase.from("aashapura").upsert({ year, month, day, open_digits: currentOpen, close_digits: val }, { onConflict: "year,month,day" });
    setAClose(val); setSavedAClose(true); setTimeout(() => setSavedAClose(false), 2500); setAdminAClose("");
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
    .admin-input-blue{background:#111;border:1px solid #1a2a3a;color:#e8dfc0;padding:10px 14px;border-radius:2px;font-family:'Cinzel',serif;font-size:0.85rem;width:100%;outline:none}
    .admin-input-blue:focus{border-color:#4a9fd4}
    .btn-gold{background:linear-gradient(135deg,#f5e070,#c9a84c,#8a6820);color:#000;border:none;padding:10px 24px;font-family:'Cinzel',serif;font-weight:700;font-size:0.75rem;letter-spacing:0.1em;cursor:pointer;border-radius:2px}
    .btn-blue{background:linear-gradient(135deg,#2a6a94,#4a9fd4);color:#fff;border:none;padding:10px 24px;font-family:'Cinzel',serif;font-weight:700;font-size:0.75rem;letter-spacing:0.1em;cursor:pointer;border-radius:2px}
    .btn-red{background:linear-gradient(135deg,#8b0000,#c0392b);color:#fff;border:none;padding:8px 16px;font-family:'Cinzel',serif;font-weight:700;font-size:0.7rem;cursor:pointer;border-radius:2px}
  `;

  if (!loggedIn) return (
    <div style={{background:"#070707",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{css}</style>
      <div style={{background:"#0d0d0d",border:"1px solid #8a6820",borderRadius:4,padding:"36px 28px",width:"100%",maxWidth:380,textAlign:"center"}}>
        <div className="cin gold-grad" style={{fontSize:"1.8rem",fontWeight:900,marginBottom:6}}>ADMIN LOGIN</div>
        <div className="cin" style={{color:"#6a6040",fontSize:"0.65rem",letterSpacing:"0.3em",marginBottom:24}}>◆ DUBAI KING & AASHAPURA ◆</div>
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
        <div className="cin gold-grad" style={{fontSize:"1.1rem",fontWeight:900}}>⚙ ADMIN PANEL</div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn-gold" onClick={() => window.location.href="/"}>🌐 WEBSITE</button>
          <button className="btn-red" onClick={() => setLoggedIn(false)}>LOGOUT</button>
        </div>
      </div>

      {autoReset && (
        <div style={{background:"#1a3a1a",border:"1px solid #4caf50",margin:16,padding:12,borderRadius:4,textAlign:"center",color:"#4caf50",fontSize:"0.8rem"}}>
          ✓ 12 AM — Date change ho gayi! Dono games reset ho gaye!
        </div>
      )}

      <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px"}}>

        {/* Dubai King */}
        <div className="cin" style={{color:"#c9a84c",fontSize:"0.7rem",letterSpacing:"0.3em",marginBottom:12,borderBottom:"1px solid #2a2010",paddingBottom:8}}>◆ DUBAI KING</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28}}>
          <div style={{background:"#0d0d0d",border:"1px solid #8a6820",borderRadius:4,padding:20}}>
            <div className="cin" style={{color:"#c9a84c",fontSize:"0.75rem",fontWeight:700,marginBottom:4}}>PREVIOUS (Kal Ka)</div>
            <div style={{color:"#6a6040",fontSize:"0.7rem",marginBottom:12}}>Current: <strong style={{color:"#f5e070"}}>{result1}</strong></div>
            <input className="admin-input" type="number" min="1" max="100" placeholder="1-100"
              value={adminR1} onChange={e => setAdminR1(e.target.value)}
              onKeyDown={e => e.key==="Enter" && saveResult1()} style={{marginBottom:10}} />
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="btn-gold" onClick={saveResult1}>💾 SAVE</button>
              {saved1 && <span style={{color:"#4caf50",fontSize:"0.75rem"}}>✓ Chart mein save!</span>}
            </div>
          </div>
          <div style={{background:"#0d0d0d",border:"1px solid #8a6820",borderRadius:4,padding:20}}>
            <div className="cin" style={{color:"#c9a84c",fontSize:"0.75rem",fontWeight:700,marginBottom:4}}>NEXT (Aaj Ka)</div>
            <div style={{color:"#6a6040",fontSize:"0.7rem",marginBottom:12}}>Current: <strong style={{color:"#f5e070"}}>{result2}</strong></div>
            <input className="admin-input" type="number" min="1" max="100" placeholder="1-100"
              value={adminR2} onChange={e => setAdminR2(e.target.value)}
              onKeyDown={e => e.key==="Enter" && saveResult2()} style={{marginBottom:10}} />
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="btn-gold" onClick={saveResult2}>💾 SAVE</button>
              {saved2 && <span style={{color:"#4caf50",fontSize:"0.75rem"}}>✓ Chart mein save!</span>}
            </div>
          </div>
        </div>

        {/* Aashapura */}
        <div className="cin" style={{color:"#4a9fd4",fontSize:"0.7rem",letterSpacing:"0.3em",marginBottom:12,borderBottom:"1px solid #1a2a3a",paddingBottom:8}}>◆ AASHAPURA</div>

        <div style={{marginBottom:12,background:"#0a0d12",border:"1px solid #1a2a3a",borderRadius:4,padding:12,textAlign:"center"}}>
          <div className="cin" style={{color:"#4a9fd4",fontSize:"1.1rem",letterSpacing:"0.1em"}}>
            {formatResult(aOpen, aClose)}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{background:"#0a0d12",border:"1px solid #1a2a3a",borderRadius:4,padding:20}}>
            <div className="cin" style={{color:"#4a9fd4",fontSize:"0.75rem",fontWeight:700,marginBottom:4}}>OPEN (3 Digits)</div>
            <div style={{color:"#2a4a6a",fontSize:"0.7rem",marginBottom:12}}>Current: <strong style={{color:"#4a9fd4"}}>{aOpen}</strong></div>
            <input className="admin-input-blue" type="text" maxLength={3} placeholder="e.g. 234"
              value={adminAOpen} onChange={e => setAdminAOpen(e.target.value)}
              onKeyDown={e => e.key==="Enter" && saveAOpen()} style={{marginBottom:10}} />
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="btn-blue" onClick={saveAOpen}>💾 SAVE OPEN</button>
              {savedAOpen && <span style={{color:"#4caf50",fontSize:"0.75rem"}}>✓ Live!</span>}
            </div>
          </div>
          <div style={{background:"#0a0d12",border:"1px solid #1a2a3a",borderRadius:4,padding:20}}>
            <div className="cin" style={{color:"#4a9fd4",fontSize:"0.75rem",fontWeight:700,marginBottom:4}}>CLOSE (3 Digits)</div>
            <div style={{color:"#2a4a6a",fontSize:"0.7rem",marginBottom:12}}>Current: <strong style={{color:"#4a9fd4"}}>{aClose}</strong></div>
            <input className="admin-input-blue" type="text" maxLength={3} placeholder="e.g. 365"
              value={adminAClose} onChange={e => setAdminAClose(e.target.value)}
              onKeyDown={e => e.key==="Enter" && saveAClose()} style={{marginBottom:10}} />
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="btn-blue" onClick={saveAClose}>💾 SAVE CLOSE</button>
              {savedAClose && <span style={{color:"#4caf50",fontSize:"0.75rem"}}>✓ Chart mein save!</span>}
            </div>
          </div>
        </div>

      </div>

      <div style={{background:"linear-gradient(90deg,#8a6820,#f5e070,#c9a84c,#f5e070,#8a6820)",height:3,marginTop:40}} />
    </div>
  );
}
