"use client";
import { useEffect, useRef, useState } from "react";
import {
  FlaskConical,
  AlertTriangle,
  Scale,
  BarChart3,
  Info,
  Clipboard
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type AnalysisResponse = {
  intent: string;
  risks: { title: string; description: string }[];
  tradeoffs: { title: string; description: string }[];
  summary: string;
  disclaimer: string;
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

/* ---------------- PAGE ---------------- */
export default function Page() {
  const [ingredients, setIngredients] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const resultRef = useRef<HTMLDivElement | null>(null);

  /* --------- THEME HANDLING --------- */
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial = saved ?? "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  /* --------- ANALYZE --------- */
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data: AnalysisResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        {/* Dark Mode Toggle */}
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
          Your friendly AI companion that explains food ingredients,
          highlights health risks, and helps you make informed choices.
        </p>

        {/* Brand Badge */}
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
          AI-Powered Ingredient Intelligence
        </span>
      </header>

      {/* ================= INPUT ================= */}
      <section className="card reveal" style={{ marginBottom: 36 }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FlaskConical size={20} /> Ingredient Input
        </h2>

        <textarea
          rows={4}
          placeholder="Sugar, Palm oil, Artificial color, Preservative E202"
          style={{ width: "100%", marginTop: 14 }}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />

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
            onClick={handleAnalyze}
            disabled={loading || !ingredients.trim()}
          >
            Analyze Ingredients
          </button>

          {loading && (
            <div className="loading" aria-live="polite">
              Analyzing
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}
        </div>
      </section>

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ================= RESULTS ================= */}
      {result && (
        <section ref={resultRef} className="fade-in">
          {/* OVERVIEW */}
          <div className="section-title">
            <BarChart3 size={22} />
            <h2>Overview</h2>
          </div>
          <p style={{ marginBottom: 24 }}>{result.intent}</p>

          {/* RISKS */}
          <div className="section-title">
            <AlertTriangle size={22} />
            <h2>Risks</h2>
          </div>

          {result.risks.map((r, i) => {
            const severity = getSeverity(r.description);
            return (
              <div
                key={i}
                className="card card-risk reveal"
                style={{ marginBottom: 14 }}
              >
                <strong>
                  {r.title}
                  <span className={`severity severity-${severity}`}>
                    {severity.toUpperCase()}
                  </span>
                </strong>
                <p>{r.description}</p>
              </div>
            );
          })}

          {/* TRADE-OFFS */}
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

          {/* SUMMARY */}
          <div className="section-title">
            <BarChart3 size={22} />
            <h2>Summary</h2>
          </div>
          <p>{result.summary}</p>

          {/* COPY */}
          <button
            className="primary"
            style={{
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={() => {
              const text = `
Intent:
${result.intent}

Risks:
${result.risks.map(r => `- ${r.title}: ${r.description}`).join("\n")}

Trade-offs:
${result.tradeoffs.map(t => `- ${t.title}: ${t.description}`).join("\n")}

Summary:
${result.summary}
              `;
              navigator.clipboard.writeText(text);
              alert("Analysis copied to clipboard");
            }}
          >
            <Clipboard size={16} /> Copy Analysis
          </button>

          {/* DISCLAIMER */}
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
        </section>
      )}
    </main>
  );
}
