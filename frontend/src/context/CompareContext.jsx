import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const CompareContext = createContext(null);
const KEY = "cc_compare_v1";
const MAX = 3;

export function CompareProvider({ children }) {
  // Lazy init from localStorage to avoid a race condition between load and
  // save effects (previously the save-effect wiped LS to [] on first mount).
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const has = (id) => items.some((p) => p.id === id);

  const toggle = (property) => {
    if (has(property.id)) {
      setItems((it) => it.filter((p) => p.id !== property.id));
      toast.success("Removed from compare");
    } else {
      if (items.length >= MAX) {
        toast.error(`You can compare up to ${MAX} homes`);
        return;
      }
      setItems((it) => [...it, property]);
      toast.success("Added to compare");
    }
  };

  const remove = (id) => setItems((it) => it.filter((p) => p.id !== id));
  const clear = () => setItems([]);

  return (
    <CompareContext.Provider value={{ items, has, toggle, remove, clear, max: MAX }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
