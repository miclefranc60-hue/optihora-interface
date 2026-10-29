import { z } from "zod";
import type { Subject } from "@/lib/data";
import { ensureUniqueName } from "@/lib/school-records";

export function createSubject(catalog: Subject[], name: string, id: string): Subject {
  const parsed = z.string().trim().min(1, "Le nom de la matière est obligatoire.").max(100, "Le nom ne doit pas dépasser 100 caractères.").safeParse(name);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Nom invalide.");
  ensureUniqueName(catalog, parsed.data);
  return { id, name: parsed.data, color: "var(--primary)" };
}
export function findSubject(catalog: Subject[], id: string): Subject {
  return catalog.find((subject) => subject.id === id) ?? { id, name: "Matière inconnue", color: "var(--muted-foreground)" };
}
export function subjectTextClass(id: string) {
  return ["math", "fr", "hg", "ang", "svt", "phy", "eps"].includes(id) ? `subject-text-${id}` : "text-primary";
}