import { useEffect, useState } from "react";
import {
  listClients,
  listMeals,
  logMeal,
  logMealImage,
  type ClientProfile,
  type MealLogEntry,
  type MealItem,
} from "../api/client";

export default function MealLogPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [meals, setMeals] = useState<MealLogEntry[]>([]);
  const [clientId, setClientId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    listClients().then(setClients).catch(console.error);
    listMeals(clientId || undefined).then(setMeals).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (clientId !== "") listMeals(Number(clientId)).then(setMeals).catch(console.error);
    else listMeals().then(setMeals).catch(console.error);
  }, [clientId]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Log meals</h1>
      <p style={{ color: "var(--textMuted)", marginBottom: "1.5rem" }}>
        Log intake manually or scan a meal (OCR). Select a client first.
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <span style={{ color: "var(--textMuted)" }}>Client</span>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", minWidth: 200 }}
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      {clientId !== "" && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <ManualLogForm clientId={Number(clientId)} onLogged={load} />
          <OCRLogForm clientId={Number(clientId)} onLogged={load} />
        </div>
      )}

      <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Recent meals</h2>
      {loading ? (
        <p style={{ color: "var(--textMuted)" }}>Loading…</p>
      ) : meals.length === 0 ? (
        <p style={{ color: "var(--textMuted)" }}>No meals logged yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {meals.map((m) => {
            let items: MealItem[] = [];
            try {
              items = JSON.parse(m.items);
            } catch {}
            return (
              <li
                key={m.id}
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius)",
                  padding: "1rem 1.25rem",
                  marginBottom: "0.5rem",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{m.meal_type}</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>
                    {new Date(m.logged_at).toLocaleString()} · {m.source}
                  </span>
                </div>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", color: "var(--textMuted)", fontSize: "0.9rem" }}>
                  {items.map((i, idx) => (
                    <li key={idx}>
                      {i.name}
                      {i.calories != null && ` (${i.calories} cal)`}
                      {i.protein_g != null && ` · ${i.protein_g}g pro`}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ManualLogForm({ clientId, onLogged }: { clientId: number; onLogged: () => void }) {
  const [mealType, setMealType] = useState("lunch");
  const [itemsText, setItemsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const lines = itemsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const items: MealItem[] = lines.map((name) => ({ name }));
    if (items.length === 0) {
      setError("Enter at least one item (one per line).");
      return;
    }
    setSubmitting(true);
    logMeal(clientId, mealType, items)
      .then(() => {
        setItemsText("");
        setSuccess(true);
        onLogged();
        setTimeout(() => setSuccess(false), 3000);
      })
      .catch((err: Error) => setError(err.message || "Failed to log meal"))
      .finally(() => setSubmitting(false));
  };

  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "1.25rem", border: "1px solid var(--border)", minWidth: 280 }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Manual log</h3>
      {error && (
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--danger)" }}>{error}</p>
      )}
      {success && (
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--accent)" }}>Meal logged.</p>
      )}
      <form onSubmit={submit}>
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Meal type</span>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            style={{ display: "block", marginTop: "0.25rem", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", width: "100%" }}
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </label>
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Items (one per line)</span>
          <textarea
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            placeholder="Chicken breast&#10;Rice&#10;Broccoli"
            rows={4}
            style={{ display: "block", marginTop: "0.25rem", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", width: "100%", resize: "vertical" }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 8, fontWeight: 600 }}
        >
          {submitting ? "Logging…" : "Log meal"}
        </button>
      </form>
    </div>
  );
}

function OCRLogForm({ clientId, onLogged }: { clientId: number; onLogged: () => void }) {
  const [mealType, setMealType] = useState("lunch");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Select an image first.");
      return;
    }
    setSubmitting(true);
    logMealImage(clientId, mealType, file)
      .then(() => {
        setFile(null);
        setFileInputKey((k) => k + 1);
        setSuccess(true);
        onLogged();
        setTimeout(() => setSuccess(false), 3000);
      })
      .catch((err: Error) => setError(err.message || "Failed to scan & log meal"))
      .finally(() => setSubmitting(false));
  };

  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "1.25rem", border: "1px solid var(--border)", minWidth: 280 }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Scan meal (OCR)</h3>
      {error && (
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--danger)" }}>{error}</p>
      )}
      {success && (
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--accent)" }}>Meal scanned and logged.</p>
      )}
      <form onSubmit={submit}>
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Meal type</span>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            style={{ display: "block", marginTop: "0.25rem", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", width: "100%" }}
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </label>
        <label style={{ display: "block", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Photo of meal / receipt</span>
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
            style={{ display: "block", marginTop: "0.25rem", color: "var(--text)" }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !file}
          style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 8, fontWeight: 600 }}
        >
          {submitting ? "Scanning…" : "Scan & log"}
        </button>
      </form>
    </div>
  );
}
