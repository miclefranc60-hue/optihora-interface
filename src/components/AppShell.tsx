import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/components/SchoolProvider";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Tableau de bord", icon: "◧" },
  { to: "/emploi-du-temps", label: "Emploi du temps", icon: "▦" },
  { to: "/classes", label: "Classes", icon: "◎" },
  { to: "/enseignants", label: "Enseignants", icon: "◉" },
  { to: "/salles", label: "Salles", icon: "▣" },
  { to: "/parametres", label: "Paramètres", icon: "⚙" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { establishment, saveError } = useSchool();
  const navigate = useNavigate();
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); };
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar p-5 md:flex">
        <div className="mb-10 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">O</div>
          <span className="font-display text-xl font-bold tracking-tight">OptiHora</span>
        </div>
        <nav className="flex flex-col gap-1">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-primary" }}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3 rounded-xl bg-sidebar-accent p-4 text-xs text-muted-foreground">
          <div><p className="font-semibold text-foreground">{establishment.name || "Mon établissement"}</p><p>{[establishment.type, establishment.city].filter(Boolean).join(" · ")}</p></div>
          {saveError && <p role="alert" className="text-destructive">Sauvegarde impossible pour le moment.</p>}
          <button type="button" onClick={signOut} className="font-medium text-foreground underline-offset-4 hover:underline">Se déconnecter</button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-1 overflow-x-auto border-b p-2 md:hidden">
          {tabs.map((t) => (
            <Link key={t.to} to={t.to} activeOptions={{ exact: true }} className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground" activeProps={{ className: "bg-sidebar-accent !text-sidebar-primary" }}>
              {t.label}
            </Link>
          ))}
          <button type="button" onClick={signOut} className="ml-auto whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground">Déconnexion</button>
        </nav>
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90">
      {children}
    </button>
  );
}
