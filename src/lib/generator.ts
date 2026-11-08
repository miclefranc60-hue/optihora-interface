import type { Lesson } from "@/lib/data";
import type { Room, Teacher } from "@/lib/school-records";
import { dayCourseSlots, teacherUnavailable, type SchoolSettings, type Unavailability } from "@/lib/settings";
import { emptyTimetable, type Schedule } from "@/lib/timetable";

export const MAX_PER_DAY = 2;
type Input = {
  className: string; hours: Record<string, number>; settings: SchoolSettings; teachers: Teacher[]; rooms: Room[];
  constraints: Unavailability[]; schedules: Record<string, Schedule>; random?: () => number;
};

/** Génère une grille : au plus 2 h d'une même matière par jour (donc jamais 3 h d'affilée), matières variées. */
export function generateTimetable({ className, hours, settings, teachers, rooms, constraints, schedules, random = Math.random }: Input) {
  const grid = emptyTimetable();
  const remaining: Record<string, number> = Object.fromEntries(Object.entries(hours).filter(([, value]) => value > 0));
  const others = Object.entries(schedules).filter(([name]) => name !== className).map(([, schedule]) => schedule.grid);
  const days = grid.length;
  for (let day = 0; day < days; day++) {
    const starts = dayCourseSlots(settings, day);
    const left = Object.values(remaining).reduce((sum, value) => sum + value, 0);
    const target = Math.min(starts.length, Math.ceil(left / (days - day)));
    const row = grid[day];
    if (!row) continue;
    const perDay: Record<string, number> = {};
    let placed = 0;
    for (let slot = 0; slot < starts.length && placed < target; slot++) {
      const start = starts[slot];
      if (!start) continue;
      const previous = row[slot - 1]?.subject;
      const candidates = Object.keys(remaining).filter((subject) => (remaining[subject] ?? 0) > 0 && (perDay[subject] ?? 0) < MAX_PER_DAY)
        .map((subject) => ({ subject, teacher: pickTeacher(subject, start) }))
        .filter((item): item is { subject: string; teacher: string } => Boolean(item.teacher))
        .map((item) => ({ ...item, score: (remaining[item.subject] ?? 0) + random() * 2 - (item.subject === previous ? 3 : 0) }))
        .sort((a, b) => b.score - a.score);
      const choice = candidates[0];
      if (!choice) continue;
      const usedRooms = new Set(others.map((other) => other[day]?.[slot]?.room).filter(Boolean));
      const room = rooms.find((item) => !usedRooms.has(item.name))?.name ?? "";
      row[slot] = { subject: choice.subject, teacher: choice.teacher, room } satisfies Lesson;
      remaining[choice.subject] = (remaining[choice.subject] ?? 0) - 1; perDay[choice.subject] = (perDay[choice.subject] ?? 0) + 1; placed++;

      function pickTeacher(subject: string, start: string) {
        const free = teachers.filter((teacher) => teacher.subject === subject
          && !teacherUnavailable(constraints, teacher.name, day, start, settings.duration)
          && (settings.allowSimultaneousLessons || !others.some((other) => other[day]?.[slot]?.teacher === teacher.name)));
        return (free.find((teacher) => teacher.classes.includes(className)) ?? free[0])?.name;
      }
    }
  }
  const unplaced = Object.fromEntries(Object.entries(remaining).filter(([, value]) => value > 0));
  return { grid, unplaced };
}
