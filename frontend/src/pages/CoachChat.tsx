import { useEffect, useState, useRef } from "react";
import { listClients, coachChat, type ClientProfile } from "../api/client";

type Message = { role: "user" | "assistant"; content: string; sources?: { content: string }[] };

export default function CoachChatPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [clientId, setClientId] = useState<number | "">("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listClients().then(setClients).catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || clientId === "") return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    coachChat(Number(clientId), userMsg.content)
      .then((r) => {
        setMessages((m) => [...m, { role: "assistant", content: r.reply, sources: r.sources }]);
      })
      .catch((e) => {
        setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Coach chat</h1>
      <p style={{ color: "var(--textMuted)", marginBottom: "1.5rem" }}>
        Ask the coach anything about nutrition, meal plans, supplements, or recovery. Responses use your knowledge base and client profile.
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <span style={{ color: "var(--textMuted)" }}>Client</span>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value === "" ? "" : Number(e.target.value))}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", minWidth: 200 }}
        >
          <option value="">Select client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          minHeight: 360,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
          {messages.length === 0 && (
            <p style={{ color: "var(--textMuted)", margin: 0 }}>Send a message to start. Example: “What’s a good post-workout meal for muscle gain?”</p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                background: msg.role === "user" ? "var(--surface2)" : "var(--bg)",
                borderLeft: msg.role === "assistant" ? "3px solid var(--accent)" : "none",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.25rem", fontSize: "0.85rem" }}>
                {msg.role === "user" ? "You" : "Coach"}
              </div>
              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</div>
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <details style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--textMuted)" }}>
                  <summary>Sources</summary>
                  {msg.sources.map((s, j) => (
                    <div key={j} style={{ marginTop: "0.25rem" }}>{s.content?.slice(0, 200)}…</div>
                  ))}
                </details>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ color: "var(--textMuted)", padding: "0.75rem" }}>Coach is typing…</div>
          )}
          <div ref={bottomRef} />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          style={{ padding: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about nutrition, supplements, recovery…"
            disabled={clientId === "" || loading}
            style={{
              flex: 1,
              padding: "0.6rem 0.75rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              color: "var(--text)",
            }}
          />
          <button
            type="submit"
            disabled={clientId === "" || loading || !input.trim()}
            style={{ padding: "0.6rem 1.25rem", background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 8, fontWeight: 600 }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
