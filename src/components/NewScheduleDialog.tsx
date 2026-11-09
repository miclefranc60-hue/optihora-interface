import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useSchool } from "@/components/SchoolProvider";
import { useOpti } from "@/components/OptiProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export function NewScheduleDialog() {
  const { react } = useOpti();
  const { classes, schedules, generateSchedule, settings, subjects, teachers } = useSchool();
  const included = subjects.filter((subject) => settings.includedSubjects.includes(subject.id));
  const [hours, setHours] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const capacity = 5 * settings.coursesPerDay;
  const total = included.reduce((sum, subject) => sum + (Number(hours[subject.id]) || 0), 0);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [className, setClassName] = useState(classes[0]?.name ?? "");
  const [name, setName] = useState("");
  const [replace, setReplace] = useState(false);
  const existing = schedules[className];
  return <Dialog open={open} onOpenChange={(value) => { setOpen(value); setReplace(false); setName(""); if (value) setResult(""); }}>
    <DialogTrigger asChild><Button size="lg" className="px-4"><Plus />Nouvel emploi du temps</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
      <DialogHeader><DialogTitle>Nouvel emploi du temps</DialogTitle><DialogDescription>Semaine type · lundi au vendredi</DialogDescription></DialogHeader>
      <form className="space-y-5" onSubmit={(event) => {
        event.preventDefault();
        if (!className || !name.trim() || (existing && !replace)) return;
        try {
        const unplaced = generateSchedule(className, name, Object.fromEntries(included.map((subject) => [subject.id, Math.max(0, Math.floor(Number(hours[subject.id]) || 0))])));
        const missing = Object.entries(unplaced).map(([id, count]) => `${included.find((subject) => subject.id === id)?.name ?? id} : ${count} h`);
        setResult(missing.length ? `Heures non placées (enseignant indisponible ou limite de 2 h par jour) — ${missing.join(", ")}` : "");
        react(missing.length ? "question" : "success", missing.length ? "La grille est créée, mais certaines heures restent à placer." : "Votre emploi du temps est prêt !");
        if (!missing.length) setOpen(false);
        void navigate({ to: "/emploi-du-temps", search: { classe: className } });
        } catch (error) { setResult(error instanceof Error ? error.message : "Impossible de générer cet emploi du temps."); react("error", "Cet emploi du temps nécessite une vérification."); }
      }}>
        <div className="space-y-2"><Label htmlFor="schedule-class">Classe</Label><Select value={className} onValueChange={(value) => { setClassName(value); setReplace(false); }}><SelectTrigger id="schedule-class"><SelectValue placeholder="Choisir une classe" /></SelectTrigger><SelectContent>{classes.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="schedule-name">Nom de l’emploi du temps</Label><Input id="schedule-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. : Semaine habituelle" /></div>
        <fieldset className="space-y-3"><legend className="text-sm font-medium">Heures par semaine pour chaque matière</legend>
          <div className="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto">{included.map((subject) => <div key={subject.id} className="space-y-1"><Label htmlFor={`hours-${subject.id}`} className="text-xs">{subject.name}{!teachers.some((teacher) => teacher.subject === subject.id) && <span className="text-destructive"> · aucun enseignant</span>}</Label><Input id={`hours-${subject.id}`} type="number" min={0} max={10} step={1} value={hours[subject.id] ?? ""} placeholder="0" onChange={(event) => setHours((previous) => ({ ...previous, [subject.id]: event.target.value }))} /></div>)}</div>
          <p className={`text-xs ${total > capacity ? "text-destructive" : "text-muted-foreground"}`}>{total} h sur {capacity} créneaux · au plus 2 h par jour pour une même matière</p>
        </fieldset>
        {result && <p role="alert" className="text-sm text-destructive">{result}</p>}
        {existing && <div className="border-l-2 border-warning bg-warning/10 p-3"><p className="mb-3 text-sm">« {existing.name} » sera remplacé par la grille générée.</p><div className="flex items-start gap-2"><Checkbox id="replace-schedule" checked={replace} onCheckedChange={(value) => setReplace(value === true)} /><Label htmlFor="replace-schedule" className="leading-5">Je confirme le remplacement</Label></div></div>}
        <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" disabled={!className || !name.trim() || total === 0 || total > capacity || Boolean(existing && !replace)}><Plus />Générer l’emploi du temps</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}