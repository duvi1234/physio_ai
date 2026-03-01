import { Bell, LogOut, Menu } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function Header({ title, onMenuClick, action }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    const nextPath = String(user?.role || "").toUpperCase() === "PATIENT" ? "/patient/login" : "/staff/login";
    window.location.href = nextPath;
  };

  return (
    <header className="sticky top-0 z-30 px-4 py-4 md:px-8">
      <div className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/20 p-4 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-white/30 bg-white/20 p-2 text-slate-700 lg:hidden"
          >
            <Menu size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="text-xs text-slate-600">Hospital-grade workflow control</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {action}
          <button type="button" className="rounded-xl border border-white/30 bg-white/20 p-2 text-slate-700">
            <Bell size={18} />
          </button>
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-slate-900">{user?.name || "User"}</p>
            <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
              {user?.role || "ROLE"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
