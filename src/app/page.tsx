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
  if (
    text.includes("cancer") ||
    text.includes("diabetes") ||
    text.includes("obesity") ||
    text.includes("toxic")
  )
    return "high";

  if (
    text.includes("irritation") ||
    text.includes("allergic") ||
    text.includes("hyperactivity")
  )
    return "medium";

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

  return `The clear winner is ${winner}. It avoids concerns like ${badIngredient.toLowerCase()} found in ${loser}, making it a safer long-term choice.`;
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

/* --------- 🔒 FRONTEND INPUT VALIDATION --------- */
function looksLikeIngredientInput(input: string) {
  const bannedKeywords = [
    "chatgpt", "fabric", "cloth", "clothes", "shirt", "pants",
    "mobile", "phone", "laptop", "program", "who are you",
    "what is", "how to", "how are you", "hello", "hi ", "hey",
    "table", "wood", "plastic",
  ];

  const text = input.toLowerCase().trim();
  if (text.length < 3) return false;
  if (text.split(" ").length > 500) return false;
  return !bannedKeywords.some((word) => text.includes(word));
}

/* --------- 🔮 MOCK DATA ENRICHER (SMART LOGIC) --------- */
function mockEnhanceData(
  data: AnalysisResponse,
  context: string,
  ingredientsInput: string
): AnalysisResponse {
  if (data.intent === "Invalid input") return data;

  const enhanced = { ...data };
  const lowerInput = ingredientsInput.toLowerCase();
  const alternatives = [];

  // --- SPOTLIGHT GENERATION ---
  const spotlight = [];
  if (lowerInput.includes("whole grain") || lowerInput.includes("oats") || lowerInput.includes("wheat")) {
    spotlight.push({ name: "Whole Grains", type: "good" as const, description: "Great for fiber & digestion." });
  }
  if (lowerInput.includes("protein") || lowerInput.includes("chicken") || lowerInput.includes("egg") || lowerInput.includes("whey")) {
    spotlight.push({ name: "Protein Rich", type: "good" as const, description: "Helps build muscle & satiety." });
  }
  if (lowerInput.includes("fructose") || lowerInput.includes("corn syrup")) {
    spotlight.push({ name: "Corn Syrup", type: "bad" as const, description: "Cheap sweetener, high glycemic index." });
  }
  if (lowerInput.includes("red 40") || lowerInput.includes("blue 1") || lowerInput.includes("yellow")) {
    spotlight.push({ name: "Artificial Colors", type: "bad" as const, description: "Linked to hyperactivity in kids." });
  }
  if (lowerInput.includes("palm oil")) {
    spotlight.push({ name: "Palm Oil", type: "bad" as const, description: "High in saturated fats." });
  }
  if (spotlight.length === 0) {
    spotlight.push({ name: "Main Ingredients", type: "neutral" as const, description: "Standard composition." });
  }
  enhanced.spotlight = spotlight.slice(0, 4);

  // --- INGREDIENT CLASSIFICATION ---
  const ingredientsList = ingredientsInput.split(/,|;/).map(i => i.trim().toLowerCase());
  let naturalCount = 0;
  let processedCount = 0;
  let additivesCount = 0;

  ingredientsList.forEach(ing => {
    if (ing.includes("extract") || ing.includes("syrup") || ing.includes("flour") || ing.includes("oil") || ing.includes("salt") || ing.includes("sugar")) {
      processedCount++;
    } else if (ing.includes("red") || ing.includes("blue") || ing.includes("yellow") || ing.includes("acid") || ing.includes("gum") || ing.includes("benzoate") || ing.includes("sorbate") || ing.includes("glutamate")) {
      additivesCount++;
    } else {
      naturalCount++;
    }
  });
  
  const total = naturalCount + processedCount + additivesCount || 1;
  enhanced.breakdown = {
    natural: Math.round((naturalCount / total) * 100),
    processed: Math.round((processedCount / total) * 100),
    additives: Math.round((additivesCount / total) * 100),
  };
  enhanced._rawLength = ingredientsList.length;

  if (lowerInput.includes("syrup") || lowerInput.includes("sugar") || lowerInput.includes("cane") || lowerInput.includes("soda")) {
    if (context === "kids") {
      alternatives.push({ title: "Hydration for Kids", description: "Try water infused with berries or diluted 100% fruit juice." });
    } else {
      alternatives.push({ title: "Natural Sweeteners", description: "Consider Stevia or Monk Fruit to avoid spikes." });
    }
  }
  if (lowerInput.includes("oil") || lowerInput.includes("fried") || lowerInput.includes("chip") || lowerInput.includes("salt")) {
    alternatives.push({ title: "Crunchy Alternatives", description: "Air-popped popcorn or roasted chickpeas offer crunch with less fat." });
  }
  if (alternatives.length === 0) {
    alternatives.push({ title: "Whole Food Option", description: "Choose whole, unprocessed versions of these ingredients." });
  }

  enhanced.alternatives = alternatives;
  enhanced.risks = data.risks.map((r) => ({
    ...r,
    confidence: Math.random() > 0.4 ? "High" : "Medium",
    simple_explanation: `In simple terms: This is added for ${r.title.includes("Sugar") ? "flavor" : "texture/preservation"}, but ${context === "kids" ? "parents should be cautious." : "it offers little nutrition."}`,
  }));

  return enhanced;
}

