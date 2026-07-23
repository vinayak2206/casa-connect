import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitCompare, ArrowRight } from "lucide-react";
import { useCompare } from "@/context/CompareContext";

export default function CompareBar() {
  const { items, remove, clear, max } = useCompare();
  const { pathname } = useLocation();

  // Don't show on the compare page itself or auth page
  if (pathname === "/compare" || pathname === "/auth") return null;

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          data-testid="compare-bar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:left-6 z-40"
        >
          <div className="max-w-7xl mx-auto bg-[#1A1C19] text-stone-100 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.25)] border border-stone-800">
            <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5">
              <div className="flex items-center gap-3 md:pr-6 md:border-r md:border-stone-700">
                <GitCompare className="w-4 h-4 text-[#C86A53]" strokeWidth={1.5} />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-stone-400">
                    Compare
                  </div>
                  <div className="text-sm font-medium">
                    {items.length} of {max} selected
                  </div>
                </div>
              </div>

              <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar">
                {items.map((p) => (
                  <div
                    key={p.id}
                    data-testid={`compare-chip-${p.id}`}
                    className="relative flex items-center gap-2 pl-1 pr-3 py-1 border border-stone-700 bg-stone-900/60 shrink-0"
                  >
                    <img src={p.images?.[0]} alt="" className="w-10 h-10 object-cover" />
                    <div className="min-w-0 max-w-[180px]">
                      <div className="text-xs truncate text-stone-100">{p.title}</div>
                      <div className="text-[10px] text-stone-400 truncate">{p.city}</div>
                    </div>
                    <button
                      data-testid={`compare-remove-${p.id}`}
                      onClick={() => remove(p.id)}
                      className="ml-2 text-stone-400 hover:text-[#C86A53]"
                      aria-label="Remove"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 md:pl-4">
                <button
                  data-testid="compare-clear-btn"
                  onClick={clear}
                  className="text-xs text-stone-400 hover:text-white px-3 py-2"
                >
                  Clear
                </button>
                <Link
                  to="/compare"
                  data-testid="compare-view-btn"
                  className="inline-flex items-center gap-2 bg-[#C86A53] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#D87A63] transition"
                >
                  Compare <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
