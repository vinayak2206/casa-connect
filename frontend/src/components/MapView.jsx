import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice } from "@/lib/api";

// Custom marker icon (teardrop with terracotta color) using inline SVG data URL
const createIcon = (label) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='52' viewBox='0 0 40 52'>
    <path d='M20 0C9 0 0 9 0 20c0 15 20 32 20 32s20-17 20-32C40 9 31 0 20 0z' fill='#2C3D30'/>
    <circle cx='20' cy='20' r='14' fill='#F7F5F0'/>
    <text x='20' y='24' text-anchor='middle' font-family='Outfit,sans-serif' font-size='10' font-weight='600' fill='#1E1E1E'>${label}</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "cc-marker",
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -46],
  });
};

function FitBounds({ points }) {
  const map = useMap();
  if (points.length > 0) {
    try {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    } catch {}
  }
  return null;
}

export default function MapView({ properties }) {
  const withCoords = useMemo(
    () => (properties || []).filter((p) => p.lat != null && p.lng != null),
    [properties]
  );
  const center = withCoords.length > 0
    ? [withCoords[0].lat, withCoords[0].lng]
    : [39.8283, -98.5795]; // US centroid fallback

  const points = withCoords.map((p) => [p.lat, p.lng]);

  return (
    <div data-testid="map-view" className="relative">
      <div className="h-[70vh] min-h-[520px] border border-stone-200 overflow-hidden bg-stone-100">
        <MapContainer
          center={center}
          zoom={4}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />
          {withCoords.map((p, i) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={createIcon(String(i + 1))}
            >
              <Popup>
                <div className="w-56" data-testid={`map-popup-${p.id}`}>
                  <Link to={`/property/${p.id}`}>
                    <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                      <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-2 font-serif text-lg leading-tight text-[#1E1E1E]">{p.title}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{p.city}</div>
                    <div className="mt-2 font-serif text-lg text-[#1E1E1E]">
                      {formatPrice(p.price, p.listing_type)}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-widest text-[#C86A53]">
                      View listing →
                    </div>
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
          <FitBounds points={points} />
        </MapContainer>
      </div>
      {withCoords.length === 0 && (
        <div className="mt-4 text-sm text-stone-500 text-center">
          No listings have coordinates to display.
        </div>
      )}
    </div>
  );
}
