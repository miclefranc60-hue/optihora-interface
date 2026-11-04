import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
const STORAGE_KEY = "optihora-data-v1";
import { classes as initialClasses, teachers as initialTeachers, rooms as initialRooms } from "@/lib/data";
import { classSchema, teacherSchema, roomSchema, ensureUniqueName, type SchoolClass, type Teacher, type Room } from "@/lib/school-records";
import { buildTimetable, subjects as initialSubjects, type Subject, type Lesson } from "@/lib/data";
import { createSubject, findSubject } from "@/lib/subjects";
import { emptyTimetable, updateScheduleLesson, type Schedule } from "@/lib/timetable";
import { defaultSettings, settingsSchema, unavailabilitySchema, teacherUnavailable, courseSlots, type SchoolSettings, type Unavailability } from "@/lib/settings";

type SchoolState = {
  classes: SchoolClass[]; teachers: Teacher[]; rooms: Room[];
  addClass: (value: SchoolClass) => void;
  addTeacher: (value: Teacher) => void;
  addRoom: (value: Room) => void;
  schedules: Record<string, Schedule>;
  createSchedule: (className: string, name: string) => void;
  setLesson: (className: string, day: number, slot: number, lesson: Lesson) => void;
  settings: SchoolSettings;
  saveSettings: (value: SchoolSettings) => void;
  constraints: Unavailability[];
  addConstraint: (value: Unavailability) => void;
  removeConstraint: (id: string) => void;
  subjects: Subject[];
  addSubject: (name: string) => Subject;
  subjectById: (id: string) => Subject;
};
const SchoolContext = createContext<SchoolState | null>(null);
export function SchoolProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<SchoolClass[]>(() => classSchema.array().parse(initialClasses));
  const [teachers, setTeachers] = useState<Teacher[]>(() => teacherSchema.array().parse(initialTeachers));
  const [rooms, setRooms] = useState<Room[]>(() => roomSchema.array().parse(initialRooms));
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [constraints, setConstraints] = useState<Unavailability[]>([]);
  const [schedules, setSchedules] = useState<Record<string, Schedule>>(() => Object.fromEntries(initialClasses.map((item) => [item.name, { name: `Semaine type · ${item.name}`, grid: buildTimetable(item.name) }])));
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.classes) setClasses(classSchema.array().parse(saved.classes));
        if (saved.teachers) setTeachers(teacherSchema.array().parse(saved.teachers));
        if (saved.rooms) setRooms(roomSchema.array().parse(saved.rooms));
        if (saved.subjects) setSubjects(saved.subjects);
        if (saved.settings) setSettings(settingsSchema.parse(saved.settings));
        if (saved.constraints) setConstraints(saved.constraints.map((item: unknown) => unavailabilitySchema.parse(item)));
        if (saved.schedules) setSchedules(saved.schedules);
      }
    } catch { /* données invalides : on garde les valeurs par défaut */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ classes, teachers, rooms, subjects, settings, constraints, schedules }));
  }, [loaded, classes, teachers, rooms, subjects, settings, constraints, schedules]);
  return <SchoolContext.Provider value={{ classes, teachers, rooms, schedules, settings, constraints, subjects,
    subjectById: (id) => findSubject(subjects, id),
    addSubject: (name) => {
      const subject = createSubject(subjects, name, `custom-${crypto.randomUUID()}`);
      setSubjects((previous) => [...previous, subject]);
      setSettings((previous) => ({ ...previous, includedSubjects: [...previous.includedSubjects, subject.id] }));
      return subject;
    },
    saveSettings: (value) => {
      const parsed = settingsSchema.parse(value);
      if (parsed.includedSubjects.some((id) => !subjects.some((subject) => subject.id === id))) throw new Error("Matière inconnue.");
      setSettings(parsed);
    },
    addConstraint: (value) => {
      const constraint = unavailabilitySchema.parse(value);
      if (!teachers.some((teacher) => teacher.name === constraint.teacher)) throw new Error("Enseignant inconnu.");
      setConstraints((previous) => [...previous, constraint]);
    },
    removeConstraint: (id) => setConstraints((previous) => previous.filter((constraint) => constraint.id !== id)),
    createSchedule: (className, name) => {
      if (!classes.some((item) => item.name === className) || !name.trim()) throw new Error("Choisissez une classe et un nom.");
      setSchedules((previous) => ({ ...previous, [className]: { name: name.trim(), grid: emptyTimetable() } }));
    },
    setLesson: (className, day, slot, lesson) => {
      const start = courseSlots(settings.duration)[slot];
      if (!start || day < 0 || day > 4) throw new Error("Créneau invalide.");
      if (lesson && !settings.includedSubjects.includes(lesson.subject)) throw new Error("Cette matière n’est pas incluse.");
      if (lesson && teacherUnavailable(constraints, lesson.teacher, day, start, settings.duration)) throw new Error("Cet enseignant est indisponible sur ce créneau.");
      setSchedules(updateScheduleLesson(schedules, className, day, slot, lesson, settings.allowSimultaneousLessons));
    },
    addClass: (value) => {
      const record = classSchema.parse(value);
      ensureUniqueName(classes, record.name);
      setClasses((previous) => [...previous, record]);
      if (record.mainTeacher) setTeachers((previous) => previous.map((teacher) => teacher.name === record.mainTeacher ? { ...teacher, classes: [...new Set([...teacher.classes, record.name])] } : teacher));
    },
    addTeacher: (value) => {
      const record = teacherSchema.parse(value);
      if (!subjects.some((subject) => subject.id === record.subject)) throw new Error("Matière inconnue.");
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