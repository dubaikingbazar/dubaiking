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
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function isResultTime() {
  const ist = getISTTime();
  const h = ist.getHours();
  const m = ist.getMinutes();
  return (h > 19) || (h === 19 && m >= 30);
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; font-fam
