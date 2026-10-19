export type Subject = { id: string; name: string; color: string };
export const subjects: Subject[] = [
  { id: "math", name: "Mathématiques", color: "var(--subject-1)" },
  { id: "fr", name: "Français", color: "var(--subject-2)" },
  { id: "hg", name: "Histoire-Géo", color: "var(--subject-3)" },
  { id: "ang", name: "Anglais", color: "var(--subject-4)" },
  { id: "svt", name: "SVT", color: "var(--subject-5)" },
  { id: "phy", name: "Physique-Chimie", color: "var(--subject-6)" },
  { id: "eps", name: "EPS", color: "var(--subject-7)" },
];

export const teachers = [
  { name: "Mme Laurent", subject: "math", hours: 18, classes: ["6eA", "5eB", "4eA"] },
  { name: "M. Durand", subject: "fr", hours: 17, classes: ["6eA", "3eC"] },
  { name: "Mme Petit", subject: "hg", hours: 15, classes: ["5eB", "4eA", "3eC"] },
  { name: "M. Moreau", subject: "ang", hours: 18, classes: ["6eA", "5eB"] },
  { name: "Mme Bernard", subject: "svt", hours: 14, classes: ["4eA", "3eC"] },
  { name: "M. Lefèvre", subject: "phy", hours: 16, classes: ["4eA", "3eC"] },
  { name: "M. Garcia", subject: "eps", hours: 20, classes: ["6eA", "5eB", "4eA", "3eC"] },
];

export const classes = [
  { name: "6eA", level: "Collège", students: 26, mainTeacher: "Mme Laurent", hours: 26 },
  { name: "5eB", level: "Collège", students: 28, mainTeacher: "Mme Petit", hours: 25 },
  { name: "4eA", level: "Collège", students: 27, mainTeacher: "M. Lefèvre", hours: 26 },
  { name: "3eC", level: "Collège", students: 25, mainTeacher: "M. Durand", hours: 27 },
  { name: "2nde1", level: "Lycée", students: 32, mainTeacher: "Mme Bernard", hours: 28 },
  { name: "CM2", level: "École", students: 24, mainTeacher: "M. Garcia", hours: 24 },
];

export const rooms = [
  { name: "A101", type: "Salle de cours", capacity: 30, occupancy: 82 },
  { name: "A102", type: "Salle de cours", capacity: 30, occupancy: 74 },
  { name: "B201", type: "Laboratoire", capacity: 24, occupancy: 61 },
  { name: "B202", type: "Salle informatique", capacity: 20, occupancy: 45 },
  { name: "Gymnase", type: "Sport", capacity: 60, occupancy: 90 },
  { name: "CDI", type: "Bibliothèque", capacity: 40, occupancy: 38 },
];

export const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
export const slots = ["08:00", "09:00", "10:00", "11:00", "13:30", "14:30", "15:30", "16:30"];

export type Lesson = { subject: string; teacher: string; room: string } | null;

const pattern = ["math", "fr", "ang", "hg", "svt", "phy", "eps", "fr", "math", "ang"];
export function buildTimetable(className: string): Lesson[][] {
  const seed = className.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return days.map((_, d) =>
    slots.map((_, s) => {
      if (d === 2 && s >= 4) return null;
      if ((seed + d * 3 + s * 7) % 9 === 0) return null;
      const subject = pattern[(seed + d * 5 + s) % pattern.length];
      const t = teachers.find((x) => x.subject === subject)!;
      const room = subject === "eps" ? "Gymnase" : subject === "svt" || subject === "phy" ? "B201" : rooms[(d + s) % 2].name;
      return { subject, teacher: t.name, room };
    }),
  );
}

export const subjectById = (id: string) => subjects.find((s) => s.id === id)!;
