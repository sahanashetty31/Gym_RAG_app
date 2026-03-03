import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Layout.css";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setMenuOpen(false);
    };
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);

  return (
    <div className="layout">
      <button
        type="button"
        className="layout-menu-toggle"
        aria-label="Toggle menu"
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className="layout-menu-toggle-bar" />
        <span className="layout-menu-toggle-bar" />
        <span className="layout-menu-toggle-bar" />
      </button>

      {menuOpen && isMobile && (
        <div
          className="layout-backdrop"
          onClick={() => setMenuOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMenuOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`layout-aside ${menuOpen && isMobile ? "layout-aside-open" : ""}`}
      >
        <div className="layout-brand">
          <img src="/logo.png" alt="Flex Fitness" className="layout-logo" />
          <h1 className="layout-title">FLEX FITNESS</h1>
        </div>
        <nav className="layout-nav">
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`layout-nav-link ${loc.pathname === to ? "layout-nav-link-active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}
