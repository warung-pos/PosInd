import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Dashboard from './components/Dashboard';
import { appData } from './data/appData';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  if (currentPage === 'dashboard') {
    return <Dashboard onBack={() => setCurrentPage('landing')} />;
  }

  return (
    <div className="font-sans bg-[#0f1423] min-h-screen">
      <Navbar 
        data={appData.navbar} 
        onLogin={() => setCurrentPage('dashboard')} 
      />
      <Hero data={appData.hero} />
      <Features data={appData.featuresSection} />
      
      <footer className="bg-[#0f1423] border-t border-slate-800 py-8 text-center text-slate-500">
        <p>{appData.footer.copyright}</p>
      </footer>
    </div>
  );
}