import { useState } from "react";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="main-header">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <strong>WhatsApp Job Finder</strong>
        </header>
        {children}
      </div>
    </div>
  );
}

export default Layout;
