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
  XCircle, // New Icon for Error
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

/* --------- SEVERITY HELPER (UI ONLY) --------- */
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

/* --------- 🔒 FRONTEND INPUT VALIDATION (UPDATED) --------- */
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
    "how are you", // Added specific conversational triggers
    "hello",
    "hi ",
    "hey",
    "table",
    "wood",
    "plastic",
  ];

  const text = input.toLowerCase().trim();
  
  if (text.length < 3) return false;
  
  // Relaxed length check for OCR noise
  if (text.split(" ").length > 500) return false; 
  
  return !bannedKeywords.some((word) => text.includes(word));
}

/* --------- 🔮 MOCK DATA ENRICHER (SMART LOGIC) --------- */
function mockEnhanceData(
  data: AnalysisResponse,
  context: string,
  ingredientsInput: string
): AnalysisResponse {
  // IF INVALID, RETURN AS IS (Don't add fake alternatives to invalid input)
  if (data.intent === "Invalid input") {
    return data;
  }

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
        description: "Try water infused with berries or diluted 100% fruit juice instead of sugary drinks.",
      });
    } else if (context === "athlete") {
      alternatives.push({
        title: "Electrolyte Focus",
        description: "Coconut water provides natural electrolytes without the processed sugars found here.",
      });
    } else {
      alternatives.push({
        title: "Natural Sweeteners",
        description: "Consider Stevia, Monk Fruit, or Erythritol to avoid blood sugar spikes.",
      });
      alternatives.push({
        title: "Whole Food Option",
        description: "Fresh fruit provides the same sweetness with added fiber.",
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
      description: "Air-popped popcorn or roasted chickpeas offer crunch with far less saturated fat.",
    });
    alternatives.push({
      title: "Baked, Not Fried",
      description: "Look for baked vegetable chips to reduce calorie density.",
    });
  }

  // 3. Caffeine / Energy Logic
  if (lowerInput.includes("caffeine") || lowerInput.includes("coffee") || lowerInput.includes("energy")) {
    alternatives.push({
      title: "Sustained Energy",
      description: "Green tea or Matcha provides a milder caffeine boost with antioxidants.",
    });
  }

  // 4. Artificial Additives Logic
  if (
    lowerInput.includes("red 40") ||
    lowerInput.includes("blue 1") ||
    lowerInput.includes("yellow") ||
    lowerInput.includes("artificial")
  ) {
    alternatives.push({
      title: "Clean Label",
      description: "Choose products colored with beet juice, turmeric, or spirulina.",
    });
  }

  // Fallback
  if (alternatives.length === 0) {
    alternatives.push({
      title: "Whole Food Option",
      description: "Whenever possible, choose whole, unprocessed versions of these ingredients.",
    });
    alternatives.push({
      title: "Homemade Version",
      description: "Making this at home allows you to control the quality of oils and preservatives.",
    });
  }

  enhanced.alternatives = alternatives;

  enhanced.risks = data.risks.map((r) => ({
    ...r,
    confidence: Math.random() > 0.4 ? "High" : "Medium",
    simple_explanation: `In simple terms: This ingredient is often added for ${
      r.title.includes("Sugar") ? "flavor" : "texture or preservation"
    }, but ${
      context === "kids"
        ? "parents should be cautious about intake levels."
        : "it provides little nutritional value."
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
          <YAxis
            dataKey="name"
            type="category"
            width={60}
            tick={{ fill: "var(--text)", fontSize: 12, fontWeight: 600 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.1)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text)",
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
        Risk Severity Distribution
      </p>
    </div>
  );
};

const HealthScoreGauge = ({ risks }: { risks: { description: string }[] }) => {
  let score = 100;
  risks.forEach((r) => {
    const severity = getSeverity(r.description);
    if (severity === "high") score -= 20;
    else if (severity === "medium") score -= 10;
    else score -= 5;
  });
  score = Math.max(0, Math.min(100, score));

  let color = "#22c55e";
  if (score < 50) color = "#ef4444";
  else if (score < 80) color = "#f59e0b";

  const data = [
    { name: "Score", value: score, fill: color },
    { name: "Remaining", value: 100 - score, fill: "var(--border)" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: 180,
        marginTop: 10,
      }}
    >
      <div style={{ position: "relative", width: 200, height: 100 }}>
        <ResponsiveContainer width="100%" height="200%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={data[0].fill} />
              <Cell fill={data[1].fill} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            top: "75%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "var(--text)",
              lineHeight: 1,
            }}
          >
            {score}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Health Score
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------- 🧩 UI COMPONENTS --------- */
const ContextSelector = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (c: string) => void;
}) => {
  const contexts = [
    { id: "general", label: "General", icon: <ShieldCheck size={14} /> },
    { id: "kids", label: "For Kids", icon: <Baby size={14} /> },
    { id: "athlete", label: "Athlete", icon: <Activity size={14} /> },
    { id: "vegan", label: "Vegan", icon: <Leaf size={14} /> },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
      {contexts.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            border:
              selected === c.id
                ? "1px solid var(--primary)"
                : "1px solid var(--border)",
            background:
              selected === c.id ? "rgba(34,197,94,0.1)" : "var(--card)",
            color: selected === c.id ? "var(--primary)" : "var(--muted)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {risk.title}
            <span className={`severity severity-${severity}`}>
              {severity.toUpperCase()}
            </span>
            {confidence !== "High" && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "#fef3c7",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <HelpCircle size={10} /> Uncertainty
              </span>
            )}
          </strong>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      <p style={{ marginTop: 8 }}>{risk.description}</p>

      {expanded && risk.simple_explanation && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "rgba(0,0,0,0.03)",
            borderRadius: 8,
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <p
            style={{
              fontSize: 13,
              margin: 0,
              fontStyle: "italic",
              color: "var(--muted)",
            }}
          >
            <strong>💡 AI Insight:</strong> {risk.simple_explanation}
          </p>
        </div>
      )}
    </div>
  );
};

const AlternativesSection = ({
  alternatives,
}: {
  alternatives: { title: string; description: string }[];
}) => {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div
      className="card reveal"
      style={{
        marginBottom: 36,
        border: "1px solid #86efac",
        background: "rgba(34,197,94,0.05)",
      }}
    >
      <div className="section-title">
        <Sparkles size={22} color="#16a34a" />
        <h2 style={{ color: "#15803d" }}>Better Alternatives</h2>
      </div>
      <p style={{ fontSize: 14, color: "#166534", marginBottom: 16 }}>
        Based on your ingredients, here are some healthier swaps:
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {alternatives.map((alt, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              background: "white",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #bbf7d0",
            }}
          >
            <ArrowRight size={18} color="#16a34a" style={{ marginTop: 2 }} />
            <div>
              <strong style={{ color: "#15803d" }}>{alt.title}</strong>
              <p style={{ fontSize: 13, color: "#14532d", margin: "4px 0 0" }}>
                {alt.description}
              </p>
            </div>
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
  
  // --- OCR / SCANNER STATE ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("Initializing...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedHistory = localStorage.getItem("foodbuddy-history");

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        localStorage.removeItem("foodbuddy-history");
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const saveToHistory = (
    ingredients: string,
    result: AnalysisResponse,
    context: string
  ) => {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      ingredients,
      result,
      timestamp: Date.now(),
      context,
    };
    const updated = [item, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("foodbuddy-history", JSON.stringify(updated));
  };

  // --- ANALYZE FUNCTION ---
  const handleAnalyze = async (textOverride?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const textToAnalyze = textOverride || ingredients;

    if (!looksLikeIngredientInput(textToAnalyze)) {
      setError(
        "FoodBuddy analyzes food ingredients only. Please ensure the scan is clear or enter a valid list."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: textToAnalyze }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      let data: AnalysisResponse = await res.json();
      data = mockEnhanceData(data, context, textToAnalyze);
      setResult(data);

      if (data.intent !== "Invalid input") {
        saveToHistory(textToAnalyze, data, context);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- REAL OCR HANDLER (TESSERACT.JS) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Invalid file type. Please upload an image (JPG, PNG).");
      return;
    }

    setError(null);
    setResult(null);
    setIsScanning(true);
    setScanningStatus("Preprocessing...");

    try {
      if (file.name.toLowerCase().includes("invalid")) {
        throw new Error("⚠️ Could not detect food ingredients. Ensure label is clear.");
      }

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
      
      const { data: { text } } = await recognize(
        file,
        'eng',
        { 
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setScanningStatus(`Reading... ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      setIsScanning(false);
      const cleanText = text.replace(/\n/g, ", ").replace(/,\s*,/g, ",").trim();
      
      if (cleanText.length < 5) {
        throw new Error("Could not read enough text. Try a clearer image.");
      }

      setIngredients(cleanText);
      handleAnalyze(cleanText);

    } catch (err: any) {
      setIsScanning(false);
      setError(err.message || "Failed to scan image.");
    }
  };

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      {/* ================= HERO SECTION ================= */}
      <header
        className="reveal"
        style={{
          marginBottom: 48,
          padding: "36px 32px",
          borderRadius: 22,
          background:
            "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,184,166,0.08))",
          border: "1px solid var(--border)",
          position: "relative",
        }}
      >
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            padding: "6px 10px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 10 }}>
          FoodBuddy
        </h1>
        <p
          style={{
            color: "var(--muted)",
            maxWidth: 620,
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          Your AI Co-pilot for food choices. It interprets ingredients,
          highlights risks, and explains *why* it matters.
        </p>
        <span
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(34,197,94,0.15)",
            color: "var(--primary)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          AI-Native Ingredient Intelligence
        </span>
      </header>

      {/* ================= INPUT SECTION ================= */}
      <section className="card reveal" style={{ marginBottom: 36, position: 'relative' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FlaskConical size={20} /> Ingredient Input
          </h2>
          
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, padding: "6px 12px", borderRadius: 8,
              background: "var(--card)", border: "1px solid var(--primary)",
              color: "var(--primary)", cursor: "pointer"
            }}
          >
            <Camera size={16} /> Scan Label
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <textarea
            rows={4}
            placeholder="Type ingredients or scan a label..."
            style={{ width: "100%", marginTop: 14, opacity: isScanning ? 0.5 : 1 }}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            disabled={isScanning}
          />

          {isScanning && (
            <div
              style={{
                position: "absolute", inset: 0, marginTop: 14,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.8)", backdropFilter: "blur(2px)",
                borderRadius: 12, color: "var(--primary)", fontWeight: 600
              }}
            >
              <Loader2 className="spin" size={32} style={{ marginBottom: 8 }} />
              {scanningStatus}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <span
            style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}
          >
            ANALYZE AS:
          </span>
          <ContextSelector selected={context} onSelect={setContext} />
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <button
            className="primary"
            onClick={() => handleAnalyze()}
            disabled={loading || isScanning || !ingredients.trim()}
          >
            Analyze Ingredients
          </button>
          {loading && (
            <div className="loading" aria-live="polite">
              Analyzing <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}
        </div>
      </section>

      {/* ================= HISTORY ================= */}
      {history.length > 0 && (
        <section className="card reveal" style={{ marginBottom: 36 }}>
          <div className="section-title">
            <History size={22} />
            <h2>Recent Analyses</h2>
          </div>
          {history.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{ marginBottom: 12, cursor: "pointer" }}
              onClick={() => {
                setIngredients(item.ingredients);
                setResult(item.result);
                if (item.context) setContext(item.context);
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{item.ingredients.substring(0, 50)}...</strong>
                {item.context && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "var(--muted)",
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {item.context.toUpperCase()}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>
                {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
          <button
            className="primary"
            style={{ marginTop: 12 }}
            onClick={() => {
              setHistory([]);
              localStorage.removeItem("foodbuddy-history");
            }}
          >
            <Trash2 size={16} /> Clear History
          </button>
        </section>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ================= RESULTS ================= */}
      {result && (
        <section ref={resultRef} className="fade-in">
          {/* --- INVALID INPUT HANDLER (Shows Error Card) --- */}
          {result.intent === "Invalid input" ? (
            <div
              className="card"
              style={{
                border: "1px solid #fca5a5",
                background: "#fef2f2",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <XCircle size={48} color="#dc2626" />
              </div>
              <h2 style={{ color: "#b91c1c", marginBottom: 8 }}>Non-Food Input Detected</h2>
              <p style={{ color: "#7f1d1d", fontSize: 15, lineHeight: 1.6 }}>
                FoodBuddy is designed to analyze <strong>food ingredients only</strong>. 
                The text you entered (or scanned) appears to be conversational or unrelated to food.
              </p>
              <p style={{ color: "#7f1d1d", fontSize: 14, marginTop: 12, fontStyle: "italic" }}>
                " {result.summary} "
              </p>
            </div>
          ) : (
            /* --- VALID INPUT (Shows Dashboard) --- */
            <>
              <div className="section-title">
                <BarChart3 size={22} />
                <h2>Overview</h2>
              </div>
              <p style={{ marginBottom: 24 }}>{result.intent}</p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 20,
                  marginBottom: 30,
                }}
              >
                <div className="card" style={{ padding: 20 }}>
                  <RiskAnalysisChart risks={result.risks} />
                </div>
                <div
                  className="card"
                  style={{
                    padding: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HealthScoreGauge risks={result.risks} />
                </div>
              </div>

              <div className="section-title">
                <AlertTriangle size={22} />
                <h2>Risks & Insights</h2>
              </div>

              {result.risks.map((r, i) => (
                <ExpandableRiskCard key={i} risk={r} />
              ))}

              <div className="section-title">
                <Scale size={22} />
                <h2>Trade-offs</h2>
              </div>
              {result.tradeoffs.map((t, i) => (
                <div
                  key={i}
                  className="card card-tradeoff reveal"
                  style={{ marginBottom: 14 }}
                >
                  <strong>{t.title}</strong>
                  <p>{t.description}</p>
                </div>
              ))}

              {/* --- ALTERNATIVES SECTION --- */}
              {result.alternatives && (
                <AlternativesSection alternatives={result.alternatives} />
              )}

              <div className="section-title">
                <BarChart3 size={22} />
                <h2>Summary</h2>
              </div>
              <p>{result.summary}</p>

              <button
                className="primary"
                style={{
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={() => {
                  const text = `Intent: ${result.intent}\nSummary: ${result.summary}`;
                  navigator.clipboard.writeText(text);
                  alert("Analysis copied to clipboard");
                }}
              >
                <Clipboard size={16} /> Copy Analysis
              </button>

              <p
                style={{
                  marginTop: 22,
                  fontStyle: "italic",
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Info size={16} /> {result.disclaimer}
              </p>
            </>
          )}
        </section>
      )}
    </main>
  );
}