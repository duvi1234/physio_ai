import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

export default function Sidebar({ navItems, isOpen, onClose, userRole }) {
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-80 border-r border-white/10 
        bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 
        px-8 py-8 text-white shadow-2xl transition-transform duration-300 
        lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
              SMAART
            </p>
            <h2 className="text-3xl font-bold tracking-tight">EMR</h2>

            {userRole && (
              <span className="mt-3 inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
                {userRole}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 p-2 text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-4">
          {navItems.map(
            ({ label, to, icon: Icon, action, danger, end = true }, idx) =>
              action ? (
                <button
                  key={`action-${label}-${idx}`}
                  type="button"
                  onClick={() => {
                    action();
                    onClose();
                  }}
                  className={`group flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-sm transition-all duration-300 ${
                    danger
                      ? "text-rose-200 hover:bg-rose-500/20"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {Icon && (
                    <Icon
                      size={18}
                      className="transition-transform group-hover:scale-110"
                    />
                  )}
                  <span className="font-medium tracking-wide">
                    {label}
                  </span>
                </button>
              ) : (
                <NavLink
                  key={`${to}-${label}-${idx}`}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-4 rounded-2xl px-5 py-4 text-sm transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600 text-white shadow-xl"
                        : "text-slate-300 hover:bg-white/10"
                    }`
                  }
                >
                  {Icon && (
                    <Icon
                      size={18}
                      className="transition-transform group-hover:scale-110"
                    />
                  )}
                  <span className="font-medium tracking-wide">
                    {label}
                  </span>
                </NavLink>
              )
          )}
        </nav>

        {/* Footer */}
        <div className="mt-16 border-t border-white/10 pt-6 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} SMAART Healthcare</p>
          <p className="mt-1">Enterprise EMR Platform</p>
        </div>
      </aside>
    </>
  );
}