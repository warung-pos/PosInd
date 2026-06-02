import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { appData } from './data/appData';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  // Cek apakah sudah ada token di localStorage saat pertama kali load
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Efek untuk menentukan halaman mana yang harus tampil di awal
  useEffect(() => {
    if (isLoggedIn) {
      setCurrentPage('dashboard');
    }
  }, [isLoggedIn]);

  // 🔥 HANDLE PILIH PLAN (Dari Landing Page)
  const handleSelectPlan = (plan) => {
    const token = localStorage.getItem('token');
    setSelectedPlan(plan);

    if (!token) {
      setCurrentPage('login'); 
    } else {
      setIsLoggedIn(true);
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
          setIsLoggedIn(true);
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

  // 🔐 PROTEKSI DASHBOARD
  if (currentPage === 'dashboard') {
    return (
      <Dashboard 
        onBack={() => {
          setIsLoggedIn(false);
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