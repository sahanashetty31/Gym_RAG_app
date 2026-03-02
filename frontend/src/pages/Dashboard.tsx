import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listClients, createClient, ingestDocs, type ClientProfile } from "../api/client";

export default function Dashboard() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<string | null>(null);

  useEffect(() => {
    listClients().then(setClients).catch(console.error).finally(() => setLoading(false));
  }, []);

  const runIngest = () => {
    setIngesting(true);
    setIngestResult(null);
    ingestDocs()
      .then((r) => setIngestResult(`Ingested ${r.ingested_chunks} chunks.`))
      .catch((e) => setIngestResult(`Error: ${e.message}`))
      .finally(() => setIngesting(false));
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: "var(--textMuted)", marginBottom: "1.5rem" }}>
        Manage clients and use the coach for meal plans, supplements, and recovery.
      </p>

      <section style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Knowledge base</h2>
        <p style={{ margin: 0, color: "var(--textMuted)", fontSize: "0.9rem" }}>
          Ingest nutrition and recovery docs so the coach can use them. Run after adding files under backend/data/docs.
        </p>
        <button
          onClick={runIngest}
          disabled={ingesting}
          style={{
            marginTop: "0.75rem",
            padding: "0.5rem 1rem",
            background: "var(--accent)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {ingesting ? "Ingesting…" : "Ingest documents"}
        </button>
        {ingestResult && <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>{ingestResult}</p>}
      </section>

      <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Clients</h2>
      {loading ? (
        <p style={{ color: "var(--textMuted)" }}>Loading…</p>
      ) : clients.length === 0 ? (
        <p style={{ color: "var(--textMuted)" }}>No clients yet. Create one below to start logging meals and using the coach.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {clients.map((c) => (
            <li
              key={c.id}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                padding: "1rem 1.25rem",
                marginBottom: "0.5rem",
                border: "1px solid var(--border)",
              }}
            >
              <strong>{c.name}</strong> · {c.goal}
              {c.target_calories != null && ` · ${c.target_calories} kcal`}
              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                <Link to="/meals" style={{ marginRight: "1rem" }}>Log meal</Link>
                <Link to="/coach" style={{ marginRight: "1rem" }}>Coach</Link>
                <Link to="/meal-plans">Meal plan</Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ClientForm onCreated={() => listClients().then(setClients)} />
    </div>
  );
}

function ClientForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("maintain");
  const [targetCal, setTargetCal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    createClient({
      name: name.trim(),
      goal,
      target_calories: targetCal ? Number(targetCal) : null,
    })
      .then(() => {
        setName("");
        setTargetCal("");
        onCreated();
      })
      .catch(console.error)
      .finally(() => setSubmitting(false));
  };

  return (
    <section style={{ marginTop: "2rem", background: "var(--surface)", borderRadius: "var(--radius)", padding: "1.25rem", border: "1px solid var(--border)" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Add client</h2>
      <form onSubmit={submit} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Client name"
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", width: 180 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Goal</span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)" }}
          >
            <option value="maintain">Maintain</option>
            <option value="lose_fat">Lose fat</option>
            <option value="gain_muscle">Gain muscle</option>
            <option value="performance">Performance</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Target kcal (optional)</span>
          <input
            type="number"
            value={targetCal}
            onChange={(e) => setTargetCal(e.target.value)}
            placeholder="e.g. 2200"
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", width: 100 }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 8, fontWeight: 600 }}
        >
          {submitting ? "Adding…" : "Add client"}
        </button>
      </form>
    </section>
  );
}