/* --------- 📊 CHART COMPONENTS --------- */
const RiskAnalysisChart = ({ risks }: { risks: { description: string }[] }) => {
  const data = [
    { name: "High", count: 0, color: "#ef4444" },
    { name: "Medium", count: 0, color: "#f59e0b" },
    { name: "Low", count: 0, color: "#22c55e" },
  ];
  risks.forEach((r) => {
    const severity = getSeverity(r.description);
    if (severity === "high") data[0].count++;
    else if (severity === "medium") data[1].count++;
    else data[2].count++;
  });
  if (risks.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 250, marginTop: 10, marginBottom: 10 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={60} tick={{ fill: "var(--text)", fontSize: 12, fontWeight: 600 }} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.1)" }} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)" }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Risk Severity Distribution</p>
    </div>
  );
};

const HealthScoreGauge = ({ risks, small = false }: { risks: { description: string }[], small?: boolean }) => {
  const score = calculateHealthScore(risks);
  let color = "#22c55e";
  if (score < 50) color = "#ef4444";
  else if (score < 80) color = "#f59e0b";
  const data = [{ name: "Score", value: score, fill: color }, { name: "Remaining", value: 100 - score, fill: "var(--border)" }];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: small ? 120 : 180, marginTop: 10 }}>
      <div style={{ position: "relative", width: small ? 140 : 200, height: small ? 70 : 100 }}>
        <ResponsiveContainer width="100%" height="200%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={small ? 40 : 60} outerRadius={small ? 55 : 80} dataKey="value" stroke="none">
              <Cell fill={data[0].fill} />
              <Cell fill={data[1].fill} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", top: "75%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", width: "100%" }}>
          <div style={{ fontSize: small ? 24 : 32, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Score</div>
        </div>
      </div>
    </div>
  );
};

const IngredientXRay = ({ breakdown }: { breakdown: { natural: number; processed: number; additives: number } }) => {
  if (!breakdown) return null;
  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
        <span>Ingredient Composition</span>
        <span>{breakdown.additives < 20 ? "✅ Clean Label" : "⚠️ High Processing"}</span>
      </div>
      <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", width: "100%" }}>
        <div style={{ width: `${breakdown.natural}%`, background: "#22c55e" }} />
        <div style={{ width: `${breakdown.processed}%`, background: "#f59e0b" }} />
        <div style={{ width: `${breakdown.additives}%`, background: "#ef4444" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#22c55e" }} /><span>Natural ({breakdown.natural}%)</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#f59e0b" }} /><span>Processed ({breakdown.processed}%)</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444" }} /><span>Additives ({breakdown.additives}%)</span></div>
      </div>
    </div>
  );
};

const IngredientSpotlight = ({ items }: { items: { name: string; type: "good" | "bad" | "neutral"; description: string }[] }) => {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 30 }}>
      <div className="section-title"><Microscope size={22} /><h2>Ingredient Spotlight</h2></div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ 
            minWidth: 200, padding: 14, borderRadius: 12, 
            background: item.type === "good" ? "#f0fdf4" : item.type === "bad" ? "#fef2f2" : "var(--card)", 
            border: `1px solid ${item.type === "good" ? "#bbf7d0" : item.type === "bad" ? "#fecaca" : "var(--border)"}`,
            flexShrink: 0 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {item.type === "good" ? <ThumbsUp size={16} color="#16a34a" /> : item.type === "bad" ? <ThumbsDown size={16} color="#dc2626" /> : <Info size={16} color="#6b7280" />}
              <strong style={{ fontSize: 14, color: item.type === "good" ? "#16a34a" : item.type === "bad" ? "#dc2626" : "var(--text)" }}>{item.name}</strong>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* --------- 🧩 UI COMPONENTS --------- */
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

