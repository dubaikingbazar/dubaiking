import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

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

export default function AashapuraChart() {
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selMonth, setSelMonth] = useState(getISTTime().getMonth() + 1);
  const [selYear, setSelYear] = useState(getISTTime().getFullYear());
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadChart();
  }, []);

  async function loadChart() {
    setLoading(true);
    try {
      let allData = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase.from("aashapura").select("*")
          .order("year", { ascending: true })
          .order("month", { ascending: true })
          .order("day", { ascending: true })
          .range(from, from + batchSize - 1);
        if (error || !data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < batchSize) break;
        from += batchSize;
      }
      const grouped = {};
      allData.forEach(row => {
        const key = `${row.year}-${row.month}`;
        if (!grouped[key]) grouped[key] = { year: row.year, month: row.month, days: {} };
        grouped[key].days[row.day] = formatResult(row.open_digits, row.close_digits);
      });
      setChartData(grouped);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  const ist = getISTTime();
  const selected = chartData[`${selYear}-${selMonth}`];

  function prevMonth() {
    if (selMonth === 1) { if (selYear > 2016) { setSelMonth(12); setSelYear(y => y-1); } } else setSelMonth(m => m-1);
  }
  function nextMonth() {
    if (selYear === ist.getFullYear() && selMonth === ist.getMonth()+1) return;
    if (selMonth === 12) { setSelMonth(1); setSelYear(y => y+1); } else setSelMonth(m => m+1);
  }
  const isLatest = selYear === ist.getFullYear() && selMonth === ist.getMonth()+1;
  const isOldest = selYear === 2016 && selMonth === 1;
  const years = [];
  for (let y = 2026; y >= 2016; y--) years.push(y);

  return (
    <div style={{background:"#070707",minHeight:"100vh",color:"#e8dfc0",fontFamily:"Georgia,serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .cin{font-family:'Cinzel',serif}
        .cor{font-family:'Cormorant Garamond',serif}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#111}
        ::-webkit-scrollbar-thumb{background:#2a4a6a}
        select{background:#0a0d12;color:#4a9fd4;border:1px solid #1a2a3a;padding:8px 12px;font-family:'Cinzel',serif;font-size:0.75rem;border-radius:2px;outline:none;cursor:pointer}
      `}</style>

      <div style={{background:"linear-gradient(90deg,#2a6a94,#a8d8f0,#4a9fd4,#a8d8f0,#2a6a94)",height:3}} />

      <nav style={{background:"#0a0a0a",borderBottom:"1px solid #1a2a3a",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <button onClick={() => window.location.href="/"} className="cin"
          style={{color:"#4a9fd4",background:"transparent",border:"1px solid #1a2a3a",padding:"8px 18px",fontSize:"0.65rem",letterSpacing:"0.2em",cursor:"pointer",borderRadius:2}}>
          ◀ WAPAS
        </button>
        <div className="cin" style={{color:"#2a4a6a",fontSize:"0.6rem",letterSpacing:"0.3em"}}>◆ AASHAPURA OFFICIAL ◆</div>
      </nav>

      <div style={{background:"linear-gradient(180deg,#06090d,#070707)",padding:"50px 16px 40px",textAlign:"center",borderBottom:"1px solid #1a2a3a"}}>
        <div className="cin" style={{color:"#2a4a6a",fontSize:"0.65rem",letterSpacing:"0.5em",marginBottom:12}}>◆ ◆ ◆</div>
        <div className="cin" style={{fontSize:"clamp(1.6rem,5vw,3rem)",fontWeight:900,letterSpacing:"0.1em",lineHeight:1.2,background:"linear-gradient(180deg,#a8d8f0,#4a9fd4,#2a6a94)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",filter:"drop-shadow(0 0 20px rgba(74,159,212,0.3))"}}>AASHAPURA</div>
        <div className="cin" style={{fontSize:"clamp(0.8rem,2vw,1.2rem)",fontWeight:400,letterSpacing:"0.2em",marginTop:4,color:"#4a7a9b"}}>MONTHLY CHART 2016 — 2026</div>
        <div style={{width:200,height:1,background:"linear-gradient(90deg,transparent,#4a9fd4,transparent)",margin:"16px auto"}} />
        <div className="cor" style={{color:"#4a7a9b",fontSize:"0.85rem",letterSpacing:"0.2em",fontStyle:"italic"}}>Open — Jodi — Close</div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:40}}>
          <div className="cin" style={{color:"#4a9fd4",fontSize:"0.85rem",letterSpacing:"0.3em"}}>LOADING...</div>
        </div>
      ) : (
        <div style={{maxWidth:600,margin:"0 auto",padding:"24px 16px"}}>
          <div style={{border:"1px solid #1a2a3a",borderRadius:4,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#060810,#0a0d16,#060810)",borderBottom:"1px solid #1a2a3a",padding:"14px",textAlign:"center",position:"relative"}}>
              <div style={{position:"absolute",top:"50%",left:14,transform:"translateY(-50%)",color:"#2a4a6a",fontSize:"0.7rem"}}>◆</div>
              <div style={{position:"absolute",top:"50%",right:14,transform:"translateY(-50%)",color:"#2a4a6a",fontSize:"0.7rem"}}>◆</div>
              <div className="cin" style={{fontSize:"1.1rem",fontWeight:700,letterSpacing:"0.2em",background:"linear-gradient(180deg,#a8d8f0,#4a9fd4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                {MONTHS[selMonth-1].toUpperCase()} {selYear}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",background:"#0a0d12",borderBottom:"1px solid #1a2a3a"}}>
              <div className="cin" style={{color:"#c0392b",padding:"10px",textAlign:"center",fontSize:"0.65rem",letterSpacing:"0.2em",borderRight:"1px solid #1a2a3a"}}>DATE</div>
              <div className="cin" style={{color:"#4a9fd4",padding:"10px",textAlign:"center",fontSize:"0.65rem",letterSpacing:"0.2em"}}>OPEN — JODI — CLOSE</div>
            </div>
            {Array.from({length: new Date(selYear, selMonth, 0).getDate()}, (_, i) => i+1).map(day => (
              <div key={day} style={{display:"grid",gridTemplateColumns:"1fr 2fr",background:day%2===0?"#0a0a0a":"#070707",borderBottom:"1px solid #0d1015"}}>
                <div className="cin" style={{color:"#c0392b",padding:"10px",textAlign:"center",fontSize:"0.85rem",fontWeight:700,borderRight:"1px solid #0d1015"}}>
                  {String(day).padStart(2,"0")}
                </div>
                <div className="cin" style={{color:selected?.days[day] && selected.days[day]!=="XXX-XX-XXX"?"#4a9fd4":"#1a2a3a",padding:"10px",textAlign:"center",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.05em"}}>
                  {selected?.days[day] || "XXX-XX-XXX"}
                </div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:16}}>
            <button disabled={isOldest} onClick={prevMonth} className="cin"
              style={{flex:1,background:isOldest?"#0a0a0a":"linear-gradient(135deg,#060810,#0a0d16)",color:isOldest?"#1a2a3a":"#4a9fd4",border:"1px solid",borderColor:isOldest?"#0d0d0d":"#1a2a3a",padding:"12px",fontSize:"0.65rem",cursor:isOldest?"not-allowed":"pointer",borderRadius:2}}>
              ◀ {selMonth===1?`DEC ${selYear-1}`:`${MONTHS[selMonth-2].substring(0,3).toUpperCase()} ${selYear}`}
            </button>
            <button disabled={isLatest} onClick={nextMonth} className="cin"
              style={{flex:1,background:isLatest?"#0a0a0a":"linear-gradient(135deg,#060810,#0a0d16)",color:isLatest?"#1a2a3a":"#4a9fd4",border:"1px solid",borderColor:isLatest?"#0d0d0d":"#1a2a3a",padding:"12px",fontSize:"0.65rem",cursor:isLatest?"not-allowed":"pointer",borderRadius:2}}>
              {selMonth===12?`JAN ${selYear+1}`:`${MONTHS[selMonth].substring(0,3).toUpperCase()} ${selYear}`} ▶
            </button>
          </div>

          <div style={{marginTop:16,background:"linear-gradient(135deg,#060810,#0a0d12)",border:"1px solid #1a2a3a",borderRadius:4,padding:"16px",textAlign:"center"}}>
            <div className="cin" style={{color:"#2a4a6a",fontSize:"0.6rem",letterSpacing:"0.3em",marginBottom:12}}>◆ SELECT MONTH & YEAR ◆</div>
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m.toUpperCase()}</option>)}
              </select>
              <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <div style={{background:"linear-gradient(90deg,#2a6a94,#a8d8f0,#4a9fd4,#a8d8f0,#2a6a94)",height:3,marginTop:40}} />
      <footer style={{textAlign:"center",padding:"20px",background:"#0a0a0a"}}>
        <div className="cin" style={{color:"#1a2a3a",fontSize:"0.6rem",letterSpacing:"0.3em"}}>© 2026 AASHAPURA — ALL RIGHTS RESERVED</div>
      </footer>
    </div>
  );
}
