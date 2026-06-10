import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getISTTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

export default function App() {
  const [result1, setResult1] = useState("--");
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(getISTTime());
  const [selMonth, setSelMonth] = useState(getISTTime().getMonth() + 1);
  const [selYear, setSelYear] = useState(getISTTime().getFullYear());
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
      if (rData) setResult1(rData.result1);
      await loadChart();
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function loadChart() {
    const { data } = await supabase.from("chart").select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .order("day", { ascending: true });
    if (!data) return;
    const grouped = {};
    data.forEach(row => {
      const key = `${row.year}-${row.month}`;
      if (!grouped[key]) grouped[key] = { year: row.year, month: row.month, days: {} };
      grouped[key].days[row.day] = row.result1;
    });
    setChartData(grouped);
  }

  useEffect(() => {
    const channel = supabase.channel("results-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, (payload) => {
        if (payload.new && payload.new.result1 !== undefined) setResult1(payload.new.result1);
      }).subscribe();
    const r = setInterval(async () => {
      try {
        const { data } = await supabase.from("results").select("*").eq("id", 1).single();
        if (data) setResult1(data.result1);
      } catch(e) {}
    }, 3000);
    const t = setInterval(() => setNow(getISTTime()), 1000);
    return () => { supabase.removeChannel(channel); clearInterval(r); clearInterval(t); };
  }, []);

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  const selected = chartData[`${selYear}-${selMonth}`];

  function prevMonth() {
    if (selMonth === 1) { if (selYear > 2016) { setSelMonth(12); setSelYear(y => y-1); } }
    else setSelMonth(m => m-1);
  }

  function nextMonth() {
    const ist = getISTTime();
    if (selYear === ist.getFullYear() && selMonth === ist.getMonth()+1) return;
    if (selMonth === 12) { setSelMonth(1); setSelYear(y => y+1); }
    else setSelMonth(m => m+1);
  }

  const ist = getISTTime();
  const isLatest = selYear === ist.getFullYear() && selMonth === ist.getMonth()+1;
  const isOldest = selYear === 2016 && selMonth === 1;

  // Years and months for dropdowns
  const years = [];
  for (let y = 2026; y >= 2016; y--) years.push(y);

  return (
    <div style={{background:"#080808",minHeight:"100vh",color:"#e8dfc0",fontFamily:"'Libre Baskerville',serif"}}>
      <style>{`
        .pf{font-family:'Playfair Display',serif}
        .im{font-family:'IM Fell English',serif;font-style:italic}
        .gold-grad{background:linear-gradient(180deg,#f0d080 0%,#c9a84c 50%,#8a6820 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .gold-line{width:80px;height:1px;margin:0 auto;background:linear-gradient(90deg,transparent,#c9a84c,transparent)}
        .btn-gold{background:linear-gradient(135deg,#f0d080,#c9a84c,#8a6820);color:#000;border:none;padding:10px 22px;font-family:'Playfair Display',serif;font-weight:700;font-size:0.8rem;letter-spacing:0.1em;cursor:pointer;border-radius:2px}
        .btn-nav{background:#1a1408;color:#c9a84c;border:1px solid #8a6820;padding:10px 20px;font-family:'Playfair Display',serif;font-weight:700;font-size:0.8rem;cursor:pointer;border-radius:2px;transition:all 0.2s}
        .btn-nav:hover{background:#2a2010;border-color:#c9a84c}
        .btn-nav:disabled{opacity:0.3;cursor:not-allowed}
        select{background:#111;color:#c9a84c;border:1px solid #8a6820;padding:8px 12px;font-family:'Playfair Display',serif;font-size:0.8rem;border-radius:2px;outline:none;cursor:pointer}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#111}
        ::-webkit-scrollbar-thumb{background:#8a6820;border-radius:3px}
        table{border-collapse:collapse;width:100%}
        th,td{padding:10px 14px;text-align:center;border:1px solid #1a1a10}
      `}</style>

      <nav style={{background:"#0d0d0d",borderBottom:"1px solid #8a6820",display:"flex",gap:8,padding:"14px 16px",flexWrap:"wrap"}}>
        {["HOME","CHART","CONTACT"].map(l => (
          <a key={l} href="#" className="pf" style={{background:"linear-gradient(135deg,#f0d080,#c9a84c,#8a6820)",color:"#000",padding:"9px 18px",borderRadius:2,textDecoration:"none",fontWeight:700,fontSize:"0.72rem",letterSpacing:"0.18em"}}>{l}</a>
        ))}
      </nav>

      <div style={{background:"linear-gradient(160deg,#1a1408,#0d0d0d 40%,#1a1408)",borderBottom:"2px solid #8a6820",padding:"36px 16px 28px",textAlign:"center"}}>
        <div className="pf gold-grad" style={{fontSize:"clamp(1.4rem,5.5vw,2.6rem)",fontWeight:900,letterSpacing:"0.08em",lineHeight:1.25}}>
          Dubai King Result & Chart 2026
        </div>
        <div className="pf" style={{color:"#6a6040",fontSize:"0.7rem",letterSpacing:"0.3em",marginTop:8}}>Premium Result Platform</div>
      </div>

      <div className="pf" style={{textAlign:"center",padding:"14px",fontSize:"0.95rem",color:"#c9a84c",borderBottom:"1px solid #1e1c14",background:"#0d0d0d"}}>
        {dateStr} | {timeStr} (IST)
      </div>

      {/* Result */}
      <div style={{textAlign:"center",padding:"30px 16px",borderBottom:"1px solid #1e1c14",background:"#0d0d0d"}}>
        <div className="pf" style={{fontSize:"1.8rem",fontWeight:900,letterSpacing:"0.15em",color:"#c0392b"}}>DUBAI KING</div>
        <div className="gold-line" style={{margin:"8px auto"}} />
        <div className="pf gold-grad" style={{fontSize:"6rem",fontWeight:900,lineHeight:1,margin:"8px 0"}}>
          {loading ? "..." : result1}
        </div>
        <div className="gold-line" style={{margin:"8px auto"}} />
      </div>

      <div className="im" style={{margin:16,border:"1px solid #8a6820",borderRadius:4,padding:16,textAlign:"center",fontSize:"0.95rem",color:"#c9a84c",background:"#0d0d0d"}}>
        Har roz ka result 7:30 PM pe update hota hai — Dubai King Official Platform
      </div>

      {/* Chart */}
      <div style={{textAlign:"center",background:"linear-gradient(160deg,#1a1408,#0d0d0d)",borderTop:"1px solid #8a6820",borderBottom:"1px solid #8a6820",padding:14,marginTop:8}}>
        <span className="pf" style={{color:"#c9a84c",fontSize:"0.85rem",letterSpacing:"0.25em"}}>◆ Dubai King Monthly Chart ◆</span>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:40,color:"#c9a84c"}}>
          <div className="pf" style={{fontSize:"1.2rem"}}>Loading...</div>
        </div>
      ) : (
        <div style={{padding:"16px 8px"}}>

          {/* Current Month Chart */}
          <div style={{maxWidth:420,margin:"0 auto 24px"}}>
            <div style={{background:"linear-gradient(135deg,#1e5799,#2989d8,#207cca)",padding:"12px",textAlign:"center",borderRadius:"4px 4px 0 0"}}>
              <span className="pf" style={{color:"#fff",fontWeight:900,fontSize:"1.1rem",letterSpacing:"0.15em"}}>
                {MONTHS[selMonth-1]} {selYear} — Dubai King
              </span>
            </div>
            <table>
              <thead>
                <tr style={{background:"#f5a800"}}>
                  <th className="pf" style={{color:"#c0392b",fontSize:"0.8rem",letterSpacing:"0.1em",fontWeight:900}}>DATE</th>
                  <th className="pf" style={{color:"#000",fontSize:"0.8rem",letterSpacing:"0.1em",fontWeight:900}}>DUBAI KING</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({length: new Date(selYear, selMonth, 0).getDate()}, (_, i) => i+1).map(day => (
                  <tr key={day} style={{background:day%2===0?"#f9f9f9":"#fff"}}>
                    <td className="pf" style={{color:"#c0392b",fontWeight:700,fontSize:"0.95rem"}}>{String(day).padStart(2,"0")}</td>
                    <td className="pf" style={{color: selected?.days[day] && selected.days[day]!=="XX" ? "#000" : "#aaa", fontWeight:700, fontSize:"1rem"}}>
                      {selected?.days[day] || "XX"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Prev / Next Buttons */}
          <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            <button className="btn-nav" disabled={isOldest} onClick={prevMonth}>
              ◀ {selMonth===1 ? `Dec ${selYear-1}` : `${MONTHS[selMonth-2].substring(0,3)} ${selYear}`}
            </button>
            <button className="btn-nav" disabled={isLatest} onClick={nextMonth}>
              {selMonth===12 ? `Jan ${selYear+1}` : `${MONTHS[selMonth].substring(0,3)} ${selYear}`} ▶
            </button>
          </div>

          {/* Dropdown */}
          <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center",flexWrap:"wrap",padding:"16px",background:"#f5a800",borderRadius:4,maxWidth:500,margin:"0 auto"}}>
            <span className="pf" style={{color:"#000",fontSize:"0.8rem",fontWeight:700}}>Month/Year Select:</span>
            <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
              {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-gold">Go</button>
          </div>

        </div>
      )}

      <footer style={{textAlign:"center",padding:20,color:"#6a6040",fontSize:"0.75rem",borderTop:"1px solid #1a1710",fontFamily:"'Playfair Display',serif"}}>
        2026 Dubai King Result — All Rights Reserved
      </footer>
    </div>
  );
}
