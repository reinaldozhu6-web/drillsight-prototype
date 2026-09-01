"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Database, Download, FileUp, Info, RotateCcw, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DrillSample = { holeId: string; depthM: number; goldGpt: number; copperPct: number; latitude: number; longitude: number };
type RankedSample = DrillSample & { score: number; reasons: string[]; status: "High priority" | "Review" | "Baseline" };

const SAMPLE_DATA: DrillSample[] = [
  { holeId: "DH-001", depthM: 42, goldGpt: 0.34, copperPct: 0.11, latitude: 49.2827, longitude: -123.1207 },
  { holeId: "DH-001", depthM: 68, goldGpt: 1.82, copperPct: 0.38, latitude: 49.2828, longitude: -123.1206 },
  { holeId: "DH-002", depthM: 31, goldGpt: 0.21, copperPct: 0.08, latitude: 49.2841, longitude: -123.1182 },
  { holeId: "DH-002", depthM: 77, goldGpt: 3.46, copperPct: 0.72, latitude: 49.2842, longitude: -123.1181 },
  { holeId: "DH-003", depthM: 55, goldGpt: 0.68, copperPct: 0.19, latitude: 49.2808, longitude: -123.1165 },
  { holeId: "DH-003", depthM: 94, goldGpt: 2.74, copperPct: 0.51, latitude: 49.2809, longitude: -123.1164 },
  { holeId: "DH-004", depthM: 48, goldGpt: 0.16, copperPct: 0.05, latitude: 49.2863, longitude: -123.1224 },
  { holeId: "DH-004", depthM: 106, goldGpt: 4.12, copperPct: 0.93, latitude: 49.2864, longitude: -123.1223 },
  { holeId: "DH-005", depthM: 63, goldGpt: 1.11, copperPct: 0.29, latitude: 49.2797, longitude: -123.1241 },
  { holeId: "DH-005", depthM: 121, goldGpt: 0.42, copperPct: 0.14, latitude: 49.2798, longitude: -123.124 },
];
const requiredHeaders = ["hole_id", "depth_m", "gold_gpt", "copper_pct", "latitude", "longitude"];

function mean(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1); }
function standardDeviation(values: number[]) { const average = mean(values); return Math.sqrt(mean(values.map((value) => (value - average) ** 2))); }

function rankSamples(samples: DrillSample[]): RankedSample[] {
  const goldValues = samples.map((sample) => sample.goldGpt);
  const copperValues = samples.map((sample) => sample.copperPct);
  const goldMean = mean(goldValues), copperMean = mean(copperValues);
  const goldSd = standardDeviation(goldValues) || 1, copperSd = standardDeviation(copperValues) || 1;
  return samples.map((sample) => {
    const goldZ = (sample.goldGpt - goldMean) / goldSd;
    const copperZ = (sample.copperPct - copperMean) / copperSd;
    const score = Math.max(0, Math.min(100, Math.round(50 + goldZ * 18 + copperZ * 14)));
    const reasons: string[] = [];
    if (goldZ >= 1) reasons.push("Elevated gold");
    if (copperZ >= 1) reasons.push("Elevated copper");
    if (sample.depthM >= 100) reasons.push("Deep interval");
    const status = score >= 78 ? "High priority" : score >= 58 ? "Review" : "Baseline";
    return { ...sample, score, reasons, status } as RankedSample;
  }).sort((a, b) => b.score - a.score);
}

