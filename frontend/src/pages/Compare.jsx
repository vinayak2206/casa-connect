import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Check, Minus, ArrowLeft, GitCompare } from "lucide-react";
import { useCompare } from "@/context/CompareContext";
import { formatPrice } from "@/lib/api";

export default function Compare() {
  const { items, remove, clear } = useCompare();
  const navigate = useNavigate();

  // Merge all amenities across selected items to have a consistent row list
  const allAmenities = Array.from(
    new Set(items.flatMap((p) => p.amenities || []))
  ).sort();

  return (
    <div data-testid="compare-page" className="pt-24 pb-24 bg-[#F7F5F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Link
          to="/listings"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#1E1E1E] mb-6"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to listings
        </Link>

        <div className="border-b border-stone-200 pb-8 mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-500">Weigh them up</span>
            <h1 className="font-serif text-5xl md:text-6xl leading-none tracking-tight mt-4">
              Compare homes
            </h1>
            <p className="text-stone-500 mt-3">
              Pin up to three properties and view them side by side.
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => { clear(); navigate("/listings"); }}
              data-testid="compare-page-clear-btn"
              className="text-sm text-stone-500 hover:text-[#C86A53] inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" strokeWidth={1.5} /> Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="border border-stone-200 bg-white p-16 text-center">
            <GitCompare className="w-8 h-8 text-stone-300 mx-auto" strokeWidth={1.5} />
            <div className="font-serif text-3xl italic text-stone-400 mt-4">
              No homes pinned yet.
            </div>
            <p className="text-stone-500 mt-3">
              Add up to three listings using the compare icon on any property card.
            </p>
            <Link
              to="/listings"
              className="mt-8 inline-flex items-center gap-2 bg-[#2C3D30] text-white px-6 py-3 text-sm hover:bg-[#3A4F3E] transition"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  <th className="text-left text-[11px] uppercase tracking-[0.25em] text-stone-500 py-6 px-6 w-40 align-top">
                    Property
                  </th>
                  {items.map((p, i) => (
                    <motion.th
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      className="p-6 align-top"
                      data-testid={`compare-col-${p.id}`}
                    >
                      <div className="relative">
                        <button
                          onClick={() => remove(p.id)}
                          data-testid={`compare-col-remove-${p.id}`}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-500 hover:text-[#C86A53] hover:border-[#C86A53] transition"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <Link to={`/property/${p.id}`}>
                          <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                            <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="font-serif text-xl mt-4 text-left text-[#1E1E1E]">{p.title}</div>
                          <div className="text-xs text-stone-500 mt-1 text-left">{p.city}</div>
                        </Link>
                      </div>
                    </motion.th>
                  ))}
                </tr>
              </thead>

              <tbody className="border-t border-stone-200">
                <Row label="Price" items={items}
                  render={(p) => (
                    <span className="font-serif text-2xl">{formatPrice(p.price, p.listing_type)}</span>
                  )} />
                <Row label="Listing" items={items}
                  render={(p) => (
                    <span className="capitalize">{p.listing_type === "rent" ? "For rent" : "For sale"}</span>
                  )} />
                <Row label="Type" items={items} render={(p) => <span className="capitalize">{p.type}</span>} />
                <Row label="Bedrooms" items={items} render={(p) => p.bedrooms} />
                <Row label="Bathrooms" items={items} render={(p) => p.bathrooms} />
                <Row label="Area" items={items} render={(p) => `${p.area.toLocaleString()} sqft`} />
                <Row label="Price / sqft" items={items}
                  render={(p) => p.area ? formatPrice(Math.round(p.price / p.area)) : "—"} />
                <Row label="Address" items={items} render={(p) => <span className="text-sm">{p.address}</span>} />

                {/* Amenity matrix */}
                {allAmenities.length > 0 && (
                  <tr>
                    <td colSpan={items.length + 1} className="pt-8 pb-2 px-6 text-[11px] uppercase tracking-[0.25em] text-stone-500 border-t border-stone-100">
                      Amenities
                    </td>
                  </tr>
                )}
                {allAmenities.map((a) => (
                  <tr key={a} className="border-t border-stone-100">
                    <td className="px-6 py-3 text-sm text-stone-600">{a}</td>
                    {items.map((p) => (
                      <td key={p.id} className="px-6 py-3 text-center">
                        {p.amenities?.includes(a) ? (
                          <Check className="w-4 h-4 text-[#2C3D30] mx-auto" strokeWidth={2} />
                        ) : (
                          <Minus className="w-4 h-4 text-stone-300 mx-auto" strokeWidth={2} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

                <tr className="border-t border-stone-200">
                  <td className="px-6 py-6"></td>
                  {items.map((p) => (
                    <td key={p.id} className="px-6 py-6">
                      <Link
                        to={`/property/${p.id}`}
                        data-testid={`compare-view-${p.id}`}
                        className="inline-flex items-center justify-center w-full bg-[#2C3D30] text-white px-4 py-3 text-sm hover:bg-[#3A4F3E] transition"
                      >
                        View listing
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, items, render }) {
  return (
    <tr className="border-t border-stone-100">
      <td className="px-6 py-4 text-[11px] uppercase tracking-[0.25em] text-stone-500 align-top">
        {label}
      </td>
      {items.map((p) => (
        <td key={p.id} className="px-6 py-4 text-[#1E1E1E]">
          {render(p)}
        </td>
      ))}
    </tr>
  );
}
