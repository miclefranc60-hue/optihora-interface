import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSchool } from "@/components/SchoolProvider";

import { AddRecordDialog } from "@/components/AddRecordDialog";

export const Route = createFileRoute("/_authenticated/salles")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Salles — OptiHora" },
      { name: "description", content: "Suivez les salles de l'établissement et leur taux d'occupation." },
      { property: "og:title", content: "Salles — OptiHora" },
      { property: "og:description", content: "Salles, capacités et occupation." },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const { rooms } = useSchool();
  return (
    <AppShell>
      <PageHeader title="Salles" subtitle="Capacité et taux d'occupation hebdomadaire" action={<AddRecordDialog kind="room" />} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <div key={r.name} className="rounded-2xl border bg-card p-6 shadow-soft">
            <h3 className="font-display text-xl font-bold">{r.name}</h3>
            <p className="text-sm text-muted-foreground">{r.type} · {r.capacity} places</p>
            <div className="mt-5 flex justify-between text-sm"><span>Occupation</span><span className="font-semibold">{r.occupancy} %</span></div>
            <div className="mt-1.5 h-2 rounded-full bg-muted">
              <div className={`h-2 rounded-full ${r.occupancy > 85 ? "bg-warning" : "bg-primary"}`} style={{ width: `${r.occupancy}%` }} />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
