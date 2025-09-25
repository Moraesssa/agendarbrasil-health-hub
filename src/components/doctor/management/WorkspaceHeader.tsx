import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface WorkspaceHeaderProps {
  actions?: ReactNode;
}

const NAV_ITEMS = [
  { to: "/perfil-medico", label: "Perfil" },
  { to: "/gerenciar-agenda", label: "Horários" },
  { to: "/gerenciar-locais", label: "Locais" },
  { to: "/agenda-medico", label: "Agenda" },
];

export const WorkspaceHeader = ({ actions }: WorkspaceHeaderProps) => {
  return (
    <header className="bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 text-white font-semibold flex items-center justify-center">
            AB
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-500">Plataforma médica</span>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-emerald-500 bg-clip-text text-transparent">
              AgendarBrasil
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "transition-colors hover:text-blue-600",
                  isActive
                    ? "text-blue-600 after:absolute after:-bottom-3 after:left-0 after:h-0.5 after:w-full after:bg-blue-500 relative"
                    : undefined,
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {actions}
        </div>
      </div>
    </header>
  );
};
