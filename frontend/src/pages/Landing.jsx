import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Search, Star } from "lucide-react";
import { api } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";

const cities = ["Malibu", "San Francisco", "New York", "Miami", "Aspen", "Napa", "Austin", "Santa Fe", "Portland", "Newport"];

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/properties", { params: { featured: true, limit: 6 } }).then(({ data }) => {
      setFeatured(data.properties || []);
    });
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div data-testid="landing-page" className="bg-[#F7F5F0]">
      {/* HERO — asymmetric bento */}
      <section className="pt-32 pb-16 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-5 lg:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block text-[11px] uppercase tracking-[0.3em] text-stone-500 mb-8">
                Est. — Editorial Real Estate
              </span>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[88px] leading-[0.95] tracking-tight text-[#1E1E1E]">
                Homes that <em className="italic font-light text-[#C86A53]">breathe</em>,<br />
                spaces that <em className="italic font-light">stay</em>.
              </h1>
              <p className="mt-8 text-lg text-stone-600 max-w-md leading-relaxed">
                A quietly curated collection of architectural residences —
                from cliffside villas to city lofts. No noise. No filler. Only homes worth living in.
              </p>

              <form
                onSubmit={handleSearch}
                data-testid="hero-search-form"
                className="mt-10 bg-white border border-stone-200 p-2 flex flex-col sm:flex-row gap-2 w-full max-w-full overflow-hidden"
              >
                <div className="flex-1 min-w-0 flex items-center gap-2 px-3">
                  <Search className="hidden md:block w-4 h-4 text-stone-400 shrink-0" strokeWidth={1.5} />
                  <input
                    data-testid="hero-search-input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search city or area…"
                    className="w-full min-w-0 py-3 text-sm bg-transparent focus:outline-none placeholder:text-stone-400"
                  />
                </div>
                <select
                  data-testid="hero-city-select"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="shrink-0 px-2 py-3 text-sm bg-stone-50 sm:border-l border-stone-100 focus:outline-none max-w-[110px]"
                >
                  <option value="">All cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  data-testid="hero-search-btn"
                  className="shrink-0 bg-[#2C3D30] text-white px-5 py-3 text-sm font-medium tracking-wide hover:bg-[#3A4F3E] transition inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Explore <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </form>

              <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                <Stat label="Listings" value="420+" />
                <Stat label="Cities" value="28" />
                <Stat label="Owners" value="12k" />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 relative"
          >
            <div className="relative aspect-[4/5] lg:aspect-[5/6] overflow-hidden grain">
              <img
                src="https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600"
                alt="Modern luxury house at golden hour"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end text-white">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] opacity-80">Cover Property</div>
                  <div className="font-serif text-2xl mt-1">Villa Serena · Malibu</div>
                </div>
                <Link
                  to="/listings"
                  data-testid="hero-view-collection-btn"
                  className="hidden sm:inline-flex items-center gap-2 border border-white/60 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-[#1E1E1E] transition backdrop-blur-sm"
                >
                  View Collection <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee of cities */}
      <section className="py-6 border-y border-stone-200 overflow-hidden bg-[#F7F5F0]">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...cities, ...cities, ...cities].map((c, i) => (
            <span key={i} className="inline-flex items-center mx-8 text-2xl font-serif text-stone-400">
              {c} <span className="mx-8 text-[#C86A53]">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <span className="text-[11px] uppercase tracking-[0.3em] text-stone-500">Featured</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-4 leading-tight">
                Six homes worth the detour this month.
              </h2>
            </div>
            <Link
              to="/listings"
              data-testid="featured-view-all-btn"
              className="inline-flex items-center gap-2 border-b border-[#1E1E1E] pb-1 text-sm font-medium hover:text-[#C86A53] hover:border-[#C86A53] transition"
            >
              View all listings <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featured.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Editorial block */}
      <section className="py-24 md:py-32 bg-[#1A1C19] text-stone-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <img
              src="https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=1400"
              alt="Minimalist luxury living room"
              className="w-full aspect-[4/5] object-cover"
            />
          </div>
          <div className="lg:col-span-6">
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400">Our Approach</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4 leading-tight text-white">
              We don't list every home.<br />Only the ones we'd live in.
            </h2>
            <p className="mt-6 text-stone-300 leading-relaxed max-w-lg">
              Every property in the Casa Connect collection is walked, photographed, and vetted by our in-house architectural editors. We publish fewer listings — and better ones — because we believe your next home deserves more than an algorithm.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-6 max-w-md">
              <Feature title="Curated" copy="Every listing hand-selected by our editors." />
              <Feature title="Transparent" copy="No inflated numbers, no bait pricing." />
              <Feature title="Direct" copy="Talk to the actual seller or owner." />
              <Feature title="Personal" copy="A concierge for your search, not a chatbot." />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <Star className="w-6 h-6 text-[#C86A53] mx-auto" strokeWidth={1.5} />
          <blockquote className="font-serif italic text-3xl md:text-5xl leading-tight mt-8 text-[#1E1E1E]">
            "The only real estate platform that treats homes as architecture, and buyers as people."
          </blockquote>
          <div className="mt-8 text-sm text-stone-500 uppercase tracking-[0.25em]">
            — Marisol Vega · Dwell Editor
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-[#2C3D30] text-white p-12 md:p-20 grid md:grid-cols-2 gap-10 items-center relative overflow-hidden grain">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl leading-tight">
                List your home with people who see it, not just count it.
              </h2>
              <p className="mt-6 text-stone-200 max-w-lg">
                Become a listing partner. Get access to buyers who value design, provenance, and privacy.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
              <Link
                to="/auth?role=admin"
                data-testid="cta-list-property-btn"
                className="inline-flex items-center justify-center bg-[#C86A53] text-white px-8 py-4 font-medium tracking-wide hover:bg-[#D87A63] transition"
              >
                List a property <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
              </Link>
              <Link
                to="/listings"
                data-testid="cta-browse-btn"
                className="inline-flex items-center justify-center border border-white/40 text-white px-8 py-4 font-medium tracking-wide hover:bg-white/10 transition"
              >
                Browse listings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-serif text-3xl text-[#1E1E1E]">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500 mt-1">{label}</div>
    </div>
  );
}

function Feature({ title, copy }) {
  return (
    <div>
      <div className="text-sm text-white font-medium">{title}</div>
      <div className="text-sm text-stone-400 mt-1 leading-relaxed">{copy}</div>
    </div>
  );
}
