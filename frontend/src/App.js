import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Listings from "@/pages/Listings";
import PropertyDetail from "@/pages/PropertyDetail";
import Auth from "@/pages/Auth";
import AdminDashboard from "@/pages/AdminDashboard";
import UserDashboard from "@/pages/UserDashboard";
import PropertyForm from "@/pages/PropertyForm";
import "@/App.css";

function Shell() {
  const location = useLocation();
  const hideChrome = location.pathname === "/auth";
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0]">
      {!hideChrome && <Header />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><UserDashboard /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>}
            />
            <Route
              path="/admin/property/:id"
              element={<ProtectedRoute adminOnly><PropertyForm /></ProtectedRoute>}
            />
          </Routes>
        </motion.main>
      </AnimatePresence>
      {!hideChrome && <Footer />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: '"Outfit", sans-serif',
            border: "1px solid #e7e5e4",
            background: "#ffffff",
            color: "#1e1e1e",
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
