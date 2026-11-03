import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
  Pill,
  GitCompare
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Patients",
    path: "/patients",
    icon: Users,
  },
  {
    name: "ADR Assessment",
    path: "/assessment",
    icon: ClipboardCheck,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
  name: "Medicine Library",
  path: "/medicine-library",
  icon: Pill,
},
{
  name: "Compare Medicines",
  path: "/medicine-compare",
  icon: GitCompare,
},
];

function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();

    navigate("/", {
      replace: true,
    });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white">
      <div className="flex h-full flex-col">

        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label="Go to MedGuard dashboard"
          className="flex h-20 w-full items-center gap-3 border-b border-slate-200 px-6 text-left transition hover:bg-slate-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              MedGuard
            </h1>

            <p className="text-xs text-slate-500">
              Clinical Decision Support
            </p>
          </div>
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />

                  <span>
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom menu */}
        <div className="border-t border-slate-200 p-4">

          {/* Settings */}
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Settings className="h-5 w-5" />

            Settings
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />

            Logout
          </button>

        </div>

      </div>
    </aside>
  );
}

export default Sidebar;