function parseCsv(csv: string): DrillSample[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("The CSV must include a header and at least one data row.");
  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`);
  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((value) => value.trim());
    const value = (name: string) => values[headers.indexOf(name)];
    const numeric = (name: string) => { const parsed = Number(value(name)); if (!Number.isFinite(parsed)) throw new Error(`Invalid ${name} value on row ${index + 2}.`); return parsed; };
    const holeId = value("hole_id");
    if (!holeId) throw new Error(`Missing hole_id on row ${index + 2}.`);
    return { holeId, depthM: numeric("depth_m"), goldGpt: numeric("gold_gpt"), copperPct: numeric("copper_pct"), latitude: numeric("latitude"), longitude: numeric("longitude") };
  });
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Database }) {
  return <article className="metric-card"><div className="metric-icon"><Icon size={17} aria-hidden="true" /></div><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></article>;
}

export default function Home() {
  const [samples, setSamples] = useState<DrillSample[]>(SAMPLE_DATA);
  const [sourceName, setSourceName] = useState("Synthetic demo dataset");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ranked = useMemo(() => rankSamples(samples), [samples]);
  const metrics = useMemo(() => ({
    uniqueHoles: new Set(samples.map((sample) => sample.holeId)).size,
    highPriority: ranked.filter((sample) => sample.status === "High priority").length,
    maxGold: Math.max(...samples.map((sample) => sample.goldGpt)),
    avgCopper: mean(samples.map((sample) => sample.copperPct)),
  }), [ranked, samples]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Please select a CSV file."); return; }
    try { setSamples(parseCsv(await file.text())); setSourceName(file.name); setError(""); }
    catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Could not read this file."); }
    finally { event.target.value = ""; }
  }
  function resetDemo() { setSamples(SAMPLE_DATA); setSourceName("Synthetic demo dataset"); setError(""); }

  return <main>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="DrillSight home"><span className="brand-mark">DS</span><span>DrillSight <small>prototype</small></span></a>
      <div className="topbar-meta"><span className="status-dot"><i /> Interactive demo</span><a href="#about">Project notes <ArrowUpRight size={14} /></a></div>
    </header>
    <div className="page-shell" id="top">
      <section className="intro">
        <div><p className="eyebrow">Exploration sample triage</p><h1>Turn drill data into a prioritized review queue.</h1><p className="lede">Upload a structured CSV to surface mineralized intervals, compare assays, and flag anomalous samples with a transparent scoring model.</p></div>
        <div className="upload-panel">
          <input ref={inputRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={handleUpload} aria-label="Upload drill sample CSV" />
          <button className="primary-button" onClick={() => inputRef.current?.click()}><FileUp size={17} /> Upload CSV</button>
          <a className="secondary-button" href="/sample-drill-data.csv" download><Download size={16} /> Sample format</a>
          <button className="icon-button" onClick={resetDemo} aria-label="Reset demo data" title="Reset demo data"><RotateCcw size={17} /></button>
        </div>
      </section>
      {error && <div className="error-banner" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
      <section className="source-row" aria-label="Dataset status"><div><Database size={16} /><span>Source</span><strong>{sourceName}</strong></div><p>{samples.length} valid records · analyzed in your browser</p></section>
      <section className="metric-grid" aria-label="Dataset summary">
        <MetricCard label="Drill holes" value={String(metrics.uniqueHoles)} detail={`${samples.length} total intervals`} icon={Database} />
        <MetricCard label="High priority" value={String(metrics.highPriority)} detail="Score of 78 or higher" icon={Sparkles} />
        <MetricCard label="Peak gold" value={`${metrics.maxGold.toFixed(2)} g/t`} detail="Highest uploaded assay" icon={ArrowUpRight} />
        <MetricCard label="Average copper" value={`${metrics.avgCopper.toFixed(2)}%`} detail="Across all intervals" icon={CheckCircle2} />
      </section>
      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading"><div><p className="eyebrow">Comparative assay view</p><h2>Gold grade by interval</h2></div><span className="legend"><i /> Gold g/t</span></div>
          <div className="chart-wrap" aria-label="Bar chart of gold grade by interval"><ResponsiveContainer width="100%" height="100%"><BarChart data={ranked} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,.08)" /><XAxis dataKey="holeId" tick={{ fill: "#9da8a4", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#9da8a4", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "rgba(255,255,255,.04)" }} contentStyle={{ background: "#121816", border: "1px solid #2b3632", borderRadius: 8, color: "#f1f5f3" }} formatter={(value) => [`${Number(value).toFixed(2)} g/t`, "Gold"]} /><Bar dataKey="goldGpt" radius={[4, 4, 0, 0]}>{ranked.map((sample) => <Cell key={`${sample.holeId}-${sample.depthM}`} fill={sample.status === "High priority" ? "#d9864c" : sample.status === "Review" ? "#5eb9aa" : "#45524d"} />)}</Bar></BarChart></ResponsiveContainer></div>
        </article>
        <article className="panel priority-panel">
          <div className="panel-heading"><div><p className="eyebrow">Model output</p><h2>Priority queue</h2></div><span>{ranked.length} ranked</span></div>
          <div className="priority-list">{ranked.slice(0, 4).map((sample, index) => <div className="priority-item" key={`${sample.holeId}-${sample.depthM}`}><span className="rank">{String(index + 1).padStart(2, "0")}</span><div><strong>{sample.holeId} · {sample.depthM} m</strong><p>{sample.reasons.join(" · ") || "Within baseline range"}</p></div><b>{sample.score}</b></div>)}</div>
        </article>
      </section>
      <section className="panel table-panel">
        <div className="panel-heading"><div><p className="eyebrow">Review workspace</p><h2>Ranked sample intervals</h2></div><span>Sorted by priority score</span></div>
        <div className="table-scroll"><table><thead><tr><th>Hole</th><th>Depth</th><th>Gold</th><th>Copper</th><th>Coordinates</th><th>Signal</th><th>Score</th></tr></thead><tbody>{ranked.map((sample) => <tr key={`${sample.holeId}-${sample.depthM}`}><td><strong>{sample.holeId}</strong></td><td>{sample.depthM} m</td><td>{sample.goldGpt.toFixed(2)} g/t</td><td>{sample.copperPct.toFixed(2)}%</td><td className="coordinates">{sample.latitude.toFixed(4)}, {sample.longitude.toFixed(4)}</td><td><span className={`badge ${sample.status === "High priority" ? "high" : sample.status === "Review" ? "review" : "base"}`}>{sample.status}</span></td><td><span className="score">{sample.score}</span></td></tr>)}</tbody></table></div>
      </section>
      <section className="about-panel" id="about">
        <div><p className="eyebrow">Independent portfolio project</p><h2>Built to turn an ambiguous workflow into working software.</h2></div>
        <div className="about-copy"><p>DrillSight is a client-side prototype by <strong>Reinaldo Pang</strong>. It validates CSV input, calculates normalized assay signals, and ranks intervals without sending data to a server.</p><p>The scoring model is deterministic and intentionally explainable—not a geological prediction. The included dataset is synthetic and for demonstration only.</p><div className="tech-list"><span>Next.js</span><span>TypeScript</span><span>React</span><span>Recharts</span><span>AI-assisted development</span></div></div>
      </section>
      <footer><span>DrillSight · Product prototyping demo</span><span><Info size={14} /> Synthetic data · Not for operational decisions</span></footer>
    </div>
  </main>;
}
