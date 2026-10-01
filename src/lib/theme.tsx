"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "light" | "dark";
const Ctx = createContext<{ mode: Mode; toggle(): void; set(m: Mode): void }>({ mode: "light", toggle() {}, set() {} });


export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const set = (m: Mode) => {
    setMode(m);
    document.documentElement.classList.toggle("dark", m === "dark");
    try {
      localStorage.setItem("theme", m);
    } catch {}
  };

  return <Ctx.Provider value={{ mode, set, toggle: () => set(mode === "dark" ? "light" : "dark") }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
