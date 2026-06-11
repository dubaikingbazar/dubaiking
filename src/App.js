import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getISTTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function calcJodi(open, close) {
  if (!open || open === "XXX") return "XX";
  const openSum = open.split("").reduce((a, b) => a + parseInt(b), 0);
  const openDigit = openSum % 10;
  if (!close || close === "XXX") return openDigit + "X";
  const closeSum = close.split("").reduce((a, b) => a + parseInt(b), 0);
  const closeDigit = closeSum % 10;
  return `${openDigit}${closeDigit}`;
}

function formatResult(open, close) {
  const jodi = calcJodi(open, close);
  const o = open || "XXX";
  const c = close || "XXX";
  return `${o}-${jodi}-${c}`;
}

export default function App() {
  const [result1, setResult1] = useState("--");
  const [result2, setResult2] = useState("WAIT");
  const [aOpen, setAOpen] = useState("XXX");
  const [aClose, setAClose] = useState("XXX");
  const [chartData, setChartData] = useState({});
  const [aChartData, setAChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(getISTTime());
  const [selMonth, setSelMonth] = useState(getISTTime().getMonth() + 1);
  const [selYear, setSelYear] = useState(getISTTime().getFullYear());
  const [aSelMonth, setASelMonth] = useState(getISTTime().getMonth() + 1);
  const [aSelYear, setASelYear] = useState(getISTTime().getFullYear());
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: rData } = await supabase.from("results").select("*").eq("id", 1).single();
      if (rData) { setResult1(rData.result1); setResult2(rData.result2 || "WAIT"); }
      
      const { data: aData } = await supabase.from("aashapura_results").select("*").eq("id", 1).single();
      if (aData) { setAOpen(aData.open_digits || "XXX"); setAClose(aData.close_digits || "XXX"); }

      await loadChart();
      await loadAChart();
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function loadChart() {
    const { data } = await supabase.from("chart").select("*")
      .order("year", { ascending: false }).order("month", { ascending: false }).order("day", { ascending: true });
    if (!data) return;
    const grouped = {};
    data.forEach(row => {
      const key = `${row.year}-${row.month}`;
      if (!grouped[key]) grouped[key] = { year: row.year, month: row.month, days: {} };
      grouped[key].days[row.day] = row.result1;
    });
    setChartData(grouped);
  }

  async function loadAChart() {
    const { data } = await supabase.from("aashapura").select("*")
      .order("year", { ascending: false }).order("month", { ascending: false }).order("day", { ascending: true });
    if (!data) return;
    const grouped = {};
    data.forEach(row => {
      const key = `${row.year}-${row.month}`;
      if (!grouped[key]) grouped[key] = { year: row.year, month: row.month, days: {} };
      grouped[key].days[row.day] = formatResult(row.open_digits, row.close_digits);
    });
    setAChartData(grouped);
  }

  useEffect(() => {
    const channel = supabase.channel("all-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, (payload) => {
        if (payload.new) {
          if (payload.new.result1 !== undefined) setResult1(payload.new.result1);
          if (payload.new.result2 !== undefined) setResult2(payload.new.result2 || "WAIT");
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "aashapura_results" }, (payload) => {
        if (payload.new) {
          setAOpen(payload.new.open_digits || "XXX");
          setAClose(payload.new.close_digits || "XXX");
        }
      })
      .subscribe();

    const r = setInterval(async () => {
      try {
        const { data: d1 } = await supabase.from("results").select("*").eq("id", 1).single();
        if (d1) { setResult1(d1.result1); setResult2(d1.result2 || "WAIT"); }
        const { data: d2 } = await supabase.from("aashapura_results").select("*").eq("id", 1).single();
        if (d2) { setAOpen(d2.open_digits || "XXX"); setAClose(d2.close_digits || "XXX"); }
      } catch(e) {}
    }, 3000);

    const t = setInterval(() => setNow(getISTTime()), 1000);
    return () => { supabase.removeChannel(channel); clearInterval(r); clearInterval(t); };
  }, []);

  const ist = getISTTime();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  const todayDay = ist.getDate();
  const todayMonth = MONTHS[ist.getMonth()].substring(0,3).toUpperCase();
  const yesterdayDate = new Date(ist);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDay = yesterdayDate.getDate();
  const yesterdayMonth = MONTHS[yesterdayDate.getMonth()].substring(0,3).toUpperCase();

  const selected = chartData[`${selYear}-${selMonth}`];
  const aSelected = aChartData[`${aSelYear}-${aSelMonth}`];

  function prevMonth() {
    if (selMonth === 1) { if (selYear > 2016) { setSelMonth(12); setSelYear(y => y-1); } } else setSelMonth(m => m-1);
  }
  function nextMonth() {
    if (selYear === ist.getFullYear() && selMonth === ist.getMonth()+1) return;
    if (selMonth === 12) { setSelMonth(1); setSelYear(y => y+1); } else setSelMonth(m => m+1);
  }
  function aPrevMonth() {
    if (aSelMonth === 1) { if (aSelYear > 2016) { setASelMonth(12); setASelYear(y => y-1); } } else setASelMonth(m => m-1);
  }
  function aNextMonth() {
    if (aSelYear === ist.getFullYear() && aSelMonth === ist.getMonth()+1) return;
    if (aSelMonth === 12) { setASelMonth(1); setASelYear(y => y+1); } else setASelMonth(m => m+1);
  }

  const isLatest = selYear === ist.getFullYear() && selMonth === ist.getMonth()+1;
  const isOldest = selYear === 2016 && selMonth === 1;
  const aIsLatest = aSelYear === ist.getFullYear() && aSelMonth === ist.getMonth()+1;
  const aIsOldest = aSelYear === 2016 && aSelMonth === 1;

  const years = [];
  for (let y = 2026; y >= 2016; y--) years.push(y);
  const isWait = result2 === "WAIT" || result2 === "--" || !result2;
  const aResult = formatResult(aOpen, aClose);

  return (
    <div style={{background:"#070707",minHeight:"100vh",color:"#e8dfc0",fontFamily:"Georgia,serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .cin{font-family:'Cinzel',serif}
        .cor{font-family:'Cormorant Garamond',serif}
        .gold-grad{background:linear-gradient(180deg,#f5e070,#c9a84c,#8a6820);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .pulse{animation:pulse 1.4s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#111}
        ::-webkit-scrollbar-thumb{background:#8a6820}
        select{background:#0d0d0d;color:#c9a84c;border:1px solid #8a6820;padding:8px 12px;font-family:'Cinzel',serif;font-size:0.75rem;border-radius:2px;outline:none;cursor:pointer}
      `}</style>

      <div style={{background:"linear-gradient(90deg,#8a6820,#f5e070,#c9a84c,#f5e070,#8a6820)",height:3}} />

      <nav style={{background:"#0a0a0a",borderBottom:"1px solid #2a2010",padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:4}}>
          {["HOME","CHART","CONTACT"].map(l => (
            <a key={l} href="#" className="cin" style={{color:"#c9a84c",padding:"8px 18px",textDecoration:"none",fontWeight:700,fontSize:"0.65rem",letterSpacing:"0.25em",border:"1px solid #2a2010"}}>{l}</a>
          ))}
        </div>
        <div className="cin" style={{color:"#8a6820",fontSize:"0.6rem",letterSpacing:"0.3em"}}>◆ OFFICIAL PLATFORM ◆</div>
      </nav>

      {/* ── DUBAI KING ── */}
      <div style={{background:"linear-gradient(180deg,#0d0b06,#070707)",padding:"50px 16px 40px",textAlign:"center",borderBottom:"1px solid #1a1408"}}>
        <div className="cin" style={{color:"#8a6820",fontSize:"0.65rem",letterSpacing:"0.5em",marginBottom:12}}>◆ ◆ ◆</div>
        <div className="cin gold-grad" style={{fontSize:"clamp(1.6rem,5vw,3rem)",fontWeight:900,letterSpacing:"0.1em",lineHeight:1.2,filter:"drop-shadow(0 0 20px rgba(201,168,76,0.3))"}}>DUBAI KING</div>
        <div className="cin gold-grad" style={{fontSize:"clamp(1rem,3vw,1.6rem)",fontWeight:400,letterSpacing:"0.2em",marginTop:4}}>RESULT & CHART 2026</div>
        <div style={{width:200,height:1,background:"linear-gradient(90deg,transparent,#c9a84c,transparent)",margin:"16px auto"}} />
        <div className="cor" style={{color:"#8a6820",fontSize:"0.85rem",letterSpacing:"0.2em",fontStyle:"italic"}}>Premium Result Platform</div>
      </div>

      <div style={{background:"#0a0a0a",borderBottom:"1px solid #1a1408",padding:"12px",textAlign:"center"}}>
        <span className="cin" style={{color:"#c9a84c",fontSize:"0.75rem",letterSpacing:"0.15em"}}>{dateStr} &nbsp;◆&nbsp; {timeStr} (IST)</span>
      </div>

      {/* Dubai King Cards */}
      <div style={{maxWidth:700,margin:"40px auto",padding:"0 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"linear-gradient(145deg,#0d0b06,#111008)",border:"1px solid #2a2010",borderRadius:4,padding:"30px 16px",textAlign:"center",position:"relative"}}>
          <div style={{position:"absolute",top:8,left:10,color:"#8a6820",fontSize:"0.7rem"}}>◆</div>
          <div style={{position:"absolute",top:8,right:10,color:"#8a6820",fontSize:"0.7rem"}}>◆</div>
          <div className="cin" style={{color:"#8a6820",fontSize:"0.6rem",letterSpacing:"0.3em",marginBottom:4}}>{yesterdayDay} {yesterdayMonth}</div>
          <div className="cin" style={{color:"#c0392b",fontSize:"1rem",fontWeight:900,letterSpacing:"0.2em",marginBottom:2}}>DUBAI KING</div>
          <div className="cin" style={{color:"#6a6040",fontSize:"0.55rem",letterSpacing:"0.2em",marginBottom:10}}>07:30 PM</div>
          <div style={{width:60,height:1,background:"linear-gradient(90deg,transparent,#c9a84c,transparent)",margin:"0 auto 12px"}} />
          <div className="cin gold-grad" style={{fontSize:"clamp(3rem,10vw,5rem)",fontWeight:900,lineHeight:1,filter:"drop-shadow(0 0 15px rgba(201,168,76,0.4))"}}>{loading ? "..." : result1}</div>
          <div style={{width:60,height:1,background:"linear-gradient(90deg,transparent,#c9a84c,transparent)",margin:"12px auto 0"}} />
        </div>
        <div style={{background:"linear-gradient(145deg,#0d0b06,#111008)",border:"1px solid #2a2010",borderRadius:4,padding:"30px 16px",textAlign:"center",position:"relative"}}>
          <div style={{position:"absolute",top:8,left:10,color:"#8a6820",fontSize:"0.7rem"}}>◆</div>
          <div style={{position:"absolute",top:8,right:10,color:"#8a6820",fontSize:"0.7rem"}}>◆</div>
          <div className="cin" style={{color:"#8a6820",fontSize:"0.6rem",letterSpacing:"0.3em",marginBottom:4}}>{todayDay} {todayMonth}</div>
          <div className="cin" style={{color:"#c0392b",fontSize:"1rem",fontWeight:900,letterSpacing:"0.2em",marginBottom:2}}>DUBAI KING</div>
          <div className="cin" style={{color:"#6a6040",fontSize:"0.55rem",letterSpacing:"0.2em",marginBottom:10}}>07:30 PM</div>
          <div style={{width:60,height:1,background:"linear-gradient(90deg,transparent,#c9a84c,transparent)",margin:"0 auto 12px"}} />
          {isWait ? (
            <div>
              <div className="cin pulse" style={{fontSize:"1.8rem",fontWeight:900,color:"#c0392b",letterSpacing:"0.3em"}}>WAIT</div>
              <div className="cin" style={{color:"#6a6040",fontSize:"0.5rem",letterSpacing:"0.15em",marginTop:8}}>RESULT AANE WALA HAI</div>
            </div>
          ) : (
            <div className="cin gold-grad" style={{fontSize:"clamp(3rem,10vw,5rem)",fontWeight:900,lineHeight:1,filter:"drop-shadow(0 0 15px rgba(201,168,76,0.4))"}}>{result2}</div>
          )}
          <div style={{width:60,height:1,background:"linear-gradient(90deg,transparent,#c9a84c,transparent)",margin:"12px auto 0"}} />
        </div>
      </div>

      <div style={{maxWidth:700,margin:"0 auto 32px",padding:"0 16px"}}>
        <div className="cor" style={{border:"1px solid #1a1408",padding:"14px 20px",textAlign:"center",fontSize:"0.9rem",color:"#8a6820",fontStyle:"italic",background:"#0a0a0a"}}>
          ❝ Har roz ka result 7:30 PM pe update hota hai — Dubai King Official Platform ❞
        </div>
      </div>

      {/* Dubai King Chart */}
      <div style={{background:"linear-gradient(180deg,#0d0b06,#070707)",borderTop:"1px solid #2a2010",borderBottom:"1px solid #2a2010",padding:"16px",textAlign:"center"}}>
        <div className="cin gold-grad" style={{fontSize:"1rem",fontWeight:700,letterSpacing:"0.3em"}}>DUBAI KING MONTHLY CHART</div>
        <div className="cin" style={{color:"#8a6820",fontSize:"0.55rem",letterSpacing:"0.5em",marginTop:4}}>2016 — 2026</div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:40}}><div className="cin" style={{color:"#c9a84c",fontSize:"0.85rem",letterSpacing:"0.3em"}}>LOADING...</div></div>
      ) : (
        <div style={{maxWidth:500,margin:"0 auto",padding:"24px 16px"}}>
          <div style={{border:"1px solid #2a2010",borderRadius:4,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#1a1408,#2a2010,#1a1408)",borderBottom:"1px solid #2a2010",padding:"14px",textAlign:"center",position:"relative"}}>
              <div style={{position:"absolute",top:"50%",left:14,transform:"translateY(-50%)",color:"#8a6820",fontSize:"0.7rem"}}>◆</div>
              <div style={{position:"absolute",top:"50%",right:14,transform:"translateY(-50%)",color:"#8a6820",fontSize:"0.7rem"}}>◆</div>
              <div className="cin gold-grad" style={{fontSize:"1.1rem",fontWeight:700,letterSpacing:"0.2em"}}>{MONTHS[selMonth-1].toUpperCase()} {selYear}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",background:"#0d0b06",borderBottom:"1px solid #2a2010"}}>
              <div className="cin" style={{color:"#c0392b",padding:"10px",textAlign:"center",fontSize:"0.65rem",letterSpacing:"0.2em",borderRight:"1px solid #2a2010"}}>DATE</div>
              <div className="cin" style={{color:"#c9a84c",padding:"10px",textAlign:"center",fontSize:"0.65rem",letterSpacing:"0.2em"}}>DUBAI KING</div>
            </div>
            {Array.from({length: new Date(selYear, selMonth, 0).getDate()}, (_, i) => i+1).map(day => (
              <div key={day} style={{display:"grid",gridTemplateColumns:"1fr 1fr",background:day%2===0?"#0a0a0a":"#070707",borderBottom:"1px solid #111008"}}>
                <div className="cin" style={{color:"#c0392b",padding:"10px",textAlign:"center",fontSize:"0.85rem",fontWeight:700,borderRight:"1px solid #111008"}}>{String(day).padStart(2,"0")}</div>
                <div className="cin" style={{color:selected?.days[day] && selected.days[day]!=="XX"?"#c9a84c":"#2a2a2a",padding:"10px",textAlign:"center",fontSize:"0.95rem",fontWeight:700}}>{selected?.days[day] || "XX"}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:16}}>
            <button disabled={isOldest} onClick={prevMonth} className="cin" style={{flex:1,background:isOldest?"#0a0a0a":"linear-gradient(135deg,#1a1408,#2a2010)",color:isOldest?"#2a2a2a":"#c9a84c",border:"1px solid",borderColor:isOldest?"#1a1a1a":"#2a2010",padding:"12px",fontSize:"0.65rem",cursor:isOldest?"not-allowed":"pointer",borderRadius:2}}>
              ◀ {selMonth===1?`DEC ${selYear-1}`:`${MONTHS[selMonth-2].substring(0,3).toUpperCase()} ${selYear}`}
            </button>
            <button disabled={isLatest} onClick={nextMonth} className="cin" style={{flex:1,background:isLatest?"#0a0a0a":"linear-gradient(135deg,#1a1408,#2a2010)",color:isLatest?"#2a2a2a":"#c9a84c",border:"1px solid",borderColor:isLatest?"#1a1a1a":"#2a2010",padding:"12px",fontSize:"0.65rem",cursor:isLatest?"not-allowed":"pointer",borderRadius:2}}>
              {selMonth===12?`JAN ${selYear+1}`:`${MONTHS[selMonth].substring(0,3).toUpperCase()} ${selYear}`} ▶
            </button>
          </div>
          <div style={{marginTop:16,background:"linear-gradient(135deg,#0d0b06,#111008)",border:"1px solid #2a2010",borderRadius:4,padding:"16px",textAlign:"center"}}>
            <div className="cin" style={{color:"#8a6820",fontSize:"0.6rem",letterSpacing:"0.3em",marginBottom:12}}>◆ SELECT MONTH & YEAR ◆</div>
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>{MONTHS.map((m,i) => <option key={i} value={i+1}>{m.toUpperCase()}</option>)}</select>
              <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
            </div>
          </div>
        </div>
      )}

      {/* ── AASHAPURA ── */}
      <div style={{background:"linear-gradient(180deg,#06090d,#070707)",padding:"50px 16px 40px",textAlign:"center",borderTop:"2px solid #1a2a3a",borderBottom:"1px solid #1a2a3a",marginTop:40}}>
        <div className="cin" style={{color:"#4a7a9b",fontSize:"0.65rem",letterSpacing:"0.5em",marginBottom:12}}>◆ ◆ ◆</div>
        <div className="cin" style={{fontSize:"clamp(1.6rem,5vw,3rem)",fontWeight:900,letterSpacing:"0.1em",lineHeight:1.2,background:"linear-gradient(180deg,#a8d8f0,#4a9fd4,#2a6a94)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",filter:"drop-shadow(0 0 20px rgba(74,159,212,0.3))"}}>AASHAPURA</div>
        <div className="cin" style={{fontSize:"clamp(0.8rem,2vw,1.2rem)",fontWeight:400,letterSpacing:"0.2em",marginTop:4,color:"#4a7a9b"}}>RESULT & CHART 2026</div>
        <div style={{width:200,height:1,background:"linear-gradient(90deg,transparent,#4a9fd4,transparent)",margin:"16px auto"}} />
        <div className="cor" style={{color:"#4a7a9b",fontSize:"0.85rem",letterSpacing:"0.2em",fontStyle:"italic"}}>Premium Result Platform</div>
      </div>

      {/* Aashapura Result Card */}
      <div style={{maxWidth:500,margin:"40px auto",padding:"0 16px"}}>
        <div style={{background:"linear-gradient(145deg,#060810,#0a0d12)",border:"1px solid #1a2a3a",borderRadius:4,padding:"30px 16px",textAlign:"center",position:"relative",boxShadow:"0 0 60px rgba(74,159,212,0.06)"}}>
          <div style={{position:"absolute",top:8,left:10,color:"#2a4a6a",fontSize:"0.7rem"}}>◆</div>
          <div style={{position:"absolute",top:8,right:10,color:"#2a4a6a",fontSize:"0.7rem"}}>◆</div>
          <div className="cin" style={{color:"#2a4a6a",fontSize:"0.6rem",letterSpacing:"0.3em",marginBottom:4}}>{todayDay} {todayMonth}</div>
          <div className="cin" style={{color:"#4a9fd4",fontSize:"1rem",fontWeight:900,letterSpacing:"0.2em",marginBottom:2}}>AASHAPURA</div>
          <div className="cin" style={{color:"#2a4a6a",fontSize:"0.55rem",letterSpacing:"0.2em",marginBottom:10}}>OPEN: 07:15 AM &nbsp;◆&nbsp; CLOSE: 08:15 AM</div>
          <div style={{width:60,height:1,background:"linear-gradient(90deg,transparent,#4a9fd4,transparent)",margin:"0 auto 16px"}} />
          <div className="cin" style={{fontSize:"clamp(1.4rem,5vw,2.2rem)",fontWeight:900,letterSpacing:"0.15em",color:"#4a9fd4",filter:"drop-shadow(0 0 10px rgba(74,159,212,0.4))"}}>
            {aResult}
          </div>
          <div style={{width:60,height:1,background:"linear-gradient(90deg,transparent,#4a9fd4,transparent)",margin:"16px auto 0"}} />
        </div>
      </div>

      <div style={{maxWidth:500,margin:"0 auto 32px",padding:"0 16px"}}>
        <div className="cor" style={{border:"1px solid #1a2a3a",padding:"14px 20px",textAlign:"center",fontSize:"0.9rem",color:"#2a4a6a",fontStyle:"italic",background:"#0a0a0a"}}>
          ❝ Aashapura result roz subah update hota hai ❞
        </div>
      </div>

      {/* Aashapura Chart */}
      <div style={{background:"linear-gradient(180deg,#06090d,#070707)",borderTop:"1px solid #1a2a3a",borderBottom:"1px solid #1a2a3a",padding:"16px",textAlign:"center"}}>
        <div className="cin" style={{fontSize:"1rem",fontWeight:700,letterSpacing:"0.3em",background:"linear-gradient(180deg,#a8d8f0,#4a9fd4,#2a6a94)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AASHAPURA MONTHLY CHART</div>
        <div className="cin" style={{color:"#2a4a6a",fontSize:"0.55rem",letterSpacing:"0.5em",marginTop:4}}>2016 — 2026</div>
      </div>

      <div style={{maxWidth:500,margin:"0 auto",padding:"24px 16px"}}>
        <div style={{border:"1px solid #1a2a3a",borderRadius:4,overflow:"hidden"}}>
          <div style={{background:"linear-gradient(135deg,#060810,#0a0d16,#060810)",borderBottom:"1px solid #1a2a3a",padding:"14px",textAlign:"center",position:"relative"}}>
            <div style={{position:"absolute",top:"50%",left:14,transform:"translateY(-50%)",color:"#2a4a6a",fontSize:"0.7rem"}}>◆</div>
            <div style={{position:"absolute",top:"50%",right:14,transform:"translateY(-50%)",color:"#2a4a6a",fontSize:"0.7rem"}}>◆</div>
            <div className="cin" style={{fontSize:"1.1rem",fontWeight:700,letterSpacing:"0.2em",background:"linear-gradient(180deg,#a8d8f0,#4a9fd4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{MONTHS[aSelMonth-1].toUpperCase()} {aSelYear}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",background:"#0a0d12",borderBottom:"1px solid #1a2a3a"}}>
            <div className="cin" style={{color:"#c0392b",padding:"10px",textAlign:"center",fontSize:"0.65rem",letterSpacing:"0.2em",borderRight:"1px solid #1a2a3a"}}>DATE</div>
            <div className="cin" style={{color:"#4a9fd4",padding:"10px",textAlign:"center",fontSize:"0.65rem",letterSpacing:"0.2em"}}>AASHAPURA</div>
          </div>
          {Array.from({length: new Date(aSelYear, aSelMonth, 0).getDate()}, (_, i) => i+1).map(day => (
            <div key={day} style={{display:"grid",gridTemplateColumns:"1fr 2fr",background:day%2===0?"#0a0a0a":"#070707",borderBottom:"1px solid #0d1015"}}>
              <div className="cin" style={{color:"#c0392b",padding:"10px",textAlign:"center",fontSize:"0.85rem",fontWeight:700,borderRight:"1px solid #0d1015"}}>{String(day).padStart(2,"0")}</div>
              <div className="cin" style={{color:aSelected?.days[day] && aSelected.days[day]!=="XXX-XX-XXX"?"#4a9fd4":"#1a2a3a",padding:"10px",textAlign:"center",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.05em"}}>{aSelected?.days[day] || "XXX-XX-XXX"}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:16}}>
          <button disabled={aIsOldest} onClick={aPrevMonth} className="cin" style={{flex:1,background:aIsOldest?"#0a0a0a":"linear-gradient(135deg,#060810,#0a0d16)",color:aIsOldest?"#1a2a3a":"#4a9fd4",border:"1px solid",borderColor:aIsOldest?"#0d0d0d":"#1a2a3a",padding:"12px",fontSize:"0.65rem",cursor:aIsOldest?"not-allowed":"pointer",borderRadius:2}}>
            ◀ {aSelMonth===1?`DEC ${aSelYear-1}`:`${MONTHS[aSelMonth-2].substring(0,3).toUpperCase()} ${aSelYear}`}
          </button>
          <button disabled={aIsLatest} onClick={aNextMonth} className="cin" style={{flex:1,background:aIsLatest?"#0a0a0a":"linear-gradient(135deg,#060810,#0a0d16)",color:aIsLatest?"#1a2a3a":"#4a9fd4",border:"1px solid",borderColor:aIsLatest?"#0d0d0d":"#1a2a3a",padding:"12px",fontSize:"0.65rem",cursor:aIsLatest?"not-allowed":"pointer",borderRadius:2}}>
            {aSelMonth===12?`JAN ${aSelYear+1}`:`${MONTHS[aSelMonth].substring(0,3).toUpperCase()} ${aSelYear}`} ▶
          </button>
        </div>

        <div style={{marginTop:16,background:"linear-gradient(135deg,#060810,#0a0d12)",border:"1px solid #1a2a3a",borderRadius:4,padding:"16px",textAlign:"center"}}>
          <div className="cin" style={{color:"#2a4a6a",fontSize:"0.6rem",letterSpacing:"0.3em",marginBottom:12}}>◆ SELECT MONTH & YEAR ◆</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <select value={aSelMonth} onChange={e => setASelMonth(Number(e.target.value))} style={{background:"#0a0d12",color:"#4a9fd4",borderColor:"#1a2a3a"}}>{MONTHS.map((m,i) => <option key={i} value={i+1}>{m.toUpperCase()}</option>)}</select>
            <select value={aSelYear} onChange={e => setASelYear(Number(e.target.value))} style={{background:"#0a0d12",color:"#4a9fd4",borderColor:"#1a2a3a"}}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>
      </div>

      <div style={{background:"linear-gradient(90deg,#8a6820,#f5e070,#c9a84c,#f5e070,#8a6820)",height:3,marginTop:40}} />
      <footer style={{textAlign:"center",padding:"20px",background:"#0a0a0a"}}>
        <div className="cin" style={{color:"#2a2010",fontSize:"0.6rem",letterSpacing:"0.3em"}}>© 2026 DUBAI KING & AASHAPURA — ALL RIGHTS RESERVED</div>
      </footer>
    </div>
  );
}
