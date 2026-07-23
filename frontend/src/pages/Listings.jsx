import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, LayoutGrid, Map as MapIcon } from "lucide-react";
import { api } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import MapView from "@/components/MapView";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const PROPERTY_TYPES = ["apartment", "villa", "house", "condo", "land"];

export default function Listings() {
  const [params, setParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState(new Set());
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState(params.get("view") === "map" ? "map" : "grid");

  const filters = useMemo(
    () => ({
      q: params.get("q") || "",
      city: params.get("city") || "",
      type: params.get("type") || "",
      listing_type: params.get("listing_type") || "",
      min_price: params.get("min_price") || "",
      max_price: params.get("max_price") || "",
      beds: params.get("beds") || "",
      featured: params.get("featured") || "",
    }),
    [params]
  );

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === "" || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const clearFilters = () => setParams({}, { replace: true });

  useEffect(() => {
    setLoading(true);
    const cleaned = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
    api
      .get("/properties", { params: cleaned })
      .then(({ data }) => setProperties(data.properties || []))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    if (user && user.role === "user") {
      api.get("/favorites").then(({ data }) => {
        setFavIds(new Set((data.favorites || []).map((p) => p.id)));
      });
    }
  }, [user]);

  const toggleFavorite = async (id) => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }
    const isFav = favIds.has(id);
    const next = new Set(favIds);
    if (isFav) {
      next.delete(id);
      setFavIds(next);
      await api.delete(`/favorites/${id}`);
      toast.success("Removed from favorites");
    } else {
      next.add(id);
      setFavIds(next);
      await api.post(`/favorites/${id}`);
      toast.success("Saved to favorites");
    }
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  return (
    <div data-testid="listings-page" className="pt-28 pb-24 bg-[#F7F5F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Page header */}
        <div className="border-b border-stone-200 pb-8 mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-500">The Collection</span>
            <h1 className="font-serif text-5xl md:text-6xl leading-none tracking-tight mt-4">
              Browse listings
            </h1>
          </div>
          <div className="flex items-center gap-6">
            {/* View toggle */}
            <div className="relative flex bg-stone-100 p-1" data-testid="view-toggle">
              {[
                { v: "grid", label: "Grid", icon: <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} /> },
                { v: "map", label: "Map", icon: <MapIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> },
              ].map((opt) => (
                <button
                  key={opt.v}
                  data-testid={`view-${opt.v}`}
                  onClick={() => setView(opt.v)}
                  className="relative z-10 inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest transition-colors"
                >
                  {view === opt.v && (
                    <motion.div
                      layoutId="view-pill"
                      className="absolute inset-0 bg-white shadow-sm z-0"
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-2 ${view === opt.v ? "text-[#1E1E1E]" : "text-stone-500"}`}>
                    {opt.icon} {opt.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="text-sm text-stone-500">
              <span className="font-serif text-3xl text-[#1E1E1E]">{properties.length}</span>{" "}
              <span className="uppercase tracking-[0.2em] text-[11px] ml-1">homes</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar filters */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28 space-y-8">
              <button
                data-testid="mobile-filter-toggle"
                onClick={() => setSidebarOpen((v) => !v)}
                className="lg:hidden w-full flex items-center justify-between border border-stone-200 bg-white px-4 py-3 text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} /> Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-[#C86A53] text-white text-[10px] px-1.5 py-0.5">{activeFilterCount}</span>
                  )}
                </span>
                <span className="text-xs uppercase tracking-widest">{sidebarOpen ? "Hide" : "Show"}</span>
              </button>

              <div className={`${sidebarOpen ? "block" : "hidden"} lg:block space-y-8`}>
                {/* Search */}
                <div>
                  <FilterLabel>Search</FilterLabel>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" strokeWidth={1.5} />
                    <input
                      data-testid="filter-search-input"
                      value={filters.q}
                      onChange={(e) => updateFilter("q", e.target.value)}
                      placeholder="City, area, address…"
                      className="w-full pl-9 pr-3 py-3 bg-white border border-stone-200 focus:outline-none focus:border-[#2C3D30] text-sm"
                    />
                  </div>
                </div>

                {/* Listing type */}
                <div>
                  <FilterLabel>Listing type</FilterLabel>
                  <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1">
                    {[
                      { v: "", label: "All" },
                      { v: "sale", label: "Buy" },
                      { v: "rent", label: "Rent" },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        data-testid={`filter-listing-${opt.label.toLowerCase()}`}
                        onClick={() => updateFilter("listing_type", opt.v)}
                        className={`py-2 text-xs uppercase tracking-widest transition ${
                          (filters.listing_type || "") === opt.v
                            ? "bg-white text-[#1E1E1E] shadow-sm"
                            : "text-stone-500 hover:text-[#1E1E1E]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <FilterLabel>Property type</FilterLabel>
                  <div className="flex flex-wrap gap-2">
                    {["", ...PROPERTY_TYPES].map((t) => (
                      <button
                        key={t || "all"}
                        data-testid={`filter-type-${t || "all"}`}
                        onClick={() => updateFilter("type", t)}
                        className={`px-3 py-1.5 text-xs border transition capitalize ${
                          filters.type === t
                            ? "bg-[#2C3D30] text-white border-[#2C3D30]"
                            : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                        }`}
                      >
                        {t || "any"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Beds */}
                <div>
                  <FilterLabel>Bedrooms</FilterLabel>
                  <div className="flex gap-2">
                    {["", "1", "2", "3", "4", "5"].map((b) => (
                      <button
                        key={b || "any"}
                        data-testid={`filter-beds-${b || "any"}`}
                        onClick={() => updateFilter("beds", b)}
                        className={`w-10 h-10 text-sm border transition ${
                          (filters.beds || "") === b
                            ? "bg-[#2C3D30] text-white border-[#2C3D30]"
                            : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                        }`}
                      >
                        {b === "" ? "any" : `${b}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <FilterLabel>Price</FilterLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      data-testid="filter-min-price"
                      type="number"
                      placeholder="Min"
                      value={filters.min_price}
                      onChange={(e) => updateFilter("min_price", e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-stone-200 focus:outline-none focus:border-[#2C3D30] text-sm"
                    />
                    <input
                      data-testid="filter-max-price"
                      type="number"
                      placeholder="Max"
                      value={filters.max_price}
                      onChange={(e) => updateFilter("max_price", e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-stone-200 focus:outline-none focus:border-[#2C3D30] text-sm"
                    />
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    data-testid="clear-filters-btn"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#C86A53] transition"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} /> Clear all filters
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Grid / Map */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border border-stone-200 aspect-[4/5] animate-pulse" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="border border-stone-200 bg-white p-16 text-center">
                <div className="font-serif text-3xl italic text-stone-400">No homes match your search.</div>
                <p className="text-stone-500 mt-4">Try widening the filters or clearing them.</p>
                <button
                  onClick={clearFilters}
                  data-testid="empty-clear-btn"
                  className="mt-6 inline-flex bg-[#2C3D30] text-white px-6 py-3 text-sm hover:bg-[#3A4F3E] transition"
                >
                  Clear filters
                </button>
              </div>
            ) : view === "map" ? (
              <MapView properties={properties} />
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
              >
                {properties.map((p, i) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    index={i}
                    isFavorite={favIds.has(p.id)}
                    onToggleFavorite={user?.role !== "admin" ? toggleFavorite : undefined}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterLabel({ children }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-stone-500 mb-3">
      {children}
    </div>
  );
}
