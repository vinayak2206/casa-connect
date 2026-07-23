import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api, formatPrice } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Home, Users, MessageSquare, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [tab, setTab] = useState("properties");

  const loadAll = async () => {
    const [s, p, i] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/properties", { params: { limit: 200 } }),
      api.get("/inquiries"),
    ]);
    setStats(s.data);
    setProperties(p.data.properties || []);
    setInquiries(i.data.inquiries || []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const deleteProp = async (id) => {
    if (!window.confirm("Delete this property permanently?")) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success("Property removed");
      loadAll();
    } catch {
      toast.error("Unable to delete");
    }
  };

  return (
    <div data-testid="admin-dashboard" className="pt-24 pb-24 bg-[#F7F5F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="border-b border-stone-200 pb-8 mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-500">Admin</span>
            <h1 className="font-serif text-5xl md:text-6xl leading-none tracking-tight mt-4">
              Studio · {user?.name?.split(" ")[0] || "Admin"}
            </h1>
            <p className="text-stone-500 mt-3">Manage listings and inquiries.</p>
          </div>
          <Link
            to="/admin/property/new"
            data-testid="admin-new-property-btn"
            className="inline-flex items-center gap-2 bg-[#2C3D30] text-white px-6 py-3.5 font-medium tracking-wide hover:bg-[#3A4F3E] transition"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} /> New listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard label="Total listings" value={stats?.total_properties ?? "—"} icon={<Home />} />
          <StatCard label="Active" value={stats?.active_listings ?? "—"} icon={<TrendingUp />} />
          <StatCard label="Registered buyers" value={stats?.total_users ?? "—"} icon={<Users />} />
          <StatCard label="Inquiries" value={stats?.total_inquiries ?? "—"} icon={<MessageSquare />} />
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-stone-200 mb-8">
          {[
            { v: "properties", label: `Listings (${properties.length})` },
            { v: "inquiries", label: `Inquiries (${inquiries.length})` },
          ].map((t) => (
            <button
              key={t.v}
              data-testid={`admin-tab-${t.v}`}
              onClick={() => setTab(t.v)}
              className={`pb-4 text-sm font-medium tracking-wide relative transition ${
                tab === t.v ? "text-[#1E1E1E]" : "text-stone-500 hover:text-[#1E1E1E]"
              }`}
            >
              {t.label}
              {tab === t.v && (
                <motion.div layoutId="admin-tab" className="absolute bottom-0 inset-x-0 h-[2px] bg-[#2C3D30]" />
              )}
            </button>
          ))}
        </div>

        {tab === "properties" ? (
          <div className="bg-white border border-stone-200 overflow-hidden">
            <table className="w-full text-sm" data-testid="admin-properties-table">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.2em] text-stone-500">
                <tr>
                  <th className="text-left py-4 px-6">Property</th>
                  <th className="text-left py-4 px-6 hidden md:table-cell">City</th>
                  <th className="text-left py-4 px-6 hidden md:table-cell">Type</th>
                  <th className="text-left py-4 px-6">Price</th>
                  <th className="text-right py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p.id} className="border-t border-stone-100" data-testid={`admin-row-${p.id}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]} alt="" className="w-14 h-14 object-cover" />
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-stone-500 md:hidden">{p.city} · {p.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell text-stone-600">{p.city}</td>
                    <td className="py-4 px-6 hidden md:table-cell capitalize text-stone-600">{p.type}</td>
                    <td className="py-4 px-6 font-serif text-lg">{formatPrice(p.price, p.listing_type)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/admin/property/${p.id}`}
                          data-testid={`admin-edit-${p.id}`}
                          className="w-9 h-9 border border-stone-200 flex items-center justify-center hover:border-[#2C3D30] transition"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </Link>
                        <button
                          data-testid={`admin-delete-${p.id}`}
                          onClick={() => deleteProp(p.id)}
                          className="w-9 h-9 border border-stone-200 flex items-center justify-center hover:border-[#C86A53] hover:text-[#C86A53] transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr><td colSpan={5} className="py-16 text-center text-stone-500">No listings yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3" data-testid="admin-inquiries-list">
            {inquiries.length === 0 ? (
              <div className="bg-white border border-stone-200 p-16 text-center text-stone-500">
                No inquiries yet.
              </div>
            ) : (
              inquiries.map((inq) => (
                <div key={inq.id} className="bg-white border border-stone-200 p-6" data-testid={`inquiry-${inq.id}`}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
                        {new Date(inq.created_at).toLocaleString()}
                      </div>
                      <div className="font-serif text-2xl mt-1">{inq.name}</div>
                      <div className="text-sm text-stone-500 mt-1">
                        {inq.email}{inq.phone ? ` · ${inq.phone}` : ""}
                      </div>
                      <div className="mt-3 text-stone-700">{inq.message}</div>
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
                  {inq.property_title && (
                    <div className="text-xs text-stone-500 mt-3 uppercase tracking-widest">
                      About: {inq.property_title}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white border border-stone-200 p-6">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">{label}</div>
        <div className="text-stone-400">{icon}</div>
      </div>
      <div className="font-serif text-4xl mt-3">{value}</div>
    </div>
  );
}
