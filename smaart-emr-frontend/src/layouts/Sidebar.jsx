import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

export default function Sidebar({ navItems, isOpen, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-72 border-r border-white/10 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">SMAART</p>
            <h2 className="text-2xl font-semibold tracking-tight">EMR</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 p-2 text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-3">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 text-white shadow-lg"
                    : "text-slate-200 hover:bg-white/10"
                }`
              }
            >
              {Icon ? <Icon size={17} /> : null}
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
