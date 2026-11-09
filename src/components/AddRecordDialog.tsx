import { useId, useState, type ReactNode } from "react";
import { Plus, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useSchool } from "@/components/SchoolProvider";
import { useOpti } from "@/components/OptiProvider";
import { classSchema, teacherSchema, roomSchema, type SchoolClass, type Teacher } from "@/lib/school-records";

type Kind = "class" | "teacher" | "room";
const titles = { class: "Ajouter une classe", teacher: "Ajouter un enseignant", room: "Ajouter une salle" };
function Choice({ id, value, onChange, items }: { id: string; value: string; onChange: (value: string) => void; items: { value: string; label: string }[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>;
}
function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
export function AddRecordDialog({ kind, editing }: { kind: Kind; editing?: SchoolClass | Teacher }) {
  const school = useSchool();
  const { react } = useOpti();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("Collège");
  const [students, setStudents] = useState("26");
  const [hours, setHours] = useState(kind === "teacher" ? "18" : "26");
  const [mainTeacher, setMainTeacher] = useState("none");
  const [subject, setSubject] = useState("math");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [roomType, setRoomType] = useState("Salle de cours");
  const [capacity, setCapacity] = useState("30");
  function changeOpen(next: boolean) {
    setOpen(next);
    setError("");
    if (next) {
      setName(""); setLevel("Collège"); setStudents("26"); setHours(kind === "teacher" ? "18" : "26");
      setMainTeacher("none"); setSubject("math"); setSelectedClasses([]); setRoomType("Salle de cours"); setCapacity("30"); setSuccess("");
      if (editing) {
        setName(editing.name); setHours(String(editing.hours));
        if ("level" in editing) { setLevel(editing.level); setStudents(String(editing.students)); setMainTeacher(editing.mainTeacher || "none"); }
        if ("subject" in editing) { setSubject(editing.subject); setSelectedClasses(editing.classes); }
      }
    }
  }
  return <div className="flex flex-col items-end gap-2">
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>{editing ? <Button variant="outline" size="sm" aria-label={`Modifier ${kind === "teacher" ? "l’enseignant" : "la classe"} ${editing.name}`}><Pencil />Modifier</Button> : <Button size="lg" className="px-4"><Plus />{titles[kind]}</Button>}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg" aria-describedby={`${id}-description`}>
        <DialogHeader><DialogTitle>{editing ? `Modifier ${kind === "teacher" ? "l’enseignant" : "la classe"} ${editing.name}` : titles[kind]}</DialogTitle><DialogDescription id={`${id}-description`} className="sr-only">Renseignements de {kind === "class" ? "la classe" : kind === "teacher" ? "l’enseignant" : "la salle"}</DialogDescription></DialogHeader>
        <form className="space-y-5" onSubmit={(event) => {
          event.preventDefault(); setError("");
          try {
            if (kind === "class" && editing) school.updateClass(editing.name, classSchema.parse({ name, level, students, hours, mainTeacher: mainTeacher === "none" ? "" : mainTeacher }));
            else if (kind === "class") school.addClass(classSchema.parse({ name, level, students, hours, mainTeacher: mainTeacher === "none" ? "" : mainTeacher }));
            if (kind === "teacher") {
              const record = teacherSchema.parse({ name, subject, hours, classes: selectedClasses });
              if (editing) school.updateTeacher(editing.name, record); else school.addTeacher(record);
            }
            if (kind === "room") school.addRoom(roomSchema.parse({ name, type: roomType, capacity }));
            setOpen(false); setSuccess(editing ? `${name.trim()} modifié${kind === "teacher" ? "" : "e"}.` : `${name.trim()} ajouté${kind === "teacher" ? "" : "e"}.`);
          } catch (cause) { setError(cause instanceof Error && !cause.message.startsWith("[") ? cause.message : "Vérifiez les renseignements saisis."); react("error", "Un renseignement est à vérifier. Je suis là si vous avez besoin d’aide."); }
        }}>
          <Field id={`${id}-name`} label={kind === "class" ? "Nom de la classe" : kind === "teacher" ? "Nom de l’enseignant" : "Nom de la salle"}><Input id={`${id}-name`} required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder={kind === "class" ? "Ex. : 6eB" : kind === "teacher" ? "Ex. : Mme Martin" : "Ex. : A103"} /></Field>
          {kind === "class" && <>
            <Field id={`${id}-level`} label="Niveau"><Choice id={`${id}-level`} value={level} onChange={setLevel} items={["École", "Collège", "Lycée"].map((value) => ({ value, label: value }))} /></Field>
            <div className="grid grid-cols-2 gap-4"><Field id={`${id}-students`} label="Nombre d’élèves"><Input id={`${id}-students`} type="number" required min={0} step={1} value={students} onChange={(event) => setStudents(event.target.value)} /></Field><Field id={`${id}-hours`} label="Heures / semaine"><Input id={`${id}-hours`} type="number" required min={0} step={1} value={hours} onChange={(event) => setHours(event.target.value)} /></Field></div>
            <Field id={`${id}-main`} label="Professeur principal"><Choice id={`${id}-main`} value={mainTeacher} onChange={setMainTeacher} items={[{ value: "none", label: "Non attribué" }, ...school.teachers.map((teacher) => ({ value: teacher.name, label: teacher.name }))]} /></Field>
          </>}
          {kind === "teacher" && <>
            <Field id={`${id}-subject`} label="Matière"><Choice id={`${id}-subject`} value={subject} onChange={setSubject} items={school.subjects.map((item) => ({ value: item.id, label: item.name }))} /></Field>
            <Field id={`${id}-hours`} label="Heures / semaine"><Input id={`${id}-hours`} type="number" required min={0} step={1} value={hours} onChange={(event) => setHours(event.target.value)} /></Field>
            <fieldset><legend className="mb-3 text-sm font-medium">Classes attribuées</legend><div className="grid grid-cols-2 gap-3">{school.classes.map((item, index) => <div key={item.name} className="flex items-center gap-2"><Checkbox id={`${id}-class-${index}`} checked={selectedClasses.includes(item.name)} onCheckedChange={(checked) => setSelectedClasses((previous) => checked === true ? [...previous, item.name] : previous.filter((value) => value !== item.name))} /><Label htmlFor={`${id}-class-${index}`}>{item.name}</Label></div>)}</div></fieldset>
          </>}
          {kind === "room" && <>
            <Field id={`${id}-type`} label="Type de salle"><Choice id={`${id}-type`} value={roomType} onChange={setRoomType} items={["Salle de cours", "Laboratoire", "Salle informatique", "Sport", "Bibliothèque"].map((value) => ({ value, label: value }))} /></Field>
            <Field id={`${id}-capacity`} label="Capacité (places)"><Input id={`${id}-capacity`} type="number" required min={1} step={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} /></Field>
          </>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 border-t pt-4"><Button type="button" variant="outline" onClick={() => changeOpen(false)}>Annuler</Button><Button type="submit">{editing ? <><Check />Enregistrer</> : <><Plus />Ajouter</>}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <p role="status" className="flex items-center gap-1 text-sm text-primary">{success && <><Check className="size-4" />{success}</>}</p>
  </div>;
}