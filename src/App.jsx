import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { appData } from './data/appData';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // 🔥 HANDLE PILIH PLAN
  const handleSelectPlan = (plan) => {
    const token = localStorage.getItem('token');

    setSelectedPlan(plan);

    if (!token) {
      setCurrentPage('login'); // belum login → ke login
    } else {
      setIsLoggedIn(true);
      localStorage.setItem('selectedPlan', plan.name);
      setCurrentPage('dashboard'); // sudah login → langsung dashboard
    }
  };

  // 🔐 HALAMAN LOGIN
  if (currentPage === 'login') {
    return (
      <Login 
        onSuccess={() => {
          setIsLoggedIn(true);

          // simpan plan kalau ada
          if (selectedPlan) {
            localStorage.setItem('selectedPlan', selectedPlan.name);
          }

          setCurrentPage('dashboard');
        }}
        onBack={() => setCurrentPage('landing')}
      />
    );
  }

  // 🔐 PROTEKSI DASHBOARD
  if (currentPage === 'dashboard') {
    if (!isLoggedIn) {
      return (
        <Login 
          onSuccess={() => {
            setIsLoggedIn(true);
            setCurrentPage('dashboard');
          }}
          onBack={() => setCurrentPage('landing')}
        />
      );
    }

    return (
      <Dashboard 
        onBack={() => {
          setIsLoggedIn(false);
          localStorage.removeItem('token');
          setCurrentPage('landing');
        }} 
      />
    );
  }

  // 🌐 LANDING PAGE
  return (
    <div className="font-sans bg-[#0f1423] min-h-screen">
      
      {/* NAVBAR */}
      <Navbar 
        data={appData?.navbar || {}} 
        onLogin={() => setCurrentPage('login')}
      />

      {/* HERO */}
      <Hero 
        data={appData?.hero || {}} 
        onLogin={() => setCurrentPage('login')}
      />

      {/* FEATURES */}
      <Features 
        data={appData?.featuresSection || {}} 
      />

      {/* PRICING */}
      <Pricing onSelectPlan={handleSelectPlan} />

      {/* FOOTER */}
      <footer className="bg-[#0f1423] border-t border-slate-800 py-10 text-center text-slate-500">
        <p>
          {appData?.footer?.copyright || "© 2026 WARUNGPOS"}
        </p>
      </footer>

    </div>
  );
}