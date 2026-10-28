import { createContext, useContext, useState, type ReactNode } from "react";
import { classes as initialClasses, teachers as initialTeachers, rooms as initialRooms } from "@/lib/data";
import { classSchema, teacherSchema, roomSchema, ensureUniqueName, type SchoolClass, type Teacher, type Room } from "@/lib/school-records";

type SchoolState = {
  classes: SchoolClass[]; teachers: Teacher[]; rooms: Room[];
  addClass: (value: SchoolClass) => void;
  addTeacher: (value: Teacher) => void;
  addRoom: (value: Room) => void;
};
const SchoolContext = createContext<SchoolState | null>(null);
export function SchoolProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  return <SchoolContext.Provider value={{ classes, teachers, rooms,
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