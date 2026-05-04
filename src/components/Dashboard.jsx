import React, { useState } from 'react';

const Dashboard = ({ onBack }) => {
  // State untuk melacak menu samping mana yang diklik
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-[#0b0e17] text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f1423] border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <span className="text-xl font-bold tracking-tight">WARUNG<span className="text-purple-400">POS</span></span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* Tombol Menu: Dashboard */}
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Dashboard
          </button>

          {/* Tombol Menu: Produk */}
          <button 
            onClick={() => setActiveTab('produk')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'produk' ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            Produk
          </button>

          {/* Tombol Menu: Laporan */}
          <button 
            onClick={() => setActiveTab('laporan')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'laporan' ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Laporan
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button onClick={onBack} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER */}
        <header className="h-20 bg-[#0f1423] border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-2xl font-bold capitalize">{activeTab === 'dashboard' ? 'Ringkasan Hari Ini' : `Manajemen ${activeTab}`}</h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-purple-500 overflow-hidden">
              <div className="w-full h-full bg-slate-600 flex items-end justify-center pt-2">
                <div className="w-4 h-4 rounded-full bg-slate-400 absolute top-1"></div>
                <div className="w-6 h-6 rounded-t-full bg-slate-400 translate-y-1"></div>
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">Budi Kasir</p>
              <p className="text-xs text-slate-400">Owner</p>
            </div>
          </div>
        </header>

        {/* KONTEN DINAMIS BERDASARKAN TAB YANG AKTIF */}
        <div className="p-8">
          
          {/* TAMPILAN TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#151b2b] border border-slate-800 p-6 rounded-2xl hover:border-purple-500/30 transition cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Pendapatan Kotor</p>
                      <h3 className="text-3xl font-bold">Rp 2.450.000</h3>
                    </div>
                    <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                    +15% dari kemarin
                  </p>
                </div>
                
                <div className="bg-[#151b2b] border border-slate-800 p-6 rounded-2xl hover:border-purple-500/30 transition cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Total Transaksi</p>
                      <h3 className="text-3xl font-bold">142</h3>
                    </div>
                    <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">Hari ini</p>
                </div>

                <div className="bg-[#151b2b] border border-slate-800 p-6 rounded-2xl hover:border-purple-500/30 transition cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Produk Terjual</p>
                      <h3 className="text-3xl font-bold">356</h3>
                    </div>
                    <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">Hari ini</p>
                </div>
              </div>

              <div className="bg-[#151b2b] border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Transaksi Terakhir</h3>
                  <button onClick={() => setActiveTab('laporan')} className="text-sm text-purple-400 hover:text-purple-300">Lihat Semua Data</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f1423] text-slate-400 text-sm">
                        <th className="p-4 font-medium">ID Transaksi</th>
                        <th className="p-4 font-medium">Waktu</th>
                        <th className="p-4 font-medium">Metode</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-800">
                      <tr className="hover:bg-slate-800/30 transition">
                        <td className="p-4 font-medium text-white">#TRX-001</td>
                        <td className="p-4 text-slate-400">14:32 WIB</td>
                        <td className="p-4 text-slate-400">QRIS</td>
                        <td className="p-4 font-semibold text-white">Rp 45.000</td>
                        <td className="p-4"><span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-semibold">Sukses</span></td>
                      </tr>
                      <tr className="hover:bg-slate-800/30 transition">
                        <td className="p-4 font-medium text-white">#TRX-002</td>
                        <td className="p-4 text-slate-400">14:15 WIB</td>
                        <td className="p-4 text-slate-400">Tunai</td>
                        <td className="p-4 font-semibold text-white">Rp 12.500</td>
                        <td className="p-4"><span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-semibold">Sukses</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAMPILAN TAB: PRODUK */}
          {activeTab === 'produk' && (
            <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Manajemen Produk</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">Halaman manajemen produk seperti tambah stok dan edit barang saat ini sedang dalam masa pengembangan oleh tim WarungPOS.</p>
              <button onClick={() => setActiveTab('dashboard')} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition">Kembali ke Dashboard</button>
            </div>
          )}

          {/* TAMPILAN TAB: LAPORAN */}
          {activeTab === 'laporan' && (
             <div className="bg-[#151b2b] border border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Laporan Keuangan</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">Fitur unduh laporan PDF bulanan dan grafik pajak otomatis akan segera hadir pada update berikutnya.</p>
              <button onClick={() => setActiveTab('dashboard')} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition">Kembali ke Dashboard</button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
