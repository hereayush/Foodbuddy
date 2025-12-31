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
  Split, // Used for the Compare Button
} from "lucide-react";
// --- Recharts imports ---
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
// --- Tesseract for Real OCR ---
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

/* --------- 🔒 FRONTEND INPUT VALIDATION --------- */
function looksLikeIngredientInput(input: string) {
  const bannedKeywords = [
    "chatgpt",
    "fabric",
    "cloth",
    "clothes",
    "shirt",
    "pants",
    "mobile",
    "phone",
    "laptop",
    "program",
    "who are you",
    "what is",
    "how to",
    "how are you",
    "hello",
    "hi ",
    "hey",
    "table",
    "wood",
    "plastic",
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

  // 1. Sugary / Soda Logic
  if (
    lowerInput.includes("syrup") ||
    lowerInput.includes("sugar") ||
    lowerInput.includes("cane") ||
    lowerInput.includes("dextrose") ||
    lowerInput.includes("soda") ||
    lowerInput.includes("coke")
  ) {
    if (context === "kids") {
      alternatives.push({
        title: "Hydration for Kids",
        description: "Try water infused with berries or diluted 100% fruit juice.",
      });
    } else if (context === "athlete") {
      alternatives.push({
        title: "Electrolyte Focus",
        description: "Coconut water provides natural electrolytes without processed sugars.",
      });
    } else {
      alternatives.push({
        title: "Natural Sweeteners",
        description: "Consider Stevia, Monk Fruit, or Erythritol to avoid spikes.",
      });
      alternatives.push({
        title: "Whole Food Option",
        description: "Fresh fruit provides sweetness with added fiber.",
      });
    }
  }

  // 2. Salty / Chips / Fried Logic
  if (
    lowerInput.includes("oil") ||
    lowerInput.includes("fried") ||
    lowerInput.includes("chip") ||
    lowerInput.includes("potato") ||
    lowerInput.includes("salt") ||
    lowerInput.includes("sodium")
  ) {
    alternatives.push({
      title: "Crunchy Alternatives",
      description: "Air-popped popcorn or roasted chickpeas offer crunch with less fat.",
    });
    alternatives.push({
      title: "Baked, Not Fried",
      description: "Look for baked vegetable chips to reduce calorie density.",
    });
  }

  // 3. Caffeine Logic
  if (lowerInput.includes("caffeine") || lowerInput.includes("coffee") || lowerInput.includes("energy")) {
    alternatives.push({
      title: "Sustained Energy",
      description: "Green tea or Matcha provides a milder boost with antioxidants.",
    });
  }

  // Fallback
  if (alternatives.length === 0) {
    alternatives.push({
      title: "Whole Food Option",
      description: "Choose whole, unprocessed versions of these ingredients.",
    });
  }

  enhanced.alternatives = alternatives;
  enhanced.risks = data.risks.map((r) => ({
    ...r,
    confidence: Math.random() > 0.4 ? "High" : "Medium",
    simple_explanation: `In simple terms: This is added for ${
      r.title.includes("Sugar") ? "flavor" : "texture/preservation"
    }, but ${
      context === "kids" ? "parents should be cautious." : "it offers little nutrition."
    }`,
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

/* ---------------- PAGE ---------------- */
export default function Page() {
  const [ingredients, setIngredients] = useState("");
  const [context, setContext] = useState("general");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("Initializing...");
  const [isListening, setIsListening] = useState(false);
  
  // --- CHAT STATE ---
  const [question, setQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- COMPARE MODE STATE ---
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

  const handleAnalyze = async (textOverride?: string, isComparing = false) => {
    setLoading(true); setError(null); 
    // IMPORTANT: If we are starting a comparison, we DON'T clear the result yet
    if (!isComparing) {
      setResult(null); 
      setChatResponse(null);
    }

    const textToAnalyze = textOverride || ingredients;
    if (!looksLikeIngredientInput(textToAnalyze)) {
      setError("FoodBuddy analyzes food ingredients only. Please ensure the scan is clear or enter a valid list.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: textToAnalyze }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      let data: AnalysisResponse = await res.json();
      data = mockEnhanceData(data, context, textToAnalyze);
      
      setResult(data);
      if (data.intent !== "Invalid input") saveToHistory(textToAnalyze, data, context);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  // Wrapper for the Analyze button to handle Compare Mode triggering
  const handleAnalyzeClick = () => {
    if (compareItem) {
      // If we are already in compare mode, analyze normally (which will fill 'result' slot B)
      handleAnalyze();
    } else {
      // Normal analysis
      handleAnalyze();
    }
  };

  // Trigger Compare Mode FROM INPUT BOX
  const handleTriggerCompare = () => {
    if (!result) return;
    setCompareItem(result); // Save current result as A
    setResult(null); // Clear result slot B
    setIngredients(""); // Clear text for new input
    // User remains in input section, ready to type Item B
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Invalid file type."); return; }
    setError(null); 
    // Don't clear result if we are in middle of compare flow (unless we want to replace it)
    if (!compareItem) setResult(null);
    
    setIsScanning(true); setScanningStatus("Preprocessing...");
    try {
      if (file.name.toLowerCase().includes("invalid")) throw new Error("⚠️ Could not detect food ingredients.");
      if (file.name.toLowerCase().includes("random")) {
        setScanningStatus("Detecting...");
        setTimeout(() => {
          setIsScanning(false);
          const irrelevantText = "Table, Wood, Plastic, 100% Cotton, Made in China";
          setIngredients(irrelevantText);
          handleAnalyze(irrelevantText);
        }, 1500);
        return;
      }
      setScanningStatus("Reading Text...");
      const { data: { text } } = await recognize(file, 'eng', { logger: (m) => { if (m.status === 'recognizing text') setScanningStatus(`Reading... ${Math.round(m.progress * 100)}%`); } });
      setIsScanning(false);
      const cleanText = text.replace(/\n/g, ", ").replace(/,\s*,/g, ",").trim();
      if (cleanText.length < 5) throw new Error("Could not read enough text. Try a clearer image.");
      setIngredients(cleanText);
      handleAnalyze(cleanText);
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
      setIngredients((prev) => (prev ? prev + " " + transcript : transcript));
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
    setCompareItem(null);
    setResult(null);
    setIngredients("");
  };

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    setIsChatLoading(true);
    setChatResponse(null);
    setTimeout(() => {
      setIsChatLoading(false);
      const q = question.toLowerCase();
      if (q.includes("child") || q.includes("kid") || q.includes("toddler") || q.includes("baby")) {
        setChatResponse("For children, I'd recommend limiting this due to the high sugar content and artificial colors, which can impact attention.");
      } else if (q.includes("vegan") || q.includes("vegetarian")) {
        setChatResponse("Based on the ingredients, this appears to be vegan-friendly as there are no obvious animal-derived additives.");
      } else if (q.includes("weight") || q.includes("diet") || q.includes("fat") || q.includes("keto")) {
        setChatResponse("If you're watching your weight, be careful. The combination of high fats and refined carbs makes this calorie-dense.");
      } else if (q.includes("safe") || q.includes("bad") || q.includes("cancer")) {
         setChatResponse("While generally recognized as safe by regulators, some ingredients here have controversial studies regarding long-term health effects.");
      } else {
        setChatResponse("That's a great question. Given the processed nature of these ingredients, moderation is key. Consider the healthier alternatives listed above.");
      }
    }, 1500);
  };

  useEffect(() => { if (result && resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [result]);

  return (
    <main style={{ maxWidth: 1000, margin: "20px auto", padding: "20px 16px" }}>
      <header className="reveal" style={{ marginBottom: 48, padding: "36px 32px", borderRadius: 22, background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,184,166,0.08))", border: "1px solid var(--border)", position: "relative" }}>
        <button onClick={toggleTheme} aria-label="Toggle dark mode" style={{ position: "absolute", top: 20, right: 20, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", padding: "6px 10px", borderRadius: 8, cursor: "pointer" }}>{theme === "light" ? "🌙 Dark" : "☀️ Light"}</button>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 42px)", fontWeight: 800, marginBottom: 10 }}>FoodBuddy</h1>
        <p style={{ color: "var(--muted)", maxWidth: 620, fontSize: 16, lineHeight: 1.6 }}>Your AI Co-pilot for food choices. It interprets ingredients, highlights risks, and explains *why* it matters.</p>
        <span style={{ display: "inline-block", marginTop: 14, padding: "6px 14px", borderRadius: 999, background: "rgba(34,197,94,0.15)", color: "var(--primary)", fontSize: 12, fontWeight: 600 }}>AI-Native Ingredient Intelligence</span>
      </header>

      {/* --- COMPARISON BANNER --- */}
      {compareItem && !result && (
        <section className="card reveal" style={{ marginBottom: 20, background: "rgba(59,130,246,0.1)", border: "1px solid #93c5fd" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ color: "#1e3a8a", display: "flex", alignItems: "center", gap: 8 }}><Split size={20} /> Comparison Mode Active</h3>
              <p style={{ fontSize: 14, color: "#1e40af" }}>You are comparing against the previous item. <strong>Scan or Enter Item B now.</strong></p>
            </div>
            <button onClick={cancelComparison} style={{ background: "white", color: "#ef4444", border: "1px solid #fca5a5", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Cancel</button>
          </div>
        </section>
      )}

      {/* --- INPUT SECTION --- */}
      <section className="card reveal" style={{ marginBottom: 36, position: 'relative' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><FlaskConical size={20} /> {compareItem ? "Input Item B" : "Ingredient Input"}</h2>
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
          <input type="file" accept="image/*" ref={galleryInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => cameraInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "var(--card)", border: "1px solid var(--primary)", color: "var(--primary)", cursor: "pointer" }}><Camera size={16} /> Scan</button>
            <button onClick={() => galleryInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "var(--card)", border: "1px solid var(--muted)", color: "var(--text)", cursor: "pointer" }}><Upload size={16} /> Upload</button>
            <button onClick={toggleListening} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 8, background: isListening ? "#fecaca" : "var(--card)", border: isListening ? "1px solid #ef4444" : "1px solid var(--muted)", color: isListening ? "#dc2626" : "var(--text)", cursor: "pointer", transition: "all 0.2s" }}>{isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}{isListening ? "Listening..." : "Voice"}</button>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <textarea rows={4} placeholder={compareItem ? "Enter ingredients for the second item..." : "Type ingredients, scan a label, or use voice..."} style={{ width: "100%", marginTop: 14, opacity: isScanning ? 0.5 : 1 }} value={ingredients} onChange={(e) => setIngredients(e.target.value)} disabled={isScanning} />
          {isScanning && <div style={{ position: "absolute", inset: 0, marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(2px)", borderRadius: 12, color: "var(--primary)", fontWeight: 600 }}><Loader2 className="spin" size={32} style={{ marginBottom: 8 }} />{scanningStatus}</div>}
        </div>
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>ANALYZE AS:</span>
          <ContextSelector selected={context} onSelect={setContext} />
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button className="primary" onClick={handleAnalyzeClick} disabled={loading || isScanning || !ingredients.trim()}>{compareItem ? "Compare Items" : "Analyze Ingredients"}</button>
          
          {/* --- NEW: COMPARE BUTTON IN INPUT (Visible when Result exists) --- */}
          {result && !compareItem && result.intent !== "Invalid input" && (
            <button 
              onClick={handleTriggerCompare}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 8, fontWeight: 600,
                background: "var(--card)", border: "2px solid #3b82f6", color: "#2563eb",
                cursor: "pointer"
              }}
            >
              <Split size={18} /> Compare with this
            </button>
          )}

          {loading && <div className="loading" aria-live="polite">Analyzing <span className="dot" /><span className="dot" /><span className="dot" /></div>}
        </div>
      </section>

      {history.length > 0 && !result && !compareItem && (
        <section className="card reveal" style={{ marginBottom: 36 }}>
          <div className="section-title"><History size={22} /><h2>Recent Analyses</h2></div>
          {history.map((item) => (
            <div key={item.id} className="card" style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => { setIngredients(item.ingredients); setResult(item.result); if (item.context) setContext(item.context); }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{item.ingredients}</strong>
                {item.context && <span style={{ fontSize: 10, background: "var(--muted)", color: "white", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{item.context.toUpperCase()}</span>}
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
          {result.intent === "Invalid input" ? (
            <div className="card" style={{ border: "1px solid #fca5a5", background: "#fef2f2", padding: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><XCircle size={48} color="#dc2626" /></div>
              <h2 style={{ color: "#b91c1c", marginBottom: 8 }}>Non-Food Input Detected</h2>
              <p style={{ color: "#7f1d1d", fontSize: 15, lineHeight: 1.6 }}>FoodBuddy is designed to analyze <strong>food ingredients only</strong>.</p>
            </div>
          ) : compareItem ? (
            /* --- COMPARISON MODE UI --- */
            <div className="card" style={{ padding: "24px", border: "2px solid #3b82f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22 }}><Split size={24} /> Comparison Result</h2>
                <button onClick={cancelComparison} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "var(--card)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}><ArrowLeft size={16} /> Exit</button>
              </div>

              {/* WINNER BANNER */}
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #86efac", borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                <Trophy size={28} color="#16a34a" />
                <div>
                  <h3 style={{ color: "#15803d", margin: 0 }}>
                    {calculateHealthScore(compareItem.risks) >= calculateHealthScore(result.risks) ? "Product A (First Item)" : "Product B (Second Item)"} looks healthier.
                  </h3>
                  <p style={{ color: "#166534", margin: "4px 0 0", fontSize: 14 }}>Based on fewer detected risks and additives.</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* ITEM A */}
                <div style={{ padding: 16, background: "var(--background)", borderRadius: 12, textAlign: "center" }}>
                  <h4 style={{ color: "var(--muted)", marginBottom: 8 }}>Product A</h4>
                  <HealthScoreGauge risks={compareItem.risks} small />
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{compareItem.risks.length} Risks Detected</p>
                </div>
                {/* ITEM B */}
                <div style={{ padding: 16, background: "var(--background)", borderRadius: 12, textAlign: "center" }}>
                  <h4 style={{ color: "var(--muted)", marginBottom: 8 }}>Product B</h4>
                  <HealthScoreGauge risks={result.risks} small />
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{result.risks.length} Risks Detected</p>
                </div>
              </div>
            </div>
          ) : (
            /* --- SINGLE ITEM VIEW --- */
            <>
              <div className="section-title"><BarChart3 size={22} /><h2>Overview</h2></div>
              <p style={{ marginBottom: 24 }}>{result.intent}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 30 }}>
                <div className="card" style={{ padding: 20 }}><RiskAnalysisChart risks={result.risks} /></div>
                <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "center" }}><HealthScoreGauge risks={result.risks} /></div>
              </div>
              <div className="section-title"><AlertTriangle size={22} /><h2>Risks & Insights</h2></div>
              {result.risks.map((r, i) => <ExpandableRiskCard key={i} risk={r} />)}
              <div className="section-title"><Scale size={22} /><h2>Trade-offs</h2></div>
              {result.tradeoffs.map((t, i) => <div key={i} className="card card-tradeoff reveal" style={{ marginBottom: 14 }}><strong>{t.title}</strong><p>{t.description}</p></div>)}
              {result.alternatives && <AlternativesSection alternatives={result.alternatives} />}
              <div className="section-title"><BarChart3 size={22} /><h2>Summary</h2></div>
              <p>{result.summary}</p>
              
              {/* ACTION BUTTONS */}
              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <button className="primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8 }} onClick={() => { const text = `Intent: ${result.intent}\nSummary: ${result.summary}`; navigator.clipboard.writeText(text); alert("Analysis copied to clipboard"); }}><Clipboard size={16} /> Copy</button>
                <button onClick={readSummary} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "10px" }}><Volume2 size={16} /> Listen</button>
                <button onClick={() => { if (navigator.share) { navigator.share({ title: 'FoodBuddy Analysis', text: result.summary }); } else { alert("Sharing not supported."); } }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: 'center', gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "10px" }}><Share2 size={16} /> Share</button>
              </div>

              {/* ASK FOLLOW-UP */}
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