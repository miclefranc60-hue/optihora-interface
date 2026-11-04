import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSchool } from "@/components/SchoolProvider";
import { currentTeacherClasses } from "@/lib/timetable";

import { AddRecordDialog } from "@/components/AddRecordDialog";

export const Route = createFileRoute("/_authenticated/enseignants")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Enseignants — OptiHora" },
      { name: "description", content: "Consultez les enseignants, leurs matières et la classe où ils enseignent actuellement." },
      { property: "og:title", content: "Enseignants — OptiHora" },
      { property: "og:description", content: "Les classes en cours de chaque enseignant et les professeurs libres." },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const { teachers, subjectById, schedules, settings } = useSchool();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <AppShell>
      <PageHeader title="Enseignants" subtitle={`${teachers.length} enseignants`} action={<AddRecordDialog kind="teacher" />} />
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b">
              <th className="p-4 font-medium">Nom</th>
              <th className="p-4 font-medium">Matière</th>
              <th className="p-4 font-medium">Classes</th>
              <th className="p-4 font-medium">Classe en cours</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => {
              const s = subjectById(t.subject);
              const activeClasses = now ? currentTeacherClasses(schedules, t.name, now, settings.duration) : [];
              return (
                <tr key={t.name} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-4 font-semibold">{t.name}</td>
                  <td className="p-4">
                    <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: `color-mix(in oklab, ${s.color} 20%, transparent)` }}>{s.name}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{t.classes.join(", ") || "Non attribuées"}</td>
                  <td className={`p-4 ${activeClasses.length ? "font-medium text-primary" : "text-muted-foreground"}`}>
                    {now ? activeClasses.join(", ") || "Libre" : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
