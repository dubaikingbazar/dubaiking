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
  const [selectedKey, setSelectedKey] = useState(null);
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
      const key = `${row.year}-${String(row.month).padStart(2,"0")}`;
      if (!grouped[key]) grouped[key] = { year: row.year, month: row.month, days: {} };
      grouped[key].days[row.day] = row.result1;
    });
    setChartData(grouped);
    const ist = getISTTime();
    const currentKey = `${ist.getFullYear()}-${String(ist.getMonth()+1).padStart(2,"0")}`;
    setSelectedKey(currentKey);
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

  const sortedKeys = Object.keys(chartData).sort((a, b) => b.localeCompare(a));
  const selected = selectedKey && chartData[selectedKey];

  return (
    <div style={{background:"#080808",minHeight:"100vh",color:"#e8dfc0",fontFamily:"'Libre Baskerville',serif"}}>
      <style>{`
        .pf{font-family:'Playfair Display',serif}
        .im{font-family:'IM Fell English',serif;font-style:italic}
        .gold-grad{background:linear-gradient(180deg,#f0d080 0%,#c9a84c 50%,#8a6820 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .gold-line{width:80px;height:1px;margin:0 auto;background:linear-gradient(90deg,transparent,#c9a84c,transparent)}
        .btn-gold{background:linear-gradient(135deg,#f0d080,#c9a84c,#8a6820);color:#000;border:none;padding:8px 16px;font-family:'Playfair Display',serif;font-weight:700;font-size:0.75rem;letter-spacing:0.1em;cursor:pointer;border-radius:2px;transition:opacity 0.2s}
        .btn-gold:hover{opacity:0.8}
        .btn-month{background:#111;color:#c9a84c;border:1px solid #8a6820;padding:8px 14px;font-family:'Playfair Display',serif;font-weight:700;font-size:0.72rem;cursor:pointer;border-radius:2px;transition:all 0.2s}
        .btn-month:hover{background:#1a1408;border-color:#c9a84c}
        .btn-month.active{background:linear-gradient(135deg,#f0d080,#c9a84c,#8a6820);color:#000;border-color:#c9a84c}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#111}
        ::-webkit-scrollbar-thumb{background:#8a6820;border-radius:3px}
        table{border-collapse:collapse;width:100%}
        th,td{padding:10px 14px;text-align:center;border:1px solid #1e1e10}
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

      {/* Chart Section */}
      <div style={{textAlign:"center",background:"linear-gradient(160deg,#1a1408,#0d0d0d)",borderTop:"1px solid #8a6820",borderBottom:"1px solid #8a6820",padding:14,marginTop:8}}>
        <span className="pf" style={{color:"#c9a84c",fontSize:"0.85rem",letterSpacing:"0.25em"}}>◆ Dubai King Monthly Chart ◆</span>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:40,color:"#c9a84c"}}>
          <div className="pf" style={{fontSize:"1.2rem"}}>Loading...</div>
        </div>
      ) : (
        <div style={{padding:"16px 8px"}}>
          {/* Month Buttons */}
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20,justifyContent:"center"}}>
            {sortedKeys.map(key => {
              const [y, m] = key.split("-").map(Number);
              return (
                <button key={key} className={`btn-month${selectedKey===key?" active":""}`}
                  onClick={() => setSelectedKey(key)}>
                  {MONTHS[m-1].substring(0,3)} {y}
                </button>
              );
            })}
          </div>

          {/* Selected Month Chart */}
          {selected && (
            <div style={{maxWidth:400,margin:"0 auto"}}>
              <div style={{background:"linear-gradient(135deg,#f0d080,#c9a84c,#8a6820)",padding:"12px",textAlign:"center",borderRadius:"4px 4px 0 0"}}>
                <span className="pf" style={{color:"#000",fontWeight:900,fontSize:"1.1rem",letterSpacing:"0.15em"}}>
                  {MONTHS[selected.month-1]} {selected.year}
                </span>
              </div>
              <table>
                <thead>
                  <tr style={{background:"#1a1408"}}>
                    <th className="pf" style={{color:"#c0392b",fontSize:"0.75rem",letterSpacing:"0.1em"}}>DATE</th>
                    <th className="pf" style={{color:"#c9a84c",fontSize:"0.75rem",letterSpacing:"0.1em"}}>DUBAI KING</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length: new Date(selected.year, selected.month, 0).getDate()}, (_, i) => i+1).map(day => (
                    <tr key={day} style={{background:day%2===0?"#0d0d0d":"#080808"}}>
                      <td className="pf" style={{color:"#c0392b",fontWeight:700}}>{String(day).padStart(2,"0")}</td>
                      <td className="pf" style={{color: selected.days[day] && selected.days[day]!=="XX" ? "#c9a84c" : "#444", fontWeight:700, fontSize:"1.1rem"}}>
                        {selected.days[day] || "XX"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <footer style={{textAlign:"center",padding:20,color:"#6a6040",fontSize:"0.75rem",borderTop:"1px solid #1a1710",fontFamily:"'Playfair Display',serif"}}>
        2026 Dubai King Result — All Rights Reserved
      </footer>
    </div>
  );
}
