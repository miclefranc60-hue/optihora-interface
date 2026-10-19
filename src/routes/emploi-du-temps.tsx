import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader, PrimaryButton } from "@/components/AppShell";
import { buildTimetable, classes, days, slots, subjectById } from "@/lib/data";

export const Route = createFileRoute("/emploi-du-temps")({
  head: () => ({
    meta: [
      { title: "Emploi du temps — OptiHora" },
      { name: "description", content: "Visualisez et modifiez l'emploi du temps hebdomadaire de chaque classe." },
      { property: "og:title", content: "Emploi du temps — OptiHora" },
      { property: "og:description", content: "Grille hebdomadaire des cours par classe." },
    ],
  }),
  component: Timetable,
});

function Timetable() {
  const [cls, setCls] = useState(classes[0]!.name);
  const grid = buildTimetable(cls);
  return (
    <AppShell>
      <PageHeader
        title="Emploi du temps"
        subtitle="Semaine type · cliquez sur une classe pour changer de vue"
        action={<PrimaryButton onClick={() => alert("Génération automatique lancée !")}>⚡ Générer automatiquement</PrimaryButton>}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {classes.map((c) => (
          <button
            key={c.name}
            onClick={() => setCls(c.name)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${cls === c.name ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
          >
            {c.name}
          </button>
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
                        <div
                          className="h-full rounded-lg border-l-4 p-2"
                          style={{ borderColor: subjectById(l.subject).color, background: `color-mix(in oklab, ${subjectById(l.subject).color} 14%, transparent)` }}
                        >
                          <p className="font-semibold">{subjectById(l.subject).name}</p>
                          <p className="text-xs text-muted-foreground">{l.teacher} · {l.room}</p>
                        </div>
                      ) : (
                        <div className="grid h-full place-items-center rounded-lg border border-dashed text-muted-foreground/50 hover:bg-muted">+</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
