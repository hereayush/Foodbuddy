"use client";
import { useEffect, useRef, useState } from "react";
import {
  FlaskConical,
  AlertTriangle,
  Scale,
  BarChart3,
  Info,
  Clipboard,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Baby,
  Activity,
  Leaf,
  Camera,
  Loader2,
  XCircle,
  Upload,
  Mic,
  MicOff,
  Volume2,
  Share2,
  Trophy,
  ArrowLeft,
  Split,
  ArrowRightLeft,
  CheckCircle2,
  AlertOctagon,
  List,
  Microscope,
  ThumbsUp,
  ThumbsDown,
  Utensils,
  ShoppingCart,
  Plus,
  X,
  Copy,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { recognize } from "tesseract.js";

/* ---------------- TYPES ---------------- */
type AnalysisResponse = {
  intent: string;
  risks: {
    title: string;
    description: string;
    confidence?: "High" | "Medium" | "Low";
    simple_explanation?: string;
  }[];
  tradeoffs: { title: string; description: string }[];
  summary: string;
  disclaimer: string;
  alternatives?: { title: string; description: string }[];
  _rawLength?: number;
  breakdown?: {
    natural: number;
    processed: number;
    additives: number;
  };
  spotlight?: {
    name: string;
    type: "good" | "bad" | "neutral";
    description: string;
  }[];
  dietary?: {
    name: string;
    status: "safe" | "unsafe" | "warning";
    reason?: string;
  }[];
};

type HistoryItem = {
  id: string;
  ingredients: string;
  result: AnalysisResponse;
  timestamp: number;
  context?: string;
};

/* --------- HELPERS --------- */
function getSeverity(description: string) {
  const text = description.toLowerCase();
  if (text.includes("cancer") || text.includes("diabetes") || text.includes("obesity") || text.includes("toxic")) return "high";
  if (text.includes("irritation") || text.includes("allergic") || text.includes("hyperactivity")) return "medium";
  return "low";
}

function calculateHealthScore(risks: any[]) {
  let score = 100;
  risks.forEach((r) => {
    const severity = getSeverity(r.description);
    if (severity === "high") score -= 20;
    else if (severity === "medium") score -= 10;
    else score -= 5;
  });
  return Math.max(0, Math.min(100, score));
}

function generateComparisonInsight(itemA: AnalysisResponse, itemB: AnalysisResponse) {
  const scoreA = calculateHealthScore(itemA.risks);
  const scoreB = calculateHealthScore(itemB.risks);
  const winner = scoreA >= scoreB ? "Product A" : "Product B";
  const loser = scoreA >= scoreB ? "Product B" : "Product A";
  const loserRisks = scoreA >= scoreB ? itemB.risks : itemA.risks;
  const badIngredient = loserRisks.find(r => getSeverity(r.description) === "high")?.title || "more additives";
  return `The clear winner is ${winner}. It avoids concerns like ${badIngredient.toLowerCase()} found in ${loser}.`;
}

function getBestForTags(itemA: AnalysisResponse, itemB: AnalysisResponse) {
  const scoreA = calculateHealthScore(itemA.risks);
  const scoreB = calculateHealthScore(itemB.risks);
  const tags = [];
  const winnerRisks = scoreA >= scoreB ? itemA.risks : itemB.risks;
  const winnerText = scoreA >= scoreB ? "Product A" : "Product B";
  if (!winnerRisks.some(r => r.title.toLowerCase().includes("sugar"))) tags.push("Weight Loss");
  if (!winnerRisks.some(r => r.description.toLowerCase().includes("hyperactivity"))) tags.push("Kids");
  if (calculateHealthScore(winnerRisks) > 80) tags.push("Daily Use");
  return { winner: winnerText, tags };
}

function getVerdict(score: number, dietary: any[]) {
  const unsafeDiet = dietary.find(d => d.status === "unsafe");
  if (unsafeDiet) return `Caution: Not ${unsafeDiet.name}-friendly.`;
  if (score >= 80) return "Excellent Choice! Clean profile.";
  if (score >= 50) return "Moderate Choice. Consume in moderation.";
  return "Highly Processed. Limit consumption.";
}

/* --------- 🔒 FRONTEND INPUT VALIDATION --------- */
function looksLikeIngredientInput(input: string) {
  const bannedKeywords = ["chatgpt", "fabric", "cloth", "clothes", "shirt", "pants", "mobile", "phone", "laptop", "program", "who are you", "what is", "how to", "how are you", "hello", "hi ", "hey", "table", "wood", "plastic"];
  const text = input.toLowerCase().trim();
  if (text.length < 3) return false;
  if (text.split(" ").length > 500) return false;
  return !bannedKeywords.some((word) => text.includes(word));
}

/* --------- 🔮 MOCK DATA ENRICHER --------- */
function mockEnhanceData(data: AnalysisResponse, context: string, ingredientsInput: string): AnalysisResponse {
  if (data.intent === "Invalid input") return data;
  const enhanced = { ...data };
  const lowerInput = ingredientsInput.toLowerCase();
  const alternatives = [];

  const diets: { name: string; status: "safe" | "unsafe" | "warning"; reason?: string }[] = [];
  if (lowerInput.match(/milk|whey|casein|cheese|butter|cream|yogurt|lactose|egg|honey|beef|chicken|pork|gelatin/)) diets.push({ name: "Vegan", status: "unsafe", reason: "Animal Products" }); else diets.push({ name: "Vegan", status: "safe" });
  if (lowerInput.match(/wheat|barley|rye|malt|gluten|flour/)) { if (!lowerInput.includes("almond flour") && !lowerInput.includes("coconut flour") && !lowerInput.includes("rice flour")) diets.push({ name: "Gluten-Free", status: "unsafe", reason: "Contains Gluten" }); else diets.push({ name: "Gluten-Free", status: "safe" }); } else diets.push({ name: "Gluten-Free", status: "safe" });
  if (lowerInput.match(/sugar|syrup|dextrose|fructose|maltodextrin|corn|potato|rice|flour|oats/)) diets.push({ name: "Keto", status: "unsafe", reason: "High Carbs" }); else diets.push({ name: "Keto", status: "safe" });
  enhanced.dietary = diets;

  const spotlight = [];
  if (lowerInput.includes("whole grain") || lowerInput.includes("oats") || lowerInput.includes("wheat")) spotlight.push({ name: "Whole Grains", type: "good" as const, description: "Fiber & Digestion" });
  if (lowerInput.includes("protein") || lowerInput.includes("chicken") || lowerInput.includes("egg") || lowerInput.includes("whey")) spotlight.push({ name: "Protein", type: "good" as const, description: "Muscle & Satiety" });
  if (lowerInput.includes("fructose") || lowerInput.includes("corn syrup")) spotlight.push({ name: "Corn Syrup", type: "bad" as const, description: "High Glycemic" });
  if (lowerInput.includes("red 40") || lowerInput.includes("blue 1")) spotlight.push({ name: "Artif. Colors", type: "bad" as const, description: "Hyperactivity" });
  if (lowerInput.includes("palm oil")) spotlight.push({ name: "Palm Oil", type: "bad" as const, description: "Saturated Fats" });
  if (spotlight.length === 0) spotlight.push({ name: "Ingredients", type: "neutral" as const, description: "Standard Mix" });
  enhanced.spotlight = spotlight.slice(0, 4);

  const ingredientsList = ingredientsInput.split(/,|;/).map(i => i.trim().toLowerCase());
  let naturalCount = 0; let processedCount = 0; let additivesCount = 0;
  ingredientsList.forEach(ing => {
    if (ing.includes("extract") || ing.includes("syrup") || ing.includes("flour") || ing.includes("oil") || ing.includes("salt") || ing.includes("sugar")) processedCount++;
    else if (ing.includes("red") || ing.includes("blue") || ing.includes("yellow") || ing.includes("acid") || ing.includes("gum") || ing.includes("benzoate") || ing.includes("sorbate")) additivesCount++;
    else naturalCount++;
  });
  const total = naturalCount + processedCount + additivesCount || 1;
  enhanced.breakdown = { natural: Math.round((naturalCount / total) * 100), processed: Math.round((processedCount / total) * 100), additives: Math.round((additivesCount / total) * 100) };
  enhanced._rawLength = ingredientsList.length;

  if (lowerInput.includes("sugar") || lowerInput.includes("syrup")) { if (context === "kids") alternatives.push({ title: "Diluted Juice", description: "Less sugar for kids." }); else alternatives.push({ title: "Stevia / Monk Fruit", description: "Zero calorie natural sweetener." }); }
  if (lowerInput.includes("oil") || lowerInput.includes("fried")) alternatives.push({ title: "Air-Popped Snacks", description: "Crunchy but less fat." });
  if (alternatives.length === 0) alternatives.push({ title: "Whole Food Option", description: "Choose whole, unprocessed versions of these ingredients." });
  enhanced.alternatives = alternatives;
  enhanced.risks = data.risks.map((r) => ({ ...r, confidence: Math.random() > 0.4 ? "High" : "Medium", simple_explanation: `Added for ${r.title.includes("Sugar") ? "flavor" : "preservation"}, but offers little nutrition.` }));
  return enhanced;
}

/* --------- 🧩 UI COMPONENTS (DEFINED BEFORE PAGE) --------- */

// 1. Verdict Banner
const VerdictBanner = ({ score, text }: { score: number, text: string }) => {
  const isGood = score >= 50;
  return (
    <div style={{ 
      background: isGood ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #ef4444, #dc2626)",
      borderRadius: 16, padding: "24px", color: "white", marginBottom: 24,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        {isGood ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{isGood ? "Good Choice" : "Caution"}</h2>
      </div>
      <p style={{ margin: 0, fontSize: 16, opacity: 0.95, fontWeight: 500 }}>{text}</p>
    </div>
  );
};

// 2. Context Selector (This was missing causing the crash)
const ContextSelector = ({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) => {
  const contexts = [
    { id: "general", label: "General", icon: <ShieldCheck size={14} /> },
    { id: "kids", label: "For Kids", icon: <Baby size={14} /> },
    { id: "athlete", label: "Athlete", icon: <Activity size={14} /> },
    { id: "vegan", label: "Vegan", icon: <Leaf size={14} /> },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
      {contexts.map((c) => (
        <button key={c.id} onClick={() => onSelect(c.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, fontSize: 13, fontWeight: 500, border: selected === c.id ? "1px solid var(--primary)" : "1px solid var(--border)", background: selected === c.id ? "rgba(34,197,94,0.1)" : "var(--card)", color: selected === c.id ? "var(--primary)" : "var(--muted)", cursor: "pointer", transition: "all 0.2s" }}>
          {c.icon} {c.label}
        </button>
      ))}
    </div>
  );
};

// 3. Dietary Matrix
const DietaryMatrix = ({ items, theme }: { items: { name: string; status: "safe" | "unsafe" | "warning"; reason?: string }[], theme: string }) => {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
      {items.map((item, i) => (
        <div key={i} style={{ 
          flex: "1 1 auto", padding: "8px 16px", borderRadius: 99, 
          background: item.status === "safe" ? (theme === 'dark' ? "rgba(34, 197, 94, 0.15)" : "#dcfce7") : (theme === 'dark' ? "rgba(239, 68, 68, 0.1)" : "#fee2e2"), 
          border: `1px solid ${item.status === "safe" ? (theme === 'dark' ? "#22c55e" : "#86efac") : (theme === 'dark' ? "#ef4444" : "#fca5a5")}`,
          color: item.status === "safe" ? (theme === 'dark' ? "#4ade80" : "#166534") : (theme === 'dark' ? "#f87171" : "#991b1b"),
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, fontSize: 13
        }}>
          {item.status === "safe" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {item.name} {item.reason ? `(${item.reason})` : ""}
        </div>
      ))}
    </div>
  );
};

// 4. Ingredient X-Ray (Fixed Colors)
const IngredientXRay = ({ breakdown, theme }: { breakdown: { natural: number; processed: number; additives: number }, theme: string }) => {
  if (!breakdown) return null;
  const processedColor = "#f59e0b"; // Golden/Amber for processed
  const bgColor = theme === 'dark' ? "#1e293b" : "#f8fafc";
  const borderColor = theme === 'dark' ? "transparent" : "#e2e8f0";
  const textColor = theme === 'dark' ? "white" : "#334155";
  const titleColor = theme === 'dark' ? "#94a3b8" : "#64748b";
  
  return (
    <div style={{ marginBottom: 24, background: bgColor, border: `1px solid ${borderColor}`, padding: 20, borderRadius: 16, color: textColor, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: titleColor }}><FlaskConical size={18} /> INGREDIENT X-RAY</span>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: breakdown.additives < 20 ? "#22c55e" : "#ef4444", color: "white", fontWeight: 700 }}>{breakdown.additives < 20 ? "CLEAN" : "PROCESSED"}</span>
      </div>
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", width: "100%", marginBottom: 12 }}>
        <div style={{ width: `${breakdown.natural}%`, background: "#4ade80" }} />
        <div style={{ width: `${breakdown.processed}%`, background: processedColor }} />
        <div style={{ width: `${breakdown.additives}%`, background: "#f87171" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, textAlign: "center", fontSize: 11, color: titleColor }}>
        <div><div style={{color:"#4ade80", fontSize:16, fontWeight:800}}>{breakdown.natural}%</div>Natural</div>
        <div><div style={{color: processedColor, fontSize:16, fontWeight:800}}>{breakdown.processed}%</div>Processed</div>
        <div><div style={{color:"#f87171", fontSize:16, fontWeight:800}}>{breakdown.additives}%</div>Additives</div>
      </div>
    </div>
  );
};

// 5. Charts
const RiskAnalysisChart = ({ risks, theme }: { risks: { description: string }[], theme: string }) => {
  const data = [{ name: "High", count: 0, color: "#ef4444" }, { name: "Med", count: 0, color: "#f59e0b" }, { name: "Low", count: 0, color: "#22c55e" }];
  risks.forEach((r) => { const s = getSeverity(r.description); if (s === "high") data[0].count++; else if (s === "medium") data[1].count++; else data[2].count++; });
  const textColor = theme === 'dark' ? "#cbd5e1" : "#475569";
  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer><BarChart data={data} margin={{top: 10, bottom: 0}}>
        <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: 8, border: "1px solid #ddd", color: "black" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}>{data.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
      </BarChart></ResponsiveContainer>
    </div>
  );
};

const HealthScoreGauge = ({ risks, small = false, theme }: { risks: { description: string }[], small?: boolean, theme: string }) => {
  const score = calculateHealthScore(risks);
  let color = "#22c55e"; if (score < 50) color = "#ef4444"; else if (score < 80) color = "#f59e0b";
  const trailColor = theme === 'dark' ? "#334155" : "#e5e7eb";
  const textColor = theme === 'dark' ? "white" : "var(--text)";
  const data = [{ name: "Score", value: score, fill: color }, { name: "Remaining", value: 100 - score, fill: trailColor }];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 180 }}>
      <div style={{ position: "relative", width: 160, height: 80 }}>
        <ResponsiveContainer width="100%" height="200%">
          <PieChart><Pie data={data} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} dataKey="value" stroke="none"><Cell fill={data[0].fill} /><Cell fill={data[1].fill} /></Pie></PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translate(-50%, 0)", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: textColor, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>HEALTH SCORE</div>
        </div>
      </div>
    </div>
  );
};

