import { useEffect, useState } from "react";
import { listClients, getRecoveryProtocols, type ClientProfile } from "../api/client";

export default function RecoveryPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [clientId, setClientId] = useState<number | "">("");
  const [context, setContext] = useState("");
  const [protocols, setProtocols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listClients().then(setClients).catch(console.error);
  }, []);

  const fetchProtocols = () => {
    if (clientId === "") return;
    setLoading(true);
    setProtocols([]);
    getRecoveryProtocols(Number(clientId), context || undefined)
      .then((r) => setProtocols(r.protocols || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Recovery protocols</h1>
      <p style={{ color: "var(--textMuted)", marginBottom: "1.5rem" }}>
        Get recovery protocols tailored to the client (e.g. post heavy leg day).
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
          <span style={{ fontSize: "0.85rem", color: "var(--textMuted)" }}>Context (optional)</span>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. post heavy leg day"
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", width: 220 }}
          />
        </label>
        <button
          onClick={fetchProtocols}
          disabled={loading || clientId === ""}
          style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 8, fontWeight: 600 }}
        >
          {loading ? "Loading…" : "Get protocols"}
        </button>
      </div>

      {protocols.length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "1.25rem", border: "1px solid var(--border)" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Protocols</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {protocols.map((p, i) => (
              <li key={i} style={{ marginBottom: "0.75rem", whiteSpace: "pre-wrap" }}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
