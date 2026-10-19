import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, PrimaryButton } from "@/components/AppShell";
import { subjectById, teachers } from "@/lib/data";

export const Route = createFileRoute("/enseignants")({
  head: () => ({
    meta: [
      { title: "Enseignants — OptiHora" },
      { name: "description", content: "Gérez les enseignants, leurs matières et leur charge horaire." },
      { property: "og:title", content: "Enseignants — OptiHora" },
      { property: "og:description", content: "Liste des enseignants et de leurs services." },
    ],
  }),
  component: () => (
    <AppShell>
      <PageHeader title="Enseignants" subtitle={`${teachers.length} enseignants`} action={<PrimaryButton>+ Ajouter un enseignant</PrimaryButton>} />
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b">
              <th className="p-4 font-medium">Nom</th>
              <th className="p-4 font-medium">Matière</th>
              <th className="p-4 font-medium">Classes</th>
              <th className="p-4 font-medium">Service</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => {
              const s = subjectById(t.subject);
              return (
                <tr key={t.name} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-4 font-semibold">{t.name}</td>
                  <td className="p-4">
                    <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: `color-mix(in oklab, ${s.color} 20%, transparent)` }}>{s.name}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{t.classes.join(", ")}</td>
                  <td className="p-4">{t.hours} h / 18 h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  ),
});
