import { useState } from 'react';

const Dashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // 🔥 langsung ambil dari localStorage (tanpa useEffect)
  const [plan] = useState(() => {
    return localStorage.getItem('selectedPlan') || '';
  });

  return (
    <div className="flex h-screen bg-[#0b0e17] text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f1423] border-r border-slate-800">
        
        {/* LOGO */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="8" cy="21" r="1"/>
              <circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">
            WARUNG<span className="text-purple-400">POS</span>
          </span>
        </div>

        {/* 🔥 PLAN INFO */}
        <div className="px-6 py-4 border-b border-slate-800">
          <p className="text-xs text-slate-400">Paket Aktif</p>
          <p className="text-purple-400 font-bold">
            {plan || 'Belum memilih'}
          </p>
        </div>

        {/* MENU */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'dashboard'
                ? 'bg-purple-500/10 text-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Dashboard
          </button>

          <button 
            onClick={() => setActiveTab('produk')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'produk'
                ? 'bg-purple-500/10 text-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Produk
          </button>

          <button 
            onClick={() => setActiveTab('laporan')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              activeTab === 'laporan'
                ? 'bg-purple-500/10 text-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Laporan
          </button>
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onBack}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER */}
        <header className="h-20 bg-[#0f1423] border-b border-slate-800 flex items-center justify-between px-8 sticky top-0">
          <h2 className="text-2xl font-bold capitalize">
            {activeTab === 'dashboard'
              ? 'Ringkasan Hari Ini'
              : `Manajemen ${activeTab}`}
          </h2>
        </header>

        {/* CONTENT */}
        <div className="p-8">
          
          {activeTab === 'dashboard' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#151b2b] p-6 rounded-2xl">
                <p className="text-slate-400 text-sm">Pendapatan</p>
                <h3 className="text-2xl font-bold">Rp 2.450.000</h3>
              </div>

              <div className="bg-[#151b2b] p-6 rounded-2xl">
                <p className="text-slate-400 text-sm">Transaksi</p>
                <h3 className="text-2xl font-bold">142</h3>
              </div>

              <div className="bg-[#151b2b] p-6 rounded-2xl">
                <p className="text-slate-400 text-sm">Produk</p>
                <h3 className="text-2xl font-bold">356</h3>
              </div>
            </div>
          )}

          {activeTab === 'produk' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold">Halaman Produk</h2>
            </div>
          )}

          {activeTab === 'laporan' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold">Halaman Laporan</h2>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;