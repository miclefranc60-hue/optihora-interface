import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { days, slots, subjectById } from "@/lib/data";

import { useSchool } from "@/components/SchoolProvider";
import { Button } from "@/components/ui/button";

import { NewScheduleDialog } from "@/components/NewScheduleDialog";
import { LessonDialog } from "@/components/LessonDialog";
import { emptyTimetable } from "@/lib/timetable";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/emploi-du-temps")({
  validateSearch: (search: Record<string, unknown>) => ({ classe: typeof search["classe"] === "string" ? search["classe"] : "" }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Emploi du temps — OptiHora" },
      { name: "description", content: "Visualisez et modifiez l'emploi du temps hebdomadaire de chaque classe." },
      { property: "og:title", content: "Emploi du temps — OptiHora" },
      { property: "og:description", content: "Grille hebdomadaire des cours par classe." },
    ],
  }),
  component: Timetable,
});

function Timetable() {
  const { classes, schedules } = useSchool();
  const { classe } = Route.useSearch();
  const navigate = useNavigate();
  const cls = classes.some((item) => item.name === classe) ? classe : classes[0]?.name ?? "";
  const schedule = schedules[cls];
  const grid = schedule?.grid ?? emptyTimetable();
  const [editing, setEditing] = useState<{ day: number; slot: number } | null>(null);
  return (
    <AppShell>
      <PageHeader
        title="Emploi du temps"
        subtitle={schedule?.name ?? "Aucun emploi du temps pour cette classe"}
        action={<NewScheduleDialog />}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {classes.map((c) => (
          <Button
            key={c.name}
            variant={cls === c.name ? "default" : "outline"}
            onClick={() => { setEditing(null); void navigate({ to: "/emploi-du-temps", search: { classe: c.name } }); }}
            className="px-4"
          >
            {c.name}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-20 border-b p-3" />
              {days.map((d) => (
                <th key={d} className="border-b p-3 text-left font-display font-semibold">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, s) => (
              <tr key={slot}>
                <td className="border-b p-3 align-top text-xs font-medium text-muted-foreground">{slot}</td>
                {days.map((d, di) => {
                  const l = grid[di]?.[s];
                  return (
                    <td key={d} className="h-20 border-b border-l p-1.5 align-top">
                      {l ? (
                        <Button
                          variant="ghost"
                          onClick={() => setEditing({ day: di, slot: s })}
                          aria-label={`Modifier le cours ${d} à ${slot}`}
                          className="h-full w-full flex-col items-start justify-start whitespace-normal rounded-lg border-l-4 p-2 text-left"
                          style={{ borderColor: subjectById(l.subject).color, background: `color-mix(in oklab, ${subjectById(l.subject).color} 14%, transparent)` }}
                        >
                          <p className="font-semibold">{subjectById(l.subject).name}</p>
                          <p className="text-xs text-muted-foreground">{l.teacher} · {l.room}</p>
                        </Button>
                      ) : (
                        <Button variant="ghost" disabled={!schedule} onClick={() => setEditing({ day: di, slot: s })} aria-label={`Ajouter un cours ${d} à ${slot}`} className="h-full w-full border border-dashed text-muted-foreground"><Plus /></Button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && schedule && <LessonDialog key={`${cls}-${editing.day}-${editing.slot}`} className={cls} day={editing.day} slot={editing.slot} lesson={grid[editing.day]?.[editing.slot] ?? null} close={() => setEditing(null)} />}
    </AppShell>
  );
}
