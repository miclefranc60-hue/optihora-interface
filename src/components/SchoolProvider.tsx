import { createContext, useContext, useState, type ReactNode } from "react";
import { classes as initialClasses, teachers as initialTeachers, rooms as initialRooms } from "@/lib/data";
import { classSchema, teacherSchema, roomSchema, ensureUniqueName, type SchoolClass, type Teacher, type Room } from "@/lib/school-records";
import { buildTimetable, type Lesson } from "@/lib/data";
import { emptyTimetable, type Schedule } from "@/lib/timetable";

type SchoolState = {
  classes: SchoolClass[]; teachers: Teacher[]; rooms: Room[];
  addClass: (value: SchoolClass) => void;
  addTeacher: (value: Teacher) => void;
  addRoom: (value: Room) => void;
  schedules: Record<string, Schedule>;
  createSchedule: (className: string, name: string) => void;
  setLesson: (className: string, day: number, slot: number, lesson: Lesson) => void;
};
const SchoolContext = createContext<SchoolState | null>(null);
export function SchoolProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<SchoolClass[]>(() => classSchema.array().parse(initialClasses));
  const [teachers, setTeachers] = useState<Teacher[]>(() => teacherSchema.array().parse(initialTeachers));
  const [rooms, setRooms] = useState<Room[]>(() => roomSchema.array().parse(initialRooms));
  const [schedules, setSchedules] = useState<Record<string, Schedule>>(() => Object.fromEntries(initialClasses.map((item) => [item.name, { name: `Semaine type · ${item.name}`, grid: buildTimetable(item.name) }])));
  return <SchoolContext.Provider value={{ classes, teachers, rooms, schedules,
    createSchedule: (className, name) => {
      if (!classes.some((item) => item.name === className) || !name.trim()) throw new Error("Choisissez une classe et un nom.");
      setSchedules((previous) => ({ ...previous, [className]: { name: name.trim(), grid: emptyTimetable() } }));
    },
    setLesson: (className, day, slot, lesson) => setSchedules((previous) => {
      const schedule = previous[className];
      if (!schedule) return previous;
      return { ...previous, [className]: { ...schedule, grid: schedule.grid.map((row, d) => row.map((value, s) => d === day && s === slot ? lesson : value)) } };
    }),
    addClass: (value) => {
      const record = classSchema.parse(value);
      ensureUniqueName(classes, record.name);
      setClasses((previous) => [...previous, record]);
      if (record.mainTeacher) setTeachers((previous) => previous.map((teacher) => teacher.name === record.mainTeacher ? { ...teacher, classes: [...new Set([...teacher.classes, record.name])] } : teacher));
    },
    addTeacher: (value) => {
      const record = teacherSchema.parse(value);
      ensureUniqueName(teachers, record.name);
      setTeachers((previous) => [...previous, record]);
    },
    addRoom: (value) => {
      const record = roomSchema.parse(value);
      ensureUniqueName(rooms, record.name);
      setRooms((previous) => [...previous, record]);
    },
  }}>{children}</SchoolContext.Provider>;
}
export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) throw new Error("SchoolProvider is required");
  return context;
}