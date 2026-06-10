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

function getISTTime() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist;
}

function isResultTime() {
  const ist = getISTTime();
  const h = ist.getHours();
  const m = ist.getMinutes();
  return (h > 19) || (h === 19 && m >= 30);
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
  .pulse { animation: pulse 1.4s infinite; }
  @keyframes pulse {
    0%,100%{ opacity:1; } 50%{ opacity:0.4; }
  }
`;

export default function App() {
  const [result1, setResult1] = useState("--");
  const [chart, setChart] = useState([]);
  const [chartPage, setChartPage] = useState(1);
  const [now, setNow] = useState(new Date());
  const [showResu
