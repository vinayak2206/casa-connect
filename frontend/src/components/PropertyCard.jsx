import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bed, Bath, Square, MapPin, Heart, GitCompare } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { useCompare } from "@/context/CompareContext";

export default function PropertyCard({ property, onToggleFavorite, isFavorite = false, index = 0 }) {
  const { has, toggle } = useCompare();
  const inCompare = has(property.id);
  return (
    <motion.article
      data-testid={`property-card-${property.id}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: (index % 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col bg-white border border-stone-200 overflow-hidden hover:border-stone-300 transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(0,0,0,0.08)]"
    >
      <Link to={`/property/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          <img
            src={property.images?.[0] || "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200"}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200";
            }}
          />
          <div className="absolute top-4 left-4 flex gap-2">
            {property.featured && (
              <span className="bg-[#C86A53] text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 font-medium">
                Featured
              </span>
            )}
            <span className="bg-white/95 text-[#1E1E1E] text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 font-medium">
              {property.listing_type === "rent" ? "For Rent" : "For Sale"}
            </span>
          </div>
          {onToggleFavorite && (
            <button
              data-testid={`favorite-btn-${property.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(property.id);
              }}
              className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center transition-all backdrop-blur-md ${
                isFavorite
                  ? "bg-[#C86A53] text-white"
                  : "bg-white/85 text-stone-700 hover:bg-white"
              }`}
              aria-label="Toggle favorite"
            >
              <Heart className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} strokeWidth={1.5} />
            </button>
          )}
          <button
            data-testid={`compare-btn-${property.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(property);
            }}
            className={`absolute ${onToggleFavorite ? "top-16" : "top-4"} right-4 w-10 h-10 flex items-center justify-center transition-all backdrop-blur-md ${
              inCompare
                ? "bg-[#2C3D30] text-white"
                : "bg-white/85 text-stone-700 hover:bg-white"
            }`}
            aria-label="Toggle compare"
          >
            <GitCompare className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </Link>

      <div className="p-6 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-sans text-lg font-medium text-[#1E1E1E] truncate">{property.title}</h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-stone-500">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="truncate">{property.city}</span>
            </div>
          </div>
          <div className="font-serif text-2xl text-[#1E1E1E] whitespace-nowrap">
            {formatPrice(property.price, property.listing_type)}
          </div>
        </div>

        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-stone-100 text-sm text-stone-500">
          {property.type !== "land" ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Bed className="w-4 h-4" strokeWidth={1.5} /> {property.bedrooms}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bath className="w-4 h-4" strokeWidth={1.5} /> {property.bathrooms}
              </span>
            </>
          ) : null}
          <span className="inline-flex items-center gap-1.5 ml-auto">
            <Square className="w-4 h-4" strokeWidth={1.5} /> {property.area.toLocaleString()} sqft
          </span>
        </div>
      </div>
    </motion.article>
  );
}
