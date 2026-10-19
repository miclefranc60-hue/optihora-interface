import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, PrimaryButton } from "@/components/AppShell";
import { classes, teachers, rooms, subjects } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — OptiHora" },
      { name: "description", content: "OptiHora : créez et gérez les emplois du temps de votre établissement scolaire." },
      { property: "og:title", content: "Tableau de bord — OptiHora" },
      { property: "og:description", content: "Créez et gérez les emplois du temps des écoles, collèges et lycées." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const stats = [
    { label: "Classes", value: classes.length },
    { label: "Enseignants", value: teachers.length },
    { label: "Salles", value: rooms.length },
    { label: "Heures planifiées / sem.", value: classes.reduce((a, c) => a + c.hours, 0) },
  ];
  const alerts = [
    "Conflit : Mme Laurent a deux cours mardi à 10:00",
    "La salle Gymnase est occupée à 90 %",
    "La classe 2nde1 n'a pas encore d'emploi du temps validé",
  ];
  return (
    <AppShell>
      <PageHeader
        title="Bonjour 👋"
        subtitle="Voici l'état des emplois du temps de votre établissement."
        action={<Link to="/emploi-du-temps"><PrimaryButton>+ Nouvel emploi du temps</PrimaryButton></Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold">Progression des emplois du temps</h2>
          <div className="space-y-4">
            {classes.map((c, i) => {
              const pct = [100, 100, 85, 70, 30, 100][i];
              return (
                <div key={c.name}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium">{c.name} <span className="text-muted-foreground">· {c.level}</span></span>
                    <span className="text-muted-foreground">{pct} %</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="mb-4 font-display text-lg font-semibold">Alertes</h2>
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a} className="rounded-lg bg-warning/15 p-3 text-sm">{a}</li>
            ))}
          </ul>
          <h2 className="mb-3 mt-6 font-display text-lg font-semibold">Matières</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <span key={s.id} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: `color-mix(in oklab, ${s.color} 20%, transparent)` }}>{s.name}</span>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
