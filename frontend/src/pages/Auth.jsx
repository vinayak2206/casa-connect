import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Shield, User as UserIcon } from "lucide-react";

export default function Auth() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [role, setRole] = useState(params.get("role") === "admin" ? "admin" : "user");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res =
      mode === "signin"
        ? await login(form.email, form.password)
        : await register({ name: form.name || form.email.split("@")[0], email: form.email, password: form.password, role });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || "Something went wrong");
    } else {
      toast.success(mode === "signin" ? "Welcome back" : "Account created");
      const dest = res.user?.role === "admin" ? "/admin" : "/dashboard";
      navigate(dest, { replace: true });
    }
  };

  return (
    <div data-testid="auth-page" className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F7F5F0]">
      {/* Left visual */}
      <div className="hidden lg:block lg:col-span-6 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1400"
          alt="Modern interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C19]/70 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-4xl leading-none">Casa</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-200">Connect</span>
          </Link>
          <p className="font-serif italic text-3xl mt-8 max-w-md leading-snug">
            "Every door you open leads to who you'll become."
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="lg:hidden inline-flex items-baseline gap-2 mb-8">
            <span className="font-serif text-3xl">Casa</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Connect</span>
          </Link>

          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-500">
            {mode === "signin" ? "Welcome back" : "Create an account"}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight mt-3">
            {mode === "signin" ? "Sign in to Casa." : "Join the collection."}
          </h1>

          {/* Role selector */}
          <div className="mt-8">
            <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500 mb-3">
              I am a
            </div>
            <div className="relative flex bg-stone-100 p-1 rounded-sm max-w-md">
              {[
                { v: "user", label: "Buyer / Renter", icon: <UserIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> },
                { v: "admin", label: "Owner / Agent", icon: <Shield className="w-3.5 h-3.5" strokeWidth={1.5} /> },
              ].map((opt) => (
                <button
                  key={opt.v}
                  data-testid={`role-toggle-${opt.v}`}
                  type="button"
                  onClick={() => setRole(opt.v)}
                  className="relative flex-1 py-2.5 text-sm font-medium z-10 inline-flex items-center justify-center gap-2 transition-colors"
                >
                  {role === opt.v && (
                    <motion.div
                      layoutId="role-pill"
                      className="absolute inset-0 bg-white shadow-sm rounded-[2px] z-0"
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-2 ${role === opt.v ? "text-[#1E1E1E]" : "text-stone-500"}`}>
                    {opt.icon} {opt.label}
                  </span>
                </button>
              ))}
            </div>
            {mode === "signup" && (
              <p className="text-xs text-stone-500 mt-2">
                {role === "admin"
                  ? "Owners & agents can publish listings and manage inquiries."
                  : "Buyers & renters can save favorites and inquire about listings."}
              </p>
            )}
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4" data-testid="auth-form">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.input
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  data-testid="auth-name-input"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border border-stone-200 focus:outline-none focus:border-[#2C3D30] text-sm"
                />
              )}
            </AnimatePresence>

            <input
              data-testid="auth-email-input"
              type="email"
              required
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border border-stone-200 focus:outline-none focus:border-[#2C3D30] text-sm"
            />
            <input
              data-testid="auth-password-input"
              type="password"
              required
              minLength={6}
              placeholder="Password (min 6 chars)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3.5 bg-white border border-stone-200 focus:outline-none focus:border-[#2C3D30] text-sm"
            />

            {error && (
              <div data-testid="auth-error" className="text-sm text-[#C86A53] border-l-2 border-[#C86A53] pl-3">
                {error}
              </div>
            )}

            <button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2C3D30] text-white py-4 font-medium tracking-wide hover:bg-[#3A4F3E] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              {!submitting && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </form>

          <div className="mt-6 text-sm text-stone-500">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  data-testid="auth-switch-signup"
                  onClick={() => { setMode("signup"); setError(""); }}
                  className="text-[#1E1E1E] font-medium hover:text-[#C86A53] transition"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  data-testid="auth-switch-signin"
                  onClick={() => { setMode("signin"); setError(""); }}
                  className="text-[#1E1E1E] font-medium hover:text-[#C86A53] transition"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-10 pt-6 border-t border-stone-200 text-xs text-stone-500">
            By continuing you agree to our terms and privacy policy.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
