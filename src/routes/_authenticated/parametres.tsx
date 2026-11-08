import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock3, BookOpen, CalendarOff, Plus, Save, Trash2, Check, AlertTriangle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useSchool } from "@/components/SchoolProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { days } from "@/lib/data";
import { subjectTextClass } from "@/lib/subjects";
import { teacherScheduleConflicts } from "@/lib/timetable";
import { settingsSchema, unavailabilitySchema, dayCourseSlots, defaultDayHours, teacherUnavailable } from "@/lib/settings";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({ meta: [
    { title: "Paramètres de l’établissement — OptiHora" },
    { name: "description", content: "Configurez la durée des cours, les matières et les indisponibilités des enseignants." },
    { property: "og:title", content: "Paramètres de l’établissement — OptiHora" },
    { property: "og:description", content: "Réglez les horaires et contraintes de vos emplois du temps scolaires." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: SettingsPage,
});
function SettingsPage() {
  const { settings, saveSettings, teachers, constraints, addConstraint, removeConstraint, schedules, subjects, addSubject } = useSchool();
  const [subjectName, setSubjectName] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [subjectAdded, setSubjectAdded] = useState("");
  const [duration, setDuration] = useState(String(settings.duration));
  const [included, setIncluded] = useState(settings.includedSubjects);
  const [dayHours, setDayHours] = useState(settings.dayHours ?? days.map(() => ({ ...defaultDayHours })));
  const [coursesPerDay, setCoursesPerDay] = useState(String(settings.coursesPerDay));
  const [allowSimultaneousLessons, setAllowSimultaneousLessons] = useState(settings.allowSimultaneousLessons);
  const [teacher, setTeacher] = useState(teachers[0]?.name ?? "");
  const [day, setDay] = useState("0");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("10:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [constraintError, setConstraintError] = useState("");
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const conflicts = Object.entries(schedules).flatMap(([className, schedule]) => schedule.grid.flatMap((row, d) => row.flatMap((lesson, s) => {
    const slot = dayCourseSlots(settings, d)[s];
    if (!lesson) return [];
    if (!slot) return [{ className, day: d, slot: `Créneau ${s + 1}`, teacher: lesson.teacher, issue: "Hors des horaires de la journée" }];
    const unavailable = teacherUnavailable(constraints, lesson.teacher, d, slot, settings.duration);
    const excluded = !settings.includedSubjects.includes(lesson.subject);
    const busyClasses = teacherScheduleConflicts(schedules, className, lesson.teacher, d, s, settings.allowSimultaneousLessons);
    const issues = [teachers.find((teacher) => teacher.name === lesson.teacher)?.subject !== lesson.subject ? "Matière de l’enseignant différente" : "", unavailable ? "Enseignant indisponible" : "", excluded ? "Matière exclue" : "", busyClasses.length ? `Cours simultané avec ${busyClasses.join(", ")}` : ""].filter(Boolean);
    return issues.length ? [{ className, day: d, slot, teacher: lesson.teacher, issue: issues.join(" · ") }] : [];
  })));
  return <AppShell>
    <PageHeader title="Paramètres" subtitle="Organisation de l’établissement" />
    <form onSubmit={(event) => {
      event.preventDefault(); setError(""); setSaved(false);
      const result = settingsSchema.safeParse({ duration, includedSubjects: included, allowSimultaneousLessons, coursesPerDay, dayHours });
      if (!result.success) { setError(included.length === 0 ? "Sélectionnez au moins une matière." : result.error.issues.find((issue) => issue.path[0] === "dayHours")?.message ?? "La durée doit être de 15 à 90 minutes et la journée compter de 1 à 8 cours."); return; }
      saveSettings(result.data); setSaved(true);
    }}>
      <section className="grid gap-6 border-t py-7 lg:grid-cols-[280px_1fr]">
        <div><h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Clock3 className="size-5 text-primary" />Durée des cours et de la journée</h2><p className="mt-2 text-sm text-muted-foreground">Durée commune à toutes les classes</p></div>
        <div className="min-w-0 space-y-5">
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="course-duration">Durée en minutes</Label><Input id="course-duration" type="number" min={15} max={90} required value={duration} onChange={(event) => { setDuration(event.target.value); setSaved(false); }} /></div>
            <div className="space-y-2"><Label htmlFor="courses-per-day">Maximum de cours par jour</Label><Input id="courses-per-day" type="number" min={1} max={8} required value={coursesPerDay} onChange={(event) => { setCoursesPerDay(event.target.value); setSaved(false); }} /></div>
          </div>
          <div className="divide-y border-y">{days.map((dayName, index) => {
            const hours = dayHours[index];
            if (!hours) return null;
            const update = (patch: Partial<typeof hours>) => { setSaved(false); setDayHours((previous) => previous.map((value, d) => d === index ? { ...value, ...patch } : value)); };
            return <fieldset key={dayName} className="space-y-3 py-4"><legend className="float-left mb-3 w-full font-semibold">{dayName}</legend>
              <div className="clear-both grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor={`day-start-${index}`}>Début · {dayName}</Label><Input id={`day-start-${index}`} type="time" required value={hours.start} onChange={(event) => update({ start: event.target.value })} /></div><div className="space-y-2"><Label htmlFor={`day-end-${index}`}>Fin · {dayName}</Label><Input id={`day-end-${index}`} type="time" required value={hours.end} onChange={(event) => update({ end: event.target.value })} /></div></div>
              <div className="flex items-center gap-2"><Checkbox id={`day-lunch-${index}`} checked={hours.lunch} onCheckedChange={(value) => update({ lunch: value === true })} /><Label htmlFor={`day-lunch-${index}`}>Pause déjeuner · {dayName}</Label></div>
              {hours.lunch && <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor={`lunch-start-${index}`}>Début de pause · {dayName}</Label><Input id={`lunch-start-${index}`} type="time" required value={hours.lunchStart} onChange={(event) => update({ lunchStart: event.target.value })} /></div><div className="space-y-2"><Label htmlFor={`lunch-end-${index}`}>Fin de pause · {dayName}</Label><Input id={`lunch-end-${index}`} type="time" required value={hours.lunchEnd} onChange={(event) => update({ lunchEnd: event.target.value })} /></div></div>}
              <p className="text-sm text-muted-foreground">{dayCourseSlots({ ...settings, duration: Math.max(15, Number(duration) || 60), coursesPerDay: Number(coursesPerDay) || 8, dayHours }, index).length} cours · {hours.start} – {hours.end}</p>
            </fieldset>;
          })}</div>
        </div>
      </section>
      <section className="grid gap-6 border-t py-7 lg:grid-cols-[280px_1fr]">
        <div><h2 className="flex items-center gap-2 font-display text-lg font-semibold"><BookOpen className="size-5 text-primary" />Matières incluses</h2><p className="mt-2 text-sm text-muted-foreground">{included.length} matière{included.length > 1 ? "s" : ""} sélectionnée{included.length > 1 ? "s" : ""}</p></div>
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{subjects.map((subject) => <div key={subject.id} className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-4"><Checkbox id={`included-${subject.id}`} checked={included.includes(subject.id)} onCheckedChange={(checked) => { setSaved(false); setIncluded((previous) => checked === true ? [...previous, subject.id] : previous.filter((id) => id !== subject.id)); }} /><Label htmlFor={`included-${subject.id}`} className={`min-w-0 break-words leading-5 ${subjectTextClass(subject.id)}`}>{subject.name}</Label></div>)}</div>
          <div className="flex flex-wrap items-end gap-3 border-t pt-5"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="new-subject">Nom de la nouvelle matière</Label><Input id="new-subject" maxLength={100} value={subjectName} onChange={(event) => { setSubjectName(event.target.value); setSubjectError(""); setSubjectAdded(""); }} placeholder="Ex. : Technologie" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); document.getElementById("add-subject")?.click(); } }} /></div><Button id="add-subject" type="button" disabled={!subjectName.trim()} onClick={() => {
            setSubjectError(""); setSubjectAdded("");
            try { const subject = addSubject(subjectName); setIncluded((previous) => [...previous, subject.id]); setSubjectName(""); setSaved(false); setSubjectAdded(`${subject.name} ajoutée.`); }
            catch (error) { setSubjectError(error instanceof Error ? error.message : "Impossible d’ajouter cette matière."); }
          }}><Plus />Ajouter une matière</Button></div>
          {subjectError && <p role="alert" className="text-sm text-destructive">{subjectError}</p>}
          {subjectAdded && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Check className="size-4" />{subjectAdded}</p>}
        </div>
      </section>
      <section className="grid gap-6 border-t py-7 lg:grid-cols-[280px_1fr]">
        <h2 className="font-display text-lg font-semibold">Cours simultanés</h2>
        <div className="flex items-start gap-3"><Checkbox id="allow-simultaneous-lessons" checked={allowSimultaneousLessons} onCheckedChange={(checked) => { setAllowSimultaneousLessons(checked === true); setSaved(false); }} /><Label htmlFor="allow-simultaneous-lessons" className="leading-5">Autoriser un enseignant à enseigner à plusieurs classes en même temps</Label></div>
      </section>
      <div className="flex flex-wrap items-center justify-end gap-4 border-t py-5">{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{saved && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Check className="size-4" />Paramètres enregistrés</p>}<Button type="submit"><Save />Enregistrer les paramètres</Button></div>
    </form>
    <section className="border-t py-7">
      <div className="mb-6"><h2 className="flex items-center gap-2 font-display text-lg font-semibold"><CalendarOff className="size-5 text-primary" />Indisponibilités des enseignants</h2><p className="mt-2 text-sm text-muted-foreground">Contraintes hebdomadaires · heure de Paris</p></div>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault(); setConstraintError(""); setAdded(false);
        const result = unavailabilitySchema.safeParse({ id: crypto.randomUUID(), teacher, day, start, end, reason });
        if (!result.success) { setConstraintError("Choisissez un enseignant et une plage horaire dont la fin est après le début."); return; }
        addConstraint(result.data); setAdded(true); setReason("");
      }}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2"><Label htmlFor="unavailable-teacher">Enseignant</Label><Select value={teacher} onValueChange={setTeacher}><SelectTrigger id="unavailable-teacher"><SelectValue placeholder="Choisir un enseignant" /></SelectTrigger><SelectContent>{teachers.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="unavailable-day">Jour</Label><Select value={day} onValueChange={setDay}><SelectTrigger id="unavailable-day"><SelectValue /></SelectTrigger><SelectContent>{days.map((item, index) => <SelectItem key={item} value={String(index)}>{item}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="unavailable-start">De</Label><Input id="unavailable-start" type="time" required value={start} onChange={(event) => setStart(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="unavailable-end">À</Label><Input id="unavailable-end" type="time" required value={end} onChange={(event) => setEnd(event.target.value)} /></div>
        </div>
        <div className="flex flex-wrap items-end gap-4"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="unavailable-reason">Motif (facultatif)</Label><Input id="unavailable-reason" maxLength={200} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex. : présence dans un autre établissement" /></div><Button type="submit" disabled={!teacher}><Plus />Ajouter l’indisponibilité</Button></div>
        {constraintError && <p role="alert" className="text-sm text-destructive">{constraintError}</p>}{added && <p role="status" className="text-sm text-primary">Indisponibilité ajoutée.</p>}
      </form>
      <div className="mt-6 divide-y border-y">{constraints.length === 0 ? <p className="py-5 text-sm text-muted-foreground">Aucune indisponibilité renseignée.</p> : constraints.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="font-semibold">{item.teacher}</p><p className="mt-1 text-sm text-muted-foreground">{days[item.day]} · {item.start} – {item.end}</p>{item.reason && <p className="mt-1 break-words text-sm text-muted-foreground">{item.reason}</p>}</div><Button variant="ghost" size="icon" aria-label={`Supprimer l’indisponibilité de ${item.teacher} ${days[item.day]} ${item.start}`} title="Supprimer l’indisponibilité" onClick={() => removeConstraint(item.id)}><Trash2 className="text-destructive" /></Button></div>)}</div>
    </section>
    {conflicts.length > 0 && <section className="border-t pt-6"><h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><AlertTriangle className="size-5 text-warning" />Cours à revoir · {conflicts.length}</h2><ul className="divide-y">{conflicts.map((item, index) => <li key={index} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-medium">{item.className} · {days[item.day]} · {item.slot} · {item.teacher}</span><span className="text-muted-foreground">{item.issue}</span></li>)}</ul></section>}
  </AppShell>;
}