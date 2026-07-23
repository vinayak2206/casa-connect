import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
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
import ScrollToTop from "@/components/ScrollToTop";
import "@/App.css";

function Shell() {
  const location = useLocation();
  const hideChrome = location.pathname === "/auth";
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0]">
      <ScrollToTop />
      {!hideChrome && <Header />}
      <main className="flex-1">
        <Routes>
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
      </main>
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