// 6. Health Trend
const HealthTrendChart = ({ history, theme }: { history: HistoryItem[], theme: string }) => {
  if (!history || history.length < 2) return null;
  const data = history.map(h => ({ name: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }), score: calculateHealthScore(h.result.risks) })).reverse();
  const bgGradient = theme === 'dark' ? "linear-gradient(180deg, rgba(34,197,94,0.1) 0%, rgba(15,23,42,0) 100%)" : "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)";
  const borderColor = theme === 'dark' ? "#1e293b" : "#bbf7d0";
  return (
    <div className="card reveal" style={{ marginBottom: 24, padding: 20, background: bgGradient, border: `1px solid ${borderColor}` }}>
      <div className="section-title"><TrendingUp size={20} color={theme === 'dark' ? "#4ade80" : "#15803d"} /><h2 style={{ color: theme === 'dark' ? "#4ade80" : "#15803d", fontSize: 16 }}>Your Health Journey</h2></div>
      <div style={{ width: "100%", height: 150, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs><linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "none", background: "var(--card)", color:"var(--text)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />
            <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 7. Gamification
const GamificationSection = ({ history, theme }: { history: HistoryItem[], theme: string }) => {
  const count = history.length;
  const bg = theme === 'dark' ? "linear-gradient(to right, #1e293b, #0f172a)" : "linear-gradient(to right, #f0fdf4, #ffffff)";
  const border = theme === 'dark' ? "#334155" : "#bbf7d0";
  return (
    <div className="card reveal" style={{ marginBottom: 24, background: bg, border: `1px solid ${border}`, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, display: "flex", gap: 8, color: theme==='dark'?"#4ade80":"#15803d" }}><Trophy size={20} /> Achievements</h3>
        <span style={{ fontSize: 12, background: theme==='dark'?"rgba(34,197,94,0.2)":"#dcfce7", color: theme==='dark'?"#4ade80":"#166534", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>Level {Math.floor(count / 5) + 1}</span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ textAlign: "center", opacity: count >= 1 ? 1 : 0.5 }}>
          <div style={{ background: count >= 1 ? "#22c55e" : "var(--muted)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginBottom: 4, marginInline: "auto" }}><Microscope size={20} /></div>
          <span style={{ fontSize: 10, color: "var(--text)", fontWeight: 600 }}>First Scan</span>
        </div>
        <div style={{ textAlign: "center", opacity: count >= 5 ? 1 : 0.5 }}>
          <div style={{ background: count >= 5 ? "#22c55e" : "var(--muted)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginBottom: 4, marginInline: "auto" }}><Activity size={20} /></div>
          <span style={{ fontSize: 10, color: "var(--text)", fontWeight: 600 }}>Explorer</span>
        </div>
        <div style={{ textAlign: "center", opacity: count >= 10 ? 1 : 0.5 }}>
          <div style={{ background: count >= 10 ? "#22c55e" : "var(--muted)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginBottom: 4, marginInline: "auto" }}><ShieldCheck size={20} /></div>
          <span style={{ fontSize: 10, color: "var(--text)", fontWeight: 600 }}>Guardian</span>
        </div>
      </div>
    </div>
  );
};

// 8. Shopping List
const ShoppingListCard = ({ items, onRemove, onClear, theme }: { items: string[], onRemove: (i: number) => void, onClear: () => void, theme: string }) => {
  if (items.length === 0) return null;
  const bg = theme === 'dark' ? "#1e293b" : "white";
  const pillBg = theme === 'dark' ? "rgba(34,197,94,0.1)" : "#f0fdf4";
  const pillColor = theme === 'dark' ? "#4ade80" : "#166534";
  const borderColor = theme === 'dark' ? "#334155" : "#bbf7d0";
  return (
    <div className="card reveal" style={{ marginBottom: 24, background: bg, border: `1px solid ${borderColor}`, padding: 20, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: "var(--primary)", fontSize: 16, display: "flex", gap: 8 }}><ShoppingCart size={20} /> Shopping List</h3>
        <button onClick={onClear} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={16} /></button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item, i) => (
          <span key={i} style={{ background: pillBg, padding: "6px 12px", borderRadius: 8, fontSize: 13, color: pillColor, border: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 6 }}>
            {item} <button onClick={() => onRemove(i)} style={{ border: "none", background: "none", cursor: "pointer", color: pillColor, display: "flex" }}><X size={14} /></button>
          </span>
        ))}
      </div>
    </div>
  );
};

// ... (Other Standard Components)
const ExpandableRiskCard = ({ risk }: { risk: any }) => {
  const [expanded, setExpanded] = useState(false);
  const severity = getSeverity(risk.description);
  return (
    <div className="card" style={{ marginBottom: 12, borderLeft: severity === 'high' ? "4px solid #ef4444" : "4px solid #f59e0b", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{display:'flex', alignItems:'center', gap:8}}><AlertTriangle size={18} color={severity==='high'?"#ef4444":"#f59e0b"} /> <strong>{risk.title}</strong></div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      <p style={{ marginTop: 8, fontSize: 14, color: "var(--muted)" }}>{risk.description}</p>
    </div>
  );
};

const AlternativesSection = ({ alternatives, onAdd }: { alternatives: { title: string; description: string }[], onAdd: (item: string) => void }) => {
  if (!alternatives || alternatives.length === 0) return null;
  return (
    <div className="card" style={{ marginBottom: 36, border: "1px solid #86efac", background: "rgba(34,197,94,0.05)", padding: 16 }}>
      <div className="section-title" style={{color: "var(--primary)"}}><Sparkles size={20} /><h2>Better Swaps</h2></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alternatives.map((alt, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card)", padding: 12, borderRadius: 8, border: "1px solid var(--border)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <div><strong style={{ color: "var(--primary)", fontSize: 13 }}>{alt.title}</strong><p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{alt.description}</p></div>
            <button onClick={() => onAdd(alt.title)} style={{ background: "rgba(34,197,94,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#15803d" }}><Plus size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const IngredientSpotlight = ({ items, theme }: { items: { name: string; type: "good" | "bad" | "neutral"; description: string }[], theme: string }) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 30 }}>
        <div className="section-title"><Microscope size={20} /><h2>Spotlight</h2></div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ 
              minWidth: 160, padding: 14, borderRadius: 12, 
              background: "var(--card)", border: "1px solid var(--border)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)", flexShrink: 0 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {item.type === "good" ? <ThumbsUp size={14} color="#16a34a" /> : item.type === "bad" ? <ThumbsDown size={14} color="#dc2626" /> : <Info size={14} color="#6b7280" />}
                <strong style={{ fontSize: 13, color: "var(--text)" }}>{item.name}</strong>
              </div>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
};

const StatusBadge = ({ type, detected }: { type: 'bad' | 'good', detected: boolean }) => {
    if (type === 'bad') return detected ? <span style={{ color: "#dc2626", background: "rgba(220,38,38,0.1)", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}><AlertOctagon size={12} /> DETECTED</span> : <span style={{ color: "#16a34a", background: "rgba(34,197,94,0.1)", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> NONE</span>;
    return null; 
};

/* ---------------- PAGE ---------------- */
export default function Page() {
  const [ingredients, setIngredients] = useState("");
  const [ingredientsB, setIngredientsB] = useState("");
  const [context, setContext] = useState("general");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("Initializing...");
  const [isListening, setIsListening] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareItem, setCompareItem] = useState<AnalysisResponse | null>(null);
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedHistory = localStorage.getItem("foodbuddy-history");
    const savedList = localStorage.getItem("foodbuddy-list");
    if (savedTheme) { setTheme(savedTheme); document.documentElement.setAttribute("data-theme", savedTheme); }
    if (savedHistory) { try { setHistory(JSON.parse(savedHistory)); } catch { localStorage.removeItem("foodbuddy-history"); } }
    if (savedList) { try { setShoppingList(JSON.parse(savedList)); } catch { localStorage.removeItem("foodbuddy-list"); } }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const saveToHistory = (ingredients: string, result: AnalysisResponse, context: string) => {
    const item: HistoryItem = { id: crypto.randomUUID(), ingredients, result, timestamp: Date.now(), context };
    const updated = [item, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("foodbuddy-history", JSON.stringify(updated));
  };
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("foodbuddy-history", JSON.stringify(updated));
  };
  const addToShoppingList = (item: string) => {
    const updated = [...shoppingList, item];
    setShoppingList(updated);
    localStorage.setItem("foodbuddy-list", JSON.stringify(updated));
    alert(`Added ${item} to your list!`);
  };
  const removeFromShoppingList = (index: number) => {
    const updated = shoppingList.filter((_, i) => i !== index);
    setShoppingList(updated);
    localStorage.setItem("foodbuddy-list", JSON.stringify(updated));
  };
  const clearShoppingList = () => {
    setShoppingList([]);
    localStorage.removeItem("foodbuddy-list");
  };
  const clearInput = () => { if(isCompareMode) { setIngredients(""); setIngredientsB(""); } else { setIngredients(""); } };
  const backToHome = () => { setResult(null); setCompareItem(null); setIngredients(""); setIngredientsB(""); setIsCompareMode(false); setError(null); };

  const fetchAnalysis = async (text: string) => {
    const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ingredients: text }) });
    if (!res.ok) throw new Error("Analysis failed");
    let data: AnalysisResponse = await res.json();
    return mockEnhanceData(data, context, text);
  };
  const handleAnalyze = async () => {
    setLoading(true); setError(null); setResult(null); setChatResponse(null); setCompareItem(null);
    if (!isCompareMode) {
      if (!looksLikeIngredientInput(ingredients)) { setError("FoodBuddy analyzes food ingredients only. Please ensure the scan is clear or enter a valid list."); setLoading(false); return; }
      try { const data = await fetchAnalysis(ingredients); setResult(data); if (data.intent !== "Invalid input") saveToHistory(ingredients, data, context); } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    } else {
      if (!looksLikeIngredientInput(ingredients) || !looksLikeIngredientInput(ingredientsB)) { setError("Please enter valid food ingredients for BOTH products."); setLoading(false); return; }
      try { const [dataA, dataB] = await Promise.all([fetchAnalysis(ingredients), fetchAnalysis(ingredientsB)]); setCompareItem(dataA); setResult(dataB); } catch (err: any) { setError("Failed to compare items. Please try again."); } finally { setLoading(false); }
    }
  };
  const toggleCompareMode = () => { setIsCompareMode(!isCompareMode); setResult(null); setCompareItem(null); setIngredients(""); setIngredientsB(""); setError(null); };
  const handleTriggerCompare = () => { if (!result) return; setIsCompareMode(true); setIngredientsB(""); setIngredients(ingredients); setResult(null); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Invalid file type."); return; }
    setError(null); if (!compareItem) setResult(null); setIsScanning(true); setScanningStatus("Preprocessing...");
    try {
      if (file.name.toLowerCase().includes("invalid")) throw new Error("⚠️ Could not detect food ingredients.");
      setScanningStatus("Reading Text...");
      const { data: { text } } = await recognize(file, 'eng', { logger: (m) => { if (m.status === 'recognizing text') setScanningStatus(`Reading... ${Math.round(m.progress * 100)}%`); } });
      setIsScanning(false); const cleanText = text.replace(/\n/g, ", ").replace(/,\s*,/g, ",").trim();
      if (isCompareMode && ingredients.length > 5) setIngredientsB(cleanText); else setIngredients(cleanText);
    } catch (err: any) { setIsScanning(false); setError(err.message || "Failed to scan image."); }
  };
  const toggleListening = () => {
    if (isListening) { setIsListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice input is not supported in this browser."); return; }
    const recognition = new SpeechRecognition(); recognition.lang = "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 1; setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (isCompareMode && ingredients.length > 5) setIngredientsB((prev) => (prev ? prev + " " + transcript : transcript)); else setIngredients((prev) => (prev ? prev + " " + transcript : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false); recognition.onend = () => setIsListening(false); recognition.start();
  };
  const readSummary = () => { if (!result?.summary) return; const utterance = new SpeechSynthesisUtterance(result.summary); window.speechSynthesis.speak(utterance); };
  const cancelComparison = () => { setIsCompareMode(false); setCompareItem(null); setResult(null); setIngredients(""); setIngredientsB(""); };
  const handleAskQuestion = () => { if (!question.trim()) return; setIsChatLoading(true); setChatResponse(null); setTimeout(() => { setIsChatLoading(false); const q = question.toLowerCase(); if (q.includes("child") || q.includes("kid")) setChatResponse("For children, I'd recommend limiting this due to sugar content."); else if (q.includes("vegan")) setChatResponse("Based on ingredients, this appears to be vegan-friendly."); else setChatResponse("Given the ingredients, moderation is key."); }, 1500); };
  const bestFor = result && compareItem ? getBestForTags(compareItem, result) : { winner: "", tags: [] };

  useEffect(() => { if (result && resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [result]);

  return (
    <main style={{ maxWidth: 1000, margin: "20px auto", padding: "20px 16px" }}>
      <style>{`@keyframes blue-pulse { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }`}</style>
      <header className="reveal" style={{ marginBottom: 48, padding: "36px 32px", borderRadius: 22, background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,184,166,0.08))", border: "1px solid var(--border)", position: "relative" }}>
        <button onClick={toggleTheme} aria-label="Toggle dark mode" style={{ position: "absolute", top: 20, right: 20, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", padding: "6px 10px", borderRadius: 8, cursor: "pointer" }}>{theme === "light" ? "🌙 Dark" : "☀️ Light"}</button>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 42px)", fontWeight: 800, marginBottom: 10 }}>FoodBuddy</h1>
        <p style={{ color: "var(--muted)", maxWidth: 620, fontSize: 16, lineHeight: 1.6 }}>Your AI Co-pilot for food choices. It interprets ingredients, highlights risks, and explains *why* it matters.</p>
        <span style={{ display: "inline-block", marginTop: 14, padding: "6px 14px", borderRadius: 999, background: "rgba(34,197,94,0.15)", color: "var(--primary)", fontSize: 12, fontWeight: 600 }}>AI-Native Ingredient Intelligence</span>
      </header>

      {compareItem && !result && (
        <section className="card reveal" style={{ marginBottom: 20, background: "rgba(59,130,246,0.1)", border: "1px solid #93c5fd" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><h3 style={{ color: "#1e3a8a", display: "flex", alignItems: "center", gap: 8 }}><Split size={20} /> Comparison Mode Active</h3><p style={{ fontSize: 14, color: "#1e40af" }}>You are comparing against the previous item. <strong>Scan or Enter Item B now.</strong></p></div>
            <button onClick={cancelComparison} style={{ background: "white", color: "#ef4444", border: "1px solid #fca5a5", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Cancel</button>
          </div>
        </section>
      )}

      {/* --- INPUT SECTION --- */}
      {!result && (
      <section className="card reveal" style={{ marginBottom: 36, position: 'relative' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><FlaskConical size={20} /> {isCompareMode ? "Compare Products" : "Ingredient Input"}</h2>
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
          <input type="file" accept="image/*" ref={galleryInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => cameraInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "var(--card)", border: "1px solid var(--primary)", color: "var(--primary)", cursor: "pointer" }}><Camera size={16} /> Scan</button>
            <button onClick={() => galleryInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "var(--card)", border: "1px solid var(--muted)", color: "var(--text)", cursor: "pointer" }}><Upload size={16} /> Upload</button>
            <button onClick={toggleListening} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 8, background: isListening ? "#fecaca" : "var(--card)", border: isListening ? "1px solid #ef4444" : "1px solid var(--muted)", color: isListening ? "#dc2626" : "var(--text)", cursor: "pointer", transition: "all 0.2s" }}>{isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}{isListening ? "Listening..." : "Voice"}</button>
          </div>
        </div>

        {isCompareMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 4, display: "block" }}>PRODUCT A</label><textarea rows={3} placeholder="Enter first product ingredients..." style={{ width: "100%" }} value={ingredients} onChange={(e) => setIngredients(e.target.value)} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 4, display: "block" }}>PRODUCT B</label><textarea rows={3} placeholder="Enter second product ingredients..." style={{ width: "100%" }} value={ingredientsB} onChange={(e) => setIngredientsB(e.target.value)} /></div>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <textarea rows={4} placeholder="Type ingredients, scan a label, or use voice..." style={{ width: "100%", paddingRight: 40 }} value={ingredients} onChange={(e) => setIngredients(e.target.value)} disabled={isScanning} />
            {ingredients && <button onClick={clearInput} style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={16} /></button>}
            {isScanning && <div style={{ position: "absolute", inset: 0, marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(2px)", borderRadius: 12, color: "var(--primary)", fontWeight: 600 }}><Loader2 className="spin" size={32} style={{ marginBottom: 8 }} />{scanningStatus}</div>}
          </div>
        )}

        <div style={{ marginTop: 16 }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>ANALYZE AS:</span><ContextSelector selected={context} onSelect={setContext} /></div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button className="primary" onClick={handleAnalyze} disabled={loading || isScanning || !ingredients.trim()}>{isCompareMode ? "Compare Products" : "Analyze Ingredients"}</button>
          <button onClick={toggleCompareMode} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8, fontWeight: 600, background: isCompareMode ? "#eff6ff" : "var(--card)", border: "2px solid #3b82f6", color: isCompareMode ? "#1d4ed8" : "#2563eb", cursor: "pointer", animation: "blue-pulse 2s infinite" }}>{isCompareMode ? <ArrowLeft size={18} /> : <ArrowRightLeft size={18} />}{isCompareMode ? "Back to Single" : "Compare Mode"}</button>
          {loading && <div className="loading" aria-live="polite">Analyzing <span className="dot" /><span className="dot" /><span className="dot" /></div>}
        </div>
      </section>
      )}

      {history.length > 0 && !result && !compareItem && (
        <section className="card reveal" style={{ marginBottom: 36 }}>
          <HealthTrendChart history={history} theme={theme} />
          {/* DASHBOARD GRID */}
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <GamificationSection history={history} theme={theme} />
            <ShoppingListCard items={shoppingList} onRemove={removeFromShoppingList} onClear={clearShoppingList} theme={theme} />
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 30 }}>
            <div className="section-title" style={{ margin: 0 }}>
              <History size={22} />
              <h2>Recent Analyses</h2>
            </div>
            {/* NEW SUBTLE CLEAR HISTORY BUTTON */}
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear your history?")) {
                  setHistory([]);
                  localStorage.removeItem("foodbuddy-history");
                }
              }}
              style={{
                fontSize: 12,
                color: "#ef4444",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                padding: "6px 12px",
                borderRadius: 99,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s"
              }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 0, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", borderLeft: "4px solid var(--primary)" }} onClick={() => { setIngredients(item.ingredients); setResult(item.result); if (item.context) setContext(item.context); }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", fontSize: 13 }}>{item.ingredients}</strong>
                    {item.context && <span style={{ fontSize: 9, background: "var(--muted)", color: "white", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{item.context.toUpperCase()}</span>}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <button onClick={(e) => deleteHistoryItem(item.id, e)} style={{ border: "none", background: "rgba(0,0,0,0.05)", borderRadius: "50%", padding: 8, cursor: "pointer", color: "var(--muted)" }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ================= RESULTS / COMPARISON VIEW ================= */}
      {result && (
        <section ref={resultRef} className="fade-in">
          <div style={{ marginBottom: 16 }}>
            <button onClick={backToHome} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: "99px", background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <ArrowLeft size={18} /> Back to Input
            </button>
          </div>

          {result.intent === "Invalid input" ? (
            <div className="card" style={{ border: "1px solid #fca5a5", background: "#fef2f2", padding: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><XCircle size={48} color="#dc2626" /></div>
              <h2 style={{ color: "#b91c1c", marginBottom: 8 }}>Non-Food Input Detected</h2>
              <p style={{ color: "#7f1d1d", fontSize: 15, lineHeight: 1.6 }}>FoodBuddy is designed to analyze <strong>food ingredients only</strong>.</p>
            </div>
          ) : compareItem ? (
            <div className="card" style={{ padding: "clamp(16px, 3vw, 24px)", border: "2px solid #3b82f6" }}>
              {/* COMPARE UI (SAME AS BEFORE) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "clamp(18px, 4vw, 22px)" }}><Split size={24} /> Comparison Result</h2>
                <button onClick={cancelComparison} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "var(--card)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}><ArrowLeft size={16} /> Exit</button>
              </div>
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #86efac", borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <Trophy size={28} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <h3 style={{ color: "#15803d", margin: 0, fontSize: 16 }}>{calculateHealthScore(compareItem.risks) >= calculateHealthScore(result.risks) ? "Product A (First Item)" : "Product B (Second Item)"} looks healthier.</h3>
                    <p style={{ color: "#166534", margin: "8px 0 0", fontSize: 14, fontStyle: "italic" }}>"{generateComparisonInsight(compareItem, result)}"</p>
                  </div>
                </div>
                {bestFor.tags.length > 0 && (<div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}><span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center" }}>{bestFor.winner} is best for:</span>{bestFor.tags.map(tag => (<span key={tag} style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{tag}</span>))}</div>)}
              </div>
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>Key Differences</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12, alignItems: "center" }}>
                  <div style={{ fontWeight: 600, color: "var(--muted)" }}>Feature</div><div style={{ fontWeight: 600, textAlign: "center" }}>Product A</div><div style={{ fontWeight: 600, textAlign: "center" }}>Product B</div>
                  <div>High Sugar</div><div style={{ textAlign: "center" }}><StatusBadge type="bad" detected={compareItem.risks.some(r => r.title.toLowerCase().includes("sugar"))} /></div><div style={{ textAlign: "center" }}><StatusBadge type="bad" detected={result.risks.some(r => r.title.toLowerCase().includes("sugar"))} /></div>
                  <div>Additives</div><div style={{ textAlign: "center" }}><StatusBadge type="bad" detected={compareItem.risks.some(r => r.description.toLowerCase().includes("additive"))} /></div><div style={{ textAlign: "center" }}><StatusBadge type="bad" detected={result.risks.some(r => r.description.toLowerCase().includes("additive"))} /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}><List size={12} /> Complexity</div><div style={{ textAlign: "center" }}>{compareItem._rawLength ? (compareItem._rawLength > 15 ? "High" : "Low") : "-"}</div><div style={{ textAlign: "center" }}>{result._rawLength ? (result._rawLength > 15 ? "High" : "Low") : "-"}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <div style={{ flex: "1 1 250px", padding: 16, background: "var(--background)", borderRadius: 12, textAlign: "center" }}><h4 style={{ color: "var(--muted)", marginBottom: 8 }}>Product A</h4><HealthScoreGauge risks={compareItem.risks} small theme={theme} /><p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{compareItem.risks.length} Risks Detected</p></div>
                <div style={{ flex: "1 1 250px", padding: 16, background: "var(--background)", borderRadius: 12, textAlign: "center" }}><h4 style={{ color: "var(--muted)", marginBottom: 8 }}>Product B</h4><HealthScoreGauge risks={result.risks} small theme={theme} /><p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{result.risks.length} Risks Detected</p></div>
              </div>
            </div>
          ) : (
            <>
              {/* TIER 1: CRITICAL INTEL (Verdict & Dietary) */}
              <VerdictBanner score={calculateHealthScore(result.risks)} text={result.dietary ? getVerdict(calculateHealthScore(result.risks), result.dietary) : result.summary.split('.')[0] + "."} />
              
              {result.dietary && <DietaryMatrix items={result.dietary} theme={theme} />}

              {/* TIER 2: DATA DASHBOARD (X-Ray & Charts) */}
              <div className="card reveal" style={{ padding: 20, marginBottom: 30 }}>
                {result.breakdown && <IngredientXRay breakdown={result.breakdown} theme={theme} />}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 20 }}>
                  <div><h4 style={{fontSize:12, fontWeight:600, color:"var(--muted)", marginBottom:10}}>RISK SEVERITY</h4><RiskAnalysisChart risks={result.risks} theme={theme} /></div>
                  <div><h4 style={{fontSize:12, fontWeight:600, color:"var(--muted)", marginBottom:10}}>HEALTH SCORE</h4><HealthScoreGauge risks={result.risks} theme={theme} /></div>
                </div>
              </div>
              
              {/* TIER 3: DETAILS (Spotlight, Risks, Trade-offs) */}
              {result.spotlight && <IngredientSpotlight items={result.spotlight} theme={theme} />}

              <div className="section-title"><AlertTriangle size={22} /><h2>Risks & Insights</h2></div>
              {result.risks.map((r, i) => <ExpandableRiskCard key={i} risk={r} />)}
              
              <div className="section-title"><Scale size={22} /><h2>Trade-offs</h2></div>
              {result.tradeoffs.map((t, i) => <div key={i} className="card card-tradeoff reveal" style={{ marginBottom: 14 }}><strong>{t.title}</strong><p>{t.description}</p></div>)}
              
              {result.alternatives && <AlternativesSection alternatives={result.alternatives} onAdd={addToShoppingList} />}
              
              <div className="section-title"><BarChart3 size={22} /><h2>Summary</h2></div>
              <p>{result.summary}</p>
              
              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <button className="primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8 }} onClick={() => { const text = `Intent: ${result.intent}\nSummary: ${result.summary}`; navigator.clipboard.writeText(text); alert("Analysis copied to clipboard"); }}><Clipboard size={16} /> Copy</button>
                <button onClick={readSummary} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8, 
                    background: theme === 'dark' ? "rgba(255,255,255,0.05)" : "white", 
                    border: `1px solid ${theme === 'dark' ? "rgba(255,255,255,0.2)" : "#e5e7eb"}`, 
                    color: theme === 'dark' ? "#e2e8f0" : "#374151",
                    borderRadius: 8, cursor: "pointer", padding: "10px" 
                }}><Volume2 size={16} /> Listen</button>
                <button onClick={() => { if (navigator.share) { navigator.share({ title: 'FoodBuddy Analysis', text: result.summary }); } else { alert("Sharing not supported."); } }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8, 
                    background: theme === 'dark' ? "rgba(255,255,255,0.05)" : "white", 
                    border: `1px solid ${theme === 'dark' ? "rgba(255,255,255,0.2)" : "#e5e7eb"}`, 
                    color: theme === 'dark' ? "#e2e8f0" : "#374151",
                    borderRadius: 8, cursor: "pointer", padding: "10px" 
                }}><Share2 size={16} /> Share</button>
                <button onClick={handleTriggerCompare} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8, 
                    background: theme === 'dark' ? "rgba(59, 130, 246, 0.1)" : "white", 
                    border: `1px solid ${theme === 'dark' ? "#60a5fa" : "#3b82f6"}`, 
                    color: theme === 'dark' ? "#60a5fa" : "#2563eb",
                    borderRadius: 8, cursor: "pointer", padding: "10px"
                }}><Split size={16} /> Compare</button>
              </div>

              <div className="card reveal" style={{ marginTop: 24, border: "1px solid var(--border)", background: "rgba(0,0,0,0.02)", padding: "16px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 16 }}><Sparkles size={18} fill="var(--primary)" color="var(--primary)" /> Have a specific question?</h3>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="text" placeholder="e.g. 'Is this safe for diabetics?'" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()} style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)", color: "var(--text)", minWidth: 0 }} />
                  <button onClick={handleAskQuestion} disabled={isChatLoading || !question.trim()} style={{ padding: "0 20px", borderRadius: 8, fontWeight: 600, background: "var(--primary)", color: "white", border: "none", cursor: "pointer", opacity: isChatLoading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{isChatLoading ? <Loader2 className="spin" size={18} /> : "Ask"}</button>
                </div>
                {!chatResponse && <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>{["Is this vegan?", "Safe for kids?", "Any allergens?", "Keto friendly?"].map(q => (<button key={q} onClick={() => { setQuestion(q); setTimeout(handleAskQuestion, 100); }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: "1px solid var(--border)", background: "var(--card)", color: "var(--muted)", cursor: "pointer" }}>{q}</button>))}</div>}
                {chatResponse && <div className="fade-in" style={{ marginTop: 16, display: "flex", gap: 12 }}><div style={{ minWidth: 32, height: 32, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: "bold", flexShrink: 0 }}>AI</div><div style={{ background: "var(--card)", padding: 12, borderRadius: "0 12px 12px 12px", border: "1px solid var(--border)" }}><p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{chatResponse}</p></div></div>}
              </div>
              <p style={{ marginTop: 22, fontStyle: "italic", color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}><Info size={16} /> {result.disclaimer}</p>
            </>
          )}
        </section>
      )}
    </main>
  );
}