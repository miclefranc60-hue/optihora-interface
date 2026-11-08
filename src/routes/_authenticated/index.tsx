import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, Clock3, DoorOpen, GraduationCap, Users, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { NewScheduleDialog } from "@/components/NewScheduleDialog";
import { subjectTextClass } from "@/lib/subjects";
import { useSchool } from "@/components/SchoolProvider";
import { currentLesson, slotEnd } from "@/lib/timetable";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [
    { title: "Tableau de bord — OptiHora" },
    { name: "description", content: "Les cours actuels de chaque classe et les emplois du temps de votre établissement." },
    { property: "og:title", content: "Tableau de bord — OptiHora" },
    { property: "og:description", content: "Suivez les matières en cours et créez les emplois du temps de vos classes." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Dashboard,
});
function Dashboard() {
  const { classes, teachers, rooms, schedules, settings, subjectById } = useSchool();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  const active = classes.filter((item) => { const schedule = schedules[item.name]; return now && schedule && currentLesson(schedule.grid, now, settings.duration, settings); }).length;
  const stats = [
    { label: "Classes", value: classes.length, icon: GraduationCap, tone: "bg-accent text-accent-foreground" },
    { label: "Enseignants", value: teachers.length, icon: Users, tone: "bg-subject-math/10 text-subject-math" },
    { label: "Salles", value: rooms.length, icon: DoorOpen, tone: "bg-subject-hg/10 text-subject-hg" },
    { label: "Cours en ce moment", value: now ? active : "—", icon: BookOpen, tone: "bg-subject-svt/10 text-subject-svt" },
  ];
  return <AppShell>
    <header className="mb-8 flex flex-wrap items-center justify-between gap-5 border-b pb-7">
      <div><p className="mb-2 text-xs font-semibold uppercase text-primary">OptiHora · Vue d’ensemble</p><h1 className="font-display text-3xl font-bold">Tableau de bord</h1><p className="mt-2 text-sm text-muted-foreground">Votre établissement, au fil de la journée.</p></div>
      <NewScheduleDialog />
    </header>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{stats.map((item) => <div key={item.label} className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-soft"><div className={`grid size-11 shrink-0 place-items-center rounded-lg ${item.tone}`}><item.icon className="size-5" /></div><div><p className="font-display text-2xl font-bold">{item.value}</p><p className="text-xs text-muted-foreground">{item.label}</p></div></div>)}</div>
    <section className="mt-9">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">En ce moment</h2><p className="mt-1 text-sm text-muted-foreground">Les matières en cours dans chaque classe</p></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" /><time>{now ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", hour: "2-digit", minute: "2-digit" }).format(now) : "—"}</time><span className="text-xs">Paris</span></div></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{classes.map((item) => {
        const schedule = schedules[item.name];
        const lesson = now && schedule ? currentLesson(schedule.grid, now, settings.duration, settings) : null;
        const subject = lesson ? subjectById(lesson.subject) : null;
        return <article key={item.name} className={`relative overflow-hidden rounded-lg border bg-card p-5 shadow-soft ${lesson ? "border-primary/30" : ""}`}>
          <div className="mb-5 flex items-center justify-between"><div className="flex items-baseline gap-2"><h3 className="font-display text-xl font-bold">{item.name}</h3><span className="text-xs text-muted-foreground">{item.level}</span></div><span className={`flex items-center gap-1.5 text-xs ${lesson ? "text-primary" : "text-muted-foreground"}`}><span className={`size-1.5 rounded-full ${lesson ? "bg-primary" : "bg-muted-foreground/40"}`} />{lesson ? "En cours" : "Sans cours"}</span></div>
          <div className="min-h-24"><p className={`mb-2 flex items-center gap-2 text-lg font-semibold ${subject ? subjectTextClass(subject.id) : "text-muted-foreground"}`}><BookOpen className="size-4 shrink-0" />{subject?.name ?? (now ? schedule ? "Aucun cours actuellement" : "Emploi du temps à créer" : "—")}</p>{lesson ? <><p className="text-sm text-muted-foreground">{lesson.teacher} · {lesson.room}</p><p className="mt-2 text-xs text-muted-foreground">{lesson.slot} – {slotEnd(lesson.slot, settings.duration)}</p></> : <p className="text-sm text-muted-foreground">{item.students} élèves</p>}</div>
          <div className="mt-3 flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">{item.hours} h / semaine</span><Button asChild variant="ghost" size="sm"><Link to="/emploi-du-temps" search={{ classe: item.name }}>Voir la semaine<ArrowUpRight /></Link></Button></div>
        </article>;
      })}</div>
    </section>
    <section className="mt-9 border-t pt-6"><div className="mb-4 flex items-center gap-2"><CalendarDays className="size-5 text-primary" /><h2 className="font-display text-lg font-semibold">Emplois du temps</h2></div><div className="divide-y">{classes.map((item) => { const schedule = schedules[item.name]; const count = schedule?.grid.flat().filter(Boolean).length ?? 0; return <div key={item.name} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><span className="mr-3 font-semibold">{item.name}</span><span className="text-sm text-muted-foreground">{schedule?.name ?? "Non créé"}</span></div><div className="flex items-center gap-4"><span className="text-xs text-muted-foreground">{count} cours planifiés</span><Button asChild variant="ghost" size="icon"><Link to="/emploi-du-temps" search={{ classe: item.name }} aria-label={`Ouvrir l’emploi du temps de ${item.name}`}><ArrowUpRight /></Link></Button></div></div>; })}</div></section>
  </AppShell>;
}
