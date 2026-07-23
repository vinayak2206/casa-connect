import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";

const emptyForm = {
  title: "",
  description: "",
  price: "",
  type: "house",
  listing_type: "sale",
  bedrooms: 0,
  bathrooms: 0,
  area: 0,
  city: "",
  address: "",
  lat: "",
  lng: "",
  images: [],
  amenities: [],
  featured: false,
  status: "available",
};

export default function PropertyForm() {
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [imageInput, setImageInput] = useState("");
  const [amenityInput, setAmenityInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/properties/${id}`).then(({ data }) => {
        setForm({ ...emptyForm, ...data.property });
      });
    }
  }, [id, isEdit]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addImage = () => {
    if (imageInput.trim()) {
      update("images", [...form.images, imageInput.trim()]);
      setImageInput("");
    }
  };
  const removeImage = (i) =>
    update("images", form.images.filter((_, idx) => idx !== i));

  const addAmenity = () => {
    if (amenityInput.trim()) {
      update("amenities", [...form.amenities, amenityInput.trim()]);
      setAmenityInput("");
    }
  };
  const removeAmenity = (i) =>
    update("amenities", form.amenities.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        area: Number(form.area),
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
      };
      if (isEdit) {
        await api.put(`/properties/${id}`, payload);
        toast.success("Property updated");
      } else {
        await api.post("/properties", payload);
        toast.success("Property published");
      }
      navigate("/admin");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Unable to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="property-form-page" className="pt-24 pb-24 bg-[#F7F5F0] min-h-screen">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#1E1E1E] mb-6">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to admin
        </Link>
        <h1 className="font-serif text-5xl mb-2">{isEdit ? "Edit listing" : "New listing"}</h1>
        <p className="text-stone-500 mb-10">Publish a home to the collection.</p>

        <form onSubmit={submit} className="space-y-8" data-testid="property-form">
          <Section title="Essentials">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Title *">
                <input required data-testid="pf-title" value={form.title} onChange={(e) => update("title", e.target.value)} className={inputCls} />
              </Field>
              <Field label="City *">
                <input required data-testid="pf-city" value={form.city} onChange={(e) => update("city", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Address *">
                <input required data-testid="pf-address" value={form.address} onChange={(e) => update("address", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Price *">
                <input required type="number" data-testid="pf-price" value={form.price} onChange={(e) => update("price", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Property type">
                <select data-testid="pf-type" value={form.type} onChange={(e) => update("type", e.target.value)} className={inputCls}>
                  {["house", "apartment", "villa", "condo", "land"].map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Listing type">
                <select data-testid="pf-listing-type" value={form.listing_type} onChange={(e) => update("listing_type", e.target.value)} className={inputCls}>
                  <option value="sale">For sale</option>
                  <option value="rent">For rent</option>
                </select>
              </Field>
              <Field label="Bedrooms">
                <input type="number" data-testid="pf-bedrooms" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Bathrooms">
                <input type="number" data-testid="pf-bathrooms" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Area (sqft)">
                <input type="number" data-testid="pf-area" value={form.area} onChange={(e) => update("area", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Status">
                <select data-testid="pf-status" value={form.status} onChange={(e) => update("status", e.target.value)} className={inputCls}>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                </select>
              </Field>
              <Field label="Latitude (optional, for map)">
                <input type="number" step="any" data-testid="pf-lat" value={form.lat} onChange={(e) => update("lat", e.target.value)} placeholder="e.g. 34.0259" className={inputCls} />
              </Field>
              <Field label="Longitude (optional, for map)">
                <input type="number" step="any" data-testid="pf-lng" value={form.lng} onChange={(e) => update("lng", e.target.value)} placeholder="e.g. -118.7798" className={inputCls} />
              </Field>
            </div>

            <label className="flex items-center gap-3 mt-4">
              <input
                data-testid="pf-featured"
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update("featured", e.target.checked)}
                className="w-4 h-4 accent-[#2C3D30]"
              />
              <span className="text-sm">Mark as featured on the homepage</span>
            </label>
          </Section>

          <Section title="Description">
            <textarea
              required
              data-testid="pf-description"
              rows={6}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Section>

          <Section title="Images (URL)">
            <div className="flex gap-2 mb-3">
              <input
                data-testid="pf-image-input"
                placeholder="https://…"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                data-testid="pf-add-image"
                onClick={addImage}
                className="bg-[#2C3D30] text-white px-4 inline-flex items-center gap-1 hover:bg-[#3A4F3E] transition"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} /> Add
              </button>
            </div>
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group aspect-[4/3] bg-stone-100 overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Amenities">
            <div className="flex gap-2 mb-3">
              <input
                data-testid="pf-amenity-input"
                placeholder="e.g. Ocean View"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                data-testid="pf-add-amenity"
                onClick={addAmenity}
                className="bg-[#2C3D30] text-white px-4 inline-flex items-center gap-1 hover:bg-[#3A4F3E] transition"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.amenities.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-2 bg-white border border-stone-200 px-3 py-1.5 text-sm">
                  {a}
                  <button type="button" onClick={() => removeAmenity(i)}>
                    <X className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                </span>
              ))}
            </div>
          </Section>

          <div className="flex gap-3 justify-end pt-6 border-t border-stone-200">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="px-6 py-3 border border-stone-300 hover:border-[#1E1E1E] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="pf-save-btn"
              disabled={saving}
              className="bg-[#2C3D30] text-white px-8 py-3 font-medium hover:bg-[#3A4F3E] transition disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Publish listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 bg-white border border-stone-200 focus:outline-none focus:border-[#2C3D30] text-sm";

function Section({ title, children }) {
  return (
    <div className="bg-white border border-stone-200 p-6 md:p-8">
      <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-6">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs text-stone-500 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
