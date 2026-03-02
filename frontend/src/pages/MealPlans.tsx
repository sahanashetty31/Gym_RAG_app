import { useEffect, useState } from "react";
import { listClients, getMealPlan, type ClientProfile } from "../api/client";

export default function MealPlansPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [clientId, setClientId] = useState<number | "">("");
  const [days, setDays] = useState(7);
  const [focus, setFocus] = useState("");
  const [result, setResult] = useState<{ plan_summary: string; sources?: { content: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listClients().then(setClients).catch(console.error);
  }, []);

  const fetchPlan = () => {
    if (clientId === "") return;
    setLoading(true);
    setResult(null);
    getMealPlan(Number(clientId), days, focus || undefined)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Meal plans</h1>
      <p style={{ color: "var(--textMuted)", marginBottom: "1.5rem" }}>
        Get a meal plan tailored to the selected client’s goals (from the knowledge base).
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Client</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", minWidth: 180 }}
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Days</span>
          <input
            type="number"
            min={1}
            max={14}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", width: 70 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Focus (optional)</span>
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. high_protein, low_carb"
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", width: 160 }}
          />
        </label>
        <button
          onClick={fetchPlan}
          disabled={loading || clientId === ""}
          style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 8, fontWeight: 600 }}
        >
          {loading ? "Loading…" : "Get meal plan"}
        </button>
      </div>

      {result && (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "1.25rem", border: "1px solid var(--border)" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Plan summary</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontSize: "0.9rem", color: "var(--text)", fontFamily: "var(--font)" }}>
            {result.plan_summary}
          </pre>
        </div>
      )}
    </div>
  );
}
