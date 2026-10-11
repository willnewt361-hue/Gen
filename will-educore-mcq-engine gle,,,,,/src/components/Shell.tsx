"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface ShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/subjects", label: "Subjects", icon: "📚" },
  { href: "/configure", label: "Start Practice", icon: "🎯" },
  { href: "/attempts", label: "History", icon: "📋" },
];

export default function Shell({ children }: ShellProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const pathname = usePathname();

  // Theme management — prevent flash of wrong theme
  useEffect(() => {
    const saved = localStorage.getItem("will-theme") as "light" | "dark" | null;
    const initial = saved || "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("will-theme", theme);
  }, [theme]);

  // Online/offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/subjects") return "Subjects";
    if (pathname === "/configure") return "Configure Session";
    if (pathname === "/attempts") return "Attempt History";
    if (pathname.startsWith("/session/")) return "Question Player";
    if (pathname.startsWith("/results/")) return "Results";
    if (pathname.startsWith("/review/")) return "Answer Review";
    return "Will EduCore";
  };

  return (
    <div className="app-shell">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <span style={{ fontSize: "1.5rem" }}>🎓</span>
          <div>
            <h1>Will</h1>
            <span className="brand-tag">EduCore</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: "8px" }}>
            <div className="connection-indicator">
              <span className={`connection-dot${isOnline ? "" : " offline"}`} />
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
          Mengo Senior School · Demo
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button
              className="mobile-header-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <h2>{getPageTitle()}</h2>
          </div>
          <div className="header-right">
            {!isOnline && (
              <div className="connection-indicator">
                <span className="connection-dot offline" />
                <span style={{ fontSize: "0.75rem" }}>Offline</span>
              </div>
            )}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
