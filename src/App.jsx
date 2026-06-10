import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { appData } from './data/appData';

// ─── Helper: Validasi sesi login masih aktif ────────────────
const isSessionValid = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (!token || !user) return false;
  try {
    const parsed = JSON.parse(user);
    return !!(parsed && parsed.id && parsed.role);
  } catch {
    return false;
  }
};

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return isSessionValid() ? 'dashboard' : 'landing';
  });
  const [selectedPlan, setSelectedPlan] = useState(null);

  // 🔥 HANDLE PILIH PLAN (Dari Landing Page)
  const handleSelectPlan = (plan) => {
    const token = localStorage.getItem('token');
    setSelectedPlan(plan);

    if (!token) {
      setCurrentPage('login'); 
    } else {
      if (plan.price === 0 || plan.name === 'Basic') {
        localStorage.setItem('selectedPlan', 'Basic (Gratis)');
      } else {
        localStorage.setItem('pendingCheckoutPlan', JSON.stringify(plan));
      }
      setCurrentPage('dashboard'); 
    }
  };

  // 🔐 HALAMAN LOGIN
  if (currentPage === 'login') {
    return (
      <Login 
        onSuccess={() => {
          if (selectedPlan) {
            if (selectedPlan.price === 0 || selectedPlan.name === 'Basic') {
              localStorage.setItem('selectedPlan', 'Basic (Gratis)');
            } else {
              localStorage.setItem('pendingCheckoutPlan', JSON.stringify(selectedPlan));
            }
          }
          setCurrentPage('dashboard');
        }}
        onBack={() => setCurrentPage('landing')}
      />
    );
  }

  // 🔐 PROTEKSI DASHBOARD — double check sesi masih aktif
  if (currentPage === 'dashboard') {
    // Jika sesi sudah tidak valid (token/user dihapus atau corrupt),
    // paksa kembali ke landing daripada render dashboard kosong
    if (!isSessionValid()) {
      // Reset state ke landing secara deferred agar tidak re-render saat render
      setTimeout(() => setCurrentPage('landing'), 0);
      return null;
    }
    return (
      <Dashboard 
        onBack={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setCurrentPage('landing');
        }} 
      />
    );
  }

  // 🌐 LANDING PAGE
  return (
    <div className="font-sans bg-[#0f1423] min-h-screen">
      <Navbar 
        data={appData?.navbar || {}} 
        onLogin={() => setCurrentPage('login')}
      />
      <Hero 
        data={appData?.hero || {}} 
        onLogin={() => setCurrentPage('login')}
      />
      <Features 
        data={appData?.featuresSection || {}} 
      />
      <Pricing onSelectPlan={handleSelectPlan} />
      <footer className="bg-[#0f1423] border-t border-slate-800 py-10 text-center text-slate-500">
        <p>{appData?.footer?.copyright || "© 2026 WARUNGPOS"}</p>
      </footer>
    </div>
  );
}