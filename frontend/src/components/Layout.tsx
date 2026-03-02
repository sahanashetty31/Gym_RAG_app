import { Link, useLocation } from "react-router-dom";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/meals", label: "Log meals" },
  { to: "/meal-plans", label: "Meal plans" },
  { to: "/supplements", label: "Supplements" },
  { to: "/recovery", label: "Recovery" },
  { to: "/coach", label: "Coach chat" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          padding: "1.5rem 0",
        }}
      >
        <div style={{ padding: "0 1rem 1rem", borderBottom: "1px solid var(--border)", marginBottom: "1rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Nutrition & Recovery Coach</h1>
        </div>
        <nav>
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: "block",
                padding: "0.6rem 1.25rem",
                color: loc.pathname === to ? "var(--accent)" : "var(--textMuted)",
                fontWeight: loc.pathname === to ? 600 : 400,
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
