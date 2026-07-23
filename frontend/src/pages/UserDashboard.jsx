import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import { Heart, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function UserDashboard() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [tab, setTab] = useState("favorites");

  const load = async () => {
    const [f, i] = await Promise.all([
      api.get("/favorites"),
      api.get("/inquiries/mine"),
    ]);
    setFavorites(f.data.favorites || []);
    setInquiries(i.data.inquiries || []);
  };

  useEffect(() => {
    load();
  }, []);

  const removeFav = async (id) => {
    await api.delete(`/favorites/${id}`);
    setFavorites((f) => f.filter((p) => p.id !== id));
    toast.success("Removed from favorites");
  };

  return (
    <div data-testid="user-dashboard" className="pt-24 pb-24 bg-[#F7F5F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="border-b border-stone-200 pb-8 mb-10">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-500">Welcome back</span>
          <h1 className="font-serif text-5xl md:text-6xl leading-none tracking-tight mt-4">
            {user?.name || "Your account"}
          </h1>
          <p className="text-stone-500 mt-3">{user?.email}</p>
        </div>

        <div className="flex gap-8 border-b border-stone-200 mb-10">
          {[
            { v: "favorites", label: `Favorites (${favorites.length})`, icon: <Heart className="w-4 h-4" strokeWidth={1.5} /> },
            { v: "inquiries", label: `Inquiries (${inquiries.length})`, icon: <MessageSquare className="w-4 h-4" strokeWidth={1.5} /> },
          ].map((t) => (
            <button
              key={t.v}
              data-testid={`user-tab-${t.v}`}
              onClick={() => setTab(t.v)}
              className={`pb-4 text-sm font-medium tracking-wide relative transition inline-flex items-center gap-2 ${
                tab === t.v ? "text-[#1E1E1E]" : "text-stone-500 hover:text-[#1E1E1E]"
              }`}
            >
              {t.icon}
              {t.label}
              {tab === t.v && (
                <motion.div layoutId="user-tab" className="absolute bottom-0 inset-x-0 h-[2px] bg-[#2C3D30]" />
              )}
            </button>
          ))}
        </div>

        {tab === "favorites" ? (
          favorites.length === 0 ? (
            <EmptyState
              title="No favorites yet"
              copy="Tap the heart on any listing to save it here."
              cta={{ to: "/listings", label: "Browse listings" }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {favorites.map((p, i) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  index={i}
                  isFavorite
                  onToggleFavorite={removeFav}
                />
              ))}
            </div>
          )
        ) : inquiries.length === 0 ? (
          <EmptyState
            title="No inquiries yet"
            copy="Send an inquiry from any listing to start a conversation."
            cta={{ to: "/listings", label: "Browse listings" }}
          />
        ) : (
          <div className="space-y-3" data-testid="user-inquiries-list">
            {inquiries.map((inq) => (
              <div key={inq.id} className="bg-white border border-stone-200 p-6" data-testid={`user-inquiry-${inq.id}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
                      {new Date(inq.created_at).toLocaleString()} · Status: <span className="text-[#C86A53]">{inq.status}</span>
                    </div>
                    <div className="font-serif text-2xl mt-1">{inq.property_title || "Property inquiry"}</div>
                    <p className="mt-3 text-stone-700">{inq.message}</p>
                  </div>
                  {inq.property_id && (
                    <Link
                      to={`/property/${inq.property_id}`}
                      className="text-sm border border-stone-200 px-4 py-2 hover:border-[#1E1E1E] transition whitespace-nowrap"
                    >
                      View property →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, copy, cta }) {
  return (
    <div className="border border-stone-200 bg-white p-16 text-center">
      <div className="font-serif text-3xl italic text-stone-400">{title}</div>
      <p className="text-stone-500 mt-4">{copy}</p>
      <Link
        to={cta.to}
        className="mt-6 inline-flex items-center gap-2 bg-[#2C3D30] text-white px-6 py-3 text-sm hover:bg-[#3A4F3E] transition"
      >
        {cta.label} <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
