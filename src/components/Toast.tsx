"use client";
import { createContext, useCallback, useContext, useState, useEffect } from "react";

type Toast = { id: number; text: string };
const Ctx = createContext<(t: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), text }]);
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((p) => p.slice(1)), 2600);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed z-50 bottom-20 sm:bottom-6 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fadein pointer-events-auto bg-ink text-white text-sm px-4 py-2 rounded-md shadow-card"
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
