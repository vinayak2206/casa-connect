import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bed, Bath, Square, MapPin, Heart, Share2, Check, ArrowLeft } from "lucide-react";
import { api, formatPrice } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`).then(({ data }) => {
      setProperty(data.property);
      setLoading(false);
      setForm((f) => ({ ...f, message: `I'd like more information about "${data.property.title}".` }));
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user && user.role === "user") {
      api.get("/favorites").then(({ data }) => {
        setIsFav((data.favorites || []).some((p) => p.id === id));
      });
      setForm((f) => ({ ...f, name: user.name || f.name, email: user.email || f.email }));
    }
  }, [user, id]);

  const toggleFav = async () => {
    if (!user) return toast.error("Please sign in to save favorites");
    if (isFav) {
      await api.delete(`/favorites/${id}`);
      setIsFav(false);
      toast.success("Removed from favorites");
    } else {
      await api.post(`/favorites/${id}`);
      setIsFav(true);
      toast.success("Saved to favorites");
    }
  };

  const submitInquiry = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/inquiries", { property_id: id, ...form });
      setSent(true);
      toast.success("Inquiry sent — the owner will be in touch shortly");
    } catch (e) {
      toast.error("Unable to send inquiry. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
        <div className="font-serif text-3xl text-stone-400 italic">loading…</div>
      </div>
    );
  }
  if (!property) {
    return (
      <div className="pt-32 max-w-4xl mx-auto px-6 text-center">
        <h1 className="font-serif text-4xl">Property not found</h1>
        <Link to="/listings" className="mt-6 inline-block text-[#C86A53] underline">Back to listings</Link>
      </div>
    );
  }

  return (
    <div data-testid="property-detail-page" className="pt-24 pb-24 bg-[#F7F5F0]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Link
          to="/listings"
          data-testid="back-to-listings-link"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#1E1E1E] mb-6"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> All listings
        </Link>

        {/* Gallery — 2x2 grid, all 4 images visible */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-3 md:gap-4"
        >
          {(property.images || []).slice(0, 4).map((img, idx) => (
            <button
              key={idx}
              data-testid={`gallery-thumb-${idx}`}
              onClick={() => setActiveImg(idx)}
              className={`relative aspect-[4/3] overflow-hidden bg-stone-100 group ${
                activeImg === idx ? "ring-2 ring-[#2C3D30] ring-offset-2 ring-offset-[#F7F5F0]" : ""
              }`}
            >
              <img
                src={img}
                alt={`${property.title} — view ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600";
                }}
              />
              {idx === 0 && (
                <div className="absolute top-3 left-3 flex gap-2">
                  {property.featured && (
                    <span className="bg-[#C86A53] text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 font-medium">
                      Featured
                    </span>
                  )}
                  <span className="bg-white/95 text-[#1E1E1E] text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 font-medium">
                    {property.listing_type === "rent" ? "For Rent" : "For Sale"}
                  </span>
                </div>
              )}
            </button>
          ))}
          {/* Fill placeholders if fewer than 4 images */}
          {Array.from({ length: Math.max(0, 4 - (property.images?.length || 0)) }).map((_, i) => (
            <div key={`ph-${i}`} className="relative aspect-[4/3] overflow-hidden bg-stone-100 flex items-center justify-center">
              <span className="font-serif italic text-stone-300 text-lg">no image</span>
            </div>
          ))}
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          <div className="lg:col-span-7">
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-500">{property.type}</span>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight mt-3">{property.title}</h1>
            <div className="flex items-center gap-2 text-stone-500 mt-3">
              <MapPin className="w-4 h-4" strokeWidth={1.5} /> {property.address}
            </div>

            <div className="flex items-center gap-8 mt-8 pt-8 border-t border-stone-200 text-sm">
              {property.type !== "land" && (
                <>
                  <Stat icon={<Bed className="w-5 h-5" strokeWidth={1.5} />} value={property.bedrooms} label="beds" />
                  <Stat icon={<Bath className="w-5 h-5" strokeWidth={1.5} />} value={property.bathrooms} label="baths" />
                </>
              )}
              <Stat icon={<Square className="w-5 h-5" strokeWidth={1.5} />} value={property.area.toLocaleString()} label="sqft" />
            </div>

            <div className="mt-10">
              <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-4">Description</div>
              <p className="text-stone-700 leading-relaxed text-lg whitespace-pre-line">{property.description}</p>
            </div>

            {property.amenities?.length > 0 && (
              <div className="mt-12">
                <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-4">Amenities</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-stone-700">
                      <Check className="w-4 h-4 text-[#C86A53]" strokeWidth={2} />
                      <span className="text-sm">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar card */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="bg-white border border-stone-200 p-8">
                <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
                  {property.listing_type === "rent" ? "Monthly rent" : "Asking price"}
                </div>
                <div className="font-serif text-5xl mt-2 text-[#1E1E1E]">
                  {formatPrice(property.price, property.listing_type)}
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    data-testid="detail-favorite-btn"
                    onClick={toggleFav}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-3 border transition ${
                      isFav
                        ? "bg-[#C86A53] text-white border-[#C86A53]"
                        : "border-stone-300 text-stone-700 hover:border-[#1E1E1E]"
                    }`}
                  >
                    <Heart className="w-4 h-4" fill={isFav ? "currentColor" : "none"} strokeWidth={1.5} />
                    {isFav ? "Saved" : "Save"}
                  </button>
                  <button
                    data-testid="detail-share-btn"
                    onClick={share}
                    className="w-12 h-12 border border-stone-300 flex items-center justify-center text-stone-700 hover:border-[#1E1E1E] transition"
                  >
                    <Share2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="border-t border-stone-100 mt-8 pt-8">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-4">
                    Request a viewing
                  </div>
                  {sent ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-[#2C3D30] mx-auto flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <div className="font-serif text-2xl mt-4">Inquiry sent</div>
                      <p className="text-sm text-stone-500 mt-2">
                        The owner will reach out to you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={submitInquiry} className="space-y-3" data-testid="inquiry-form">
                      <input
                        data-testid="inquiry-name"
                        required
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#2C3D30] focus:bg-white transition text-sm"
                      />
                      <input
                        data-testid="inquiry-email"
                        required
                        type="email"
                        placeholder="Email address"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#2C3D30] focus:bg-white transition text-sm"
                      />
                      <input
                        data-testid="inquiry-phone"
                        placeholder="Phone (optional)"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#2C3D30] focus:bg-white transition text-sm"
                      />
                      <textarea
                        data-testid="inquiry-message"
                        required
                        rows={4}
                        placeholder="Message"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#2C3D30] focus:bg-white transition text-sm resize-none"
                      />
                      <button
                        data-testid="inquiry-submit-btn"
                        type="submit"
                        disabled={sending}
                        className="w-full bg-[#2C3D30] text-white py-3.5 font-medium tracking-wide hover:bg-[#3A4F3E] transition disabled:opacity-60"
                      >
                        {sending ? "Sending…" : "Send inquiry"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[#C86A53]">{icon}</div>
      <div>
        <div className="font-serif text-2xl leading-none">{value}</div>
        <div className="text-[11px] uppercase tracking-widest text-stone-500 mt-1">{label}</div>
      </div>
    </div>
  );
}
