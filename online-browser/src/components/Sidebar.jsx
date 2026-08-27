import { NavLink, useNavigate } from "react-router-dom";

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">💼</div>
          <div>
            <h2>WhatsApp Job Finder</h2>
            <span>Job search dashboard</span>
          </div>
        </div>

        <nav onClick={onClose}>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
            👤 Profile
          </NavLink>
          <NavLink to="/jobs" className={({ isActive }) => (isActive ? "active" : "")}>
            💼 Jobs
          </NavLink>
          <NavLink to="/applications" className={({ isActive }) => (isActive ? "active" : "")}>
            📋 Applications
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button type="button" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
