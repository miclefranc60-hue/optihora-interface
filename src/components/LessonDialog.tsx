import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useSchool } from "@/components/SchoolProvider";
import { days, type Lesson } from "@/lib/data";
import { courseSlots, teacherUnavailable } from "@/lib/settings";
import { teacherScheduleConflicts } from "@/lib/timetable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function LessonDialog({ className, day, slot, lesson, close }: { className: string; day: number; slot: number; lesson: Lesson; close: () => void }) {
  const { teachers, rooms, setLesson, settings, constraints, subjects, schedules } = useSchool();
  const slots = courseSlots(settings.duration);
  const included = subjects.filter((subject) => settings.includedSubjects.includes(subject.id));
  const [subject, setSubject] = useState(lesson?.subject ?? included[0]?.id ?? "");
  const [teacher, setTeacher] = useState(lesson?.teacher ?? "");
  const [room, setRoom] = useState(lesson?.room ?? "");
  const [error, setError] = useState("");
  const eligible = teachers.filter((item) => item.subject === subject);
  const unavailable = teacherUnavailable(constraints, teacher, day, slots[slot] ?? "00:00", settings.duration);
  const conflicts = teacherScheduleConflicts(schedules, className, teacher, day, slot);
  const valid = Boolean(settings.includedSubjects.includes(subject) && !unavailable && !conflicts.length && eligible.some((item) => item.name === teacher) && rooms.some((item) => item.name === room));
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="w-[calc(100%-2rem)] rounded-lg"><DialogHeader><DialogTitle>{lesson ? "Modifier le cours" : "Ajouter un cours"}</DialogTitle><DialogDescription>{className} · {days[day]} · {slots[slot]}</DialogDescription></DialogHeader>
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (!valid) return; try { setLesson(className, day, slot, { subject, teacher, room }); close(); } catch (error) { setError(error instanceof Error ? error.message : "Impossible d’enregistrer ce cours."); } }}>
      <div className="space-y-2"><Label htmlFor="lesson-subject">Matière</Label><Select value={subject} onValueChange={(value) => { setSubject(value); setTeacher(""); }}><SelectTrigger id="lesson-subject"><SelectValue placeholder="Choisir une matière" /></SelectTrigger><SelectContent>{included.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>{!settings.includedSubjects.includes(subject) && <p role="alert" className="text-sm text-destructive">Cette matière est exclue dans les paramètres.</p>}</div>
      <div className="space-y-2"><Label htmlFor="lesson-teacher">Enseignant</Label><Select value={teacher} onValueChange={setTeacher}><SelectTrigger id="lesson-teacher"><SelectValue placeholder="Choisir un enseignant" /></SelectTrigger><SelectContent>{eligible.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectContent></Select>{eligible.length === 0 && <p className="text-sm text-muted-foreground">Aucun enseignant pour cette matière.</p>}</div>
      <div className="space-y-2"><Label htmlFor="lesson-room">Salle</Label><Select value={room} onValueChange={setRoom}><SelectTrigger id="lesson-room"><SelectValue placeholder="Choisir une salle" /></SelectTrigger><SelectContent>{rooms.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectContent></Select></div>
      {unavailable && <p role="alert" className="text-sm text-destructive">Cet enseignant est indisponible sur ce créneau.</p>}
      {conflicts.length > 0 && <p role="alert" className="text-sm text-destructive">Cet enseignant a déjà un cours avec {conflicts.join(", ")} sur ce créneau.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter className="gap-2">{lesson && <Button type="button" variant="ghost" onClick={() => { setLesson(className, day, slot, null); close(); }}><Trash2 />Supprimer</Button>}<Button type="button" variant="outline" onClick={close}>Annuler</Button><Button type="submit" disabled={!valid}><Save />Enregistrer</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}