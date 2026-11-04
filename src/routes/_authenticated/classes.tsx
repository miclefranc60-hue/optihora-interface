import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSchool } from "@/components/SchoolProvider";

import { AddRecordDialog } from "@/components/AddRecordDialog";

export const Route = createFileRoute("/_authenticated/classes")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Classes — OptiHora" },
      { name: "description", content: "Gérez les classes de l'école, du collège et du lycée." },
      { property: "og:title", content: "Classes — OptiHora" },
      { property: "og:description", content: "Liste des classes et de leurs effectifs." },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const { classes } = useSchool();
  return (
    <AppShell>
      <PageHeader title="Classes" subtitle={`${classes.length} classes enregistrées`} action={<AddRecordDialog kind="class" />} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <div key={c.name} className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold">{c.name}</h3>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{c.level}</span>
            </div>
            <dl className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex justify-between"><dt>Élèves</dt><dd className="font-medium text-foreground">{c.students}</dd></div>
              <div className="flex justify-between"><dt>Professeur principal</dt><dd className="font-medium text-foreground">{c.mainTeacher || "Non attribué"}</dd></div>
              <div className="flex justify-between"><dt>Heures / semaine</dt><dd className="font-medium text-foreground">{c.hours} h</dd></div>
            </dl>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
