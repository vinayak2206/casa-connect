import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Menu, X, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/listings", label: "Listings" },
  { to: "/listings?listing_type=rent", label: "Rentals" },
  { to: "/compare", label: "Compare" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-stone-200"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-20">
        <Link to="/" data-testid="logo-link" className="flex items-baseline gap-2 group">
          <span className="font-serif text-3xl leading-none tracking-tight">Casa</span>
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-stone-500 group-hover:text-[#C86A53] transition-colors">
            Connect
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((l) => (
            <NavLink
              key={l.to + l.label}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-sm font-medium tracking-wide transition-colors ${
                  isActive ? "text-[#2C3D30]" : "text-stone-600 hover:text-[#2C3D30]"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {user.role === "admin" ? (
                <Link
                  to="/admin"
                  data-testid="header-admin-link"
                  className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-[#2C3D30] transition"
                >
                  <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
                  Admin
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  data-testid="header-dashboard-link"
                  className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-[#2C3D30] transition"
                >
                  <UserIcon className="w-4 h-4" strokeWidth={1.5} />
                  {user.name?.split(" ")[0] || "Account"}
                </Link>
              )}
              <button
                data-testid="header-logout-btn"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#C86A53] transition"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              data-testid="header-signin-btn"
              className="inline-flex items-center bg-[#2C3D30] text-white px-6 py-2.5 text-sm font-medium tracking-wide hover:bg-[#3A4F3E] transition-colors rounded-sm"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden w-10 h-10 flex items-center justify-center text-stone-700"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-stone-200"
        >
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-lg font-serif"
                data-testid={`mobile-nav-${l.label.toLowerCase()}`}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to={user.role === "admin" ? "/admin" : "/dashboard"}
                  onClick={() => setOpen(false)}
                  className="text-lg font-serif"
                  data-testid="mobile-account-link"
                >
                  {user.role === "admin" ? "Admin Panel" : "My Account"}
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    setOpen(false);
                    navigate("/");
                  }}
                  data-testid="mobile-logout-btn"
                  className="text-left text-sm text-stone-500"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                data-testid="mobile-signin-btn"
                className="text-lg font-serif"
              >
                Sign in
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