const ExpandableRiskCard = ({ risk }: { risk: any }) => {
  const [expanded, setExpanded] = useState(false);
  const severity = getSeverity(risk.description);
  const confidence = risk.confidence || "High";
  return (
    <div className="card card-risk reveal" style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div>
          <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {risk.title}
            <span className={`severity severity-${severity}`}>{severity.toUpperCase()}</span>
            {confidence !== "High" && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", gap: 4 }}><HelpCircle size={10} /> Uncertainty</span>}
          </strong>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
      <p style={{ marginTop: 8 }}>{risk.description}</p>
      {expanded && risk.simple_explanation && (
        <div style={{ marginTop: 12, padding: 12, background: "rgba(0,0,0,0.03)", borderRadius: 8, borderLeft: "3px solid var(--primary)" }}>
          <p style={{ fontSize: 13, margin: 0, fontStyle: "italic", color: "var(--muted)" }}><strong>💡 AI Insight:</strong> {risk.simple_explanation}</p>
        </div>
      )}
    </div>
  );
};

const AlternativesSection = ({ alternatives }: { alternatives: { title: string; description: string }[] }) => {
  if (!alternatives || alternatives.length === 0) return null;
  return (
    <div className="card reveal" style={{ marginBottom: 36, border: "1px solid #86efac", background: "rgba(34,197,94,0.05)" }}>
      <div className="section-title"><Sparkles size={22} color="#16a34a" /><h2 style={{ color: "#15803d" }}>Better Alternatives</h2></div>
      <p style={{ fontSize: 14, color: "#166534", marginBottom: 16 }}>Based on your ingredients, here are some healthier swaps:</p>
      <div style={{ display: "grid", gap: 12 }}>
        {alternatives.map((alt, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "white", padding: 12, borderRadius: 8, border: "1px solid #bbf7d0" }}>
            <ArrowRight size={18} color="#16a34a" style={{ marginTop: 2 }} />
            <div><strong style={{ color: "#15803d" }}>{alt.title}</strong><p style={{ fontSize: 13, color: "#14532d", margin: "4px 0 0" }}>{alt.description}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ type, detected }: { type: 'bad' | 'good', detected: boolean }) => {
  if (type === 'bad') {
    return detected 
      ? <span style={{ color: "#dc2626", background: "#fef2f2", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}><AlertOctagon size={12} /> DETECTED</span>
      : <span style={{ color: "#16a34a", background: "#f0fdf4", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> NONE</span>;
  }
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
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedHistory = localStorage.getItem("foodbuddy-history");
    if (savedTheme) { setTheme(savedTheme); document.documentElement.setAttribute("data-theme", savedTheme); }
    if (savedHistory) { try { setHistory(JSON.parse(savedHistory)); } catch { localStorage.removeItem("foodbuddy-history"); } }
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

  const backToHome = () => {
    setResult(null);
    setCompareItem(null);
    setIngredients("");
    setIngredientsB("");
    setIsCompareMode(false);
    setError(null);
  };

  const fetchAnalysis = async (text: string) => {
    const res = await fetch("/api/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: text }),
    });
    if (!res.ok) throw new Error("Analysis failed");
    let data: AnalysisResponse = await res.json();
    return mockEnhanceData(data, context, text);
  };

  const handleAnalyze = async () => {
    setLoading(true); setError(null); setResult(null); setChatResponse(null); setCompareItem(null);
    
    if (!isCompareMode) {
      if (!looksLikeIngredientInput(ingredients)) {
        setError("FoodBuddy analyzes food ingredients only. Please ensure the scan is clear or enter a valid list.");
        setLoading(false); return;
      }
      try {
        const data = await fetchAnalysis(ingredients);
        setResult(data);
        if (data.intent !== "Invalid input") saveToHistory(ingredients, data, context);
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    } else {
      if (!looksLikeIngredientInput(ingredients) || !looksLikeIngredientInput(ingredientsB)) {
        setError("Please enter valid food ingredients for BOTH products.");
        setLoading(false); return;
      }
      try {
        const [dataA, dataB] = await Promise.all([fetchAnalysis(ingredients), fetchAnalysis(ingredientsB)]);
        setCompareItem(dataA); setResult(dataB);      
      } catch (err: any) { setError("Failed to compare items. Please try again."); } finally { setLoading(false); }
    }
  };

  const toggleCompareMode = () => {
    setIsCompareMode(!isCompareMode);
    setResult(null); setCompareItem(null); setIngredients(""); setIngredientsB(""); setError(null);
  };

  const handleTriggerCompare = () => {
    if (!result) return;
    setIsCompareMode(true); setIngredientsB(""); setIngredients(ingredients); setResult(null); 
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Invalid file type."); return; }
    setError(null); 
    if (!compareItem) setResult(null);
    setIsScanning(true); setScanningStatus("Preprocessing...");
    try {
      if (file.name.toLowerCase().includes("invalid")) throw new Error("⚠️ Could not detect food ingredients.");
      setScanningStatus("Reading Text...");
      const { data: { text } } = await recognize(file, 'eng', { logger: (m) => { if (m.status === 'recognizing text') setScanningStatus(`Reading... ${Math.round(m.progress * 100)}%`); } });
      setIsScanning(false);
      const cleanText = text.replace(/\n/g, ", ").replace(/,\s*,/g, ",").trim();
      if (isCompareMode && ingredients.length > 5) setIngredientsB(cleanText); else setIngredients(cleanText);
    } catch (err: any) { setIsScanning(false); setError(err.message || "Failed to scan image."); }
  };

  const toggleListening = () => {
    if (isListening) { setIsListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice input is not supported in this browser."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 1;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (isCompareMode && ingredients.length > 5) setIngredientsB((prev) => (prev ? prev + " " + transcript : transcript)); else setIngredients((prev) => (prev ? prev + " " + transcript : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false); recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const readSummary = () => {
    if (!result?.summary) return;
    const utterance = new SpeechSynthesisUtterance(result.summary);
    window.speechSynthesis.speak(utterance);
  };

  const cancelComparison = () => {
    setIsCompareMode(false); setCompareItem(null); setResult(null); setIngredients(""); setIngredientsB("");
  };

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    setIsChatLoading(true); setChatResponse(null);
    setTimeout(() => {
      setIsChatLoading(false);
      const q = question.toLowerCase();
      if (q.includes("child") || q.includes("kid")) setChatResponse("For children, I'd recommend limiting this due to sugar content.");
      else if (q.includes("vegan")) setChatResponse("Based on ingredients, this appears to be vegan-friendly.");
      else setChatResponse("Given the ingredients, moderation is key.");
    }, 1500);
  };

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

      {/* --- INPUT SECTION (Only show if NO result is visible) --- */}
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
            <textarea rows={4} placeholder="Type ingredients, scan a label, or use voice..." style={{ width: "100%" }} value={ingredients} onChange={(e) => setIngredients(e.target.value)} disabled={isScanning} />
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
          <div className="section-title"><History size={22} /><h2>Recent Analyses</h2></div>
          {history.map((item) => (
            <div key={item.id} className="card" style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => { setIngredients(item.ingredients); setResult(item.result); if (item.context) setContext(item.context); }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{item.ingredients}</strong>
                {item.context && <span style={{ fontSize: 10, background: "var(--muted)", color: "white", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{item.context.toUpperCase()}</span>}
                {/* --- NEW: DELETE BUTTON --- */}
                <button onClick={(e) => deleteHistoryItem(item.id, e)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, color: "var(--muted)" }}>
                  <Trash2 size={16} />
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(item.timestamp).toLocaleString()}</p>
            </div>
          ))}
          <button className="primary" style={{ marginTop: 12 }} onClick={() => { setHistory([]); localStorage.removeItem("foodbuddy-history"); }}><Trash2 size={16} /> Clear History</button>
        </section>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ================= RESULTS / COMPARISON VIEW ================= */}
      {result && (
        <section ref={resultRef} className="fade-in">
          {/* --- NEW: BACK TO HOME BUTTON (Styled) --- */}
          <div style={{ marginBottom: 16 }}>
            <button 
              onClick={backToHome} 
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: "99px",
                background: "var(--card)", border: "1px solid var(--border)",
                color: "var(--text)", fontSize: 14, fontWeight: 600,
                cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "clamp(18px, 4vw, 22px)" }}><Split size={24} /> Comparison Result</h2>
                <button onClick={cancelComparison} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "var(--card)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}><ArrowLeft size={16} /> Exit</button>
              </div>
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #86efac", borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <Trophy size={28} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <h3 style={{ color: "#15803d", margin: 0, fontSize: 16 }}>
                      {calculateHealthScore(compareItem.risks) >= calculateHealthScore(result.risks) ? "Product A (First Item)" : "Product B (Second Item)"} looks healthier.
                    </h3>
                    <p style={{ color: "#166534", margin: "8px 0 0", fontSize: 14, fontStyle: "italic" }}>
                      "{generateComparisonInsight(compareItem, result)}"
                    </p>
                  </div>
                </div>
                {bestFor.tags.length > 0 && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center" }}>{bestFor.winner} is best for:</span>
                    {bestFor.tags.map(tag => (<span key={tag} style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{tag}</span>))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>Key Differences</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12, alignItems: "center" }}>
                  <div style={{ fontWeight: 600, color: "var(--muted)" }}>Feature</div>
                  <div style={{ fontWeight: 600, textAlign: "center" }}>Product A</div>
                  <div style={{ fontWeight: 600, textAlign: "center" }}>Product B</div>
                  <div>High Sugar</div>
                  <div style={{ textAlign: "center" }}><StatusBadge type="bad" detected={compareItem.risks.some(r => r.title.toLowerCase().includes("sugar"))} /></div>
                  <div style={{ textAlign: "center" }}><StatusBadge type="bad" detected={result.risks.some(r => r.title.toLowerCase().includes("sugar"))} /></div>
                  <div>Additives</div>
                  <div style={{ textAlign: "center" }}><StatusBadge type="bad" detected={compareItem.risks.some(r => r.description.toLowerCase().includes("additive"))} /></div>
                  <div style={{ textAlign: "center" }}><StatusBadge type="bad" detected={result.risks.some(r => r.description.toLowerCase().includes("additive"))} /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}><List size={12} /> Complexity</div>
                  <div style={{ textAlign: "center" }}>{compareItem._rawLength ? (compareItem._rawLength > 15 ? "High" : "Low") : "-"}</div>
                  <div style={{ textAlign: "center" }}>{result._rawLength ? (result._rawLength > 15 ? "High" : "Low") : "-"}</div>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <div style={{ flex: "1 1 250px", padding: 16, background: "var(--background)", borderRadius: 12, textAlign: "center" }}><h4 style={{ color: "var(--muted)", marginBottom: 8 }}>Product A</h4><HealthScoreGauge risks={compareItem.risks} small /><p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{compareItem.risks.length} Risks Detected</p></div>
                <div style={{ flex: "1 1 250px", padding: 16, background: "var(--background)", borderRadius: 12, textAlign: "center" }}><h4 style={{ color: "var(--muted)", marginBottom: 8 }}>Product B</h4><HealthScoreGauge risks={result.risks} small /><p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{result.risks.length} Risks Detected</p></div>
              </div>
            </div>
          ) : (
            <>
              <div className="section-title"><BarChart3 size={22} /><h2>Overview</h2></div>
              <p style={{ marginBottom: 24 }}>{result.intent}</p>
              
              {result.breakdown && <IngredientXRay breakdown={result.breakdown} />}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 30 }}>
                <div className="card" style={{ padding: 20 }}><RiskAnalysisChart risks={result.risks} /></div>
                <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "center" }}><HealthScoreGauge risks={result.risks} /></div>
              </div>
              
              {result.spotlight && <IngredientSpotlight items={result.spotlight} />}

              <div className="section-title"><AlertTriangle size={22} /><h2>Risks & Insights</h2></div>
              {result.risks.map((r, i) => <ExpandableRiskCard key={i} risk={r} />)}
              <div className="section-title"><Scale size={22} /><h2>Trade-offs</h2></div>
              {result.tradeoffs.map((t, i) => <div key={i} className="card card-tradeoff reveal" style={{ marginBottom: 14 }}><strong>{t.title}</strong><p>{t.description}</p></div>)}
              {result.alternatives && <AlternativesSection alternatives={result.alternatives} />}
              <div className="section-title"><BarChart3 size={22} /><h2>Summary</h2></div>
              <p>{result.summary}</p>
              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <button className="primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8 }} onClick={() => { const text = `Intent: ${result.intent}\nSummary: ${result.summary}`; navigator.clipboard.writeText(text); alert("Analysis copied to clipboard"); }}><Clipboard size={16} /> Copy</button>
                <button onClick={readSummary} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "10px" }}><Volume2 size={16} /> Listen</button>
                <button onClick={() => { if (navigator.share) { navigator.share({ title: 'FoodBuddy Analysis', text: result.summary }); } else { alert("Sharing not supported."); } }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "10px" }}><Share2 size={16} /> Share</button>
                <button onClick={handleTriggerCompare} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8, background: "var(--card)", border: "2px solid #3b82f6", color: "#2563eb", borderRadius: 8, cursor: "pointer", padding: "10px", animation: "blue-pulse 2s infinite" }}><Split size={16} /> Compare</button>
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