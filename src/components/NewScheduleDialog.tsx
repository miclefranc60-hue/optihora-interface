import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useSchool } from "@/components/SchoolProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export function NewScheduleDialog() {
  const { classes, schedules, createSchedule } = useSchool();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [className, setClassName] = useState(classes[0]?.name ?? "");
  const [name, setName] = useState("");
  const [replace, setReplace] = useState(false);
  const existing = schedules[className];
  return <Dialog open={open} onOpenChange={(value) => { setOpen(value); setReplace(false); setName(""); }}>
    <DialogTrigger asChild><Button size="lg" className="px-4"><Plus />Nouvel emploi du temps</Button></DialogTrigger>
    <DialogContent className="w-[calc(100%-2rem)] rounded-lg">
      <DialogHeader><DialogTitle>Nouvel emploi du temps</DialogTitle><DialogDescription>Semaine type · lundi au vendredi</DialogDescription></DialogHeader>
      <form className="space-y-5" onSubmit={(event) => {
        event.preventDefault();
        if (!className || !name.trim() || (existing && !replace)) return;
        createSchedule(className, name);
        setOpen(false);
        void navigate({ to: "/emploi-du-temps", search: { classe: className } });
      }}>
        <div className="space-y-2"><Label htmlFor="schedule-class">Classe</Label><Select value={className} onValueChange={(value) => { setClassName(value); setReplace(false); }}><SelectTrigger id="schedule-class"><SelectValue placeholder="Choisir une classe" /></SelectTrigger><SelectContent>{classes.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="schedule-name">Nom de l’emploi du temps</Label><Input id="schedule-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. : Semaine habituelle" /></div>
        {existing && <div className="border-l-2 border-warning bg-warning/10 p-3"><p className="mb-3 text-sm">« {existing.name} » sera remplacé par une grille vide.</p><div className="flex items-start gap-2"><Checkbox id="replace-schedule" checked={replace} onCheckedChange={(value) => setReplace(value === true)} /><Label htmlFor="replace-schedule" className="leading-5">Je confirme le remplacement</Label></div></div>}
        <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" disabled={!className || !name.trim() || Boolean(existing && !replace)}><Plus />Créer l’emploi du temps</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}