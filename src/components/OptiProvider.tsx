import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { OptiMood } from "@/lib/opti-assets";

type Activity = { mood: OptiMood; message: string; id: number };
const OptiContext = createContext<{ activity: Activity | null; react: (mood: OptiMood, message: string) => void } | null>(null);
export function OptiProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const react = useCallback((mood: OptiMood, message: string) => setActivity({ mood, message, id: Date.now() }), []);
  useEffect(() => {
    if (!activity) return;
    const timer = setTimeout(() => setActivity(null), 5000);
    return () => clearTimeout(timer);
  }, [activity]);
  return <OptiContext.Provider value={{ activity, react }}>{children}</OptiContext.Provider>;
}
export function useOpti() {
  const context = useContext(OptiContext);
  if (!context) throw new Error("OptiProvider is required");
  return context;
}